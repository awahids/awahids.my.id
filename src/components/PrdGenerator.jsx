import React, { useMemo, useState } from 'react';
import { buildPrdMarkdown } from '../lib/prdTemplate';
import PrdDescribeStep from './PrdDescribeStep';
import PrdQuestionsStep from './PrdQuestionsStep';
import PrdReviewStep from './PrdReviewStep';

const STEPS = ['Describe', 'Clarify', 'Review'];

const postJson = async (url, body) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || 'Terjadi kesalahan, coba lagi');
  }
  return payload;
};

const PrdGenerator = () => {
  const [step, setStep] = useState(0);
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [extra, setExtra] = useState('');
  const [content, setContent] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const markdown = useMemo(() => (content ? buildPrdMarkdown(content, { today }) : ''), [content, today]);

  const answerPayload = () => {
    const rows = questions.map((question) => ({
      id: question.id,
      question: question.text,
      answer: answers[question.id] || '',
    }));
    if (extra.trim()) rows.push({ id: 'extra', question: 'Hal lain yang perlu diketahui', answer: extra });
    return rows.slice(0, 8);
  };

  const loadQuestions = async () => {
    setBusy(true);
    setError('');
    try {
      const payload = await postJson('/api/prd-questions', { description, projectName });
      setQuestions(payload.questions || []);
      setStep(1);
    } catch (caught) {
      setError(caught.message);
    } finally {
      setBusy(false);
    }
  };

  // Failure here keeps the answers in state on purpose: a model hiccup must not
  // cost the user the clarify stage they already filled in.
  const loadDraft = async () => {
    setBusy(true);
    setError('');
    try {
      const payload = await postJson('/api/prd-draft', { description, projectName, answers: answerPayload() });
      setContent(payload.content);
      setStep(2);
    } catch (caught) {
      setError(caught.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="s-prd-generator">
      <header className="prd-head">
        <p className="s-eyebrow">// PRD_GENERATOR</p>
        <h1>Generate a PRD</h1>
        <ol className="prd-rail">
          {STEPS.map((label, index) => (
            <li key={label} className={index === step ? 'is-current' : index < step ? 'is-done' : ''}>
              <span className="prd-rail-dot">{index < step ? '✓' : index + 1}</span>
              <span className="prd-rail-label">{label}</span>
            </li>
          ))}
        </ol>
      </header>

      {step === 0 && (
        <PrdDescribeStep
          projectName={projectName}
          description={description}
          onProjectName={setProjectName}
          onDescription={setDescription}
          onSubmit={loadQuestions}
          busy={busy}
          error={error}
        />
      )}

      {step === 1 && (
        <PrdQuestionsStep
          questions={questions}
          answers={answers}
          extra={extra}
          onAnswer={(id, value) => setAnswers((prev) => ({ ...prev, [id]: value }))}
          onExtra={setExtra}
          onBack={() => setStep(0)}
          onSubmit={loadDraft}
          busy={busy}
          error={error}
        />
      )}

      {step === 2 && (
        <PrdReviewStep content={content} markdown={markdown} onRetry={loadDraft} onBack={() => setStep(1)} busy={busy} />
      )}
    </section>
  );
};

export default PrdGenerator;
