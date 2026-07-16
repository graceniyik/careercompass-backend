# CareerCompass AI — Backend

The backend API for CareerCompass AI, an AI-based career guidance and recommendation system for students. Built with NestJS, PostgreSQL (via Prisma), and Google's Gemini API.

**Live API:** https://career-compass-i8ga.onrender.com
**Live API Docs (Swagger):** https://career-compass-i8ga.onrender.com/api/docs

---

## Tech Stack

- **Framework:** NestJS (TypeScript)
- **Database:** PostgreSQL (hosted on Neon)
- **ORM:** Prisma
- **Authentication:** JWT (access + refresh tokens), bcrypt password hashing
- **AI:** Google Gemini API
- **Documentation:** Swagger / OpenAPI
- **Testing:** Jest (unit + e2e)

## Architecture

Built following Clean Architecture principles, with each business module organized into:
- **API layer** — controllers, DTOs, guards
- **Application layer** — business logic (scoring engines, AI orchestration)
- **Domain layer** — core entities and business rules
- **Infrastructure layer** — Prisma repositories, external API clients (Gemini)

Modules: Auth, Students, Assessments, Careers, Recommendations, Counselor Reviews, Admin.

## Getting Started Locally

### Prerequisites
- Node.js 20+
- A PostgreSQL database (e.g., a free [Neon](https://neon.tech) project)
- A [Google Gemini API key](https://aistudio.google.com) (free tier available)

### Setup

```bash
git clone https://github.com/graceniyik/careercompass-backend.git
cd careercompass-backend
npm install
```

Copy `.env.example` to `.env` and fill in your own values:

```bash
cp .env.example .env
```

Required environment variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (pooled, if using Neon) |
| `JWT_ACCESS_SECRET` | Random string, 20+ characters |
| `JWT_ACCESS_EXPIRES_IN` | e.g. `15m` |
| `JWT_REFRESH_SECRET` | Random string, different from access secret |
| `JWT_REFRESH_EXPIRES_IN` | e.g. `7d` |
| `GEMINI_API_KEY` | From Google AI Studio |
| `GEMINI_MODEL` | e.g. `gemini-2.5-flash` |
| `PORT` | e.g. `3000` |
| `NODE_ENV` | `development` or `production` |

### Run migrations and seed data

```bash
npx prisma migrate dev
npx prisma db seed
```

This creates the database schema and populates it with sample assessment questions, skills, and careers.

### Start the development server

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`, with Swagger docs at `http://localhost:3000/api/docs`.

## Testing

```bash
npm test           # unit tests
npm run test:e2e   # integration tests
```

## Deployment

Deployed on [Render](https://render.com) (free tier). Key configuration:

- **Build Command:** `npm install --include=dev && npx prisma generate && npm run build`
- **Start Command:** `npx prisma migrate deploy && npm run start:prod`

Note the `--include=dev` flag — required because Render sets `NODE_ENV=production`, which causes `npm install` to skip `devDependencies` (including the NestJS CLI needed to build) unless explicitly overridden.

## Key Design Decisions

- **Deterministic scoring, AI for explanation only:** career match scores are computed via a fixed formula (RIASEC vector similarity + skill overlap), never by the AI. The AI's role is limited to generating natural-language explanations and roadmaps based on the already-computed score.
- **Asynchronous AI generation:** recommendations are created and returned to the student immediately with a `PENDING` status; AI explanations are generated in the background and the frontend polls for updates.
- **Response caching:** AI responses are cached by a hash of the student's profile snapshot and career ID, avoiding redundant API calls for identical inputs.
- **Full AI call logging:** every AI request (including cache hits, retries, and failures) is logged for reproducibility and auditability.
