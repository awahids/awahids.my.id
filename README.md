# awahids.my.id

Portfolio website and product-focused engineering playground for A Wahid Saphadi.

This repository contains a personal portfolio, AI-powered tools, automation workflows, and supporting backend/docs for a modern web product presence.

## Highlights

- Portfolio landing page with project showcase, experience, skills, and certificates
- AI Lab for architecture brief generation
- README generator for GitHub profile cards and stats
- PRD generator for product planning
- Cookie consent, privacy policy, and site metadata handling
- n8n workflow templates for event relay and alerts
- Supabase and backend integration setup

## Tech stack

- React 18
- Vite
- GSAP
- Three.js / React Three Fiber
- Supabase
- Lenis
- n8n
- ESLint and Husky

## Repository structure

```bash
.
├── api/
├── docs/
├── n8n/
├── plans/
├── public/
├── src/
├── supabase/
├── tools/
├── .env.example
├── .gitignore
├── HERMES_SETUP.md
├── README.md
├── SUPABASE.md
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── vercel.json
├── vite.config.js
└── .claude/
```

## Main sections

### Portfolio site
The main site includes biography, project portfolio, technical skills, experience, certificates, contact form, and social links.

### AI Lab
A tool for generating architecture briefs and planning documentation for product and web applications.

### README Generator
Generates GitHub-style profile README sections, including stats cards, streak data, language breakdowns, activity visuals, and dynamic UI blocks.

### PRD Generator
Generates a structured product requirement document and action-oriented build checklist for new ideas or product work.

### Automation and workflows
The repository includes n8n templates for webhook-based event relays, logging sinks, and alerting flows.

## Local setup

1. Clone the repository:

```bash
git clone https://github.com/awahids/awahids.my.id.git
cd awahids.my.id
```

2. Install dependencies:

```bash
npm install
```

3. Copy environment variables if needed:

```bash
cp .env.example .env
```

4. Run the app locally:

```bash
npm run dev
```

5. Build for production:

```bash
npm run build
```

## Scripts

```bash
npm run dev        # start Vite dev server
npm run build      # production build
npm run lint       # lint project
npm run test       # run Node tests
npm run check      # lint + build
npm run preview    # preview production build
```

## Documentation

- `HERMES_SETUP.md` — setup notes and local/integration configuration
- `SUPABASE.md` — Supabase guide
- `n8n/README.md` — n8n workflow documentation
- `plans/README.md` — planning and audit notes

## Deployment

This project is intended for deployment with Vercel, and includes a `vercel.json` configuration.

## Links

- Website: https://awahids.my.id
- GitHub: https://github.com/awahids/awahids.my.id

## Notes

This repository blends portfolio work, AI tooling, productivity utilities, and operational automation into a single product-focused codebase.
