# ImigraFlow

Plataforma B2B SaaS para escritórios de advocacia especializados em imigração portuguesa. Advogados gerem processos no dashboard; clientes acompanham o progresso através de um portal público sem necessidade de login.

## Stack

- **Framework:** Next.js 16 (App Router)
- **Banco de dados:** Supabase (PostgreSQL + Storage + Auth)
- **UI:** Tailwind CSS v4 + Radix UI
- **Formulários:** React Hook Form + Zod
- **Email:** Resend
- **Linguagem:** TypeScript

## Funcionalidades

- Dashboard protegido para advogados — gestão de clientes, processos e documentos
- Portal público por token — cliente acompanha seu processo sem criar conta
- Upload de documentos com validação de tipo e tamanho (máx. 15MB)
- Notificações por email automáticas
- Indicador "bola no campo" (prioridade: escritório / cliente / órgão externo)
- Referência interna auto-gerada por ano (`YYYY/NNN`)

## Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Variáveis de ambiente

Crie um arquivo `.env.local` na raiz com:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAIL=
```

### 3. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev      # Servidor de desenvolvimento (localhost:3000)
npm run build    # Build de produção (inclui verificação TypeScript)
npm run start    # Iniciar servidor de produção
npm run lint     # ESLint
```

## Estrutura de rotas

```
(auth)/          # Login e registro (público)
(dashboard)/     # Área protegida para advogados
portal/[token]/  # Portal do cliente (público, sem login)
api/             # Upload, download, emails, change requests
```
