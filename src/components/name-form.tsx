'use client';

import { useFormState } from 'react-dom';

import { sayName } from '@/app/lib/actions';
import { clientRedirectTologin } from '@/auth/client-auth';
import { SayNameButton } from '@/components/say-name-button';

export default function NameForm() {
  // https://github.com/vercel/next.js/issues/65673#issuecomment-2115022037
  // useActionState is still in canary release at the time of writing this code, so using useFormState instead.
  const [state, formAction] = useFormState(sayName, { message: 'Please say your name...', authError: false });

  return (
    <form action={formAction} className="bg-white p-8 rounded shadow-md w-full max-w-md">
      {!state.authError && (
        <>
          <input
            type="text"
            name="username"
            placeholder="Your name..."
            required
            className="shadow-md border border-gray-300 rounded p-2 w-full mb-4"
          />
          <SayNameButton />
        </>
      )}
      {state.authError && (
        <button
          type="button"
          className="shadow-md cursor-pointer bg-blue-500 text-white py-2 px-4 rounded hover:brightness-90 transition ease-in-out duration-200"
          onClick={() => clientRedirectTologin()}
        >
          Login
        </button>
      )}
      <p className="mt-4 font-light">{state?.message}</p>
      {state.authError && <p className="my-4 font-light">Please login again.</p>}
    </form>
  );
}
