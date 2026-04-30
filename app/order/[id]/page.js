import OrderClient from './order-client';

const Page = ({ params, searchParams }) => {
  return <OrderClient orderId={params.id} sessionId={searchParams?.session_id} />;
};

export default Page;
