-- ============================================
-- Ruta Segura Perú - Rename metadata column
-- Fix for SQLAlchemy reserved keyword conflict
-- ============================================

-- Rename the column if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE audit_logs RENAME COLUMN metadata TO context_data;
        RAISE NOTICE 'Column renamed: metadata -> context_data';
    ELSE
        RAISE NOTICE 'Column metadata does not exist, no action needed';
    END IF;
END $$;
