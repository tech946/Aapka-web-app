// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://ghsgnjzkgygiqmhjvtpi.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdoc2duanprZ3lnaXFtaGp2dHBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMjE2OTksImV4cCI6MjA2NTY5NzY5OX0.IFqbyxmYzCDZZEZpV0MIpPQWVxBplygWlnap1q97hcg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
