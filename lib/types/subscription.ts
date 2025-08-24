export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise'
}

export interface SubscriptionLimits {
  dailyQueries: number;
  aiAnalysisPerDay: number;
  watchlistLimit: number;
  emailNotifications: boolean;
  customAIConfig: boolean;
  advancedFeatures: boolean;
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  [SubscriptionTier.FREE]: {
    dailyQueries: 50,
    aiAnalysisPerDay: 10,
    watchlistLimit: 5,
    emailNotifications: false,
    customAIConfig: false,
    advancedFeatures: false
  },
  [SubscriptionTier.PRO]: {
    dailyQueries: 500,
    aiAnalysisPerDay: 100,
    watchlistLimit: 20,
    emailNotifications: true,
    customAIConfig: true,
    advancedFeatures: false
  },
  [SubscriptionTier.ENTERPRISE]: {
    dailyQueries: 5000,
    aiAnalysisPerDay: 1000,
    watchlistLimit: 100,
    emailNotifications: true,
    customAIConfig: true,
    advancedFeatures: true
  }
};

export interface UsageStatus {
  tier: SubscriptionTier;
  limits: SubscriptionLimits;
  currentUsage: {
    queriesUsed: number;
    aiAnalysisUsed: number;
    watchlistCount: number;
  };
  remaining: {
    queriesRemaining: number;
    aiAnalysisRemaining: number;
    watchlistRemaining: number;
  };
  isOverLimit: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: SubscriptionLimits;
}
