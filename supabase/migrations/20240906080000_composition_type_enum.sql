-- Migration: Change composition_type to enum
-- Description: Changes the composition_type column from boolean to enum type
-- Tables affected: compositions
-- Special considerations: 
--   - Creates a new enum type
--   - Modifies existing column to use new enum type
--   - Temporary conversion during migration

-- create the enum type for composition types
create type composition_type_enum as enum ('manual', 'ai-generated');

-- update the compositions table:
-- first add a new temporary column
alter table compositions 
add column composition_type_new composition_type_enum;

-- populate the new column based on the existing boolean values
-- assuming true was AI-generated and false was manual
update compositions 
set composition_type_new = case 
    when composition_type = true then 'ai-generated'::composition_type_enum
    else 'manual'::composition_type_enum
end;

-- drop the old column and rename the new one
alter table compositions drop column composition_type;
alter table compositions rename column composition_type_new to composition_type;

-- make the column not null and set default
alter table compositions 
alter column composition_type set not null,
alter column composition_type set default 'manual'::composition_type_enum;

-- add a comment to explain the enum values
comment on column compositions.composition_type is 'Type of composition: manual (created by user) or ai-generated'; 