import React from 'react';

const MAX_DESCRIPTION = 1200;

const PrdDescribeStep = ({ projectName, description, onProjectName, onDescription, onSubmit, busy, error }) => (
  <form
    className="prd-step"
    onSubmit={(event) => {
      event.preventDefault();
      onSubmit();
    }}
  >
    <label className="prd-field">
      <span>Nama sistem (opsional)</span>
      <input
        type="text"
        value={projectName}
        maxLength={80}
        placeholder="Sistem Absensi"
        onChange={(event) => onProjectName(event.target.value)}
      />
    </label>

    <label className="prd-field">
      <span>Deskripsi singkat</span>
      <textarea
        value={description}
        maxLength={MAX_DESCRIPTION}
        rows={6}
        required
        placeholder="Ceritakan sistem yang mau dibuat, siapa penggunanya, dan masalah yang diselesaikan."
        onChange={(event) => onDescription(event.target.value)}
      />
      <small>
        {description.length}/{MAX_DESCRIPTION}
      </small>
    </label>

    {error && <p className="prd-error">{error}</p>}

    <button type="submit" className="btn-prime" disabled={busy || description.trim().length === 0}>
      {busy ? 'Menyusun pertanyaan…' : 'Lanjut — buat pertanyaan'}
    </button>
  </form>
);

export default PrdDescribeStep;
