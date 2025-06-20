// Quick debug script to check service questions data format
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkServiceQuestions() {
  try {
    const { data, error } = await supabase
      .from('service_questions')
      .select('id, question, question_type, options')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('Recent service questions:');
    data.forEach((q, i) => {
      console.log(`\n${i + 1}. ID: ${q.id}`);
      console.log(`   Question: ${q.question}`);
      console.log(`   Type: ${q.question_type}`);
      console.log(`   Options type: ${typeof q.options}`);
      console.log(`   Options value:`, q.options);
    });
  } catch (err) {
    console.error('Failed:', err.message);
  }
}

checkServiceQuestions();