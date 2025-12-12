// client/src/components/ScanDashboard.js
import React, { useState, useEffect } from 'react';
import { scanAPI } from '../services/api';

const darkPalette = {
  bgMain: '#121212',
  bgCard: '#181818',
  bgPanel: '#0a0a0a',
  text: '#ffffff',
  textMuted: '#9aa3b5',
  border: '#242424',
  accent: '#36E27B',
  accentSoft: 'rgba(54,226,123,0.12)',
  warning: '#f0a500',
  danger: '#e04848',
  inputBg: '#1c1c1c',
  inputBorder: '#2c2c2c',
};

const lightPalette = {
  bgMain: '#f6f8fb',
  bgCard: '#ffffff',
  bgPanel: '#eef3f8',
  text: '#0b172a',
  textMuted: '#5b6b7a',
  border: '#d9e2ec',
  accent: '#1fa45a',
  accentSoft: '#e6f4ed',
  warning: '#d97706',
  danger: '#d4183d',
  inputBg: '#ffffff',
  inputBorder: '#d9e2ec',
};

function ScanDashboard({ theme = 'dark', palette }) {
  // fall back to local palettes if App.js didn’t pass one
  const colors =
    palette || (theme === 'light' ? lightPalette : darkPalette);

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
    }, 5000);

    return () => clearInterval(interval);
  }, [scanId]);

  // Load scan history on component mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await scanAPI.getHistory();
        setHistory(data);
      } catch (err) {
        console.error('Failed to load history:', err);
        setError('Could not load scan history.');
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
    if (s === 'COMPLETED') return colors.accent;
    if (s === 'ERROR') return colors.danger;
    return colors.warning;
  };

  return (
    <div style={{ color: colors.text }}>
      <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>URL Scanner</h1>
      <p style={{ color: colors.textMuted, marginBottom: '30px' }}>
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
              backgroundColor: colors.inputBg,
              border: `1px solid ${colors.inputBorder}`,
              borderRadius: '8px',
              color: colors.text,
              fontSize: '14px',
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 24px',
              backgroundColor: colors.accent,
              color: theme === 'dark' ? '#121212' : '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Submitting…' : 'Scan URL'}
          </button>
        </div>
      </form>

      {error && (
        <div
          style={{
            marginBottom: '20px',
            padding: '12px 16px',
            borderRadius: '8px',
            border: `1px solid ${colors.danger}`,
            backgroundColor:
              theme === 'dark' ? '#2A1515' : 'rgba(212,24,61,0.08)',
            color: theme === 'dark' ? '#FFB3B3' : colors.danger,
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {/* Status + current scan result */}
      {scanId && (
        <div
          style={{
            padding: '20px',
            backgroundColor: colors.bgCard,
            border: `1px solid ${colors.border}`,
            borderRadius: '10px',
            marginTop: '10px',
          }}
        >
          <div
            style={{ marginBottom: '10px', fontSize: '14px', color: colors.textMuted }}
          >
            Scan ID:
          </div>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '13px',
              color: colors.textMuted,
              wordBreak: 'break-all',
              marginBottom: '15px',
            }}
          >
            {scanId}
          </div>

          <div
            style={{ marginBottom: '10px', fontSize: '14px', color: colors.textMuted }}
          >
            Status:
          </div>
          <div
            style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: getStatusColor(status),
            }}
          >
            {status || 'Waiting…'}
          </div>

          {result && result.positives != null && (
            <div
              style={{ marginTop: '15px', fontSize: '14px', color: colors.textMuted }}
            >
              <div>
                Detections: {result.positives} / {result.total}
              </div>

              {result.permalink && (
                <div style={{ marginTop: '8px' }}>
                  <a
                    href={result.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: colors.accent, textDecoration: 'underline' }}
                  >
                    View full report on VirusTotal
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* HISTORY */}
      <h2 style={{ marginTop: '40px', color: colors.text }}>Scan History</h2>

      {history.length === 0 ? (
        <p style={{ color: colors.textMuted }}>No previous scans.</p>
      ) : (
        history.map((item) => (
          <div
            key={item.id}
            style={{
              background: colors.bgCard,
              padding: '12px',
              borderRadius: '8px',
              marginTop: '10px',
              borderLeft:
                item.positives > 0
                  ? `4px solid ${colors.danger}`
                  : `4px solid ${colors.accent}`,
            }}
          >
            <div style={{ color: colors.text, fontWeight: 'bold' }}>
              {item.target}
            </div>
            <div style={{ color: colors.textMuted }}>
              Status: {item.status}
            </div>

            {item.positives != null && item.total != null && (
              <div style={{ color: colors.textMuted }}>
                Detections: {item.positives} / {item.total}
              </div>
            )}

            {item.permalink && (
              <a
                href={item.permalink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: colors.accent,
                  display: 'block',
                  marginTop: '6px',
                }}
              >
                View full VirusTotal Report
              </a>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default ScanDashboard;
