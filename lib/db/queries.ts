import { desc, and, eq, isNull } from 'drizzle-orm';
import { db } from './drizzle';
import { activityLogs, teamMembers, teams, users } from './schema';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';
import { logger } from '@/lib/utils/logger';

export async function getUser() {
  try {
    logger.debug('Getting user from session', { action: 'getUser' });
    
    // 检查是否在服务器端渲染环境
    if (typeof window !== 'undefined') {
      logger.debug('getUser called in client-side environment', { action: 'getUser' });
      return null;
    }
    
    const sessionCookie = (await cookies()).get('session');
    if (!sessionCookie || !sessionCookie.value) {
      logger.debug('No session cookie found', { action: 'getUser' });
      return null;
    }

    logger.debug('Session cookie found', { 
      action: 'getUser',
      sessionLength: sessionCookie.value.length 
    });

    const sessionData = await verifyToken(sessionCookie.value);
    logger.debug('Session data verified', { 
      action: 'getUser',
      hasUser: !!sessionData?.user,
      userId: sessionData?.user?.id,
      expires: sessionData?.expires
    });

    if (
      !sessionData ||
      !sessionData.user ||
      typeof sessionData.user.id !== 'number'
    ) {
      logger.warn('Invalid session data', { 
        action: 'getUser',
        sessionData: JSON.stringify(sessionData)
      });
      return null;
    }

    if (new Date(sessionData.expires) < new Date()) {
      logger.warn('Session expired', { 
        action: 'getUser',
        expires: sessionData.expires,
        now: new Date().toISOString()
      });
      return null;
    }

    logger.dbQuery('SELECT', 'users', { userId: sessionData.user.id });
    
    const user = await db
      .select()
      .from(users)
      .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
      .limit(1);

    logger.debug('User query completed', { 
      action: 'getUser',
      userId: sessionData.user.id,
      userFound: user.length > 0
    });

    if (user.length === 0) {
      logger.warn('User not found in database', { 
        action: 'getUser',
        userId: sessionData.user.id
      });
      return null;
    }

    logger.info('User retrieved successfully', { 
      action: 'getUser',
      userId: user[0].id,
      email: user[0].email
    });

    return user[0];
  } catch (error) {
    // 如果是 PPR 相关的错误，直接返回 null 而不是抛出错误
    if (error instanceof Error && error.message.includes('prerendering')) {
      logger.debug('PPR prerendering detected, returning null', { action: 'getUser' });
      return null;
    }
    
    logger.dbError('SELECT', 'users', error as Error, { action: 'getUser' });
    throw error;
  }
}

export async function getTeamByStripeCustomerId(customerId: string) {
  const result = await db
    .select()
    .from(teams)
    .where(eq(teams.stripeCustomerId, customerId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
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
    .set({
      ...subscriptionData,
      updatedAt: new Date()
    })
    .where(eq(teams.id, teamId));
}

export async function getUserWithTeam(userId: number) {
  try {
    logger.dbQuery('SELECT with JOIN', 'users + teamMembers', { userId });
    
    const result = await db
      .select({
        user: users,
        teamId: teamMembers.teamId
      })
      .from(users)
      .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
      .where(eq(users.id, userId))
      .limit(1);

    logger.debug('User with team query completed', { 
      action: 'getUserWithTeam',
      userId,
      hasTeam: !!result[0]?.teamId
    });

    return result[0];
  } catch (error) {
    logger.dbError('SELECT with JOIN', 'users + teamMembers', error as Error, { 
      action: 'getUserWithTeam',
      userId 
    });
    throw error;
  }
}

export async function getActivityLogs() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userName: users.name
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(eq(activityLogs.userId, user.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(10);
}

export async function getTeamForUser() {
  const user = await getUser();
  if (!user) {
    return null;
  }

  const result = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
    with: {
      team: {
        with: {
          teamMembers: {
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      }
    }
  });

  return result?.team || null;
}
