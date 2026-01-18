import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Check, X } from 'lucide-react';

interface EditableTitleProps {
    value: string;
    onSave: (newValue: string) => void;
    className?: string;
    inputClassName?: string;
    iconSize?: number;
    /** If true, the edit icon will be shown on hover. Default: true */
    showEditIcon?: boolean;
}

export const EditableTitle: React.FC<EditableTitleProps> = ({
    value,
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
                    className={`flex-1 bg-zinc-900 border border-osint-primary text-white px-2 py-1 font-mono outline-none ${inputClassName}`}
                />
                <button
                    onClick={handleSave}
                    className="p-1 text-green-500 hover:text-green-400 transition-colors"
                    title="Save"
                >
                    <Check size={iconSize} />
                </button>
                <button
                    onClick={handleCancel}
                    className="p-1 text-zinc-500 hover:text-white transition-colors"
                    title="Cancel"
                >
                    <X size={iconSize} />
                </button>
            </div>
        );
    }

    return (
        <div
            className="flex items-center gap-2 group min-w-0"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <span
                className={`truncate ${className}`}
                title={value}
                onDoubleClick={() => setIsEditing(true)}
            >
                {value}
            </span>
            {showEditIcon && (
                <button
                    onClick={() => setIsEditing(true)}
                    className={`p-1 text-zinc-600 hover:text-osint-primary transition-all flex-shrink-0 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                    title="Edit title"
                >
                    <Pencil size={iconSize} />
                </button>
            )}
        </div>
    );
};
