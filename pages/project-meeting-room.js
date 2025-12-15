import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ProjectMeetingRoom() {
  const router = useRouter();
  const { projectId, projectName, userId } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meetingData, setMeetingData] = useState(null);

  useEffect(() => {
    if (!projectId || !userId) return;

    const joinProjectMeeting = async () => {
      try {
        const response = await fetch('/api/join-project-meeting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            projectId: parseInt(projectId), 
            projectName: projectName || `Project ${projectId}`,
            userId 
          })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        setMeetingData(data);
        loadJitsi(data);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    joinProjectMeeting();
  }, [projectId, projectName, userId]);

  const loadJitsi = (data) => {
    setMeetingData(data);
    setLoading(false);
    
    setTimeout(() => {
      if (document.querySelector('script[src*="external_api.js"]')) {
        initJitsi(data);
        return;
      }

      const script = document.createElement('script');
      script.src = `${process.env.NEXT_PUBLIC_JITSI_URL}/external_api.js`;
      script.async = true;
      script.onload = () => {
        setTimeout(() => initJitsi(data), 200);
      };
      script.onerror = () => {
        setError('Failed to load Jitsi Meet');
      };
      document.body.appendChild(script);
    }, 100);
  };

  const initJitsi = (data) => {
    const container = document.getElementById('jitsi-container');
    if (!container) {
      console.error('Jitsi container not found');
      setError('Meeting container not found');
      setLoading(false);
      return;
    }

    const options = {
      roomName: data.roomName,
      width: '100%',
      height: 600,
      parentNode: container,
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        prejoinPageEnabled: false,
        disableChat: false // Allow moderator to control chat
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: data.isModerator ? [
          'microphone', 'camera', 'desktop', 'chat', 'raisehand',
          'participants-pane', 'tileview', 'videoquality', 'filmstrip',
          'settings', 'hangup', 'security'
        ] : [
          'microphone', 'camera', 'chat', 'raisehand',
          'participants-pane', 'tileview', 'settings', 'hangup'
        ]
      }
    };

    if (data.token) {
      options.jwt = data.token;
    }

    try {
      const jitsiApi = new window.JitsiMeetExternalAPI(process.env.NEXT_PUBLIC_JITSI_DOMAIN, options);

      // Add moderator-specific event listeners
      if (data.isModerator) {
        // Store API reference globally for moderator controls
        window.jitsiAPI = jitsiApi;
        
        // Add custom moderator commands
        jitsiApi.addListener('chatUpdated', (event) => {
          console.log('Chat event:', event);
        });
      }

      jitsiApi.addEventListener('readyToClose', () => {
        router.push('/clientdashboard/projects');
      });

      setLoading(false);
    } catch (error) {
      console.error('Jitsi initialization error:', error);
      setError('Failed to load meeting');
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Loading Project Meeting...</h2>
      <p>Project: {projectName || `Project ${projectId}`}</p>
    </div>
  );

  if (error) return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Error</h2>
      <p>{error}</p>
      <button onClick={() => router.back()}>Go Back</button>
    </div>
  );

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>🎥 {projectName || `Project ${projectId}`} Meeting</h1>
          <p>Room: {meetingData?.roomName}</p>
          {meetingData?.isModerator && (
            <span style={{ background: '#28a745', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
              👑 Moderator
            </span>
          )}
        </div>
        <button 
          onClick={() => router.push('/clientdashboard/projects')}
          style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          ← Back to Projects
        </button>
      </div>
      
      <div id="jitsi-container" style={{ height: '600px', width: '100%', border: '1px solid #ddd', borderRadius: '8px' }} />
      
      <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '5px' }}>
        <h4>📋 Meeting Info:</h4>
        <p><strong>Project ID:</strong> {projectId}</p>
        <p><strong>Room Name:</strong> {meetingData?.roomName}</p>
        <p><strong>Your Role:</strong> {meetingData?.isModerator ? 'Moderator' : 'Participant'}</p>
        <p><strong>Note:</strong> All meetings for this project use the same room. Anyone joining from calendar or meeting page will join the same session.</p>
      </div>
    </div>
  );
}