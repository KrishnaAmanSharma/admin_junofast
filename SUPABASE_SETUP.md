# Supabase Database Setup Guide

## Step 1: Configure Database Connection

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/projects)
2. Select your project
3. Click "Connect" in the top toolbar
4. Under "Connection string" → "Transaction pooler", copy the URI
5. Replace `[YOUR-PASSWORD]` with your actual database password
6. Update the DATABASE_URL secret in your Replit environment

## Step 2: Database Schema Setup

Your Supabase database should already have the following tables created based on your schema:

- `service_types` - Service categories (House, Office, Vehicle, etc.)
- `profiles` - User profiles linked to auth.users
- `orders` - Customer orders with pickup/drop locations
- `common_items` - Predefined items for each service type
- `service_questions` - Dynamic questionnaire system
- `common_items_in_orders` - Items selected in orders
- `custom_items` - Custom items added by customers
- `order_question_answers` - Customer responses to service questions
- `item_photos` - Photos of custom items
- `order_details` - Additional order metadata

## Step 3: Sample Data Setup

Once connected, run the setup script to populate your database with sample data:

```bash
node setup-sample-data.js
```

## Step 4: Switch to Production Database

After DATABASE_URL is configured, update `server/storage.ts`:

```typescript
// Change this line:
export const storage = new MockStorage();

// To this:
export const storage = new PostgresStorage();
```

## Features Available

### Dashboard
- Order metrics and revenue tracking
- Recent orders requiring attention
- Service type performance analytics

### Order Management
- View all orders with filtering by status and service type
- Update order status and pricing
- View detailed order information including items and customer responses

### User Management
- View all customer profiles
- Search users by name or email
- Edit user information

### Service Configuration
- Manage service types with images
- Configure common items for each service
- Set up dynamic questionnaires for customer data collection

### Integration Ready
- Full API compatibility with your Flutter mobile app
- Real-time data synchronization
- Proper foreign key relationships matching your existing schema

## API Endpoints

All endpoints are available at `/api/`:

- `GET /api/dashboard/metrics` - Dashboard statistics
- `GET /api/orders` - List orders with filters
- `GET /api/service-types` - List service types
- `GET /api/profiles` - List user profiles
- `POST /api/service-types` - Create service type
- `PATCH /api/orders/:id` - Update order

The admin portal is now ready for production use with your Supabase database.