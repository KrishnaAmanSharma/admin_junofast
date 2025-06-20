// Apply database schema fixes to resolve foreign key relationship errors
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function applySchemaFixes() {
  try {
    console.log('Applying database schema fixes...\n');
    
    // The foreign key constraints need to be added through Supabase SQL editor
    // For now, let's verify the current table structure and relationships
    
    console.log('1. Checking orders table structure...');
    const { data: ordersInfo, error: ordersError } = await supabase
      .from('orders')
      .select('id, user_id')
      .limit(1);
    
    if (ordersError) {
      console.log(`Orders table error: ${ordersError.message}`);
    } else {
      console.log('✓ Orders table accessible');
    }

    console.log('\n2. Checking profiles table structure...');
    const { data: profilesInfo, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (profilesError) {
      console.log(`Profiles table error: ${profilesError.message}`);
    } else {
      console.log('✓ Profiles table accessible');
    }

    console.log('\n3. Checking service_types table structure...');
    const { data: serviceTypesInfo, error: serviceTypesError } = await supabase
      .from('service_types')
      .select('id, name')
      .limit(1);
    
    if (serviceTypesError) {
      console.log(`Service types table error: ${serviceTypesError.message}`);
    } else {
      console.log('✓ Service types table accessible');
    }

    console.log('\n4. Testing relationship query that was failing...');
    // This query was causing the error: "Could not find a relationship between 'orders' and 'user_id'"
    const { data: relationshipTest, error: relationshipError } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        service_type,
        status,
        profiles!user_id (
          id,
          full_name
        )
      `)
      .limit(1);
    
    if (relationshipError) {
      console.log(`Relationship query error: ${relationshipError.message}`);
      console.log('This confirms the foreign key relationship is missing');
    } else {
      console.log('✓ Relationship query successful');
      console.log('Foreign key relationships are working properly');
    }

    console.log('\n5. Alternative approach - manual join query...');
    // Try a manual join to see if data exists
    const { data: manualJoin, error: manualJoinError } = await supabase
      .from('orders')
      .select('id, user_id, service_type, status')
      .limit(5);
    
    if (manualJoinError) {
      console.log(`Manual join error: ${manualJoinError.message}`);
    } else {
      console.log(`✓ Found ${manualJoin.length} orders`);
      if (manualJoin.length > 0) {
        console.log(`Sample order: ${JSON.stringify(manualJoin[0])}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('SOLUTION: The database needs foreign key constraints to be added');
    console.log('This requires running SQL commands in Supabase SQL editor');
    console.log('The fix-database-schema.sql file contains the required commands');

  } catch (err) {
    console.error('Schema fix failed:', err.message);
  }
}

applySchemaFixes();