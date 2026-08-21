import { NextResponse } from 'next/server';
import dns from 'node:dns/promises';
import { supabaseUrl, supabasePublishableKey } from '../../../../lib/supabase/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const hostname = new URL(supabaseUrl).hostname;
  const result = {
    ok: false,
    hostname,
    dns: null,
    authEndpoint: null,
  };

  try {
    const lookup = await dns.lookup(hostname);
    result.dns = { ok: true, address: lookup.address, family: lookup.family };
  } catch (error) {
    result.dns = {
      ok: false,
      code: error?.code || null,
      message: error?.message || String(error),
    };
  }

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: {
        apikey: supabasePublishableKey,
        Authorization: `Bearer ${supabasePublishableKey}`,
      },
      cache: 'no-store',
    });
    const text = await response.text();
    result.authEndpoint = {
      ok: response.ok,
      status: response.status,
      bodyPreview: text.slice(0, 300),
    };
    result.ok = response.ok;
  } catch (error) {
    result.authEndpoint = {
      ok: false,
      name: error?.name || null,
      message: error?.message || String(error),
      causeCode: error?.cause?.code || null,
      causeMessage: error?.cause?.message || null,
    };
  }

  return NextResponse.json(result, { status: 200 });
}
