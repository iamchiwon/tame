import Link from "next/link";
import { useRouter } from "next/router";
import { Layout } from "../components/Layout";
import List from "../components/List";
import { User } from "../interfaces";
import { findAll } from "../utils/sample-api";

type Props = {
  items: User[];
  pathname: string;
};

const WithInitialProps = ({ items }: Props) => {
  const router = useRouter();
  return (
    <Layout>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">
          List Example (as Function Component)
        </h1>
        <p className="mb-4">You are currently on: {router.pathname}</p>
        <List items={items} />
        <p className="mt-4">
          <Link href="/" className="text-blue-500 hover:underline">
            Go home
          </Link>
        </p>
      </div>
    </Layout>
  );
};

export async function getStaticProps() {
  const items: User[] = await findAll();

  return { props: { items } };
}

export default WithInitialProps;
