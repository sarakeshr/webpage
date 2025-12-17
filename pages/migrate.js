import { useState } from 'react';

export default function MigratePage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runMigration = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/migrate-meetings', {
        method: 'POST'
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Database Migration</h1>
      <p>This will migrate existing meetings from date/time format to timestamp format.</p>
      
      <button 
        onClick={runMigration}
        disabled={loading}
        style={{ 
          padding: '10px 20px', 
          background: '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px', 
          cursor: loading ? 'not-allowed' : 'pointer' 
        }}
      >
        {loading ? 'Migrating...' : 'Run Migration'}
      </button>

      {result && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          background: result.error ? '#f8d7da' : '#d4edda',
          color: result.error ? '#721c24' : '#155724',
          borderRadius: '4px'
        }}>
          {result.error ? (
            <div>
              <h3>Migration Failed</h3>
              <p>{result.error}</p>
            </div>
          ) : (
            <div>
              <h3>Migration Completed</h3>
              <p><strong>Total meetings:</strong> {result.totalMeetings}</p>
              <p><strong>Migrated:</strong> {result.migratedCount}</p>
              <p><strong>Errors:</strong> {result.errorCount}</p>
              <p><strong>Skipped:</strong> {result.skippedCount}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}