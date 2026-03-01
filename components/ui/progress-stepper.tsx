'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
  label: string
  description?: string
}

interface ProgressStepperProps {
  steps: Step[]
  currentStep: number
  className?: string
}

export function ProgressStepper({ steps, currentStep, className }: ProgressStepperProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          return (
            <div key={index} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                    isCompleted && 'bg-[#e2b714] text-[#1a1a2e]',
                    isCurrent && 'bg-[#1a1a2e] text-white ring-4 ring-[#e2b714]/30',
                    !isCompleted && !isCurrent && 'bg-gray-200 text-gray-500'
                  )}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : index + 1}
                </div>
                <span className={cn(
                  'text-xs mt-2 text-center max-w-[80px]',
                  (isCompleted || isCurrent) ? 'text-[#1a1a2e] font-medium' : 'text-gray-400'
                )}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 mx-2 mt-[-20px]',
                  isCompleted ? 'bg-[#e2b714]' : 'bg-gray-200'
                )} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
