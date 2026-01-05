import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import NotificationBell from '../../../components/NotificationBell';

export default function DeveloperProjects() {
  const [showProfile, setShowProfile] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfile && !event.target.closest('.profile-dropdown')) {
        setShowProfile(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfile]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('Developer Dashboard - Current user:', user);
    setCurrentUser(user);
    
    if (user._id && user.role) {
      console.log('Fetching projects for userId:', user._id, 'role:', user.role);
      fetch(`/api/projects?userId=${user._id}&userRole=${user.role}`)
        .then(res => res.json())
        .then(data => {
          console.log('Developer Dashboard - Received projects:', data);
          setProjects(data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching projects:', error);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '18px' }}>
        Loading...
      </div>
    );
  }

  return (
    <div>
      <nav style={{ background: '#343a40', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>{currentUser?.role ? `${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1).replace('_', ' ')} Dashboard` : 'Dashboard'}</h1>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link href="/developerdashboard/projects" style={{ color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '4px', background: '#495057' }}>Projects</Link>
          <Link href="/developerdashboard/messages" style={{ color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '4px' }}>Messages</Link>
          <NotificationBell userRole="developer" />
          <div style={{ position: 'relative' }} className="profile-dropdown">
            <button
              onClick={() => setShowProfile(!showProfile)}
              style={{ 
                background: 'rgba(255,255,255,0.1)', 
                color: 'white', 
                border: '2px solid rgba(255,255,255,0.5)', 
                borderRadius: '50%', 
                width: '40px', 
                height: '40px', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                transition: 'all 0.3s ease'
              }}
            >
              👤
            </button>
            {showProfile && (
              <div style={{
                position: 'absolute',
                top: '50px',
                right: '0',
                background: 'white',
                color: 'black',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                padding: '15px',
                minWidth: '200px',
                zIndex: 1000
              }}>
                <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>👤 {currentUser?.username || currentUser?.name || 'User'}</div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>📧 {currentUser?.email || 'No email'}</div>
                  <div style={{ fontSize: '14px', color: '#666' }}>🏷️ {currentUser?.role || 'No role'}</div>
                </div>
                <button
                  onClick={() => {
                    setShowProfile(false);
                    logout();
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div style={{ padding: '20px' }}>
        <h2>Projects</h2>
        <div>
          {projects.length > 0 ? projects.map(project => (
            <div key={project._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: '1px solid #ddd', marginBottom: '10px', borderRadius: '4px' }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0' }}>{project.title}</h3>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  <span style={{ marginRight: '20px' }}><strong>Status:</strong> {project.status}</span>
                  <span><strong>Deadline:</strong> {new Date(project.deadline).toLocaleDateString()}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {project.status !== 'Completed' && (
                  <button 
                    onClick={() => {
                      localStorage.setItem('selectedProjectId', project._id);
                      router.push('/developerdashboard/projects/calendar');
                    }}
                    style={{ background: '#17a2b8', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    📅 Calendar
                  </button>
                )}
                <button 
                  onClick={() => {
                    localStorage.setItem('selectedProjectId', project._id);
                    router.push('/developerdashboard/projects/view');
                  }}
                  style={{ background: '#007bff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
                >
                  View
                </button>
              </div>
            </div>
          )) : <p>No projects available</p>}
        </div>
      </div>
    </div>
  );
}