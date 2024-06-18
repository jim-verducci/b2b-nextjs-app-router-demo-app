import { NextResponse } from 'next/server';

import { getSession } from '@/session/iron-session';

export async function GET() {
  const session = await getSession();
  const { isAuthenticated, tenantDomainName, user } = session;
  return NextResponse.json({
    isAuthenticated,
    user: isAuthenticated ? user : null,
    tenantDomainName: isAuthenticated ? tenantDomainName : null,
  });
}
