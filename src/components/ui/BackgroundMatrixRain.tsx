import React, { useEffect, useRef } from 'react';

export const BackgroundMatrixRain = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = 0;
    const fps = 30;
    const interval = 1000 / fps;

    const resize = () => {
        if (canvas.parentElement) {
            canvas.width = canvas.parentElement.offsetWidth;
            canvas.height = canvas.parentElement.offsetHeight;
        } else {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    };
    
    const chars = '0123456789ABCDEFｦｧｨｩｪｫｬｭｮｯｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ';
    const charArray = chars.split('');
    const fontSize = 14;
    
    let columns = 0;
    let drops: number[] = [];

    const initDrops = () => {
        columns = canvas.width / fontSize;
        drops = new Array(Math.ceil(columns)).fill(1);
    };

    const handleResize = () => {
        resize();
        initDrops();
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const draw = (timestamp: number) => {
      animationFrameId = requestAnimationFrame(draw);

      const delta = timestamp - lastTime;
      if (delta < interval) return;
      
      lastTime = timestamp - (delta % interval);

      // Very transparent black for trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Theme color for text
      const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--osint-primary').trim() || '#0f0';
      ctx.fillStyle = accentColor;
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = charArray[Math.floor(Math.random() * charArray.length)];
        
        // Sparse rain
        if (Math.random() > 0.1) {
            ctx.globalAlpha = 0.15; 
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            ctx.globalAlpha = 1.0;
        }

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    animationFrameId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none opacity-50 z-0" />;
};