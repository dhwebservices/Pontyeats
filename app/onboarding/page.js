import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import OnboardingForm from './onboarding-form';
import { getRestaurantContext } from '@/lib/restaurant-access';

const Page = async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const context = await getRestaurantContext(supabase, user.id);
  if (context.restaurant) redirect('/dashboard');
  return <OnboardingForm userEmail={user.email} userId={user.id} />;
};

export default Page;
