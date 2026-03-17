import React from 'react';
import { useFormContext } from 'react-hook-form';
import { PRFormData } from '../../../types/pr.types';
import { MapPin, User, Phone, Mail, Truck, Package, Check, ShieldCheck, Info } from 'lucide-react';

export const DeliveryStep: React.FC = () => {
  const { watch, setValue, register, formState: { errors } } = useFormContext<PRFormData>();
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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Delivery Location</h2>
          <p className="text-sm text-zinc-500 mt-1">Specify where the items should be delivered.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: 'default', label: 'Use Default', icon: MapPin, desc: 'Company HQ' },
            { id: 'saved', label: 'Saved Address', icon: Package, desc: 'Select from list' },
            { id: 'new', label: 'Add New', icon: Truck, desc: 'Custom location' },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setLocationType(option.id as any)}
              className={`flex flex-col items-start p-4 rounded-2xl border-2 transition-all text-left ${
                delivery?.locationType === option.id
                  ? 'border-blue-600 bg-blue-50/50 ring-4 ring-blue-50'
                  : 'border-zinc-100 bg-white hover:border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              <div className={`p-2 rounded-xl mb-3 ${
                delivery?.locationType === option.id ? 'bg-blue-600 text-white' : 'bg-zinc-100 text-zinc-500'
              }`}>
                <option.icon className="w-5 h-5" />
              </div>
              <span className={`text-sm font-bold ${
                delivery?.locationType === option.id ? 'text-blue-700' : 'text-zinc-900'
              }`}>{option.label}</span>
              <span className="text-[11px] text-zinc-500 font-medium mt-1">{option.desc}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Address Details</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Building / Suite</label>
                  <input 
                    {...register('delivery.address.building')}
                    className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                    placeholder="e.g. Block A, Suite 400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Street Address</label>
                  <input 
                    {...register('delivery.address.street')}
                    className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                    placeholder="123 Main St"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">City</label>
                    <input 
                      {...register('delivery.address.city')}
                      className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">State / Province</label>
                    <input 
                      {...register('delivery.address.state')}
                      className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Zip / Postal Code</label>
                    <input 
                      {...register('delivery.address.zip')}
                      className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Country</label>
                    <input 
                      {...register('delivery.address.country')}
                      className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Delivery Contact</h3>
              <div className="space-y-4 p-6 bg-zinc-50 rounded-3xl border border-zinc-100">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Contact Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                      {...register('delivery.contact.name')}
                      className="w-full pl-11 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                      {...register('delivery.contact.phone')}
                      className="w-full pl-11 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                      {...register('delivery.contact.email')}
                      className="w-full pl-11 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Shipping & Requirements</h2>
          <p className="text-sm text-zinc-500 mt-1">Additional instructions for the logistics team.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Shipping Method</label>
            <select
              {...register('delivery.shippingMethod')}
              className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
            >
              <option value="Standard">Standard (3-5 days)</option>
              <option value="Express">Express (1-2 days)</option>
              <option value="Next day">Next Day Delivery</option>
            </select>
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Special Instructions</label>
            <input 
              {...register('delivery.instructions')}
              className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
              placeholder="e.g. Gate code 1234, deliver to reception"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-3 p-4 bg-white border border-zinc-200 rounded-2xl cursor-pointer hover:bg-zinc-50 transition-all">
            <input 
              type="checkbox" 
              {...register('delivery.installationRequired')}
              className="w-5 h-5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-zinc-400" />
              <span className="text-sm font-bold text-zinc-700">Installation Required</span>
            </div>
          </label>
          <label className="flex items-center gap-3 p-4 bg-white border border-zinc-200 rounded-2xl cursor-pointer hover:bg-zinc-50 transition-all">
            <input 
              type="checkbox" 
              {...register('delivery.trainingRequired')}
              className="w-5 h-5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-zinc-400" />
              <span className="text-sm font-bold text-zinc-700">Training Required</span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
