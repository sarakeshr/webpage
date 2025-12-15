import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import NotificationBell from '../../../components/NotificationBell';

export default function ClientProjects() {
  const [showProfile, setShowProfile] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchCurrentUser();
    
    const handleClickOutside = (event) => {
      if (showProfile && !event.target.closest('.profile-dropdown')) {
        setShowProfile(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfile]);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token found');
        return;
      }

      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('👤 Real user data loaded:', userData);
        setCurrentUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        // Fallback to localStorage if API fails
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Fallback to localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setCurrentUser(user);
    }
  };

  const allProjects = [
    { id: 1, name: 'E-commerce website development', description: 'Complete online shopping platform with payment integration', status: 'In Progress', deadline: '2024-12-15' },
    { id: 2, name: 'Mobile app for food delivery', description: 'iOS and Android app for restaurant food ordering', status: 'Planning', deadline: '2024-11-30' },
    { id: 3, name: 'CRM system integration', description: 'Customer relationship management system setup', status: 'Testing', deadline: '2024-12-01' },
    { id: 4, name: 'Data analytics dashboard', description: 'Business intelligence and reporting dashboard', status: 'Completed', completedDate: '2024-07-01' },
    { id: 5, name: 'Social media platform', description: 'Community-based social networking application', status: 'In Progress', deadline: '2025-01-15' },
    { id: 6, name: 'Inventory management system', description: 'Warehouse and stock management solution', status: 'Completed', completedDate: '2024-07-03' },
    { id: 7, name: 'Customer support portal', description: 'Help desk and ticket management system', status: 'Completed', completedDate: '2024-06-15' }
  ];

  const projects = [
    ...allProjects.filter(p => p.status !== 'Completed'),
    ...allProjects.filter(p => p.status === 'Completed').sort((a, b) => new Date(a.completedDate) - new Date(b.completedDate))
  ];

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  return (
    <div>
      <nav style={{ background: '#343a40', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>{currentUser?.role ? `${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)} Dashboard` : 'Dashboard'}</h1>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link href="/clientdashboard/projects" style={{ color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '4px', background: '#495057' }}>Projects</Link>
          <Link href="/clientdashboard/messages" style={{ color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '4px' }}>Messages</Link>
          <NotificationBell userRole="client" />
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
          {projects.map(project => (
            <div key={project.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: '1px solid #ddd', marginBottom: '10px', borderRadius: '4px' }}>
              <h3 style={{ margin: 0 }}>{project.name}</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                {project.status !== 'Completed' && (
                  <button 
                    onClick={() => {
                      localStorage.setItem('selectedProjectId', project.id);
                      router.push('/clientdashboard/projects/calendar');
                    }}
                    style={{ background: '#17a2b8', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    📅 Calendar
                  </button>
                )}
                {project.status !== 'Completed' && (
                  <button 
                    onClick={() => {
                      localStorage.setItem('selectedProjectId', project.id);
                      router.push('/clientdashboard/projects/meeting');
                    }}
                    style={{ background: '#28a745', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Meeting
                  </button>
                )}
                <button 
                  onClick={() => {
                    localStorage.setItem('selectedProjectId', project.id);
                    router.push('/clientdashboard/projects/view');
                  }}
                  style={{ background: '#007bff', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}