# Juno Fast Vendor App

A comprehensive Flutter mobile application for vendors providing relocation services through the Juno Fast platform.

## Overview

The Juno Fast Vendor App enables service providers to:
- View and accept available relocation orders
- Manage their order pipeline from assignment to completion
- Request price updates with admin approval
- Track earnings and performance metrics
- Manage their vendor profile and business information

## Features

### 🎯 Core Functionality
- **Order Management**: View available orders, accept assignments, track progress
- **Real-time Notifications**: Get notified of new orders and updates
- **Price Negotiation**: Request price updates with justification
- **Earnings Tracking**: Comprehensive earnings analytics and history
- **Profile Management**: Update business information and service types

### 🎨 User Experience
- **World-class UI**: Modern, intuitive interface following Material Design
- **Responsive Design**: Optimized for various screen sizes
- **Offline Support**: Core functionality works without internet
- **Dark/Light Theme**: Automatic theme switching support

### 🔐 Security & Privacy
- **Customer Privacy**: Customer details hidden until order acceptance
- **Secure Authentication**: Supabase-powered authentication
- **Data Encryption**: All sensitive data properly encrypted

## Architecture

### 📁 Project Structure
```
lib/
├── core/                           # Core utilities and shared resources
│   ├── constants/
│   │   └── app_constants.dart      # App-wide constants and configuration
│   ├── theme/
│   │   └── app_theme.dart         # Material Theme configuration
│   ├── services/
│   │   ├── auth_service.dart      # Authentication service
│   │   ├── storage_service.dart   # Local storage management
│   │   └── notification_service.dart # Push notifications
│   └── utils/                     # Utility functions
│
├── features/                      # Feature-based modules
│   ├── auth/                      # Authentication feature
│   │   ├── data/
│   │   │   └── models/
│   │   │       └── vendor_model.dart
│   │   └── presentation/
│   │       ├── controllers/
│   │       │   └── auth_controller.dart
│   │       ├── pages/
│   │       │   ├── login_page.dart
│   │       │   ├── register_page.dart
│   │       │   └── forgot_password_page.dart
│   │       └── widgets/
│   │           ├── custom_text_field.dart
│   │           └── custom_button.dart
│   │
│   ├── dashboard/                 # Dashboard feature
│   │   └── presentation/
│   │       ├── pages/
│   │       │   └── dashboard_page.dart
│   │       └── widgets/
│   │           ├── dashboard_stats_card.dart
│   │           ├── quick_actions_card.dart
│   │           ├── recent_orders_card.dart
│   │           └── earnings_overview_card.dart
│   │
│   ├── orders/                    # Order management feature
│   │   ├── data/
│   │   │   └── models/
│   │   │       └── order_model.dart
│   │   └── presentation/
│   │       ├── controllers/
│   │       │   └── orders_controller.dart
│   │       ├── pages/
│   │       │   ├── available_orders_page.dart
│   │       │   ├── my_orders_page.dart
│   │       │   ├── order_details_page.dart
│   │       │   └── order_tracking_page.dart
│   │       └── widgets/
│   │           ├── order_card.dart
│   │           └── order_filters.dart
│   │
│   ├── earnings/                  # Earnings tracking feature
│   │   └── presentation/
│   │       ├── controllers/
│   │       │   └── earnings_controller.dart
│   │       └── pages/
│   │           └── earnings_page.dart
│   │
│   ├── profile/                   # Profile management feature
│   │   └── presentation/
│   │       ├── controllers/
│   │       │   └── profile_controller.dart
│   │       └── pages/
│   │           └── profile_page.dart
│   │
│   └── notifications/             # Notifications feature
│       └── presentation/
│           └── pages/
│               └── notifications_page.dart
│
└── main.dart                      # Application entry point
```

## Dependencies

### Required Packages
Add these packages to your `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # State Management
  get: ^4.6.5
  provider: ^6.0.5
  
  # Backend & Database
  supabase_flutter: ^1.10.25
  
  # Local Storage
  shared_preferences: ^2.2.2
  
  # Notifications
  firebase_messaging: ^14.7.9
  flutter_local_notifications: ^16.3.0
  
  # Permissions
  permission_handler: ^11.1.0
  
  # UI Components
  cupertino_icons: ^1.0.2

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0
```

## Setup Instructions

### 1. Prerequisites
- Flutter SDK (3.0.0 or higher)
- Dart SDK (2.17.0 or higher)
- Android Studio / VS Code
- Git

### 2. Clone and Setup
```bash
# Clone the repository
git clone <repository-url>
cd vendor-app

# Install dependencies
flutter pub get

# Run the app
flutter run
```

### 3. Backend Configuration

#### Supabase Setup
1. Create a new Supabase project
2. Update the configuration in `lib/core/constants/app_constants.dart`:
```dart
static const String baseUrl = 'YOUR_SUPABASE_URL';
static const String apiKey = 'YOUR_SUPABASE_ANON_KEY';
```

#### Database Schema
The app expects these tables in your Supabase database:

```sql
-- Vendor profiles table
CREATE TABLE vendor_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  business_name TEXT NOT NULL,
  service_types TEXT[] NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  status TEXT DEFAULT 'pending_approval',
  rating DECIMAL DEFAULT 0.0,
  total_orders INTEGER DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  total_earnings DECIMAL DEFAULT 0.0,
  profile_image_url TEXT,
  business_license TEXT,
  insurance_info TEXT,
  is_online BOOLEAN DEFAULT false,
  last_active_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Orders table (shared with customer app)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  vendor_id UUID REFERENCES vendor_profiles(id),
  service_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  estimated_price DECIMAL,
  final_price DECIMAL,
  city TEXT NOT NULL,
  pickup_address TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  special_instructions TEXT,
  distance DECIMAL,
  priority INTEGER DEFAULT 1,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Price update requests table
CREATE TABLE price_update_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  vendor_id UUID REFERENCES vendor_profiles(id),
  requested_price DECIMAL NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  admin_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);
```

### 4. Firebase Setup (for notifications)
1. Create a Firebase project
2. Add your Android/iOS app to Firebase
3. Download and add configuration files:
   - `android/app/google-services.json`
   - `ios/Runner/GoogleService-Info.plist`

## Key Components

### Authentication Flow
- **Login**: Email/password authentication via Supabase
- **Registration**: Multi-step vendor registration with business details
- **Password Reset**: Email-based password recovery

### Order Management
- **Available Orders**: Filtered by vendor location and service types
- **Order Acceptance**: Quick acceptance with optional price proposals
- **Order Tracking**: Real-time status updates and timeline
- **Price Negotiation**: Request price changes with admin approval

### Earnings System
- **Real-time Tracking**: Live earnings calculations
- **Analytics**: Daily, weekly, monthly breakdowns
- **Service Performance**: Earnings by service type
- **Payment History**: Detailed transaction records

### Profile Management
- **Business Information**: Editable vendor details
- **Service Types**: Manage offered services
- **Online Status**: Toggle availability for new orders
- **Performance Metrics**: Rating, completion rate, total orders

## Customization

### Branding
Update brand colors in `lib/core/constants/app_constants.dart`:
```dart
static const Color primaryColor = Color(0xFF2563EB);    // Juno Fast Blue
static const Color secondaryColor = Color(0xFF059669);  // Juno Fast Green
static const Color backgroundColor = Color(0xFFF8FAFC); // Light Gray
static const Color textColor = Color(0xFF1E293B);       // Dark Gray
static const Color accentColor = Color(0xFFDC2626);     // Red
static const Color warningColor = Color(0xFFD97706);    // Orange
```

### Service Types
Modify available services in `app_constants.dart`:
```dart
static const List<String> serviceTypes = [
  'House Relocation',
  'Office Relocation',
  'Vehicle Transportation',
  'Pet Relocation',
  'Industrial Moving',
  'Event/Exhibition Setup'
];
```

## Development Guidelines

### State Management
- Uses GetX for routing and dependency injection
- Provider for authentication state
- Controllers for feature-specific state management

### API Integration
- Supabase client for database operations
- Real-time subscriptions for live updates
- Proper error handling and offline support

### Code Structure
- Clean Architecture principles
- Feature-based folder structure
- Separation of concerns
- Reusable UI components

## Testing

### Unit Tests
```bash
flutter test
```

### Integration Tests
```bash
flutter test integration_test/
```

### Widget Tests
Individual widget testing for UI components

## Deployment

### Android
```bash
flutter build apk --release
# or
flutter build appbundle --release
```

### iOS
```bash
flutter build ios --release
```

## Support & Documentation

### API Documentation
- Supabase: [https://supabase.io/docs](https://supabase.io/docs)
- Flutter: [https://flutter.dev/docs](https://flutter.dev/docs)
- GetX: [https://pub.dev/packages/get](https://pub.dev/packages/get)

### Common Issues
1. **Build Issues**: Run `flutter clean && flutter pub get`
2. **Supabase Connection**: Check URL and API key configuration
3. **Notifications**: Verify Firebase setup and permissions

## Contributing

1. Follow Flutter style guide
2. Write tests for new features
3. Update documentation
4. Submit pull requests with clear descriptions

## License

This project is proprietary to Juno Fast. All rights reserved.

---

**Version**: 1.0.0  
**Last Updated**: June 2025  
**Maintainer**: Juno Fast Development Team