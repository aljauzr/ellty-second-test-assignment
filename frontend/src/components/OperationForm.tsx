import React, { useState } from 'react';
import { OperationType } from '../types';
import './OperationForm.css';

interface OperationFormProps {
  parentResult: number;
  onSubmit: (operation: OperationType, operand: number) => Promise<void>;
  onCancel: () => void;
}

const operationSymbols: Record<OperationType, string> = {
  add: '+',
  subtract: '-',
  multiply: '×',
  divide: '÷',
};

const OperationForm: React.FC<OperationFormProps> = ({ parentResult, onSubmit, onCancel }) => {
  const [operation, setOperation] = useState<OperationType>('add');
  const [operand, setOperand] = useState<string>('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculatePreview = (): string => {
    const num = parseFloat(operand);
    if (isNaN(num)) return '?';
    
    switch (operation) {
      case 'add': return String(parentResult + num);
      case 'subtract': return String(parentResult - num);
      case 'multiply': return String(parentResult * num);
      case 'divide': return num === 0 ? 'Error' : String(parentResult / num);
      default: return '?';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const num = parseFloat(operand);
    if (isNaN(num)) {
      setError('Please enter a valid number');
      return;
    }
    
    if (operation === 'divide' && num === 0) {
      setError('Cannot divide by zero');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(operation, num);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add operation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="operation-form">
      <form onSubmit={handleSubmit}>
        <div className="operation-preview">
          <span className="preview-left">{parentResult}</span>
          <select 
            value={operation} 
            onChange={(e) => setOperation(e.target.value as OperationType)}
            className="operation-select"
          >
            {Object.entries(operationSymbols).map(([op, symbol]) => (
              <option key={op} value={op}>{symbol}</option>
            ))}
          </select>
          <input
            type="number"
            value={operand}
            onChange={(e) => setOperand(e.target.value)}
            placeholder="Number"
            className="operand-input"
            step="any"
            required
          />
          <span className="preview-equals">=</span>
          <span className="preview-result">{calculatePreview()}</span>
        </div>
        
        {error && <div className="operation-error">{error}</div>}
        
        <div className="operation-buttons">
          <button type="submit" disabled={isSubmitting} className="submit-btn">
            {isSubmitting ? 'Adding...' : 'Add'}
          </button>
          <button type="button" onClick={onCancel} className="cancel-btn">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default OperationForm;
