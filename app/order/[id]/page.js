import OrderClient from './order-client';

const Page = async ({ params, searchParams }) => {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  return <OrderClient orderId={id} sessionId={resolvedSearchParams?.session_id} />;
};

export default Page;
