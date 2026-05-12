import React from 'react';
import { FileText, GitBranch, List, HelpCircle } from 'lucide-react';
import './QuickActions.css';

const QuickActions = ({ onAction, isDisabled }) => {
  const actions = [
    { id: 'summarize', label: 'Summarize', icon: '📄', color: '#4a90e2' },
    { id: 'flowchart', label: 'Flowchart', icon: '🔄', color: '#50e3c2' },
    { id: 'key_points', label: 'Key Points', icon: '🧠', color: '#f5a623' },
    { id: 'generate_questions', label: 'Questions', icon: '❓', color: '#bd10e0' },
  ];

  if (!onAction) return null;

  return (
    <div className={`quick-actions ${isDisabled ? 'disabled' : ''}`}>
      {actions.map((action) => (
        <button
          key={action.id}
          className="action-pill"
          onClick={() => onAction(action.id)}
          disabled={isDisabled}
          style={{ '--action-color': action.color }}
        >
          <span className="action-icon">{action.icon}</span>
          <span className="action-label">{action.label}</span>
        </button>
      ))}
    </div>
  );
};

export default QuickActions;
