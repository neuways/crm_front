# Neuways CRM - Frontend Client

Modern Real Estate CRM frontend built with React, TypeScript, Vite, and Tailwind CSS.

## Features
- **Sales Agent Dashboard**: Pipeline tracking, follow-up management, lead qualification.
- **Manager Panel**: Team performance metrics, lead assignment, and roster management.
- **Admin Dashboard**: Company-wide oversight, property mapping, employee management.
- **Real-time Pipeline**: Interactive workflow stages (Follow-up, Meeting, Site Visit, Deal Done).
- **Duplicate Detection & Re-enquiry**: Instant flagging and resolution.
- **Do Not Contact (DNC)**: Customer communication restrictions.

## Quick Start

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation
```bash
npm install
```

### Environment Configuration
Copy `.env.example` to `.env` and configure your API URL:
```bash
cp .env.example .env
```
Default:
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

### Development Server
```bash
npm run dev
```

### Production Build
```bash
npm run build
```
