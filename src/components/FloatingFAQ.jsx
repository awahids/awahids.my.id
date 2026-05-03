import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQ_WEBHOOK_URL = import.meta.env.VITE_AI_FAQ_ENDPOINT || '/api/ai-faq';
const AI_ASSISTANT_URL = import.meta.env.VITE_AI_ASSISTANT_ENDPOINT || '/api/ai-assistant';

const STARTER_FAQ_MESSAGE = {
  id: 'faq-start-float',
  role: 'assistant',
  source: 'local',
  text: "Hi! I'm an AI assistant. Ask me about Wahid's tech stack, experience, or project delivery.",
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
      id: 'Paling cepet bisa email ke awahid.safhadi@gmail.com. Kalau mau langsung ngobrolin project, bisa juga booking jadwal di https://janji.online/book/awahids.',
      en: 'The fastest way is email at awahid.safhadi@gmail.com. If you want to discuss a project directly, you can book a call at https://janji.online/book/awahids.',
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

const buildErrorAnswer = (error, language) => {
  const details = error?.details || {};
  const parts = [
    details.code ? `Code: ${details.code}` : '',
    details.model ? `Model: ${details.model}` : '',
    details.provider ? `Provider: ${details.provider}` : '',
  ].filter(Boolean);

  const suffix = parts.length > 0 ? `\n${parts.join(' | ')}` : '';
  const message = error?.message || 'AI request failed.';

  return language === 'id'
    ? `AI sedang error: ${message}${suffix}`
    : `AI error: ${message}${suffix}`;
};

const FloatingFAQ = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([STARTER_FAQ_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);
  const [useHermes] = useState(false);
  const originalTitle = useRef(typeof document !== 'undefined' ? document.title : '');
  const chatViewportRef = useRef(null);
  const isOpenRef = useRef(false);

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
    const timer = setTimeout(() => {
      if (!isOpen) {
        setShowNotification(true);
      }
    }, 1500);
    return () => clearTimeout(timer);
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

    setLoading(true);
    setInput('');

    if (appendUser) {
      const userMessage = createMessage('user', cleanedQuestion, 'local');
      setMessages((prev) => [...prev, userMessage]);
    }

    let answerText;
    let mode;
    let errorDetails;
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
        answerText = buildErrorAnswer(error, faqLanguage);
        errorDetails = error?.details || {};
        mode = 'error';
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
          answerText = buildErrorAnswer(error, faqLanguage);
          errorDetails = error?.details || {};
          mode = 'error';
        }
      } else {
        answerText = buildLocalFaqAnswer(cleanedQuestion, faqLanguage);
        mode = 'local';
      }
    }

    const assistantMessage = createMessage('assistant', answerText, mode, {
      retryQuestion: mode === 'error' ? cleanedQuestion : '',
      retryForceHermes: mode === 'error' ? shouldUseHermes : false,
      errorDetails,
    });
    setMessages((prev) => [...prev, assistantMessage]);
    markAssistantMessageUnread();
    setLoading(false);
  };

  const retryMessage = (message) => {
    if (!message.retryQuestion || loading) return;
    setMessages((prev) => prev.filter((msg) => msg.id !== message.id));
    window.setTimeout(() => {
      void askFaq(message.retryQuestion, {
        forceHermes: message.retryForceHermes,
        appendUser: false,
      });
    }, 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    void askFaq(input);
  };

  return (
    <div className="floating-faq-container">
      <AnimatePresence>
        {showNotification && !isOpen && (
          <motion.div
            className="floating-faq-notification"
            initial={{ opacity: 0, x: 20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.8 }}
            onClick={openChat}
          >
            <div className="ff-notification-text">
              {messages[0]?.text || "Need help? Ask the AI here! 🤖"}
            </div>
            <button
              className="ff-notification-close"
              onClick={(e) => {
                e.stopPropagation();
                setShowNotification(false);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="floating-faq-window"
            initial={{ opacity: 0, y: 24, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, transformOrigin: 'bottom right' }}
            exit={{ opacity: 0, y: 24, transformOrigin: 'bottom right' }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
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
              <button className="ffh-close" onClick={closeChat}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="floating-faq-body" ref={chatViewportRef}>
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    className={`ff-msg ${msg.role === 'user' ? 'is-user' : 'is-assistant'} ${msg.source === 'error' ? 'is-error' : ''}`}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="ff-msg-content">{msg.text}</div>
                    {msg.source === 'error' && msg.retryQuestion && (
                      <button
                        type="button"
                        className="ff-retry-btn"
                        onClick={() => retryMessage(msg)}
                        disabled={loading}
                      >
                        Retry
                      </button>
                    )}
                  </motion.div>
                ))}
                {loading && (
                  <motion.div
                    className="ff-msg is-assistant is-pending"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="ff-msg-content">
                      <span className="dot-typing"></span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {!loading && messages.length <= 1 && (
              <motion.div
                className="floating-faq-suggestions"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.2 } }
                }}
              >
                {QUICK_QUESTIONS.map((q) => (
                  <motion.button
                    key={q}
                    className="ff-suggestion-btn"
                    onClick={() => askFaq(q)}
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      visible: { opacity: 1, y: 0 }
                    }}
                  >
                    {q}
                  </motion.button>
                ))}
              </motion.div>
            )}

            <form className="floating-faq-footer" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Ask something..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button type="submit" disabled={!input.trim() || loading}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        className={`floating-faq-toggle ${isOpen ? 'is-active' : ''}`}
        onClick={toggleChat}
      >
        <AnimatePresence>
          {unreadCount > 0 && !isOpen && (
            <motion.div
              className="ff-unread-badge"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
            >
              {unreadCount}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.svg
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </motion.svg>
          ) : (
            <motion.svg
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </motion.svg>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
};

export default FloatingFAQ;
