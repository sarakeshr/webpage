import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function ProjectManagerView() {
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
        console.log('Fetched meetings:', allMeetings);
        setMeetings(allMeetings);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setCurrentUser(user);
        
        try {
          const teamRes = await fetch('/api/team');
          if (teamRes.ok) {
            const teamData = await teamRes.json();
            setTeam(teamData || []);
          }
        } catch (error) {
          console.error('Error fetching team:', error);
        }
        
        await fetchMeetings();
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
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

  return (
    <div>
      <nav style={{ background: '#343a40', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Project Manager Dashboard</h1>
        <div style={{ display: 'flex', gap: '20px' }}>
          <Link href="/projectmanagerdashboard/projects" style={{ color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '4px' }}>Projects</Link>
          <Link href="/project_manager/view" style={{ color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '4px', background: '#495057' }}>Meetings</Link>
          <a onClick={logout} style={{ color: 'white', cursor: 'pointer', padding: '8px 16px', borderRadius: '4px' }}>Logout</a>
        </div>
      </nav>

      <div style={{ padding: '20px' }}>
        <div style={{ background: 'white', padding: '20px', border: '1px solid #ddd', borderRadius: '4px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '20px' }}>📅 All Meetings</h3>
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
                    onClick={() => {
                      const roomName = meeting.roomName || `${meeting.title.replace(/\s+/g, '-').toLowerCase()}-${meeting.date ? meeting.date.split('-').reverse().join('-') : new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}`;
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
            <p style={{ color: '#666' }}>No meetings scheduled.</p>
          )}
        </div>
      </div>
    </div>
  );
}