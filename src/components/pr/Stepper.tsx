import React from 'react';
import { Check } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const STEPS = [
  'Basic Info',
  'Items',
  'Vendor',
  'Budget',
  'Delivery',
  'Attachments',
  'Review'
];

interface StepperProps {
  currentStep: number;
}

export const Stepper: React.FC<StepperProps> = ({ currentStep }) => {
  return (
    <div className="w-full py-6 px-8 bg-white border-b border-zinc-200 sticky top-16 z-30">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {STEPS.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = currentStep > stepNumber;
          const isCurrent = currentStep === stepNumber;
          const isPending = currentStep < stepNumber;

          return (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center gap-2 relative">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
                    isCompleted && "bg-blue-600 text-white",
                    isCurrent && "border-2 border-blue-600 text-blue-600 bg-blue-50",
                    isPending && "bg-zinc-100 text-zinc-400 border border-zinc-200"
                  )}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : stepNumber}
                </div>
                <span
                  className={cn(
                    "text-[11px] font-bold uppercase tracking-wider whitespace-nowrap absolute -bottom-6",
                    isCurrent ? "text-blue-600" : "text-zinc-500"
                  )}
                >
                  {step}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-[2px] mx-4 transition-colors duration-500",
                    isCompleted ? "bg-blue-600" : "bg-zinc-200"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
