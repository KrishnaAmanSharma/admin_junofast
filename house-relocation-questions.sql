-- House Relocation Service Questions Setup Script
-- Run this in your Supabase SQL Editor

-- First, ensure House Relocation service type exists
INSERT INTO service_types (name, description, image_url, is_active)
VALUES ('House Relocation', 'Complete household goods shifting and relocation services', 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400', true)
ON CONFLICT (name) DO NOTHING;

-- Get the service type ID for House Relocation
DO $$
DECLARE
    house_service_id UUID;
BEGIN
    -- Get the service type ID
    SELECT id INTO house_service_id FROM service_types WHERE name = 'House Relocation';
    
    -- Insert all house relocation questions
    INSERT INTO service_questions (service_type_id, question, question_type, is_required, display_order, options, is_active) VALUES
    
    -- Basic Property Information
    (house_service_id, 'What type of house are you moving from?', 'dropdown', true, 1, 
     '{"choices": ["Apartment/Flat", "Independent House/Villa", "Duplex", "Studio Apartment", "Penthouse", "Row House", "Other"]}', true),
    
    (house_service_id, 'How many bedrooms in your current house?', 'dropdown', true, 2,
     '{"choices": ["Studio (0 bedroom)", "1 BHK", "2 BHK", "3 BHK", "4 BHK", "5+ BHK"]}', true),
    
    (house_service_id, 'What is the total carpet area of your house? (in sq ft)', 'number', true, 3,
     '{"min": 100, "max": 10000, "placeholder": "e.g., 1200"}', true),
    
    (house_service_id, 'Which floor is your current house on?', 'dropdown', true, 4,
     '{"choices": ["Ground Floor", "1st Floor", "2nd Floor", "3rd Floor", "4th Floor", "5th Floor", "6th Floor", "7th Floor", "8th Floor", "9th Floor", "10+ Floor"]}', true),
    
    (house_service_id, 'Is there an elevator available at pickup location?', 'boolean', true, 5, null, true),
    
    -- Destination Information
    (house_service_id, 'Which floor is your new house on?', 'dropdown', true, 6,
     '{"choices": ["Ground Floor", "1st Floor", "2nd Floor", "3rd Floor", "4th Floor", "5th Floor", "6th Floor", "7th Floor", "8th Floor", "9th Floor", "10+ Floor"]}', true),
    
    (house_service_id, 'Is there an elevator available at drop location?', 'boolean', true, 7, null, true),
    
    -- Furniture and Heavy Items
    (house_service_id, 'Do you have heavy furniture items?', 'sub_questions', true, 8,
     '{"sub_questions": [
        {"question": "How many sofas/couches?", "type": "number", "required": false},
        {"question": "How many beds (single/double/king)?", "type": "number", "required": false},
        {"question": "How many wardrobes/almirahs?", "type": "number", "required": false},
        {"question": "How many dining tables?", "type": "number", "required": false},
        {"question": "How many refrigerators?", "type": "number", "required": false},
        {"question": "How many washing machines?", "type": "number", "required": false}
     ]}', true),
    
    -- Electronic Appliances
    (house_service_id, 'Do you have electronic appliances?', 'sub_questions', true, 9,
     '{"sub_questions": [
        {"question": "How many TVs?", "type": "number", "required": false},
        {"question": "How many air conditioners?", "type": "number", "required": false},
        {"question": "How many microwave ovens?", "type": "number", "required": false},
        {"question": "How many water purifiers/coolers?", "type": "number", "required": false},
        {"question": "Any other major electronics? (Please specify)", "type": "text", "required": false}
     ]}', true),
    
    -- Kitchen Items
    (house_service_id, 'Kitchen items to be packed?', 'sub_questions', true, 10,
     '{"sub_questions": [
        {"question": "Estimate number of utensils/cookware sets", "type": "dropdown", "choices": ["1-2 sets", "3-5 sets", "6-10 sets", "10+ sets"], "required": false},
        {"question": "Number of gas cylinders", "type": "number", "required": false},
        {"question": "Do you have a gas stove/cooktop?", "type": "boolean", "required": false},
        {"question": "Any fragile crockery/glassware?", "type": "boolean", "required": false}
     ]}', true),
    
    -- Valuable and Fragile Items
    (house_service_id, 'Do you have any valuable or fragile items?', 'sub_questions', false, 11,
     '{"sub_questions": [
        {"question": "Artwork or paintings?", "type": "boolean", "required": false},
        {"question": "Musical instruments?", "type": "text", "placeholder": "Piano, guitar, etc.", "required": false},
        {"question": "Antique or valuable furniture?", "type": "boolean", "required": false},
        {"question": "Expensive electronics (estimated value)?", "type": "text", "placeholder": "Home theater, expensive gadgets", "required": false}
     ]}', true),
    
    -- Plants
    (house_service_id, 'Do you have plants to be moved?', 'sub_questions', false, 12,
     '{"sub_questions": [
        {"question": "How many potted plants?", "type": "number", "required": false},
        {"question": "Any large plants or trees?", "type": "text", "placeholder": "Describe size and type", "required": false}
     ]}', true),
    
    -- Packing Materials
    (house_service_id, 'How many cardboard boxes do you estimate you will need?', 'dropdown', true, 13,
     '{"choices": ["1-10 boxes", "11-25 boxes", "26-50 boxes", "51-75 boxes", "76-100 boxes", "100+ boxes"]}', true),
    
    (house_service_id, 'Do you need packing materials?', 'sub_questions', true, 14,
     '{"sub_questions": [
        {"question": "Bubble wrap for fragile items?", "type": "boolean", "required": false},
        {"question": "Packing paper/newspaper?", "type": "boolean", "required": false},
        {"question": "Plastic wrap for furniture?", "type": "boolean", "required": false},
        {"question": "Cloth covers for wardrobes?", "type": "boolean", "required": false}
     ]}', true),
    
    -- Services Required
    (house_service_id, 'What services do you need?', 'sub_questions', true, 15,
     '{"sub_questions": [
        {"question": "Packing service required?", "type": "boolean", "required": true},
        {"question": "Unpacking service required?", "type": "boolean", "required": true},
        {"question": "Loading/unloading service required?", "type": "boolean", "required": true},
        {"question": "Furniture dismantling required?", "type": "boolean", "required": false},
        {"question": "Furniture reassembly required?", "type": "boolean", "required": false}
     ]}', true),
    
    -- Vehicle and Transport
    (house_service_id, 'What type of vehicle do you prefer?', 'dropdown', true, 16,
     '{"choices": ["Small Tempo (for studio/1BHK)", "Large Tempo/Mini Truck (for 2BHK)", "Container Truck (for 3BHK+)", "Multiple Vehicles (large house)", "Let movers decide"]}', true),
    
    -- Storage
    (house_service_id, 'Do you need storage/warehousing?', 'sub_questions', false, 17,
     '{"sub_questions": [
        {"question": "Temporary storage required?", "type": "boolean", "required": false},
        {"question": "How many days of storage?", "type": "number", "placeholder": "Number of days", "required": false}
     ]}', true),
    
    -- Special Requirements
    (house_service_id, 'Any special requirements or concerns?', 'text', false, 18,
     '{"placeholder": "Parking restrictions, narrow stairs, timing constraints, etc.", "multiline": true}', true),
    
    -- Scheduling
    (house_service_id, 'Preferred moving date and time', 'sub_questions', true, 19,
     '{"sub_questions": [
        {"question": "Preferred date", "type": "date", "required": true},
        {"question": "Preferred time slot", "type": "dropdown", "choices": ["Morning (8AM-12PM)", "Afternoon (12PM-4PM)", "Evening (4PM-8PM)", "Flexible"], "required": true}
     ]}', true),
    
    -- Insurance
    (house_service_id, 'Insurance coverage required?', 'sub_questions', false, 20,
     '{"sub_questions": [
        {"question": "Do you want insurance for your goods?", "type": "boolean", "required": false},
        {"question": "Estimated value of goods for insurance", "type": "number", "placeholder": "Total value in rupees", "required": false}
     ]}', true)
    
    ON CONFLICT (service_type_id, display_order) DO NOTHING;
    
    RAISE NOTICE 'House Relocation questions setup completed successfully!';
END $$;