-- Create a table for User Profiles
create table if not exists profiles (
  user_id text primary key,
  full_name text,
  email text,
  raw_data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

-- Allow users to view their own profile
create policy "Users can view own profile"
  on profiles for select
  using ( auth.uid()::text = user_id );

-- Allow users to insert/update their own profile
create policy "Users can update own profile"
  on profiles for insert
  with check ( auth.uid()::text = user_id );

create policy "Users can update own profile 2"
  on profiles for update
  using ( auth.uid()::text = user_id );
