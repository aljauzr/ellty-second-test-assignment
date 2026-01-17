// Types shared between frontend and backend

export type OperationType = 'add' | 'subtract' | 'multiply' | 'divide';

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

export interface User {
  id: string;
  username: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  error: string;
}
