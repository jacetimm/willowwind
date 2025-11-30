-- Create profiles table
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text check (role in ('client', 'coach')),
  created_at timestamp default now()
);

-- Create coaches table
create table coaches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  bio text,
  categories text[],
  languages text[],
  credentials text,
  hourly_rate numeric,
  profile_image_url text,
  created_at timestamp default now()
);

-- Create bookings table
create table bookings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references profiles(id),
  coach_id uuid references profiles(id),
  session_date timestamptz,
  duration int,
  status text default 'pending',
  price numeric,
  payment_id text,
  created_at timestamp default now()
);

-- Create availability table
create table availability (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references profiles(id),
  day_of_week int,
  start_time time,
  end_time time
);

-- Set up Row Level Security (RLS)
-- Enable RLS on all tables
alter table profiles enable row level security;
alter table coaches enable row level security;
alter table bookings enable row level security;
alter table availability enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

create policy "Users can insert their own profile"
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

-- Coaches policies
create policy "Coaches are viewable by everyone"
  on coaches for select
  using ( true );

create policy "Coaches can insert their own coach profile"
  on coaches for insert
  with check ( auth.uid() = user_id );

create policy "Coaches can update own coach profile"
  on coaches for update
  using ( auth.uid() = user_id );

-- Bookings policies
create policy "Users can view their own bookings"
  on bookings for select
  using ( auth.uid() = client_id or auth.uid() in (select user_id from coaches where id = coach_id) );

create policy "Clients can insert bookings"
  on bookings for insert
  with check ( auth.uid() = client_id );

-- Availability policies
create policy "Availability is viewable by everyone"
  on availability for select
  using ( true );

create policy "Coaches can manage their own availability"
  on availability for all
  using ( auth.uid() in (select user_id from coaches where id = coach_id) );
