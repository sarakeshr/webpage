import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import NotificationBell from '../../../components/NotificationBell';

export default function AdminProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/admin/projects');
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId) => {
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        const response = await fetch(`/api/admin/projects?id=${projectId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchProjects();
        }
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Planning': return { bg: '#e9ecef', color: '#495057' };
      case 'In Progress': return { bg: '#cce5ff', color: '#004085' };
      case 'Testing': return { bg: '#fff3cd', color: '#856404' };
      case 'Completed': return { bg: '#d4edda', color: '#155724' };
      default: return { bg: '#e9ecef', color: '#495057' };
    }
  };

  return (
    <div>
      <nav style={{ background: '#343a40', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Admin Dashboard</h1>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link href="/admindashboard/projects" style={{ color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '4px', background: '#495057' }}>Projects</Link>
          <NotificationBell userRole="admin" />
          <a onClick={logout} style={{ color: 'white', cursor: 'pointer', padding: '8px 16px', borderRadius: '4px' }}>Logout</a>
        </div>
      </nav>

      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Project Management</h2>
          <Link href="/admindashboard/projects/create" style={{ background: '#28a745', color: 'white', padding: '10px 20px', textDecoration: 'none', borderRadius: '4px' }}>
            + Create New Project
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>Loading projects...</div>
        ) : (
          <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            {projects.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8f9fa' }}>
                  <tr>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Project</th>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Manager</th>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Status</th>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Deadline</th>
                    <th style={{ padding: '15px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map(project => {
                    const statusStyle = getStatusColor(project.status);
                    return (
                      <tr key={project._id} style={{ borderBottom: '1px solid #dee2e6' }}>
                        <td style={{ padding: '15px' }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{project.title}</div>
                          <div style={{ fontSize: '14px', color: '#666' }}>{project.description.substring(0, 100)}...</div>
                        </td>
                        <td style={{ padding: '15px' }}>
                          <div>{project.projectManager?.username}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>{project.projectManager?.email}</div>
                        </td>
                        <td style={{ padding: '15px' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            background: statusStyle.bg,
                            color: statusStyle.color
                          }}>
                            {project.status}
                          </span>
                        </td>
                        <td style={{ padding: '15px' }}>
                          {new Date(project.deadline).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                            <Link href={`/admindashboard/projects/edit/${project._id}`} style={{ background: '#007bff', color: 'white', padding: '5px 10px', textDecoration: 'none', borderRadius: '3px', fontSize: '12px' }}>
                              Edit
                            </Link>
                            <button 
                              onClick={() => deleteProject(project._id)}
                              style={{ background: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '50px', textAlign: 'center', color: '#666' }}>
                No projects found. <Link href="/admindashboard/projects/create">Create your first project</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}