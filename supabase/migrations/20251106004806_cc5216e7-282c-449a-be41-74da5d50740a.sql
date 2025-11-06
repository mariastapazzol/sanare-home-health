-- Add notification_ids column to medicamentos
ALTER TABLE medicamentos 
ADD COLUMN IF NOT EXISTS notification_ids jsonb DEFAULT '[]'::jsonb;

-- Add notification_ids column to lembretes
ALTER TABLE lembretes 
ADD COLUMN IF NOT EXISTS notification_ids jsonb DEFAULT '[]'::jsonb;

-- Add comments
COMMENT ON COLUMN medicamentos.notification_ids IS 'Array of notification IDs for scheduled local notifications';
COMMENT ON COLUMN lembretes.notification_ids IS 'Array of notification IDs for scheduled local notifications';