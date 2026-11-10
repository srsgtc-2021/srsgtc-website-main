-- ============================================================
-- SRS Geotech CMS — content seed / schema upgrade
-- Run once in Supabase Dashboard -> SQL Editor.
-- Inserts are guarded (team members / home feature row are not
-- duplicated), but the UPDATE statements reset the seeded labels
-- and descriptions for the original rows if the script is re-run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Home feature image (the "Marine investigation" photo)
-- ------------------------------------------------------------
create table if not exists public.home_images (
  id uuid primary key default gen_random_uuid(),
  slot_key text unique not null,
  label text,
  alt_text text,
  image_url text,
  sort_order integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.home_images enable row level security;

drop policy if exists "home_images public read" on public.home_images;
create policy "home_images public read" on public.home_images
  for select to anon, authenticated using (true);

drop policy if exists "home_images admin insert" on public.home_images;
create policy "home_images admin insert" on public.home_images
  for insert to authenticated with check (public.is_admin());

drop policy if exists "home_images admin update" on public.home_images;
create policy "home_images admin update" on public.home_images
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "home_images admin delete" on public.home_images;
create policy "home_images admin delete" on public.home_images
  for delete to authenticated using (public.is_admin());

insert into public.home_images (slot_key, label, alt_text, sort_order, is_active)
values ('home.fieldops', 'Marine investigation', 'Marine geotechnical drilling operation', 1, true)
on conflict (slot_key) do nothing;

update public.home_images set image_url = '/assets/offshore-survey.jpeg' where slot_key = 'home.fieldops';

-- ------------------------------------------------------------
-- 2. New content columns
-- ------------------------------------------------------------
alter table public.team_members add column if not exists experience text;
alter table public.services add column if not exists summary text;
alter table public.services add column if not exists body text;
alter table public.services add column if not exists icon text;
alter table public.projects add column if not exists year text;
alter table public.projects add column if not exists client text;
alter table public.projects add column if not exists body text;

-- ------------------------------------------------------------
-- 3. Team members (the 14 existing profiles)
-- ------------------------------------------------------------
insert into public.team_members (name, role, qualification, experience, sort_order, is_active)
select v.name, v.role, v.qualification, v.experience, v.sort_order, true
from (values
  ('Mr. Rajesh Singh', 'Geology', 'M.Sc. Geology', '30 Years', 1),
  ('Mr. Shankar Das', 'Site Supervision', 'Foreman', '20 Years', 2),
  ('Mr. Rajnish Kumar', 'Site Supervision', 'Sr. Supervisor', '15 Years', 3),
  ('Mrs. Ruby Singh', 'Accounts', 'Accountant', '10 Years', 4),
  ('Mr. Satish N Chavan', 'Civil Engineering', 'Diploma Civil', '8 Years', 5),
  ('Mr. Saransh Singh', 'Civil Engineering', 'B.E. Civil', '7 Years', 6),
  ('Mr. Akash Das', 'Site Supervision', 'Supervisor', '6 Years', 7),
  ('Mr. Sushant Singh', 'Geotechnical Engineering', 'M.Tech (Geotech)', '5 Years', 8),
  ('Mr. Abhijeet Biradar', 'Drafting', 'Draughtsman', '5 Years', 9),
  ('Mr. Amit Singh', 'Site Supervision', 'Sr. Supervisor', '4 Years', 10),
  ('Mr. Paramveer Yadav', 'Engineering', 'B.Tech', '3 Years', 11),
  ('Mr. Aman Kumar', 'Engineering', 'B.Tech', '3 Years', 12),
  ('Mr. Vishal', 'Structural Engineering', 'M.Tech (Structure)', '2 Years', 13),
  ('Mr. Ram', 'Site Supervision', 'Asst. Supervisor', '1 Year', 14)
) as v(name, role, qualification, experience, sort_order)
where not exists (
  select 1 from public.team_members t where t.name = v.name
);

-- ------------------------------------------------------------
-- 4. Services (title, summary, 3 paragraphs, icon)
--    label is used as the service title.
-- ------------------------------------------------------------
update public.services set
  label = 'Geotechnical investigation',
  summary = 'Land and marine soil investigation for informed foundation design.',
  icon = 'layers',
  body = $body$Our geotechnical investigation begins with reading the site before any rig reaches it. Soil boring from 100 mm to 150 mm diameter and rock drilling in PX, HX, NX, BX and EX sizes give us the strata, strength and groundwater picture that foundation design depends on.

From strong sandy overburden to weathered rock, each borehole is logged, sampled and photographed so the interpretation can be traced back to the ground. Marine and land rigs are deployed to the same brief — safe access, steady drilling, clean samples.

The result is not just a report; it is a ground model the design team can build on with confidence, long after the rigs have left.$body$
where slot_key = 'services.image.01';

update public.services set
  label = 'Topographical & hydrographical survey',
  summary = 'Land, river, coastal and project surveys for planning and execution.',
  icon = 'compass',
  body = $body$Topographical and hydrographic survey work starts with control. We set survey markers, run levels and contours, and tie river, coastal and project boundaries back to a single datum so plans, pipelines and dredging volumes all line up.

On land, that means highway, residential and commercial development surveys. In water, it covers river cross-sections, coastal bathymetry, and pre- and post-dredging surveys with siltation volume calculations.

Accurate levels and sections turn scattered field readings into a survey surface the rest of the project can be built from.$body$
where slot_key = 'services.image.02';

update public.services set
  label = 'Piling, micro piling & anchor drilling',
  summary = 'Foundation, retaining wall and ground-support applications.',
  icon = 'drill',
  body = $body$Piling, micro piling and anchor drilling solve the problems that shallow foundations cannot. Micro piling from 200 mm to 300 mm diameter, grouting and anchoring to specification, and foundation piles for retaining walls and ground support.

Each element is drilled to the specified depth and diameter, grouted and bonded, then tested against the behaviour the design assumed. Workmanship and bond are checked as we go, not assumed after.

The outcome is ground support that stays put — whether it is holding a wall, strengthening a raft, or carrying a new structure where soil alone would not.$body$
where slot_key = 'services.image.03';

update public.services set
  label = 'Grouting',
  summary = 'Grouting solutions for seepage control and foundation requirements.',
  icon = 'waves',
  body = $body$Grouting is quiet, precise work. By controlling mix, pressure and take, we solidify weak zones, cut seepage paths and improve the bearing capacity that foundations rely on, without disturbing the structure above.

Seepage control, foundation improvement and ground solidification are treated as one problem: the grout curtain must be continuous, the pressure controlled, and the verification visible in the records.

Done well, grouting leaves no trace at the surface — only stronger ground below it.$body$
where slot_key = 'services.image.04';

update public.services set
  label = 'Prestressed rock anchor',
  summary = 'Slope stabilisation and foundation raft protection against uplift.',
  icon = 'shield',
  body = $body$A prestressed rock anchor turns the rock mass itself into the foundation. Anchors are drilled, grouted and tensioned so slopes and rafts are held against movement and uplift, not just friction.

Slope stabilisation and foundation raft protection against uplift are two faces of the same principle: anchor the structure to competent rock and prove the bond with load testing.

It is a direct answer for ghat slopes, abutments and rafts that cannot afford to move.$body$
where slot_key = 'services.image.05';

update public.services set
  label = 'Laboratory testing',
  summary = 'Soil, rock and water testing to support geotechnical interpretation.',
  icon = 'microscope',
  body = $body$Laboratory testing closes the loop between field and design. Soil is tested for density, sieve analysis, Atterberg limits, CBR and shear; rock for strength, density, porosity and point load index; water for pH, sulphate, chlorides and turbidity.

These parameters are what the geotechnical interpretation is written from. Without them, the field observations would be descriptions, not design values.

Testing to a consistent standard is how a site you have never seen becomes a foundation you can sign for.$body$
where slot_key = 'services.image.06';

-- ------------------------------------------------------------
-- 5. Projects (year, title, client, description)
--    label is used as the project title.
-- ------------------------------------------------------------
update public.projects set
  label = 'Soil investigation & contour survey for proposed 400 kV GIS substation at Padghe',
  year = '2026',
  client = 'M.S.E.T.C.L.',
  body = $body$This assignment was carried out as part of the SRS Geotech & Construction company profile, with field investigation, survey and testing coordinated to the project brief. The site conditions, access and working season all shaped how the investigation was sequenced, so the ground answers could be tied back to the design drawings.

Representative photographs and test records from the work are held with the project documentation, and the findings were issued to the client and consultant for foundation and execution decisions.$body$
where slot_key = 'projects.card.01';

update public.projects set
  label = 'Nashik Ring Road — 4/6 lane with paved shoulder, Package II',
  year = '2026',
  client = 'V H Khatri Construction Pvt. Ltd.',
  body = $body$This assignment was carried out as part of the SRS Geotech & Construction company profile, with field investigation, survey and testing coordinated to the project brief. The site conditions, access and working season all shaped how the investigation was sequenced, so the ground answers could be tied back to the design drawings.

Representative photographs and test records from the work are held with the project documentation, and the findings were issued to the client and consultant for foundation and execution decisions.$body$
where slot_key = 'projects.card.02';

update public.projects set
  label = 'Geotechnical investigation for proposed industrial building at Ujjain, Madhya Pradesh',
  year = '2026',
  client = 'Alkem Laboratories Ltd.',
  body = $body$This assignment was carried out as part of the SRS Geotech & Construction company profile, with field investigation, survey and testing coordinated to the project brief. The site conditions, access and working season all shaped how the investigation was sequenced, so the ground answers could be tied back to the design drawings.

Representative photographs and test records from the work are held with the project documentation, and the findings were issued to the client and consultant for foundation and execution decisions.$body$
where slot_key = 'projects.card.03';

update public.projects set
  label = 'Geotechnical investigation work for proposed STP at Powai, Mumbai',
  year = '2026',
  client = 'East India Udyog Ltd.',
  body = $body$This assignment was carried out as part of the SRS Geotech & Construction company profile, with field investigation, survey and testing coordinated to the project brief. The site conditions, access and working season all shaped how the investigation was sequenced, so the ground answers could be tied back to the design drawings.

Representative photographs and test records from the work are held with the project documentation, and the findings were issued to the client and consultant for foundation and execution decisions.$body$
where slot_key = 'projects.card.04';

update public.projects set
  label = 'Mukane water supply scheme and new water treatment plant',
  year = '2025',
  client = 'Nashik Municipal Corporation',
  body = $body$This assignment was carried out as part of the SRS Geotech & Construction company profile, with field investigation, survey and testing coordinated to the project brief. The site conditions, access and working season all shaped how the investigation was sequenced, so the ground answers could be tied back to the design drawings.

Representative photographs and test records from the work are held with the project documentation, and the findings were issued to the client and consultant for foundation and execution decisions.$body$
where slot_key = 'projects.card.05';

update public.projects set
  label = 'Geotechnical investigation for proposed Vadhavan Port, Varor, Palghar',
  year = '2025',
  client = 'ITDC · Consultant: SGS Surveys Pvt. Ltd.',
  body = $body$This assignment was carried out as part of the SRS Geotech & Construction company profile, with field investigation, survey and testing coordinated to the project brief. The site conditions, access and working season all shaped how the investigation was sequenced, so the ground answers could be tied back to the design drawings.

Representative photographs and test records from the work are held with the project documentation, and the findings were issued to the client and consultant for foundation and execution decisions.$body$
where slot_key = 'projects.card.06';

update public.projects set
  label = 'Geotechnical investigation, topography and contour survey of Gangapur Dam',
  year = '2024',
  client = 'JWIL Infra Ltd.',
  body = $body$This assignment was carried out as part of the SRS Geotech & Construction company profile, with field investigation, survey and testing coordinated to the project brief. The site conditions, access and working season all shaped how the investigation was sequenced, so the ground answers could be tied back to the design drawings.

Representative photographs and test records from the work are held with the project documentation, and the findings were issued to the client and consultant for foundation and execution decisions.$body$
where slot_key = 'projects.card.07';

update public.projects set
  label = 'Coastal Road Project, Mumbai–Navi Mumbai at Ulwe section',
  year = '2024',
  client = 'J Kumar Infra Pvt. Ltd.',
  body = $body$This assignment was carried out as part of the SRS Geotech & Construction company profile, with field investigation, survey and testing coordinated to the project brief. The site conditions, access and working season all shaped how the investigation was sequenced, so the ground answers could be tied back to the design drawings.

Representative photographs and test records from the work are held with the project documentation, and the findings were issued to the client and consultant for foundation and execution decisions.$body$
where slot_key = 'projects.card.08';

update public.projects set
  label = 'GTI work for widening of Mangalore–Tumkuru section of NH 73',
  year = '2023',
  client = 'DP Jain & Co. Infrastructure Pvt. Ltd.',
  body = $body$This assignment was carried out as part of the SRS Geotech & Construction company profile, with field investigation, survey and testing coordinated to the project brief. The site conditions, access and working season all shaped how the investigation was sequenced, so the ground answers could be tied back to the design drawings.

Representative photographs and test records from the work are held with the project documentation, and the findings were issued to the client and consultant for foundation and execution decisions.$body$
where slot_key = 'projects.card.09';

update public.projects set
  label = 'Land and marine soil investigation for Chennai–Bengaluru Express Highway',
  year = '2021–22',
  client = 'DP Jain & Co. Infrastructure Pvt. Ltd.',
  body = $body$This assignment was carried out as part of the SRS Geotech & Construction company profile, with field investigation, survey and testing coordinated to the project brief. The site conditions, access and working season all shaped how the investigation was sequenced, so the ground answers could be tied back to the design drawings.

Representative photographs and test records from the work are held with the project documentation, and the findings were issued to the client and consultant for foundation and execution decisions.$body$
where slot_key = 'projects.card.10';

-- ------------------------------------------------------------
-- 6. Descriptive labels for existing image slots
-- ------------------------------------------------------------
update public.marquee_images set label = 'Offshore drilling platform', alt_text = 'Offshore drilling platform — marine soil investigation' where slot_key = 'home.marquee.01';
update public.marquee_images set label = 'Jack-up barge', alt_text = 'Jack-up barge for offshore geotechnical work' where slot_key = 'home.marquee.02';
update public.marquee_images set label = 'Marine pontoon', alt_text = 'Marine drilling pontoon' where slot_key = 'home.marquee.03';
update public.marquee_images set label = 'Hydraulic drilling rig', alt_text = 'Hydraulic drilling rig' where slot_key = 'home.marquee.04';
update public.marquee_images set label = 'Plate load test', alt_text = 'Plate load test in the field' where slot_key = 'home.marquee.05';
update public.marquee_images set label = 'Packer permeability test', alt_text = 'On-site packer permeability test' where slot_key = 'home.marquee.06';

update public.about_images set label = 'Proprietor — Mr. Rajesh Singh', alt_text = 'Proprietor Mr. Rajesh Singh, field operations' where slot_key = 'about.proprietor';
update public.about_images set label = 'Workforce / Technical Team', alt_text = 'Technical team on site' where slot_key = 'about.workforce';
update public.about_images set label = 'Marine operations — jack-up / pontoon / offshore platform', alt_text = 'Marine operations — jack-up barge, pontoon and offshore platform' where slot_key = 'about.equipment.hero';
update public.about_images set label = 'Rotary core & hydraulic drilling rigs', alt_text = 'Rotary core & hydraulic drilling rigs' where slot_key = 'about.equipment.item.1';
update public.about_images set label = 'SPT & soil sampling systems', alt_text = 'SPT & soil sampling systems' where slot_key = 'about.equipment.item.2';
update public.about_images set label = 'Laboratory testing — CBR / permeability / ERT', alt_text = 'Laboratory testing — CBR / permeability / ERT' where slot_key = 'about.equipment.item.3';
update public.about_images set label = 'Field testing — plate load / packer permeability', alt_text = 'Field testing — plate load / packer permeability' where slot_key = 'about.equipment.item.4';

update public.project_gallery set label = 'Field investigation', alt_text = 'Field investigation' where slot_key = 'projects.gallery.01';
update public.project_gallery set label = 'Drilling operations', alt_text = 'Drilling operations' where slot_key = 'projects.gallery.02';
update public.project_gallery set label = 'Micro piling', alt_text = 'Micro piling' where slot_key = 'projects.gallery.03';
update public.project_gallery set label = 'Rock core logging & sampling', alt_text = 'Rock core logging & sampling' where slot_key = 'projects.gallery.04';

-- ------------------------------------------------------------
-- 7. Seed the home page marquee images
--    image_url points at the public asset served by Vite.
-- ------------------------------------------------------------
update public.marquee_images set image_url = '/assets/page-13-01-offshore-drilling-platform.png' where slot_key = 'home.marquee.01';
update public.marquee_images set image_url = '/assets/page-13-02-jack-up-barge.png' where slot_key = 'home.marquee.02';
update public.marquee_images set image_url = '/assets/page-13-03-marine-drilling-pontoon.png' where slot_key = 'home.marquee.03';
update public.marquee_images set image_url = '/assets/page-13-04-hydraulic-drilling-rig.png' where slot_key = 'home.marquee.04';
update public.marquee_images set image_url = '/assets/page-13-05-plate-load-test.png' where slot_key = 'home.marquee.05';
update public.marquee_images set image_url = '/assets/page-13-06-packer-permeability-test.png' where slot_key = 'home.marquee.06';
