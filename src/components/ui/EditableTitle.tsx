import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Check, X } from 'lucide-react';

interface EditableTitleProps {
  value: string;
  displayValue?: string;
  onSave: (newValue: string) => void;
  className?: string;
  inputClassName?: string;
  iconSize?: number;
  /** If true, the edit icon will be shown on hover. Default: true */
  showEditIcon?: boolean;
}

export const EditableTitle: React.FC<EditableTitleProps> = ({
  value,
  displayValue,
  onSave,
  className = '',
  inputClassName = '',
  iconSize = 14,
  showEditIcon = true,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resolvedDisplayValue = displayValue ?? value;

  // Update editValue when value prop changes
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== value) {
      onSave(trimmed);
    } else {
      setEditValue(value); // Revert if empty or unchanged
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 w-full">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className={`flex-1 bg-zinc-900 border border-osint-primary text-white px-2 py-1 outline-none ${inputClassName}`}
        />
        <button
          onClick={handleSave}
          className="osint-ghost-button-success inline-flex items-center justify-center p-1"
          title="Save"
        >
          <Check size={iconSize} />
        </button>
        <button
          onClick={handleCancel}
          className="osint-ghost-button inline-flex items-center justify-center p-1"
          title="Cancel"
        >
          <X size={iconSize} />
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex w-full min-w-0 items-start gap-2 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span
        className={`block min-w-0 flex-1 whitespace-normal break-all ${className}`}
        title={resolvedDisplayValue}
        onDoubleClick={() => setIsEditing(true)}
      >
        {resolvedDisplayValue}
      </span>
      {showEditIcon && (
        <button
          onClick={() => setIsEditing(true)}
          className={`osint-ghost-button inline-flex flex-shrink-0 items-center justify-center p-1 transition-all ${isHovered ? 'opacity-100' : 'opacity-0'}`}
          title="Edit title"
        >
          <Pencil size={iconSize} />
        </button>
      )}
    </div>
  );
};
