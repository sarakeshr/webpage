import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getApiEndpoint } from '../../../utils/apiEndpoints';

export default function DashboardCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [meetings, setMeetings] = useState([]);
  const [projectDeadlines, setProjectDeadlines] = useState([]);
  const [taskDeadlines, setTaskDeadlines] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user._id) return;

    // Fetch all user projects
    const projectResponse = await fetch(`/api/projects?userId=${user._id}&userRole=${user.role}`);
    const projects = await projectResponse.json();
    
    // Fetch project deadlines
    const pDeadlines = projects
      .filter(project => project.deadline)
      .map(project => ({
        id: `project-${project._id}`,
        title: `📋 ${project.title} (Deadline)`,
        date: project.deadline.split('T')[0],
        type: 'project',
        priority: 'High',
        projectName: project.title
      }));
    setProjectDeadlines(pDeadlines);

    // Fetch all tasks for user projects
    const allTasks = [];
    for (const project of projects) {
      try {
        const taskResponse = await fetch(`/api/tasks?projectId=${project._id}&userId=${user._id}&userRole=${user.role}`);
        if (taskResponse.ok) {
          const tasks = await taskResponse.json();
          // For non-project managers, only show tasks assigned to them
          let filteredTasks = tasks;
          if (user.role !== 'project_manager') {
            filteredTasks = tasks.filter(task => task.assignee?._id === user._id);
          }
          allTasks.push(...filteredTasks.map(task => ({ ...task, projectName: project.title })));
        }
      } catch (error) {
        console.error(`Error fetching tasks for project ${project._id}:`, error);
      }
    }

    const tDeadlines = allTasks
      .filter(task => task.dueDate)
      .map(task => ({
        id: `task-${task._id}`,
        title: `📝 ${task.title}`,
        date: task.dueDate.split('T')[0],
        dueDate: task.dueDate.split('T')[0],
        type: 'task',
        priority: task.priority || 'Medium',
        projectName: task.projectName,
        assignee: task.assignee?.username || task.assignee?.name || task.assignee,
        assignedTo: task.assignee,
        status: task.status,
        description: task.description,
        _id: task._id,
        projectId: task.projectId
      }));
    setTaskDeadlines(tDeadlines);

    // Fetch all meetings for user projects
    const allMeetings = [];
    for (const project of projects) {
      try {
        const meetingResponse = await fetch(`/api/meetings?projectId=${project._id}`);
        if (meetingResponse.ok) {
          const projectMeetings = await meetingResponse.json();
          allMeetings.push(...projectMeetings.map(meeting => ({ ...meeting, projectName: project.title })));
        }
      } catch (error) {
        console.error(`Error fetching meetings for project ${project._id}:`, error);
      }
    }
    setMeetings(allMeetings);
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

  const getItemsForDate = (date) => {
    if (!date) return [];
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const allDeadlines = [...projectDeadlines, ...taskDeadlines];
    const deadlines = allDeadlines.filter(deadline => deadline.date.split('T')[0] === dateStr);
    const dayMeetings = meetings.filter(meeting => meeting.date === dateStr);
    
    return [...deadlines, ...dayMeetings];
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': case 'Urgent': return '#dc3545';
      case 'Medium': return '#ffc107';
      case 'Low': return '#28a745';
      default: return '#6c757d';
    }
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

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>📅 My Calendar</h2>
        <button 
          onClick={() => router.back()}
          style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          ← Back
        </button>
      </div>

      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            style={{ padding: '8px 12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            ← Prev
          </button>
          <h3 style={{ margin: 0 }}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            style={{ padding: '8px 12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Next →
          </button>
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
                  {getItemsForDate(date).map(item => (
                    <div
                      key={item.id || item._id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItem(item);
                      }}
                      onMouseEnter={(e) => {
                        setHoveredItem(item);
                        setTooltipPosition({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseLeave={() => setHoveredItem(null)}
                      style={{
                        background: item.time ? getMeetingColor(item) : getPriorityColor(item.priority),
                        color: 'white',
                        padding: '2px 5px',
                        marginBottom: '2px',
                        borderRadius: '3px',
                        fontSize: '10px',
                        border: '1px solid rgba(255,255,255,0.3)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontSize: '8px', opacity: 0.8 }}>{item.projectName}</div>
                      <div>
                        {item.time ? `${formatTime(item.time)} - ${item.title}` : item.title.replace(/📋|📝/g, '').trim()}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedItem && (
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
            <h3>{selectedItem.time ? '📅 Meeting Details' : selectedItem.type === 'project' ? '📋 Project Deadline' : '📝 Task Deadline'}</h3>
            <div style={{ marginBottom: '15px' }}>
              <strong>Project:</strong> {selectedItem.projectName}
            </div>
            <div style={{ marginBottom: '15px' }}>
              <strong>Title:</strong> {selectedItem.time ? selectedItem.title : selectedItem.title.replace(/📋|📝/g, '').trim()}
            </div>
            {selectedItem.time ? (
              <>
                <div style={{ marginBottom: '15px' }}>
                  <strong>Date & Time:</strong> {selectedItem.date} at {formatTime(selectedItem.time)}
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <strong>Duration:</strong> {selectedItem.duration || 60} minutes
                </div>
                {selectedItem.purpose && (
                  <div style={{ marginBottom: '15px' }}>
                    <strong>Purpose:</strong> {selectedItem.purpose}
                  </div>
                )}
                {selectedItem.location && (
                  <div style={{ marginBottom: '15px' }}>
                    <strong>Location:</strong> {selectedItem.location}
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{ marginBottom: '15px' }}>
                  <strong>Due Date:</strong> {selectedItem.date}
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <strong>Priority:</strong> <span style={{ 
                    padding: '2px 8px', 
                    borderRadius: '12px', 
                    background: getPriorityColor(selectedItem.priority), 
                    color: 'white', 
                    fontSize: '12px' 
                  }}>{selectedItem.priority}</span>
                </div>
                {selectedItem.assignee && (
                  <div style={{ marginBottom: '15px' }}>
                    <strong>Assignee:</strong> {selectedItem.assignee}
                  </div>
                )}
              </>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedItem(null)}
                style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Close
              </button>
              {selectedItem.time && (
                <button
                  onClick={() => {
                    const projectName = selectedItem.projectName.replace(/\s+/g, '-').toLowerCase();
                    const dateStr = selectedItem.date.split('-').reverse().join('-');
                    const roomName = `${projectName}-${dateStr}`;
                    const meetingUrl = getApiEndpoint(`projects/meeting/${roomName}`, currentUser?.role);
                    window.open(meetingUrl, '_blank');
                  }}
                  style={{ padding: '8px 16px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  🚀 Join Meeting
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {hoveredItem && (
        <div
          style={{
            position: 'fixed',
            left: tooltipPosition.x + 15,
            top: tooltipPosition.y - 10,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '12px',
            zIndex: 1001,
            maxWidth: '300px',
            boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
            pointerEvents: 'none',
            border: '2px solid rgba(255,255,255,0.2)'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '13px', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '6px' }}>
            {hoveredItem.time ? '📅 ' + hoveredItem.title : (hoveredItem.type === 'project' ? '📅 Project Deadline' : '📝 Task Deadline')}
          </div>
          
          <div style={{ marginBottom: '4px' }}>🏢 <strong>Project:</strong> {hoveredItem.projectName}</div>
          
          {/* Role-specific information */}
          {currentUser?.role && (
            <div style={{ marginBottom: '4px', fontSize: '10px', opacity: 0.9 }}>
              👤 <strong>Your Role:</strong> {currentUser.role.replace('_', ' ').toUpperCase()}
            </div>
          )}
          
          {hoveredItem.time ? (
            <>
              <div style={{ marginBottom: '4px' }}>🕰️ <strong>Time:</strong> {formatTime(hoveredItem.time)} ({hoveredItem.duration || 60} min)</div>
              <div style={{ marginBottom: '4px' }}>📅 <strong>Date:</strong> {hoveredItem.date}</div>
              {hoveredItem.purpose && (
                <div style={{ marginBottom: '4px' }}>📝 <strong>Purpose:</strong> {hoveredItem.purpose}</div>
              )}
              {hoveredItem.location && (
                <div style={{ marginBottom: '4px' }}>📍 <strong>Location:</strong> {hoveredItem.location}</div>
              )}
              {hoveredItem.participants && hoveredItem.participants.length > 0 && (
                <div style={{ marginBottom: '4px' }}>👥 <strong>Participants:</strong> {hoveredItem.participants.length} member(s)</div>
              )}
            </>
          ) : (
            <>
              <div style={{ marginBottom: '4px' }}>📅 <strong>Due Date:</strong> {hoveredItem.date || hoveredItem.dueDate}</div>
              <div style={{ marginBottom: '4px' }}>
                ⚠️ <strong>Priority:</strong> 
                <span style={{ 
                  marginLeft: '4px',
                  padding: '1px 6px', 
                  borderRadius: '8px', 
                  background: getPriorityColor(hoveredItem.priority), 
                  fontSize: '10px' 
                }}>
                  {hoveredItem.priority || 'Medium'}
                </span>
              </div>
              {/* Handle different assignee formats */}
              {(hoveredItem.assignee || hoveredItem.assignedTo) && (
                <div style={{ marginBottom: '4px' }}>
                  👤 <strong>Assignee:</strong> 
                  {typeof (hoveredItem.assignee || hoveredItem.assignedTo) === 'object' 
                    ? (hoveredItem.assignee?.username || hoveredItem.assignee?.name || hoveredItem.assignedTo?.username || hoveredItem.assignedTo?.name)
                    : (hoveredItem.assignee || hoveredItem.assignedTo)
                  }
                  {((hoveredItem.assignee?.username || hoveredItem.assignee?.name || hoveredItem.assignee) === currentUser?.username || 
                    (hoveredItem.assignedTo?.username || hoveredItem.assignedTo?.name || hoveredItem.assignedTo) === currentUser?.username) && (
                    <span style={{ marginLeft: '4px', fontSize: '10px', opacity: 0.8 }}>(You)</span>
                  )}
                </div>
              )}
              {/* Show task status if available */}
              {hoveredItem.status && (
                <div style={{ marginBottom: '4px' }}>
                  📋 <strong>Status:</strong> {hoveredItem.status}
                </div>
              )}
              {/* Show task description if available */}
              {hoveredItem.description && (
                <div style={{ marginBottom: '4px', fontSize: '10px', opacity: 0.9 }}>
                  📝 {hoveredItem.description.substring(0, 50)}{hoveredItem.description.length > 50 ? '...' : ''}
                </div>
              )}
              {hoveredItem.type === 'task' && (
                <div style={{ marginBottom: '4px', fontSize: '10px', opacity: 0.8 }}>
                  📝 Task from {hoveredItem.projectName}
                </div>
              )}
            </>
          )}
          
          {/* Role-based action hints */}
          <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.3)', fontSize: '10px', opacity: 0.8 }}>
            💡 Click to view details
            {hoveredItem.time && ' or join meeting'}
            {currentUser?.role === 'project_manager' && !hoveredItem.time && ' or manage task'}
          </div>
          
          {/* Access level indicator for non-project managers */}
          {currentUser?.role !== 'project_manager' && (hoveredItem.assignee || hoveredItem.assignedTo) && 
           ((hoveredItem.assignee?.username || hoveredItem.assignee?.name || hoveredItem.assignee) !== currentUser?.username && 
            (hoveredItem.assignedTo?.username || hoveredItem.assignedTo?.name || hoveredItem.assignedTo) !== currentUser?.username) && (
            <div style={{ marginTop: '4px', fontSize: '9px', opacity: 0.7, fontStyle: 'italic' }}>
              🔒 Limited access - not assigned to you
            </div>
          )}
        </div>
      )}
    </div>
  );
}