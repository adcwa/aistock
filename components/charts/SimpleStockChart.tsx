'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PriceData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface SimpleStockChartProps {
  symbol: string;
  priceData: PriceData[];
  title?: string;
}

export default function SimpleStockChart({
  symbol,
  priceData,
  title = "价格走势"
}: SimpleStockChartProps) {
  if (!priceData || priceData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            暂无数据
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentPrice = priceData[priceData.length - 1]?.close || 0;
  const previousPrice = priceData[priceData.length - 2]?.close || 0;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = previousPrice > 0 ? (priceChange / previousPrice) * 100 : 0;

  // 计算简单的价格统计
  const prices = priceData.map(d => d.close);
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

  // 生成简单的价格图表数据点
  const chartPoints = priceData.slice(-20).map((data, index) => ({
    x: index,
    y: data.close,
    date: data.date,
    volume: data.volume
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{title}</CardTitle>
            <p className="text-sm text-gray-600">{symbol}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">${currentPrice.toFixed(2)}</div>
            <Badge 
              variant={priceChange >= 0 ? 'default' : 'destructive'}
              className="flex items-center space-x-1 mt-1"
            >
              {priceChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)</span>
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* 简单的价格统计 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-semibold text-green-600">${maxPrice.toFixed(2)}</div>
            <div className="text-sm text-gray-600">最高价</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-lg font-semibold text-red-600">${minPrice.toFixed(2)}</div>
            <div className="text-sm text-gray-600">最低价</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-semibold text-blue-600">${avgPrice.toFixed(2)}</div>
            <div className="text-sm text-gray-600">平均价</div>
          </div>
        </div>

        {/* 简单的价格走势图 */}
        <div className="space-y-4">
          <h4 className="font-semibold">最近20个交易日价格走势</h4>
          <div className="h-64 bg-gray-50 rounded-lg p-4 relative">
            <div className="flex items-end justify-between h-full">
              {chartPoints.map((point, index) => {
                const height = ((point.y - minPrice) / (maxPrice - minPrice)) * 100;
                const isPositive = index > 0 ? point.y >= chartPoints[index - 1].y : true;
                
                return (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className={`w-2 rounded-sm ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ height: `${Math.max(height, 5)}%` }}
                      title={`${point.date}: $${point.y.toFixed(2)}`}
                    />
                    {index % 5 === 0 && (
                      <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-left">
                        {point.date.slice(5)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* 价格标签 */}
            <div className="absolute left-0 top-0 text-xs text-gray-500">
              ${maxPrice.toFixed(2)}
            </div>
            <div className="absolute left-0 bottom-0 text-xs text-gray-500">
              ${minPrice.toFixed(2)}
            </div>
          </div>
        </div>

        {/* 成交量统计 */}
        <div className="mt-6">
          <h4 className="font-semibold mb-3">成交量统计</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">今日成交量</div>
              <div className="text-lg font-semibold">
                {priceData[priceData.length - 1]?.volume.toLocaleString()}
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">平均成交量</div>
              <div className="text-lg font-semibold">
                {Math.round(priceData.reduce((sum, d) => sum + d.volume, 0) / priceData.length).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
