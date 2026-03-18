import React, { useState, useEffect, useCallback } from 'react';
import { Calculator, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { predictBudget } from '../../services/aiService';

interface LineItem {
  name: string;
  quantity: number;
  unitPrice?: number;
}

interface SmartBudgetFieldProps {
  items?: LineItem[];
  category?: string;
  department?: string;
  value?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

interface BudgetPrediction {
  min: number;
  max: number;
  average: number;
  recommended: number;
  sampleSize: number;
}

export const SmartBudgetField: React.FC<SmartBudgetFieldProps> = ({
  items = [],
  category,
  department,
  value,
  onChange,
  disabled = false,
}) => {
  const [prediction, setPrediction] = useState<BudgetPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPrediction, setShowPrediction] = useState(false);

  const fetchBudgetPrediction = useCallback(async () => {
    // Only predict if we have items or category
    if (items.length === 0 && !category) {
      setPrediction(null);
      setShowPrediction(false);
      return;
    }

    setIsLoading(true);
    try {
      const result = await predictBudget({
        items,
        category: category || '',
        department: department || '',
      });
      setPrediction(result);
      setShowPrediction(true);
    } catch (error) {
      console.error('Error predicting budget:', error);
    } finally {
      setIsLoading(false);
    }
  }, [items, category, department]);

  useEffect(() => {
    // Debounce the prediction
    const timer = setTimeout(() => {
      fetchBudgetPrediction();
    }, 500);

    return () => clearTimeout(timer);
  }, [fetchBudgetPrediction]);

  const handleUseRecommended = () => {
    if (prediction) {
      onChange(prediction.recommended);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = parseFloat(e.target.value) || 0;
    onChange(numValue);
  };

  const hasItems = items.length > 0;
  const hasCategory = !!category;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
          Estimated Budget
          {isLoading && (
            <span className="inline-flex items-center gap-1 text-xs text-blue-600">
              <div className="w-3 h-3 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              Calculating...
            </span>
          )}
        </label>
        
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-medium">
            ₹
          </span>
          <input
            type="number"
            value={value || ''}
            onChange={handleInputChange}
            disabled={disabled}
            placeholder="Enter estimated budget"
            className="w-full pl-8 pr-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          {value && value > 0 && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
              {formatCurrency(value)}
            </span>
          )}
        </div>
      </div>

      {/* Budget Prediction Box */}
      {showPrediction && prediction && (hasItems || hasCategory) && (
        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-zinc-900">
              AI Budget Estimate
            </span>
            <span className="text-xs text-zinc-500">
              (Based on {prediction.sampleSize} similar PRs)
            </span>
          </div>

          {/* Range visualization */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>Min: {formatCurrency(prediction.min)}</span>
              <span>Max: {formatCurrency(prediction.max)}</span>
            </div>
            
            <div className="relative h-2 bg-zinc-200 rounded-full overflow-hidden">
              {/* Range bar */}
              <div 
                className="absolute h-full bg-blue-200 rounded-full"
                style={{
                  left: '0%',
                  right: '0%',
                }}
              />
              {/* Average marker */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-blue-600"
                style={{
                  left: '50%',
                }}
              />
              {/* Recommended marker */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"
                style={{
                  left: '52%',
                }}
              />
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 bg-white rounded border border-zinc-200">
              <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                <TrendingDown className="w-3 h-3" />
                <span className="text-xs font-medium">Min</span>
              </div>
              <p className="text-sm font-semibold text-zinc-900">
                {formatCurrency(prediction.min)}
              </p>
            </div>
            
            <div className="text-center p-2 bg-white rounded border border-zinc-200">
              <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                <Minus className="w-3 h-3" />
                <span className="text-xs font-medium">Avg</span>
              </div>
              <p className="text-sm font-semibold text-zinc-900">
                {formatCurrency(prediction.average)}
              </p>
            </div>
            
            <div className="text-center p-2 bg-white rounded border border-zinc-200">
              <div className="flex items-center justify-center gap-1 text-amber-600 mb-1">
                <TrendingUp className="w-3 h-3" />
                <span className="text-xs font-medium">Max</span>
              </div>
              <p className="text-sm font-semibold text-zinc-900">
                {formatCurrency(prediction.max)}
              </p>
            </div>
          </div>

          {/* Recommended action */}
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div>
              <p className="text-xs text-blue-600 font-medium">Recommended</p>
              <p className="text-lg font-bold text-blue-900">
                {formatCurrency(prediction.recommended)}
              </p>
            </div>
            <button
              onClick={handleUseRecommended}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              Use ₹{prediction.recommended.toLocaleString()}
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!showPrediction && !isLoading && (
        <p className="text-xs text-zinc-500">
          Add line items or select a category to get AI budget estimates
        </p>
      )}
    </div>
  );
};