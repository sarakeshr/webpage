import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function TaskLists() {
  const [tasks, setTasks] = useState([]);
  const [columns, setColumns] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [team, setTeam] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [sortBy, setSortBy] = useState('title');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterColumn, setFilterColumn] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    fetchTasks();
    fetchColumns();
    fetchTeam();
    fetchPriorities();
  }, []);

  const fetchTasks = async () => {
    try {
      const projectId = localStorage.getItem('selectedProjectId');
      if (!projectId) return;
      
      const response = await fetch(`/api/tasks?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchColumns = async () => {
    try {
      const projectId = localStorage.getItem('selectedProjectId');
      if (!projectId) return;
      
      const response = await fetch(`/api/board-columns?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setColumns(data);
      }
    } catch (error) {
      console.error('Error fetching columns:', error);
    }
  };

  const fetchTeam = async () => {
    try {
      const projectId = localStorage.getItem('selectedProjectId');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!projectId || !user._id) return;
      
      const projectResponse = await fetch(`/api/projects?userId=${user._id}&userRole=${user.role}`);
      const projects = await projectResponse.json();
      const selectedProject = projects.find(p => p._id === projectId);
      
      if (selectedProject && selectedProject.teamMembers) {
        const projectTeam = selectedProject.teamMembers.map(member => ({
          id: member._id,
          username: member.username,
          name: member.username,
          email: member.email
        }));
        
        if (selectedProject.projectManager && !projectTeam.find(tm => tm.id === selectedProject.projectManager._id)) {
          projectTeam.push({
            id: selectedProject.projectManager._id,
            username: selectedProject.projectManager.username,
            name: selectedProject.projectManager.username,
            email: selectedProject.projectManager.email
          });
        }
        
        setTeam(projectTeam);
      }
    } catch (error) {
      console.error('Error fetching team:', error);
    }
  };

  const fetchPriorities = async () => {
    try {
      const projectId = localStorage.getItem('selectedProjectId');
      if (!projectId) return;
      
      const response = await fetch(`/api/priorities?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setPriorities(data);
      }
    } catch (error) {
      console.error('Error fetching priorities:', error);
    }
  };

  const getColumnName = (columnId) => {
    const column = columns.find(col => col._id === columnId);
    return column ? column.name : 'Unknown';
  };

  const getColumnColor = (columnId) => {
    const column = columns.find(col => col._id === columnId);
    return column ? column.color : '#6c757d';
  };

  const getPriorityColor = (priority) => {
    const priorityObj = priorities.find(p => p.name === priority);
    return priorityObj ? priorityObj.color : '#48dbfb';
  };

  const sortTasks = (tasksToSort) => {
    return [...tasksToSort].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'assignee') {
        aValue = a.assignee?.username || '';
        bValue = b.assignee?.username || '';
      } else if (sortBy === 'column') {
        aValue = getColumnName(a.columnId);
        bValue = getColumnName(b.columnId);
      } else if (sortBy === 'dueDate') {
        aValue = a.dueDate ? new Date(a.dueDate) : new Date('9999-12-31');
        bValue = b.dueDate ? new Date(b.dueDate) : new Date('9999-12-31');
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const filterTasks = (tasksToFilter) => {
    let filtered = tasksToFilter;
    
    if (filterColumn !== 'all') {
      filtered = filtered.filter(task => task.columnId === filterColumn);
    }
    
    if (filterAssignee !== 'all') {
      filtered = filtered.filter(task => task.assignee?._id === filterAssignee);
    }
    
    return filtered;
  };

  const filteredAndSortedTasks = sortTasks(filterTasks(tasks));

  const logout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  return (
    <div>
      <nav style={{ background: '#343a40', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>{currentUser?.role ? `${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1).replace('_', ' ')} Dashboard` : 'Dashboard'}</h1>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link href="/projectmanagerdashboard/projects" style={{ color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '4px' }}>Projects</Link>
          <Link href="/projectmanagerdashboard/projects/calendar" style={{ color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '4px' }}>Calendar</Link>
          <Link href="/projectmanagerdashboard/messages" style={{ color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '4px' }}>Messages</Link>
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
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button 
            onClick={() => router.push('/projectmanagerdashboard/projects/view')}
            style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            ← Back to Project
          </button>
          <button 
            onClick={() => router.push('/projectmanagerdashboard/projects/board')}
            style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            📋 Board View
          </button>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0 }}>📝 Task Lists</h2>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <select
                value={filterColumn}
                onChange={(e) => setFilterColumn(e.target.value)}
                style={{ padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="all">All Columns</option>
                {columns.map(column => (
                  <option key={column._id} value={column._id}>{column.name}</option>
                ))}
              </select>
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                style={{ padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="all">All Assignees</option>
                <option value="">Unassigned</option>
                {team.map(member => (
                  <option key={member.id} value={member.id}>{member.username}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => {
                        if (sortBy === 'title') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('title');
                          setSortOrder('asc');
                        }
                      }}>
                    Task {sortBy === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => {
                        if (sortBy === 'column') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('column');
                          setSortOrder('asc');
                        }
                      }}>
                    Status {sortBy === 'column' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => {
                        if (sortBy === 'assignee') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('assignee');
                          setSortOrder('asc');
                        }
                      }}>
                    Assignee {sortBy === 'assignee' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => {
                        if (sortBy === 'priority') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('priority');
                          setSortOrder('asc');
                        }
                      }}>
                    Priority {sortBy === 'priority' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => {
                        if (sortBy === 'dueDate') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('dueDate');
                          setSortOrder('asc');
                        }
                      }}>
                    Due Date {sortBy === 'dueDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>Progress</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedTasks.map(task => (
                  <tr key={task._id} style={{ borderBottom: '1px solid #dee2e6', ':hover': { background: '#f8f9fa' } }}>
                    <td style={{ padding: '12px 8px' }}>
                      <div style={{ fontWeight: '500', marginBottom: '4px' }}>{task.title}</div>
                      {task.description && (
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>{task.description}</div>
                      )}
                      {task.tags && task.tags.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {task.tags.map((tag, index) => (
                            <span key={index} style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '10px',
                              background: '#e9ecef',
                              color: '#495057'
                            }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        background: getColumnColor(task.columnId),
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {getColumnName(task.columnId)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {task.assignee ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: '#007bff',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
                            {task.assignee.username.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontSize: '12px' }}>{task.assignee.username}</span>
                        </div>
                      ) : (
                        <span style={{ color: '#666', fontSize: '12px' }}>Unassigned</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {task.priority && (
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          background: getPriorityColor(task.priority),
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {task.priority}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {task.dueDate ? (
                        <span style={{
                          fontSize: '12px',
                          color: new Date(task.dueDate) < new Date() ? '#dc3545' : '#666',
                          fontWeight: new Date(task.dueDate) < new Date() ? 'bold' : 'normal'
                        }}>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span style={{ color: '#666', fontSize: '12px' }}>No due date</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {task.subtasks && task.subtasks.length > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ 
                            width: '60px', 
                            height: '8px', 
                            background: '#e9ecef', 
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${Math.round((task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100)}%`,
                              height: '100%',
                              background: task.subtasks.filter(st => st.completed).length === task.subtasks.length ? '#28a745' : '#007bff',
                              transition: 'width 0.3s ease'
                            }} />
                          </div>
                          <span style={{ fontSize: '12px', color: '#666' }}>
                            {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: '#666', fontSize: '12px' }}>No subtasks</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredAndSortedTasks.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                No tasks found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}