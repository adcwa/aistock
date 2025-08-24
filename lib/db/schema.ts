import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  decimal,
  bigint,
  boolean,
  json,
  time,
  date,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

export const stocks = pgTable('stocks', {
  id: serial('id').primaryKey(),
  symbol: varchar('symbol', { length: 10 }).notNull().unique(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  sector: varchar('sector', { length: 100 }),
  industry: varchar('industry', { length: 100 }),
  marketCap: bigint('market_cap', { mode: 'number' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 用户观察列表表
export const watchlists = pgTable('watchlists', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 观察列表股票关联表
export const watchlistStocks = pgTable('watchlist_stocks', {
  id: serial('id').primaryKey(),
  watchlistId: integer('watchlist_id')
    .notNull()
    .references(() => watchlists.id),
  stockId: integer('stock_id')
    .notNull()
    .references(() => stocks.id),
  addedAt: timestamp('added_at').notNull().defaultNow(),
});

// 时间序列价格数据表
export const stockPrices = pgTable('stock_prices', {
  id: serial('id').primaryKey(),
  stockId: integer('stock_id')
    .notNull()
    .references(() => stocks.id),
  timestamp: timestamp('timestamp').notNull(),
  open: decimal('open', { precision: 10, scale: 4 }).notNull(),
  high: decimal('high', { precision: 10, scale: 4 }).notNull(),
  low: decimal('low', { precision: 10, scale: 4 }).notNull(),
  close: decimal('close', { precision: 10, scale: 4 }).notNull(),
  volume: bigint('volume', { mode: 'number' }).notNull(),
  interval: varchar('interval', { length: 20 }).notNull(), // '1m', '5m', '1h', '1d', '1w', '1mo'
});

// 基本面数据表
export const fundamentals = pgTable('fundamentals', {
  id: serial('id').primaryKey(),
  stockId: integer('stock_id')
    .notNull()
    .references(() => stocks.id),
  reportDate: timestamp('report_date').notNull(),
  quarter: varchar('quarter', { length: 10 }),
  year: integer('year').notNull(),
  revenue: bigint('revenue', { mode: 'number' }),
  netIncome: bigint('net_income', { mode: 'number' }),
  eps: decimal('eps', { precision: 8, scale: 4 }),
  pe: decimal('pe', { precision: 8, scale: 2 }),
  pb: decimal('pb', { precision: 8, scale: 2 }),
  roe: decimal('roe', { precision: 8, scale: 4 }),
  debtToEquity: decimal('debt_to_equity', { precision: 8, scale: 4 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 技术指标表
export const technicalIndicators = pgTable('technical_indicators', {
  id: serial('id').primaryKey(),
  stockId: integer('stock_id')
    .notNull()
    .references(() => stocks.id),
  timestamp: timestamp('timestamp').notNull(),
  sma50: decimal('sma_50', { precision: 10, scale: 4 }),
  sma200: decimal('sma_200', { precision: 10, scale: 4 }),
  rsi14: decimal('rsi_14', { precision: 6, scale: 2 }),
  macd: decimal('macd', { precision: 10, scale: 6 }),
  macdSignal: decimal('macd_signal', { precision: 10, scale: 6 }),
  bbUpper: decimal('bb_upper', { precision: 10, scale: 4 }),
  bbLower: decimal('bb_lower', { precision: 10, scale: 4 }),
  obv: bigint('obv', { mode: 'number' }),
});

// 新闻文章表
export const newsArticles = pgTable('news_articles', {
  id: serial('id').primaryKey(),
  stockId: integer('stock_id')
    .notNull()
    .references(() => stocks.id),
  title: varchar('title', { length: 500 }).notNull(),
  content: text('content'),
  source: varchar('source', { length: 100 }),
  url: text('url'),
  publishedAt: timestamp('published_at').notNull(),
  sentimentScore: decimal('sentiment_score', { precision: 4, scale: 3 }), // -1.000 to 1.000
  sentimentLabel: varchar('sentiment_label', { length: 20 }), // 'positive', 'neutral', 'negative'
  summary: text('summary'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 分析推荐记录表
export const recommendations = pgTable('recommendations', {
  id: serial('id').primaryKey(),
  stockId: integer('stock_id')
    .notNull()
    .references(() => stocks.id),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  recommendation: varchar('recommendation', { length: 20 }).notNull(), // 'strong_buy', 'buy', 'hold', 'sell', 'strong_sell'
  confidence: decimal('confidence', { precision: 4, scale: 3 }).notNull(), // 0.000 to 1.000
  reasoning: text('reasoning').notNull(),
  technicalScore: decimal('technical_score', { precision: 4, scale: 3 }),
  fundamentalScore: decimal('fundamental_score', { precision: 4, scale: 3 }),
  sentimentScore: decimal('sentiment_score', { precision: 4, scale: 3 }),
  macroScore: decimal('macro_score', { precision: 4, scale: 3 }),
});

// 分析历史表 - 用于回溯准确率
export const analysisHistory = pgTable('analysis_history', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  stockId: integer('stock_id')
    .notNull()
    .references(() => stocks.id),
  recommendation: varchar('recommendation', { length: 20 }).notNull(), // 'buy', 'hold', 'sell'
  confidence: decimal('confidence', { precision: 5, scale: 4 }).notNull(),
  technicalScore: decimal('technical_score', { precision: 5, scale: 4 }).notNull(),
  fundamentalScore: decimal('fundamental_score', { precision: 5, scale: 4 }).notNull(),
  sentimentScore: decimal('sentiment_score', { precision: 5, scale: 4 }).notNull(),
  macroScore: decimal('macro_score', { precision: 5, scale: 4 }).notNull(),
  overallScore: decimal('overall_score', { precision: 5, scale: 4 }).notNull(),
  reasoning: text('reasoning'),
  aiSentiment: varchar('ai_sentiment', { length: 20 }),
  aiConfidence: decimal('ai_confidence', { precision: 5, scale: 4 }),
  aiReasoning: text('ai_reasoning'),
  actualPrice: decimal('actual_price', { precision: 10, scale: 4 }), // 实际价格（用于验证）
  predictedPrice: decimal('predicted_price', { precision: 10, scale: 4 }), // 预测价格
  accuracy: decimal('accuracy', { precision: 5, scale: 4 }), // 准确率
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 用户预警设置表
export const alerts = pgTable('alerts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  stockId: integer('stock_id')
    .notNull()
    .references(() => stocks.id),
  type: varchar('type', { length: 50 }).notNull(), // 'price', 'technical', 'recommendation'
  condition: text('condition').notNull(), // JSON配置
  isActive: boolean('is_active').notNull().default(true),
  lastTriggered: timestamp('last_triggered'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 搜索历史表
export const searchHistory = pgTable('search_history', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  symbol: varchar('symbol', { length: 10 }).notNull(),
  companyName: varchar('company_name', { length: 255 }),
  searchedAt: timestamp('searched_at').notNull().defaultNow(),
});

// AI配置表
export const aiConfigs = pgTable('ai_configs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  isDefault: boolean('is_default').default(false),
  baseUrl: varchar('base_url', { length: 255 }).notNull().default('https://api.openai.com/v1'),
  apiKey: varchar('api_key', { length: 255 }), // 加密存储
  model: varchar('model', { length: 50 }).notNull().default('gpt-4o-mini'),
  maxTokens: integer('max_tokens').notNull().default(1000),
  temperature: decimal('temperature', { precision: 3, scale: 2 }).notNull().default('0.30'),
  systemPrompt: text('system_prompt'), // 自定义系统提示词
  analysisPrompt: text('analysis_prompt'), // 自定义分析提示词
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// AI配置使用记录表
export const aiConfigUsage = pgTable('ai_config_usage', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  configId: integer('config_id')
    .notNull()
    .references(() => aiConfigs.id, { onDelete: 'cascade' }),
  stockSymbol: varchar('stock_symbol', { length: 10 }).notNull(),
  tokensUsed: integer('tokens_used'),
  cost: decimal('cost', { precision: 10, scale: 4 }),
  responseTime: integer('response_time'), // 毫秒
  success: boolean('success').notNull(),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 邮件通知配置表
export const emailNotifications = pgTable('email_notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  isEnabled: boolean('is_enabled').default(true),
  morningTime: time('morning_time').default('09:00:00'),
  eveningTime: time('evening_time').default('18:00:00'),
  timezone: varchar('timezone', { length: 50 }).default('Asia/Shanghai'),
  includeWatchlist: boolean('include_watchlist').default(true),
  includeAnalysis: boolean('include_analysis').default(true),
  includeAlerts: boolean('include_alerts').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 邮件发送记录表
export const emailLogs = pgTable('email_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 255 }).notNull(),
  templateName: varchar('template_name', { length: 100 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(), // 'sent', 'failed', 'pending'
  errorMessage: text('error_message'),
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 用户使用量跟踪表
export const usageTracking = pgTable('usage_tracking', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  queriesUsed: integer('queries_used').default(0),
  aiAnalysisUsed: integer('ai_analysis_used').default(0),
  watchlistCount: integer('watchlist_count').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 角色表
export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  description: text('description'),
  permissions: json('permissions').$type<string[]>(),
  isSystem: boolean('is_system').default(false), // 是否为系统内置角色
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 用户角色关联表
export const userRoles = pgTable('user_roles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  roleId: integer('role_id')
    .notNull()
    .references(() => roles.id, { onDelete: 'cascade' }),
  assignedBy: integer('assigned_by')
    .references(() => users.id),
  assignedAt: timestamp('assigned_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at'), // 角色过期时间
});

// 权限表
export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  resource: varchar('resource', { length: 100 }).notNull(), // 资源类型
  action: varchar('action', { length: 50 }).notNull(), // 操作类型
  route: varchar('route', { length: 200 }), // 对应的路由
  isSystem: boolean('is_system').default(false), // 是否为系统内置权限
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 角色权限关联表
export const rolePermissions = pgTable('role_permissions', {
  id: serial('id').primaryKey(),
  roleId: integer('role_id')
    .notNull()
    .references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: integer('permission_id')
    .notNull()
    .references(() => permissions.id, { onDelete: 'cascade' }),
  grantedBy: integer('granted_by')
    .references(() => users.id),
  grantedAt: timestamp('granted_at').notNull().defaultNow(),
});

// 订阅配置表（管理员可配置）
export const subscriptionConfigs = pgTable('subscription_configs', {
  id: serial('id').primaryKey(),
  tier: varchar('tier', { length: 20 }).notNull().unique(), // free, pro, enterprise
  name: varchar('name', { length: 100 }).notNull(),
  dailyQueries: integer('daily_queries').notNull().default(50),
  aiAnalysisPerDay: integer('ai_analysis_per_day').notNull().default(10),
  watchlistLimit: integer('watchlist_limit').notNull().default(5),
  emailNotifications: boolean('email_notifications').default(false),
  customAIConfig: boolean('custom_ai_config').default(false),
  advancedFeatures: boolean('advanced_features').default(false),
  price: decimal('price', { precision: 10, scale: 2 }).default('0.00'),
  currency: varchar('currency', { length: 3 }).default('USD'),
  isActive: boolean('is_active').default(true),
  createdBy: integer('created_by').references(() => users.id),
  updatedBy: integer('updated_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
}));



export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const stocksRelations = relations(stocks, ({ many }) => ({
  watchlistStocks: many(watchlistStocks),
  stockPrices: many(stockPrices),
  fundamentals: many(fundamentals),
  technicalIndicators: many(technicalIndicators),
  newsArticles: many(newsArticles),
  recommendations: many(recommendations),
  analysisHistory: many(analysisHistory),
  alerts: many(alerts),
}));

export const watchlistsRelations = relations(watchlists, ({ one, many }) => ({
  user: one(users, {
    fields: [watchlists.userId],
    references: [users.id],
  }),
  watchlistStocks: many(watchlistStocks),
}));

export const searchHistoryRelations = relations(searchHistory, ({ one }) => ({
  user: one(users, {
    fields: [searchHistory.userId],
    references: [users.id],
  }),
}));

export const watchlistStocksRelations = relations(watchlistStocks, ({ one }) => ({
  watchlist: one(watchlists, {
    fields: [watchlistStocks.watchlistId],
    references: [watchlists.id],
  }),
  stock: one(stocks, {
    fields: [watchlistStocks.stockId],
    references: [stocks.id],
  }),
}));

export const stockPricesRelations = relations(stockPrices, ({ one }) => ({
  stock: one(stocks, {
    fields: [stockPrices.stockId],
    references: [stocks.id],
  }),
}));

export const fundamentalsRelations = relations(fundamentals, ({ one }) => ({
  stock: one(stocks, {
    fields: [fundamentals.stockId],
    references: [stocks.id],
  }),
}));

export const technicalIndicatorsRelations = relations(technicalIndicators, ({ one }) => ({
  stock: one(stocks, {
    fields: [technicalIndicators.stockId],
    references: [stocks.id],
  }),
}));

export const analysisHistoryRelations = relations(analysisHistory, ({ one }) => ({
  user: one(users, {
    fields: [analysisHistory.userId],
    references: [users.id],
  }),
  stock: one(stocks, {
    fields: [analysisHistory.stockId],
    references: [stocks.id],
  }),
}));

export const newsArticlesRelations = relations(newsArticles, ({ one }) => ({
  stock: one(stocks, {
    fields: [newsArticles.stockId],
    references: [stocks.id],
  }),
}));

export const recommendationsRelations = relations(recommendations, ({ one }) => ({
  stock: one(stocks, {
    fields: [recommendations.stockId],
    references: [stocks.id],
  }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  user: one(users, {
    fields: [alerts.userId],
    references: [users.id],
  }),
  stock: one(stocks, {
    fields: [alerts.stockId],
    references: [stocks.id],
  }),
}));

export const aiConfigsRelations = relations(aiConfigs, ({ one, many }) => ({
  user: one(users, {
    fields: [aiConfigs.userId],
    references: [users.id],
  }),
  usage: many(aiConfigUsage),
}));

export const aiConfigUsageRelations = relations(aiConfigUsage, ({ one }) => ({
  user: one(users, {
    fields: [aiConfigUsage.userId],
    references: [users.id],
  }),
  config: one(aiConfigs, {
    fields: [aiConfigUsage.configId],
    references: [aiConfigs.id],
  }),
}));

export const emailNotificationsRelations = relations(emailNotifications, ({ one }) => ({
  user: one(users, {
    fields: [emailNotifications.userId],
    references: [users.id],
  }),
}));

export const emailLogsRelations = relations(emailLogs, ({ one }) => ({
  user: one(users, {
    fields: [emailLogs.userId],
    references: [users.id],
  }),
}));

export const usageTrackingRelations = relations(usageTracking, ({ one }) => ({
  user: one(users, {
    fields: [usageTracking.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
}

export type Stock = typeof stocks.$inferSelect;
export type NewStock = typeof stocks.$inferInsert;
export type Watchlist = typeof watchlists.$inferSelect;
export type NewWatchlist = typeof watchlists.$inferInsert;
export type WatchlistStock = typeof watchlistStocks.$inferSelect;
export type NewWatchlistStock = typeof watchlistStocks.$inferInsert;
export type StockPrice = typeof stockPrices.$inferSelect;
export type NewStockPrice = typeof stockPrices.$inferInsert;
export type Fundamental = typeof fundamentals.$inferSelect;
export type NewFundamental = typeof fundamentals.$inferInsert;
export type TechnicalIndicator = typeof technicalIndicators.$inferSelect;
export type NewTechnicalIndicator = typeof technicalIndicators.$inferInsert;
export type NewsArticle = typeof newsArticles.$inferSelect;
export type NewNewsArticle = typeof newsArticles.$inferInsert;
export type Recommendation = typeof recommendations.$inferSelect;
export type NewRecommendation = typeof recommendations.$inferInsert;
export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;
export type SearchHistory = typeof searchHistory.$inferSelect;
export type NewSearchHistory = typeof searchHistory.$inferInsert;
export type AIConfig = typeof aiConfigs.$inferSelect;
export type NewAIConfig = typeof aiConfigs.$inferInsert;
export type AIConfigUsage = typeof aiConfigUsage.$inferSelect;
export type NewAIConfigUsage = typeof aiConfigUsage.$inferInsert;
export type EmailNotification = typeof emailNotifications.$inferSelect;
export type NewEmailNotification = typeof emailNotifications.$inferInsert;
export type EmailLog = typeof emailLogs.$inferSelect;
export type NewEmailLog = typeof emailLogs.$inferInsert;
export type UsageTracking = typeof usageTracking.$inferSelect;
export type NewUsageTracking = typeof usageTracking.$inferInsert;

// 角色和权限相关类型
export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;
export type SubscriptionConfig = typeof subscriptionConfigs.$inferSelect;
export type NewSubscriptionConfig = typeof subscriptionConfigs.$inferInsert;

// 关系定义
export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  aiConfigs: many(aiConfigs),
  aiConfigUsage: many(aiConfigUsage),
  emailNotifications: many(emailNotifications),
  emailLogs: many(emailLogs),
  usageTracking: many(usageTracking),
  userRoles: many(userRoles),
  assignedRoles: many(userRoles, { relationName: 'assignedBy' }),
  createdSubscriptionConfigs: many(subscriptionConfigs, { relationName: 'createdBy' }),
  updatedSubscriptionConfigs: many(subscriptionConfigs, { relationName: 'updatedBy' }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
  rolePermissions: many(rolePermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
  assignedBy: one(users, {
    fields: [userRoles.assignedBy],
    references: [users.id],
    relationName: 'assignedBy',
  }),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
  grantedBy: one(users, {
    fields: [rolePermissions.grantedBy],
    references: [users.id],
  }),
}));

export const subscriptionConfigsRelations = relations(subscriptionConfigs, ({ one }) => ({
  createdBy: one(users, {
    fields: [subscriptionConfigs.createdBy],
    references: [users.id],
    relationName: 'createdBy',
  }),
  updatedBy: one(users, {
    fields: [subscriptionConfigs.updatedBy],
    references: [users.id],
    relationName: 'updatedBy',
  }),
}));
