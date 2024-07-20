import { getIronSession, IronSession, SessionOptions } from 'iron-session';
import * as http from 'http';

import { SESSION_COOKIE_NAME, SESSION_COOKIE_SECRET } from '@/utils/constants';
import { User } from '@/types/wristband-types';
import { cookies } from 'next/headers';

type SessionData = {
  accessToken: string;
  expiresAt: number;
  isAuthenticated: boolean;
  refreshToken?: string;
  tenantDomainName: string;
  user: User;
};

const sessionOptions: SessionOptions = {
  cookieName: SESSION_COOKIE_NAME,
  password: SESSION_COOKIE_SECRET,
  cookieOptions: {
    httpOnly: true,
    maxAge: 1800,
    path: '/',
    sameSite: 'lax',
    // NOTE: If deploying your own app to production, do not disable secure cookies.
    secure: false,
  },
};

export function middlewareGetSession(
  req: http.IncomingMessage | Request,
  res: http.ServerResponse | Response
): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(req, res, sessionOptions);
}

export function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(cookies(), sessionOptions);
}
