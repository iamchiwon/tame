import Link from "next/link";
import { Layout } from "../components/Layout";

const AboutPage = () => (
  <Layout>
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">About</h1>
      <p className="mb-4">This is the about page</p>
      <p>
        <Link href="/" className="text-blue-500 hover:underline">
          Go home
        </Link>
      </p>
    </div>
  </Layout>
);

export default AboutPage;
