// Fix dropdown options to be proper JSON arrays for Flutter compatibility
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDropdownOptions() {
  try {
    console.log('Fixing dropdown options format for Flutter compatibility...\n');
    
    // Get all dropdown questions with string options
    const { data: dropdownQuestions, error } = await supabase
      .from('service_questions')
      .select('id, question, question_type, options')
      .eq('question_type', 'dropdown');

    if (error) {
      console.error('Error fetching dropdown questions:', error);
      return;
    }

    console.log(`Found ${dropdownQuestions.length} dropdown questions to fix:`);

    for (const question of dropdownQuestions) {
      if (typeof question.options === 'string') {
        // Convert comma-separated string to proper JSON array
        const optionsArray = question.options.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0);
        
        console.log(`\nFixing: "${question.question}"`);
        console.log(`  Before: "${question.options}" (string)`);
        console.log(`  After:  ${JSON.stringify(optionsArray)} (array)`);

        // Update the database with proper JSON array
        const { error: updateError } = await supabase
          .from('service_questions')
          .update({ options: optionsArray })
          .eq('id', question.id);

        if (updateError) {
          console.error(`  ERROR updating question ${question.id}:`, updateError);
        } else {
          console.log(`  ✓ Successfully updated`);
        }
      } else if (Array.isArray(question.options)) {
        console.log(`\nSkipping: "${question.question}" - already has array format`);
      } else {
        console.log(`\nSkipping: "${question.question}" - has null/undefined options`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Verification - checking updated data:');

    // Verify the changes
    const { data: verifyData, error: verifyError } = await supabase
      .from('service_questions')
      .select('id, question, question_type, options')
      .eq('question_type', 'dropdown');

    if (verifyError) {
      console.error('Error verifying changes:', verifyError);
      return;
    }

    verifyData.forEach((q, i) => {
      console.log(`\n${i + 1}. ${q.question}`);
      console.log(`   Options type: ${typeof q.options}`);
      console.log(`   Is Array: ${Array.isArray(q.options)}`);
      console.log(`   Value: ${JSON.stringify(q.options)}`);
      
      if (Array.isArray(q.options)) {
        console.log(`   ✓ Ready for Flutter app (List<String>.from() will work)`);
      } else {
        console.log(`   ❌ Still problematic for Flutter app`);
      }
    });

    console.log('\n✓ Dropdown options fix complete!');

  } catch (err) {
    console.error('Fix failed:', err.message);
  }
}

fixDropdownOptions();