import { callSumopodChat, parseJsonLenient, readJsonBody, safeError } from './_lib/sumopod.js';

const BRIEF_SYSTEM_PROMPT = `You are a senior software architect focused on backend reliability, automation, and delivery planning.

Requirements:
- Use natural, human phrasing (not stiff template language).
- Ground every recommendation in the user's brief.
- Explicitly reflect every NON-EMPTY input field in the output:
  productType, targetUsers, coreGoals, integrations, timeline, successMetric, constraints.
- If a field is empty, do not fabricate details.
- Keep it practical and implementation-oriented.
- Reply in the language requested by the language hint.
- Return JSON only.`;

const buildBriefPrompt = (brief, languageHint = '') => {
  const details = [
    `Product Type: ${brief.productType || '-'}`,
    `Target Users: ${brief.targetUsers || '-'}`,
    `Core Goals: ${brief.coreGoals || '-'}`,
    `Integrations: ${brief.integrations || '-'}`,
    `Timeline: ${brief.timeline || '-'}`,
    `Success Metric: ${brief.successMetric || '-'}`,
    `Constraints: ${brief.constraints || '-'}`,
  ].join('\n');

  const resolvedLanguageHint =
    languageHint === 'id'
      ? 'Bahasa Indonesia'
      : languageHint === 'en'
        ? 'English'
        : 'same language as the brief';

  return `Analyze this project brief for a backend-first fullstack implementation.\n\n${details}\n\nLanguage to use: ${resolvedLanguageHint}\n\nReturn ONLY JSON with this exact shape:\n{\n  "summary": "string",\n  "effort": "string",\n  "recommendedStack": ["string"],\n  "architecture": ["string"],\n  "milestones": ["string"],\n  "risks": ["string"],\n  "nextActions": ["string"]\n}\n\nRules:\n- summary should sound natural and should reference all non-empty fields.\n- effort should be a short natural judgement sentence.\n- Keep each list concise (3-6 points), concrete, and tied to the input.\n- No markdown, no commentary, JSON only.`;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = readJsonBody(req);
    const languageHint = String(body.languageHint || '').trim().toLowerCase();

    const { assistantText, model } = await callSumopodChat({
      messages: [
        {
          role: 'system',
          content: BRIEF_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: buildBriefPrompt(body, languageHint),
        },
      ],
      temperature: 0.3,
      maxTokens: 1100,
    });

    const analysis = parseJsonLenient(assistantText);

    return res.status(200).json({
      analysis,
      meta: {
        provider: 'sumopod',
        model,
      },
    });
  } catch (error) {
    return res.status(500).json(safeError(error));
  }
}
