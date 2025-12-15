import { useEffect, useRef, useState } from 'react';

export default function JitsiMeeting({ meetingId, userId, onMeetingEnd }) {
  const jitsiContainer = useRef(null);
  const [api, setApi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadJitsi = async () => {
      try {
        // Get meeting token
        const response = await fetch('/api/join-meeting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meetingId, userId })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        // Load Jitsi script
        const script = document.createElement('script');
        script.src = `${process.env.NEXT_PUBLIC_JITSI_URL}/external_api.js`;
        script.async = true;
        script.onload = () => initJitsi(data);
        document.body.appendChild(script);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    const initJitsi = (data) => {
      const options = {
        roomName: data.roomName,
        width: '100%',
        height: 600,
        parentNode: jitsiContainer.current,
        jwt: data.token,
        configOverwrite: {
          startWithAudioMuted: !data.isModerator,
          startWithVideoMuted: !data.isModerator,
          disableModeratorIndicator: false,
          enableLobbyChat: true,
          prejoinPageEnabled: true
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: data.isModerator ? [
            'microphone', 'camera', 'desktop', 'chat', 'raisehand',
            'participants-pane', 'tileview', 'videoquality', 'filmstrip',
            'settings', 'hangup', 'mute-everyone', 'security'
          ] : [
            'microphone', 'camera', 'chat', 'raisehand',
            'participants-pane', 'tileview', 'settings', 'hangup'
          ]
        }
      };

      const jitsiApi = new window.JitsiMeetExternalAPI(process.env.NEXT_PUBLIC_JITSI_DOMAIN, options);

      // Moderator-only event listeners
      if (data.isModerator) {
        jitsiApi.addEventListener('participantJoined', (participant) => {
          console.log('Participant joined:', participant);
        });

        jitsiApi.addEventListener('participantKickedOut', (participant) => {
          console.log('Participant kicked:', participant);
        });
      }

      jitsiApi.addEventListener('readyToClose', () => {
        if (onMeetingEnd) onMeetingEnd();
      });

      setApi(jitsiApi);
      setLoading(false);
    };

    loadJitsi();

    return () => {
      if (api) api.dispose();
    };
  }, [meetingId, userId]);

  // Moderator control functions
  const muteParticipant = (participantId) => {
    if (api) api.executeCommand('muteEveryone');
  };

  const kickParticipant = (participantId) => {
    if (api) api.executeCommand('kickParticipant', participantId);
  };

  const endMeeting = () => {
    if (api) api.executeCommand('hangup');
  };

  const toggleLobby = (enable) => {
    if (api) api.executeCommand('toggleLobby', enable);
  };

  if (loading) return <div>Loading meeting...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <div ref={jitsiContainer} style={{ height: '600px', width: '100%' }} />
    </div>
  );
}
