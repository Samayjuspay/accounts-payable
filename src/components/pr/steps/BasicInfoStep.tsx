import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { PRFormData } from '../../../types/pr.types';
import {
  SingleSelect as BlendSingleSelect,
  Tabs as BlendTabs,
  TabsVariant as BlendTabsVariant,
  TabsSize as BlendTabsSize,
  TextArea as BlendTextArea,
  TextInput as BlendTextInput,
  TextInputSize as BlendTextInputSize,
} from '@juspay/blend-design-system';
import { SmartTitleField } from '../../smart-form/SmartTitleField';
import { EnhancedSmartPredictionBanner } from '../../smart-form/EnhancedSmartPredictionBanner';
import { useSmartPredictions } from '../../../hooks/useSmartPredictions';
import { FullFormPredictions } from '../../../types/ai-predictions.types';
import { toast } from 'sonner';

const DEPARTMENT_ITEMS = [
  {
    items: [
      { label: 'IT & Infrastructure', value: 'IT' },
      { label: 'Engineering', value: 'Engineering' },
      { label: 'Marketing', value: 'Marketing' },
      { label: 'Human Resources', value: 'HR' },
      { label: 'Finance', value: 'Finance' },
    ],
  },
];

const CATEGORY_ITEMS = [
  {
    items: [
      { label: 'Software & SaaS', value: 'Software' },
      { label: 'Hardware & Equipment', value: 'Hardware' },
      { label: 'Professional Services', value: 'Services' },
      { label: 'Office Supplies', value: 'Supplies' },
    ],
  },
];

const URGENCY_OPTIONS: PRFormData['urgency'][] = ['Low', 'Medium', 'High', 'Critical'];

export const BasicInfoStep: React.FC = () => {
  const { control, formState: { errors }, watch, setValue } = useFormContext<PRFormData>();
  const businessJustification = watch('businessJustification') || '';
  
  // Use enhanced smart predictions hook
  const { 
    fullPredictions, 
    isFullLoading, 
    showFullBanner, 
    setShowFullBanner, 
    predictFullForm 
  } = useSmartPredictions();

  const handleTitleChange = (value: string) => {
    setValue('title', value, { shouldValidate: true });
    
    // Trigger full form prediction when title changes
    const currentFormData = {
      title: value,
      department: watch('department'),
      category: watch('category'),
      urgency: watch('urgency'),
    };
    predictFullForm('title', value, currentFormData);
  };

  const handleFullPredictionApply = (predictions: FullFormPredictions, reviewMode: boolean) => {
    // Store predictions globally for other steps to access
    (window as unknown as { __aiFullPredictions?: FullFormPredictions }).__aiFullPredictions = predictions;

    // Apply basic info
    if (predictions.basicInfo.title) {
      setValue('title', predictions.basicInfo.title, { shouldValidate: true });
    }
    if (predictions.basicInfo.department) {
      setValue('department', predictions.basicInfo.department, { shouldValidate: true });
    }
    if (predictions.basicInfo.category) {
      setValue('category', predictions.basicInfo.category, { shouldValidate: true });
    }
    if (predictions.basicInfo.urgency) {
      setValue('urgency', predictions.basicInfo.urgency, { shouldValidate: true });
    }
    if (predictions.basicInfo.justification) {
      setValue('businessJustification', predictions.basicInfo.justification, { shouldValidate: true });
    }

    // Apply vendor info
    if (predictions.vendor.recommendedVendor) {
      setValue('vendorSelection.mode', predictions.vendor.rfqMode ? 'rfq' : 'existing');
      // Store vendor info for VendorStep to use
      setValue('vendorSelection.aiPredictedVendors', predictions.vendor.selectedVendors);
      setValue('vendorSelection.aiRecommendedVendor', predictions.vendor.recommendedVendor);
    }

    // Apply budget info
    if (predictions.budget.estimatedTotal > 0) {
      setValue('totalAmount', predictions.budget.breakdown.grandTotal);
      setValue('budget.aiBudgetSource', predictions.budget.budgetSource);
      setValue('budget.aiCostCenter', predictions.budget.costCenter);
    }

    // Apply delivery info
    if (predictions.delivery.address) {
      setValue('delivery.locationType', 'new');
      setValue('delivery.address.building', predictions.delivery.address);
      setValue('delivery.address.street', predictions.delivery.address);
      setValue('delivery.contact.name', predictions.delivery.contactPerson);
      setValue('delivery.contact.phone', predictions.delivery.contactPhone);
      setValue('delivery.shippingMethod', predictions.delivery.shippingMethod as 'Standard' | 'Express' | 'Next day');
      setValue('delivery.installationRequired', predictions.delivery.installationRequired);
      setValue('delivery.instructions', predictions.delivery.specialInstructions);
      // Store full delivery info for DeliveryStep
      setValue('delivery.aiPredictedDelivery', predictions.delivery);
    }

    // Count applied fields
    const appliedCount = [
      predictions.basicInfo.department,
      predictions.basicInfo.category,
      predictions.items.length > 0,
      predictions.vendor.recommendedVendor,
      predictions.budget.estimatedTotal > 0,
      predictions.delivery.address,
    ].filter(Boolean).length;

    if (appliedCount > 0) {
      toast.success(`AI filled ${appliedCount} sections`, {
        description: reviewMode 
          ? 'Review and edit the pre-filled form' 
          : 'All fields auto-populated. Review before submitting.',
      });
    }

    setShowFullBanner(false);

    // If not in review mode, jump to review step
    if (!reviewMode) {
      toast.info('Navigate to Review step to see all filled data');
    }
  };

  return (
    <div className="space-y-7">
      {/* Enhanced Smart Prediction Banner */}
      {showFullBanner && fullPredictions && (
        <EnhancedSmartPredictionBanner
          predictions={fullPredictions}
          isLoading={isFullLoading}
          onApply={handleFullPredictionApply}
          onDismiss={() => setShowFullBanner(false)}
        />
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* Smart Title Field */}
        <Controller
          name="title"
          control={control}
          render={({ field }) => (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                PR Title
                <span className="text-red-500">*</span>
              </label>
              <SmartTitleField
                value={field.value || ''}
                onChange={handleTitleChange}
              />
              {errors.title && (
                <p className="text-xs text-red-500">{errors.title.message}</p>
              )}
            </div>
          )}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Controller
            name="department"
            control={control}
            render={({ field }) => (
              <BlendSingleSelect
                label="Department"
                required
                placeholder="Select Department"
                items={DEPARTMENT_ITEMS}
                selected={field.value || ''}
                onSelect={(value) => field.onChange(value)}
                error={Boolean(errors.department)}
                errorMessage={errors.department?.message as string}
                fullWidth
              />
            )}
          />

          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <BlendSingleSelect
                label="Category"
                required
                placeholder="Select Category"
                items={CATEGORY_ITEMS}
                selected={field.value || ''}
                onSelect={(value) => field.onChange(value)}
                error={Boolean(errors.category)}
                errorMessage={errors.category?.message as string}
                fullWidth
              />
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Controller
            name="urgency"
            control={control}
            render={({ field }) => (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-zinc-700">
                  Urgency <span className="text-red-500">*</span>
                </div>
                <BlendTabs
                  variant={BlendTabsVariant.BOXED}
                  size={BlendTabsSize.MD}
                  value={field.value || 'Medium'}
                  onValueChange={(value) => field.onChange(value)}
                  items={URGENCY_OPTIONS.map((option) => ({
                    value: option,
                    label: option,
                    content: null,
                  }))}
                  fitContent
                />
              </div>
            )}
          />

          <Controller
            name="requestedBy"
            control={control}
            render={({ field }) => (
              <BlendTextInput
                value={field.value || ''}
                name={field.name}
                onChange={field.onChange}
                onBlur={field.onBlur}
                label="Requested By"
                size={BlendTextInputSize.MEDIUM}
                disabled
              />
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Controller
            name="requestDate"
            control={control}
            render={({ field }) => (
              <BlendTextInput
                value={field.value || ''}
                name={field.name}
                onChange={field.onChange}
                onBlur={field.onBlur}
                type="date"
                label="Request Date"
                size={BlendTextInputSize.MEDIUM}
                disabled
              />
            )}
          />

          <Controller
            name="requiredByDate"
            control={control}
            render={({ field }) => (
              <BlendTextInput
                value={field.value || ''}
                name={field.name}
                onChange={field.onChange}
                onBlur={field.onBlur}
                type="date"
                label="Required By Date"
                required
                size={BlendTextInputSize.MEDIUM}
                error={Boolean(errors.requiredByDate)}
                errorMessage={errors.requiredByDate?.message as string}
              />
            )}
          />
        </div>

        <Controller
          name="businessJustification"
          control={control}
          render={({ field }) => (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-700">
                  Business Justification <span className="text-red-500">*</span>
                </span>
                <span className={`text-[10px] font-semibold ${businessJustification.length > 1000 ? 'text-red-500' : 'text-zinc-400'}`}>
                  {businessJustification.length}/1000
                </span>
              </div>
              <BlendTextArea
                value={field.value || ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                rows={4}
                placeholder="Explain why this purchase is necessary and how it benefits the organization..."
                error={Boolean(errors.businessJustification)}
                errorMessage={errors.businessJustification?.message as string}
                resize="vertical"
              />
            </div>
          )}
        />
      </div>
    </div>
  );
};