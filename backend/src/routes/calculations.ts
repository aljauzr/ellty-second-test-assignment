import { Router, Response } from 'express';
import { CalculationService } from '../services/calculationService';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { CreateStartingNumberRequest, CreateOperationRequest, OperationType } from '../types';

const router = Router();

const validOperations: OperationType[] = ['add', 'subtract', 'multiply', 'divide'];

// Get all calculations as tree (public endpoint)
router.get('/', (req, res: Response) => {
  try {
    const trees = CalculationService.getCalculationTrees();
    res.json(trees);
  } catch (error) {
    console.error('Get calculations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all calculations as flat list (public endpoint)
router.get('/flat', (req, res: Response) => {
  try {
    const calculations = CalculationService.getAllCalculations();
    res.json(calculations);
  } catch (error) {
    console.error('Get calculations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a single calculation by ID (public endpoint)
router.get('/:id', (req, res: Response) => {
  try {
    const calculation = CalculationService.getCalculationById(req.params.id);
    
    if (!calculation) {
      res.status(404).json({ error: 'Calculation not found' });
      return;
    }
    
    res.json(calculation);
  } catch (error) {
    console.error('Get calculation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a starting number (authenticated)
router.post('/start', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { number } = req.body as CreateStartingNumberRequest;
    
    if (typeof number !== 'number' || isNaN(number)) {
      res.status(400).json({ error: 'A valid number is required' });
      return;
    }

    const calculation = CalculationService.createStartingNumber(req.userId!, number);
    res.status(201).json(calculation);
  } catch (error) {
    console.error('Create starting number error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add an operation to existing calculation (authenticated)
router.post('/operate', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { parentId, operation, operand } = req.body as CreateOperationRequest;
    
    // Validation
    if (!parentId) {
      res.status(400).json({ error: 'parentId is required' });
      return;
    }
    
    if (!operation || !validOperations.includes(operation)) {
      res.status(400).json({ error: 'Valid operation is required (add, subtract, multiply, divide)' });
      return;
    }
    
    if (typeof operand !== 'number' || isNaN(operand)) {
      res.status(400).json({ error: 'A valid operand number is required' });
      return;
    }
    
    // Check for division by zero
    if (operation === 'divide' && operand === 0) {
      res.status(400).json({ error: 'Division by zero is not allowed' });
      return;
    }

    const calculation = CalculationService.addOperation(req.userId!, parentId, operation, operand);
    
    if (!calculation) {
      res.status(404).json({ error: 'Parent calculation not found' });
      return;
    }
    
    res.status(201).json(calculation);
  } catch (error) {
    console.error('Add operation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
