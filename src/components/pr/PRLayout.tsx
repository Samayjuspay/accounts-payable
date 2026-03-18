import React from 'react';
import { ChevronLeft, Save, Send } from 'lucide-react';
import {
  Button as BlendButton,
  ButtonSize as BlendButtonSize,
  ButtonType as BlendButtonType,
} from '@juspay/blend-design-system';

interface PRLayoutProps {
  children: React.ReactNode;
  preview: React.ReactNode;
  stepper: React.ReactNode;
  onBack: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export const PRLayout: React.FC<PRLayoutProps> = ({ 
  children, 
  preview, 
  stepper,
  onBack,
  onSaveDraft,
  onSubmit,
  isSubmitting = false,
}) => {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header */}
      <header className="h-16 bg-zinc-50/95 border-b border-zinc-200 px-6 flex items-center justify-between sticky top-0 z-50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-500 hover:text-zinc-900"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-zinc-200" />
          <h1 className="text-lg font-bold text-zinc-900 tracking-tight">Create Purchase Request</h1>
        </div>

        <div className="flex items-center gap-3">
          <BlendButton
            onClick={onSaveDraft}
            buttonType={BlendButtonType.SECONDARY}
            size={BlendButtonSize.SMALL}
            text="Save Draft"
            leadingIcon={<Save className="w-4 h-4" />}
          />
          <BlendButton
            onClick={onSubmit}
            disabled={isSubmitting}
            buttonType={BlendButtonType.PRIMARY}
            size={BlendButtonSize.SMALL}
            text={isSubmitting ? 'Submitting...' : 'Submit for Approval'}
            leadingIcon={<Send className="w-4 h-4" />}
          />
        </div>
      </header>

      {/* Stepper */}
      {stepper}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Form Side - 60% */}
        <div className="w-full lg:w-[60%] overflow-y-auto custom-scrollbar bg-zinc-50 p-8 lg:p-12">
          <div className="max-w-3xl mx-auto">
            {children}
          </div>
        </div>

        {/* Preview Side - 40% */}
        <div className="hidden lg:block w-[40%] border-l border-zinc-200 sticky top-0 h-[calc(100vh-112px)] bg-zinc-100/70">
          {preview}
        </div>
      </div>
    </div>
  );
};
