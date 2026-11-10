# CSE 340 Service Network

A small Express and EJS site for community service projects, partner organizations, and project categories.

## Run locally

1. Install Node.js and run `npm install`.
2. Copy `.env.example` to `.env` and set `DB_URL` to the PostgreSQL database's External Database URL.
3. Run `npm run dev` and open `http://localhost:3000`.

The app uses Express routes, controllers, database models, and EJS views. It includes organization, project, and category detail pages. Static CSS and images are served from `public/`. In development, `/test-error` can be used to view the custom 500 page.

## Deploy to Render

The Render web service builds with `npm install` and starts with `npm start`. Set `DB_URL` in the service's environment to the PostgreSQL database's Internal Database URL. Keep database credentials out of GitHub.

## Week 2 database setup

Run `src/setup.sql` against the PostgreSQL database to create and seed the organization, project, and category tables, including the project-category junction table. Locally, use the External Database URL in `.env`; on Render, use the Internal Database URL in the web service settings. `.env` is ignored by Git and must never be committed.
