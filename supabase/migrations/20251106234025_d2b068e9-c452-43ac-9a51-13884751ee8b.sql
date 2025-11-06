-- Remove a check constraint que está limitando os valores de mood
ALTER TABLE diary_entries DROP CONSTRAINT IF EXISTS diary_entries_mood_check;

-- A coluna mood agora pode aceitar tanto os valores padrão (very_happy, happy, etc) 
-- quanto os UUIDs das emoções personalizadas da tabela custom_moods