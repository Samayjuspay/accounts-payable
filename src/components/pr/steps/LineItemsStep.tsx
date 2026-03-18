import React, { useEffect } from 'react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { PRFormData } from '../../../types/pr.types';
import { Package, Plus, Trash2 } from 'lucide-react';
import { calculateItemTotal, calculatePRSummary, formatCurrency } from '../../../utils/calculations';
import {
  Button as BlendButton,
  ButtonSize as BlendButtonSize,
  ButtonType as BlendButtonType,
  SingleSelect as BlendSingleSelect,
  TextArea as BlendTextArea,
  TextInput as BlendTextInput,
  TextInputSize as BlendTextInputSize,
} from '@juspay/blend-design-system';

const CATEGORY_ITEMS = [
  {
    items: [
      { label: 'Software', value: 'Software' },
      { label: 'Hardware', value: 'Hardware' },
      { label: 'Services', value: 'Services' },
      { label: 'Office Supplies', value: 'Office' },
    ],
  },
];

const UNIT_ITEMS = [
  {
    items: [
      { label: 'Units', value: 'Units' },
      { label: 'Hours', value: 'Hours' },
      { label: 'Months', value: 'Months' },
      { label: 'Licenses', value: 'Licenses' },
    ],
  },
];

const TAX_ITEMS = [
  {
    items: [0, 5, 12, 18, 28].map((rate) => ({ label: `${rate}%`, value: String(rate) })),
  },
];

export const LineItemsStep: React.FC = () => {
  const { control, watch, setValue, formState: { errors } } = useFormContext<PRFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const items = watch('items') || [];
  const summary = calculatePRSummary(items);

  useEffect(() => {
    setValue('totalAmount', summary.total, { shouldValidate: true });
  }, [setValue, summary.total]);

  const addItem = () => {
    append({
      id: Math.random().toString(36).slice(2, 11),
      productName: '',
      description: '',
      quantity: 1,
      unit: 'Units',
      unitPrice: 0,
      taxRate: 18,
      total: 0,
      category: 'Software',
      expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
  };

  const recalculateItemTotal = (index: number) => {
    const item = items[index];
    if (!item) return;
    const total = calculateItemTotal(Number(item.quantity) || 0, Number(item.unitPrice) || 0, Number(item.taxRate) || 0);
    setValue(`items.${index}.total`, total, { shouldValidate: true });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900">Line Items</h3>
          <p className="text-sm text-zinc-500">Add products or services to this request.</p>
        </div>
        <BlendButton
          onClick={addItem}
          buttonType={BlendButtonType.SECONDARY}
          size={BlendButtonSize.SMALL}
          text="Add Item"
          leadingIcon={<Plus className="h-4 w-4" />}
        />
      </div>

      <div className="space-y-5">
        {fields.map((field, index) => (
          <div key={field.id} className="rounded-2xl border border-zinc-200 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/80 px-5 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-semibold text-zinc-600">
                  {index + 1}
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Item Details</span>
              </div>
              <BlendButton
                onClick={() => remove(index)}
                buttonType={BlendButtonType.SECONDARY}
                size={BlendButtonSize.SMALL}
                text="Remove"
                leadingIcon={<Trash2 className="h-4 w-4" />}
              />
            </div>

            <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-3">
              <Controller
                name={`items.${index}.productName`}
                control={control}
                render={({ field: itemField }) => (
                  <div className="md:col-span-2">
                    <BlendTextInput
                      value={itemField.value || ''}
                      name={itemField.name}
                      onChange={itemField.onChange}
                      onBlur={itemField.onBlur}
                      label="Product Name"
                      required
                      placeholder="e.g., MacBook Pro 16-inch"
                      size={BlendTextInputSize.MEDIUM}
                      error={Boolean(errors.items?.[index]?.productName)}
                      errorMessage={errors.items?.[index]?.productName?.message as string}
                    />
                  </div>
                )}
              />

              <Controller
                name={`items.${index}.category`}
                control={control}
                render={({ field: itemField }) => (
                  <BlendSingleSelect
                    label="Category"
                    required
                    placeholder="Select category"
                    items={CATEGORY_ITEMS}
                    selected={itemField.value || ''}
                    onSelect={(value) => itemField.onChange(value)}
                    error={Boolean(errors.items?.[index]?.category)}
                    errorMessage={errors.items?.[index]?.category?.message as string}
                    fullWidth
                  />
                )}
              />

              <Controller
                name={`items.${index}.description`}
                control={control}
                render={({ field: itemField }) => (
                  <div className="md:col-span-3">
                    <BlendTextArea
                      value={itemField.value || ''}
                      onChange={itemField.onChange}
                      onBlur={itemField.onBlur}
                      label="Description"
                      required
                      placeholder="Detailed specifications, model numbers, or service scope..."
                      rows={3}
                      error={Boolean(errors.items?.[index]?.description)}
                      errorMessage={errors.items?.[index]?.description?.message as string}
                    />
                  </div>
                )}
              />

              <div className="grid grid-cols-1 gap-4 md:col-span-2 md:grid-cols-3">
                <Controller
                  name={`items.${index}.quantity`}
                  control={control}
                  render={({ field: itemField }) => (
                    <BlendTextInput
                      value={String(itemField.value ?? 1)}
                      name={itemField.name}
                      onChange={(event) => {
                        const parsed = Number(event.target.value || 0);
                        itemField.onChange(Number.isNaN(parsed) ? 0 : parsed);
                        queueMicrotask(() => recalculateItemTotal(index));
                      }}
                      onBlur={itemField.onBlur}
                      type="number"
                      label="Quantity"
                      required
                      size={BlendTextInputSize.MEDIUM}
                      error={Boolean(errors.items?.[index]?.quantity)}
                      errorMessage={errors.items?.[index]?.quantity?.message as string}
                    />
                  )}
                />

                <Controller
                  name={`items.${index}.unit`}
                  control={control}
                  render={({ field: itemField }) => (
                    <BlendSingleSelect
                      label="Unit"
                      required
                      placeholder="Select unit"
                      items={UNIT_ITEMS}
                      selected={itemField.value || ''}
                      onSelect={(value) => itemField.onChange(value)}
                      error={Boolean(errors.items?.[index]?.unit)}
                      errorMessage={errors.items?.[index]?.unit?.message as string}
                      fullWidth
                    />
                  )}
                />

                <Controller
                  name={`items.${index}.unitPrice`}
                  control={control}
                  render={({ field: itemField }) => (
                    <BlendTextInput
                      value={String(itemField.value ?? 0)}
                      name={itemField.name}
                      onChange={(event) => {
                        const parsed = Number(event.target.value || 0);
                        itemField.onChange(Number.isNaN(parsed) ? 0 : parsed);
                        queueMicrotask(() => recalculateItemTotal(index));
                      }}
                      onBlur={itemField.onBlur}
                      type="number"
                      label="Unit Price"
                      required
                      placeholder="0.00"
                      size={BlendTextInputSize.MEDIUM}
                      error={Boolean(errors.items?.[index]?.unitPrice)}
                      errorMessage={errors.items?.[index]?.unitPrice?.message as string}
                    />
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Controller
                  name={`items.${index}.taxRate`}
                  control={control}
                  render={({ field: itemField }) => (
                    <BlendSingleSelect
                      label="Tax (GST)"
                      placeholder="Select tax"
                      items={TAX_ITEMS}
                      selected={String(itemField.value ?? 0)}
                      onSelect={(value) => {
                        itemField.onChange(Number(value));
                        queueMicrotask(() => recalculateItemTotal(index));
                      }}
                      fullWidth
                    />
                  )}
                />

                <BlendTextInput
                  value={formatCurrency(items[index]?.total || 0)}
                  onChange={() => undefined}
                  label="Item Total"
                  disabled
                  size={BlendTextInputSize.MEDIUM}
                />
              </div>
            </div>
          </div>
        ))}

        {fields.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center">
            <Package className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
            <h4 className="text-base font-semibold text-zinc-900">No items added</h4>
            <p className="mt-1 text-sm text-zinc-500">Add your first item to continue.</p>
            <div className="mt-4">
              <BlendButton
                onClick={addItem}
                buttonType={BlendButtonType.SECONDARY}
                size={BlendButtonSize.SMALL}
                text="Add First Item"
                leadingIcon={<Plus className="h-4 w-4" />}
              />
            </div>
          </div>
        )}
      </div>

      {fields.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">Request Summary</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-zinc-500">Subtotal</p>
              <p className="text-lg font-semibold text-zinc-900">{formatCurrency(summary.subtotal)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Tax</p>
              <p className="text-lg font-semibold text-zinc-900">{formatCurrency(summary.tax)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Total</p>
              <p className="text-lg font-semibold text-blue-700">{formatCurrency(summary.total)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
