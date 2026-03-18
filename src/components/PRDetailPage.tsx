import React, { useState } from 'react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { 
  ChevronRight, Calendar, User, Clock, FileText, 
  Download, Paperclip, Check, AlertCircle, Bell,
  Package, Send, MoreHorizontal, Copy
} from 'lucide-react';

type PRStatus = 'Approval Pending' | 'Draft' | 'Approved' | 'Rejected' | 'PO Created' | 'Bill Received' | 'Payment Done';

interface PurchaseRequest {
  id: string;
  vendors: string[];
  status: PRStatus;
  createdBy: string;
  dueDate: string;
  createdAt: string;
  amount: number;
  department: string;
  category: string;
  lastUpdated: string;
}

const getStatusBadge = (status: PRStatus) => {
  const styles: Record<PRStatus, string> = {
    'Draft': 'bg-zinc-100 text-zinc-700 border-zinc-200',
    'Approval Pending': 'bg-amber-50 text-amber-700 border-amber-200',
    'Approved': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Rejected': 'bg-red-50 text-red-700 border-red-200',
    'PO Created': 'bg-blue-50 text-blue-700 border-blue-200',
    'Bill Received': 'bg-purple-50 text-purple-700 border-purple-200',
    'Payment Done': 'bg-green-50 text-green-700 border-green-200',
  };
  
  return (
    <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border ${styles[status]}`}>
      {status}
    </span>
  );
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
};

interface PRDetailPageProps {
  pr: PurchaseRequest;
  onClose: () => void;
}

export const PRDetailPage: React.FC<PRDetailPageProps> = ({ pr, onClose }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');

  const mockLineItems = [
    { name: 'Monitor', account: 'Rent Expense', qty: 2, remarks: 'Need a Table for the design team workspace' },
    { name: 'Mouse', account: 'Keyboard', qty: 3, remarks: 'Need a Monitor for testing' },
    { name: 'Chair', account: 'Postage & Delivery', qty: 4, remarks: 'Need a Mouse for ergonomics' },
  ];

  const mockAttachments = [
    { name: 'TechSoft_Quote.pdf', size: '2.5 Mb' },
    { name: 'Vendor_Comparison.xlsx', size: '1.2 Mb' },
    { name: 'Requirements.docx', size: '0.8 Mb' },
  ];

  const lifecycleSteps = [
    { id: 1, title: 'Purchase Request', status: 'created', description: 'Request submitted' },
    { id: 2, title: 'Quotations', status: 'disabled', description: 'Pending' },
    { id: 3, title: 'Purchase Order', status: 'disabled', description: 'Pending' },
    { id: 4, title: 'Bills Transactions', status: 'disabled', description: 'Pending' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-zinc-50 flex overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 50 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="flex-1 flex overflow-hidden"
      >
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2">
              <button 
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                title="Go back"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <button 
                className="p-2 text-zinc-300 hover:text-zinc-500 hover:bg-zinc-50 rounded-lg transition-colors cursor-not-allowed"
                title="Go forward (disabled)"
                disabled
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="h-6 w-px bg-zinc-200"></div>
            <h1 className="text-2xl font-bold text-zinc-900">{pr.id}</h1>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(pr.id);
                toast.success('PR Number copied to clipboard');
              }}
              className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="Copy PR Number"
            >
              <Copy className="w-4 h-4" />
            </button>
            {getStatusBadge(pr.status)}
            
            <div className="ml-auto flex items-center gap-2">
              <button className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </header>

          <div className="px-6 py-3 bg-white border-b border-zinc-200 shrink-0">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'details' 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'activity' 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                Activity History
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeTab === 'details' ? (
              <div className="p-6 space-y-6">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-lg">✨</span>
                    <div>
                      <h3 className="text-sm font-semibold text-blue-900">Summary</h3>
                      <p className="text-sm text-blue-700 mt-1">new items for the design team</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-zinc-200 p-6">
                  <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4">Overview</h3>
                  <div className="grid grid-cols-4 gap-6">
                    <div>
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Created On</p>
                      <p className="text-sm font-medium text-zinc-900">{formatDate(pr.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Created By</p>
                      <p className="text-sm font-medium text-zinc-900">{pr.createdBy}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">PR Due Date</p>
                      <p className="text-sm font-medium text-zinc-900">{formatDate(pr.dueDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Quotes Requested From</p>
                      <div className="space-y-1">
                        {pr.vendors.map((vendor, idx) => (
                          <div key={idx} className="text-sm">
                            <span className="text-zinc-900">{vendor}</span>
                            <span className="text-blue-600 hover:underline cursor-pointer ml-1">(QT-3121827)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100">
                    <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Requested Items</h3>
                  </div>
                  <table className="w-full">
                    <thead className="bg-zinc-50 border-b border-zinc-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Item Name</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Account Name</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Details and Remark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {mockLineItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50">
                          <td className="px-6 py-4 text-sm font-medium text-zinc-900">{item.name}</td>
                          <td className="px-6 py-4 text-sm text-zinc-600">{item.account}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700">
                              {item.qty}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-zinc-500">{item.remarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-white rounded-xl border border-zinc-200 p-6">
                  <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4">Attached Documentation</h3>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {mockAttachments.map((file, idx) => (
                      <div 
                        key={idx}
                        className="flex-shrink-0 w-48 p-4 bg-zinc-50 rounded-xl border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-100 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center justify-center w-10 h-10 bg-zinc-200 rounded-lg mb-3">
                          <FileText className="w-5 h-5 text-zinc-500" />
                        </div>
                        <p className="text-sm font-medium text-zinc-900 truncate">{file.name}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-zinc-500">{file.size}</span>
                          <Download className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="bg-white rounded-xl border border-zinc-200 p-8 text-center">
                  <Clock className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-zinc-900 mb-2">Activity History</h3>
                  <p className="text-sm text-zinc-500">Activity history will be displayed here.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-80 bg-white border-l border-zinc-200 flex flex-col shrink-0">
          <div className="p-4 border-b border-zinc-100">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Actions</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center">
                  <AlertCircle className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-xs font-semibold text-amber-700 uppercase">Awaiting Approval</span>
              </div>
              <p className="text-sm text-amber-800">This request needs your review</p>
            </div>

            <div className="space-y-2">
              <button className="w-full py-2.5 px-4 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2">
                <Bell className="w-4 h-4" />
                Notify vendors
              </button>
              <button className="w-full py-2.5 px-4 bg-emerald-600 rounded-lg text-sm font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm">
                Approve Request
              </button>
              <button className="w-full py-2.5 px-4 bg-red-600 rounded-lg text-sm font-bold text-white hover:bg-red-700 transition-colors shadow-sm">
                Reject
              </button>
            </div>

            <div className="pt-4 border-t border-zinc-100">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Lifecycle Tracker</h4>
              <div className="space-y-3">
                {lifecycleSteps.map((step, idx) => (
                  <div key={step.id} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        step.status === 'created' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-zinc-200 text-zinc-500'
                      }`}>
                        {step.id}
                      </div>
                      {idx < lifecycleSteps.length - 1 && (
                        <div className={`w-0.5 h-6 ${step.status === 'created' ? 'bg-blue-300' : 'bg-zinc-200'}`}></div>
                      )}
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p className={`text-sm font-medium ${step.status === 'created' ? 'text-zinc-900' : 'text-zinc-500'}`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-zinc-400">{step.description}</p>
                    </div>
                    {step.status === 'created' && (
                      <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">
                        created
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};