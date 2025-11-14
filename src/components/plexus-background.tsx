
"use client";

import React, { useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';

const PlexusBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current!;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const particles: Particle[] = [];
    let particleCount = 60;

    const setParticleCount = () => {
      if (window.innerWidth > 1280) {
        particleCount = 100;
      } else if (window.innerWidth > 768) {
        particleCount = 80;
      } else {
        particleCount = 40;
      }
    }

    const resizeCanvas = () => {
        if(canvas) {
            canvas.width = window.innerWidth;
            canvas.height = canvas.parentElement?.offsetHeight || window.innerHeight;
            setParticleCount();
            initParticles();
        }
    };
    
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.5 + 1;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.size > 0.2) this.size -= 0.01;

        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
      }

      draw(color: string) {
        if (!ctx) return;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const initParticles = () => {
      particles.length = 0;
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    const connectParticles = (color: string, lineColor: string) => {
        if (!ctx) return;
        let opacityValue = 1;
        for (let a = 0; a < particles.length; a++) {
            for (let b = a; b < particles.length; b++) {
                const dx = particles[a].x - particles[b].x;
                const dy = particles[a].y - particles[b].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 120) {
                    opacityValue = 1 - (distance / 120);
                    ctx.strokeStyle = `rgba(${lineColor}, ${opacityValue})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(particles[b].x, particles[b].y);
                    ctx.stroke();
                }
            }
        }
    };


    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particleColor = theme === 'dark' ? '210, 40%, 98%' : '222.2, 84%, 4.9%';
      const lineColor = theme === 'dark' ? '210, 40%, 80%' : '222.2, 47.4%, 20.2%';

      particles.forEach(p => {
          p.update();
          p.draw(`hsl(${particleColor})`);
      });
      connectParticles(`hsl(${particleColor})`, lineColor.replace(/%/g, ''));


      animationFrameId = requestAnimationFrame(animate);
    };
    
    resizeCanvas();
    animate();

    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-75" />;
};

export default PlexusBackground;
