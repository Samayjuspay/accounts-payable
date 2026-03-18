import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { PRFormData } from '../../../types/pr.types';
import { MapPin, User, Phone, Mail, Truck, Package, ShieldCheck, Info } from 'lucide-react';
import {
  Button as BlendButton,
  ButtonSize as BlendButtonSize,
  ButtonType as BlendButtonType,
  Checkbox as BlendCheckbox,
  SingleSelect as BlendSingleSelect,
  TextArea as BlendTextArea,
  TextInput as BlendTextInput,
  TextInputSize as BlendTextInputSize,
} from '@juspay/blend-design-system';

const SHIPPING_METHOD_ITEMS = [
  {
    items: [
      { label: 'Standard (3-5 days)', value: 'Standard' },
      { label: 'Express (1-2 days)', value: 'Express' },
      { label: 'Next Day Delivery', value: 'Next day' },
    ],
  },
];

export const DeliveryStep: React.FC = () => {
  const { watch, setValue, control } = useFormContext<PRFormData>();
  const delivery = watch('delivery');

  const setLocationType = (type: 'default' | 'saved' | 'new') => {
    setValue('delivery.locationType', type);
    if (type === 'default') {
      setValue('delivery.address', {
        building: 'HQ Block A',
        street: '123 Innovation Way',
        city: 'San Francisco',
        state: 'CA',
        zip: '94105',
        country: 'USA'
      });
      setValue('delivery.contact', {
        name: 'John Central',
        phone: '+1 (555) 000-1111',
        email: 'logistics@company.com'
      });
    }
  };

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 tracking-tight">Delivery Location</h2>
          <p className="text-sm text-zinc-500 mt-1">Specify where the items should be delivered.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: 'default', label: 'Use Default', icon: MapPin, desc: 'Company HQ' },
            { id: 'saved', label: 'Saved Address', icon: Package, desc: 'Select from list' },
            { id: 'new', label: 'Add New', icon: Truck, desc: 'Custom location' },
          ].map((option) => (
            <BlendButton
              key={option.id}
              onClick={() => setLocationType(option.id as any)}
              buttonType={delivery?.locationType === option.id ? BlendButtonType.PRIMARY : BlendButtonType.SECONDARY}
              size={BlendButtonSize.SMALL}
              text={option.label}
              leadingIcon={<option.icon className="h-4 w-4" />}
              fullWidth
            />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Address Details</h3>
              <div className="grid grid-cols-1 gap-4">
                <Controller
                  name="delivery.address.building"
                  control={control}
                  render={({ field }) => (
                    <BlendTextInput
                      value={field.value || ''}
                      name={field.name}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      label="Building / Suite"
                      placeholder="e.g. Block A, Suite 400"
                      size={BlendTextInputSize.MEDIUM}
                    />
                  )}
                />
                <Controller
                  name="delivery.address.street"
                  control={control}
                  render={({ field }) => (
                    <BlendTextInput
                      value={field.value || ''}
                      name={field.name}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      label="Street Address"
                      required
                      placeholder="123 Main St"
                      size={BlendTextInputSize.MEDIUM}
                    />
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    name="delivery.address.city"
                    control={control}
                    render={({ field }) => (
                      <BlendTextInput
                        value={field.value || ''}
                        name={field.name}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        label="City"
                        required
                        size={BlendTextInputSize.MEDIUM}
                      />
                    )}
                  />
                  <Controller
                    name="delivery.address.state"
                    control={control}
                    render={({ field }) => (
                      <BlendTextInput
                        value={field.value || ''}
                        name={field.name}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        label="State / Province"
                        required
                        size={BlendTextInputSize.MEDIUM}
                      />
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    name="delivery.address.zip"
                    control={control}
                    render={({ field }) => (
                      <BlendTextInput
                        value={field.value || ''}
                        name={field.name}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        label="Zip / Postal Code"
                        required
                        size={BlendTextInputSize.MEDIUM}
                      />
                    )}
                  />
                  <Controller
                    name="delivery.address.country"
                    control={control}
                    render={({ field }) => (
                      <BlendTextInput
                        value={field.value || ''}
                        name={field.name}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        label="Country"
                        required
                        size={BlendTextInputSize.MEDIUM}
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Delivery Contact</h3>
              <div className="space-y-4 p-6 bg-zinc-50 rounded-3xl border border-zinc-100">
                <Controller
                  name="delivery.contact.name"
                  control={control}
                  render={({ field }) => (
                    <BlendTextInput
                      value={field.value || ''}
                      name={field.name}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      label="Contact Name"
                      required
                      size={BlendTextInputSize.MEDIUM}
                      leftSlot={<User className="h-4 w-4 text-zinc-400" />}
                    />
                  )}
                />
                <Controller
                  name="delivery.contact.phone"
                  control={control}
                  render={({ field }) => (
                    <BlendTextInput
                      value={field.value || ''}
                      name={field.name}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      label="Phone Number"
                      required
                      size={BlendTextInputSize.MEDIUM}
                      leftSlot={<Phone className="h-4 w-4 text-zinc-400" />}
                    />
                  )}
                />
                <Controller
                  name="delivery.contact.email"
                  control={control}
                  render={({ field }) => (
                    <BlendTextInput
                      value={field.value || ''}
                      name={field.name}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      label="Email Address"
                      required
                      size={BlendTextInputSize.MEDIUM}
                      leftSlot={<Mail className="h-4 w-4 text-zinc-400" />}
                    />
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 tracking-tight">Shipping & Requirements</h2>
          <p className="text-sm text-zinc-500 mt-1">Additional instructions for the logistics team.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Controller
            name="delivery.shippingMethod"
            control={control}
            render={({ field }) => (
              <BlendSingleSelect
                label="Shipping Method"
                placeholder="Select shipping method"
                items={SHIPPING_METHOD_ITEMS}
                selected={field.value || 'Standard'}
                onSelect={(value) => field.onChange(value)}
                fullWidth
              />
            )}
          />

          <div className="md:col-span-2">
            <Controller
              name="delivery.instructions"
              control={control}
              render={({ field }) => (
                <BlendTextArea
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  label="Special Instructions"
                  placeholder="e.g. Gate code 1234, deliver to reception"
                  rows={3}
                />
              )}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-3 p-4 bg-white border border-zinc-200 rounded-2xl">
            <ShieldCheck className="w-4 h-4 text-zinc-400" />
            <Controller
              name="delivery.installationRequired"
              control={control}
              render={({ field }) => (
                <BlendCheckbox
                  checked={Boolean(field.value)}
                  onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                  label="Installation Required"
                />
              )}
            />
          </div>
          <div className="flex items-center gap-3 p-4 bg-white border border-zinc-200 rounded-2xl">
            <Info className="w-4 h-4 text-zinc-400" />
            <Controller
              name="delivery.trainingRequired"
              control={control}
              render={({ field }) => (
                <BlendCheckbox
                  checked={Boolean(field.value)}
                  onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                  label="Training Required"
                />
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
