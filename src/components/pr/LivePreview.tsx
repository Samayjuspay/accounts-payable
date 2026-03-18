import React, { useMemo } from 'react';
import { 
  FileText, 
  User, 
  Calendar, 
  Package, 
  Truck, 
  Paperclip, 
  ShieldCheck, 
  Building2,
  AlertCircle,
  Users,
  Wallet,
  Clock
} from 'lucide-react';
import { PRFormData } from '../../types/pr.types';
import { formatCurrency, calculatePRSummary } from '../../utils/calculations';
import { MOCK_VENDORS } from '../../constants/mockData';

interface LivePreviewProps {
  data: PRFormData;
}

export const LivePreview: React.FC<LivePreviewProps> = ({ data }) => {
  const summary = useMemo(() => calculatePRSummary(data.items), [data.items]);
  const selectedVendor = MOCK_VENDORS.find(v => v.id === data.vendorSelection.selectedVendorId);
  const rfqVendors = MOCK_VENDORS.filter(v => data.vendorSelection.rfqVendorIds?.includes(v.id));

  const isOverBudget = data.budget && summary.total > data.budget.availableBalance;
  const completionChecks = [
    Boolean(data.title?.trim()),
    Boolean(data.department),
    Boolean(data.requiredByDate),
    data.items.length > 0,
    data.vendorSelection.mode !== 'none',
    Boolean(data.budget),
    Boolean(data.delivery?.address.street),
    data.approvalChain.length > 0,
  ];
  const completedSections = completionChecks.filter(Boolean).length;
  const completionPercent = Math.round((completedSections / completionChecks.length) * 100);

  return (
    <div className="h-full bg-zinc-100/60 p-5 overflow-y-auto custom-scrollbar">
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 px-7 py-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          
          <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-700 rounded-2xl flex items-center justify-center border border-white/10">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight leading-tight">
                    {data.title || 'Untitled Request'}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-blue-300 text-[10px] font-semibold uppercase tracking-widest">Draft PR</span>
                    <div className="w-1 h-1 bg-zinc-700 rounded-full" />
                    <span className="text-zinc-400 text-[10px] font-semibold uppercase tracking-widest">{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className={`px-3 py-1.5 rounded-xl text-[10px] font-semibold uppercase tracking-widest shadow-sm ${
                data.urgency === 'Critical' ? 'bg-red-100 text-red-700' :
                data.urgency === 'High' ? 'bg-amber-100 text-amber-700' :
                'bg-zinc-700 text-zinc-200'
              }`}>
                {data.urgency}
              </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-300">Completion</span>
                  <span className="text-xs font-semibold text-white">{completionPercent}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-blue-400 transition-all duration-300" style={{ width: `${completionPercent}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
                  <Building2 className="w-4 h-4 text-zinc-400" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase font-semibold tracking-widest mb-0.5">Department</p>
                  <p className="text-sm font-semibold text-white">{data.department || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
                  <Calendar className="w-4 h-4 text-zinc-400" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase font-semibold tracking-widest mb-0.5">Required By</p>
                  <p className="text-sm font-semibold text-white">{data.requiredByDate || '—'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-10">
          {/* Items Section */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-zinc-600" />
                <h3 className="text-[11px] font-semibold text-zinc-900 uppercase tracking-widest">Line Items</h3>
              </div>
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">{data.items.length} Items</span>
            </div>
            
            {data.items.length > 0 ? (
              <div className="space-y-3">
                {data.items.map((item) => (
                  <div key={item.id} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex justify-between items-center group">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">{item.productName}</p>
                      <p className="text-[10px] text-zinc-500 font-medium mt-0.5">{item.quantity} {item.unit} × {formatCurrency(item.unitPrice)}</p>
                    </div>
                    <p className="text-sm font-semibold text-zinc-900">{formatCurrency(item.total)}</p>
                  </div>
                ))}
                
                <div className="mt-6 p-6 bg-zinc-50 border border-zinc-200 rounded-3xl space-y-3">
                  <div className="flex justify-between text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span className="text-zinc-700">{formatCurrency(summary.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
                    <span>Tax Total</span>
                    <span className="text-zinc-700">{formatCurrency(summary.tax)}</span>
                  </div>
                  <div className="h-px bg-zinc-200 my-2" />
                  <div className="flex justify-between items-end">
                    <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-widest">Grand Total</span>
                    <span className="text-2xl font-semibold text-zinc-900">{formatCurrency(summary.total)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center border-2 border-dashed border-zinc-100 rounded-3xl">
                <Package className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
                <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">No items added yet</p>
              </div>
            )}
          </section>

          {/* Grid Sections */}
          <div className="grid grid-cols-2 gap-x-10 gap-y-8">
            {/* Vendor */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-zinc-400" />
                <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Vendor</h3>
              </div>
              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                {data.vendorSelection.mode === 'existing' && selectedVendor ? (
                  <div className="text-sm font-semibold text-zinc-900">{selectedVendor.name}</div>
                ) : data.vendorSelection.mode === 'rfq' ? (
                  <div className="text-sm font-semibold text-zinc-900">{rfqVendors.length} RFQ Vendors</div>
                ) : (
                  <div className="flex items-center gap-2 text-red-400 italic text-xs">
                    <AlertCircle className="w-3 h-3" /> Missing
                  </div>
                )}
              </div>
            </section>

            {/* Budget */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-zinc-400" />
                <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Budget</h3>
              </div>
              <div className={`p-4 rounded-2xl border ${isOverBudget ? 'bg-amber-50 border-amber-200' : 'bg-zinc-50 border-zinc-100'}`}>
                {data.budget ? (
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-zinc-900 truncate">{data.budget.name}</span>
                    {isOverBudget && <span className="text-[9px] font-semibold text-amber-600 uppercase mt-1">Over Budget</span>}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-400 italic text-xs">
                    <AlertCircle className="w-3 h-3" /> Missing
                  </div>
                )}
              </div>
            </section>

            {/* Delivery */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-zinc-400" />
                <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Delivery</h3>
              </div>
              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                {data.delivery?.address.street ? (
                  <div className="text-sm font-semibold text-zinc-900 truncate">{data.delivery.address.street}</div>
                ) : (
                  <div className="flex items-center gap-2 text-red-400 italic text-xs">
                    <AlertCircle className="w-3 h-3" /> Missing
                  </div>
                )}
              </div>
            </section>

            {/* Attachments */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-zinc-400" />
                <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Files</h3>
              </div>
              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                {data.attachments.length > 0 ? (
                  <div className="text-sm font-semibold text-zinc-900">{data.attachments.length} Attachments</div>
                ) : (
                  <div className="text-sm text-zinc-300 italic">None</div>
                )}
              </div>
            </section>
          </div>

          {/* Approval Chain */}
          <section className="pt-8 border-t border-zinc-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-zinc-600" />
                <h3 className="text-[11px] font-semibold text-zinc-900 uppercase tracking-widest">Approval Chain</h3>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-400" />
                <span className="text-[9px] font-semibold text-zinc-400 uppercase tracking-widest">Sequential</span>
              </div>
            </div>
            <div className="space-y-4">
              {data.approvalChain.length > 0 ? data.approvalChain.map((step, idx) => (
                <div key={step.id} className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center shrink-0 shadow-sm group-hover:border-blue-200 transition-all">
                    <User className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-zinc-900">{step.role}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <p className="text-[9px] text-zinc-500 font-semibold uppercase tracking-widest">{step.status}</p>
                    </div>
                  </div>
                  <div className="text-[10px] font-semibold text-zinc-300 uppercase tracking-widest">L{idx + 1}</div>
                </div>
              )) : (
                <div className="p-4 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 text-center">
                  <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">Chain will be generated</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
