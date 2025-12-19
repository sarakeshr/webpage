import { useState } from 'react';

export default function TestMeeting() {
  const [result, setResult] = useState('');

  const testMeeting = async () => {
    try {
      const response = await fetch('/api/meetings', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'test-project',
          title: 'Test Meeting',
          date: '2024-01-01',
          time: '10:00',
          participants: ['test-user']
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
      <h1>Test Meeting</h1>
      <button onClick={testMeeting}>Create Test Meeting</button>
      <pre style={{ background: '#f5f5f5', padding: '10px', marginTop: '20px' }}>
        {result}
      </pre>
    </div>
  );
}