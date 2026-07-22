-- Migration: Add document_image_url column to agents table
-- Run this in your Supabase SQL Editor

ALTER TABLE agents
ADD COLUMN IF NOT EXISTS document_image_url TEXT;
