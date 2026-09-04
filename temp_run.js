const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const fs = require('fs');
const sql = fs.readFileSync('supabase/migrations/20260904_student_parent_posts_and_limits.sql', 'utf8');
(async () => {
  const { data, error } = await supabase.rpc('exec_sql', { query: sql });
  console.log('Result:', data, error);
})();
