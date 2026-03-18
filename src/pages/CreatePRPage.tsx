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
import { toast } from 'sonner';
import {
  Button as BlendButton,
  ButtonSize as BlendButtonSize,
  ButtonType as BlendButtonType,
} from '@juspay/blend-design-system';
import QuoteUploadWidget from '../components/documentParsing/QuoteUploadWidget';
import ExtractionPreviewModal from '../components/documentParsing/ExtractionPreviewModal';

interface CreatePRPageProps {
  onBack: () => void;
  onSubmitForApproval?: (data: PRFormData, previewRect?: DOMRect | null) => Promise<void> | void;
}

export const CreatePRPage: React.FC<CreatePRPageProps> = ({ onBack, onSubmitForApproval }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [previewData, setPreviewData] = useState<PRFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExtractionModal, setShowExtractionModal] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [fileUrl, setFileUrl] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
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

  const handleFileProcessed = (data, url, name) => {
    setExtractedData(data);
    setFileUrl(url);
    setFileName(name);
    setShowExtractionModal(true);
  };

  const applyExtractedData = (data) => {
    const currentData = getValues();
    
    setValue('title', data.vendor.name);
    setValue('businessJustification', `Quote from ${data.vendor.name} - ${data.quoteNumber}`);
    setValue('requiredByDate', data.validUntil);
    
    setValue('items', data.items.map(item => ({
      name: item.name,
      description: item.description || '',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total
    })));
    
    setValue('vendorSelection', {
      mode: 'rfq',
      selectedVendorId: undefined,
      rfqVendorIds: [data.vendor.name]
    });
    
    setValue('budget', {
      id: 'BUDGET-001',
      name: 'Operating Budget',
      department: data.department || 'IT',
      availableBalance: data.total,
      totalBudget: data.total * 1.2,
      currency: 'INR'
    });
    
    setValue('delivery', {
      locationType: 'new',
      address: {
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'India'
      },
      contact: {
        name: data.vendor.contactPerson,
        email: data.vendor.email,
        phone: data.vendor.phone
      },
      instructions: data.specialNotes,
      shippingMethod: 'Standard',
      installationRequired: false,
      trainingRequired: false
    });
    
    setValue('attachments', [
      ...currentData.attachments,
      {
        id: `att-${Date.now()}`,
        name: fileName,
        url: fileUrl,
        type: 'vendor_quote',
        uploadedAt: new Date().toISOString(),
        size: 0,
        category: 'Vendor Quote'
      }
    ]);
    
    setShowExtractionModal(false);
    toast.success('Quote imported successfully!');
    setCurrentStep(1);
  };

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
          <QuoteUploadWidget onFileProcessed={handleFileProcessed} />
          
          {renderStep()}

          {/* Navigation Buttons */}
          <div className="pt-12 border-t border-zinc-100 flex justify-between items-center">
            <BlendButton
              onClick={prevStep}
              disabled={currentStep === 1}
              buttonType={BlendButtonType.SECONDARY}
              size={BlendButtonSize.MEDIUM}
              text="Previous Step"
              leadingIcon={<ArrowLeft className="w-4 h-4" />}
            />

            {currentStep < 7 ? (
              <BlendButton
                onClick={nextStep}
                buttonType={BlendButtonType.PRIMARY}
                size={BlendButtonSize.MEDIUM}
                text="Next Step"
                trailingIcon={<ArrowRight className="w-4 h-4" />}
              />
            ) : (
              <BlendButton
                onClick={onSubmit}
                disabled={isSubmitting}
                buttonType={BlendButtonType.PRIMARY}
                size={BlendButtonSize.MEDIUM}
                text={isSubmitting ? 'Submitting...' : 'Submit for Approval'}
                trailingIcon={<Send className="w-4 h-4" />}
              />
            )}
          </div>
        </div>
      </PRLayout>
      
      <ExtractionPreviewModal
        isOpen={showExtractionModal}
        onClose={() => setShowExtractionModal(false)}
        extractedData={extractedData}
        onApply={applyExtractedData}
      />
    </FormProvider>
  );
};