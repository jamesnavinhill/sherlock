import React, { useEffect, useRef } from 'react';

export const MatrixCardLoader = ({ active }: { active: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return; // Stop if not active

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize handler
    const resize = () => {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Config
    const fontSize = 14;
    const columns = Math.ceil(canvas.width / fontSize);
    const drops: number[] = new Array(columns).fill(1);

    // Characters (Katakana + Latin)
    const chars = '0123456789ABCDEFXPOZ';

    const draw = () => {
      const isLightMode = document.documentElement.getAttribute('data-theme') === 'light';

      // Trail effect (semi-transparent black)
      ctx.fillStyle = isLightMode ? 'rgba(248, 242, 230, 0.1)' : 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Text Color (Dynamic Theme)
      const accentColor =
        getComputedStyle(document.documentElement).getPropertyValue('--osint-primary').trim() ||
        '#0f0';
      ctx.fillStyle = accentColor;
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.globalAlpha = isLightMode ? 0.45 : 0.9;
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        ctx.globalAlpha = 1;

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.95) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const intervalId = setInterval(draw, 50);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('resize', resize);
    };
  }, [active]); // Re-run when active status changes

  return (
    <div
      ref={containerRef}
      className="h-full bg-black border border-zinc-800 relative overflow-hidden flex items-center justify-center group min-h-[14rem]"
    >
      {active && (
        <canvas ref={canvasRef} className="matrix-card-canvas absolute inset-0 opacity-30" />
      )}

      {!active && (
        <div className="absolute inset-0 opacity-10 bg-[url('https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif')] bg-cover grayscale mix-blend-screen pointer-events-none"></div>
      )}

      {/* Overlay Badge */}
      <div className="relative z-10 flex flex-col items-center p-3 bg-black/60 backdrop-blur-sm border border-zinc-700/50">
        <div className="flex space-x-1.5 mb-2">
          <div
            className={`w-1.5 h-1.5 bg-osint-primary ${active ? 'animate-pulse' : ''}`}
            style={{ animationDelay: '0ms' }}
          ></div>
          <div
            className={`w-1.5 h-1.5 bg-osint-primary ${active ? 'animate-pulse' : ''}`}
            style={{ animationDelay: '300ms' }}
          ></div>
          <div
            className={`w-1.5 h-1.5 bg-osint-primary ${active ? 'animate-pulse' : ''}`}
            style={{ animationDelay: '600ms' }}
          ></div>
        </div>
        <span className="text-[10px] font-mono text-zinc-300 uppercase tracking-widest font-bold">
          {active ? 'SCANNING_NETWORK' : 'SYSTEM_IDLE'}
        </span>
      </div>
    </div>
  );
};
