import { NextRequest, NextResponse } from 'next/server';
import { AIConfigService } from '@/lib/services/ai-config';
import { SubscriptionService } from '@/lib/services/subscription';
import { getSession } from '@/lib/auth/session';
import { z } from 'zod';

// 更新AI配置的验证schema
const updateConfigSchema = z.object({
  name: z.string().min(1, '配置名称不能为空').max(100, '配置名称不能超过100个字符').optional(),
  isDefault: z.boolean().optional(),
  baseUrl: z.string().url('API基础URL格式不正确').optional(),
  apiKey: z.string().min(1, 'API密钥不能为空').optional(),
  model: z.string().min(1, '模型名称不能为空').optional(),
  maxTokens: z.number().min(100, '最大Token数不能少于100').max(4000, '最大Token数不能超过4000').optional(),
  temperature: z.string().optional(),
  systemPrompt: z.string().optional(),
  analysisPrompt: z.string().optional(),
  isActive: z.boolean().optional()
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    // 检查用户是否有自定义AI配置权限
    await SubscriptionService.checkAndThrowLimit(session.user.id, 'customAIConfig');

    const configId = parseInt(id);
    if (isNaN(configId)) {
      return NextResponse.json({ error: '无效的配置ID' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateConfigSchema.parse(body);

    const updatedConfig = await AIConfigService.updateConfig(session.user.id, configId, validatedData);
    
    return NextResponse.json({
      success: true,
      data: updatedConfig,
      message: 'AI配置更新成功'
    });
  } catch (error) {
    console.error('Failed to update AI config:', error);
    
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
      { error: '更新AI配置失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    // 检查用户是否有自定义AI配置权限
    await SubscriptionService.checkAndThrowLimit(session.user.id, 'customAIConfig');

    const configId = parseInt(id);
    if (isNaN(configId)) {
      return NextResponse.json({ error: '无效的配置ID' }, { status: 400 });
    }

    await AIConfigService.deleteConfig(session.user.id, configId);
    
    return NextResponse.json({
      success: true,
      message: 'AI配置删除成功'
    });
  } catch (error) {
    console.error('Failed to delete AI config:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: '删除AI配置失败' },
      { status: 500 }
    );
  }
}
