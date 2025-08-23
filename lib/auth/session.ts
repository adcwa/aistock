import { compare, hash } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NewUser } from '@/lib/db/schema';
import { logger } from '@/lib/utils/logger';

const authSecret = process.env.AUTH_SECRET;
if (!authSecret || authSecret.length === 0) {
  throw new Error('AUTH_SECRET environment variable is not set or is empty. Please set a secure secret key.');
}
const key = new TextEncoder().encode(authSecret);
const SALT_ROUNDS = 10;

export async function hashPassword(password: string) {
  return hash(password, SALT_ROUNDS);
}

export async function comparePasswords(
  plainTextPassword: string,
  hashedPassword: string
) {
  return compare(plainTextPassword, hashedPassword);
}

type SessionData = {
  user: { id: number };
  expires: string;
};

export async function signToken(payload: SessionData) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1 day from now')
    .sign(key);
}

export async function verifyToken(input: string) {
  try {
    logger.debug('Verifying JWT token', { 
      action: 'verifyToken',
      tokenLength: input.length 
    });

    if (!input || input.length === 0) {
      logger.warn('Empty token provided', { action: 'verifyToken' });
      return null;
    }

    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    
    logger.debug('Token verified successfully', { 
      action: 'verifyToken',
      hasUser: !!payload?.user,
      userId: payload?.user?.id,
      expires: payload?.expires
    });
    
    return payload as SessionData;
  } catch (error) {
    logger.error('Token verification failed', error as Error, { 
      action: 'verifyToken',
      tokenLength: input?.length 
    });
    return null;
  }
}

export async function getSession() {
  const session = (await cookies()).get('session')?.value;
  if (!session) return null;
  return await verifyToken(session);
}

export async function setSession(user: NewUser) {
  try {
    logger.debug('Setting session', { 
      action: 'setSession',
      userId: user.id 
    });

    if (!user.id) {
      logger.error('Cannot set session - user ID is null/undefined', null, { 
        action: 'setSession',
        user: JSON.stringify(user)
      });
      throw new Error('User ID is required to set session');
    }

    const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const session: SessionData = {
      user: { id: user.id },
      expires: expiresInOneDay.toISOString(),
    };
    
    logger.debug('Creating session data', { 
      action: 'setSession',
      userId: user.id,
      expires: expiresInOneDay.toISOString()
    });

    const encryptedSession = await signToken(session);
    
    logger.debug('Session token created', { 
      action: 'setSession',
      userId: user.id,
      tokenLength: encryptedSession.length
    });

    (await cookies()).set('session', encryptedSession, {
      expires: expiresInOneDay,
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
    });

    logger.info('Session set successfully', { 
      action: 'setSession',
      userId: user.id 
    });
  } catch (error) {
    logger.error('Failed to set session', error as Error, { 
      action: 'setSession',
      userId: user.id 
    });
    throw error;
  }
}
