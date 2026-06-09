import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { redirect } from 'next/navigation';

export async function getRequiredSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }
  return session;
}

export async function getOptionalSession() {
  return await getServerSession(authOptions);
}
