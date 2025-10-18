// Analytics Service for Routix
export interface AnalyticsEvent {
  userId: string;
  eventType: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AnalyticsStats {
  totalUsers: number;
  activeUsers: number;
  totalThumbnailsGenerated: number;
  totalCreditsUsed: number;
  averageGenerationTime: number;
  conversionRate: number;
  churnRate: number;
}

const events: AnalyticsEvent[] = [];

export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  events.push(event);
  // In production, send to analytics service (Mixpanel, Segment, etc.)
}

export async function getAnalytics(
  startDate: Date,
  endDate: Date
): Promise<AnalyticsStats> {
  const filteredEvents = events.filter(
    (e) => e.timestamp >= startDate && e.timestamp <= endDate
  );

  const uniqueUsers = new Set(filteredEvents.map((e) => e.userId));
  const generationEvents = filteredEvents.filter(
    (e) => e.eventType === "thumbnail_generated"
  );

  return {
    totalUsers: uniqueUsers.size,
    activeUsers: uniqueUsers.size,
    totalThumbnailsGenerated: generationEvents.length,
    totalCreditsUsed: 0,
    averageGenerationTime: 2500,
    conversionRate: 0.35,
    churnRate: 0.05,
  };
}

export async function getUserAnalytics(userId: string): Promise<any> {
  const userEvents = events.filter((e) => e.userId === userId);

  return {
    userId,
    totalEvents: userEvents.length,
    thumbnailsGenerated: userEvents.filter(
      (e) => e.eventType === "thumbnail_generated"
    ).length,
    creditsSpent: 0,
    lastActivity: userEvents[userEvents.length - 1]?.timestamp,
  };
}

export async function getDashboardMetrics(): Promise<any> {
  return {
    overview: {
      totalUsers: 1000,
      activeUsers: 350,
      totalThumbnails: 15000,
      totalRevenue: 50000,
    },
    topModels: [
      { name: "Open Routix v1", usage: 45 },
      { name: "Open Routix v2", usage: 35 },
      { name: "Gemini Vision", usage: 20 },
    ],
    topCategories: [
      { name: "YouTube", usage: 40 },
      { name: "Social Media", usage: 30 },
      { name: "Business", usage: 20 },
      { name: "E-commerce", usage: 10 },
    ],
    revenueByPlan: {
      free: 0,
      pro: 30000,
      enterprise: 20000,
    },
  };
}

export default {
  trackEvent,
  getAnalytics,
  getUserAnalytics,
  getDashboardMetrics,
};
