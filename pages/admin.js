import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Admin() {
  const router = useRouter();

  useEffect(() => {
    router.push('/admindashboard/projects');
  }, [router]);

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h2>Redirecting to Admin Dashboard...</h2>
    </div>
  );
}