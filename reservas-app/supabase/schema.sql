-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create Users/Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text not null,
  department text not null,
  role text default 'user' check (role in ('user', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Rooms table
create table public.rooms (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  capacity integer,
  features text[], -- ex: ['projector', 'sound_system']
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert default rooms
insert into public.rooms (name, capacity, features) values
  ('Salão Principal', 500, array['sound_system', 'projector', 'air_conditioning']),
  ('Sala de Jovens', 100, array['sound_system', 'tv']),
  ('Sala das Crianças', 50, array['tv']),
  ('Sala de Reuniões', 20, array['tv', 'board']);

-- 3. Create Reservations table
create table public.reservations (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid references public.rooms on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  needs_sound boolean default false,
  needs_portaria boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add constraint to prevent double booking
-- This uses a PostgreSQL EXCLUDE constraint with range types
create extension if not exists btree_gist;

alter table public.reservations
add constraint overlapping_reservations
exclude using gist (
  room_id with =,
  tstzrange(start_time, end_time) with &&
);

-- Set up Row Level Security (RLS)

-- Profiles
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- Rooms
alter table public.rooms enable row level security;
create policy "Rooms are viewable by everyone." on rooms for select using (true);
create policy "Anyone authenticated can modify rooms." on rooms for all using (
  auth.role() = 'authenticated'
);

-- Reservations
alter table public.reservations enable row level security;
create policy "Reservations are viewable by everyone." on reservations for select using (true);
create policy "Authenticated users can create reservations." on reservations for insert with check (auth.role() = 'authenticated');
create policy "Users can update own reservations." on reservations for update using (auth.uid() = user_id);
create policy "Users can delete own reservations." on reservations for delete using (auth.uid() = user_id);

-- Setup auth trigger for new users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, department)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'department');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
