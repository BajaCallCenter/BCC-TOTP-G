
# TOTP Authentication System

A React 19 application with Material-UI components for managing Time-Based One-Time Password (TOTP) authentication codes.

## Project Structure

```
src/
├── Frontend/                 # Frontend components and UI logic
│   └── components/
│       ├── LoginScreen.tsx   # Auth0-ready login interface
│       ├── TOTPDashboard.tsx # Main dashboard for TOTP codes
│       └── TOTPCard.tsx      # Individual TOTP code display
│
├── Backend/                  # Backend services and API logic
│   ├── api/                  # API layer
│   │   ├── authAPI.ts        # Authentication API calls
│   │   └── totpAPI.ts        # TOTP-related API calls
│   ├── services/             # Business logic services
│   │   ├── AuthService.ts    # Authentication service
│   │   └── TOTPService.ts    # TOTP generation and management
│   ├── config/               # Configuration files
│   │   └── auth0Config.ts    # Auth0 configuration
│   └── types/                # Shared TypeScript types
│       └── index.ts          # Common type definitions
│
├── components/ui/            # Shadcn UI components (read-only)
├── hooks/                    # Custom React hooks
├── lib/                      # Utility functions
└── pages/                    # Page components
```

## Features

### Implemented
- ✅ Material-UI themed interface
- ✅ Login screen prepared for Auth0 integration
- ✅ TOTP dashboard with code display
- ✅ Real-time code updates and progress indicators
- ✅ Copy to clipboard functionality
- ✅ Search and filter accounts
- ✅ Responsive design
- ✅ Componentized architecture

### Ready for Integration
- 🔄 Auth0 Google authentication (frontend prepared)
- 🔄 Real TOTP code generation (service structure ready)
- 🔄 Backend API integration (API layer implemented)
- 🔄 Database integration for account storage

## Next Steps

1. **Auth0 Integration**
   - Add Auth0 environment variables
   - Install `@auth0/auth0-react`
   - Replace mock login with Auth0 provider

2. **TOTP Implementation**
   - Install `otplib` for real TOTP generation
   - Implement QR code scanning for account setup
   - Add account management (add/remove/edit)

3. **Backend Integration**
   - Connect to database for account persistence
   - Implement secure secret storage
   - Add API endpoints for CRUD operations

## Technologies Used

- React 19
- Material-UI (MUI)
- TypeScript
- React Router
- React Query (TanStack Query)
- Sonner (for notifications)
```
