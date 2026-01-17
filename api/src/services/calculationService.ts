import db from '../database.js';
import { CalculationNode, OperationType } from '../types.js';

// Generate UUID
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export class CalculationService {
  // Perform the calculation based on operation type
  static calculate(leftOperand: number, operation: OperationType, rightOperand: number): number {
    switch (operation) {
      case 'add':
        return leftOperand + rightOperand;
      case 'subtract':
        return leftOperand - rightOperand;
      case 'multiply':
        return leftOperand * rightOperand;
      case 'divide':
        if (rightOperand === 0) {
          throw new Error('Division by zero is not allowed');
        }
        return leftOperand / rightOperand;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  // Create a starting number (root node)
  static async createStartingNumber(userId: string, number: number): Promise<CalculationNode> {
    const id = generateId();
    
    await db.execute({
      sql: 'INSERT INTO calculations (id, user_id, parent_id, operation, operand, result) VALUES (?, ?, NULL, NULL, ?, ?)',
      args: [id, userId, number, number]
    });
    
    // Get username
    const userResult = await db.execute({
      sql: 'SELECT username FROM users WHERE id = ?',
      args: [userId]
    });
    const username = userResult.rows[0]?.username as string;
    
    return {
      id,
      userId,
      username,
      parentId: null,
      operation: null,
      operand: number,
      result: number,
      createdAt: new Date().toISOString()
    };
  }

  // Add an operation to an existing calculation
  static async addOperation(
    userId: string,
    parentId: string,
    operation: OperationType,
    operand: number
  ): Promise<CalculationNode | null> {
    // Get parent calculation
    const parentResult = await db.execute({
      sql: 'SELECT result FROM calculations WHERE id = ?',
      args: [parentId]
    });
    
    if (parentResult.rows.length === 0) {
      return null;
    }

    const parentResultValue = parentResult.rows[0].result as number;
    const result = this.calculate(parentResultValue, operation, operand);
    const id = generateId();
    
    await db.execute({
      sql: 'INSERT INTO calculations (id, user_id, parent_id, operation, operand, result) VALUES (?, ?, ?, ?, ?, ?)',
      args: [id, userId, parentId, operation, operand, result]
    });
    
    // Get username
    const userResult = await db.execute({
      sql: 'SELECT username FROM users WHERE id = ?',
      args: [userId]
    });
    const username = userResult.rows[0]?.username as string;
    
    return {
      id,
      userId,
      username,
      parentId,
      operation,
      operand,
      result,
      createdAt: new Date().toISOString()
    };
  }

  // Get all calculations as a flat list
  static async getAllCalculations(): Promise<CalculationNode[]> {
    const result = await db.execute(`
      SELECT c.id, c.user_id, u.username, c.parent_id, c.operation, c.operand, c.result, c.created_at
      FROM calculations c
      JOIN users u ON c.user_id = u.id
      ORDER BY c.created_at ASC
    `);
    
    return result.rows.map(row => ({
      id: row.id as string,
      userId: row.user_id as string,
      username: row.username as string,
      parentId: row.parent_id as string | null,
      operation: row.operation as OperationType | null,
      operand: row.operand as number,
      result: row.result as number,
      createdAt: row.created_at as string
    }));
  }

  // Get calculations as tree structure
  static async getCalculationTrees(): Promise<CalculationNode[]> {
    const allNodes = await this.getAllCalculations();
    const nodeMap = new Map<string, CalculationNode>();
    const roots: CalculationNode[] = [];

    // Create map of all nodes
    allNodes.forEach(node => {
      nodeMap.set(node.id, { ...node, children: [] });
    });

    // Build tree structure
    allNodes.forEach(node => {
      const currentNode = nodeMap.get(node.id)!;
      if (node.parentId === null) {
        roots.push(currentNode);
      } else {
        const parent = nodeMap.get(node.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(currentNode);
        }
      }
    });

    return roots;
  }

  // Get a single calculation by ID
  static async getCalculationById(id: string): Promise<CalculationNode | null> {
    const result = await db.execute({
      sql: `SELECT c.id, c.user_id, u.username, c.parent_id, c.operation, c.operand, c.result, c.created_at
            FROM calculations c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = ?`,
      args: [id]
    });
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
      id: row.id as string,
      userId: row.user_id as string,
      username: row.username as string,
      parentId: row.parent_id as string | null,
      operation: row.operation as OperationType | null,
      operand: row.operand as number,
      result: row.result as number,
      createdAt: row.created_at as string
    };
  }
}
