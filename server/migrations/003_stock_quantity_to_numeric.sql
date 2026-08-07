-- Migration: Change stock_quantity from INTEGER to NUMERIC for fractional units
-- Run this in Supabase SQL Editor

ALTER TABLE products ALTER COLUMN stock_quantity TYPE NUMERIC USING stock_quantity::NUMERIC;
ALTER TABLE products ALTER COLUMN stock_quantity SET DEFAULT 0;
