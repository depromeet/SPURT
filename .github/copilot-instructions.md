# Copilot Instructions for SPURT

## Project Overview
SPURT is a task management app built with **Next.js 15 App Router** for procrastinators who wait until the last minute. The app uses a persona system with characters that guide users through task completion.

## Architecture

### Route Structure
- **App Router** with route groups:
  - `(auth)/` - Public authentication routes (login, OAuth callbacks)
  - `(protected)/` - Authenticated routes with `AuthProvider`
    - `(create)/` - Task creation flows (instant-create, scheduled-create)
    - `(root)/` - Home and main views
    - `action/`, `immersion/`, `retrospection/` - Task interaction flows
    - `my-page/` - User profile and settings
  - `api/` - API routes that proxy to backend (`NEXT_PUBLIC_API_URL`)

### Authentication Flow
1. OAuth callback routes (`/oauth/callback/kakao`, `/oauth/callback/apple`) handle social login
2. API routes set **httpOnly** cookies (`accessToken`, `refreshToken`, `user`) with `sameSite: "lax"` for iOS WebView compatibility
3. Middleware ([middleware.ts](middleware.ts)) redirects unauthenticated users to `/login` (except open paths)
4. `serverKy.ts` handles automatic token refresh on 401 responses

**Important**: Use `serverApi` from `src/lib/serverKy.ts` for all API calls (not client-side `ky.ts`):
- Automatic Bearer token injection from server-side cookies
- Token refresh on 401 with batch request optimization
- Proper headers and credentials
- All API routes proxy through `/api/*` endpoints using `serverApi`

### State Management
Uses **Zustand** stores (not Redux):
- `useAuthStore` - Auth loading states
- `useUserStore` - User profile data
- `useTaskStore` - Task state management

Access stores with hooks: `const { setUser } = useUserStore()`

### Data Fetching Patterns
1. **API routes**: All use `serverApi` from [serverKy.ts](src/lib/serverKy.ts) - has access to server-side cookies
2. **Client components**: Call `/api/*` routes via `fetch` (which internally use `serverApi`)
3. **React Query**: Configured in [providers.tsx](src/app/providers/providers.tsx) with 60s staleTime
4. **Task data transformation**: Always use `convertApiResponseToTask()` from [task.ts](src/types/task.ts) to convert API responses

### Multi-Step Forms
Uses `@use-funnel/browser` for form flows (NOT react-hook-form):
```typescript
const funnel = useFunnel<{ task: string, deadlineDate: string }>({
  id: "instant-create",
  initial: { step: "taskForm", context: { task: "", deadlineDate: "" } }
});

<funnel.Render
  taskForm={({ context }) => <TaskFormStep context={context} />}
  taskTypeInput={({ context }) => <TaskTypeStep />}
/>
```
See [instant-create/page.tsx](src/app/(protected)/(create)/instant-create/page.tsx) for reference.

## Code Style & Conventions

### Formatting
- Use **Biome** (not Prettier/ESLint alone) - `biome.json` config
- Tabs for indentation
- Double quotes for strings
- Korean comments are acceptable (team preference)

### Styling
- **Tailwind CSS** with custom design tokens in [tailwind.config.ts](tailwind.config.ts)
- Custom typography: `text-h1`, `text-t2`, `text-b3`, `text-c1` (header/title/body/caption scales)
- Custom colors: `bg-background-primary`, `text-text-normal`, `bg-component-accent-primary`
- Mobile-first (viewport locked): `maximum-scale=1.0, user-scalable=no`
- Use `background-primary` (not `bg-white`) for consistent theming

### Component Patterns
- Shadcn-style components in `src/components/ui/`
- Modular feature components in `src/components/` (BackHeader, DatePicker, Modal, etc.)
- Client components marked with `"use client"` directive
- Suspense boundaries for search params: wrap components using `useSearchParams()` in `<Suspense>`

### Type Safety
- Strict TypeScript enabled
- API response types in `src/types/` (task.ts, auth.ts, user.ts, subtask.ts)
- Task status types: `"pending" | "completed" | "reflected" | "procrastinating" | "inProgress"`
- Always transform API responses with typed converters

## Key Developer Workflows

### Local Development
```bash
npm run dev              # Start dev server
npm run build           # Production build
npm run lint            # Run Biome linter
npm run init:ssl        # Initialize SSL for local HTTPS
```

### FCM Push Notifications
- FCM tokens managed via `src/lib/fcmToken.ts`
- Device registration in `api/fcm-devices/`
- Firebase messaging worker: `public/firebase-messaging-sw.js`

### WebView Communication
- Use `useWebViewMessage` hook for native app bridge
- Haptic feedback types defined in `src/types/haptic.ts`

### Testing New Features
1. Check route group structure - auth vs protected
2. Verify middleware rules for new routes
3. Use service layer for API calls, not direct fetch
4. Transform API responses with type converters
5. Use Zustand stores for shared state

## Critical Files
- [middleware.ts](src/middleware.ts) - Route protection logic
- [serverKy.ts](src/lib/serverKy.ts) - Server-side API client with token refresh
- [taskService.ts](src/services/taskService.ts) - Task data layer (calls `/api/*` endpoints)
- [task.ts](src/types/task.ts) - Task type definitions & transformers
- [tailwind.config.ts](tailwind.config.ts) - Design system tokens

## Common Pitfalls
❌ Don't use client-side `ky.ts` - use `serverApi` from `serverKy.ts` in API routes  
❌ Don't forget to wrap `useSearchParams()` components in `<Suspense>`  
❌ Don't bypass API routes - always proxy through `/api/*` endpoints  
❌ Don't use generic color classes (`bg-white`) - use design tokens (`bg-background-primary`)  
❌ Don't forget to transform API task responses with `convertApiResponseToTask()`
