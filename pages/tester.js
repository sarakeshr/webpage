import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Tester() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/testerdashboard/projects');
  }, [router]);

  return <div>Redirecting...</div>;
}