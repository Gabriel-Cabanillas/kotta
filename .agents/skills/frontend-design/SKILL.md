---

name: frontend-design
description: Use this skill only when improving the visual design of Kotta frontend screens, landing pages, dashboards, onboarding flows, marketing pages, empty states, cards, tables, forms, and UI components. Focus on premium, trustworthy, modern SaaS aesthetics. Do not use this skill for authentication logic, Supabase policies, payment logic, database changes, backend logic, security-sensitive changes, or purely functional bug fixes.
license: Complete terms in LICENSE.txt
--------------------------------------

# Frontend Design Skill for Kotta

Create distinctive, production-grade frontend interfaces for Kotta.

Kotta is a SaaS platform for condominium administration and management. Its interface must feel like a real premium product that can be sold to condominium administrators, not like a generic AI-generated demo.

The design must feel:

* Premium
* Trustworthy
* Clean
* Professional
* Modern
* Calm
* Elegant
* Easy to understand
* Operationally useful

The goal is not to create artistic chaos. The goal is to make Kotta feel serious, reliable, clear, and visually refined.

---

## When to use this skill

Use this skill for frontend visual design work, including:

* Landing page improvements
* Marketing sections
* Dashboard polish
* Admin panels
* Resident screens
* Provider screens
* Guard screens
* Pricing sections
* Cards
* Tables
* Forms
* Empty states
* Onboarding screens
* Login and sign-up visual polish
* UI hierarchy
* Responsive design
* Microinteractions
* Visual consistency

Use this skill when the user asks for things like:

* “Improve the visual design.”
* “Make this screen look more premium.”
* “Refine this dashboard.”
* “Make the landing page feel more professional.”
* “Improve the empty state.”
* “Make this UI less generic.”
* “Make it feel like a real SaaS.”

---

## When not to use this skill

Do not use this skill for:

* Authentication logic
* Custom session logic
* Cookies
* User permissions
* Role validation
* Organization / coto access control
* Supabase RLS policies
* Database schema changes
* Prisma migrations
* Payment logic
* Stripe logic
* Webhooks
* Backend authorization
* Security-sensitive queries
* Purely functional bug fixes
* Refactors unrelated to UI quality

If a visual change requires touching sensitive logic, stop and explain the risk before modifying anything.

---

## Kotta design principles

### 1. Premium but usable

Kotta should look premium, but never confusing.

Prioritize clarity over decoration.

A condominium administrator should understand the screen quickly without needing technical knowledge.

---

### 2. Trustworthy and calm

Kotta handles payments, residents, access logs, tickets, providers, and operational workflows.

The interface should communicate order, reliability, and control.

Avoid chaotic colors, excessive visual noise, and dramatic animations.

---

### 3. SaaS, not school project

The UI should feel like a real SaaS product.

Use strong visual hierarchy, consistent spacing, clean cards, polished tables, refined forms, and intentional empty states.

Avoid default-looking components and generic layouts.

---

### 4. Role-aware design

Kotta has multiple roles:

* Superadmin
* Admin
* Vecino
* Proveedor
* Guardia

Design decisions should match each role:

* Admin screens should prioritize control, data, and management.
* Vecino screens should prioritize simplicity and clarity.
* Proveedor screens should prioritize assigned work and evidence.
* Guardia screens should prioritize speed, visibility, and operational clarity.
* Superadmin screens should prioritize overview and platform-level control.

---

### 5. Multi-coto clarity

Kotta supports multiple condominiums / organizations.

Screens should clearly show context when needed:

* Current coto
* Current user
* Current role
* Relevant operational area

Avoid ambiguity about where the user is working.

---

## Visual direction

Prefer:

* Clean SaaS layouts
* Soft but clear contrast
* Refined spacing
* Calm color palettes
* Strong typography hierarchy
* Clear primary actions
* Subtle shadows
* Clear borders
* Useful cards
* Scannable tables
* Helpful empty states
* Responsive layouts
* Purposeful motion

Avoid:

* Generic purple gradient AI app style
* Random glassmorphism
* Neon-heavy UI
* Excessive blur
* Overly futuristic interfaces
* Useless decoration
* Dense walls of text
* Overcomplicated layouts
* Animations that distract
* Visual changes that reduce accessibility

---

## Color and typography guidance

Keep Kotta visually consistent with its existing design language.

When improving UI:

* Reuse existing colors when possible.
* Do not introduce a completely new visual identity without being asked.
* Use contrast intentionally.
* Make important actions obvious.
* Use typography scale to guide the user.
* Do not use too many font sizes.
* Avoid visual clutter.

If adding new colors, justify why they are needed.

---

## Layout guidance

When improving layouts:

* Make the most important action visible.
* Group related information.
* Use whitespace intentionally.
* Align elements consistently.
* Make scanning easy.
* Prefer clear sections over decorative complexity.
* Keep mobile responsiveness in mind.
* Avoid layouts that only look good on desktop.

For dashboards:

* Prioritize metrics, actions, and recent activity.
* Use cards only when they help organize information.
* Avoid empty cards without purpose.
* Make tables readable and easy to scan.

For forms:

* Keep labels clear.
* Show required fields clearly.
* Keep actions close to the form.
* Use helpful error and empty states.
* Avoid unnecessary fields.

For empty states:

* Explain what is missing.
* Explain what the user can do next.
* Provide a clear action when relevant.
* Keep the tone professional.

---

## Motion guidance

Use motion only when it improves clarity or perceived quality.

Good uses:

* Subtle hover states
* Smooth reveal of important content
* Button feedback
* Loading states
* Small transitions that make UI feel polished

Avoid:

* Large animations
* Constant motion
* Distracting effects
* Animations that slow down task completion

---

## Accessibility and responsiveness

Always preserve or improve:

* Keyboard accessibility
* Readable contrast
* Focus states
* Semantic HTML when possible
* Responsive behavior
* Touch-friendly controls
* Clear visual hierarchy

Do not sacrifice usability for aesthetics.

---

## Technical rules

When using this skill:

* Preserve existing functionality.
* Do not change business logic.
* Do not modify authentication.
* Do not modify API authorization.
* Do not modify database queries unless explicitly asked.
* Do not change Prisma schema.
* Do not add dependencies unless clearly justified.
* Do not change routes.
* Do not rename files or components unless explicitly asked.
* Keep TypeScript valid.
* Keep the change focused on UI and visual quality.
* Touch only the files required for the visual task.

If the user only asked for visual refinement, do not change backend logic.

---

## Workflow

Before modifying a screen:

1. Identify the business purpose of the screen.
2. Identify the main user role.
3. Identify the primary action.
4. Identify what information must be easiest to understand.
5. Preserve the existing behavior.
6. Improve visual hierarchy, spacing, clarity, and polish.
7. Keep responsive design in mind.
8. Avoid unnecessary dependencies.
9. Explain the changes clearly.

---

## Output requirements

Before finishing, summarize:

* Visual direction chosen
* Files changed
* UI improvements made
* Functionality preserved
* Risks or assumptions
* Things to manually test

If no files should be changed, explain why.

---

## Example prompts

Good prompts for this skill:

* “Use the frontend-design skill to improve the visual quality of the admin dashboard without touching logic.”
* “Refine this Kotta screen so it feels like a premium SaaS.”
* “Improve the landing page pricing section while preserving functionality.”
* “Redesign the empty state for payments with a more professional SaaS feel.”
* “Improve the guard panel UI for clarity and speed without changing API behavior.”
* “Make this form easier to understand and more visually consistent.”

Bad use cases:

* “Fix authentication.”
* “Change Supabase policies.”
* “Modify Stripe logic.”
* “Update Prisma schema.”
* “Change API permissions.”
* “Refactor backend logic.”
