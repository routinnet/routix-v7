import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator } from 'lucide-react';

export interface TaxCalculatorProps {
  subtotal: number;
  onTaxCalculated?: (taxAmount: number, total: number) => void;
}

export function TaxCalculator({ subtotal, onTaxCalculated }: TaxCalculatorProps) {
  const [taxRate, setTaxRate] = useState(8); // Default 8%
  const [taxAmount, setTaxAmount] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const calculatedTax = (subtotal * taxRate) / 100;
    const calculatedTotal = subtotal + calculatedTax;
    
    setTaxAmount(calculatedTax);
    setTotal(calculatedTotal);
    
    onTaxCalculated?.(calculatedTax, calculatedTotal);
  }, [subtotal, taxRate, onTaxCalculated]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="mb-4 flex items-center">
        <Calculator className="w-5 h-5 mr-2 text-blue-600" />
        <h3 className="text-lg font-semibold">Tax Calculation</h3>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          {/* Subtotal */}
          <div className="flex justify-between items-center pb-3 border-b">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-semibold">{formatCurrency(subtotal)}</span>
          </div>

          {/* Tax Rate Input */}
          <div>
            <Label htmlFor="taxRate">Tax Rate (%)</Label>
            <Input
              id="taxRate"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={taxRate}
              onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Tax rate varies by location. Default is 8%.
            </p>
          </div>

          {/* Tax Amount */}
          <div className="flex justify-between items-center pb-3 border-b">
            <span className="text-gray-600">Tax ({taxRate}%)</span>
            <span className="font-semibold text-blue-600">{formatCurrency(taxAmount)}</span>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center pt-2">
            <span className="text-lg font-bold">Total</span>
            <span className="text-lg font-bold text-green-600">{formatCurrency(total)}</span>
          </div>
        </div>
      </Card>

      {/* Tax Info */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Tax rates are automatically calculated based on your billing address. You can manually adjust the rate if needed.
        </p>
      </div>

      {/* Breakdown */}
      <Card className="mt-4 p-4 bg-gray-50">
        <h4 className="text-sm font-semibold mb-3">Breakdown</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Base Amount</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Sales Tax</span>
            <span>{formatCurrency(taxAmount)}</span>
          </div>
          <div className="flex justify-between font-semibold pt-2 border-t">
            <span>Amount Due</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

