#!/bin/bash

echo "🚀 开始部署到Vercel..."

# 检查是否安装了Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI未安装，正在安装..."
    npm install -g vercel
fi

# 检查是否已登录Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 请登录Vercel..."
    vercel login
fi

# 运行数据库迁移
echo "📊 运行数据库迁移..."
npm run db:generate
npm run db:migrate

# 构建项目
echo "🔨 构建项目..."
npm run build

# 部署到Vercel
echo "🚀 部署到Vercel..."
vercel --prod

echo "✅ 部署完成！"
