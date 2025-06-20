// Execute database schema fixes using Supabase RPC or direct SQL execution
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSchemaFix() {
  try {
    console.log('Executing database schema fixes...\n');
    
    // First, let's try to add the missing foreign key constraints one by one
    console.log('1. Adding foreign key constraint for orders.user_id -> profiles.id');
    
    const { data: fkResult1, error: fkError1 } = await supabase.rpc('exec_sql', {
      query: `
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'orders_user_id_fkey'
          ) THEN
            ALTER TABLE orders 
            ADD CONSTRAINT orders_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES profiles(id);
          END IF;
        END $$;
      `
    });

    if (fkError1) {
      console.log(`FK constraint 1 error: ${fkError1.message}`);
    } else {
      console.log('✓ Orders -> Profiles foreign key added');
    }

    console.log('\n2. Adding foreign key constraint for common_items.service_type_id -> service_types.id');
    
    const { data: fkResult2, error: fkError2 } = await supabase.rpc('exec_sql', {
      query: `
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'common_items_service_type_id_fkey'
          ) THEN
            ALTER TABLE common_items 
            ADD CONSTRAINT common_items_service_type_id_fkey 
            FOREIGN KEY (service_type_id) REFERENCES service_types(id);
          END IF;
        END $$;
      `
    });

    if (fkError2) {
      console.log(`FK constraint 2 error: ${fkError2.message}`);
    } else {
      console.log('✓ Common Items -> Service Types foreign key added');
    }

    console.log('\n3. Testing the fixed relationship query...');
    
    // Test the relationship query that was failing
    const { data: testResult, error: testError } = await supabase
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
    
    if (testError) {
      console.log(`Test query still failing: ${testError.message}`);
      console.log('Foreign key constraints may need to be added manually through Supabase dashboard');
    } else {
      console.log('✓ Relationship query now working!');
      console.log('Database schema fixed successfully');
    }

    console.log('\n' + '='.repeat(60));
    console.log('Schema fix execution complete');

  } catch (err) {
    console.error('Schema fix execution failed:', err.message);
    console.log('\nAlternative solution: The foreign key constraints need to be added');
    console.log('manually through the Supabase SQL editor using the commands in fix-database-schema.sql');
  }
}

executeSchemaFix();