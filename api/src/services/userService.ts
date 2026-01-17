import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';
import { User } from '../types.js';

// Generate UUID without external dependency
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export class UserService {
  static async createUser(username: string, password: string): Promise<User | null> {
    try {
      const id = generateId();
      const passwordHash = await bcrypt.hash(password, 10);
      
      await db.execute({
        sql: 'INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)',
        args: [id, username, passwordHash]
      });
      
      return {
        id,
        username,
        passwordHash,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Create user error:', error);
      return null;
    }
  }

  static async findByUsername(username: string): Promise<User | null> {
    const result = await db.execute({
      sql: 'SELECT id, username, password_hash as passwordHash, created_at as createdAt FROM users WHERE username = ?',
      args: [username]
    });
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
      id: row.id as string,
      username: row.username as string,
      passwordHash: row.passwordHash as string,
      createdAt: row.createdAt as string
    };
  }

  static async findById(id: string): Promise<User | null> {
    const result = await db.execute({
      sql: 'SELECT id, username, password_hash as passwordHash, created_at as createdAt FROM users WHERE id = ?',
      args: [id]
    });
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
      id: row.id as string,
      username: row.username as string,
      passwordHash: row.passwordHash as string,
      createdAt: row.createdAt as string
    };
  }

  static async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }
}
