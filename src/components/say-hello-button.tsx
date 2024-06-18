'use client';

const FetchButton: React.FC = () => {
  const sayHello = async () => {
    try {
      const res = await fetch('/api/v1/hello');
      const data = await res.json();
      alert(data.message);
    } catch (error: unknown) {
      console.log(error);
    }
  };

  return (
    <div>
      <button
        id="say-hello-button"
        type="button"
        tabIndex={0}
        onClick={sayHello}
        className="shadow-md cursor-pointer w-full bg-[#00ffc1] hover:brightness-90 text-[#0c0c0c] rounded py-2 px-3 font-semibold text-lg transition ease-in-out duration-200"
      >
        Say Hello
      </button>
    </div>
  );
};

export default FetchButton;
