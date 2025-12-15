import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import JitsiMeeting from '../components/JitsiMeeting';

export default function MeetingRoom() {
  const router = useRouter();
  const { meetingId, projectId, projectName } = router.query;
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Get user from session/localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserId(user._id || user.id);
  }, []);

  const handleMeetingEnd = () => {
    router.push('/dashboard');
  };

  // If projectId is provided, redirect to project meeting room
  if (projectId && projectName) {
    router.push(`/project-meeting-room?projectId=${projectId}&projectName=${projectName}&userId=${userId}`);
    return <div>Redirecting to project meeting...</div>;
  }

  if (!meetingId || !userId) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Meeting Room</h1>
      <JitsiMeeting 
        meetingId={meetingId} 
        userId={userId}
        onMeetingEnd={handleMeetingEnd}
      />
    </div>
  );
}
