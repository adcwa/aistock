'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Plus, 
  Eye, 
  Trash2, 
  Star,
  Clock,
  TrendingUp,
  TrendingDown,
  Brain,
  History,
  Filter,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

interface Stock {
  id: number;
  symbol: string;
  companyName: string;
  sector?: string;
  industry?: string;
  marketCap?: number;
}

interface WatchlistStock {
  id: number;
  addedAt: string;
  stock: Stock;
}

interface Watchlist {
  id: number;
  name: string;
  description?: string;
  stockCount: number;
}

interface SearchHistory {
  id: number;
  symbol: string;
  companyName: string;
  searchedAt: string;
}

interface AnalysisHistory {
  id: number;
  stockId: number;
  stockSymbol: string;
  stockName: string;
  recommendation: string;
  confidence: number;
  technicalScore: number;
  fundamentalScore: number;
  sentimentScore: number;
  macroScore: number;
  overallScore: number;
  reasoning: string;
  aiSentiment: string;
  aiConfidence: number;
  aiReasoning: string;
  predictedPrice?: number;
  createdAt: string;
}

export default function StocksPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Stock[]>([]);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [selectedWatchlist, setSelectedWatchlist] = useState<number | null>(null);
  const [watchlistStocks, setWatchlistStocks] = useState<WatchlistStock[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistory[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingWatchlist, setIsLoadingWatchlist] = useState(false);
  const [activeTab, setActiveTab] = useState('search');

  // 模拟用户ID（实际应用中应该从认证系统获取）
  const userId = 1;

  useEffect(() => {
    loadWatchlists();
    loadSearchHistory();
    loadAnalysisHistory();
  }, []);

  useEffect(() => {
    if (selectedWatchlist) {
      loadWatchlistStocks(selectedWatchlist);
    }
  }, [selectedWatchlist]);

  const loadWatchlists = async () => {
    try {
      const response = await fetch(`/api/watchlists?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setWatchlists(data);
        if (data.length > 0 && !selectedWatchlist) {
          setSelectedWatchlist(data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load watchlists:', error);
    }
  };

  const loadWatchlistStocks = async (watchlistId: number) => {
    setIsLoadingWatchlist(true);
    try {
      const response = await fetch(`/api/watchlists/${watchlistId}/stocks`);
      if (response.ok) {
        const data = await response.json();
        setWatchlistStocks(data);
      }
    } catch (error) {
      console.error('Failed to load watchlist stocks:', error);
    } finally {
      setIsLoadingWatchlist(false);
    }
  };

  const loadSearchHistory = async () => {
    try {
      const response = await fetch(`/api/search-history?userId=${userId}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setSearchHistory(data);
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  };

  const loadAnalysisHistory = async () => {
    try {
      const response = await fetch(`/api/analysis/history?userId=${userId}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setAnalysisHistory(data);
      }
    } catch (error) {
      console.error('Failed to load analysis history:', error);
    }
  };

  const searchStocks = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`/api/stocks?q=${encodeURIComponent(searchQuery)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.stocks || []);
        
        // 记录搜索历史
        if (data.stocks && data.stocks.length > 0) {
          const firstStock = data.stocks[0];
          await fetch('/api/search-history', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              symbol: firstStock.symbol,
              companyName: firstStock.companyName,
            }),
          });
          // 重新加载搜索历史
          loadSearchHistory();
        }
      }
    } catch (error) {
      console.error('Failed to search stocks:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const addStockToWatchlist = async (stockId: number, watchlistId: number) => {
    try {
      const response = await fetch(`/api/watchlists/${watchlistId}/stocks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stockId }),
      });

      if (response.ok) {
        loadWatchlists();
        if (selectedWatchlist === watchlistId) {
          loadWatchlistStocks(watchlistId);
        }
      }
    } catch (error) {
      console.error('Failed to add stock to watchlist:', error);
    }
  };

  const removeStockFromWatchlist = async (stockId: number) => {
    if (!selectedWatchlist) return;

    try {
      const response = await fetch(`/api/watchlists/${selectedWatchlist}/stocks?stockId=${stockId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadWatchlistStocks(selectedWatchlist);
        loadWatchlists();
      }
    } catch (error) {
      console.error('Failed to remove stock from watchlist:', error);
    }
  };

  const addStockFromHistory = async (symbol: string, companyName: string) => {
    if (!selectedWatchlist) {
      alert('请先选择一个观察列表');
      return;
    }

    try {
      // 首先检查股票是否已存在，如果不存在则创建
      const stockResponse = await fetch(`/api/stocks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: symbol.toUpperCase(),
          companyName,
        }),
      });

      if (stockResponse.ok) {
        const stockData = await stockResponse.json();
        
        // 将股票添加到观察列表
        const watchlistResponse = await fetch(`/api/watchlists/${selectedWatchlist}/stocks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ stockId: stockData.id }),
        });

        if (watchlistResponse.ok) {
          loadWatchlistStocks(selectedWatchlist);
          loadWatchlists();
          alert(`${symbol} 已添加到观察列表`);
        }
      }
    } catch (error) {
      console.error('Failed to add stock from history:', error);
      alert('添加股票失败');
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

  const formatMarketCap = (marketCap?: number) => {
    if (!marketCap) return 'N/A';
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap.toLocaleString()}`;
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

  const getCurrentWatchlist = () => {
    return watchlists.find(w => w.id === selectedWatchlist);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">股票分析</h1>
          <p className="text-gray-600">搜索股票、AI分析、管理观察列表</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search">搜索股票</TabsTrigger>
          <TabsTrigger value="watchlist">观察列表</TabsTrigger>
          <TabsTrigger value="history">检索历史</TabsTrigger>
          <TabsTrigger value="analysis">分析历史</TabsTrigger>
        </TabsList>

        {/* 搜索股票标签页 */}
        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>搜索股票</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="输入股票代码或公司名称..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchStocks()}
                />
                <Button onClick={searchStocks} disabled={isSearching}>
                  {isSearching ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">搜索结果</h3>
                  {searchResults.map((stock) => (
                    <div
                      key={stock.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div>
                          <div className="font-semibold text-lg">{stock.symbol}</div>
                          <div className="text-sm text-gray-600">{stock.companyName}</div>
                          <div className="text-xs text-gray-500">
                            {stock.sector} • {formatMarketCap(stock.marketCap)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Link href={`/stocks/${stock.symbol}`}>
                          <Button variant="outline" size="sm">
                            <Brain className="w-4 h-4 mr-1" />
                            AI分析
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => selectedWatchlist && addStockToWatchlist(stock.id, selectedWatchlist)}
                          disabled={!selectedWatchlist}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 观察列表标签页 */}
        <TabsContent value="watchlist" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 观察列表侧边栏 */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    观察列表
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {watchlists.map((watchlist) => (
                      <div
                        key={watchlist.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedWatchlist === watchlist.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedWatchlist(watchlist.id)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold">{watchlist.name}</div>
                            <div className="text-sm text-gray-600">
                              {watchlist.stockCount} 只股票
                            </div>
                          </div>
                          <Star className={`w-4 h-4 ${
                            selectedWatchlist === watchlist.id ? 'text-blue-500' : 'text-gray-400'
                          }`} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {watchlists.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>还没有观察列表</p>
                      <p className="text-sm">创建一个开始跟踪股票吧！</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 股票列表主区域 */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>
                        {getCurrentWatchlist()?.name || '选择观察列表'}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        {watchlistStocks.length} 只股票
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => selectedWatchlist && loadWatchlistStocks(selectedWatchlist)}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Filter className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingWatchlist ? (
                    <div className="text-center py-8">
                      <RefreshCw className="w-8 h-8 mx-auto animate-spin text-gray-400" />
                      <p className="text-gray-500 mt-2">加载中...</p>
                    </div>
                  ) : watchlistStocks.length > 0 ? (
                    <div className="space-y-4">
                      {watchlistStocks.map((watchlistStock) => (
                        <div
                          key={watchlistStock.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <div>
                              <div className="font-semibold text-lg">
                                {watchlistStock.stock.symbol}
                              </div>
                              <div className="text-sm text-gray-600">
                                {watchlistStock.stock.companyName}
                              </div>
                              <div className="text-xs text-gray-500">
                                添加于 {formatDate(watchlistStock.addedAt)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">
                              {watchlistStock.stock.sector || '未知'}
                            </Badge>
                            <Link href={`/stocks/${watchlistStock.stock.symbol}`}>
                              <Button variant="outline" size="sm">
                                <Brain className="w-4 h-4 mr-1" />
                                AI分析
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeStockFromWatchlist(watchlistStock.stock.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">观察列表为空</p>
                      <p className="text-sm text-gray-400">搜索并添加股票到观察列表</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* 检索历史标签页 */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>检索历史</CardTitle>
                  <p className="text-sm text-gray-600">
                    查看您最近检索过的股票
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {searchHistory.length > 0 ? (
                <div className="space-y-4">
                  {searchHistory.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div>
                          <div className="font-semibold text-lg">
                            {item.symbol}
                          </div>
                          <div className="text-sm text-gray-600">
                            {item.companyName}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDate(item.searchedAt)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Link href={`/stocks/${item.symbol}`}>
                          <Button variant="outline" size="sm">
                            <Brain className="w-4 h-4 mr-1" />
                            AI分析
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => addStockFromHistory(item.symbol, item.companyName)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">暂无检索历史</p>
                  <p className="text-sm text-gray-400">开始搜索股票来创建历史记录</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 分析历史标签页 */}
        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>AI分析历史</CardTitle>
                  <p className="text-sm text-gray-600">
                    查看您最近的AI分析记录
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {analysisHistory.length > 0 ? (
                <div className="space-y-4">
                  {analysisHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div>
                            <div className="font-semibold text-lg">
                              {item.stockSymbol}
                            </div>
                            <div className="text-sm text-gray-600">
                              {item.stockName}
                            </div>
                          </div>
                          <Badge className={getRecommendationColor(item.recommendation)}>
                            {getRecommendationText(item.recommendation)}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
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

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600 max-w-md truncate">
                          {item.reasoning}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Link href={`/stocks/${item.stockSymbol}`}>
                            <Button variant="outline" size="sm">
                              <Brain className="w-4 h-4 mr-1" />
                              重新分析
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">暂无分析历史</p>
                  <p className="text-sm text-gray-400">进行AI分析来创建历史记录</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
