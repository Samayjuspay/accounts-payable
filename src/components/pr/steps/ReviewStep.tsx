import React from 'react';
import { useFormContext } from 'react-hook-form';
import { PRFormData } from '../../../types/pr.types';
import { MOCK_VENDORS } from '../../../constants/mockData';
import { CheckCircle2, Edit3, AlertCircle, FileText, ShoppingCart, Users, Wallet, Truck, Paperclip, ShieldCheck, Send, Save, FileCheck } from 'lucide-react';

interface ReviewStepProps {
  onEdit: (step: number) => void;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({ onEdit }) => {
  const { watch, register, formState: { errors } } = useFormContext<PRFormData>();
  const data = watch();

  const selectedVendor = MOCK_VENDORS.find(v => v.id === data.vendorSelection.selectedVendorId);
  const rfqVendors = MOCK_VENDORS.filter(v => data.vendorSelection.rfqVendorIds?.includes(v.id));

  const sections = [
    { id: 1, title: 'Basic Information', icon: FileText, content: (
      <div className="grid grid-cols-2 gap-y-4 gap-x-8">
        <Detail label="Title" value={data.title} />
        <Detail label="Department" value={data.department} />
        <Detail label="Category" value={data.category} />
        <Detail label="Urgency" value={data.urgency} />
        <Detail label="Required By" value={data.requiredByDate} />
        <Detail label="Justification" value={data.businessJustification} className="col-span-2" />
      </div>
    )},
    { id: 2, title: 'Line Items', icon: ShoppingCart, content: (
      <div className="space-y-3">
        {data.items.map((item, i) => (
          <div key={item.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-xs font-bold text-zinc-400 border border-zinc-100">{i + 1}</div>
              <div>
                <div className="text-sm font-bold text-zinc-900">{item.productName}</div>
                <div className="text-[10px] text-zinc-500 font-medium">{item.quantity} {item.unit} × ${item.unitPrice.toLocaleString()}</div>
              </div>
            </div>
            <div className="text-sm font-black text-zinc-900">${item.total.toLocaleString()}</div>
          </div>
        ))}
        <div className="flex justify-between items-center pt-2 px-2 border-t border-zinc-100">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Amount</span>
          <span className="text-lg font-black text-blue-600">${data.totalAmount.toLocaleString()}</span>
        </div>
      </div>
    )},
    { id: 3, title: 'Vendor Selection', icon: Users, content: (
      <div>
        {data.vendorSelection.mode === 'existing' && selectedVendor && (
          <div className="flex items-center gap-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-blue-100">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-900">{selectedVendor.name}</div>
              <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">{selectedVendor.location} • {selectedVendor.paymentTerms}</div>
            </div>
          </div>
        )}
        {data.vendorSelection.mode === 'rfq' && (
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">RFQ Vendors ({rfqVendors.length})</div>
            <div className="flex flex-wrap gap-2">
              {rfqVendors.map(v => (
                <span key={v.id} className="px-3 py-1.5 bg-zinc-100 rounded-lg text-xs font-bold text-zinc-700">{v.name}</span>
              ))}
            </div>
          </div>
        )}
        {data.vendorSelection.mode === 'none' && <span className="text-sm text-zinc-500 italic">No vendor selected yet</span>}
        {data.vendorSelection.mode === 'new' && <span className="text-sm text-zinc-500 italic">New vendor onboarding requested</span>}
      </div>
    )},
    { id: 4, title: 'Budget & Approval', icon: Wallet, content: (
      <div className="space-y-6">
        {data.budget ? (
          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-emerald-100">
                <Wallet className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-sm font-bold text-zinc-900">{data.budget.name}</div>
                <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Balance: ${data.budget.availableBalance.toLocaleString()}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Allocation</div>
              <div className="text-sm font-black text-emerald-700">${data.totalAmount.toLocaleString()}</div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-amber-700">No budget selected</span>
          </div>
        )}

        <div className="space-y-3">
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Approval Chain</div>
          <div className="flex items-center gap-2">
            {data.approvalChain.map((step, i) => (
              <React.Fragment key={step.id}>
                <div className="px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-[10px] font-bold text-zinc-700 shadow-sm">
                  {step.role}
                </div>
                {i < data.approvalChain.length - 1 && <div className="w-4 h-px bg-zinc-200" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    )},
    { id: 5, title: 'Delivery Details', icon: Truck, content: (
      <div className="grid grid-cols-2 gap-4">
        <Detail label="Location" value={data.delivery?.locationType === 'default' ? 'Company HQ' : 'Custom Address'} />
        <Detail label="Shipping" value={data.delivery?.shippingMethod} />
        <Detail label="Contact" value={data.delivery?.contact.name} />
        <Detail label="Phone" value={data.delivery?.contact.phone} />
        <Detail 
          label="Address" 
          value={`${data.delivery?.address.street}, ${data.delivery?.address.city}, ${data.delivery?.address.state} ${data.delivery?.address.zip}`} 
          className="col-span-2"
        />
      </div>
    )},
    { id: 6, title: 'Attachments', icon: Paperclip, content: (
      <div className="flex flex-wrap gap-2">
        {data.attachments.length > 0 ? data.attachments.map(file => (
          <div key={file.id} className="flex items-center gap-2 px-3 py-2 bg-zinc-50 rounded-xl border border-zinc-100">
            <FileText className="w-3 h-3 text-zinc-400" />
            <span className="text-[10px] font-bold text-zinc-700 truncate max-w-[120px]">{file.name}</span>
          </div>
        )) : (
          <span className="text-sm text-zinc-500 italic">No attachments uploaded</span>
        )}
      </div>
    )}
  ];

  const checklist = [
    { label: 'Basic Info Complete', valid: data.title.length >= 10 && data.businessJustification.length > 0 },
    { label: 'Line Items Added', valid: data.items.length > 0 },
    { label: 'Vendor Selected', valid: data.vendorSelection.mode !== 'none' },
    { label: 'Budget Valid', valid: !!data.budget && data.totalAmount <= data.budget.availableBalance },
    { label: 'Delivery Address', valid: !!data.delivery?.address.street },
    { label: 'Approval Chain Set', valid: data.approvalChain.length > 0 }
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Final Review</h2>
        <p className="text-sm text-zinc-500 mt-1">Review your request details before submitting for approval.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {sections.map((section) => (
          <div key={section.id} className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
            <div className="px-6 py-4 bg-zinc-50/50 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm border border-zinc-100 text-zinc-400 group-hover:text-blue-600 transition-colors">
                  <section.icon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-zinc-900 uppercase tracking-tight">{section.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => onEdit(section.id)}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-white rounded-lg text-[10px] font-bold text-blue-600 uppercase tracking-wider transition-all"
              >
                <Edit3 className="w-3 h-3" /> Edit
              </button>
            </div>
            <div className="p-6">
              {section.content}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <div className="p-8 bg-zinc-900 rounded-[2.5rem] text-white space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Pre-submission Checklist</h3>
              <p className="text-xs text-zinc-400">Ensure all requirements are met for faster approval.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {checklist.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  item.valid ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/30'
                }`}>
                  <CheckCircle2 className="w-3 h-3" />
                </div>
                <span className={`text-sm font-bold ${item.valid ? 'text-white' : 'text-white/40'}`}>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-white/10">
            <label className="flex items-start gap-4 cursor-pointer group">
              <div className="relative flex items-center pt-1">
                <input 
                  type="checkbox" 
                  {...register('termsAccepted')}
                  className="w-5 h-5 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500 focus:ring-offset-zinc-900"
                />
              </div>
              <div className="space-y-1">
                <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">I confirm that all information provided is accurate</span>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  By submitting this request, I agree to the company's procurement policy and confirm that 
                  this purchase is strictly for business purposes.
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

const Detail: React.FC<{ label: string; value: any; className?: string }> = ({ label, value, className }) => (
  <div className={className}>
    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">{label}</div>
    <div className="text-sm font-bold text-zinc-700">{value || <span className="text-zinc-300 italic">Not provided</span>}</div>
  </div>
);
