import React from 'react';
import { useFormContext } from 'react-hook-form';
import { PRFormData, Vendor } from '../../../types/pr.types';
import { MOCK_VENDORS } from '../../../constants/mockData';
import { Star, MapPin, Phone, Mail, Clock, CreditCard, Check, Info, Search, Plus, Users, X } from 'lucide-react';

export const VendorStep: React.FC = () => {
  const { watch, setValue, formState: { errors } } = useFormContext<PRFormData>();
  const vendorSelection = watch('vendorSelection');
  const category = watch('category');

  const selectedVendor = MOCK_VENDORS.find(v => v.id === vendorSelection.selectedVendorId);
  const recommendedVendors = MOCK_VENDORS.filter(v => v.category === category);

  const handleModeChange = (mode: 'existing' | 'rfq' | 'new' | 'none') => {
    setValue('vendorSelection.mode', mode);
    if (mode !== 'existing') setValue('vendorSelection.selectedVendorId', undefined);
    if (mode !== 'rfq') setValue('vendorSelection.rfqVendorIds', []);
  };

  const toggleRFQVendor = (vendorId: string) => {
    const current = vendorSelection.rfqVendorIds || [];
    if (current.includes(vendorId)) {
      setValue('vendorSelection.rfqVendorIds', current.filter(id => id !== vendorId));
    } else if (current.length < 5) {
      setValue('vendorSelection.rfqVendorIds', [...current, vendorId]);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Vendor Selection</h2>
        <p className="text-sm text-zinc-500 mt-1">Choose how you want to source the items for this request.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { id: 'existing', label: 'Existing Vendor', icon: Search, desc: 'Select from approved list' },
          { id: 'rfq', label: 'Request Quotes', icon: Users, desc: 'Compare up to 5 vendors' },
          { id: 'new', label: 'Add New Vendor', icon: Plus, desc: 'Onboard a new supplier' },
          { id: 'none', label: 'No Vendor Yet', icon: Info, desc: 'Decide later in process' },
        ].map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => handleModeChange(option.id as any)}
            className={`flex flex-col items-start p-4 rounded-2xl border-2 transition-all text-left ${
              vendorSelection.mode === option.id
                ? 'border-blue-600 bg-blue-50/50 ring-4 ring-blue-50'
                : 'border-zinc-100 bg-white hover:border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            <div className={`p-2 rounded-xl mb-3 ${
              vendorSelection.mode === option.id ? 'bg-blue-600 text-white' : 'bg-zinc-100 text-zinc-500'
            }`}>
              <option.icon className="w-5 h-5" />
            </div>
            <span className={`text-sm font-bold ${
              vendorSelection.mode === option.id ? 'text-blue-700' : 'text-zinc-900'
            }`}>{option.label}</span>
            <span className="text-[11px] text-zinc-500 font-medium mt-1">{option.desc}</span>
          </button>
        ))}
      </div>

      {vendorSelection.mode === 'existing' && (
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Select Vendor</label>
            <select
              value={vendorSelection.selectedVendorId || ''}
              onChange={(e) => setValue('vendorSelection.selectedVendorId', e.target.value)}
              className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
            >
              <option value="">Choose a vendor...</option>
              {MOCK_VENDORS.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          {recommendedVendors.length > 0 && !vendorSelection.selectedVendorId && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Recommended for {category}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {recommendedVendors.map(v => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setValue('vendorSelection.selectedVendorId', v.id)}
                    className="px-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-all"
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedVendor && (
            <VendorCard vendor={selectedVendor} />
          )}
        </div>
      )}

      {vendorSelection.mode === 'rfq' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Select Vendors for RFQ ({vendorSelection.rfqVendorIds?.length || 0}/5)</label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MOCK_VENDORS.map(v => {
              const isSelected = vendorSelection.rfqVendorIds?.includes(v.id);
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => toggleRFQVendor(v.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-zinc-200 bg-white hover:border-zinc-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                    isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-zinc-300'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-900">{v.name}</div>
                    <div className="text-[10px] text-zinc-500 font-medium">{v.location}</div>
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-bold text-zinc-700">{v.rating}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {vendorSelection.mode === 'new' && (
        <div className="p-8 border-2 border-dashed border-zinc-200 rounded-3xl text-center space-y-4">
          <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto">
            <Plus className="w-8 h-8 text-zinc-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-zinc-900">New Vendor Onboarding</h3>
            <p className="text-sm text-zinc-500 max-w-xs mx-auto">Please provide the vendor details. Our procurement team will review and onboard them.</p>
          </div>
          <button type="button" className="px-6 py-2 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all">
            Open Onboarding Form
          </button>
        </div>
      )}
    </div>
  );
};

const VendorCard: React.FC<{ vendor: Vendor }> = ({ vendor }) => (
  <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm animate-in zoom-in-95 duration-300">
    <div className="p-6 bg-zinc-50/50 border-b border-zinc-100 flex justify-between items-start">
      <div>
        <h3 className="text-lg font-bold text-zinc-900">{vendor.name}</h3>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 rounded-lg">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span className="text-xs font-bold text-amber-700">{vendor.rating}</span>
          </div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Verified Supplier</span>
        </div>
      </div>
      <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
        Active
      </div>
    </div>
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-zinc-100 rounded-lg text-zinc-500">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Location</div>
            <div className="text-sm font-medium text-zinc-700">{vendor.location}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-zinc-100 rounded-lg text-zinc-500">
            <Phone className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Phone</div>
            <div className="text-sm font-medium text-zinc-700">{vendor.phone}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-zinc-100 rounded-lg text-zinc-500">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Email</div>
            <div className="text-sm font-medium text-zinc-700">{vendor.email}</div>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-zinc-100 rounded-lg text-zinc-500">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Payment Terms</div>
            <div className="text-sm font-medium text-zinc-700">{vendor.paymentTerms}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-zinc-100 rounded-lg text-zinc-500">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Delivery Time</div>
            <div className="text-sm font-medium text-zinc-700">{vendor.deliveryTime}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
