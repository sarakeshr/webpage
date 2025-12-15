import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function ViewProject() {
  const [project, setProject] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [team, setTeam] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const router = useRouter();

  const fetchMeetings = async () => {
    try {
      // Get all meetings from database
      const meetingsRes = await fetch('/api/meetings');
      const allMeetings = await meetingsRes.json();
      
      console.log('📅 All meetings fetched:', allMeetings.length);
      console.log('📅 Meetings data:', allMeetings);
      
      // Filter for future meetings only
      const today = new Date().toISOString().split('T')[0];
      const upcomingMeetings = allMeetings.filter(meeting => meeting.date >= today);
      
      console.log('📅 Upcoming meetings:', upcomingMeetings.length);
      setMeetings(upcomingMeetings);
    } catch (error) {
      console.error('❌ Error fetching meetings:', error);
      setMeetings([]);
    }
  };

  const getParticipantNames = (participantIds) => {
    if (!participantIds || participantIds.length === 0) {
      return 'No participants assigned';
    }
    
    console.log('👥 Participant IDs:', participantIds);
    console.log('👥 Available team:', team);
    
    return participantIds.map(id => {
      const member = team.find(t => t.id === String(id) || t.id === id);
      console.log(`👥 Looking for ID ${id}, found:`, member);
      return member ? member.name : `User ${id}`;
    }).join(', ');
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    
    const handleClickOutside = (event) => {
      if (showProfile && !event.target.closest('.profile-dropdown')) {
        setShowProfile(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfile]);

  useEffect(() => {
    const projectId = localStorage.getItem('selectedProjectId');
    
    // Project mapping based on ID
    const getProjectById = (id) => {
      const projectMap = {
        '1': {
          id: '1',
          name: 'E-commerce Website Development',
          description: 'Online shopping platform development project.',
          status: 'In Progress',
          deadline: new Date().toISOString().split('T')[0]
        },
        '2': {
          id: '2',
          name: 'Mobile App for Food Delivery',
          description: 'Food delivery mobile application development.',
          status: 'Planning',
          deadline: new Date().toISOString().split('T')[0]
        },
        '3': {
          id: '3',
          name: 'CRM System Integration',
          description: 'Customer relationship management system integration.',
          status: 'Testing',
          deadline: new Date().toISOString().split('T')[0]
        },
        '4': {
          id: '4',
          name: 'Mobile App for Food Delivery',
          description: 'Food delivery mobile application development.',
          status: 'In Progress',
          deadline: new Date().toISOString().split('T')[0]
        },
        '5': {
          id: '5',
          name: 'CRM System Integration',
          description: 'Customer relationship management system integration.',
          status: 'Planning',
          deadline: new Date().toISOString().split('T')[0]
        }
      };
      
      console.log('Getting project for ID:', id);
      const project = projectMap[id] || {
        id: id,
        name: `Project ${id}`,
        description: 'Project information will be loaded here.',
        status: 'In Progress',
        deadline: new Date().toISOString().split('T')[0]
      };
      console.log('Returning project:', project);
      return project;
    };
    
    if (projectId) {
      fetch(`/api/projects`)
        .then(res => res.json())
        .then(projects => {
          console.log('Available projects:', projects);
          console.log('Looking for project ID:', projectId);
          // Try to find by string ID first, then by integer ID
          const selectedProject = projects.find(p => p.id === projectId || p.id === parseInt(projectId));
          if (selectedProject) {
            setProject(selectedProject);
          } else {
            // Use mapped project based on ID
            setProject(getProjectById(projectId));
          }
        })
        .catch(error => {
          console.error('Error fetching projects:', error);
          // Use mapped project based on ID
          setProject(getProjectById(projectId));
        });

      fetch('/api/team')
        .then(res => res.json())
        .then(data => setTeam(data))
        .catch(error => {
          console.error('Error fetching team:', error);
          setTeam([]);
        });

      fetchMeetings();
    } else {
      // No project ID, set a default
      setProject(getProjectById('1'));
    }
  }, []);

  // Refresh meetings when page becomes visible (user returns from scheduling)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchMeetings();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  if (!project) {
    return <div style={{ padding: '20px' }}>Loading project details...</div>;
  }

  return (
    <div>
      <nav style={{ background: '#343a40', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>{currentUser?.role ? `${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)} Dashboard` : 'Dashboard'}</h1>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link href="/clientdashboard/projects" style={{ color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '4px' }}>Projects</Link>
          <Link href="/clientdashboard/messages" style={{ color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '4px' }}>Messages</Link>
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
        <button 
          onClick={() => router.push('/clientdashboard/projects')}
          style={{ marginBottom: '20px', padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          ← Back to Projects
        </button>

        <div style={{ background: 'white', padding: '20px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '20px' }}>
          <h2 style={{ margin: '0 0 15px 0', fontSize: '28px', color: '#333' }}>{project.name}</h2>
          <p style={{ color: '#666', marginBottom: '15px' }}>{project.description}</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div>
              <strong>Status: </strong>
              <span style={{
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '14px',
                background: project.status === 'Completed' ? '#d4edda' : project.status === 'In Progress' ? '#cce5ff' : project.status === 'Testing' ? '#fff3cd' : '#e9ecef',
                color: project.status === 'Completed' ? '#155724' : project.status === 'In Progress' ? '#004085' : project.status === 'Testing' ? '#856404' : '#495057'
              }}>
                {project.status}
              </span>
            </div>
            <div>
              <strong>{project.status === 'Completed' ? 'Completed: ' : 'Deadline: '}</strong>
              <span>{project.completedDate || project.deadline}</span>
            </div>
          </div>


        </div>

        <div style={{ background: 'white', padding: '20px', border: '1px solid #ddd', borderRadius: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, fontSize: '20px' }}>Upcoming Meetings</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => router.push('/clientdashboard/projects/meeting')}
                style={{ padding: '6px 12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
              >
                📅 Schedule Meeting
              </button>
              <button 
                onClick={fetchMeetings}
                style={{ padding: '6px 12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
              >
                🔄 Refresh
              </button>
            </div>
          </div>
          {meetings.length > 0 ? (
            <div>
              {meetings.map(meeting => (
                <div key={meeting._id || meeting.id} style={{ borderLeft: '4px solid #28a745', paddingLeft: '15px', paddingTop: '8px', paddingBottom: '8px', marginBottom: '10px', background: '#f8f9fa' }}>
                  <div style={{ fontWeight: 'bold', color: '#333' }}>{meeting.title}</div>
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                    <strong>Date:</strong> {meeting.date} | <strong>Time:</strong> {meeting.time} | <strong>Duration:</strong> {meeting.duration || '30'} min
                  </div>
                  {meeting.location && (
                    <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                      <strong>Location:</strong> {meeting.location}
                    </div>
                  )}
                  {meeting.purpose && (
                    <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                      <strong>Purpose:</strong> {meeting.purpose}
                    </div>
                  )}
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                    <strong>Participants:</strong> {getParticipantNames(meeting.participants || [])}
                  </div>
                  <button 
                    onClick={() => {
                      // Generate consistent room name based on meeting data
                      const generateMeetingRoomName = (meeting) => {
                        const projectId = meeting.projectId || 1;
                        const dateStr = meeting.date.replace(/-/g, '');
                        const timeStr = meeting.time.replace(':', '');
                        return `project-${projectId}-${dateStr}-${timeStr}`;
                      };
                      
                      const roomName = meeting.roomName || generateMeetingRoomName(meeting);
                      const meetingUrl = `${process.env.NEXT_PUBLIC_JITSI_URL || 'https://localhost:8080'}/${roomName}`;
                      console.log('🎆 Joining meeting from upcoming:', meetingUrl);
                      window.open(meetingUrl, '_blank');
                    }}
                    style={{ marginTop: '8px', padding: '6px 12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    🚀 Join Meeting
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#666' }}>No upcoming meetings scheduled.</p>
          )}
        </div>
      </div>
    </div>
  );
}