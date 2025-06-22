import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://tdqqrjssnylfbjmpgaei.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcXFyanNzbnlsZmJqbXBnYWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDUzNjAsImV4cCI6MjA2NTMyMTM2MH0.d0zoAkDbbOA3neeaFRzeoLkeyV6vt-2JFeOlAnhSfIw";

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupHouseRelocationQuestions() {
  try {
    console.log('🏠 Setting up House Relocation Service Questions...');

    // First, get the service type ID for house relocation
    const { data: serviceTypes, error: serviceTypeError } = await supabase
      .from('service_types')
      .select('*')
      .ilike('name', '%house%')
      .single();

    if (serviceTypeError || !serviceTypes) {
      console.log('❌ House relocation service type not found. Creating it first...');
      
      // Create house relocation service type
      const { data: newServiceType, error: createError } = await supabase
        .from('service_types')
        .insert({
          name: 'House Relocation',
          description: 'Complete household goods shifting and relocation services',
          image_url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400',
          is_active: true
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }
      
      serviceTypes = newServiceType;
      console.log('✅ Created House Relocation service type');
    }

    const serviceTypeId = serviceTypes.id;
    console.log(`📋 Using service type: ${serviceTypes.name} (${serviceTypeId})`);

    // House Relocation Questions
    const questions = [
      // Basic Property Information
      {
        question: "What type of house are you moving from?",
        question_type: "dropdown",
        is_required: true,
        display_order: 1,
        options: {
          choices: [
            "Apartment/Flat",
            "Independent House/Villa",
            "Duplex",
            "Studio Apartment",
            "Penthouse",
            "Row House",
            "Other"
          ]
        }
      },
      {
        question: "How many bedrooms in your current house?",
        question_type: "dropdown",
        is_required: true,
        display_order: 2,
        options: {
          choices: [
            "Studio (0 bedroom)",
            "1 BHK",
            "2 BHK", 
            "3 BHK",
            "4 BHK",
            "5+ BHK"
          ]
        }
      },
      {
        question: "What is the total carpet area of your house? (in sq ft)",
        question_type: "number",
        is_required: true,
        display_order: 3,
        options: {
          min: 100,
          max: 10000,
          placeholder: "e.g., 1200"
        }
      },
      {
        question: "Which floor is your current house on?",
        question_type: "dropdown",
        is_required: true,
        display_order: 4,
        options: {
          choices: [
            "Ground Floor",
            "1st Floor",
            "2nd Floor",
            "3rd Floor",
            "4th Floor",
            "5th Floor",
            "6th Floor",
            "7th Floor",
            "8th Floor",
            "9th Floor",
            "10+ Floor"
          ]
        }
      },
      {
        question: "Is there an elevator available at pickup location?",
        question_type: "boolean",
        is_required: true,
        display_order: 5
      },
      
      // Destination Information
      {
        question: "Which floor is your new house on?",
        question_type: "dropdown",
        is_required: true,
        display_order: 6,
        options: {
          choices: [
            "Ground Floor",
            "1st Floor",
            "2nd Floor",
            "3rd Floor",
            "4th Floor",
            "5th Floor",
            "6th Floor",
            "7th Floor",
            "8th Floor",
            "9th Floor",
            "10+ Floor"
          ]
        }
      },
      {
        question: "Is there an elevator available at drop location?",
        question_type: "boolean",
        is_required: true,
        display_order: 7
      },
      
      // Household Items Categories
      {
        question: "Do you have heavy furniture items?",
        question_type: "sub_questions",
        is_required: true,
        display_order: 8,
        options: {
          sub_questions: [
            {
              question: "How many sofas/couches?",
              type: "number",
              required: false
            },
            {
              question: "How many beds (single/double/king)?",
              type: "number", 
              required: false
            },
            {
              question: "How many wardrobes/almirahs?",
              type: "number",
              required: false
            },
            {
              question: "How many dining tables?",
              type: "number",
              required: false
            },
            {
              question: "How many refrigerators?",
              type: "number",
              required: false
            },
            {
              question: "How many washing machines?",
              type: "number",
              required: false
            }
          ]
        }
      },
      {
        question: "Do you have electronic appliances?",
        question_type: "sub_questions",
        is_required: true,
        display_order: 9,
        options: {
          sub_questions: [
            {
              question: "How many TVs?",
              type: "number",
              required: false
            },
            {
              question: "How many air conditioners?",
              type: "number",
              required: false
            },
            {
              question: "How many microwave ovens?",
              type: "number",
              required: false
            },
            {
              question: "How many water purifiers/coolers?",
              type: "number",
              required: false
            },
            {
              question: "Any other major electronics? (Please specify)",
              type: "text",
              required: false
            }
          ]
        }
      },
      {
        question: "Kitchen items to be packed?",
        question_type: "sub_questions",
        is_required: true,
        display_order: 10,
        options: {
          sub_questions: [
            {
              question: "Estimate number of utensils/cookware sets",
              type: "dropdown",
              choices: ["1-2 sets", "3-5 sets", "6-10 sets", "10+ sets"],
              required: false
            },
            {
              question: "Number of gas cylinders",
              type: "number",
              required: false
            },
            {
              question: "Do you have a gas stove/cooktop?",
              type: "boolean",
              required: false
            },
            {
              question: "Any fragile crockery/glassware?",
              type: "boolean",
              required: false
            }
          ]
        }
      },
      
      // Special Items
      {
        question: "Do you have any valuable or fragile items?",
        question_type: "sub_questions",
        is_required: false,
        display_order: 11,
        options: {
          sub_questions: [
            {
              question: "Artwork or paintings?",
              type: "boolean",
              required: false
            },
            {
              question: "Musical instruments?",
              type: "text",
              placeholder: "Piano, guitar, etc.",
              required: false
            },
            {
              question: "Antique or valuable furniture?",
              type: "boolean",
              required: false
            },
            {
              question: "Expensive electronics (estimated value)?",
              type: "text",
              placeholder: "Home theater, expensive gadgets",
              required: false
            }
          ]
        }
      },
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
      
      // Storage and Boxes
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
      
      // Services Required
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
      
      // Vehicle and Transport
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
      
      // Special Requirements
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

    console.log(`📝 Preparing to insert ${questions.length} questions...`);

    // Insert questions in batches to handle dependencies
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      const { data, error } = await supabase
        .from('service_questions')
        .insert({
          service_type_id: serviceTypeId,
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
        console.error(`❌ Error inserting question ${i + 1}:`, error);
        throw error;
      }

      console.log(`✅ Inserted question ${i + 1}: "${question.question}"`);
    }

    console.log('\n🎉 Successfully set up all House Relocation service questions!');
    console.log('\n📊 Summary:');
    console.log(`- Service Type: ${serviceTypes.name}`);
    console.log(`- Total Questions: ${questions.length}`);
    console.log('- Question Types: Basic info, Furniture, Electronics, Kitchen, Special items, Services, Transport, Requirements');
    console.log('\n✨ Your house relocation service is now ready with comprehensive questions!');

  } catch (error) {
    console.error('❌ Error setting up house relocation questions:', error);
    process.exit(1);
  }
}

// Run the setup
setupHouseRelocationQuestions();