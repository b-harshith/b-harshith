/*
  # Loki Evolution: Transform into Campus Companion

  1. New Tables
    - `events` - Store campus events with categories and targeting
    - `faqs` - Knowledge base for instant answers
    - `message_queue` - Considerate communication protocol
    - `user_interests` - User preference tracking
    - `time_windows` - Academic schedule management

  2. Enhanced Tables
    - `users` - Add interests array and profile data
    - `items` - Add vector search and metadata capabilities

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for different user roles
*/

-- Add interests and profile data to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS year_of_study INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create events table for campus events
CREATE TABLE IF NOT EXISTS events (
  event_id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('Tech', 'Arts', 'Sports', 'Academic', 'Cultural', 'Social', 'Career', 'Other')),
  event_date TIMESTAMP NOT NULL,
  location VARCHAR(200) NOT NULL,
  poster_url VARCHAR(500),
  organizer_id VARCHAR(50) REFERENCES users(user_id),
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  target_audience TEXT[] DEFAULT '{}',
  max_participants INTEGER,
  registration_required BOOLEAN DEFAULT FALSE,
  registration_link VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  broadcast_sent BOOLEAN DEFAULT FALSE
);

-- Create FAQs table for knowledge base
CREATE TABLE IF NOT EXISTS faqs (
  faq_id SERIAL PRIMARY KEY,
  question VARCHAR(500) NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[] NOT NULL,
  category VARCHAR(50) NOT NULL,
  created_by VARCHAR(50) REFERENCES users(user_id),
  is_active BOOLEAN DEFAULT TRUE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create message queue for considerate communication
CREATE TABLE IF NOT EXISTS message_queue (
  queue_id SERIAL PRIMARY KEY,
  recipient_id VARCHAR(50) NOT NULL REFERENCES users(user_id),
  message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('EVENT_BROADCAST', 'MATCH_NOTIFICATION', 'SYSTEM_UPDATE', 'DIRECT_REPLY')),
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  message_content TEXT NOT NULL,
  media_url VARCHAR(500),
  scheduled_for TIMESTAMP,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'CANCELLED')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP,
  metadata JSONB DEFAULT '{}'
);

-- Create time windows for academic schedule
CREATE TABLE IF NOT EXISTS time_windows (
  window_id SERIAL PRIMARY KEY,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  window_type VARCHAR(20) NOT NULL CHECK (window_type IN ('QUIET', 'SEND')),
  description VARCHAR(200),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user interests junction table for better normalization
CREATE TABLE IF NOT EXISTS user_interests (
  user_id VARCHAR(50) REFERENCES users(user_id) ON DELETE CASCADE,
  interest VARCHAR(50) NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, interest)
);

-- Add vector search capabilities to items (for future semantic search)
ALTER TABLE items ADD COLUMN IF NOT EXISTS description_vector VECTOR(384);
ALTER TABLE items ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE items ADD COLUMN IF NOT EXISTS search_keywords TEXT[];

-- Enable RLS on new tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

-- Create policies for events
CREATE POLICY "Users can view approved events"
  ON events
  FOR SELECT
  TO authenticated
  USING (status = 'APPROVED');

CREATE POLICY "Organizers can manage their events"
  ON events
  FOR ALL
  TO authenticated
  USING (organizer_id = auth.uid());

CREATE POLICY "Admins can manage all events"
  ON events
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Create policies for FAQs
CREATE POLICY "Users can view active FAQs"
  ON faqs
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage FAQs"
  ON faqs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Create policies for message queue
CREATE POLICY "Users can view their own messages"
  ON message_queue
  FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY "System can manage message queue"
  ON message_queue
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Create policies for time windows
CREATE POLICY "Everyone can view time windows"
  ON time_windows
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage time windows"
  ON time_windows
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Create policies for user interests
CREATE POLICY "Users can manage their own interests"
  ON user_interests
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);

CREATE INDEX IF NOT EXISTS idx_faqs_keywords ON faqs USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_active ON faqs(is_active);

CREATE INDEX IF NOT EXISTS idx_message_queue_recipient ON message_queue(recipient_id);
CREATE INDEX IF NOT EXISTS idx_message_queue_status ON message_queue(status);
CREATE INDEX IF NOT EXISTS idx_message_queue_scheduled ON message_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_message_queue_priority ON message_queue(priority);

CREATE INDEX IF NOT EXISTS idx_time_windows_day ON time_windows(day_of_week);
CREATE INDEX IF NOT EXISTS idx_time_windows_active ON time_windows(is_active);

CREATE INDEX IF NOT EXISTS idx_user_interests_interest ON user_interests(interest);

CREATE INDEX IF NOT EXISTS idx_items_keywords ON items USING GIN(search_keywords);
CREATE INDEX IF NOT EXISTS idx_items_metadata ON items USING GIN(metadata);

-- Insert default time windows for MU schedule
INSERT INTO time_windows (day_of_week, start_time, end_time, window_type, description) VALUES
-- Monday/Tuesday/Thursday/Friday schedule
(1, '08:25', '10:20', 'QUIET', 'Morning classes'),
(1, '10:35', '12:30', 'QUIET', 'Late morning classes'),
(1, '13:35', '18:30', 'QUIET', 'Afternoon classes'),
(2, '08:25', '10:20', 'QUIET', 'Morning classes'),
(2, '10:35', '12:30', 'QUIET', 'Late morning classes'),
(2, '13:35', '18:30', 'QUIET', 'Afternoon classes'),
(4, '08:25', '10:20', 'QUIET', 'Morning classes'),
(4, '10:35', '12:30', 'QUIET', 'Late morning classes'),
(4, '13:35', '18:30', 'QUIET', 'Afternoon classes'),
(5, '08:25', '10:20', 'QUIET', 'Morning classes'),
(5, '10:35', '12:30', 'QUIET', 'Late morning classes'),
(5, '13:35', '18:30', 'QUIET', 'Afternoon classes'),
-- Wednesday schedule
(3, '08:25', '12:30', 'QUIET', 'Wednesday morning classes'),
-- Send windows (breaks and after hours)
(1, '00:00', '08:24', 'SEND', 'Early morning'),
(1, '10:21', '10:34', 'SEND', 'Morning break'),
(1, '12:31', '13:34', 'SEND', 'Lunch break'),
(1, '18:31', '23:59', 'SEND', 'Evening'),
(2, '00:00', '08:24', 'SEND', 'Early morning'),
(2, '10:21', '10:34', 'SEND', 'Morning break'),
(2, '12:31', '13:34', 'SEND', 'Lunch break'),
(2, '18:31', '23:59', 'SEND', 'Evening'),
(3, '00:00', '08:24', 'SEND', 'Early morning'),
(3, '12:31', '23:59', 'SEND', 'Wednesday afternoon/evening'),
(4, '00:00', '08:24', 'SEND', 'Early morning'),
(4, '10:21', '10:34', 'SEND', 'Morning break'),
(4, '12:31', '13:34', 'SEND', 'Lunch break'),
(4, '18:31', '23:59', 'SEND', 'Evening'),
(5, '00:00', '08:24', 'SEND', 'Early morning'),
(5, '10:21', '10:34', 'SEND', 'Morning break'),
(5, '12:31', '13:34', 'SEND', 'Lunch break'),
(5, '18:31', '23:59', 'SEND', 'Evening'),
-- Weekends (all day send windows)
(0, '00:00', '23:59', 'SEND', 'Sunday'),
(6, '00:00', '23:59', 'SEND', 'Saturday');

-- Insert sample FAQs
INSERT INTO faqs (question, answer, keywords, category, created_by) VALUES
('Where is the library?', 'The Central Library is located in the Academic Block, Ground Floor. It''s open from 8:00 AM to 10:00 PM on weekdays and 9:00 AM to 6:00 PM on weekends.', ARRAY['library', 'location', 'where', 'timings', 'hours'], 'Academic', 'system'),
('How do I access WiFi?', 'Connect to "MU-Student" network. Use your student ID as username and your date of birth (DDMMYYYY) as password. For issues, contact IT helpdesk at ext. 2525.', ARRAY['wifi', 'internet', 'network', 'password', 'connection'], 'Tech', 'system'),
('Where is the cafeteria?', 'The main cafeteria is in the Student Center, first floor. There''s also a smaller café in the Academic Block ground floor. Timings: 7:30 AM to 9:30 PM.', ARRAY['cafeteria', 'food', 'cafe', 'dining', 'mess', 'canteen'], 'Campus', 'system'),
('How do I book sports facilities?', 'Sports facilities can be booked through the Sports Complex office or via the MU Sports app. Contact the sports coordinator at sports@mahindrauniversity.edu.in', ARRAY['sports', 'booking', 'facilities', 'gym', 'court', 'field'], 'Sports', 'system'),
('What are the hostel timings?', 'Hostel gates close at 11:00 PM on weekdays and 12:00 AM on weekends. Late entry requires prior permission from the warden.', ARRAY['hostel', 'timings', 'curfew', 'gates', 'warden'], 'Hostel', 'system');

-- Insert sample interest categories
INSERT INTO user_interests (user_id, interest) 
SELECT 'system', unnest(ARRAY['Tech', 'Arts', 'Sports', 'Academic', 'Cultural', 'Social', 'Career']) 
WHERE NOT EXISTS (SELECT 1 FROM user_interests WHERE user_id = 'system');