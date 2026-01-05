import jwt from 'jsonwebtoken';

export function generateJitsiToken(user, roomName, isModerator = false) {
  const payload = {
    iss: process.env.JITSI_APP_ID || 'your_app_id',
    sub: process.env.JITSI_DOMAIN || 'localhost:8080',
    aud: 'jitsi',
    room: roomName,
    context: {
      user: {
        id: user._id || user.id,
        name: user.username || user.name,
        email: user.email,
        moderator: isModerator
      }
    }
  };

  return jwt.sign(payload, process.env.JITSI_APP_SECRET || 'your_app_secret', {
    algorithm: 'HS256',
    expiresIn: '2h'
  });
}

export function generateProjectRoomName(projectId, projectName) {
  const cleanName = projectName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return `project-${projectId}-${cleanName}`;
}