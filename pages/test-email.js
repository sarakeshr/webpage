import { useState } from 'react';

export default function TestEmail() {
  const [result, setResult] = useState('');

  const testEmail = async () => {
    try {
      const response = await fetch('/api/test-email', { method: 'POST' });
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult('Error: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Test Email</h1>
      <button onClick={testEmail}>Send Test Email</button>
      <pre style={{ background: '#f5f5f5', padding: '10px', marginTop: '20px' }}>
        {result}
      </pre>
    </div>
  );
}