'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  title: string;
  description?: string;
  content: React.ReactNode;
}

interface OnboardingFlowProps {
  steps: OnboardingStep[];
  onComplete: () => void;
  className?: string;
}

export function OnboardingFlow({
  steps,
  onComplete,
  className,
}: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = React.useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const isLastStep = currentStep === steps.length - 1;
  const step = steps[currentStep];

  return (
    <div className={cn('w-full max-w-2xl mx-auto', className)}>
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'h-2 flex-1 rounded-full transition-all',
                    index === currentStep
                      ? 'bg-primary'
                      : index < currentStep
                      ? 'bg-primary/50'
                      : 'bg-gray-200'
                  )}
                />
              ))}
            </div>
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              跳过
            </button>
          </div>
          <CardTitle className="text-2xl">{step.title}</CardTitle>
          {step.description && (
            <p className="text-sm text-gray-600">{step.description}</p>
          )}
        </CardHeader>
        <CardContent className="min-h-[300px]">
          <div className="mb-6">{step.content}</div>
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              上一步
            </Button>
            <div className="flex gap-2">
              <span className="text-sm text-gray-500">
                {currentStep + 1} / {steps.length}
              </span>
            </div>
            <Button onClick={handleNext} className="gap-2">
              {isLastStep ? (
                <>
                  完成
                  <Check className="h-4 w-4" />
                </>
              ) : (
                <>
                  下一步
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
