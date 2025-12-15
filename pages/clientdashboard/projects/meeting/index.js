import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function JitsiMeeting() {
  const [project, setProject] = useState(null);
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingDuration, setMeetingDuration] = useState('30');
  const [meetingPurpose, setMeetingPurpose] = useState('');
  const [meetingLocation, setMeetingLocation] = useState('online meet');
  const [participants, setParticipants] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
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

  useEffect(() => {
    const projectId = localStorage.getItem('selectedProjectId');
    
    // Project mapping based on ID
    const getProjectById = (id) => {
      const projectMap = {
        '1': { id: '1', name: 'E-commerce Website Development' },
        '2': { id: '2', name: 'Mobile App for Food Delivery' },
        '3': { id: '3', name: 'CRM System Integration' },
        '4': { id: '4', name: 'Mobile App for Food Delivery' },
        '5': { id: '5', name: 'CRM System Integration' }
      };
      
      console.log('Meeting page - Getting project for ID:', id);
      const project = projectMap[id] || { id: id, name: `Project ${id}` };
      console.log('Meeting page - Returning project:', project);
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
            generateMeetingLink(projectId);
          } else {
            // Use mapped project based on ID
            const mappedProject = getProjectById(projectId);
            setProject(mappedProject);
            generateMeetingLink(projectId);
          }
        })
        .catch(error => {
          console.error('Error fetching projects:', error);
          // Use mapped project based on ID
          const mappedProject = getProjectById(projectId);
          setProject(mappedProject);
          generateMeetingLink(projectId);
        });
    } else {
      // No project ID, set a default
      const defaultProject = getProjectById('1');
      setProject(defaultProject);
      generateMeetingLink(1);
    }

    fetch('/api/team')
      .then(res => res.json())
      .then(data => setParticipants(data))
      .catch(error => {
        console.error('Error fetching team:', error);
        setParticipants([]);
      });
  }, []);

  const generateMeetingLink = (projectId) => {
    // Generate a consistent meeting room name
    const meetingId = `priam-project-${projectId}`;
    setMeetingLink(`${process.env.NEXT_PUBLIC_JITSI_URL}/${meetingId}`);
  };

  // Update meeting link when date/time changes
  useEffect(() => {
    if (project && meetingDate && meetingTime) {
      const roomName = `priam-${project.name.replace(/\s+/g, '-').toLowerCase()}-${meetingDate}-${meetingTime.replace(':', '')}`;
      setMeetingLink(`${process.env.NEXT_PUBLIC_JITSI_URL}/${roomName}`);
    }
  }, [project, meetingDate, meetingTime]);

  const joinMeeting = () => {
    window.open(meetingLink, '_blank');
  };

  const copyMeetingLink = () => {
    navigator.clipboard.writeText(meetingLink);
    alert('Meeting link copied to clipboard!');
  };

  


  const scheduleMeeting = async () => {
    if (!meetingDate || !meetingTime || !meetingDuration || !meetingPurpose || selectedParticipants.length === 0) {
      alert('Please fill all required fields and select participants');
      return;
    }

    // Debug: Show selected participants
    const selectedPeople = participants.filter(p => selectedParticipants.includes(p.id));
    console.log('Selected participants:', selectedPeople);
    console.log('Selected emails:', selectedPeople.map(p => p.email));

    const meetingData = {
      projectId: project.id,
      title: project.name,
      date: meetingDate,
      time: meetingTime,
      duration: meetingDuration,
      purpose: meetingPurpose,
      location: meetingLocation,
      participants: selectedParticipants
    };

    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meetingData)
      });

      const result = await response.json();
      console.log('Meeting API response:', result);

      if (response.ok) {
        alert('Meeting scheduled successfully! Check console for email details.');
        router.push('/clientdashboard/projects/view');
      } else {
        alert('Error scheduling meeting: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error scheduling meeting: ' + error.message);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (!project) {
    return <div style={{ padding: '20px' }}>Loading...</div>;
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
          onClick={() => router.push('/clientdashboard/projects/view')}
          style={{ marginBottom: '20px', padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          ← Back to Project
        </button>

        <div style={{ background: 'white', padding: '20px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '20px' }}>
          <h2 style={{ margin: '0 0 20px 0' }}>Schedule Meeting for: {project.name}</h2>
          
          <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 15px 0' }}>Meeting Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Date *:</label>
                <input
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Time *:</label>
                <input
                  type="time"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  required
                />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Duration (minutes) *:</label>
                <select
                  value={meetingDuration}
                  onChange={(e) => setMeetingDuration(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  required
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                  <option value="180">3 hours</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Location:</label>
                <input
                  type="text"
                  value={meetingLocation}
                  onChange={(e) => setMeetingLocation(e.target.value)}
                  placeholder="e.g., Conference Room A, Online, Office Building"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Meeting Purpose/Description *:</label>
              <textarea
                value={meetingPurpose}
                onChange={(e) => setMeetingPurpose(e.target.value)}
                placeholder="Describe the purpose of this meeting, agenda items, or objectives..."
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '80px', resize: 'vertical' }}
                required
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Select Participants *:</label>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', padding: '8px', cursor: 'pointer', background: '#f8f9fa', borderRadius: '4px' }}>
                  <input
                    type="checkbox"
                    checked={participants.length > 0 && selectedParticipants.length === participants.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedParticipants(participants.map(p => p.id));
                      } else {
                        setSelectedParticipants([]);
                      }
                    }}
                    style={{ marginRight: '10px' }}
                  />
                  <div style={{ fontWeight: 'bold', color: '#007bff' }}>Select All</div>
                </label>
              </div>
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px', padding: '10px' }}>
                {participants && participants.map ? participants.map(person => (
                  <label key={person.id} style={{ display: 'flex', alignItems: 'center', padding: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedParticipants.includes(person.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedParticipants([...selectedParticipants, person.id]);
                        } else {
                          setSelectedParticipants(selectedParticipants.filter(id => id !== person.id));
                        }
                      }}
                      style={{ marginRight: '10px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{person.name}</div>
                      <div style={{ fontSize: '14px', color: '#666' }}>{person.role}</div>
                    </div>
                  </label>
                )) : <div style={{ color: '#666' }}>Loading participants...</div>}
              </div>
            </div>
            
            <button
              onClick={scheduleMeeting}
              style={{
                width: '100%',
                padding: '12px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                marginBottom: '20px'
              }}
            >
              📅 Schedule Meeting
            </button>
          </div>
          
          <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📹</div>
            <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>Ready to join the meeting?</h3>
            <p style={{ color: '#666', marginBottom: '20px' }}>Click the button below to join via Jitsi Meet</p>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
              <button 
                onClick={joinMeeting}
                style={{ 
                  padding: '12px 24px', 
                  background: '#1d76ba', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                🚀 Join Jitsi Meet
              </button>
              <button 
                onClick={copyMeetingLink}
                style={{ 
                  padding: '12px 24px', 
                  background: '#00acc1', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                📋 Copy Link
              </button>
            </div>
            
            <div style={{ background: 'white', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
              <small style={{ color: '#666' }}>Meeting Link:</small>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#333', wordBreak: 'break-all' }}>
                {meetingLink}
              </div>
            </div>
          </div>
          
          <div style={{ textAlign: 'center', color: '#666' }}>
            <p>Share this link with other participants to join the meeting</p>
          </div>
        </div>
      </div>
    </div>
  );
}