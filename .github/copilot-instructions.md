# Co-Learn AI Assistant Guidelines

## Project Overview

Co-Learn is a collaborative learning platform built with Next.js 15, featuring real-time video conferencing, session booking, and role-based user management. The app integrates Supabase for authentication/database, LiveKit for video conferencing, and uses a custom CSS design system.

## Key Architecture Patterns

### Role-Based System

- **Three user roles**: `admin`, `facilitator`, `participant`
- Role determined via `user_info` table linked to Supabase auth users
- Use `getUserWithRole()` for server-side role checking
- Role-specific components live in `(facilitator)` and `(participant)` folders

### Session Management Flow

1. **Facilitators** create sessions via `createSession()` server action with recurrence support
2. **Participants** book sessions via `bookSession()` server action with capacity limits
3. **Real-time updates** through custom hooks using Supabase subscriptions + polling fallbacks
4. **Video sessions** use LiveKit with tokens generated via `/api/livekit-token`

### Real-time Data Patterns

- All booking lists use real-time hooks: `useAvailableSessionsRealtime`, `useFacilitatorSessionsRealtime`, etc.
- Pattern: Supabase real-time subscriptions with polling fallbacks for reliability
- Always cleanup subscriptions and intervals in useEffect returns
- Handle both loading states and connection errors gracefully

## Development Workflows

### Database Operations

```bash
# All server actions are in booking/actions.ts
# Test with: npm run dev
# Database schema via Supabase dashboard
```

### Styling System

- **CSS custom properties** in `styles/variables.css` with light/dark themes
- **Responsive spacing** using fluid clamp() values (`--space-12-16px`)
- **Component styles** use CSS modules (`*.module.css`)
- **LiveKit overrides** in `styles/livekit-overrides.css` for video UI customization

### File Structure Conventions

- `(main)` route group for authenticated pages
- `(auth)` for login/signup flows
- `(facilitator)` and `(participant)` for role-specific components
- Server actions in `actions.ts`, types in `types/`, utilities in `utils/`

## Critical Integration Points

### Supabase Authentication

- Server client: `createClient()` from `utils/supabase/server.ts`
- Browser client: `createClient()` from `utils/supabase/client.ts`
- Middleware handles session refresh automatically
- User metadata stored in `user_info` table, not auth.users

### LiveKit Video Sessions

- Room codes generated as UUIDs in session creation
- Token creation requires `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET`
- Custom UI built on `@livekit/components-react` with extensive CSS overrides
- Chat and video controls integrated in session pages

### Type Safety

- Session types defined in `booking/types/sessions.ts`
- Database mapping functions: `mapRawSessionToSession()`, `mapRawSessionWithParticipants()`
- Always use typed server actions with FormData validation

## Common Patterns to Follow

### Error Handling

```typescript
// In server actions - use handleError() helper
const result = await someAction(formData);
if (result.error) return { error: result.error };
```

### Real-time Hook Structure

```typescript
// Pattern: state + loading + error + subscription + polling fallback
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
// ... subscription setup with polling fallback
```

### Component Organization

- Keep business logic in custom hooks
- Use CSS modules for styling
- Server actions for all database operations
- Real-time subscriptions for live data updates

## React Coding Principles

### Code Quality & Readability

- **Favor verbosity and readability** instead of briefness
- **Separate business logic from UI** - keep components focused on presentation
- **Name items clearly** - verbose is better than unreadable
- **Always name components** - avoid anonymous function components
- **Always destructure props** at the component level

### Component Design

- **Favor small components** over large monolithic ones
- **Don't hardcode repetitive markup** (4+ items) - use mapping or loops
- **Be careful with the number of passed props** - too many can mean the code is leaking
- **Pass objects instead of primitives** when grouping related data
- **Avoid spreading props** - be explicit about what gets passed down

### JSX & Conditional Logic

- **Avoid nested ternary operators** - use early returns or separate variables
- **Avoid long conditional chains** - break into smaller logical units
- **Avoid top-level conditionals in JSX** - handle them before the return statement
- **Avoid nested render functions** - extract to separate components instead

### useEffect Best Practices

- **Favor multiple smaller useEffect calls** to a single big one
- **Don't handle events in useEffect** - use event handlers directly
- **Avoid useEffect calls for computed data** - use useMemo or derived state
- **Use the rules of laziness** - only compute what's needed when needed
- **Use code splitting** for performance optimization

When working on this codebase, prioritize type safety, real-time data consistency, and the role-based access patterns established throughout the application.
