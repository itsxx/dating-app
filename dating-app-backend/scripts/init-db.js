require('dotenv').config();
const { Pool } = require('pg');

const createTables = `
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(50),
  avatar_url VARCHAR(500),
  bio TEXT,
  birthday DATE NOT NULL,
  mbti_type VARCHAR(4),
  zodiac_sign VARCHAR(20),
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mbti_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  answers JSONB,
  result_type VARCHAR(4),
  completed_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recommendation_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  zodiac_filter VARCHAR(20) DEFAULT 'none',
  mbti_filter VARCHAR(20) DEFAULT 'none',
  sort_by VARCHAR(20) DEFAULT 'birthday',
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_birthday ON profiles(birthday);
CREATE INDEX IF NOT EXISTS idx_profiles_zodiac ON profiles(zodiac_sign);
CREATE INDEX IF NOT EXISTS idx_profiles_mbti ON profiles(mbti_type);
CREATE INDEX IF NOT EXISTS idx_likes_receiver ON likes(receiver_id);
CREATE INDEX IF NOT EXISTS idx_matches_user1 ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_messages_match ON messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
`;

async function init() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    await pool.query(createTables);
    console.log('Database tables created successfully');
    await pool.end();
  } catch (err) {
    console.error('Error creating tables:', err);
    await pool.end();
    process.exit(1);
  }
}

init();
