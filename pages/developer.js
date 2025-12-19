import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Developer() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/developerdashboard/projects');
  }, [router]);

  return <div>Redirecting...</div>;
}