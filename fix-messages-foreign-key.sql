-- =====================================================
-- FIX: Create Foreign Key for messages -> user_profiles
-- This fixes the PGRST200 error on Vercel
-- =====================================================

-- Check if foreign key already exists
SELECT 
  constraint_name,
  table_name,
  column_name
FROM information_schema.key_column_usage
WHERE table_name = 'messages' 
AND constraint_name = 'messages_sender_id_fkey';

-- If the above returns no rows, run the following:

-- Option 1: Add foreign key if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'messages_sender_id_fkey' 
    AND table_name = 'messages'
  ) THEN
    ALTER TABLE messages
    ADD CONSTRAINT messages_sender_id_fkey
    FOREIGN KEY (sender_id) 
    REFERENCES user_profiles(id) 
    ON DELETE CASCADE;
    
    RAISE NOTICE 'Foreign key messages_sender_id_fkey created successfully';
  ELSE
    RAISE NOTICE 'Foreign key messages_sender_id_fkey already exists';
  END IF;
END $$;

-- Option 2: Alternative - Drop and recreate if needed
-- DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
-- ALTER TABLE messages
-- ADD CONSTRAINT messages_sender_id_fkey
-- FOREIGN KEY (sender_id) 
-- REFERENCES user_profiles(id) 
-- ON DELETE CASCADE;

-- Verify the foreign key was created
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'messages'
  AND tc.constraint_name = 'messages_sender_id_fkey';

-- This should return:
-- constraint_name: messages_sender_id_fkey
-- table_name: messages
-- column_name: sender_id
-- foreign_table_name: user_profiles
-- foreign_column_name: id

