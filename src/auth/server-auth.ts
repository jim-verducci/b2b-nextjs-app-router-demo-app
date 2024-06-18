import { NextRequest, NextResponse } from 'next/server';

import {
  CallbackData,
  CallbackResult,
  CallbackResultType,
  LoginConfig,
  LoginState,
  LogoutConfig,
  TokenResponse,
  Userinfo,
} from '@/types';
import * as authService from '@/services/auth-service';
import {
  APPLICATION_LOGIN_URL,
  AUTH_CALLBACK_URL,
  INVOTASTIC_HOST,
  IS_LOCALHOST,
  LOGIN_REQUIRED_ERROR,
  LOGIN_STATE_COOKIE_SECRET,
  NO_CACHE_HEADERS,
} from '@/utils/constants';
import {
  createLoginState,
  createLoginStateCookie,
  decryptLoginState,
  encryptLoginState,
  getAuthorizeUrl,
  getAndClearLoginStateCookie,
  parseTenantSubdomain,
  resolveTenantDomain,
} from '@/utils/helpers';
import { WristbandError } from '@/error';

/* ****************/
/* SDK CANDIDATES */
/* ****************/

export async function login(req: NextRequest, config: LoginConfig = {}): Promise<NextResponse> {
  // Make sure a valid tenantDomainName exists for multi-tenant apps.
  let tenantDomainName: string = '';
  tenantDomainName = resolveTenantDomain(req, !IS_LOCALHOST, INVOTASTIC_HOST);
  if (!tenantDomainName) {
    return NextResponse.redirect(APPLICATION_LOGIN_URL, { status: 302, headers: NO_CACHE_HEADERS });
  }

  // Create the login state which will be cached in a cookie so that it can be accessed in the callback.
  const customState = !!config.customState && !!Object.keys(config.customState).length ? config.customState : undefined;
  const loginState: LoginState = createLoginState(req, AUTH_CALLBACK_URL, { tenantDomainName, customState });

  // Clear any stale login state cookies and add a new one for the current request.
  const encryptedLoginState: string = await encryptLoginState(loginState, LOGIN_STATE_COOKIE_SECRET);
  createLoginStateCookie(loginState.state, encryptedLoginState, true);

  // Create the Wristband Authorize Endpoint URL which the user will get redirectd to.
  const authorizeUrl: string = getAuthorizeUrl(req, {
    wristbandApplicationDomain: process.env.APPLICATION_DOMAIN!,
    useCustomDomains: false,
    clientId: process.env.CLIENT_ID!,
    redirectUri: AUTH_CALLBACK_URL,
    state: loginState.state,
    codeVerifier: loginState.codeVerifier,
    scopes: ['openid', 'offline_access', 'profile', 'email', 'roles'],
    tenantDomainName,
  });

  // Perform the redirect to Wristband's Authorize Endpoint.
  return NextResponse.redirect(authorizeUrl, { status: 302, headers: NO_CACHE_HEADERS });
}

export async function callback(req: NextRequest): Promise<CallbackResult> {
  const code = req.nextUrl.searchParams.get('code');
  const paramState = req.nextUrl.searchParams.get('state');
  const error = req.nextUrl.searchParams.get('error');
  const errorDescription = req.nextUrl.searchParams.get('error_description');

  // Safety checks -- Wristband backend should never send bad query params
  if (!paramState || typeof paramState !== 'string') {
    throw new TypeError('Invalid query parameter [state] passed from Wristband during callback');
  }
  if (!!code && typeof code !== 'string') {
    throw new TypeError('Invalid query parameter [code] passed from Wristband during callback');
  }
  if (!!error && typeof error !== 'string') {
    throw new TypeError('Invalid query parameter [error] passed from Wristband during callback');
  }
  if (!!errorDescription && typeof errorDescription !== 'string') {
    throw new TypeError('Invalid query parameter [error_description] passed from Wristband during callback');
  }

  const appLoginUrl: string = APPLICATION_LOGIN_URL;
  const tenantSubdomain: string = !IS_LOCALHOST ? parseTenantSubdomain(req, INVOTASTIC_HOST) : '';
  let tenantLoginUrl: string =
    !IS_LOCALHOST && !!tenantSubdomain ? `http://${tenantSubdomain}${INVOTASTIC_HOST}/api/auth/login` : '';

  // Make sure the login state cookie exists, extract it, and set it to be cleared by the server.
  const loginStateCookie: string = getAndClearLoginStateCookie(req);
  console.log('COOKIE VALUE: ', loginStateCookie);
  if (!loginStateCookie) {
    console.warn(`Login state cookie not found. Redirecting to login.`);
    return { redirectUrl: tenantLoginUrl || appLoginUrl, result: CallbackResultType.REDIRECT_REQUIRED };
  }

  const loginState: LoginState = await decryptLoginState(loginStateCookie!, LOGIN_STATE_COOKIE_SECRET);
  const { codeVerifier, customState, returnUrl, state: cookieState, tenantDomainName } = loginState;

  console.log('LOGIN STATE: ', loginState);

  // Ensure there is a proper tenantDomain
  if (IS_LOCALHOST && !tenantDomainName) {
    console.log('REDIRECT 01!!');
    return { redirectUrl: appLoginUrl, result: CallbackResultType.REDIRECT_REQUIRED };
  }
  if (!IS_LOCALHOST && tenantSubdomain !== tenantDomainName) {
    console.log('REDIRECT 02!!');
    return {
      redirectUrl: `http://${tenantDomainName}.${INVOTASTIC_HOST}/api/auth/login`,
      result: CallbackResultType.REDIRECT_REQUIRED,
    };
  }

  tenantLoginUrl = !IS_LOCALHOST
    ? tenantLoginUrl
    : `http://${INVOTASTIC_HOST}/api/auth/login?tenant_domain=${tenantDomainName}`;

  // Check for any potential error conditions
  if (paramState !== cookieState) {
    console.log('REDIRECT 03!!');
    return { redirectUrl: tenantLoginUrl, result: CallbackResultType.REDIRECT_REQUIRED };
  }
  if (error) {
    if (error.toLowerCase() === LOGIN_REQUIRED_ERROR) {
      console.log('REDIRECT 04!!');
      return { redirectUrl: tenantLoginUrl, result: CallbackResultType.REDIRECT_REQUIRED };
    }
    throw new WristbandError(error, errorDescription || '');
  }

  /* WRISTBAND_TOUCHPOINT - AUTHENTICATION */
  // Exchange the authorization code for tokens
  if (!code) {
    throw new TypeError('Invalid query parameter [code] passed from Wristband during callback');
  }
  const tokenResponse: TokenResponse = await authService.exchangeAuthCodeForTokens(
    code,
    AUTH_CALLBACK_URL,
    codeVerifier
  );
  const {
    access_token: accessToken,
    id_token: idToken,
    refresh_token: refreshToken,
    expires_in: expiresIn,
  } = tokenResponse;

  /* WRISTBAND_TOUCHPOINT - RESOURCE API */
  // Get a minimal set of the user's data to store in their session data.
  // Fetch the userinfo for the user logging in.
  const userinfo: Userinfo = await authService.getUserinfo(accessToken);
  const callbackData: CallbackData = {
    accessToken,
    ...(!!customState && { customState }),
    expiresIn,
    idToken,
    ...(!!refreshToken && { refreshToken }),
    ...(!!returnUrl && { returnUrl }),
    tenantDomainName: tenantDomainName!,
    userinfo,
  };
  return { result: CallbackResultType.COMPLETED, callbackData };
}

export async function logout(req: NextRequest, config: LogoutConfig = {}): Promise<NextResponse> {
  const host = req.headers.get('host');

  // Revoke the refresh token only if present.
  if (config.refreshToken) {
    try {
      /* WRISTBAND_TOUCHPOINT - RESOURCE API */
      await authService.revokeRefreshToken(config.refreshToken);
    } catch (error) {
      // No need to block logout execution if revoking fails
      console.debug(`Revoking the refresh token failed during logout`);
    }
  }

  // The client ID is always required by the Wristband Logout Endpoint.
  const redirectUrl: string = config.redirectUrl ? `&redirect_url=${config.redirectUrl}` : '';
  const query: string = `client_id=${process.env.CLIENT_ID}${redirectUrl}`;

  // Construct the appropriate Logout Endpoint URL that the user will get redirected to.
  const appLoginUrl: string = APPLICATION_LOGIN_URL;
  if (!IS_LOCALHOST && host!.substring(host!.indexOf('.') + 1) !== INVOTASTIC_HOST) {
    console.warn(`No session found. Redirecting to application-level login.`);
    return NextResponse.redirect(appLoginUrl, { status: 302, headers: NO_CACHE_HEADERS });
  }
  if (IS_LOCALHOST && !config.tenantDomainName) {
    console.warn(`[${host}] has invalid domain. Redirecting to application-level login.`);
    return NextResponse.redirect(appLoginUrl, { status: 302, headers: NO_CACHE_HEADERS });
  }

  /* WRISTBAND_TOUCHPOINT - AUTHENTICATION */
  // Always perform logout redirect to the Wristband logout endpoint.
  const tenantDomain = !IS_LOCALHOST ? host!.substring(0, host!.indexOf('.')) : config.tenantDomainName;
  // const separator = this.useCustomDomains ? '.' : '-';
  const separator = '-';
  const logoutUrl = `https://${tenantDomain}${separator}${process.env.APPLICATION_DOMAIN}/api/v1/logout?${query}`;
  return NextResponse.redirect(logoutUrl, { status: 302, headers: NO_CACHE_HEADERS });
}
