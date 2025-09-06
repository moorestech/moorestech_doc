import React from 'react';

interface StatusDisplayProps {
  status: string | null;
  error: string | null;
  resultUrl: string | null;
}

export default function StatusDisplay({ status, error, resultUrl }: StatusDisplayProps) {
  return (
    <>
      {status && (
        <span style={{ fontSize: '0.85rem', color: 'var(--ifm-color-emphasis-700)' }}>
          {status}
        </span>
      )}
      {error && (
        <span style={{ fontSize: '0.85rem', color: 'var(--ifm-color-danger)' }}>
          {error}
        </span>
      )}
      {resultUrl && (
        <a href={resultUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem' }}>
          View PR
        </a>
      )}
    </>
  );
}