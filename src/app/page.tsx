'use client';

import { FaExclamationTriangle } from 'react-icons/fa';

import NameForm from '@/components/name-form';
import FetchButton from '@/components/say-hello-button';
import { useAuth } from '@/context/auth-context';

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="flex flex-col justify-center text-center">
      <div className="my-0 mx-auto">
        <h1 className="text-3xl font-bold underline">Home</h1>
      </div>

      <div className="p-4 my-4">
        <div className="flex items-center bg-yellow-300 bg-opacity-60 rounded-lg p-4 shadow-md w-full max-w-[600px] mx-auto font-medium">
          <FaExclamationTriangle className="text-2xl mr-4 min-w-[32px]" color="black" />
          <p className="text-lg text-left">We aim to add more functionality to this demo in the future.</p>
        </div>
      </div>

      {!isAuthenticated && <h3>Loading...</h3>}
      {isAuthenticated && (
        <>
          <div className="my-8 mx-auto">
            <h2 className="mb-4 font-bold">Client-side API Route Call</h2>
            <FetchButton />
          </div>
          <div className="my-8 mx-auto">
            <h2 className="mb-4 font-bold">Form Action</h2>
            <NameForm />
          </div>
        </>
      )}
    </section>
  );
}
