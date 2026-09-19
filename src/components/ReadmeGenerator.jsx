import React, { useMemo, useState } from 'react';
import { buildReadmeMarkdown } from '../lib/readmeTemplate';

const DEFAULT_SKILLS =
  'git,babel,docker,bash,bitbucket,bootstrap,bun,css,express,gatsby,github,gitlab,go,graphql,heroku,html,js,jest,laravel,linux,md,mongodb,mysql,nestjs,netlify,nextjs,nodejs,notion,npm,php,postgres,postman,powershell,prisma,redis,sentry,sequelize,tailwind,ts,ubuntu,vscode,yarn';

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
  const [taglineText, setTaglineText] = useState('Hello, There! 👋\nNice to meet you!');
  const [bioText, setBioText] = useState('');
  const [skillsText, setSkillsText] = useState(DEFAULT_SKILLS);
  const [socials, setSocials] = useState(() => Object.fromEntries(SOCIAL_FIELDS.map((f) => [f.key, ''])));
  const [previewTab, setPreviewTab] = useState('preview');
  const [copied, setCopied] = useState(false);

  const markdown = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return buildReadmeMarkdown(
      {
        username,
        pinnedRepos: pinnedReposText.split(',').map((repo) => repo.trim()),
        showVisitorCounter,
        taglineLines: taglineText.split('\n').map((line) => line.trim()),
        bio: bioText.split('\n').map((line) => line.trim()),
        skills: skillsText.split(',').map((code) => code.trim()),
        socialLinks: SOCIAL_FIELDS.map((field) => {
          const value = socials[field.key].trim();
          return { label: field.linkLabel, url: value ? field.toUrl(value) : '' };
        }),
      },
      { origin }
    );
  }, [username, pinnedReposText, showVisitorCounter, taglineText, bioText, skillsText, socials]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
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
                Pinned repos for stars badges (comma-separated, optional)
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
            </div>
          )}

          {step === 1 && (
            <div className="rg-fields">
              <label>
                Typing lines (one per line)
                <textarea rows={3} value={taglineText} onChange={(e) => setTaglineText(e.target.value)} />
              </label>
              <label>
                Bio (one paragraph per line)
                <textarea rows={4} value={bioText} onChange={(e) => setBioText(e.target.value)} />
              </label>
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
              <label>
                Skill icons (comma-separated)
                <textarea rows={3} value={skillsText} onChange={(e) => setSkillsText(e.target.value)} />
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="rg-review">
              <div className="rg-review-tabs">
                <button type="button" className={previewTab === 'preview' ? 'is-active' : ''} onClick={() => setPreviewTab('preview')}>
                  Preview
                </button>
                <button type="button" className={previewTab === 'markdown' ? 'is-active' : ''} onClick={() => setPreviewTab('markdown')}>
                  Markdown
                </button>
              </div>

              {previewTab === 'preview' ? (
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
              <button type="button" className="rg-btn-primary" onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy README'}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReadmeGenerator;
