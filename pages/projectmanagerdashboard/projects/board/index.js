import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function KanbanBoard() {
  const [columns, setColumns] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [isCreatingColumn, setIsCreatingColumn] = useState(false);
  const [newColumn, setNewColumn] = useState({ name: '', color: '#007bff' });
  const [editingColumn, setEditingColumn] = useState(null);
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isCreatingTask, setIsCreatingTask] = useState(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: '', assignee: '', dueDate: '', tags: '', status: '', subtasks: [] });
  const [editingTask, setEditingTask] = useState(null);
  const [editTask, setEditTask] = useState({ title: '', description: '', priority: '', assignee: '', dueDate: '', tags: '', status: '', subtasks: [] });
  const [editSelectedTags, setEditSelectedTags] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [editingSubtask, setEditingSubtask] = useState(null);
  const [taskComments, setTaskComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [draggedTask, setDraggedTask] = useState(null);
  const [deletedTasksCount, setDeletedTasksCount] = useState(0);
  const [team, setTeam] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    fetchColumns();
    fetchTasks();
    fetchDeletedTasksCount();
    fetchTeam();
    fetchPriorities();
    fetchTags();
    
    const handleClickOutside = (event) => {
      if (showProfile && !event.target.closest('.profile-dropdown')) {
        setShowProfile(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfile]);

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

  const createColumn = async () => {
    try {
      const projectId = localStorage.getItem('selectedProjectId');
      const response = await fetch('/api/board-columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          name: newColumn.name,
          color: newColumn.color,
          userRole: currentUser?.role
        })
      });
      
      if (response.ok) {
        fetchColumns();
        setIsCreatingColumn(false);
        setNewColumn({ name: '', color: '#007bff' });
      }
    } catch (error) {
      console.error('Error creating column:', error);
    }
  };

  const updateColumn = async (id, name, color) => {
    try {
      const response = await fetch('/api/board-columns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name,
          color,
          userRole: currentUser?.role
        })
      });
      
      if (response.ok) {
        fetchColumns();
        setEditingColumn(null);
      }
    } catch (error) {
      console.error('Error updating column:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const projectId = localStorage.getItem('selectedProjectId');
      if (!projectId) return;
      
      const response = await fetch(`/api/tasks?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('All tasks with subtasks:', data.map(t => ({id: t._id, title: t.title, subtasks: t.subtasks})));
        setTasks(data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
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

  const createTask = async (columnId) => {
    try {
      const targetColumnId = newTask.status || columnId;
      console.log('=== FRONTEND DEBUG ===');
      console.log('newTask object:', newTask);
      console.log('newTask.subtasks:', newTask.subtasks);
      console.log('newTask.subtasks type:', typeof newTask.subtasks);
      console.log('newTask.subtasks is array:', Array.isArray(newTask.subtasks));
      
      const requestBody = {
        projectId: localStorage.getItem('selectedProjectId'),
        columnId: targetColumnId,
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        assignee: newTask.assignee || null,
        dueDate: newTask.dueDate || null,
        tags: selectedTags,
        subtasks: newTask.subtasks,
        createdBy: currentUser?._id
      };
      
      console.log('Full request body:', JSON.stringify(requestBody, null, 2));
      console.log('Request body subtasks:', JSON.stringify(requestBody.subtasks, null, 2));
      
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      console.log('API Response status:', response.status);
      const responseData = await response.json();
      console.log('API Response data:', responseData);
      
      if (response.ok) {
        console.log('Task created successfully, response subtasks:', responseData.subtasks);
        fetchTasks();
        setIsCreatingTask(null);
        setNewTask({ title: '', description: '', priority: '', assignee: '', dueDate: '', tags: '', status: '', subtasks: [] });
        setSelectedTags([]);
      } else {
        console.error('API Error:', responseData);
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const updateTask = async () => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: editingTask._id,
          title: editTask.title,
          description: editTask.description,
          priority: editTask.priority,
          assignee: editTask.assignee || null,
          dueDate: editTask.dueDate || null,
          tags: editSelectedTags,
          subtasks: editTask.subtasks,
          columnId: editTask.status
        })
      });
      
      if (response.ok) {
        fetchTasks();
        setEditingTask(null);
        setEditTask({ title: '', description: '', priority: '', assignee: '', dueDate: '', tags: '', status: '', subtasks: [] });
        setEditSelectedTags([]);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const openEditTask = (task) => {
    console.log('Opening task for edit:', task);
    console.log('Task subtasks:', task.subtasks);
    setEditingTask(task);
    setEditTask({
      title: task.title,
      description: task.description || '',
      priority: task.priority || '',
      assignee: task.assignee?._id || '',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      status: task.columnId,
      subtasks: Array.isArray(task.subtasks) ? task.subtasks : (task.subtasks ? [task.subtasks] : [])
    });
    setEditSelectedTags(task.tags?.filter(tag => tag && tag._id).map(tag => tag._id) || []);
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    const subtask = {
      id: Date.now().toString(),
      text: newSubtask,
      completed: false
    };
    if (editingTask) {
      setEditTask({...editTask, subtasks: [...editTask.subtasks, subtask]});
    } else {
      setNewTask({...newTask, subtasks: [...(newTask.subtasks || []), subtask]});
    }
    setNewSubtask('');
  };

  const toggleSubtask = (subtaskId) => {
    if (editingTask) {
      setEditTask({
        ...editTask,
        subtasks: editTask.subtasks.map(st => 
          st.id === subtaskId ? {...st, completed: !st.completed} : st
        )
      });
    } else {
      setNewTask({
        ...newTask,
        subtasks: (newTask.subtasks || []).map(st => 
          st.id === subtaskId ? {...st, completed: !st.completed} : st
        )
      });
    }
  };

  const deleteSubtask = (subtaskId) => {
    if (editingTask) {
      setEditTask({
        ...editTask,
        subtasks: editTask.subtasks.filter(st => st.id !== subtaskId)
      });
    } else {
      setNewTask({
        ...newTask,
        subtasks: (newTask.subtasks || []).filter(st => st.id !== subtaskId)
      });
    }
  };

  const renameSubtask = (subtaskId, newText) => {
    if (editingTask) {
      setEditTask({
        ...editTask,
        subtasks: editTask.subtasks.map(st => 
          st.id === subtaskId ? {...st, text: newText} : st
        )
      });
    } else {
      setNewTask({
        ...newTask,
        subtasks: (newTask.subtasks || []).map(st => 
          st.id === subtaskId ? {...st, text: newText} : st
        )
      });
    }
    setEditingSubtask(null);
  };

  const getCompletionPercentage = (subtasks) => {
    if (!subtasks || subtasks.length === 0) return 0;
    const completed = subtasks.filter(st => st.completed).length;
    return Math.round((completed / subtasks.length) * 100);
  };

  const addComment = (taskId) => {
    if (!newComment.trim()) return;
    
    const mentions = extractMentions(newComment);
    const comment = {
      id: Date.now().toString(),
      text: newComment,
      author: currentUser,
      mentions: mentions.map(id => team.find(t => t.id === id)).filter(Boolean),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setTaskComments(prev => ({
      ...prev,
      [taskId]: [...(prev[taskId] || []), comment]
    }));
    setNewComment('');
  };

  const updateComment = (taskId, commentId) => {
    if (!editCommentText.trim()) return;
    
    const mentions = extractMentions(editCommentText);
    
    setTaskComments(prev => ({
      ...prev,
      [taskId]: (prev[taskId] || []).map(comment => 
        comment.id === commentId 
          ? {
              ...comment,
              text: editCommentText,
              mentions: mentions.map(id => team.find(t => t.id === id)).filter(Boolean),
              updatedAt: new Date().toISOString()
            }
          : comment
      )
    }));
    
    setEditingComment(null);
    setEditCommentText('');
  };

  const deleteComment = (taskId, commentId) => {
    if (!confirm('Delete this comment?')) return;
    
    setTaskComments(prev => ({
      ...prev,
      [taskId]: (prev[taskId] || []).filter(comment => comment.id !== commentId)
    }));
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

  const fetchDeletedTasksCount = async () => {
    try {
      const projectId = localStorage.getItem('selectedProjectId');
      if (!projectId) return;
      
      const response = await fetch(`/api/tasks?projectId=${projectId}&deleted=true`);
      if (response.ok) {
        const data = await response.json();
        setDeletedTasksCount(data.length);
      }
    } catch (error) {
      console.error('Error fetching deleted tasks count:', error);
    }
  };

  const deleteTask = async (id) => {
    console.log('Deleting task:', id);
    try {
      const response = await fetch('/api/tasks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, soft: true })
      });
      
      console.log('Delete response:', response.status);
      if (response.ok) {
        fetchTasks();
        fetchDeletedTasksCount();
      } else {
        console.error('Delete failed:', await response.text());
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const restoreTask = async (id) => {
    try {
      const response = await fetch('/api/tasks/restore', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      
      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error('Error restoring task:', error);
    }
  };

  const permanentDeleteTask = async (id) => {
    if (!confirm('Permanently delete this task? This cannot be undone.')) return;
    
    try {
      const response = await fetch('/api/tasks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, permanent: true })
      });
      
      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error('Error permanently deleting task:', error);
    }
  };

  const deleteColumn = async (id) => {
    // Check if column has tasks
    const column = columns.find(col => col._id === id);
    const hasTasks = tasks.some(task => task.columnId === id);
    
    if (hasTasks) {
      alert('Cannot delete column that contains tasks. Please move or delete all tasks first.');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this column?')) return;
    
    try {
      const response = await fetch('/api/board-columns', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          userRole: currentUser?.role
        })
      });
      
      if (response.ok) {
        fetchColumns();
      }
    } catch (error) {
      console.error('Error deleting column:', error);
    }
  };

  const reorderColumns = async (newOrder) => {
    try {
      const response = await fetch('/api/board-columns/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: localStorage.getItem('selectedProjectId'),
          columnOrder: newOrder,
          userRole: currentUser?.role
        })
      });
      
      if (response.ok) {
        fetchColumns();
      }
    } catch (error) {
      console.error('Error reordering columns:', error);
    }
  };

  const handleColumnDragStart = (e, column) => {
    if (!canEdit || draggedTask) {
      e.preventDefault();
      return;
    }
    setDraggedColumn(column);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleTaskDragStart = (e, task) => {
    if (!canEdit) {
      e.preventDefault();
      return;
    }
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.stopPropagation();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleTaskDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.stopPropagation();
  };

  const handleColumnDrop = (e, targetColumn) => {
    e.preventDefault();
    if (draggedTask) {
      // Handle task drop on column
      moveTask(draggedTask._id, targetColumn._id);
      setDraggedTask(null);
      return;
    }
    
    if (!draggedColumn || !canEdit) return;
    
    const draggedIndex = columns.findIndex(col => col._id === draggedColumn._id);
    const targetIndex = columns.findIndex(col => col._id === targetColumn._id);
    
    if (draggedIndex === targetIndex) {
      setDraggedColumn(null);
      return;
    }
    
    const newColumns = [...columns];
    const [removed] = newColumns.splice(draggedIndex, 1);
    newColumns.splice(targetIndex, 0, removed);
    
    // Update order values
    const reorderedColumns = newColumns.map((col, index) => ({
      id: col._id,
      order: index
    }));
    
    setColumns(newColumns);
    reorderColumns(reorderedColumns);
    setDraggedColumn(null);
  };

  const createPriority = async (name, color) => {
    try {
      const response = await fetch('/api/priorities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: localStorage.getItem('selectedProjectId'),
          name,
          color,
          userRole: currentUser?.role
        })
      });
      
      if (response.ok) {
        fetchPriorities();
      }
    } catch (error) {
      console.error('Error creating priority:', error);
    }
  };

  const moveTask = async (taskId, newColumnId) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: taskId,
          columnId: newColumnId
        })
      });
      
      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error('Error moving task:', error);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'project_manager';

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
        <button 
          onClick={() => router.push('/projectmanagerdashboard/projects/view')}
          style={{ marginBottom: '20px', padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          ← Back to Project
        </button>

        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0 }}>📋 Kanban Board</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => router.push('/projectmanagerdashboard/projects/board/lists')}
                style={{ padding: '8px 16px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                📝 Lists
              </button>
              {canEdit && (
                <button
                  onClick={() => router.push('/projectmanagerdashboard/projects/board/trash')}
                  style={{ padding: '8px 16px', background: '#ffc107', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  🗑️ Trash ({deletedTasksCount})
                </button>
              )}
              {canEdit && (
                <button
                  onClick={() => setIsCreatingColumn(true)}
                  style={{ padding: '8px 16px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  ➕ Add Column
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', minHeight: '400px' }}>
            {columns.map(column => (
              <div 
                key={column._id} 
                draggable={canEdit && !draggedTask}
                onDragStart={(e) => handleColumnDragStart(e, column)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleColumnDrop(e, column)}
                style={{
                  minWidth: '300px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '15px',
                  border: `3px solid ${column.color}`,
                  cursor: canEdit ? 'grab' : 'default',
                  opacity: draggedColumn?._id === column._id ? 0.5 : 1,
                  transform: draggedColumn?._id === column._id ? 'rotate(5deg)' : 'none',
                  transition: 'all 0.2s ease'
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      fontSize: '10px', 
                      background: '#f8f9fa', 
                      padding: '2px 6px', 
                      borderRadius: '12px', 
                      color: '#666' 
                    }}>
                      #{column.order}
                    </span>
                    {editingColumn === column._id ? (
                    <input
                      type="text"
                      value={column.name}
                      onChange={(e) => {
                        const updatedColumns = columns.map(col => 
                          col._id === column._id ? { ...col, name: e.target.value } : col
                        );
                        setColumns(updatedColumns);
                      }}
                      onBlur={() => updateColumn(column._id, column.name, column.color)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          updateColumn(column._id, column.name, column.color);
                        }
                      }}
                      style={{ 
                        border: 'none', 
                        background: 'transparent', 
                        fontSize: '18px', 
                        fontWeight: 'bold',
                        width: '100%'
                      }}
                      autoFocus
                    />
                  ) : (
                      <h3 
                        style={{ 
                          margin: 0, 
                          color: column.color, 
                          cursor: canEdit ? 'pointer' : 'default' 
                        }}
                        onClick={() => canEdit && setEditingColumn(column._id)}
                        title={`ID: ${column._id} | Order: ${column.order} | Color: ${column.color}`}
                      >
                        {column.name} ({tasks.filter(task => task.columnId === column._id).length})
                      </h3>
                    )}
                  </div>
                  {canEdit && (
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <input
                        type="color"
                        value={column.color}
                        onChange={(e) => updateColumn(column._id, column.name, e.target.value)}
                        style={{ width: '30px', height: '30px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      />
                      <button
                        onClick={() => deleteColumn(column._id)}
                        style={{ 
                          background: '#dc3545', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '4px', 
                          width: '30px', 
                          height: '30px', 
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
                
                <div 
                  style={{ minHeight: '300px', background: 'white', borderRadius: '4px', padding: '10px' }}
                  onDragOver={handleTaskDragOver}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (draggedTask) {
                      moveTask(draggedTask._id, column._id);
                      setDraggedTask(null);
                    }
                  }}
                >
                  {tasks.filter(task => task.columnId === column._id).map(task => (
                    <div 
                      key={task._id} 
                      draggable={canEdit}
                      onDragStart={(e) => handleTaskDragStart(e, task)}
                      style={{
                        background: '#fff',
                        border: '1px solid #e1e5e9',
                        borderRadius: '6px',
                        padding: '12px',
                        marginBottom: '8px',
                        cursor: canEdit ? 'grab' : 'pointer',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        transition: 'all 0.2s ease',
                        opacity: draggedTask?._id === task._id ? 0.5 : 1,
                        transform: draggedTask?._id === task._id ? 'rotate(2deg)' : 'none'
                      }}>
                      <div style={{ fontWeight: '500', marginBottom: '6px', fontSize: '14px' }}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                          {task.description}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {task.priority && (
                              <span style={{
                                fontSize: '10px',
                                padding: '2px 6px',
                                borderRadius: '12px',
                                background: priorities.find(p => p.name === task.priority)?.color || '#48dbfb',
                                color: 'white'
                              }}>
                                {task.priority}
                              </span>
                            )}
                            {task.dueDate && (
                              <span style={{
                                fontSize: '10px',
                                color: new Date(task.dueDate) < new Date() ? '#dc3545' : '#666',
                                fontWeight: new Date(task.dueDate) < new Date() ? 'bold' : 'normal'
                              }}>
                                📅 {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {canEdit && (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditTask(task);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  opacity: 0.7
                                }}
                                title="Edit task"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteTask(task._id);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#999',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </div>
                        {task.tags && task.tags.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                            {task.tags.map((tag, index) => (
                              <span key={index} style={{
                                fontSize: '9px',
                                padding: '2px 6px',
                                borderRadius: '10px',
                                background: '#e9ecef',
                                color: '#495057',
                                border: '1px solid #dee2e6'
                              }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          {task.assignee && (
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
                                {task.assignee?.username?.charAt(0).toUpperCase() || 'U'}
                              </div>
                              <span style={{ fontSize: '11px', color: '#666' }}>
                                {task.assignee?.username || 'Assigned'}
                              </span>
                            </div>
                          )}
                          {task.subtasks && task.subtasks.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ 
                                width: '40px', 
                                height: '6px', 
                                background: '#e9ecef', 
                                borderRadius: '3px',
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  width: `${getCompletionPercentage(task.subtasks)}%`,
                                  height: '100%',
                                  background: getCompletionPercentage(task.subtasks) === 100 ? '#28a745' : '#007bff',
                                  transition: 'width 0.3s ease'
                                }} />
                              </div>
                              <span style={{ fontSize: '10px', color: '#666' }}>
                                {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {canEdit && (
                    <button
                      onClick={() => setIsCreatingTask(column._id)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: 'transparent',
                        border: '2px dashed #ddd',
                        borderRadius: '4px',
                        color: '#666',
                        cursor: 'pointer',
                        marginTop: '10px'
                      }}
                    >
                      ➕ Add Task
                    </button>
                  )}
                  
                  {tasks.filter(task => task.columnId === column._id).length === 0 && !canEdit && (
                    <p style={{ color: '#666', textAlign: 'center', margin: '50px 0' }}>
                      No tasks yet
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isCreatingColumn && (
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
            <h3>➕ Create New Column</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Column Name:</strong></label>
              <input
                type="text"
                placeholder="Enter column name"
                value={newColumn.name}
                onChange={(e) => setNewColumn({...newColumn, name: e.target.value})}
                style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Color:</strong></label>
              <input
                type="color"
                value={newColumn.color}
                onChange={(e) => setNewColumn({...newColumn, color: e.target.value})}
                style={{ width: '100%', height: '40px', padding: '5px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setIsCreatingColumn(false);
                  setNewColumn({ name: '', color: '#007bff' });
                }}
                style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={createColumn}
                disabled={!newColumn.name.trim()}
                style={{ 
                  padding: '8px 16px', 
                  background: newColumn.name.trim() ? '#28a745' : '#ccc', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: newColumn.name.trim() ? 'pointer' : 'not-allowed' 
                }}
              >
                Create Column
              </button>
            </div>
          </div>
        </div>
      )}

      {(isCreatingTask || editingTask) && (
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
            <h3>{editingTask ? '✏️ Edit Task' : '➕ Create New Task'}</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Task Title:</strong></label>
              <input
                type="text"
                placeholder="Enter task title"
                value={editingTask ? editTask.title : newTask.title}
                onChange={(e) => editingTask ? setEditTask({...editTask, title: e.target.value}) : setNewTask({...newTask, title: e.target.value})}
                style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Description:</strong></label>
              <textarea
                placeholder="Enter task description"
                value={editingTask ? editTask.description : newTask.description}
                onChange={(e) => editingTask ? setEditTask({...editTask, description: e.target.value}) : setNewTask({...newTask, description: e.target.value})}
                rows={3}
                style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical' }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Tags:</strong></label>
              <div style={{ marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px', padding: '8px', minHeight: '40px', background: 'white' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                  {(editingTask ? editSelectedTags : selectedTags).map(tagId => {
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
                          onClick={() => editingTask ? setEditSelectedTags(editSelectedTags.filter(id => id !== tagId)) : setSelectedTags(selectedTags.filter(id => id !== tagId))}
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
                    const currentTags = editingTask ? editSelectedTags : selectedTags;
                    const setCurrentTags = editingTask ? setEditSelectedTags : setSelectedTags;
                    if (e.target.value && !currentTags.includes(e.target.value)) {
                      setCurrentTags([...currentTags, e.target.value]);
                    }
                    e.target.value = '';
                  }}
                  style={{ width: '100%', padding: '4px', border: 'none', outline: 'none' }}
                >
                  <option value="">Select tags...</option>
                  {tags.filter(tag => !(editingTask ? editSelectedTags : selectedTags).includes(tag._id)).map(tag => (
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
              <select
                value={editingTask ? editTask.status : (newTask.status || isCreatingTask)}
                onChange={(e) => editingTask ? setEditTask({...editTask, status: e.target.value}) : setNewTask({...newTask, status: e.target.value})}
                style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                {columns.map(column => (
                  <option key={column._id} value={column._id}>
                    {column.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Assignee:</strong></label>
              <select
                value={editingTask ? editTask.assignee : newTask.assignee}
                onChange={(e) => editingTask ? setEditTask({...editTask, assignee: e.target.value}) : setNewTask({...newTask, assignee: e.target.value})}
                style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="">No assignee</option>
                {team.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.username} ({member.email})
                  </option>
                ))}
              </select>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Due Date:</strong></label>
              <input
                type="date"
                value={editingTask ? editTask.dueDate : newTask.dueDate}
                onChange={(e) => editingTask ? setEditTask({...editTask, dueDate: e.target.value}) : setNewTask({...newTask, dueDate: e.target.value})}
                style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Priority:</strong></label>
              <select
                value={editingTask ? editTask.priority : newTask.priority}
                onChange={(e) => editingTask ? setEditTask({...editTask, priority: e.target.value}) : setNewTask({...newTask, priority: e.target.value})}
                style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="">No priority</option>
                {priorities.map(priority => (
                  <option key={priority._id} value={priority.name}>
                    {priority.name}
                  </option>
                ))}
              </select>
              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => {
                    const name = prompt('Enter new priority name:');
                    const color = prompt('Enter color (hex):') || '#007bff';
                    if (name) createPriority(name, color);
                  }}
                  style={{ 
                    marginTop: '5px', 
                    padding: '4px 8px', 
                    background: '#17a2b8', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  ➕ Add Priority
                </button>
              )}
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Subtasks:</strong></label>
              <div style={{ marginTop: '5px' }}>
                {(editingTask ? editTask.subtasks : newTask.subtasks || []).map(subtask => (
                  <div key={subtask.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', padding: '8px', background: '#f8f9fa', borderRadius: '4px' }}>
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() => toggleSubtask(subtask.id)}
                      style={{ cursor: 'pointer' }}
                    />
                    {editingSubtask === subtask.id ? (
                      <input
                        type="text"
                        value={subtask.text}
                        onChange={(e) => {
                          const currentSubtasks = editingTask ? editTask.subtasks : newTask.subtasks || [];
                          const updatedSubtasks = currentSubtasks.map(st => 
                            st.id === subtask.id ? {...st, text: e.target.value} : st
                          );
                          if (editingTask) {
                            setEditTask({...editTask, subtasks: updatedSubtasks});
                          } else {
                            setNewTask({...newTask, subtasks: updatedSubtasks});
                          }
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
                          textDecoration: subtask.completed ? 'line-through' : 'none', 
                          color: subtask.completed ? '#666' : 'inherit',
                          cursor: 'pointer'
                        }}
                        onDoubleClick={() => setEditingSubtask(subtask.id)}
                        title="Double-click to rename"
                      >
                        {subtask.text}
                      </span>
                    )}
                    <button
                      onClick={() => deleteSubtask(subtask.id)}
                      style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '12px' }}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <input
                    type="text"
                    placeholder="Add subtask..."
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSubtask()}
                    style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }}
                  />
                  <button
                    onClick={addSubtask}
                    style={{ padding: '6px 12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    ➕
                  </button>
                </div>
              </div>
            </div>
            
            {editingTask && (
              <div style={{ marginBottom: '15px' }}>
                <label><strong>Comments:</strong></label>
                <div style={{ marginTop: '5px', maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px', padding: '8px' }}>
                  {(taskComments[editingTask._id] || []).map(comment => (
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
                              onClick={() => deleteComment(editingTask._id, comment.id)}
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
                              onClick={() => updateComment(editingTask._id, comment.id)}
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
                  {(taskComments[editingTask._id] || []).length === 0 && (
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
                        addComment(editingTask._id);
                      }
                    }}
                    rows={2}
                    style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px', resize: 'vertical' }}
                  />
                  <button
                    onClick={() => addComment(editingTask._id)}
                    style={{ padding: '6px 12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    💬
                  </button>
                </div>
                <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                  Available users: {team.map(member => `@${member.username}`).join(', ')}
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  if (editingTask) {
                    setEditingTask(null);
                    setEditTask({ title: '', description: '', priority: '', assignee: '', dueDate: '', tags: '', status: '', subtasks: [] });
                    setEditSelectedTags([]);
                  } else {
                    setIsCreatingTask(null);
                    setNewTask({ title: '', description: '', priority: '', assignee: '', dueDate: '', tags: '', status: '', subtasks: [] });
                    setSelectedTags([]);
                  }
                }}
                style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => editingTask ? updateTask() : createTask(isCreatingTask)}
                disabled={editingTask ? !editTask.title.trim() : !newTask.title.trim()}
                style={{ 
                  padding: '8px 16px', 
                  background: (editingTask ? editTask.title.trim() : newTask.title.trim()) ? '#28a745' : '#ccc', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: (editingTask ? editTask.title.trim() : newTask.title.trim()) ? 'pointer' : 'not-allowed' 
                }}
              >
                {editingTask ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}