import React, { useState } from 'react';
import { calculationsApi } from '../api';
import './StartNumberForm.css';

interface StartNumberFormProps {
  onSuccess: () => void;
}

const StartNumberForm: React.FC<StartNumberFormProps> = ({ onSuccess }) => {
  const [number, setNumber] = useState<string>('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const num = parseFloat(number);
    if (isNaN(num)) {
      setError('Please enter a valid number');
      return;
    }

    setIsSubmitting(true);
    try {
      await calculationsApi.createStartingNumber(num);
      setNumber('');
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create starting number');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="start-number-form">
      <h3>Start a New Discussion</h3>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <input
            type="number"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="Enter a number to start"
            step="any"
            required
          />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Starting...' : 'Start Discussion'}
          </button>
        </div>
        {error && <div className="start-error">{error}</div>}
      </form>
    </div>
  );
};

export default StartNumberForm;
