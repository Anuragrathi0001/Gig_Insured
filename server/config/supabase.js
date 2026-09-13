const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const isPlaceholder = 
  !supabaseUrl || 
  !supabaseKey || 
  supabaseUrl.includes('your-project-id') || 
  supabaseKey.includes('your_service_role_key') ||
  !supabaseUrl.startsWith('https://');

let supabase = null;

if (!isPlaceholder) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('[Supabase]: Client initialized successfully.');
  } catch (err) {
    console.warn('[Supabase]: Failed to initialize client. Running in in-memory fallback mode.', err.message);
    supabase = null;
  }
} else {
  console.warn('[Supabase]: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is placeholder or not set. Running in in-memory fallback mode.');
}

module.exports = supabase;
