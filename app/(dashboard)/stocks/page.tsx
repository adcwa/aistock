'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Plus, Eye, Trash2 } from 'lucide-react';

interface Stock {
  id: number;
  symbol: string;
  companyName: string;
  sector?: string;
  industry?: string;
  marketCap?: number;
}

interface Watchlist {
  id: number;
  name: string;
  description?: string;
  stockCount: number;
}

export default function StocksPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Stock[]>([]);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [selectedWatchlist, setSelectedWatchlist] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');

  // 模拟用户ID（实际应用中应该从认证系统获取）
  const userId = 1;

  useEffect(() => {
    loadWatchlists();
  }, []);

  const loadWatchlists = async () => {
    try {
      const response = await fetch(`/api/watchlists?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setWatchlists(data);
      }
    } catch (error) {
      console.error('Failed to load watchlists:', error);
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
      }
    } catch (error) {
      console.error('Failed to search stocks:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const createWatchlist = async () => {
    if (!newWatchlistName.trim()) return;

    try {
      const response = await fetch('/api/watchlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          name: newWatchlistName,
          description: '',
        }),
      });

      if (response.ok) {
        setNewWatchlistName('');
        loadWatchlists();
      }
    } catch (error) {
      console.error('Failed to create watchlist:', error);
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
      }
    } catch (error) {
      console.error('Failed to add stock to watchlist:', error);
    }
  };

  const removeStockFromWatchlist = async (stockId: number, watchlistId: number) => {
    try {
      const response = await fetch(`/api/watchlists/${watchlistId}/stocks?stockId=${stockId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadWatchlists();
      }
    } catch (error) {
      console.error('Failed to remove stock from watchlist:', error);
    }
  };

  const formatMarketCap = (marketCap?: number) => {
    if (!marketCap) return 'N/A';
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap.toLocaleString()}`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">股票分析</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 股票搜索 */}
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
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">搜索结果</h3>
                {searchResults.map((stock) => (
                  <div
                    key={stock.id}
                    className="flex justify-between items-center p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-semibold">{stock.symbol}</div>
                      <div className="text-sm text-gray-600">{stock.companyName}</div>
                      <div className="text-xs text-gray-500">
                        {stock.sector} • {formatMarketCap(stock.marketCap)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/stocks/${stock.symbol}`, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {selectedWatchlist && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addStockToWatchlist(stock.id, selectedWatchlist)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 观察列表管理 */}
        <Card>
          <CardHeader>
            <CardTitle>观察列表</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 创建新观察列表 */}
            <div className="flex gap-2">
              <Input
                placeholder="新观察列表名称..."
                value={newWatchlistName}
                onChange={(e) => setNewWatchlistName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createWatchlist()}
              />
              <Button onClick={createWatchlist} disabled={!newWatchlistName.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* 观察列表列表 */}
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        // 这里可以添加查看观察列表详情的功能
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {watchlists.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                还没有观察列表，创建一个开始跟踪股票吧！
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
