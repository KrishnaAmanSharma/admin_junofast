# Juno Fast - Relocation Services Platform

## Overview

Juno Fast is a comprehensive relocation services platform that connects customers with vendors for various moving and transportation services. The system consists of a React-based web application for customers and admins, and a Flutter mobile app for vendors. The platform uses Supabase as the backend database and provides features for order management, vendor assignment, price negotiation, and earnings tracking.

## System Architecture

### Frontend Architecture
- **React Web Application**: Built with Vite, React, and TypeScript
- **UI Framework**: Shadcn/UI components with Tailwind CSS for styling
- **State Management**: TanStack Query for server state management
- **Routing**: React Router for navigation
- **Form Handling**: React Hook Form with Zod validation

### Mobile Application
- **Flutter Vendor App**: Native mobile application for vendors
- **State Management**: GetX for state management and navigation
- **Authentication**: Supabase Auth integration
- **Real-time Updates**: Supabase realtime subscriptions

### Backend Architecture
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth with row-level security
- **API**: RESTful API endpoints for data operations
- **Real-time**: Supabase realtime for live updates

## Key Components

### Database Schema
- **Users & Profiles**: Customer and vendor profile management
- **Service Types**: Configurable service categories (House, Office, Vehicle relocation)
- **Orders**: Core order management with status tracking
- **Dynamic Questionnaire**: Customizable questions per service type
- **Item Management**: Common items and custom items with photo support
- **Vendor Broadcast System**: Order assignment and bidding workflow
- **Earnings Tracking**: Vendor payment and earnings management

### Order Management System
- **Multi-step Order Creation**: Progressive form with dynamic questions
- **Item Selection**: Pre-defined common items plus custom item support
- **Address Management**: Pickup and delivery location handling
- **Photo Upload**: Support for custom item documentation
- **Status Tracking**: Complete order lifecycle management

### Vendor Assignment Workflow
- **Broadcast System**: Orders are broadcast to eligible vendors
- **Smart Filtering**: Vendors filtered by location, service type, and rating
- **Price Negotiation**: Vendors can propose alternative pricing
- **Admin Approval**: Price updates require admin approval
- **Acceptance Tracking**: Real-time vendor response monitoring

### Admin Dashboard
- **Order Analytics**: Revenue metrics and order statistics
- **Vendor Management**: Approve vendors and monitor performance
- **Price Control**: Review and approve vendor price requests
- **Real-time Monitoring**: Live order and vendor status updates

## Data Flow

### Order Creation Flow
1. Customer selects service type
2. Dynamic questionnaire loads based on service
3. Customer fills location details and special requirements
4. Common items selected from predefined list
5. Custom items added with photos if needed
6. Order submitted and enters "Pending" status

### Vendor Assignment Flow
1. Admin reviews pending order
2. Order broadcast to eligible vendors in service area
3. Vendors receive notification and can accept/reject
4. If vendor requests price change, admin review required
5. Once accepted, order status changes to "Assigned"
6. Vendor proceeds with service delivery

### Payment and Completion Flow
1. Service completed by vendor
2. Order marked as "Completed"
3. Customer payment processed
4. Vendor earnings recorded and tracked
5. Performance metrics updated

## External Dependencies

### Core Services
- **Supabase**: Backend-as-a-Service providing database, auth, and real-time features
- **Vercel/Replit**: Hosting and deployment platform
- **Cloudinary/Supabase Storage**: Image and file storage
- **Push Notifications**: FCM for mobile notifications

### Development Tools
- **Drizzle ORM**: Database schema and query management
- **TypeScript**: Type safety across the application
- **ESLint/Prettier**: Code quality and formatting
- **Tailwind CSS**: Utility-first CSS framework

### Third-party Libraries
- **React Hook Form**: Form state management
- **Zod**: Schema validation
- **TanStack Query**: Server state management
- **date-fns**: Date manipulation
- **Lucide React**: Icon library

## Deployment Strategy

### Web Application
- **Build Process**: Vite production build with TypeScript compilation
- **Static Assets**: Served from dist/public directory
- **Environment Variables**: Supabase credentials and API keys
- **Deployment Target**: Replit autoscale with Node.js runtime

### Database
- **Production Database**: Supabase PostgreSQL with connection pooling
- **Development**: Local development uses Supabase remote database
- **Schema Management**: SQL migrations and sample data scripts
- **Backup Strategy**: Supabase automated backups

### Mobile App
- **Flutter Build**: Native Android/iOS compilation
- **Code Signing**: Platform-specific certificates required
- **Distribution**: App stores or direct APK distribution
- **Updates**: Over-the-air updates for non-native changes

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- **June 25, 2025**: Complete Windows EXE solution implemented
  - Created Electron wrapper for desktop application
  - Built automated build scripts and comprehensive documentation
  - Generated complete downloadable package for Windows EXE creation
  - EXE includes native Windows app with embedded server and database connectivity
  - Both installer and portable versions supported for distribution

- **June 25, 2025**: Fixed order status progression flow
  - Status progression: Pending → Broadcasted → Confirmed → Price Accepted → In Progress → Completed/Canceled
  - Implemented backward status prevention (orders can only move forward)
  - Fixed duplicate broadcast error by checking existing broadcasts
  - Added conditions to disable broadcasting/approval features for confirmed orders with assigned vendors
  - Enhanced vendor acceptance approval to properly update order status to "Confirmed"

## Changelog

Changelog:
- June 25, 2025. Initial setup