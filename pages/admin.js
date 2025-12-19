import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Admin() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admindashboard/projects');
  }, [router]);

  return <div>Redirecting...</div>;
}