# Moving & Relocation Service Management System

A complete full-stack web application for managing moving and relocation services, including order management, vendor coordination, and price negotiations.

## Features

- **Order Management**: Create and track moving orders with detailed item lists
- **Vendor Management**: Manage approved vendors and their service capabilities
- **Price Negotiation**: Handle price updates and approvals between vendors and admin
- **Broadcasting System**: Send orders to multiple vendors based on criteria
- **Real-time Updates**: Live status updates and notifications
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI Components**: shadcn/ui, Lucide React icons
- **State Management**: TanStack React Query

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud like Supabase)
- Basic knowledge of React and Node.js

## Quick Setup

1. **Extract and navigate to project:**
   ```bash
   tar -xzf project-complete.tar.gz
   cd workspace
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Database Setup:**
   - Create a PostgreSQL database
   - Update the database connection in `server/storage.ts` with your database credentials
   - Push the database schema:
     ```bash
     npm run db:push
     ```

4. **Environment Variables:**
   Create a `.env` file in the root directory:
   ```
   DATABASE_URL=your_postgresql_connection_string
   NODE_ENV=development
   ```

5. **Run the application:**
   ```bash
   npm run dev
   ```

6. **Access the application:**
   Open http://localhost:5000 in your browser

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── lib/           # Utility functions
│   │   └── hooks/         # Custom React hooks
├── server/                 # Backend Express server
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   └── storage.ts         # Database operations
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Database schema definitions
├── drizzle.config.ts      # Database configuration
├── package.json           # Dependencies and scripts
└── README-SETUP.md        # This file
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open database studio

## Database Schema

The application uses the following main entities:

- **Orders**: Customer moving requests with details
- **Profiles**: Customer information
- **Vendors**: Service providers
- **Service Types**: Available moving services
- **Common Items**: Pre-defined moving items
- **Custom Items**: Customer-specific items
- **Vendor Responses**: Vendor bids and price updates
- **Order Broadcasts**: Vendor assignment tracking

## Key Features Explained

### Order Management
- Create orders with service type selection
- Add common items (furniture, appliances) and custom items
- Track order status from Pending to Completed
- Update pricing (approximate, estimated, final)

### Vendor System
- Approve vendors with service capabilities
- Broadcast orders to multiple vendors
- Handle vendor acceptances and price negotiations
- Prevent multiple vendor assignments per order

### Price Management
- Three price types: Approximate, Estimated, Final
- Admin approval for price updates
- Automatic vendor assignment on price approval
- Order status updates based on pricing decisions

## Configuration Notes

### Database Connection
The current setup uses Supabase credentials in `server/storage.ts`. To use your own database:

1. Replace the Supabase URL and key with your database connection
2. Or use environment variables for better security
3. Ensure your PostgreSQL database is accessible

### Customization
- Modify service types in the database
- Update UI components in the `client/src/components` directory
- Add new API endpoints in `server/routes.ts`
- Extend database schema in `shared/schema.ts`

## Troubleshooting

### Common Issues
1. **Database connection errors**: Verify DATABASE_URL is correct
2. **Port conflicts**: Change port in `server/index.ts` if needed
3. **Build errors**: Ensure all dependencies are installed with `npm install`

### Development Tips
- Use `npm run db:studio` to inspect database contents
- Check browser console for frontend errors
- Monitor server logs for backend issues
- Use the API endpoints directly for testing

## Production Deployment

1. Build the application: `npm run build`
2. Set production environment variables
3. Use a process manager like PM2
4. Configure reverse proxy (nginx/apache)
5. Set up SSL certificates
6. Configure database backups

## Support

This is a complete working application ready for deployment or further development. The codebase follows modern practices with TypeScript, proper error handling, and responsive design.

For customization or enhancement, focus on:
- Adding new service types
- Extending vendor capabilities
- Implementing payment processing
- Adding notification systems
- Enhancing reporting features