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
      const meetingsRes = await fetch('/api/meetings');
      if (meetingsRes.ok) {
        const allMeetings = await meetingsRes.json();
        console.log('Fetching meetings in interval:', allMeetings);
        // Show all meetings since they all belong to the same project anyway
        setMeetings(allMeetings);
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
                  console.log('Selected project:', selectedProject);
                  
                  // Fetch meetings for this specific project only
                  fetch(`/api/meetings?projectId=${projectId}`)
                    .then(res => res.json())
                    .then(projectMeetings => {
                      console.log('Project meetings:', projectMeetings);
                      setMeetings(projectMeetings);
                    })
                    .catch(error => console.error('Error fetching meetings:', error));
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
              <span>{new Date(project.completedDate || project.deadline).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div style={{ background: 'white', padding: '20px', border: '1px solid #ddd', borderRadius: '4px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '20px' }}>📅 Upcoming Meetings</h3>
          <div style={{ marginBottom: '10px', fontSize: '12px', color: '#999' }}>
            Debug: Found {meetings.length} meetings for this project
          </div>
          {meetings.length > 0 ? (
            <div>
              {meetings.map((meeting, index) => {
                const meetingDateTime = meeting.timestamp ? new Date(meeting.timestamp) : new Date(meeting.date + 'T' + meeting.time);
                const dateStr = meetingDateTime.toLocaleDateString();
                const timeStr = meetingDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const isUpcoming = meetingDateTime >= new Date();
                
                return (
                  <div key={meeting._id || meeting.id || index} style={{ 
                    padding: '12px', 
                    marginBottom: '12px', 
                    background: isUpcoming ? '#f8f9fa' : '#fff3cd', 
                    border: '1px solid #e9ecef', 
                    borderRadius: '8px' 
                  }}>
                    <div style={{ fontWeight: 'bold', color: '#333', fontSize: '16px', marginBottom: '4px' }}>
                      {meeting.title} {!isUpcoming && '(Past)'}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                      📅 {dateStr} • 🕐 {timeStr} • ⏱️ {meeting.duration || 60}min
                    </div>
                    {meeting.purpose && (
                      <div style={{ fontSize: '14px', color: '#666', marginBottom: '6px' }}>
                        📝 {meeting.purpose}
                      </div>
                    )}
                    {meeting.participants && meeting.participants.length > 0 && (
                      <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                        👥 <strong>Participants:</strong> {Array.isArray(meeting.participants) 
                          ? meeting.participants.map(p => {
                              console.log('Looking for participant:', p, 'in team:', team);
                              if (typeof p === 'string' && p.length === 24) {
                                // Try multiple matching strategies
                                const user = team.find(u => u._id === p || u.id === p) || 
                                           project?.teamMembers?.find(tm => tm._id === p || tm.id === p) ||
                                           (project?.projectManager?._id === p ? project.projectManager : null);
                                console.log('Found user:', user);
                                return user ? (user.username || user.name || user.email) : `User-${p.slice(-4)}`;
                              }
                              return p;
                            }).join(', ')
                          : meeting.participants}
                      </div>
                    )}
                    <button 
                      onClick={async () => {
                        const userId = currentUser?._id;
                        const meetingId = meeting._id;
                        
                        // Check if user already joined this meeting
                        const joinKey = `joined_${meetingId}_${userId}`;
                        if (localStorage.getItem(joinKey)) {
                          alert('You have already joined this meeting!');
                          return;
                        }
                        
                        const meetingTitle = meeting.title.replace(/\s+/g, '-').toLowerCase();
                        const dateStr = meetingDateTime.toLocaleDateString('en-GB').replace(/\//g, '-');
                        const timeStr = meetingDateTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }).replace(':', '');
                        const roomName = `${meetingTitle}-${dateStr}-${timeStr}`;
                        
                        try {
                          await fetch('/api/meeting-status', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                              roomName, 
                              meetingId: meeting._id,
                              userId: userId,
                              action: 'userJoin' 
                            })
                          });
                          
                          // Mark user as joined for this meeting
                          localStorage.setItem(joinKey, 'true');
                          
                        } catch (error) {
                          console.error('Error updating meeting status:', error);
                        }
                        
                        window.open(`/meeting/${roomName}`, '_blank');
                      }}
                      style={{ padding: '6px 12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                    >
                      View Details
                    </button>
                  </div>
                );
              })
              }
            </div>
          ) : (
            <p style={{ color: '#666' }}>No meetings found for this project.</p>
          )}
        </div>
      </div>
    </div>
  );
}