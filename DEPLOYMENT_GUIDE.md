# 🚀 Vercel + Supabase 部署指南

## 📋 前置要求

- GitHub账号
- Supabase账号
- Vercel账号
- Alpha Vantage API密钥
- OpenAI API密钥

## 🔧 第一步：设置Supabase数据库

### 1.1 创建Supabase项目

1. 访问 [https://supabase.com](https://supabase.com)
2. 点击 "Start your project"
3. 使用GitHub账号登录
4. 点击 "New Project"
5. 选择组织，输入项目名称（如：`aistock-db`）
6. 设置数据库密码（请记住这个密码）
7. 选择地区（建议选择离您最近的地区）
8. 点击 "Create new project"

### 1.2 获取数据库连接信息

1. 项目创建完成后，在Supabase控制台：
   - 进入 "Settings" → "Database"
   - 找到 "Connection string" 部分
   - 复制 "URI" 连接字符串

   格式如下：
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```

## 🔑 第二步：获取API密钥

### 2.1 Alpha Vantage API密钥

1. 访问 [https://www.alphavantage.co/support/#api-key](https://www.alphavantage.co/support/#api-key)
2. 填写表单获取免费API密钥
3. 复制API密钥

### 2.2 OpenAI API密钥

1. 访问 [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. 登录OpenAI账号
3. 点击 "Create new secret key"
4. 复制API密钥

## ⚙️ 第三步：配置环境变量

### 3.1 创建环境变量文件

在项目根目录创建 `.env.local` 文件：

```bash
# 数据库配置 (Supabase)
POSTGRES_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# API密钥
ALPHA_VANTAGE_API_KEY="your_alpha_vantage_api_key_here"
OPENAI_API_KEY="your_openai_api_key_here"

# Next.js配置
NEXTAUTH_SECRET="your_nextauth_secret_here"
NEXTAUTH_URL="http://localhost:3000"
```

### 3.2 替换实际值

将上述配置中的占位符替换为您的实际值：

- `[YOUR-PASSWORD]`: Supabase数据库密码
- `[YOUR-PROJECT-REF]`: Supabase项目引用ID
- `your_alpha_vantage_api_key_here`: Alpha Vantage API密钥
- `your_openai_api_key_here`: OpenAI API密钥
- `your_nextauth_secret_here`: 随机生成的密钥（可以使用 `openssl rand -base64 32` 生成）

## 🗄️ 第四步：运行数据库迁移

### 4.1 测试数据库连接

```bash
# 重新加载环境变量
source .env.local

# 测试连接
npm run db:migrate
```

如果成功，您应该看到：
```
[✓] applying migrations...
```

### 4.2 如果连接失败

检查以下几点：
1. 确保 `.env.local` 文件中的 `POSTGRES_URL` 正确
2. 确保Supabase项目已创建完成
3. 确保网络连接正常

## 🚀 第五步：部署到Vercel

### 5.1 安装Vercel CLI

```bash
npm install -g vercel
```

### 5.2 登录Vercel

```bash
vercel login
```

按照提示完成GitHub授权。

### 5.3 配置Vercel项目

```bash
# 初始化Vercel项目
vercel

# 按照提示配置：
# - 项目名称
# - 是否覆盖现有项目
# - 输出目录 (./)
```

### 5.4 设置Vercel环境变量

在Vercel控制台设置环境变量：

1. 访问 [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. 选择您的项目
3. 进入 "Settings" → "Environment Variables"
4. 添加以下环境变量：

```
POSTGRES_URL = postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
ALPHA_VANTAGE_API_KEY = your_alpha_vantage_api_key
OPENAI_API_KEY = your_openai_api_key
NEXTAUTH_SECRET = your_nextauth_secret
NEXTAUTH_URL = https://your-project.vercel.app
```

### 5.5 部署项目

```bash
# 部署到生产环境
vercel --prod
```

## 🔍 第六步：验证部署

### 6.1 检查部署状态

1. 访问Vercel控制台查看部署状态
2. 确保所有环境变量已正确设置
3. 检查构建日志是否有错误

### 6.2 测试应用功能

1. 访问您的Vercel应用URL
2. 测试股票搜索功能
3. 测试AI分析功能
4. 测试观察列表功能

## 🛠️ 故障排除

### 常见问题

#### 1. 数据库连接失败
- 检查 `POSTGRES_URL` 是否正确
- 确保Supabase项目已创建
- 检查网络连接

#### 2. API密钥错误
- 确保Alpha Vantage API密钥有效
- 确保OpenAI API密钥有效
- 检查API密钥是否已正确设置

#### 3. 构建失败
- 检查代码是否有语法错误
- 确保所有依赖已安装
- 查看Vercel构建日志

#### 4. 环境变量未加载
- 确保环境变量名称正确
- 重新部署项目
- 检查Vercel环境变量设置

## 📞 获取帮助

如果遇到问题：

1. 查看Vercel部署日志
2. 检查Supabase数据库日志
3. 查看浏览器控制台错误
4. 参考项目文档

## 🎉 部署完成

恭喜！您的AI股票分析平台已成功部署到Vercel并使用Supabase数据库。

### 下一步

1. 配置自定义域名（可选）
2. 设置监控和日志
3. 配置CI/CD流程
4. 优化性能
