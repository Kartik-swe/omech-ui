# Omech - Manufacturing Management System

## Overview

Omech is a comprehensive manufacturing management system built with Next.js and React, designed to streamline operations for manufacturing businesses. The application provides tools for inventory management, production scheduling, material tracking, purchase order management, and more.

## Features

### Authentication & User Management
- Secure JWT token-based authentication
- User management with secure password policies
- Session management with automatic timeout

### Dashboard
- Visual representation of key metrics and production data
- Production trends and analytics
- Inventory status overview
- Shift management information

### Raw Materials Management
- Comprehensive inventory tracking
- Material stock level monitoring
- Grade and thickness filtering
- Vendor management
- Material status tracking
- Stock adjustments with audit trail

### Pipe Management
- Detailed pipe inventory tracking
- Inventory logs with history
- Stock adjustments with validation
- Machine and staff allocation
- Production tracking

### Purchase Order Management
- Schedule creation and management
- Delivery date tracking
- Dispatch management
- Item type categorization (Pipe, Coil, Sheet)
- Progress tracking

### Master Data Management
- User management
- Location management
- Machine configuration
- Material specifications

## Technology Stack

### Frontend
- **Framework**: Next.js 14
- **UI Library**: React 18
- **Language**: TypeScript
- **UI Components**: Ant Design
- **Styling**: Tailwind CSS
- **Data Visualization**: Recharts, Chart.js, Ant Design Charts
- **State Management**: React Context API
- **Authentication**: JWT with secure cookie storage

### API Integration
- RESTful API integration with axios
- JWT token authentication
- Secure cookie management with js-cookie

### Data Processing
- Excel file handling with xlsx
- CSV processing with papaparse and json2csv
- Date handling with moment.js

## Project Structure

```
src/
├── app/                    # Next.js App Router structure
│   ├── components/         # Reusable UI components
│   ├── context/            # React Context providers
│   ├── dashboard/          # Dashboard views
│   ├── login/              # Authentication pages
│   ├── master/             # Master data management
│   │   ├── location/       # Location management
│   │   ├── machine/        # Machine configuration
│   │   ├── material/       # Material specifications
│   │   └── users/          # User management
│   ├── materials/          # Raw materials management
│   ├── pipe/               # Pipe inventory management
│   │   ├── inventory/      # Inventory tracking
│   │   └── logs/           # Inventory history
│   ├── PO/                 # Purchase order management
│   │   └── schedule/       # Schedule management
│   └── schedule/           # Production scheduling
├── config/                 # Configuration files
├── lib/                    # Library code and utilities
└── utils/                  # Utility functions
    ├── apiClient.ts        # API request handling
    ├── common.ts           # Common utility functions
    └── constants.ts        # Application constants
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm, yarn, or pnpm
- Access to the backend API service (.NET Core)

### Installation

1. Clone the repository

```bash
git clone <repository-url>
cd omech
```

2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Configure environment variables

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_API_BASE_URL=<your-api-base-url>
NEXT_PUBLIC_AUTH_EXPIRY_TIME=660
```

### Development

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### Building for Production

```bash
npm run build
# or
yarn build
# or
pnpm build
```

Start the production server:

```bash
npm run start
# or
yarn start
# or
pnpm start
```

## Security Features

- JWT token-based authentication
- Secure cookie storage with appropriate flags
- CSRF protection
- Role-based access control
- Password validation and security policies
- Session timeout management

## Workflow

1. **Authentication**: Users log in through the secure login page
2. **Dashboard**: View key metrics and production data
3. **Materials Management**: Track and manage raw materials inventory
4. **Pipe Management**: Monitor pipe inventory and production
5. **Purchase Orders**: Create and manage purchase orders and schedules
6. **Master Data**: Maintain system configuration and user access

## License

Proprietary - All rights reserved

## Support

For support, please contact the system administrator or development team.