const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('[Supabase]: Client initialized successfully.');
} else {
  console.warn('[Supabase]: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. Running in in-memory fallback mode.');
}

module.exports = supabase;
