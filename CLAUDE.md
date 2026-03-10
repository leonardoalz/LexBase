# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server on localhost:3000
npm run build    # Production build (TypeScript check included)
npm run lint     # ESLint
npm run start    # Start production server
```

There are no tests in this project.

## Architecture Overview

**ImigraFlow** is a B2B SaaS for Portuguese immigration law offices. Lawyers manage cases (processos) in the dashboard; clients track progress through a public portal (no login required).

### Route Groups

- `(auth)/` — login + register pages (public)
- `(dashboard)/` — protected area for lawyers; `layout.tsx` checks Supabase auth and fetches `escritorios` record, redirects otherwise
- `portal/[token]/` — public client portal, no auth; fetches data via `get_portal_data(token)` Supabase RPC (`security definer`)
- `api/` — file upload, signed download URLs, email notifications, office change requests
 
### Data Flow Pattern

Pages in `(dashboard)/` are **Server Components** that fetch data and pass it to `*Client.tsx` Client Components. The split is:
- `page.tsx` (server) → fetches Supabase data → passes as props
- `*Client.tsx` (client) → all interactivity, forms, modals

### Supabase Client Usage

**Critical**: Do NOT use `createBrowserClient<Database>` or `createServerClient<Database>` — the generic parameter causes `Schema = never` in supabase-js v2.98+. Always use untyped clients and cast results explicitly:

```ts
const { data } = await supabase.from('processos').select('*')
const processos = data as Processo[]
```

Three client factories:
- `src/lib/supabase/client.ts` — browser (used in Client Components)
- `src/lib/supabase/server.ts` — `createClient()` (user auth, anon key) and `createServiceClient()` (bypasses RLS, used in API routes)
- Middleware auth refresh runs via `@supabase/ssr`

### Domain Types

All types are in `src/types/database.ts`:
- **Domain types**: `Escritorio`, `Cliente`, `Processo`, `Documento`, `Evento`, `Alerta`, `Funcionario`, `TipoProcesso`
- **Extended types**: `ProcessoComCliente`, `ClienteComProcessos` (join results)
- **Portal types**: `PortalData`, `PortalProcesso` (RPC return shapes)
- `Database` type with `__InternalSupabase: { PostgrestVersion: '12' }` marker (required for supabase-js v2.98+)

### Key Business Logic

**Prioridade** (`escritorio` | `cliente` | `orgao_externo`) acts as a "ball in court" indicator — when a client uploads a document, it flips back to `escritorio`.

**Processo status**: `ativo` | `concluido` | `cancelado` | `suspenso` | `indeferido`

**Document flow**: documents start `pendente`, become `recebido` on upload, then `aprovado`/`rejeitado` by the lawyer.

**referencia_interna**: auto-generated as `YYYY/NNN` (sequential per office per year), readonly after creation.

### File Upload

`POST /api/upload` — accepts multipart form data, validates MIME type and size (15MB max), uploads to Supabase Storage bucket `documentos` at path `documentos/{escritorio_id}/{processo_id}/{documento_id}/{timestamp}.{ext}`. Client uploads require matching `portal_token`.

### Email

`src/lib/email/templates.ts` — 7 templates via Resend. FROM address: `ImigraFlow <noreply@imigraflow.pt>` (needs verified Resend domain). Office setting changes go through `POST /api/change-request` (sends email to `ADMIN_EMAIL`) instead of direct DB writes.

### UI Conventions

- `cn()` from `src/lib/utils.ts` for conditional Tailwind classes
- `useToast()` hook from `src/components/ui/Toast.tsx` (Radix Toast) for feedback
- Forms: Zod + react-hook-form with `@hookform/resolvers`
- Animated collapsible search bars: `transition-all duration-300`, toggling `w-8 border-transparent` ↔ `w-56 border-gray-300`
- All dates formatted in `pt-PT` locale via `formatDate` / `formatDateTime` from utils

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAIL=
```
