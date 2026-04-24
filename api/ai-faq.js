import { callSumopodChat, readJsonBody, safeError } from './_lib/sumopod.js';
import { CV_FAQ_CONTEXT } from './_lib/cvFaqContext.js';

const FAQ_SYSTEM_PROMPT = `You are the AI FAQ assistant for A Wahid Safhadi portfolio.

You must answer using ONLY the CV context provided below.
- If information is not in the context, say: "Informasi ini belum tercantum di CV/portfolio saat ini."
- Do not invent client names, dates, pricing, certifications, or stack details outside context.
- Keep answers concise and practical (2-5 sentences).
- Write naturally, like a real human conversation, not like CV bullet points.
- Paraphrase facts from CV into flowing sentences; do not copy raw lines verbatim.
- Use first-person voice ("saya") when relevant.
- Keep tone friendly-professional and grounded.
- Use bullet list only when user explicitly asks for list.
- Reply in the same language as the user's question.
- Do not mix Indonesian and English in one answer unless user does it first.

CV Context:
${CV_FAQ_CONTEXT}`;

const buildFaqPrompt = (question, languageHint = '') => {
  const resolvedLanguageHint =
    languageHint === 'id'
      ? 'Bahasa Indonesia'
      : languageHint === 'en'
        ? 'English'
        : 'same language as the question';

  return `Question:\n${question}\n\nLanguage to use: ${resolvedLanguageHint}\n\nReturn the best answer grounded in the CV context. Make it natural and conversational while staying factual.`;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = readJsonBody(req);
    const question = String(body.question || '').trim();
    const languageHint = String(body.languageHint || '').trim().toLowerCase();

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const { assistantText, model } = await callSumopodChat({
      messages: [
        {
          role: 'system',
          content: FAQ_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: buildFaqPrompt(question, languageHint),
        },
      ],
      temperature: 0.2,
      maxTokens: 420,
    });

    return res.status(200).json({
      answer: assistantText,
      meta: {
        provider: 'sumopod',
        model,
      },
    });
  } catch (error) {
    return res.status(500).json(safeError(error));
  }
}
