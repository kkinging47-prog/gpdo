import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';

function safeNextPath(value) {
  if (!value || typeof value !== 'string') return '/admin';
  if (!value.startsWith('/admin')) return '/admin';
  if (value.startsWith('//')) return '/admin';
  return value;
}

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  const next = safeNextPath(url.searchParams.get('next'));
  const supabase = await createClient();

  let error = null;
  if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else if (tokenHash && type) {
    ({ error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type }));
  } else {
    error = new Error('Missing authentication token.');
  }

  const redirectUrl = new URL(error ? '/admin/login?error=auth' : next, request.url);
  return NextResponse.redirect(redirectUrl);
}
