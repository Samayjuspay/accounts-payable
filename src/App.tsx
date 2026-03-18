/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Toaster, toast } from 'sonner';
import { CreatePRPage } from './pages/CreatePRPage';
import Fuse from 'fuse.js';
import {
  Button as BlendButton,
  ButtonSize as BlendButtonSize,
  ButtonType as BlendButtonType,
  SearchInput as BlendSearchInput,
  StatCard as BlendStatCard,
  StatCardVariant as BlendStatCardVariant,
  Tag as BlendTag,
  TagColor as BlendTagColor,
  TagSize as BlendTagSize,
  TagVariant as BlendTagVariant,
} from '@juspay/blend-design-system';
import { 
  Search, Filter, ChevronDown, Check, X, Copy, 
  MoreHorizontal, Clock, AlertCircle, CheckCircle2, 
  XCircle, FileText, ShoppingCart, Bell, CheckSquare, Square,
  Calendar, User, TrendingUp, TrendingDown, Receipt, CreditCard,
  List, GitCommit, Kanban, Settings, GripVertical, Save,
  Plus, Download, Upload, LayoutDashboard, RefreshCw, ArrowRight,
  Ticket, ChevronUp, MessageSquare, Paperclip, Activity, Zap, Eye,
  Grid3X3, Send, Package, Users, PieChart, BarChart2, Folder, Link, Shield, Menu, ChevronRight, ClipboardList, ExternalLink,
  Keyboard, Minus, Maximize2, Trash2, AtSign, Table2, Layers, GitBranch
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { XyneAIChat } from './components/XyneAIChat';
import { useVirtualizer } from '@tanstack/react-virtual';
import { AI_DASHBOARD_PR_OVERRIDES, MOCK_VENDORS } from './constants/mockData';
import { AIConversationPRPayload } from './types/ai.types';
import { PRFormData } from './types/pr.types';
import xyneLogo from './assets/XyneLogo.svg';

const ASSISTANT_WIDTH_KEY = 'xyne_assistant_panel_width_v1';
const ASSISTANT_MIN_WIDTH = 340;
const ASSISTANT_MAX_WIDTH = 620;

type PRStatus = 'Approval Pending' | 'Draft' | 'Approved' | 'Rejected' | 'PO Created' | 'Bill Received' | 'Payment Done';
type FilterType = 'Total PRs' | 'Approval Pending' | 'Due This Week' | 'Approved' | 'Rejected';
type ViewMode = 'table' | 'pipeline' | 'kanban' | 'timeline' | 'ticket' | 'consolidated';

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

interface TicketFlightState {
  pr: PurchaseRequest;
  title: string;
  justification: string;
  firstApprover: string;
  startRect: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  endRect?: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

const CURRENT_USER = 'Samay Maurya';

const generateMockData = (count: number): PurchaseRequest[] => {
  const vendors = ['Acme Corp', 'TechFlow Inc', 'Global Supplies', 'CloudServices LLC', 'DataBricks', 'AWS', 'Office Depot', 'Dell Technologies', 'Marketing Agency X', 'Salesforce'];
  const statuses: PRStatus[] = ['Draft', 'Approval Pending', 'Approved', 'Rejected', 'PO Created', 'Bill Received', 'Payment Done'];
  const creators = ['Sarah Connor', 'John Smith', 'Alice Johnson', 'Bob Williams', 'Eva Green', 'Michael Chang', 'David Lee', CURRENT_USER];
  const departments = ['Engineering', 'Operations', 'IT', 'HR', 'Marketing', 'Sales'];
  const categories = ['Software', 'Office Supplies', 'Cloud Infrastructure', 'Hardware', 'Services', 'Travel'];

  return Array.from({ length: count }, (_, i) => {
    const id = `PR-2026-${String(i + 1).padStart(3, '0')}`;
    const vendorCount = Math.floor(Math.random() * 3) + 1;
    const prVendors = Array.from({ length: vendorCount }, () => vendors[Math.floor(Math.random() * vendors.length)]);
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const createdBy = creators[Math.floor(Math.random() * creators.length)];
    const department = departments[Math.floor(Math.random() * departments.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const amount = Math.floor(Math.random() * 100000) + 100;
    
    // Generate dates around March 2026
    const createdAtDate = new Date(2026, 0, 1 + Math.floor(Math.random() * 70)); // Jan 1 to Mar 11
    const dueDateDate = new Date(createdAtDate);
    dueDateDate.setDate(dueDateDate.getDate() + 10 + Math.floor(Math.random() * 20));
    const lastUpdatedDate = new Date(createdAtDate);
    lastUpdatedDate.setDate(lastUpdatedDate.getDate() + Math.floor(Math.random() * 5));

    return {
      id,
      vendors: [...new Set(prVendors)],
      status,
      createdBy,
      dueDate: dueDateDate.toISOString().split('T')[0],
      createdAt: createdAtDate.toISOString().split('T')[0],
      amount,
      department,
      category,
      lastUpdated: lastUpdatedDate.toISOString().split('T')[0],
    };
  });
};

const applySeedOverrides = (data: PurchaseRequest[]) =>
  data.map((pr) => {
    const override = AI_DASHBOARD_PR_OVERRIDES.find((item) => item.id === pr.id) as Partial<PurchaseRequest> | undefined;
    return override ? { ...pr, ...override } : pr;
  });

const MOCK_DATA: PurchaseRequest[] = applySeedOverrides(generateMockData(257));

const SIDEBAR_GROUPS = [
  {
    id: 'home',
    items: [
      { id: 'home', label: 'Home', icon: Grid3X3 }
    ]
  },
  {
    id: 'procurement',
    label: 'PROCUREMENT',
    items: [
      { id: 'purchase-requests', label: 'Purchase Requests', icon: FileText, active: true },
      { id: 'rfqs', label: 'RFQs', icon: Send },
      { id: 'quotes', label: 'Quotes', icon: MessageSquare },
      { id: 'purchase-orders', label: 'Purchase Orders', icon: ClipboardList },
      { id: 'goods-receipts', label: 'Goods Receipts', icon: Package }
    ]
  },
  {
    id: 'invoices-payments',
    label: 'INVOICES & PAYMENTS',
    items: [
      { id: 'invoices', label: 'Invoices', icon: FileText },
      { id: 'bills', label: 'Bills', icon: FileText },
      { id: 'payouts', label: 'Payouts', icon: CreditCard }
    ]
  },
  {
    id: 'operations',
    label: 'OPERATIONS',
    items: [
      { id: 'approvals', label: 'Approvals', icon: CheckSquare },
      { id: 'vendors', label: 'Vendors', icon: Users },
      { id: 'budgets', label: 'Budgets', icon: PieChart },
      { id: 'reconciliation', label: 'Reconciliation', icon: RefreshCw },
      { id: 'reports', label: 'Reports', icon: BarChart2 }
    ]
  },
  {
    id: 'system',
    label: 'SYSTEM',
    items: [
      { id: 'corporate-cards', label: 'Corporate Cards', icon: CreditCard },
      { id: 'documents', label: 'Documents', icon: Folder },
      { id: 'integrations', label: 'Integrations', icon: Link },
      { id: 'audit-logs', label: 'Audit Logs', icon: FileText },
      { id: 'admin', label: 'Admin', icon: Shield }
    ]
  }
];

const SidebarItem = ({ item, isCollapsed, isActive, ...props }: any) => {
  const Icon = item.icon;
  return (
    <div className="relative group px-2" {...props}>
      <button
        className={`w-full flex items-center h-10 px-3 rounded-lg transition-all duration-150 my-0.5 relative ${
          isActive 
            ? 'bg-blue-50 text-blue-700 font-medium' 
            : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
        } ${isCollapsed ? 'justify-center px-0' : ''}`}
      >
        {isActive && !isCollapsed && (
          <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-blue-600 rounded-r-full" />
        )}
        <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-blue-600' : 'text-zinc-400 group-hover:text-zinc-600'} ${isCollapsed ? '' : 'mr-3'}`} />
        {!isCollapsed && <span className="text-sm truncate">{item.label}</span>}
        {isCollapsed && isActive && (
          <div className="absolute right-2 w-1.5 h-1.5 bg-blue-600 rounded-full" />
        )}
      </button>
      
      {isCollapsed && (
        <div className="absolute left-full ml-2 px-3 py-2 bg-zinc-900/90 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 whitespace-nowrap z-50 pointer-events-none shadow-xl">
          {item.label}
          <div className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 border-[6px] border-transparent border-r-zinc-900/90" />
        </div>
      )}
    </div>
  );
};

// Helpers
function getDaysUntil(dateString: string): number {
  const due = new Date(dateString);
  // Using a fixed "now" for consistent rendering based on March 17, 2026.
  const now = new Date('2026-03-17T00:00:00Z');
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function formatRelativeDate(dateString: string): string {
  const days = getDaysUntil(dateString);
  if (days < 0) return `overdue by ${Math.abs(days)} days`;
  if (days === 0) return 'due today';
  if (days === 1) return 'due tomorrow';
  return `due in ${days} days`;
}

function getDueDateColor(dateString: string): string {
  const days = getDaysUntil(dateString);
  if (days < 0) return 'text-red-700 bg-red-100 border-transparent';
  if (days === 0) return 'text-orange-700 bg-orange-100 border-transparent';
  if (days <= 7) return 'text-orange-700 bg-orange-100 border-transparent';
  return 'text-green-700 bg-green-100 border-transparent';
}

function getStatusBadge(status: PRStatus) {
  switch (status) {
    case 'Approval Pending':
      return <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-50 text-orange-600 border border-transparent"><Clock className="w-3 h-3 mr-1" /> Approval Pending</span>;
    case 'Draft':
      return <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-zinc-100 text-zinc-600 border border-transparent"><FileText className="w-3 h-3 mr-1" /> Draft</span>;
    case 'Approved':
      return <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-transparent"><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</span>;
    case 'Rejected':
      return <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-transparent"><XCircle className="w-3 h-3 mr-1" /> Rejected</span>;
    case 'PO Created':
      return <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-transparent"><ShoppingCart className="w-3 h-3 mr-1" /> PO Created</span>;
    case 'Bill Received':
      return <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-transparent"><Receipt className="w-3 h-3 mr-1" /> Bill Received</span>;
    case 'Payment Done':
      return <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-transparent"><CreditCard className="w-3 h-3 mr-1" /> Payment Done</span>;
  }
}

const buildStatCards = (data: PurchaseRequest[]) => [
  {
    id: 'Total PRs',
    title: 'Total PRs',
    count: data.length,
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    subtitle: 'All requests',
  },
  {
    id: 'Approval Pending',
    title: 'Approval Pending',
    count: data.filter((pr) => pr.status === 'Approval Pending').length,
    icon: Clock,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    subtitle: 'Need action',
  },
  {
    id: 'Due This Week',
    title: 'Due This Week',
    count: data.filter((pr) => {
      const days = getDaysUntil(pr.dueDate);
      return days >= 0 && days <= 7;
    }).length,
    icon: Calendar,
    color: 'text-zinc-600',
    bgColor: 'bg-zinc-100',
    subtitle: 'Upcoming deadlines',
  },
  {
    id: 'Approved',
    title: 'Approved',
    count: data.filter((pr) => pr.status === 'Approved').length,
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    subtitle: 'This month',
  },
  {
    id: 'Rejected',
    title: 'Rejected',
    count: data.filter((pr) => pr.status === 'Rejected').length,
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    subtitle: 'This month',
  },
];

const buildPipelineStages = (data: PurchaseRequest[]) => [
  { id: 'Draft', label: 'Draft', count: data.filter((pr) => pr.status === 'Draft').length },
  { id: 'Approval Pending', label: 'Approval Pending', count: data.filter((pr) => pr.status === 'Approval Pending').length },
  { id: 'Approved', label: 'Approved', count: data.filter((pr) => pr.status === 'Approved').length },
  { id: 'PO Created', label: 'PO Created', count: data.filter((pr) => pr.status === 'PO Created').length },
  { id: 'Bill Received', label: 'Bill Received', count: data.filter((pr) => pr.status === 'Bill Received').length },
  { id: 'Payment Done', label: 'Payment Done', count: data.filter((pr) => pr.status === 'Payment Done').length },
];

const KANBAN_COLUMNS: { id: PRStatus, label: string, bgColor: string, headerColor: string }[] = [
  { id: 'Draft', label: 'Draft', bgColor: 'bg-zinc-50', headerColor: 'text-zinc-700' },
  { id: 'Approval Pending', label: 'Approval Pending', bgColor: 'bg-orange-50', headerColor: 'text-orange-700' },
  { id: 'Approved', label: 'Approved', bgColor: 'bg-zinc-50', headerColor: 'text-emerald-700' },
  { id: 'Rejected', label: 'Rejected', bgColor: 'bg-zinc-50', headerColor: 'text-red-700' },
  { id: 'PO Created', label: 'Converted to PO', bgColor: 'bg-zinc-50', headerColor: 'text-blue-700' }
];

type ColumnId = 'id' | 'vendors' | 'status' | 'createdBy' | 'dueDate' | 'createdAt' | 'amount' | 'department' | 'category' | 'lastUpdated';

interface ColumnDef {
  id: ColumnId;
  label: string;
  visible: boolean;
  locked?: boolean;
}

const DEFAULT_COLUMNS: ColumnDef[] = [
  { id: 'id', label: 'PR Number', visible: true, locked: true },
  { id: 'vendors', label: 'Vendors', visible: true },
  { id: 'status', label: 'Status', visible: true },
  { id: 'createdBy', label: 'Created By', visible: true },
  { id: 'dueDate', label: 'Due Date', visible: true },
  { id: 'createdAt', label: 'Created Date', visible: false },
  { id: 'amount', label: 'Amount', visible: false },
  { id: 'department', label: 'Department', visible: false },
  { id: 'category', label: 'Category', visible: false },
  { id: 'lastUpdated', label: 'Last Updated', visible: false },
];

const ConsolidatedTableView = ({ 
  data, 
  selectedRows, 
  onSelectRow, 
  onSelectAll, 
  expandedRowId, 
  onToggleExpand,
  onViewDetails
}: { 
  data: PurchaseRequest[], 
  selectedRows: Set<string>, 
  onSelectRow: (id: string) => void, 
  onSelectAll: () => void,
  expandedRowId: string | null,
  onToggleExpand: (id: string) => void,
  onViewDetails: (pr: PurchaseRequest) => void
}) => {
  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-left border-collapse min-w-[1000px]">
        <thead className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-zinc-200 z-10">
          <tr>
            <th className="px-3 py-3 w-12 text-center">
              <button onClick={onSelectAll} className="text-zinc-400 hover:text-zinc-600 focus:outline-none">
                {selectedRows.size === data.length && data.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                ) : selectedRows.size > 0 ? (
                  <div className="w-4 h-4 border-2 border-blue-600 rounded-[3px] bg-blue-600 flex items-center justify-center">
                    <div className="w-2 h-0.5 bg-white rounded-full"></div>
                  </div>
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>
            </th>
            <th className="px-3 py-3 w-10"></th>
            <th className="px-3 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">PR Number</th>
            <th className="px-3 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Vendors</th>
            <th className="px-3 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
            <th className="px-3 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Created By</th>
            <th className="px-3 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Due Date</th>
            <th className="px-3 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((pr) => {
            const isExpanded = expandedRowId === pr.id;
            const isSelected = selectedRows.has(pr.id);
            
            return (
              <React.Fragment key={pr.id}>
                <tr 
                  onClick={() => onToggleExpand(pr.id)}
                  className={`group transition-all cursor-pointer border-b border-zinc-100 ${
                    isExpanded ? 'bg-blue-50/30 border-b-transparent' : 'bg-white hover:bg-zinc-50'
                  } ${isExpanded ? 'ring-2 ring-inset ring-blue-200 z-10 relative' : ''}`}
                >
                  <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => onSelectRow(pr.id)} className="text-zinc-400 hover:text-zinc-600">
                      {isSelected ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4" />}
                    </button>
                  </td>
                  <td className={`px-3 py-3 text-center transition-colors ${isExpanded ? 'bg-blue-50' : ''}`}>
                    <motion.div
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                        isExpanded ? 'text-blue-600' : 'text-zinc-400 group-hover:bg-zinc-100'
                      }`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </motion.div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="font-mono text-[13px] font-medium text-zinc-900">{pr.id}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm text-zinc-900 font-medium">
                      {pr.vendors[0]}
                      {pr.vendors.length > 1 && (
                        <span className="text-zinc-500 font-normal ml-1">+{pr.vendors.length - 1} more</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {getStatusBadge(pr.status)}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700">
                        {pr.createdBy.charAt(0)}
                      </div>
                      <span className="text-sm text-zinc-600">{pr.createdBy}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-[12px] font-medium px-2 py-1 rounded-md border ${getDueDateColor(pr.dueDate)}`}>
                      {formatRelativeDate(pr.dueDate)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    {!isExpanded && (
                      <button className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
                
                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <tr className="bg-blue-50/30">
                      <td colSpan={8} className="p-0 border-b-2 border-blue-200">
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="ml-20 mr-6 my-4 bg-white rounded-xl shadow-lg border border-zinc-200 p-6">
                            <div className="flex items-start justify-between mb-6">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <Ticket className="w-5 h-5 text-blue-600" />
                                  <h3 className="text-lg font-mono font-bold text-zinc-900">{pr.id}</h3>
                                  {getStatusBadge(pr.status)}
                                </div>
                                <p className="text-sm font-semibold text-zinc-900 mt-1">
                                  {pr.vendors.join(', ')}
                                </p>
                              </div>
                              <button 
                                onClick={() => onViewDetails(pr)}
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm group"
                              >
                                View Full Details
                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                              </button>
                            </div>

                            <div className="bg-zinc-50/50 rounded-xl p-4 mb-6 border border-zinc-100">
                              <Timeline status={pr.status} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                              <div className="space-y-4">
                                <MetadataItem 
                                  icon={Calendar} 
                                  label="Due Date" 
                                  value={formatRelativeDate(pr.dueDate)}
                                  color={getDaysUntil(pr.dueDate) < 0 ? 'text-red-600' : ''}
                                />
                                <MetadataItem 
                                  icon={User} 
                                  label="Created By" 
                                  value={pr.createdBy} 
                                />
                                <MetadataItem 
                                  icon={Receipt} 
                                  label="Amount" 
                                  value={`₹${pr.amount.toLocaleString()}`} 
                                />
                                <MetadataItem 
                                  icon={Folder} 
                                  label="Category" 
                                  value={pr.category} 
                                />
                              </div>
                              <div className="space-y-4">
                                <MetadataItem 
                                  icon={Users} 
                                  label="Department" 
                                  value={pr.department} 
                                />
                                <MetadataItem 
                                  icon={Clock} 
                                  label="Created Date" 
                                  value={pr.createdAt} 
                                />
                                <MetadataItem 
                                  icon={RefreshCw} 
                                  label="Last Updated" 
                                  value={pr.lastUpdated} 
                                />
                              </div>
                            </div>

                            <div className="mt-8 flex items-center justify-between pt-6 border-t border-zinc-100">
                              <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2 text-zinc-500">
                                  <Paperclip className="w-4 h-4" />
                                  <span className="text-sm">2 Attachments</span>
                                </div>
                                <div className="flex items-center gap-2 text-zinc-500">
                                  <MessageSquare className="w-4 h-4" />
                                  <span className="text-sm">3 Comments</span>
                                </div>
                              </div>
                              
                              {pr.status === 'Approval Pending' && (
                                <div className="flex items-center gap-3">
                                  <button className="px-4 py-2 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
                                    Reject
                                  </button>
                                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
                                    Approve
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

interface Notification {
  id: string;
  type: 'approval' | 'status' | 'comment' | 'mention' | 'system';
  title: string;
  description: string;
  time: string;
  read: boolean;
}

// --- Create PR Modal Component ---
const CreatePRModal = ({ isOpen, onClose, onSubmit }: { isOpen: boolean, onClose: () => void, onSubmit: (data: any) => void }) => {
  const [formData, setFormData] = useState({
    vendors: '',
    department: 'Engineering',
    category: 'Software',
    amount: '',
    dueDate: '',
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <h2 className="text-lg font-bold text-zinc-900">Create Purchase Request</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200/50 rounded-full transition-colors">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Vendor(s)</label>
            <input 
              type="text" 
              placeholder="e.g. Acme Corp, TechFlow"
              className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              value={formData.vendors}
              onChange={e => setFormData({...formData, vendors: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Department</label>
              <select 
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                value={formData.department}
                onChange={e => setFormData({...formData, department: e.target.value})}
              >
                <option>Engineering</option>
                <option>Operations</option>
                <option>IT</option>
                <option>HR</option>
                <option>Marketing</option>
                <option>Sales</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Category</label>
              <select 
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option>Software</option>
                <option>Office Supplies</option>
                <option>Cloud Infrastructure</option>
                <option>Hardware</option>
                <option>Services</option>
                <option>Travel</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Amount ($)</label>
              <input 
                type="number" 
                placeholder="0.00"
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Due Date</label>
              <input 
                type="date" 
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                value={formData.dueDate}
                onChange={e => setFormData({...formData, dueDate: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => onSubmit(formData)}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-200 active:scale-95"
          >
            Create Request
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- New Components ---

const GlobalSearchModal = ({ isOpen, onClose, data }: { isOpen: boolean, onClose: () => void, data: PurchaseRequest[] }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const fuse = useMemo(() => new Fuse(data, {
    keys: ['id', 'vendors', 'createdBy', 'department', 'category'],
    threshold: 0.3
  }), [data]);

  const results = useMemo(() => {
    if (!query) return [];
    return fuse.search(query).slice(0, 8);
  }, [query, fuse]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        // Handle selection
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [results, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-[20vh]">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden border border-zinc-200"
      >
        <div className="flex items-center px-5 border-b border-zinc-200 h-14">
          <Search className="w-5 h-5 text-zinc-400 mr-3" />
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Search purchase requests, vendors, invoices..." 
            className="flex-1 bg-transparent border-none outline-none text-base text-zinc-900 placeholder:text-zinc-500"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-2">
            {query && (
              <button onClick={() => setQuery('')} className="p-1 hover:bg-zinc-100 rounded text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="px-1.5 py-0.5 rounded border border-zinc-200 bg-zinc-50 text-[10px] font-mono text-zinc-400">ESC</kbd>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2 custom-scrollbar">
          {!query ? (
            <div className="p-4">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 px-2">Quick Actions</h4>
              <div className="grid grid-cols-1 gap-1">
                {[
                  { icon: Plus, label: 'Create new PR', shortcut: 'C' },
                  { icon: Clock, label: 'View pending approvals', shortcut: 'G P' },
                  { icon: Activity, label: 'Recent activity', shortcut: 'G H' }
                ].map((action, i) => (
                  <button key={i} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-zinc-50 text-sm text-zinc-700 transition-colors group">
                    <div className="flex items-center gap-3">
                      <action.icon className="w-4 h-4 text-zinc-400 group-hover:text-blue-600" />
                      <span>{action.label}</span>
                    </div>
                    <kbd className="text-[10px] font-mono text-zinc-400">{action.shortcut}</kbd>
                  </button>
                ))}
              </div>
            </div>
          ) : results.length > 0 ? (
            <div className="p-2">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 px-2">Results</h4>
              {results.map((result, i) => (
                <button 
                  key={result.item.id}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors ${i === selectedIndex ? 'bg-blue-50 text-blue-700' : 'hover:bg-zinc-50 text-zinc-700'}`}
                  onClick={onClose}
                >
                  <div className="flex items-center gap-3">
                    <FileText className={`w-4 h-4 ${i === selectedIndex ? 'text-blue-600' : 'text-zinc-400'}`} />
                    <div>
                      <div className="text-sm font-medium">{result.item.id}</div>
                      <div className="text-xs opacity-70">{result.item.vendors.join(', ')}</div>
                    </div>
                  </div>
                  <div className="text-xs font-medium opacity-60">{result.item.status}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-zinc-400" />
              </div>
              <p className="text-sm font-medium text-zinc-900">No results found for "{query}"</p>
              <p className="text-xs text-zinc-500 mt-1">Try searching for PR numbers, vendor names, or amounts</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const ShortcutsPopover = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  if (!isOpen) return null;

  const groups = [
    {
      title: 'Navigation',
      items: [
        { label: 'Open search', keys: ['⌘', 'K'] },
        { label: 'Go to home', keys: ['G', 'H'] },
        { label: 'Go to purchase requests', keys: ['G', 'P'] },
        { label: 'Focus search', keys: ['/'] },
        { label: 'Close modal/drawer', keys: ['Esc'] }
      ]
    },
    {
      title: 'Actions',
      items: [
        { label: 'Create new PR', keys: ['C'] },
        { label: 'Toggle focus mode', keys: ['F'] },
        { label: 'Expand/collapse row', keys: ['E'] },
        { label: 'Approve selected', keys: ['A'] },
        { label: 'Reject selected', keys: ['R'] }
      ]
    }
  ];

  return (
    <div className="absolute top-full right-0 mt-2 w-[400px] bg-white rounded-xl shadow-2xl border border-zinc-200 z-[100] overflow-hidden">
      <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
        <h3 className="font-bold text-zinc-900">Keyboard Shortcuts</h3>
        <button onClick={onClose} className="p-1 hover:bg-zinc-100 rounded text-zinc-400">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar space-y-6">
        {groups.map(group => (
          <div key={group.title}>
            <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-3">{group.title}</h4>
            <div className="space-y-2">
              {group.items.map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600">{item.label}</span>
                  <div className="flex gap-1">
                    {item.keys.map(key => (
                      <kbd key={key} className="px-2 py-1 rounded border border-zinc-300 bg-zinc-100 text-[11px] font-mono text-zinc-600 shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]">{key}</kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 bg-zinc-50 border-t border-zinc-100">
        <button className="text-sm font-medium text-blue-600 hover:underline">See all shortcuts</button>
      </div>
    </div>
  );
};

const NotificationsPopover = ({ isOpen, onClose, notifications, onMarkRead }: { 
  isOpen: boolean, 
  onClose: () => void, 
  notifications: Notification[],
  onMarkRead: (id: string) => void
}) => {
  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'approval': return <Clock className="w-4 h-4 text-orange-600" />;
      case 'status': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'comment': return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'mention': return <AtSign className="w-4 h-4 text-purple-600" />;
      default: return <Bell className="w-4 h-4 text-zinc-600" />;
    }
  };

  const getBg = (type: string) => {
    switch (type) {
      case 'approval': return 'bg-orange-100';
      case 'status': return 'bg-green-100';
      case 'comment': return 'bg-blue-100';
      case 'mention': return 'bg-purple-100';
      default: return 'bg-zinc-100';
    }
  };

  return (
    <div className="absolute top-full right-0 mt-2 w-[380px] bg-white rounded-xl shadow-2xl border border-zinc-200 z-[100] overflow-hidden">
      <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
        <h3 className="font-bold text-zinc-900">Notifications</h3>
        <button className="text-xs font-medium text-blue-600 hover:underline">Mark all as read</button>
      </div>
      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {notifications.length > 0 ? (
          notifications.map(n => (
            <button 
              key={n.id}
              onClick={() => onMarkRead(n.id)}
              className={`w-full p-4 flex gap-4 text-left border-b border-zinc-50 hover:bg-zinc-50 transition-colors relative ${!n.read ? 'bg-blue-50/30' : ''}`}
            >
              {!n.read && <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-600 rounded-full" />}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getBg(n.type)}`}>
                {getIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm ${!n.read ? 'font-semibold text-zinc-900' : 'text-zinc-700'}`}>{n.title}</div>
                <div className="text-xs text-zinc-500 line-clamp-2 mt-0.5">{n.description}</div>
                <div className="text-[10px] text-zinc-400 mt-1.5 font-medium">{n.time}</div>
              </div>
            </button>
          ))
        ) : (
          <div className="p-12 text-center">
            <Bell className="w-12 h-12 text-zinc-200 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">No notifications yet</p>
          </div>
        )}
      </div>
      <div className="p-3 text-center border-t border-zinc-100">
        <button className="text-sm font-medium text-blue-600 hover:underline">View all notifications</button>
      </div>
    </div>
  );
};

const FullDetailsView = ({ 
  pr, 
  onClose 
}: { 
  pr: PurchaseRequest, 
  onClose: () => void 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-zinc-900/40 backdrop-blur-sm flex justify-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-5xl bg-zinc-50 h-full shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="bg-white border-b border-zinc-200 px-8 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="p-2 -ml-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-zinc-200 mx-2"></div>
            <div className="flex items-center gap-3">
              <Ticket className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-mono font-bold text-zinc-900">{pr.id}</h2>
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
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-5xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Panel */}
            <div className="lg:col-span-2 space-y-8">
              {/* Vendors */}
              <section className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm">
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4">Vendors</h3>
                <div className="space-y-4">
                  {pr.vendors.map((vendor, idx) => (
                    <div key={vendor} className={`p-4 rounded-xl border ${idx === 0 ? 'border-blue-200 bg-blue-50/30' : 'border-zinc-100 bg-zinc-50/30'} flex items-center justify-between`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${idx === 0 ? 'bg-blue-100 text-blue-700' : 'bg-zinc-200 text-zinc-600'}`}>
                          {vendor.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-900">{vendor}</div>
                          <div className="text-xs text-zinc-500">Primary Contact: contact@{vendor.toLowerCase().replace(/ /g, '')}.com</div>
                        </div>
                      </div>
                      {idx === 0 && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase rounded">Selected</span>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Detailed Timeline */}
              <section className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm">
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-6">Detailed Lifecycle</h3>
                <div className="space-y-8 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-100">
                  {[
                    { stage: 'Draft', status: 'Completed', date: pr.createdAt, user: pr.createdBy, notes: 'Initial draft created with basic requirements.' },
                    { stage: 'Approval Pending', status: pr.status === 'Draft' ? 'Upcoming' : 'Completed', date: pr.lastUpdated, user: 'System', notes: 'Sent for internal review.' },
                    { stage: 'Approved', status: ['Approved', 'PO Created', 'Bill Received', 'Payment Done'].includes(pr.status) ? 'Completed' : pr.status === 'Rejected' ? 'Rejected' : 'Upcoming', date: '-', user: 'Finance Team', notes: '-' },
                    { stage: 'PO Created', status: ['PO Created', 'Bill Received', 'Payment Done'].includes(pr.status) ? 'Completed' : 'Upcoming', date: '-', user: 'Procurement', notes: '-' }
                  ].map((item, idx) => (
                    <div key={item.stage} className="relative pl-10">
                      <div className={`absolute left-0 top-1 w-8 h-8 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 ${
                        item.status === 'Completed' ? 'bg-blue-600 text-white' : 
                        item.status === 'Rejected' ? 'bg-red-600 text-white' : 'bg-zinc-200 text-zinc-400'
                      }`}>
                        {item.status === 'Completed' ? <Check className="w-4 h-4" /> : 
                         item.status === 'Rejected' ? <X className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className={`font-bold ${item.status === 'Upcoming' ? 'text-zinc-400' : 'text-zinc-900'}`}>{item.stage}</span>
                          <span className="text-xs text-zinc-400">{item.date}</span>
                        </div>
                        <div className="text-sm text-zinc-500">Performed by: {item.user}</div>
                        {item.notes !== '-' && <div className="mt-2 p-3 bg-zinc-50 rounded-lg text-sm text-zinc-600 border border-zinc-100 italic">"{item.notes}"</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Line Items */}
              <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Line Items</h3>
                  <span className="text-sm font-mono font-bold text-blue-600">Total: ₹{pr.amount.toLocaleString()}</span>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-zinc-50 border-b border-zinc-100">
                    <tr>
                      <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase">Item</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase text-right">Qty</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase text-right">Price</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {[
                      { name: 'MacBook Pro 14"', qty: 1, price: pr.amount * 0.7 },
                      { name: 'Dell UltraSharp 27"', qty: 2, price: pr.amount * 0.15 }
                    ].map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 text-sm font-medium text-zinc-900">{item.name}</td>
                        <td className="px-6 py-4 text-sm text-zinc-600 text-right">{item.qty}</td>
                        <td className="px-6 py-4 text-sm text-zinc-600 text-right">₹{item.price.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-zinc-900 text-right">₹{(item.qty * item.price).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </div>

            {/* Right Panel */}
            <div className="space-y-6">
              <section className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm sticky top-0">
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-6">Details</h3>
                <div className="space-y-6">
                  <MetadataItem icon={Calendar} label="Due Date" value={formatRelativeDate(pr.dueDate)} color={getDaysUntil(pr.dueDate) < 0 ? 'text-red-600' : ''} />
                  <MetadataItem icon={User} label="Created By" value={pr.createdBy} />
                  <MetadataItem icon={Receipt} label="Amount" value={`₹${pr.amount.toLocaleString()}`} />
                  <MetadataItem icon={Folder} label="Category" value={pr.category} />
                  <MetadataItem icon={Users} label="Department" value={pr.department} />
                  <MetadataItem icon={Clock} label="Created At" value={pr.createdAt} />
                  <MetadataItem icon={RefreshCw} label="Last Updated" value={pr.lastUpdated} />
                </div>

                <div className="mt-8 pt-8 border-t border-zinc-100 space-y-4">
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Attachments</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {['quote_v1.pdf', 'specs_final.xlsx'].map(file => (
                      <div key={file} className="flex items-center justify-between p-2 bg-zinc-50 rounded-lg border border-zinc-100 group cursor-pointer hover:bg-zinc-100 transition-colors">
                        <div className="flex items-center gap-2">
                          <Paperclip className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="text-xs text-zinc-600 truncate">{file}</span>
                        </div>
                        <Download className="w-3.5 h-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  {pr.status === 'Approval Pending' ? (
                    <>
                      <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">Approve Request</button>
                      <button className="w-full py-3 bg-white border border-zinc-200 text-zinc-700 rounded-xl font-bold hover:bg-zinc-50 transition-colors">Reject Request</button>
                    </>
                  ) : (
                    <button className="w-full py-3 bg-white border border-zinc-200 text-zinc-700 rounded-xl font-bold hover:bg-zinc-50 transition-colors">Edit Request</button>
                  )}
                </div>
              </section>

              <section className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm">
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4">Comments</h3>
                <div className="space-y-4 mb-6">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-200 shrink-0" />
                    <div className="flex flex-col gap-1">
                      <div className="text-xs font-bold text-zinc-900">Eva Green <span className="font-normal text-zinc-400 ml-1">2h ago</span></div>
                      <div className="text-sm text-zinc-600 bg-zinc-50 p-3 rounded-xl rounded-tl-none border border-zinc-100">Please check the vendor comparison for this PR.</div>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <textarea 
                    placeholder="Add a comment..."
                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-h-[80px] resize-none"
                  />
                  <button className="absolute bottom-2 right-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Timeline = ({ status, size = 'md' }: { status: PRStatus, size?: 'sm' | 'md' | 'lg' }) => {
  const stages: PRStatus[] = ['Draft', 'Approval Pending', 'Approved', 'PO Created', 'Bill Received'];
  const activeIndex = stages.indexOf(status);
  
  const dotSize = size === 'lg' ? 'w-4 h-4' : size === 'md' ? 'w-3 h-3' : 'w-2 h-2';
  const labelSize = size === 'lg' ? 'text-xs' : 'text-[10px]';
  const lineHeight = size === 'lg' ? 'h-1' : 'h-[2px]';

  return (
    <div className={`flex items-center justify-between relative px-2 ${size === 'lg' ? 'h-20' : 'h-16'}`}>
      {stages.map((stage, idx) => {
        const isCompleted = idx < activeIndex;
        const isCurrent = idx === activeIndex;
        const isFuture = idx > activeIndex;
        
        return (
          <React.Fragment key={stage}>
            <div className="flex flex-col items-center relative z-10">
              <div className={`${dotSize} rounded-full flex items-center justify-center transition-all ${
                isCompleted ? 'bg-blue-600' : 
                isCurrent ? 'bg-blue-600 ring-[4px] ring-blue-100 animate-pulse' : 
                'bg-white border-2 border-zinc-300'
              }`}>
                {isCurrent && <div className={`${size === 'lg' ? 'w-2 h-2' : 'w-1.5 h-1.5'} bg-white rounded-full`} />}
              </div>
              <span className={`absolute top-5 ${labelSize} font-medium whitespace-nowrap ${
                isCurrent ? 'text-blue-600' : 'text-zinc-500'
              }`}>
                {stage === 'Approval Pending' ? 'Pending' : stage}
              </span>
              {isCurrent && (
                <motion.span 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`absolute ${size === 'lg' ? 'top-10' : 'top-9'} ${labelSize} font-medium text-blue-600 whitespace-nowrap flex items-center gap-1`}
                >
                  ↑ You are here
                </motion.span>
              )}
            </div>
            {idx < stages.length - 1 && (
              <div className={`flex-1 ${lineHeight} mx-1 ${
                idx < activeIndex ? 'bg-blue-400' : 'bg-zinc-200'
              }`}></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const MetadataItem = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: string | React.ReactNode, color?: string }) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5">
      <Icon className="w-3.5 h-3.5 text-zinc-400" />
    </div>
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider leading-none">{label}</span>
      <span className={`text-sm font-medium ${color || 'text-zinc-900'}`}>{value}</span>
    </div>
  </div>
);

export default function App() {
  const [prData, setPrData] = useState<PurchaseRequest[]>(MOCK_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const statCards = useMemo(() => buildStatCards(prData), [prData]);
  const pipelineStages = useMemo(() => buildPipelineStages(prData), [prData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const [needMyAction, setNeedMyAction] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('Total PRs');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [selectedPRForDetails, setSelectedPRForDetails] = useState<PurchaseRequest | null>(null);
  const [activePipelineStage, setActivePipelineStage] = useState<PRStatus>('Draft');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPR, setSelectedPR] = useState<PurchaseRequest | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  
  // Column visibility state
  const [columns, setColumns] = useState<ColumnDef[]>(DEFAULT_COLUMNS);
  const [showColSettings, setShowColSettings] = useState(false);
  const [draggedColId, setDraggedColId] = useState<ColumnId | null>(null);
  const [presetView, setPresetView] = useState<string>('Default');
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);
  const [customViews, setCustomViews] = useState<{name: string, columns: ColumnDef[]}[]>([]);
  const [isSavingView, setIsSavingView] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [fabOpen, setFabOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1);
  const [smartFilter, setSmartFilter] = useState<string | null>(null);
  const [ticketFilter, setTicketFilter] = useState<string>('All PRs');
  const [ticketSort, setTicketSort] = useState<string>('Due Date (Earliest first)');
  const [ticketGroup, setTicketGroup] = useState<string>('Status');
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'create-pr'>('dashboard');
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);
  const [newlyInsertedRowId, setNewlyInsertedRowId] = useState<string | null>(null);
  const [ticketFlight, setTicketFlight] = useState<TicketFlightState | null>(null);
  
  // Sidebar State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('sidebarCollapsed');
    // Default to collapsed on tablet
    if (saved === null && window.innerWidth <= 1024 && window.innerWidth > 768) return true;
    return saved ? JSON.parse(saved) : false;
  });

  const [collapsedSidebarGroups, setCollapsedSidebarGroups] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('collapsedSidebarGroups');
    return saved ? JSON.parse(saved) : [];
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem('collapsedSidebarGroups', JSON.stringify(collapsedSidebarGroups));
  }, [collapsedSidebarGroups]);

  const toggleSidebarGroup = (groupId: string) => {
    setCollapsedSidebarGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId) 
        : [...prev, groupId]
    );
  };

  const toggleSidebar = () => {
    if (windowWidth <= 768) {
      setIsMobileMenuOpen(!isMobileMenuOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  const isDesktop = windowWidth > 1024;
  const isTablet = windowWidth <= 1024 && windowWidth > 768;
  const isMobile = windowWidth <= 768;

  const Sidebar = () => {
    const actualSidebarWidth = isMobile ? (isMobileMenuOpen ? 280 : 0) : (isSidebarCollapsed ? 64 : 280);
    
    return (
      <>
        {/* Backdrop for mobile/tablet expanded */}
        <AnimatePresence>
          {((isMobile && isMobileMenuOpen) || (isTablet && !isSidebarCollapsed)) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => isMobile ? setIsMobileMenuOpen(false) : setIsSidebarCollapsed(true)}
              className="fixed inset-0 bg-black/20 z-30 backdrop-blur-[1px]"
            />
          )}
        </AnimatePresence>

        <motion.nav
          initial={false}
          animate={{ 
            width: actualSidebarWidth,
            x: isMobile && !isMobileMenuOpen ? -280 : 0
          }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="fixed left-0 top-0 bottom-0 bg-white border-r border-zinc-200 z-40 flex flex-col overflow-hidden shadow-sm"
        >
          {/* Sidebar Header */}
          <div className="h-16 flex items-center px-4 border-b border-zinc-100 shrink-0">
            <div className="flex items-center gap-3 flex-1 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shrink-0 shadow-sm">
                <LayoutDashboard className="w-4 h-4 text-white" />
              </div>
              {(!isSidebarCollapsed || isMobile) && (
                <span className="text-lg font-bold text-zinc-900 tracking-tight">JUSPAY</span>
              )}
            </div>
            <button 
              onClick={toggleSidebar}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 rounded-md transition-colors"
            >
              {isSidebarCollapsed && !isMobile ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
            {SIDEBAR_GROUPS.map((group, groupIdx) => {
              const isGroupCollapsed = collapsedSidebarGroups.includes(group.id);
              
              return (
                <div key={group.id} className={groupIdx > 0 ? 'mt-4' : ''}>
                  {group.label && (
                    <div className="px-4 mb-1">
                      {(!isSidebarCollapsed || isMobile) ? (
                        <button 
                          onClick={() => toggleSidebarGroup(group.id)}
                          className="w-full flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-[0.05em] hover:text-zinc-600 transition-colors py-2"
                        >
                          <span>{group.label}</span>
                          <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${isGroupCollapsed ? '' : 'rotate-90'}`} />
                        </button>
                      ) : (
                        <div className="h-px bg-zinc-100 my-4 mx-2" />
                      )}
                    </div>
                  )}
                  
                  <AnimatePresence initial={false}>
                    {(!isGroupCollapsed || (isSidebarCollapsed && !isMobile)) && (
                      <motion.div
                        initial={isSidebarCollapsed && !isMobile ? false : { height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        {group.items.map(item => (
                          <SidebarItem 
                            key={item.id} 
                            item={item} 
                            isCollapsed={isSidebarCollapsed && !isMobile} 
                            isActive={item.active} 
                          />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.nav>
      </>
    );
  };

  const toggleGroupCollapse = (groupName: string) => {
    setCollapsedGroups(prev => 
      prev.includes(groupName) 
        ? prev.filter(g => g !== groupName) 
        : [...prev, groupName]
    );
  };
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const searchInputRef = useRef<HTMLInputElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!newlyInsertedRowId) return;
    const timeout = window.setTimeout(() => setNewlyInsertedRowId(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [newlyInsertedRowId]);

  useEffect(() => {
    if (!ticketFlight || ticketFlight.endRect || currentView !== 'dashboard' || viewMode !== 'table') return;

    let raf = 0;
    let attempts = 0;
    const resolveTarget = () => {
      const tableRect = tableContainerRef.current?.getBoundingClientRect();
      if (!tableRect && attempts < 24) {
        attempts += 1;
        raf = window.requestAnimationFrame(resolveTarget);
        return;
      }

      const fallbackTop = Math.max(120, window.innerHeight * 0.2);
      const fallbackLeft = Math.max(32, window.innerWidth * 0.2);

      setTicketFlight((previous) =>
        previous
          ? {
              ...previous,
              endRect: {
                top: tableRect ? tableRect.top + 12 : fallbackTop,
                left: tableRect ? tableRect.left + 16 : fallbackLeft,
                width: 520,
                height: 172,
              },
            }
          : null,
      );
    };

    raf = window.requestAnimationFrame(resolveTarget);
    return () => window.cancelAnimationFrame(raf);
  }, [currentView, ticketFlight, viewMode]);

  useEffect(() => {
    if (!ticketFlight?.endRect) return;

    const timeout = window.setTimeout(() => {
      const insertedPR = ticketFlight.pr;
      setPrData((previous) => [insertedPR, ...previous]);
      setNewlyInsertedRowId(insertedPR.id);
      setTicketFlight(null);
      toast.success('Purchase Request Created!', {
        description: `${insertedPR.id} has been submitted for approval.`,
        action: {
          label: 'View details',
          onClick: () => {
            const match = [insertedPR, ...prData].find((pr) => pr.id === insertedPR.id) ?? insertedPR;
            setSelectedPRForDetails(match);
          },
        },
      });
    }, 1300);

    return () => window.clearTimeout(timeout);
  }, [ticketFlight, prData]);

  const filteredData = useMemo(() => {
    return prData.filter(pr => {
      const matchesSearch = pr.id.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || 
                            pr.vendors.some(v => v.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) ||
                            pr.createdBy.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      
      let matchesCard = true;
      if (viewMode === 'table') {
        if (activeFilter === 'Approval Pending') matchesCard = pr.status === 'Approval Pending';
        else if (activeFilter === 'Approved') matchesCard = pr.status === 'Approved';
        else if (activeFilter === 'Rejected') matchesCard = pr.status === 'Rejected';
        else if (activeFilter === 'Due This Week') {
          const days = getDaysUntil(pr.dueDate);
          matchesCard = days >= 0 && days <= 7;
        }
      } else {
        matchesCard = pr.status === activePipelineStage;
      }

      const matchesAction = needMyAction ? pr.status === 'Approval Pending' : true;
      
      let matchesSmartFilter = true;
      if (smartFilter === 'My Approvals') {
        matchesSmartFilter = pr.status === 'Approval Pending';
      } else if (smartFilter === 'Overdue') {
        matchesSmartFilter = getDaysUntil(pr.dueDate) < 0;
      } else if (smartFilter === 'Due Today') {
        matchesSmartFilter = getDaysUntil(pr.dueDate) === 0;
      } else if (smartFilter === 'High Priority') {
        matchesSmartFilter = pr.amount > 10000;
      }

      return matchesSearch && matchesAction && matchesCard && matchesSmartFilter;
    });
  }, [debouncedSearchQuery, needMyAction, activeFilter, viewMode, activePipelineStage, smartFilter, prData]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpandedRowId(null);
        setSelectedPRForDetails(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const timelineData = useMemo(() => {
    const groups = new Map<string, PurchaseRequest[]>();
    filteredData.forEach(pr => {
      const date = new Date(pr.dueDate);
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!groups.has(monthYear)) {
        groups.set(monthYear, []);
      }
      groups.get(monthYear)!.push(pr);
    });
    
    // Sort groups by date
    const sortedGroups = Array.from(groups.entries()).sort((a, b) => {
      const dateA = new Date(a[0]);
      const dateB = new Date(b[0]);
      return dateA.getTime() - dateB.getTime();
    });
    
    // Sort items within groups by due date
    sortedGroups.forEach(([_, items]) => {
      items.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    });
    
    return sortedGroups;
  }, [filteredData]);

  const ticketData = useMemo(() => {
    let data = [...filteredData];

    // Filter
    if (ticketFilter === 'My PRs') {
      data = data.filter(pr => pr.createdBy === CURRENT_USER);
    } else if (ticketFilter === 'Overdue') {
      data = data.filter(pr => getDaysUntil(pr.dueDate) < 0);
    } else if (ticketFilter === 'This Week') {
      data = data.filter(pr => {
        const days = getDaysUntil(pr.dueDate);
        return days >= 0 && days <= 7;
      });
    } else if (ticketFilter === 'Needs Action') {
      data = data.filter(pr => pr.status === 'Approval Pending');
    }

    // Sort
    data.sort((a, b) => {
      switch (ticketSort) {
        case 'Due Date (Earliest first)':
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'Due Date (Latest first)':
          return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
        case 'Status':
          return a.status.localeCompare(b.status);
        case 'Amount (High to Low)':
          return b.amount - a.amount;
        case 'Recently Created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    // Group
    if (ticketGroup !== 'None') {
      const groups = new Map<string, PurchaseRequest[]>();
      data.forEach(pr => {
        let key = 'Other';
        if (ticketGroup === 'Status') {
          key = pr.status;
        } else if (ticketGroup === 'Creator') {
          key = pr.createdBy;
        } else if (ticketGroup === 'Due Date') {
          const days = getDaysUntil(pr.dueDate);
          if (days < 0) key = 'Overdue';
          else if (days === 0) key = 'Today';
          else if (days <= 7) key = 'This Week';
          else key = 'Later';
        }
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(pr);
      });
      return Array.from(groups.entries());
    }

    return [['All', data]];
  }, [filteredData, ticketFilter, ticketSort, ticketGroup]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, activeFilter, viewMode, activePipelineStage, needMyAction, smartFilter]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') {
          e.target.blur();
        }
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'f':
          setFocusMode(prev => !prev);
          break;
        case 'j':
          setFocusedRowIndex(prev => Math.min(prev + 1, filteredData.length - 1));
          break;
        case 'k':
          setFocusedRowIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'x':
          if (focusedRowIndex >= 0 && focusedRowIndex < filteredData.length) {
            const pr = filteredData[focusedRowIndex];
            const newSet = new Set(selectedRows);
            if (newSet.has(pr.id)) newSet.delete(pr.id);
            else newSet.add(pr.id);
            setSelectedRows(newSet);
          }
          break;
        case 'e':
          if (focusedRowIndex >= 0 && focusedRowIndex < filteredData.length) {
            setSelectedPR(filteredData[focusedRowIndex]);
            setDrawerOpen(true);
          }
          break;
        case 'a':
          if (selectedRows.size > 0) {
            handleBulkAction('approve');
          } else if (focusedRowIndex >= 0 && filteredData[focusedRowIndex].status === 'Approval Pending') {
            handleAction('approve', filteredData[focusedRowIndex].id);
          }
          break;
        case 'r':
          if (selectedRows.size > 0) {
            handleBulkAction('reject');
          } else if (focusedRowIndex >= 0 && filteredData[focusedRowIndex].status === 'Approval Pending') {
            handleAction('reject', filteredData[focusedRowIndex].id);
          }
          break;
        case '/':
          e.preventDefault();
          searchInputRef.current?.focus();
          break;
        case 'escape':
          if (drawerOpen) {
            setDrawerOpen(false);
          } else if (selectedRows.size > 0) {
            setSelectedRows(new Set());
          } else if (focusedRowIndex >= 0) {
            setFocusedRowIndex(-1);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredData, focusedRowIndex, selectedRows, drawerOpen]);

  const rowVirtualizer = useVirtualizer({
    count: paginatedData.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 56,
    overscan: 10,
  });

  const handleExport = () => {
    const dataToExport = selectedRows.size > 0 
      ? prData.filter(pr => selectedRows.has(pr.id))
      : filteredData;
      
    if (dataToExport.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['ID', 'Vendors', 'Status', 'Created By', 'Due Date', 'Created At', 'Amount', 'Department', 'Category'];
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(pr => [
        pr.id,
        `"${pr.vendors.join(', ')}"`,
        pr.status,
        pr.createdBy,
        pr.dueDate,
        pr.createdAt,
        pr.amount,
        pr.department,
        pr.category
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `purchase_requests_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${dataToExport.length} requests`);
  };

  const getNextPRSequence = (data: PurchaseRequest[]) =>
    data.reduce((max, pr) => {
      const match = pr.id.match(/PR-2026-(\d+)/);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0) + 1;

  const buildDashboardPRFromForm = (data: PRFormData, sequence: number): PurchaseRequest => {
    const today = new Date().toISOString().split('T')[0];
    const selectedVendor = MOCK_VENDORS.find((vendor) => vendor.id === data.vendorSelection.selectedVendorId);
    const rfqVendors = MOCK_VENDORS
      .filter((vendor) => data.vendorSelection.rfqVendorIds?.includes(vendor.id))
      .map((vendor) => vendor.name);
    const fallbackVendor = data.vendorSelection.newVendorData?.name?.trim() || 'Vendor TBD';
    const derivedVendors =
      data.vendorSelection.mode === 'existing' && selectedVendor
        ? [selectedVendor.name]
        : data.vendorSelection.mode === 'rfq' && rfqVendors.length > 0
          ? rfqVendors
          : [fallbackVendor];

    return {
      id: `PR-2026-${String(sequence).padStart(3, '0')}`,
      vendors: derivedVendors,
      status: 'Approval Pending',
      createdBy: CURRENT_USER,
      dueDate: data.requiredByDate || today,
      createdAt: today,
      amount: data.totalAmount || data.items.reduce((total, item) => total + item.total, 0),
      department: data.department || 'General',
      category: data.category || 'General Procurement',
      lastUpdated: today,
    };
  };

  const handleCreatePRFromForm = async (data: PRFormData, previewRect?: DOMRect | null) => {
    const nextSequence = getNextPRSequence(prData);
    const newPR = buildDashboardPRFromForm(data, nextSequence);

    const fallbackStartWidth = Math.min(520, Math.max(420, window.innerWidth * 0.34));
    const startRect = previewRect
      ? {
          top: Math.max(80, previewRect.top + 24),
          left: Math.max(20, previewRect.left + 20),
          width: Math.min(520, Math.max(420, previewRect.width - 40)),
          height: 172,
        }
      : {
          top: 140,
          left: Math.max(20, window.innerWidth - fallbackStartWidth - 40),
          width: fallbackStartWidth,
          height: 172,
        };

    await new Promise((resolve) => window.setTimeout(resolve, 450));

    setViewMode('table');
    setCurrentPage(1);
    setCurrentView('dashboard');
    setTicketFlight({
      pr: newPR,
      title: data.title || `${newPR.vendors[0]} procurement request`,
      justification: data.businessJustification || 'No justification provided.',
      firstApprover: data.approvalChain[0]?.role || 'Department Head',
      startRect,
    });
  };

  const handleAIConversationCreate = (requests: AIConversationPRPayload[]) => {
    const nextSequence = getNextPRSequence(prData);
    const today = '2026-03-17';

    const newRecords = requests.map((request, index) => ({
      id: `PR-2026-${String(nextSequence + index).padStart(3, '0')}`,
      vendors: request.vendor.split('+').map((vendor) => vendor.trim()),
      status: 'Approval Pending' as PRStatus,
      createdBy: CURRENT_USER,
      dueDate: request.dueDate,
      createdAt: today,
      amount: request.amount,
      department: request.department,
      category: request.category,
      lastUpdated: today,
    }));

    setPrData((previous) => [...newRecords, ...previous]);
    toast.success(
      requests.length === 1
        ? `${newRecords[0].id} created successfully`
        : `${newRecords.length} purchase requests created successfully`,
    );

    return newRecords.map((record) => record.id);
  };

  const handleAIConversationApprove = (ids: string[]) => {
    const today = '2026-03-17';
    setPrData((previous) =>
      previous.map((pr) =>
        ids.includes(pr.id) ? { ...pr, status: 'Approved', lastUpdated: today } : pr,
      ),
    );
  };

  const handleOpenPurchaseRequest = (id: string) => {
    const match = prData.find((pr) => pr.id === id);
    if (match) {
      setSelectedPRForDetails(match);
      return;
    }
    toast.error(`${id} is not available in the current dashboard state.`);
  };

  const handleCreatePR = (data: any) => {
    const newPR: PurchaseRequest = {
      id: `PR-${Math.floor(Math.random() * 9000) + 1000}`,
      vendors: data.vendors.split(',').map((v: string) => v.trim()),
      status: 'Approval Pending',
      createdBy: CURRENT_USER,
      dueDate: data.dueDate || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
      amount: parseFloat(data.amount) || 0,
      department: data.department,
      category: data.category,
      lastUpdated: new Date().toISOString()
    };
    
    setPrData([newPR, ...prData]);
    setIsCreateModalOpen(false);
    toast.success('Purchase request created successfully');
  };

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        toast.promise(
          new Promise(resolve => setTimeout(resolve, 1500)),
          {
            loading: 'Uploading file...',
            success: `Successfully uploaded ${file.name}`,
            error: 'Failed to upload file'
          }
        );
      }
    };
    input.click();
  };

  const handleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map(pr => pr.id)));
    }
  };

  const handleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(selectedRows);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedRows(newSet);
  };

  const handleRowClick = (pr: PurchaseRequest) => {
    setSelectedPR(pr);
    setDrawerOpen(true);
  };

  const handleCopy = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
  };

  const handleAction = async (action: 'approve' | 'reject', prId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    // Optimistic update
    const previousData = [...prData];
    setPrData(prev => prev.map(pr => {
      if (pr.id === prId) {
        return { ...pr, status: action === 'approve' ? 'Approved' : 'Rejected' };
      }
      return pr;
    }));
    
    // Simulate API call
    try {
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // 10% chance of failure for demonstration
          if (Math.random() < 0.1) reject(new Error('Network error'));
          else resolve(true);
        }, 800);
      });
      toast.success(`PR ${prId} ${action === 'approve' ? 'approved' : 'rejected'} successfully.`);
    } catch (error) {
      // Revert optimistic update
      setPrData(previousData);
      toast.error(
        <div className="flex flex-col gap-2">
          <span className="font-medium">Failed to {action} PR {prId}</span>
          <button 
            onClick={() => handleAction(action, prId)}
            className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded w-fit hover:bg-red-200 transition-colors font-medium"
          >
            Retry Action
          </button>
        </div>,
        { duration: 5000 }
      );
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    const selectedIds = Array.from(selectedRows);
    const previousData = [...prData];
    
    // Optimistic update
    setPrData(prev => prev.map(pr => {
      if (selectedRows.has(pr.id) && pr.status === 'Approval Pending') {
        return { ...pr, status: action === 'approve' ? 'Approved' : 'Rejected' };
      }
      return pr;
    }));
    setSelectedRows(new Set());
    
    // Simulate API call
    try {
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() < 0.1) reject(new Error('Network error'));
          else resolve(true);
        }, 1000);
      });
      toast.success(`${selectedIds.length} PRs ${action === 'approve' ? 'approved' : 'rejected'} successfully.`);
    } catch (error) {
      // Revert optimistic update
      setPrData(previousData);
      setSelectedRows(new Set(selectedIds));
      toast.error(
        <div className="flex flex-col gap-2">
          <span className="font-medium">Failed to process bulk action</span>
          <button 
            onClick={() => handleBulkAction(action)}
            className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded w-fit hover:bg-red-200 transition-colors font-medium"
          >
            Retry Action
          </button>
        </div>,
        { duration: 5000 }
      );
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: PRStatus) => {
    e.preventDefault();
    if (!draggedId) return;
    
    setPrData(prev => prev.map(pr => 
      pr.id === draggedId ? { ...pr, status } : pr
    ));
    setDraggedId(null);
  };

  const handleColDragStart = (e: React.DragEvent, id: ColumnId) => {
    setDraggedColId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleColDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleColDrop = (e: React.DragEvent, targetId: ColumnId) => {
    e.preventDefault();
    if (!draggedColId || draggedColId === targetId) return;

    setColumns(prev => {
      const newCols = [...prev];
      const draggedIdx = newCols.findIndex(c => c.id === draggedColId);
      const targetIdx = newCols.findIndex(c => c.id === targetId);
      
      const [draggedItem] = newCols.splice(draggedIdx, 1);
      newCols.splice(targetIdx, 0, draggedItem);
      return newCols;
    });
    setDraggedColId(null);
  };

  const toggleColumn = (id: ColumnId) => {
    setColumns(prev => prev.map(c => c.id === id && !c.locked ? { ...c, visible: !c.visible } : c));
  };

  const applyPresetView = (preset: string) => {
    const customView = customViews.find(v => v.name === preset);
    if (customView) {
      setColumns(customView.columns);
      setPresetView(preset);
      return;
    }
    if (preset === 'My Approvals') {
      setNeedMyAction(true);
      setActiveFilter('Approval Pending');
      setColumns(DEFAULT_COLUMNS.map(c => ({ ...c, visible: ['id', 'vendors', 'status', 'amount', 'dueDate'].includes(c.id) })));
    } else if (preset === 'Overdue Items') {
      setNeedMyAction(false);
      setActiveFilter('Total PRs');
      setColumns(DEFAULT_COLUMNS.map(c => ({ ...c, visible: ['id', 'vendors', 'status', 'dueDate', 'lastUpdated'].includes(c.id) })));
    } else if (preset === 'Team View') {
      setNeedMyAction(false);
      setActiveFilter('Total PRs');
      setColumns(DEFAULT_COLUMNS.map(c => ({ ...c, visible: ['id', 'vendors', 'status', 'createdBy', 'department'].includes(c.id) })));
    } else if (preset === 'All Columns') {
      setColumns(DEFAULT_COLUMNS.map(c => ({ ...c, visible: true })));
    } else {
      setColumns(DEFAULT_COLUMNS);
    }
    setPresetView(preset);
  };

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [aiChatAttentionRequest, setAiChatAttentionRequest] = useState(0);
  const [assistantWidth, setAssistantWidth] = useState(() => {
    if (typeof window === 'undefined') return 380;
    const stored = localStorage.getItem(ASSISTANT_WIDTH_KEY);
    const parsed = stored ? Number(stored) : 380;
    if (Number.isNaN(parsed)) return 380;
    return Math.min(ASSISTANT_MAX_WIDTH, Math.max(ASSISTANT_MIN_WIDTH, parsed));
  });
  const [isAssistantResizing, setIsAssistantResizing] = useState(false);
  const assistantResizeRef = useRef({ startX: 0, startWidth: 380 });
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', type: 'approval', title: 'New approval request', description: 'PR-2026-045 needs your approval', time: '2 minutes ago', read: false },
    { id: '2', type: 'status', title: 'Status updated', description: 'PR-2026-032 was approved by John Smith', time: '1 hour ago', read: false },
    { id: '3', type: 'comment', title: 'You were mentioned', description: '@you in PR-2026-018: Please review the updated quote', time: '3 hours ago', read: true }
  ]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsShortcutsOpen(false);
        setIsNotificationsOpen(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    localStorage.setItem(ASSISTANT_WIDTH_KEY, String(assistantWidth));
  }, [assistantWidth]);

  useEffect(() => {
    if (!isAssistantResizing) return;

    const handleMouseMove = (event: MouseEvent) => {
      const deltaX = assistantResizeRef.current.startX - event.clientX;
      const hardMaxWidth = Math.max(ASSISTANT_MIN_WIDTH, Math.min(ASSISTANT_MAX_WIDTH, window.innerWidth - 320));
      const nextWidth = Math.min(
        hardMaxWidth,
        Math.max(ASSISTANT_MIN_WIDTH, assistantResizeRef.current.startWidth + deltaX),
      );
      setAssistantWidth(nextWidth);
    };

    const handleMouseUp = () => {
      setIsAssistantResizing(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isAssistantResizing]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const assistantPanelWidth = Math.min(
    Math.max(assistantWidth, ASSISTANT_MIN_WIDTH),
    Math.max(ASSISTANT_MIN_WIDTH, Math.min(ASSISTANT_MAX_WIDTH, windowWidth - 320)),
  );

  const handleMarkRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const mainMarginLeft = isMobile ? 0 : (isSidebarCollapsed ? 64 : (isTablet ? 64 : 280));

  if (currentView === 'create-pr') {
    return (
      <>
        <CreatePRPage
          onBack={() => setCurrentView('dashboard')}
          onSubmitForApproval={handleCreatePRFromForm}
        />
        <Toaster position="top-right" richColors />
      </>
    );
  }

  return (
    <div className="h-screen bg-zinc-50 font-sans text-zinc-900 flex overflow-hidden">
      <Toaster position="top-right" />
      
      <Sidebar />

      <motion.div 
        animate={{ marginLeft: mainMarginLeft }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="flex-1 flex h-screen min-w-0 flex-col overflow-hidden"
      >
        {/* Header */}
        <header className="bg-white border-b border-zinc-200 px-6 flex items-center justify-between sticky top-0 z-20 h-14">
          <div className="flex items-center gap-6 h-full">
            {isMobile && (
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 -ml-2 text-zinc-600 hover:bg-zinc-50 rounded-md"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            {/* Global Search Trigger */}
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="hidden md:flex items-center gap-3 w-60 h-9 px-3 bg-zinc-100/50 border border-zinc-200 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:border-zinc-300 transition-all group"
            >
              <Search className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600" />
              <span className="text-sm flex-1 text-left">Search</span>
              <kbd className="text-[10px] font-mono text-zinc-400 bg-white px-1.5 py-0.5 rounded border border-zinc-200">⌘K</kbd>
            </button>
            
            <div className="h-6 w-px bg-zinc-200 hidden md:block"></div>
          </div>

          <div className="flex items-center gap-2">
          {/* Shortcuts */}
          <div className="relative">
            <button 
              onClick={() => setIsShortcutsOpen(!isShortcutsOpen)}
              className={`p-2 rounded-lg transition-colors ${isShortcutsOpen ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'}`}
              title="Keyboard shortcuts"
            >
              <Keyboard className="w-5 h-5" />
            </button>
            <ShortcutsPopover isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
          </div>

          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className={`p-2 rounded-lg transition-colors relative ${isNotificationsOpen ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'}`}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </button>
            <NotificationsPopover 
              isOpen={isNotificationsOpen} 
              onClose={() => setIsNotificationsOpen(false)} 
              notifications={notifications}
              onMarkRead={handleMarkRead}
            />
          </div>

          <div className="h-6 w-px bg-zinc-200 mx-1"></div>

          {/* AI Assistant Trigger */}
          <BlendButton
            buttonType={BlendButtonType.SECONDARY}
            size={BlendButtonSize.SMALL}
            text="Ask Xyne AI"
            leadingIcon={<img src={xyneLogo} alt="" className="h-4 w-4" aria-hidden="true" />}
            onClick={() => {
              if (isAIChatOpen) {
                setAiChatAttentionRequest((value) => value + 1);
                return;
              }
              setIsAIChatOpen(true);
            }}
            aria-label="Ask Xyne AI"
          />

          <div className="h-6 w-px bg-zinc-200 mx-1"></div>

          <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-100 transition-all">
            <User className="w-4 h-4 text-blue-700" />
          </div>
        </div>
      </header>

        {/* Main Content + Assistant */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
        <main
          className={`custom-scrollbar relative flex w-full flex-1 min-h-0 flex-col gap-6 overflow-y-auto p-6 ${
            isAIChatOpen && !isMobile ? 'max-w-none' : 'max-w-[1600px] mx-auto'
          }`}
        >
        <AnimatePresence>
          {ticketFlight && ticketFlight.endRect && (
            <motion.div
              key={ticketFlight.pr.id}
              initial={{
                top: ticketFlight.startRect.top,
                left: ticketFlight.startRect.left,
                width: ticketFlight.startRect.width,
                height: ticketFlight.startRect.height,
                scale: 1,
                opacity: 1,
              }}
              animate={{
                top: ticketFlight.endRect.top,
                left: ticketFlight.endRect.left,
                width: ticketFlight.endRect.width,
                height: ticketFlight.endRect.height,
                scale: 1,
                opacity: 1,
              }}
              transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
              className="pointer-events-none fixed z-[10000] overflow-hidden rounded-xl border border-zinc-200 bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.18)]"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="font-mono text-sm font-semibold text-zinc-700">{ticketFlight.pr.id}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                    To Do
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-500">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(ticketFlight.pr.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </span>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-xs font-bold text-white">
                    {ticketFlight.pr.department.charAt(0)}
                  </span>
                </div>
              </div>

              <h3 className="mt-4 line-clamp-1 text-lg font-semibold text-zinc-900">{ticketFlight.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-zinc-600">{ticketFlight.justification}</p>

              <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
                <span>Assigned to: {ticketFlight.firstApprover}</span>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-zinc-100 px-2 py-1">{ticketFlight.pr.department}</span>
                  <span className="rounded-md bg-zinc-100 px-2 py-1">{ticketFlight.pr.category}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Purchase Requests</h1>
            <p className="text-sm text-zinc-500 mt-1">Manage, track, and approve procurement requests across your organization.</p>
          </div>
          <div className="flex items-center gap-3">
            <BlendButton
              buttonType={BlendButtonType.SECONDARY}
              size={BlendButtonSize.MEDIUM}
              text="Export Data"
              leadingIcon={<Download className="h-4 w-4" />}
              onClick={handleExport}
            />
            <BlendButton
              buttonType={BlendButtonType.PRIMARY}
              size={BlendButtonSize.MEDIUM}
              text="Create PR"
              leadingIcon={<Plus className="h-4 w-4" />}
              onClick={() => setCurrentView('create-pr')}
            />
          </div>
        </div>

        {/* Stat Cards - Always Visible */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 shrink-0">
          {statCards.map((card) => {
            const Icon = card.icon;
            const isActive = activeFilter === card.id;
            return (
              <button
                key={card.id}
                onClick={() => setActiveFilter(card.id as FilterType)}
                className={`text-left rounded-xl bg-white border transition-all p-3
                  ${isActive ? 'border-blue-200 shadow-md ring-1 ring-blue-100' : 'border-zinc-200 hover:border-zinc-300 shadow-sm'}
                `}
              >
                <BlendStatCard
                  title={card.title}
                  value={card.count}
                  subtitle={card.subtitle}
                  variant={BlendStatCardVariant.NUMBER}
                  titleIcon={
                    <div className={`rounded-lg p-1.5 ${card.bgColor}`}>
                      <Icon className={`h-4 w-4 ${card.color}`} />
                    </div>
                  }
                />
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
        
        {viewMode === 'pipeline' && (
          <motion.div 
            key="pipeline-stepper"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
            className="bg-white rounded-xl border border-zinc-200 p-4 shrink-0 overflow-x-auto shadow-sm"
          >
            <div className="flex items-center min-w-max gap-2">
              {pipelineStages.map((stage, idx) => {
                const isActive = activePipelineStage === stage.id;
                
                return (
                  <React.Fragment key={stage.id}>
                    <button
                      onClick={() => setActivePipelineStage(stage.id as PRStatus)}
                      className={`flex items-center gap-2 px-4 h-10 rounded-full border transition-colors ${
                        isActive 
                          ? 'bg-blue-600 border-blue-600 text-white' 
                          : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50'
                      }`}
                    >
                      <span className="font-medium text-sm whitespace-nowrap">{stage.label}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        isActive 
                          ? 'bg-white/20 text-white' 
                          : 'bg-zinc-100 text-zinc-600'
                      }`}>
                        {stage.count}
                      </span>
                    </button>
                    
                    {idx < pipelineStages.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-zinc-400 mx-1" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </motion.div>
        )}
        </AnimatePresence>

        <AnimatePresence mode="popLayout">
          {(viewMode === 'table' || viewMode === 'pipeline') && (
            <motion.div 
              key="table-view"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
              className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col flex-1 min-h-[400px]"
            >
              
              {/* Toolbar */}
          <div className="p-4 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
            <div className="flex items-center gap-3 flex-1">
              <div className="max-w-md w-full">
                <BlendSearchInput
                  ref={searchInputRef}
                  placeholder="Search PR number, vendor, or requester..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  allowClear
                />
              </div>
              
              <div className="h-6 w-px bg-zinc-200 mx-1 hidden sm:block"></div>
              
              <div className="hidden sm:flex items-center gap-2">
                <BlendButton
                  onClick={() => setNeedMyAction(!needMyAction)}
                  buttonType={needMyAction ? BlendButtonType.PRIMARY : BlendButtonType.SECONDARY}
                  size={BlendButtonSize.MEDIUM}
                  text={`Need My Action`}
                  leadingIcon={<Bell className="h-4 w-4" />}
                />
                <BlendTag
                  text="3"
                  color={needMyAction ? BlendTagColor.PRIMARY : BlendTagColor.NEUTRAL}
                  variant={BlendTagVariant.SUBTLE}
                  size={BlendTagSize.SM}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <BlendButton
                  onClick={() => setShowPresetDropdown(!showPresetDropdown)}
                  buttonType={BlendButtonType.SECONDARY}
                  size={BlendButtonSize.MEDIUM}
                  text={`View: ${presetView}`}
                  leadingIcon={<Filter className="h-4 w-4" />}
                  trailingIcon={<ChevronDown className="h-4 w-4" />}
                />
                {showPresetDropdown && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-zinc-200 rounded-lg shadow-lg z-30 py-1">
                    {['Default', 'My Approvals', 'Overdue Items', 'Team View', 'All Columns', ...customViews.map(v => v.name)].map(preset => (
                      <button
                        key={preset}
                        onClick={() => { applyPresetView(preset); setShowPresetDropdown(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <BlendButton
                buttonType={BlendButtonType.SECONDARY}
                size={BlendButtonSize.MEDIUM}
                text="Date"
                leadingIcon={<Calendar className="h-4 w-4" />}
                trailingIcon={<ChevronDown className="h-4 w-4" />}
              />
              <BlendButton
                onClick={() => setShowColSettings(!showColSettings)}
                buttonType={BlendButtonType.SECONDARY}
                size={BlendButtonSize.MEDIUM}
                leadingIcon={<Settings className="h-4 w-4" />}
                title="Table Settings"
              />
            </div>
          </div>

          {/* Smart Filters */}
          {viewMode === 'table' && (
            <div className="px-4 py-2 bg-zinc-50/50 border-b border-zinc-200 flex items-center gap-2 overflow-x-auto shrink-0">
              {['My Approvals', 'Overdue', 'Due Today', 'High Priority'].map(filter => (
                <BlendButton
                  key={filter}
                  onClick={() => setSmartFilter(smartFilter === filter ? null : filter)}
                  buttonType={smartFilter === filter ? BlendButtonType.PRIMARY : BlendButtonType.SECONDARY}
                  size={BlendButtonSize.SMALL}
                  text={filter}
                />
              ))}
            </div>
          )}

          {/* Bulk Actions Bar (shows when items selected) */}
          {selectedRows.size > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-blue-600 shadow-xl rounded-xl px-4 py-3 flex items-center justify-between gap-6 animate-in fade-in slide-in-from-bottom-4 z-30">
              <span className="text-sm font-medium text-white whitespace-nowrap">
                {selectedRows.size} items selected
              </span>
              <div className="w-px h-4 bg-blue-400"></div>
              <div className="flex items-center gap-2">
                <BlendButton
                  onClick={() => handleBulkAction('approve')}
                  buttonType={BlendButtonType.SECONDARY}
                  size={BlendButtonSize.SMALL}
                  text="Bulk Approve"
                />
                <BlendButton
                  onClick={() => handleBulkAction('reject')}
                  buttonType={BlendButtonType.SECONDARY}
                  size={BlendButtonSize.SMALL}
                  text="Bulk Reject"
                />
                <BlendButton
                  onClick={handleExport}
                  buttonType={BlendButtonType.SECONDARY}
                  size={BlendButtonSize.SMALL}
                  text="Export Selected"
                />
              </div>
            </div>
          )}

          {/* Table Container */}
          <div ref={tableContainerRef} className="pr-table flex-1 overflow-auto hidden md:block">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-zinc-200 z-10">
                <tr>
                  <th className="px-3 py-3 w-12 text-center">
                    <button onClick={handleSelectAll} className="text-zinc-400 hover:text-zinc-600 focus:outline-none">
                      {selectedRows.size === paginatedData.length && paginatedData.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : selectedRows.size > 0 ? (
                        <div className="w-4 h-4 border-2 border-blue-600 rounded-[3px] bg-blue-600 flex items-center justify-center">
                          <div className="w-2 h-0.5 bg-white rounded-full"></div>
                        </div>
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  {columns.filter(c => c.visible).map(col => (
                    <th key={col.id} className="px-3 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                      {col.label}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span>Actions</span>
                      <div className="relative">
                        {/* Column Settings Dropdown */}
                        <AnimatePresence>
                          {showColSettings && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute right-0 top-full mt-2 w-64 bg-zinc-50 border border-zinc-200 rounded-xl shadow-lg z-50 overflow-hidden flex flex-col text-left"
                            >
                              <div className="p-3 border-b border-zinc-200 bg-white flex items-center justify-between">
                                <span className="text-sm font-semibold text-zinc-900">Customize Columns</span>
                                <button onClick={() => setShowColSettings(false)} className="text-zinc-400 hover:text-zinc-600">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="max-h-64 overflow-y-auto p-2 flex flex-col gap-1">
                                {columns.map(col => (
                                  <div 
                                    key={col.id}
                                    draggable={!col.locked}
                                    onDragStart={(e) => handleColDragStart(e, col.id)}
                                    onDragOver={handleColDragOver}
                                    onDrop={(e) => handleColDrop(e, col.id)}
                                    className={`flex items-center gap-2 p-2 rounded-lg ${col.locked ? 'opacity-60' : 'hover:bg-zinc-100 cursor-grab active:cursor-grabbing'} ${draggedColId === col.id ? 'opacity-50 bg-zinc-200' : ''}`}
                                  >
                                    <GripVertical className={`w-4 h-4 ${col.locked ? 'text-zinc-300' : 'text-zinc-400'}`} />
                                    <button 
                                      onClick={() => toggleColumn(col.id)}
                                      disabled={col.locked}
                                      className="flex items-center justify-center w-4 h-4 rounded border border-zinc-300 bg-white text-blue-600 focus:outline-none disabled:opacity-50"
                                    >
                                      {col.visible && <Check className="w-3 h-3" />}
                                    </button>
                                    <span className="text-sm text-zinc-700 flex-1 text-left">{col.label}</span>
                                    {col.locked && <span className="text-[10px] font-medium text-zinc-500 uppercase">Locked</span>}
                                  </div>
                                ))}
                              </div>
                              <div className="p-3 border-t border-zinc-200 bg-white">
                                {isSavingView ? (
                                  <div className="flex items-center gap-2">
                                    <input 
                                      type="text" 
                                      value={newViewName}
                                      onChange={(e) => setNewViewName(e.target.value)}
                                      placeholder="View name..."
                                      className="flex-1 px-2 py-1.5 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newViewName.trim()) {
                                          setCustomViews(prev => [...prev, { name: newViewName.trim(), columns: [...columns] }]);
                                          setPresetView(newViewName.trim());
                                          setIsSavingView(false);
                                          setNewViewName('');
                                        }
                                      }}
                                    />
                                    <button 
                                      onClick={() => {
                                        if (newViewName.trim()) {
                                          setCustomViews(prev => [...prev, { name: newViewName.trim(), columns: [...columns] }]);
                                          setPresetView(newViewName.trim());
                                          setIsSavingView(false);
                                          setNewViewName('');
                                        }
                                      }}
                                      className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => { setIsSavingView(false); setNewViewName(''); }}
                                      className="p-1.5 bg-zinc-100 text-zinc-600 rounded-md hover:bg-zinc-200"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => setIsSavingView(true)}
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                                  >
                                    <Save className="w-4 h-4" />
                                    Save as View
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="animate-pulse h-14">
                      <td className="px-3 py-3"><div className="h-4 bg-zinc-200 rounded w-4"></div></td>
                      {columns.filter(c => c.visible).map(col => (
                        <td key={col.id} className="px-3 py-3">
                          <div className="h-4 bg-zinc-200 rounded w-3/4"></div>
                        </td>
                      ))}
                      <td className="px-3 py-3"><div className="h-4 bg-zinc-200 rounded w-12 ml-auto"></div></td>
                    </tr>
                  ))
                ) : paginatedData.length > 0 ? (
                  <>
                    {rowVirtualizer.getVirtualItems().length > 0 && (
                      <tr style={{ height: `${rowVirtualizer.getVirtualItems()[0].start}px` }} />
                    )}
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                      const idx = virtualRow.index;
                      const pr = paginatedData[idx];
                      const isActionable = pr.status === 'Approval Pending' || getDaysUntil(pr.dueDate) <= 3;
                      const isFocused = focusedRowIndex === idx;
                      const focusStyle = focusMode && !isActionable ? 'opacity-40 bg-zinc-50' : '';
                      const keyboardFocusStyle = isFocused ? 'ring-2 ring-inset ring-blue-500 bg-blue-50/30' : '';
                      
                      return (
                      <tr 
                        key={pr.id} 
                        onClick={() => handleRowClick(pr)}
                        ref={rowVirtualizer.measureElement}
                        data-index={virtualRow.index}
                        className={`group cursor-pointer transition-colors h-14 ${selectedRows.has(pr.id) ? 'bg-blue-50' : 'hover:bg-zinc-50'} ${focusStyle} ${keyboardFocusStyle} ${pr.id === newlyInsertedRowId ? 'pr-new-row' : ''}`}
                      >
                      <td className="px-3 py-3 text-center" onClick={(e) => handleSelectRow(pr.id, e)}>
                        <button className="text-zinc-300 group-hover:text-zinc-400 focus:outline-none">
                          {selectedRows.has(pr.id) ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      {columns.filter(c => c.visible).map(col => {
                        if (col.id === 'id') return (
                          <td key={col.id} className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[13px] text-zinc-900">{pr.id}</span>
                              <button 
                                onClick={(e) => handleCopy(pr.id, e)}
                                className="text-zinc-400 hover:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Copy PR Number"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        );
                        if (col.id === 'vendors') return (
                          <td key={col.id} className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[10px] font-medium text-zinc-600">
                                {pr.vendors[0].charAt(0)}
                              </div>
                              <span className="text-[14px] font-normal text-zinc-900">{pr.vendors[0]}</span>
                              {pr.vendors.length > 1 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600">
                                  +{pr.vendors.length - 1} more
                                </span>
                              )}
                            </div>
                          </td>
                        );
                        if (col.id === 'status') return (
                          <td key={col.id} className="px-3 py-3">
                            {getStatusBadge(pr.status)}
                          </td>
                        );
                        if (col.id === 'createdBy') return (
                          <td key={col.id} className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-[10px] font-medium text-blue-700">
                                {pr.createdBy.charAt(0)}
                              </div>
                              <span className="text-[14px] font-normal text-zinc-900">{pr.createdBy}</span>
                            </div>
                          </td>
                        );
                        if (col.id === 'dueDate') return (
                          <td key={col.id} className="px-3 py-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium border ${getDueDateColor(pr.dueDate)}`}>
                              {formatRelativeDate(pr.dueDate)}
                            </span>
                          </td>
                        );
                        if (col.id === 'createdAt') return (
                          <td key={col.id} className="px-3 py-3 text-[14px] font-normal text-zinc-900">
                            {new Date(pr.createdAt).toLocaleDateString()}
                          </td>
                        );
                        if (col.id === 'amount') return (
                          <td key={col.id} className="px-3 py-3 text-[14px] font-normal text-zinc-900">
                            ${pr.amount.toLocaleString()}
                          </td>
                        );
                        if (col.id === 'department') return (
                          <td key={col.id} className="px-3 py-3 text-[14px] font-normal text-zinc-900">
                            {pr.department}
                          </td>
                        );
                        if (col.id === 'category') return (
                          <td key={col.id} className="px-3 py-3 text-[14px] font-normal text-zinc-900">
                            {pr.category}
                          </td>
                        );
                        if (col.id === 'lastUpdated') return (
                          <td key={col.id} className="px-3 py-3 text-[14px] font-normal text-zinc-900">
                            {new Date(pr.lastUpdated).toLocaleDateString()}
                          </td>
                        );
                        return null;
                      })}
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {pr.status === 'Approval Pending' ? (
                            <>
                              <button 
                                onClick={(e) => handleAction('approve', pr.id, e)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                                title="Approve"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={(e) => handleAction('reject', pr.id, e)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                title="Reject"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button 
                              onClick={(e) => { e.stopPropagation(); }}
                              className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    )})}
                    {rowVirtualizer.getVirtualItems().length > 0 && (
                      <tr style={{ height: `${rowVirtualizer.getTotalSize() - rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1].end}px` }} />
                    )}
                  </>
                ) : (
                  <tr>
                    <td colSpan={columns.filter(c => c.visible).length + 2} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-zinc-500">
                        <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                          <Search className="w-8 h-8 text-zinc-400" />
                        </div>
                        <h3 className="text-lg font-medium text-zinc-900 mb-1">No purchase requests found</h3>
                        <p className="text-sm max-w-sm text-center">
                          We couldn't find any items matching your current filters and search query. Try adjusting them to see more results.
                        </p>
                        <button 
                          onClick={() => {
                            setSearchQuery('');
                            setSmartFilter(null);
                            setActiveFilter('Total PRs');
                          }}
                          className="mt-4 px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors shadow-sm"
                        >
                          Clear all filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden flex-1 overflow-y-auto flex flex-col gap-4 p-4">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-zinc-200 animate-pulse">
                  <div className="flex justify-between mb-3">
                    <div className="h-4 bg-zinc-200 rounded w-1/3"></div>
                    <div className="h-5 bg-zinc-200 rounded-full w-20"></div>
                  </div>
                  <div className="h-4 bg-zinc-200 rounded w-2/3 mb-2"></div>
                  <div className="h-4 bg-zinc-200 rounded w-1/2 mb-4"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-6 bg-zinc-200 rounded-full w-24"></div>
                    <div className="h-5 bg-zinc-200 rounded w-16"></div>
                  </div>
                </div>
              ))
            ) : paginatedData.length > 0 ? (
              paginatedData.map(pr => (
                <div key={pr.id} onClick={() => handleRowClick(pr)} className={`bg-white p-4 rounded-xl shadow-sm border border-zinc-200 active:bg-zinc-50 transition-colors ${pr.id === newlyInsertedRowId ? 'pr-new-row' : ''}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-zinc-900">{pr.id}</span>
                    {getStatusBadge(pr.status)}
                  </div>
                  <div className="font-semibold text-zinc-900 mb-1">{pr.vendors.join(', ')}</div>
                  <div className="text-sm text-zinc-500 mb-3">{pr.department} • {pr.category}</div>
                  <div className="flex justify-between items-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getDueDateColor(pr.dueDate)}`}>
                      {formatRelativeDate(pr.dueDate)}
                    </span>
                    <span className="font-medium text-zinc-900">${pr.amount.toLocaleString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                <Search className="w-8 h-8 text-zinc-300 mb-3" />
                <p className="text-sm font-medium text-zinc-900">No purchase requests found</p>
                <p className="text-xs mt-1">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
          
          {/* Pagination Footer */}
          <div className="border-t border-zinc-200 px-4 py-3 flex items-center justify-between bg-white">
            <span className="text-sm text-zinc-500">
              Showing <span className="font-medium text-zinc-900">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredData.length)}</span> to <span className="font-medium text-zinc-900">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> of <span className="font-medium text-zinc-900">{filteredData.length}</span> results
            </span>
            <div className="flex items-center gap-2">
              <BlendButton
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                buttonType={BlendButtonType.SECONDARY}
                size={BlendButtonSize.SMALL}
                text="Previous"
              />
              <BlendButton
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                buttonType={BlendButtonType.SECONDARY}
                size={BlendButtonSize.SMALL}
                text="Next"
              />
            </div>
          </div>
        </motion.div>
        )}

        {viewMode === 'consolidated' && (
          <motion.div 
            key="consolidated-view"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col flex-1 min-h-[400px]"
          >
            <ConsolidatedTableView 
              data={paginatedData}
              selectedRows={selectedRows}
              onSelectRow={(id) => {
                const newSelected = new Set(selectedRows);
                if (newSelected.has(id)) newSelected.delete(id);
                else newSelected.add(id);
                setSelectedRows(newSelected);
              }}
              onSelectAll={() => {
                if (selectedRows.size === paginatedData.length) setSelectedRows(new Set());
                else setSelectedRows(new Set(paginatedData.map(pr => pr.id)));
              }}
              expandedRowId={expandedRowId}
              onToggleExpand={(id) => setExpandedRowId(expandedRowId === id ? null : id)}
              onViewDetails={(pr) => setSelectedPRForDetails(pr)}
            />
          </motion.div>
        )}

        {viewMode === 'kanban' && (
          <motion.div 
            key="kanban-view"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
            className="flex-1 flex gap-4 overflow-x-auto pb-4 min-h-[500px]"
          >
            {KANBAN_COLUMNS.map(col => {
              const columnPRs = filteredData.filter(pr => pr.status === col.id);
              return (
                <div 
                  key={col.id}
                  className={`flex-1 min-w-[320px] max-w-[400px] flex flex-col rounded-xl border border-zinc-200 ${col.bgColor}`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col.id)}
                >
                  <div className="p-3 border-b border-zinc-200 flex items-center justify-between bg-white/50 rounded-t-xl">
                    <h3 className={`text-sm font-semibold ${col.headerColor}`}>{col.label}</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white border border-zinc-200 text-zinc-600 shadow-sm">
                      {columnPRs.length}
                    </span>
                  </div>
                  
                  <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-3">
                    {isLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-zinc-200 animate-pulse h-32">
                          <div className="h-3 bg-zinc-200 rounded w-1/4 mb-2"></div>
                          <div className="h-4 bg-zinc-200 rounded w-3/4 mb-4"></div>
                          <div className="flex justify-between">
                            <div className="h-4 bg-zinc-200 rounded w-1/3"></div>
                            <div className="h-5 w-5 bg-zinc-200 rounded-full"></div>
                          </div>
                        </div>
                      ))
                    ) : columnPRs.length > 0 ? (
                      columnPRs.map(pr => (
                      <div
                        key={pr.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, pr.id)}
                        onClick={() => handleRowClick(pr)}
                        className={`bg-white p-4 rounded-lg shadow-sm border border-zinc-200 cursor-grab active:cursor-grabbing relative group hover:border-blue-300 hover:shadow-md transition-all ${draggedId === pr.id ? 'opacity-50 border-blue-500' : ''}`}
                      >
                        {/* Quick Actions */}
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-md shadow-sm border border-zinc-100 p-0.5">
                          {pr.status === 'Approval Pending' && (
                            <>
                              <button 
                                onClick={(e) => handleAction('approve', pr.id, e)}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                title="Approve"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={(e) => handleAction('reject', pr.id, e)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Reject"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); }}
                            className="p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded transition-colors"
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-xs font-medium text-zinc-500 mb-1">{pr.id}</div>
                        <div className="font-semibold text-zinc-900 text-sm mb-3 pr-16 line-clamp-2">
                          {pr.vendors.join(', ')}
                        </div>
                        
                        <div className="flex items-center justify-between mb-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium border ${getDueDateColor(pr.dueDate)}`}>
                            {formatRelativeDate(pr.dueDate)}
                          </span>
                          
                          <div className="flex items-center gap-1.5" title={`Created by ${pr.createdBy}`}>
                            <div className="w-5 h-5 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-medium text-zinc-600 border border-zinc-200">
                              {pr.createdBy.charAt(0)}
                            </div>
                          </div>
                        </div>

                        {/* Mini Timeline */}
                        <div className="flex items-center gap-1">
                          {['Draft', 'Approval Pending', 'Approved', 'PO Created'].map((step, i) => {
                            const statuses = ['Draft', 'Approval Pending', 'Approved', 'PO Created'];
                            const currentIdx = statuses.indexOf(pr.status === 'Rejected' ? 'Approval Pending' : pr.status);
                            const isCompleted = currentIdx >= i;
                            const isRejected = pr.status === 'Rejected' && i === 1;
                            
                            return (
                              <div 
                                key={step} 
                                className={`h-1.5 flex-1 rounded-full ${
                                  isRejected ? 'bg-red-500' :
                                  isCompleted ? 'bg-blue-500' : 'bg-zinc-100'
                                }`}
                                title={step}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex-1 flex items-center justify-center border-2 border-dashed border-zinc-200 rounded-lg bg-white/50 text-zinc-400 text-sm font-medium">
                      Drop here
                    </div>
                  )}
                </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {viewMode === 'timeline' && (
          <motion.div 
            key="timeline-view"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
            className="flex-1 overflow-y-auto bg-white rounded-xl border border-zinc-200 shadow-sm p-6 min-h-[500px]"
          >
            <div className="max-w-3xl mx-auto">
              {timelineData.length > 0 ? (
                <div className="relative border-l-2 border-zinc-100 ml-3 md:ml-6 space-y-8 pb-8">
                  {timelineData.map(([monthYear, items]) => (
                    <div key={monthYear} className="relative">
                      <div className="absolute -left-[35px] md:-left-[47px] bg-white p-1">
                        <div className="w-4 h-4 rounded-full border-2 border-blue-500 bg-white"></div>
                      </div>
                      <h3 className="text-sm font-bold text-zinc-900 mb-4 ml-6 uppercase tracking-wider">{monthYear}</h3>
                      <div className="space-y-4 ml-6">
                        {items.map(pr => (
                          <div 
                            key={pr.id}
                            onClick={() => handleRowClick(pr)}
                            className="group bg-white border border-zinc-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-[13px] font-medium text-zinc-900">{pr.id}</span>
                                {getStatusBadge(pr.status)}
                              </div>
                              <span className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium border ${getDueDateColor(pr.dueDate)}`}>
                                <Calendar className="w-3 h-3 mr-1" />
                                {formatRelativeDate(pr.dueDate)}
                              </span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[10px] font-medium text-zinc-600">
                                    {pr.vendors[0].charAt(0)}
                                  </div>
                                  <span className="text-sm text-zinc-700">{pr.vendors[0]}</span>
                                  {pr.vendors.length > 1 && (
                                    <span className="text-[11px] text-zinc-500">+{pr.vendors.length - 1}</span>
                                  )}
                                </div>
                                <div className="hidden sm:block w-1 h-1 rounded-full bg-zinc-300"></div>
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-[10px] font-medium text-blue-700">
                                    {pr.createdBy.charAt(0)}
                                  </div>
                                  <span className="text-sm text-zinc-700">{pr.createdBy}</span>
                                </div>
                              </div>
                              <span className="text-sm font-semibold text-zinc-900">${pr.amount.toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                  <Calendar className="w-12 h-12 text-zinc-200 mb-4" />
                  <p className="text-base font-medium text-zinc-900">No timeline data available</p>
                  <p className="text-sm mt-1">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {viewMode === 'ticket' && (
          <motion.div 
            key="ticket-view"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col gap-4 overflow-y-auto min-h-[500px]"
          >
            {/* Ticket View Toolbar */}
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                {['All PRs', 'My PRs', 'Overdue', 'This Week', 'Needs Action'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setTicketFilter(filter)}
                    aria-pressed={ticketFilter === filter}
                    aria-label={`Filter by ${filter}`}
                    className={`px-4 h-[36px] inline-flex items-center rounded-full text-sm font-medium whitespace-nowrap transition-all border outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                      ticketFilter === filter 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                        : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select 
                    value={ticketSort}
                    onChange={(e) => setTicketSort(e.target.value)}
                    className="appearance-none h-[36px] pl-3 pr-10 bg-white border border-zinc-300 rounded-lg text-sm font-medium text-zinc-700 hover:border-zinc-400 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option>Due Date (Earliest first)</option>
                    <option>Due Date (Latest first)</option>
                    <option>Status</option>
                    <option>Amount (High to Low)</option>
                    <option>Recently Created</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                </div>
                <div className="relative">
                  <select 
                    value={ticketGroup}
                    onChange={(e) => setTicketGroup(e.target.value)}
                    className="appearance-none h-[36px] pl-3 pr-10 bg-white border border-zinc-300 rounded-lg text-sm font-medium text-zinc-700 hover:border-zinc-400 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option>None</option>
                    <option>Status</option>
                    <option>Due Date</option>
                    <option>Creator</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Ticket Grid */}
            <div className="space-y-8 pb-8">
              {isLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg border border-zinc-200 p-5 h-[220px] animate-pulse flex flex-col">
                      <div className="flex justify-between mb-4">
                        <div className="flex gap-2">
                          <div className="w-4 h-4 bg-zinc-100 rounded" />
                          <div className="h-4 w-24 bg-zinc-100 rounded" />
                        </div>
                        <div className="h-6 w-20 bg-zinc-100 rounded-full" />
                      </div>
                      <div className="h-6 w-48 bg-zinc-100 rounded mb-6" />
                      <div className="flex justify-between my-4 px-1">
                        {[...Array(5)].map((_, j) => (
                          <div key={j} className="h-3 w-3 bg-zinc-100 rounded-full" />
                        ))}
                      </div>
                      <div className="flex gap-4 mt-auto pt-4 border-t border-zinc-50">
                        <div className="h-4 w-24 bg-zinc-100 rounded" />
                        <div className="h-4 w-24 bg-zinc-100 rounded" />
                        <div className="h-4 w-24 bg-zinc-100 rounded ml-auto" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : ticketData.length > 0 ? ticketData.map(([groupName, items]: [string, PurchaseRequest[]]) => {
                const isGroupCollapsed = collapsedGroups.includes(groupName);
                
                return (
                  <div key={groupName} className="space-y-4">
                    {ticketGroup !== 'None' && (
                      <div 
                        onClick={() => toggleGroupCollapse(groupName)}
                        className="flex items-center justify-between px-1 pb-2 border-b border-zinc-200 cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-[0.1em]">{groupName}</h3>
                          <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 text-[11px] font-bold">{items.length}</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isGroupCollapsed ? '-rotate-90' : ''}`} />
                      </div>
                    )}
                    
                    <AnimatePresence>
                      {!isGroupCollapsed && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                            {items.map(pr => {
                              const isExpanded = expandedTicketId === pr.id;
                              const daysUntil = getDaysUntil(pr.dueDate);
                              const isOverdue = daysUntil < 0;
                              const isDueSoon = daysUntil >= 0 && daysUntil <= 7;
                              const isActionable = pr.status === 'Approval Pending';
                              
                              const stages = ['Draft', 'Approval Pending', 'Approved', 'PO Created', 'Bill Received'];
                              const currentStageIndex = stages.indexOf(pr.status);
                              const activeIndex = currentStageIndex >= 0 ? currentStageIndex : (pr.status === 'Rejected' ? 1 : 4);

                              return (
                                <div 
                                  key={pr.id}
                                  onClick={() => setExpandedTicketId(isExpanded ? null : pr.id)}
                                  role="button"
                                  aria-expanded={isExpanded}
                                  aria-label={`Ticket ${pr.id} for ${pr.vendors[0]}`}
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      setExpandedTicketId(isExpanded ? null : pr.id);
                                    }
                                  }}
                                  className={`bg-white rounded-lg border p-5 transition-all cursor-pointer min-h-[200px] flex flex-col relative outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                                    isExpanded ? 'shadow-md border-blue-200 ring-1 ring-blue-100' : 'hover:shadow-md hover:border-zinc-300 border-zinc-200 shadow-sm'
                                  }`}
                                >
                                  {/* Left Accent Border */}
                                  <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg ${
                                    isOverdue ? 'bg-red-500' : isDueSoon ? 'bg-orange-500' : 'bg-transparent'
                                  }`} />

                                  {/* Header */}
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                      <Ticket className="w-4 h-4 text-zinc-400" />
                                      <span className="font-mono font-semibold text-sm text-zinc-900">{pr.id}</span>
                                    </div>
                                    {getStatusBadge(pr.status)}
                                  </div>

                                  {/* Vendor Name */}
                                  <div className="text-[15px] font-semibold text-zinc-900 leading-[1.4] mb-4">
                                    {pr.vendors[0]} {pr.vendors.length > 1 && <span className="text-zinc-500 font-normal ml-1">+{pr.vendors.length - 1} more vendors</span>}
                                  </div>

                                  {/* Visual Timeline */}
                                  <div className="bg-zinc-50/50 rounded-lg p-3 mb-4 border border-zinc-100">
                                    <Timeline status={pr.status} size="sm" />
                                  </div>

                                  {/* Action Alert */}
                                  {isActionable && (
                                    <div className="mt-4 mb-3 bg-orange-50 border border-orange-200 text-orange-700 rounded-md px-3 py-2.5 flex items-center gap-2 text-[13px] font-medium">
                                      <Zap className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                                      Requires your approval. {Math.max(1, Math.floor((new Date(pr.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)))} days remaining.
                                    </div>
                                  )}

                                  {/* Metadata Row */}
                                  <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-zinc-600 mt-auto pt-4 ${!isActionable ? 'border-t border-zinc-50' : ''}`}>
                                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md ${
                                      isOverdue ? 'bg-red-100 text-red-700' : isDueSoon ? 'bg-orange-100 text-orange-700' : ''
                                    }`}>
                                      <Calendar className="w-3.5 h-3.5 opacity-70" />
                                      <span>{formatRelativeDate(pr.dueDate)}</span>
                                    </div>
                                    <span className="text-zinc-300">•</span>
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700">
                                        {pr.createdBy.charAt(0)}
                                      </div>
                                      <span>{pr.createdBy}</span>
                                    </div>
                                    <span className="text-zinc-300">•</span>
                                    <div className="flex items-center gap-1.5 font-mono font-semibold text-zinc-900">
                                      <Receipt className="w-3.5 h-3.5 text-zinc-400" />
                                      ${pr.amount.toLocaleString()}
                                    </div>
                                  </div>

                                  {/* Expanded Content */}
                                  <AnimatePresence>
                                    {isExpanded && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="pt-6 mt-6 border-t border-zinc-100 space-y-6">
                                          <div>
                                            <h4 className="text-[11px] font-bold text-zinc-900 uppercase tracking-wider mb-3">All Vendors</h4>
                                            <div className="flex flex-wrap gap-2">
                                              {pr.vendors.map(v => (
                                                <span key={v} className="px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-md text-xs font-medium border border-zinc-200">{v}</span>
                                              ))}
                                            </div>
                                          </div>
                                          <div className="grid grid-cols-2 gap-6">
                                            <div>
                                              <h4 className="text-[11px] font-bold text-zinc-900 uppercase tracking-wider mb-2">Department</h4>
                                              <p className="text-sm text-zinc-700 font-medium">{pr.department}</p>
                                            </div>
                                            <div>
                                              <h4 className="text-[11px] font-bold text-zinc-900 uppercase tracking-wider mb-2">Created At</h4>
                                              <p className="text-sm text-zinc-700 font-medium">{new Date(pr.createdAt).toLocaleDateString()}</p>
                                            </div>
                                          </div>
                                          
                                          <div className="pt-6 border-t border-zinc-100">
                                            <h4 className="text-[11px] font-bold text-zinc-900 uppercase tracking-wider mb-4">Recent Activity</h4>
                                            <div className="space-y-4">
                                              <div className="flex gap-3">
                                                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-[11px] font-bold text-blue-700 shrink-0">
                                                  {pr.createdBy.charAt(0)}
                                                </div>
                                                <div>
                                                  <p className="text-[13px] text-zinc-900"><span className="font-semibold">{pr.createdBy}</span> created the request</p>
                                                  <p className="text-[11px] text-zinc-500 mt-0.5">{new Date(pr.createdAt).toLocaleDateString()}</p>
                                                </div>
                                              </div>
                                              {pr.status !== 'Draft' && (
                                                <div className="flex gap-3">
                                                  <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-700 shrink-0">
                                                    <Activity className="w-3.5 h-3.5" />
                                                  </div>
                                                  <div>
                                                    <p className="text-[13px] text-zinc-900">Status changed to <span className="font-semibold">{pr.status}</span></p>
                                                    <p className="text-[11px] text-zinc-500 mt-0.5">{new Date(pr.lastUpdated).toLocaleDateString()}</p>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </div>

                                          <div className="pt-6 border-t border-zinc-100 grid grid-cols-2 gap-6">
                                            <div>
                                              <h4 className="text-[11px] font-bold text-zinc-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                                <Paperclip className="w-3.5 h-3.5 text-zinc-400" /> Attachments
                                              </h4>
                                              <div className="flex items-center gap-2 p-2.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-all cursor-pointer group">
                                                <FileText className="w-4 h-4 text-blue-600" />
                                                <span className="text-xs font-semibold text-zinc-700 group-hover:text-blue-600">quote_v1.pdf</span>
                                              </div>
                                            </div>
                                            <div>
                                              <h4 className="text-[11px] font-bold text-zinc-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                                <MessageSquare className="w-3.5 h-3.5 text-zinc-400" /> Comments
                                              </h4>
                                              <p className="text-[13px] text-zinc-500 italic">No comments yet.</p>
                                            </div>
                                          </div>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>

                                  {/* Action Buttons */}
                                  {isActionable && (
                                    <div className="mt-6 pt-6 border-t border-zinc-100 flex items-center gap-2">
                                      <button 
                                        onClick={(e) => handleAction('approve', pr.id, e)}
                                        className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-md transition-all shadow-sm flex items-center justify-center gap-2"
                                      >
                                        <CheckCircle2 className="w-4 h-4" />
                                        Approve
                                      </button>
                                      <button 
                                        onClick={(e) => handleAction('reject', pr.id, e)}
                                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-md transition-all shadow-sm flex items-center justify-center gap-2"
                                      >
                                        <XCircle className="w-4 h-4" />
                                        Reject
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleRowClick(pr); }}
                                        className="px-4 py-2 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-700 text-sm font-semibold rounded-md transition-all shadow-sm flex items-center justify-center gap-2"
                                      >
                                        <Eye className="w-4 h-4" />
                                        Details
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }) : (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-500 bg-white rounded-xl border border-zinc-200 shadow-sm">
                  <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
                    <Ticket className="w-8 h-8 text-zinc-300" />
                  </div>
                  <p className="text-lg font-bold text-zinc-900">No tickets found</p>
                  <p className="text-sm text-zinc-500 mt-1">Try adjusting your filters or search query</p>
                  <button 
                    onClick={() => { setTicketFilter('All PRs'); setSearchQuery(''); }}
                    className="mt-6 px-4 py-2 bg-white border border-zinc-300 rounded-lg text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-all shadow-sm"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </main>

      {!isMobile && isAIChatOpen && (
        <motion.aside
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 16 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          style={{ width: assistantPanelWidth }}
          className="relative hidden h-full min-h-0 shrink-0 border-l border-zinc-200 bg-white md:flex"
        >
          <button
            type="button"
            aria-label="Resize assistant panel"
            onMouseDown={(event) => {
              event.preventDefault();
              assistantResizeRef.current = {
                startX: event.clientX,
                startWidth: assistantPanelWidth,
              };
              setIsAssistantResizing(true);
            }}
            className={`absolute left-0 top-0 z-10 h-full w-3 -translate-x-1.5 cursor-col-resize border-l border-transparent transition-colors ${
              isAssistantResizing ? 'border-blue-500 bg-blue-500/10' : 'hover:border-zinc-300'
            }`}
          />
          <XyneAIChat
            isOpen={isAIChatOpen}
            variant="embedded"
            onClose={() => setIsAIChatOpen(false)}
            currentContext={selectedPRForDetails ? selectedPRForDetails.id : 'Dashboard'}
            onCreatePurchaseRequests={handleAIConversationCreate}
            onApprovePurchaseRequests={handleAIConversationApprove}
            onOpenPurchaseRequest={handleOpenPurchaseRequest}
            attentionRequest={aiChatAttentionRequest}
          />
        </motion.aside>
      )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        <AnimatePresence>
          {fabOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-2 items-end mb-2"
            >
              <div className="bg-white/90 backdrop-blur-md border border-zinc-200 rounded-2xl shadow-2xl p-2 min-w-[220px]">
                <div className="px-3 py-2 border-b border-zinc-100 mb-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Switch View</span>
                </div>
                <div className="space-y-1">
                  {[
                    { id: 'table', label: 'Table View', icon: Table2 },
                    { id: 'consolidated', label: 'Consolidated View', icon: Layers },
                    { id: 'pipeline', label: 'Pipeline View', icon: GitBranch },
                    { id: 'kanban', label: 'Kanban View', icon: Kanban },
                    { id: 'ticket', label: 'Ticket View', icon: Ticket },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setViewMode(item.id as ViewMode);
                        setFabOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                        viewMode === item.id 
                          ? 'bg-blue-50 text-blue-600' 
                          : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                      }`}
                    >
                      <item.icon className={`w-4 h-4 ${viewMode === item.id ? 'text-blue-600' : 'text-zinc-400'}`} />
                      <span className="text-sm font-medium">{item.label}</span>
                      {viewMode === item.id && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
                
                <div className="h-px bg-zinc-100 my-2 mx-2" />
                
                <div className="px-3 py-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Actions</span>
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => { setCurrentView('create-pr'); setFabOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-bold">Create New PR</span>
                  </button>
                  <button
                    onClick={() => { handleExport(); setFabOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-all"
                  >
                    <Download className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm font-medium">Export to Excel</span>
                  </button>
                  <button
                    onClick={() => { handleUpload(); setFabOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-all"
                  >
                    <Upload className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm font-medium">Bulk Upload</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setFabOpen(!fabOpen)}
          className={`group relative flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            fabOpen ? 'bg-zinc-900 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {fabOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <LayoutDashboard className="w-6 h-6" />
          )}
          <span className="absolute right-full mr-4 px-2 py-1 bg-zinc-900 text-white text-xs font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {fabOpen ? 'Close Menu' : 'Switch View & Actions'}
          </span>
        </button>
      </div>

      <GlobalSearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        data={prData}
      />

      <CreatePRModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSubmit={handleCreatePR} 
      />

      <AnimatePresence>
        {isAIChatOpen && isMobile && (
          <XyneAIChat 
            isOpen={isAIChatOpen} 
            variant="floating"
            onClose={() => setIsAIChatOpen(false)} 
            currentContext={selectedPRForDetails ? selectedPRForDetails.id : 'Dashboard'}
            onCreatePurchaseRequests={handleAIConversationCreate}
            onApprovePurchaseRequests={handleAIConversationApprove}
            onOpenPurchaseRequest={handleOpenPurchaseRequest}
            attentionRequest={aiChatAttentionRequest}
          />
        )}
      </AnimatePresence>

      {/* Side Drawer */}
      <AnimatePresence>
        {selectedPRForDetails && (
          <FullDetailsView 
            pr={selectedPRForDetails} 
            onClose={() => setSelectedPRForDetails(null)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {drawerOpen && selectedPR && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-zinc-900/20 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl border-l border-zinc-200 z-50 flex flex-col"
            >
              <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900">{selectedPR.id}</h2>
                  <p className="text-sm text-zinc-500 mt-0.5">Created on {new Date(selectedPR.createdAt).toLocaleDateString()}</p>
                </div>
                <button 
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-3">Status</h3>
                    <div>{getStatusBadge(selectedPR.status)}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-2">Requester</h3>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-sm font-medium text-blue-700 border border-blue-100">
                          {selectedPR.createdBy.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-zinc-900">{selectedPR.createdBy}</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-2">Due Date</h3>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium border ${getDueDateColor(selectedPR.dueDate)}`}>
                        {formatRelativeDate(selectedPR.dueDate)}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-zinc-100 pt-6">
                    <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-3">Vendors</h3>
                    <div className="space-y-2">
                      {selectedPR.vendors.map((vendor, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 bg-zinc-50">
                          <span className="text-sm font-medium text-zinc-900">{vendor}</span>
                          <span className="text-xs text-zinc-500">Pending Onboarding</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-zinc-100 pt-6">
                    <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-3">Line Items</h3>
                    <div className="p-8 border-2 border-dashed border-zinc-200 rounded-xl flex flex-col items-center justify-center text-center">
                      <ShoppingCart className="w-8 h-8 text-zinc-300 mb-2" />
                      <p className="text-sm font-medium text-zinc-900">No items added yet</p>
                      <p className="text-xs text-zinc-500 mt-1">Line items will appear here once added.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedPR.status === 'Approval Pending' && (
                <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center gap-3">
                  <button className="flex-1 px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors shadow-sm">
                    Reject
                  </button>
                  <button className="flex-1 px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm">
                    Approve Request
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
      </motion.div>
    </div>
  );
};
