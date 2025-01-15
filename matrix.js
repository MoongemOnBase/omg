// Matrix Rain Effect
class MatrixRain {
    constructor() {
        // Only initialize on desktop
        if (window.innerWidth >= 768) {
            this.canvas = document.createElement("canvas");
            this.canvas.id = "matrix-rain";
            this.ctx = this.canvas.getContext("2d", { alpha: true });
            this.characters = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヰヱヲン0123456789$OMGAI";
            this.fontSize = window.innerWidth < 1024 ? 12 : 14;
            this.columns = 0;
            this.drops = [];
            this.gradient = null;
            this.isRunning = true;

            // Performance optimization
            this.lastTime = 0;
            this.fps = 30;
            this.fpsInterval = 1000 / this.fps;

            // Initialize
            this.init();
            this.setupResizeHandler();
            this.startAnimation();
        }
    }

    init() {
        if (!this.canvas) return;
        
        document.body.insertBefore(this.canvas, document.body.firstChild);
        this.canvas.style.position = "fixed";
        this.canvas.style.top = "0";
        this.canvas.style.left = "0";
        this.canvas.style.width = "100%";
        this.canvas.style.height = "100vh";
        this.canvas.style.zIndex = "-1";
        this.canvas.style.opacity = "0";
        this.canvas.style.pointerEvents = "none";
        this.canvas.style.filter = "blur(0.5px)";
        this.canvas.style.transition = "opacity 0.5s ease-in";

        // Delay setting opacity to allow for smooth fade in
        requestAnimationFrame(() => {
            this.canvas.style.opacity = "0.15";
        });

        this.resize();
        this.initDrops();
        this.createGradient();
    }

    resize() {
        if (!this.canvas) return;
        
        const dpr = window.devicePixelRatio || 1;
        const rect = document.body.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.height = '100vh';
        
        this.ctx.scale(dpr, dpr);
        this.fontSize = window.innerWidth < 1024 ? 12 : 14;
        this.ctx.font = `${this.fontSize}px monospace`;
        
        this.columns = Math.ceil(rect.width / this.fontSize);
        this.initDrops();
        this.createGradient();
    }

    createGradient() {
        if (!this.canvas) return;
        
        this.gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        this.gradient.addColorStop(0, "#00ffcc");
        this.gradient.addColorStop(0.5, "#0fc");
        this.gradient.addColorStop(1, "#00cc99");
    }

    initDrops() {
        if (!this.canvas) return;
        
        const density = Math.min(1, window.innerWidth / 1920);
        const numDrops = Math.floor(this.columns * density);
        
        this.drops = Array(numDrops).fill(1).map(() => ({
            x: Math.floor(Math.random() * this.columns) * this.fontSize,
            y: Math.random() * -100,
            speed: Math.random() * 0.5 + 0.5,
            opacity: Math.random() * 0.5 + 0.5,
            length: Math.floor(Math.random() * 15) + 5
        }));
    }

    setupResizeHandler() {
        if (!this.canvas) return;
        
        let resizeTimeout;
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (window.innerWidth < 768) {
                    this.cleanup();
                } else if (!this.canvas) {
                    this.canvas = document.createElement("canvas");
                    this.canvas.id = "matrix-rain";
                    this.ctx = this.canvas.getContext("2d", { alpha: true });
                    this.init();
                } else {
                    this.resize();
                }
            }, 200);
        };

        window.addEventListener("resize", handleResize);
        document.addEventListener("visibilitychange", () => {
            this.isRunning = !document.hidden;
        });
    }

    cleanup() {
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.style.opacity = "0";
            setTimeout(() => {
                if (this.canvas && this.canvas.parentNode) {
                    this.canvas.parentNode.removeChild(this.canvas);
                    this.canvas = null;
                    this.ctx = null;
                }
            }, 500);
        }
    }

    draw(timestamp) {
        if (!this.canvas || !this.isRunning) {
            requestAnimationFrame(this.draw.bind(this));
            return;
        }
        
        if (timestamp - this.lastTime < this.fpsInterval) {
            requestAnimationFrame(this.draw.bind(this));
            return;
        }

        this.lastTime = timestamp;
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.textAlign = "center";

        for (const drop of this.drops) {
            this.ctx.globalAlpha = drop.opacity;
            this.ctx.fillStyle = this.gradient;
            
            // Draw trail of characters
            for (let i = 0; i < drop.length; i++) {
                const char = this.characters[Math.floor(Math.random() * this.characters.length)];
                const y = drop.y - (i * this.fontSize);
                const opacity = 1 - (i / drop.length);
                this.ctx.globalAlpha = drop.opacity * opacity;
                this.ctx.fillText(char, drop.x, y);
            }

            drop.y += drop.speed * this.fontSize;

            if (drop.y > this.canvas.height + drop.length * this.fontSize) {
                drop.y = -drop.length * this.fontSize;
                drop.x = Math.floor(Math.random() * this.columns) * this.fontSize;
                drop.speed = Math.random() * 0.5 + 0.5;
                drop.opacity = Math.random() * 0.5 + 0.5;
                drop.length = Math.floor(Math.random() * 15) + 5;
            }
        }

        requestAnimationFrame(this.draw.bind(this));
    }

    startAnimation() {
        if (!this.canvas) return;
        requestAnimationFrame(this.draw.bind(this));
    }
}

// Initialize Matrix Rain effect when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    new MatrixRain();
});
