'use server';

import { getSession } from '@/session/iron-session';
import { JSON_MEDIA_TYPE } from '@/utils/constants';
import { redirect } from 'next/navigation';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function redirectToLoginApiRoute() {
  // https://github.com/vercel/next.js/issues/53813
  // There's a bug where redirects inside of server components/actions will show an error in the browser developer
  // console, even though the redirect does succeed.
  redirect(`/api/auth/login`);
}

export async function sayName(prevState: { message: string }, formData: FormData) {
  const session = await getSession();
  const { isAuthenticated } = session;

  // Simulate a DB interaction
  await sleep(400);

  /* WRISTBAND_TOUCHPOINT - AUTHENTICATION */
  // NOTE: If you are doing auth checks in your middleware, then you usually don't need to do any auth check here.
  // This is here merely for demo purposes.
  if (!isAuthenticated) {
    return { message: `The silence is deafening.`, authError: true };
  }

  return { message: `My name is ${formData.get('username')}`, authError: false };
}

export async function getSettingsData() {
  const session = await getSession();
  const { accessToken, isAuthenticated, user } = session;

  /* WRISTBAND_TOUCHPOINT - AUTHENTICATION */
  // NOTE: If you are doing auth checks in your middleware, then you usually don't need to do any auth check here.
  // This is here merely for demo purposes.
  if (!isAuthenticated) {
    redirectToLoginApiRoute();
  }

  const res = await fetch(`https://${process.env.APPLICATION_DOMAIN}/api/v1/tenants/${user.tenantId}`, {
    cache: 'no-store',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': JSON_MEDIA_TYPE,
      Accept: JSON_MEDIA_TYPE,
    },
  });

  if (res.status !== 200) {
    redirectToLoginApiRoute();
  }

  const data = await res.json();
  return data;
}
