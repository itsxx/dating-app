process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';

const { initDatabase, getDb } = require('../src/config/database');

const createTables = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  birthday TEXT NOT NULL,
  mbti_type TEXT,
  zodiac_sign TEXT,
  latitude REAL,
  longitude REAL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS mbti_tests (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  answers TEXT,
  result_type TEXT,
  completed_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS recommendation_settings (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  zodiac_filter TEXT DEFAULT 'none',
  mbti_filter TEXT DEFAULT 'none',
  sort_by TEXT DEFAULT 'birthday',
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS likes (
  id TEXT PRIMARY KEY,
  sender_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  receiver_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(sender_id, receiver_id)
);

CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  user1_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  user2_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user1_id, user2_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  match_id TEXT REFERENCES matches(id) ON DELETE CASCADE,
  sender_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
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

// Initialize database before all tests
beforeAll(async () => {
  await initDatabase();
  const db = getDb();
  db.run(createTables);
});

// Clean up after all tests
afterAll(() => {
  // Save database on exit
  process.emit('exit');
});
