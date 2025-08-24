'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Clock, CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';

interface AnalysisLog {
  timestamp: string;
  elapsed: number;
  message: string;
}

interface AnalysisProgressProps {
  symbol: string;
  onComplete?: (data: any) => void;
  onError?: (error: string) => void;
}

interface AnalysisStatus {
  status: 'idle' | 'loading' | 'complete' | 'error';
  progress: number;
  currentStep: string;
  logs: AnalysisLog[];
  executionTime?: number;
  error?: string;
  data?: any;
}

export function AnalysisProgress({ symbol, onComplete, onError }: AnalysisProgressProps) {
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>({
    status: 'idle',
    progress: 0,
    currentStep: '准备分析...',
    logs: [],
  });

  const [showLogs, setShowLogs] = useState(false);

  const startAnalysis = async () => {
    setAnalysisStatus({
      status: 'loading',
      progress: 0,
      currentStep: '开始分析...',
      logs: [],
    });

    try {
      const response = await fetch(`/api/stocks/${symbol}/analysis?force=true`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '分析失败');
      }

      const data = await response.json();
      
      // 解析日志
      const logs: AnalysisLog[] = [];
      if (data.logs && Array.isArray(data.logs)) {
        data.logs.forEach((log: string) => {
          const match = log.match(/\[(.*?)\] \[(\d+)ms\] (.*)/);
          if (match) {
            logs.push({
              timestamp: match[1],
              elapsed: parseInt(match[2]),
              message: match[3],
            });
          }
        });
      }

      setAnalysisStatus({
        status: 'complete',
        progress: 100,
        currentStep: '分析完成',
        logs,
        executionTime: data.executionTime,
        data,
      });

      if (onComplete) {
        onComplete(data);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setAnalysisStatus({
        status: 'error',
        progress: 0,
        currentStep: '分析失败',
        logs: analysisStatus.logs,
        error: errorMessage,
      });

      if (onError) {
        onError(errorMessage);
      }
    }
  };

  const getStatusIcon = () => {
    switch (analysisStatus.status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    switch (analysisStatus.status) {
      case 'loading':
        return 'bg-blue-500';
      case 'complete':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getLogLevel = (message: string) => {
    if (message.includes('错误') || message.includes('失败') || message.includes('超时')) {
      return 'error';
    }
    if (message.includes('完成') || message.includes('成功')) {
      return 'success';
    }
    if (message.includes('警告') || message.includes('注意')) {
      return 'warning';
    }
    return 'info';
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'success':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      default:
        return <Info className="h-3 w-3 text-blue-500" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          股票分析进度 - {symbol.toUpperCase()}
          <Badge variant={analysisStatus.status === 'complete' ? 'default' : analysisStatus.status === 'error' ? 'destructive' : 'secondary'}>
            {analysisStatus.status === 'idle' && '待开始'}
            {analysisStatus.status === 'loading' && '分析中'}
            {analysisStatus.status === 'complete' && '已完成'}
            {analysisStatus.status === 'error' && '失败'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {analysisStatus.status === 'idle' && (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">点击开始按钮开始分析股票</p>
            <Button onClick={startAnalysis} className="w-full">
              开始分析
            </Button>
          </div>
        )}

        {analysisStatus.status === 'loading' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{analysisStatus.currentStep}</span>
              <span className="text-sm text-muted-foreground">{analysisStatus.progress}%</span>
            </div>
            <Progress value={analysisStatus.progress} className="w-full" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              预计剩余时间: 计算中...
            </div>
          </div>
        )}

        {analysisStatus.status === 'complete' && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                分析完成！总耗时: {analysisStatus.executionTime ? formatTime(analysisStatus.executionTime) : '未知'}
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">技术分析得分:</span>
                <span className="ml-2">{analysisStatus.data?.analysis?.technical?.score?.toFixed(2) || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium">基本面得分:</span>
                <span className="ml-2">{analysisStatus.data?.analysis?.fundamental?.score?.toFixed(2) || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium">AI情绪:</span>
                <span className="ml-2">{analysisStatus.data?.analysis?.ai?.sentiment || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium">推荐:</span>
                <span className="ml-2">{analysisStatus.data?.analysis?.recommendation?.recommendation || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        {analysisStatus.status === 'error' && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              分析失败: {analysisStatus.error}
            </AlertDescription>
          </Alert>
        )}

        {analysisStatus.logs.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLogs(!showLogs)}
              >
                {showLogs ? '隐藏' : '显示'}详细日志 ({analysisStatus.logs.length})
              </Button>
            </div>

            {showLogs && (
              <Tabs defaultValue="timeline" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="timeline">时间线</TabsTrigger>
                  <TabsTrigger value="logs">原始日志</TabsTrigger>
                </TabsList>
                
                <TabsContent value="timeline" className="space-y-2">
                  <ScrollArea className="h-64 w-full rounded-md border p-4">
                    <div className="space-y-2">
                      {analysisStatus.logs.map((log, index) => {
                        const level = getLogLevel(log.message);
                        return (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            <div className="flex-shrink-0 mt-0.5">
                              {getLogIcon(level)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground text-xs">
                                  {formatTime(log.elapsed)}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  level === 'error' ? 'bg-red-100 text-red-800' :
                                  level === 'success' ? 'bg-green-100 text-green-800' :
                                  level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {level.toUpperCase()}
                                </span>
                              </div>
                              <p className="mt-1">{log.message}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="logs" className="space-y-2">
                  <ScrollArea className="h-64 w-full rounded-md border p-4">
                    <pre className="text-xs font-mono whitespace-pre-wrap">
                      {analysisStatus.logs.map((log, index) => (
                        <div key={index} className="mb-1">
                          <span className="text-muted-foreground">[{log.timestamp}]</span>
                          <span className="text-blue-600"> [{log.elapsed}ms]</span>
                          <span className="ml-2">{log.message}</span>
                        </div>
                      ))}
                    </pre>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            )}
          </div>
        )}

        {(analysisStatus.status === 'complete' || analysisStatus.status === 'error') && (
          <div className="flex gap-2">
            <Button onClick={startAnalysis} variant="outline" className="flex-1">
              重新分析
            </Button>
            {analysisStatus.status === 'complete' && (
              <Button 
                onClick={() => onComplete?.(analysisStatus.data)} 
                className="flex-1"
              >
                查看完整结果
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
