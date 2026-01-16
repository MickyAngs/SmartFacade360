-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (Extends Supabase Auth)
create table public.profiles (
  id uuid references auth.users not null primary key,
  username text,
  email text,
  role text default 'user' check (role in ('user', 'admin', 'agent')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- 2. Material Library Table (The Core Knowledge Base)
create table public.materials_library (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  thumbnail_url text, -- URL to image/texture
  hex_color text, -- Fallback color
  texture_config jsonb, -- { map: url, normalMap: url, roughness: 0.5, ... }
  thermal_conductivity decimal, -- W/mK
  price_per_m2 decimal, -- Estimated cost
  sustainability_score int check (sustainability_score between 0 and 100),
  
  -- Tech Transfer Requirement Fields
  co2_footprint decimal, -- kg CO2e/m2
  is_sustainable boolean default false,
  durability_years int,
  tech_transfer_summary text, -- Description for tech transfer context
  tech_specs jsonb, -- { "origin": "EU", "certification": "LEED" }

  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.materials_library enable row level security;

create policy "Materials are viewable by everyone."
  on materials_library for select
  using ( true );

create policy "Only admins can insert/update materials."
  on materials_library for all
  using ( auth.jwt() ->> 'role' = 'admin' ); -- Simplified check (requires custom claim or profile lookup)

-- 3. Building Models Table (User Saved Designs)
create table public.building_models (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  name text not null,
  storage_url text not null, -- Path to .glb in Supabase Storage
  preview_url text, -- Screenshot
  metadata jsonb, -- { "material_id": uuid, "accent_color": "#fff" }
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.building_models enable row level security;

create policy "Users can view their own models."
  on building_models for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own models."
  on building_models for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own models."
  on building_models for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own models."
  on building_models for delete
  using ( auth.uid() = user_id );


-- STORAGE POLICIES (Assuming bucket 'facade-models' exists)
-- This usually needs to be run in the Storage UI or via specialized SQL if the extension is enabled
-- insert into storage.buckets (id, name) values ('facade-models', 'facade-models');
-- create policy "Authenticated users can upload models" on storage.objects for insert with check ( bucket_id = 'facade-models' and auth.role() = 'authenticated' );
-- create policy "Users can view their own models" on storage.objects for select using ( bucket_id = 'facade-models' and auth.uid() = owner );


-- SEED DATA (Innovation Materials - TRL 5 High Fidelity)
insert into public.materials_library 
  (name, hex_color, sustainability_score, co2_footprint, is_sustainable, durability_years, thermal_conductivity, price_per_m2, tech_transfer_summary, tech_specs)
values 
  (
    'Madera Acetilada (Accoya Facades)', 
    '#D2B48C', 
    10, 
    -15.2, 
    true, 
    50,
    0.12,
    175.00,
    'Esta tecnología emplea un proceso químico no tóxico para modificar la estructura molecular de la celulosa en maderas de rápido crecimiento. El resultado es un material con estabilidad dimensional superior que sustituye de manera eficiente a las maderas tropicales y aluminios de alto consumo energético.',
    '{"origin": "Netherlands", "certification": "Cradle to Cradle Gold", "stability": "Class 1"}'
  ),
  (
    'Vidrio Fotovoltaico Transparente (BIPV - Onyx Solar)', 
    '#60A5FA', 
    9, 
    -12.0, 
    true, 
    30,
    1.1,
    450.00,
    'Integra silicio amorfo en vidrios arquitectónicos para permitir la generación de entre 28 y 58 kWh/m2 al año sin sacrificar la estética. La innovación radica en convertir la fachada en un elemento activo de producción energética que mejora drásticamente el control térmico.',
    '{"transparency": "20%", "power_output": "34W/m2", "u_value": "5.7 W/m2K"}'
  ),
  (
    'Paneles de Fachada de Ultra Alto Rendimiento (UHPC - Ductal)', 
    '#9CA3AF', 
    8, 
    22.5, 
    true, 
    60,
    1.5,
    280.00,
    'Utiliza hormigón reforzado con fibras de alta densidad para crear paneles ultra delgados de 15mm a 30mm con resistencias de hasta 250 MPa. Su tecnología de porosidad casi nula permite diseñar fachadas autoportantes complejas capaces de resistir la corrosión marina por décadas.',
    '{"strength": "150-250 MPa", "thickness": "15-30mm", "finish": "Customized"}'
  );

-- 4. User Validation Logs (Oxentia Metrics)
create table public.user_validation_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id), -- Nullable for anonymous testers
  action text not null, -- 'view_material', 'activate_ar', 'download_spec'
  target_id text, -- ID of material or model interacted with
  metadata jsonb, -- Context: { device: 'mobile', duration: 45 }
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.user_validation_logs enable row level security;

create policy "Validations are viewable by admins."
  on user_validation_logs for select
  using ( auth.jwt() ->> 'role' = 'admin' );

create policy "Anyone can insert logs."
  on user_validation_logs for insert
  with check ( true ); -- Allow public logging for broad testing
