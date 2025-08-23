// Data Sources Configuration
export const DATA_SOURCES = {
  // Alpha Vantage API for stock data
  ALPHA_VANTAGE: {
    baseUrl: 'https://www.alphavantage.co/query',
    apiKey: process.env.ALPHA_VANTAGE_API_KEY || 'demo',
    rateLimit: 5, // requests per minute for free tier
  },

  // Polygon.io for real-time data (future implementation)
  POLYGON: {
    baseUrl: 'https://api.polygon.io',
    apiKey: process.env.POLYGON_API_KEY || '',
    rateLimit: 5,
  },

  // OpenAI for sentiment analysis and AI insights
  OPENAI: {
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    maxTokens: 1000,
    temperature: 0.3,
  },

  // News API for market news
  NEWS_API: {
    baseUrl: 'https://newsapi.org/v2',
    apiKey: process.env.NEWS_API_KEY || '',
    rateLimit: 100, // requests per day for free tier
  },
};

// TypeScript interfaces for data structures
export interface StockData {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  country: string;
  sector?: string;
  industry?: string;
  marketCap?: string;
  peRatio?: string;
  dividendYield?: string;
  eps?: string;
  price?: string;
  change?: string;
  changePercent?: string;
}

export interface PriceData {
  date: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

export interface FundamentalData {
  reportDate: Date;
  quarter?: string;
  year: number;
  // 收入相关
  revenue?: number;
  grossProfit?: number;
  operatingIncome?: number;
  netIncome?: number;
  // 每股指标
  eps?: number;
  dilutedEps?: number;
  // 资产负债表指标
  totalAssets?: number;
  totalLiabilities?: number;
  totalEquity?: number;
  currentAssets?: number;
  currentLiabilities?: number;
  cashAndEquivalents?: number;
  totalDebt?: number;
  // 现金流
  operatingCashFlow?: number;
  investingCashFlow?: number;
  financingCashFlow?: number;
  freeCashFlow?: number;
  // 其他指标
  sharesOutstanding?: number;
  marketCap?: number;
  enterpriseValue?: number;
}

export interface NewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  publishedAt: string;
  source: {
    name: string;
    url?: string;
  };
  sentiment?: 'positive' | 'negative' | 'neutral';
  relevanceScore?: number;
}

export interface AIConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface AnalysisRequest {
  symbol: string;
  technicalData: any;
  fundamentalData: any;
  newsData: NewsArticle[];
  aiConfig?: AIConfig;
}

export interface AIAnalysis {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  reasoning: string;
  keyFactors: string[];
  riskFactors: string[];
  recommendation: string;
  summary: string;
}
