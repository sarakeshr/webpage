import { useState } from 'react';

export default function Credentials() {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    apiKey: '',
    dbUrl: ''
  });

  const saveCredentials = () => {
    localStorage.setItem('credentials', JSON.stringify(credentials));
    alert('Credentials saved to localStorage');
  };

  const loadCredentials = () => {
    const saved = localStorage.getItem('credentials');
    if (saved) {
      setCredentials(JSON.parse(saved));
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Credentials Manager</h1>
      <div style={{ marginBottom: '10px' }}>
        <label>Email:</label>
        <input 
          type="email" 
          value={credentials.email}
          onChange={(e) => setCredentials({...credentials, email: e.target.value})}
          style={{ width: '100%', padding: '5px' }}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>Password:</label>
        <input 
          type="password" 
          value={credentials.password}
          onChange={(e) => setCredentials({...credentials, password: e.target.value})}
          style={{ width: '100%', padding: '5px' }}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>API Key:</label>
        <input 
          type="text" 
          value={credentials.apiKey}
          onChange={(e) => setCredentials({...credentials, apiKey: e.target.value})}
          style={{ width: '100%', padding: '5px' }}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>Database URL:</label>
        <input 
          type="text" 
          value={credentials.dbUrl}
          onChange={(e) => setCredentials({...credentials, dbUrl: e.target.value})}
          style={{ width: '100%', padding: '5px' }}
        />
      </div>
      <button onClick={saveCredentials} style={{ marginRight: '10px' }}>Save</button>
      <button onClick={loadCredentials}>Load</button>
    </div>
  );
}