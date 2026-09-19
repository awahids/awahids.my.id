import React, { useRef, useState } from 'react';
import { skillIconUrl } from '../lib/skillIcons';

const ENDPOINT = import.meta.env.VITE_README_ASSISTANT_ENDPOINT || '/api/readme-assistant';

const QUICK_ASKS = {
  about: ['Suggest taglines for my profile', 'Write my bio', 'Make my bio shorter'],
  skills: ['Suggest skill icons for my stack'],
};

const ReadmeAiHelper = ({ focus, context, onApply }) => {
  const [request, setRequest] = useState('');
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const abortRef = useRef(null);

  const ask = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || status === 'loading') return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 30000);

    setStatus('loading');
    setResult(null);
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request: trimmed, context }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || `HTTP ${response.status}`);
      setResult(data);
      setStatus('done');
    } catch (error) {
      if (error?.name === 'AbortError' && abortRef.current !== controller) return;
      setStatus('error');
    } finally {
      clearTimeout(timeout);
    }
  };

  const submit = (event) => {
    event.preventDefault();
    ask(request);
  };

  const quickAsk = (text) => {
    setRequest(text);
    ask(text);
  };

  return (
    <div className="rg-ai">
      <div className="rg-ai-head">
        <strong>AI helper</strong>
        <span>Helps with taglines, your bio and skill icons for this README. It won't answer anything else.</span>
      </div>

      <div className="rg-ai-quick">
        {QUICK_ASKS[focus].map((text) => (
          <button type="button" key={text} onClick={() => quickAsk(text)} disabled={status === 'loading'}>
            {text}
          </button>
        ))}
      </div>

      <form className="rg-ai-form" onSubmit={submit}>
        <textarea
          rows={2}
          maxLength={400}
          value={request}
          onChange={(event) => setRequest(event.target.value)}
          placeholder="Tell me what you do or what to change, e.g. “I'm a backend developer who loves NestJS”"
          aria-label="Ask the README helper"
        />
        <button type="submit" className="btn-prime" disabled={status === 'loading' || !request.trim()}>
          {status === 'loading' ? 'Thinking…' : 'Ask'}
        </button>
      </form>

      <div className="rg-ai-result" aria-live="polite">
        {status === 'error' && (
          <p className="rg-ai-error">The helper is unavailable right now. Try again in a moment.</p>
        )}

        {status === 'done' && result?.refused && <p className="rg-ai-refused">{result.message}</p>}

        {status === 'done' && result && !result.refused && (
          <>
            {result.message && <p className="rg-ai-message">{result.message}</p>}

            {result.taglines?.length > 0 && (
              <div className="rg-ai-block">
                <span className="rg-ai-label">Typing lines</span>
                <ul>{result.taglines.map((line) => <li key={line}>{line}</li>)}</ul>
                <button type="button" onClick={() => onApply({ taglines: result.taglines })}>Use these lines</button>
              </div>
            )}

            {result.bio?.length > 0 && (
              <div className="rg-ai-block">
                <span className="rg-ai-label">Bio</span>
                {result.bio.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                <button type="button" onClick={() => onApply({ bio: result.bio })}>Use this bio</button>
              </div>
            )}

            {result.skills?.length > 0 && (
              <div className="rg-ai-block">
                <span className="rg-ai-label">Skill icons</span>
                <div className="rg-ai-icons">
                  {result.skills.map((id) => <img key={id} src={skillIconUrl(id)} alt={id} title={id} loading="lazy" />)}
                </div>
                <button type="button" onClick={() => onApply({ skills: result.skills })}>Add these icons</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReadmeAiHelper;
