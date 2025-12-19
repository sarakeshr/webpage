import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ProjectManager() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/projectmanagerdashboard/projects');
  }, [router]);

  return <div>Redirecting...</div>;
}