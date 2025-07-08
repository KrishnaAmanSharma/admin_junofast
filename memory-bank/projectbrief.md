# Project Brief: Relo Admin Dashboard

## Project Overview
**Relo Admin Dashboard** is a comprehensive administrative interface for managing a relocation/moving services platform called "Juno Fast". This is a React-based web application that provides admin users with tools to manage orders, users, vendors, service types, and system configuration.

## Core Purpose
The dashboard serves as the central command center for administrators to:
- Monitor and manage customer orders for relocation services
- Oversee vendor operations and approvals
- Configure service types and common items
- Manage user profiles and system settings
- Handle payments and financial transactions
- Generate reports and analytics

## Key Business Domain
**Relocation/Moving Services Platform**
- Customers place orders for moving/relocation services
- Orders are broadcast to qualified vendors
- Vendors respond with acceptance or price updates
- Admins manage the entire workflow and vendor relationships
- System handles complex order details, custom items, and service questions

## Target Users
- **Primary**: System administrators managing the Juno Fast platform
- **Secondary**: Operations managers overseeing day-to-day activities
- **Tertiary**: Support staff handling customer and vendor issues

## Core Requirements

### Functional Requirements
1. **Order Management**
   - View, filter, and search orders
   - Update order status and pricing
   - Manage order details and custom items
   - Handle vendor assignments and broadcasts

2. **User Management**
   - Manage customer profiles
   - View user activity and order history
   - Handle user support issues

3. **Vendor Management**
   - Approve/reject vendor applications
   - Monitor vendor performance and ratings
   - Manage vendor responses to order broadcasts

4. **Service Configuration**
   - Define service types (e.g., house relocation, office moving)
   - Manage common items for each service type
   - Configure service-specific questions

5. **Payment Management**
   - Track order payments and transactions
   - Handle refunds and payment disputes
   - Monitor financial metrics

6. **Dashboard & Analytics**
   - Real-time metrics and KPIs
   - Order status distribution
   - Revenue tracking
   - User growth analytics

### Technical Requirements
- **Frontend**: React with TypeScript
- **Backend**: Express.js with Node.js
- **Database**: Supabase (PostgreSQL)
- **UI Framework**: Tailwind CSS with Radix UI components
- **State Management**: React Query for server state
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite
- **Deployment**: Firebase Hosting

## Success Criteria
1. Efficient order processing and vendor management
2. Streamlined admin workflows
3. Real-time visibility into platform operations
4. Scalable architecture supporting business growth
5. Secure and reliable system operations

## Project Constraints
- Must integrate with existing Supabase database
- Should maintain compatibility with mobile vendor app
- Must handle real-time updates for order status changes
- Security requirements for handling sensitive user and payment data

## Current Status
- Core functionality implemented
- Database schema established with some architectural inconsistencies
- Frontend components and pages completed
- Integration with Supabase partially implemented
- Deployment pipeline configured for Firebase

## Key Stakeholders
- **Development Team**: Building and maintaining the platform
- **Business Operations**: Using the dashboard for daily operations
- **Customer Support**: Handling user and vendor issues
- **Management**: Monitoring business metrics and growth
