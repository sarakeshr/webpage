import { useRouter } from 'next/router';

export default function DeveloperProjects() {
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  return (
    <div>
      <nav style={{ background: '#343a40', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Developer Dashboard</h1>
        <div style={{ display: 'flex', gap: '20px' }}>
          <a onClick={logout} style={{ color: 'white', cursor: 'pointer', padding: '8px 16px', borderRadius: '4px' }}>Logout</a>
        </div>
      </nav>

      <div style={{ padding: '20px' }}>
        <h2>Developer Projects</h2>
        <p>Developer dashboard content here</p>
      </div>
    </div>
  );
}