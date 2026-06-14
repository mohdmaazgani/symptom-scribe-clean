import { browserEnv } from '@/lib/env';

const { supabaseUrl, supabasePublishableKey } = browserEnv;

const missingVars = [];
if (!supabaseUrl) missingVars.push('SUPABASE_URL');
if (!supabasePublishableKey) missingVars.push('SUPABASE_PUBLISHABLE_KEY');

if (missingVars.length > 0) {
  throw new Error(
    `Missing required Supabase environment variables:\n` +
    missingVars.map(v => `- ${v}`).join('\n')
  );
}

export { supabaseUrl, supabasePublishableKey };
