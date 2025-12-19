import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function CRM() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/crmdashboard/projects');
  }, [router]);

  return <div>Redirecting...</div>;
}