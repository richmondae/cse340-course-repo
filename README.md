# CSE 340 Service Network

A small Express and EJS site for community service projects, partner organizations, and project categories.

## Run locally

1. Install Node.js and run `npm install`.
2. Copy `.env.example` to `.env` and set `DB_URL` to the PostgreSQL database's External Database URL.
3. Run `npm run dev` and open `http://localhost:3000`.

The app uses Express routes, controllers, database models, EJS views, session-based flash messages, and server-side form validation. It includes create and edit forms for organizations, projects, and categories, plus a page for assigning categories to projects. Users can register and log in with bcrypt-hashed passwords. Admin-only routes are protected by role middleware. Static CSS and images are served from `public/`. In development, `/test-error` can be used to view the custom 500 page.

## Deploy to Render

The Render web service builds with `npm install` and starts with `npm start`. Set `DB_URL` in the service's environment to the PostgreSQL database's Internal Database URL, and set `SESSION_SECRET` to a long random value. Keep database credentials and session secrets out of GitHub.

## Week 2 database setup

Run `src/setup.sql` against the PostgreSQL database to create and seed the organization, project, and category tables, including the project-category junction table, as well as the `roles` and `users` tables. Locally, use the External Database URL in `.env`; on Render, use the Internal Database URL in the web service settings. `.env` is ignored by Git and must never be committed.

## Week 5 authentication setup

Register the required admin testing account through `/register` so its password is hashed by the application. Then, in PostgreSQL, grant it the admin role with:

```sql
UPDATE public.users
SET role_id = (SELECT role_id FROM public.roles WHERE role_name = 'admin')
WHERE email = 'admin@example.com';
```

The users table never stores plain-text passwords. Only admins can view `/users` or use the organization, project, and category management routes.

## Re-creating the Render database

When replacing an expiring Render database, create the new PostgreSQL instance, run `src/setup.sql` against it, and update `DB_URL` both in local `.env` and the Render web service's environment settings. Use the database's External URL locally and Internal URL in the Render service. Keep the old database until the new database and app have been verified, then remove it if it is no longer needed.
