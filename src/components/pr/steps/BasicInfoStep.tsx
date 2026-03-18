import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { PRFormData } from '../../../types/pr.types';
import {
  Button as BlendButton,
  ButtonSize as BlendButtonSize,
  ButtonType as BlendButtonType,
  SingleSelect as BlendSingleSelect,
  TextArea as BlendTextArea,
  TextInput as BlendTextInput,
  TextInputSize as BlendTextInputSize,
} from '@juspay/blend-design-system';

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
  const { control, formState: { errors }, watch } = useFormContext<PRFormData>();
  const businessJustification = watch('businessJustification') || '';

  return (
    <div className="space-y-7">
      <div className="grid grid-cols-1 gap-6">
        <Controller
          name="title"
          control={control}
          render={({ field }) => (
            <BlendTextInput
              value={field.value || ''}
              name={field.name}
              onChange={field.onChange}
              onBlur={field.onBlur}
              label="PR Title"
              required
              placeholder="e.g., Annual Cloud Infrastructure Renewal 2026"
              hintText="Be descriptive and specific. Minimum 10 characters."
              size={BlendTextInputSize.MEDIUM}
              error={Boolean(errors.title)}
              errorMessage={errors.title?.message}
            />
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
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {URGENCY_OPTIONS.map((option) => (
                    <BlendButton
                      key={option}
                      onClick={() => field.onChange(option)}
                      buttonType={field.value === option ? BlendButtonType.PRIMARY : BlendButtonType.SECONDARY}
                      size={BlendButtonSize.SMALL}
                      text={option}
                      fullWidth
                    />
                  ))}
                </div>
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
