import React, { useEffect, useRef } from 'react';

const AnimatedBackground = ({ theme }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let nodes = [];
        let horizontalLines = [];
        let verticalLines = [];

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Draw grid background
        const drawGrid = () => {
            const gridSize = 50;
            ctx.strokeStyle = 'rgba(54, 226, 123, 0.005)';
            ctx.lineWidth = 0.5;

            for (let x = 0; x < canvas.width; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }

            for (let y = 0; y < canvas.height; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }
        };

        // Node class
        class Node {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.radius = 3;
                this.pulsePhase = Math.random() * Math.PI * 2;
            }

            update() {
                this.pulsePhase += 0.02;
            }

            draw() {
                const pulse = Math.sin(this.pulsePhase) * 0.3 + 0.7;
                
                // Outer glow
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius * 2 * pulse, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(54, 226, 123, ${0.05 * pulse})`;
                ctx.fill();
                
                // Core
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(54, 226, 123, 0.15)';
                ctx.fill();
            }
        }

        // Line class for horizontal/vertical connections
        class Line {
            constructor(x1, y1, x2, y2, isHorizontal) {
                this.x1 = x1;
                this.y1 = y1;
                this.x2 = x2;
                this.y2 = y2;
                this.isHorizontal = isHorizontal;
                this.particles = [];
                this.maxParticles = 2;
                this.trailSegments = []; // Store fading trail segments
            }

            update() {
                // Spawn particles
                if (Math.random() < 0.02 && this.particles.length < this.maxParticles) {
                    this.particles.push({
                        progress: 0,
                        speed: 0.003 + Math.random() * 0.005
                    });
                }
                
                // Update particles and create trail
                this.particles = this.particles.filter(p => {
                    const oldProgress = p.progress;
                    p.progress += p.speed;
                    
                    // Add trail segment
                    if (p.progress <= 1) {
                        this.trailSegments.push({
                            startProgress: oldProgress,
                            endProgress: p.progress,
                            opacity: 1,
                            fadeSpeed: 0.01
                        });
                    }
                    
                    return p.progress <= 1;
                });
                
                // Update and fade trail segments
                this.trailSegments = this.trailSegments.filter(segment => {
                    segment.opacity -= segment.fadeSpeed;
                    return segment.opacity > 0;
                });
            }

            draw() {
                // Draw base line (extremely faint)
                ctx.beginPath();
                ctx.moveTo(this.x1, this.y1);
                ctx.lineTo(this.x2, this.y2);
                //ctx.strokeStyle = 'rgba(54, 226, 123, 0.02)';
                ctx.strokeStyle = 'rgba(84, 107, 82, 0.01)';
                ctx.lineWidth = 1;
                ctx.stroke();
                
                // Draw fading trail segments
                this.trailSegments.forEach(segment => {
                    const x1 = this.x1 + (this.x2 - this.x1) * segment.startProgress;
                    const y1 = this.y1 + (this.y2 - this.y1) * segment.startProgress;
                    const x2 = this.x1 + (this.x2 - this.x1) * segment.endProgress;
                    const y2 = this.y1 + (this.y2 - this.y1) * segment.endProgress;
                    
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.strokeStyle = `rgba(54, 226, 123, ${0.15 * segment.opacity})`;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                });
                
                // Draw particles
                this.particles.forEach(particle => {
                    const x = this.x1 + (this.x2 - this.x1) * particle.progress;
                    const y = this.y1 + (this.y2 - this.y1) * particle.progress;
                    
                    // Particle glow
                    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 5);
                    gradient.addColorStop(0, 'rgba(54, 226, 123, 0.2)');
                    gradient.addColorStop(1, 'rgba(54, 226, 123, 0)');
                    
                    ctx.beginPath();
                    ctx.arc(x, y, 5, 0, Math.PI * 2);
                    ctx.fillStyle = gradient;
                    ctx.fill();
                    
                    // Particle core
                    ctx.beginPath();
                    ctx.arc(x, y, 2, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(54, 226, 123, 0.3)';
                    ctx.fill();
                });
            }
        }

        // Create grid of nodes - BIGGER SQUARES (15% bigger = fewer lines)
        const createNodes = () => {
            const cols = 10;  // Reduced from 12
            const rows = 7;   // Reduced from 8
            const marginX = 0;
            const marginY = 0;
            const spaceX = canvas.width / (cols - 1);
            const spaceY = canvas.height / (rows - 1);

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const x = marginX + col * spaceX;
                    const y = marginY + row * spaceY;
                    nodes.push(new Node(x, y));
                }
            }
        };

        // Create horizontal and vertical lines - RANDOM DIRECTIONS
        const createLines = () => {
            const cols = 10;
            const rows = 7;

            // Create connections between nearby nodes in random directions
            nodes.forEach((node, i) => {
                const row = Math.floor(i / cols);
                const col = i % cols;
                
                // Right neighbor (horizontal)
                if (col < cols - 1 && Math.random() > 0.15) {
                    const rightNeighbor = nodes[i + 1];
                    horizontalLines.push(new Line(node.x, node.y, rightNeighbor.x, rightNeighbor.y, true));
                }
                
                // Bottom neighbor (vertical)
                if (row < rows - 1 && Math.random() > 0.15) {
                    const bottomNeighbor = nodes[i + cols];
                    verticalLines.push(new Line(node.x, node.y, bottomNeighbor.x, bottomNeighbor.y, false));
                }
                
                // Bottom-right diagonal
                if (row < rows - 1 && col < cols - 1 && Math.random() > 0.7) {
                    const diagonalNeighbor = nodes[i + cols + 1];
                    horizontalLines.push(new Line(node.x, node.y, diagonalNeighbor.x, diagonalNeighbor.y, false));
                }
                
                // Bottom-left diagonal
                if (row < rows - 1 && col > 0 && Math.random() > 0.7) {
                    const diagonalNeighbor = nodes[i + cols - 1];
                    verticalLines.push(new Line(node.x, node.y, diagonalNeighbor.x, diagonalNeighbor.y, false));
                }
            });
        };

        createNodes();
        createLines();

        // Animation loop
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw grid
            drawGrid();

            // Draw horizontal lines
            horizontalLines.forEach(line => {
                line.update();
                line.draw();
            });

            // Draw vertical lines
            verticalLines.forEach(line => {
                line.update();
                line.draw();
            });

            // Draw nodes
            nodes.forEach(node => {
                node.update();
                node.draw();
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        // Cleanup
        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, [theme]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
                pointerEvents: 'none'
            }}
        />
    );
};

export default AnimatedBackground;