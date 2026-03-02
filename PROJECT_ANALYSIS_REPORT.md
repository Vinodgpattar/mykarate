# Karate Dojo Mobile App - Complete Project Analysis Report

## Table of Contents
1. [Application Overview](#application-overview)
2. [All Features](#all-features)
3. [Project Structure](#project-structure)
4. [Frontend Components](#frontend-components)
5. [Backend Logic & API Calls](#backend-logic--api-calls)
6. [Database & Storage](#database--storage)
7. [Authentication System](#authentication-system)
8. [Key User Flows](#key-user-flows)
9. [Dependencies & Libraries](#dependencies--libraries)
10. [Where to Edit Things](#where-to-edit-things)
11. [Unused/Duplicate Code Analysis](#unusedduplicate-code-analysis)

---

## Application Overview

**Karate Dojo Management Mobile App** is a React Native mobile application built with Expo for managing a karate dojo. It supports multiple branches, student management, attendance tracking, fee management, notifications, and a public-facing website.

**Tech Stack:**
- React Native with Expo (~54.0.0)
- TypeScript
- Expo Router (file-based routing)
- Supabase (Authentication & Database)
- React Native Paper (Material Design UI)
- React Query (Data fetching)
- Prisma (Database ORM - schema defined)

**Platform:** iOS, Android, Web

---

## All Features

### 1. **Authentication & User Management**
**What it does:** Handles user login, logout, password reset, and role-based access control (Admin/Student).

**Files:**
- `src/app/(auth)/login.tsx` - Login screen
- `src/app/(auth)/forgot-password.tsx` - Password recovery
- `src/app/(auth)/reset-password.tsx` - Password reset
- `src/context/AuthContext.tsx` - Authentication state management
- `src/lib/profiles.ts` - User profile management
- `src/lib/password-reset.ts` - Password reset logic

**How it works:** Users log in with email/password. The app checks their role in the `profiles` table and routes them to admin or student dashboard.

---

### 2. **Admin Dashboard**
**What it does:** Main screen for admins showing statistics, quick actions, alerts, and recent activity.

**Files:**
- `src/app/(admin)/(tabs)/dashboard.tsx` - Main dashboard screen
- `src/components/admin/dashboard/` - Dashboard components:
  - `HeroWelcomeSection.tsx` - Welcome header with profile image
  - `OverviewStatsSection.tsx` - Statistics cards
  - `QuickActionsSection.tsx` - Quick action buttons
  - `AlertsSection.tsx` - Important alerts
  - `RecentBranchesSection.tsx` - Recent branches list
  - `AllFeaturesSection.tsx` - Feature grid
  - `QuickInsightsCard.tsx` - Insights widget
- `src/hooks/useAdminDashboard.ts` - Dashboard data fetching hook

**Features shown:**
- Total branches and active branches count
- Total students, active students, new students
- Pending leave informs count
- Quick access to all features
- Recent branches list

---

### 3. **Branch Management**
**What it does:** Allows admins to create, view, edit, and manage multiple dojo branches.

**Files:**
- `src/app/(admin)/(tabs)/branches.tsx` - List all branches
- `src/app/(admin)/(tabs)/create-branch.tsx` - Create new branch
- `src/app/(admin)/(tabs)/edit-branch.tsx` - Edit existing branch
- `src/lib/branches.ts` - Branch CRUD operations

**Features:**
- Create branches with name, code, address, phone, email
- Edit branch details
- View all branches with status (active/inactive)
- Assign branch admins
- Branch audit logging

---

### 4. **Student Management**
**What it does:** Complete student lifecycle management - create, view, edit, delete students.

**Files:**
- `src/app/(admin)/(tabs)/students.tsx` - List all students
- `src/app/(admin)/(tabs)/create-student.tsx` - Create new student
- `src/app/(admin)/(tabs)/edit-student.tsx` - Edit student details
- `src/app/(admin)/(tabs)/student-profile.tsx` - View student profile
- `src/lib/students.ts` - Student CRUD operations
- `src/components/shared/DeleteStudentDialog.tsx` - Delete confirmation

**Features:**
- Auto-generate student IDs (format: KSC24-0001)
- Student photo upload with compression
- Aadhar card upload
- Personal information (DOB, gender, address, etc.)
- Parent/guardian information
- Emergency contact details
- Medical conditions
- Current belt level
- Profile completion tracking

---

### 5. **Attendance System**
**What it does:** Track student attendance for classes with present/absent/leave status.

**Files:**
- `src/app/(admin)/(tabs)/mark-attendance.tsx` - Mark attendance screen
- `src/app/(student)/(tabs)/my-attendance.tsx` - Student view of attendance
- `src/lib/attendance.ts` - Attendance CRUD operations

**Features:**
- Mark attendance for specific dates
- Status: Present, Absent, Leave
- Attendance statistics (percentage, streak)
- View attendance history
- Date validation (up to 7 days future, max 1 year past)

---

### 6. **Fee Management System**
**What it does:** Manage student fees, payments, fee configurations, and payment records.

**Files:**
- `src/app/(admin)/(tabs)/fee-management.tsx` - Configure fee types and amounts
- `src/app/(admin)/(tabs)/student-fees.tsx` - View/manage fees for a student
- `src/app/(admin)/(tabs)/record-payment.tsx` - Record fee payments
- `src/app/(student)/(tabs)/my-fees.tsx` - Student view of their fees
- `src/lib/fees.ts` - Fee management logic

**Features:**
- Fee types: Registration, Monthly, Yearly, Grading (belt-specific)
- Configure fee amounts globally
- Auto-generate fees based on payment preference (monthly/yearly)
- Track fee status: Pending, Paid, Overdue
- Record payments with receipt numbers
- Payment method tracking
- Fee reminders and overdue notifications
- Fee period tracking (start/end dates)

---

### 7. **Belt Grading System**
**What it does:** Track student belt progression and associate grading fees.

**Files:**
- `src/app/(admin)/(tabs)/belt-grading.tsx` - Record belt grading
- `src/lib/belts.ts` - Belt management logic
- `src/lib/fees.ts` - Grading fee integration

**Features:**
- Record belt upgrades (from_belt → to_belt)
- Associate grading fees with belt changes
- Track grading dates
- View grading history

---

### 8. **Notification System**
**What it does:** Send notifications from admins to students with different types and targeting.

**Files:**
- `src/app/(admin)/(tabs)/notifications.tsx` - List all notifications
- `src/app/(admin)/(tabs)/create-notification.tsx` - Create new notification
- `src/app/(admin)/(tabs)/notification-details.tsx` - View notification details
- `src/app/(student)/(tabs)/notifications.tsx` - Student notifications list
- `src/app/(student)/(tabs)/notification-details.tsx` - Student view notification
- `src/lib/notifications.ts` - Notification CRUD
- `src/lib/admin-notifications.ts` - Admin notification logic
- `src/lib/student-notifications.ts` - Student notification logic
- `src/context/NotificationContext.tsx` - Push notification handling

**Features:**
- Notification types: Announcement, Alert, Reminder, Achievement, Event, Payment, Class, System
- Target: All students, specific branch, specific students
- Image attachments
- Scheduled notifications
- Read/unread tracking
- Push notifications support
- Auto-delete old notifications (configurable)

---

### 9. **Student Leave Inform System**
**What it does:** Students can inform admins about leave, and admins can approve/reject.

**Files:**
- `src/app/(student)/(tabs)/inform-leave.tsx` - Student leave list
- `src/app/(student)/(tabs)/create-leave-inform.tsx` - Create leave request
- `src/app/(admin)/(tabs)/student-informs.tsx` - Admin view all leave requests
- `src/app/(admin)/(tabs)/leave-inform-detail.tsx` - View/approve leave request
- `src/lib/student-leave-informs.ts` - Leave inform logic

**Features:**
- Students create leave requests with dates and reason
- Admins view pending leave requests
- Approve/reject leave requests
- Leave status tracking
- Pending count on admin dashboard

---

### 10. **Public Website**
**What it does:** Public-facing website showing dojo information, gallery, programs, locations.

**Files:**
- `src/app/(public)/index.tsx` - Public homepage
- `src/app/(public)/gallery.tsx` - Public gallery
- `src/app/(public)/programs.tsx` - Programs page
- `src/app/(public)/locations.tsx` - Branch locations
- `src/components/public/` - Public website components
- `src/lib/public/` - Public data services

**Features:**
- Hero section with instructor images
- Gallery with images and YouTube videos
- Programs information
- Branch locations with maps
- Instructor profiles
- Social media links
- Contact information

---

### 11. **Admin Profile Management**
**What it does:** Admins can manage their profile, upload photos, update information.

**Files:**
- `src/app/(admin)/(tabs)/admin-profile.tsx` - Admin profile screen
- `src/app/(admin)/(tabs)/account-settings.tsx` - Account settings
- `src/app/(admin)/(tabs)/assign-admin.tsx` - Assign admin to branch

**Features:**
- Update admin name, phone, address
- Upload profile image
- Qualifications and experience
- Specialization
- Assign branch admins

---

### 12. **Student Profile**
**What it does:** Students can view and complete their profile.

**Files:**
- `src/app/(student)/(tabs)/profile.tsx` - Student profile view
- `src/app/(student)/(tabs)/complete-profile.tsx` - Complete profile form
- `src/app/(student)/(tabs)/dashboard.tsx` - Student dashboard

**Features:**
- View profile information
- Complete missing profile fields
- Upload student photo
- Upload Aadhar card
- Update personal information

---

### 13. **Student Dashboard**
**What it does:** Main screen for students showing their stats, alerts, and quick actions.

**Files:**
- `src/app/(student)/(tabs)/dashboard.tsx` - Student dashboard
- `src/components/student/dashboard/` - Dashboard components
- `src/hooks/useStudentDashboard.ts` - Dashboard data hook

**Features:**
- Attendance percentage and streak
- Fee status (pending/overdue)
- Profile completion status
- Recent activity
- Notification banner
- Quick actions

---

### 14. **Public Gallery Management**
**What it does:** Admins can manage public gallery items (images and videos).

**Files:**
- `src/app/(admin)/(tabs)/public-gallery.tsx` - Gallery management
- `src/lib/public/services/galleryService.ts` - Gallery operations

**Features:**
- Upload images
- Add YouTube videos
- Delete gallery items
- Organize gallery items

---

### 15. **More/Settings Screen**
**What it does:** Additional admin features and settings.

**Files:**
- `src/app/(admin)/(tabs)/more.tsx` - More options screen

**Features:**
- Access to all features
- Public gallery management
- Storage monitoring
- Settings

---

## Project Structure

### Root Directory
```
karate-dojo-mobile/
├── src/                    # Source code
├── prisma/                 # Database schema and migrations
├── assets/                 # Images, icons
├── dist/                   # Build output
├── node_modules/           # Dependencies
├── app.json                # Expo configuration
├── package.json            # Dependencies list
├── tsconfig.json           # TypeScript config
├── babel.config.js         # Babel config
└── eas.json                # EAS Build config
```

### Source Directory (`src/`)
```
src/
├── app/                    # Expo Router pages (file-based routing)
│   ├── _layout.tsx         # Root layout (entry point)
│   ├── index.tsx           # Initial routing logic
│   ├── (auth)/             # Authentication routes
│   │   ├── login.tsx
│   │   ├── forgot-password.tsx
│   │   └── reset-password.tsx
│   ├── (admin)/            # Admin routes
│   │   └── (tabs)/         # Admin tab navigation
│   │       ├── dashboard.tsx
│   │       ├── branches.tsx
│   │       ├── students.tsx
│   │       ├── notifications.tsx
│   │       └── more.tsx
│   ├── (student)/          # Student routes
│   │   └── (tabs)/         # Student tab navigation
│   │       ├── dashboard.tsx
│   │       ├── my-attendance.tsx
│   │       ├── my-fees.tsx
│   │       └── inform-leave.tsx
│   └── (public)/           # Public website routes
│       ├── index.tsx
│       ├── gallery.tsx
│       ├── programs.tsx
│       └── locations.tsx
├── components/             # Reusable React components
│   ├── admin/              # Admin-specific components
│   ├── student/            # Student-specific components
│   ├── public/             # Public website components
│   └── shared/             # Shared components
├── context/                # React Context providers
│   ├── AuthContext.tsx     # Authentication state
│   └── NotificationContext.tsx  # Push notifications
├── hooks/                  # Custom React hooks
│   ├── useAdminDashboard.ts
│   └── useStudentDashboard.ts
└── lib/                    # Utility functions and services
    ├── supabase.ts         # Supabase client setup
    ├── students.ts         # Student operations
    ├── fees.ts             # Fee operations
    ├── attendance.ts       # Attendance operations
    ├── notifications.ts    # Notification operations
    ├── branches.ts         # Branch operations
    ├── profiles.ts         # User profile operations
    └── public/             # Public website services
```

### Entry Points

1. **`src/app/_layout.tsx`** - Root layout
   - Sets up providers (Auth, Notifications, React Query, Paper)
   - Configures error boundaries
   - Handles app updates
   - Entry point when app starts

2. **`src/app/index.tsx`** - Initial routing
   - Checks authentication status
   - Fetches user role from database
   - Routes to appropriate section:
     - No session → Public view
     - Admin role → Admin dashboard
     - Student role → Student dashboard

3. **`package.json`** - Main entry
   - `"main": "expo-router/entry"` - Expo Router entry point

---

## Frontend Components

### Component Organization

**Admin Components** (`src/components/admin/`)
- `AdminHeader.tsx` - Header with profile, notifications, logout
- `dashboard/` - Dashboard section components
  - `HeroWelcomeSection.tsx`
  - `OverviewStatsSection.tsx`
  - `QuickActionsSection.tsx`
  - `AlertsSection.tsx`
  - `RecentBranchesSection.tsx`
  - `AllFeaturesSection.tsx`
  - `QuickInsightsCard.tsx`
  - `SkeletonLoader.tsx`
  - `ErrorState.tsx`
  - `StorageMonitoringSection.tsx`

**Student Components** (`src/components/student/`)
- `StudentHeader.tsx` - Header with notifications, profile
- `dashboard/` - Student dashboard components
  - `HeroWelcomeSection.tsx`
  - `OverviewStatsSection.tsx`
  - `QuickActionsSection.tsx`
  - `AlertsSection.tsx`
  - `RecentActivitySection.tsx`
  - `QuickInsightsCard.tsx`
  - `NotificationBanner.tsx`
  - `SkeletonLoader.tsx`
  - `ErrorState.tsx`

**Public Components** (`src/components/public/`)
- `shared/PublicHeader.tsx` - Public website header
- `shared/MobileMenu.tsx` - Mobile navigation menu
- `sections/` - Page sections
  - `HeroSection.tsx`
  - `PradeepHeroSection.tsx`
  - `GallerySection.tsx`
  - `SlidableGallerySection.tsx`
  - `InstructorsSection.tsx`
  - `FeaturedInstructorsSection.tsx`
  - `ChiefInstructorSection.tsx`
  - `ProgramsSection.tsx`
  - `LocationsSection.tsx`
  - `AboutSection.tsx`
  - `BeltProgressionSection.tsx`
  - `PhilosophySection.tsx`
  - `TestimonialsSection.tsx`
  - `FAQSection.tsx`
  - `FooterSection.tsx`
- `LocationCard.tsx` - Branch location card
- `SocialLinksCard.tsx` - Social media links
- `ContactCard.tsx` - Contact information
- `YouTubePlayer.tsx` - YouTube video player
- `modals/InstructorDetailModal.tsx` - Instructor details modal
- `modals/MembershipBottomSheet.tsx` - Membership info modal

**Shared Components** (`src/components/shared/`)
- `ConfirmDialog.tsx` - Confirmation dialogs
- `DatePicker.tsx` - Date picker component
- `DeleteStudentDialog.tsx` - Delete student confirmation
- `ErrorBoundary.tsx` - Error boundary wrapper
- `ConfigErrorScreen.tsx` - Configuration error screen

### UI Library
- **React Native Paper** - Material Design components
- **Expo Vector Icons** - Icon library (MaterialCommunityIcons)
- **React Native Linear Gradient** - Gradient backgrounds

---

## Backend Logic & API Calls

### Backend Architecture
The app uses **Supabase** as the backend (BaaS - Backend as a Service). All API calls go through Supabase client.

### API Client Setup
**File:** `src/lib/supabase.ts`
- Creates Supabase client with AsyncStorage for session persistence
- Two clients:
  - `supabase` - Regular client (for authenticated users)
  - `supabaseAdmin` - Admin client with service role key (for admin operations)

### API Operations

**Student Operations** (`src/lib/students.ts`)
- `createStudent()` - Create new student
- `getAllStudents()` - Get all students
- `getStudentById()` - Get student by ID
- `updateStudent()` - Update student details
- `deleteStudent()` - Delete student
- `generateStudentId()` - Auto-generate student ID
- `uploadStudentPhoto()` - Upload student photo to Supabase Storage
- `uploadAadharCard()` - Upload Aadhar card

**Fee Operations** (`src/lib/fees.ts`)
- `getFeeConfiguration()` - Get fee configuration
- `setFeeConfiguration()` - Set fee amounts
- `getAllFeeConfigurations()` - Get all fee configs
- `createStudentFee()` - Create fee record
- `getStudentFees()` - Get student's fees
- `recordPayment()` - Record payment
- `getFeeStats()` - Get fee statistics

**Attendance Operations** (`src/lib/attendance.ts`)
- `createAttendanceRecord()` - Mark attendance
- `getStudentAttendance()` - Get student attendance
- `getAttendanceStats()` - Get attendance statistics
- `getAttendanceByDate()` - Get attendance for a date

**Notification Operations** (`src/lib/notifications.ts`)
- `createNotification()` - Create notification
- `getNotifications()` - Get notifications
- `markNotificationAsRead()` - Mark as read
- `getUnreadCount()` - Get unread count

**Branch Operations** (`src/lib/branches.ts`)
- `createBranch()` - Create branch
- `getAllBranches()` - Get all branches
- `updateBranch()` - Update branch
- `deleteBranch()` - Delete branch

**Profile Operations** (`src/lib/profiles.ts`)
- `getProfileByUserId()` - Get user profile
- `getAdminProfileByUserId()` - Get admin profile
- `updateAdminProfile()` - Update admin profile

### Data Fetching
- **React Query** (`@tanstack/react-query`) - Handles caching, refetching, loading states
- Custom hooks use React Query for data fetching
- Automatic cache invalidation on mutations

---

## Database & Storage

### Database: Supabase (PostgreSQL)

**Schema File:** `prisma/schema.prisma`

### Main Tables

1. **`profiles`** - User roles and admin information
   - `id`, `user_id`, `role` (super_admin/admin/student)
   - `name`, `email`, `phone`, `address`
   - `qualifications`, `experience`, `specialization`
   - `profile_image_url`
   - `branch_id` (for branch admins)

2. **`branches`** - Dojo branches
   - `id`, `name`, `code`, `address`, `phone`, `email`
   - `status` (active/inactive)
   - `created_by_id`

3. **`students`** - Student information
   - `id`, `student_id` (KSC24-0001 format)
   - `first_name`, `last_name`, `email`, `phone`
   - `branch_id`, `user_id`
   - Personal info: DOB, gender, address, Aadhar
   - Documents: `student_photo_url`, `aadhar_card_url`
   - `current_belt`
   - Parent/guardian info
   - Emergency contact
   - Medical conditions
   - `profile_completed`, `is_active`

4. **`fee_configurations`** - Fee type configurations
   - `fee_type` (registration/monthly/yearly/grading)
   - `belt_level` (for grading fees)
   - `amount`
   - `is_active`

5. **`student_fees`** - Individual fee records
   - `student_id`, `fee_type`, `amount`
   - `due_date`, `status` (pending/paid/overdue)
   - `paid_amount`, `paid_at`, `payment_method`
   - `receipt_number`, `notes`
   - `period_start_date`, `period_end_date`

6. **`belt_gradings`** - Belt progression records
   - `student_id`, `from_belt`, `to_belt`
   - `grading_date`
   - `fee_amount`, `student_fee_id`

7. **`attendance_records`** - Attendance tracking
   - `student_id`, `class_date`
   - `status` (present/absent/leave)
   - `marked_by`, `notes`

8. **`notifications`** - Admin notifications
   - `title`, `message`, `type`
   - `image_url`
   - `created_by`
   - `target_type` (all/branch/students)
   - `target_branch_id`, `target_student_ids`
   - `scheduled_at`, `sent_at`

9. **`notification_recipients`** - Notification delivery tracking
   - `notification_id`, `user_id`
   - `read`, `read_at`
   - `push_sent`, `push_sent_at`

10. **`student_leave_informs`** - Leave requests
    - `student_id`, `leave_date`, `reason`
    - `status` (pending/approved/rejected)
    - `approved_by`, `approved_at`

11. **`public_gallery_items`** - Public gallery
    - `title`, `description`
    - `image_url`, `video_url` (YouTube)
    - `media_type` (image/video)
    - `is_active`

12. **`instructors`** - Public instructor profiles
    - `name`, `title`, `image_url`
    - `bio`, `qualifications`
    - `specialization`, `experience`

### Storage: Supabase Storage Buckets

1. **`student-documents`** - Student photos and Aadhar cards
2. **`admin-profiles`** - Admin profile images
3. **`public-gallery`** - Public gallery images
4. **`instructor-images`** - Instructor photos

### Database Migrations
Located in `prisma/migrations/` - 25 migration files tracking schema evolution.

---

## Authentication System

### Authentication Flow

1. **Login** (`src/app/(auth)/login.tsx`)
   - User enters email/password
   - Calls `supabase.auth.signInWithPassword()`
   - Session stored in AsyncStorage

2. **Session Check** (`src/context/AuthContext.tsx`)
   - Checks for existing session on app start
   - Listens for auth state changes
   - Provides `session`, `user`, `signIn`, `signOut` to app

3. **Role-Based Routing** (`src/app/index.tsx`)
   - After login, fetches user profile from `profiles` table
   - Routes based on role:
     - `admin` or `super_admin` → Admin dashboard
     - `student` → Student dashboard
     - No profile → Login screen

4. **Password Reset**
   - `forgot-password.tsx` - Request reset token
   - `reset-password.tsx` - Reset with token
   - Uses `password_reset_tokens` table

### Roles
- **super_admin** - Full access, can create branches and admins
- **admin** - Branch admin, manages students and operations
- **student** - Student access, views own data

### Security
- Row Level Security (RLS) policies in Supabase
- Service role key for admin operations (server-side only)
- Session persistence with AsyncStorage
- Auto token refresh

---

## Key User Flows

### Flow 1: App Startup
1. App starts → `src/app/_layout.tsx` loads
2. Providers initialize (Auth, Notifications, React Query)
3. `src/app/index.tsx` checks authentication
4. If no session → Route to `/(public)` (public website)
5. If session exists → Fetch profile → Route to admin/student dashboard

### Flow 2: Admin Creates Student
1. Admin navigates: Dashboard → Students tab → Create Student
2. Fills form in `create-student.tsx`
3. Calls `createStudent()` from `src/lib/students.ts`
4. Student ID auto-generated (KSC24-0001)
5. Student record created in `students` table
6. If payment preference selected, fees auto-generated
7. Redirects to students list

### Flow 3: Admin Marks Attendance
1. Admin navigates: Dashboard → Quick Actions → Mark Attendance
2. `mark-attendance.tsx` loads
3. Selects date and students
4. Marks status (Present/Absent/Leave)
5. Calls `createAttendanceRecord()` from `src/lib/attendance.ts`
6. Record saved to `attendance_records` table
7. Student dashboard updates attendance stats

### Flow 4: Student Views Fees
1. Student navigates: Dashboard → Fees tab
2. `my-fees.tsx` loads
3. Calls `getStudentFees()` from `src/lib/fees.ts`
4. Fetches fees from `student_fees` table
5. Displays fees with status (Pending/Paid/Overdue)
6. Can view payment history

### Flow 5: Admin Sends Notification
1. Admin navigates: Notifications tab → Create Notification
2. `create-notification.tsx` loads
3. Fills title, message, type, target
4. Optionally uploads image
5. Calls `createNotification()` from `src/lib/notifications.ts`
6. Notification saved to `notifications` table
7. Recipients created in `notification_recipients` table
8. Push notifications sent (if enabled)
9. Students see notification in their dashboard

### Flow 6: Student Requests Leave
1. Student navigates: Leave tab → Create Leave Inform
2. `create-leave-inform.tsx` loads
3. Selects date and enters reason
4. Calls `createLeaveInform()` from `src/lib/student-leave-informs.ts`
5. Leave request saved to `student_leave_informs` table
6. Admin sees pending count on dashboard
7. Admin approves/rejects in `student-informs.tsx`

### Data Flow Pattern
1. **UI Component** → User interaction
2. **Screen/Page** → Calls function from `lib/`
3. **Lib Function** → Makes Supabase API call
4. **Supabase** → Executes query/storage operation
5. **Response** → Returns to lib function
6. **React Query** → Caches data
7. **UI Updates** → Component re-renders with new data

---

## Dependencies & Libraries

### Core Framework
- **expo** (~54.0.0) - Expo SDK, provides React Native tooling
- **react** (19.1.0) - React library
- **react-native** (0.81.5) - React Native framework

### Routing & Navigation
- **expo-router** (^6.0.14) - File-based routing system
- **react-native-screens** (~4.16.0) - Native screen components
- **react-native-safe-area-context** (~5.6.0) - Safe area handling
- **react-native-gesture-handler** (~2.28.0) - Gesture handling

### Backend & Database
- **@supabase/supabase-js** (^2.76.1) - Supabase client library
- **@react-native-async-storage/async-storage** (^2.2.0) - Local storage for sessions

### Data Fetching
- **@tanstack/react-query** (^5.90.7) - Data fetching, caching, synchronization

### UI Components
- **react-native-paper** (^5.12.0) - Material Design components
- **@expo/vector-icons** (^15.0.3) - Icon library
- **expo-linear-gradient** (~15.0.7) - Gradient backgrounds

### Image Handling
- **expo-image-picker** (~17.0.8) - Image picker from gallery/camera
- **expo-image-manipulator** (~14.0.7) - Image manipulation (resize, compress)
- **react-native-image-viewing** (^0.2.2) - Image viewer
- **react-native-view-shot** (^4.0.3) - Capture views as images

### Media & Content
- **react-native-youtube-iframe** (^2.4.1) - YouTube video player
- **react-native-webview** (13.15.0) - WebView component
- **react-native-qrcode-svg** (^6.3.20) - QR code generation

### Notifications
- **expo-notifications** (~0.32.13) - Push notifications

### Utilities
- **date-fns** (^4.1.0) - Date formatting and manipulation
- **zod** (^4.1.12) - Schema validation
- **expo-clipboard** (^8.0.7) - Clipboard operations
- **expo-sharing** (~14.0.7) - Share files/links
- **expo-file-system** (~19.0.19) - File system operations

### Development
- **expo-dev-client** (~6.0.18) - Development client
- **expo-updates** (^29.0.13) - Over-the-air updates
- **expo-constants** (~18.0.9) - App constants
- **expo-splash-screen** (~31.0.11) - Splash screen
- **expo-font** (~14.0.9) - Custom fonts
- **expo-linking** (^8.0.9) - Deep linking

### Form Components
- **@react-native-picker/picker** (2.11.1) - Picker/dropdown component

### Dev Dependencies
- **typescript** (^5.0.0) - TypeScript compiler
- **@types/react** (~19.1.10) - React TypeScript types
- **jest** (^29.7.0) - Testing framework
- **@testing-library/react-native** (^12.4.3) - React Native testing utilities
- **babel-preset-expo** (^54.0.7) - Babel preset for Expo
- **babel-plugin-module-resolver** (^5.0.2) - Path alias resolution
- **dotenv** (^17.2.3) - Environment variables

---

## Where to Edit Things

### If You Want to Change Text/Labels

**1. Screen Titles and Headers**
- Admin screens: `src/app/(admin)/(tabs)/[screen-name].tsx`
- Student screens: `src/app/(student)/(tabs)/[screen-name].tsx`
- Public screens: `src/app/(public)/[screen-name].tsx`
- Look for `<Text>` components or `title` props

**2. Button Labels**
- In the same screen files, look for `<Button>` components
- Example: `src/app/(admin)/(tabs)/create-student.tsx` has "Create Student" button

**3. Form Labels**
- In form screens, look for `<TextInput>` labels
- Example: `src/app/(admin)/(tabs)/create-student.tsx` has form field labels

**4. Dashboard Text**
- `src/components/admin/dashboard/` - Dashboard section components
- `src/components/student/dashboard/` - Student dashboard components

**5. Error Messages**
- `src/lib/` files contain error messages
- Example: `src/lib/students.ts` has validation error messages

**6. Notification Messages**
- `src/lib/notifications.ts` - Notification creation messages
- `src/lib/admin-notifications.ts` - Admin notification logic

**7. Public Website Text**
- `src/components/public/sections/` - All public website sections
- `src/app/(public)/index.tsx` - Homepage text

---

### If You Want to Change Design/UI

**1. Colors**
- `src/lib/design-system.ts` - Color constants (COLORS object)
- `src/lib/theme.ts` - React Native Paper theme
- Primary color: `#7B2CBF` (purple) - used throughout app

**2. Spacing & Layout**
- `src/lib/design-system.ts` - SPACING constants
- Screen files have `StyleSheet.create()` at bottom

**3. Component Styling**
- Each component file has styles at the bottom
- Look for `const styles = StyleSheet.create({...})`
- Modify colors, padding, margins, fonts

**4. Icons**
- Icons use `@expo/vector-icons` (MaterialCommunityIcons)
- Change icons in tab layouts: `src/app/(admin)/(tabs)/_layout.tsx`
- Change icons in components: Look for `<MaterialCommunityIcons>` tags

**5. Card/Button Styles**
- React Native Paper components use theme
- Modify theme in `src/lib/theme.ts`
- Or override styles in individual components

**6. Dashboard Layout**
- `src/components/admin/dashboard/` - Admin dashboard sections
- `src/components/student/dashboard/` - Student dashboard sections
- Reorder sections in `dashboard.tsx` files

**7. Public Website Design**
- `src/components/public/sections/` - All public sections
- Modify section components to change layout
- `src/components/public/shared/PublicHeader.tsx` - Header design

**8. Typography**
- React Native Paper `Text` component variants
- Modify in `src/lib/theme.ts` under `textVariants`

---

### If You Want to Change Logic or Features

**1. Student Management Logic**
- `src/lib/students.ts` - All student CRUD operations
- `generateStudentId()` - Change student ID format
- `createStudent()` - Modify student creation logic
- `updateStudent()` - Modify update logic

**2. Fee Management Logic**
- `src/lib/fees.ts` - All fee operations
- `getFeeConfiguration()` - Fee configuration logic
- `createStudentFee()` - Fee creation logic
- `recordPayment()` - Payment recording logic

**3. Attendance Logic**
- `src/lib/attendance.ts` - Attendance operations
- `createAttendanceRecord()` - Attendance marking logic
- `getAttendanceStats()` - Statistics calculation
- `validateAttendanceDate()` - Date validation rules

**4. Notification Logic**
- `src/lib/notifications.ts` - Notification CRUD
- `src/lib/admin-notifications.ts` - Admin notification logic
- `src/lib/student-notifications.ts` - Student notification logic
- `src/context/NotificationContext.tsx` - Push notification handling

**5. Authentication Logic**
- `src/context/AuthContext.tsx` - Auth state management
- `src/lib/profiles.ts` - Profile operations
- `src/app/index.tsx` - Routing logic based on role

**6. Data Fetching Logic**
- `src/hooks/useAdminDashboard.ts` - Admin dashboard data
- `src/hooks/useStudentDashboard.ts` - Student dashboard data
- Modify queries, add new data fetching

**7. Validation Rules**
- Form validation in screen files
- Look for validation functions in `src/lib/` files
- Example: `validateAttendanceDate()` in `attendance.ts`

**8. Business Rules**
- Fee calculation: `src/lib/fees.ts`
- Student ID generation: `src/lib/students.ts` → `generateStudentId()`
- Attendance statistics: `src/lib/attendance.ts` → `getAttendanceStats()`

**9. Add New Feature**
1. Create screen file in appropriate folder: `src/app/(admin)/(tabs)/` or `src/app/(student)/(tabs)/`
2. Create lib function in `src/lib/` for API calls
3. Add route in `_layout.tsx` if needed
4. Add navigation button/link in dashboard or menu

**10. Database Changes**
- Modify `prisma/schema.prisma`
- Create migration: `npx prisma migrate dev --name [migration-name]`
- Update TypeScript types in `src/lib/` files

---

## Unused/Duplicate Code Analysis

### Potential Unused Code

**1. Prisma Client**
- **Status:** Schema defined but Prisma client may not be actively used
- **Location:** `prisma/schema.prisma`
- **Note:** App uses Supabase client directly, not Prisma client. Schema is for reference/documentation.

**2. Sentry Integration**
- **Status:** Partially implemented
- **Location:** `src/lib/sentry.ts`
- **Note:** Referenced in `_layout.tsx` but may need Sentry account setup.

**3. Storage Monitoring**
- **Status:** Component exists but may not be fully used
- **Location:** `src/components/admin/dashboard/StorageMonitoringSection.tsx`
- **Note:** Check if displayed on dashboard.

**4. Test Files**
- **Status:** Testing setup exists but test files may be missing
- **Location:** `package.json` has jest config
- **Note:** No test files found in typical test directories.

### Potential Duplicate Code

**1. Dashboard Components**
- **Similarity:** Admin and Student dashboards have similar structure
- **Files:**
  - `src/components/admin/dashboard/HeroWelcomeSection.tsx`
  - `src/components/student/dashboard/HeroWelcomeSection.tsx`
- **Note:** Could be unified into shared component with props.

**2. Error State Components**
- **Similarity:** Similar error display logic
- **Files:**
  - `src/components/admin/dashboard/ErrorState.tsx`
  - `src/components/student/dashboard/ErrorState.tsx`
- **Note:** Could be shared component.

**3. Skeleton Loaders**
- **Similarity:** Similar loading states
- **Files:**
  - `src/components/admin/dashboard/SkeletonLoader.tsx`
  - `src/components/student/dashboard/SkeletonLoader.tsx`
- **Note:** Could be shared component.

**4. Notification Logic**
- **Similarity:** Some overlap between admin and student notification functions
- **Files:**
  - `src/lib/admin-notifications.ts`
  - `src/lib/student-notifications.ts`
- **Note:** Some functions could be consolidated.

**5. Profile Image Handling**
- **Similarity:** Similar image upload logic in multiple places
- **Files:**
  - `src/lib/students.ts` - Student photo upload
  - Admin profile image upload (likely in admin profile screen)
- **Note:** Could create shared image upload utility.

### Recommendations

1. **Create Shared Components**
   - Move duplicate dashboard components to `src/components/shared/`
   - Create `SharedErrorState.tsx`, `SharedSkeletonLoader.tsx`, `SharedHeroSection.tsx`

2. **Consolidate Image Upload**
   - Create `src/lib/image-upload.ts` with reusable image upload function
   - Use in student photo, admin profile, gallery uploads

3. **Unify Notification Logic**
   - Keep role-specific functions but extract common logic
   - Create `src/lib/notifications-core.ts` for shared functions

4. **Remove Unused Code**
   - If Sentry not used, remove `src/lib/sentry.ts` and references
   - If storage monitoring not displayed, remove component or implement it

5. **Add Tests**
   - Create test files for critical functions
   - Test student ID generation, fee calculations, attendance stats

---

## Summary

This is a comprehensive karate dojo management mobile application with:

- **3 User Roles:** Super Admin, Admin, Student
- **15+ Major Features:** Authentication, Branch Management, Student Management, Attendance, Fees, Notifications, Leave Management, Belt Grading, Public Website, and more
- **Modern Tech Stack:** React Native, Expo, TypeScript, Supabase
- **Well-Organized Structure:** Clear separation of concerns, reusable components, centralized API logic
- **Production Ready:** Error handling, loading states, offline support, OTA updates

The codebase follows React Native best practices with TypeScript for type safety, React Query for data management, and a clean component architecture.

---

**Report Generated:** 2025-01-28
**Project Version:** 1.0.6
**Last Updated:** Based on current codebase analysis


