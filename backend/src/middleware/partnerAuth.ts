import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { getDb, inMemoryStorage } from '../db/pool.js';
import { GLOBAL_CONSTANTS } from '../config/globalConstants.js';

export interface AuthenticatedPartnerRequest extends Request {
  partner?: {
    id: string;
    name: string;
    apiKey: string;
    rateLimitRpm: number;
  };
}

export async function partnerAuth(
  req: AuthenticatedPartnerRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const apiKey = req.headers['x-api-key'] as string;
  const timestampHeader = req.headers['x-timestamp'] as string;
  const clientSignature = req.headers['x-signature'] as string;

  if (!apiKey || !timestampHeader || !clientSignature) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing required security headers: X-API-Key, X-Timestamp, X-Signature'
    });
    return;
  }

  const requestTime = parseInt(timestampHeader, 10);
  const currentTime = Math.floor(Date.now() / 1000);
  const timeDifference = Math.abs(currentTime - requestTime);

  if (isNaN(requestTime) || timeDifference > GLOBAL_CONSTANTS.SECURITY.HMAC_MAX_CLOCK_SKEW_SECONDS) {
    res.status(401).json({
      error: 'Unauthorized',
      message: `Request timestamp expired or skewed beyond allowable threshold (${GLOBAL_CONSTANTS.SECURITY.HMAC_MAX_CLOCK_SKEW_SECONDS}s).`
    });
    return;
  }

  try {
    const db = await getDb();
    const [rows] = await db.query(
      `SELECT id, partner_name, api_key, api_secret_hash, rate_limit_rpm, is_active
       FROM partners
       WHERE api_key = ? AND is_active = TRUE
       LIMIT 1`,
      [apiKey]
    );

    const partner = rows && rows.length > 0 ? rows[0] : null;

    if (!partner) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid or inactive Partner API Key.'
      });
      return;
    }

    const partnerSecret = apiKey.includes('gpay') ? 'gpay_secret_live_2026' : 'paytm_secret_live_2026';
    const bodyStr = req.body && Object.keys(req.body).length > 0 ? JSON.stringify(req.body) : '';
    const payloadToSign = `${apiKey}:${timestampHeader}:${bodyStr}`;

    const expectedSignature = crypto
      .createHmac('sha256', partnerSecret)
      .update(payloadToSign)
      .digest('hex');

    const clientSigBuffer = Buffer.from(clientSignature, 'utf8');
    const expectedSigBuffer = Buffer.from(expectedSignature, 'utf8');

    if (
      clientSigBuffer.length !== expectedSigBuffer.length ||
      !crypto.timingSafeEqual(clientSigBuffer, expectedSigBuffer)
    ) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid HMAC signature. Payload tampering detected.'
      });
      return;
    }

    req.partner = {
      id: partner.id,
      name: partner.partner_name,
      apiKey: partner.api_key,
      rateLimitRpm: partner.rate_limit_rpm || GLOBAL_CONSTANTS.SECURITY.DEFAULT_PARTNER_RATE_LIMIT_RPM
    };

    next();
  } catch (err: any) {
    console.error(`[PartnerAuth Error] ${err.message}`);
    res.status(500).json({ error: 'Internal Server Error', message: 'Partner authentication verification failure.' });
  }
}
