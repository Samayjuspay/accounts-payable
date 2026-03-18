import React from 'react';
import { Sparkles, X, Loader2 } from 'lucide-react';
import { Predictions, PredictionConfidence } from '../../hooks/useSmartPredictions';

interface SmartPredictionBannerProps {
  predictions: Predictions;
  isLoading?: boolean;
  onApply: (predictions: Predictions) => void;
  onDismiss: () => void;
}

interface PredictionChipProps {
  label: string;
  value: string | number | undefined;
  confidence?: number;
}

const PredictionChip: React.FC<PredictionChipProps> = ({ label, value, confidence }) => {
  if (!value) return null;
  
  const displayValue = typeof value === 'number' 
    ? `₹${value.toLocaleString()}` 
    : value;
    
  const confidenceColor = confidence && confidence >= 0.8 
    ? 'bg-green-50 border-green-200 text-green-700' 
    : confidence && confidence >= 0.6 
    ? 'bg-amber-50 border-amber-200 text-amber-700'
    : 'bg-zinc-50 border-zinc-200 text-zinc-700';

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-white border rounded-md text-sm ${confidenceColor}`}>
      <span className="text-zinc-500 text-xs">{label}:</span>
      <span className="font-medium">{displayValue}</span>
      {confidence && (
        <span className="text-xs opacity-60">
          {Math.round(confidence * 100)}%
        </span>
      )}
    </div>
  );
};

export const SmartPredictionBanner: React.FC<SmartPredictionBannerProps> = ({
  predictions,
  isLoading = false,
  onApply,
  onDismiss,
}) => {
  const hasPredictions = predictions.department || 
    predictions.category || 
    predictions.vendor || 
    predictions.estimatedBudget;

  if (!hasPredictions && !isLoading) return null;

  const handleApply = () => {
    onApply(predictions);
  };

  // Count valid predictions
  const predictionCount = [
    predictions.department,
    predictions.category,
    predictions.vendor,
    predictions.estimatedBudget,
  ].filter(Boolean).length;

  return (
    <div className="relative overflow-hidden rounded-lg border border-blue-200 bg-blue-50 animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-start gap-4 p-4">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5 text-blue-600" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold text-blue-900">
              {isLoading ? 'AI is analyzing...' : 'AI Predictions Available'}
            </h3>
            {!isLoading && (
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                {predictionCount} fields
              </span>
            )}
          </div>

          {!isLoading && (
            <div className="flex flex-wrap gap-2 mb-3">
              <PredictionChip 
                label="Dept" 
                value={predictions.department} 
                confidence={predictions.confidence?.department}
              />
              <PredictionChip 
                label="Category" 
                value={predictions.category}
                confidence={predictions.confidence?.category}
              />
              <PredictionChip 
                label="Vendor" 
                value={predictions.vendor}
                confidence={predictions.confidence?.vendor}
              />
              <PredictionChip 
                label="Budget" 
                value={predictions.estimatedBudget}
                confidence={predictions.confidence?.budget}
              />
            </div>
          )}

          {!isLoading && (
            <p className="text-xs text-blue-600">
              Based on similar PRs and your department history
            </p>
          )}
        </div>

        {/* Actions */}
        {!isLoading && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              Apply All
            </button>
            <button
              onClick={onDismiss}
              className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
              aria-label="Dismiss predictions"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Progress bar for loading state */}
      {isLoading && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-200">
          <div className="h-full bg-blue-600 animate-pulse" />
        </div>
      )}
    </div>
  );
};