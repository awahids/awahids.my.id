import React, { useRef, useState } from 'react';
import { skillIconUrl } from '../lib/skillIcons';
import { CARD_THEMES } from '../lib/cardThemes';
import { STATS_SECTIONS, findStatsTemplate } from '../lib/statsTemplates';

const ENDPOINT = import.meta.env.VITE_README_ASSISTANT_ENDPOINT || '/api/readme-assistant';

const QUICK_ASKS = {
  about: ['Suggest taglines for my profile', 'Write my bio', 'Make my bio shorter'],
  skills: ['Suggest skill icons for my stack'],
  stats: ['Recommend a stats layout for my profile', 'Which repos should I pin?', 'Pick a theme for my stats cards'],
};

const INTROS = {
  about: "Helps with taglines, your bio and skill icons for this README. It won't answer anything else.",
  skills: "Helps with taglines, your bio and skill icons for this README. It won't answer anything else.",
  stats:
    "Recommends a stats template, themes, sections and repos to pin. With a GitHub username it reads your public stars, commits, languages and top repos first. It won't answer anything else.",
};

const sectionLabel = (id) => STATS_SECTIONS.find((section) => section.id === id)?.label || id;
const themeLabel = (id) => CARD_THEMES[id]?.label || id;

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
        body: JSON.stringify({ request: trimmed, context, focus }),
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
        <span>{INTROS[focus]}</span>
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

            {result.stats && (
              <div className="rg-ai-block">
                <span className="rg-ai-label">Stats layout</span>
                <ul>
                  {result.stats.template && <li>Template: {findStatsTemplate(result.stats.template)?.name}</li>}
                  {result.stats.theme && (
                    <li>
                      Theme: {themeLabel(result.stats.theme)}
                      {result.stats.lightTheme ? `, ${themeLabel(result.stats.lightTheme)} in light mode` : ''}
                    </li>
                  )}
                  <li>
                    Sections:{' '}
                    {result.stats.sections.length ? result.stats.sections.map(sectionLabel).join(', ') : 'core stats cards only'}
                  </li>
                  {result.stats.pinnedRepos.length > 0 && <li>Pin: {result.stats.pinnedRepos.join(', ')}</li>}
                </ul>
                <button type="button" onClick={() => onApply({ stats: result.stats })}>Apply this layout</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReadmeAiHelper;
