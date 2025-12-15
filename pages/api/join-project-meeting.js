import { generateProjectRoomName } from '../../lib/jitsiAuth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { projectId, projectName, userId } = req.body;

    // Generate consistent room name for project
    const roomName = generateProjectRoomName(projectId, projectName);

    // For demo, make user moderator
    const isModerator = true;

    res.status(200).json({
      token: null,
      roomName,
      isModerator,
      jitsiDomain: process.env.JITSI_DOMAIN,
      jitsiUrl: process.env.JITSI_MEETING_URL,
      projectId,
      projectName
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}