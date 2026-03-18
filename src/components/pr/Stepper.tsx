import React from 'react';
import {
  Stepper as BlendStepper,
  StepState as BlendStepState,
  StepperType as BlendStepperType,
} from '@juspay/blend-design-system';

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
  const steps = STEPS.map((title, index) => {
    const stepNumber = index + 1;
    const status =
      currentStep > stepNumber
        ? BlendStepState.COMPLETED
        : currentStep === stepNumber
          ? BlendStepState.CURRENT
          : BlendStepState.PENDING;

    return {
      id: stepNumber,
      title,
      status,
    };
  });

  return (
    <div className="sticky top-16 z-30 w-full border-b border-zinc-200 bg-zinc-50/90 px-8 py-4 backdrop-blur-sm">
      <div className="mx-auto max-w-5xl">
        <BlendStepper
          steps={steps}
          stepperType={BlendStepperType.HORIZONTAL}
        />
      </div>
    </div>
  );
};
