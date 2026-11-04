-- Organizations and their sample records from the Week 2 learning activity.
CREATE TABLE IF NOT EXISTS public.organization (
    organization_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    logo_filename VARCHAR(255) NOT NULL
);

WITH organization_seed (name, description, contact_email, logo_filename) AS (
    VALUES
        ('BrightFuture Builders', 'A nonprofit focused on improving community infrastructure through sustainable construction projects.', 'info@brightfuturebuilders.org', 'brightfuture-logo.svg'),
        ('GreenHarvest Growers', 'An urban farming collective promoting food sustainability and education in local neighborhoods.', 'contact@greenharvest.org', 'greenharvest-logo.svg'),
        ('UnityServe Volunteers', 'A volunteer coordination group supporting local charities and service initiatives.', 'hello@unityserve.org', 'unityserve-logo.svg')
)
INSERT INTO public.organization (name, description, contact_email, logo_filename)
SELECT seed.name, seed.description, seed.contact_email, seed.logo_filename
FROM organization_seed AS seed
WHERE NOT EXISTS (
    SELECT 1 FROM public.organization AS existing WHERE existing.name = seed.name
);

-- Keep existing learning-activity rows aligned with the image names in public/images.
UPDATE public.organization AS organization
SET description = seed.description,
    contact_email = seed.contact_email,
    logo_filename = seed.logo_filename
FROM (
    VALUES
        ('BrightFuture Builders', 'A nonprofit focused on improving community infrastructure through sustainable construction projects.', 'info@brightfuturebuilders.org', 'brightfuture-logo.svg'),
        ('GreenHarvest Growers', 'An urban farming collective promoting food sustainability and education in local neighborhoods.', 'contact@greenharvest.org', 'greenharvest-logo.svg'),
        ('UnityServe Volunteers', 'A volunteer coordination group supporting local charities and service initiatives.', 'hello@unityserve.org', 'unityserve-logo.svg')
) AS seed (name, description, contact_email, logo_filename)
WHERE organization.name = seed.name;

-- Each project is sponsored by exactly one organization.
CREATE TABLE IF NOT EXISTS public.project (
    project_id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(200) NOT NULL,
    project_date DATE NOT NULL,
    CONSTRAINT project_organization_fk
        FOREIGN KEY (organization_id)
        REFERENCES public.organization (organization_id)
        ON DELETE CASCADE,
    CONSTRAINT project_organization_title_unique UNIQUE (organization_id, title)
);

-- Five sample projects for each of the three partner organizations.
WITH sample_projects (organization_name, title, description, location, project_date) AS (
    VALUES
        ('BrightFuture Builders', 'Community Park Path Repair', 'Repair walking paths and improve access around the neighborhood park.', 'Civic Green Park', DATE '2026-11-14'),
        ('BrightFuture Builders', 'Community Center Painting', 'Prepare and repaint shared rooms at the local community center.', 'Eastside Community Center', DATE '2026-11-21'),
        ('BrightFuture Builders', 'Safe Crosswalk Build', 'Help install signs and paint a safer crossing near the library.', 'Maple Street Library', DATE '2026-11-28'),
        ('BrightFuture Builders', 'Playground Bench Project', 'Assemble and install benches beside the children''s play area.', 'Riverside Playground', DATE '2026-12-05'),
        ('BrightFuture Builders', 'Neighborhood Ramp Repair', 'Repair small ramps to improve access to neighborhood facilities.', 'Oakview Neighborhood', DATE '2026-12-12'),
        ('GreenHarvest Growers', 'School Garden Planting', 'Prepare garden beds and plant seasonal vegetables with students.', 'Lincoln Elementary School', DATE '2026-11-15'),
        ('GreenHarvest Growers', 'Urban Farm Harvest Day', 'Harvest produce and sort it for local food pantry partners.', 'GreenHarvest Urban Farm', DATE '2026-11-22'),
        ('GreenHarvest Growers', 'Composting Workshop', 'Set up compost bins and teach residents how to use them.', 'Westside Community Garden', DATE '2026-11-29'),
        ('GreenHarvest Growers', 'Seedling Care Morning', 'Water, label, and care for seedlings in the shared greenhouse.', 'Neighborhood Greenhouse', DATE '2026-12-06'),
        ('GreenHarvest Growers', 'Garden Bed Renewal', 'Refresh soil and build raised beds for the winter growing season.', 'Willow Lane Garden', DATE '2026-12-13'),
        ('UnityServe Volunteers', 'Community Food Drive', 'Collect, sort, and pack shelf-stable food for local families.', 'UnityServe Resource Center', DATE '2026-11-16'),
        ('UnityServe Volunteers', 'Senior Visit and Help Day', 'Visit older residents and help with simple household tasks.', 'Pinecrest Senior Center', DATE '2026-11-23'),
        ('UnityServe Volunteers', 'Neighborhood Cleanup', 'Pick up litter and sort recyclable materials along local streets.', 'Northside Neighborhood', DATE '2026-11-30'),
        ('UnityServe Volunteers', 'Winter Clothing Sort', 'Organize donated coats, shoes, and clothing for distribution.', 'UnityServe Resource Center', DATE '2026-12-07'),
        ('UnityServe Volunteers', 'Family Resource Fair', 'Help community groups welcome visitors and share service information.', 'Central Recreation Hall', DATE '2026-12-14')
)
INSERT INTO public.project (organization_id, title, description, location, project_date)
SELECT o.organization_id, s.title, s.description, s.location, s.project_date
FROM sample_projects AS s
INNER JOIN public.organization AS o ON o.name = s.organization_name
WHERE TRUE
AND NOT EXISTS (
    SELECT 1
    FROM public.project AS existing
    WHERE existing.organization_id = o.organization_id
      AND existing.title = s.title
);

-- Categories and the junction table create a many-to-many relationship:
-- a project can have several categories, and each category can cover many projects.
CREATE TABLE IF NOT EXISTS public.category (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.project_category (
    project_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    PRIMARY KEY (project_id, category_id),
    CONSTRAINT project_category_project_fk
        FOREIGN KEY (project_id)
        REFERENCES public.project (project_id)
        ON DELETE CASCADE,
    CONSTRAINT project_category_category_fk
        FOREIGN KEY (category_id)
        REFERENCES public.category (category_id)
        ON DELETE CASCADE
);

INSERT INTO public.category (name)
VALUES
    ('Environmental'),
    ('Educational'),
    ('Community Service'),
    ('Health and Wellness')
ON CONFLICT (name) DO NOTHING;

-- Associate every sample project with one or more relevant categories.
WITH project_categories (organization_name, project_title, category_name) AS (
    VALUES
        ('BrightFuture Builders', 'Community Park Path Repair', 'Environmental'),
        ('BrightFuture Builders', 'Community Park Path Repair', 'Community Service'),
        ('BrightFuture Builders', 'Community Center Painting', 'Community Service'),
        ('BrightFuture Builders', 'Safe Crosswalk Build', 'Community Service'),
        ('BrightFuture Builders', 'Playground Bench Project', 'Community Service'),
        ('BrightFuture Builders', 'Neighborhood Ramp Repair', 'Community Service'),
        ('BrightFuture Builders', 'Neighborhood Ramp Repair', 'Health and Wellness'),
        ('GreenHarvest Growers', 'School Garden Planting', 'Environmental'),
        ('GreenHarvest Growers', 'School Garden Planting', 'Educational'),
        ('GreenHarvest Growers', 'Urban Farm Harvest Day', 'Environmental'),
        ('GreenHarvest Growers', 'Urban Farm Harvest Day', 'Community Service'),
        ('GreenHarvest Growers', 'Composting Workshop', 'Environmental'),
        ('GreenHarvest Growers', 'Composting Workshop', 'Educational'),
        ('GreenHarvest Growers', 'Seedling Care Morning', 'Environmental'),
        ('GreenHarvest Growers', 'Seedling Care Morning', 'Educational'),
        ('GreenHarvest Growers', 'Garden Bed Renewal', 'Environmental'),
        ('UnityServe Volunteers', 'Community Food Drive', 'Community Service'),
        ('UnityServe Volunteers', 'Community Food Drive', 'Health and Wellness'),
        ('UnityServe Volunteers', 'Senior Visit and Help Day', 'Health and Wellness'),
        ('UnityServe Volunteers', 'Senior Visit and Help Day', 'Community Service'),
        ('UnityServe Volunteers', 'Neighborhood Cleanup', 'Environmental'),
        ('UnityServe Volunteers', 'Neighborhood Cleanup', 'Community Service'),
        ('UnityServe Volunteers', 'Winter Clothing Sort', 'Community Service'),
        ('UnityServe Volunteers', 'Winter Clothing Sort', 'Health and Wellness'),
        ('UnityServe Volunteers', 'Family Resource Fair', 'Educational'),
        ('UnityServe Volunteers', 'Family Resource Fair', 'Community Service')
)
INSERT INTO public.project_category (project_id, category_id)
SELECT p.project_id, c.category_id
FROM project_categories AS pc
INNER JOIN public.organization AS o ON o.name = pc.organization_name
INNER JOIN public.project AS p
    ON p.organization_id = o.organization_id
    AND p.title = pc.project_title
INNER JOIN public.category AS c ON c.name = pc.category_name
WHERE TRUE
ON CONFLICT (project_id, category_id) DO NOTHING;
