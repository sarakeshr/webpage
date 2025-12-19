import { useState } from 'react';

export default function DebugEmail() {
  const [logs, setLogs] = useState([]);

  const debugEmail = async () => {
    try {
      const response = await fetch('/api/debug-email', { method: 'POST' });
      const data = await response.json();
      setLogs(prev => [...prev, { timestamp: new Date().toISOString(), data }]);
    } catch (error) {
      setLogs(prev => [...prev, { timestamp: new Date().toISOString(), error: error.message }]);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Debug Email System</h1>
      <button onClick={debugEmail}>Debug Email</button>
      <div style={{ marginTop: '20px' }}>
        {logs.map((log, index) => (
          <div key={index} style={{ background: '#f5f5f5', padding: '10px', margin: '5px 0', borderRadius: '4px' }}>
            <strong>{log.timestamp}</strong>
            <pre>{JSON.stringify(log.data || log.error, null, 2)}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}