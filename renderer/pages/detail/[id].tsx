// import { NextPageContext } from 'next'
import { Layout } from "../../components/Layout";
import { User } from "../../interfaces";
import { findAll, findData } from "../../utils/sample-api";
import ListDetail from "../../components/ListDetail";
import { GetStaticPaths, GetStaticProps } from "next";

type Params = {
  id?: string;
};

type Props = {
  item?: User;
  errors?: string;
};

const InitialPropsDetail = ({ item, errors }: Props) => {
  if (errors) {
    return (
      <Layout>
        <div className="p-8">
          <p>
            <span className="text-red-500">Error:</span> {errors}
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">{item && <ListDetail item={item} />}</div>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const items: User[] = await findAll();
  const paths = items.map((item) => `/detail/${item.id}`);
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { id } = params as Params;

  try {
    const item = await findData(Array.isArray(id) ? id[0] : id);
    return {
      props: {
        item,
      },
    };
  } catch (err) {
    return {
      props: {
        errors: err.message,
      },
    };
  }
};

export default InitialPropsDetail;
