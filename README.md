# Co~Learn

A real-time video conferencing platform for facilitated learning sessions. Co~Learn combines session booking, live video calls, persistent chat, and a an English Learner's dictionary.


# Features

## Session Management

- Book and manage video sessions with participant limits
- Create one-time or recurring sessions (weekly, biweekly, monthly)
- Real-time session availability updates

## Video Conferencing

- Live video calls
- Background blur toggle
- Responsive layout for desktop and mobile

## Real-Time Collaboration

- Live chat with message history
- Presence system showing active participants
- Chat messages persist in database for continuity
- Integrated dictionary for quick reference

## User Roles

- Facilitators create and manage sessions
- Participants browse available sessions and join
- Role-based dashboards with relevant actions


# Tech Stack

- **Supabase**: Chosen for its all-in-one approach: PostgreSQL database with Row Level Security for data protection, built-in authentication eliminating custom auth logic, and real-time subscriptions for instant updates to bookings, chat messages, and presence status.
- **LiveKit**: Selected for production-grade video conferencing with excellent React support. Its component library provided a solid foundation while allowing customization of the UI.
- **NotificationAPI**: Integrated to handle transactional emails (session invitations, booking confirmations) without managing email infrastructure. Service provides reliable delivery and tracking while keeping the codebase focused on core features. Thanks, NotificationAPI team!
- **Next.js + React** – Built with Next.js for server-side rendering and API routes, ideal for authentication and secure token generation for LiveKit connections. React's component model allowed for clean separation between business logic and UI, making the codebase (somewhat?) maintainable as features grew.


# Pending stuff

1. Feature: Session invitation for signed up users;
2. Feature: Session invitation for guests;
3. UI polish for live sessions.
