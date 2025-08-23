import axios from 'axios';
import { DATA_SOURCES } from './data-sources';
import type { StockData, PriceData, FundamentalData } from './data-sources';

export class AlphaVantageService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY || '';
    this.baseUrl = DATA_SOURCES.secondary.baseUrl;
  }

  private async makeRequest(endpoint: string, params: Record<string, any> = {}) {
    try {
      const response = await axios.get(`${this.baseUrl}/query`, {
        params: {
          ...params,
          apikey: this.apiKey,
        },
        timeout: 10000,
      });

      if (response.data['Error Message']) {
        throw new Error(response.data['Error Message']);
      }

      if (response.data['Note']) {
        throw new Error('API rate limit exceeded: ' + response.data['Note']);
      }

      return response.data;
    } catch (error) {
      console.error('Alpha Vantage API error:', error);
      throw error;
    }
  }

  async searchStocks(query: string): Promise<StockData[]> {
    const data = await this.makeRequest('SYMBOL_SEARCH', {
      function: 'SYMBOL_SEARCH',
      keywords: query,
    });

    if (!data.bestMatches) {
      return [];
    }

    return data.bestMatches.map((match: any) => ({
      symbol: match['1. symbol'],
      companyName: match['2. name'],
      sector: match['3. type'],
      industry: match['4. region'],
    }));
  }

  async getStockOverview(symbol: string): Promise<StockData | null> {
    const data = await this.makeRequest('OVERVIEW', {
      function: 'OVERVIEW',
      symbol: symbol.toUpperCase(),
    });

    if (!data.Symbol) {
      return null;
    }

    const marketCap = data.MarketCapitalization ? parseInt(data.MarketCapitalization) : undefined;
    
    return {
      symbol: data.Symbol,
      companyName: data.Name,
      sector: data.Sector,
      industry: data.Industry,
      marketCap: isNaN(marketCap) ? undefined : marketCap,
    };
  }

  async getHistoricalPrices(symbol: string, interval: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<PriceData[]> {
    const functionMap = {
      daily: 'TIME_SERIES_DAILY',
      weekly: 'TIME_SERIES_WEEKLY',
      monthly: 'TIME_SERIES_MONTHLY',
    };

    const data = await this.makeRequest('TIME_SERIES', {
      function: functionMap[interval],
      symbol: symbol.toUpperCase(),
      outputsize: 'compact',
    });

    const timeSeriesKey = Object.keys(data).find(key => key.includes('Time Series'));
    if (!timeSeriesKey) {
      return [];
    }

    const timeSeries = data[timeSeriesKey];
    const prices: PriceData[] = [];

    for (const [date, values] of Object.entries(timeSeries)) {
      const priceData = values as any;
      const open = parseFloat(priceData['1. open']);
      const high = parseFloat(priceData['2. high']);
      const low = parseFloat(priceData['3. low']);
      const close = parseFloat(priceData['4. close']);
      const volume = parseInt(priceData['5. volume']);
      
      // 只添加有效的数据
      if (!isNaN(open) && !isNaN(high) && !isNaN(low) && !isNaN(close) && !isNaN(volume)) {
        prices.push({
          timestamp: new Date(date),
          open,
          high,
          low,
          close,
          volume,
          interval: interval === 'daily' ? '1d' : interval === 'weekly' ? '1d' : '1d',
        });
      }
    }

    return prices.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async getFundamentals(symbol: string): Promise<FundamentalData[]> {
    try {
      // 获取收入报表
      const incomeData = await this.makeRequest('INCOME_STATEMENT', {
        function: 'INCOME_STATEMENT',
        symbol: symbol.toUpperCase(),
      });

      // 获取资产负债表
      const balanceData = await this.makeRequest('BALANCE_SHEET', {
        function: 'BALANCE_SHEET',
        symbol: symbol.toUpperCase(),
      });

      // 获取现金流量表
      const cashFlowData = await this.makeRequest('CASH_FLOW', {
        function: 'CASH_FLOW',
        symbol: symbol.toUpperCase(),
      });

      // 获取公司概览
      const overviewData = await this.makeRequest('OVERVIEW', {
        function: 'OVERVIEW',
        symbol: symbol.toUpperCase(),
      });

      const reports = [];
      
      // 处理收入报表数据
      if (incomeData.annualReports || incomeData.quarterlyReports) {
        const incomeReports = [...(incomeData.annualReports || []), ...(incomeData.quarterlyReports || [])];
        
        for (const report of incomeReports) {
          const reportDate = new Date(report.fiscalDateEnding);
          const year = reportDate.getFullYear();
          const quarter = report.fiscalDateEnding.includes('Q') ? report.fiscalDateEnding : undefined;
          
          // 查找对应的资产负债表和现金流量表数据
          const balanceReport = this.findReportByDate(balanceData, reportDate);
          const cashFlowReport = this.findReportByDate(cashFlowData, reportDate);
          
          const fundamentalData = {
            reportDate,
            quarter: quarter || undefined,
            year,
            // 收入相关
            revenue: this.parseBigInt(report.totalRevenue),
            grossProfit: this.parseBigInt(report.grossProfit),
            operatingIncome: this.parseBigInt(report.operatingIncome),
            netIncome: this.parseBigInt(report.netIncome),
            // 每股指标
            eps: this.parseFloat(report.eps),
            dilutedEps: this.parseFloat(report.dilutedEps),
            // 资产负债表指标
            totalAssets: balanceReport ? this.parseBigInt(balanceReport.totalAssets) : undefined,
            totalLiabilities: balanceReport ? this.parseBigInt(balanceReport.totalLiabilities) : undefined,
            totalEquity: balanceReport ? this.parseBigInt(balanceReport.totalShareholderEquity) : undefined,
            currentAssets: balanceReport ? this.parseBigInt(balanceReport.totalCurrentAssets) : undefined,
            currentLiabilities: balanceReport ? this.parseBigInt(balanceReport.totalCurrentLiabilities) : undefined,
            cashAndEquivalents: balanceReport ? this.parseBigInt(balanceReport.cashAndCashEquivalentsAtCarryingValue) : undefined,
            totalDebt: balanceReport ? this.parseBigInt(balanceReport.totalDebt) : undefined,
            // 现金流
            operatingCashFlow: cashFlowReport ? this.parseBigInt(cashFlowReport.operatingCashflow) : undefined,
            investingCashFlow: cashFlowReport ? this.parseBigInt(cashFlowReport.cashflowFromInvestment) : undefined,
            financingCashFlow: cashFlowReport ? this.parseBigInt(cashFlowReport.cashflowFromFinancing) : undefined,
            freeCashFlow: cashFlowReport ? this.parseBigInt(cashFlowReport.operatingCashflow) - this.parseBigInt(cashFlowReport.capitalExpenditures) : undefined,
            // 其他指标
            sharesOutstanding: overviewData.SharesOutstanding ? parseInt(overviewData.SharesOutstanding) : undefined,
            marketCap: overviewData.MarketCapitalization ? parseInt(overviewData.MarketCapitalization) : undefined,
            enterpriseValue: overviewData.MarketCapitalization && overviewData.TotalDebt ? 
              parseInt(overviewData.MarketCapitalization) + parseInt(overviewData.TotalDebt) : undefined,
          };
          
          reports.push(fundamentalData);
        }
      }

      return reports;
    } catch (error) {
      console.error('Error fetching fundamentals:', error);
      return [];
    }
  }

  private findReportByDate(data: any, targetDate: Date): any {
    if (!data.annualReports && !data.quarterlyReports) return null;
    
    const reports = [...(data.annualReports || []), ...(data.quarterlyReports || [])];
    return reports.find((report: any) => {
      const reportDate = new Date(report.fiscalDateEnding);
      return reportDate.getTime() === targetDate.getTime();
    });
  }

  private parseBigInt(value: any): number | undefined {
    if (!value) return undefined;
    const parsed = parseInt(value);
    return isNaN(parsed) ? undefined : parsed;
  }

  private parseFloat(value: any): number | undefined {
    if (!value) return undefined;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? undefined : parsed;
  }

  async getEarnings(symbol: string): Promise<FundamentalData[]> {
    const data = await this.makeRequest('EARNINGS', {
      function: 'EARNINGS',
      symbol: symbol.toUpperCase(),
    });

    if (!data.annualEarnings && !data.quarterlyEarnings) {
      return [];
    }

    const earnings = [...(data.annualEarnings || []), ...(data.quarterlyEarnings || [])];
    
    return earnings.map((earning: any) => {
      const eps = earning.reportedEPS ? parseFloat(earning.reportedEPS) : undefined;
      
      return {
        reportDate: new Date(earning.fiscalDateEnding),
        quarter: earning.fiscalDateEnding.includes('Q') ? earning.fiscalDateEnding : undefined,
        year: new Date(earning.fiscalDateEnding).getFullYear(),
        eps: isNaN(eps) ? undefined : eps,
      };
    });
  }
}
