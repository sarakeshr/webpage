import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function MeetingRoom() {
  const [hostJoined, setHostJoined] = useState(false);
  const [meetingEnded, setMeetingEnded] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [hasActiveMeetingTab, setHasActiveMeetingTab] = useState(false);
  const router = useRouter();
  const { roomName } = router.query;

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    const userIsHost = user.role === 'project_manager';
    setIsHost(userIsHost);
    
    if (roomName) {
      checkMeetingStatus();
      checkActiveMeetingSession();
      if (!userIsHost) {
        const interval = setInterval(() => {
          checkMeetingStatus();
          checkActiveMeetingSession();
        }, 3000);
        return () => clearInterval(interval);
      }
    }
  }, [roomName]);

  const checkActiveMeetingSession = () => {
    const sessionKey = `meeting_session_${roomName}_${currentUser?.username || 'user'}`;
    const sessionData = localStorage.getItem(sessionKey);
    
    if (sessionData) {
      const { timestamp, windowId } = JSON.parse(sessionData);
      const now = Date.now();
      
      // Check if session is recent (within 5 minutes) and from different window
      if (now - timestamp < 300000 && windowId !== window.name) {
        setHasActiveMeetingTab(true);
      } else {
        // Clean up old session
        localStorage.removeItem(sessionKey);
        setHasActiveMeetingTab(false);
      }
    } else {
      setHasActiveMeetingTab(false);
    }
  };

  const checkMeetingStatus = async () => {
    try {
      const response = await fetch(`/api/meeting-status?roomName=${roomName}`);
      const data = await response.json();
      setHostJoined(data.hostJoined || false);
      setMeetingEnded(data.meetingEnded || false);
      
      if (data.meetingEnded) {
        const role = currentUser?.role || 'client';
        setTimeout(() => {
          window.location.href = `/${role}dashboard/projects`;
        }, 2000);
      }
      
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const joinMeeting = async () => {
    // Check if user already has an active meeting tab
    if (hasActiveMeetingTab) {
      alert('You have already joined this meeting! Please check your other browser tabs.');
      return;
    }
    
    // Check if meeting is still active before joining
    try {
      const statusResponse = await fetch(`/api/meeting-status?roomName=${roomName}`);
      const statusData = await statusResponse.json();
      
      if (statusData.meetingEnded) {
        alert('This meeting has ended and is no longer active.');
        return;
      }
      
      if (!isHost && !statusData.hostJoined) {
        alert('The host has not joined yet. Please wait for the meeting to start.');
        return;
      }
    } catch (error) {
      console.error('Error checking meeting status:', error);
    }
    
    const baseUrl = `${process.env.NEXT_PUBLIC_JITSI_URL || 'https://localhost:8080'}/${roomName}`;
    const userName = currentUser?.username || currentUser?.name || 'User';
    
    // Clear any existing Jitsi user data from localStorage
    try {
      localStorage.removeItem('jitsiLocalStorage');
      localStorage.removeItem('features/base/settings');
      localStorage.removeItem('userInfo');
    } catch (e) {}
    
    let jitsiUrl;
    
    if (isHost) {
      jitsiUrl = `${baseUrl}?moderator=true&userInfo.displayName=${encodeURIComponent(userName)}&config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&roomName=${roomName}`;
      // Automatically mark host as joined when they open Jitsi (go to lobby)
      setTimeout(() => {
        markHostJoined();
      }, 2000);
    } else {
      jitsiUrl = hostJoined 
        ? `${baseUrl}?moderator=false&userInfo.displayName=${encodeURIComponent(userName)}&config.prejoinPageEnabled=false&config.startWithAudioMuted=true&config.startWithVideoMuted=true`
        : `${baseUrl}?moderator=false&userInfo.displayName=${encodeURIComponent(userName)}&config.prejoinPageEnabled=false&config.startWithAudioMuted=true&config.startWithVideoMuted=true`;
    }
    
    // Set session tracking before opening meeting
    const sessionKey = `meeting_session_${roomName}_${currentUser?.username || 'user'}`;
    const windowId = 'meeting_' + Date.now();
    localStorage.setItem(sessionKey, JSON.stringify({
      timestamp: Date.now(),
      windowId: windowId
    }));
    
    const meetingWindow = window.open(jitsiUrl, '_blank');
    meetingWindow.name = windowId;
    
    // Clean up session when meeting window is closed
    const checkClosed = setInterval(() => {
      if (meetingWindow.closed) {
        localStorage.removeItem(sessionKey);
        setHasActiveMeetingTab(false);
        clearInterval(checkClosed);
      }
    }, 1000);
  };
  
  const markHostJoined = async () => {
    const response = await fetch('/api/meeting-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomName, action: 'hostJoin' })
    });
    const result = await response.json();
    if (result.success) {
      setHostJoined(true);
    }
  };
  
  const endMeeting = async () => {
    const response = await fetch('/api/meeting-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomName, action: 'endMeeting' })
    });
    const result = await response.json();
    if (result.success) {
      window.location.href = '/projectmanagerdashboard/projects';
    }
  };
  
  const resetMeetingStatus = async () => {
    const response = await fetch('/api/meeting-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomName, action: 'reset' })
    });
    const result = await response.json();
    if (result.success) {
      setHostJoined(false);
      setMeetingEnded(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading meeting...</div>
      </div>
    );
  }

  if (meetingEnded) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8f9fa' }}>
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: '500px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔚</div>
          <h2 style={{ color: '#dc3545', marginBottom: '15px' }}>Meeting Ended</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            The meeting has been ended by the host. You will be redirected to your dashboard shortly.
          </p>
          <div style={{ background: '#f8d7da', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #f5c6cb' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#721c24' }}>
              <strong>Meeting:</strong> {roomName?.replace(/-/g, ' ')}
            </p>
          </div>
          <button
            onClick={() => {
              const role = currentUser?.role || 'client';
              window.location.href = `/${role}dashboard/projects`;
            }}
            style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            → Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!isHost && !hostJoined) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8f9fa' }}>
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: '500px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <h2 style={{ color: '#333', marginBottom: '15px' }}>Host is yet to join</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Please wait for the Project Manager to start the meeting. You'll be able to join once they arrive.
          </p>
          <div style={{ background: '#e3f2fd', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#1976d2' }}>
              <strong>Meeting:</strong> {roomName?.replace(/-/g, ' ')}
            </p>
          </div>
          <button
            onClick={() => {
              const role = currentUser?.role || 'client';
              window.location.href = `/${role}dashboard/projects/view`;
            }}
            style={{ padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8f9fa' }}>
      <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: '500px' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎥</div>
        <h2 style={{ color: '#333', marginBottom: '15px' }}>
          {isHost ? 'Ready to start meeting?' : 'Ready to join meeting?'}
        </h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          {isHost ? 'As the Project Manager, you can start the meeting now.' : 'The host has joined. You can now enter the meeting.'}
        </p>
        <div style={{ background: '#e8f5e8', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#2e7d32' }}>
            <strong>Meeting:</strong> {roomName?.replace(/-/g, ' ')}
          </p>
        </div>
        
        {hasActiveMeetingTab && (
          <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ffeaa7' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#856404' }}>
              ⚠️ <strong>Active Session Detected:</strong> You already have this meeting open in another tab.
            </p>
          </div>
        )}
        
        {isHost ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
            <button
              onClick={resetMeetingStatus}
              style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
            >
              🔄 Reset Meeting Status
            </button>
            
            <button
              onClick={hasActiveMeetingTab ? null : joinMeeting}
              disabled={hasActiveMeetingTab}
              style={{ 
                padding: '12px 24px', 
                background: hasActiveMeetingTab ? '#6c757d' : '#007bff', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: hasActiveMeetingTab ? 'not-allowed' : 'pointer',
                fontSize: '16px', 
                fontWeight: 'bold',
                opacity: hasActiveMeetingTab ? 0.6 : 1
              }}
            >
              {hasActiveMeetingTab ? '🚫 Meeting Already Open' : '🚀 Open Jitsi Meeting'}
            </button>
            
            {hostJoined && (
              <>
                <div style={{ padding: '15px', background: '#d4edda', borderRadius: '8px', border: '1px solid #c3e6cb', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '14px', color: '#155724', fontWeight: 'bold' }}>
                    ✅ Conference Active! Other participants can now join.
                  </p>
                </div>
                <button
                  onClick={endMeeting}
                  style={{ padding: '10px 20px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
                >
                  🛑 End Meeting for Everyone
                </button>
              </>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
            <button
              onClick={hasActiveMeetingTab ? null : joinMeeting}
              disabled={hasActiveMeetingTab}
              style={{ 
                padding: '12px 24px', 
                background: hasActiveMeetingTab ? '#6c757d' : '#28a745', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: hasActiveMeetingTab ? 'not-allowed' : 'pointer',
                fontSize: '16px', 
                fontWeight: 'bold',
                opacity: hasActiveMeetingTab ? 0.6 : 1
              }}
            >
              {hasActiveMeetingTab ? '🚫 Already Joined' : '🚀 Join Meeting'}
            </button>
            <button
              onClick={() => {
                const role = currentUser?.role || 'client';
                window.location.href = `/${role}dashboard/projects/view`;
              }}
              style={{ padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              ← Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}