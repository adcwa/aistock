'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PromptConfig {
  systemPrompt: string;
  analysisPrompt: string;
  sentimentPrompt: string;
  customPrompts: Record<string, string>;
}

const DEFAULT_PROMPTS: PromptConfig = {
  systemPrompt: `You are an expert financial analyst specializing in stock market analysis. 
Provide comprehensive, data-driven insights based on technical indicators, fundamental data, and market sentiment.
Always be objective and include risk factors in your analysis.`,
  analysisPrompt: `Analyze the following stock data for {symbol}:

Technical Indicators:
{technicalData}

Fundamental Data:
{fundamentalData}

News Sentiment:
{newsData}

Please provide:
1. Overall sentiment (bullish/bearish/neutral)
2. Confidence level (0-1)
3. Key factors supporting your analysis
4. Risk factors to consider
5. Investment recommendation (buy/hold/sell)
6. Summary of analysis`,
  sentimentPrompt: `Analyze the sentiment of the following news articles for {symbol}:
{newsData}

Provide:
1. Overall sentiment (positive/negative/neutral)
2. Confidence level (0-1)
3. Key themes and their sentiment
4. Impact on stock price`,
  customPrompts: {
    'technical_analysis': `Focus on technical indicators for {symbol}:
{technicalData}

Provide technical analysis with:
1. Trend direction
2. Support/resistance levels
3. Momentum indicators
4. Volume analysis`,
    'fundamental_analysis': `Analyze fundamental data for {symbol}:
{fundamentalData}

Provide fundamental analysis with:
1. Financial ratios
2. Growth metrics
3. Valuation assessment
4. Risk factors`,
  },
};

export default function AIPromptPage() {
  const [config, setConfig] = useState<PromptConfig>(DEFAULT_PROMPTS);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('ai-prompt-config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConfig({ ...DEFAULT_PROMPTS, ...parsed });
      } catch (error) {
        console.error('Failed to parse saved prompt config:', error);
      }
    }
  }, []);

  const saveConfig = () => {
    localStorage.setItem('ai-prompt-config', JSON.stringify(config));
    setMessage('配置已保存！');
    setTimeout(() => setMessage(''), 3000);
  };

  const resetConfig = () => {
    setConfig(DEFAULT_PROMPTS);
    localStorage.removeItem('ai-prompt-config');
    setMessage('配置已重置为默认值！');
    setTimeout(() => setMessage(''), 3000);
  };

  const testPrompt = async (promptType: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/test-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptType,
          config,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setMessage(`测试成功！AI响应: ${result.response.substring(0, 100)}...`);
      } else {
        setMessage(`测试失败: ${result.error}`);
      }
    } catch (error) {
      setMessage('测试失败，请检查AI配置');
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const updateCustomPrompt = (key: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      customPrompts: {
        ...prev.customPrompts,
        [key]: value,
      },
    }));
  };

  const addCustomPrompt = () => {
    const key = `custom_${Date.now()}`;
    setConfig(prev => ({
      ...prev,
      customPrompts: {
        ...prev.customPrompts,
        [key]: 'Enter your custom prompt here...',
      },
    }));
  };

  const removeCustomPrompt = (key: string) => {
    setConfig(prev => {
      const newCustomPrompts = { ...prev.customPrompts };
      delete newCustomPrompts[key];
      return {
        ...prev,
        customPrompts: newCustomPrompts,
      };
    });
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Prompt 配置</h1>
          <p className="text-gray-600 mt-2">
            自定义AI分析的提示词，以获得更准确的分析结果
          </p>
        </div>
        <div className="space-x-2">
          <Button onClick={resetConfig} variant="outline">
            重置默认
          </Button>
          <Button onClick={saveConfig} disabled={isLoading}>
            保存配置
          </Button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('成功') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}

      <Tabs defaultValue="system" className="space-y-4">
        <TabsList>
          <TabsTrigger value="system">系统提示</TabsTrigger>
          <TabsTrigger value="analysis">分析提示</TabsTrigger>
          <TabsTrigger value="sentiment">情感分析</TabsTrigger>
          <TabsTrigger value="custom">自定义提示</TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>系统角色提示</CardTitle>
              <CardDescription>
                定义AI分析师的角色和专业背景
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Label htmlFor="systemPrompt">系统提示词</Label>
              <Textarea
                id="systemPrompt"
                value={config.systemPrompt}
                onChange={(e) => setConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
                placeholder="输入系统提示词..."
                rows={6}
                className="mt-2"
              />
              <div className="mt-4">
                <Button onClick={() => testPrompt('system')} disabled={isLoading}>
                  测试系统提示
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>股票分析提示</CardTitle>
              <CardDescription>
                定义股票分析的具体要求和输出格式
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="analysisPrompt">分析提示词</Label>
                  <Textarea
                    id="analysisPrompt"
                    value={config.analysisPrompt}
                    onChange={(e) => setConfig(prev => ({ ...prev, analysisPrompt: e.target.value }))}
                    placeholder="输入分析提示词..."
                    rows={12}
                    className="mt-2"
                  />
                  <div className="mt-2 text-sm text-gray-500">
                    可用变量: {'{symbol}'}, {'{technicalData}'}, {'{fundamentalData}'}, {'{newsData}'}
                  </div>
                </div>
                <div>
                  <Button onClick={() => testPrompt('analysis')} disabled={isLoading}>
                    测试分析提示
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sentiment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>新闻情感分析提示</CardTitle>
              <CardDescription>
                定义新闻情感分析的要求和输出格式
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sentimentPrompt">情感分析提示词</Label>
                  <Textarea
                    id="sentimentPrompt"
                    value={config.sentimentPrompt}
                    onChange={(e) => setConfig(prev => ({ ...prev, sentimentPrompt: e.target.value }))}
                    placeholder="输入情感分析提示词..."
                    rows={8}
                    className="mt-2"
                  />
                  <div className="mt-2 text-sm text-gray-500">
                    可用变量: {'{symbol}'}, {'{newsData}'}
                  </div>
                </div>
                <div>
                  <Button onClick={() => testPrompt('sentiment')} disabled={isLoading}>
                    测试情感分析提示
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>自定义提示</CardTitle>
              <CardDescription>
                创建自定义的分析提示词
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={addCustomPrompt} variant="outline">
                  添加自定义提示
                </Button>

                {Object.entries(config.customPrompts).map(([key, value]) => (
                  <div key={key} className="space-y-2 p-4 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <Label htmlFor={key}>自定义提示: {key}</Label>
                      <Button
                        onClick={() => removeCustomPrompt(key)}
                        variant="destructive"
                        size="sm"
                      >
                        删除
                      </Button>
                    </div>
                    <Textarea
                      id={key}
                      value={value}
                      onChange={(e) => updateCustomPrompt(key, e.target.value)}
                      placeholder="输入自定义提示词..."
                      rows={4}
                    />
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        可用变量: {'{symbol}'}, {'{technicalData}'}, {'{fundamentalData}'}, {'{newsData}'}
                      </div>
                      <Button
                        onClick={() => testPrompt(key)}
                        disabled={isLoading}
                        size="sm"
                      >
                        测试
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>提示词变量说明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">可用变量</h4>
              <div className="space-y-2">
                <div><Badge variant="secondary">{'{symbol}'}</Badge> - 股票代码</div>
                <div><Badge variant="secondary">{'{technicalData}'}</Badge> - 技术指标数据</div>
                <div><Badge variant="secondary">{'{fundamentalData}'}</Badge> - 基本面数据</div>
                <div><Badge variant="secondary">{'{newsData}'}</Badge> - 新闻数据</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">最佳实践</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• 明确指定输出格式</li>
                <li>• 包含置信度要求</li>
                <li>• 要求提供风险因素</li>
                <li>• 指定情感分析方向</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
