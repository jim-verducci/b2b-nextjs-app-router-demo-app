import type { NextRequest } from 'next/server';

import { login } from '@/auth/server-auth';

export async function GET(req: NextRequest) {
  /* WRISTBAND_TOUCHPOINT - AUTHENTICATION */
  // Redirect out to the Wristband authorize endpoint to start the login process via OAuth2/OIDC Auth Code flow.
  return await login(req);
}
