-- Migration: Create generation_log table
-- Description: Creates the generation_log table with RLS policies
-- Tables affected: generation_log
-- Special considerations: 
--   - References compositions and auth.users tables
--   - Implements RLS policies for both authenticated and anonymous users

-- Create generation_log table
create table generation_log (
    generation_id serial primary key,
    generation_duration interval not null,
    user_id uuid not null references auth.users(id) on delete cascade,
    composition_id integer not null references compositions(composition_id) on delete cascade
);

-- Enable Row Level Security
alter table generation_log enable row level security;

-- Create RLS policies for authenticated users
create policy "Users can view their own generation logs"
    on generation_log for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Users can insert their own generation logs"
    on generation_log for insert
    to authenticated
    with check (auth.uid() = user_id);

-- Note: Update and Delete operations are not needed for generation_log as it's an audit table

-- Create RLS policies for anonymous users (no access)
create policy "Anonymous users cannot view generation logs"
    on generation_log for select
    to anon
    using (false);

create policy "Anonymous users cannot insert generation logs"
    on generation_log for insert
    to anon
    with check (false); 