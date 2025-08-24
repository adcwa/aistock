import { NextRequest, NextResponse } from 'next/server';
import { AIConfigService } from '@/lib/services/ai-config';
import { SubscriptionService } from '@/lib/services/subscription';
import { getSession } from '@/lib/auth/session';
import { z } from 'zod';

// 创建AI配置的验证schema
const createConfigSchema = z.object({
  name: z.string().min(1, '配置名称不能为空').max(100, '配置名称不能超过100个字符'),
  isDefault: z.boolean().optional(),
  baseUrl: z.string().url('API基础URL格式不正确').optional(),
  apiKey: z.string().min(1, 'API密钥不能为空'),
  model: z.string().min(1, '模型名称不能为空'),
  maxTokens: z.number().min(100, '最大Token数不能少于100').max(4000, '最大Token数不能超过4000'),
  temperature: z.number().min(0, '温度值不能小于0').max(1, '温度值不能大于1'),
  systemPrompt: z.string().optional(),
  analysisPrompt: z.string().optional(),
  isActive: z.boolean().optional()
});

// 更新AI配置的验证schema
const updateConfigSchema = createConfigSchema.partial();

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const configs = await AIConfigService.getUserConfigs(session.user.id);
    
    return NextResponse.json({
      success: true,
      data: configs
    });
  } catch (error) {
    console.error('Failed to get AI configs:', error);
    return NextResponse.json(
      { error: '获取AI配置失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    // 检查用户是否有自定义AI配置权限
    await SubscriptionService.checkAndThrowLimit(session.user.id, 'customAIConfig');

    const body = await request.json();
    const validatedData = createConfigSchema.parse(body);

    const newConfig = await AIConfigService.createConfig(session.user.id, validatedData);
    
    return NextResponse.json({
      success: true,
      data: newConfig,
      message: 'AI配置创建成功'
    });
  } catch (error) {
    console.error('Failed to create AI config:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '数据验证失败', details: error.errors },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: '创建AI配置失败' },
      { status: 500 }
    );
  }
}
