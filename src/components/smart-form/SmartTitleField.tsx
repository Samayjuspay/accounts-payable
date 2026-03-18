import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Sparkles, Clock, Users, Bot } from 'lucide-react';
import { getTitleSuggestions } from '../../services/aiService';
import { Predictions } from '../../hooks/useSmartPredictions';

interface SmartTitleFieldProps {
  value: string;
  onChange: (value: string) => void;
  onPredictionApply?: (predictions: Predictions) => void;
  userId?: string;
  disabled?: boolean;
}

interface Suggestion {
  title: string;
  source: 'history' | 'team' | 'ai';
}

const SOURCE_ICONS = {
  history: Clock,
  team: Users,
  ai: Bot,
};

const SOURCE_LABELS = {
  history: 'Your previous PR',
  team: 'Used by team',
  ai: 'AI suggestion',
};

export const SmartTitleField: React.FC<SmartTitleFieldProps> = ({
  value,
  onChange,
  onPredictionApply,
  userId = 'current-user',
  disabled = false,
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    try {
      const results = await getTitleSuggestions(query, userId);
      setSuggestions(results);
      setShowDropdown(results.length > 0);
      setHighlightedIndex(-1);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    // Show analyzing indicator when title > 10 chars
    setIsAnalyzing(value.length > 10);
    
    // Debounce suggestion fetch
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, fetchSuggestions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleSuggestionClick = async (suggestion: Suggestion) => {
    onChange(suggestion.title);
    setShowDropdown(false);
    
    // Trigger prediction apply if callback provided
    if (onPredictionApply) {
      // Simulate fetching predictions for this title
      const mockPredictions: Predictions = {
        department: 'IT',
        category: 'Hardware',
        vendor: 'Dell Technologies',
        estimatedBudget: 240000,
        confidence: {
          department: 0.92,
          category: 0.88,
          vendor: 0.75,
          budget: 0.68,
        },
      };
      onPredictionApply(mockPredictions);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSuggestionClick(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        break;
    }
  };

  const charCount = value.length;
  const maxChars = 200;

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="e.g., Annual Cloud Infrastructure Renewal 2026"
          className="w-full px-4 py-3 pr-24 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
        
        {/* Character counter and AI indicator */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {isAnalyzing && (
            <span className="flex items-center gap-1 text-xs text-blue-600 animate-pulse">
              <Sparkles className="w-3 h-3" />
              AI analyzing...
            </span>
          )}
          <span className={`text-xs ${charCount > maxChars ? 'text-red-500' : 'text-zinc-400'}`}>
            {charCount}/{maxChars}
          </span>
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg max-h-[300px] overflow-y-auto"
        >
          {isLoading ? (
            <div className="p-4 text-center text-sm text-zinc-500">
              <div className="animate-spin inline-block w-4 h-4 border-2 border-zinc-300 border-t-blue-600 rounded-full mr-2" />
              Loading suggestions...
            </div>
          ) : (
            <ul className="py-1">
              {suggestions.map((suggestion, index) => {
                const Icon = SOURCE_ICONS[suggestion.source];
                return (
                  <li
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`px-4 py-3 cursor-pointer transition-colors ${
                      index === highlightedIndex ? 'bg-zinc-100' : 'hover:bg-zinc-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 truncate">
                          {suggestion.title}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {SOURCE_LABELS[suggestion.source]}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Hint text */}
      <p className="mt-1.5 text-xs text-zinc-500">
        Be descriptive and specific. Minimum 10 characters.
      </p>
    </div>
  );
};