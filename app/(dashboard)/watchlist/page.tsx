'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, 
  Trash2, 
  Plus, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  Star,
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

export default function WatchlistPage() {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [selectedWatchlist, setSelectedWatchlist] = useState<number | null>(null);
  const [watchlistStocks, setWatchlistStocks] = useState<WatchlistStock[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('watchlists');

  // 模拟用户ID（实际应用中应该从认证系统获取）
  const userId = 1;

  useEffect(() => {
    loadWatchlists();
    loadSearchHistory();
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
    setIsLoading(true);
    try {
      const response = await fetch(`/api/watchlists/${watchlistId}/stocks`);
      if (response.ok) {
        const data = await response.json();
        setWatchlistStocks(data);
      }
    } catch (error) {
      console.error('Failed to load watchlist stocks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSearchHistory = async () => {
    try {
      const response = await fetch(`/api/search-history?userId=${userId}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        setSearchHistory(data);
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  };

  const removeStockFromWatchlist = async (stockId: number) => {
    if (!selectedWatchlist) return;

    try {
      const response = await fetch(`/api/watchlists/${selectedWatchlist}/stocks?stockId=${stockId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // 重新加载观察列表股票
        loadWatchlistStocks(selectedWatchlist);
        // 更新观察列表计数
        loadWatchlists();
      }
    } catch (error) {
      console.error('Failed to remove stock from watchlist:', error);
    }
  };

  const clearSearchHistory = async () => {
    try {
      const response = await fetch(`/api/search-history?userId=${userId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setSearchHistory([]);
      }
    } catch (error) {
      console.error('Failed to clear search history:', error);
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
          // 重新加载观察列表数据
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

  const getCurrentWatchlist = () => {
    return watchlists.find(w => w.id === selectedWatchlist);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">观察列表</h1>
          <p className="text-gray-600">管理您关注的股票和查看检索历史</p>
        </div>
        <Button onClick={() => window.location.href = '/stocks'}>
          <Search className="w-4 h-4 mr-2" />
          搜索股票
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="watchlists">我的观察列表</TabsTrigger>
          <TabsTrigger value="history">检索历史</TabsTrigger>
        </TabsList>

        <TabsContent value="watchlists" className="space-y-6">
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
                  {isLoading ? (
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
                                <Eye className="w-4 h-4" />
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
                <div className="flex space-x-2">
                  <Input
                    placeholder="搜索历史记录..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                  />
                  <Button variant="outline" onClick={clearSearchHistory}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {searchHistory.length > 0 ? (
                <div className="space-y-4">
                  {searchHistory
                    .filter(item => 
                      item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      item.companyName.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((item) => (
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
                              <Eye className="w-4 h-4" />
                              查看详情
                            </Button>
                          </Link>
                                                     <Button 
                             variant="outline" 
                             size="sm"
                             onClick={() => addStockFromHistory(item.symbol, item.companyName)}
                           >
                             <Plus className="w-4 h-4" />
                             添加到观察列表
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
      </Tabs>
    </div>
  );
}
