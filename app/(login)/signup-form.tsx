'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CircleIcon, Loader2, Eye, EyeOff, Mail, Lock, User, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import { signUp } from './actions';
import { ActionState } from '@/lib/auth/middleware';
import { useState } from 'react';

export function SignUpForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const priceId = searchParams.get('priceId');
  const inviteId = searchParams.get('inviteId');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    signUp,
    { error: '' }
  );

  const passwordRequirements = [
    { label: '至少8个字符', met: password.length >= 8 },
    { label: '包含字母', met: /[a-zA-Z]/.test(password) },
    { label: '包含数字', met: /\d/.test(password) },
  ];

  const handleSubmit = (formData: FormData) => {
    if (password !== confirmPassword) {
      return;
    }
    formAction(formData);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 rounded-full blur-lg opacity-30"></div>
            <div className="relative bg-gradient-to-r from-orange-500 to-red-500 rounded-full p-3">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          创建您的账户
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          开始您的AI股票分析之旅，获得专业的投资建议
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-gray-100">
          <form className="space-y-6" action={handleSubmit}>
            <input type="hidden" name="redirect" value={redirect || ''} />
            <input type="hidden" name="priceId" value={priceId || ''} />
            <input type="hidden" name="inviteId" value={inviteId || ''} />
            
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-medium text-gray-700 flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                姓名
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                maxLength={50}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400"
                placeholder="请输入您的姓名"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-700 flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                邮箱地址
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={state.email}
                required
                maxLength={50}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400"
                placeholder="请输入您的邮箱地址"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-gray-700 flex items-center gap-2"
              >
                <Lock className="h-4 w-4" />
                密码
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  defaultValue={state.password}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  maxLength={100}
                  className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400"
                  placeholder="请输入您的密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              
              {/* 密码要求指示器 */}
              <div className="space-y-2">
                {passwordRequirements.map((requirement, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    {requirement.met ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-gray-400" />
                    )}
                    <span className={requirement.met ? 'text-green-600' : 'text-gray-500'}>
                      {requirement.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-gray-700 flex items-center gap-2"
              >
                <Lock className="h-4 w-4" />
                确认密码
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-200'
                  }`}
                  placeholder="请再次输入您的密码"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  密码不匹配
                </p>
              )}
            </div>

            {state?.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm flex items-center gap-2">
                  <CircleIcon className="h-4 w-4" />
                  {state.error}
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:transform-none"
              disabled={pending || password !== confirmPassword || password.length < 8}
            >
              {pending ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  创建账户中...
                </>
              ) : (
                '创建账户'
              )}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  已有账户？
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href={`/sign-in${redirect ? `?redirect=${redirect}` : ''}${priceId ? `&priceId=${priceId}` : ''}`}
                className="w-full flex justify-center py-3 px-4 border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200"
              >
                登录现有账户
              </Link>
            </div>
          </div>
        </div>
        
        {/* 注册优势展示 */}
        <div className="mt-8 space-y-4">
          <h3 className="text-center text-lg font-semibold text-gray-900">
            为什么选择我们？
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">AI智能分析</p>
                  <p className="text-xs text-gray-500">基于机器学习的股票分析</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <CircleIcon className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">实时数据</p>
                  <p className="text-xs text-gray-500">市场数据实时更新</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Lock className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">安全可靠</p>
                  <p className="text-xs text-gray-500">数据加密保护</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">个性化</p>
                  <p className="text-xs text-gray-500">定制化投资建议</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
