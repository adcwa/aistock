'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Stock {
  id: number;
  symbol: string;
  companyName: string;
  sector?: string;
  industry?: string;
  marketCap?: number;
}

interface TechnicalIndicators {
  sma50?: number;
  sma200?: number;
  rsi14?: number;
  macd?: number;
  macdSignal?: number;
  bbUpper?: number;
  bbLower?: number;
  obv?: number;
}

interface FinancialRatios {
  peRatio?: number;
  pbRatio?: number;
  roe?: number;
  debtToEquity?: number;
  profitMargin?: number;
  revenueGrowth?: number;
  earningsGrowth?: number;
}

interface Recommendation {
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  confidence: number;
  reasoning: string;
  scores: {
    technical: number;
    fundamental: number;
    sentiment: number;
    macro: number;
  };
  riskLevel: 'low' | 'medium' | 'high';
  timeHorizon: 'short' | 'medium' | 'long';
  summary: string;
  riskWarning: string;
}

interface AIAnalysis {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  reasoning: string;
  keyFactors: string[];
  riskFactors: string[];
  recommendation: string;
  summary: string;
}

interface PricePrediction {
  predictedPrice: number;
  confidence: number;
  timeFrame: string;
  reasoning: string;
  riskFactors: string[];
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
}

interface AnalysisData {
  stock: Stock;
  analysis: {
    technical: {
      indicators: TechnicalIndicators;
      score: number;
    };
    fundamental: {
      ratios: FinancialRatios;
      score: number;
      summary: string;
    };
    ai: AIAnalysis;
    recommendation: Recommendation;
    pricePrediction: PricePrediction | null;
    scores: {
      technical: number;
      fundamental: number;
      sentiment: number;
      macro: number;
    };
    overallScore: number;
    confidence: number;
  };
  dataPoints: {
    prices: number;
    fundamentals: number;
  };
}

export default function StockDetailPage({ params }: { params: Promise<{ symbol: string }> }) {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ symbol }) => {
      loadStockAnalysis(symbol);
    });
  }, [params]);

  const loadStockAnalysis = async (symbol?: string) => {
    if (!symbol) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/stocks/${symbol}/analysis`);
      if (response.ok) {
        const data = await response.json();
        setAnalysisData(data);
      } else {
        setError('Failed to load stock analysis');
      }
    } catch (error) {
      console.error('Failed to load stock analysis:', error);
      setError('Failed to load stock analysis');
    } finally {
      setLoading(false);
    }
  };



  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'strong_buy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'buy':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'hold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'sell':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'strong_sell':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRecommendationText = (recommendation: string) => {
    switch (recommendation) {
      case 'strong_buy':
        return '强烈买入';
      case 'buy':
        return '买入';
      case 'hold':
        return '持有';
      case 'sell':
        return '卖出';
      case 'strong_sell':
        return '强烈卖出';
      default:
        return '未知';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.7) return 'text-green-600';
    if (score >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatMarketCap = (marketCap?: number) => {
    if (!marketCap) return 'N/A';
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse">
                <div className="w-8 h-8 bg-blue-600 rounded-full opacity-75"></div>
              </div>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-2">AI分析进行中...</h3>
          <p className="text-gray-600 mb-4">正在收集和分析股票数据</p>
          <div className="flex justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analysisData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error || '无法加载股票数据'}</p>
          <Button onClick={() => params.then(({ symbol }) => loadStockAnalysis(symbol))}>重试</Button>
        </div>
      </div>
    );
  }

  const { stock, analysis } = analysisData;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 股票基本信息 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{stock.symbol}</CardTitle>
              <p className="text-gray-600 mt-1">{stock.companyName}</p>
              <div className="flex gap-2 mt-2">
                {stock.sector && <Badge variant="outline">{stock.sector}</Badge>}
                {stock.industry && <Badge variant="outline">{stock.industry}</Badge>}
                <Badge variant="outline">{formatMarketCap(stock.marketCap)}</Badge>
              </div>
            </div>
            <Badge className={`text-lg px-4 py-2 ${getRecommendationColor(analysis.recommendation.recommendation)}`}>
              {getRecommendationText(analysis.recommendation.recommendation)}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 推荐摘要 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>投资建议</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(analysis.scores.technical)}`}>
                  {(analysis.scores.technical * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600">技术分析</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(analysis.scores.fundamental)}`}>
                  {(analysis.scores.fundamental * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600">基本面</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(analysis.scores.sentiment)}`}>
                  {(analysis.scores.sentiment * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600">情感分析</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(analysis.scores.macro)}`}>
                  {(analysis.scores.macro * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600">宏观经济</div>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">综合评分</h4>
              <div className="flex items-center gap-4">
                <div className={`text-3xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                  {(analysis.overallScore * 100).toFixed(0)}%
                </div>
                <div>
                  <div className="text-sm text-gray-600">置信度: {(analysis.confidence * 100).toFixed(0)}%</div>
                  <div className="text-sm text-gray-600">
                    风险等级: {analysis.recommendation.riskLevel === 'low' ? '低' : 
                              analysis.recommendation.riskLevel === 'medium' ? '中' : '高'}
                  </div>
                  <div className="text-sm text-gray-600">
                    投资周期: {analysis.recommendation.timeHorizon === 'short' ? '短期' : 
                              analysis.recommendation.timeHorizon === 'medium' ? '中期' : '长期'}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">AI分析</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">情感倾向:</span>
                  <Badge variant={
                    analysis.ai.sentiment === 'bullish' ? 'default' :
                    analysis.ai.sentiment === 'bearish' ? 'destructive' : 'secondary'
                  }>
                    {analysis.ai.sentiment === 'bullish' ? '看涨' : 
                     analysis.ai.sentiment === 'bearish' ? '看跌' : '中性'}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    (置信度: {analysis.ai.confidence}%)
                  </span>
                </div>
                <div>
                  <p className="text-gray-700 text-sm">{analysis.ai.reasoning}</p>
                </div>
                {analysis.ai.keyFactors.length > 0 && (
                  <div>
                    <h5 className="font-medium text-sm mb-1">关键因素:</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {analysis.ai.keyFactors.map((factor, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-600 mt-1">•</span>
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.ai.riskFactors.length > 0 && (
                  <div>
                    <h5 className="font-medium text-sm mb-1 text-red-600">风险因素:</h5>
                    <ul className="text-sm text-red-600 space-y-1">
                      {analysis.ai.riskFactors.map((risk, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="mt-1">⚠</span>
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {analysis.pricePrediction && (
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">价格预测</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">
                        ${analysis.pricePrediction.currentPrice.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">当前价格</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-bold ${
                        analysis.pricePrediction.priceChange >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${analysis.pricePrediction.predictedPrice.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">预测价格</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-bold ${
                        analysis.pricePrediction.priceChange >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {analysis.pricePrediction.priceChange >= 0 ? '+' : ''}
                        ${analysis.pricePrediction.priceChange.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">价格变化</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-bold ${
                        analysis.pricePrediction.priceChangePercent >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {analysis.pricePrediction.priceChangePercent >= 0 ? '+' : ''}
                        {analysis.pricePrediction.priceChangePercent.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">变化百分比</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">预测置信度:</span>
                    <Badge variant="outline">
                      {analysis.pricePrediction.confidence}%
                    </Badge>
                    <span className="text-sm text-gray-600">时间框架: {analysis.pricePrediction.timeFrame}</span>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-sm mb-1">预测理由:</h5>
                    <p className="text-sm text-gray-700">{analysis.pricePrediction.reasoning}</p>
                  </div>
                  
                  {analysis.pricePrediction.riskFactors.length > 0 && (
                    <div>
                      <h5 className="font-medium text-sm mb-1 text-orange-600">预测风险:</h5>
                      <ul className="text-sm text-orange-600 space-y-1">
                        {analysis.pricePrediction.riskFactors.map((risk, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="mt-1">⚠</span>
                            <span>{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">分析理由</h4>
              <p className="text-gray-700">{analysis.recommendation.reasoning}</p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2 text-red-600">风险提示</h4>
              <p className="text-red-600 text-sm">{analysis.recommendation.riskWarning}</p>
            </div>
          </CardContent>
        </Card>

        {/* 技术指标 */}
        <Card>
          <CardHeader>
            <CardTitle>技术指标</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.technical.indicators.sma50 && (
              <div className="flex justify-between">
                <span className="text-sm">SMA 50:</span>
                <span className="font-mono">${analysis.technical.indicators.sma50.toFixed(2)}</span>
              </div>
            )}
            {analysis.technical.indicators.sma200 && (
              <div className="flex justify-between">
                <span className="text-sm">SMA 200:</span>
                <span className="font-mono">${analysis.technical.indicators.sma200.toFixed(2)}</span>
              </div>
            )}
            {analysis.technical.indicators.rsi14 && (
              <div className="flex justify-between">
                <span className="text-sm">RSI 14:</span>
                <span className={`font-mono ${
                  analysis.technical.indicators.rsi14 > 70 ? 'text-red-600' :
                  analysis.technical.indicators.rsi14 < 30 ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {analysis.technical.indicators.rsi14.toFixed(2)}
                </span>
              </div>
            )}
            {analysis.technical.indicators.macd && (
              <div className="flex justify-between">
                <span className="text-sm">MACD:</span>
                <span className={`font-mono ${
                  analysis.technical.indicators.macd > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {analysis.technical.indicators.macd.toFixed(4)}
                </span>
              </div>
            )}
            <div className="border-t pt-3">
              <div className="flex justify-between">
                <span className="font-semibold">技术评分:</span>
                <span className={`font-bold ${getScoreColor(analysis.technical.score)}`}>
                  {(analysis.technical.score * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 基本面分析 */}
      <Card>
        <CardHeader>
          <CardTitle>基本面分析</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {analysis.fundamental.ratios.peRatio && (
              <div className="text-center">
                                  <div className="text-lg font-semibold">{analysis.fundamental.ratios.peRatio.toFixed(2)}</div>
                <div className="text-sm text-gray-600">P/E比率</div>
              </div>
            )}
            {analysis.fundamental.ratios.pbRatio && (
              <div className="text-center">
                                  <div className="text-lg font-semibold">{analysis.fundamental.ratios.pbRatio.toFixed(2)}</div>
                <div className="text-sm text-gray-600">P/B比率</div>
              </div>
            )}
            {analysis.fundamental.ratios.roe && (
              <div className="text-center">
                                  <div className="text-lg font-semibold">{analysis.fundamental.ratios.roe.toFixed(2)}%</div>
                <div className="text-sm text-gray-600">ROE</div>
              </div>
            )}
            {analysis.fundamental.ratios.profitMargin && (
              <div className="text-center">
                                  <div className="text-lg font-semibold">{analysis.fundamental.ratios.profitMargin.toFixed(2)}%</div>
                <div className="text-sm text-gray-600">利润率</div>
              </div>
            )}
          </div>
          
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">基本面摘要</h4>
            <p className="text-gray-700">{analysis.fundamental.summary}</p>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between">
              <span className="font-semibold">基本面评分:</span>
                              <span className={`font-bold ${getScoreColor(analysis.fundamental.score)}`}>
                  {(analysis.fundamental.score * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
