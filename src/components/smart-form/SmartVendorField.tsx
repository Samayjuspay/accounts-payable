import React, { useState, useEffect, useCallback } from 'react';
import { Star, TrendingUp, Info } from 'lucide-react';
import { getRecommendedVendors } from '../../services/aiService';
import { toast } from 'sonner';

interface Vendor {
  id: string;
  name: string;
  usageCount: number;
  avgRating: number;
  onTimeRate: number;
  isRecommended: boolean;
}

interface SmartVendorFieldProps {
  category?: string;
  department?: string;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const SmartVendorField: React.FC<SmartVendorFieldProps> = ({
  category,
  department,
  value,
  onChange,
  disabled = false,
}) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  const fetchVendors = useCallback(async () => {
    if (!category) {
      setVendors([]);
      setSelectedVendor(null);
      return;
    }

    setIsLoading(true);
    try {
      const recommended = await getRecommendedVendors(category, department || '');
      setVendors(recommended);
      
      // Auto-select top vendor if not already selected
      if (recommended.length > 0 && !hasAutoSelected && !value) {
        const topVendor = recommended[0];
        onChange(topVendor.id);
        setHasAutoSelected(true);
        
        toast.success(
          `Pre-selected ${topVendor.name}`,
          {
            description: `Most used vendor for ${category}`,
            duration: 4000,
          }
        );
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setIsLoading(false);
    }
  }, [category, department, hasAutoSelected, value, onChange]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  // Update selected vendor when value changes
  useEffect(() => {
    const vendor = vendors.find(v => v.id === value);
    setSelectedVendor(vendor || null);
  }, [value, vendors]);

  const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  if (!category) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-semibold text-zinc-700">
          Vendor
        </label>
        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-500 text-center">
          Select a category first to see recommended vendors
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
          Vendor
          {isLoading && (
            <span className="inline-flex items-center gap-1 text-xs text-blue-600">
              <div className="w-3 h-3 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              Loading...
            </span>
          )}
        </label>
        
        <select
          value={value || ''}
          onChange={handleVendorChange}
          disabled={disabled || isLoading}
          className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
        >
          <option value="">Select a vendor...</option>
          {vendors.map((vendor) => (
            <option key={vendor.id} value={vendor.id}>
              {vendor.name} {vendor.isRecommended ? '⭐ (Recommended)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Vendor insights */}
      {selectedVendor && (
        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Info className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-zinc-900">{selectedVendor.name}</span>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1 text-amber-500">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-semibold">{selectedVendor.avgRating}</span>
              </div>
              <p className="text-xs text-zinc-500">Rating</p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1 text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-semibold">{selectedVendor.onTimeRate}%</span>
              </div>
              <p className="text-xs text-zinc-500">On-time</p>
            </div>
            
            <div className="space-y-1">
              <div className="text-sm font-semibold text-zinc-700">
                {selectedVendor.usageCount}x
              </div>
              <p className="text-xs text-zinc-500">Used</p>
            </div>
          </div>
          
          <p className="text-xs text-zinc-600 bg-white p-2 rounded border border-zinc-200">
            💡 {selectedVendor.name} has {selectedVendor.avgRating}⭐ rating and delivered on time {selectedVendor.onTimeRate}% of the time
          </p>
        </div>
      )}

      {/* Alternative vendors */}
      {vendors.length > 1 && !selectedVendor && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Recommended for {category}
          </p>
          <div className="flex flex-wrap gap-2">
            {vendors.slice(0, 3).map((vendor) => (
              <button
                key={vendor.id}
                onClick={() => onChange(vendor.id)}
                className="px-3 py-1.5 text-sm bg-white border border-zinc-200 rounded-md hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                {vendor.name}
                {vendor.isRecommended && (
                  <span className="ml-1 text-amber-500">⭐</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};