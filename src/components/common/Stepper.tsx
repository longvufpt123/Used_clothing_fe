import React from 'react';
import { Check } from 'lucide-react';
import './Stepper.css';

interface StepperProps {
  steps: string[];
  currentStep: number; // 0-indexed
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStep }) => {
  return (
    <div className="stepper-container">
      {steps.map((step, idx) => {
        const isCompleted = idx < currentStep;
        const isActive = idx === currentStep;

        return (
          <React.Fragment key={idx}>
            <div className={`stepper-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
              <div className="step-badge">
                {isCompleted ? <Check size={16} /> : idx + 1}
              </div>
              <span className="step-label">{step}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`step-divider ${isCompleted ? 'completed' : ''}`}></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
export default Stepper;
