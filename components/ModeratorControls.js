import { useState } from 'react';

export default function ModeratorControls({ jitsiApi, participants }) {
  const [isMuted, setIsMuted] = useState(false);

  const muteAll = () => {
    if (jitsiApi) {
      participants.forEach(participant => {
        jitsiApi.executeCommand('muteEveryone');
      });
      setIsMuted(true);
    }
  };

  const unmuteAll = () => {
    if (jitsiApi) {
      jitsiApi.executeCommand('unmuteEveryone');
      setIsMuted(false);
    }
  };

  const endMeeting = () => {
    if (jitsiApi && confirm('Are you sure you want to end the meeting for everyone?')) {
      jitsiApi.executeCommand('hangup');
    }
  };

  return (
    <div style={{ padding: '10px', background: '#f5f5f5', borderRadius: '4px', margin: '10px 0' }}>
      <h3>Moderator Controls</h3>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          onClick={isMuted ? unmuteAll : muteAll}
          style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          {isMuted ? 'Unmute All' : 'Mute All'}
        </button>
        <button 
          onClick={endMeeting}
          style={{ padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          End Meeting
        </button>
      </div>
    </div>
  );
}