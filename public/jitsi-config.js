// Jitsi Meet configuration for Project Manager moderator control
window.jitsiConfig = {
  disableModeratorIndicator: false,
  startWithAudioMuted: true,
  startWithVideoMuted: true,
  enableUserRolesBasedOnToken: true,
  toolbarButtons: ['microphone', 'camera', 'chat', 'participants-pane', 'raise-hand'],
  disableInviteFunctions: true,
  disableRemoteMute: false,
  enableLobby: true,
  defaultRemoteDisplayName: 'Participant',
  defaultLocalDisplayName: 'You',
  enableLobbyChat: true,
  prejoinPageEnabled: true,
  lobbyModeEnabled: true
};

// Function to mark host as joined
window.markHostJoined = function(roomName) {
  return fetch(`http://localhost:3000/api/meeting-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomName, action: 'hostJoin' })
  })
  .then(response => response.json())
  .then(data => {
    console.log('Host marked as joined:', data.success);
    return data.success;
  })
  .catch(() => false);
};

window.addEventListener('load', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const isModerator = urlParams.get('moderator') === 'true';
  const roomName = urlParams.get('roomName') || window.location.pathname.split('/').pop();
  
  if (!isModerator) {
    window.jitsiConfig.toolbarButtons = ['microphone', 'camera', 'chat', 'raise-hand'];
    window.jitsiConfig.disableInviteFunctions = true;
  }
});