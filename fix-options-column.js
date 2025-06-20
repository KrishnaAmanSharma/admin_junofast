// Script to fix the options column type for Flutter compatibility
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixOptionsColumn() {
  try {
    console.log('Converting existing JSONB options to text format...');
    
    // First, get all questions with options
    const { data: questions, error: fetchError } = await supabase
      .from('service_questions')
      .select('id, options, question_type')
      .not('options', 'is', null);

    if (fetchError) {
      console.error('Error fetching questions:', fetchError);
      return;
    }

    console.log(`Found ${questions.length} questions with options to convert`);

    // Convert each question's options to string format
    for (const question of questions) {
      let newOptions = null;
      
      if (question.options) {
        if (Array.isArray(question.options)) {
          if (question.question_type === "sub_questions") {
            // Convert array of objects to comma-separated strings
            newOptions = question.options.map(opt => opt.question || opt).join(',');
          } else {
            // Convert simple array to comma-separated string
            newOptions = question.options.join(',');
          }
        } else if (typeof question.options === 'string') {
          // Already a string, keep as is
          newOptions = question.options;
        } else {
          // Other format, convert to string
          newOptions = String(question.options);
        }
      }

      // Update the question with string format
      const { error: updateError } = await supabase
        .from('service_questions')
        .update({ options: newOptions })
        .eq('id', question.id);

      if (updateError) {
        console.error(`Error updating question ${question.id}:`, updateError);
      } else {
        console.log(`✓ Updated question ${question.id}: "${newOptions}"`);
      }
    }

    console.log('Conversion complete!');
    
    // Verify the changes
    const { data: verifyData, error: verifyError } = await supabase
      .from('service_questions')
      .select('id, question, question_type, options')
      .not('options', 'is', null)
      .limit(5);

    if (verifyError) {
      console.error('Error verifying:', verifyError);
      return;
    }

    console.log('\nVerification - Updated questions:');
    verifyData.forEach((q) => {
      console.log(`- ${q.question} (${q.question_type}): "${q.options}"`);
    });

  } catch (err) {
    console.error('Failed:', err.message);
  }
}

fixOptionsColumn();