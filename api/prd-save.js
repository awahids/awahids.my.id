import { readJsonBody } from './_lib/sumopod.js';
import { ensureMethod, sendNoStore, toSafeErrorResponse } from './_lib/requestGuards.js';
import { isOwnerRequest } from './_lib/ownerAuth.js';
import { savePrd } from './_lib/prdStore.js';

export default async function handler(req, res) {
  if (!ensureMethod(req, res, 'POST')) return;
  sendNoStore(res);

  if (!isOwnerRequest(req)) {
    return res.status(401).json({ error: 'Owner key tidak valid', code: 'UNAUTHORIZED' });
  }

  try {
    const body = readJsonBody(req);
    const content = body?.content;
    if (!content || typeof content !== 'object') {
      return res.status(400).json({ error: 'content wajib diisi', code: 'INVALID_INPUT' });
    }

    return res.status(200).json(await savePrd({ content }));
  } catch (error) {
    const safeError = toSafeErrorResponse(error);
    return res.status(safeError.status).json(safeError.body);
  }
}
