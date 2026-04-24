import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useSectionMotion } from '../lib/sectionMotion';
import { BOOKING_URL } from '../lib/links';

const BRIEF_WEBHOOK_URL = import.meta.env.VITE_AI_BRIEF_ENDPOINT || '/api/ai-brief';
const FAQ_WEBHOOK_URL = import.meta.env.VITE_AI_FAQ_ENDPOINT || '/api/ai-faq';

const QUICK_QUESTIONS = [
  'Can you build n8n automation for lead capture?',
  'What stack do you recommend for admin dashboard + API?',
  'How do you integrate AI into existing backend?',
  'Can you help with deployment and CI/CD too?',
];

const STARTER_FAQ_MESSAGE = {
  id: 'faq-start',
  role: 'assistant',
  source: 'local',
  text:
    'Ask me about services, stack, n8n automation, AI integration, and delivery approach. I can answer instantly from this portfolio context.',
};

const DEFAULT_STACK = ['React', 'Node.js', 'NestJS', 'PostgreSQL', 'Docker'];

const COMMERCE_TERMS = ['marketplace', 'ecommerce', 'commerce', 'checkout', 'payment', 'catalog'];
const DASHBOARD_TERMS = ['dashboard', 'admin', 'internal', 'operation', 'approval', 'reporting'];
const EDUCATION_TERMS = ['education', 'learning', 'course', 'lesson', 'student'];
const WAREHOUSE_TERMS = ['warehouse', 'inventory', 'stock', 'wms', 'fulfillment', 'batch'];
const REALTIME_TERMS = ['realtime', 'real-time', 'live', 'tracking', 'stream'];
const AI_TERMS = ['ai', 'llm', 'openai', 'chatbot', 'assistant', 'rag'];
const AUTOMATION_TERMS = ['automation', 'n8n', 'workflow', 'webhook', 'integration', 'zap'];

const INDONESIAN_LANGUAGE_HINTS = [
  'yang', 'dan', 'untuk', 'saya', 'apa', 'bagaimana', 'bisa', 'dengan',
  'tolong', 'apakah', 'berapa', 'dimana', 'lokasi', 'pengalaman', 'kontak',
  'proyek', 'jasa', 'kerja', 'kamu', 'anda', 'aplikasi', 'pengguna', 'target',
  'integrasi', 'kendala', 'metrik', 'keberhasilan', 'tujuan',
];

const ENGLISH_LANGUAGE_HINTS = [
  'the', 'and', 'for', 'what', 'how', 'can', 'with', 'please', 'where',
  'experience', 'contact', 'project', 'services', 'stack', 'deployment',
  'users', 'timeline', 'integrations', 'constraints', 'goals',
];

const scoreLanguageHints = (text, hints) =>
  hints.reduce((score, token) => {
    const pattern = new RegExp(`\\b${token}\\b`, 'g');
    const matches = text.match(pattern);
    return score + (matches ? matches.length : 0);
  }, 0);

const detectInputLanguage = (text = '') => {
  const normalized = text.toLowerCase();
  const idScore = scoreLanguageHints(normalized, INDONESIAN_LANGUAGE_HINTS);
  const enScore = scoreLanguageHints(normalized, ENGLISH_LANGUAGE_HINTS);

  if (idScore > enScore) return 'id';
  return 'en';
};

const pickByLanguage = (lang, copy) => (lang === 'id' ? copy.id : copy.en);

const FAQ_RULES = [
  {
    keywords: ['n8n', 'workflow', 'automation', 'webhook', 'otomasi'],
    answer: {
      id: 'Bisa. Di pekerjaan saya, automation memang salah satu fokus utama, termasuk n8n webhook flow dan integrasi ke layanan lain supaya proses manual tim bisa berkurang.',
      en: 'Yes, I can. In my recent work, automation is one of my core focuses, including n8n webhook flows and third-party integrations to reduce manual work.',
    },
  },
  {
    keywords: ['ai', 'openai', 'llm', 'assistant', 'chatbot'],
    answer: {
      id: 'Saya bisa bantu integrasi AI ke alur backend yang sudah ada. Biasanya saya mulai dari use case yang sempit dulu, lalu dibikin aman lewat validasi, logging, dan fallback sebelum di-scale.',
      en: 'I can help integrate AI into your existing backend workflows. I usually start with a narrow use case first, then harden it with validation, logging, and fallback before scaling.',
    },
  },
  {
    keywords: ['stack', 'tech', 'technology', 'architecture', 'backend', 'api'],
    answer: {
      id: 'Kalau dari stack yang saya pakai di CV: frontend biasanya React/Next.js/Vue.js, backend Node.js/NestJS/Express, databasenya PostgreSQL atau MySQL, lalu deployment lewat Docker + Vercel/VPS/Nginx/Cloudflare.',
      en: 'From my CV stack: I usually use React/Next.js/Vue.js for frontend, Node.js/NestJS/Express for backend, PostgreSQL or MySQL for data, and Docker plus Vercel/VPS/Nginx/Cloudflare for deployment.',
    },
  },
  {
    keywords: ['timeline', 'berapa lama', 'deadline', 'estimasi', 'delivery'],
    answer: {
      id: 'Timeline paling tergantung scope dan jumlah integrasi. Dari pengalaman saya, delivery bertahap biasanya paling aman: fitur inti dulu, setelah stabil baru lanjut ke pengembangan berikutnya.',
      en: 'Timeline mostly depends on scope and integration count. In my experience, phased delivery is usually safer: ship the core first, then expand once things are stable.',
    },
  },
  {
    keywords: ['harga', 'price', 'cost', 'budget', 'rate'],
    answer: {
      id: 'Untuk biaya, biasanya saya hitung berdasarkan scope, risiko, dan model delivery. Langkah terbaiknya short discovery call dulu supaya requirement bisa dipetakan ke milestone dan effort yang realistis.',
      en: 'Pricing depends on scope, risk, and delivery model. The best next step is a short discovery call so I can map your requirements into realistic milestones and effort.',
    },
  },
  {
    keywords: ['deploy', 'deployment', 'ci', 'cd', 'devops', 'vercel', 'docker', 'nginx'],
    answer: {
      id: 'Ya, deployment juga area yang sering saya handle. Di CV saya ada Docker, Vercel, VPS, Nginx, dan Cloudflare, biasanya sekalian saya rapikan flow release-nya supaya lebih maintainable.',
      en: 'Yes, deployment is also an area I handle often. In my CV you can see Docker, Vercel, VPS, Nginx, and Cloudflare, and I usually improve the release flow as well for maintainability.',
    },
  },
  {
    keywords: ['fullstack', 'service', 'what do you build', 'layanan', 'jasa'],
    answer: {
      id: 'Yang biasa saya kerjakan itu end-to-end: web app, admin dashboard, backend API, automation/integration, arsitektur, sampai deployment. Jadi tetap fullstack, tapi dengan kekuatan utama di backend.',
      en: 'I usually handle projects end-to-end: web apps, admin dashboards, backend APIs, automation/integration, architecture, and deployment. So it is fullstack delivery, with backend as my strongest layer.',
    },
  },
  {
    keywords: ['pengalaman', 'experience', 'career', 'rasa group', 'ethis'],
    answer: {
      id: 'Saya punya pengalaman 4+ tahun. Saat ini saya di Rasa Group sebagai Senior IT Developer (sejak Feb 2025), sebelumnya Backend Developer di PT Ethis Fintech Indonesia, dan juga sempat menangani proyek di Tokokupon.com serta adala.id.',
      en: 'I have 4+ years of experience. I am currently a Senior IT Developer at Rasa Group (since Feb 2025), previously a Backend Developer at PT Ethis Fintech Indonesia, and I also worked on projects at Tokokupon.com and adala.id.',
    },
  },
  {
    keywords: ['lokasi', 'location', 'where are you based'],
    answer: {
      id: 'Saya berbasis di Cikarang, Bekasi, Jawa Barat. Untuk kerja remote juga terbuka.',
      en: 'I am based in Cikarang, Bekasi, West Java, and I am open to remote collaboration as well.',
    },
  },
  {
    keywords: ['contact', 'kontak', 'email', 'hubungi'],
    answer: {
      id: 'Paling cepat lewat email di awahid.safhadi@gmail.com. Kalau mau langsung bahas proyek, bisa booking juga di https://janji.online/book/awahids.',
      en: 'The fastest way is email at awahid.safhadi@gmail.com. If you want to discuss a project directly, you can book a call at https://janji.online/book/awahids.',
    },
  },
  {
    keywords: ['project', 'portfolio', 'adawms', 'tokokupon', 'qala temu', 'arafah'],
    answer: {
      id: 'Beberapa project yang ada di portfolio saya misalnya Arafah Group, AdaWMS, Belajar Ngaji, Tokokupon.id, WMS Rasa Group, dan Qala Temu. Mayoritas fokusnya di backend API, operasional sistem, dan integrasi.',
      en: 'Some projects in my portfolio include Arafah Group, AdaWMS, Belajar Ngaji, Tokokupon.id, WMS Rasa Group, and Qala Temu. Most of them focus on backend APIs, operational systems, and integrations.',
    },
  },
];

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/\n|,|;|\|/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const matchesAny = (text, terms) => terms.some((term) => text.includes(term));

const inferComplexity = ({ coreGoals, integrations, constraints, timeline }) => {
  const combinedLength = `${coreGoals} ${constraints}`.trim().length;
  const integrationCount = toArray(integrations).length;
  const timelineText = String(timeline || '').toLowerCase();

  let score = 0;

  if (combinedLength > 260) score += 2;
  else if (combinedLength > 120) score += 1;

  if (integrationCount >= 3) score += 2;
  else if (integrationCount >= 1) score += 1;

  if (/(1\s*week|2\s*week|7\s*day|14\s*day|1\s*minggu|2\s*minggu)/.test(timelineText)) {
    score += 1;
  }

  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
};

const cleanField = (value) => String(value || '').trim();

const joinNaturalList = (items, language = 'en') => {
  if (!items.length) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) {
    return language === 'id'
      ? `${items[0]} dan ${items[1]}`
      : `${items[0]} and ${items[1]}`;
  }

  const head = items.slice(0, -1).join(', ');
  const tail = items[items.length - 1];
  return language === 'id' ? `${head}, dan ${tail}` : `${head}, and ${tail}`;
};

const looksTightTimeline = (timeline = '') =>
  /(1\s*week|2\s*week|7\s*day|14\s*day|1\s*minggu|2\s*minggu|asap|segera|urgent)/i.test(
    timeline
  );

const buildLocalBriefAnalysis = (payload, language = 'en') => {
  const productType = cleanField(payload.productType);
  const targetUsers = cleanField(payload.targetUsers);
  const coreGoals = cleanField(payload.coreGoals);
  const integrations = toArray(payload.integrations);
  const timeline = cleanField(payload.timeline);
  const successMetric = cleanField(payload.successMetric);
  const constraints = cleanField(payload.constraints);

  const combinedText = [
    productType,
    targetUsers,
    coreGoals,
    payload.integrations,
    timeline,
    successMetric,
    constraints,
  ]
    .join(' ')
    .toLowerCase();

  const integrationText = joinNaturalList(integrations, language);
  const stackSet = new Set(DEFAULT_STACK);

  if (matchesAny(combinedText, DASHBOARD_TERMS)) {
    stackSet.add('Ant Design');
    stackSet.add('Role-Based Access Control');
  }

  if (matchesAny(combinedText, COMMERCE_TERMS)) {
    stackSet.add('Redis');
    stackSet.add('Queue Worker');
  }

  if (matchesAny(combinedText, WAREHOUSE_TERMS)) {
    stackSet.add('Audit Logging');
    stackSet.add('Task Queue');
  }

  if (matchesAny(combinedText, EDUCATION_TERMS)) {
    stackSet.add('Content Service');
    stackSet.add('Object Storage');
  }

  if (matchesAny(combinedText, REALTIME_TERMS)) {
    stackSet.add('WebSocket Gateway');
    stackSet.add('Redis Pub/Sub');
  }

  if (matchesAny(combinedText, AUTOMATION_TERMS)) {
    stackSet.add('n8n');
    stackSet.add('Webhook Gateway');
  }

  if (matchesAny(combinedText, AI_TERMS)) {
    stackSet.add('OpenAI API');
    stackSet.add('Prompt Logging');
  }

  const complexity = inferComplexity(payload);

  const summaryParts =
    language === 'id'
      ? [
          `Dari brief yang kamu isi, fokus utamanya adalah membangun ${productType || 'produk digital'} untuk ${targetUsers || 'pengguna yang dituju'} dengan tujuan ${coreGoals || 'yang sudah dijelaskan di form'}.`,
        ]
      : [
          `Based on your brief, the main focus is to build ${productType || 'a digital product'} for ${targetUsers || 'the target users'} with the core objective of ${coreGoals || 'the goal you outlined in the form'}.`,
        ];

  if (integrations.length) {
    summaryParts.push(
      language === 'id'
        ? `Integrasi yang kamu minta mencakup ${integrationText}, jadi alurnya perlu dirancang supaya sinkronisasi antar sistem tetap stabil.`
        : `Requested integrations include ${integrationText}, so the flow should be designed to keep cross-system sync reliable.`
    );
  }

  if (timeline) {
    summaryParts.push(
      language === 'id'
        ? `Target waktunya ${timeline}, jadi planning delivery perlu dibuat bertahap dengan prioritas fitur inti lebih dulu.`
        : `The target timeline is ${timeline}, so delivery should be phased with core features prioritized first.`
    );
  }

  if (successMetric) {
    summaryParts.push(
      language === 'id'
        ? `Metrik keberhasilan yang kamu tulis adalah ${successMetric}, jadi dari awal implementasi perlu disiapkan cara tracking yang jelas.`
        : `Your success metric is ${successMetric}, so we should prepare clear tracking from the beginning of implementation.`
    );
  }

  if (constraints) {
    summaryParts.push(
      language === 'id'
        ? `Batasan yang kamu sebutkan (${constraints}) sebaiknya dijadikan constraint teknis sejak tahap desain, bukan ditunda di akhir.`
        : `The constraints you mentioned (${constraints}) should be treated as design constraints from day one, not deferred to the end.`
    );
  }

  summaryParts.push(
    language === 'id'
      ? 'Pendekatan backend-first tetap paling aman untuk menjaga stabilitas data, integrasi, dan skalabilitas saat produk mulai dipakai real user.'
      : 'A backend-first approach remains the safest way to keep data, integrations, and scalability stable once real users start using the product.'
  );

  const effortBase =
    complexity === 'high'
      ? (language === 'id'
        ? 'Scope ini termasuk kompleks dan cocok dijalankan sebagai delivery multi-milestone.'
        : 'This is a high-complexity scope and is best handled through multi-milestone delivery.')
      : complexity === 'medium'
        ? (language === 'id'
          ? 'Scope ini berada di level menengah dan realistis untuk delivery bertahap dengan milestone yang disiplin.'
          : 'This is a medium-complexity scope and realistic for phased delivery with disciplined milestones.')
        : (language === 'id'
          ? 'Scope ini relatif lean dan cocok untuk MVP cepat dengan fondasi backend yang rapi.'
          : 'This is a relatively lean scope and suitable for a fast MVP with a clean backend foundation.');

  const effort = looksTightTimeline(timeline)
    ? language === 'id'
      ? `${effortBase} Timeline ${timeline} cukup ketat, jadi kontrol scope dan prioritas harus lebih tegas.`
      : `${effortBase} The ${timeline} timeline is quite tight, so scope control and prioritization should be stricter.`
    : effortBase;

  const architecture = [
    language === 'id'
      ? `Layer experience dirancang khusus untuk ${targetUsers || 'pengguna utama'} supaya alur penggunaan ${productType || 'produk'} langsung sesuai konteks kerja mereka.`
      : `The experience layer should be tailored for ${targetUsers || 'the primary users'} so ${productType || 'the product'} flow matches their real usage context.`,
    language === 'id'
      ? `Layer aplikasi memusatkan business logic pada target ${coreGoals || 'tujuan utama'}, dengan API contract yang stabil untuk integrasi frontend maupun service lain.`
      : `The application layer should center business logic around ${coreGoals || 'the main objective'}, with stable API contracts for frontend and service integrations.`,
    language === 'id'
      ? 'Layer data menggunakan model relasional + audit trail supaya perubahan data kritis tetap bisa ditelusuri saat operasional berjalan.'
      : 'The data layer should use a relational model with audit trails so critical data changes remain traceable in live operations.',
  ];

  if (integrations.length) {
    architecture.push(
      language === 'id'
        ? `Layer integrasi menangani koneksi ke ${integrationText} dengan pola retry, validation, dan idempotency supaya sinkronisasi tidak rapuh.`
        : `The integration layer should connect with ${integrationText} using retry, validation, and idempotency patterns to avoid fragile synchronization.`
    );
  }

  if (successMetric) {
    architecture.push(
      language === 'id'
        ? `Observability disiapkan untuk memantau metrik ${successMetric} secara periodik setelah rilis.`
        : `Observability should be set up to monitor the ${successMetric} metric consistently after release.`
    );
  }

  const milestones = [
    language === 'id'
      ? `Milestone 1: rapikan scope dari form (produk: ${productType || '-'}, users: ${targetUsers || '-'}, goal: ${coreGoals || '-'}) dan sepakati acceptance criteria.`
      : `Milestone 1: refine scope from your form (product: ${productType || '-'}, users: ${targetUsers || '-'}, goal: ${coreGoals || '-'}) and lock acceptance criteria.`,
    language === 'id'
      ? `Milestone 2: bangun fondasi backend + data model inti untuk ${productType || 'produk'} dan workflow utama user.`
      : `Milestone 2: build the backend foundation + core data model for ${productType || 'the product'} and its primary user workflows.`,
    integrations.length
      ? (language === 'id'
        ? `Milestone 3: implementasi integrasi ${integrationText} beserta error handling dan validasi antar sistem.`
        : `Milestone 3: implement ${integrationText} integrations with cross-system validation and error handling.`)
      : (language === 'id'
        ? 'Milestone 3: selesaikan flow inti end-to-end lalu lanjutkan hardening pada edge case utama.'
        : 'Milestone 3: complete core end-to-end flows, then harden major edge cases.'),
    language === 'id'
      ? `Milestone 4: UAT, observability, dan rencana release${timeline ? ` sesuai target ${timeline}` : ''}.`
      : `Milestone 4: UAT, observability, and release planning${timeline ? ` aligned with the ${timeline} target` : ''}.`,
  ];

  const risks = [
    language === 'id'
      ? 'Scope creep jika prioritas fitur inti belum benar-benar dikunci di awal.'
      : 'Scope creep if core feature priorities are not firmly locked early.',
    integrations.length
      ? (language === 'id'
        ? `Ketergantungan eksternal pada integrasi ${integrationText} dapat menghambat timeline jika kontrak data belum final.`
        : `External dependencies from ${integrationText} integrations may slow delivery if data contracts are not finalized.`)
      : (language === 'id'
        ? 'Perubahan kebutuhan saat implementasi berjalan bisa mengganggu stabilitas delivery.'
        : 'Requirement changes during implementation can disrupt delivery stability.'),
    constraints
      ? (language === 'id'
        ? `Constraint "${constraints}" berpotensi memengaruhi urutan milestone jika tidak diterjemahkan jadi keputusan teknis sejak awal.`
        : `The "${constraints}" constraint may affect milestone sequencing if it is not translated into technical decisions early.`)
      : (language === 'id'
        ? 'Kualitas data bisa turun jika validasi dan audit trail tidak disiapkan dari awal.'
        : 'Data quality can degrade if validation and audit trails are not prepared early.'),
  ];

  if (successMetric) {
    risks.push(
      language === 'id'
        ? `Metrik ${successMetric} bisa sulit dievaluasi jika baseline dan cara ukur tidak disepakati sebelum rilis.`
        : `The ${successMetric} metric may be hard to evaluate if baseline and measurement rules are not defined before release.`
    );
  }

  if (looksTightTimeline(timeline)) {
    risks.push(
      language === 'id'
        ? `Timeline ${timeline} cukup ketat, jadi testing dan hardening berisiko terpotong jika scope tidak dijaga.`
        : `The ${timeline} timeline is tight, so testing and hardening may be compressed if scope is not controlled.`
    );
  }

  const nextActions = [
    language === 'id'
      ? `Finalkan 3-5 use case prioritas untuk ${targetUsers || 'target users'} sebelum development dimulai.`
      : `Finalize 3-5 priority use cases for ${targetUsers || 'the target users'} before development starts.`,
    integrations.length
      ? (language === 'id'
        ? `Siapkan daftar teknis integrasi ${integrationText}: endpoint, auth, format payload, dan retry policy.`
        : `Prepare technical integration specs for ${integrationText}: endpoints, auth, payload format, and retry policy.`)
      : (language === 'id'
        ? 'Tentukan API contract inti agar tim frontend dan backend bisa bergerak paralel.'
        : 'Define core API contracts so frontend and backend can move in parallel.'),
    successMetric
      ? (language === 'id'
        ? `Sepakati definisi metrik ${successMetric} beserta baseline awalnya.`
        : `Agree on the exact definition and baseline for the ${successMetric} metric.`)
      : (language === 'id'
        ? 'Tetapkan KPI utama sebagai acuan evaluasi setelah rilis.'
        : 'Set primary KPI targets to evaluate impact after release.'),
    constraints
      ? (language === 'id'
        ? `Turunkan constraint "${constraints}" menjadi checklist teknis yang harus lolos di setiap milestone.`
        : `Translate the "${constraints}" constraint into a technical checklist for each milestone.`)
      : (language === 'id'
        ? 'Siapkan checklist non-fungsional (security, reliability, observability) untuk hardening.'
        : 'Prepare a non-functional checklist (security, reliability, observability) for hardening.'),
    language === 'id'
      ? `Susun plan sprint${timeline ? ` menuju target ${timeline}` : ''} dengan dependency map yang jelas.`
      : `Prepare a sprint plan${timeline ? ` toward the ${timeline} target` : ''} with a clear dependency map.`,
  ];

  return {
    summary: summaryParts.join(' '),
    effort,
    recommendedStack: Array.from(stackSet).slice(0, 10),
    architecture: architecture.slice(0, 6),
    milestones: milestones.slice(0, 6),
    risks: risks.slice(0, 6),
    nextActions: nextActions.slice(0, 6),
  };
};

const normalizeBriefAnalysis = (rawPayload) => {
  const raw = rawPayload?.analysis || rawPayload?.data || rawPayload;

  if (!raw || typeof raw !== 'object') return null;

  const summary = String(
    raw.summary || raw.projectSummary || raw.briefSummary || ''
  ).trim();

  const effort = String(raw.effort || raw.scope || raw.complexity || '').trim();
  const recommendedStack = toArray(raw.recommendedStack || raw.stack || raw.techStack);
  const architecture = toArray(raw.architecture || raw.architecturePlan);
  const milestones = toArray(raw.milestones || raw.timelinePlan || raw.timeline);
  const risks = toArray(raw.risks || raw.riskNotes);
  const nextActions = toArray(raw.nextActions || raw.next_steps || raw.nextStep);

  if (!summary && recommendedStack.length === 0 && architecture.length === 0) {
    return null;
  }

  return {
    summary: summary || 'Analysis received from webhook.',
    effort: effort || 'Production scope',
    recommendedStack: recommendedStack.slice(0, 10),
    architecture: architecture.slice(0, 6),
    milestones: milestones.slice(0, 6),
    risks: risks.slice(0, 6),
    nextActions: nextActions.slice(0, 6),
  };
};

const normalizeFaqAnswer = (rawPayload) => {
  const raw = rawPayload?.data || rawPayload;
  if (!raw) return '';

  const answerCandidate =
    raw.answer || raw.message || raw.output || raw.text || raw.response || '';

  return String(answerCandidate || '').trim();
};

const buildLocalFaqAnswer = (question, language = detectInputLanguage(question)) => {
  const normalized = question.toLowerCase();

  for (const rule of FAQ_RULES) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) {
      return pickByLanguage(language, rule.answer);
    }
  }

  return language === 'id'
    ? 'Bisa. Ceritakan dulu stack dan targetmu, nanti saya bantu arahkan opsi implementasi yang paling realistis berdasarkan pengalaman saya di fullstack, backend API, automation, dan deployment.'
    : 'Absolutely. Share your current stack and target, and I can suggest the most practical implementation path based on my fullstack, backend API, automation, and deployment experience.';
};

const postJsonWithTimeout = async (url, payload, timeoutMs = 14000) => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const text = await response.text();

    if (!text.trim()) return {};

    try {
      return JSON.parse(text);
    } catch {
      return { answer: text };
    }
  } finally {
    window.clearTimeout(timeout);
  }
};

const createMessage = (role, text, source) => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  role,
  text,
  source,
});

const AILab = () => {
  const { viewport, sectionContainer, sectionItem, staggerGrid } =
    useSectionMotion();

  const [briefForm, setBriefForm] = useState({
    productType: '',
    targetUsers: '',
    coreGoals: '',
    integrations: '',
    timeline: '',
    successMetric: '',
    constraints: '',
  });

  const [briefResult, setBriefResult] = useState(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefStatus, setBriefStatus] = useState('');
  const [briefSource, setBriefSource] = useState('local');

  const [faqMessages, setFaqMessages] = useState([STARTER_FAQ_MESSAGE]);
  const [faqInput, setFaqInput] = useState('');
  const [faqLoading, setFaqLoading] = useState(false);
  const [faqStatus, setFaqStatus] = useState('');
  const chatViewportRef = useRef(null);

  useEffect(() => {
    const viewportNode = chatViewportRef.current;
    if (!viewportNode) return;
    viewportNode.scrollTop = viewportNode.scrollHeight;
  }, [faqMessages, faqLoading]);

  const onBriefFieldChange = (event) => {
    const { name, value } = event.target;
    setBriefForm((prev) => ({ ...prev, [name]: value }));
  };

  const onBriefSubmit = async (event) => {
    event.preventDefault();
    const briefLanguage = detectInputLanguage(
      Object.values(briefForm)
        .map((value) => String(value || ''))
        .join(' ')
    );

    setBriefLoading(true);
    setBriefStatus(
      briefLanguage === 'id' ? 'Sedang menganalisis brief...' : 'Analyzing brief...'
    );

    const payload = {
      ...briefForm,
      languageHint: briefLanguage,
      source: 'portfolio-ai-lab',
      submittedAt: new Date().toISOString(),
    };

    let analysis;
    let mode;
    let statusMessage;

    if (BRIEF_WEBHOOK_URL) {
      try {
        const responseData = await postJsonWithTimeout(BRIEF_WEBHOOK_URL, payload);
        analysis = normalizeBriefAnalysis(responseData);
        if (!analysis) throw new Error('Webhook response format is not compatible');
        mode = 'webhook';
        statusMessage = briefLanguage === 'id'
          ? 'Analisis dihasilkan dari endpoint AI.'
          : 'Analysis generated from AI endpoint.';
      } catch {
        analysis = buildLocalBriefAnalysis(payload, briefLanguage);
        mode = 'local';
        statusMessage = briefLanguage === 'id'
          ? 'Endpoint tidak tersedia. Menampilkan analisis lokal.'
          : 'Endpoint unavailable. Showing local analyzer result.';
      }
    } else {
      analysis = buildLocalBriefAnalysis(payload, briefLanguage);
      mode = 'local';
      statusMessage = briefLanguage === 'id'
        ? 'Mode analisis lokal aktif. Konfigurasikan endpoint API bila diperlukan.'
        : 'Local analyzer mode active. Configure API endpoint when needed.';
    }

    setBriefResult(analysis);
    setBriefSource(mode);
    setBriefStatus(statusMessage);
    setBriefLoading(false);
  };

  const askFaq = async (questionText) => {
    const cleanedQuestion = questionText.trim();
    if (!cleanedQuestion || faqLoading) return;
    const faqLanguage = detectInputLanguage(cleanedQuestion);

    setFaqLoading(true);
    setFaqStatus(faqLanguage === 'id' ? 'Sedang diproses...' : 'Thinking...');
    setFaqInput('');

    const userMessage = createMessage('user', cleanedQuestion, 'local');
    setFaqMessages((prev) => [...prev, userMessage]);

    let answerText;
    let mode;
    let statusMessage;

    if (FAQ_WEBHOOK_URL) {
      try {
        const responseData = await postJsonWithTimeout(FAQ_WEBHOOK_URL, {
          question: cleanedQuestion,
          languageHint: faqLanguage,
          source: 'portfolio-ai-faq',
          submittedAt: new Date().toISOString(),
        });
        answerText = normalizeFaqAnswer(responseData);
        if (!answerText) throw new Error('Empty answer from webhook');
        mode = 'webhook';
        statusMessage = faqLanguage === 'id'
          ? 'Jawaban dihasilkan dari endpoint AI berbasis CV.'
          : 'Answer generated from CV-grounded AI endpoint.';
      } catch {
        answerText = buildLocalFaqAnswer(cleanedQuestion, faqLanguage);
        mode = 'local';
        statusMessage = faqLanguage === 'id'
          ? 'Endpoint tidak tersedia. Menampilkan jawaban lokal berbasis CV.'
          : 'Endpoint unavailable. Showing local CV-based answer.';
      }
    } else {
      answerText = buildLocalFaqAnswer(cleanedQuestion, faqLanguage);
      mode = 'local';
      statusMessage = faqLanguage === 'id'
        ? 'Mode FAQ lokal berbasis CV aktif. Konfigurasikan endpoint API bila diperlukan.'
        : 'Local CV-based FAQ mode active. Configure API endpoint when needed.';
    }

    const assistantMessage = createMessage('assistant', answerText, mode);
    setFaqMessages((prev) => [...prev, assistantMessage]);
    setFaqStatus(statusMessage);
    setFaqLoading(false);
  };

  const onFaqSubmit = (event) => {
    event.preventDefault();
    void askFaq(faqInput);
  };

  const onQuickQuestion = (question) => {
    void askFaq(question);
  };

  return (
    <section className="s-ai-lab" id="ai-lab">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={sectionContainer}
      >
        <motion.div className="s-eyebrow" variants={sectionItem}>
          // AI_AUTOMATION_LAB
        </motion.div>
        <motion.h2 className="s-title" variants={sectionItem}>
          AI-Powered Delivery <span className="s-outline">for Real Projects</span>
        </motion.h2>
        <motion.p className="ai-lab-intro" variants={sectionItem}>
          Two practical modules ready to connect with n8n and AI endpoints: an automatic
          project brief analyzer and an interactive FAQ assistant.
        </motion.p>

        <motion.div className="ai-lab-grid" variants={staggerGrid}>
          <motion.article className="ai-card" variants={sectionItem}>
            <div className="ai-card-head">
              <div>
                <div className="ai-card-kicker">Module 01</div>
                <h3 className="ai-card-title">AI Project Brief Analyzer</h3>
              </div>
              <span className={`ai-mode-pill ${briefSource === 'webhook' ? 'is-live' : ''}`}>
                {briefSource === 'webhook' ? 'Webhook Mode' : 'Local Mode'}
              </span>
            </div>

            <form className="ai-form" onSubmit={onBriefSubmit}>
              <div className="ai-field">
                <label htmlFor="productType">Product Type</label>
                <input
                  id="productType"
                  name="productType"
                  value={briefForm.productType}
                  onChange={onBriefFieldChange}
                  placeholder="Example: Admin dashboard + backend API"
                  required
                />
              </div>

              <div className="ai-form-grid">
                <div className="ai-field">
                  <label htmlFor="targetUsers">Target Users</label>
                  <input
                    id="targetUsers"
                    name="targetUsers"
                    value={briefForm.targetUsers}
                    onChange={onBriefFieldChange}
                    placeholder="Ops team, admins, warehouse staff"
                    required
                  />
                </div>

                <div className="ai-field">
                  <label htmlFor="timeline">Desired Timeline</label>
                  <input
                    id="timeline"
                    name="timeline"
                    value={briefForm.timeline}
                    onChange={onBriefFieldChange}
                    placeholder="Example: 6 weeks"
                  />
                </div>
              </div>

              <div className="ai-field">
                <label htmlFor="coreGoals">Core Goals</label>
                <textarea
                  id="coreGoals"
                  name="coreGoals"
                  value={briefForm.coreGoals}
                  onChange={onBriefFieldChange}
                  placeholder="Describe current pain points and what outcome you want"
                  required
                />
              </div>

              <div className="ai-form-grid">
                <div className="ai-field">
                  <label htmlFor="integrations">Integrations</label>
                  <input
                    id="integrations"
                    name="integrations"
                    value={briefForm.integrations}
                    onChange={onBriefFieldChange}
                    placeholder="n8n, ERP, WhatsApp API, Google Sheets"
                  />
                </div>

                <div className="ai-field">
                  <label htmlFor="successMetric">Success Metric</label>
                  <input
                    id="successMetric"
                    name="successMetric"
                    value={briefForm.successMetric}
                    onChange={onBriefFieldChange}
                    placeholder="Response time, lead conversion, ops speed"
                  />
                </div>
              </div>

              <div className="ai-field">
                <label htmlFor="constraints">Constraints or Notes</label>
                <textarea
                  id="constraints"
                  name="constraints"
                  value={briefForm.constraints}
                  onChange={onBriefFieldChange}
                  placeholder="Budget, compliance, legacy system, team constraints"
                />
              </div>

              <div className="ai-actions">
                <button className="ai-submit" type="submit" disabled={briefLoading}>
                  {briefLoading ? 'Analyzing...' : 'Analyze Brief'}
                </button>
            <p className="ai-status" aria-live="polite">{briefStatus}</p>
              </div>
            </form>

            {briefResult && (
              <div className="ai-result">
                <h4>Analysis Result</h4>
                <p className="ai-result-summary">{briefResult.summary}</p>
                <div className="ai-result-effort">Estimated Scope: {briefResult.effort}</div>

                <div className="ai-result-block">
                  <span>Recommended Stack</span>
                  <div className="ai-chip-list">
                    {briefResult.recommendedStack.map((item) => (
                      <span key={item} className="ai-chip">{item}</span>
                    ))}
                  </div>
                </div>

                <div className="ai-result-block">
                  <span>Architecture Focus</span>
                  <ul>
                    {briefResult.architecture.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="ai-result-cols">
                  <div className="ai-result-block">
                    <span>Milestones</span>
                    <ul>
                      {briefResult.milestones.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="ai-result-block">
                    <span>Risks to Manage</span>
                    <ul>
                      {briefResult.risks.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="ai-result-block">
                  <span>Immediate Next Steps</span>
                  <ul>
                    {briefResult.nextActions.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </motion.article>

          <motion.article className="ai-card" variants={sectionItem}>
            <div className="ai-card-head">
              <div>
                <div className="ai-card-kicker">Module 02</div>
                <h3 className="ai-card-title">AI FAQ Assistant</h3>
              </div>
              <span className={`ai-mode-pill ${FAQ_WEBHOOK_URL ? 'is-live' : ''}`}>
                {FAQ_WEBHOOK_URL ? 'Webhook Ready' : 'Local Ready'}
              </span>
            </div>

            <p className="ai-faq-intro">
              Ask about services, architecture, timeline, AI integration, or automation scope.
            </p>

            <div className="ai-quick-list">
              {QUICK_QUESTIONS.map((question) => (
                <button
                  type="button"
                  key={question}
                  className="ai-quick-btn"
                  onClick={() => onQuickQuestion(question)}
                  disabled={faqLoading}
                >
                  {question}
                </button>
              ))}
            </div>

            <div className="ai-chat" ref={chatViewportRef}>
              {faqMessages.map((message) => (
                <article
                  key={message.id}
                  className={`ai-msg ${message.role === 'user' ? 'is-user' : 'is-assistant'}`}
                >
                  <div className="ai-msg-meta">
                    <span>{message.role === 'user' ? 'You' : 'Assistant'}</span>
                    <span>{message.source === 'webhook' ? 'AI' : 'Local'}</span>
                  </div>
                  <p>{message.text}</p>
                </article>
              ))}

              {faqLoading && (
                <article className="ai-msg is-assistant is-pending" aria-live="polite">
                  <div className="ai-msg-meta">
                    <span>Assistant</span>
                    <span>Thinking</span>
                  </div>
                  <p>Analyzing your question...</p>
                </article>
              )}
            </div>

            <form className="ai-chat-form" onSubmit={onFaqSubmit}>
              <label className="sr-only" htmlFor="faq-question-input">
                Ask a question
              </label>
              <input
                id="faq-question-input"
                value={faqInput}
                onChange={(event) => setFaqInput(event.target.value)}
                placeholder="Ask about stack, automation, or project delivery"
              />
              <button type="submit" className="ai-send" disabled={faqLoading || !faqInput.trim()}>
                {faqLoading ? '...' : 'Send'}
              </button>
            </form>

            <p className="ai-status" aria-live="polite">{faqStatus}</p>
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="ai-consult-link"
            >
              Prefer direct discussion? Book a project call ↗
            </a>
          </motion.article>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default AILab;
