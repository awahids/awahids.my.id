import React from 'react';

export const PRD_APP_URL = 'https://prd.awahids.my.id';

const FLOW = [
  ['Struktur', 'Ceritakan idenya, pilih tech stack, jawab beberapa pertanyaan, lalu lihat peta fitur per fase.'],
  ['PRD', 'Dokumen lengkap: overview, requirement, fitur inti, user flow, arsitektur dan skema database.'],
  ['Task', 'PRD dipecah jadi task per fitur yang siap dikerjakan, termasuk oleh AI coding agent.'],
];

const PrdPromo = () => (
  <section className="s-prd-generator">
    <header className="prd-head">
      <p className="s-eyebrow">{'// PRD_GENERATOR'}</p>
      <h1>Dari ide ke PRD dan task.</h1>
    </header>
    <p className="prd-lede">
      Tool yang saya pakai untuk scoping project: ide mentah jadi dokumen requirement yang rapi dan daftar task yang
      bisa langsung dikerjakan.
    </p>

    <ol className="prd-flow">
      {FLOW.map(([title, text]) => (
        <li key={title}>
          <b>{title}</b>
          <span>{text}</span>
        </li>
      ))}
    </ol>

    <a className="btn-prime" href={PRD_APP_URL} target="_blank" rel="noopener noreferrer">
      Buka PRD Generator
    </a>
    <p className="prd-note">Masuk dengan Google. Akun baru bisa membuat 1 PRD gratis setiap bulan.</p>
  </section>
);

export default PrdPromo;
