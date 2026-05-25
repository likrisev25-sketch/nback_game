-- Migration: Add missing bot-related columns to lobby_players
-- Execute this on your PRODUCTION database (Neon PostgreSQL via Vercel)

-- Add missing columns to lobby_players table
ALTER TABLE lobby_players 
  ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS bot_accuracy INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS connection_id TEXT,
  ADD COLUMN IF NOT EXISTS last_heartbeat TEXT;

-- Verify columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'lobby_players' 
  AND column_name IN ('is_bot', 'bot_accuracy', 'connection_id', 'last_heartbeat')
ORDER BY ordinal_position;
