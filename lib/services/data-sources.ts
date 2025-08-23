export const DATA_SOURCES = {
  primary: {
    name: 'Polygon.io',
    baseUrl: 'https://api.polygon.io',
    features: ['real-time', 'historical', 'options'],
    rateLimit: { requests: 5, period: 'minute' },
  },
  secondary: {
    name: 'Alpha Vantage', 
    baseUrl: 'https://www.alphavantage.co',
    features: ['fundamentals', 'economic-indicators'],
    rateLimit: { requests: 25, period: 'day' },
  },
  llm: {
    name: 'OpenAI',
    model: 'gpt-4-turbo',
    features: ['sentiment-analysis', 'summarization'],
  }
} as const;

export interface DataSourceConfig {
  name: string;
  baseUrl: string;
  features: string[];
  rateLimit: {
    requests: number;
    period: string;
  };
}

export interface StockData {
  symbol: string;
  companyName: string;
  sector?: string;
  industry?: string;
  marketCap?: number;
}

export interface PriceData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  interval: '1m' | '5m' | '1h' | '1d';
}

export interface FundamentalData {
  reportDate: Date;
  quarter?: string;
  year: number;
  revenue?: number;
  netIncome?: number;
  eps?: number;
  pe?: number;
  pb?: number;
  roe?: number;
  debtToEquity?: number;
}

export interface NewsArticle {
  title: string;
  content?: string;
  source?: string;
  url?: string;
  publishedAt: Date;
  sentimentScore?: number;
  sentimentLabel?: 'positive' | 'neutral' | 'negative';
  summary?: string;
}
