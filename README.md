# ABES Engineering College Admission Portal

A comprehensive web application for automating the admission process at ABES Engineering College. This application provides a seamless experience for student registration, application submission, and application management.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
  - [Firebase Setup](#firebase-setup)
  - [Environment Variables](#environment-variables)
- [Database Structure](#database-structure)
- [Authentication](#authentication)
- [User Roles](#user-roles)
- [File Storage](#file-storage)
- [Development](#development)
- [Deployment](#deployment)
- [Security Rules](#security-rules)
- [Troubleshooting](#troubleshooting)

## Features

- User authentication with email/password and Google Sign-In
- Comprehensive admission form with multi-step process
- Document upload functionality
- Application status tracking
- Admin panel for application management
- Responsive design for all devices

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Animation**: Framer Motion
- **Form Handling**: Formik, Yup
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Prerequisites

1. Node.js (v16 or higher)
2. npm or yarn
3. A Firebase project

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd abes-admission-portal
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory (see Configuration section)

4. Start the development server:
   ```bash
   npm run dev
   ```

## Configuration

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password
   - Enable Google Sign-in
4. Create a Firestore database:
   - Go to Firestore Database
   - Create database in production mode
   - Choose a location closest to your users
5. Enable Storage:
   - Go to Storage
   - Initialize storage
   - Choose a location closest to your users

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

To get these values:
1. Go to Firebase Console > Project Settings
2. Scroll down to "Your apps"
3. Click the web icon (</>)
4. Register your app
5. Copy the configuration values

## Database Structure

The application uses the following Firestore collections:

### Users Collection
```typescript
interface User {
  uid: string;
  displayName: string;
  email: string;
  role: 'student' | 'admin';
  createdAt: timestamp;
  applicationStatus: 'incomplete' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  personalInfo?: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  academicInfo?: {
    highSchool: {
      board: string;
      school: string;
      percentage: number;
      yearOfPassing: number;
    };
    intermediate: {
      board: string;
      school: string;
      percentage: number;
      yearOfPassing: number;
    };
    entranceExam: {
      examName: string;
      rollNumber: string;
      rank: number;
      score: number;
      yearOfExam: number;
    };
    preferredBranch: string;
  };
  documents?: {
    photo: string;
    highSchoolCertificate: string;
    intermediateCertificate: string;
    entranceExamResult: string;
  };
}
```

## Authentication

The application supports two authentication methods:
1. Email/Password
2. Google Sign-in

To modify authentication providers:
1. Go to `src/contexts/AuthContext.tsx`
2. Add/remove authentication methods in the provider functions

## User Roles

The application has two user roles:
1. Student (default)
2. Admin

To create an admin user:
1. Register a regular user through the application
2. Go to Firebase Console > Firestore
3. Find the user document in the "users" collection
4. Edit the document and change the "role" field to "admin"

## File Storage

Document uploads are handled in Firebase Storage with the following structure:

```
/photos/{userId}/{fileName}
/highSchoolCertificates/{userId}/{fileName}
/intermediateCertificates/{userId}/{fileName}
/entranceExamResults/{userId}/{fileName}
```

To modify storage rules or structure:
1. Go to Firebase Console > Storage > Rules
2. Update the rules as needed (see Security Rules section)

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

### Key Files and Their Purpose

- `src/contexts/AuthContext.tsx` - Authentication logic and user context
- `src/firebase/config.ts` - Firebase configuration
- `src/pages/` - All application pages
- `src/components/` - Reusable components
- `src/hooks/` - Custom React hooks

## Security Rules

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null;
    }
    match /users/{userId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /photos/{userId}/{fileName} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /highSchoolCertificates/{userId}/{fileName} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /intermediateCertificates/{userId}/{fileName} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /entranceExamResults/{userId}/{fileName} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /{allPaths=**} {
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **Firebase Configuration**
   - Error: "Firebase app not initialized"
   - Solution: Check if all environment variables are correctly set in `.env`

2. **Authentication Issues**
   - Error: "Google sign-in not working"
   - Solution: Ensure Google Sign-in is enabled in Firebase Console and the correct OAuth origins are set

3. **File Upload Issues**
   - Error: "Failed to upload file"
   - Solution: Check Storage rules and ensure the user has proper permissions

4. **Admin Access**
   - Issue: Can't access admin panel
   - Solution: Verify user's role is set to "admin" in Firestore

### Getting Help

For issues not covered here:
1. Check Firebase documentation
2. Review Firebase Console logs
3. Check browser console for errors
4. Ensure all environment variables are correctly set

## License

This project is licensed under the MIT License.#   a u t o a d m i n  
 