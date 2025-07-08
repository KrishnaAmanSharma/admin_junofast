# Technical Context: Relo Admin Dashboard

## Technology Stack

### Frontend Technologies
- **React 18.3.1**: Core UI framework with hooks and functional components
- **TypeScript 5.6.3**: Type safety and enhanced developer experience
- **Vite 5.4.14**: Fast build tool and development server
- **Wouter 3.3.5**: Lightweight client-side routing
- **Tailwind CSS 3.4.17**: Utility-first CSS framework
- **Radix UI**: Accessible, unstyled UI components
- **React Query (@tanstack/react-query 5.60.5)**: Server state management
- **React Hook Form 7.55.0**: Form handling and validation
- **Zod 3.24.2**: Schema validation
- **Lucide React**: Icon library
- **Recharts 2.15.2**: Data visualization and charts

### Backend Technologies
- **Node.js**: JavaScript runtime environment
- **Express.js 4.21.2**: Web application framework
- **TypeScript**: Type-safe server-side development
- **Drizzle ORM 0.39.1**: Type-safe database ORM
- **PostgreSQL**: Primary database via Supabase
- **Supabase**: Backend-as-a-Service platform
- **Express Session**: Session management
- **CORS**: Cross-origin resource sharing

### Database & Storage
- **Supabase**: PostgreSQL database with real-time capabilities
- **Database URL**: Connection via postgres client
- **Drizzle Kit**: Database migrations and schema management
- **Session Storage**: In-memory session management

### Development Tools
- **TSX**: TypeScript execution for development
- **ESBuild**: Fast JavaScript bundler
- **Cross-env**: Cross-platform environment variables
- **Autoprefixer**: CSS vendor prefixing
- **PostCSS**: CSS processing

### Deployment & Build
- **Firebase Hosting**: Static site hosting
- **Electron**: Desktop application packaging
- **Electron Builder**: Desktop app distribution
- **Vite Build**: Production bundling

## Architecture Overview

### Application Structure
```
ReloAdminDashboard/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route-based page components
│   │   ├── lib/            # Utility libraries and clients
│   │   └── hooks/          # Custom React hooks
├── server/                 # Backend Express application
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Database abstraction layer
│   └── index.ts            # Server entry point
├── shared/                 # Shared code between client/server
│   └── schema.ts           # Database schema and types
└── memory-bank/            # Project documentation
```

### Data Flow Architecture
```
React Components → React Query → API Routes → Storage Layer → Supabase Database
                ↑                                                      ↓
            UI Updates ←── WebSocket/Real-time ←── Database Changes
```

## Database Architecture

### Current Schema (Drizzle ORM)
- **service_types**: Service categories and configurations
- **profiles**: User profile information (linked to Supabase auth)
- **orders**: Customer orders with pickup/drop details
- **common_items**: Predefined items for service types
- **service_questions**: Dynamic questions for service configuration
- **common_items_in_orders**: Items selected for specific orders
- **custom_items**: Custom items added to orders
- **order_question_answers**: Customer responses to service questions
- **item_photos**: Photos attached to custom items
- **order_details**: Additional order metadata

### Missing Tables (Identified in Schema Analysis)
- **vendor_profiles**: Vendor information and status
- **vendor_ratings**: Vendor performance ratings
- **vendor_responses**: Vendor responses to order broadcasts
- **order_broadcasts**: Order distribution to vendors
- **order_payments**: Payment tracking per order
- **order_payment_transactions**: Individual payment transactions
- **order_otps**: OTP codes for order verification
- **price_update_requests**: Vendor price change requests

## Development Setup

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://...
VITE_DATABASE_URL=postgresql://...

# Supabase
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...

# Development
NODE_ENV=development|production
```

### Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run check        # TypeScript type checking
npm run db:push      # Push database schema changes
```

### Build Process
1. **Development**: Vite dev server with HMR
2. **Production**: Vite build → Static files → Firebase hosting
3. **Desktop**: Electron packaging for Windows/Mac/Linux

## API Architecture

### REST Endpoints
- **GET /api/orders**: Fetch orders with filtering
- **PUT /api/orders/:id**: Update order status/details
- **POST /api/orders/:id/broadcast**: Broadcast order to vendors
- **GET /api/vendors**: Fetch vendor list with filters
- **POST /api/vendors/:id/approve**: Approve vendor application
- **GET /api/service-types**: Fetch service type configurations
- **GET /api/profiles**: Fetch user profiles
- **GET /api/dashboard/metrics**: Dashboard analytics

### Data Access Patterns
- **React Query**: Client-side caching and synchronization
- **Optimistic Updates**: Immediate UI updates with rollback
- **Real-time Updates**: Supabase subscriptions for live data
- **Pagination**: Server-side pagination for large datasets

## Security Considerations

### Authentication & Authorization
- **Supabase Auth**: User authentication system
- **Session Management**: Express sessions for admin access
- **Role-based Access**: Admin-only interface restrictions

### Data Security
- **Environment Variables**: Sensitive credentials management
- **HTTPS**: Encrypted data transmission
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Parameterized queries via Drizzle

### Current Security Issues
- **Hardcoded Credentials**: Supabase keys in server code (needs fixing)
- **Missing Rate Limiting**: No API rate limiting implemented
- **Audit Logging**: Limited tracking of admin actions

## Performance Considerations

### Frontend Optimization
- **Code Splitting**: Route-based lazy loading
- **React Query Caching**: Intelligent data caching
- **Memoization**: React.memo and useMemo for expensive operations
- **Bundle Optimization**: Tree shaking and minification

### Backend Optimization
- **Database Indexing**: Proper indexes on frequently queried fields
- **Query Optimization**: Efficient joins and data fetching
- **Connection Pooling**: Database connection management
- **Caching Strategy**: Redis or in-memory caching (future)

### Current Performance Issues
- **Dual Database Access**: Both Drizzle and Supabase clients
- **N+1 Queries**: Multiple database calls for related data
- **Large Bundle Size**: Comprehensive UI library imports

## Development Workflow

### Code Organization
- **Component Structure**: Atomic design principles
- **Type Safety**: Comprehensive TypeScript coverage
- **Error Handling**: Consistent error boundaries and validation
- **Testing Strategy**: Unit and integration testing (to be implemented)

### Database Workflow
- **Schema Changes**: Drizzle migrations
- **Data Seeding**: Setup scripts for development data
- **Backup Strategy**: Regular database backups
- **Version Control**: Schema versioning with migrations

## Deployment Strategy

### Current Deployment
- **Frontend**: Firebase Hosting for static files
- **Backend**: Node.js server (deployment target TBD)
- **Database**: Supabase managed PostgreSQL
- **CDN**: Firebase CDN for global distribution

### Desktop Distribution
- **Electron App**: Cross-platform desktop application
- **Auto-updates**: Electron updater for seamless updates
- **Packaging**: Platform-specific installers

## Technical Debt & Issues

### Critical Issues
1. **Dual Database Implementation**: Drizzle ORM + Direct Supabase
2. **Schema Inconsistencies**: Missing tables and field mismatches
3. **Security Vulnerabilities**: Hardcoded credentials
4. **Performance Bottlenecks**: Inefficient data fetching

### Recommended Solutions
1. **Standardize on Supabase**: Remove Drizzle ORM complexity
2. **Complete Schema**: Add missing vendor and payment tables
3. **Environment Variables**: Secure credential management
4. **Query Optimization**: Reduce database round trips

## Future Technical Considerations

### Scalability
- **Microservices**: Break down monolithic backend
- **Load Balancing**: Horizontal scaling capabilities
- **Database Sharding**: Handle increased data volume
- **CDN Integration**: Global content delivery

### Technology Upgrades
- **React 19**: Latest React features and optimizations
- **Next.js Migration**: Server-side rendering capabilities
- **GraphQL**: More efficient data fetching
- **Real-time Features**: Enhanced WebSocket integration

### Monitoring & Observability
- **Error Tracking**: Sentry or similar error monitoring
- **Performance Monitoring**: Application performance insights
- **Logging**: Comprehensive application logging
- **Analytics**: User behavior and system metrics
