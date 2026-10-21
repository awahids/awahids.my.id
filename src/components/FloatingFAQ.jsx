import React, { useState, useRef, useEffect } from 'react';
import { gsap, DUR, EASE_IN_OUT, prefersReducedMotion, useIsoLayoutEffect, usePresence } from '../lib/motion';
import { trackEvent } from '../lib/analytics';

const FAQ_WEBHOOK_URL = import.meta.env.VITE_AI_FAQ_ENDPOINT || '/api/ai-faq';
const AI_ASSISTANT_URL = import.meta.env.VITE_AI_ASSISTANT_ENDPOINT || '/api/ai-assistant';
const FAQ_STORAGE_KEY = 'awahids:floating-faq:v1';
const MAX_PERSISTED_MESSAGES = 40;

const STARTER_FAQ_MESSAGE = {
  id: 'faq-start-float',
  role: 'assistant',
  source: 'local',
  text: "Hi! I'm an AI assistant built into this portfolio. Ask me about my tech stack, past projects, or how I can help with your build.",
};

const QUICK_QUESTIONS = [
  'Build n8n automation?',
  'What stack do you recommend?',
  'Your experience?',
  'How to contact you?',
];

const FAQ_RULES = [
  {
    keywords: ['n8n', 'workflow', 'automation', 'webhook', 'otomasi'],
    answer: {
      id: 'Bisa banget. Di kerjaan sekarang, otomasi emang jadi salah satu fokus utamaku, termasuk bikin webhook flow di n8n dan integrasi ke layanan lain biar kerjaan manual tim bisa berkurang.',
      en: 'Yes, I can. In my recent work, automation is one of my core focuses, including n8n webhook flows and third-party integrations to reduce manual work.',
    },
  },
  {
    keywords: ['ai', 'openai', 'llm', 'assistant', 'chatbot'],
    answer: {
      id: 'Aku bisa bantu integrasi AI ke alur backend yang udah ada. Biasanya aku mulai dari use case yang spesifik dulu, terus dibikin aman pakai validasi, logging, dan fallback sebelum di-scale.',
      en: 'I can help integrate AI into your existing backend workflows. I usually start with a narrow use case first, then harden it with validation, logging, and fallback before scaling.',
    },
  },
  {
    keywords: ['stack', 'tech', 'technology', 'architecture', 'backend', 'api'],
    answer: {
      id: 'Kalau dari stack yang sering aku pakai: frontend biasanya React/Next.js/Vue.js, backend Node.js/NestJS/Express, database PostgreSQL atau MySQL, terus buat deploy pakai Docker + Vercel/VPS/Nginx/Cloudflare.',
      en: 'From my CV stack: I usually use React/Next.js/Vue.js for frontend, Node.js/NestJS/Express for backend, PostgreSQL or MySQL for data, and Docker plus Vercel/VPS/Nginx/Cloudflare for deployment.',
    },
  },
  {
    keywords: ['timeline', 'berapa lama', 'deadline', 'estimasi', 'delivery'],
    answer: {
      id: 'Timeline sih tergantung scope dan jumlah integrasinya. Dari pengalamanku, rilis bertahap biasanya paling aman: bikin fitur intinya dulu, kalau udah stabil baru lanjut ke tahap berikutnya.',
      en: 'Timeline mostly depends on scope and integration count. In my experience, phased delivery is usually safer: ship the core first, then expand once things are stable.',
    },
  },
  {
    keywords: ['harga', 'price', 'cost', 'budget', 'rate'],
    answer: {
      id: 'Buat biaya, biasanya aku hitung dari scope, risiko, sama model kerjanya. Paling enak sih kita ngobrol bentar (discovery call) biar requirement-nya jelas dan bisa dibikin estimasi yang realistis.',
      en: 'Pricing depends on scope, risk, and delivery model. The best next step is a short discovery call so I can map your requirements into realistic milestones and effort.',
    },
  },
  {
    keywords: ['deploy', 'deployment', 'ci', 'cd', 'devops', 'vercel', 'docker', 'nginx'],
    answer: {
      id: 'Iya, urusan deploy juga sering aku handle. Di CV ada Docker, Vercel, VPS, Nginx, sampai Cloudflare. Biasanya aku juga sekalian rapiin flow rilisnya biar ke depannya gampang dimaintain.',
      en: 'Yes, deployment is also an area I handle often. In my CV you can see Docker, Vercel, VPS, Nginx, and Cloudflare, and I usually improve the release flow as well for maintainability.',
    },
  },
  {
    keywords: ['fullstack', 'service', 'what do you build', 'layanan', 'jasa'],
    answer: {
      id: 'Biasanya yang aku kerjain itu end-to-end: web app, admin dashboard, backend API, otomasi/integrasi, arsitektur, sampai deploy. Jadi tetap fullstack, tapi emang kekuatan utamaku ada di backend.',
      en: 'I usually handle projects end-to-end: web apps, admin dashboards, backend APIs, automation/integration, architecture, and deployment. So it is fullstack delivery, with backend as my strongest layer.',
    },
  },
  {
    keywords: ['pengalaman', 'experience', 'career', 'rasa group', 'ethis'],
    answer: {
      id: 'Aku ada pengalaman 4+ tahun. Sekarang lagi di Rasa Group sebagai Senior IT Developer (dari Feb 2025), sebelumnya jadi Backend Developer di PT Ethis Fintech Indonesia, terus sempet juga pegang proyek di Tokokupon.com sama adala.id.',
      en: 'I have 4+ years of experience. I am currently a Senior IT Developer at Rasa Group (since Feb 2025), previously a Backend Developer at PT Ethis Fintech Indonesia, and I also worked on projects at Tokokupon.com and adala.id.',
    },
  },
  {
    keywords: ['lokasi', 'location', 'where are you based'],
    answer: {
      id: 'Aku base-nya di Cikarang, Bekasi, Jawa Barat. Tapi kalau buat kerja remote juga oke kok.',
      en: 'I am based in Cikarang, Bekasi, West Java, and I am open to remote collaboration as well.',
    },
  },
  {
    keywords: ['contact', 'kontak', 'email', 'hubungi'],
    answer: {
      id: 'Paling cepet bisa email ke awahid.safhadi@gmail.com. Kalau mau langsung ngobrolin project, bisa juga booking jadwal di https://qala.digital/book/awahids.',
      en: 'The fastest way is email at awahid.safhadi@gmail.com. If you want to discuss a project directly, you can book a call at https://qala.digital/book/awahids.',
    },
  },
  {
    keywords: ['project', 'portfolio', 'adawms', 'tokokupon', 'qala temu', 'arafah'],
    answer: {
      id: 'Beberapa project di portofolioku ada Arafah Group, AdaWMS, Belajar Ngaji, Tokokupon.id, WMS Rasa Group, sama Qala Temu. Kebanyakan fokusnya di backend API, sistem operasional, dan integrasi.',
      en: 'Some projects in my portfolio include Arafah Group, AdaWMS, Belajar Ngaji, Tokokupon.id, WMS Rasa Group, and Qala Temu. Most of them focus on backend APIs, operational systems, and integrations.',
    },
  },
];

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

const buildLocalFaqAnswer = (question, language = detectInputLanguage(question)) => {
  const normalized = question.toLowerCase();

  for (const rule of FAQ_RULES) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) {
      return pickByLanguage(language, rule.answer);
    }
  }

  return language === 'id'
    ? 'Bisa kok. Boleh diceritain dulu stack dan targetnya seperti apa? Nanti aku bantu arahin opsi yang paling oke berdasarkan pengalamanku di backend, integrasi, sama deploy.'
    : 'Absolutely. Share your current stack and target, and I can suggest the most practical implementation path based on my fullstack, backend API, automation, and deployment experience.';
};

const buildMaintenanceAnswer = (language) =>
  language === 'id'
    ? 'AI assistant lagi maintenance sebentar, coba lagi nanti ya. Sementara itu bisa langsung email ke awahid.safhadi@gmail.com atau booking call di https://qala.digital/book/awahids.'
    : "The AI assistant is under maintenance right now — please try again later. In the meantime, feel free to email awahid.safhadi@gmail.com or book a call at https://qala.digital/book/awahids.";

const normalizeFaqAnswer = (rawPayload) => {
  const raw = rawPayload?.data || rawPayload;
  if (!raw) return '';
  const answerCandidate =
    raw.answer || raw.message || raw.output || raw.text || raw.response || '';
  return String(answerCandidate || '').trim();
};

const createChatRequestError = (message, details = {}) =>
  Object.assign(new Error(message), {
    name: 'ChatRequestError',
    details,
  });

const parseResponsePayload = (text) => {
  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { answer: text };
  }
};

const postJsonWithTimeout = async (url, payload, timeoutMs = 14000) => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const text = await response.text();

    if (!response.ok) {
      const errorPayload = parseResponsePayload(text);
      throw createChatRequestError(
        errorPayload.error || errorPayload.message || errorPayload.answer || `Request failed with status ${response.status}`,
        {
          status: response.status,
          code: errorPayload.code || 'AI_REQUEST_FAILED',
          provider: errorPayload.meta?.provider,
          model: errorPayload.meta?.model,
        }
      );
    }

    return parseResponsePayload(text);
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw createChatRequestError('Request timed out. Please try again.', {
        code: 'REQUEST_TIMEOUT',
      });
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
};

const createMessage = (role, text, source, meta = {}) => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  role,
  text,
  source,
  ...meta,
});

const sanitizeStoredMessages = (storedMessages) => {
  if (!Array.isArray(storedMessages)) return [STARTER_FAQ_MESSAGE];

  const messages = storedMessages
    .map((message) => ({
      id: String(message?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`),
      role: message?.role === 'user' ? 'user' : 'assistant',
      source: String(message?.source || 'local'),
      text: String(message?.text || '').trim(),
    }))
    .filter((message) => message.text);

  return messages.length > 0 ? messages.slice(-MAX_PERSISTED_MESSAGES) : [STARTER_FAQ_MESSAGE];
};

const loadStoredFaqState = () => {
  if (typeof window === 'undefined') {
    return {
      isOpen: false,
      messages: [STARTER_FAQ_MESSAGE],
      input: '',
    };
  }

  try {
    const rawState = window.localStorage.getItem(FAQ_STORAGE_KEY);
    if (!rawState) {
      return {
        isOpen: false,
        messages: [STARTER_FAQ_MESSAGE],
        input: '',
      };
    }

    const parsedState = JSON.parse(rawState);

    return {
      isOpen: Boolean(parsedState?.isOpen),
      messages: sanitizeStoredMessages(parsedState?.messages),
      input: String(parsedState?.input || ''),
    };
  } catch {
    return {
      isOpen: false,
      messages: [STARTER_FAQ_MESSAGE],
      input: '',
    };
  }
};

// Both toggle icons are single open strokes so MorphSVG maps one onto the other.
const CHAT_ICON_D = 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2V15';
const CLOSE_ICON_D = 'M6 6L12 12L18 6L12 12L18 18L12 12L6 18';

const notificationEnter = (el) =>
  gsap.fromTo(el, { opacity: 0, x: 20, scale: 0.8 }, { opacity: 1, x: 0, scale: 1, duration: DUR.base, clearProps: 'transform' });
const notificationExit = (el) => gsap.to(el, { opacity: 0, x: 20, scale: 0.8, duration: DUR.fast });

const windowEnter = (el) =>
  gsap.fromTo(el, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: DUR.base, clearProps: 'transform' });
const windowExit = (el) => gsap.to(el, { opacity: 0, y: 24, duration: DUR.fast });

const badgeEnter = (el) =>
  gsap.fromTo(el, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: DUR.fast, clearProps: 'transform' });
const badgeExit = (el) => gsap.to(el, { opacity: 0, scale: 0.9, duration: DUR.fast });

const FloatingFAQ = () => {
  const [initialFaqState] = useState(loadStoredFaqState);
  const [isOpen, setIsOpen] = useState(initialFaqState.isOpen);
  const [messages, setMessages] = useState(initialFaqState.messages);
  const [input, setInput] = useState(initialFaqState.input);
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [unreadCount, setUnreadCount] = useState(() => (initialFaqState.isOpen ? 0 : 1));
  const [useHermes] = useState(false);
  const originalTitle = useRef(typeof document !== 'undefined' ? document.title : '');
  const chatViewportRef = useRef(null);
  const isOpenRef = useRef(false);
  const notificationRef = useRef(null);
  const windowRef = useRef(null);
  const badgeRef = useRef(null);
  const suggestionsRef = useRef(null);
  const seenMessageIds = useRef(new Set());
  const toggleIconRef = useRef(null);
  const toggleIconReady = useRef(false);

  const notificationShown = usePresence(showNotification && !isOpen, notificationRef, {
    enter: notificationEnter,
    exit: notificationExit,
  });
  const windowShown = usePresence(isOpen, windowRef, { enter: windowEnter, exit: windowExit });
  const badgeShown = usePresence(unreadCount > 0 && !isOpen, badgeRef, { enter: badgeEnter, exit: badgeExit });
  const showSuggestions = !loading && messages.length <= 1;

  // New messages rise in; the ones already there when the window opens ride its entrance.
  useIsoLayoutEffect(() => {
    const seen = seenMessageIds.current;
    const body = chatViewportRef.current;
    if (!isOpen || !body) {
      seen.clear();
      return;
    }
    if (!loading) seen.delete('pending');
    const firstPass = seen.size === 0;
    const fresh = [];
    body.querySelectorAll('[data-msg-id]').forEach((el) => {
      const id = el.dataset.msgId;
      if (seen.has(id)) return;
      seen.add(id);
      if (!firstPass) fresh.push(el);
    });
    if (fresh.length && !prefersReducedMotion()) {
      gsap.fromTo(fresh, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, clearProps: 'transform' });
    }
  }, [messages, loading, isOpen]);

  useIsoLayoutEffect(() => {
    const el = suggestionsRef.current;
    if (!el || prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.children,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.05, delay: 0.2, clearProps: 'transform' }
      );
    }, el);
    return () => ctx.revert();
  }, [showSuggestions, windowShown]);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Toggle icon morphs chat bubble <-> X; first paint and reduced motion just swap.
  useIsoLayoutEffect(() => {
    const path = toggleIconRef.current;
    if (!path) return undefined;
    const d = isOpen ? CLOSE_ICON_D : CHAT_ICON_D;
    if (!toggleIconReady.current || prefersReducedMotion()) {
      toggleIconReady.current = true;
      gsap.killTweensOf(path);
      path.setAttribute('d', d);
      return undefined;
    }
    const tween = gsap.to(path, { morphSVG: d, duration: 0.35, ease: EASE_IN_OUT });
    return () => tween.kill();
  }, [isOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(
        FAQ_STORAGE_KEY,
        JSON.stringify({
          isOpen,
          input,
          messages: sanitizeStoredMessages(messages),
          updatedAt: new Date().toISOString(),
        })
      );
    } catch {
      // Storage can fail in private browsing or quota-limited contexts.
    }
  }, [input, isOpen, messages]);

  const buildHistoryPayload = (sourceMessages) =>
    sourceMessages
      .filter(m => m.id !== 'faq-start-float' && m.source !== 'error')
      .slice(-6)
      .map(m => ({ role: m.role, text: m.text }));

  const markAssistantMessageUnread = () => {
    if (!isOpenRef.current || document.hidden) {
      setUnreadCount((prev) => prev + 1);
    }
  };

  const openChat = () => {
    isOpenRef.current = true;
    setIsOpen(true);
    setShowNotification(false);
    if (!document.hidden) {
      setUnreadCount(0);
    }
  };

  const closeChat = () => {
    isOpenRef.current = false;
    setIsOpen(false);
  };

  const toggleChat = () => {
    if (isOpenRef.current) {
      closeChat();
    } else {
      openChat();
    }
  };

  useEffect(() => {
    if (isOpen) return undefined;

    let shown = false;

    const revealIfClear = () => {
      if (shown || isOpenRef.current) return;
      const heroEl = document.getElementById('home');
      // No hero on screen (or not mounted yet) — stay put rather than assume it's clear.
      if (!heroEl) return;
      const heroCleared = heroEl.getBoundingClientRect().bottom <= window.innerHeight * 0.6;
      if (heroCleared) {
        shown = true;
        setShowNotification(true);
        window.removeEventListener('scroll', revealIfClear);
      }
    };

    // Fallback so the hint still appears for users who never scroll.
    const fallbackTimer = setTimeout(() => {
      if (!shown && !isOpenRef.current) {
        shown = true;
        setShowNotification(true);
      }
    }, 15000);

    // Only the scroll listener triggers the early reveal — checking on mount
    // would measure the hero before fonts/layout settle and fire too soon.
    window.addEventListener('scroll', revealIfClear, { passive: true });

    return () => {
      window.removeEventListener('scroll', revealIfClear);
      clearTimeout(fallbackTimer);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && chatViewportRef.current) {
      chatViewportRef.current.scrollTop = chatViewportRef.current.scrollHeight;
    }
  }, [messages, loading, isOpen]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isOpenRef.current) {
        setUnreadCount(0);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) ${originalTitle.current}`;
    } else {
      document.title = originalTitle.current;
    }
  }, [unreadCount]);

  useEffect(() => {
    if (messages.length === 0 || loading) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'assistant') return;

    const followUpIdText = 'Masih ada yang ingin ditanyakan?';
    const followUpEnText = 'Do you still have any questions?';

    if (lastMessage.text.includes(followUpIdText) || lastMessage.text.includes(followUpEnText)) {
      return;
    }

    const timer = setTimeout(() => {
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
      const lang = lastUserMsg ? detectInputLanguage(lastUserMsg.text) : 'en';

      const followUpText = lang === 'id'
        ? "Halo! Masih ada yang ingin ditanyakan? 😊"
        : "Hi! Do you still have any questions? 😊";

      setMessages(prev => [...prev, createMessage('assistant', followUpText, 'local')]);
      markAssistantMessageUnread();
    }, 60000); // 1 minute follow-up

    return () => clearTimeout(timer);
  }, [messages, loading]);

  const askFaq = async (questionText, options = {}) => {
    const { forceHermes = false, appendUser = true } = options;
    const cleanedQuestion = questionText.trim();
    if (!cleanedQuestion || loading) return;
    const faqLanguage = detectInputLanguage(cleanedQuestion);
    // That a question was asked, not what it says.
    trackEvent('FaqQuestion', { mode: forceHermes || useHermes ? 'assistant' : 'faq', language: faqLanguage });

    setLoading(true);
    setInput('');

    if (appendUser) {
      const userMessage = createMessage('user', cleanedQuestion, 'local');
      setMessages((prev) => [...prev, userMessage]);
    }

    let answerText;
    let mode;
    const shouldUseHermes = forceHermes || useHermes;

    if (shouldUseHermes && AI_ASSISTANT_URL) {
      try {
        const historyPayload = buildHistoryPayload(messages);

        const responseData = await postJsonWithTimeout(AI_ASSISTANT_URL, {
          question: cleanedQuestion,
          history: historyPayload,
          languageHint: faqLanguage,
          source: 'portfolio-floating-faq',
          submittedAt: new Date().toISOString(),
        }, 45000);
        answerText = normalizeFaqAnswer(responseData);
        if (!answerText) throw new Error('Empty answer');
        mode = 'hermes';
      } catch (error) {
        console.warn('AI assistant request failed:', error);
        answerText = buildMaintenanceAnswer(faqLanguage);
        mode = 'maintenance';
      }
    } else {
      if (FAQ_WEBHOOK_URL) {
        try {
          const historyPayload = buildHistoryPayload(messages);

          const responseData = await postJsonWithTimeout(FAQ_WEBHOOK_URL, {
            question: cleanedQuestion,
            history: historyPayload,
            languageHint: faqLanguage,
            source: 'portfolio-floating-faq',
            submittedAt: new Date().toISOString(),
          });
          answerText = normalizeFaqAnswer(responseData);
          if (!answerText) throw new Error('Empty answer');
          mode = 'webhook';
        } catch (error) {
          console.warn('FAQ webhook request failed:', error);
          answerText = buildMaintenanceAnswer(faqLanguage);
          mode = 'maintenance';
        }
      } else {
        answerText = buildLocalFaqAnswer(cleanedQuestion, faqLanguage);
        mode = 'local';
      }
    }

    const assistantMessage = createMessage('assistant', answerText, mode);
    setMessages((prev) => [...prev, assistantMessage]);
    markAssistantMessageUnread();
    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    void askFaq(input);
  };

  return (
    <div className="floating-faq-container">
      {notificationShown && (
        <div
          ref={notificationRef}
          className="floating-faq-notification"
          onClick={openChat}
        >
          <div className="ff-notification-text">
            {messages[0]?.text || "Need help? Ask the AI here! 🤖"}
          </div>
          <button
            className="ff-notification-close"
            aria-label="Dismiss notification"
            onClick={(e) => {
              e.stopPropagation();
              setShowNotification(false);
            }}
          >
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      )}

      {windowShown && (
        <div
          ref={windowRef}
          className="floating-faq-window"
          data-lenis-prevent
          data-lenis-prevent-wheel
          data-lenis-prevent-touch
        >
          <div className="floating-faq-header">
            <div className="ffh-info">
              <span className="ffh-title">AI Assistant</span>
              <span className="ffh-status">{useHermes ? '🤖 Hermes' : 'Online'}</span>
            </div>
            {/* <button
              className="ffh-toggle-hermes"
              onClick={() => setUseHermes(!useHermes)}
              title={useHermes ? 'Switch to SumoPod AI' : 'Switch to Hermes AI'}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '4px',
                opacity: 0.8
              }}
            >
              {useHermes ? '🤖' : '💬'}
            </button> */}
            <button className="ffh-close" aria-label="Close AI assistant" onClick={closeChat}>
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="floating-faq-body" ref={chatViewportRef}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                data-msg-id={msg.id}
                className={`ff-msg ${msg.role === 'user' ? 'is-user' : 'is-assistant'}`}
              >
                <div className="ff-msg-content">{msg.text}</div>
              </div>
            ))}
            {loading && (
              <div className="ff-msg is-assistant is-pending" data-msg-id="pending">
                <div className="ff-msg-content">
                  <span className="dot-typing"><span>.</span><span>.</span><span>.</span></span>
                </div>
              </div>
            )}
          </div>

          {showSuggestions && (
            <div className="floating-faq-suggestions" ref={suggestionsRef}>
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  className="ff-suggestion-btn"
                  onClick={() => askFaq(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <form className="floating-faq-footer" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Ask something..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" aria-label="Send message" disabled={!input.trim() || loading}>
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      )}

      <button
        className={`floating-faq-toggle ${isOpen ? 'is-active' : ''}`}
        aria-label={
          isOpen
            ? 'Close AI assistant'
            : unreadCount > 0
              ? `Open AI assistant, ${unreadCount} unread`
              : 'Open AI assistant'
        }
        aria-expanded={isOpen}
        onClick={toggleChat}
      >
        {badgeShown && (
          <div className="ff-unread-badge" aria-hidden="true" ref={badgeRef}>
            {unreadCount}
          </div>
        )}

        <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path ref={toggleIconRef} d={initialFaqState.isOpen ? CLOSE_ICON_D : CHAT_ICON_D} />
        </svg>
      </button>
    </div>
  );
};

export default FloatingFAQ;
