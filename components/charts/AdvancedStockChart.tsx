'use client';

import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart3, 
  LineChart,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
);

interface PriceData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TechnicalIndicators {
  sma50?: number[];
  sma200?: number[];
  rsi14?: number[];
  macd?: number[];
  macdSignal?: number[];
  macdHistogram?: number[];
  bbUpper?: number[];
  bbMiddle?: number[];
  bbLower?: number[];
  stochK?: number[];
  stochD?: number[];
  williamsR?: number[];
  atr?: number[];
  adx?: number[];
  cci?: number[];
  mfi?: number[];
  obv?: number[];
}

interface AdvancedStockChartProps {
  symbol: string;
  priceData: PriceData[];
  indicators: TechnicalIndicators;
  timeframe?: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y';
  onTimeframeChange?: (timeframe: string) => void;
}

export default function AdvancedStockChart({
  symbol,
  priceData,
  indicators,
  timeframe = '1M',
  onTimeframeChange
}: AdvancedStockChartProps) {
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([
    'price', 'sma50', 'sma200', 'bb'
  ]);
  const [chartType, setChartType] = useState<'candlestick' | 'line'>('candlestick');
  const [showVolume, setShowVolume] = useState(true);

  const timeframes = [
    { value: '1D', label: '1日' },
    { value: '1W', label: '1周' },
    { value: '1M', label: '1月' },
    { value: '3M', label: '3月' },
    { value: '6M', label: '6月' },
    { value: '1Y', label: '1年' },
    { value: '5Y', label: '5年' },
  ];

  const availableIndicators = [
    { key: 'price', label: '价格', color: '#2563eb' },
    { key: 'sma50', label: 'SMA 50', color: '#f59e0b' },
    { key: 'sma200', label: 'SMA 200', color: '#dc2626' },
    { key: 'bb', label: '布林带', color: '#7c3aed' },
    { key: 'rsi', label: 'RSI', color: '#059669' },
    { key: 'macd', label: 'MACD', color: '#0891b2' },
    { key: 'stoch', label: '随机指标', color: '#be185d' },
    { key: 'volume', label: '成交量', color: '#6b7280' },
  ];

  const chartData = useMemo(() => {
    const labels = priceData.map(d => d.date);
    const closePrices = priceData.map(d => d.close);
    const volumes = priceData.map(d => d.volume);

    const datasets: any[] = [];

    // 主价格线
    if (selectedIndicators.includes('price')) {
      datasets.push({
        label: '收盘价',
        data: closePrices,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        borderWidth: 2,
        fill: false,
        yAxisID: 'y',
      });
    }

    // SMA 50
    if (selectedIndicators.includes('sma50') && indicators.sma50) {
      datasets.push({
        label: 'SMA 50',
        data: indicators.sma50,
        borderColor: '#f59e0b',
        backgroundColor: 'transparent',
        borderWidth: 1,
        fill: false,
        yAxisID: 'y',
      });
    }

    // SMA 200
    if (selectedIndicators.includes('sma200') && indicators.sma200) {
      datasets.push({
        label: 'SMA 200',
        data: indicators.sma200,
        borderColor: '#dc2626',
        backgroundColor: 'transparent',
        borderWidth: 1,
        fill: false,
        yAxisID: 'y',
      });
    }

    // 布林带
    if (selectedIndicators.includes('bb') && indicators.bbUpper && indicators.bbLower && indicators.bbMiddle) {
      datasets.push(
        {
          label: '布林带上轨',
          data: indicators.bbUpper,
          borderColor: '#7c3aed',
          backgroundColor: 'rgba(124, 58, 237, 0.1)',
          borderWidth: 1,
          fill: false,
          yAxisID: 'y',
        },
        {
          label: '布林带中轨',
          data: indicators.bbMiddle,
          borderColor: '#7c3aed',
          backgroundColor: 'transparent',
          borderWidth: 1,
          fill: false,
          yAxisID: 'y',
        },
        {
          label: '布林带下轨',
          data: indicators.bbLower,
          borderColor: '#7c3aed',
          backgroundColor: 'rgba(124, 58, 237, 0.1)',
          borderWidth: 1,
          fill: '+1',
          yAxisID: 'y',
        }
      );
    }

    return {
      labels,
      datasets,
    };
  }, [priceData, indicators, selectedIndicators]);

  const volumeData = useMemo(() => {
    if (!showVolume) return null;

    const labels = priceData.map(d => d.date);
    const volumes = priceData.map(d => d.volume);
    const colors = priceData.map((d, i) => {
      if (i === 0) return '#6b7280';
      return d.close >= priceData[i - 1].close ? '#16a34a' : '#dc2626';
    });

    return {
      labels,
      datasets: [{
        label: '成交量',
        data: volumes,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 1,
        yAxisID: 'y1',
      }],
    };
  }, [priceData, showVolume]);

  const rsiData = useMemo(() => {
    if (!selectedIndicators.includes('rsi') || !indicators.rsi14) return null;

    const labels = priceData.map(d => d.date);
    return {
      labels,
      datasets: [{
        label: 'RSI',
        data: indicators.rsi14,
        borderColor: '#059669',
        backgroundColor: 'rgba(5, 150, 105, 0.1)',
        borderWidth: 2,
        fill: false,
        yAxisID: 'y',
      }],
    };
  }, [priceData, indicators.rsi14, selectedIndicators]);

  const macdData = useMemo(() => {
    if (!selectedIndicators.includes('macd') || !indicators.macd || !indicators.macdSignal) return null;

    const labels = priceData.map(d => d.date);
    const datasets: any[] = [
      {
        label: 'MACD',
        data: indicators.macd,
        borderColor: '#0891b2',
        backgroundColor: 'transparent',
        borderWidth: 2,
        fill: false,
        yAxisID: 'y',
      },
      {
        label: '信号线',
        data: indicators.macdSignal,
        borderColor: '#dc2626',
        backgroundColor: 'transparent',
        borderWidth: 1,
        fill: false,
        yAxisID: 'y',
      },
    ];

    if (indicators.macdHistogram) {
      datasets.push({
        label: 'MACD柱状图',
        data: indicators.macdHistogram,
        backgroundColor: indicators.macdHistogram.map((val, i) => 
          val >= 0 ? 'rgba(5, 150, 105, 0.6)' : 'rgba(220, 38, 38, 0.6)'
        ),
        borderColor: indicators.macdHistogram.map((val, i) => 
          val >= 0 ? '#16a34a' : '#dc2626'
        ),
        borderWidth: 1,
        type: 'bar',
        yAxisID: 'y',
      });
    }

    return {
      labels,
      datasets,
    };
  }, [priceData, indicators.macd, indicators.macdSignal, indicators.macdHistogram, selectedIndicators]);

  const stochasticData = useMemo(() => {
    if (!selectedIndicators.includes('stoch') || !indicators.stochK || !indicators.stochD) return null;

    const labels = priceData.map(d => d.date);
    return {
      labels,
      datasets: [
        {
          label: '%K',
          data: indicators.stochK,
          borderColor: '#be185d',
          backgroundColor: 'transparent',
          borderWidth: 2,
          fill: false,
          yAxisID: 'y',
        },
        {
          label: '%D',
          data: indicators.stochD,
          borderColor: '#0891b2',
          backgroundColor: 'transparent',
          borderWidth: 1,
          fill: false,
          yAxisID: 'y',
        },
      ],
    };
  }, [priceData, indicators.stochK, indicators.stochD, selectedIndicators]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
              }).format(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'category' as const,
        title: {
          display: true,
          text: '日期',
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: '价格 ($)',
        },
      },
      y1: {
        type: 'linear' as const,
        display: showVolume,
        position: 'right' as const,
        title: {
          display: true,
          text: '成交量',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const rsiOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        min: 0,
        max: 100,
        title: {
          display: true,
          text: 'RSI',
        },
      },
    },
  };

  const macdOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        title: {
          display: true,
          text: 'MACD',
        },
      },
    },
  };

  const stochasticOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        min: 0,
        max: 100,
        title: {
          display: true,
          text: '随机指标',
        },
      },
    },
  };

  const toggleIndicator = (indicator: string) => {
    setSelectedIndicators(prev => 
      prev.includes(indicator) 
        ? prev.filter(i => i !== indicator)
        : [...prev, indicator]
    );
  };

  const currentPrice = priceData[priceData.length - 1]?.close || 0;
  const previousPrice = priceData[priceData.length - 2]?.close || 0;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = previousPrice > 0 ? (priceChange / previousPrice) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* 图表控制面板 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h2 className="text-2xl font-bold">{symbol}</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-semibold">
                    ${currentPrice.toFixed(2)}
                  </span>
                  <Badge 
                    variant={priceChange >= 0 ? 'default' : 'destructive'}
                    className="flex items-center space-x-1"
                  >
                    {priceChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)</span>
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Select value={timeframe} onValueChange={onTimeframeChange}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeframes.map(tf => (
                    <SelectItem key={tf.value} value={tf.value}>
                      {tf.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setChartType(chartType === 'candlestick' ? 'line' : 'candlestick')}
              >
                {chartType === 'candlestick' ? <BarChart3 className="w-4 h-4" /> : <LineChart className="w-4 h-4" />}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVolume(!showVolume)}
              >
                {showVolume ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* 指标选择器 */}
          <div className="flex flex-wrap gap-2 mb-4">
            {availableIndicators.map(indicator => (
              <Button
                key={indicator.key}
                variant={selectedIndicators.includes(indicator.key) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleIndicator(indicator.key)}
                className="text-xs"
              >
                {indicator.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 主图表 */}
      <Card>
        <CardContent className="p-6">
          <div className="h-96">
            <Line data={chartData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* 成交量图表 */}
      {showVolume && volumeData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">成交量</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-32">
              <Bar data={volumeData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 技术指标图表 */}
      <Tabs defaultValue="rsi" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rsi">RSI</TabsTrigger>
          <TabsTrigger value="macd">MACD</TabsTrigger>
          <TabsTrigger value="stoch">随机指标</TabsTrigger>
          <TabsTrigger value="summary">指标摘要</TabsTrigger>
        </TabsList>
        
        <TabsContent value="rsi" className="mt-4">
          {rsiData ? (
            <Card>
              <CardContent className="p-6">
                <div className="h-64">
                  <Line data={rsiData} options={rsiOptions} />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                请选择RSI指标以显示图表
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="macd" className="mt-4">
          {macdData ? (
            <Card>
              <CardContent className="p-6">
                <div className="h-64">
                  <Line data={macdData} options={macdOptions} />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                请选择MACD指标以显示图表
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="stoch" className="mt-4">
          {stochasticData ? (
            <Card>
              <CardContent className="p-6">
                <div className="h-64">
                  <Line data={stochasticData} options={stochasticOptions} />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                请选择随机指标以显示图表
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="summary" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>技术指标摘要</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {indicators.rsi14 && (
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">RSI (14)</div>
                    <div className={`text-2xl font-bold ${
                      indicators.rsi14[indicators.rsi14.length - 1] < 30 ? 'text-green-600' :
                      indicators.rsi14[indicators.rsi14.length - 1] > 70 ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {indicators.rsi14[indicators.rsi14.length - 1].toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {indicators.rsi14[indicators.rsi14.length - 1] < 30 ? '超卖' :
                       indicators.rsi14[indicators.rsi14.length - 1] > 70 ? '超买' : '中性'}
                    </div>
                  </div>
                )}
                
                {indicators.sma50 && indicators.sma200 && (
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">均线趋势</div>
                    <div className={`text-2xl font-bold ${
                      indicators.sma50[indicators.sma50.length - 1] > indicators.sma200[indicators.sma200.length - 1] 
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {indicators.sma50[indicators.sma50.length - 1] > indicators.sma200[indicators.sma200.length - 1] 
                        ? '上升' : '下降'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      SMA50: ${indicators.sma50[indicators.sma50.length - 1].toFixed(2)}
                    </div>
                  </div>
                )}
                
                {indicators.macd && indicators.macdSignal && (
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">MACD</div>
                    <div className={`text-2xl font-bold ${
                      indicators.macd[indicators.macd.length - 1] > indicators.macdSignal[indicators.macdSignal.length - 1]
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {indicators.macd[indicators.macd.length - 1] > indicators.macdSignal[indicators.macdSignal.length - 1]
                        ? '金叉' : '死叉'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {indicators.macd[indicators.macd.length - 1].toFixed(4)}
                    </div>
                  </div>
                )}
                
                {indicators.bbUpper && indicators.bbLower && (
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">布林带位置</div>
                    <div className={`text-2xl font-bold ${
                      currentPrice < indicators.bbLower[indicators.bbLower.length - 1] ? 'text-green-600' :
                      currentPrice > indicators.bbUpper[indicators.bbUpper.length - 1] ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {currentPrice < indicators.bbLower[indicators.bbLower.length - 1] ? '下轨' :
                       currentPrice > indicators.bbUpper[indicators.bbUpper.length - 1] ? '上轨' : '中轨'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      带宽: {((indicators.bbUpper[indicators.bbUpper.length - 1] - indicators.bbLower[indicators.bbLower.length - 1]) / currentPrice * 100).toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
