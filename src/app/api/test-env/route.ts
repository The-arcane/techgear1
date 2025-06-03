
import { NextResponse } from 'next/server';

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; // Also test this
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // And this

  console.log('[API /api/test-env] Attempting to read environment variables.');
  console.log(`[API /api/test-env] NEXT_PUBLIC_APP_URL: ${appUrl || 'NOT SET'}`);
  console.log(`[API /api/test-env] NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl || 'NOT SET'}`);
  console.log(`[API /api/test-env] NEXT_PUBLIC_SUPABASE_ANON_KEY: ${anonKey ? 'SET' : 'NOT SET'}`);

  if (appUrl) {
    return NextResponse.json({ 
      message: 'Environment variable test successful.',
      NEXT_PUBLIC_APP_URL: appUrl,
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl || 'NOT SET',
      NEXT_PUBLIC_SUPABASE_ANON_KEY_STATUS: anonKey ? 'SET' : 'NOT SET'
    });
  } else {
    return NextResponse.json({ 
      message: 'ERROR: NEXT_PUBLIC_APP_URL is NOT SET in this environment.',
      NEXT_PUBLIC_APP_URL: null,
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl || 'NOT SET',
      NEXT_PUBLIC_SUPABASE_ANON_KEY_STATUS: anonKey ? 'SET' : 'NOT SET'
    }, { status: 500 });
  }
}
