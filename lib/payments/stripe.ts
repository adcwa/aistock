import Stripe from 'stripe';
import { db } from '@/lib/db/drizzle';
import { teams } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { SubscriptionTier } from '@/lib/types/subscription';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// 订阅计划配置
const SUBSCRIPTION_PLANS = {
  pro: {
    priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
    name: 'Pro',
    tier: SubscriptionTier.PRO
  },
  enterprise: {
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_monthly',
    name: 'Enterprise',
    tier: SubscriptionTier.ENTERPRISE
  }
};

export async function createCheckoutSession(
  teamId: number,
  planId: string,
  successUrl: string,
  cancelUrl: string
) {
  const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
  
  if (!plan) {
    throw new Error('Invalid plan ID');
  }

  // 获取团队信息
  const team = await db
    .select()
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  if (team.length === 0) {
    throw new Error('Team not found');
  }

  const teamData = team[0];

  // 创建或获取Stripe客户
  let customerId = teamData.stripeCustomerId;
  
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: 'team@example.com', // 这里应该使用团队主要用户的邮箱
      metadata: {
        teamId: teamId.toString(),
      },
    });
    
    customerId = customer.id;
    
    // 更新团队记录
    await db
      .update(teams)
      .set({ stripeCustomerId: customerId })
      .where(eq(teams.id, teamId));
  }

  // 创建结账会话
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: plan.priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: {
        teamId: teamId.toString(),
        planId: planId,
        planName: plan.name,
        tier: plan.tier,
      },
    },
    metadata: {
      teamId: teamId.toString(),
      planId: planId,
    },
  });

  return session;
}

export async function createCustomerPortalSession(teamId: number, returnUrl: string) {
  const team = await db
    .select()
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  if (team.length === 0 || !team[0].stripeCustomerId) {
    throw new Error('Team or Stripe customer not found');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: team[0].stripeCustomerId,
    return_url: returnUrl,
  });

  return session;
}

export async function updateTeamSubscription(
  teamId: number,
  subscriptionData: {
    stripeSubscriptionId: string | null;
    stripeProductId: string | null;
    planName: string | null;
    subscriptionStatus: string;
  }
) {
  await db
    .update(teams)
    .set(subscriptionData)
    .where(eq(teams.id, teamId));
}

export async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;
  const status = subscription.status;

  // 查找对应的团队
  const team = await db
    .select()
    .from(teams)
    .where(eq(teams.stripeCustomerId, customerId))
    .limit(1);

  if (team.length === 0) {
    console.error('Team not found for customer:', customerId);
    return;
  }

  if (status === 'active' || status === 'trialing') {
    // 订阅激活
    const plan = subscription.items.data[0]?.plan;
    if (!plan) {
      throw new Error('No plan found for this subscription.');
    }

    const product = await stripe.products.retrieve(plan.product as string);
    if (!product) {
      throw new Error('No product ID found for this subscription.');
    }

    await updateTeamSubscription(team[0].id, {
      stripeSubscriptionId: subscriptionId,
      stripeProductId: product.id,
      planName: product.name,
      subscriptionStatus: status
    });
  } else {
    // 订阅取消或暂停
    await updateTeamSubscription(team[0].id, {
      stripeSubscriptionId: null,
      stripeProductId: null,
      planName: null,
      subscriptionStatus: status
    });
  }
}

export { stripe };
