# Number Discussions

A full-stack application where people communicate through numbers instead of text. Users can start "discussions" by posting a starting number, and others can respond by applying mathematical operations (add, subtract, multiply, divide) to create chains of calculations - similar to comment trees in social networks.

## Features

- **View Discussions**: Anyone can view all calculation trees
- **User Registration**: Create an account with username and password
- **Authentication**: Login to access posting features
- **Start Discussions**: Registered users can start a new chain with any number
- **Respond with Operations**: Apply mathematical operations to any existing number
- **Tree Structure**: Calculations form nested trees similar to comment threads

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, SQLite
- **Frontend**: React, TypeScript
- **Containerization**: Docker, Docker Compose

## Prerequisites

- [Docker](https://www.docker.com/get-started) and Docker Compose
- OR Node.js 18+ and npm (for local development)

## Running with Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/number-discussions.git
   cd number-discussions
   ```

2. **Start the application**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

4. **Stop the application**
   ```bash
   docker-compose down
   ```

## Local Development (Without Docker)

### Backend

```bash
cd backend
npm install
npm run dev
```

The backend will start on http://localhost:3001

### Frontend

```bash
cd frontend
npm install
npm start
```

The frontend will start on http://localhost:3000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user info (requires auth)

### Calculations
- `GET /api/calculations` - Get all calculations as tree structure
- `GET /api/calculations/flat` - Get all calculations as flat list
- `GET /api/calculations/:id` - Get a single calculation
- `POST /api/calculations/start` - Create a starting number (requires auth)
- `POST /api/calculations/operate` - Add an operation (requires auth)

## Running Tests

```bash
cd backend
npm test
```

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── middleware/     # Auth middleware
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── database.ts     # SQLite setup
│   │   ├── index.ts        # Express app
│   │   └── types.ts        # TypeScript types
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── App.tsx         # Main app
│   │   ├── api.ts          # API client
│   │   ├── AuthContext.tsx # Auth state management
│   │   └── types.ts        # TypeScript types
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Example Usage

1. **Register** a new account
2. **Start a discussion** by entering a number (e.g., 42)
3. **Reply** to any number by selecting an operation and a second number
   - Example: 42 + 8 = 50
4. **Build chains** by replying to results
   - 50 × 2 = 100
   - 100 ÷ 4 = 25
   - etc.

## Security Notes

- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- In production, change the JWT_SECRET environment variable