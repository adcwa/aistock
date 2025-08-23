# InsightTrader 股票分析平台设置指南

## 环境配置

### 1. 数据库设置

确保PostgreSQL数据库已启动，并创建数据库：

```sql
CREATE DATABASE aistock;
```

### 2. 环境变量配置

创建 `.env.local` 文件并配置以下变量：

```bash
# 数据库连接
POSTGRES_URL=postgresql://admin:Admin123@localhost:5432/aistock

# Alpha Vantage API密钥（需要从 https://www.alphavantage.co/ 获取）
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key_here

# OpenAI API密钥（用于情感分析，可选）
OPENAI_API_KEY=your_openai_api_key_here

# 现有配置保持不变
NEXTAUTH_SECRET=your_nextauth_secret_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here
```

### 3. 获取API密钥

#### Alpha Vantage API
1. 访问 https://www.alphavantage.co/
2. 注册免费账户
3. 获取API密钥
4. 将密钥添加到 `.env.local` 文件

#### OpenAI API（可选）
1. 访问 https://platform.openai.com/
2. 创建账户并获取API密钥
3. 将密钥添加到 `.env.local` 文件

## 安装和运行

### 1. 安装依赖
```bash
npm install
```

### 2. 运行数据库迁移
```bash
npm run db:migrate
```

### 3. 启动开发服务器
```bash
npm run dev
```

## 功能特性

### 已实现功能
- ✅ 股票搜索和基本信息获取
- ✅ 历史价格数据获取
- ✅ 基本面数据获取
- ✅ 技术分析指标计算（SMA、RSI、MACD、布林带、OBV）
- ✅ 基本面分析（财务比率计算）
- ✅ 投资推荐引擎
- ✅ 观察列表管理
- ✅ 股票详情分析页面

### 技术分析指标
- 简单移动平均线 (SMA 50/200)
- 相对强弱指数 (RSI 14)
- MACD指标
- 布林带
- 能量潮指标 (OBV)

### 基本面分析
- P/E比率
- P/B比率
- ROE（净资产收益率）
- 债务权益比
- 利润率
- 收入增长率
- 盈利增长率

### 推荐系统
- 四维度综合评分（技术、基本面、情感、宏观）
- 智能投资建议（强烈买入、买入、持有、卖出、强烈卖出）
- 风险等级评估
- 投资周期建议
- 置信度计算

## 使用说明

### 1. 股票搜索
- 访问 `/stocks` 页面
- 输入股票代码或公司名称进行搜索
- 查看搜索结果并添加到观察列表

### 2. 股票分析
- 点击股票查看详细分析
- 查看技术指标、基本面分析和投资建议
- 了解风险提示和投资理由

### 3. 观察列表管理
- 创建自定义观察列表
- 添加感兴趣的股票
- 管理多个观察列表

## 数据源

### 主要数据源
- **Alpha Vantage**: 股票价格、基本面数据
- **本地数据库**: 缓存和分析结果

### 数据更新频率
- 价格数据: 实时获取（API限制）
- 基本面数据: 季度财报发布后更新
- 技术指标: 实时计算

## 注意事项

1. **API限制**: Alpha Vantage免费版有API调用限制，建议升级到付费版以获得更好的服务
2. **数据准确性**: 所有数据仅供参考，投资决策请谨慎
3. **风险提示**: 投资有风险，入市需谨慎

## 开发计划

### Phase 2 计划功能
- [ ] 实时价格更新
- [ ] 新闻情感分析
- [ ] 宏观经济指标
- [ ] 高级图表展示
- [ ] 预警系统
- [ ] 移动端适配

### Phase 3 计划功能
- [ ] 机器学习模型
- [ ] 投资组合管理
- [ ] 回测系统
- [ ] 社交功能
- [ ] 高级筛选器
