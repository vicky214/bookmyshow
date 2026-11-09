import React, { useState } from 'react';
import { Terminal, Shield, Key, Send, CheckCircle2, AlertCircle, RefreshCw, Lock } from 'lucide-react';
import axios from 'axios';

export const B2BDemoConsole: React.FC = () => {
  const [partner, setPartner] = useState<'GPAY' | 'PAYTM'>('GPAY');
  const [endpoint, setEndpoint] = useState<string>('/api/v1/b2b/shows/show-01/availability');
  const [httpMethod, setHttpMethod] = useState<'GET' | 'POST'>('GET');
  const [requestBody, setRequestBody] = useState<string>(
    JSON.stringify({ showId: 'show-01', seatIds: ['seat-scr1-C1', 'seat-scr1-C2'], partnerUserId: 'gpay-user-772' }, null, 2)
  );

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [requestHeaders, setRequestHeaders] = useState<any>(null);

  const partnerCreds = {
    GPAY: {
      name: 'Google Pay India',
      apiKey: 'bms_partner_gpay_live_key_2026',
      apiSecret: 'gpay_secret_live_2026',
      rpm: 600
    },
    PAYTM: {
      name: 'Paytm Entertainment',
      apiKey: 'bms_partner_paytm_live_key_2026',
      apiSecret: 'paytm_secret_live_2026',
      rpm: 300
    }
  };

  async function computeHmacSha256(secret: string, message: string): Promise<string> {
    const enc = new TextEncoder();
    const key = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await window.crypto.subtle.sign('HMAC', key, enc.encode(message));
    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  const handleExecute = async () => {
    setLoading(true);
    setResponse(null);

    const creds = partnerCreds[partner];
    const timestamp = Math.floor(Date.now() / 1000).toString();

    let bodyObj: any = undefined;
    let bodyStr = '';
    if (httpMethod === 'POST' && requestBody) {
      try {
        bodyObj = JSON.parse(requestBody);
        bodyStr = JSON.stringify(bodyObj);
      } catch (e: any) {
        alert('Invalid JSON in request body');
        setLoading(false);
        return;
      }
    }

    const payloadToSign = `${creds.apiKey}:${timestamp}:${bodyStr}`;
    const signature = await computeHmacSha256(creds.apiSecret, payloadToSign);

    const headers = {
      'x-api-key': creds.apiKey,
      'x-timestamp': timestamp,
      'x-signature': signature,
      'content-type': 'application/json'
    };
    setRequestHeaders(headers);

    const t0 = Date.now();
    try {
      const res = await axios({
        method: httpMethod,
        url: endpoint,
        headers,
        data: bodyObj
      });

      setResponse({
        status: res.status,
        statusText: res.statusText,
        durationMs: Date.now() - t0,
        data: res.data
      });
    } catch (err: any) {
      setResponse({
        status: err.response?.status || 500,
        statusText: err.response?.statusText || 'Error',
        durationMs: Date.now() - t0,
        data: err.response?.data || { error: err.message }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      <div className="bg-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-rose-400 text-xs font-mono font-bold uppercase tracking-wider">
              <Shield className="w-4 h-4" />
              <span>B2B Partner API Gateway Console</span>
            </div>
            <h3 className="text-xl font-black mt-1">Third-Party Integration & HMAC Authentication</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Simulate external platforms (Google Pay, Paytm, Corporate APIs) discovering movies, querying live seat availability, and acquiring distributed 10-minute holds via authenticated HMAC SHA-256 signatures.
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-slate-800 px-3.5 py-2 rounded-2xl border border-slate-700">
            <Key className="w-4 h-4 text-emerald-400" />
            <div className="text-xs font-mono">
              <span className="text-slate-400 block text-[10px]">Active Partner</span>
              <span className="text-white font-bold">{partnerCreds[partner].name}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Select B2B Partner Client
            </label>
            <select
              value={partner}
              onChange={(e) => setPartner(e.target.value as any)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 font-medium"
            >
              <option value="GPAY">Google Pay India (Quota: 600 RPM)</option>
              <option value="PAYTM">Paytm Entertainment (Quota: 300 RPM)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Quick Preset API Endpoints
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setHttpMethod('GET');
                  setEndpoint('/api/v1/b2b/partner-profile');
                }}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-medium hover:bg-slate-50"
              >
                GET /b2b/partner-profile
              </button>
              <button
                type="button"
                onClick={() => {
                  setHttpMethod('GET');
                  setEndpoint('/api/v1/b2b/shows/show-01/availability');
                }}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-medium hover:bg-slate-50"
              >
                GET /b2b/shows/:id/availability
              </button>
              <button
                type="button"
                onClick={() => {
                  setHttpMethod('POST');
                  setEndpoint('/api/v1/b2b/bookings/lock');
                  setRequestBody(
                    JSON.stringify({ showId: 'show-01', seatIds: ['seat-scr1-C1', 'seat-scr1-C2'], partnerUserId: 'gpay-user-991' }, null, 2)
                  );
                }}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-medium hover:bg-slate-50 text-rose-600"
              >
                POST /b2b/bookings/lock
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={httpMethod}
            onChange={(e) => setHttpMethod(e.target.value as any)}
            className="w-28 px-3 py-2 text-xs font-bold font-mono rounded-xl border border-slate-200 bg-slate-50"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
          </select>

          <input
            type="text"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            className="flex-1 px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
          />

          <button
            onClick={handleExecute}
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition flex items-center space-x-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Execute Request</span>
          </button>
        </div>

        {httpMethod === 'POST' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              JSON Request Body Payload
            </label>
            <textarea
              rows={4}
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              className="w-full p-3 text-xs font-mono rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-rose-500"
            />
          </div>
        )}
      </div>

      {response && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <span
                className={`px-3 py-1 rounded-lg font-mono text-xs font-bold ${
                  response.status < 300
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                    : 'bg-rose-50 text-rose-700 border border-rose-300'
                }`}
              >
                HTTP {response.status} {response.statusText}
              </span>
              <span className="text-xs font-mono text-slate-400">Duration: {response.durationMs}ms</span>
            </div>

            <span className="text-xs text-slate-400 font-mono">HMAC SHA-256 Verified</span>
          </div>

          {requestHeaders && (
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Generated Cryptographic Security Headers
              </span>
              <pre className="p-3 bg-slate-900 text-slate-300 rounded-xl text-[11px] font-mono overflow-x-auto">
                {JSON.stringify(requestHeaders, null, 2)}
              </pre>
            </div>
          )}

          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
              Response Body (JSON)
            </span>
            <pre className="p-4 bg-slate-900 text-emerald-400 rounded-2xl text-xs font-mono overflow-x-auto max-h-96">
              {JSON.stringify(response.data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
