-- Migration: Enable necessary extensions
-- Description: Enables UUID extension required for Supabase Auth

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp"; 