import { getDb } from './db';
import { coupons, creditTransactions } from '../drizzle/schema';
import { eq, and, gt, isNull, or } from 'drizzle-orm';

export interface CouponValidationResult {
  valid: boolean;
  coupon?: any;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  message: string;
}

export interface ApplyCouponResult {
  success: boolean;
  discountAmount: number;
  finalPrice: number;
  message: string;
}

/**
 * Validate a coupon code
 */
export async function validateCoupon(code: string): Promise<CouponValidationResult> {
  const db = await getDb();
  if (!db) {
    return {
      valid: false,
      message: 'Database not available',
    };
  }

  try {
    const coupon = await (db as any).query.coupons.findFirst({
      where: eq(coupons.code, code.toUpperCase()),
    });

    if (!coupon) {
      return {
        valid: false,
        message: 'Coupon code not found',
      };
    }

    // Check if coupon is expired
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return {
        valid: false,
        message: 'Coupon has expired',
      };
    }

    // Check if coupon has reached max uses
    if (coupon.maxUses && coupon.timesUsed >= coupon.maxUses) {
      return {
        valid: false,
        message: 'Coupon has reached maximum uses',
      };
    }

    // Determine discount type and amount
    const discountType = coupon.discountPercent ? 'percentage' : 'fixed';
    const discount = coupon.discountPercent || coupon.discountAmount;

    return {
      valid: true,
      coupon,
      discount,
      discountType,
      message: 'Coupon is valid',
    };
  } catch (error) {
    console.error('Error validating coupon:', error);
    return {
      valid: false,
      message: 'Error validating coupon',
    };
  }
}

/**
 * Apply a coupon to a purchase amount
 */
export async function applyCoupon(
  code: string,
  originalPrice: number
): Promise<ApplyCouponResult> {
  const validation = await validateCoupon(code);

  if (!validation.valid) {
    return {
      success: false,
      discountAmount: 0,
      finalPrice: originalPrice,
      message: validation.message,
    };
  }

  try {
    const db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }

    let discountAmount = 0;

    if (validation.discountType === 'percentage') {
      discountAmount = (originalPrice * (validation.discount || 0)) / 100;
    } else {
      discountAmount = validation.discount || 0;
    }

    const finalPrice = Math.max(0, originalPrice - discountAmount);

    // Increment coupon usage
    await (db as any)
      .update(coupons)
      .set({
        timesUsed: (validation.coupon?.timesUsed || 0) + 1,
      })
      .where(eq(coupons.id, validation.coupon?.id));

    return {
      success: true,
      discountAmount,
      finalPrice,
      message: `Coupon applied successfully. You save $${discountAmount.toFixed(2)}`,
    };
  } catch (error) {
    console.error('Error applying coupon:', error);
    return {
      success: false,
      discountAmount: 0,
      finalPrice: originalPrice,
      message: 'Error applying coupon',
    };
  }
}

/**
 * Create a new coupon code
 */
export async function createCoupon(
  code: string,
  discountPercent?: number,
  discountAmount?: number,
  maxUses?: number,
  expiresAt?: Date
): Promise<any> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  try {
    const coupon = {
      id: `coupon_${Date.now()}`,
      code: code.toUpperCase(),
      discountPercent: discountPercent || null,
      discountAmount: discountAmount || null,
      maxUses: maxUses || null,
      timesUsed: 0,
      expiresAt: expiresAt || null,
    };

    await (db as any).insert(coupons).values(coupon);
    return coupon;
  } catch (error) {
    console.error('Error creating coupon:', error);
    throw new Error('Failed to create coupon');
  }
}

/**
 * Get coupon statistics
 */
export async function getCouponStats(couponId: string): Promise<any> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  try {
    const coupon = await (db as any).query.coupons.findFirst({
      where: eq(coupons.id, couponId),
    });

    if (!coupon) {
      throw new Error('Coupon not found');
    }

    return {
      id: coupon.id,
      code: coupon.code,
      timesUsed: coupon.timesUsed,
      maxUses: coupon.maxUses,
      remainingUses: coupon.maxUses ? coupon.maxUses - coupon.timesUsed : null,
      discount: coupon.discountPercent || coupon.discountAmount,
      discountType: coupon.discountPercent ? 'percentage' : 'fixed',
      expiresAt: coupon.expiresAt,
      isExpired: coupon.expiresAt ? new Date(coupon.expiresAt) < new Date() : false,
    };
  } catch (error) {
    console.error('Error getting coupon stats:', error);
    throw new Error('Failed to get coupon stats');
  }
}



