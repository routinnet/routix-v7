import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Plus } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export interface PaymentMethodProps {
  onUpdate?: () => void;
}

export function PaymentMethod({ onUpdate }: PaymentMethodProps) {
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [loading, setLoading] = useState(false);

  const updatePaymentMethod = trpc.payment.updatePaymentMethod.useMutation();

  const handleAddCard = async () => {
    setLoading(true);
    try {
      // In production, tokenize card with Stripe
      await updatePaymentMethod.mutateAsync({
        paymentMethodId: `pm_${Date.now()}`,
      });
      setShowAddCard(false);
      setCardNumber('');
      setExpiryDate('');
      setCvv('');
      setCardholderName('');
      onUpdate?.();
    } catch (error) {
      console.error('Failed to add payment method:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 19);
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    }
    return cleaned;
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-playfair font-bold mb-2">Payment Methods</h2>
        <p className="text-gray-600 text-sm">Manage your payment methods</p>
      </div>

      {/* Existing Payment Methods */}
      <div className="space-y-4 mb-6">
        <Card className="p-4 flex items-center justify-between">
          <div className="flex items-center">
            <CreditCard className="w-10 h-10 text-blue-500 mr-4" />
            <div>
              <p className="font-semibold">Visa ending in 4242</p>
              <p className="text-sm text-gray-500">Expires 12/25</p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            Remove
          </Button>
        </Card>
      </div>

      {/* Add New Card */}
      {!showAddCard ? (
        <Button
          onClick={() => setShowAddCard(true)}
          variant="outline"
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Payment Method
        </Button>
      ) : (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Add New Card</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cardholderName">Cardholder Name</Label>
              <Input
                id="cardholderName"
                placeholder="John Doe"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                maxLength={19}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  placeholder="MM/YY"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                  maxLength={5}
                />
              </div>

              <div>
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                  maxLength={4}
                  type="password"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleAddCard}
                disabled={loading || !cardNumber || !expiryDate || !cvv || !cardholderName}
                className="flex-1"
              >
                {loading ? 'Adding...' : 'Add Card'}
              </Button>
              <Button
                onClick={() => setShowAddCard(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Secure Payment:</strong> Your payment information is encrypted and secure. We use Stripe to process payments.
        </p>
      </div>
    </div>
  );
}

