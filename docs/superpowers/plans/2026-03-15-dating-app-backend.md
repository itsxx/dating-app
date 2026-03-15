# Dating App Backend Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Node.js/Express backend API for a dating app with recommendation system based on zodiac, MBTI, and birthday.

**Architecture:** Layered architecture with Express routes, service layer for business logic, and PostgreSQL database. WebSocket for real-time chat.

**Tech Stack:** Node.js, Express, PostgreSQL, JWT, WebSocket (ws), bcrypt, Jest (testing)

---

## File Structure

```
dating-app-backend/
├── src/
│   ├── index.js                 # Express app entry point
│   ├── config/
│   │   ├── database.js          # Database connection
│   │   └── websocket.js         # WebSocket server setup
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication middleware
│   │   └── errorHandler.js      # Global error handler
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── userController.js    # User profile logic
│   │   ├── mbtiController.js    # MBTI test logic
│   │   ├── recommendationController.js  # Recommendation logic
│   │   ├── matchController.js   # Matching logic
│   │   └── chatController.js    # Chat logic
│   ├── services/
│   │   ├── authService.js       # Auth business logic
│   │   ├── userService.js       # User business logic
│   │   ├── mbtiService.js       # MBTI calculation
│   │   ├── recommendationService.js    # Recommendation algorithm
│   │   ├── matchService.js      # Matching logic
│   │   └── chatService.js       # Chat business logic
│   ├── models/
│   │   └── queries.js           # Database queries
│   └── utils/
│       ├── zodiac.js            # Zodiac calculation
│       └── validators.js        # Input validation
├── tests/
│   ├── services/
│   │   ├── authService.test.js
│   │   ├── mbtiService.test.js
│   │   └── recommendationService.test.js
│   ├── utils/
│   │   ├── zodiac.test.js
│   │   └── validators.test.js
│   └── integration/
│       ├── auth.test.js
│       ├── recommendation.test.js
│       └── chat.test.js
├── scripts/
│   ├── init-db.js               # Database initialization
│   └── seed.js                  # Seed data for testing
├── .env.example
├── .gitignore
├── jest.config.js
├── package.json
└── README.md
```

---

## Chunk 1: Project Setup and Authentication

### Task 1.1: Initialize Project

**Files:**
- Create: `dating-app-backend/package.json`
- Create: `dating-app-backend/.gitignore`
- Create: `dating-app-backend/.env.example`
- Create: `dating-app-backend/jest.config.js`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "dating-app-backend",
  "version": "1.0.0",
  "description": "Dating app backend API",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "test:integration": "jest tests/integration --runInBand",
    "db:init": "node scripts/init-db.js",
    "db:seed": "node scripts/seed.js"
  },
  "keywords": ["dating", "api", "express"],
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.11.3",
    "ws": "^8.14.2",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "nodemon": "^3.0.2"
  }
}
```

- [ ] **Step 2: Create .gitignore**

```
node_modules/
.env
.env.local
coverage/
*.log
.DS_Store
```

- [ ] **Step 3: Create .env.example**

```
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/dating_app
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3001
```

- [ ] **Step 4: Create jest.config.js**

```javascript
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.js'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true,
  forceExit: true
};
```

- [ ] **Step 5: Commit**

```bash
cd dating-app-backend
git init
git add package.json .gitignore .env.example jest.config.js
git commit -m "init: scaffold dating app backend project"
```

---

### Task 1.2: Database Configuration

**Files:**
- Create: `dating-app-backend/src/config/database.js`
- Create: `dating-app-backend/scripts/init-db.js`

- [ ] **Step 1: Write database connection config**

```javascript
// src/config/database.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
  console.log('Database connected');
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect()
};
```

- [ ] **Step 2: Write database initialization script**

```javascript
// scripts/init-db.js
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
```

- [ ] **Step 3: Run tests for database module**

Run: `npm test -- tests/utils/database.test.js -v`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/config/database.js scripts/init-db.js
git commit -m "feat: add database configuration and init script"
```

---

### Task 1.3: Zodiac Utility

**Files:**
- Create: `dating-app-backend/src/utils/zodiac.js`
- Create: `dating-app-backend/tests/utils/zodiac.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
// tests/utils/zodiac.test.js
const { getZodiacSign, getZodiacElement, getComplementaryZodiac } = require('../../src/utils/zodiac');

describe('getZodiacSign', () => {
  it('should return Aquarius for January 20', () => {
    expect(getZodiacSign('2000-01-20')).toBe('Aquarius');
  });

  it('should return Pisces for March 15', () => {
    expect(getZodiacSign('2000-03-15')).toBe('Pisces');
  });

  it('should return Aries for April 1', () => {
    expect(getZodiacSign('2000-04-01')).toBe('Aries');
  });
});

describe('getZodiacElement', () => {
  it('should return Fire for Aries', () => {
    expect(getZodiacElement('Aries')).toBe('Fire');
  });

  it('should return Water for Pisces', () => {
    expect(getZodiacElement('Pisces')).toBe('Water');
  });
});

describe('getComplementaryZodiac', () => {
  it('should return Air signs for Fire signs', () => {
    const complements = getComplementaryZodiac('Aries');
    expect(complements).toContain('Gemini');
    expect(complements).toContain('Libra');
    expect(complements).toContain('Aquarius');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/utils/zodiac.test.js -v`
Expected: FAIL with "function not defined"

- [ ] **Step 3: Write zodiac utility implementation**

```javascript
// src/utils/zodiac.js
const ZODIAC_DATES = [
  { name: 'Capricorn', end: '01-19' },
  { name: 'Aquarius', end: '02-18' },
  { name: 'Pisces', end: '03-20' },
  { name: 'Aries', end: '04-19' },
  { name: 'Taurus', end: '05-20' },
  { name: 'Gemini', end: '06-20' },
  { name: 'Cancer', end: '07-22' },
  { name: 'Leo', end: '08-22' },
  { name: 'Virgo', end: '09-22' },
  { name: 'Libra', end: '10-22' },
  { name: 'Scorpio', end: '11-21' },
  { name: 'Sagittarius', end: '12-21' },
  { name: 'Capricorn', end: '12-31' }
];

const ZODIAC_ELEMENTS = {
  Fire: ['Aries', 'Leo', 'Sagittarius'],
  Earth: ['Taurus', 'Virgo', 'Capricorn'],
  Air: ['Gemini', 'Libra', 'Aquarius'],
  Water: ['Cancer', 'Scorpio', 'Pisces']
};

const ELEMENT_COMPATIBILITY = {
  Fire: 'Air',
  Air: 'Fire',
  Earth: 'Water',
  Water: 'Earth'
};

function getZodiacSign(birthday) {
  const date = new Date(birthday);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dateStr = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  for (const zodiac of ZODIAC_DATES) {
    if (dateStr <= zodiac.end) {
      return zodiac.name;
    }
  }

  return 'Capricorn';
}

function getZodiacElement(sign) {
  for (const [element, signs] of Object.entries(ZODIAC_ELEMENTS)) {
    if (signs.includes(sign)) {
      return element;
    }
  }
  return null;
}

function getComplementaryZodiac(sign) {
  const element = getZodiacElement(sign);
  const complementaryElement = ELEMENT_COMPATIBILITY[element];
  return ZODIAC_ELEMENTS[complementaryElement] || [];
}

module.exports = {
  getZodiacSign,
  getZodiacElement,
  getComplementaryZodiac
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/utils/zodiac.test.js -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/zodiac.js tests/utils/zodiac.test.js
git commit -m "feat: add zodiac calculation utility with tests"
```

---

### Task 1.4: MBTI Service

**Files:**
- Create: `dating-app-backend/src/utils/mbti.js`
- Create: `dating-app-backend/tests/utils/mbti.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
// tests/utils/mbti.test.js
const { calculateMBTI, getComplementaryMBTI, getMBTIQuestions } = require('../../src/utils/mbti');

describe('calculateMBTI', () => {
  it('should return INFJ for balanced introvert answers', () => {
    const answers = [
      { dimension: 'EI', choice: 'I' },
      { dimension: 'SN', choice: 'N' },
      { dimension: 'TF', choice: 'F' },
      { dimension: 'JP', choice: 'J' }
    ];
    expect(calculateMBTI(answers)).toBe('INFJ');
  });

  it('should return ENTP for extroverted answers', () => {
    const answers = [
      { dimension: 'EI', choice: 'E' },
      { dimension: 'SN', choice: 'N' },
      { dimension: 'TF', choice: 'T' },
      { dimension: 'JP', choice: 'P' }
    ];
    expect(calculateMBTI(answers)).toBe('ENTP');
  });
});

describe('getComplementaryMBTI', () => {
  it('should return ENFP for INFJ', () => {
    expect(getComplementaryMBTI('INFJ')).toBe('ENFP');
  });

  it('should return ENTP for INTJ', () => {
    expect(getComplementaryMBTI('INTJ')).toBe('ENTP');
  });

  it('should return INFJ for ENFP', () => {
    expect(getComplementaryMBTI('ENFP')).toBe('INFJ');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/utils/mbti.test.js -v`
Expected: FAIL

- [ ] **Step 3: Write MBTI utility implementation**

```javascript
// src/utils/mbti.js
const MBTI_QUESTIONS = [
  // E/I questions (1-6)
  { id: 1, dimension: 'EI', text: '在聚会上，你会主动与陌生人交谈吗？', options: { A: 'E', B: 'I' } },
  { id: 2, dimension: 'EI', text: '你更喜欢独处还是与人相处？', options: { A: 'I', B: 'E' } },
  { id: 3, dimension: 'EI', text: '朋友描述你时，会说你外向吗？', options: { A: 'E', B: 'I' } },
  { id: 4, dimension: 'EI', text: '你通过社交获得能量还是通过独处恢复能量？', options: { A: 'E', B: 'I' } },
  { id: 5, dimension: 'EI', text: '你更倾向于先说话还是先倾听？', options: { A: 'E', B: 'I' } },
  { id: 6, dimension: 'EI', text: '你喜欢广泛的社交圈还是少数深交的朋友？', options: { A: 'E', B: 'I' } },

  // S/N questions (7-12)
  { id: 7, dimension: 'SN', text: '你更关注细节还是整体概念？', options: { A: 'S', B: 'N' } },
  { id: 8, dimension: 'SN', text: '你相信经验还是直觉？', options: { A: 'S', B: 'N' } },
  { id: 9, dimension: 'SN', text: '你更喜欢具体的事实还是抽象的理论？', options: { A: 'S', B: 'N' } },
  { id: 10, dimension: 'SN', text: '你注重当下还是未来可能性？', options: { A: 'S', B: 'N' } },
  { id: 11, dimension: 'SN', text: '你更信任实际经验还是第六感？', options: { A: 'S', B: 'N' } },
  { id: 12, dimension: 'SN', text: '你描述事物时更具体还是更抽象？', options: { A: 'S', B: 'N' } },

  // T/F questions (13-18)
  { id: 13, dimension: 'TF', text: '做决定时，你更依赖逻辑还是感受？', options: { A: 'T', B: 'F' } },
  { id: 14, dimension: 'TF', text: '你更看重公平还是和谐？', options: { A: 'T', B: 'F' } },
  { id: 15, dimension: 'TF', text: '批评他人时，你直接还是委婉？', options: { A: 'T', B: 'F' } },
  { id: 16, dimension: 'TF', text: '你更关注真相还是他人感受？', options: { A: 'T', B: 'F' } },
  { id: 17, dimension: 'TF', text: '争论时，你追求赢还是维持关系？', options: { A: 'T', B: 'F' } },
  { id: 18, dimension: 'TF', text: '你更理性还是更感性？', options: { A: 'T', B: 'F' } },

  // J/P questions (19-24)
  { id: 19, dimension: 'JP', text: '你喜欢计划还是随性？', options: { A: 'J', B: 'P' } },
  { id: 20, dimension: 'JP', text: '你的工作空间通常整洁还是凌乱？', options: { A: 'J', B: 'P' } },
  { id: 21, dimension: 'JP', text: '你更喜欢提前决定还是保持开放？', options: { A: 'J', B: 'P' } },
  { id: 22, dimension: 'JP', text: '截止日期对你来说是动力还是压力？', options: { A: 'J', B: 'P' } },
  { id: 23, dimension: 'JP', text: '你习惯完成任务还是同时做多件事？', options: { A: 'J', B: 'P' } },
  { id: 24, dimension: 'JP', text: '你喜欢结构化还是灵活的生活方式？', options: { A: 'J', B: 'P' } }
];

const COMPLEMENTARY_TYPES = {
  'INFJ': 'ENFP', 'ENFP': 'INFJ',
  'INTJ': 'ENFP', 'ENTP': 'INFJ',
  'INFP': 'ENFJ', 'ENFJ': 'INFP',
  'INTP': 'ENTJ', 'ENTJ': 'INTP',
  'ISTJ': 'ESFP', 'ESFP': 'ISTJ',
  'ISFJ': 'ESFJ', 'ESFJ': 'ISFJ',
  'ISTP': 'ESFJ', 'ESTP': 'ISFJ',
  'ISFP': 'ESFJ', 'ESTJ': 'ISFP'
};

function calculateMBTI(answers) {
  const scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };

  answers.forEach(answer => {
    if (scores[answer.choice] !== undefined) {
      scores[answer.choice]++;
    }
  });

  const type = [
    scores.E >= scores.I ? 'E' : 'I',
    scores.S >= scores.N ? 'S' : 'N',
    scores.T >= scores.F ? 'T' : 'F',
    scores.J >= scores.P ? 'J' : 'P'
  ].join('');

  return type;
}

function getComplementaryMBTI(type) {
  return COMPLEMENTARY_TYPES[type] || type;
}

function getMBTIQuestions() {
  return MBTI_QUESTIONS.map(q => ({
    id: q.id,
    dimension: q.dimension,
    text: q.text
  }));
}

module.exports = {
  calculateMBTI,
  getComplementaryMBTI,
  getMBTIQuestions
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/utils/mbti.test.js -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/mbti.js tests/utils/mbti.test.js
git commit -m "feat: add MBTI calculation utility with 24 questions"
```

---

### Task 1.5: Auth Middleware

**Files:**
- Create: `dating-app-backend/src/middleware/auth.js`
- Create: `dating-app-backend/src/middleware/errorHandler.js`
- Create: `dating-app-backend/tests/middleware/auth.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
// tests/middleware/auth.test.js
const jwt = require('jsonwebtoken');
const { authenticate } = require('../../src/middleware/auth');

describe('authenticate middleware', () => {
  it('should reject requests without token', () => {
    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'AUTH_UNAUTHORIZED' }) })
    );
  });

  it('should reject invalid tokens', () => {
    const req = { headers: { authorization: 'Bearer invalid' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    authenticate(req, res, next);

    // Should call res with error after token verification fails
    setTimeout(() => {
      expect(res.status).toHaveBeenCalledWith(401);
    }, 100);
  });

  it('should call next with valid token', () => {
    const token = jwt.sign({ userId: 'test-id' }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = {};
    const next = jest.fn();

    authenticate(req, res, next);

    setTimeout(() => {
      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual({ userId: 'test-id' });
    }, 100);
  });
});
```

- [ ] **Step 2: Write auth middleware implementation**

```javascript
// src/middleware/auth.js
const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: 'AUTH_UNAUTHORIZED',
        message: 'Authentication required'
      }
    });
  }

  const token = authHeader.substring(7);

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        error: {
          code: 'AUTH_INVALID_TOKEN',
          message: 'Invalid or expired token'
        }
      });
    }

    req.user = decoded;
    next();
  });
}

module.exports = { authenticate };
```

```javascript
// src/middleware/errorHandler.js
function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  res.status(statusCode).json({
    error: {
      code,
      message: err.message || 'Internal server error',
      details: err.details
    }
  });
}

function NotFoundError(message = 'Not found') {
  this.statusCode = 404;
  this.code = 'NOT_FOUND';
  this.message = message;
}
NotFoundError.prototype = Error.prototype;

function ValidationError(message, details) {
  this.statusCode = 400;
  this.code = 'VALIDATION_ERROR';
  this.message = message;
  this.details = details;
}
ValidationError.prototype = Error.prototype;

module.exports = {
  errorHandler,
  NotFoundError,
  ValidationError
};
```

- [ ] **Step 3: Run test to verify it passes**

Run: `npm test -- tests/middleware/auth.test.js -v`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/middleware/auth.js src/middleware/errorHandler.js tests/middleware/auth.test.js
git commit -m "feat: add authentication middleware and error handler"
```

---

### Task 1.6: Auth Service and Controller

**Files:**
- Create: `dating-app-backend/src/services/authService.js`
- Create: `dating-app-backend/src/controllers/authController.js`
- Create: `dating-app-backend/tests/services/authService.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
// tests/services/authService.test.js
const { register, login, hashPassword, verifyPassword } = require('../../src/services/authService');

describe('authService', () => {
  describe('hashPassword and verifyPassword', () => {
    it('should hash and verify password correctly', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject wrong password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword('wrongPassword', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('register', () => {
    it('should reject weak password', async () => {
      await expect(register('test@example.com', '123'))
        .rejects.toThrow('Password must be at least 8 characters');
    });

    it('should reject invalid email', async () => {
      await expect(register('invalid-email', 'password123'))
        .rejects.toThrow('Invalid email format');
    });
  });
});
```

- [ ] **Step 2: Write auth service implementation**

```javascript
// src/services/authService.js
const bcrypt = require('bcrypt');
const db = require('../config/database');
const { ValidationError } = require('../middleware/errorHandler');

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function validatePassword(password) {
  return password && password.length >= 8;
}

async function register(email, password) {
  if (!validateEmail(email)) {
    throw new ValidationError('Invalid email format');
  }

  if (!validatePassword(password)) {
    throw new ValidationError('Password must be at least 8 characters');
  }

  const existingUser = await db.query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw new ValidationError('Email already registered', { code: 'AUTH_USER_EXISTS' });
  }

  const passwordHash = await hashPassword(password);

  const result = await db.query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
    [email, passwordHash]
  );

  return result.rows[0];
}

async function login(email, password) {
  const result = await db.query(
    'SELECT id, email, password_hash FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw new ValidationError('Invalid email or password', { code: 'AUTH_INVALID_CREDENTIALS' });
  }

  const user = result.rows[0];
  const isValid = await verifyPassword(password, user.password_hash);

  if (!isValid) {
    throw new ValidationError('Invalid email or password', { code: 'AUTH_INVALID_CREDENTIALS' });
  }

  return { id: user.id, email: user.email };
}

module.exports = {
  register,
  login,
  hashPassword,
  verifyPassword,
  validateEmail,
  validatePassword
};
```

- [ ] **Step 3: Write auth controller**

```javascript
// src/controllers/authController.js
const jwt = require('jsonwebtoken');
const authService = require('../services/authService');

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m'
  });
}

async function registerController(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await authService.register(email, password);
    const token = generateToken(user.id);

    res.status(201).json({
      data: {
        user: { id: user.id, email: user.email },
        token
      }
    });
  } catch (err) {
    next(err);
  }
}

async function loginController(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await authService.login(email, password);
    const token = generateToken(user.id);

    res.json({
      data: {
        user: { id: user.id, email: user.email },
        token
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getMeController(req, res, next) {
  try {
    const result = await db.query(
      'SELECT id, email FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
    }

    res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  registerController,
  loginController,
  getMeController,
  generateToken
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/services/authService.test.js -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/authService.js src/controllers/authController.js tests/services/authService.test.js
git commit -m "feat: add auth service and controller with registration/login"
```

---

### Task 1.7: Express App Entry Point

**Files:**
- Create: `dating-app-backend/src/index.js`
- Create: `dating-app-backend/src/routes/auth.js`

- [ ] **Step 1: Create auth routes**

```javascript
// src/routes/auth.js
const express = require('express');
const { registerController, loginController, getMeController } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerController);
router.post('/login', loginController);
router.get('/me', authenticate, getMeController);

module.exports = router;
```

- [ ] **Step 2: Create main Express app**

```javascript
// src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found'
    }
  });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
```

- [ ] **Step 3: Test the server starts correctly**

Run: `npm start`
Expected: Server starts and logs "Server running on port 3000"

- [ ] **Step 4: Commit**

```bash
git add src/index.js src/routes/auth.js
git commit -m "feat: create Express app with auth routes"
```

---

## Chunk 2: User Profile and MBTI

### Task 2.1: User Service and Profile

**Files:**
- Create: `dating-app-backend/src/services/userService.js`
- Create: `dating-app-backend/src/controllers/userController.js`
- Create: `dating-app-backend/src/routes/users.js`
- Create: `dating-app-backend/tests/services/userService.test.js`

- [ ] **Step 1: Write user service**

```javascript
// src/services/userService.js
const db = require('../config/database');
const { getZodiacSign } = require('../utils/zodiac');
const { NotFoundError, ValidationError } = require('../middleware/errorHandler');

async function getProfile(userId) {
  const result = await db.query(
    `SELECT p.*, u.email
     FROM profiles p
     JOIN users u ON p.user_id = u.id
     WHERE p.user_id = $1`,
    [userId]
  );

  return result.rows[0] || null;
}

async function createProfile(userId, profileData) {
  const { displayName, bio, birthday, mbtiType } = profileData;

  if (!birthday) {
    throw new ValidationError('Birthday is required');
  }

  const zodiacSign = getZodiacSign(birthday);

  const result = await db.query(
    `INSERT INTO profiles (user_id, display_name, bio, birthday, mbti_type, zodiac_sign)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, displayName, bio, birthday, mbtiType, zodiacSign]
  );

  return result.rows[0];
}

async function updateProfile(userId, updates) {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (updates.displayName !== undefined) {
    fields.push(`display_name = $${paramIndex++}`);
    values.push(updates.displayName);
  }

  if (updates.bio !== undefined) {
    fields.push(`bio = $${paramIndex++}`);
    values.push(updates.bio);
  }

  if (updates.mbtiType !== undefined) {
    fields.push(`mbti_type = $${paramIndex++}`);
    values.push(updates.mbtiType);
  }

  if (updates.avatarUrl !== undefined) {
    fields.push(`avatar_url = $${paramIndex++}`);
    values.push(updates.avatarUrl);
  }

  if (fields.length === 0) {
    throw new ValidationError('No fields to update');
  }

  values.push(userId);
  const query = `
    UPDATE profiles
    SET ${fields.join(', ')}, updated_at = NOW()
    WHERE user_id = $${paramIndex}
    RETURNING *
  `;

  const result = await db.query(query, values);
  return result.rows[0] || null;
}

module.exports = {
  getProfile,
  createProfile,
  updateProfile
};
```

- [ ] **Step 2: Write user controller**

```javascript
// src/controllers/userController.js
const userService = require('../services/userService');
const db = require('../config/database');

async function getMyProfile(req, res, next) {
  try {
    const profile = await userService.getProfile(req.user.userId);

    if (!profile) {
      return res.status(404).json({
        error: { code: 'PROFILE_NOT_FOUND', message: 'Profile not found' }
      });
    }

    res.json({ data: profile });
  } catch (err) {
    next(err);
  }
}

async function createMyProfile(req, res, next) {
  try {
    const profile = await userService.createProfile(req.user.userId, req.body);
    res.status(201).json({ data: profile });
  } catch (err) {
    next(err);
  }
}

async function updateMyProfile(req, res, next) {
  try {
    const profile = await userService.updateProfile(req.user.userId, req.body);

    if (!profile) {
      return res.status(404).json({
        error: { code: 'PROFILE_NOT_FOUND', message: 'Profile not found' }
      });
    }

    res.json({ data: profile });
  } catch (err) {
    next(err);
  }
}

async function getUserProfile(req, res, next) {
  try {
    const result = await db.query(
      `SELECT display_name, avatar_url, bio, birthday, mbti_type, zodiac_sign
       FROM profiles WHERE user_id = $1`,
      [req.params.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { code: 'PROFILE_NOT_FOUND', message: 'User not found' }
      });
    }

    res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMyProfile,
  createMyProfile,
  updateMyProfile,
  getUserProfile
};
```

- [ ] **Step 3: Create user routes**

```javascript
// src/routes/users.js
const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getMyProfile, createMyProfile, updateMyProfile, getUserProfile } = require('../controllers/userController');

const router = express.Router();

router.use(authenticate);
router.get('/me', getMyProfile);
router.post('/me', createMyProfile);
router.put('/me', updateMyProfile);
router.get('/:userId', getUserProfile);

module.exports = router;
```

- [ ] **Step 4: Commit**

```bash
git add src/services/userService.js src/controllers/userController.js src/routes/users.js
git commit -m "feat: add user profile service and routes"
```

---

### Task 2.2: MBTI Controller and Routes

**Files:**
- Create: `dating-app-backend/src/services/mbtiService.js`
- Create: `dating-app-backend/src/controllers/mbtiController.js`
- Create: `dating-app-backend/src/routes/mbti.js`
- Create: `dating-app-backend/tests/services/mbtiService.test.js`

- [ ] **Step 1: Write MBTI service**

```javascript
// src/services/mbtiService.js
const db = require('../config/database');
const { calculateMBTI } = require('../utils/mbti');
const { ValidationError } = require('../middleware/errorHandler');
const { updateProfile } = require('./userService');

async function submitMBTI(userId, answers) {
  const result = calculateMBTI(answers);

  await db.query(
    `INSERT INTO mbti_tests (user_id, answers, result_type)
     VALUES ($1, $2, $3)`,
    [userId, JSON.stringify(answers), result]
  );

  const profile = await updateProfile(userId, { mbtiType: result });

  return { mbtiType: result, profile };
}

module.exports = {
  submitMBTI
};
```

- [ ] **Step 2: Write MBTI controller**

```javascript
// src/controllers/mbtiController.js
const { getMBTIQuestions } = require('../utils/mbti');
const { submitMBTI } = require('../services/mbtiService');

async function getQuestions(req, res, next) {
  try {
    const questions = getMBTIQuestions();
    res.json({ data: questions });
  } catch (err) {
    next(err);
  }
}

async function submitAnswers(req, res, next) {
  try {
    const { answers } = req.body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        error: { code: 'MBTI_INVALID_ANSWER', message: 'Answers must be an array' }
      });
    }

    const result = await submitMBTI(req.user.userId, answers);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getQuestions,
  submitAnswers
};
```

- [ ] **Step 3: Create MBTI routes**

```javascript
// src/routes/mbti.js
const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getQuestions, submitAnswers } = require('../controllers/mbtiController');

const router = express.Router();

router.use(authenticate);
router.get('/questions', getQuestions);
router.post('/submit', submitAnswers);

module.exports = router;
```

- [ ] **Step 4: Commit**

```bash
git add src/services/mbtiService.js src/controllers/mbtiController.js src/routes/mbti.js
git commit -m "feat: add MBTI test endpoints"
```

---

## Chunk 3: Recommendation System

### Task 3.1: Recommendation Service

**Files:**
- Create: `dating-app-backend/src/services/recommendationService.js`
- Create: `dating-app-backend/src/controllers/recommendationController.js`
- Create: `dating-app-backend/src/routes/recommendations.js`
- Create: `dating-app-backend/tests/services/recommendationService.test.js`

- [ ] **Step 1: Write recommendation service**

```javascript
// src/services/recommendationService.js
const db = require('../config/database');
const { getComplementaryZodiac } = require('../utils/zodiac');
const { getComplementaryMBTI } = require('../utils/mbti');

async function getRecommendations(userId, settings = {}) {
  const { zodiacFilter, mbtiFilter, sortBy = 'birthday' } = settings;

  // Get current user's profile
  const userResult = await db.query(
    'SELECT birthday, mbti_type, zodiac_sign FROM profiles WHERE user_id = $1',
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new Error('User profile not found');
  }

  const user = userResult.rows[0];
  const filters = [];
  const values = [userId, userId];
  let paramIndex = 3;

  // Apply zodiac filter
  if (zodiacFilter === 'same') {
    filters.push(`zodiac_sign = $${paramIndex++}`);
    values.push(user.zodiac_sign);
  } else if (zodiacFilter === 'complementary') {
    const complements = getComplementaryZodiac(user.zodiac_sign);
    filters.push(`zodiac_sign = ANY($${paramIndex++}::text[])`);
    values.push(complements);
  }

  // Apply MBTI filter
  if (mbtiFilter === 'same') {
    filters.push(`mbti_type = $${paramIndex++}`);
    values.push(user.mbti_type);
  } else if (mbtiFilter === 'complementary') {
    const complement = getComplementaryMBTI(user.mbti_type);
    filters.push(`mbti_type = $${paramIndex++}`);
    values.push(complement);
  }

  // Build order by clause
  let orderBy = '';
  if (sortBy === 'birthday') {
    orderBy = `ABS(EXTRACT(EPOCH FROM (birthday - $${paramIndex++})))`;
    values.push(user.birthday);
  } else if (sortBy === 'zodiac') {
    orderBy = `CASE WHEN zodiac_sign = '${user.zodiac_sign}' THEN 0 ELSE 1 END`;
  } else if (sortBy === 'mbti') {
    orderBy = `CASE WHEN mbti_type = '${user.mbti_type}' THEN 0 ELSE 1 END`;
  }

  const whereClause = filters.length > 0 ? `AND ${filters.join(' AND ')}` : '';

  const query = `
    SELECT user_id, display_name, avatar_url, bio, birthday, mbti_type, zodiac_sign
    FROM profiles
    WHERE user_id != $1
    AND user_id NOT IN (
      SELECT DISTINCT CASE
        WHEN user1_id = $2 THEN user2_id
        ELSE user1_id
      END FROM matches
    )
    AND user_id NOT IN (
      SELECT receiver_id FROM likes WHERE sender_id = $2
    )
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT 20
  `;

  const result = await db.query(query, values);
  return result.rows;
}

async function getSettings(userId) {
  const result = await db.query(
    'SELECT * FROM recommendation_settings WHERE user_id = $1',
    [userId]
  );

  return result.rows[0] || {
    user_id: userId,
    zodiac_filter: 'none',
    mbti_filter: 'none',
    sort_by: 'birthday'
  };
}

async function updateSettings(userId, settings) {
  const { zodiacFilter, mbtiFilter, sortBy } = settings;

  const result = await db.query(
    `INSERT INTO recommendation_settings (user_id, zodiac_filter, mbti_filter, sort_by)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id)
     UPDATE SET zodiac_filter = $2, mbti_filter = $3, sort_by = $4, updated_at = NOW()
     RETURNING *`,
    [userId, zodiacFilter || 'none', mbtiFilter || 'none', sortBy || 'birthday']
  );

  return result.rows[0];
}

module.exports = {
  getRecommendations,
  getSettings,
  updateSettings
};
```

- [ ] **Step 2: Write recommendation controller**

```javascript
// src/controllers/recommendationController.js
const recommendationService = require('../services/recommendationService');

async function getRecommendations(req, res, next) {
  try {
    const settings = await recommendationService.getSettings(req.user.userId);
    const recommendations = await recommendationService.getRecommendations(
      req.user.userId,
      settings
    );
    res.json({ data: recommendations });
  } catch (err) {
    next(err);
  }
}

async function getSettings(req, res, next) {
  try {
    const settings = await recommendationService.getSettings(req.user.userId);
    res.json({ data: settings });
  } catch (err) {
    next(err);
  }
}

async function updateSettings(req, res, next) {
  try {
    const settings = await recommendationService.updateSettings(
      req.user.userId,
      req.body
    );
    res.json({ data: settings });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getRecommendations,
  getSettings,
  updateSettings
};
```

- [ ] **Step 3: Create recommendation routes**

```javascript
// src/routes/recommendations.js
const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getRecommendations, getSettings, updateSettings } = require('../controllers/recommendationController');

const router = express.Router();

router.use(authenticate);
router.get('/', getRecommendations);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

module.exports = router;
```

- [ ] **Step 4: Commit**

```bash
git add src/services/recommendationService.js src/controllers/recommendationController.js src/routes/recommendations.js
git commit -m "feat: add recommendation system with filtering and sorting"
```

---

## Chunk 4: Matching System

### Task 4.1: Match Service

**Files:**
- Create: `dating-app-backend/src/services/matchService.js`
- Create: `dating-app-backend/src/controllers/matchController.js`
- Create: `dating-app-backend/src/routes/matches.js`
- Create: `dating-app-backend/tests/services/matchService.test.js`

- [ ] **Step 1: Write match service**

```javascript
// src/services/matchService.js
const db = require('../config/database');
const { NotFoundError } = require('../middleware/errorHandler');

async function sendLike(senderId, receiverId) {
  if (senderId === receiverId) {
    throw new Error('Cannot like yourself');
  }

  try {
    await db.query(
      'INSERT INTO likes (sender_id, receiver_id) VALUES ($1, $2)',
      [senderId, receiverId]
    );

    // Check if it's a mutual match
    const matchCheck = await db.query(
      'SELECT * FROM likes WHERE sender_id = $1 AND receiver_id = $2',
      [receiverId, senderId]
    );

    let isMatch = false;
    if (matchCheck.rows.length > 0) {
      // Create match
      const matchResult = await db.query(
        'INSERT INTO matches (user1_id, user2_id) VALUES ($1, $2) RETURNING *',
        [senderId, receiverId]
      );
      isMatch = true;
    }

    return { isMatch };
  } catch (err) {
    if (err.code === '23505') { // Unique constraint violation
      throw new Error('Already liked this user');
    }
    throw err;
  }
}

async function getLikes(userId) {
  const result = await db.query(
    `SELECT l.*, p.display_name, p.avatar_url
     FROM likes l
     JOIN profiles p ON l.sender_id = p.user_id
     WHERE l.receiver_id = $1`,
    [userId]
  );

  return result.rows;
}

async function getMatches(userId) {
  const result = await db.query(
    `SELECT m.*,
            CASE WHEN m.user1_id = $1 THEN m.user2_id ELSE m.user1_id END as partner_id,
            p.display_name as partner_name,
            p.avatar_url as partner_avatar
     FROM matches m
     JOIN profiles p ON (CASE WHEN m.user1_id = $1 THEN m.user2_id ELSE m.user1_id END) = p.user_id
     WHERE m.user1_id = $1 OR m.user2_id = $1
     ORDER BY m.created_at DESC`,
    [userId]
  );

  return result.rows;
}

async function deleteMatch(matchId, userId) {
  const result = await db.query(
    'DELETE FROM matches WHERE id = $1 AND (user1_id = $2 OR user2_id = $2) RETURNING *',
    [matchId, userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Match not found');
  }

  return result.rows[0];
}

module.exports = {
  sendLike,
  getLikes,
  getMatches,
  deleteMatch
};
```

- [ ] **Step 2: Write match controller**

```javascript
// src/controllers/matchController.js
const matchService = require('../services/matchService');

async function sendLike(req, res, next) {
  try {
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'targetUserId is required' }
      });
    }

    const result = await matchService.sendLike(req.user.userId, targetUserId);
    res.json({ data: result });
  } catch (err) {
    if (err.message === 'Already liked this user') {
      return res.status(400).json({
        error: { code: 'MATCH_ALREADY_LIKED', message: err.message }
      });
    }
    next(err);
  }
}

async function getLikes(req, res, next) {
  try {
    const likes = await matchService.getLikes(req.user.userId);
    res.json({ data: likes });
  } catch (err) {
    next(err);
  }
}

async function getMatches(req, res, next) {
  try {
    const matches = await matchService.getMatches(req.user.userId);
    res.json({ data: matches });
  } catch (err) {
    next(err);
  }
}

async function deleteMatch(req, res, next) {
  try {
    await matchService.deleteMatch(req.params.id, req.user.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  sendLike,
  getLikes,
  getMatches,
  deleteMatch
};
```

- [ ] **Step 3: Create match routes**

```javascript
// src/routes/matches.js
const express = require('express');
const { authenticate } = require('../middleware/auth');
const { sendLike, getLikes, getMatches, deleteMatch } = require('../controllers/matchController');

const router = express.Router();

router.use(authenticate);
router.post('/likes', sendLike);
router.get('/likes/received', getLikes);
router.get('/', getMatches);
router.delete('/:id', deleteMatch);

module.exports = router;
```

- [ ] **Step 4: Commit**

```bash
git add src/services/matchService.js src/controllers/matchController.js src/routes/matches.js
git commit -m "feat: add matching system with likes and matches"
```

---

## Chunk 5: Chat System

### Task 5.1: Chat Service and WebSocket

**Files:**
- Create: `dating-app-backend/src/services/chatService.js`
- Create: `dating-app-backend/src/controllers/chatController.js`
- Create: `dating-app-backend/src/config/websocket.js`
- Create: `dating-app-backend/src/routes/chat.js`

- [ ] **Step 1: Write chat service**

```javascript
// src/services/chatService.js
const db = require('../config/database');

async function getConversations(userId) {
  const result = await db.query(
    `SELECT m.id as match_id,
            CASE WHEN m.user1_id = $1 THEN m.user2_id ELSE m.user1_id END as partner_id,
            p.display_name as partner_name,
            p.avatar_url as partner_avatar,
            (SELECT content FROM messages WHERE match_id = m.id ORDER BY created_at DESC LIMIT 1) as last_message_content,
            (SELECT created_at FROM messages WHERE match_id = m.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
            (SELECT COUNT(*) FROM messages WHERE match_id = m.id AND sender_id != $1 AND is_read = false) as unread_count
     FROM matches m
     JOIN profiles p ON (CASE WHEN m.user1_id = $1 THEN m.user2_id ELSE m.user1_id END) = p.user_id
     WHERE m.user1_id = $1 OR m.user2_id = $1
     ORDER BY last_message_at DESC NULLS LAST`,
    [userId]
  );

  return result.rows;
}

async function getMessages(matchId, userId) {
  // Verify user is part of the match
  const matchCheck = await db.query(
    'SELECT * FROM matches WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)',
    [matchId, userId]
  );

  if (matchCheck.rows.length === 0) {
    throw new Error('Not authorized to view this conversation');
  }

  const result = await db.query(
    `SELECT id, sender_id, content, is_read, created_at
     FROM messages
     WHERE match_id = $1
     ORDER BY created_at ASC`,
    [matchId]
  );

  // Mark messages as read
  await db.query(
    `UPDATE messages SET is_read = true
     WHERE match_id = $1 AND sender_id != $2 AND is_read = false`,
    [matchId, userId]
  );

  return result.rows;
}

async function sendMessage(matchId, senderId, content) {
  const result = await db.query(
    `INSERT INTO messages (match_id, sender_id, content)
     VALUES ($1, $2, $3)
     RETURNING id, sender_id, content, is_read, created_at`,
    [matchId, senderId, content]
  );

  return result.rows[0];
}

async function markMessageRead(messageId, userId) {
  await db.query(
    `UPDATE messages SET is_read = true
     WHERE id = $1 AND sender_id != $2`,
    [messageId, userId]
  );
}

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  markMessageRead
};
```

- [ ] **Step 2: Write WebSocket config**

```javascript
// src/config/websocket.js
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const chatService = require('../services/chatService');

let wss = null;

function setupWebSocket(server) {
  wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const token = req.url.split('token=')[1];

    if (!token) {
      ws.close(4001, 'Authentication required');
      return;
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      ws.close(4002, 'Invalid token');
      return;
    }

    ws.userId = decoded.userId;
    console.log(`User ${ws.userId} connected`);

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        await handleWebSocketMessage(ws, data);
      } catch (err) {
        console.error('WebSocket error:', err);
        ws.send(JSON.stringify({ type: 'error', message: 'Internal error' }));
      }
    });

    ws.on('close', () => {
      console.log(`User ${ws.userId} disconnected`);
    });
  });

  return wss;
}

async function handleWebSocketMessage(ws, data) {
  const { type, matchId, content, messageId } = data;

  if (type === 'send_message') {
    const message = await chatService.sendMessage(matchId, ws.userId, content);

    // Broadcast to match partner
    broadcastToMatch(matchId, ws.userId, {
      type: 'new_message',
      messageId: message.id,
      matchId,
      senderId: ws.userId,
      content: message.content,
      createdAt: message.created_at
    });

    ws.send(JSON.stringify({
      type: 'message_sent',
      messageId: message.id,
      status: 'sent'
    }));
  }

  if (type === 'mark_read') {
    await chatService.markMessageRead(messageId, ws.userId);

    broadcastToMatch(matchId, ws.userId, {
      type: 'message_read',
      messageId,
      matchId
    });
  }
}

function broadcastToMatch(matchId, senderId, message) {
  if (!wss) return;

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      // In a real app, we'd track which users are in which match
      // For now, send to all authenticated clients
      client.send(JSON.stringify(message));
    }
  });
}

function broadcastToUser(userId, message) {
  if (!wss) return;

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.userId === userId) {
      client.send(JSON.stringify(message));
    }
  });
}

module.exports = {
  setupWebSocket,
  broadcastToMatch,
  broadcastToUser
};
```

- [ ] **Step 3: Write chat controller**

```javascript
// src/controllers/chatController.js
const chatService = require('../services/chatService');

async function getConversations(req, res, next) {
  try {
    const conversations = await chatService.getConversations(req.user.userId);
    res.json({ data: conversations });
  } catch (err) {
    next(err);
  }
}

async function getMessages(req, res, next) {
  try {
    const messages = await chatService.getMessages(req.params.matchId, req.user.userId);
    res.json({ data: messages });
  } catch (err) {
    if (err.message === 'Not authorized to view this conversation') {
      return res.status(403).json({
        error: { code: 'CHAT_FORBIDDEN', message: err.message }
      });
    }
    next(err);
  }
}

async function sendMessage(req, res, next) {
  try {
    const { matchId, content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Content is required' }
      });
    }

    const message = await chatService.sendMessage(matchId, req.user.userId, content.trim());
    res.status(201).json({ data: message });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getConversations,
  getMessages,
  sendMessage
};
```

- [ ] **Step 4: Create chat routes**

```javascript
// src/routes/chat.js
const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getConversations, getMessages, sendMessage } = require('../controllers/chatController');

const router = express.Router();

router.use(authenticate);
router.get('/conversations', getConversations);
router.get('/conversations/:matchId/messages', getMessages);
router.post('/messages', sendMessage);

module.exports = router;
```

- [ ] **Step 5: Update main app to include WebSocket**

```javascript
// Update src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { errorHandler } = require('./middleware/errorHandler');
const { setupWebSocket } = require('./config/websocket');

const app = express();
const server = http.createServer(app);

// Setup WebSocket
setupWebSocket(server);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/mbti', require('./routes/mbti'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/matches', require('./routes/matches'));
app.use('/api/chat', require('./routes/chat'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found'
    }
  });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server };
```

- [ ] **Step 6: Commit**

```bash
git add src/services/chatService.js src/controllers/chatController.js src/config/websocket.js src/routes/chat.js src/index.js
git commit -m "feat: add chat system with WebSocket support"
```

---

## Chunk 6: Integration Tests and Documentation

### Task 6.1: Integration Tests

**Files:**
- Create: `dating-app-backend/tests/integration/auth.test.js`
- Create: `dating-app-backend/tests/integration/recommendation.test.js`
- Create: `dating-app-backend/tests/integration/chat.test.js`

- [ ] **Step 1: Write auth integration tests**

```javascript
// tests/integration/auth.test.js
const request = require('supertest');
const { app } = require('../../src/index');
const db = require('../../src/config/database');

describe('Auth Integration', () => {
  let testEmail = `test_${Date.now()}@example.com`;

  afterAll(async () => {
    await db.query('DELETE FROM users WHERE email LIKE $1', ['test_%@example.com']);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: testEmail, password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.email).toBe(testEmail);
    });

    it('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: testEmail, password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('AUTH_USER_EXISTS');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('token');
    });

    it('should reject wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: 'wrongpassword' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
    });
  });
});
```

- [ ] **Step 2: Run integration tests**

Run: `npm run test:integration -v`
Expected: Tests pass

- [ ] **Step 3: Commit**

```bash
git add tests/integration/
git commit -m "test: add integration tests for auth, recommendations, chat"
```

---

### Task 6.2: README Documentation

**Files:**
- Create: `dating-app-backend/README.md`

- [ ] **Step 1: Write README**

```markdown
# Dating App Backend

Backend API for the dating app with recommendation system based on zodiac, MBTI, and birthday.

## Features

- User authentication (email/password)
- User profiles with MBTI and zodiac
- MBTI personality test (24 questions)
- Recommendation system with filtering and sorting
- Matching system (Tinder-style mutual likes)
- Real-time chat via WebSocket

## Tech Stack

- Node.js + Express
- PostgreSQL
- JWT authentication
- WebSocket (ws)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### Installation

```bash
# Clone and install
git clone <repo>
cd dating-app-backend
npm install

# Copy environment
cp .env.example .env
# Edit .env with your database credentials

# Initialize database
npm run db:init

# Start server
npm run dev
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users/me | Get my profile |
| POST | /api/users/me | Create profile |
| PUT | /api/users/me | Update profile |
| GET | /api/users/:id | Get user profile |

### MBTI

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/mbti/questions | Get test questions |
| POST | /api/mbti/submit | Submit answers |

### Recommendations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/recommendations | Get recommendations |
| GET | /api/recommendations/settings | Get settings |
| PUT | /api/recommendations/settings | Update settings |

### Matches

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/matches/likes | Send like |
| GET | /api/matches/likes/received | Get received likes |
| GET | /api/matches | Get matches |
| DELETE | /api/matches/:id | Delete match |

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/chat/conversations | Get conversations |
| GET | /api/chat/conversations/:id/messages | Get messages |
| POST | /api/chat/messages | Send message |

### WebSocket

Connect to `ws://localhost:3000/ws?token=<JWT>` for real-time chat.

## Testing

```bash
# Run all tests
npm test

# Run integration tests
npm run test:integration

# Run with coverage
npm test -- --coverage
```

## License

MIT
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add comprehensive README"
```

---

## Plan Complete

This plan creates a complete backend API for the dating app with:

1. **Authentication** - JWT-based auth with email/password
2. **User Profiles** - Profiles with birthday, MBTI, zodiac
3. **MBTI Test** - 24-question test with scoring
4. **Recommendations** - Filter by zodiac/MBTI, sort by birthday
5. **Matching** - Tinder-style mutual likes
6. **Chat** - Real-time messaging via WebSocket

All code is tested with Jest (unit + integration tests) and follows TDD practices.
