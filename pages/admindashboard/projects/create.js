import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import NotificationBell from '../../../components/NotificationBell';

export default function CreateProject() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    deadline: '',
    status: 'Planning',
    projectManager: '',
    teamMembers: []
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/team');
      const data = await response.json();
      console.log('All users:', data);
      console.log('User roles:', data.map(u => ({ name: u.name, role: u.role })));
      data.forEach(user => {
        console.log(`User: ${user.name}, Role: "${user.role}"`);
      });
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const currentUserEmail = localStorage.getItem('userEmail');
      const currentUser = users.find(user => user.email === currentUserEmail);
      
      console.log('Current user email:', currentUserEmail);
      console.log('Current user found:', currentUser);
      
      // For admin users, createdBy can be null since admin might not be in regular users list
      const projectData = {
        ...formData,
        createdBy: currentUser?.id || null
      };
      
      console.log('Form data being sent:', projectData);

      const response = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });

      if (response.ok) {
        router.push('/admindashboard/projects');
      } else {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        alert(`Failed to create project: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Error creating project');
    } finally {
      setLoading(false);
    }
  };

  const handleTeamMemberChange = (userId, checked) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        teamMembers: [...prev.teamMembers, userId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        teamMembers: prev.teamMembers.filter(id => id !== userId)
      }));
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  const projectManagers = users.filter(user => user.role === 'Project manager');
  const teamMemberUsers = users.filter(user => ['Developer', 'Tester', 'Crm', 'Director'].includes(user.role));
  
  console.log('Project Managers found:', projectManagers);
  console.log('Team Members found:', teamMemberUsers);

  return (
    <div>
      <nav style={{ background: '#343a40', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Admin Dashboard</h1>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link href="/admindashboard/projects" style={{ color: 'white', textDecoration: 'none', padding: '8px 16px', borderRadius: '4px' }}>Projects</Link>
          <NotificationBell userRole="admin" />
          <a onClick={logout} style={{ color: 'white', cursor: 'pointer', padding: '8px 16px', borderRadius: '4px' }}>Logout</a>
        </div>
      </nav>

      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <Link href="/admindashboard/projects" style={{ color: '#007bff', textDecoration: 'none' }}>← Back to Projects</Link>
        </div>

        <div style={{ background: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', maxWidth: '800px' }}>
          <h2 style={{ marginBottom: '30px' }}>Create New Project</h2>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Project Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                  required
                >
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Testing">Testing</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '100px' }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Start Date *</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Deadline *</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Project Manager *</label>
              <select
                value={formData.projectManager}
                onChange={(e) => setFormData(prev => ({ ...prev, projectManager: e.target.value }))}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                required
              >
                <option value="">Select Project Manager</option>
                {projectManagers.map(pm => (
                  <option key={pm.id} value={pm.id}>{pm.name} ({pm.email})</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Team Members (Optional)</label>
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px', padding: '10px' }}>
                {teamMemberUsers.map(user => (
                  <label key={user.id} style={{ display: 'flex', alignItems: 'center', padding: '5px 0', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.teamMembers.includes(user.id)}
                      onChange={(e) => handleTeamMemberChange(user.id, e.target.checked)}
                      style={{ marginRight: '10px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{user.name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{user.role} - {user.email}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Creating...' : 'Create Project'}
              </button>
              <Link href="/admindashboard/projects" style={{ background: '#6c757d', color: 'white', padding: '12px 24px', textDecoration: 'none', borderRadius: '4px' }}>
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}