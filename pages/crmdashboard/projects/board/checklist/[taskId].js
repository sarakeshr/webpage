import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function ChecklistTasks() {
  const [task, setTask] = useState(null);
  const [checklists, setChecklists] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [isCreatingChecklist, setIsCreatingChecklist] = useState(false);
  const [newChecklist, setNewChecklist] = useState({ title: '', description: '', priority: 'Medium', assignee: '', dueDate: '' });
  const [editingChecklist, setEditingChecklist] = useState(null);
  const [editChecklist, setEditChecklist] = useState({ title: '', description: '', priority: 'Medium', assignee: '', dueDate: '' });
  const [team, setTeam] = useState([]);
  const router = useRouter();
  const { taskId } = router.query;

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    
    if (taskId) {
      fetchTask();
      fetchChecklists();
      fetchTeam();
    }
    
    const handleClickOutside = (event) => {
      if (showProfile && !event.target.closest('.profile-dropdown')) {
        setShowProfile(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [taskId, showProfile]);

  const fetchTask = async () => {
    try {
      const projectId = localStorage.getItem('selectedProjectId');
      const response = await fetch(`/api/tasks?projectId=${projectId}`);
      if (response.ok) {
        const tasks = await response.json();
        const currentTask = tasks.find(t => t._id === taskId);
        setTask(currentTask);
      }
    } catch (error) {
      console.error('Error fetching task:', error);
    }
  };

  const fetchChecklists = async () => {
    try {
      const response = await fetch(`/api/checklists?taskId=${taskId}`);
      if (response.ok) {
        const data = await response.json();
        setChecklists(data);
      }
    } catch (error) {
      console.error('Error fetching checklists:', error);
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

  const createChecklist = async () => {
    try {
      const response = await fetch('/api/checklists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          projectId: localStorage.getItem('selectedProjectId'),
          title: newChecklist.title,
          description: newChecklist.description,
          priority: newChecklist.priority,
          assignee: newChecklist.assignee || null,
          dueDate: newChecklist.dueDate || null,
          createdBy: currentUser?._id
        })
      });
      
      if (response.ok) {
        fetchChecklists();
        setIsCreatingChecklist(false);
        setNewChecklist({ title: '', description: '', priority: 'Medium', assignee: '', dueDate: '' });
      }
    } catch (error) {
      console.error('Error creating checklist:', error);
    }
  };

  const updateChecklist = async () => {
    try {
      const response = await fetch('/api/checklists', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingChecklist._id,
          title: editChecklist.title,
          description: editChecklist.description,
          priority: editChecklist.priority,
          assignee: editChecklist.assignee || null,
          dueDate: editChecklist.dueDate || null
        })
      });
      
      if (response.ok) {
        fetchChecklists();
        setEditingChecklist(null);
        setEditChecklist({ title: '', description: '', priority: 'Medium', assignee: '', dueDate: '' });
      }
    } catch (error) {
      console.error('Error updating checklist:', error);
    }
  };

  const toggleChecklistComplete = async (checklistId, completed) => {
    try {
      const response = await fetch('/api/checklists', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: checklistId,
          completed
        })
      });
      
      if (response.ok) {
        fetchChecklists();
      }
    } catch (error) {
      console.error('Error updating checklist:', error);
    }
  };

  const deleteChecklist = async (checklistId) => {
    if (!confirm('Delete this checklist item?')) return;
    
    try {
      const response = await fetch('/api/checklists', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: checklistId })
      });
      
      if (response.ok) {
        fetchChecklists();
      }
    } catch (error) {
      console.error('Error deleting checklist:', error);
    }
  };

  const openEditChecklist = (checklist) => {
    setEditingChecklist(checklist);
    setEditChecklist({
      title: checklist.title,
      description: checklist.description || '',
      priority: checklist.priority || 'Medium',
      assignee: checklist.assignee?._id || '',
      dueDate: checklist.dueDate ? checklist.dueDate.split('T')[0] : ''
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'project_manager';

  if (!task) {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

  return (
    <div>
      <nav style={{ background: '#343a40', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>{currentUser?.role ? `${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1).replace('_', ' ')} Dashboard` : 'Dashboard'}</h1>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link href="/projectmanagerdashboard/projects" style={{ color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '4px' }}>Projects</Link>
          <Link href="/projectmanagerdashboard/projects/board" style={{ color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '4px' }}>Board</Link>
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
          onClick={() => router.push('/projectmanagerdashboard/projects/board')}
          style={{ marginBottom: '20px', padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          ← Back to Board
        </button>

        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ margin: 0 }}>📋 Checklist Tasks</h2>
              <p style={{ margin: '5px 0 0 0', color: '#666' }}>Task: {task.title}</p>
            </div>
            {canEdit && (
              <button
                onClick={() => setIsCreatingChecklist(true)}
                style={{ padding: '8px 16px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                ➕ Add Task
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {checklists.map(checklist => (
              <div key={checklist._id} style={{
                background: '#f8f9fa',
                border: '1px solid #e1e5e9',
                borderRadius: '6px',
                padding: '15px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <input
                  type="checkbox"
                  checked={checklist.completed || false}
                  onChange={(e) => toggleChecklistComplete(checklist._id, e.target.checked)}
                  style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: '500', 
                    marginBottom: '4px',
                    textDecoration: checklist.completed ? 'line-through' : 'none',
                    color: checklist.completed ? '#666' : 'inherit'
                  }}>
                    {checklist.title}
                  </div>
                  {checklist.description && (
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>
                      {checklist.description}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '12px' }}>
                    {checklist.priority && (
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '12px',
                        background: checklist.priority === 'High' ? '#dc3545' : 
                                   checklist.priority === 'Medium' ? '#ffc107' : '#28a745',
                        color: 'white'
                      }}>
                        {checklist.priority}
                      </span>
                    )}
                    {checklist.assignee && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: '#007bff',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '8px',
                          fontWeight: 'bold'
                        }}>
                          {checklist.assignee?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span>{checklist.assignee?.username}</span>
                      </div>
                    )}
                    {checklist.dueDate && (
                      <span style={{
                        color: new Date(checklist.dueDate) < new Date() ? '#dc3545' : '#666',
                        fontWeight: new Date(checklist.dueDate) < new Date() ? 'bold' : 'normal'
                      }}>
                        📅 {new Date(checklist.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                {canEdit && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => openEditChecklist(checklist)}
                      style={{
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => deleteChecklist(checklist._id)}
                      style={{
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
            
            {checklists.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <p>No checklist tasks yet</p>
                {canEdit && (
                  <p style={{ fontSize: '14px' }}>Click "Add Task" to create your first checklist item</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {(isCreatingChecklist || editingChecklist) && (
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
            <h3>{editingChecklist ? '✏️ Edit Checklist Task' : '➕ Create Checklist Task'}</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Task Title:</strong></label>
              <input
                type="text"
                placeholder="Enter task title"
                value={editingChecklist ? editChecklist.title : newChecklist.title}
                onChange={(e) => editingChecklist ? 
                  setEditChecklist({...editChecklist, title: e.target.value}) : 
                  setNewChecklist({...newChecklist, title: e.target.value})
                }
                style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Description:</strong></label>
              <textarea
                placeholder="Enter task description"
                value={editingChecklist ? editChecklist.description : newChecklist.description}
                onChange={(e) => editingChecklist ? 
                  setEditChecklist({...editChecklist, description: e.target.value}) : 
                  setNewChecklist({...newChecklist, description: e.target.value})
                }
                rows={3}
                style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical' }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Priority:</strong></label>
              <select
                value={editingChecklist ? editChecklist.priority : newChecklist.priority}
                onChange={(e) => editingChecklist ? 
                  setEditChecklist({...editChecklist, priority: e.target.value}) : 
                  setNewChecklist({...newChecklist, priority: e.target.value})
                }
                style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label><strong>Assignee:</strong></label>
              <select
                value={editingChecklist ? editChecklist.assignee : newChecklist.assignee}
                onChange={(e) => editingChecklist ? 
                  setEditChecklist({...editChecklist, assignee: e.target.value}) : 
                  setNewChecklist({...newChecklist, assignee: e.target.value})
                }
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
                value={editingChecklist ? editChecklist.dueDate : newChecklist.dueDate}
                onChange={(e) => editingChecklist ? 
                  setEditChecklist({...editChecklist, dueDate: e.target.value}) : 
                  setNewChecklist({...newChecklist, dueDate: e.target.value})
                }
                style={{ width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  if (editingChecklist) {
                    setEditingChecklist(null);
                    setEditChecklist({ title: '', description: '', priority: 'Medium', assignee: '', dueDate: '' });
                  } else {
                    setIsCreatingChecklist(false);
                    setNewChecklist({ title: '', description: '', priority: 'Medium', assignee: '', dueDate: '' });
                  }
                }}
                style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => editingChecklist ? updateChecklist() : createChecklist()}
                disabled={editingChecklist ? !editChecklist.title.trim() : !newChecklist.title.trim()}
                style={{ 
                  padding: '8px 16px', 
                  background: (editingChecklist ? editChecklist.title.trim() : newChecklist.title.trim()) ? '#28a745' : '#ccc', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: (editingChecklist ? editChecklist.title.trim() : newChecklist.title.trim()) ? 'pointer' : 'not-allowed' 
                }}
              >
                {editingChecklist ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}