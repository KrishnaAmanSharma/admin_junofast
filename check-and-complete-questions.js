import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://tdqqrjssnylfbjmpgaei.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcXFyanNzbnlsZmJqbXBnYWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDUzNjAsImV4cCI6MjA2NTMyMTM2MH0.d0zoAkDbbOA3neeaFRzeoLkeyV6vt-2JFeOlAnhSfIw";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndCompleteQuestions() {
  try {
    // Get house relocation service type
    const { data: serviceType } = await supabase
      .from('service_types')
      .select('*')
      .ilike('name', '%house%')
      .single();

    if (!serviceType) {
      console.log('House relocation service type not found');
      return;
    }

    console.log(`Service Type: ${serviceType.name} (${serviceType.id})`);

    // Check existing questions
    const { data: existingQuestions } = await supabase
      .from('service_questions')
      .select('*')
      .eq('service_type_id', serviceType.id)
      .order('display_order');

    console.log(`Existing questions: ${existingQuestions?.length || 0}`);

    // Remaining questions to insert (starting from what failed)
    const remainingQuestions = [
      {
        question: "Do you have plants to be moved?",
        question_type: "sub_questions",
        is_required: false,
        display_order: 12,
        options: {
          sub_questions: [
            {
              question: "How many potted plants?",
              type: "number",
              required: false
            },
            {
              question: "Any large plants or trees?",
              type: "text",
              placeholder: "Describe size and type",
              required: false
            }
          ]
        }
      },
      {
        question: "How many cardboard boxes do you estimate you'll need?",
        question_type: "dropdown",
        is_required: true,
        display_order: 13,
        options: {
          choices: [
            "1-10 boxes",
            "11-25 boxes",
            "26-50 boxes",
            "51-75 boxes",
            "76-100 boxes",
            "100+ boxes"
          ]
        }
      },
      {
        question: "Do you need packing materials?",
        question_type: "sub_questions",
        is_required: true,
        display_order: 14,
        options: {
          sub_questions: [
            {
              question: "Bubble wrap for fragile items?",
              type: "boolean",
              required: false
            },
            {
              question: "Packing paper/newspaper?",
              type: "boolean",
              required: false
            },
            {
              question: "Plastic wrap for furniture?",
              type: "boolean",
              required: false
            },
            {
              question: "Cloth covers for wardrobes?",
              type: "boolean",
              required: false
            }
          ]
        }
      },
      {
        question: "What services do you need?",
        question_type: "sub_questions",
        is_required: true,
        display_order: 15,
        options: {
          sub_questions: [
            {
              question: "Packing service required?",
              type: "boolean",
              required: true
            },
            {
              question: "Unpacking service required?",
              type: "boolean",
              required: true
            },
            {
              question: "Loading/unloading service required?",
              type: "boolean",
              required: true
            },
            {
              question: "Furniture dismantling required?",
              type: "boolean",
              required: false
            },
            {
              question: "Furniture reassembly required?",
              type: "boolean",
              required: false
            }
          ]
        }
      },
      {
        question: "What type of vehicle do you prefer?",
        question_type: "dropdown",
        is_required: true,
        display_order: 16,
        options: {
          choices: [
            "Small Tempo (for studio/1BHK)",
            "Large Tempo/Mini Truck (for 2BHK)", 
            "Container Truck (for 3BHK+)",
            "Multiple Vehicles (large house)",
            "Let movers decide"
          ]
        }
      },
      {
        question: "Do you need storage/warehousing?",
        question_type: "sub_questions",
        is_required: false,
        display_order: 17,
        options: {
          sub_questions: [
            {
              question: "Temporary storage required?",
              type: "boolean",
              required: false
            },
            {
              question: "How many days of storage?",
              type: "number",
              placeholder: "Number of days",
              required: false
            }
          ]
        }
      },
      {
        question: "Any special requirements or concerns?",
        question_type: "text",
        is_required: false,
        display_order: 18,
        options: {
          placeholder: "Parking restrictions, narrow stairs, timing constraints, etc.",
          multiline: true
        }
      },
      {
        question: "Preferred moving date and time",
        question_type: "sub_questions",
        is_required: true,
        display_order: 19,
        options: {
          sub_questions: [
            {
              question: "Preferred date",
              type: "date",
              required: true
            },
            {
              question: "Preferred time slot",
              type: "dropdown",
              choices: ["Morning (8AM-12PM)", "Afternoon (12PM-4PM)", "Evening (4PM-8PM)", "Flexible"],
              required: true
            }
          ]
        }
      },
      {
        question: "Insurance coverage required?",
        question_type: "sub_questions",
        is_required: false,
        display_order: 20,
        options: {
          sub_questions: [
            {
              question: "Do you want insurance for your goods?",
              type: "boolean",
              required: false
            },
            {
              question: "Estimated value of goods for insurance",
              type: "number",
              placeholder: "Total value in rupees",
              required: false
            }
          ]
        }
      }
    ];

    // Insert remaining questions
    for (const question of remainingQuestions) {
      // Check if question already exists
      const existing = existingQuestions?.find(eq => eq.display_order === question.display_order);
      if (existing) {
        console.log(`Skipping question ${question.display_order} - already exists`);
        continue;
      }

      const { data, error } = await supabase
        .from('service_questions')
        .insert({
          service_type_id: serviceType.id,
          question: question.question,
          question_type: question.question_type,
          is_required: question.is_required,
          display_order: question.display_order,
          options: question.options || null,
          parent_question_id: null,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error(`Error inserting question ${question.display_order}:`, error);
        continue;
      }

      console.log(`Inserted question ${question.display_order}: "${question.question}"`);
    }

    // Final count
    const { data: finalQuestions } = await supabase
      .from('service_questions')
      .select('*')
      .eq('service_type_id', serviceType.id);

    console.log(`\nFinal count: ${finalQuestions?.length || 0} questions for House Relocation`);
    console.log('Setup complete!');

  } catch (error) {
    console.error('Error:', error);
  }
}

checkAndCompleteQuestions();