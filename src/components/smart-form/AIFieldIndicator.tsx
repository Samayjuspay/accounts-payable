import React from 'react';
import { Sparkles } from 'lucide-react';

interface AIFieldIndicatorProps {
  sourcePR?: string;
  confidence?: number;
  showHint?: boolean;
  className?: string;
}

export const AIFieldIndicator: React.FC<AIFieldIndicatorProps> = ({
  sourcePR,
  confidence,
  showHint = true,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span 
        className="inline-flex items-center gap-1 text-[10px] font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-0.5 rounded-full shadow-sm"
        title={sourcePR ? `Auto-filled from ${sourcePR}` : 'AI auto-filled'}
      >
        <Sparkles className="w-3 h-3" />
        AI
      </span>
      {showHint && sourcePR && (
        <span className="text-[10px] text-zinc-500">
          From {sourcePR} {confidence && `(${Math.round(confidence * 100)}% match)`}
        </span>
      )}
    </div>
  );
};

interface AIFieldWrapperProps {
  children: React.ReactNode;
  isAIGenerated?: boolean;
  sourcePR?: string;
  confidence?: number;
  className?: string;
}

export const AIFieldWrapper: React.FC<AIFieldWrapperProps> = ({
  children,
  isAIGenerated = false,
  sourcePR,
  confidence,
  className = '',
}) => {
  if (!isAIGenerated) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div 
      className={`relative rounded-lg border-l-4 border-blue-500 bg-gradient-to-r from-blue-50/50 to-transparent pl-4 pr-3 py-3 ${className}`}
    >
      <div className="absolute top-2 right-2">
        <AIFieldIndicator sourcePR={sourcePR} confidence={confidence} />
      </div>
      <div className="pr-16">
        {children}
      </div>
    </div>
  );
};