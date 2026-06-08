# AGENTS.md

## Project

Kotta is a SaaS platform for condominium administration and management.

It helps condominiums centralize daily operations such as residents, payments, fees, tickets, work orders, providers, access logs, reservations, assets, communication, and administrative workflows.

Kotta must feel like a real product that can be sold to condominium administrators, not like a generic school project or an AI-generated demo.

The product should feel:

* Premium
* Trustworthy
* Clean
* Professional
* Modern
* Easy to understand
* Operationally useful
* Serious enough for real clients

Avoid generic AI-looking interfaces, random decoration, excessive gradients, unnecessary animations, or visual decisions that reduce usability.

---

## Main stack

Kotta primarily uses:

* React
* Next.js
* TypeScript
* Prisma
* PostgreSQL / Supabase
* Vercel
* Resend
* Cloudinary
* Stripe
* Git
* GitHub

Kotta currently uses a custom authentication system created specifically for the project.

Do not reintroduce Clerk or assume Clerk is part of the current authentication flow.

---

## Core rules

When working on Kotta:

* Preserve existing functionality.
* Keep code clear, typed, and maintainable.
* Prefer small, focused changes.
* Do not install new dependencies unless clearly justified.
* Do not rename files, routes, components, variables, or database fields unless explicitly requested.
* Do not refactor large areas without explaining the risk first.
* Do not change business logic when the task is only visual or documentary.
* Do not touch unrelated files.
* Explain changes clearly because the project owner is still learning.
* When possible, summarize what changed, why it changed, and what should be tested manually.

---

## Sensitive areas

Be extremely careful with the following areas:

* Authentication
* Sessions
* Cookies
* User roles
* User permissions
* Organization / coto isolation
* Supabase configuration
* Database schema
* Prisma migrations
* Payment logic
* Stripe integration
* Webhooks
* Email verification
* Invitations
* Backend API authorization
* Queries that expose user, payment, or organization data

Do not modify these areas unless the user explicitly asks for it.

If a requested change touches any sensitive area, stop and explain:

1. What file or logic would be affected.
2. Why the change is sensitive.
3. What risk exists.
4. What safer approach is recommended.

---

## Authentication rules

Kotta uses a custom authentication system.

Do not assume external authentication providers.

Do not add Clerk.

Do not restore old Clerk logic.

Do not modify authentication, sessions, cookies, verification, invitations, or logout behavior unless explicitly requested.

When changing role-based pages or APIs, preserve the existing validation pattern:

* Check session.
* Check role.
* Check organization / coto ownership when applicable.
* Redirect or reject unauthorized access.

---

## Multi-role and multi-coto rules

Kotta is multi-role and multi-coto.

Main roles include:

* SUPERADMIN
* ADMIN
* VECINO
* PROVEEDOR
* GUARDIA

Each role must only access the screens and data that belong to that role.

Each coto / organization must only access its own data.

Do not leak data between organizations.

Do not hardcode a specific coto, organization, or user.

---

## Git workflow

Prefer this workflow:

1. Start from a clean `main`.
2. Create a focused branch.
3. Make the smallest safe change.
4. Review the diff.
5. Run build or TypeScript validation when relevant.
6. Commit with a clear message.
7. Push branch.
8. Create Pull Request.
9. Merge after review.
10. Pull latest `main`.

Use clear commit messages such as:

* `feat: agregar panel de guardia`
* `fix: agregar cierre de sesion en guardia`
* `docs: actualizar readme del proyecto`
* `chore: actualizar precio del plan mensual`
* `feat: actualizar planes de precios`

---

## When to use the frontend-design skill

Use the `frontend-design` skill only when the task is about visual frontend quality, such as:

* Landing pages
* Marketing sections
* Dashboards
* Cards
* Tables
* Forms
* Empty states
* Onboarding flows
* Login or sign-up visual polish
* UI layout improvements
* Responsive design improvements
* Visual hierarchy
* Microinteractions
* Premium SaaS look and feel

Do not use frontend-design for:

* Authentication logic
* Payment logic
* Stripe logic
* Supabase policies
* Database schema changes
* Prisma migrations
* Backend authorization
* API permission logic
* Security-sensitive logic
* Pure bug fixes that are not visual

When using frontend-design, preserve functionality and avoid changing business logic.

---

## Design direction for Kotta

Kotta should look like a premium SaaS for condominium administration.

The visual direction should be:

* Clean
* Serious
* Calm
* Modern
* Trustworthy
* Elegant
* Operational
* Easy to scan
* Easy to use

Avoid:

* Generic AI app aesthetics
* Overused purple gradients
* Random glassmorphism
* Excessive neon effects
* Dribbble-style layouts that hurt usability
* Decoration without purpose
* Animations that distract
* Overly futuristic UI
* Overdesigned components
* Inconsistent spacing or typography

The interface should help administrators, residents, providers, and guards complete real tasks quickly.

---

## Output expectations

Before finishing a task, summarize:

* Files changed
* What changed
* Why it changed
* Whether logic was modified
* What should be manually tested
* Any risks or assumptions

Keep explanations direct, practical, and easy to understand.
