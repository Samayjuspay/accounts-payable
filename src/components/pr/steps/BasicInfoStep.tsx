import React from 'react';
import { useFormContext } from 'react-hook-form';
import { PRFormData } from '../../../types/pr.types';
import { AlertCircle, Info } from 'lucide-react';

export const BasicInfoStep: React.FC = () => {
  const { register, formState: { errors }, watch } = useFormContext<PRFormData>();
  const businessJustification = watch('businessJustification') || '';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 gap-6">
        {/* PR Title */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-zinc-700 flex items-center gap-2">
            PR Title <span className="text-red-500">*</span>
          </label>
          <input
            {...register('title')}
            placeholder="e.g., Annual Cloud Infrastructure Renewal 2026"
            className={`w-full px-4 py-3 rounded-xl border transition-all outline-none focus:ring-4 ${
              errors.title 
                ? 'border-red-300 bg-red-50 focus:ring-red-100' 
                : 'border-zinc-200 focus:border-blue-500 focus:ring-blue-50'
            }`}
          />
          {errors.title ? (
            <p className="text-xs font-bold text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.title.message}
            </p>
          ) : (
            <p className="text-xs text-zinc-500 font-medium">Be descriptive and specific. Min 10 characters.</p>
          )}
        </div>

        {/* Department & Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700">Department <span className="text-red-500">*</span></label>
            <select
              {...register('department')}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            >
              <option value="">Select Department</option>
              <option value="IT">IT & Infrastructure</option>
              <option value="Engineering">Engineering</option>
              <option value="Marketing">Marketing</option>
              <option value="HR">Human Resources</option>
              <option value="Finance">Finance</option>
            </select>
            {errors.department && <p className="text-xs font-bold text-red-500">{errors.department.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700">Category <span className="text-red-500">*</span></label>
            <select
              {...register('category')}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            >
              <option value="">Select Category</option>
              <option value="Software">Software & SaaS</option>
              <option value="Hardware">Hardware & Equipment</option>
              <option value="Services">Professional Services</option>
              <option value="Supplies">Office Supplies</option>
            </select>
            {errors.category && <p className="text-xs font-bold text-red-500">{errors.category.message}</p>}
          </div>
        </div>

        {/* Urgency & Requested By */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700">Urgency <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              {['Low', 'Medium', 'High', 'Critical'].map((level) => (
                <label key={level} className="flex-1">
                  <input
                    type="radio"
                    value={level}
                    {...register('urgency')}
                    className="sr-only peer"
                  />
                  <div className={`
                    text-center py-2 rounded-lg border text-xs font-bold cursor-pointer transition-all
                    peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600
                    hover:bg-zinc-50 border-zinc-200 text-zinc-500
                  `}>
                    {level}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700">Requested By</label>
            <input
              {...register('requestedBy')}
              disabled
              className="w-full px-4 py-3 rounded-xl border border-zinc-100 bg-zinc-50 text-zinc-500 font-medium cursor-not-allowed"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700">Request Date</label>
            <input
              type="date"
              {...register('requestDate')}
              disabled
              className="w-full px-4 py-3 rounded-xl border border-zinc-100 bg-zinc-50 text-zinc-500 font-medium cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700 flex items-center gap-2">
              Required By Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              {...register('requiredByDate')}
              className={`w-full px-4 py-3 rounded-xl border transition-all outline-none focus:ring-4 ${
                errors.requiredByDate 
                  ? 'border-red-300 bg-red-50 focus:ring-red-100' 
                  : 'border-zinc-200 focus:border-blue-500 focus:ring-blue-50'
              }`}
            />
            {errors.requiredByDate && <p className="text-xs font-bold text-red-500">{errors.requiredByDate.message}</p>}
          </div>
        </div>

        {/* Business Justification */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-bold text-zinc-700">Business Justification <span className="text-red-500">*</span></label>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${businessJustification.length > 1000 ? 'text-red-500' : 'text-zinc-400'}`}>
              {businessJustification.length} / 1000
            </span>
          </div>
          <textarea
            {...register('businessJustification')}
            rows={4}
            placeholder="Explain why this purchase is necessary and how it benefits the organization..."
            className={`w-full px-4 py-3 rounded-xl border transition-all outline-none focus:ring-4 resize-none ${
              errors.businessJustification 
                ? 'border-red-300 bg-red-50 focus:ring-red-100' 
                : 'border-zinc-200 focus:border-blue-500 focus:ring-blue-50'
            }`}
          />
          {errors.businessJustification && <p className="text-xs font-bold text-red-500">{errors.businessJustification.message}</p>}
        </div>
      </div>
    </div>
  );
};
