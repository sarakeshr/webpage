import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';

export default function CRMCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [meetings, setMeetings] = useState([]);
  const [draggedMeeting, setDraggedMeeting] = useState(null);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchMeetings();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    
    const handleClickOutside = (event) => {
      if (showProfile && !event.target.closest('.profile-dropdown')) {
        setShowProfile(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfile]);

  const fetchMeetings = async () => {
    try {
      const response = await fetch('/api/meetings');
      if (response.ok) {
        const data = await response.json();
        setMeetings(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      setMeetings([]);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const getMeetingsForDate = (date) => {
    if (!date) return [];
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    return meetings.filter(meeting => meeting.date === dateStr)
                  .sort((a, b) => a.time.localeCompare(b.time));
  };

  const getMeetingColor = (meeting) => {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
    const hash = meeting.title.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div>
      <nav style={{ background: '#343a40', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>{currentUser?.role ? `${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1).replace('_', ' ')} Dashboard` : 'Dashboard'}</h1>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link href="/crmdashboard/projects" style={{ color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '4px' }}>Projects</Link>
          <Link href="/crmdashboard/messages" style={{ color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '4px' }}>Messages</Link>
          <div style={{ position: 'relative' }} className="profile-dropdown">
            <button
              onClick={() => setShowProfile(!showProfile)}
              style={{ 
                background: 'rgba(255,255,255,0.1)', 
                color: 'white', 
                border: '2px solid rgba(255,255,255,0.5)', 
                borderRadius: '50%', 
                width: '40px', 
                height: '40px', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                transition: 'all 0.3s ease'
              }}
            >
              👤
            </button>
            {showProfile && (
              <div style={{
                position: 'absolute',
                top: '50px',
                right: '0',
                background: 'white',
                color: 'black',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                padding: '15px',
                minWidth: '200px',
                zIndex: 1000
              }}>
                <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>👤 {currentUser?.username || currentUser?.name || 'User'}</div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>📧 {currentUser?.email || 'No email'}</div>
                  <div style={{ fontSize: '14px', color: '#666' }}>🏷️ {currentUser?.role || 'No role'}</div>
                </div>
                <button
                  onClick={() => {
                    setShowProfile(false);
                    logout();
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div style={{ padding: '20px' }}>
        <button 
          onClick={() => router.push('/crmdashboard/projects/view')}
          style={{ marginBottom: '20px', padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          ← Back to Project
        </button>

        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0 }}>📅 Calendar</h2>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                style={{ padding: '8px 12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                ← Prev
              </button>
              <h3 style={{ margin: '0 20px' }}>
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                style={{ padding: '8px 12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Next →
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: '#ddd', border: '1px solid #ddd' }}>
            {dayNames.map(day => (
              <div key={day} style={{ background: '#f8f9fa', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                {day}
              </div>
            ))}
            
            {getDaysInMonth(currentDate).map((date, index) => (
              <div
                key={index}
                style={{
                  background: date ? 'white' : '#f8f9fa',
                  minHeight: '120px',
                  padding: '5px',
                  border: '1px solid #eee',
                  position: 'relative'
                }}
              >
                {date && (
                  <>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                      {date.getDate()}
                    </div>
                    {getMeetingsForDate(date).map(meeting => (
                      <div
                        key={meeting._id}
                        onClick={() => setSelectedMeeting(meeting)}
                        style={{
                          background: getMeetingColor(meeting),
                          color: 'white',
                          padding: '2px 5px',
                          marginBottom: '2px',
                          borderRadius: '3px',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        {formatTime(meeting.time)} - {meeting.title}
                      </div>
                    ))}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedMeeting && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90vw'
          }}>
            <h3>📅 Meeting Details</h3>
            <div style={{ marginBottom: '15px' }}>
              <strong>Title:</strong> {selectedMeeting.title}
            </div>
            <div style={{ marginBottom: '15px' }}>
              <strong>Date:</strong> {selectedMeeting.date} | <strong>Time:</strong> {selectedMeeting.time} | <strong>Duration:</strong> {selectedMeeting.duration} min
            </div>
            <div style={{ marginBottom: '15px' }}>
              <strong>Location:</strong> {selectedMeeting.location || 'Online (Jitsi Meet)'}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedMeeting(null)}
                style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  const projectName = selectedMeeting.title.replace(/\s+/g, '-').toLowerCase();
                  const dateStr = selectedMeeting.date.split('-').reverse().join('-');
                  const roomName = `${projectName}-${dateStr}`;
                  window.open(`/meeting/${roomName}`, '_blank');
                }}
                style={{ padding: '8px 16px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                🚀 Join Meeting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}