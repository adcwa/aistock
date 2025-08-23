'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// import { Line, Bar } from 'react-chartjs-2';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart3, 
  Settings,
  Play,
  Pause,
  RotateCcw,
  Target,
  DollarSign,
  Percent,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { BacktestingEngine, BacktestStrategy, BacktestResult } from '@/lib/analysis/backtesting';

interface BacktestingPanelProps {
  symbol: string;
  priceData: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  onBacktestComplete?: (result: BacktestResult) => void;
}

export default function BacktestingPanel({
  symbol,
  priceData,
  onBacktestComplete
}: BacktestingPanelProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [initialCapital, setInitialCapital] = useState(100000);
  const [commission, setCommission] = useState(0.001);
  const [slippage, setSlippage] = useState(0.0005);
  const [customParameters, setCustomParameters] = useState<Record<string, number>>({});

  const strategies = BacktestingEngine.getPredefinedStrategies();

  const runBacktest = async () => {
    if (!selectedStrategy || !priceData.length) return;

    setIsRunning(true);
    
    try {
      const strategy = strategies.find(s => s.name === selectedStrategy);
      if (!strategy) return;

      // 准备回测数据
      const backtestData = priceData.map(d => ({
        date: d.date,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume,
        indicators: {
          // 这里需要计算技术指标，简化处理
          sma50: d.close, // 实际应该计算SMA
          sma200: d.close,
          rsi14: 50, // 实际应该计算RSI
          macd: 0,
          macdSignal: 0,
          bbUpper: d.close * 1.02,
          bbLower: d.close * 0.98,
          bbMiddle: d.close,
        }
      }));

      const engine = new BacktestingEngine(initialCapital, commission, slippage);
      const result = engine.runBacktest(strategy, backtestData);
      
      setBacktestResult(result);
      onBacktestComplete?.(result);
    } catch (error) {
      console.error('Backtest failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  // 图表数据暂时移除，避免Chart.js配置问题

  // 图表配置暂时移除，避免Chart.js配置问题

  return (
    <div className="space-y-6">
      {/* 策略选择和控制面板 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>策略回测</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="strategy">选择策略</Label>
              <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                <SelectTrigger>
                  <SelectValue placeholder="选择回测策略" />
                </SelectTrigger>
                <SelectContent>
                  {strategies.map(strategy => (
                    <SelectItem key={strategy.name} value={strategy.name}>
                      {strategy.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="initialCapital">初始资金</Label>
              <Input
                id="initialCapital"
                type="number"
                value={initialCapital}
                onChange={(e) => setInitialCapital(Number(e.target.value))}
                placeholder="100000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="commission">手续费率</Label>
              <Input
                id="commission"
                type="number"
                step="0.001"
                value={commission}
                onChange={(e) => setCommission(Number(e.target.value))}
                placeholder="0.001"
              />
            </div>
            
            <div>
              <Label htmlFor="slippage">滑点</Label>
              <Input
                id="slippage"
                type="number"
                step="0.0001"
                value={slippage}
                onChange={(e) => setSlippage(Number(e.target.value))}
                placeholder="0.0005"
              />
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={runBacktest} 
                disabled={!selectedStrategy || isRunning}
                className="w-full"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    运行中...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    开始回测
                  </>
                )}
              </Button>
            </div>
          </div>

          {selectedStrategy && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">策略描述</h4>
              <p className="text-sm text-muted-foreground">
                {strategies.find(s => s.name === selectedStrategy)?.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 回测结果 */}
      {backtestResult && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="charts">图表</TabsTrigger>
            <TabsTrigger value="trades">交易记录</TabsTrigger>
            <TabsTrigger value="metrics">详细指标</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">总收益</p>
                      <p className={`text-2xl font-bold ${
                        backtestResult.metrics.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {backtestResult.metrics.totalReturn >= 0 ? '+' : ''}
                        {(backtestResult.metrics.totalReturn * 100).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Percent className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">胜率</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {(backtestResult.metrics.winRate * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-purple-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">夏普比率</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {backtestResult.metrics.sharpeRatio.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">最大回撤</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {(backtestResult.metrics.maxDrawdown * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>交易统计</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>总交易次数:</span>
                      <span className="font-semibold">{backtestResult.metrics.totalTrades}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>盈利交易:</span>
                      <span className="font-semibold text-green-600">{backtestResult.metrics.winningTrades}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>亏损交易:</span>
                      <span className="font-semibold text-red-600">{backtestResult.metrics.losingTrades}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>平均盈利:</span>
                      <span className="font-semibold text-green-600">
                        ${backtestResult.metrics.averageWin.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>平均亏损:</span>
                      <span className="font-semibold text-red-600">
                        ${backtestResult.metrics.averageLoss.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>盈亏比:</span>
                      <span className="font-semibold">
                        {backtestResult.metrics.profitFactor.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>资金管理</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>初始资金:</span>
                      <span className="font-semibold">
                        ${backtestResult.metrics.initialCapital.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>最终资金:</span>
                      <span className="font-semibold">
                        ${backtestResult.metrics.finalCapital.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>总盈亏:</span>
                      <span className={`font-semibold ${
                        backtestResult.metrics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {backtestResult.metrics.totalPnL >= 0 ? '+' : ''}
                        ${backtestResult.metrics.totalPnL.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>年化收益率:</span>
                      <span className={`font-semibold ${
                        backtestResult.metrics.annualizedReturn >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {backtestResult.metrics.annualizedReturn >= 0 ? '+' : ''}
                        {(backtestResult.metrics.annualizedReturn * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>平均持仓时间:</span>
                      <span className="font-semibold">
                        {backtestResult.metrics.averageTradeDuration.toFixed(1)} 天
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="charts" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>回测结果图表</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  图表功能正在开发中，请查看数据概览和交易记录
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="trades" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>交易记录</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">入场日期</th>
                        <th className="text-left p-2">出场日期</th>
                        <th className="text-left p-2">方向</th>
                        <th className="text-left p-2">入场价格</th>
                        <th className="text-left p-2">出场价格</th>
                        <th className="text-left p-2">数量</th>
                        <th className="text-left p-2">盈亏</th>
                        <th className="text-left p-2">盈亏率</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backtestResult.trades.slice(0, 20).map((trade, index) => (
                        <tr key={index} className="border-b hover:bg-muted">
                          <td className="p-2">{trade.entryDate}</td>
                          <td className="p-2">{trade.exitDate || '-'}</td>
                          <td className="p-2">
                            <Badge variant={trade.position === 'long' ? 'default' : 'secondary'}>
                              {trade.position === 'long' ? '做多' : '做空'}
                            </Badge>
                          </td>
                          <td className="p-2">${trade.entryPrice.toFixed(2)}</td>
                          <td className="p-2">${trade.exitPrice?.toFixed(2) || '-'}</td>
                          <td className="p-2">{trade.size}</td>
                          <td className={`p-2 font-semibold ${
                            (trade.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {trade.pnl ? `$${trade.pnl.toFixed(2)}` : '-'}
                          </td>
                          <td className={`p-2 font-semibold ${
                            (trade.pnlPercent || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {trade.pnlPercent ? `${trade.pnlPercent.toFixed(2)}%` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {backtestResult.trades.length > 20 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    显示前20条记录，共{backtestResult.trades.length}条交易记录
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="metrics" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>详细性能指标</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">收益指标</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>总收益率:</span>
                        <span className="font-semibold">
                          {(backtestResult.metrics.totalReturn * 100).toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>年化收益率:</span>
                        <span className="font-semibold">
                          {(backtestResult.metrics.annualizedReturn * 100).toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>最大单笔盈利:</span>
                        <span className="font-semibold text-green-600">
                          ${backtestResult.metrics.largestWin.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>最大单笔亏损:</span>
                        <span className="font-semibold text-red-600">
                          ${backtestResult.metrics.largestLoss.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">风险指标</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>最大回撤:</span>
                        <span className="font-semibold">
                          {(backtestResult.metrics.maxDrawdown * 100).toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>夏普比率:</span>
                        <span className="font-semibold">
                          {backtestResult.metrics.sharpeRatio.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>盈亏比:</span>
                        <span className="font-semibold">
                          {backtestResult.metrics.profitFactor.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>平均持仓时间:</span>
                        <span className="font-semibold">
                          {backtestResult.metrics.averageTradeDuration.toFixed(1)} 天
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
