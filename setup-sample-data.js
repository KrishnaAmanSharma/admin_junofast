import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./shared/schema.js";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const client = postgres(DATABASE_URL, { prepare: false });
const db = drizzle(client, { schema });

async function setupSampleData() {
  try {
    console.log("Setting up sample data...");

    // Create service types
    const serviceTypes = await db.insert(schema.serviceTypes).values([
      {
        name: "House Relocation",
        description: "Complete household moving service including packing, transportation, and unpacking",
        imageUrl: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        isActive: true
      },
      {
        name: "Office Relocation", 
        description: "Professional office moving service with minimal downtime",
        imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        isActive: true
      },
      {
        name: "Vehicle Transportation",
        description: "Safe and secure vehicle transportation service",
        imageUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        isActive: true
      }
    ]).returning();

    console.log("Created service types:", serviceTypes.length);

    // Create sample profiles
    const profiles = await db.insert(schema.profiles).values([
      {
        id: "550e8400-e29b-41d4-a716-446655440001",
        email: "john.smith@example.com",
        fullName: "John Smith",
        phoneNumber: "+91 9876543210"
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440002", 
        email: "sarah.wilson@example.com",
        fullName: "Sarah Wilson",
        phoneNumber: "+91 9876543211"
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440003",
        email: "mike.johnson@example.com", 
        fullName: "Mike Johnson",
        phoneNumber: "+91 9876543212"
      }
    ]).returning();

    console.log("Created profiles:", profiles.length);

    // Create sample orders
    const orders = await db.insert(schema.orders).values([
      {
        userId: profiles[0].id,
        serviceType: "House Relocation",
        pickupAddress: "123 Main St, Sector 15, Gurgaon",
        pickupPincode: "122001",
        pickupLatitude: 28.4595,
        pickupLongitude: 77.0266,
        dropAddress: "456 Oak Ave, Koramangala, Bangalore",
        dropPincode: "560034",
        status: "Pending",
        approxPrice: "25000"
      },
      {
        userId: profiles[1].id,
        serviceType: "Office Relocation",
        pickupAddress: "789 Business Park, Cyber City, Gurgaon",
        pickupPincode: "122002",
        pickupLatitude: 28.4949,
        pickupLongitude: 77.0787,
        dropAddress: "321 Tech Hub, Whitefield, Bangalore",
        dropPincode: "560066",
        status: "In Progress", 
        approxPrice: "150000"
      },
      {
        userId: profiles[2].id,
        serviceType: "Vehicle Transportation",
        pickupAddress: "555 Residential Colony, Dwarka, Delhi",
        pickupPincode: "110075",
        pickupLatitude: 28.5921,
        pickupLongitude: 77.0460,
        dropAddress: "777 New Area, Electronic City, Bangalore",
        dropPincode: "560100",
        status: "Price Updated",
        approxPrice: "8000"
      }
    ]).returning();

    console.log("Created orders:", orders.length);

    // Create common items
    const commonItems = await db.insert(schema.commonItems).values([
      {
        serviceTypeId: serviceTypes[0].id,
        name: "Sofa Set",
        description: "3-seater sofa set with cushions",
        imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        isActive: true
      },
      {
        serviceTypeId: serviceTypes[0].id,
        name: "Dining Table",
        description: "6-seater wooden dining table with chairs",
        imageUrl: "https://images.unsplash.com/photo-1549497538-303791108f95?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        isActive: true
      },
      {
        serviceTypeId: serviceTypes[1].id,
        name: "Office Desk",
        description: "Executive office desk with drawers",
        imageUrl: "https://images.unsplash.com/photo-1541558869434-2840d308329a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        isActive: true
      }
    ]).returning();

    console.log("Created common items:", commonItems.length);

    // Create service questions
    await db.insert(schema.serviceQuestions).values([
      {
        serviceTypeId: serviceTypes[0].id,
        question: "How many rooms need to be packed?",
        questionType: "number",
        isRequired: true,
        displayOrder: 1,
        isActive: true
      },
      {
        serviceTypeId: serviceTypes[0].id,
        question: "Do you need packing materials?",
        questionType: "boolean",
        isRequired: true,
        displayOrder: 2,
        isActive: true
      },
      {
        serviceTypeId: serviceTypes[1].id,
        question: "Number of workstations to relocate?",
        questionType: "number",
        isRequired: true,
        displayOrder: 1,
        isActive: true
      }
    ]);

    console.log("Sample data setup completed successfully!");

  } catch (error) {
    console.error("Error setting up sample data:", error);
    throw error;
  } finally {
    await client.end();
  }
}

setupSampleData().catch(console.error);