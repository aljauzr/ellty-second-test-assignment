// User type
export interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}

// Operation types
export type OperationType = 'add' | 'subtract' | 'multiply' | 'divide';

// Calculation node - represents a number in the discussion tree
export interface CalculationNode {
  id: string;
  userId: string;
  username: string;
  parentId: string | null; // null means it's a starting number
  operation: OperationType | null; // null for starting numbers
  operand: number; // the right operand for operations, or the starting number
  result: number; // the computed result
  createdAt: string;
  children?: CalculationNode[]; // for tree representation
}

// API Request/Response types
export interface RegisterRequest {
  username: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
  };
}

export interface CreateStartingNumberRequest {
  number: number;
}

export interface CreateOperationRequest {
  parentId: string;
  operation: OperationType;
  operand: number;
}

export interface ApiError {
  error: string;
}
