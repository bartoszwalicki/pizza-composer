-- Migration: Create compositions table
-- Description: Creates the compositions table with RLS policies
-- Tables affected: compositions
-- Special considerations: 
--   - Includes array constraint for ingredients
--   - Implements RLS policies for both authenticated and anonymous users
--   - References auth.users table from Supabase Auth

-- Create compositions table
create table compositions (
    composition_id serial primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    ingredients text[] not null check (array_length(ingredients, 1) <= 10),
    rating integer check (rating between 1 and 6),
    composition_type boolean not null,
    created_at timestamptz not null default now(),
    photo_url text
);

-- Create indexes
create index compositions_user_id_idx on compositions(user_id);
create index compositions_user_id_created_at_idx on compositions(user_id, created_at);

-- Enable Row Level Security
alter table compositions enable row level security;

-- Create RLS policies for authenticated users
create policy "Users can view their own compositions"
    on compositions for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Users can insert their own compositions"
    on compositions for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "Users can update their own compositions"
    on compositions for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own compositions"
    on compositions for delete
    to authenticated
    using (auth.uid() = user_id);

-- Create RLS policies for anonymous users (no access)
create policy "Anonymous users cannot view compositions"
    on compositions for select
    to anon
    using (false);

create policy "Anonymous users cannot insert compositions"
    on compositions for insert
    to anon
    with check (false);

create policy "Anonymous users cannot update compositions"
    on compositions for update
    to anon
    using (false)
    with check (false);

create policy "Anonymous users cannot delete compositions"
    on compositions for delete
    to anon
    using (false); 