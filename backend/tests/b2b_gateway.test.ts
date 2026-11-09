import crypto from 'crypto';
import { partnerAuth, AuthenticatedPartnerRequest } from '../src/middleware/partnerAuth.js';
import { distributedRateLimiter } from '../src/middleware/distributedRateLimiter.js';
import { getDb } from '../src/db/pool.js';

async function runB2BGatewayTests() {
  console.log(`
================================================================================
🛡️  BOOKMYSHOW B2B PARTNER API GATEWAY SECURITY & RATE LIMITING TEST
================================================================================
  `);

  await getDb();

  const apiKey = 'bms_partner_gpay_live_key_2026';
  const apiSecret = 'gpay_secret_live_2026';

  function generateSignature(key: string, secret: string, timestamp: number, body: any = {}) {
    const bodyStr = Object.keys(body).length > 0 ? JSON.stringify(body) : '';
    const payload = `${key}:${timestamp}:${bodyStr}`;
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  console.log('Test 1: Valid API Key + HMAC SHA-256 Signature verification...');
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const validSignature = generateSignature(apiKey, apiSecret, currentTimestamp);

  let nextCalled = false;
  const mockReq: any = {
    headers: {
      'x-api-key': apiKey,
      'x-timestamp': currentTimestamp.toString(),
      'x-signature': validSignature
    },
    body: {}
  };
  const mockRes: any = {
    status: (code: number) => ({
      json: (data: any) => console.log(`   -> Responded with HTTP ${code}:`, data)
    })
  };

  await partnerAuth(mockReq, mockRes, () => {
    nextCalled = true;
  });

  if (nextCalled && mockReq.partner?.name === 'Google Pay India') {
    console.log(`✅ TEST 1 PASSED: Partner successfully authenticated as '${mockReq.partner.name}'.`);
  } else {
    console.error('❌ TEST 1 FAILED: Valid authentication did not pass.');
    process.exit(1);
  }

  console.log('\nTest 2: Tampered HMAC Signature detection...');
  nextCalled = false;
  let errorStatus = 0;
  mockReq.headers['x-signature'] = 'tampered_signature_payload_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

  const mockResTampered: any = {
    status: (code: number) => {
      errorStatus = code;
      return { json: () => {} };
    }
  };

  await partnerAuth(mockReq, mockResTampered, () => {
    nextCalled = true;
  });

  if (!nextCalled && errorStatus === 401) {
    console.log(`✅ TEST 2 PASSED: Tampered HMAC signature correctly rejected with HTTP 401.`);
  } else {
    console.error('❌ TEST 2 FAILED: Tampered signature was not rejected.');
    process.exit(1);
  }

  console.log('\nTest 3: Expired Timestamp / Replay attack prevention...');
  nextCalled = false;
  errorStatus = 0;
  const expiredTimestamp = currentTimestamp - 600;
  const expiredSig = generateSignature(apiKey, apiSecret, expiredTimestamp);

  mockReq.headers['x-timestamp'] = expiredTimestamp.toString();
  mockReq.headers['x-signature'] = expiredSig;

  await partnerAuth(mockReq, mockResTampered, () => {
    nextCalled = true;
  });

  if (!nextCalled && errorStatus === 401) {
    console.log(`✅ TEST 3 PASSED: Skewed/expired timestamp rejected with HTTP 401.`);
  } else {
    console.error('❌ TEST 3 FAILED: Expired timestamp was not rejected.');
    process.exit(1);
  }

  console.log('\nTest 4: Distributed Rate Limiter quota enforcement...');
  const limiter = distributedRateLimiter(5);
  const rateLimitReq: any = { partner: { apiKey: 'test-partner', rateLimitRpm: 5 }, headers: {} };
  const headersSent: Record<string, string> = {};
  let rejected = false;

  const rateLimitRes: any = {
    setHeader: (k: string, v: string) => { headersSent[k] = v; },
    status: (code: number) => {
      if (code === 429) rejected = true;
      return { json: () => {} };
    }
  };

  for (let i = 1; i <= 6; i++) {
    limiter(rateLimitReq, rateLimitRes, () => {});
  }

  if (rejected) {
    console.log(`✅ TEST 4 PASSED: Rate limiter throttled 6th request with HTTP 429 Too Many Requests.`);
  } else {
    console.error('❌ TEST 4 FAILED: Rate limiter did not trigger.');
    process.exit(1);
  }

  console.log(`
================================================================================
🎉 ALL B2B GATEWAY SECURITY & RATE LIMITING TESTS PASSED!
================================================================================
  `);
}

runB2BGatewayTests().catch(err => {
  console.error('B2B Test Error:', err);
  process.exit(1);
});
