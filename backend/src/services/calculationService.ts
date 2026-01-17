import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { CalculationNode, OperationType } from '../types';

interface DbCalculation {
  id: string;
  user_id: string;
  username: string;
  parent_id: string | null;
  operation: OperationType | null;
  operand: number;
  result: number;
  created_at: string;
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
  static createStartingNumber(userId: string, number: number): CalculationNode {
    const id = uuidv4();
    
    const stmt = db.prepare(`
      INSERT INTO calculations (id, user_id, parent_id, operation, operand, result)
      VALUES (?, ?, NULL, NULL, ?, ?)
    `);
    
    stmt.run(id, userId, number, number);
    
    // Get username
    const userStmt = db.prepare('SELECT username FROM users WHERE id = ?');
    const user = userStmt.get(userId) as { username: string };
    
    return {
      id,
      userId,
      username: user.username,
      parentId: null,
      operation: null,
      operand: number,
      result: number,
      createdAt: new Date().toISOString()
    };
  }

  // Add an operation to an existing calculation
  static addOperation(
    userId: string,
    parentId: string,
    operation: OperationType,
    operand: number
  ): CalculationNode | null {
    // Get parent calculation
    const parentStmt = db.prepare('SELECT result FROM calculations WHERE id = ?');
    const parent = parentStmt.get(parentId) as { result: number } | undefined;
    
    if (!parent) {
      return null;
    }

    const result = this.calculate(parent.result, operation, operand);
    const id = uuidv4();
    
    const insertStmt = db.prepare(`
      INSERT INTO calculations (id, user_id, parent_id, operation, operand, result)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    insertStmt.run(id, userId, parentId, operation, operand, result);
    
    // Get username
    const userStmt = db.prepare('SELECT username FROM users WHERE id = ?');
    const user = userStmt.get(userId) as { username: string };
    
    return {
      id,
      userId,
      username: user.username,
      parentId,
      operation,
      operand,
      result,
      createdAt: new Date().toISOString()
    };
  }

  // Get all calculations as a flat list
  static getAllCalculations(): CalculationNode[] {
    const stmt = db.prepare(`
      SELECT c.id, c.user_id, u.username, c.parent_id, c.operation, c.operand, c.result, c.created_at
      FROM calculations c
      JOIN users u ON c.user_id = u.id
      ORDER BY c.created_at ASC
    `);
    
    const rows = stmt.all() as DbCalculation[];
    
    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      username: row.username,
      parentId: row.parent_id,
      operation: row.operation,
      operand: row.operand,
      result: row.result,
      createdAt: row.created_at
    }));
  }

  // Get calculations as tree structure
  static getCalculationTrees(): CalculationNode[] {
    const allNodes = this.getAllCalculations();
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
  static getCalculationById(id: string): CalculationNode | null {
    const stmt = db.prepare(`
      SELECT c.id, c.user_id, u.username, c.parent_id, c.operation, c.operand, c.result, c.created_at
      FROM calculations c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `);
    
    const row = stmt.get(id) as DbCalculation | undefined;
    
    if (!row) return null;
    
    return {
      id: row.id,
      userId: row.user_id,
      username: row.username,
      parentId: row.parent_id,
      operation: row.operation,
      operand: row.operand,
      result: row.result,
      createdAt: row.created_at
    };
  }
}
