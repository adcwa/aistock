'use server';

import { redirect } from 'next/navigation';
import { createCheckoutSession, createCustomerPortalSession } from './stripe';
import { withTeam } from '@/lib/auth/middleware';

export const checkoutAction = withTeam(async (formData, team) => {
  const priceId = formData.get('priceId') as string;
  const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`;
  const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/subscription?canceled=true`;
  await createCheckoutSession(team.id, priceId, successUrl, cancelUrl);
});

export const customerPortalAction = withTeam(async (_, team) => {
  const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;
  const portalSession = await createCustomerPortalSession(team.id, returnUrl);
  redirect(portalSession.url);
});
