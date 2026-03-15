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
