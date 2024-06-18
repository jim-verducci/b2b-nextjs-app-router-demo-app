import { NextRequest, NextResponse } from 'next/server';

import { getSession } from '@/session/iron-session';
import { parseUserinfo } from '@/utils/helpers';
import { INVOTASTIC_HOST, IS_LOCALHOST, NO_CACHE_HEADERS } from '@/utils/constants';
import { callback } from '@/auth/server-auth';
import { CallbackResult, CallbackResultType } from '@/types';

export async function GET(req: NextRequest) {
  /* WRISTBAND_TOUCHPOINT - AUTHENTICATION */
  // After the user authenticates, exchange the incoming authorization code for JWTs and also retrieve userinfo.
  const callbackResult: CallbackResult = await callback(req);
  const { callbackData, redirectUrl, result } = callbackResult;

  if (result === CallbackResultType.REDIRECT_REQUIRED) {
    console.log('REDIRECT RESULT');
    return NextResponse.redirect(redirectUrl!, { status: 302, headers: NO_CACHE_HEADERS });
  }

  const session = await getSession();

  // Save any necessary fields for the user's app session into a session cookie.
  // const session = await getSession(req, redirectToAppResponse);
  session.isAuthenticated = true;
  session.accessToken = callbackData!.accessToken;
  // Convert the "expiresIn" seconds into an expiration date with the format of milliseconds from the epoch.
  session.expiresAt = Date.now() + callbackData!.expiresIn * 1000;
  session.refreshToken = callbackData!.refreshToken;
  session.user = parseUserinfo(callbackData!.userinfo);
  session.tenantDomainName = callbackData!.tenantDomainName;

  await session.save();

  // Send the user back to the Invotastic application.
  const tenantDomain = IS_LOCALHOST ? '' : `${callbackData!.tenantDomainName}.`;
  const appUrl = callbackData!.returnUrl || `http://${tenantDomain}${INVOTASTIC_HOST}`;
  return NextResponse.redirect(appUrl, { status: 302, headers: NO_CACHE_HEADERS });
}
