# Gemini 3 Newspaper Platform (White Label Edition)

## Architecture Overview: The Franchise Model

This platform is built on a **Strict Franchise Architecture**. It separates the roles of the **Platform Owner (You)** from the **Tenant (Newspaper Owner)**.

### 1. The Platform HQ (Super Admin)
Tools reserved for you, the factory owner. These agents exist to deploy and manage the business of selling newspapers.
*   **Cloning Engine:** Spins up new instances (Infrastructure as Code).
*   **Partner Agent:** Manages onboarding, billing, and global analytics.

### 2. The Tenant Instance (The Product)
When a client buys a newspaper, they receive a self-contained environment populated with their own **AI Staff**.
*   **Master Agent (Local):** The Editor-in-Chief. It enforces the specific tone, geography, and audience of that single newspaper.
*   **Journalist Agent:** Writes content based on the Local Master's directives.
*   **Editor Agent:** Quality assurance.
*   **SEO & Social Agents:** Marketing and growth.
*   **Automation Agent:** Scans local data sources defined by the tenant.

## Tech Stack
*   **Frontend:** React 18, Tailwind CSS, Lucide Icons
*   **AI Core:** Google Gemini 2.5 Flash (Text), Gemini 2.5 Flash Image (Visuals), Google Search Grounding
*   **Backend (Simulated in this repo):** Cloud Run, Firestore (NoSQL)

## Deployment
1.  **Platform Owner:** Deploys the Master codebase.
2.  **New Tenant:** The `Cloning Engine` copies the base Docker image, injects a new `TENANT_ID`, and provisions a new Firestore root collection.
3.  **Configuration:** The Tenant uses the "Platform Configuration" tab in their dashboard to set their City, Radius, and Tone, which instantly retrains their local AI staff.

## Demo Accounts (localStorage)

Default admin (full access):
- Username: `admin`
- Password: `admin123`

Pre-seeded demo users (all passwords: `demo123`):
- Business Owner — `demo-business` (`demo-business@example.com`)
- Editor in Chief — `demo-eic` (`demo-eic@example.com`)
- Editor — `demo-editor` (`demo-editor@example.com`)
- Content Contributor — `demo-contributor` (`demo-contributor@example.com`)
- Commenter — `demo-commenter` (`demo-commenter@example.com`)
- Reader — `demo-reader` (`demo-reader@example.com`)
- Guest (suspended) — `demo-guest` (`demo-guest@example.com`)
