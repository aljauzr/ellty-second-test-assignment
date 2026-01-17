import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { User } from '../types';

export class UserService {
  static async createUser(username: string, password: string): Promise<User | null> {
    try {
      const id = uuidv4();
      const passwordHash = await bcrypt.hash(password, 10);
      
      const stmt = db.prepare(`
        INSERT INTO users (id, username, password_hash)
        VALUES (?, ?, ?)
      `);
      
      stmt.run(id, username, passwordHash);
      
      return {
        id,
        username,
        passwordHash,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      // Username already exists or other error
      return null;
    }
  }

  static async findByUsername(username: string): Promise<User | null> {
    const stmt = db.prepare(`
      SELECT id, username, password_hash as passwordHash, created_at as createdAt
      FROM users WHERE username = ?
    `);
    
    const row = stmt.get(username) as User | undefined;
    return row || null;
  }

  static async findById(id: string): Promise<User | null> {
    const stmt = db.prepare(`
      SELECT id, username, password_hash as passwordHash, created_at as createdAt
      FROM users WHERE id = ?
    `);
    
    const row = stmt.get(id) as User | undefined;
    return row || null;
  }

  static async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }
}
