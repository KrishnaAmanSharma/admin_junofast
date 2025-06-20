// Debug dropdown question data format issue
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDropdownIssue() {
  try {
    console.log('Debugging dropdown question data format...\n');
    
    // Get all dropdown questions to see current data format
    const { data, error } = await supabase
      .from('service_questions')
      .select('id, question, question_type, options')
      .eq('question_type', 'dropdown');

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log(`Found ${data.length} dropdown questions:`);
    data.forEach((q, i) => {
      console.log(`\n${i + 1}. Question: ${q.question}`);
      console.log(`   Options type: ${typeof q.options}`);
      console.log(`   Options value: ${JSON.stringify(q.options)}`);
      console.log(`   Is Array: ${Array.isArray(q.options)}`);
      console.log(`   Is String: ${typeof q.options === 'string'}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('Flutter app expects List<String> for dropdown options');
    console.log('Current database format analysis:');
    
    data.forEach((q, i) => {
      if (typeof q.options === 'string') {
        console.log(`\n${i + 1}. PROBLEM: "${q.question}" has string options: "${q.options}"`);
        const converted = q.options.split(',').map(opt => opt.trim());
        console.log(`   Should be converted to: ${JSON.stringify(converted)}`);
      } else if (Array.isArray(q.options)) {
        console.log(`\n${i + 1}. OK: "${q.question}" already has array options`);
      } else {
        console.log(`\n${i + 1}. UNKNOWN: "${q.question}" has options type: ${typeof q.options}`);
      }
    });

  } catch (err) {
    console.error('Debug failed:', err.message);
  }
}

debugDropdownIssue();