import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import NotificationBell from '../../components/NotificationBell';

export default function ProjectManagerMessages() {
  const [selectedTeamType, setSelectedTeamType] = useState('allRoles');
  const [searchQuery, setSearchQuery] = useState('');
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
      if (!token) return;

      const response = await fetch('/api/user/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setCurrentUser(user);
      }
    } catch (error) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setCurrentUser(user);
    }
  };

  const teamMembers = {
    developers: [
      { name: 'John Smith', projects: [1, 2] },
      { name: 'Sarah Johnson', projects: [2] },
      { name: 'Mike Chen', projects: [3, 2, 5] }
    ],
    testers: [
      { name: 'Lisa Brown', projects: [1, 3] },
      { name: 'David Wilson', projects: [2, 5] }
    ],
    directors: [
      { name: 'Emily Davis', projects: [1, 2] },
      { name: 'Robert Taylor', projects: [3, 5] }
    ],
    crm: [
      { name: 'Jennifer Lee', projects: [1, 2, 3, 5] }
    ],
    clients: [
      { name: 'Michael Johnson', projects: [1, 2, 3, 5] },
      { name: 'Amanda Wilson', projects: [1, 3] }
    ]
  };

  const getProjectName = (projectId) => {
    const projectNames = {
      1: 'E-commerce website development',
      2: 'Mobile app for food delivery', 
      3: 'CRM system integration',
      4: 'Data analytics dashboard',
      5: 'Social media platform'
    };
    return projectNames[projectId] || 'Unknown Project';
  };

  const getAllMembers = () => {
    const allMembers = [];
    Object.keys(teamMembers).forEach(role => {
      teamMembers[role].forEach(member => {
        allMembers.push({ ...member, role });
      });
    });
    return allMembers;
  };

  const getFilteredMembers = () => {
    const members = selectedTeamType === 'allRoles' ? getAllMembers() : 
      teamMembers[selectedTeamType]?.map(member => ({ ...member, role: selectedTeamType })) || [];
    
    if (!searchQuery) return members;
    
    return members.filter(member => 
      member.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

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
          <Link href="/projectmanagerdashboard/projects" style={{ color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '4px' }}>Projects</Link>
          <Link href="/projectmanagerdashboard/messages" style={{ color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '4px', background: '#495057' }}>Messages</Link>
          <NotificationBell userRole="project_manager" />
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
        <h2>Messages</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
            <input 
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                padding: '10px', 
                border: '1px solid #ddd', 
                borderRadius: '4px', 
                width: '300px',
                fontSize: '16px'
              }}
            />
            <span style={{ fontSize: '20px' }}>🔍</span>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {['allRoles', 'developers', 'testers', 'directors', 'crm', 'clients'].map(role => (
              <button 
                key={role}
                onClick={() => setSelectedTeamType(role)}
                style={{ 
                  background: selectedTeamType === role ? '#007bff' : '#e9ecef', 
                  color: selectedTeamType === role ? 'white' : 'black',
                  border: 'none', 
                  padding: '8px 16px', 
                  borderRadius: '4px', 
                  cursor: 'pointer' 
                }}
              >
                {role === 'allRoles' ? 'All Roles' : role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <h3>{selectedTeamType === 'allRoles' ? 'All Team Members' : selectedTeamType.charAt(0).toUpperCase() + selectedTeamType.slice(1) + ' Team'}</h3>
          {getFilteredMembers().map((member, index) => (
            <div key={index} style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '10px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#007bff' }}>
                {member.name} ({member.role.charAt(0).toUpperCase() + member.role.slice(1)})
              </h4>
              <div style={{ marginLeft: '20px' }}>
                {member.projects.map(projectId => (
                  <div key={projectId} style={{ marginBottom: '5px', color: '#666' }}>
                    • {getProjectName(projectId)}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {getFilteredMembers().length === 0 && (
            <p style={{ color: '#666', fontStyle: 'italic' }}>No team members found matching your search.</p>
          )}
        </div>
      </div>
    </div>
  );
}