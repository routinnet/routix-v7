import { getDb } from './db';
import { users, referrals, creditTransactions } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

export interface ReferralInfo {
  referralCode: string;
  referralUrl: string;
  totalReferrals: number;
  totalBonusCredits: number;
  pendingBonuses: number;
}

export interface ReferralStats {
  referrerId: string;
  totalReferrals: number;
  successfulReferrals: number;
  totalBonusAwarded: number;
  referralList: any[];
}

const REFERRAL_BONUS_CREDITS = 100; // Credits awarded for successful referral

/**
 * Generate or get referral code for a user
 */
export async function getReferralCode(userId: string): Promise<string> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  try {
    const user = await (db as any).query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new Error('User not found');
    }

    // If user already has a referral code, return it
    if (user.referralCode) {
      return user.referralCode;
    }

    // Generate new referral code
    const referralCode = `ref_${userId.substring(0, 8)}_${Date.now().toString(36)}`;

    // Update user with referral code
    await (db as any)
      .update(users)
      .set({ referralCode })
      .where(eq(users.id, userId));

    return referralCode;
  } catch (error) {
    console.error('Error getting referral code:', error);
    throw new Error('Failed to get referral code');
  }
}

/**
 * Track a referral when a new user signs up with a referral code
 */
export async function trackReferral(
  referredUserId: string,
  referralCode: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  try {
    // Find the referrer by referral code
    const referrer = await (db as any).query.users.findFirst({
      where: eq(users.referralCode, referralCode),
    });

    if (!referrer) {
      console.warn('Referral code not found:', referralCode);
      return false;
    }

    // Create referral record
    const referral = {
      id: `ref_${Date.now()}`,
      referrerId: referrer.id,
      referredId: referredUserId,
      bonusCreditsAwarded: 0, // Will be awarded on first purchase
    };

    await (db as any).insert(referrals).values(referral);

    // Update referred user with referrer info
    await (db as any)
      .update(users)
      .set({ referredBy: referrer.id })
      .where(eq(users.id, referredUserId));

    return true;
  } catch (error) {
    console.error('Error tracking referral:', error);
    return false;
  }
}

/**
 * Award referral bonus when referred user makes a purchase
 */
export async function awardReferralBonus(
  referredUserId: string,
  purchaseAmount: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  try {
    // Find the referral record
    const referral = await (db as any).query.referrals.findFirst({
      where: eq(referrals.referredId, referredUserId),
    });

    if (!referral || referral.bonusCreditsAwarded > 0) {
      // Bonus already awarded or no referral found
      return false;
    }

    const referrerId = referral.referrerId;

    // Award bonus to referrer
    const referrer = await (db as any).query.users.findFirst({
      where: eq(users.id, referrerId),
    });

    if (!referrer) {
      return false;
    }

    const newCredits = referrer.credits + REFERRAL_BONUS_CREDITS;

    // Update referrer credits
    await (db as any)
      .update(users)
      .set({ credits: newCredits })
      .where(eq(users.id, referrerId));

    // Record the bonus transaction
    await (db as any).insert(creditTransactions).values({
      id: `txn_${Date.now()}`,
      userId: referrerId,
      type: 'referral_bonus',
      amount: REFERRAL_BONUS_CREDITS,
      description: `Referral bonus for user ${referredUserId}`,
    });

    // Update referral record with awarded bonus
    await (db as any)
      .update(referrals)
      .set({ bonusCreditsAwarded: REFERRAL_BONUS_CREDITS })
      .where(eq(referrals.id, referral.id));

    return true;
  } catch (error) {
    console.error('Error awarding referral bonus:', error);
    return false;
  }
}

/**
 * Get referral statistics for a user
 */
export async function getReferralStats(userId: string): Promise<ReferralStats> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  try {
    const userReferrals = await (db as any).query.referrals.findMany({
      where: eq(referrals.referrerId, userId),
    });

    const totalBonusAwarded = userReferrals.reduce(
      (sum: number, ref: any) => sum + (ref.bonusCreditsAwarded || 0),
      0
    );

    const successfulReferrals = userReferrals.filter(
      (ref: any) => ref.bonusCreditsAwarded > 0
    ).length;

    return {
      referrerId: userId,
      totalReferrals: userReferrals.length,
      successfulReferrals,
      totalBonusAwarded,
      referralList: userReferrals,
    };
  } catch (error) {
    console.error('Error getting referral stats:', error);
    throw new Error('Failed to get referral stats');
  }
}

/**
 * Get referral information for a user
 */
export async function getReferralInfo(userId: string): Promise<ReferralInfo> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  try {
    const referralCode = await getReferralCode(userId);
    const stats = await getReferralStats(userId);

    const referralUrl = `${process.env.VITE_APP_URL || 'http://localhost:3001'}?ref=${referralCode}`;

    return {
      referralCode,
      referralUrl,
      totalReferrals: stats.totalReferrals,
      totalBonusCredits: stats.totalBonusAwarded,
      pendingBonuses: stats.totalReferrals - stats.successfulReferrals,
    };
  } catch (error) {
    console.error('Error getting referral info:', error);
    throw new Error('Failed to get referral info');
  }
}



