import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FormProvider } from 'react-hook-form';
import debounce from 'lodash.debounce';
import { PRLayout } from '../components/pr/PRLayout';
import { Stepper } from '../components/pr/Stepper';
import { LivePreview } from '../components/pr/LivePreview';
import { BasicInfoStep } from '../components/pr/steps/BasicInfoStep';
import { LineItemsStep } from '../components/pr/steps/LineItemsStep';
import { VendorStep } from '../components/pr/steps/VendorStep';
import { BudgetStep } from '../components/pr/steps/BudgetStep';
import { DeliveryStep } from '../components/pr/steps/DeliveryStep';
import { AttachmentsStep } from '../components/pr/steps/AttachmentsStep';
import { ReviewStep } from '../components/pr/steps/ReviewStep';
import { usePRForm } from '../hooks/usePRForm';
import { useAutoSave } from '../hooks/useAutoSave';
import { PRFormData } from '../types/pr.types';
import { ArrowRight, ArrowLeft, Send } from 'lucide-react';

interface CreatePRPageProps {
  onBack: () => void;
  onSubmitForApproval?: (data: PRFormData, previewRect?: DOMRect | null) => Promise<void> | void;
}

export const CreatePRPage: React.FC<CreatePRPageProps> = ({ onBack, onSubmitForApproval }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [previewData, setPreviewData] = useState<PRFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const previewPanelRef = useRef<HTMLDivElement>(null);

  // Initialize form
  const methods = usePRForm();
  const { watch, handleSubmit, trigger, getValues, setValue } = methods;

  // Autosave logic
  const { restoreDraft, clearDraft } = useAutoSave(watch);

  useEffect(() => {
    const draft = restoreDraft();
    if (draft) {
      console.log('Draft found in storage');
    }
  }, [restoreDraft]);

  // Debounced preview update
  const updatePreview = useCallback(
    debounce((data: PRFormData) => {
      setPreviewData(data);
    }, 300),
    []
  );

  useEffect(() => {
    const subscription = watch((value) => {
      updatePreview(value as PRFormData);
    });
    return () => subscription.unsubscribe();
  }, [watch, updatePreview]);

  // Initialize preview data
  useEffect(() => {
    setPreviewData(getValues());
  }, [getValues]);

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (currentStep === 1) {
      fieldsToValidate = ['title', 'department', 'category', 'urgency', 'businessJustification', 'requiredByDate'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['items'];
    } else if (currentStep === 3) {
      fieldsToValidate = ['vendorSelection.mode'];
      const mode = getValues('vendorSelection.mode');
      if (mode === 'existing') fieldsToValidate.push('vendorSelection.selectedVendorId');
      if (mode === 'rfq') fieldsToValidate.push('vendorSelection.rfqVendorIds');
    } else if (currentStep === 4) {
      fieldsToValidate = ['budget'];
    } else if (currentStep === 5) {
      fieldsToValidate = ['delivery.address.street', 'delivery.address.city', 'delivery.contact.name'];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, 7));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSaveDraft = () => {
    const data = getValues();
    localStorage.setItem('pr_draft_manual', JSON.stringify(data));
    alert('Draft saved successfully!');
  };

  const onSubmit = handleSubmit(async (data) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const previewRect = previewPanelRef.current?.getBoundingClientRect() ?? null;
      if (onSubmitForApproval) {
        await onSubmitForApproval(data, previewRect);
      } else {
        console.log('Submitting PR:', data);
        alert('Purchase Request submitted for approval!');
        onBack();
      }
      clearDraft();
    } finally {
      setIsSubmitting(false);
    }
  });

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <BasicInfoStep />;
      case 2:
        return <LineItemsStep />;
      case 3:
        return <VendorStep />;
      case 4:
        return <BudgetStep />;
      case 5:
        return <DeliveryStep />;
      case 6:
        return <AttachmentsStep />;
      case 7:
        return <ReviewStep onEdit={(step) => setCurrentStep(step)} />;
      default:
        return null;
    }
  };

  return (
    <FormProvider {...methods}>
      <PRLayout
        stepper={<Stepper currentStep={currentStep} />}
        preview={previewData ? <div ref={previewPanelRef}><LivePreview data={previewData} /></div> : null}
        onBack={onBack}
        onSaveDraft={onSaveDraft}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
      >
        <div className="space-y-12">
          {renderStep()}

          {/* Navigation Buttons */}
          <div className="pt-12 border-t border-zinc-100 flex justify-between items-center">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                currentStep === 1 
                  ? 'text-zinc-300 cursor-not-allowed' 
                  : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
              }`}
            >
              <ArrowLeft className="w-4 h-4" /> Previous Step
            </button>

            {currentStep < 7 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 px-8 py-3 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all shadow-lg active:scale-95"
              >
                Next Step <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onSubmit}
                disabled={isSubmitting}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-100 ${
                  isSubmitting
                    ? 'bg-blue-400 text-white cursor-wait'
                    : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit for Approval'} <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </PRLayout>
    </FormProvider>
  );
};
