// User type
export interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}

// Operation types
export type OperationType = 'add' | 'subtract' | 'multiply' | 'divide';

// Calculation node
export interface CalculationNode {
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
