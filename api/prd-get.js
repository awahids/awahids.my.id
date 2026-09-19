import { ensureMethod, sendNoStore, toSafeErrorResponse } from './_lib/requestGuards.js';
import { readPrdBySlug } from './_lib/prdStore.js';

export default async function handler(req, res) {
  if (!ensureMethod(req, res, 'GET')) return;
  sendNoStore(res);

  try {
    const prd = await readPrdBySlug(req?.query?.slug);
    if (!prd) {
      return res.status(404).json({ error: 'PRD tidak ditemukan', code: 'NOT_FOUND' });
    }
    return res.status(200).json({ prd });
  } catch (error) {
    const safeError = toSafeErrorResponse(error);
    return res.status(safeError.status).json(safeError.body);
  }
}
