import { useEffect, useRef } from 'react';

export default function JitsiMeeting({ roomName, displayName, onClose }) {
  const jitsiContainerRef = useRef(null);
  const apiRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.JitsiMeetExternalAPI) {
      const domain = 'meet.jit.si';
      const options = {
        roomName: roomName || 'test-room',
        width: '100%',
        height: 600,
        parentNode: jitsiContainerRef.current,
        userInfo: {
          displayName: displayName || 'Anonymous'
        },
        configOverwrite: {
          startWithAudioMuted: true,
          startWithVideoMuted: true
        }
      };

      apiRef.current = new window.JitsiMeetExternalAPI(domain, options);

      apiRef.current.addEventListener('videoConferenceLeft', () => {
        if (onClose) onClose();
      });
    }

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
      }
    };
  }, [roomName, displayName, onClose]);

  return (
    <div>
      <div ref={jitsiContainerRef} style={{ width: '100%', height: '600px' }} />
    </div>
  );
}