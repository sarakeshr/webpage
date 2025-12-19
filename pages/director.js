import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Director() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/directordashboard/projects');
  }, [router]);

  return <div>Redirecting...</div>;
}