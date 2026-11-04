# CSE 340 Service Network

A small Express and EJS site for community service projects, partner organizations, and project categories.

## Run locally

1. Install Node.js.
2. Run `npm install`.
3. Run `npm start` and open `http://localhost:3000`.

The site includes Home, Organizations, Projects, and Categories pages. Static CSS and images are served from `public/`.

## Deploy to Render

The repository includes `render.yaml` for a Render web service. In Render, create a new Blueprint from this repository and deploy the `main` branch. Render will install dependencies with `npm install` and start the app with `npm start`.

## Week 2 database setup

Create a PostgreSQL database in the same Render region as the web service. Run `src/setup.sql` against that database to create and seed the organization, project, and category tables, including the project-category junction table. For local development, add the settings from `.env.example` to `.env` and set `DB_URL` to the database's External Database URL. In the Render web service settings, set `DB_URL` to the database's Internal Database URL and set `ENABLE_SQL_LOGGING` to `true` while debugging. Never commit `.env` or share the database URL publicly.
