import React, { useState } from 'react';

const DRAWNIX_URL = 'https://drawnix.com';

const diagramsOf = (content) =>
  [
    { key: 'flowchart', label: 'User Flow — flowchart', lines: content?.userFlow?.flowchart },
    { key: 'sequence', label: 'Architecture — sequence', lines: content?.architecture?.sequence },
    { key: 'erd', label: 'Database — ERD', lines: content?.database?.erd },
  ].filter((diagram) => Array.isArray(diagram.lines) && diagram.lines.length > 0);

const PrdReviewStep = ({ content, markdown, onRetry, onBack, busy }) => {
  const [copied, setCopied] = useState('');
  const [ownerKey, setOwnerKey] = useState(() => {
    try {
      return sessionStorage.getItem('prdOwnerKey') || '';
    } catch {
      return '';
    }
  });
  const [saved, setSaved] = useState('');
  const [saveError, setSaveError] = useState('');

  const copy = async (label, value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(''), 1600);
    } catch {
      setCopied('');
    }
  };

  const download = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${content?.meta?.systemName || 'prd'}.md`.replace(/\s+/g, '-').toLowerCase();
    link.click();
    URL.revokeObjectURL(url);
  };

  // The owner key is typed here and kept in sessionStorage for this tab only —
  // it is never a VITE_ variable and never reaches the bundle.
  const save = async () => {
    setSaveError('');
    try {
      const response = await fetch('/api/prd-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerKey}` },
        body: JSON.stringify({ content }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Gagal menyimpan');
      try {
        sessionStorage.setItem('prdOwnerKey', ownerKey);
      } catch {
        // Storage blocked: saving still worked, the key just is not remembered.
      }
      setSaved(`/prd/${payload.slug}`);
    } catch (caught) {
      setSaveError(caught.message);
    }
  };

  if (!content) {
    return (
      <div className="prd-step">
        <p className="prd-error">Draf kosong.</p>
        <button type="button" className="btn-prime" onClick={onRetry} disabled={busy}>
          Coba generate lagi
        </button>
      </div>
    );
  }

  return (
    <div className="prd-step">
      <pre className="prd-output">{markdown}</pre>

      <div className="prd-actions">
        <button type="button" className="btn-prime" onClick={() => copy('markdown', markdown)}>
          {copied === 'markdown' ? 'Tersalin!' : 'Copy Markdown'}
        </button>
        <button type="button" className="btn-ghost" onClick={download}>
          Download .md
        </button>
        <button type="button" className="btn-ghost" onClick={onBack}>
          Ubah jawaban
        </button>
      </div>

      <div className="prd-diagrams">
        <h2>Diagram untuk drawnix</h2>
        <p className="prd-hint">
          Salin satu blok, lalu paste di <a href={DRAWNIX_URL} target="_blank" rel="noopener noreferrer">drawnix</a> —
          Mermaid akan dikonversi jadi flowchart yang bisa diedit.
        </p>
        {diagramsOf(content).map((diagram) => (
          <div key={diagram.key} className="prd-diagram">
            <div className="prd-diagram-head">
              <span>{diagram.label}</span>
              <button type="button" className="btn-ghost" onClick={() => copy(diagram.key, diagram.lines.join('\n'))}>
                {copied === diagram.key ? 'Tersalin!' : 'Copy Mermaid'}
              </button>
            </div>
            <pre>{diagram.lines.join('\n')}</pre>
          </div>
        ))}
      </div>

      <details className="prd-save">
        <summary>Simpan &amp; dapatkan permalink (owner)</summary>
        <label className="prd-field">
          <span>Owner key</span>
          <input type="password" value={ownerKey} onChange={(event) => setOwnerKey(event.target.value)} />
        </label>
        <button type="button" className="btn-prime" onClick={save} disabled={!ownerKey}>
          Simpan
        </button>
        {saveError && <p className="prd-error">{saveError}</p>}
        {saved && (
          <p className="prd-hint">
            Tersimpan di <a href={saved}>{saved}</a>
          </p>
        )}
      </details>
    </div>
  );
};

export default PrdReviewStep;
