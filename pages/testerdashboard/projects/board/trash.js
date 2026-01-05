import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function TrashPage() {
  const [deletedTasks, setDeletedTasks] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    fetchDeletedTasks();
  }, []);

  const fetchDeletedTasks = async () => {
    try {
      const projectId = localStorage.getItem('selectedProjectId');
      if (!projectId) return;
      
      const response = await fetch(`/api/tasks?projectId=${projectId}&deleted=true`);
      if (response.ok) {
        const data = await response.json();
        setDeletedTasks(data);
      }
    } catch (error) {
      console.error('Error fetching deleted tasks:', error);
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
        fetchDeletedTasks();
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
        fetchDeletedTasks();
      }
    } catch (error) {
      console.error('Error permanently deleting task:', error);
    }
  };

  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'project_manager';

  return (
    <div>
      <nav style={{ background: '#343a40', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>🗑️ Trash</h1>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link href="/projectmanagerdashboard/projects" style={{ color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '4px' }}>Projects</Link>
          <Link href="/projectmanagerdashboard/projects/board" style={{ color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '4px' }}>Board</Link>
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
          <h2 style={{ margin: '0 0 20px 0' }}>🗑️ Deleted Tasks</h2>
          
          {deletedTasks.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center', marginTop: '50px' }}>No deleted tasks</p>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {deletedTasks.map(task => (
                <div key={task._id} style={{
                  background: '#f8f9fa',
                  border: '1px solid #e1e5e9',
                  borderRadius: '6px',
                  padding: '15px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: '500', marginBottom: '8px', fontSize: '16px' }}>{task.title}</div>
                    {task.description && (
                      <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>{task.description}</div>
                    )}
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      Deleted: {new Date(task.deletedAt).toLocaleString()}
                    </div>
                  </div>
                  {canEdit && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => restoreTask(task._id)}
                        style={{ padding: '8px 16px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        ↩️ Restore
                      </button>
                      <button
                        onClick={() => permanentDeleteTask(task._id)}
                        style={{ padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        🗑️ Delete Forever
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}