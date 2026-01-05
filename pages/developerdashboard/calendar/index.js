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
        const taskResponse = await fetch(`/api/tasks?projectId=${project._id}`);
        if (taskResponse.ok) {
          const tasks = await taskResponse.json();
          allTasks.push(...tasks.map(task => ({ ...task, projectName: project.title })));
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
        type: 'task',
        priority: task.priority || 'Medium',
        projectName: task.projectName,
        assignee: task.assignee?.username
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
                      style={{
                        background: item.time ? getMeetingColor(item) : getPriorityColor(item.priority),
                        color: 'white',
                        padding: '2px 5px',
                        marginBottom: '2px',
                        borderRadius: '3px',
                        fontSize: '10px',
                        border: '1px solid rgba(255,255,255,0.3)',
                        cursor: 'default',
                        pointerEvents: 'none'
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
    </div>
  );
}