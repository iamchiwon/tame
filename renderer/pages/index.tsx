import { useEffect } from "react";
import Link from "next/link";
import { Layout } from "../components/Layout";

const IndexPage = () => {
  useEffect(() => {
    const handleMessage = (_event, args) => alert(args);

    // listen to the 'message' channel
    window.electron.receiveHello(handleMessage);

    return () => {
      window.electron.stopReceivingHello(handleMessage);
    };
  }, []);

  const onSayHiClick = () => {
    window.electron.sayHello();
  };

  return (
    <Layout>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Hello Next.js 👋</h1>
        <button
          onClick={onSayHiClick}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
        >
          Say hi to electron
        </button>
        <p>
          <Link href="/about" className="text-blue-500 hover:underline">
            About
          </Link>
        </p>
      </div>
    </Layout>
  );
};

export default IndexPage;
