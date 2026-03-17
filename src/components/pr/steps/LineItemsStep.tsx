import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { PRFormData, LineItem } from '../../../types/pr.types';
import { Plus, Trash2, Package, Calculator, Info } from 'lucide-react';
import { calculateItemTotal, formatCurrency, calculatePRSummary } from '../../../utils/calculations';

export const LineItemsStep: React.FC = () => {
  const { register, control, watch, setValue, formState: { errors } } = useFormContext<PRFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const items = watch('items') || [];
  const summary = calculatePRSummary(items);

  const addItem = () => {
    append({
      id: Math.random().toString(36).substr(2, 9),
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

  const updateItemTotal = (index: number) => {
    const item = items[index];
    if (item) {
      const total = calculateItemTotal(item.quantity, item.unitPrice, item.taxRate);
      setValue(`items.${index}.total`, total);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-zinc-900">Line Items</h3>
          <p className="text-sm text-zinc-500 font-medium">Add the products or services you need to request.</p>
        </div>
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100 active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      <div className="space-y-6">
        {fields.map((field, index) => (
          <div key={field.id} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-zinc-50 px-6 py-3 border-b border-zinc-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-zinc-200 rounded-full flex items-center justify-center text-[10px] font-bold text-zinc-600">
                  {index + 1}
                </div>
                <span className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Item Details</span>
              </div>
              <button
                type="button"
                onClick={() => remove(index)}
                className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Product Name */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Product Name *</label>
                <input
                  {...register(`items.${index}.productName`)}
                  placeholder="e.g., MacBook Pro 16-inch"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Category *</label>
                <select
                  {...register(`items.${index}.category`)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                >
                  <option value="Software">Software</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Services">Services</option>
                  <option value="Office">Office Supplies</option>
                </select>
              </div>

              {/* Description */}
              <div className="md:col-span-3 space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Description *</label>
                <textarea
                  {...register(`items.${index}.description`)}
                  rows={2}
                  placeholder="Detailed specifications, model numbers, or service scope..."
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 resize-none"
                />
              </div>

              {/* Quantity, Unit, Price */}
              <div className="grid grid-cols-3 gap-4 md:col-span-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Qty *</label>
                  <input
                    type="number"
                    {...register(`items.${index}.quantity`, { 
                      valueAsNumber: true,
                      onChange: () => updateItemTotal(index)
                    })}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Unit *</label>
                  <select
                    {...register(`items.${index}.unit`)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  >
                    <option value="Units">Units</option>
                    <option value="Hours">Hours</option>
                    <option value="Months">Months</option>
                    <option value="Licenses">Licenses</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Unit Price *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      {...register(`items.${index}.unitPrice`, { 
                        valueAsNumber: true,
                        onChange: () => updateItemTotal(index)
                      })}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-zinc-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>
                </div>
              </div>

              {/* Tax & Total */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tax (GST) %</label>
                  <select
                    {...register(`items.${index}.taxRate`, { 
                      valueAsNumber: true,
                      onChange: () => updateItemTotal(index)
                    })}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  >
                    {[0, 5, 12, 18, 28].map(rate => (
                      <option key={rate} value={rate}>{rate}%</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Item Total</label>
                  <div className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-100 text-zinc-900 font-bold">
                    {formatCurrency(items[index]?.total || 0)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {fields.length === 0 && (
          <div className="py-12 text-center border-2 border-dashed border-zinc-200 rounded-3xl bg-zinc-50">
            <Package className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
            <h4 className="text-zinc-900 font-bold">No items added</h4>
            <p className="text-sm text-zinc-500 font-medium mt-1">Click "Add Item" to start building your request.</p>
            <button
              type="button"
              onClick={addItem}
              className="mt-6 px-6 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-bold text-zinc-700 hover:bg-zinc-100 transition-all shadow-sm"
            >
              Add First Item
            </button>
          </div>
        )}
      </div>

      {/* Summary Card */}
      {fields.length > 0 && (
        <div className="bg-zinc-900 rounded-3xl p-8 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <Calculator className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-bold uppercase tracking-wider">Request Summary</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Subtotal</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.subtotal)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tax Total</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.tax)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Grand Total</p>
              <p className="text-3xl font-bold text-blue-400">{formatCurrency(summary.total)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
