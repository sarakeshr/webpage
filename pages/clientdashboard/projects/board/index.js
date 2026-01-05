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
  const [subtasks, setSubtasks] = useState({});
  const [expandedTasks, setExpandedTasks] = useState({});
  const [isCreatingTask, setIsCreatingTask] = useState(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: '', assignee: '', dueDate: '', time: '', tags: '', status: '', subtasks: [], attachments: [] });
  const [editingTask, setEditingTask] = useState(null);
  const [editingSubtask, setEditingSubtask] = useState(null);
  const [editTask, setEditTask] = useState({ title: '', description: '', priority: '', assignee: '', dueDate: '', dueTime: '', tags: '', status: '', subtasks: [], attachments: [] });
  const [editSubtaskData, setEditSubtaskData] = useState({ title: '', description: '', priority: '', assignee: '', dueDate: '', tags: '', status: '', subtasks: [], attachments: [] });
  const [editSelectedTags, setEditSelectedTags] = useState([]);
  const [editSubtaskSelectedTags, setEditSubtaskSelectedTags] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [newSubtaskInput, setNewSubtaskInput] = useState('');
  const [newChecklistHeading, setNewChecklistHeading] = useState('');
  const [newItemForHeading, setNewItemForHeading] = useState({});
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
  const [showCompletionModal, setShowCompletionModal] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [scheduleReview, setScheduleReview] = useState(false);
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
    
    // Auto-refresh for real-time updates
    const refreshInterval = setInterval(() => {
      fetchTasks();
      fetchColumns();
    }, 5000); // Refresh every 5 seconds for all users
    
    const handleClickOutside = (event) => {
      if (showProfile && !event.target.closest('.profile-dropdown')) {
        setShowProfile(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      clearInterval(refreshInterval);
    };
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
      
      const response = await fetch(`/api/tasks?projectId=${projectId}&userId=${currentUser?._id}&userRole=${currentUser?.role}`);
      if (response.ok) {
        const data = await response.json();
        console.log('All tasks with subtasks:', data.map(t => ({id: t._id, title: t.title, subtasks: t.subtasks, parentTaskId: t.parentTaskId})));
        
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
      } else {
        console.error('Failed to fetch tasks:', response.status);
        if (response.status === 403) {
          alert('You do not have permission to view this project\'s tasks.');
        }
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
        await fetchTags(); // Refresh tags immediately
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
        fetchTasks(); // Refresh to get updated data
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
        fetchTasks(); // Refresh to get updated data
      }
    } catch (error) {
      console.error('Error deleting subtask:', error);
    }
  };

  const toggleSubtaskComplete = async (subtaskId, completed) => {
    await updateSubtask(subtaskId, { completed });
  };

  const toggleTaskExpanded = (taskId) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const getTaskProgress = (task) => {
    const visibleSubtasks = getVisibleSubtasks(task._id);
    if (visibleSubtasks.length === 0) return task.progress || 0;
    
    const completedCount = visibleSubtasks.filter(st => st.completed).length;
    return Math.round((completedCount / visibleSubtasks.length) * 100);
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
      
      const requestBody = {
        projectId: localStorage.getItem('selectedProjectId'),
        columnId: targetColumnId,
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        assignee: newTask.assignee || null,
        dueDate: newTask.dueDate || null,
        time: newTask.time || null,
        tags: selectedTags,
        subtasks: newTask.subtasks,
        attachments: newTask.attachments || [],
        createdBy: currentUser?._id
      };
      
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      const responseData = await response.json();
      
      if (response.ok) {
        // Create subtasks if any were added
        if (newTask.tempSubtasks && newTask.tempSubtasks.length > 0) {
          for (const subtask of newTask.tempSubtasks) {
            await createSubtask(responseData._id, { title: subtask.title });
          }
        }
        
        fetchTasks();
        setIsCreatingTask(null);
        setNewTask({ title: '', description: '', priority: '', assignee: '', dueDate: '', tags: '', status: '', subtasks: [], attachments: [], tempSubtasks: [] });
        setSelectedTags([]);
        setNewSubtaskInput('');
        setNewSubtask('');
        setNewChecklistHeading('');
        setNewItemForHeading({});
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const updateTask = async () => {
    try {
      console.log('=== UPDATE TASK DEBUG ===');
      console.log('editingTask:', editingTask);
      console.log('editTask:', editTask);
      console.log('editSelectedTags:', editSelectedTags);
      
      const requestBody = {
        taskId: editingTask._id,
        title: editTask.title,
        description: editTask.description,
        priority: editTask.priority,
        assignee: editTask.assignee || null,
        dueDate: editTask.dueDate || null,
        time: editTask.time || null,
        tags: editSelectedTags,
        subtasks: editTask.subtasks,
        attachments: editTask.attachments,
        columnId: editTask.status
      };
      
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);
      
      if (response.ok) {
        console.log('Task updated successfully');
        fetchTasks();
        setEditingTask(null);
        setEditTask({ title: '', description: '', priority: '', assignee: '', dueDate: '', tags: '', status: '', subtasks: [], attachments: [] });
        setEditSelectedTags([]);
      } else {
        console.error('Update failed:', responseData);
        alert('Failed to update task: ' + (responseData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Error updating task: ' + error.message);
    }
  };

  const openSubtaskEdit = (subtask) => {
    setEditingSubtask(subtask);
    setEditSubtaskData({
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
          title: editSubtaskData.title,
          description: editSubtaskData.description,
          priority: editSubtaskData.priority,
          assignee: editSubtaskData.assignee || null,
          dueDate: editSubtaskData.dueDate || null,
          tags: editSubtaskSelectedTags
        })
      });
      
      if (response.ok) {
        fetchTasks();
        setEditingSubtask(null);
        setEditSubtaskData({ title: '', description: '', priority: '', assignee: '', dueDate: '', tags: '', status: '', subtasks: [], attachments: [] });
        setEditSubtaskSelectedTags([]);
      }
    } catch (error) {
      console.error('Error updating subtask:', error);
    }
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
      time: task.time || (task.dueDate && task.dueDate.includes('T') ? task.dueDate.split('T')[1]?.substring(0, 5) : ''),
      status: task.columnId,
      subtasks: Array.isArray(task.subtasks) ? task.subtasks : (task.subtasks ? [task.subtasks] : []),
      attachments: Array.isArray(task.attachments) ? task.attachments : []
    });
    setEditSelectedTags(task.tags?.filter(tag => tag && tag._id).map(tag => tag._id) || []);
    fetchTaskComments(task._id);
    fetchTags(); // Refresh tags when opening modal
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    const subtask = {
      id: Date.now().toString(),
      text: newSubtask,
      completed: false,
      isHeading: false
    };
    if (editingTask) {
      setEditTask({...editTask, subtasks: [...editTask.subtasks, subtask]});
    } else {
      setNewTask({...newTask, subtasks: [...(newTask.subtasks || []), subtask]});
    }
    setNewSubtask('');
  };

  const addChecklistHeading = () => {
    if (!newChecklistHeading.trim()) return;
    const heading = {
      id: Date.now().toString(),
      text: newChecklistHeading,
      completed: false,
      isHeading: true
    };
    if (editingTask) {
      setEditTask({...editTask, subtasks: [...editTask.subtasks, heading]});
    } else {
      setNewTask({...newTask, subtasks: [...(newTask.subtasks || []), heading]});
    }
    setNewChecklistHeading('');
  };

  const addItemToHeading = (headingId) => {
    const itemText = newItemForHeading[headingId];
    if (!itemText?.trim()) return;
    
    const currentSubtasks = editingTask ? editTask.subtasks : newTask.subtasks || [];
    const headingIndex = currentSubtasks.findIndex(st => st.id === headingId);
    if (headingIndex === -1) return;
    
    const newItem = {
      id: Date.now().toString(),
      text: itemText,
      completed: false,
      isHeading: false,
      parentHeading: headingId
    };
    
    const updatedSubtasks = [...currentSubtasks];
    updatedSubtasks.splice(headingIndex + 1, 0, newItem);
    
    if (editingTask) {
      setEditTask({...editTask, subtasks: updatedSubtasks});
    } else {
      setNewTask({...newTask, subtasks: updatedSubtasks});
    }
    setNewItemForHeading({...newItemForHeading, [headingId]: ''});
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

  const removeSubtaskFromChecklist = (subtaskId) => {
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
      
      // Check if task is being moved to completion
      const updatedTask = { ...draggedTask, columnId: targetColumn._id };
      handleTaskCompletion(updatedTask);
      
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

  const handleTaskCompletion = async (task) => {
    // Check if task is being moved to a "Completed" column
    const completedColumn = columns.find(col => 
      col.name.toLowerCase().includes('complete') || 
      col.name.toLowerCase().includes('done')
    );
    
    if (completedColumn && task.columnId === completedColumn._id) {
      setShowCompletionModal(task);
      await fetchAvailableSlots(task.projectId);
    }
  };

  const fetchAvailableSlots = async (projectId) => {
    try {
      const response = await fetch(`/api/available-slots?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data.availableSlots);
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
    }
  };

  const completeTask = async () => {
    try {
      const response = await fetch('/api/task-completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: showCompletionModal._id,
          userId: currentUser._id,
          scheduleReviewMeeting: scheduleReview,
          meetingTime: selectedSlot
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        fetchTasks();
        setShowCompletionModal(null);
        setScheduleReview(false);
        setSelectedSlot('');
        
        if (data.meetingId) {
          alert(`Task completed! Review meeting scheduled. Meeting ID: ${data.meetingId}`);
        } else {
          alert('Task completed successfully!');
        }
      }
    } catch (error) {
      console.error('Error completing task:', error);
    }
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
        <button 
          onClick={() => router.push(`/${currentUser?.role === 'project_manager' ? 'projectmanagerdashboard' : currentUser?.role === 'developer' ? 'developerdashboard' : currentUser?.role === 'tester' ? 'testerdashboard' : currentUser?.role === 'crm' ? 'crmdashboard' : currentUser?.role === 'client' ? 'clientdashboard' : currentUser?.role === 'director' ? 'directordashboard' : 'admindashboard'}/projects/view`)}
          style={{ marginBottom: '20px', padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          ← Back to Project
        </button>

        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0 }}>📋 Kanban Board</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => router.push(`/${currentUser?.role === 'project_manager' ? 'projectmanagerdashboard' : currentUser?.role === 'developer' ? 'developerdashboard' : currentUser?.role === 'tester' ? 'testerdashboard' : currentUser?.role === 'crm' ? 'crmdashboard' : currentUser?.role === 'client' ? 'clientdashboard' : currentUser?.role === 'director' ? 'directordashboard' : 'admindashboard'}/projects/board/lists`)}
                style={{ padding: '8px 16px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                📝 Lists
              </button>
              {canEdit && (
                <button
                  onClick={() => router.push(`/${currentUser?.role === 'project_manager' ? 'projectmanagerdashboard' : currentUser?.role === 'developer' ? 'developerdashboard' : currentUser?.role === 'tester' ? 'testerdashboard' : currentUser?.role === 'crm' ? 'crmdashboard' : currentUser?.role === 'client' ? 'clientdashboard' : currentUser?.role === 'director' ? 'directordashboard' : 'admindashboard'}/projects/board/trash`)}
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
                      draggable={true}
                      onDragStart={(e) => handleTaskDragStart(e, task)}
                      onClick={() => openEditTask(task)}
                      style={{
                        background: task.completed ? '#f8f9fa' : '#fff',
                        border: task.completed ? '1px solid #28a745' : '1px solid #e1e5e9',
                        borderRadius: '6px',
                        padding: '12px',
                        marginBottom: '8px',
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        transition: 'all 0.2s ease',
                        opacity: draggedTask?._id === task._id ? 0.5 : (task.completed ? 0.8 : 1),
                        transform: draggedTask?._id === task._id ? 'rotate(2deg)' : 'none',
                        position: 'relative'
                      }}>
                      {task.completed && (
                        <div style={{ 
                          position: 'absolute', 
                          top: '8px', 
                          right: '8px', 
                          background: '#28a745', 
                          color: 'white', 
                          borderRadius: '50%', 
                          width: '20px', 
                          height: '20px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontSize: '12px' 
                        }}>
                          ✓
                        </div>
                      )}
                      <div style={{ fontWeight: '500', marginBottom: '6px', fontSize: '14px', textDecoration: task.completed ? 'line-through' : 'none' }}>
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
                                {task.time && (
                                  <span style={{ marginLeft: '4px' }}>
                                    🕐 {task.time}
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {/* Tick button for assigned users or project managers */}
                            {(task.assignee?._id === currentUser?._id || canEdit) && !task.completed && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowCompletionModal(task);
                                  fetchAvailableSlots(task.projectId);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  opacity: 0.7,
                                  color: '#28a745'
                                }}
                                title="Mark as complete"
                              >
                                ✅
                              </button>
                            )}
                            {canEdit && (
                              <>
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
                              </>
                            )}
                          </div>
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {getVisibleSubtasks(task._id).length > 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ 
                                  width: '40px', 
                                  height: '6px', 
                                  background: '#e9ecef', 
                                  borderRadius: '3px',
                                  overflow: 'hidden'
                                }}>
                                  <div style={{
                                    width: `${getTaskProgress(task)}%`,
                                    height: '100%',
                                    background: getTaskProgress(task) === 100 ? '#28a745' : '#007bff',
                                    transition: 'width 0.3s ease'
                                  }} />
                                </div>
                                <span style={{ fontSize: '10px', color: '#666' }}>
                                  {getVisibleSubtasks(task._id).filter(st => st.completed).length}/{getVisibleSubtasks(task._id).length}
                                </span>
                              </div>
                            )}
                            {canEdit && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const title = prompt('Create subtask:');
                                  if (title) {
                                    createSubtask(task._id, { title });
                                  }
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '10px',
                                  color: '#007bff',
                                  opacity: 0.7
                                }}
                                title="Add subtask"
                              >
                                +
                              </button>
                            )}
                            {getVisibleSubtasks(task._id).length > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTaskExpanded(task._id);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  color: '#666'
                                }}
                              >
                                {expandedTasks[task._id] ? '▼' : '▶'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {expandedTasks[task._id] && getVisibleSubtasks(task._id).length > 0 && (
                        <div style={{ marginTop: '8px', paddingLeft: '12px', borderLeft: '2px solid #e9ecef' }}>
                          {getVisibleSubtasks(task._id).map(subtask => (
                            <div key={subtask._id} style={{
                              background: '#f8f9fa',
                              border: '1px solid #e9ecef',
                              borderRadius: '4px',
                              padding: '8px',
                              marginBottom: '4px',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <input
                                type="checkbox"
                                checked={subtask.completed || false}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleSubtaskComplete(subtask._id, e.target.checked);
                                }}
                                disabled={!canInteractWithSubtask(subtask)}
                                style={{ cursor: canInteractWithSubtask(subtask) ? 'pointer' : 'not-allowed' }}
                              />
                              <span style={{ 
                                flex: 1,
                                textDecoration: subtask.completed ? 'line-through' : 'none',
                                color: subtask.completed ? '#666' : 'inherit',
                                cursor: canInteractWithSubtask(subtask) ? 'pointer' : 'default'
                              }}
                              onClick={(e) => {
                                if (canInteractWithSubtask(subtask)) {
                                  e.stopPropagation();
                                  openSubtaskEdit(subtask);
                                }
                              }}
                              >
                                {subtask.title}
                              </span>
                              {canEdit && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteSubtask(subtask._id);
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
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {canEdit && (
                    <button
                      onClick={() => {
                        fetchTags(); // Refresh tags when opening create modal
                        setIsCreatingTask(column._id);
                      }}
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
        <div 
          style={{
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
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsCreatingColumn(false);
              setNewColumn({ name: '', color: '#007bff' });
            }
          }}
        >
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
        <div 
          style={{
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
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              if (editingTask) {
                setEditingTask(null);
                setEditTask({ title: '', description: '', priority: '', assignee: '', dueDate: '', tags: '', status: '', subtasks: [], attachments: [] });
                setEditSelectedTags([]);
                setNewItemForHeading({});
              } else {
                setIsCreatingTask(null);
                setNewTask({ title: '', description: '', priority: '', assignee: '', dueDate: '', tags: '', status: '', subtasks: [], attachments: [], tempSubtasks: [] });
                setSelectedTags([]);
                setNewSubtaskInput('');
                setNewSubtask('');
                setNewChecklistHeading('');
                setNewItemForHeading({});
              }
            }
          }}
        >
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90vw',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3>{editingTask ? (canEdit ? '✏️ Edit Task' : '👁️ View Task') : '➕ Create New Task'}</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Task Title:</strong></label>
              {canEdit && editingTask ? (
                <input
                  type="text"
                  placeholder="Enter task title"
                  value={editTask.title}
                  onChange={(e) => setEditTask({...editTask, title: e.target.value})}
                  style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              ) : canEdit ? (
                <input
                  type="text"
                  placeholder="Enter task title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              ) : (
                <div style={{ padding: '8px', marginTop: '5px', background: '#f8f9fa', borderRadius: '4px' }}>
                  {editingTask?.title}
                </div>
              )}
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Description:</strong></label>
              {canEdit ? (
                <textarea
                  placeholder="Enter task description"
                  value={editingTask ? editTask.description : newTask.description}
                  onChange={(e) => editingTask ? setEditTask({...editTask, description: e.target.value}) : setNewTask({...newTask, description: e.target.value})}
                  rows={3}
                  style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical' }}
                />
              ) : (
                <div style={{ padding: '8px', marginTop: '5px', background: '#f8f9fa', borderRadius: '4px', minHeight: '60px' }}>
                  {editingTask?.description || 'No description'}
                </div>
              )}
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Tags:</strong></label>
              <select
                onChange={(e) => {
                  const currentTags = editingTask ? editSelectedTags : selectedTags;
                  const setCurrentTags = editingTask ? setEditSelectedTags : setSelectedTags;
                  if (e.target.value) {
                    if (currentTags.includes(e.target.value)) {
                      alert('This tag is already added!');
                    } else {
                      setCurrentTags([...currentTags, e.target.value]);
                    }
                  }
                  e.target.value = '';
                }}
                style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="">Select tags...</option>
                {tags.map(tag => (
                  <option key={tag._id} value={tag._id}>
                    {tag.name}
                  </option>
                ))}
              </select>
              
              <button
                onClick={() => {
                  const name = prompt('Enter new tag name:');
                  const color = prompt('Enter color (hex):') || '#6c757d';
                  if (name) createTag(name, color);
                }}
                style={{ 
                  marginTop: '8px', 
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
              
              {/* Selected Tags Toolbar */}
              {(editingTask ? editSelectedTags : selectedTags).length > 0 && (
                <div style={{ 
                  marginTop: '10px', 
                  padding: '8px', 
                  background: '#f8f9fa', 
                  border: '1px solid #e9ecef', 
                  borderRadius: '4px' 
                }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px', fontWeight: 'bold' }}>Selected Tags:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(editingTask ? editSelectedTags : selectedTags).map(tagId => {
                      const tag = tags.find(t => t._id === tagId);
                      return tag ? (
                        <div key={tagId} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          background: tag.color,
                          color: 'white',
                          border: '1px solid rgba(255,255,255,0.3)'
                        }}>
                          <span>{tag.name}</span>
                          <button
                            onClick={() => editingTask ? setEditSelectedTags(editSelectedTags.filter(id => id !== tagId)) : setSelectedTags(selectedTags.filter(id => id !== tagId))}
                            style={{ 
                              background: 'rgba(255,255,255,0.3)', 
                              border: 'none', 
                              color: 'white', 
                              cursor: 'pointer', 
                              fontSize: '10px',
                              borderRadius: '50%',
                              width: '16px',
                              height: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
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
              <label><strong>Time:</strong></label>
              <input
                type="time"
                value={editingTask ? editTask.time : newTask.time}
                onChange={(e) => editingTask ? setEditTask({...editTask, time: e.target.value}) : setNewTask({...newTask, time: e.target.value})}
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
              <label><strong>Attachments:</strong></label>
              <div style={{ marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px', padding: '8px', minHeight: '40px', background: 'white' }}>
                {(editingTask ? editTask.attachments : newTask.attachments || []).map((attachment, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', padding: '8px', background: '#f8f9fa', borderRadius: '4px' }}>
                    <span style={{ fontSize: '12px', flex: 1 }}>
                      📎 {attachment.originalName} ({(attachment.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                    <button
                      onClick={() => {
                        const currentAttachments = editingTask ? editTask.attachments : newTask.attachments || [];
                        const updatedAttachments = currentAttachments.filter((_, i) => i !== index);
                        if (editingTask) {
                          setEditTask({...editTask, attachments: updatedAttachments});
                        } else {
                          setNewTask({...newTask, attachments: updatedAttachments});
                        }
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
                    const currentAttachments = editingTask ? editTask.attachments : newTask.attachments || [];
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
                    
                    if (editingTask) {
                      setEditTask({...editTask, attachments: [...currentAttachments, ...newAttachments]});
                    } else {
                      setNewTask({...newTask, attachments: [...currentAttachments, ...newAttachments]});
                    }
                  }}
                  style={{ width: '100%', padding: '4px', fontSize: '12px' }}
                />
                <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                  Maximum total size: 5GB
                </div>
              </div>
            </div>
            
            
            {canEdit && !editingTask && (
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Subtasks:</strong></label>
              <div style={{ marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px', padding: '8px' }}>
                {newTask.tempSubtasks && newTask.tempSubtasks.length > 0 ? (
                  newTask.tempSubtasks.map(subtask => (
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
                          setNewTask({
                            ...newTask,
                            tempSubtasks: newTask.tempSubtasks.map(st => 
                              st.id === subtask.id ? {...st, completed: e.target.checked} : st
                            )
                          });
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{
                        flex: 1,
                        textDecoration: subtask.completed ? 'line-through' : 'none',
                        color: subtask.completed ? '#666' : 'inherit',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        const tempSubtask = {
                          _id: subtask.id,
                          title: subtask.title,
                          description: '',
                          priority: '',
                          assignee: null,
                          dueDate: null,
                          tags: [],
                          completed: subtask.completed || false
                        };
                        openSubtaskEdit(tempSubtask);
                      }}
                      >
                        {subtask.title}
                      </span>
                      <button
                        onClick={() => {
                          setNewTask({
                            ...newTask,
                            tempSubtasks: newTask.tempSubtasks.filter(st => st.id !== subtask.id)
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
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#666', fontSize: '12px', textAlign: 'center', padding: '10px' }}>
                    No subtasks yet
                  </div>
                )}
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
                        setNewTask({...newTask, tempSubtasks: [...(newTask.tempSubtasks || []), newSubtaskItem]});
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
                        setNewTask({...newTask, tempSubtasks: [...(newTask.tempSubtasks || []), newSubtaskItem]});
                        setNewSubtaskInput('');
                      }
                    }}
                    style={{ padding: '6px 12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>
            )}
            
            {canEdit && !editingTask && (
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Checklist:</strong></label>
              <div style={{ marginTop: '5px' }}>
                {(newTask.subtasks || []).map((subtask, index) => (
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
                      <button
                        onClick={() => removeSubtaskFromChecklist(subtask.id)}
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
            )}
            
            
            {canEdit && editingTask && (
              <div style={{ marginBottom: '15px' }}>
                <label><strong>Subtasks:</strong></label>
                <div style={{ marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px', padding: '8px' }}>
                  {getVisibleSubtasks(editingTask._id).length > 0 ? (
                    getVisibleSubtasks(editingTask._id).map(subtask => (
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
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{
                          flex: 1,
                          textDecoration: subtask.completed ? 'line-through' : 'none',
                          color: subtask.completed ? '#666' : 'inherit',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                        onClick={() => openSubtaskEdit(subtask)}
                        >
                          {subtask.title}
                        </span>
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
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#666', fontSize: '12px', textAlign: 'center', padding: '10px' }}>
                      No subtasks yet
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <input
                      type="text"
                      placeholder="Add subtask..."
                      value={newSubtaskInput}
                      onChange={(e) => setNewSubtaskInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && newSubtaskInput.trim()) {
                          createSubtask(editingTask._id, { title: newSubtaskInput });
                          setNewSubtaskInput('');
                        }
                      }}
                      style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }}
                    />
                    <button
                      onClick={() => {
                        if (newSubtaskInput.trim()) {
                          createSubtask(editingTask._id, { title: newSubtaskInput });
                          setNewSubtaskInput('');
                        }
                      }}
                      style={{ padding: '6px 12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {canEdit && editingTask && (
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Checklist:</strong></label>
              <div style={{ marginTop: '5px' }}>
                {(editTask.subtasks || []).map((subtask, index) => (
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
                      <button
                        onClick={() => removeSubtaskFromChecklist(subtask.id)}
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
            )}
            
            {!canEdit && editingTask && getVisibleSubtasks(editingTask._id).length > 0 && (
              <div style={{ marginBottom: '15px' }}>
                <label><strong>Subtasks:</strong></label>
                <div style={{ marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px', padding: '8px' }}>
                  {getVisibleSubtasks(editingTask._id).map(subtask => (
                    <div key={subtask._id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px',
                      background: '#f8f9fa',
                      borderRadius: '4px',
                      marginBottom: '4px'
                    }}>
                      <span style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: subtask.completed ? '#28a745' : '#e9ecef',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        color: 'white'
                      }}>
                        {subtask.completed ? '✓' : ''}
                      </span>
                      <span style={{
                        flex: 1,
                        textDecoration: subtask.completed ? 'line-through' : 'none',
                        color: subtask.completed ? '#666' : 'inherit',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                      onClick={() => openSubtaskEdit(subtask)}
                      >
                        {subtask.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
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
                    setEditTask({ title: '', description: '', priority: '', assignee: '', dueDate: '', tags: '', status: '', subtasks: [], attachments: [] });
                    setEditSelectedTags([]);
                    setNewItemForHeading({});
                  } else {
                    setIsCreatingTask(null);
                    setNewTask({ title: '', description: '', priority: '', assignee: '', dueDate: '', tags: '', status: '', subtasks: [], attachments: [], tempSubtasks: [] });
                    setSelectedTags([]);
                    setNewSubtaskInput('');
                    setNewSubtask('');
                    setNewChecklistHeading('');
                    setNewItemForHeading({});
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
                  cursor: (editingTask ? editTask.title.trim() : newTask.title.trim()) ? 'pointer' : 'not-allowed',
                  display: canEdit ? 'block' : 'none'
                }}
              >
                {editingTask ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingSubtask && (
        <div 
          style={{
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
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEditingSubtask(null);
              setEditSubtaskData({ title: '', description: '', priority: '', assignee: '', dueDate: '', tags: '', status: '', subtasks: [], attachments: [] });
              setEditSubtaskSelectedTags([]);
            }
          }}
        >
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
                  value={editSubtaskData.title}
                  onChange={(e) => setEditSubtaskData({...editSubtaskData, title: e.target.value})}
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
                  value={editSubtaskData.description}
                  onChange={(e) => setEditSubtaskData({...editSubtaskData, description: e.target.value})}
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
                  value={editSubtaskData.assignee}
                  onChange={(e) => setEditSubtaskData({...editSubtaskData, assignee: e.target.value})}
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
                  value={editSubtaskData.dueDate}
                  onChange={(e) => setEditSubtaskData({...editSubtaskData, dueDate: e.target.value})}
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
                  value={editSubtaskData.priority}
                  onChange={(e) => setEditSubtaskData({...editSubtaskData, priority: e.target.value})}
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
                {(editSubtaskData.attachments || []).map((attachment, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', padding: '8px', background: '#f8f9fa', borderRadius: '4px' }}>
                    <span style={{ fontSize: '12px', flex: 1 }}>
                      📎 {attachment.originalName} ({(attachment.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                    {canEdit && (
                      <button
                        onClick={() => {
                          const updatedAttachments = editSubtaskData.attachments.filter((_, i) => i !== index);
                          setEditSubtaskData({...editSubtaskData, attachments: updatedAttachments});
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
                      const currentAttachments = editSubtaskData.attachments || [];
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
                      
                      setEditSubtaskData({...editSubtaskData, attachments: [...currentAttachments, ...newAttachments]});
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
                {(editSubtaskData.subtasks || []).length > 0 ? (
                  editSubtaskData.subtasks.map(subtask => (
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
                          setEditSubtaskData({
                            ...editSubtaskData,
                            subtasks: editSubtaskData.subtasks.map(st => 
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
                            setEditSubtaskData({
                              ...editSubtaskData,
                              subtasks: editSubtaskData.subtasks.filter(st => st.id !== subtask.id)
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
                          setEditSubtaskData({...editSubtaskData, subtasks: [...(editSubtaskData.subtasks || []), newSubtaskItem]});
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
                          setEditSubtaskData({...editSubtaskData, subtasks: [...(editSubtaskData.subtasks || []), newSubtaskItem]});
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
                {(editSubtaskData.checklist || []).map((item, index) => (
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
                              setEditSubtaskData({
                                ...editSubtaskData,
                                checklist: editSubtaskData.checklist.map(ci => 
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
                            setEditSubtaskData({
                              ...editSubtaskData,
                              checklist: editSubtaskData.checklist.filter(ci => ci.id !== item.id)
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
                              const currentChecklist = editSubtaskData.checklist || [];
                              const headingIndex = currentChecklist.findIndex(ci => ci.id === item.id);
                              const updatedChecklist = [...currentChecklist];
                              updatedChecklist.splice(headingIndex + 1, 0, newItem);
                              setEditSubtaskData({...editSubtaskData, checklist: updatedChecklist});
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
                              const currentChecklist = editSubtaskData.checklist || [];
                              const headingIndex = currentChecklist.findIndex(ci => ci.id === item.id);
                              const updatedChecklist = [...currentChecklist];
                              updatedChecklist.splice(headingIndex + 1, 0, newItem);
                              setEditSubtaskData({...editSubtaskData, checklist: updatedChecklist});
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
                            setEditSubtaskData({...editSubtaskData, checklist: [...(editSubtaskData.checklist || []), heading]});
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
                            setEditSubtaskData({...editSubtaskData, checklist: [...(editSubtaskData.checklist || []), heading]});
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
                            setEditSubtaskData({...editSubtaskData, checklist: [...(editSubtaskData.checklist || []), item]});
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
                            setEditSubtaskData({...editSubtaskData, checklist: [...(editSubtaskData.checklist || []), item]});
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
                  setEditSubtaskData({ title: '', description: '', priority: '', assignee: '', dueDate: '', tags: '', status: '', subtasks: [], attachments: [] });
                  setEditSubtaskSelectedTags([]);
                }}
                style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              {canEdit && (
                <button
                  onClick={updateSubtaskData}
                  disabled={!editSubtaskData.title.trim()}
                  style={{ 
                    padding: '8px 16px', 
                    background: editSubtaskData.title.trim() ? '#28a745' : '#ccc', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: editSubtaskData.title.trim() ? 'pointer' : 'not-allowed' 
                  }}
                >
                  Update Subtask
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showCompletionModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1002
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCompletionModal(null);
              setScheduleReview(false);
              setSelectedSlot('');
            }
          }}
        >
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90vw'
          }}>
            <h3>✅ Task Completed!</h3>
            <p><strong>{showCompletionModal.title}</strong> has been marked as completed.</p>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={scheduleReview}
                  onChange={(e) => setScheduleReview(e.target.checked)}
                />
                <span>Schedule a review meeting?</span>
              </label>
            </div>
            
            {scheduleReview && (
              <div style={{ marginBottom: '15px' }}>
                <label><strong>Available Time Slots:</strong></label>
                <select
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                  style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="">Select a time slot...</option>
                  {availableSlots.map((slot, index) => (
                    <option key={index} value={slot.time}>
                      {slot.display}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowCompletionModal(null);
                  setScheduleReview(false);
                  setSelectedSlot('');
                }}
                style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={completeTask}
                disabled={scheduleReview && !selectedSlot}
                style={{ 
                  padding: '8px 16px', 
                  background: (scheduleReview && !selectedSlot) ? '#ccc' : '#28a745', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: (scheduleReview && !selectedSlot) ? 'not-allowed' : 'pointer'
                }}
              >
                {scheduleReview ? 'Complete & Schedule Meeting' : 'Complete Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}