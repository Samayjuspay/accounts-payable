import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  Loader2, 
  ChevronDown, 
  ChevronUp,
  Package,
  Building2,
  Truck,
  Wallet,
  Paperclip,
  ClipboardList,
  Check
} from 'lucide-react';
import { FullFormPredictions } from '../../types/ai-predictions.types';

interface EnhancedSmartPredictionBannerProps {
  predictions: FullFormPredictions;
  isLoading?: boolean;
  onApply: (predictions: FullFormPredictions, reviewMode: boolean) => void;
  onDismiss: () => void;
}

interface PredictionSectionProps {
  title: string;
  icon: React.ReactNode;
  count?: string;
  isExpanded: boolean;
  onToggle: () => void;
  confidence: number;
  children: React.ReactNode;
}

const PredictionSection: React.FC<PredictionSectionProps> = ({
  title,
  icon,
  count,
  isExpanded,
  onToggle,
  confidence,
  children,
}) => {
  const confidenceColor = confidence >= 0.8 
    ? 'bg-green-100 text-green-700' 
    : confidence >= 0.6 
    ? 'bg-amber-100 text-amber-700'
    : 'bg-zinc-100 text-zinc-600';

  return (
    <div className="border-b border-blue-100 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-blue-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white rounded-md text-blue-600">
            {icon}
          </div>
          <div className="text-left">
            <span className="text-sm font-medium text-zinc-900">{title}</span>
            {count && (
              <span className="ml-2 text-xs text-zinc-500">({count})</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${confidenceColor}`}>
            {Math.round(confidence * 100)}%
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-zinc-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          )}
        </div>
      </button>
      
      {isExpanded && (
        <div className="px-3 pb-3 animate-in slide-in-from-top-1 duration-150">
          {children}
        </div>
      )}
    </div>
  );
};

const Chip: React.FC<{ label: string }> = ({ label }) => (
  <span className="inline-flex items-center px-2.5 py-1 bg-white border border-blue-200 rounded-md text-xs font-medium text-zinc-700">
    {label}
  </span>
);

export const EnhancedSmartPredictionBanner: React.FC<EnhancedSmartPredictionBannerProps> = ({
  predictions,
  isLoading = false,
  onApply,
  onDismiss,
}) => {
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    items: false,
    vendor: false,
    budget: false,
    delivery: false,
    attachments: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleApplyAll = () => {
    onApply(predictions, false);
  };

  const handleReviewAndEdit = () => {
    onApply(predictions, true);
  };

  const totalItems = predictions.items.length;
  const totalAttachments = predictions.attachments.suggestedAttachments.length;

  return (
    <div className="relative overflow-hidden rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg animate-in slide-in-from-top-2 duration-300">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-blue-100">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
            {isLoading ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              {isLoading ? 'AI is analyzing your request...' : 'AI detected complete purchase request'}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {isLoading 
                ? 'Matching with similar PRs from your history' 
                : `Based on ${predictions.sourceAnalysis.matchedPRs.length} similar PRs • ${Math.round(predictions.overallConfidence * 100)}% confident`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isLoading && (
            <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
              {Math.round(predictions.overallConfidence * 100)}% match
            </span>
          )}
          <button
            onClick={onDismiss}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors"
            aria-label="Dismiss predictions"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Sections */}
      {!isLoading && (
        <div className="divide-y divide-blue-100">
          {/* BASIC INFO */}
          <PredictionSection
            title="Basic Information"
            icon={<ClipboardList className="w-4 h-4" />}
            isExpanded={expandedSections.basicInfo}
            onToggle={() => toggleSection('basicInfo')}
            confidence={predictions.basicInfo.confidence}
          >
            <div className="flex flex-wrap gap-2 pb-2">
              <Chip label={predictions.basicInfo.department} />
              <Chip label={predictions.basicInfo.category} />
              <Chip label={predictions.basicInfo.urgency} />
            </div>
          </PredictionSection>

          {/* ITEMS */}
          {totalItems > 0 && (
            <PredictionSection
              title="Line Items"
              icon={<Package className="w-4 h-4" />}
              count={`${totalItems} items`}
              isExpanded={expandedSections.items}
              onToggle={() => toggleSection('items')}
              confidence={predictions.items[0]?.confidence || 0.8}
            >
              <div className="space-y-2 pb-2">
                {predictions.items.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-2 bg-white rounded-lg border border-blue-100 text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-900 truncate">{item.name}</p>
                      <p className="text-xs text-zinc-500">{item.quantity} × ₹{item.unitPrice.toLocaleString()}</p>
                    </div>
                    <span className="font-semibold text-zinc-900">₹{item.total.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between p-2 bg-blue-100/50 rounded-lg text-sm font-semibold">
                  <span>Total</span>
                  <span>₹{predictions.budget.estimatedTotal.toLocaleString()}</span>
                </div>
                <p className="text-xs text-zinc-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Based on {predictions.sourceAnalysis.matchedPRs[0]}
                </p>
              </div>
            </PredictionSection>
          )}

          {/* VENDOR */}
          <PredictionSection
            title="Vendor Selection"
            icon={<Building2 className="w-4 h-4" />}
            isExpanded={expandedSections.vendor}
            onToggle={() => toggleSection('vendor')}
            confidence={predictions.vendor.confidence}
          >
            <div className="space-y-2 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-zinc-900">{predictions.vendor.recommendedVendor}</span>
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" /> Recommended
                </span>
              </div>
              <p className="text-xs text-zinc-600">{predictions.vendor.reason}</p>
              {predictions.vendor.selectedVendors.length > 1 && (
                <p className="text-xs text-zinc-500">
                  + {predictions.vendor.selectedVendors.length - 1} more vendors for comparison
                </p>
              )}
            </div>
          </PredictionSection>

          {/* BUDGET */}
          <PredictionSection
            title="Budget & Approval"
            icon={<Wallet className="w-4 h-4" />}
            isExpanded={expandedSections.budget}
            onToggle={() => toggleSection('budget')}
            confidence={predictions.budget.confidence}
          >
            <div className="space-y-2 pb-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Budget Source:</span>
                <span className="font-medium text-zinc-900">{predictions.budget.budgetSource}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Cost Center:</span>
                <span className="font-medium text-zinc-900">{predictions.budget.costCenter}</span>
              </div>
              <div className="flex justify-between p-2 bg-blue-100/50 rounded-lg font-semibold">
                <span>Estimated Total:</span>
                <span>₹{predictions.budget.breakdown.grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </PredictionSection>

          {/* DELIVERY */}
          <PredictionSection
            title="Delivery Details"
            icon={<Truck className="w-4 h-4" />}
            isExpanded={expandedSections.delivery}
            onToggle={() => toggleSection('delivery')}
            confidence={predictions.delivery.confidence}
          >
            <div className="space-y-2 pb-2 text-sm">
              <p className="text-zinc-900 font-medium">{predictions.delivery.address}</p>
              <p className="text-zinc-600">
                Contact: {predictions.delivery.contactPerson} ({predictions.delivery.contactPhone})
              </p>
              {predictions.delivery.installationRequired && (
                <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                  🔧 Installation required
                </span>
              )}
            </div>
          </PredictionSection>

          {/* ATTACHMENTS */}
          {totalAttachments > 0 && (
            <PredictionSection
              title="Suggested Attachments"
              icon={<Paperclip className="w-4 h-4" />}
              count={`${totalAttachments} files`}
              isExpanded={expandedSections.attachments}
              onToggle={() => toggleSection('attachments')}
              confidence={predictions.attachments.confidence}
            >
              <div className="space-y-2 pb-2">
                {predictions.attachments.suggestedAttachments.map((file, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center gap-2 p-2 bg-white rounded-lg border border-blue-100 text-sm"
                  >
                    <span className="text-xl">📄</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-900 truncate">{file.name}</p>
                      <p className="text-xs text-zinc-500">from {file.fromPR}</p>
                    </div>
                  </div>
                ))}
              </div>
            </PredictionSection>
          )}
        </div>
      )}

      {/* Footer Actions */}
      {!isLoading && (
        <div className="flex items-center justify-between p-4 bg-white/50 border-t border-blue-100">
          <div className="text-xs text-zinc-500">
            Matched {predictions.sourceAnalysis.matchedPRs.length} similar PRs
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReviewAndEdit}
              className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors"
            >
              Review & Edit
            </button>
            <button
              onClick={handleApplyAll}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Apply All
            </button>
          </div>
        </div>
      )}

      {/* Progress bar for loading */}
      {isLoading && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-100">
          <div className="h-full bg-blue-600 animate-pulse" />
        </div>
      )}
    </div>
  );
};