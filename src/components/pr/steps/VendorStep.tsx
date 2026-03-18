import React from 'react';
import { useFormContext } from 'react-hook-form';
import { PRFormData, Vendor } from '../../../types/pr.types';
import { MOCK_VENDORS } from '../../../constants/mockData';
import { Star, MapPin, Phone, Mail, Clock, CreditCard, Search, Plus, Users, Info } from 'lucide-react';
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

  const selectedVendor = MOCK_VENDORS.find(v => v.id === vendorSelection.selectedVendorId);
  const recommendedVendors = MOCK_VENDORS.filter(v => v.category === category);

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
            <VendorCard vendor={selectedVendor} />
          )}
        </div>
      )}

      {vendorSelection.mode === 'rfq' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Select Vendors for RFQ ({vendorSelection.rfqVendorIds?.length || 0}/5)</label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MOCK_VENDORS.map(v => {
              const isSelected = vendorSelection.rfqVendorIds?.includes(v.id);
              return (
                <div
                  key={v.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    isSelected
                      ? 'border-blue-300 bg-blue-50/50'
                      : 'border-zinc-200 bg-white hover:border-zinc-300'
                  }`}
                >
                  <BlendCheckbox
                    checked={Boolean(isSelected)}
                    onCheckedChange={() => toggleRFQVendor(v.id)}
                  />
                  <div>
                    <div className="text-sm font-semibold text-zinc-900">{v.name}</div>
                    <div className="text-[10px] text-zinc-500 font-medium">{v.location}</div>
                  </div>
                  <div className="ml-auto flex items-center gap-1">
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

const VendorCard: React.FC<{ vendor: Vendor }> = ({ vendor }) => (
  <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
    <div className="p-6 bg-zinc-50/50 border-b border-zinc-100 flex justify-between items-start">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900">{vendor.name}</h3>
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