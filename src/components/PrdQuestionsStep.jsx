import React from 'react';

const PrdQuestionsStep = ({ questions, answers, extra, onAnswer, onExtra, onBack, onSubmit, busy, error }) => (
  <form
    className="prd-step"
    onSubmit={(event) => {
      event.preventDefault();
      onSubmit();
    }}
  >
    {questions.map((question) => (
      <label key={question.id} className="prd-field">
        <span>{question.text}</span>
        {question.kind === 'choice' ? (
          <select value={answers[question.id] || ''} onChange={(event) => onAnswer(question.id, event.target.value)}>
            <option value="">Pilih…</option>
            {question.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : (
          <textarea
            rows={3}
            maxLength={500}
            value={answers[question.id] || ''}
            onChange={(event) => onAnswer(question.id, event.target.value)}
          />
        )}
      </label>
    ))}

    {/* Always present, so context the model never thought to ask about still
        has somewhere to go. */}
    <label className="prd-field">
      <span>Hal lain yang perlu diketahui</span>
      <textarea rows={3} maxLength={500} value={extra} onChange={(event) => onExtra(event.target.value)} />
    </label>

    {error && <p className="prd-error">{error}</p>}

    <div className="prd-actions">
      <button type="button" className="btn-ghost" onClick={onBack} disabled={busy}>
        Kembali
      </button>
      <button type="submit" className="btn-prime" disabled={busy}>
        {busy ? 'Menyusun PRD…' : 'Generate PRD'}
      </button>
    </div>
  </form>
);

export default PrdQuestionsStep;
