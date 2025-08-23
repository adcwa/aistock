# InsightTrader - AI-Powered Stock Analysis Platform

InsightTrader是一个基于AI的智能股票分析平台，结合技术分析、基本面分析和AI智能推荐，为投资者提供全面的股票分析服务。

## 功能特性

- 🏠 **首页展示**: 未登录用户可访问首页和定价页面，了解系统功能
- 🔍 **股票搜索**: 支持股票代码和公司名称搜索
- 📊 **技术分析**: RSI、MACD、移动平均线、布林带等技术指标
- 💰 **基本面分析**: P/E比率、P/B比率、ROE、债务比率等财务指标
- 🤖 **AI智能分析**: 基于真实AI模型的股票分析和投资建议
- ⚙️ **AI配置管理**: 支持自定义OpenAI API配置，包括基础URL、模型选择等
- 📈 **历史数据**: 股票价格历史数据和趋势分析
- 📋 **观察列表**: 创建和管理个人股票观察列表
- 🔐 **用户认证**: 安全的用户注册和登录系统
- ⏳ **分析等待效果**: 美观的AI分析等待动画

## 技术栈

- **框架**: [Next.js 15](https://nextjs.org/) - React全栈框架
- **数据库**: [PostgreSQL](https://www.postgresql.org/) - 关系型数据库
- **ORM**: [Drizzle](https://orm.drizzle.team/) - TypeScript ORM
- **AI服务**: [OpenAI API](https://openai.com/) - AI分析和推荐
- **数据源**: [Alpha Vantage](https://www.alphavantage.co/) - 股票数据API
- **支付**: [Stripe](https://stripe.com/) - 支付处理
- **UI组件**: [shadcn/ui](https://ui.shadcn.com/) - 现代化UI组件库
- **样式**: [Tailwind CSS](https://tailwindcss.com/) - 实用优先的CSS框架

## Getting Started

```bash
git clone https://github.com/nextjs/saas-starter
cd saas-starter
pnpm install
```

## Running Locally

[Install](https://docs.stripe.com/stripe-cli) and log in to your Stripe account:

```bash
stripe login
```

Use the included setup script to create your `.env` file:

```bash
pnpm db:setup
```

Run the database migrations and seed the database with a default user and team:

```bash
pnpm db:migrate
pnpm db:seed
```

This will create the following user and team:

- User: `test@test.com`
- Password: `admin123`

You can also create new users through the `/sign-up` route.

Finally, run the Next.js development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app in action.

You can listen for Stripe webhooks locally through their CLI to handle subscription change events:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Testing Payments

To test Stripe payments, use the following test card details:

- Card Number: `4242 4242 4242 4242`
- Expiration: Any future date
- CVC: Any 3-digit number

## Going to Production

When you're ready to deploy your SaaS application to production, follow these steps:

### Set up a production Stripe webhook

1. Go to the Stripe Dashboard and create a new webhook for your production environment.
2. Set the endpoint URL to your production API route (e.g., `https://yourdomain.com/api/stripe/webhook`).
3. Select the events you want to listen for (e.g., `checkout.session.completed`, `customer.subscription.updated`).

### Deploy to Vercel

1. Push your code to a GitHub repository.
2. Connect your repository to [Vercel](https://vercel.com/) and deploy it.
3. Follow the Vercel deployment process, which will guide you through setting up your project.

### Add environment variables

In your Vercel project settings (or during deployment), add all the necessary environment variables. Make sure to update the values for the production environment, including:

1. `BASE_URL`: Set this to your production domain.
2. `STRIPE_SECRET_KEY`: Use your Stripe secret key for the production environment.
3. `STRIPE_WEBHOOK_SECRET`: Use the webhook secret from the production webhook you created in step 1.
4. `POSTGRES_URL`: Set this to your production database URL.
5. `AUTH_SECRET`: Set this to a random string. `openssl rand -base64 32` will generate one.

## Other Templates

While this template is intentionally minimal and to be used as a learning resource, there are other paid versions in the community which are more full-featured:

- https://achromatic.dev
- https://shipfa.st
- https://makerkit.dev
- https://zerotoshipped.com
- https://turbostarter.dev
