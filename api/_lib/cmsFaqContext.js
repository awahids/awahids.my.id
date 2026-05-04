import { readPublishedCmsItems } from './cms.js';
import { CV_FAQ_CONTEXT } from './cvFaqContext.js';

const formatCmsValue = (value, depth = 0) => {
  if (value === null || value === undefined || value === '') return '';

  if (Array.isArray(value)) {
    return value
      .map((item) => formatCmsValue(item, depth + 1))
      .filter(Boolean)
      .join('\n');
  }

  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, nestedValue]) => {
        const formatted = formatCmsValue(nestedValue, depth + 1);
        if (!formatted) return '';
        return `${key}: ${formatted}`;
      })
      .filter(Boolean)
      .join('\n');
  }

  const prefix = depth > 0 ? '- ' : '';
  return `${prefix}${String(value).trim()}`;
};

const formatCmsFaqContext = (items) =>
  items
    .map((item) => {
      const parts = [
        item.title && `Title: ${item.title}`,
        item.subtitle && `Topic: ${item.subtitle}`,
        item.summary && `Summary: ${item.summary}`,
        item.payload && `Details:\n${formatCmsValue(item.payload)}`,
      ].filter(Boolean);

      return parts.join('\n');
    })
    .filter(Boolean)
    .join('\n\n');

export const buildPortfolioAssistantContext = async () => {
  const cmsItems = await readPublishedCmsItems('ai-faq', { limit: 30 });
  const cmsContext = formatCmsFaqContext(cmsItems);

  if (!cmsContext) return `CV Context:\n${CV_FAQ_CONTEXT}`;

  return `Admin CMS Context:\n${cmsContext}

Fallback CV Context:
${CV_FAQ_CONTEXT}

Prefer Admin CMS Context if it conflicts with the fallback context.`;
};
