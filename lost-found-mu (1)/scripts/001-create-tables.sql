-- Create Users table
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(50) PRIMARY KEY,
    subscribed_status BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Items table
CREATE TABLE IF NOT EXISTS items (
    item_id SERIAL PRIMARY KEY,
    reporter_id VARCHAR(50) REFERENCES users(user_id),
    report_type VARCHAR(10) CHECK (report_type IN ('LOST', 'FOUND')),
    category VARCHAR(50) CHECK (category IN ('ID & Finance', 'Electronics', 'Keys', 'Apparel', 'Personal Items', 'Sports Gear', 'Other')),
    description TEXT NOT NULL,
    photo_url VARCHAR(500),
    location VARCHAR(200),
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLAIMED')),
    claim_code VARCHAR(20) UNIQUE,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    claimed_at TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_items_reporter_id ON items(reporter_id);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_items_claim_code ON items(claim_code);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
