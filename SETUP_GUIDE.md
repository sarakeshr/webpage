# Project Setup Guide

## Prerequisites
- Node.js 16+ installed
- MongoDB database
- Email service credentials (for notifications)

## Installation Steps

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` file with:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   EMAIL_USER=your_email@example.com
   EMAIL_PASS=your_email_password
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## User Roles

- **Admin**: Full system access
- **Project Manager**: Create/manage projects, schedule meetings
- **Developer**: View projects, join meetings
- **Tester**: View projects, join meetings
- **Client**: View assigned projects, join meetings
- **CRM**: View projects for sales
- **Director**: View all projects, join meetings

## Features

- Role-based authentication
- Project management
- Meeting scheduling with Jitsi
- Real-time messaging
- Email notifications
- Calendar integration

## API Documentation

See individual API files in `/pages/api/` for endpoint documentation.