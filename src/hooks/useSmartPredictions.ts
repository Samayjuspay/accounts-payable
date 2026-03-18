import { useState, useCallback, useRef, useEffect } from 'react';
import { debounce } from 'lodash';
import { predictFields, predictFullForm } from '../services/aiService';
import { FullFormPredictions } from '../types/ai-predictions.types';

export interface PredictionConfidence {
  department: number;
  category: number;
  vendor: number;
  budget: number;
}

export interface Predictions {
  department?: string;
  category?: string;
  vendor?: string;
  estimatedBudget?: number;
  confidence?: PredictionConfidence;
}

export interface UseSmartPredictionsReturn {
  // Legacy simple predictions
  predictions: Predictions;
  isLoading: boolean;
  showBanner: boolean;
  setShowBanner: (show: boolean) => void;
  predictFields: (changedField: string, value: string, currentFormData: Record<string, unknown>) => void;
  clearPredictions: () => void;
  
  // New full form predictions
  fullPredictions: FullFormPredictions | null;
  isFullLoading: boolean;
  showFullBanner: boolean;
  setShowFullBanner: (show: boolean) => void;
  predictFullForm: (changedField: string, value: string, currentFormData: Record<string, unknown>) => void;
  clearFullPredictions: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export const useSmartPredictions = (): UseSmartPredictionsReturn => {
  // Legacy state
  const [predictions, setPredictions] = useState<Predictions>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  
  // Full form state
  const [fullPredictions, setFullPredictions] = useState<FullFormPredictions | null>(null);
  const [isFullLoading, setIsFullLoading] = useState(false);
  const [showFullBanner, setShowFullBanner] = useState(false);
  
  const cacheRef = useRef<Map<string, CacheEntry<Predictions>>>(new Map());
  const fullCacheRef = useRef<Map<string, CacheEntry<FullFormPredictions>>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);
  const fullAbortControllerRef = useRef<AbortController | null>(null);

  const getCacheKey = (changedField: string, value: string, formData: Record<string, unknown>): string => {
    return `${changedField}:${value}:${JSON.stringify(formData)}`;
  };

  const clearPredictions = useCallback(() => {
    setPredictions({});
    setShowBanner(false);
  }, []);

  const clearFullPredictions = useCallback(() => {
    setFullPredictions(null);
    setShowFullBanner(false);
  }, []);

  // Legacy debounced predict
  const debouncedPredict = useRef(
    debounce(async (
      changedField: string,
      value: string,
      currentFormData: Record<string, unknown>
    ) => {
      if (value.length < 3 && changedField === 'title') {
        return;
      }

      const cacheKey = getCacheKey(changedField, value, currentFormData);
      const cached = cacheRef.current.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setPredictions(cached.data);
        setShowBanner(true);
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setIsLoading(true);

      try {
        const result = await predictFields({
          changedField,
          value,
          currentFormData,
        });

        if (result) {
          setPredictions(result);
          setShowBanner(true);
          
          cacheRef.current.set(cacheKey, {
            data: result,
            timestamp: Date.now(),
          });
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Prediction error:', error);
        }
      } finally {
        setIsLoading(false);
      }
    }, 500)
  ).current;

  // Full form debounced predict
  const debouncedFullPredict = useRef(
    debounce(async (
      changedField: string,
      value: string,
      currentFormData: Record<string, unknown>
    ) => {
      if (value.length < 10 && changedField === 'title') {
        return;
      }

      const cacheKey = getCacheKey(changedField, value, currentFormData);
      const cached = fullCacheRef.current.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setFullPredictions(cached.data);
        setShowFullBanner(true);
        return;
      }

      if (fullAbortControllerRef.current) {
        fullAbortControllerRef.current.abort();
      }

      fullAbortControllerRef.current = new AbortController();
      setIsFullLoading(true);

      try {
        const result = await predictFullForm({
          changedField,
          value,
          currentFormData,
          fullContext: true,
        });

        if (result) {
          setFullPredictions(result);
          setShowFullBanner(true);
          
          fullCacheRef.current.set(cacheKey, {
            data: result,
            timestamp: Date.now(),
          });
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Full prediction error:', error);
        }
      } finally {
        setIsFullLoading(false);
      }
    }, 800)
  ).current;

  const predictFieldsCallback = useCallback((
    changedField: string,
    value: string,
    currentFormData: Record<string, unknown>
  ) => {
    if (changedField === 'title' && value.length >= 10) {
      debouncedPredict(changedField, value, currentFormData);
    } else if (changedField !== 'title') {
      debouncedPredict(changedField, value, currentFormData);
    }
  }, [debouncedPredict]);

  const predictFullFormCallback = useCallback((
    changedField: string,
    value: string,
    currentFormData: Record<string, unknown>
  ) => {
    if (changedField === 'title' && value.length >= 10) {
      debouncedFullPredict(changedField, value, currentFormData);
    }
  }, [debouncedFullPredict]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (fullAbortControllerRef.current) {
        fullAbortControllerRef.current.abort();
      }
      debouncedPredict.cancel();
      debouncedFullPredict.cancel();
    };
  }, [debouncedPredict, debouncedFullPredict]);

  return {
    // Legacy
    predictions,
    isLoading,
    showBanner,
    setShowBanner,
    predictFields: predictFieldsCallback,
    clearPredictions,
    
    // Full form
    fullPredictions,
    isFullLoading,
    showFullBanner,
    setShowFullBanner,
    predictFullForm: predictFullFormCallback,
    clearFullPredictions,
  };
};