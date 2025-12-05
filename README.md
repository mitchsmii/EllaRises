# Ella Rises - Project Documentation

## 🔐 Test Login Credentials

**Manager Account:**
- Email: `mitch.smi45@gmail.com`
- Password: `temp123`
- Access: Full admin access (can maintain all data)

**Common User Account:**
- Email: `penelope.martinez4@studentmail.org`
- Password: `temp123`
- Access: View-only access (cannot edit/delete)

---

## ✅ Requirements Checklist

### 1. External Landing Page (9 points)
- **Location:** `/` (Home page)
- **Requirements:**
  - Professionalism (4 pts) - Visit homepage
  - Welcome page explaining Ella Rises objective (4 pts) - Check mission/overview section
  - Link to donations page (1 pt) - "Donate" button in header/footer/homepage → `/donate`

### 2. Login System (2 points)
- **Location:** `/login`
- **Requirement:** Login as either manager or common user (2 pts)
- **Test:** Login with both accounts to verify different access levels

### 3. Navigation Requirements (6 points)
All accessible from Dashboard (`/dashboard`) after login:
- **User Maintenance** (1 pt) - Manager only: Dashboard → "Manage Users" → `/admin/users`
- **Participants** (1 pt) - Dashboard → "Participants" → `/participants`
- **Events** (1 pt) - Dashboard → "My Events" or "Manage Events" → `/events` or `/admin/events/list`
- **Surveys** (1 pt) - Dashboard → "My Surveys" or "Surveys" → `/surveys`
- **Milestones** (1 pt) - Dashboard → "My Milestones" or "Manage Milestones" → `/milestones` or `/admin/milestones/list`
- **Donations** (1 pt) - Dashboard → "Donations" → `/donations` or `/admin/donations/list`

### 4. Visitor Donations (7 points)
- **Location:** `/donate` (no login required)
- **Requirements:**
  - Professionalism (4 pts) - Visit donation page
  - Add user information and donation (3 pts) - Fill form, submit donation

### 5. User Maintenance (11 points)
- **Location:** `/admin/users` (manager only)
- **Requirements:**
  - Professionalism (4 pts)
  - Can only access if logged in (2 pts)
  - Users displayed with search (1 pt)
  - CRUD operations - manager only (4 pts) - Add, Edit, Delete users

### 6. Participant Maintenance (18 points)
- **Location:** `/participants` (logged in)
- **Requirements:**
  - Professionalism (5 pts)
  - Can only access if logged in (2 pts)
  - Participants displayed with search (1 pt)
  - CRUD operations - manager only (5 pts) - Edit, Delete (Add via User Management)
  - Maintain milestones for participants (5 pts) - Dashboard → "Manage Milestones" → Search participant → Add/Edit/Delete milestones

### 7. Event Maintenance (11 points)
- **Public:** `/events` (no login)
- **Manager:** `/admin/events/list` (login required)
- **Requirements:**
  - Professionalism (4 pts)
  - Can access only if logged in (2 pts) - Manager view requires login
  - Events displayed with search (1 pt)
  - CRUD operations - manager only (4 pts) - Add, Edit, Delete events

### 8. Post Surveys Maintenance (11 points)
- **Location:** `/surveys` (login required)
- **Requirements:**
  - Professionalism (4 pts)
  - Can only access if logged in (2 pts)
  - Surveys displayed with search (1 pt)
  - CRUD operations - manager only (4 pts) - Add, Edit, Delete surveys, View responses

### 9. Milestones Maintenance (11 points)
- **User View:** `/milestones` (login required)
- **Manager View:** `/admin/milestones/list` (manager only)
- **Requirements:**
  - Professionalism (4 pts)
  - Can only access if logged in (2 pts)
  - Milestones displayed with search (1 pt)
  - CRUD operations - manager only (4 pts) - Add, Edit, Delete milestones per participant

### 10. Donations Maintenance (11 points)
- **Location:** `/admin/donations/list` (manager) or `/donations` (user)
- **Requirements:**
  - Professionalism (4 pts)
  - Can only access if logged in (2 pts)
  - Donations displayed with search (1 pt)
  - CRUD operations - manager only (4 pts) - Add, Edit, Delete donations

---

## 🗺️ Key Routes

**Public (No Login):**
- `/` - Home/Landing page
- `/about`, `/programs`, `/events`, `/media`, `/donate`, `/contact`

**User (Login Required):**
- `/dashboard` - User dashboard
- `/participants`, `/events`, `/surveys`, `/milestones`, `/donations` - View data

**Manager (Manager Login Required):**
- `/admin/users` - User management (CRUD)
- `/admin/events/list` - Event management (CRUD)
- `/admin/milestones/list` - Milestone management (CRUD)
- `/admin/surveys` - Survey management (CRUD)
- `/admin/donations/list` - Donation management (CRUD)
- `/admin/analytics` - Analytics dashboard

---

## 🔍 Quick Test Guide

1. **Landing Page:** Visit `/` → Check professionalism, mission statement, "Donate" button
2. **Login:** Test both manager and user accounts
3. **User Maintenance:** Manager → Dashboard → "Manage Users" → Test CRUD
4. **Participants:** Manager → Dashboard → "Participants" → Test search, edit, delete
5. **Events:** Public `/events` (view), Manager → "Manage Events" → Test CRUD
6. **Surveys:** Manager → Dashboard → "Surveys" → Test CRUD, view responses
7. **Milestones:** Manager → "Manage Milestones" → Search participant → Test CRUD
8. **Donations:** Public `/donate` (test form), Manager → "Donations" → Test CRUD
9. **Access Control:** Try manager pages as user → Should be restricted

---

**Tech Stack:** Node.js, Express, EJS, PostgreSQL, AWS Elastic Beanstalk  
**Project Team:** Team 4-09 | **Presentation:** Friday 2:25
