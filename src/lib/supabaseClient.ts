
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Supabase URL not found. Please define NEXT_PUBLIC_SUPABASE_URL in your .env file.");
}
if (!supabaseAnonKey) {
  throw new Error("Supabase anonymous key not found. Please define NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.");
}

// Use createBrowserClient for the client-side singleton
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
