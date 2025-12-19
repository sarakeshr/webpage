import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function TesterMeeting() {
  const [project, setProject] = useState(null);
  const [meetingLink, setMeetingLink] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setCurrentUser(user);
        
        const projectId = localStorage.getItem('selectedProjectId');

        if (projectId && user._id && user.role) {
          try {
            const projectsRes = await fetch(`/api/projects?userId=${user._id}&userRole=${user.role}`);
            if (projectsRes.ok) {
              const projects = await projectsRes.json();
              const selectedProject = projects.find(p => p._id === projectId || p.id === projectId);
              if (selectedProject) {
                setProject(selectedProject);
              }
            }
          } catch (error) {
            console.error('Error fetching project:', error);
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  if (!project) {
    return <div style={{ padding: '20px' }}>Project not found.</div>;
  }

  return (
    <div>
      <nav style={{ background: '#343a40', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Tester Dashboard</h1>
        <div style={{ display: 'flex', gap: '20px' }}>
          <Link href="/testerdashboard/projects" style={{ color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '4px' }}>Projects</Link>
          <a onClick={logout} style={{ color: 'white', cursor: 'pointer', padding: '8px 16px', borderRadius: '4px' }}>Logout</a>
        </div>
      </nav>

      <div style={{ padding: '20px' }}>
        <div style={{ background: 'white', padding: '20px', border: '1px solid #ddd', borderRadius: '4px' }}>
          <h2 style={{ margin: '0 0 20px 0' }}>Meeting: {project.title || project.name}</h2>
          <p>Testers can join meetings but cannot schedule them.</p>
          <Link href="/testerdashboard/projects/view" style={{ color: '#007bff', textDecoration: 'none' }}>← Back to Project View</Link>
        </div>
      </div>
    </div>
  );
}