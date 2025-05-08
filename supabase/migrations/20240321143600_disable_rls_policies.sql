-- Migration: Disable RLS policies
-- Description: Disables Row Level Security policies for compositions and generation_log tables
-- Tables affected: compositions, generation_log
-- Special considerations: 
--   - Removes all security policies
--   - Makes tables publicly accessible
--   - WARNING: This removes row-level access control

-- Drop all policies and disable RLS for compositions table
drop policy if exists "Users can view their own compositions" on compositions;
drop policy if exists "Users can insert their own compositions" on compositions;
drop policy if exists "Users can update their own compositions" on compositions;
drop policy if exists "Users can delete their own compositions" on compositions;
drop policy if exists "Anonymous users cannot view compositions" on compositions;
drop policy if exists "Anonymous users cannot insert compositions" on compositions;
drop policy if exists "Anonymous users cannot update compositions" on compositions;
drop policy if exists "Anonymous users cannot delete compositions" on compositions;
alter table compositions disable row level security;

-- Drop all policies and disable RLS for generation_log table
drop policy if exists "Users can view their own generation logs" on generation_log;
drop policy if exists "Users can insert their own generation logs" on generation_log;
drop policy if exists "Anonymous users cannot view generation logs" on generation_log;
drop policy if exists "Anonymous users cannot insert generation logs" on generation_log;
alter table generation_log disable row level security; 