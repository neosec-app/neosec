// client/src/components/ScanDashboard.js
import React, { useState, useEffect } from 'react';
import { scanAPI } from '../services/api';

function ScanDashboard() {
  const [url, setUrl] = useState('');
  const [scanId, setScanId] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  // Poll scan status when we have a scanId
  useEffect(() => {
    if (!scanId) return;

    const interval = setInterval(async () => {
      try {
        const data = await scanAPI.getStatus(scanId);
        setStatus(data.status);
        setResult(data);

        if (data.status === 'COMPLETED' || data.status === 'ERROR') {
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Status check error:', err);
        clearInterval(interval);
      }
    }, 5000); // every 5 seconds

    return () => clearInterval(interval);
  }, [scanId]);
  

// Load scan history on component mount
useEffect(() => {
  const loadHistory = async () => {
    try {
      const data = await scanAPI.getHistory(); 
      setHistory(data);
    } catch (err) {
      console.error("Failed to load history:", err);
      setError("Could not load scan history.");
    }
  };

  loadHistory();
}, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setStatus(null);

    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    try {
      setLoading(true);
      const data = await scanAPI.scanUrl(url.trim());
      setScanId(data.scanId);
      setStatus('PENDING');
    } catch (err) {
      console.error('Scan error:', err);
      setError(err.response?.data?.message || 'Failed to submit URL');
    } finally {
      setLoading(false);
    }
  };
  

  const getStatusColor = (s) => {
    if (s === 'COMPLETED') return '#36E27B';
    if (s === 'ERROR') return '#FF4444';
    return '#FF9800';
  };

  return (
    <div>
      <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>URL Scanner</h1>
      <p style={{ color: '#888', marginBottom: '30px' }}>
        Scan URLs with VirusTotal and see threat results.
      </p>

      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#121212',
              border: '1px solid #282828',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px'
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 24px',
              backgroundColor: '#36E27B',
              color: '#121212',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '14px',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Submitting…' : 'Scan URL'}
          </button>
        </div>
      </form>

      {error && (
        <div style={{
          marginBottom: '20px',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid #FF4444',
          backgroundColor: '#2A1515',
          color: '#FFB3B3',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {/* Status + current scan result – only when there is a scanId */}
    `{scanId && (
    <div style={{ padding: '20px', backgroundColor: '#181818', border: '1px solid #282828', borderRadius: '10px', marginTop: '10px' }}>
        <div style={{ marginBottom: '10px', fontSize: '14px', color: '#888' }}>Scan ID:</div>
        <div style={{ fontFamily: 'monospace', fontSize: '13px', color: '#ccc', wordBreak: 'break-all', marginBottom: '15px' }}>
        {scanId}
        </div>

        <div style={{ marginBottom: '10px', fontSize: '14px', color: '#888' }}>Status:</div>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: getStatusColor(status) }}>
        {status || 'Waiting…'}
        </div>

        {result && result.positives != null && (
        <div style={{ marginTop: '15px', fontSize: '14px', color: '#ccc' }}>
            <div>Detections: {result.positives} / {result.total}</div>

            {result.permalink && (
            <div style={{ marginTop: '8px' }}>
                <a
                href={result.permalink}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#36E27B', textDecoration: 'underline' }}
                >
                View full report on VirusTotal
                </a>
            </div>
            )}
        </div>
        )}
    </div>
    )}

    {/* 🔽 HISTORY: always rendered, even when scanId is null */}
    <h2 style={{ marginTop: '40px', color: '#fff' }}>Scan History</h2>

    {history.length === 0 ? (
    <p style={{ color: '#888' }}>No previous scans.</p>
    ) : (
    history.map((item) => (
        <div
        key={item.id}
        style={{
            background: '#1b1b1b',
            padding: '12px',
            borderRadius: '8px',
            marginTop: '10px',
            borderLeft: item.positives > 0 ? '4px solid #E23636' : '4px solid #36E27B',
        }}
        >
        <div style={{ color: '#fff', fontWeight: 'bold' }}>{item.target}</div>
        <div style={{ color: '#bbb' }}>Status: {item.status}</div>

        {/* Optional: show detections if you have them in DB */}
        {item.positives != null && item.total != null && (
            <div style={{ color: '#bbb' }}>Detections: {item.positives} / {item.total}</div>
        )}

        {item.permalink && (
            <a
            href={item.permalink}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#36E27B', display: 'block', marginTop: '6px' }}
            >
            View full VirusTotal Report
            </a>
        )}
        </div>
    ))
    )}`
    </div>
  );
}

export default ScanDashboard;
