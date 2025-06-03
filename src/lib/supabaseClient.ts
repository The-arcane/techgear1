
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types'; // We'll generate this file next

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Supabase URL not found. Please define NEXT_PUBLIC_SUPABASE_URL in your .env file.");
}
if (!supabaseAnonKey) {
  throw new Error("Supabase anonymous key not found. Please define NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
