// Test service questions API for Flutter compatibility
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFlutterCompatibility() {
  try {
    console.log('Testing service questions API for Flutter compatibility...\n');
    
    // Test 1: Get all service questions to see the data format
    const { data, error } = await supabase
      .from('service_questions')
      .select('id, question, question_type, options')
      .not('options', 'is', null)
      .limit(3);

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('Raw database response:');
    data.forEach((q, i) => {
      console.log(`${i + 1}. Question: ${q.question}`);
      console.log(`   Type: ${q.question_type}`);
      console.log(`   Options (raw): ${typeof q.options} - ${JSON.stringify(q.options)}`);
    });

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Use our supabase-client to get transformed data
    const response = await fetch('http://localhost:5000/api/service-questions');
    const apiData = await response.json();

    console.log('API response (what Flutter app receives):');
    const questionsWithOptions = apiData.filter(q => q.options);
    questionsWithOptions.slice(0, 3).forEach((q, i) => {
      console.log(`${i + 1}. Question: ${q.question}`);
      console.log(`   Type: ${q.questionType}`);
      console.log(`   Options type: ${typeof q.options}`);
      console.log(`   Options value: ${JSON.stringify(q.options)}`);
      console.log(`   Is Array: ${Array.isArray(q.options)}`);
      if (Array.isArray(q.options)) {
        console.log(`   Array length: ${q.options.length}`);
      }
      console.log('');
    });

    console.log('✓ Test complete - Flutter app should now receive proper array format');

  } catch (err) {
    console.error('Test failed:', err.message);
  }
}

testFlutterCompatibility();