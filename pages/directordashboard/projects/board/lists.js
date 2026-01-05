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
  const [viewingTask, setViewingTask] = useState(null);
  const [editTask, setEditTask] = useState({ title: '', description: '', priority: '', assignee: '', dueDate: '', tags: '', status: '', subtasks: [], attachments: [] });
  const [editSelectedTags, setEditSelectedTags] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [newChecklistHeading, setNewChecklistHeading] = useState('');
  const [editingSubtask, setEditingSubtask] = useState(null);
  const [editingSubtaskData, setEditingSubtaskData] = useState({ title: '', description: '', priority: '', assignee: '', dueDate: '', tags: '', status: '', subtasks: [], attachments: [] });
  const [editSubtaskSelectedTags, setEditSubtaskSelectedTags] = useState([]);
  const [newItemForHeading, setNewItemForHeading] = useState({});
  const [tags, setTags] = useState([]);
  const [taskComments, setTaskComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [subtasks, setSubtasks] = useState({});
  const [newSubtaskInput, setNewSubtaskInput] = useState('');
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    fetchTasks();
    fetchColumns();
    fetchTeam();
    fetchPriorities();
    fetchTags();
  }, []);

  const fetchTasks = async () => {
    try {
      const projectId = localStorage.getItem('selectedProjectId');
      if (!projectId) return;
      
      const response = await fetch(`/api/tasks?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        
        // Separate parent tasks and subtasks
        const parentTasks = data.filter(task => !task.parentTaskId);
        const taskSubtasks = data.filter(task => task.parentTaskId);
        
        setTasks(parentTasks);
        
        // Group subtasks by parent task ID
        const subtasksByParent = {};
        taskSubtasks.forEach(subtask => {
          const parentId = subtask.parentTaskId._id || subtask.parentTaskId;
          if (!subtasksByParent[parentId]) {
            subtasksByParent[parentId] = [];
          }
          subtasksByParent[parentId].push(subtask);
        });
        
        setSubtasks(subtasksByParent);
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

  const fetchTags = async () => {
    try {
      const projectId = localStorage.getItem('selectedProjectId');
      if (!projectId) return;
      
      const response = await fetch(`/api/tags?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setTags(data);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const createTag = async (name, color) => {
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: localStorage.getItem('selectedProjectId'),
          name,
          color: color || '#6c757d'
        })
      });
      
      if (response.ok) {
        fetchTags();
      }
    } catch (error) {
      console.error('Error creating tag:', error);
    }
  };

  const createSubtask = async (parentTaskId, subtaskData) => {
    try {
      const response = await fetch('/api/subtasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentTaskId,
          title: subtaskData.title,
          description: subtaskData.description || '',
          assignee: subtaskData.assignee || null,
          priority: subtaskData.priority || 'Medium',
          dueDate: subtaskData.dueDate || null,
          tags: subtaskData.tags || [],
          createdBy: currentUser?._id
        })
      });
      
      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error('Error creating subtask:', error);
    }
  };

  const updateSubtask = async (subtaskId, updateData) => {
    try {
      const response = await fetch('/api/subtasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: subtaskId,
          ...updateData
        })
      });
      
      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error('Error updating subtask:', error);
    }
  };

  const deleteSubtask = async (subtaskId) => {
    try {
      const response = await fetch('/api/subtasks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: subtaskId, soft: true })
      });
      
      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error('Error deleting subtask:', error);
    }
  };

  const toggleSubtaskComplete = async (subtaskId, completed) => {
    await updateSubtask(subtaskId, { completed });
  };

  const openSubtaskEdit = (subtask) => {
    setEditingSubtask(subtask);
    setEditingSubtaskData({
      title: subtask.title,
      description: subtask.description || '',
      priority: subtask.priority || '',
      assignee: subtask.assignee?._id || '',
      dueDate: subtask.dueDate ? subtask.dueDate.split('T')[0] : '',
      status: subtask.columnId,
      subtasks: subtask.subtasks || [],
      attachments: Array.isArray(subtask.attachments) ? subtask.attachments : [],
      checklist: subtask.checklist || []
    });
    setEditSubtaskSelectedTags(subtask.tags?.filter(tag => tag && tag._id).map(tag => tag._id) || []);
    fetchTaskComments(subtask._id);
  };

  const updateSubtaskData = async () => {
    try {
      const response = await fetch('/api/subtasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingSubtask._id,
          title: editingSubtaskData.title,
          description: editingSubtaskData.description,
          priority: editingSubtaskData.priority,
          assignee: editingSubtaskData.assignee || null,
          dueDate: editingSubtaskData.dueDate || null,
          tags: editSubtaskSelectedTags
        })
      });
      
      if (response.ok) {
        fetchTasks();
        setEditingSubtask(null);
        setEditingSubtaskData({ title: '', description: '', priority: '', assignee: '', dueDate: '', tags: '', status: '', subtasks: [], attachments: [] });
        setEditSubtaskSelectedTags([]);
      }
    } catch (error) {
      console.error('Error updating subtask:', error);
    }
  };

  const getTaskProgress = (task) => {
    const visibleSubtasks = getVisibleSubtasks(task._id);
    if (visibleSubtasks.length === 0) return task.progress || 0;
    
    const completedCount = visibleSubtasks.filter(st => st.completed).length;
    return Math.round((completedCount / visibleSubtasks.length) * 100);
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

  const openTaskDetails = (task) => {
    setViewingTask(task);
    setEditTask({
      title: task.title,
      description: task.description || '',
      priority: task.priority || '',
      assignee: task.assignee?._id || '',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      status: task.columnId,
      subtasks: Array.isArray(task.subtasks) ? task.subtasks : [],
      attachments: Array.isArray(task.attachments) ? task.attachments : []
    });
    setEditSelectedTags(task.tags?.filter(tag => tag && tag._id).map(tag => tag._id) || []);
    fetchTaskComments(task._id);
  };

  const updateTask = async () => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: viewingTask._id,
          title: editTask.title,
          description: editTask.description,
          priority: editTask.priority,
          assignee: editTask.assignee || null,
          dueDate: editTask.dueDate || null,
          tags: editSelectedTags,
          subtasks: editTask.subtasks,
          attachments: editTask.attachments,
          columnId: editTask.status
        })
      });
      
      if (response.ok) {
        fetchTasks();
        setViewingTask(null);
        setEditTask({ title: '', description: '', priority: '', assignee: '', dueDate: '', tags: '', status: '', subtasks: [], attachments: [] });
        setEditSelectedTags([]);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    const subtask = {
      id: Date.now().toString(),
      text: newSubtask,
      completed: false,
      isHeading: false
    };
    setEditTask({...editTask, subtasks: [...editTask.subtasks, subtask]});
    setNewSubtask('');
  };

  const addItemToHeading = (headingId) => {
    const itemText = newItemForHeading[headingId];
    if (!itemText?.trim()) return;
    
    const headingIndex = editTask.subtasks.findIndex(st => st.id === headingId);
    if (headingIndex === -1) return;
    
    const newItem = {
      id: Date.now().toString(),
      text: itemText,
      completed: false,
      isHeading: false,
      parentHeading: headingId
    };
    
    const updatedSubtasks = [...editTask.subtasks];
    updatedSubtasks.splice(headingIndex + 1, 0, newItem);
    
    setEditTask({...editTask, subtasks: updatedSubtasks});
    setNewItemForHeading({...newItemForHeading, [headingId]: ''});
  };

  const addChecklistHeading = () => {
    if (!newChecklistHeading.trim()) return;
    const heading = {
      id: Date.now().toString(),
      text: newChecklistHeading,
      completed: false,
      isHeading: true
    };
    setEditTask({...editTask, subtasks: [...editTask.subtasks, heading]});
    setNewChecklistHeading('');
  };

  const toggleSubtask = (subtaskId) => {
    setEditTask({
      ...editTask,
      subtasks: editTask.subtasks.map(st => 
        st.id === subtaskId ? {...st, completed: !st.completed} : st
      )
    });
  };

  const deleteChecklistItem = (subtaskId) => {
    setEditTask({
      ...editTask,
      subtasks: editTask.subtasks.filter(st => st.id !== subtaskId)
    });
  };

  const fetchTaskComments = async (taskId) => {
    try {
      const response = await fetch(`/api/comments?taskId=${taskId}`);
      if (response.ok) {
        const comments = await response.json();
        setTaskComments(prev => ({
          ...prev,
          [taskId]: comments
        }));
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const addComment = async (taskId) => {
    if (!newComment.trim()) return;
    
    try {
      const mentions = extractMentions(newComment);
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          text: newComment,
          authorId: currentUser?._id,
          mentions: mentions
        })
      });
      
      if (response.ok) {
        const comment = await response.json();
        setTaskComments(prev => ({
          ...prev,
          [taskId]: [...(prev[taskId] || []), comment]
        }));
        setNewComment('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const updateComment = async (taskId, commentId) => {
    if (!editCommentText.trim()) return;
    
    try {
      const mentions = extractMentions(editCommentText);
      const response = await fetch('/api/comments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: commentId,
          text: editCommentText,
          mentions: mentions
        })
      });
      
      if (response.ok) {
        const updatedComment = await response.json();
        setTaskComments(prev => ({
          ...prev,
          [taskId]: (prev[taskId] || []).map(comment => 
            comment.id === commentId ? updatedComment : comment
          )
        }));
        setEditingComment(null);
        setEditCommentText('');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const deleteComment = async (taskId, commentId) => {
    if (!confirm('Delete this comment?')) return;
    
    try {
      const response = await fetch('/api/comments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: commentId })
      });
      
      if (response.ok) {
        setTaskComments(prev => ({
          ...prev,
          [taskId]: (prev[taskId] || []).filter(comment => comment.id !== commentId)
        }));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const extractMentions = (text) => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      const username = match[1];
      const user = team.find(member => member.username === username);
      if (user && !mentions.includes(user.id)) {
        mentions.push(user.id);
      }
    }
    
    return mentions;
  };

  const formatCommentText = (text) => {
    return text.replace(/@(\w+)/g, '<span style="color: #007bff; font-weight: bold;">@$1</span>');
  };

  const logout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  const canEdit = currentUser?.role === 'project_manager';

  // Filter subtasks based on user permissions
  const getVisibleSubtasks = (taskId) => {
    const taskSubtasks = subtasks[taskId] || [];
    
    // Project managers can see all subtasks
    if (canEdit) {
      return taskSubtasks;
    }
    
    // Non-project managers can only see subtasks assigned to them
    return taskSubtasks.filter(subtask => 
      subtask.assignee?._id === currentUser?._id || subtask.assignee?.id === currentUser?._id
    );
  };

  // Check if user can interact with a specific subtask
  const canInteractWithSubtask = (subtask) => {
    return canEdit || subtask.assignee?._id === currentUser?._id || subtask.assignee?.id === currentUser?._id;
  };

  return (
    <div>
      <nav style={{ background: '#343a40', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>{currentUser?.role ? `${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1).replace('_', ' ')} Dashboard` : 'Dashboard'}</h1>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link href={`/${currentUser?.role === 'project_manager' ? 'projectmanagerdashboard' : currentUser?.role === 'developer' ? 'developerdashboard' : currentUser?.role === 'tester' ? 'testerdashboard' : currentUser?.role === 'crm' ? 'crmdashboard' : currentUser?.role === 'client' ? 'clientdashboard' : currentUser?.role === 'director' ? 'directordashboard' : 'admindashboard'}/projects`} style={{ color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '4px' }}>Projects</Link>
          <Link href={`/${currentUser?.role === 'project_manager' ? 'projectmanagerdashboard' : currentUser?.role === 'developer' ? 'developerdashboard' : currentUser?.role === 'tester' ? 'testerdashboard' : currentUser?.role === 'crm' ? 'crmdashboard' : currentUser?.role === 'client' ? 'clientdashboard' : currentUser?.role === 'director' ? 'directordashboard' : 'admindashboard'}/projects/calendar`} style={{ color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '4px' }}>Calendar</Link>
          <Link href={`/${currentUser?.role === 'project_manager' ? 'projectmanagerdashboard' : currentUser?.role === 'developer' ? 'developerdashboard' : currentUser?.role === 'tester' ? 'testerdashboard' : currentUser?.role === 'crm' ? 'crmdashboard' : currentUser?.role === 'client' ? 'clientdashboard' : currentUser?.role === 'director' ? 'directordashboard' : 'admindashboard'}/messages`} style={{ color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '4px' }}>Messages</Link>
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
            onClick={() => router.push(`/${currentUser?.role === 'project_manager' ? 'projectmanagerdashboard' : currentUser?.role === 'developer' ? 'developerdashboard' : currentUser?.role === 'tester' ? 'testerdashboard' : currentUser?.role === 'crm' ? 'crmdashboard' : currentUser?.role === 'client' ? 'clientdashboard' : currentUser?.role === 'director' ? 'directordashboard' : 'admindashboard'}/projects/view`)}
            style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            ← Back to Project
          </button>
          <button 
            onClick={() => router.push(`/${currentUser?.role === 'project_manager' ? 'projectmanagerdashboard' : currentUser?.role === 'developer' ? 'developerdashboard' : currentUser?.role === 'tester' ? 'testerdashboard' : currentUser?.role === 'crm' ? 'crmdashboard' : currentUser?.role === 'client' ? 'clientdashboard' : currentUser?.role === 'director' ? 'directordashboard' : 'admindashboard'}/projects/board`)}
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
                  <tr 
                    key={task._id} 
                    onClick={() => openTaskDetails(task)}
                    style={{ borderBottom: '1px solid #dee2e6', cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
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
                      {getVisibleSubtasks(task._id).length > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ 
                            width: '60px', 
                            height: '8px', 
                            background: '#e9ecef', 
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${getTaskProgress(task)}%`,
                              height: '100%',
                              background: getTaskProgress(task) === 100 ? '#28a745' : '#007bff',
                              transition: 'width 0.3s ease'
                            }} />
                          </div>
                          <span style={{ fontSize: '12px', color: '#666' }}>
                            {getVisibleSubtasks(task._id).filter(st => st.completed).length}/{getVisibleSubtasks(task._id).length}
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

      {viewingTask && (
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
            maxWidth: '90vw',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3>{canEdit ? '✏️ Edit Task' : '👁️ View Task'}</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Task Title:</strong></label>
              {canEdit ? (
                <input
                  type="text"
                  placeholder="Enter task title"
                  value={editTask.title}
                  onChange={(e) => setEditTask({...editTask, title: e.target.value})}
                  style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              ) : (
                <div style={{ padding: '8px', marginTop: '5px', background: '#f8f9fa', borderRadius: '4px' }}>
                  {viewingTask?.title}
                </div>
              )}
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Description:</strong></label>
              {canEdit ? (
                <textarea
                  placeholder="Enter task description"
                  value={editTask.description}
                  onChange={(e) => setEditTask({...editTask, description: e.target.value})}
                  rows={3}
                  style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical' }}
                />
              ) : (
                <div style={{ padding: '8px', marginTop: '5px', background: '#f8f9fa', borderRadius: '4px', minHeight: '60px' }}>
                  {viewingTask?.description || 'No description'}
                </div>
              )}
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Tags:</strong></label>
              <div style={{ marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px', padding: '8px', minHeight: '40px', background: 'white' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                  {editSelectedTags.map(tagId => {
                    const tag = tags.find(t => t._id === tagId);
                    return tag ? (
                      <span key={tagId} style={{
                        fontSize: '12px',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        background: tag.color,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {tag.name}
                        <button
                          onClick={() => setEditSelectedTags(editSelectedTags.filter(id => id !== tagId))}
                          style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '10px' }}
                        >
                          ×
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
                <select
                  onChange={(e) => {
                    if (e.target.value && !editSelectedTags.includes(e.target.value)) {
                      setEditSelectedTags([...editSelectedTags, e.target.value]);
                    }
                    e.target.value = '';
                  }}
                  style={{ width: '100%', padding: '4px', border: 'none', outline: 'none' }}
                >
                  <option value="">Select tags...</option>
                  {tags.filter(tag => !editSelectedTags.includes(tag._id)).map(tag => (
                    <option key={tag._id} value={tag._id}>
                      {tag.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => {
                  const name = prompt('Enter new tag name:');
                  const color = prompt('Enter color (hex):') || '#6c757d';
                  if (name) createTag(name, color);
                }}
                style={{ 
                  marginTop: '5px', 
                  padding: '4px 8px', 
                  background: '#6c757d', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                ➕ Create Tag
              </button>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Status (Column):</strong></label>
              {canEdit ? (
                <select
                  value={editTask.status}
                  onChange={(e) => setEditTask({...editTask, status: e.target.value})}
                  style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  {columns.map(column => (
                    <option key={column._id} value={column._id}>
                      {column.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ padding: '8px', marginTop: '5px', background: '#f8f9fa', borderRadius: '4px' }}>
                  {getColumnName(viewingTask?.columnId)}
                </div>
              )}
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Assignee:</strong></label>
              {canEdit ? (
                <select
                  value={editTask.assignee}
                  onChange={(e) => setEditTask({...editTask, assignee: e.target.value})}
                  style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="">No assignee</option>
                  {team.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.username} ({member.email})
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ padding: '8px', marginTop: '5px', background: '#f8f9fa', borderRadius: '4px' }}>
                  {viewingTask?.assignee?.username || 'No assignee'}
                </div>
              )}
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Due Date:</strong></label>
              {canEdit ? (
                <input
                  type="date"
                  value={editTask.dueDate}
                  onChange={(e) => setEditTask({...editTask, dueDate: e.target.value})}
                  style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              ) : (
                <div style={{ padding: '8px', marginTop: '5px', background: '#f8f9fa', borderRadius: '4px' }}>
                  {viewingTask?.dueDate ? new Date(viewingTask.dueDate).toLocaleDateString() : 'No due date'}
                </div>
              )}
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Priority:</strong></label>
              {canEdit ? (
                <select
                  value={editTask.priority}
                  onChange={(e) => setEditTask({...editTask, priority: e.target.value})}
                  style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="">No priority</option>
                  {priorities.map(priority => (
                    <option key={priority._id} value={priority.name}>
                      {priority.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ padding: '8px', marginTop: '5px', background: '#f8f9fa', borderRadius: '4px' }}>
                  {viewingTask?.priority || 'No priority'}
                </div>
              )}
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Subtasks:</strong></label>
              <div style={{ marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px', padding: '8px' }}>
                {getVisibleSubtasks(viewingTask._id).length > 0 ? (
                  getVisibleSubtasks(viewingTask._id).map(subtask => (
                    <div key={subtask._id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px',
                      background: '#f8f9fa',
                      borderRadius: '4px',
                      marginBottom: '4px'
                    }}>
                      <input
                        type="checkbox"
                        checked={subtask.completed || false}
                        onChange={(e) => toggleSubtaskComplete(subtask._id, e.target.checked)}
                        disabled={!canInteractWithSubtask(subtask)}
                        style={{ cursor: canInteractWithSubtask(subtask) ? 'pointer' : 'not-allowed' }}
                      />
                      <span style={{
                        flex: 1,
                        textDecoration: subtask.completed ? 'line-through' : 'none',
                        color: subtask.completed ? '#666' : 'inherit',
                        fontSize: '12px',
                        cursor: canInteractWithSubtask(subtask) ? 'pointer' : 'default'
                      }}
                      onClick={() => {
                        if (canInteractWithSubtask(subtask)) {
                          openSubtaskEdit(subtask);
                        }
                      }}
                      >
                        {subtask.title}
                      </span>
                      {canEdit && (
                        <button
                          onClick={() => deleteSubtask(subtask._id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#dc3545',
                            cursor: 'pointer',
                            fontSize: '10px'
                          }}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#666', fontSize: '12px', textAlign: 'center', padding: '10px' }}>
                    No subtasks yet
                  </div>
                )}
                {canEdit && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <input
                      type="text"
                      placeholder="Add subtask..."
                      value={newSubtaskInput}
                      onChange={(e) => setNewSubtaskInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && newSubtaskInput.trim()) {
                          createSubtask(viewingTask._id, { title: newSubtaskInput });
                          setNewSubtaskInput('');
                        }
                      }}
                      style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }}
                    />
                    <button
                      onClick={() => {
                        if (newSubtaskInput.trim()) {
                          createSubtask(viewingTask._id, { title: newSubtaskInput });
                          setNewSubtaskInput('');
                        }
                      }}
                      style={{ padding: '6px 12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                    >
                      + Add
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Attachments:</strong></label>
              <div style={{ marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px', padding: '8px', minHeight: '40px', background: 'white' }}>
                {editTask.attachments.map((attachment, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', padding: '8px', background: '#f8f9fa', borderRadius: '4px' }}>
                    <span style={{ fontSize: '12px', flex: 1 }}>
                      📎 {attachment.originalName} ({(attachment.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                    <button
                      onClick={() => {
                        const updatedAttachments = editTask.attachments.filter((_, i) => i !== index);
                        setEditTask({...editTask, attachments: updatedAttachments});
                      }}
                      style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '12px' }}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    const totalSize = [...editTask.attachments, ...files].reduce((sum, file) => sum + (file.size || 0), 0);
                    
                    if (totalSize > 5 * 1024 * 1024 * 1024) {
                      alert('Total attachment size cannot exceed 5GB');
                      return;
                    }
                    
                    const newAttachments = files.map(file => ({
                      filename: file.name,
                      originalName: file.name,
                      size: file.size,
                      mimetype: file.type,
                      uploadedBy: currentUser?._id,
                      uploadedAt: new Date().toISOString()
                    }));
                    
                    setEditTask({...editTask, attachments: [...editTask.attachments, ...newAttachments]});
                  }}
                  style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                />
                <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                  Maximum total size: 5GB
                </div>
              </div>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Checklist:</strong></label>
              <div style={{ marginTop: '5px' }}>
                {editTask.subtasks.map((subtask, index) => (
                  <div key={subtask.id}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      marginBottom: '8px', 
                      padding: '8px', 
                      background: subtask.isHeading ? '#e3f2fd' : '#f8f9fa', 
                      borderRadius: '4px',
                      marginLeft: subtask.isHeading ? '0px' : '20px',
                      fontWeight: subtask.isHeading ? 'bold' : 'normal'
                    }}>
                    {subtask.isHeading ? (
                      <span style={{ fontSize: '14px', color: '#1976d2', marginRight: '8px' }}>📋</span>
                    ) : (
                      <>
                        <span style={{ fontSize: '12px', color: '#666', marginRight: '4px' }}>•</span>
                        <input
                          type="checkbox"
                          checked={subtask.completed}
                          onChange={() => toggleSubtask(subtask.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </>
                    )}
                    {editingSubtask === subtask.id ? (
                      <input
                        type="text"
                        value={subtask.text}
                        onChange={(e) => {
                          const updatedSubtasks = editTask.subtasks.map(st => 
                            st.id === subtask.id ? {...st, text: e.target.value} : st
                          );
                          setEditTask({...editTask, subtasks: updatedSubtasks});
                        }}
                        onBlur={() => setEditingSubtask(null)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            setEditingSubtask(null);
                          }
                        }}
                        style={{ flex: 1, padding: '4px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }}
                        autoFocus
                      />
                    ) : (
                      <span 
                        style={{ 
                          flex: 1, 
                          textDecoration: subtask.completed && !subtask.isHeading ? 'line-through' : 'none', 
                          color: subtask.completed && !subtask.isHeading ? '#666' : 'inherit',
                          cursor: 'default',
                          fontSize: subtask.isHeading ? '14px' : '12px'
                        }}
                      >
                        {subtask.text}
                      </span>
                    )}
                      <button
                        onClick={() => deleteChecklistItem(subtask.id)}
                        style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '12px' }}
                      >
                        🗑️
                      </button>
                    </div>
                    {subtask.isHeading && (
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', marginLeft: '20px' }}>
                        <input
                          type="text"
                          placeholder="Add item to this heading..."
                          value={newItemForHeading[subtask.id] || ''}
                          onChange={(e) => setNewItemForHeading({...newItemForHeading, [subtask.id]: e.target.value})}
                          onKeyPress={(e) => e.key === 'Enter' && addItemToHeading(subtask.id)}
                          style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }}
                        />
                        <button
                          onClick={() => addItemToHeading(subtask.id)}
                          style={{ padding: '6px 12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          ➕ Add Item
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <input
                    type="text"
                    placeholder="Add heading..."
                    value={newChecklistHeading}
                    onChange={(e) => setNewChecklistHeading(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addChecklistHeading()}
                    style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }}
                  />
                  <button
                    onClick={addChecklistHeading}
                    style={{ padding: '6px 12px', background: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    📋 Heading
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <input
                    type="text"
                    placeholder="Add checklist item..."
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSubtask()}
                    style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }}
                  />
                  <button
                    onClick={addSubtask}
                    style={{ padding: '6px 12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    ➕ Item
                  </button>
                </div>
              </div>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Comments:</strong></label>
              <div style={{ marginTop: '5px', maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px', padding: '8px' }}>
                {(taskComments[viewingTask._id] || []).map(comment => (
                  <div key={comment.id} style={{ marginBottom: '12px', padding: '8px', background: '#f8f9fa', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: '#007bff',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: 'bold'
                        }}>
                          {comment.author?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                          {comment.author?.username || 'Unknown'}
                        </span>
                        <span style={{ fontSize: '10px', color: '#666' }}>
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                        {comment.updatedAt !== comment.createdAt && (
                          <span style={{ fontSize: '10px', color: '#666', fontStyle: 'italic' }}>
                            (edited)
                          </span>
                        )}
                      </div>
                      {comment.author?.id === currentUser?._id && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => {
                              setEditingComment(comment.id);
                              setEditCommentText(comment.text);
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '10px', opacity: 0.7 }}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => deleteComment(viewingTask._id, comment.id)}
                            style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '10px' }}
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                    {editingComment === comment.id ? (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <textarea
                          value={editCommentText}
                          onChange={(e) => setEditCommentText(e.target.value)}
                          placeholder="Use @username to mention users"
                          rows={2}
                          style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px', resize: 'vertical' }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <button
                            onClick={() => updateComment(viewingTask._id, comment.id)}
                            style={{ padding: '4px 8px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => {
                              setEditingComment(null);
                              setEditCommentText('');
                            }}
                            style={{ padding: '4px 8px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        style={{ fontSize: '12px', lineHeight: '1.4' }}
                        dangerouslySetInnerHTML={{ __html: formatCommentText(comment.text) }}
                      />
                    )}
                    {comment.mentions && comment.mentions.length > 0 && (
                      <div style={{ marginTop: '4px', fontSize: '10px', color: '#666' }}>
                        Mentioned: {comment.mentions.map(user => user.username).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
                {(taskComments[viewingTask._id] || []).length === 0 && (
                  <p style={{ color: '#666', textAlign: 'center', margin: '20px 0', fontSize: '12px' }}>
                    No comments yet
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <textarea
                  placeholder="Add a comment... Use @username to mention users"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      addComment(viewingTask._id);
                    }
                  }}
                  rows={2}
                  style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px', resize: 'vertical' }}
                />
                <button
                  onClick={() => addComment(viewingTask._id)}
                  style={{ padding: '6px 12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                >
                  💬
                </button>
              </div>
              <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                Available users: {team.map(member => `@${member.username}`).join(', ')}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setViewingTask(null);
                  setEditTask({ title: '', description: '', priority: '', assignee: '', dueDate: '', tags: '', status: '', subtasks: [], attachments: [] });
                  setEditSelectedTags([]);
                  setNewItemForHeading({});
                }}
                style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={updateTask}
                disabled={!editTask.title.trim()}
                style={{ 
                  padding: '8px 16px', 
                  background: editTask.title.trim() ? '#28a745' : '#ccc', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: editTask.title.trim() ? 'pointer' : 'not-allowed',
                  display: canEdit ? 'block' : 'none'
                }}
              >
                Update Task
              </button>
            </div>
          </div>
        </div>
      )}

      {editingSubtask && (
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
          zIndex: 1001
        }}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90vw',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3>{canEdit ? '✏️ Edit Subtask' : '👁️ View Subtask'}</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Task Title:</strong></label>
              {canEdit ? (
                <input
                  type="text"
                  placeholder="Enter subtask title"
                  value={editingSubtaskData.title}
                  onChange={(e) => setEditingSubtaskData({...editingSubtaskData, title: e.target.value})}
                  style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              ) : (
                <div style={{ padding: '8px', marginTop: '5px', background: '#f8f9fa', borderRadius: '4px' }}>
                  {editingSubtask?.title}
                </div>
              )}
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Description:</strong></label>
              {canEdit ? (
                <textarea
                  placeholder="Enter subtask description"
                  value={editingSubtaskData.description}
                  onChange={(e) => setEditingSubtaskData({...editingSubtaskData, description: e.target.value})}
                  rows={3}
                  style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical' }}
                />
              ) : (
                <div style={{ padding: '8px', marginTop: '5px', background: '#f8f9fa', borderRadius: '4px', minHeight: '60px' }}>
                  {editingSubtask?.description || 'No description'}
                </div>
              )}
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Tags:</strong></label>
              <div style={{ marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px', padding: '8px', minHeight: '40px', background: 'white' }}>
                <select
                  onChange={(e) => {
                    if (e.target.value && !editSubtaskSelectedTags.includes(e.target.value)) {
                      setEditSubtaskSelectedTags([...editSubtaskSelectedTags, e.target.value]);
                    }
                    e.target.value = '';
                  }}
                  style={{ width: '100%', padding: '4px', border: 'none', outline: 'none' }}
                >
                  <option value="">Select tags...</option>
                  {tags.filter(tag => !editSubtaskSelectedTags.includes(tag._id)).map(tag => (
                    <option key={tag._id} value={tag._id}>
                      {tag.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Assignee:</strong></label>
              {canEdit ? (
                <select
                  value={editingSubtaskData.assignee}
                  onChange={(e) => setEditingSubtaskData({...editingSubtaskData, assignee: e.target.value})}
                  style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="">No assignee</option>
                  {team.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.username} ({member.email})
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ padding: '8px', marginTop: '5px', background: '#f8f9fa', borderRadius: '4px' }}>
                  {editingSubtask?.assignee?.username || 'No assignee'}
                </div>
              )}
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Due Date:</strong></label>
              {canEdit ? (
                <input
                  type="date"
                  value={editingSubtaskData.dueDate}
                  onChange={(e) => setEditingSubtaskData({...editingSubtaskData, dueDate: e.target.value})}
                  style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              ) : (
                <div style={{ padding: '8px', marginTop: '5px', background: '#f8f9fa', borderRadius: '4px' }}>
                  {editingSubtask?.dueDate ? new Date(editingSubtask.dueDate).toLocaleDateString() : 'No due date'}
                </div>
              )}
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Priority:</strong></label>
              {canEdit ? (
                <select
                  value={editingSubtaskData.priority}
                  onChange={(e) => setEditingSubtaskData({...editingSubtaskData, priority: e.target.value})}
                  style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="">No priority</option>
                  {priorities.map(priority => (
                    <option key={priority._id} value={priority.name}>
                      {priority.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ padding: '8px', marginTop: '5px', background: '#f8f9fa', borderRadius: '4px' }}>
                  {editingSubtask?.priority || 'No priority'}
                </div>
              )}
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Attachments:</strong></label>
              <div style={{ marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px', padding: '8px', minHeight: '40px', background: 'white' }}>
                {(editingSubtaskData.attachments || []).map((attachment, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', padding: '8px', background: '#f8f9fa', borderRadius: '4px' }}>
                    <span style={{ fontSize: '12px', flex: 1 }}>
                      📎 {attachment.originalName} ({(attachment.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                    {canEdit && (
                      <button
                        onClick={() => {
                          const updatedAttachments = editingSubtaskData.attachments.filter((_, i) => i !== index);
                          setEditingSubtaskData({...editingSubtaskData, attachments: updatedAttachments});
                        }}
                        style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '12px' }}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                ))}
                {canEdit && (
                  <input
                    type="file"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      const currentAttachments = editingSubtaskData.attachments || [];
                      const totalSize = [...currentAttachments, ...files].reduce((sum, file) => sum + (file.size || 0), 0);
                      
                      if (totalSize > 5 * 1024 * 1024 * 1024) {
                        alert('Total attachment size cannot exceed 5GB');
                        return;
                      }
                      
                      const newAttachments = files.map(file => ({
                        filename: file.name,
                        originalName: file.name,
                        size: file.size,
                        mimetype: file.type,
                        uploadedBy: currentUser?._id,
                        uploadedAt: new Date().toISOString()
                      }));
                      
                      setEditingSubtaskData({...editingSubtaskData, attachments: [...currentAttachments, ...newAttachments]});
                    }}
                    style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                  />
                )}
                <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                  Maximum total size: 5GB
                </div>
              </div>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Subtasks:</strong></label>
              <div style={{ marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px', padding: '8px' }}>
                {(editingSubtaskData.subtasks || []).length > 0 ? (
                  editingSubtaskData.subtasks.map(subtask => (
                    <div key={subtask.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px',
                      background: '#f8f9fa',
                      borderRadius: '4px',
                      marginBottom: '4px'
                    }}>
                      <input
                        type="checkbox"
                        checked={subtask.completed || false}
                        onChange={(e) => {
                          setEditingSubtaskData({
                            ...editingSubtaskData,
                            subtasks: editingSubtaskData.subtasks.map(st => 
                              st.id === subtask.id ? {...st, completed: e.target.checked} : st
                            )
                          });
                        }}
                        style={{ cursor: 'pointer' }}
                        disabled={!canEdit}
                      />
                      <span style={{
                        flex: 1,
                        textDecoration: subtask.completed ? 'line-through' : 'none',
                        color: subtask.completed ? '#666' : 'inherit',
                        fontSize: '12px'
                      }}>
                        {subtask.title}
                      </span>
                      {canEdit && (
                        <button
                          onClick={() => {
                            setEditingSubtaskData({
                              ...editingSubtaskData,
                              subtasks: editingSubtaskData.subtasks.filter(st => st.id !== subtask.id)
                            });
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#dc3545',
                            cursor: 'pointer',
                            fontSize: '10px'
                          }}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#666', fontSize: '12px', textAlign: 'center', padding: '10px' }}>
                    No subtasks yet
                  </div>
                )}
                {canEdit && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <input
                      type="text"
                      placeholder="Add subtask..."
                      value={newSubtaskInput}
                      onChange={(e) => setNewSubtaskInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && newSubtaskInput.trim()) {
                          const newSubtaskItem = {
                            id: Date.now().toString(),
                            title: newSubtaskInput,
                            completed: false
                          };
                          setEditingSubtaskData({...editingSubtaskData, subtasks: [...(editingSubtaskData.subtasks || []), newSubtaskItem]});
                          setNewSubtaskInput('');
                        }
                      }}
                      style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }}
                    />
                    <button
                      onClick={() => {
                        if (newSubtaskInput.trim()) {
                          const newSubtaskItem = {
                            id: Date.now().toString(),
                            title: newSubtaskInput,
                            completed: false
                          };
                          setEditingSubtaskData({...editingSubtaskData, subtasks: [...(editingSubtaskData.subtasks || []), newSubtaskItem]});
                          setNewSubtaskInput('');
                        }
                      }}
                      style={{ padding: '6px 12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                    >
                      + Add
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Checklist:</strong></label>
              <div style={{ marginTop: '5px' }}>
                {(editingSubtaskData.checklist || []).map((item, index) => (
                  <div key={item.id}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      marginBottom: '8px', 
                      padding: '8px', 
                      background: item.isHeading ? '#e3f2fd' : '#f8f9fa', 
                      borderRadius: '4px',
                      marginLeft: item.isHeading ? '0px' : '20px',
                      fontWeight: item.isHeading ? 'bold' : 'normal'
                    }}>
                      {item.isHeading ? (
                        <span style={{ fontSize: '14px', color: '#1976d2', marginRight: '8px' }}>📋</span>
                      ) : (
                        <>
                          <span style={{ fontSize: '12px', color: '#666', marginRight: '4px' }}>•</span>
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => {
                              setEditingSubtaskData({
                                ...editingSubtaskData,
                                checklist: editingSubtaskData.checklist.map(ci => 
                                  ci.id === item.id ? {...ci, completed: !ci.completed} : ci
                                )
                              });
                            }}
                            style={{ cursor: 'pointer' }}
                            disabled={!canEdit}
                          />
                        </>
                      )}
                      <span 
                        style={{ 
                          flex: 1, 
                          textDecoration: item.completed && !item.isHeading ? 'line-through' : 'none', 
                          color: item.completed && !item.isHeading ? '#666' : 'inherit',
                          cursor: 'default',
                          fontSize: item.isHeading ? '14px' : '12px'
                        }}
                      >
                        {item.text}
                      </span>
                      {canEdit && (
                        <button
                          onClick={() => {
                            setEditingSubtaskData({
                              ...editingSubtaskData,
                              checklist: editingSubtaskData.checklist.filter(ci => ci.id !== item.id)
                            });
                          }}
                          style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '12px' }}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                    {item.isHeading && canEdit && (
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', marginLeft: '20px' }}>
                        <input
                          type="text"
                          placeholder="Add item to this heading..."
                          value={newItemForHeading[item.id] || ''}
                          onChange={(e) => setNewItemForHeading({...newItemForHeading, [item.id]: e.target.value})}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && newItemForHeading[item.id]?.trim()) {
                              const newItem = {
                                id: Date.now().toString(),
                                text: newItemForHeading[item.id],
                                completed: false,
                                isHeading: false,
                                parentHeading: item.id
                              };
                              const currentChecklist = editingSubtaskData.checklist || [];
                              const headingIndex = currentChecklist.findIndex(ci => ci.id === item.id);
                              const updatedChecklist = [...currentChecklist];
                              updatedChecklist.splice(headingIndex + 1, 0, newItem);
                              setEditingSubtaskData({...editingSubtaskData, checklist: updatedChecklist});
                              setNewItemForHeading({...newItemForHeading, [item.id]: ''});
                            }
                          }}
                          style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }}
                        />
                        <button
                          onClick={() => {
                            if (newItemForHeading[item.id]?.trim()) {
                              const newItem = {
                                id: Date.now().toString(),
                                text: newItemForHeading[item.id],
                                completed: false,
                                isHeading: false,
                                parentHeading: item.id
                              };
                              const currentChecklist = editingSubtaskData.checklist || [];
                              const headingIndex = currentChecklist.findIndex(ci => ci.id === item.id);
                              const updatedChecklist = [...currentChecklist];
                              updatedChecklist.splice(headingIndex + 1, 0, newItem);
                              setEditingSubtaskData({...editingSubtaskData, checklist: updatedChecklist});
                              setNewItemForHeading({...newItemForHeading, [item.id]: ''});
                            }
                          }}
                          style={{ padding: '6px 12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          ➕ Add Item
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {canEdit && (
                  <>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <input
                        type="text"
                        placeholder="Add heading..."
                        value={newChecklistHeading}
                        onChange={(e) => setNewChecklistHeading(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newChecklistHeading.trim()) {
                            const heading = {
                              id: Date.now().toString(),
                              text: newChecklistHeading,
                              completed: false,
                              isHeading: true
                            };
                            setEditingSubtaskData({...editingSubtaskData, checklist: [...(editingSubtaskData.checklist || []), heading]});
                            setNewChecklistHeading('');
                          }
                        }}
                        style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }}
                      />
                      <button
                        onClick={() => {
                          if (newChecklistHeading.trim()) {
                            const heading = {
                              id: Date.now().toString(),
                              text: newChecklistHeading,
                              completed: false,
                              isHeading: true
                            };
                            setEditingSubtaskData({...editingSubtaskData, checklist: [...(editingSubtaskData.checklist || []), heading]});
                            setNewChecklistHeading('');
                          }
                        }}
                        style={{ padding: '6px 12px', background: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        📋 Heading
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <input
                        type="text"
                        placeholder="Add checklist item..."
                        value={newSubtask}
                        onChange={(e) => setNewSubtask(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newSubtask.trim()) {
                            const item = {
                              id: Date.now().toString(),
                              text: newSubtask,
                              completed: false,
                              isHeading: false
                            };
                            setEditingSubtaskData({...editingSubtaskData, checklist: [...(editingSubtaskData.checklist || []), item]});
                            setNewSubtask('');
                          }
                        }}
                        style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }}
                      />
                      <button
                        onClick={() => {
                          if (newSubtask.trim()) {
                            const item = {
                              id: Date.now().toString(),
                              text: newSubtask,
                              completed: false,
                              isHeading: false
                            };
                            setEditingSubtaskData({...editingSubtaskData, checklist: [...(editingSubtaskData.checklist || []), item]});
                            setNewSubtask('');
                          }
                        }}
                        style={{ padding: '6px 12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        ➕ Item
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Comments:</strong></label>
              <div style={{ marginTop: '5px', maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px', padding: '8px' }}>
                {(taskComments[editingSubtask?._id] || []).map(comment => (
                  <div key={comment.id} style={{ marginBottom: '12px', padding: '8px', background: '#f8f9fa', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: '#007bff',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: 'bold'
                        }}>
                          {comment.author?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                          {comment.author?.username || 'Unknown'}
                        </span>
                        <span style={{ fontSize: '10px', color: '#666' }}>
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                        {comment.updatedAt !== comment.createdAt && (
                          <span style={{ fontSize: '10px', color: '#666', fontStyle: 'italic' }}>
                            (edited)
                          </span>
                        )}
                      </div>
                      {comment.author?.id === currentUser?._id && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => {
                              setEditingComment(comment.id);
                              setEditCommentText(comment.text);
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '10px', opacity: 0.7 }}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => deleteComment(editingSubtask._id, comment.id)}
                            style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '10px' }}
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                    {editingComment === comment.id ? (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <textarea
                          value={editCommentText}
                          onChange={(e) => setEditCommentText(e.target.value)}
                          placeholder="Use @username to mention users"
                          rows={2}
                          style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px', resize: 'vertical' }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <button
                            onClick={() => updateComment(editingSubtask._id, comment.id)}
                            style={{ padding: '4px 8px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => {
                              setEditingComment(null);
                              setEditCommentText('');
                            }}
                            style={{ padding: '4px 8px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        style={{ fontSize: '12px', lineHeight: '1.4' }}
                        dangerouslySetInnerHTML={{ __html: formatCommentText(comment.text) }}
                      />
                    )}
                    {comment.mentions && comment.mentions.length > 0 && (
                      <div style={{ marginTop: '4px', fontSize: '10px', color: '#666' }}>
                        Mentioned: {comment.mentions.map(user => user.username).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
                {(taskComments[editingSubtask?._id] || []).length === 0 && (
                  <p style={{ color: '#666', textAlign: 'center', margin: '20px 0', fontSize: '12px' }}>
                    No comments yet
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <textarea
                  placeholder="Add a comment... Use @username to mention users"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      addComment(editingSubtask._id);
                    }
                  }}
                  rows={2}
                  style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px', resize: 'vertical' }}
                />
                <button
                  onClick={() => addComment(editingSubtask._id)}
                  style={{ padding: '6px 12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                >
                  💬
                </button>
              </div>
              <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                Available users: {team.map(member => `@${member.username}`).join(', ')}
              </div>
            </div>
            
            {/* Tick button for subtask completion */}
            {!canEdit && (editingSubtask?.assignee?._id === currentUser?._id) && (
              <div style={{ marginBottom: '15px', textAlign: 'center' }}>
                <button
                  onClick={() => {
                    toggleSubtaskComplete(editingSubtask._id, !editingSubtask.completed);
                    setEditingSubtask(null);
                  }}
                  style={{
                    padding: '10px 20px',
                    background: editingSubtask.completed ? '#6c757d' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {editingSubtask.completed ? '✅ Completed' : '✅ Mark as Complete'}
                </button>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setEditingSubtask(null);
                  setEditingSubtaskData({ title: '', description: '', priority: '', assignee: '', dueDate: '', tags: '', status: '', subtasks: [], attachments: [] });
                  setEditSubtaskSelectedTags([]);
                }}
                style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              {canEdit && (
                <button
                  onClick={updateSubtaskData}
                  disabled={!editingSubtaskData.title.trim()}
                  style={{ 
                    padding: '8px 16px', 
                    background: editingSubtaskData.title.trim() ? '#28a745' : '#ccc', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: editingSubtaskData.title.trim() ? 'pointer' : 'not-allowed' 
                  }}
                >
                  Update Subtask
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}