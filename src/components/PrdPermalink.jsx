import React, { useEffect, useState } from 'react';
import { buildPrdMarkdown } from '../lib/prdTemplate';

const PrdPermalink = ({ slug }) => {
  const [state, setState] = useState({ status: 'loading', markdown: '', name: '' });

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await fetch(`/api/prd-get?slug=${encodeURIComponent(slug)}`);
        const payload = await response.json().catch(() => ({}));
        if (!active) return;
        // A 200 without a PRD (e.g. an SPA fallback page) is still "not found".
        const prd = payload.prd;
        if (!response.ok || !prd?.content) {
          setState({ status: 'error', markdown: '', name: '' });
          return;
        }
        setState({
          status: 'ready',
          // Markdown is rendered from the stored structured content, never
          // stored as text, so a template fix reaches old PRDs too.
          markdown: buildPrdMarkdown(prd.content, { today: String(prd.created_at || '').slice(0, 10) }),
          name: prd.system_name || '',
        });
      } catch {
        if (active) setState({ status: 'error', markdown: '', name: '' });
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [slug]);

  return (
    <section className="s-prd-generator">
      <header className="prd-head">
        <p className="s-eyebrow">// PRD</p>
        <h1>{state.name || slug}</h1>
      </header>

      {state.status === 'loading' && <p className="prd-hint">Memuat…</p>}
      {state.status === 'error' && <p className="prd-error">PRD tidak ditemukan.</p>}
      {state.status === 'ready' && <pre className="prd-output">{state.markdown}</pre>}
    </section>
  );
};

export default PrdPermalink;
