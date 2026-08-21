import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const supabase = await createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 401 });
    }

    const { data: approvedUser, error: approvalError } = await supabase
      .from('admin_users')
      .select('email, role, is_active')
      .eq('email', email)
      .maybeSingle();

    if (approvalError || !approvedUser?.is_active) {
      await supabase.auth.signOut();
      return NextResponse.json({ error: 'This account is not approved for GPDO administration.' }, { status: 403 });
    }

    return NextResponse.json({ ok: true, role: approvedUser.role });
  } catch (error) {
    console.error('GPDO admin password login failed:', error);
    return NextResponse.json(
      { error: 'The GPDO server could not reach the authentication service. Please try again.' },
      { status: 502 }
    );
  }
}
