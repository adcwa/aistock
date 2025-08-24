'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Mail, Clock, Settings, TestTube, CheckCircle, AlertCircle, Bell, Calendar } from 'lucide-react';

interface EmailSettings {
  id: number;
  email: string;
  isEnabled: boolean;
  morningTime: string;
  eveningTime: string;
  timezone: string;
  includeWatchlist: boolean;
  includeAnalysis: boolean;
  includeAlerts: boolean;
}

interface EmailLog {
  id: number;
  email: string;
  subject: string;
  templateName: string;
  status: string;
  errorMessage?: string;
  sentAt?: string;
  createdAt: string;
}

const TIMEZONES = [
  { value: 'Asia/Shanghai', label: '中国标准时间 (UTC+8)' },
  { value: 'America/New_York', label: '美国东部时间 (UTC-5)' },
  { value: 'America/Los_Angeles', label: '美国西部时间 (UTC-8)' },
  { value: 'Europe/London', label: '英国时间 (UTC+0)' },
  { value: 'Europe/Paris', label: '欧洲中部时间 (UTC+1)' },
  { value: 'Asia/Tokyo', label: '日本标准时间 (UTC+9)' },
];

export default function NotificationsPage() {
  const [settings, setSettings] = useState<EmailSettings | null>(null);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: '',
    isEnabled: true,
    morningTime: '09:00:00',
    eveningTime: '18:00:00',
    timezone: 'Asia/Shanghai',
    includeWatchlist: true,
    includeAnalysis: true,
    includeAlerts: true
  });

  useEffect(() => {
    loadSettings();
    loadLogs();
    loadSubscriptionStatus();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/notifications/email');
      const result = await response.json();
      
      if (result.success && result.data) {
        setSettings(result.data);
        setFormData({
          email: result.data.email,
          isEnabled: result.data.isEnabled,
          morningTime: result.data.morningTime,
          eveningTime: result.data.eveningTime,
          timezone: result.data.timezone,
          includeWatchlist: result.data.includeWatchlist,
          includeAnalysis: result.data.includeAnalysis,
          includeAlerts: result.data.includeAlerts
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const response = await fetch('/api/notifications/email/logs?limit=10');
      const result = await response.json();
      
      if (result.success) {
        setLogs(result.data);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
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

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/notifications/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setTestResult({ success: true, message: '邮件通知设置保存成功' });
        loadSettings();
      } else {
        setTestResult({ success: false, message: result.error });
      }
    } catch (error) {
      setTestResult({ success: false, message: '保存设置失败' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/notifications/email/test', {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (result.success) {
        setTestResult({ success: true, message: '测试邮件发送成功，请检查您的邮箱' });
        loadLogs();
      } else {
        setTestResult({ success: false, message: result.error || '发送测试邮件失败' });
      }
    } catch (error) {
      setTestResult({ success: false, message: '发送测试邮件失败' });
    } finally {
      setIsLoading(false);
    }
  };

  const canUseEmailNotifications = subscriptionStatus?.limits?.emailNotifications;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Mail className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">邮件通知设置</h1>
      </div>

      {!canUseEmailNotifications && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-5 w-5" />
              <p>邮件通知功能仅在 Pro 和 Enterprise 计划中可用。请升级您的计划以使用此功能。</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 通知设置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              通知设置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">邮箱地址</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your@email.com"
                className="px-3 py-2"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isEnabled">启用邮件通知</Label>
              <Switch
                id="isEnabled"
                checked={formData.isEnabled}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isEnabled: checked }))}
              />
            </div>

            <div>
              <Label htmlFor="timezone">时区</Label>
              <Select value={formData.timezone} onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="morningTime">早上发送时间</Label>
                <Input
                  id="morningTime"
                  type="time"
                  value={formData.morningTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, morningTime: e.target.value }))}
                  className="px-3 py-2"
                />
              </div>
              <div>
                <Label htmlFor="eveningTime">晚上发送时间</Label>
                <Input
                  id="eveningTime"
                  type="time"
                  value={formData.eveningTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, eveningTime: e.target.value }))}
                  className="px-3 py-2"
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">邮件内容</h4>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="includeWatchlist">包含观察列表</Label>
                <Switch
                  id="includeWatchlist"
                  checked={formData.includeWatchlist}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, includeWatchlist: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="includeAnalysis">包含最新分析</Label>
                <Switch
                  id="includeAnalysis"
                  checked={formData.includeAnalysis}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, includeAnalysis: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="includeAlerts">包含预警信息</Label>
                <Switch
                  id="includeAlerts"
                  checked={formData.includeAlerts}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, includeAlerts: checked }))}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSaveSettings} disabled={isSaving} className="flex-1">
                {isSaving ? '保存中...' : '保存设置'}
              </Button>
              <Button onClick={handleTestEmail} disabled={isLoading || !formData.email} variant="outline">
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    发送中...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    发送测试邮件
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

        {/* 发送记录 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                发送记录
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {logs.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    暂无发送记录
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={log.status === 'sent' ? 'default' : 'destructive'}>
                            {log.status === 'sent' ? '已发送' : '发送失败'}
                          </Badge>
                          <span className="text-sm font-medium">{log.subject}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {log.errorMessage && (
                        <p className="text-xs text-red-600 mt-1">{log.errorMessage}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                当前状态
              </CardTitle>
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
                  <span className="text-sm">邮件通知:</span>
                  <Badge variant={canUseEmailNotifications ? 'default' : 'secondary'}>
                    {canUseEmailNotifications ? '可用' : '不可用'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">通知状态:</span>
                  <Badge variant={formData.isEnabled ? 'default' : 'secondary'}>
                    {formData.isEnabled ? '已启用' : '已禁用'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">发送时间:</span>
                  <span className="text-sm text-gray-600">
                    {formData.morningTime} / {formData.eveningTime}
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
