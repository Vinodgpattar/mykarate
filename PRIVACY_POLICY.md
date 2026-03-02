# Privacy Policy for Karate Mobile App

Last updated: 2026-03-02

This Privacy Policy explains how the **Karate** mobile application (“App”, “we”, “us”, or “our”) collects, uses, and protects your information.

The App is used by karate dojos and students to manage classes, attendance, fees, notifications, and related dojo activities.

---

## 1. Information We Collect

We collect the following types of information when you use the App. The actual data collected depends on your role (admin or student) and what your dojo chooses to store.

### 1.1 Account & Identity Information
- Name
- Email address
- Phone number (optional)
- Role (e.g., admin, student)

### 1.2 Student Profile Information
Stored to manage dojo membership and safety:
- Date of birth
- Gender
- Address
- Parent/guardian name and contact details
- Emergency contact details
- Current belt / grade
- Medical conditions or notes (if provided)

### 1.3 Documents & Media
If your dojo enables it, we may store:
- Student profile photo
- Identity document photos (e.g., Aadhar card in India)
- Public gallery photos and videos (for the dojo’s public page)
- Instructor photos and profile information

### 1.4 Usage & Activity Data
- Attendance records (present/absent/leave)
- Fee records and payment status (paid/pending/overdue)
- Belt grading history
- Notification delivery and read status

### 1.5 Device & Technical Data
Collected to operate the app and notifications:
- Device identifiers for push notifications (Expo push token)
- Operating system and app version

We **do not** collect your precise GPS location in this app. Branch locations are managed by admins as part of dojo configuration.

---

## 2. How We Use Your Information

We use the information described above to:

1. **Provide and operate the App**
   - Authenticate users and manage login sessions
   - Show the correct screens based on your role (admin or student)
   - Manage branches, students, classes, attendance, and fees

2. **Communicate with you**
   - Send important notifications from your dojo (announcements, fee reminders, events, attendance-related alerts, etc.)

3. **Maintain safety and records**
   - Keep basic health and emergency contact information to help instructors respond appropriately during classes
   - Maintain records of attendance, payments, and belt progress

4. **Improve reliability and security**
   - Monitor errors and performance issues
   - Detect and prevent abuse or unauthorized access

We do **not** sell your personal information.

---

## 3. Legal Basis (Where Applicable)

Depending on your region, we process your data under one or more of the following legal bases:

- **Contractual necessity**: to provide the App’s core functions to your dojo and its members.
- **Legitimate interests**: to maintain records, security, and reliable operation.
- **Consent**: for certain optional data (e.g., photos, notifications) where required.

Your dojo (the dojo owner/admin) may also be a data controller for the information they enter and manage.

---

## 4. How We Store and Protect Your Data

### 4.1 Storage

We use **Supabase** (a managed Postgres database and authentication service) to store:
- Profiles and roles
- Branches and students
- Attendance and fees
- Notifications and related metadata

Student and admin documents and media may be stored in **Supabase Storage** buckets.

### 4.2 Security

We take reasonable technical and organizational measures to protect your data, including:
- Encrypted connections (HTTPS/TLS) between the app and backend services
- Role-Based Access Control (RBAC) for admins/students
- Row Level Security (RLS) policies in the database
- Authentication tokens with secure session handling

However, no system is 100% secure. We cannot guarantee absolute security of your data.

---

## 5. Data Sharing

We may share your data with:

- **Your dojo administrators**: Admins can view and manage data related to their branches and students.
- **Service providers**: 
  - Supabase (database, authentication, storage)
  - Notification services (e.g., Expo push notification service and underlying FCM/APNs)
  - Email delivery services (if configured for password reset or communication)

We do **not** sell or rent your personal information to third parties.

We may disclose data if required by law, regulation, or valid legal request.

---

## 6. Data Retention

We keep your data for as long as it is needed to provide services to your dojo, or as required by law. 

Your dojo’s admins control when a student is deactivated or removed. When students or admins are deleted, related records may be retained for a period for:
- Accounting and fee history
- Legal or regulatory requirements
- Internal reporting and safety records

---

## 7. Your Rights

Depending on your region, you may have rights such as:
- Access: request a copy of your personal data.
- Correction: request corrections to inaccurate or incomplete data.
- Deletion: request deletion of your personal data (subject to dojo and legal requirements).
- Restriction or objection: in some cases, object to or limit processing.

If you are a student or parent and want to exercise these rights, please contact your dojo admin first. They can update or remove your data inside the system. You can also contact us using the details in the “Contact Us” section.

---

## 8. Children’s Privacy

This app is often used to manage **children and youth students** under the supervision of their parents/guardians and dojo admins.

- Student profiles (including children) are created and managed by dojo admins.
- Parents/guardians should contact the dojo admin to review, correct, or delete a child’s data.

If you believe we have collected children’s data in a way that is not compliant with your local laws, please contact us and we will review the situation.

---

## 9. International Data Transfers

Supabase infrastructure may be hosted in specific regions (e.g., EU/US). Depending on your location, data may be processed and stored in a different country than your own.

We rely on Supabase and our service providers to implement appropriate safeguards for international data transfers where required.

---

## 10. Changes to This Privacy Policy

We may update this Privacy Policy from time to time. When we do, we will update the “Last updated” date at the top of this page.

We encourage you to review this policy periodically to stay informed about how we are protecting your information.

---

## 11. Contact Us

If you have any questions about this Privacy Policy or how your data is handled, you can contact:

- **Dojo Administrator:** For questions about your specific account, profile, or student data.
- **App Support:** Replace this line with your preferred contact email or website (for example: `support@your-dojo-domain.com`).

Please include enough detail for us to understand and respond to your request.


