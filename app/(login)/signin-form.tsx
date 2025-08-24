'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CircleIcon, Loader2, Eye, EyeOff, Mail, Lock, TrendingUp, ArrowRight } from 'lucide-react';
import { signIn } from './actions';
import { ActionState } from '@/lib/auth/middleware';
import { useState } from 'react';

export function SignInForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const priceId = searchParams.get('priceId');
  const inviteId = searchParams.get('inviteId');
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    signIn,
    { error: '' }
  );

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
          欢迎回来
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          登录您的账户以继续使用AI股票分析平台
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-gray-100">
          <form className="space-y-6" action={formAction}>
            <input type="hidden" name="redirect" value={redirect || ''} />
            <input type="hidden" name="priceId" value={priceId || ''} />
            <input type="hidden" name="inviteId" value={inviteId || ''} />
            
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
                  autoComplete="current-password"
                  defaultValue={state.password}
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
              disabled={pending}
            >
              {pending ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  登录中...
                </>
              ) : (
                <>
                  登录
                  <ArrowRight className="h-4 w-4" />
                </>
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
                  还没有账户？
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href={`/sign-up${redirect ? `?redirect=${redirect}` : ''}${priceId ? `&priceId=${priceId}` : ''}`}
                className="w-full flex justify-center py-3 px-4 border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200"
              >
                创建新账户
              </Link>
            </div>
          </div>
        </div>
        
        {/* 登录优势展示 */}
        <div className="mt-8 space-y-4">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              您的投资助手
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 bg-orange-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-3 w-3 text-orange-600" />
                </div>
                <span className="text-sm text-gray-700">AI驱动的股票分析</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <CircleIcon className="h-3 w-3 text-blue-600" />
                </div>
                <span className="text-sm text-gray-700">实时市场数据</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center">
                  <Lock className="h-3 w-3 text-green-600" />
                </div>
                <span className="text-sm text-gray-700">个性化投资组合</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
