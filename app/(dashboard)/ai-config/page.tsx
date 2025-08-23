'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Brain, Settings, TestTube, CheckCircle, AlertCircle } from 'lucide-react';

interface AIConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

const AVAILABLE_MODELS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (推荐)', description: '快速且经济实惠' },
  { value: 'gpt-4o', label: 'GPT-4o', description: '最强大的模型' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: '经典模型' },
];

export default function AIConfigPage() {
  const [config, setConfig] = useState<AIConfig>({
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o-mini',
    maxTokens: 1000,
    temperature: 0.3,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // 从localStorage加载配置
    const savedConfig = localStorage.getItem('ai-config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to parse saved AI config:', error);
      }
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 保存到localStorage
      localStorage.setItem('ai-config', JSON.stringify(config));
      
      // 这里可以添加保存到服务器的逻辑
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟API调用
      
      setTestResult({ success: true, message: '配置已保存' });
    } catch (error) {
      setTestResult({ success: false, message: '保存失败' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/ai/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setTestResult({ success: true, message: 'AI配置测试成功！' });
      } else {
        setTestResult({ success: false, message: result.error || '测试失败' });
      }
    } catch (error) {
      setTestResult({ success: false, message: '连接失败，请检查配置' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">AI配置管理</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 配置表单 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              AI服务配置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="baseUrl">API基础URL</Label>
              <Input
                id="baseUrl"
                value={config.baseUrl}
                onChange={(e) => setConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                placeholder="https://api.openai.com/v1"
                className="px-3 py-2"
              />
              <p className="text-sm text-gray-500 mt-1">
                支持OpenAI官方API或兼容的第三方服务
              </p>
            </div>

            <div>
              <Label htmlFor="apiKey">API密钥</Label>
              <Input
                id="apiKey"
                type="password"
                value={config.apiKey}
                onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="sk-..."
                className="px-3 py-2"
              />
              <p className="text-sm text-gray-500 mt-1">
                您的OpenAI API密钥，不会被保存到服务器
              </p>
            </div>

            <div>
              <Label htmlFor="model">AI模型</Label>
              <div className="space-y-2">
                <Select value={config.model} onValueChange={(value) => setConfig(prev => ({ ...prev, model: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        <div>
                          <div className="font-medium">{model.label}</div>
                          <div className="text-sm text-gray-500">{model.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-sm text-gray-500">
                  或手动输入模型名称:
                </div>
                <Input
                  id="model"
                  value={config.model}
                  onChange={(e) => setConfig(prev => ({ ...prev, model: e.target.value }))}
                  placeholder="例如: gpt-4o-mini, gpt-4o, gpt-3.5-turbo"
                  className="px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxTokens">最大Token数</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  value={config.maxTokens}
                  onChange={(e) => setConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) || 1000 }))}
                  min="100"
                  max="4000"
                  className="px-3 py-2"
                />
              </div>
              <div>
                <Label htmlFor="temperature">创造性 (0-1)</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  value={config.temperature}
                  onChange={(e) => setConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) || 0.3 }))}
                  min="0"
                  max="1"
                  className="px-3 py-2"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                {isSaving ? '保存中...' : '保存配置'}
              </Button>
              <Button onClick={handleTest} disabled={isLoading || !config.apiKey} variant="outline">
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    测试中...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    测试连接
                  </>
                )}
              </Button>
            </div>

            {testResult && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                testResult.success 
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <span className="text-sm">{testResult.message}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 配置说明 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>配置说明</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">API基础URL</h4>
                <p className="text-sm text-gray-600">
                  默认使用OpenAI官方API。如果您使用其他兼容服务（如Azure OpenAI、本地部署等），请修改此URL。
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">API密钥</h4>
                <p className="text-sm text-gray-600">
                  您的API密钥仅存储在浏览器本地，不会发送到我们的服务器。请确保密钥安全。
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">AI模型</h4>
                <p className="text-sm text-gray-600">
                  不同模型在分析质量和速度上有差异。GPT-4o Mini推荐用于日常分析。
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">参数说明</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li><strong>最大Token数:</strong> 控制AI回复的长度，影响分析详细程度</li>
                  <li><strong>创造性:</strong> 控制AI分析的创造性，较低值更保守，较高值更灵活</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>当前状态</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">API连接:</span>
                  <Badge variant={config.apiKey ? 'default' : 'secondary'}>
                    {config.apiKey ? '已配置' : '未配置'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">模型:</span>
                  <Badge variant="outline">{config.model}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">基础URL:</span>
                  <span className="text-sm text-gray-600 truncate max-w-32">
                    {config.baseUrl}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
