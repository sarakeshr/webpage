import { useState } from 'react';

export default function ModeratorControls({ jitsiApi, participants }) {
  const [lobbyEnabled, setLobbyEnabled] = useState(false);
  const [password, setPassword] = useState('');

  const handleMuteAll = () => {
    jitsiApi.executeCommand('muteEveryone');
    alert('All participants muted');
  };

  const handleKickParticipant = (participantId) => {
    if (confirm('Are you sure you want to remove this participant?')) {
      jitsiApi.executeCommand('kickParticipant', participantId);
    }
  };

  const handleToggleLobby = () => {
    const newState = !lobbyEnabled;
    jitsiApi.executeCommand('toggleLobby', newState);
    setLobbyEnabled(newState);
  };

  const handleLockMeeting = () => {
    if (password) {
      jitsiApi.executeCommand('password', password);
      alert('Meeting locked with password');
    }
  };

  const handleEndMeeting = () => {
    if (confirm('End meeting for everyone?')) {
      jitsiApi.executeCommand('hangup');
    }
  };

  const handleGrantModerator = (participantId) => {
    jitsiApi.executeCommand('grantModerator', participantId);
    alert('Moderator rights granted');
  };

  return (
    <div style={styles.container}>
      <h3>Moderator Controls</h3>
      
      <div style={styles.section}>
        <button onClick={handleMuteAll} style={styles.button}>
          🔇 Mute All Participants
        </button>
      </div>

      <div style={styles.section}>
        <button onClick={handleToggleLobby} style={styles.button}>
          {lobbyEnabled ? '🔓 Disable Lobby' : '🔒 Enable Lobby'}
        </button>
      </div>

      <div style={styles.section}>
        <input
          type="password"
          placeholder="Meeting password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />
        <button onClick={handleLockMeeting} style={styles.button}>
          🔐 Lock Meeting
        </button>
      </div>

      <div style={styles.section}>
        <button onClick={handleEndMeeting} style={{...styles.button, ...styles.dangerButton}}>
          ⛔ End Meeting for Everyone
        </button>
      </div>

      {participants && participants.length > 0 && (
        <div style={styles.section}>
          <h4>Participants</h4>
          {participants.map(p => (
            <div key={p.id} style={styles.participant}>
              <span>{p.name}</span>
              <div>
                <button onClick={() => handleGrantModerator(p.id)} style={styles.smallButton}>
                  👑 Make Moderator
                </button>
                <button onClick={() => handleKickParticipant(p.id)} style={styles.smallButton}>
                  ❌ Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    marginTop: '20px'
  },
  section: {
    marginBottom: '15px'
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginRight: '10px'
  },
  dangerButton: {
    backgroundColor: '#dc3545'
  },
  input: {
    padding: '10px',
    marginRight: '10px',
    borderRadius: '5px',
    border: '1px solid #ccc'
  },
  participant: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    backgroundColor: 'white',
    marginBottom: '5px',
    borderRadius: '5px'
  },
  smallButton: {
    padding: '5px 10px',
    fontSize: '12px',
    marginLeft: '5px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer'
  }
};
