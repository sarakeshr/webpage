import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Client() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/clientdashboard/projects');
  }, [router]);

  return <div>Redirecting...</div>;
}