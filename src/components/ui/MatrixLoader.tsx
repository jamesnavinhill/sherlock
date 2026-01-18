import React, { useState, useEffect } from 'react';
import { BackgroundMatrixRain } from './BackgroundMatrixRain';

interface MatrixLoaderProps {
    statusText: string;
    onRunInBackground?: () => void;
}

/**
 * Full-screen loading overlay with matrix rain animation
 * Used during investigation processing
 */
export const MatrixLoader: React.FC<MatrixLoaderProps> = ({ statusText, onRunInBackground }) => {
    const [loadingStep, setLoadingStep] = useState("INITIALIZING");

    useEffect(() => {
        const steps = [
            "INITIALIZING NEURAL LINK",
            "PARSING OPEN WEB DATA",
            "REASONING...",
            "EXTRACTING ENTITIES",
            "COMPILING DOSSIER"
        ];
        let i = 0;
        const interval = setInterval(() => {
            i = (i + 1) % steps.length;
            setLoadingStep(steps[i]);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleRunInBackground = () => {
        if (onRunInBackground) {
            onRunInBackground();
        } else {
            window.dispatchEvent(new CustomEvent('NAVIGATE_BACK'));
        }
    };

    return (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black overflow-hidden h-full min-h-screen">
            <BackgroundMatrixRain />
            <div className="relative z-10 bg-black/80 p-8 border border-white/10 backdrop-blur-md max-w-lg w-full">
                <div className="flex items-center space-x-3 mb-4 border-b border-white/20 pb-2">
                    <div className="w-3 h-3 bg-osint-primary animate-pulse"></div>
                    <h2 className="text-xl font-mono text-osint-primary tracking-[0.2em] font-bold">SYSTEM OVERRIDE</h2>
                </div>
                <div className="font-mono text-sm space-y-2 text-zinc-400">
                    <p>{'>'} TARGET: {statusText}</p>
                    <p className="text-white">{'>'} STATUS: {loadingStep}...</p>
                    <p className="animate-pulse text-osint-primary">_</p>
                </div>
                <div className="mt-6 h-1 w-full bg-zinc-900 overflow-hidden">
                    <div className="h-full bg-osint-primary animate-progress-indeterminate"></div>
                </div>
                <div className="mt-4 text-center">
                    <button
                        onClick={handleRunInBackground}
                        className="text-xs text-zinc-600 hover:text-white font-mono uppercase border-b border-transparent hover:border-white"
                    >
                        Run in Background
                    </button>
                </div>
            </div>
        </div>
    );
};
