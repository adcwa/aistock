'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Settings, TestTube, CheckCircle, AlertCircle, Plus, Trash2, Star } from 'lucide-react';
import { SubscriptionService } from '@/lib/services/subscription';

interface AIConfig {
  id: number;
  name: string;
  isDefault: boolean;
  baseUrl: string;
  apiKey?: string;
  model: string;
  maxTokens: number;
  temperature: number;
  systemPrompt?: string;
  analysisPrompt?: string;
  isActive: boolean;
  usageCount: number;
  lastUsed?: Date;
}

const AVAILABLE_MODELS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (推荐)', description: '快速且经济实惠' },
  { value: 'gpt-4o', label: 'GPT-4o', description: '最强大的模型' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: '经典模型' },
];

export default function AIConfigPage() {
  const [configs, setConfigs] = useState<AIConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<AIConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    isDefault: false,
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o-mini',
    maxTokens: 1000,
    temperature: 0.3,
    systemPrompt: '',
    analysisPrompt: '',
    isActive: true
  });

  useEffect(() => {
    loadConfigs();
    loadSubscriptionStatus();
  }, []);

  const loadConfigs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/configs');
      const result = await response.json();
      
      if (result.success) {
        setConfigs(result.data);
      } else {
        console.error('Failed to load configs:', result.error);
      }
    } catch (error) {
      console.error('Failed to load configs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/subscription/limits');
      const result = await response.json();
      
      if (result.success) {
        setSubscriptionStatus(result.data);
      }
    } catch (error) {
      console.error('Failed to load subscription status:', error);
    }
  };

  const handleCreateConfig = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/ai/configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setTestResult({ success: true, message: '配置创建成功' });
        setShowForm(false);
        setFormData({
          name: '',
          isDefault: false,
          baseUrl: 'https://api.openai.com/v1',
          apiKey: '',
          model: 'gpt-4o-mini',
          maxTokens: 1000,
          temperature: 0.3,
          systemPrompt: '',
          analysisPrompt: '',
          isActive: true
        });
        loadConfigs();
      } else {
        setTestResult({ success: false, message: result.error });
      }
    } catch (error) {
      setTestResult({ success: false, message: '创建配置失败' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateConfig = async () => {
    if (!selectedConfig) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/ai/configs/${selectedConfig.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setTestResult({ success: true, message: '配置更新成功' });
        loadConfigs();
      } else {
        setTestResult({ success: false, message: result.error });
      }
    } catch (error) {
      setTestResult({ success: false, message: '更新配置失败' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfig = async (configId: number) => {
    if (!confirm('确定要删除这个配置吗？')) return;
    
    try {
      const response = await fetch(`/api/ai/configs/${configId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        setTestResult({ success: true, message: '配置删除成功' });
        loadConfigs();
        if (selectedConfig?.id === configId) {
          setSelectedConfig(null);
          setShowForm(false);
        }
      } else {
        setTestResult({ success: false, message: result.error });
      }
    } catch (error) {
      setTestResult({ success: false, message: '删除配置失败' });
    }
  };

  const handleTestConfig = async (configId: number) => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      const response = await fetch(`/api/ai/configs/${configId}/test`, {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (result.success) {
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

  const handleEditConfig = (config: AIConfig) => {
    setSelectedConfig(config);
    setFormData({
      name: config.name,
      isDefault: config.isDefault,
      baseUrl: config.baseUrl,
      apiKey: '',
      model: config.model,
      maxTokens: config.maxTokens,
      temperature: config.temperature,
      systemPrompt: config.systemPrompt || '',
      analysisPrompt: config.analysisPrompt || '',
      isActive: config.isActive
    });
    setShowForm(true);
  };

  const handleNewConfig = () => {
    setSelectedConfig(null);
    setFormData({
      name: '',
      isDefault: false,
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      model: 'gpt-4o-mini',
      maxTokens: 1000,
      temperature: 0.3,
      systemPrompt: '',
      analysisPrompt: '',
      isActive: true
    });
    setShowForm(true);
  };

  const canUseCustomAIConfig = subscriptionStatus?.limits?.customAIConfig;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">AI配置管理</h1>
        </div>
        {canUseCustomAIConfig && (
          <Button onClick={handleNewConfig} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            新建配置
          </Button>
        )}
      </div>

      {!canUseCustomAIConfig && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-5 w-5" />
              <p>自定义AI配置功能仅在 Pro 和 Enterprise 计划中可用。请升级您的计划以使用此功能。</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 配置列表 */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>我的配置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="text-center py-4">加载中...</div>
              ) : configs.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  暂无配置
                </div>
              ) : (
                configs.map((config) => (
                  <div
                    key={config.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedConfig?.id === config.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleEditConfig(config)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {config.isDefault && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                        <span className="font-medium">{config.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant={config.isActive ? 'default' : 'secondary'}>
                          {config.isActive ? '启用' : '禁用'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConfig(config.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <div>模型: {config.model}</div>
                      <div>使用次数: {config.usageCount}</div>
                      {config.lastUsed && (
                        <div>最后使用: {new Date(config.lastUsed).toLocaleDateString()}</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* 配置表单 */}
        {showForm && (
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {selectedConfig ? '编辑配置' : '新建配置'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">配置名称</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="例如: 我的GPT-4配置"
                    className="px-3 py-2"
                  />
                </div>

                <div>
                  <Label htmlFor="baseUrl">API基础URL</Label>
                  <Input
                    id="baseUrl"
                    value={formData.baseUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, baseUrl: e.target.value }))}
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
                    value={formData.apiKey}
                    onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="sk-..."
                    className="px-3 py-2"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    您的OpenAI API密钥，会被安全加密存储
                  </p>
                </div>

                <div>
                  <Label htmlFor="model">AI模型</Label>
                  <Select value={formData.model} onValueChange={(value) => setFormData(prev => ({ ...prev, model: value }))}>
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxTokens">最大Token数</Label>
                    <Input
                      id="maxTokens"
                      type="number"
                      value={formData.maxTokens}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxTokens: parseInt(e.target.value) || 1000 }))}
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
                      value={formData.temperature}
                      onChange={(e) => setFormData(prev => ({ ...prev, temperature: parseFloat(e.target.value) || 0.3 }))}
                      min="0"
                      max="1"
                      className="px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="systemPrompt">系统提示词</Label>
                  <Textarea
                    id="systemPrompt"
                    value={formData.systemPrompt}
                    onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
                    placeholder="定义AI的角色和行为..."
                    rows={3}
                    className="px-3 py-2"
                  />
                </div>

                <div>
                  <Label htmlFor="analysisPrompt">分析提示词</Label>
                  <Textarea
                    id="analysisPrompt"
                    value={formData.analysisPrompt}
                    onChange={(e) => setFormData(prev => ({ ...prev, analysisPrompt: e.target.value }))}
                    placeholder="定义股票分析的具体要求..."
                    rows={4}
                    className="px-3 py-2"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="isDefault">设为默认配置</Label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={selectedConfig ? handleUpdateConfig : handleCreateConfig} 
                    disabled={isSaving} 
                    className="flex-1"
                  >
                    {isSaving ? '保存中...' : (selectedConfig ? '更新配置' : '创建配置')}
                  </Button>
                  {selectedConfig && (
                    <Button 
                      onClick={() => handleTestConfig(selectedConfig.id)} 
                      disabled={isLoading || !formData.apiKey} 
                      variant="outline"
                    >
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
                  )}
                  <Button 
                    onClick={() => setShowForm(false)} 
                    variant="outline"
                  >
                    取消
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
          </div>
        )}

        {/* 配置说明 */}
        {!showForm && (
          <div className="lg:col-span-2 space-y-6">
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
                    您的API密钥会被安全加密存储，只有您自己可以访问。
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
                    <span className="text-sm">订阅级别:</span>
                    <Badge variant="outline">
                      {subscriptionStatus?.tier || 'Free'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">自定义AI配置:</span>
                    <Badge variant={canUseCustomAIConfig ? 'default' : 'secondary'}>
                      {canUseCustomAIConfig ? '可用' : '不可用'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">配置数量:</span>
                    <span className="text-sm text-gray-600">
                      {configs.length} 个
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
