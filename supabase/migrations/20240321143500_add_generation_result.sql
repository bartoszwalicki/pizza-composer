-- Migration: Add generation_result to generation_log
-- Description: Adds a text column to store the result of the generation process
-- Tables affected: generation_log
-- Special considerations: 
--   - Adds a new column for storing generation results
--   - Column is nullable to maintain compatibility with existing records

-- Add generation_result column
alter table generation_log
    add column generation_result text;

-- Add a comment to explain the column's purpose
comment on column generation_log.generation_result is 'Stores the textual result/output of the generation process'; 