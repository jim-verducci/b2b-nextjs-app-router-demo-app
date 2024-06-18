import { NextResponse } from 'next/server';

import { getSession } from '@/session/iron-session';

const HTTP_401_STATUS = { status: 401 };
const UNAUTHORIZED = { statusText: 'Unauthorized' };

export async function GET() {
  const session = await getSession();
  const { isAuthenticated, tenantDomainName } = session;
  console.log('HELLO WORLD: ', isAuthenticated, tenantDomainName);

  /* WRISTBAND_TOUCHPOINT - AUTHENTICATION */
  if (!isAuthenticated) {
    return NextResponse.json(UNAUTHORIZED, HTTP_401_STATUS);
  }

  return NextResponse.json({ message: 'Hello, World!' });
}
