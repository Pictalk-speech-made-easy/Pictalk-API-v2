-- Add a new temporary JSONB column to the 'collection' table
ALTER TABLE picto ADD COLUMN speech_jsonb JSONB;

-- Assuming all current 'meaning' values are valid JSON strings,
-- Copy data from 'meaning' to 'meaning_jsonb', casting it to JSONB
UPDATE picto
SET speech_jsonb = speech::JSONB
WHERE speech IS NOT NULL AND speech != '';

-- After confirming that the data has been correctly migrated to 'meaning_jsonb',
-- Drop the old 'meaning' column
ALTER TABLE picto DROP COLUMN speech;

-- Rename the new 'meaning_jsonb' column to 'meaning'
ALTER TABLE picto RENAME COLUMN speech_jsonb TO speech;