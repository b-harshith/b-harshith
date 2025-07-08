-- Add user_name field to Users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_name VARCHAR(255);

-- Update existing users to have a placeholder name (will be updated during next interaction)
UPDATE users SET user_name = 'Friend' WHERE user_name IS NULL;

-- Make user_name NOT NULL after setting defaults
ALTER TABLE users ALTER COLUMN user_name SET NOT NULL;
