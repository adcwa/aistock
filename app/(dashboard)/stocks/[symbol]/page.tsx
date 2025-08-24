'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown, Minus, BarChart3, Target, Brain, History, Clock, RefreshCw, Circle } from 'lucide-react';
import AdvancedStockChart from '@/components/charts/AdvancedStockChart';
import BacktestingPanel from '@/components/backtesting/BacktestingPanel';
import { AnalysisProgress } from '@/components/ui/analysis-progress';

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAnalysisProgress, setShowAnalysisProgress] = useState(false);
  const [currentSymbol, setCurrentSymbol] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    
    params.then(({ symbol }) => {
      if (isMounted) {
        setCurrentSymbol(symbol);
        loadStockAnalysis(symbol);
        // 记录搜索历史
        recordSearchHistory(symbol);
      }
    });
    
    return () => {
      isMounted = false;
    };
  }, []);

  const recordSearchHistory = async (symbol: string) => {
    try {
      await fetch('/api/search-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 1, // 模拟用户ID
          symbol: symbol.toUpperCase(),
          companyName: '', // 将在loadStockAnalysis中更新
        }),
      });
    } catch (error) {
      console.error('Failed to record search history:', error);
    }
  };

  const loadStockAnalysis = async (symbol?: string, forceRefresh = false) => {
    if (!symbol) return;
    
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      const url = forceRefresh 
        ? `/api/stocks/${symbol}/analysis?force=true`
        : `/api/stocks/${symbol}/analysis`;
        
      const response = await fetch(url);
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
      if (forceRefresh) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleRefreshAnalysis = () => {
    setShowAnalysisProgress(true);
  };

  const handleAnalysisComplete = (data: any) => {
    setAnalysisData(data);
    setShowAnalysisProgress(false);
    setLoading(false);
    setError(null);
  };

  const handleAnalysisError = (errorMessage: string) => {
    setError(errorMessage);
    setShowAnalysisProgress(false);
    setLoading(false);
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

  if (loading && !showAnalysisProgress) {
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
          <p className="mt-4 text-gray-600">正在加载股票分析数据...</p>
        </div>
      </div>
    );
  }

  if (showAnalysisProgress && currentSymbol) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <AnalysisProgress 
          symbol={currentSymbol}
          onComplete={handleAnalysisComplete}
          onError={handleAnalysisError}
        />
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
              {/* 缓存状态显示 */}
              {(analysisData as any).cached && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    今日缓存
                  </Badge>
                  <span className="text-xs text-gray-500">
                    更新时间: {new Date((analysisData as any).cachedAt).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={`text-lg px-4 py-2 ${getRecommendationColor(analysis.recommendation.recommendation)}`}>
                {getRecommendationText(analysis.recommendation.recommendation)}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshAnalysis}
                disabled={isRefreshing}
                className="flex items-center gap-2"
              >
                {isRefreshing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
                    重新分析中...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    重新分析
                  </>
                )}
              </Button>
            </div>
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

      {/* 新增功能标签页 */}
      <Tabs defaultValue="analysis" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            智能分析
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            图表分析
          </TabsTrigger>
          <TabsTrigger value="backtesting" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            回溯分析
          </TabsTrigger>
          <TabsTrigger value="ai-insights" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI洞察
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="analysis" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>AI智能分析</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">AI分析结果</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>情绪:</span>
                        <Badge variant={analysis.ai.sentiment === 'bullish' ? 'default' : 
                                       analysis.ai.sentiment === 'bearish' ? 'destructive' : 'secondary'}>
                          {analysis.ai.sentiment === 'bullish' ? '看涨' : 
                           analysis.ai.sentiment === 'bearish' ? '看跌' : '中性'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>置信度:</span>
                        <span className="font-semibold">{(analysis.ai.confidence * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <h5 className="font-medium text-sm mb-1">分析理由:</h5>
                      <p className="text-sm text-gray-700">{analysis.ai.reasoning}</p>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">关键因素</h4>
                    <ul className="space-y-1">
                      {analysis.ai.keyFactors.map((factor, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <span className="text-green-600 mt-0.5">✓</span>
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2 text-red-600">风险因素</h4>
                  <ul className="space-y-1">
                    {analysis.ai.riskFactors.map((risk, index) => (
                      <li key={index} className="text-sm flex items-start gap-2">
                        <span className="text-red-600 mt-0.5">⚠</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="charts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>高级图表分析</CardTitle>
            </CardHeader>
            <CardContent>
              <AdvancedStockChart
                symbol={stock.symbol}
                priceData={generateMockPriceData(stock.symbol, 100)}
                indicators={generateMockIndicators()}
                timeframe="1M"
                onTimeframeChange={(timeframe) => console.log('Timeframe changed:', timeframe)}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="backtesting" className="mt-6">
          <BacktestingPanel
            symbol={stock.symbol}
            priceData={generateMockPriceData(stock.symbol, 252)}
            onBacktestComplete={(result) => console.log('Backtest completed:', result)}
          />
        </TabsContent>
        
        <TabsContent value="ai-insights" className="mt-6">
          <div className="space-y-6">
            {/* AI深度洞察 */}
            <Card>
              <CardHeader>
                <CardTitle>AI深度洞察</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">技术信号分析</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>趋势:</span>
                          <Badge variant={analysis.ai.sentiment === 'bullish' ? 'default' : 
                                         analysis.ai.sentiment === 'bearish' ? 'destructive' : 'secondary'}>
                            {analysis.ai.sentiment === 'bullish' ? '上升' : 
                             analysis.ai.sentiment === 'bearish' ? '下降' : '横盘'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>强度:</span>
                          <span className="font-semibold">中等</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">交易策略建议</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>入场点:</span>
                          <span className="font-semibold">${(analysis.pricePrediction?.currentPrice || 100).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>止损:</span>
                          <span className="font-semibold text-red-600">
                            ${((analysis.pricePrediction?.currentPrice || 100) * 0.95).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>止盈:</span>
                          <span className="font-semibold text-green-600">
                            ${((analysis.pricePrediction?.currentPrice || 100) * 1.05).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">AI推荐摘要</h4>
                    <p className="text-gray-700">{analysis.ai.summary}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 分析历史 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>分析历史</span>
                  <Button variant="outline" size="sm" onClick={() => window.location.href = '/stocks?tab=analysis'}>
                    <History className="w-4 h-4 mr-1" />
                    查看全部历史
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnalysisHistoryPanel symbol={stock.symbol} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// 生成模拟价格数据
function generateMockPriceData(symbol: string, days: number) {
  const data = [];
  let price = 100; // 起始价格
  const volatility = 0.02; // 日波动率

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    
    // 生成随机价格变动
    const change = (Math.random() - 0.5) * volatility;
    price = price * (1 + change);
    
    const open = price;
    const high = price * (1 + Math.random() * 0.01);
    const low = price * (1 - Math.random() * 0.01);
    const close = price * (1 + (Math.random() - 0.5) * 0.005);
    const volume = Math.floor(Math.random() * 1000000) + 100000;

    data.push({
      date: date.toISOString().split('T')[0],
      open,
      high,
      low,
      close,
      volume
    });
  }

  return data;
}

// 生成模拟技术指标数据
function generateMockIndicators() {
  const days = 100;
  const indicators: {
    sma50: number[];
    sma200: number[];
    rsi14: number[];
    macd: number[];
    macdSignal: number[];
    macdHistogram: number[];
    bbUpper: number[];
    bbMiddle: number[];
    bbLower: number[];
    stochK: number[];
    stochD: number[];
    williamsR: number[];
    atr: number[];
    adx: number[];
    cci: number[];
    mfi: number[];
    obv: number[];
  } = {
    sma50: [],
    sma200: [],
    rsi14: [],
    macd: [],
    macdSignal: [],
    macdHistogram: [],
    bbUpper: [],
    bbMiddle: [],
    bbLower: [],
    stochK: [],
    stochD: [],
    williamsR: [],
    atr: [],
    adx: [],
    cci: [],
    mfi: [],
    obv: []
  };

  for (let i = 0; i < days; i++) {
    indicators.sma50.push(100 + Math.random() * 10);
    indicators.sma200.push(98 + Math.random() * 8);
    indicators.rsi14.push(30 + Math.random() * 40);
    indicators.macd.push((Math.random() - 0.5) * 2);
    indicators.macdSignal.push((Math.random() - 0.5) * 2);
    indicators.macdHistogram.push((Math.random() - 0.5) * 1);
    indicators.bbUpper.push(105 + Math.random() * 5);
    indicators.bbMiddle.push(100 + Math.random() * 3);
    indicators.bbLower.push(95 + Math.random() * 5);
    indicators.stochK.push(Math.random() * 100);
    indicators.stochD.push(Math.random() * 100);
    indicators.williamsR.push(-80 + Math.random() * 60);
    indicators.atr.push(2 + Math.random() * 3);
    indicators.adx.push(20 + Math.random() * 40);
    indicators.cci.push((Math.random() - 0.5) * 200);
    indicators.mfi.push(Math.random() * 100);
    indicators.obv.push(1000000 + Math.random() * 1000000);
  }

  return indicators;
}

// 分析历史面板组件
function AnalysisHistoryPanel({ symbol }: { symbol: string }) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalysisHistory();
  }, [symbol]);

  const loadAnalysisHistory = async () => {
    try {
      const response = await fetch(`/api/analysis/history?userId=1&limit=5`);
      if (response.ok) {
        const data = await response.json();
        // 过滤出当前股票的分析历史
        const filteredHistory = data.filter((item: any) => 
          item.stockSymbol.toLowerCase() === symbol.toLowerCase()
        );
        setHistory(filteredHistory);
      }
    } catch (error) {
      console.error('Failed to load analysis history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}分钟前`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}小时前`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}天前`;
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

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-200 border-t-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-2">加载分析历史...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8">
        <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500">暂无分析历史</p>
        <p className="text-sm text-gray-400">这是首次分析该股票</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((item) => (
        <div
          key={item.id}
          className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Badge className={getRecommendationColor(item.recommendation)}>
                {getRecommendationText(item.recommendation)}
              </Badge>
              <span className="text-sm text-gray-600">
                置信度: {(item.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {formatDate(item.createdAt)}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
            <div className="text-center">
              <div className="text-sm text-gray-600">技术评分</div>
              <div className="font-semibold">{(item.technicalScore * 100).toFixed(1)}%</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">基本面评分</div>
              <div className="font-semibold">{(item.fundamentalScore * 100).toFixed(1)}%</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">情感评分</div>
              <div className="font-semibold">{(item.sentimentScore * 100).toFixed(1)}%</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">综合评分</div>
              <div className="font-semibold">{(item.overallScore * 100).toFixed(1)}%</div>
            </div>
          </div>

          <div className="text-sm text-gray-600 max-w-md truncate">
            {item.reasoning}
          </div>
        </div>
      ))}
    </div>
  );
}
