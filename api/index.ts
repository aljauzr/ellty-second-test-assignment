import express from 'express';
import cors from 'cors';
import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Types
type OperationType = 'add' | 'subtract' | 'multiply' | 'divide';

interface CalculationNode {
  id: string;
  userId: string;
  username: string;
  parentId: string | null;
  operation: OperationType | null;
  operand: number;
  result: number;
  createdAt: string;
  children?: CalculationNode[];
}

// Database
const db = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Initialize database
async function initDb() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS calculations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      parent_id TEXT,
      operation TEXT,
      operand REAL NOT NULL,
      result REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// Helpers
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function generateToken(userId: string, username: string): string {
  return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token: string): { userId: string; username: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
  } catch {
    return null;
  }
}

function calculate(left: number, op: OperationType, right: number): number {
  switch (op) {
    case 'add': return left + right;
    case 'subtract': return left - right;
    case 'multiply': return left * right;
    case 'divide': return right === 0 ? NaN : left / right;
  }
}

// Express app
const app = express();
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    await initDb();
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const id = generateId();
    const passwordHash = await bcrypt.hash(password, 10);

    try {
      await db.execute({
        sql: 'INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)',
        args: [id, username, passwordHash],
      });
    } catch (e) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const token = generateToken(id, username);
    res.status(201).json({ token, user: { id, username } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    await initDb();
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const result = await db.execute({
      sql: 'SELECT id, username, password_hash FROM users WHERE username = ?',
      args: [username],
    });

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash as string);
    
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id as string, user.username as string);
    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(authHeader.substring(7));
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.json({ id: decoded.userId, username: decoded.username });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Calculations routes
app.get('/api/calculations', async (req, res) => {
  try {
    await initDb();
    const result = await db.execute(`
      SELECT c.id, c.user_id, u.username, c.parent_id, c.operation, c.operand, c.result, c.created_at
      FROM calculations c
      JOIN users u ON c.user_id = u.id
      ORDER BY c.created_at ASC
    `);

    const nodes: CalculationNode[] = result.rows.map((row) => ({
      id: row.id as string,
      userId: row.user_id as string,
      username: row.username as string,
      parentId: row.parent_id as string | null,
      operation: row.operation as OperationType | null,
      operand: row.operand as number,
      result: row.result as number,
      createdAt: row.created_at as string,
    }));

    // Build tree
    const nodeMap = new Map<string, CalculationNode>();
    const roots: CalculationNode[] = [];

    nodes.forEach((node) => nodeMap.set(node.id, { ...node, children: [] }));
    nodes.forEach((node) => {
      const current = nodeMap.get(node.id)!;
      if (node.parentId === null) {
        roots.push(current);
      } else {
        const parent = nodeMap.get(node.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(current);
        }
      }
    });

    res.json(roots);
  } catch (error) {
    console.error('Get calculations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/calculations/start', async (req, res) => {
  try {
    await initDb();
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(authHeader.substring(7));
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { number } = req.body;
    if (typeof number !== 'number' || isNaN(number)) {
      return res.status(400).json({ error: 'A valid number is required' });
    }

    const id = generateId();
    await db.execute({
      sql: 'INSERT INTO calculations (id, user_id, parent_id, operation, operand, result) VALUES (?, ?, NULL, NULL, ?, ?)',
      args: [id, decoded.userId, number, number],
    });

    res.status(201).json({
      id,
      userId: decoded.userId,
      username: decoded.username,
      parentId: null,
      operation: null,
      operand: number,
      result: number,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Start error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/calculations/operate', async (req, res) => {
  try {
    await initDb();
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(authHeader.substring(7));
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { parentId, operation, operand } = req.body;
    
    if (!parentId) {
      return res.status(400).json({ error: 'parentId is required' });
    }
    if (!['add', 'subtract', 'multiply', 'divide'].includes(operation)) {
      return res.status(400).json({ error: 'Valid operation required' });
    }
    if (typeof operand !== 'number' || isNaN(operand)) {
      return res.status(400).json({ error: 'A valid operand is required' });
    }
    if (operation === 'divide' && operand === 0) {
      return res.status(400).json({ error: 'Division by zero not allowed' });
    }

    const parentResult = await db.execute({
      sql: 'SELECT result FROM calculations WHERE id = ?',
      args: [parentId],
    });

    if (parentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    const parentValue = parentResult.rows[0].result as number;
    const result = calculate(parentValue, operation, operand);
    const id = generateId();

    await db.execute({
      sql: 'INSERT INTO calculations (id, user_id, parent_id, operation, operand, result) VALUES (?, ?, ?, ?, ?, ?)',
      args: [id, decoded.userId, parentId, operation, operand, result],
    });

    res.status(201).json({
      id,
      userId: decoded.userId,
      username: decoded.username,
      parentId,
      operation,
      operand,
      result,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Operate error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default app;
