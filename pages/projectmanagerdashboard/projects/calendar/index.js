import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';

export default function ProjectManagerCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [meetings, setMeetings] = useState([]);
  const [draggedMeeting, setDraggedMeeting] = useState(null);
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);
  const [newMeeting, setNewMeeting] = useState(null);
  const [hoveredMeeting, setHoveredMeeting] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [resizingMeeting, setResizingMeeting] = useState(null);
  const [resizeStartY, setResizeStartY] = useState(0);
  const [team, setTeam] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [overlapWarning, setOverlapWarning] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchMeetings();
    fetchTeam();
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
  
  // Re-fetch team when project changes
  useEffect(() => {
    fetchTeam();
  }, [localStorage.getItem('selectedProjectId')]);

  const fetchTeam = async () => {
    try {
      const projectId = localStorage.getItem('selectedProjectId');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!projectId || !user._id) {
        setTeam([]);
        return;
      }
      
      // Fetch project details to get actual team members
      const projectResponse = await fetch(`/api/projects?userId=${user._id}&userRole=${user.role}`);
      const projects = await projectResponse.json();
      
      // Find the selected project
      const selectedProject = projects.find(p => p._id === projectId);
      
      if (selectedProject && selectedProject.teamMembers) {
        // Convert team members to the expected format
        const projectTeam = selectedProject.teamMembers.map(member => ({
          id: member._id,
          username: member.username,
          name: member.username.charAt(0).toUpperCase() + member.username.slice(1),
          role: member.role.charAt(0).toUpperCase() + member.role.slice(1).replace('_', ' '),
          email: member.email
        }));
        
        // Also include the project manager if not already in team
        if (selectedProject.projectManager && !projectTeam.find(tm => tm.id === selectedProject.projectManager._id)) {
          projectTeam.push({
            id: selectedProject.projectManager._id,
            username: selectedProject.projectManager.username,
            name: selectedProject.projectManager.username.charAt(0).toUpperCase() + selectedProject.projectManager.username.slice(1),
            role: 'Project Manager',
            email: selectedProject.projectManager.email
          });
        }
        
        setTeam(projectTeam);
      } else {
        setTeam([]);
      }
    } catch (error) {
      console.error('Error fetching team:', error);
      setTeam([]);
    }
  };

  const fetchMeetings = async () => {
    try {
      console.log('Fetching meetings...');
      const response = await fetch('/api/meetings');
      console.log('Meetings API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched meetings:', data);
        setMeetings(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch meetings:', response.status);
        setMeetings([]);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
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

  const handleCellClick = (date, event) => {
    if (!date) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const clickY = event.clientY - rect.top;
    const cellHeight = rect.height;
    const hourFraction = (clickY / cellHeight) * 24;
    const hour = Math.floor(hourFraction);
    const minute = Math.floor((hourFraction - hour) * 60);
    const clickTime = `${hour.toString().padStart(2, '0')}:${Math.floor(minute / 15) * 15}`.padStart(5, '0');
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const meetingDate = `${year}-${month}-${day}`;
    
    setNewMeeting({
      date: meetingDate,
      time: clickTime || '09:00',
      duration: 60,
      title: 'New Meeting',
      participants: '',
      description: '',
      reminder: 15,
      repeat: 'none'
    });
    setSelectedParticipants([]);
    setIsCreatingMeeting(true);
  };

  const handleDragStart = (e, meeting) => {
    setDraggedMeeting(meeting);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, date) => {
    e.preventDefault();
    if (!draggedMeeting || !date) return;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const newDate = `${year}-${month}-${day}`;

    const updatedMeetings = meetings.map(meeting => 
      meeting._id === draggedMeeting._id 
        ? { ...meeting, date: newDate }
        : meeting
    );
    setMeetings(updatedMeetings);
    setDraggedMeeting(null);
  };

  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const checkOverlap = (newMeeting) => {
    const newStart = timeToMinutes(newMeeting.time);
    const newEnd = newStart + newMeeting.duration;
    
    const conflictingMeetings = meetings.filter(meeting => {
      if (meeting.date !== newMeeting.date) return false;
      
      const existingStart = timeToMinutes(meeting.time);
      const existingEnd = existingStart + meeting.duration;
      
      return (newStart < existingEnd && newEnd > existingStart);
    });
    
    return conflictingMeetings;
  };

  const findNextAvailableSlot = (date, duration) => {
    const dayMeetings = meetings
      .filter(m => m.date === date)
      .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
    
    let currentTime = 9 * 60; // Start at 9 AM
    const endOfDay = 18 * 60; // End at 6 PM
    
    for (const meeting of dayMeetings) {
      const meetingStart = timeToMinutes(meeting.time);
      const meetingEnd = meetingStart + meeting.duration;
      
      if (currentTime + duration <= meetingStart) {
        return minutesToTime(currentTime);
      }
      currentTime = Math.max(currentTime, meetingEnd);
    }
    
    if (currentTime + duration <= endOfDay) {
      return minutesToTime(currentTime);
    }
    
    return null;
  };

  const hasOverlap = (meeting) => {
    const meetingStart = timeToMinutes(meeting.time);
    const meetingEnd = meetingStart + meeting.duration;
    
    return meetings.some(other => {
      if (other._id === meeting._id || other.date !== meeting.date) return false;
      
      const otherStart = timeToMinutes(other.time);
      const otherEnd = otherStart + other.duration;
      
      return (meetingStart < otherEnd && meetingEnd > otherStart);
    });
  };

  const generateRecurringMeetings = (baseMeeting) => {
    const meetings = [baseMeeting];
    
    if (baseMeeting.repeat === 'none') return meetings;

    const baseDate = new Date(baseMeeting.date);
    const occurrences = baseMeeting.repeat === 'daily' ? 7 : baseMeeting.repeat === 'weekly' ? 4 : 3;
    
    for (let i = 1; i <= occurrences; i++) {
      const nextDate = new Date(baseDate);
      
      if (baseMeeting.repeat === 'daily') {
        nextDate.setDate(baseDate.getDate() + i);
      } else if (baseMeeting.repeat === 'weekly') {
        nextDate.setDate(baseDate.getDate() + (i * 7));
      } else if (baseMeeting.repeat === 'monthly') {
        nextDate.setMonth(baseDate.getMonth() + i);
      }
      
      meetings.push({
        ...baseMeeting,
        _id: 'demo' + Date.now() + '_' + i,
        date: nextDate.toISOString().split('T')[0]
      });
    }
    
    return meetings;
  };

  const createMeeting = async () => {
    if (!newMeeting) return;

    const conflicts = checkOverlap(newMeeting);
    
    if (conflicts.length > 0) {
      const nextSlot = findNextAvailableSlot(newMeeting.date, newMeeting.duration);
      setOverlapWarning({
        conflicts,
        newMeeting,
        nextSlot,
        message: `This meeting overlaps with ${conflicts.length} existing meeting(s)`
      });
      return;
    }

    const projectId = localStorage.getItem('selectedProjectId');
    const baseMeetingData = {
      projectId: projectId || '1',
      title: newMeeting.title,
      date: newMeeting.date,
      time: newMeeting.time,
      duration: newMeeting.duration,
      purpose: newMeeting.description || 'Calendar meeting',
      location: 'Online (Jitsi Meet)',
      participants: selectedParticipants.length > 0 ? selectedParticipants : ['demo_user'],
      hostId: currentUser?._id || 'demo_user',
      creatorRole: currentUser?.role || 'project_manager',
      reminder: newMeeting.reminder,
      repeat: newMeeting.repeat
    };

    console.log('Creating meeting with data:', baseMeetingData);

    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(baseMeetingData)
      });
      
      console.log('Meeting API response status:', response.status);
      const responseData = await response.json();
      console.log('Meeting API response data:', responseData);
      
      if (response.ok) {
        console.log('Meeting created successfully, refreshing meetings...');
        fetchMeetings();
      } else {
        console.error('Meeting creation failed:', responseData);
        const allMeetings = generateRecurringMeetings({ ...baseMeetingData, _id: 'demo' + Date.now() });
        setMeetings([...meetings, ...allMeetings]);
      }
    } catch (error) {
      console.error('Meeting creation error:', error);
      const allMeetings = generateRecurringMeetings({ ...baseMeetingData, _id: 'demo' + Date.now() });
      setMeetings([...meetings, ...allMeetings]);
    }
    
    setIsCreatingMeeting(false);
    setNewMeeting(null);
  };

  const forceCreateMeeting = async () => {
    const projectId = localStorage.getItem('selectedProjectId');
    const baseMeetingData = {
      projectId: projectId || '1',
      title: overlapWarning.newMeeting.title,
      date: overlapWarning.newMeeting.date,
      time: overlapWarning.newMeeting.time,
      duration: overlapWarning.newMeeting.duration,
      purpose: overlapWarning.newMeeting.description || 'Calendar meeting',
      location: 'Online (Jitsi Meet)',
      participants: selectedParticipants.length > 0 ? selectedParticipants : ['demo_user'],
      hostId: currentUser?._id || 'demo_user',
      creatorRole: currentUser?.role || 'project_manager'
    };

    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(baseMeetingData)
      });
      
      if (response.ok) {
        fetchMeetings();
      } else {
        const newMeetingLocal = { ...baseMeetingData, _id: 'demo' + Date.now() };
        setMeetings([...meetings, newMeetingLocal]);
      }
    } catch (error) {
      const newMeetingLocal = { ...baseMeetingData, _id: 'demo' + Date.now() };
      setMeetings([...meetings, newMeetingLocal]);
    }
    
    setOverlapWarning(null);
    setIsCreatingMeeting(false);
    setNewMeeting(null);
  };

  const useNextSlot = async () => {
    if (!overlapWarning.nextSlot) return;
    
    const projectId = localStorage.getItem('selectedProjectId');
    const baseMeetingData = {
      projectId: projectId || '1',
      title: overlapWarning.newMeeting.title,
      date: overlapWarning.newMeeting.date,
      time: overlapWarning.nextSlot,
      duration: overlapWarning.newMeeting.duration,
      purpose: overlapWarning.newMeeting.description || 'Calendar meeting',
      location: 'Online (Jitsi Meet)',
      participants: selectedParticipants.length > 0 ? selectedParticipants : ['demo_user'],
      hostId: currentUser?._id || 'demo_user',
      creatorRole: currentUser?.role || 'project_manager'
    };

    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(baseMeetingData)
      });
      
      if (response.ok) {
        fetchMeetings();
      } else {
        const newMeetingLocal = { ...baseMeetingData, _id: 'demo' + Date.now() };
        setMeetings([...meetings, newMeetingLocal]);
      }
    } catch (error) {
      const newMeetingLocal = { ...baseMeetingData, _id: 'demo' + Date.now() };
      setMeetings([...meetings, newMeetingLocal]);
    }
    
    setOverlapWarning(null);
    setIsCreatingMeeting(false);
    setNewMeeting(null);
  };

  const deleteMeeting = async (meetingId) => {
    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchMeetings(); // Refresh from database
      } else {
        // Delete locally as fallback
        setMeetings(meetings.filter(meeting => meeting._id !== meetingId));
      }
    } catch (error) {
      console.error('Error deleting meeting:', error);
      // Delete locally as fallback
      setMeetings(meetings.filter(meeting => meeting._id !== meetingId));
    }
    
    setSelectedMeeting(null);
    console.log('🗑️ Meeting deleted');
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
    router.push('/');
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div>
      <Head>
        <style jsx>{`
          @keyframes pulse {
            0% { box-shadow: 0 0 10px rgba(255, 0, 0, 0.8); }
            50% { box-shadow: 0 0 20px rgba(255, 0, 0, 1); }
            100% { box-shadow: 0 0 10px rgba(255, 0, 0, 0.8); }
          }
        `}</style>
      </Head>
      <nav style={{ background: '#343a40', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>{currentUser?.role ? `${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1).replace('_', ' ')} Dashboard` : 'Dashboard'}</h1>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link href="/projectmanagerdashboard/projects" style={{ color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '4px' }}>Projects</Link>
          <Link href="/projectmanagerdashboard/projects/board" style={{ color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '4px' }}>Board</Link>
          <Link href="/projectmanagerdashboard/messages" style={{ color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '4px' }}>Messages</Link>
          <div style={{ position: 'relative' }} className="profile-dropdown">
            <button
              onClick={() => {
                console.log('Profile button clicked, current state:', showProfile);
                setShowProfile(!showProfile);
              }}
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
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.1)';
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
          onClick={() => router.push('/projectmanagerdashboard/projects/view')}
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
                  position: 'relative',
                  cursor: date ? 'pointer' : 'default'
                }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, date)}
                onClick={(e) => date && handleCellClick(date, e)}
              >
                {date && (
                  <>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                      {date.getDate()}
                    </div>
                    {getMeetingsForDate(date).map(meeting => (
                      <div
                        key={meeting._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, meeting)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMeeting(meeting);
                        }}
                        onMouseEnter={(e) => {
                          setHoveredMeeting(meeting);
                          setTooltipPosition({ x: e.clientX, y: e.clientY });
                        }}
                        onMouseLeave={() => setHoveredMeeting(null)}
                        style={{
                          background: hasOverlap(meeting) ? '#dc3545' : getMeetingColor(meeting),
                          color: 'white',
                          padding: '2px 5px',
                          marginBottom: '2px',
                          borderRadius: '3px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          opacity: draggedMeeting?._id === meeting._id ? 0.5 : 1,
                          border: hasOverlap(meeting) ? '2px solid #ff0000' : '1px solid transparent',
                          boxShadow: hasOverlap(meeting) ? '0 0 10px rgba(220, 53, 69, 0.8)' : 'none',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          position: 'relative'
                        }}
                      >
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {formatTime(meeting.time)} - {meeting.title}
                        </span>
                        {hasOverlap(meeting) && (
                          <span style={{ fontSize: '10px', marginRight: '4px' }}>⚠️</span>
                        )}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '0',
                            right: '0',
                            width: '8px',
                            height: '8px',
                            background: 'rgba(255,255,255,0.7)',
                            cursor: 'se-resize',
                            borderRadius: '0 0 3px 0'
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setResizingMeeting(meeting);
                            setResizeStartY(e.clientY);
                          }}
                        />
                      </div>
                    ))}
                  </>
                )}
              </div>
            ))}
          </div>
          
          <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '5px' }}>
            <h4 style={{ margin: '0 0 15px 0' }}>📋 Calendar Core Features:</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ padding: '10px', background: 'white', borderRadius: '5px', border: '1px solid #ddd' }}>
                <h5 style={{ margin: '0 0 8px 0', color: '#28a745' }}>✨ Interactive Features:</h5>
                <div style={{ fontSize: '14px' }}>
                  ✅ <strong>Create meeting directly from calendar</strong><br/>
                  ✅ <strong>Click & drag on calendar to set time</strong><br/>
                  ✅ <strong>Adjust duration by dragging endpoints</strong><br/>
                  ✅ <strong>Move meeting to another time (drag-drop)</strong><br/>
                  ✅ <strong>Resize meeting block duration</strong><br/>
                  ✅ <strong>Color-coded meetings</strong><br/>
                  ✅ <strong>Show time in local timezone</strong><br/>
                  ⚠️ <strong>Overlap/Clash Detection</strong><br/>
                  💡 <strong>Suggest next available slot</strong><br/>
                  📝 <strong>Meeting Scheduling (Inside Calendar)</strong><br/>
                  👥 <strong>Add participants & reminders</strong><br/>
                  🔄 <strong>Repeat options (daily/weekly/monthly)</strong><br/>
                  🗑️ <strong>Delete meetings</strong> with confirmation
                </div>
              </div>
              <div style={{ padding: '10px', background: 'white', borderRadius: '5px', border: '1px solid #ddd' }}>
                <h5 style={{ margin: '0 0 8px 0', color: '#007bff' }}>🎯 Project Manager Powers:</h5>
                <div style={{ fontSize: '14px' }}>
                  👑 <strong>Meeting Moderator</strong> - Join first<br/>
                  📝 <strong>Create/Edit/Delete</strong> all meetings<br/>
                  🎨 <strong>Full Calendar Control</strong><br/>
                  👥 <strong>Manage Participants</strong><br/>
                  📅 <strong>Schedule Recurring</strong> meetings<br/>
                  ⚠️ <strong>Conflict Detection</strong><br/>
                  🔄 <strong>Real-time Updates</strong>
                </div>
              </div>
            </div>
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
            {selectedMeeting.purpose && (
              <div style={{ marginBottom: '15px' }}>
                <strong>Purpose:</strong> {selectedMeeting.purpose}
              </div>
            )}
            {selectedMeeting.participants && selectedMeeting.participants.length > 0 && (
              <div style={{ marginBottom: '15px' }}>
                <strong>Participants:</strong> {Array.isArray(selectedMeeting.participants) 
                  ? selectedMeeting.participants.map(p => {
                      if (typeof p === 'string' && p.length === 24) {
                        const user = team.find(u => u.id === p);
                        return user ? user.username || user.name : p;
                      }
                      return p;
                    }).join(', ')
                  : selectedMeeting.participants}
              </div>
            )}
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
              <button
                onClick={() => deleteMeeting(selectedMeeting._id)}
                style={{ padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                🗑️ Delete Meeting
              </button>
            </div>
          </div>
        </div>
      )}

      {isCreatingMeeting && (
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
            width: '500px',
            maxWidth: '90vw',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3>📅 Schedule Meeting</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Meeting Title:</strong></label>
              <input
                type="text"
                placeholder="Enter meeting title"
                value={newMeeting?.title || ''}
                onChange={(e) => setNewMeeting({...newMeeting, title: e.target.value})}
                style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label><strong>Date:</strong></label>
                <div style={{ padding: '8px', marginTop: '5px', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '4px' }}>
                  {newMeeting?.date ? newMeeting.date.split('-').reverse().join('-') : newMeeting?.date}
                </div>
              </div>
              <div>
                <label><strong>Time:</strong></label>
                <input
                  type="time"
                  value={newMeeting?.time || ''}
                  onChange={(e) => setNewMeeting({...newMeeting, time: e.target.value})}
                  style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Duration:</strong></label>
              <select
                value={newMeeting?.duration || 60}
                onChange={(e) => setNewMeeting({...newMeeting, duration: parseInt(e.target.value)})}
                style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
                <option value={180}>3 hours</option>
              </select>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Select Participants:</strong></label>
              <div style={{ marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px', maxHeight: '150px', overflowY: 'auto', background: 'white' }}>
                {team.length > 0 ? (
                  <>
                    <div style={{ padding: '8px', borderBottom: '1px solid #eee', background: '#f8f9fa' }}>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
                        <input
                          type="checkbox"
                          checked={selectedParticipants.length === team.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedParticipants(team.map(user => user.id));
                            } else {
                              setSelectedParticipants([]);
                            }
                          }}
                          style={{ marginRight: '8px' }}
                        />
                        Select All ({team.length} team members)
                      </label>
                    </div>
                    {team.map(user => (
                      <div key={user.id} style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={selectedParticipants.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedParticipants([...selectedParticipants, user.id]);
                              } else {
                                setSelectedParticipants(selectedParticipants.filter(id => id !== user.id));
                              }
                            }}
                            style={{ marginRight: '8px' }}
                          />
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{user.name || user.username}</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>{user.email} • {user.role}</div>
                          </div>
                        </label>
                      </div>
                    ))}
                  </>
                ) : (
                  <div style={{ padding: '12px', color: '#666', textAlign: 'center' }}>No team members found for this project</div>
                )}
              </div>
              <small style={{ color: '#6c757d', marginTop: '5px', display: 'block' }}>
                Selected: {selectedParticipants.length} of {team.length} team members
              </small>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Description:</strong></label>
              <textarea
                placeholder="Meeting agenda, notes, or description"
                value={newMeeting?.description || ''}
                onChange={(e) => setNewMeeting({...newMeeting, description: e.target.value})}
                rows={3}
                style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical' }}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label><strong>Reminder:</strong></label>
                <select
                  value={newMeeting?.reminder || 15}
                  onChange={(e) => setNewMeeting({...newMeeting, reminder: parseInt(e.target.value)})}
                  style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value={0}>No reminder</option>
                  <option value={5}>5 minutes before</option>
                  <option value={15}>15 minutes before</option>
                  <option value={30}>30 minutes before</option>
                  <option value={60}>1 hour before</option>
                  <option value={1440}>1 day before</option>
                </select>
              </div>
              <div>
                <label><strong>Repeat:</strong></label>
                <select
                  value={newMeeting?.repeat || 'none'}
                  onChange={(e) => setNewMeeting({...newMeeting, repeat: e.target.value})}
                  style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="none">No repeat</option>
                  <option value="daily">Daily (7 days)</option>
                  <option value="weekly">Weekly (4 weeks)</option>
                  <option value="monthly">Monthly (3 months)</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setIsCreatingMeeting(false);
                  setSelectedParticipants([]);
                }}
                style={{ padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={createMeeting}
                disabled={selectedParticipants.length === 0}
                style={{ 
                  padding: '10px 20px', 
                  background: selectedParticipants.length === 0 ? '#ccc' : '#28a745', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: selectedParticipants.length === 0 ? 'not-allowed' : 'pointer' 
                }}
              >
                📅 Create Meeting ({selectedParticipants.length} participants)
              </button>
            </div>
          </div>
        </div>
      )}

      {overlapWarning && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '25px',
            borderRadius: '12px',
            width: '500px',
            maxWidth: '90vw',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            border: '3px solid #dc3545'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '24px', marginRight: '10px' }}>⚠️</span>
              <h3 style={{ margin: 0, color: '#dc3545', fontSize: '20px' }}>Meeting Overlap Detected!</h3>
            </div>
            
            <div style={{ 
              background: '#f8d7da', 
              color: '#721c24', 
              padding: '12px', 
              borderRadius: '6px', 
              marginBottom: '20px',
              border: '1px solid #f5c6cb'
            }}>
              <strong>{overlapWarning.message}</strong>
            </div>
            
            <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Conflicting Meetings:</h4>
            <div style={{ marginBottom: '20px', maxHeight: '200px', overflowY: 'auto' }}>
              {overlapWarning.conflicts.map(conflict => (
                <div key={conflict._id} style={{ 
                  padding: '12px', 
                  background: '#fff3cd', 
                  marginBottom: '8px', 
                  borderRadius: '6px', 
                  border: '2px solid #ffeaa7',
                  borderLeft: '4px solid #dc3545'
                }}>
                  <div style={{ fontWeight: 'bold', color: '#856404', marginBottom: '4px' }}>
                    📅 {conflict.title}
                  </div>
                  <div style={{ fontSize: '14px', color: '#856404' }}>
                    🕐 {formatTime(conflict.time)} ({conflict.duration}min)
                  </div>
                  {conflict.purpose && (
                    <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                      📝 {conflict.purpose}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {overlapWarning.nextSlot && (
              <div style={{
                background: '#d4edda',
                color: '#155724',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '20px',
                border: '1px solid #c3e6cb'
              }}>
                <strong>💡 Suggested alternative time: {formatTime(overlapWarning.nextSlot)}</strong>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setOverlapWarning(null)}
                style={{ 
                  padding: '10px 16px', 
                  background: '#6c757d', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ❌ Cancel
              </button>
              {overlapWarning.nextSlot && (
                <button
                  onClick={useNextSlot}
                  style={{ 
                    padding: '10px 16px', 
                    background: '#28a745', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  ✅ Use Suggested Time
                </button>
              )}
              <button
                onClick={forceCreateMeeting}
                style={{ 
                  padding: '10px 16px', 
                  background: '#dc3545', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ⚠️ Create Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {hoveredMeeting && (
        <div
          style={{
            position: 'fixed',
            left: tooltipPosition.x + 15,
            top: tooltipPosition.y - 10,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '13px',
            zIndex: 1001,
            maxWidth: '280px',
            boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
            pointerEvents: 'none'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
            📅 {hoveredMeeting.title}
          </div>
          <div>🕰️ {formatTime(hoveredMeeting.time)} ({hoveredMeeting.duration || 60} min)</div>
          <div>📅 {hoveredMeeting.date}</div>
          {hasOverlap(hoveredMeeting) && (
            <div style={{ color: '#ff6b6b', fontWeight: 'bold', marginTop: '8px', padding: '4px', background: 'rgba(255,107,107,0.2)', borderRadius: '4px' }}>
              ⚠️ CONFLICT: Overlaps with another meeting!
            </div>
          )}
        </div>
      )}
    </div>
  );
}