import React, { useState } from 'react';
import { CalculationNode, OperationType } from '../types';
import { useAuth } from '../AuthContext';
import { calculationsApi } from '../api';
import OperationForm from './OperationForm';
import './CalculationTree.css';

interface CalculationNodeComponentProps {
  node: CalculationNode;
  depth: number;
  onRefresh: () => void;
}

const operationSymbols: Record<OperationType, string> = {
  add: '+',
  subtract: '-',
  multiply: '×',
  divide: '÷',
};

const CalculationNodeComponent: React.FC<CalculationNodeComponentProps> = ({ 
  node, 
  depth, 
  onRefresh 
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const { user } = useAuth();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleOperation = async (operation: OperationType, operand: number) => {
    await calculationsApi.addOperation(node.id, operation, operand);
    setIsReplying(false);
    onRefresh();
  };

  const getOperationDisplay = () => {
    if (node.operation === null) {
      return <span className="starting-number">Started with: <strong>{node.result}</strong></span>;
    }
    return (
      <span className="operation-display">
        {operationSymbols[node.operation]} {node.operand} = <strong>{node.result}</strong>
      </span>
    );
  };

  return (
    <div className={`calc-node depth-${Math.min(depth, 5)}`}>
      <div className="node-content">
        <div className="node-header">
          <span className="username">{node.username}</span>
          <span className="timestamp">{formatDate(node.createdAt)}</span>
        </div>
        
        <div className="node-calculation">
          {getOperationDisplay()}
        </div>
        
        {user && !isReplying && (
          <button 
            className="reply-btn"
            onClick={() => setIsReplying(true)}
          >
            Reply with operation
          </button>
        )}
        
        {isReplying && (
          <OperationForm
            parentResult={node.result}
            onSubmit={handleOperation}
            onCancel={() => setIsReplying(false)}
          />
        )}
      </div>
      
      {node.children && node.children.length > 0 && (
        <div className="node-children">
          {node.children.map(child => (
            <CalculationNodeComponent
              key={child.id}
              node={child}
              depth={depth + 1}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface CalculationTreeProps {
  calculations: CalculationNode[];
  onRefresh: () => void;
}

const CalculationTree: React.FC<CalculationTreeProps> = ({ calculations, onRefresh }) => {
  if (calculations.length === 0) {
    return (
      <div className="empty-state">
        <p>No calculations yet. Be the first to start a number discussion!</p>
      </div>
    );
  }

  return (
    <div className="calculation-tree">
      {calculations.map(node => (
        <CalculationNodeComponent
          key={node.id}
          node={node}
          depth={0}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
};

export default CalculationTree;
