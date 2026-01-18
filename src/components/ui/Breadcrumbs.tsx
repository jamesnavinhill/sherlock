import React from 'react';
import { ChevronRight, FolderOpen, FileText } from 'lucide-react';

export interface BreadcrumbItem {
    type: 'CASE' | 'REPORT';
    id: string;
    label: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    onNavigate: (id: string) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, onNavigate }) => {
    if (items.length === 0) return null;

    return (
        <nav className="flex items-center space-x-1 text-xs font-mono overflow-x-auto max-w-full min-w-0">
            {items.map((item, index) => (
                <React.Fragment key={item.id}>
                    {index > 0 && (
                        <ChevronRight className="w-3 h-3 text-zinc-600 flex-shrink-0" />
                    )}
                    <button
                        onClick={() => onNavigate(item.id)}
                        className={`flex items-center space-x-1.5 px-2 py-1 rounded-sm transition-all max-w-[200px] min-w-0 ${index === items.length - 1
                                ? 'bg-zinc-800 text-white cursor-default'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                            }`}
                        disabled={index === items.length - 1}
                    >
                        {item.type === 'CASE' && <FolderOpen className="w-3 h-3 text-osint-primary flex-shrink-0" />}
                        {item.type === 'REPORT' && <FileText className="w-3 h-3 text-zinc-500 flex-shrink-0" />}
                        <span className="uppercase tracking-wide truncate">{item.label}</span>
                    </button>
                </React.Fragment>
            ))}
        </nav>
    );
};
