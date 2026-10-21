import React, { useMemo, useState } from 'react';
import { buildReadmeMarkdown } from '../lib/readmeTemplate';
import ReadmeAiHelper from './ReadmeAiHelper';
import { CARD_THEMES, DEFAULT_THEME } from '../lib/cardThemes';
import { DEFAULT_SKILL_IDS, SKILL_GROUPS, skillIconUrl } from '../lib/skillIcons';
import {
  CODE_STATS_SOURCE_URL,
  CODE_STATS_WORKFLOW_PATH,
  DEFAULT_HIGHLIGHT_LANGS,
  buildCodeStatsWorkflow,
  parseHighlightLangs,
} from '../lib/codeStatsWorkflow';
import { SNAKE_SOURCE_URL, SNAKE_WORKFLOW_PATH, buildSnakeWorkflow, snakeImageUrls } from '../lib/snakeWorkflow';

// `label` is the form field caption; `linkLabel` is the shorter text shown
// on the actual README link. `toUrl` turns whatever the field collects (a
// bare username, or already a full URL for `website`) into the link URL.
const SOCIAL_FIELDS = [
  { key: 'github', label: 'GitHub username', linkLabel: 'GitHub', placeholder: 'awahids', toUrl: (v) => `https://github.com/${v}` },
  { key: 'linkedin', label: 'LinkedIn username', linkLabel: 'LinkedIn', placeholder: 'awahids', toUrl: (v) => `https://www.linkedin.com/in/${v}` },
  { key: 'instagram', label: 'Instagram username', linkLabel: 'Instagram', placeholder: 'awhds_', toUrl: (v) => `https://www.instagram.com/${v}` },
  { key: 'email', label: 'Email', linkLabel: 'Email', placeholder: 'you@example.com', toUrl: (v) => `mailto:${v}` },
  { key: 'website', label: 'Website', linkLabel: 'Website', placeholder: 'https://your-site.com', toUrl: (v) => v },
];

const STEPS = ['Profile', 'About', 'Links & skills', 'Review'];

const StepRail = ({ current }) => (
  <ol className="rg-rail">
    {STEPS.map((label, index) => (
      <li key={label} className={index === current ? 'is-current' : index < current ? 'is-done' : ''}>
        <span className="rg-rail-dot">{index < current ? '✓' : index + 1}</span>
        <span className="rg-rail-label">{label}</span>
        {index < STEPS.length - 1 && <span className="rg-rail-line" />}
      </li>
    ))}
  </ol>
);

const ReadmeGenerator = () => {
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState('');
  const [pinnedReposText, setPinnedReposText] = useState('');
  const [showVisitorCounter, setShowVisitorCounter] = useState(false);
  const [showCodeStats, setShowCodeStats] = useState(false);
  const [codeStatsLangsText, setCodeStatsLangsText] = useState(DEFAULT_HIGHLIGHT_LANGS.join(', '));
  const [showRepoCards, setShowRepoCards] = useState(false);
  const [showSnake, setShowSnake] = useState(false);
  const [taglineText, setTaglineText] = useState('Hello, There! 👋\nNice to meet you!');
  const [bioText, setBioText] = useState('');
  const [skillIds, setSkillIds] = useState(DEFAULT_SKILL_IDS);
  const [socials, setSocials] = useState(() => Object.fromEntries(SOCIAL_FIELDS.map((f) => [f.key, ''])));
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [lightTheme, setLightTheme] = useState('');
  const [typing, setTyping] = useState({ font: 'mono', bold: false, speed: 'normal', align: 'center', size: 30, color: '' });
  const setTypingOption = (key, value) => setTyping((prev) => ({ ...prev, [key]: value }));
  const [previewTab, setPreviewTab] = useState('preview');
  // Which copy button last succeeded: 'readme' or a workflow id.
  const [copiedId, setCopiedId] = useState('');

  const markdown = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return buildReadmeMarkdown(
      {
        username,
        pinnedRepos: pinnedReposText.split(',').map((repo) => repo.trim()),
        showVisitorCounter,
        showCodeStats,
        showRepoCards,
        showSnake,
        taglineLines: taglineText.split('\n').map((line) => line.trim()),
        bio: bioText.split('\n').map((line) => line.trim()),
        skills: skillIds,
        theme,
        lightTheme,
        typing,
        socialLinks: SOCIAL_FIELDS.map((field) => {
          const value = socials[field.key].trim();
          return { label: field.linkLabel, url: value ? field.toUrl(value) : '' };
        }),
      },
      { origin }
    );
  }, [username, pinnedReposText, showVisitorCounter, showCodeStats, showRepoCards, showSnake, taglineText, bioText, skillIds, socials, theme, lightTheme, typing]);

  // One entry per README section that needs a GitHub Action in the profile
  // repo. The snake is only listed when the README actually got its section.
  const workflows = useMemo(
    () =>
      [
        showCodeStats && {
          id: 'code-stats',
          title: 'Lines of code',
          path: CODE_STATS_WORKFLOW_PATH,
          note: 'Runs on every push and every Sunday at 00:17 UTC, and rewrites the table between the markers.',
          source: { url: CODE_STATS_SOURCE_URL, label: 'arhamkhnz/github-code-analyzer' },
          yaml: buildCodeStatsWorkflow({ highlightLangs: parseHighlightLangs(codeStatsLangsText) }),
        },
        showSnake && snakeImageUrls(username) && {
          id: 'snake',
          title: 'Contribution snake',
          path: SNAKE_WORKFLOW_PATH,
          note: 'Runs daily and on pushes to main/master, and publishes the SVGs to the output branch. The image stays broken until the first run.',
          source: { url: SNAKE_SOURCE_URL, label: 'Platane/snk' },
          yaml: buildSnakeWorkflow(),
        },
      ].filter(Boolean),
    [showCodeStats, codeStatsLangsText, showSnake, username]
  );

  const applySuggestion = ({ taglines, bio, skills }) => {
    if (taglines) setTaglineText(taglines.join('\n'));
    if (bio) setBioText(bio.join('\n'));
    if (skills) setSkillIds((prev) => [...prev, ...skills.filter((id) => !prev.includes(id))]);
  };

  const aiContext = { username, tagline: taglineText, bio: bioText, skills: skillIds };

  const toggleSkill = (id) =>
    setSkillIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  // The Workflows tab only exists while a section needs one; fall back to
  // the preview if they were all switched off after visiting that tab.
  const activeTab = previewTab === 'workflows' && !workflows.length ? 'preview' : previewTab;

  const handleCopy = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((current) => (current === id ? '' : current)), 2000);
    } catch {
      setCopiedId('');
    }
  };

  const goBack = () => setStep((s) => Math.max(0, s - 1));
  const goNext = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));

  return (
    <section className="s-readme-generator">
      <div className="rg-shell">
        <a href="/" className="rg-back">← Back to portfolio</a>
        <h1 className="rg-title">GitHub README Generator</h1>
        <p className="rg-subtitle">Fill in your details, then copy a ready-to-paste README.md.</p>

        <StepRail current={step} />

        <div className="rg-panel">
          {step === 0 && (
            <div className="rg-fields">
              <label>
                GitHub username
                <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="awahids" />
              </label>
              <label>
                Pinned repos for the stars badge and repo cards (comma-separated, optional)
                <input
                  value={pinnedReposText}
                  onChange={(e) => setPinnedReposText(e.target.value)}
                  placeholder="belajar-ngaji, aw-prd"
                />
              </label>
              <label className="rg-checkbox">
                <input
                  type="checkbox"
                  checked={showVisitorCounter}
                  onChange={(e) => setShowVisitorCounter(e.target.checked)}
                />
                Show a visitor counter badge
              </label>
              <label className="rg-checkbox">
                <input
                  type="checkbox"
                  checked={showCodeStats}
                  onChange={(e) => setShowCodeStats(e.target.checked)}
                />
                Add a lines-of-code section (counted by a GitHub Action)
              </label>
              <label className="rg-checkbox">
                <input
                  type="checkbox"
                  checked={showRepoCards}
                  onChange={(e) => setShowRepoCards(e.target.checked)}
                />
                Show a card for each pinned repo
              </label>
              <label className="rg-checkbox">
                <input type="checkbox" checked={showSnake} onChange={(e) => setShowSnake(e.target.checked)} />
                Add a contribution snake (drawn by a GitHub Action)
              </label>
              {showCodeStats && (
                <label>
                  Languages to list by name (cloc names, comma-separated; the rest go under Others)
                  <input
                    value={codeStatsLangsText}
                    onChange={(e) => setCodeStatsLangsText(e.target.value)}
                    placeholder={DEFAULT_HIGHLIGHT_LANGS.join(', ')}
                  />
                </label>
              )}
              <div className="rg-theme">
                <span>Card theme</span>
                <div className="rg-theme-grid" role="radiogroup" aria-label="Card theme">
                  {Object.entries(CARD_THEMES).map(([id, t]) => (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={theme === id}
                      className={`rg-theme-swatch${theme === id ? ' is-active' : ''}`}
                      style={{ background: `#${t.bg}`, borderColor: `#${t.border}`, color: `#${t.title}` }}
                      onClick={() => setTheme(id)}
                    >
                      <i style={{ background: `#${t.icon}` }} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <label>
                Light-mode theme (cards switch to it when the viewer uses GitHub in light mode)
                <select value={lightTheme} onChange={(e) => setLightTheme(e.target.value)}>
                  <option value="">Same as the card theme</option>
                  {Object.entries(CARD_THEMES)
                    .filter(([id]) => id !== theme)
                    .map(([id, t]) => (
                      <option key={id} value={id}>
                        {t.label}
                      </option>
                    ))}
                </select>
              </label>
            </div>
          )}

          {step === 1 && (
            <div className="rg-fields">
              <label>
                Typing lines (one per line)
                <textarea rows={3} value={taglineText} onChange={(e) => setTaglineText(e.target.value)} />
              </label>
              <div className="rg-typing-opts">
                <label>
                  Font
                  <select value={typing.font} onChange={(e) => setTypingOption('font', e.target.value)}>
                    <option value="mono">Monospace</option>
                    <option value="sans">Sans-serif</option>
                    <option value="serif">Serif</option>
                  </select>
                </label>
                <label>
                  Speed
                  <select value={typing.speed} onChange={(e) => setTypingOption('speed', e.target.value)}>
                    <option value="slow">Slow</option>
                    <option value="normal">Normal</option>
                    <option value="fast">Fast</option>
                  </select>
                </label>
                <label>
                  Align
                  <select value={typing.align} onChange={(e) => setTypingOption('align', e.target.value)}>
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </label>
                <label>
                  Size ({typing.size}px)
                  <input type="range" min="14" max="60" value={typing.size} onChange={(e) => setTypingOption('size', Number(e.target.value))} />
                </label>
                <label>
                  Color (hex, blank = theme)
                  <input value={typing.color} maxLength={6} placeholder="c8ff00" onChange={(e) => setTypingOption('color', e.target.value.replace(/[^0-9a-f]/gi, ''))} />
                </label>
                <label className="rg-checkbox">
                  <input type="checkbox" checked={typing.bold} onChange={(e) => setTypingOption('bold', e.target.checked)} />
                  Bold
                </label>
              </div>
              <label>
                Bio (one paragraph per line)
                <textarea rows={4} value={bioText} onChange={(e) => setBioText(e.target.value)} />
              </label>
              <ReadmeAiHelper focus="about" context={aiContext} onApply={applySuggestion} />
            </div>
          )}

          {step === 2 && (
            <div className="rg-fields">
              <fieldset className="rg-social-fields">
                <legend>Social links</legend>
                {SOCIAL_FIELDS.map((field) => (
                  <label key={field.key}>
                    {field.label}
                    <input
                      value={socials[field.key]}
                      onChange={(e) => setSocials((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                    />
                  </label>
                ))}
              </fieldset>
              <fieldset className="rg-social-fields">
                <legend>Skill icons</legend>
                {SKILL_GROUPS.map((group) => (
                  <div key={group.label} className="rg-skill-group">
                    <span className="rg-skill-group-label">{group.label}</span>
                    <div className="rg-skill-grid">
                      {group.icons.map((icon) => {
                        const selected = skillIds.includes(icon.id);
                        return (
                          <button
                            type="button"
                            key={icon.id}
                            className={`rg-skill ${selected ? 'is-selected' : ''}`}
                            aria-pressed={selected}
                            onClick={() => toggleSkill(icon.id)}
                          >
                            <img src={skillIconUrl(icon.id)} alt="" loading="lazy" />
                            <span>{icon.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </fieldset>
              <ReadmeAiHelper focus="skills" context={aiContext} onApply={applySuggestion} />
            </div>
          )}

          {step === 3 && (
            <div className="rg-review">
              <div className="rg-review-tabs">
                <button type="button" className={previewTab === 'preview' ? 'is-active' : ''} onClick={() => setPreviewTab('preview')}>
                  Preview
                </button>
                <button type="button" className={activeTab === 'markdown' ? 'is-active' : ''} onClick={() => setPreviewTab('markdown')}>
                  Markdown
                </button>
                {workflows.length > 0 && (
                  <button type="button" className={activeTab === 'workflows' ? 'is-active' : ''} onClick={() => setPreviewTab('workflows')}>
                    {workflows.length > 1 ? `Workflows (${workflows.length})` : 'Workflow'}
                  </button>
                )}
              </div>

              {activeTab === 'workflows' ? (
                <div className="rg-workflow">
                  <ol className="rg-workflow-steps">
                    <li>
                      Save {workflows.length > 1 ? 'each file below at its path' : 'the file below at its path'} in your
                      profile repo{username.trim() ? <> (<code>{username.trim()}/{username.trim()}</code>)</> : null}, next to the README.
                    </li>
                    <li>
                      If a run cannot push, go to <strong>Settings → Actions → General → Workflow permissions</strong> and
                      pick <strong>Read and write permissions</strong>.
                    </li>
                    <li>
                      Open <strong>Actions</strong>, pick the workflow, and click <strong>Run workflow</strong> once. After
                      that it runs on its own schedule.
                    </li>
                  </ol>
                  {workflows.map((wf) => (
                    <div key={wf.id} className="rg-workflow-block">
                      <div className="rg-workflow-head">
                        <span>
                          <strong>{wf.title}</strong> <code>{wf.path}</code>
                        </span>
                        <button type="button" className="rg-btn-ghost" onClick={() => handleCopy(wf.yaml, wf.id)}>
                          {copiedId === wf.id ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <p className="rg-workflow-note">{wf.note}</p>
                      <textarea className="rg-review-markdown" readOnly wrap="off" value={wf.yaml} aria-label={`${wf.title} workflow file`} />
                      <p className="rg-workflow-credit">
                        Workflow from <a href={wf.source.url} target="_blank" rel="noreferrer">{wf.source.label}</a>.
                      </p>
                    </div>
                  ))}
                </div>
              ) : activeTab === 'preview' ? (
                // Safe: buildReadmeMarkdown escapes all text content and only
                // allows http(s)/mailto link schemes before this ever renders.
                <div className="rg-review-preview" dangerouslySetInnerHTML={{ __html: markdown }} />
              ) : (
                <textarea className="rg-review-markdown" readOnly value={markdown} />
              )}
            </div>
          )}

          <div className="rg-nav">
            <button type="button" className="rg-btn-ghost" onClick={goBack} disabled={step === 0}>
              Back
            </button>
            {step < STEPS.length - 1 ? (
              <button type="button" className="rg-btn-primary" onClick={goNext}>
                Continue
              </button>
            ) : (
              <button type="button" className="rg-btn-primary" onClick={() => handleCopy(markdown, 'readme')}>
                {copiedId === 'readme' ? 'Copied!' : 'Copy README'}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReadmeGenerator;
