import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function DirectorViewProject() {
  const [project, setProject] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [team, setTeam] = useState([]);
  const router = useRouter();

  const fetchMeetings = async () => {
    const projectId = localStorage.getItem('selectedProjectId');
    const userEmail = localStorage.getItem('userEmail');
    
    if (projectId && userEmail) {
      try {
        // Get all meetings for the project
        const meetingsRes = await fetch(`/api/meetings?projectId=${projectId}`);
        const allMeetings = await meetingsRes.json();
        
        // Get current user info
        const teamRes = await fetch('/api/team');
        const teamData = await teamRes.json();
        const currentUser = teamData.find(user => user.email === userEmail);
        
        if (currentUser) {
          // Filter meetings where current user is a participant
          const userMeetings = allMeetings.filter(meeting => 
            meeting.participants && meeting.participants.includes(currentUser.id)
          );
          console.log('User meetings:', userMeetings);
          setMeetings(userMeetings);
        } else {
          setMeetings([]);
        }
      } catch (error) {
        console.error('Error fetching meetings:', error);
        setMeetings([]);
      }
    }
  };

  const getParticipantNames = (participantIds) => {
    if (!participantIds || participantIds.length === 0) return 'No participants';
    if (!team || team.length === 0) return 'Loading participants...';
    
    console.log('Getting participant names for IDs:', participantIds);
    console.log('Available team members:', team.map(t => ({ id: t.id, name: t.name })));
    return participantIds.map(id => {
      const member = team.find(t => t.id === String(id)); // Convert both to strings for exact match
      console.log(`Looking for ID ${id}, found:`, member);
      return member ? member.name : `User ${id}`;
    }).join(', ');
  };

  useEffect(() => {
    const projectId = localStorage.getItem('selectedProjectId');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (projectId && user._id) {
      fetch(`/api/projects?userId=${user._id}&userRole=${user.role}`)
        .then(res => res.json())
        .then(projects => {
          const selectedProject = projects.find(p => p._id === projectId);
          setProject(selectedProject);
        });

      fetch('/api/team')
        .then(res => res.json())
        .then(data => setTeam(data));

      fetchMeetings();
    }
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
        <h1 style={{ margin: 0, fontSize: '24px' }}>Director Dashboard</h1>
        <div style={{ display: 'flex', gap: '20px' }}>
          <Link href="/directordashboard/projects" style={{ color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '4px' }}>Projects</Link>
          <Link href="/directordashboard/messages" style={{ color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '4px' }}>Messages</Link>
          <a onClick={logout} style={{ color: 'white', cursor: 'pointer', padding: '8px 16px', borderRadius: '4px' }}>Logout</a>
        </div>
      </nav>

      <div style={{ padding: '20px' }}>
        <button 
          onClick={() => router.push('/directordashboard/projects')}
          style={{ marginBottom: '20px', padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          ← Back to Projects
        </button>

        <div style={{ background: 'white', padding: '20px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '20px' }}>
          <h2 style={{ margin: '0 0 15px 0', fontSize: '28px', color: '#333' }}>{project.title}</h2>
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
            <button 
              onClick={fetchMeetings}
              style={{ padding: '6px 12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
            >
              🔄 Refresh
            </button>
          </div>
          {meetings.length > 0 ? (
            <div>
              {meetings.map(meeting => (
                <div key={meeting._id || meeting.id} style={{ borderLeft: '4px solid #28a745', paddingLeft: '15px', paddingTop: '8px', paddingBottom: '8px', marginBottom: '10px', background: '#f8f9fa' }}>
                  <div style={{ fontWeight: 'bold', color: '#333' }}>{meeting.title}</div>
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                    <strong>Date:</strong> {meeting.date} | <strong>Time:</strong> {meeting.time}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                    <strong>Participants:</strong> {getParticipantNames(meeting.participants || [])}
                  </div>
                  <button 
                    onClick={() => {
                      // Generate consistent meeting link based on meeting details
                      const meetingId = meeting._id || meeting.id || 'default';
                      const meetingRoom = meeting.meetingLink || `https://meet.jit.si/priam-${project.name.replace(/\s+/g, '-').toLowerCase()}-${meetingId}`;
                      console.log('Opening meeting room:', meetingRoom);
                      window.open(meetingRoom, '_blank');
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