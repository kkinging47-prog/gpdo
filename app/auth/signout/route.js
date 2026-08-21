import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '../../../lib/supabase/server';

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  return NextResponse.redirect(new URL('/admin/login', request.url), { status: 302 });
}
