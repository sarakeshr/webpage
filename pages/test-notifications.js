import { useState } from 'react';

export default function TestNotifications() {
  const [result, setResult] = useState('');

  const testNotification = async () => {
    try {
      const response = await fetch('/api/notifications', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user',
          message: 'Test notification',
          type: 'info'
        })
      });
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult('Error: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Test Notifications</h1>
      <button onClick={testNotification}>Send Test Notification</button>
      <pre style={{ background: '#f5f5f5', padding: '10px', marginTop: '20px' }}>
        {result}
      </pre>
    </div>
  );
}