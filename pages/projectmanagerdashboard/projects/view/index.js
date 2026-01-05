import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function ProjectManagerViewProject() {
  const [project, setProject] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchMeetings = async () => {
    try {
      const projectId = localStorage.getItem('selectedProjectId');
      const meetingsRes = await fetch('/api/meetings');
      if (meetingsRes.ok) {
        const allMeetings = await meetingsRes.json();
        console.log('Fetched meetings:', allMeetings);
        const projectMeetings = allMeetings.filter(m => m.projectId == projectId);
        setMeetings(projectMeetings);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user from localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setCurrentUser(user);
        
        const projectId = localStorage.getItem('selectedProjectId');
        if (projectId) {
          // Fetch project from API
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          if (user._id && user.role) {
            fetch(`/api/projects?userId=${user._id}&userRole=${user.role}`)
              .then(res => res.json())
              .then(projects => {
                const selectedProject = projects.find(p => p._id === projectId || p.id === projectId);
                if (selectedProject) {
                  setProject(selectedProject);
                }
              })
              .catch(error => {
                console.error('Error fetching projects:', error);
              });
          }
          
          // Fetch team data
          try {
            const teamRes = await fetch('/api/team');
            if (teamRes.ok) {
              const teamData = await teamRes.json();
              setTeam(teamData || []);
            }
          } catch (error) {
            console.error('Error fetching team:', error);
          }
          
          // Fetch meetings
          try {
            const meetingsRes = await fetch('/api/meetings');
            if (meetingsRes.ok) {
              const allMeetings = await meetingsRes.json();
              console.log('Fetched meetings:', allMeetings);
              // Filter meetings for this project and show all
              const projectMeetings = allMeetings.filter(m => m.projectId == projectId);
              setMeetings(projectMeetings);
            }
          } catch (error) {
            console.error('Error fetching meetings:', error);
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Refresh meetings every 5 seconds to show new ones
    const interval = setInterval(fetchMeetings, 5000);
    return () => clearInterval(interval);
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
        <h1 style={{ margin: 0, fontSize: '24px' }}>{currentUser?.role ? `${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1).replace('_', ' ')} Dashboard` : 'Dashboard'}</h1>
        <div style={{ display: 'flex', gap: '20px' }}>
          <Link href="/projectmanagerdashboard/projects" style={{ color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '4px' }}>Projects</Link>
          <Link href="/projectmanagerdashboard/projects/calendar" style={{ color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '4px' }}>Calendar</Link>
          <Link href="/projectmanagerdashboard/projects/board" style={{ color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '4px' }}>Board</Link>
          <Link href="/projectmanagerdashboard/messages" style={{ color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '4px' }}>Messages</Link>
          <a onClick={logout} style={{ color: 'white', cursor: 'pointer', padding: '8px 16px', borderRadius: '4px' }}>Logout</a>
        </div>
      </nav>

      <div style={{ padding: '20px' }}>
        <button 
          onClick={() => router.push('/projectmanagerdashboard/projects')}
          style={{ marginBottom: '20px', padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          ← Back to Projects
        </button>

        <div style={{ background: 'white', padding: '20px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '20px' }}>
          <h2 style={{ margin: '0 0 15px 0', fontSize: '28px', color: '#333' }}>{project.title || project.name}</h2>
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
          <h3 style={{ margin: '0 0 15px 0', fontSize: '20px' }}>📅 Upcoming Meetings</h3>
          {meetings.length > 0 ? (
            <div>
              {meetings.map((meeting, index) => (
                <div key={meeting._id || meeting.id || index} style={{ borderLeft: '4px solid #28a745', paddingLeft: '15px', paddingTop: '12px', paddingBottom: '12px', marginBottom: '15px', background: '#f8f9fa', borderRadius: '4px' }}>
                  <div style={{ fontWeight: 'bold', color: '#333', fontSize: '16px', marginBottom: '8px' }}>{meeting.title}</div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '6px' }}>
                    <strong>Date:</strong> {meeting.date} | <strong>Time:</strong> {meeting.time} | <strong>Duration:</strong> {meeting.duration || 60} min
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '6px' }}>
                    <strong>Location:</strong> {meeting.location || 'Online (Jitsi Meet)'}
                  </div>
                  {meeting.purpose && (
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '6px' }}>
                      <strong>Purpose:</strong> {meeting.purpose}
                    </div>
                  )}
                  {meeting.participants && meeting.participants.length > 0 && (
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                      <strong>Participants:</strong> {Array.isArray(meeting.participants) 
                        ? meeting.participants.map(p => {
                            if (typeof p === 'string' && p.length === 24) {
                              const user = team.find(u => u.id === p);
                              return user ? user.username || user.name : p;
                            }
                            return p;
                          }).join(', ')
                        : meeting.participants}
                    </div>
                  )}
                  <button 
                    onClick={async () => {
                      const meetingTitle = meeting.title.replace(/\s+/g, '-').toLowerCase();
                      const dateStr = meeting.date ? meeting.date.split('-').reverse().join('-') : new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
                      const roomName = `${meetingTitle}-${dateStr}`;
                      
                      // Update meeting with roomName and mark host as joined
                      try {
                        await fetch('/api/meeting-status', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            roomName, 
                            meetingId: meeting._id,
                            action: 'hostJoin' 
                          })
                        });
                      } catch (error) {
                        console.error('Error updating meeting status:', error);
                      }
                      
                      window.open(`/meeting/${roomName}`, '_blank');
                    }}
                    style={{ marginTop: '8px', padding: '6px 12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    🚀 Join Jitsi Meeting
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