import jwt from 'jsonwebtoken';

const JITSI_APP_ID = process.env.JITSI_APP_ID || 'your_app_id';
const JITSI_APP_SECRET = process.env.JITSI_APP_SECRET || 'your_app_secret';
const JITSI_DOMAIN = process.env.JITSI_DOMAIN || 'meet.yourdomain.com';

export function generateJitsiToken(user, roomName, isModerator = false) {
  const payload = {
    context: {
      user: {
        id: user._id || user.id,
        name: user.username,
        email: user.email,
        moderator: isModerator
      },
      features: {
        livestreaming: isModerator,
        recording: isModerator,
        transcription: isModerator
      }
    },
    aud: JITSI_APP_ID,
    iss: JITSI_APP_ID,
    sub: JITSI_DOMAIN,
    room: roomName,
    moderator: isModerator
  };

  return jwt.sign(payload, JITSI_APP_SECRET, {
    algorithm: 'HS256',
    expiresIn: '2h'
  });
}

export function generateRoomName(projectId) {
  return `project_${projectId}`;
}

export function generateProjectRoomName(projectId, projectName) {
  // Clean project name for URL safety
  const cleanName = projectName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `${cleanName}_project_${projectId}`;
}
