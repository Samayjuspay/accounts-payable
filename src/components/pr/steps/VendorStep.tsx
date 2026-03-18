import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { PRFormData, Vendor } from '../../../types/pr.types';
import { MOCK_VENDORS } from '../../../constants/mockData';
import { Star, MapPin, Phone, Mail, Clock, CreditCard, Search, Plus, Users, Info, Sparkles } from 'lucide-react';
import {
  Button as BlendButton,
  ButtonSize as BlendButtonSize,
  ButtonType as BlendButtonType,
  Checkbox as BlendCheckbox,
  SingleSelect as BlendSingleSelect,
  Tabs as BlendTabs,
  TabsVariant as BlendTabsVariant,
  TabsSize as BlendTabsSize,
} from '@juspay/blend-design-system';
import { SmartVendorField } from '../../smart-form/SmartVendorField';
import { toast } from 'sonner';

const VENDOR_ITEMS = [
  {
    items: MOCK_VENDORS.map((vendor) => ({
      label: vendor.name,
      value: vendor.id,
      subLabel: `${vendor.location} • ${vendor.paymentTerms}`,
    })),
  },
];

export const VendorStep: React.FC = () => {
  const { watch, setValue } = useFormContext<PRFormData>();
  const vendorSelection = watch('vendorSelection');
  const category = watch('category');
  const department = watch('department');
  const [aiApplied, setAiApplied] = useState(false);

  const selectedVendor = MOCK_VENDORS.find(v => v.id === vendorSelection.selectedVendorId);
  const recommendedVendors = MOCK_VENDORS.filter(v => v.category === category);

  // Check for AI-predicted vendors
  useEffect(() => {
    const aiPredictedVendors = vendorSelection?.aiPredictedVendors as string[] | undefined;
    const aiRecommendedVendor = vendorSelection?.aiRecommendedVendor as string | undefined;
    
    if (aiPredictedVendors && aiPredictedVendors.length > 0 && !aiApplied) {
      // Set vendor mode based on number of predicted vendors
      const mode = aiPredictedVendors.length > 1 ? 'rfq' : 'existing';
      setValue('vendorSelection.mode', mode);
      
      // For single vendor, select it
      if (mode === 'existing' && aiPredictedVendors[0]) {
        const vendor = MOCK_VENDORS.find(v => 
          aiPredictedVendors[0].toLowerCase().includes(v.name.toLowerCase()) ||
          v.name.toLowerCase().includes(aiPredictedVendors[0].toLowerCase())
        );
        if (vendor) {
          setValue('vendorSelection.selectedVendorId', vendor.id);
        }
      }
      
      // For RFQ mode, set the RFQ vendor IDs
      if (mode === 'rfq') {
        const vendorIds = aiPredictedVendors
          .map(name => {
            const vendor = MOCK_VENDORS.find(v => 
              name.toLowerCase().includes(v.name.toLowerCase()) ||
              v.name.toLowerCase().includes(name.toLowerCase())
            );
            return vendor?.id;
          })
          .filter((id): id is string => id !== undefined);
        
        setValue('vendorSelection.rfqVendorIds', vendorIds);
      }
      
      setAiApplied(true);
      
      // Show notification
      toast.success(`${aiPredictedVendors.length} vendor${aiPredictedVendors.length > 1 ? 's' : ''} auto-selected by AI`, {
        description: aiRecommendedVendor ? `Recommended: ${aiRecommendedVendor}` : 'Based on previous purchases',
      });
    }
  }, [vendorSelection?.aiPredictedVendors, vendorSelection?.aiRecommendedVendor, aiApplied, setValue]);

  const handleModeChange = (mode: 'existing' | 'rfq' | 'new' | 'none') => {
    setValue('vendorSelection.mode', mode);
    if (mode !== 'existing') setValue('vendorSelection.selectedVendorId', undefined);
    if (mode !== 'rfq') setValue('vendorSelection.rfqVendorIds', []);
  };

  const handleVendorChange = (vendorId: string) => {
    setValue('vendorSelection.selectedVendorId', vendorId);
  };

  const toggleRFQVendor = (vendorId: string) => {
    const current = vendorSelection.rfqVendorIds || [];
    if (current.includes(vendorId)) {
      setValue('vendorSelection.rfqVendorIds', current.filter(id => id !== vendorId));
    } else if (current.length < 5) {
      setValue('vendorSelection.rfqVendorIds', [...current, vendorId]);
    }
  };

  const isAIVendor = (vendorId: string) => {
    const aiPredictedVendors = vendorSelection?.aiPredictedVendors as string[] | undefined;
    if (!aiPredictedVendors) return false;
    const vendor = MOCK_VENDORS.find(v => v.id === vendorId);
    return vendor && aiPredictedVendors.some(name => 
      name.toLowerCase().includes(vendor.name.toLowerCase()) ||
      vendor.name.toLowerCase().includes(name.toLowerCase())
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 tracking-tight">Vendor Selection</h2>
        <p className="text-sm text-zinc-500 mt-1">Choose how you want to source the items for this request.</p>
      </div>

      <BlendTabs
        variant={BlendTabsVariant.BOXED}
        size={BlendTabsSize.MD}
        value={vendorSelection.mode || 'existing'}
        onValueChange={(value) => handleModeChange(value as any)}
        items={[
          { id: 'existing', label: 'Existing Vendor', icon: Search, desc: 'Select from approved list' },
          { id: 'rfq', label: 'Request Quotes', icon: Users, desc: 'Compare up to 5 vendors' },
          { id: 'new', label: 'Add New Vendor', icon: Plus, desc: 'Onboard a new supplier' },
          { id: 'none', label: 'No Vendor Yet', icon: Info, desc: 'Decide later in process' },
        ].map((option) => ({
          value: option.id,
          label: option.label,
          content: null,
          leftSlot: <option.icon className="h-4 w-4" />,
        }))}
        fitContent
      />
      
      {/* RFQ Count Badge */}
      {vendorSelection.mode === 'rfq' && (
        <div className="flex items-center gap-2 -mt-2">
          <span className={`text-sm font-medium ${(vendorSelection.rfqVendorIds?.length || 0) > 0 ? 'text-blue-600' : 'text-zinc-500'}`}>
            {vendorSelection.rfqVendorIds?.length || 0} RFQ Vendors Selected
          </span>
          {(vendorSelection.rfqVendorIds?.length || 0) > 0 && (
            <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3" />
              AI Selected
            </span>
          )}
        </div>
      )}
      
      <p className="text-xs text-zinc-500 -mt-4">Tip: use RFQ mode to compare up to 5 vendors before finalizing.</p>

      {vendorSelection.mode === 'existing' && (
        <div className="space-y-6">
          <SmartVendorField
            category={category}
            department={department}
            value={vendorSelection.selectedVendorId}
            onChange={handleVendorChange}
          />

          {recommendedVendors.length > 0 && !vendorSelection.selectedVendorId && (
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-blue-600 fill-blue-600" />
                <span className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Recommended for {category}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {recommendedVendors.map(v => (
                  <BlendButton
                    key={v.id}
                    onClick={() => setValue('vendorSelection.selectedVendorId', v.id)}
                    buttonType={BlendButtonType.SECONDARY}
                    size={BlendButtonSize.SMALL}
                    text={v.name}
                  />
                ))}
              </div>
            </div>
          )}

          {selectedVendor && (
            <VendorCard vendor={selectedVendor} isAIRecommended={isAIVendor(selectedVendor.id)} />
          )}
        </div>
      )}

      {vendorSelection.mode === 'rfq' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Select Vendors for RFQ ({vendorSelection.rfqVendorIds?.length || 0}/5)
            </label>
            {(vendorSelection.rfqVendorIds?.length || 0) > 0 && (
              <span className="inline-flex items-center gap-1 text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-1 rounded-full">
                <Sparkles className="w-3 h-3" />
                AI Recommended
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MOCK_VENDORS.map(v => {
              const isSelected = vendorSelection.rfqVendorIds?.includes(v.id);
              const isAIRecommended = isAIVendor(v.id);
              return (
                <div
                  key={v.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    isSelected
                      ? 'border-blue-300 bg-blue-50/50'
                      : 'border-zinc-200 bg-white hover:border-zinc-300'
                  } ${isAIRecommended ? 'ring-1 ring-blue-200' : ''}`}
                >
                  <BlendCheckbox
                    checked={Boolean(isSelected)}
                    onCheckedChange={() => toggleRFQVendor(v.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-900">{v.name}</span>
                      {isAIRecommended && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                          <Sparkles className="w-3 h-3" />
                          AI
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-medium">{v.location}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-semibold text-zinc-700">{v.rating}</span>
                  </div>
                </div>
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
            <h3 className="text-lg font-semibold text-zinc-900">New Vendor Onboarding</h3>
            <p className="text-sm text-zinc-500 max-w-xs mx-auto">Please provide the vendor details. Our procurement team will review and onboard them.</p>
          </div>
          <BlendButton
            buttonType={BlendButtonType.SECONDARY}
            size={BlendButtonSize.MEDIUM}
            text="Open Onboarding Form"
          />
        </div>
      )}
    </div>
  );
};

const VendorCard: React.FC<{ vendor: Vendor; isAIRecommended?: boolean }> = ({ vendor, isAIRecommended }) => (
  <div className={`bg-white border rounded-2xl overflow-hidden shadow-sm ${isAIRecommended ? 'border-blue-300 ring-2 ring-blue-100' : 'border-zinc-200'}`}>
    <div className={`p-6 border-b border-zinc-100 flex justify-between items-start ${isAIRecommended ? 'bg-blue-50/50' : 'bg-zinc-50/50'}`}>
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-zinc-900">{vendor.name}</h3>
          {isAIRecommended && (
            <span className="inline-flex items-center gap-1 text-xs font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3" />
              AI Recommended
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 rounded-lg">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span className="text-xs font-semibold text-amber-700">{vendor.rating}</span>
          </div>
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">Verified Supplier</span>
        </div>
      </div>
      <div className="px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full text-[10px] font-semibold uppercase tracking-wider">
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