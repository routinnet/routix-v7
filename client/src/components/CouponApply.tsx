import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tag, Check, X } from 'lucide-react';

export interface CouponApplyProps {
  onApply?: (code: string) => void;
  onRemove?: () => void;
  appliedCoupon?: {
    code: string;
    discount: number;
    type: 'percentage' | 'fixed';
  } | null;
}

export function CouponApply({ onApply, onRemove, appliedCoupon }: CouponApplyProps) {
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setError('Please enter a coupon code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock validation
      const validCoupons = ['SAVE10', 'WELCOME20', 'PROMO50'];
      if (!validCoupons.includes(couponCode.toUpperCase())) {
        setError('Invalid coupon code');
        setLoading(false);
        return;
      }

      onApply?.(couponCode.toUpperCase());
      setCouponCode('');
    } catch (err) {
      setError('Failed to apply coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    onRemove?.();
    setError('');
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Apply Coupon Code</h3>
        <p className="text-sm text-gray-600">Have a coupon? Enter it below to get a discount</p>
      </div>

      {!appliedCoupon ? (
        <Card className="p-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="couponCode">Coupon Code</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="couponCode"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    setError('');
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={handleApplyCoupon}
                  disabled={loading || !couponCode.trim()}
                >
                  {loading ? 'Applying...' : 'Apply'}
                </Button>
              </div>
            </div>

            {error && (
              <div className="flex items-center text-red-600 text-sm">
                <X className="w-4 h-4 mr-1" />
                {error}
              </div>
            )}

            <div className="pt-2 border-t">
              <p className="text-xs text-gray-500 mb-2">Available Coupons:</p>
              <div className="flex flex-wrap gap-2">
                {['SAVE10', 'WELCOME20', 'PROMO50'].map((code) => (
                  <button
                    key={code}
                    onClick={() => setCouponCode(code)}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-mono"
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Tag className="w-5 h-5 text-green-600 mr-3" />
              <div>
                <p className="font-semibold text-green-800">Coupon Applied!</p>
                <p className="text-sm text-green-700">
                  Code: <span className="font-mono">{appliedCoupon.code}</span> -{' '}
                  {appliedCoupon.type === 'percentage'
                    ? `${appliedCoupon.discount}% off`
                    : `$${appliedCoupon.discount} off`}
                </p>
              </div>
            </div>
            <Button
              onClick={handleRemoveCoupon}
              variant="ghost"
              size="sm"
              className="text-green-700 hover:text-green-900"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>Note:</strong> Coupons can only be applied once per purchase and cannot be combined with other offers.
        </p>
      </div>
    </div>
  );
}

