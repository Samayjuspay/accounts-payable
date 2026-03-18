import React, { useEffect, useState } from 'react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { PRFormData } from '../../../types/pr.types';
import { Package, Plus, Trash2, Sparkles } from 'lucide-react';
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
import { toast } from 'sonner';

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

interface AIPredictedItem {
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  total: number;
  specifications: string;
  source: string;
  confidence: number;
}

export const LineItemsStep: React.FC = () => {
  const { control, watch, setValue, formState: { errors } } = useFormContext<PRFormData>();
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'items',
  });

  const items = watch('items') || [];
  const summary = calculatePRSummary(items);
  const [aiApplied, setAiApplied] = useState(false);

  useEffect(() => {
    setValue('totalAmount', summary.total, { shouldValidate: true });
  }, [setValue, summary.total]);

  // Check for AI-predicted items from full predictions
  useEffect(() => {
    const fullPredictions = (window as unknown as { __aiFullPredictions?: { items?: AIPredictedItem[] } }).__aiFullPredictions;
    
    if (fullPredictions?.items && fullPredictions.items.length > 0 && !aiApplied) {
      const predictedItems = fullPredictions.items;
      
      // Convert predicted items to form format
      const formItems = predictedItems.map((item, index) => ({
        id: `ai-${Date.now()}-${index}`,
        productName: item.name,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit || 'Units',
        unitPrice: item.unitPrice,
        taxRate: 18, // Default GST
        total: item.total,
        category: 'Hardware', // Default category
        expectedDelivery: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        _aiGenerated: true,
        _sourcePR: item.source,
        _confidence: item.confidence,
      }));

      // Replace current items with AI-predicted items
      replace(formItems);
      setAiApplied(true);

      // Show notification
      toast.success(`${predictedItems.length} items auto-added by AI`, {
        description: `Based on ${predictedItems[0]?.source || 'similar PRs'}`,
      });

      // Clear the global predictions after applying
      (window as unknown as { __aiFullPredictions?: unknown }).__aiFullPredictions = undefined;
    }
  }, [replace, aiApplied]);

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
        {fields.map((field, index) => {
          const item = items[index];
          const isAIGenerated = item?._aiGenerated;
          
          return (
            <div 
              key={field.id} 
              className={`rounded-2xl border bg-white transition-all ${isAIGenerated ? 'border-blue-300 ring-2 ring-blue-100' : 'border-zinc-200'}`}
            >
              <div className={`flex items-center justify-between border-b px-5 py-3 ${isAIGenerated ? 'bg-blue-50/80 border-blue-100' : 'bg-zinc-50/80 border-zinc-100'}`}>
                <div className="flex items-center gap-2">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold ${isAIGenerated ? 'bg-blue-500 text-white' : 'bg-zinc-200 text-zinc-600'}`}>
                    {index + 1}
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Item Details</span>
                  {isAIGenerated && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-0.5 rounded-full">
                      <Sparkles className="w-3 h-3" />
                      AI Added
                    </span>
                  )}
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

                <Controller
                  name={`items.${index}.quantity`}
                  control={control}
                  render={({ field: itemField }) => (
                    <BlendTextInput
                      value={String(itemField.value || '')}
                      name={itemField.name}
                      onChange={(e) => {
                        itemField.onChange(e);
                        recalculateItemTotal(index);
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
                      value={String(itemField.value || '')}
                      name={itemField.name}
                      onChange={(e) => {
                        itemField.onChange(e);
                        recalculateItemTotal(index);
                      }}
                      onBlur={itemField.onBlur}
                      type="number"
                      label="Unit Price"
                      required
                      size={BlendTextInputSize.MEDIUM}
                      error={Boolean(errors.items?.[index]?.unitPrice)}
                      errorMessage={errors.items?.[index]?.unitPrice?.message as string}
                    />
                  )}
                />

                <Controller
                  name={`items.${index}.taxRate`}
                  control={control}
                  render={({ field: itemField }) => (
                    <BlendSingleSelect
                      label="Tax (GST)"
                      required
                      placeholder="Select tax rate"
                      items={TAX_ITEMS}
                      selected={String(itemField.value || '18')}
                      onSelect={(value) => {
                        itemField.onChange(Number(value));
                        recalculateItemTotal(index);
                      }}
                      error={Boolean(errors.items?.[index]?.taxRate)}
                      errorMessage={errors.items?.[index]?.taxRate?.message as string}
                      fullWidth
                    />
                  )}
                />

                <Controller
                  name={`items.${index}.expectedDelivery`}
                  control={control}
                  render={({ field: itemField }) => (
                    <BlendTextInput
                      value={itemField.value || ''}
                      name={itemField.name}
                      onChange={itemField.onChange}
                      onBlur={itemField.onBlur}
                      type="date"
                      label="Expected Delivery"
                      required
                      size={BlendTextInputSize.MEDIUM}
                      error={Boolean(errors.items?.[index]?.expectedDelivery)}
                      errorMessage={errors.items?.[index]?.expectedDelivery?.message as string}
                    />
                  )}
                />

                <div className="flex items-end">
                  <div className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                    <div className="text-xs text-zinc-500">Item Total</div>
                    <div className="text-lg font-semibold text-zinc-900">{formatCurrency(item?.total || 0)}</div>
                  </div>
                </div>
              </div>

              {isAIGenerated && item?._sourcePR && (
                <div className="px-5 pb-3 text-xs text-zinc-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-500" />
                  Populated from {item._sourcePR} ({Math.round((item._confidence || 0) * 100)}% match)
                </div>
              )}
            </div>
          );
        })}
      </div>

      {fields.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-zinc-200 p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
            <Package className="h-8 w-8 text-zinc-400" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900">No items added yet</h3>
          <p className="text-sm text-zinc-500">Add items to your purchase request or wait for AI suggestions.</p>
        </div>
      )}

      {/* Summary */}
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
        <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">Request Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-600">Subtotal</span>
            <span className="font-medium text-zinc-900">{formatCurrency(summary.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">Tax</span>
            <span className="font-medium text-zinc-900">{formatCurrency(summary.tax)}</span>
          </div>
          <div className="flex justify-between border-t border-zinc-200 pt-2 text-base font-semibold">
            <span className="text-zinc-900">Total</span>
            <span className="text-zinc-900">{formatCurrency(summary.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};