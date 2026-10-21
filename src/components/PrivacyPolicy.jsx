import React from 'react';
import { openConsentSettings } from '../lib/consent';

// Written from what this codebase actually does. When a feature starts
// collecting something new, update the matching section and LAST_UPDATED.
const LAST_UPDATED = '21 October 2026';
const CONTACT_EMAIL = 'awahid.safhadi@gmail.com';

const COOKIES = [
  ['_ga', 'Google Analytics', 'Tells visits from the same browser apart', 'Up to 2 years', 'Only after you accept'],
  ['_ga_BGRDF5BFFD', 'Google Analytics', 'Keeps the state of your current visit', 'Up to 2 years', 'Only after you accept'],
  ['_clck', 'Microsoft Clarity', 'Recognises the same browser across visits', 'Up to 13 months', 'Only after you accept'],
  ['_clsk', 'Microsoft Clarity', 'Links page views into one session recording', 'Up to 30 days', 'Only after you accept'],
];

const BROWSER_STORAGE = [
  ['aw-analytics-consent', 'Your cookie choice (accepted or declined)', 'Until you clear site data'],
  ['awahids:floating-faq:v1', 'Your chat with the FAQ assistant, so it is still there on your next visit', 'Until you clear site data'],
];

const RETENTION = [
  ['CV download details (name, email, note)', 'Until you ask me to delete them'],
  ['AI assistant questions and answers', '90 days, then deleted automatically'],
  ['Google Analytics data', 'As set in Google Analytics (2 or 14 months), then deleted by Google'],
  ['Microsoft Clarity recordings', '30 days (13 months for the few I save to study), then deleted by Microsoft'],
  ['Microsoft Clarity heatmaps', '13 months, aggregated'],
  ['Plausible statistics', 'Aggregated counts only, with no personal data'],
  ['Hosting and error logs (Vercel, n8n)', 'Short-term, for security and fixing errors'],
];

const PROCESSORS = [
  ['Vercel', 'Hosts the site and runs its server functions'],
  ['Supabase', 'Database for CV download details, the AI Q&A archive and visitor counters'],
  ['Google Analytics', 'Usage statistics, only with your consent'],
  ['Microsoft Clarity', 'Session recordings and heatmaps, only with your consent'],
  ['Plausible Analytics', 'Cookieless, aggregated visit statistics'],
  ['SumoPod', 'AI gateway that generates the AI assistant, AI Lab and README helper answers'],
  ['n8n and Hermes', 'My automation server: runs the Hermes assistant, logs AI request outcomes and alerts me to errors'],
  ['GitHub', 'Public profile data for the README generator cards'],
  ['Google Fonts and skillicons.dev', 'Serve fonts and skill icons, so they see your IP address like any web server'],
];

const Table = ({ head, rows }) => (
  <div className="privacy-table-wrap">
    <table className="privacy-table">
      <thead>
        <tr>{head.map((cell) => <th key={cell} scope="col">{cell}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row[0]}>
            {row.map((cell, index) => (index === 0 ? <th key={cell} scope="row"><code>{cell}</code></th> : <td key={`${row[0]}-${index}`}>{cell}</td>))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const PrivacyPolicy = () => (
  <article className="s-privacy">
    <a href="/" className="prd-back">← Back to portfolio</a>
    <header className="privacy-head">
      <p className="s-eyebrow">{'// PRIVACY_POLICY'}</p>
      <h1>Privacy Policy</h1>
      <p className="privacy-updated">Last updated: {LAST_UPDATED}</p>
    </header>

    <section className="privacy-summary" aria-label="Summary">
      <h2>The short version</h2>
      <ul>
        <li>No ads, and no selling or sharing of your data for marketing.</li>
        <li>
          Google Analytics and Microsoft Clarity only set cookies after you accept them, and Clarity does not run at
          all before that. Plausible counts visits without cookies.
        </li>
        <li>I only get your name and email if you give them to me, for example to download my CV.</li>
        <li>Questions you send to the AI features go to an AI provider to be answered and are kept for 90 days.</li>
        <li>You can ask me to see, correct or delete your data at any time: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</li>
      </ul>
    </section>

    <section>
      <h2>Who is responsible</h2>
      <p>
        This is the personal portfolio of A Wahid Saphadi, an independent developer based in Bekasi, West Java,
        Indonesia. I decide how the data described here is used. Contact me at{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> for anything about your privacy.
      </p>
      <p>
        This policy covers awahids.my.id: the portfolio, AI Lab, README Generator and PRD Generator pages. The PRD
        Generator app at prd.awahids.my.id and the booking page are separate services with their own terms.
      </p>
    </section>

    <section>
      <h2>What I collect and why</h2>

      <h3>When you visit any page</h3>
      <ul>
        <li>
          <b>Server logs.</b> Like every website, the hosting provider (Vercel) records technical request data such as
          your IP address, browser and the page requested, to deliver the site and keep it secure.
        </li>
        <li>
          <b>Plausible Analytics.</b> Counts page views and a few actions (for example a CV download) without cookies
          and without identifying you. It stores no personal data.
        </li>
        <li>
          <b>Google Analytics 4.</b> Shows which pages and tools people use and how they find the site. It sets cookies
          only after you click <i>Accept</i> in the cookie banner. Until then, or if you decline, Google Consent Mode
          sends Google cookieless signals without identifiers, which cannot be linked to you. I record actions such as
          copying the README, choosing a template or asking the AI assistant, but never what you type: no questions,
          names or emails go to Google Analytics.
        </li>
        <li>
          <b>Microsoft Clarity.</b> Only loads after you click <i>Accept</i>. It records how pages are used (mouse
          movement, clicks, scrolling, the page layout) as session replays and heatmaps, so I can see where people get
          stuck. Text you type is hidden, and so are the areas that show your own words: the FAQ chat, the AI Lab
          brief, the README Generator form and preview, and the CV download form.
        </li>
      </ul>

      <h3>When you download my CV</h3>
      <p>
        The download form asks for your name and email, plus an optional note such as your company. I store them in my
        database so I know who is interested in my work and can reply if you want to talk. I do not add you to a
        mailing list.
      </p>

      <h3>When you use the AI features</h3>
      <p>
        The FAQ assistant, the AI Lab project brief and the README Generator's AI helper send what you type to an AI
        provider (SumoPod) to produce an answer. Assistant questions may also go through my automation server (n8n and
        Hermes).
      </p>
      <ul>
        <li>
          Questions and answers from the FAQ assistant are archived for 90 days to improve future answers. The archive
          holds the text, its language and the time only: no IP address or other identifier.
        </li>
        <li>
          For monitoring, my automation server may log each AI request with its outcome, a short preview of the text,
          your IP address and browser. It alerts me when something fails.
        </li>
        <li>
          Please do not put sensitive personal information in your questions or briefs.
        </li>
      </ul>

      <h3>When you use the README Generator</h3>
      <ul>
        <li>
          Your settings stay in your browser, in the part of the page address after <code>#</code>. That part is never
          sent to my server or to analytics. If you share the link, whoever opens it sees those settings.
        </li>
        <li>
          The stats cards and the AI stats helper read your public GitHub profile (stars, commits, languages, top
          repositories) through the GitHub API, using the username you enter.
        </li>
        <li>
          The optional visitor counter badge stores only a number of views per GitHub username.
        </li>
      </ul>
    </section>

    <section>
      <h2>Cookies and browser storage</h2>
      <p>The only cookies are analytics cookies from Google Analytics and Microsoft Clarity, and only after you accept them:</p>
      <Table head={['Cookie', 'Set by', 'Purpose', 'Lasts', 'When']} rows={COOKIES} />
      <p>The site also keeps two small items in your browser's local storage, which never leave your device:</p>
      <Table head={['Key', 'Holds', 'Kept']} rows={BROWSER_STORAGE} />
      <p>
        You can change your cookie choice at any time:{' '}
        <button type="button" className="privacy-inline-btn" onClick={openConsentSettings}>
          open cookie settings
        </button>
        . Declining removes the Google Analytics and Clarity cookies that were already set.
      </p>
    </section>

    <section>
      <h2>Legal basis</h2>
      <ul>
        <li>
          <b>Consent</b> for Google Analytics and Microsoft Clarity, and for the details you give me in the CV and AI
          forms.
        </li>
        <li>
          <b>Legitimate interest</b> for server logs, cookieless statistics and error monitoring, to run a secure and
          working site.
        </li>
      </ul>
      <p>
        This follows Indonesia's Personal Data Protection Law (UU PDP No. 27/2022) and, for visitors from the European
        Union, the GDPR.
      </p>
    </section>

    <section>
      <h2>Who processes the data</h2>
      <p>
        I use these services to run the site. They process data on my behalf, and some are based outside Indonesia
        (mainly in the United States and the European Union), so your data may be transferred there.
      </p>
      <Table head={['Service', 'What for']} rows={PROCESSORS} />
      <p>I do not sell your data or share it with anyone else, unless the law requires it.</p>
    </section>

    <section>
      <h2>How long I keep it</h2>
      <Table head={['Data', 'Kept']} rows={RETENTION} />
    </section>

    <section>
      <h2>Your rights</h2>
      <p>You can ask me to:</p>
      <ul>
        <li>tell you what data I hold about you and give you a copy;</li>
        <li>correct it, or delete it;</li>
        <li>stop or limit using it, or object to it being used;</li>
        <li>withdraw your consent at any time, which does not affect what happened before.</li>
      </ul>
      <p>
        Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and I will answer as soon as I can, within the time
        the law allows. You can also complain to the data protection authority where you live.
      </p>
    </section>

    <section>
      <h2>Children</h2>
      <p>This site is not aimed at children, and I do not knowingly collect data from them.</p>
    </section>

    <section>
      <h2>Changes</h2>
      <p>
        If I change how data is used, I will update this page and the date at the top. Significant changes will also
        show the cookie banner again where your consent is needed.
      </p>
    </section>
  </article>
);

export default PrivacyPolicy;
