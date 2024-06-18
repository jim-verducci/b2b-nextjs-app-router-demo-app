import { useFormStatus } from 'react-dom';
import { FaSpinner } from 'react-icons/fa';

export function SayNameButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      aria-disabled={pending}
      disabled={pending}
      className={`relative inline-flex items-center shadow-md cursor-pointer bg-blue-500 text-white py-2 px-4 rounded hover:brightness-90 transition ease-in-out duration-200 ${pending ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {pending ? (
        <>
          <FaSpinner className="w-5 h-5 mr-3 -ml-1 text-white animate-spin" />
          Submitting...
        </>
      ) : (
        'Say Your Name'
      )}
    </button>
  );
}
