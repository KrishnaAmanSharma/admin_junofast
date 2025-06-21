import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import * as schema from './shared/schema';

async function createTestOrderDetails() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client, { schema });

  try {
    // Get an existing order ID
    const orders = await db.select().from(schema.orders).limit(1);
    if (orders.length === 0) {
      console.log('No orders found');
      return;
    }

    const orderId = orders[0].id;
    console.log(`Adding order details to order: ${orderId}`);

    // Delete existing order details for this order first
    await db.delete(schema.orderDetails).where(eq(schema.orderDetails.orderId, orderId));

    // Create order details based on the Flutter app structure
    const orderDetailsData = [
      { orderId, name: 'destination_floor', value: '5' },
      { orderId, name: 'employee_count', value: '8' },
      { orderId, name: 'office_size', value: '2500' },
      { orderId, name: 'elevator_access', value: 'yes' },
      { orderId, name: 'parking_available', value: 'yes' },
      { orderId, name: 'special_instructions', value: 'Handle with care - fragile equipment' },
      { orderId, name: 'moving_date', value: '2024-01-15' },
      { orderId, name: 'packing_required', value: 'yes' },
    ];

    // Insert order details
    await db.insert(schema.orderDetails).values(orderDetailsData);
    
    console.log(`Successfully created ${orderDetailsData.length} order details for order ${orderId}`);
    
    // Verify the data was inserted
    const insertedDetails = await db.select().from(schema.orderDetails)
      .where(eq(schema.orderDetails.orderId, orderId));
    
    console.log('Inserted order details:', insertedDetails.map(d => `${d.name}: ${d.value}`));
    
  } catch (error) {
    console.error('Error creating test order details:', error);
  } finally {
    await client.end();
  }
}

createTestOrderDetails();