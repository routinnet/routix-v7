import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export interface SubscriptionPlansProps {
  onSelectPlan?: (planId: string) => void;
}

export function SubscriptionPlans({ onSelectPlan }: SubscriptionPlansProps) {
  const { data: plans, isLoading } = trpc.payment.getSubscriptionPlans.useQuery();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    onSelectPlan?.(planId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">Loading subscription plans...</p>
      </div>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">No subscription plans available.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-playfair font-bold mb-2">Choose Your Plan</h2>
        <p className="text-gray-600">Select the plan that best fits your needs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan: any) => (
          <Card
            key={plan.id}
            className={`p-6 relative transition-all ${
              selectedPlan === plan.id
                ? 'border-blue-500 border-2 shadow-lg'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            {plan.isPopular && (
              <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-3 py-1 rounded-bl-lg rounded-tr-lg">
                Popular
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="flex items-baseline justify-center mb-2">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-gray-500 ml-2">/{plan.interval}</span>
              </div>
              <p className="text-gray-600 text-sm">{plan.description}</p>
            </div>

            <div className="space-y-3 mb-6">
              {plan.features && plan.features.map((feature: string, idx: number) => (
                <div key={idx} className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={() => handleSelectPlan(plan.id)}
              className={`w-full ${
                selectedPlan === plan.id
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-800 hover:bg-gray-900'
              }`}
            >
              {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
            </Button>
          </Card>
        ))}
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>All plans include a 14-day free trial. Cancel anytime.</p>
      </div>
    </div>
  );
}

