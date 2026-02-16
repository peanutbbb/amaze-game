// Amaze - Main Game Logic
class MazeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentLevel = 0;
        this.moves = 0;
        this.startTime = null;
        this.timerInterval = null;
        this.playerPos = { x: 0, y: 0 };
        this.exitPos = { x: 0, y: 0 };
        this.grid = [];
        this.cellSize = 0;
        this.soundEnabled = true;
        this.gameComplete = false;
        
        this.init();
    }
    
    init() {
        this.loadLevel(0);
        this.setupEventListeners();
        this.startTimer();
        this.draw();
    }
    
    loadLevel(levelIndex) {
        if (levelIndex >= LEVELS.length) {
            this.showMessage('Congratulations!', 'You completed all levels!', 'Play Again', () => {
                this.currentLevel = 0;
                this.loadLevel(0);
            });
            return;
        }
        
        this.currentLevel = levelIndex;
        const levelData = LEVELS[levelIndex];
        this.grid = levelData.grid.map(row => [...row]);
        this.moves = 0;
        this.gameComplete = false;
        
        // Find start and exit positions
        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                if (this.grid[y][x] === 2) {
                    this.playerPos = { x, y };
                    this.grid[y][x] = 1; // Convert to path
                } else if (this.grid[y][x] === 3) {
                    this.exitPos = { x, y };
                }
            }
        }
        
        // Calculate cell size based on grid dimensions
        const cols = this.grid[0].length;
        const rows = this.grid.length;
        this.cellSize = Math.min(600 / cols, 600 / rows);
        
        // Update canvas size
        this.canvas.width = cols * this.cellSize;
        this.canvas.height = rows * this.cellSize;
        
        this.updateUI();
        this.startTimer();
        this.draw();
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // Touch/Swipe controls for mobile
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            e.preventDefault();
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;
            
            const minSwipe = 30;
            
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > minSwipe) {
                if (dx > 0) this.move(1, 0);
                else this.move(-1, 0);
            } else if (Math.abs(dy) > minSwipe) {
                if (dy > 0) this.move(0, 1);
                else this.move(0, -1);
            }
            e.preventDefault();
        }, { passive: false });
        
        // Button controls
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        document.getElementById('soundBtn').addEventListener('click', () => this.toggleSound());
        document.getElementById('messageBtn').addEventListener('click', () => this.nextLevel());
    }
    
    handleKeydown(e) {
        if (this.gameComplete) return;
        
        switch(e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                e.preventDefault();
                this.move(0, -1);
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                e.preventDefault();
                this.move(0, 1);
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                e.preventDefault();
                this.move(-1, 0);
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                e.preventDefault();
                this.move(1, 0);
                break;
        }
    }
    
    move(dx, dy) {
        if (this.gameComplete) return;
        
        const newX = this.playerPos.x + dx;
        const newY = this.playerPos.y + dy;
        
        // Check bounds and walls
        if (newY >= 0 && newY < this.grid.length && 
            newX >= 0 && newX < this.grid[newY].length &&
            this.grid[newY][newX] !== 0) {
            
            this.playerPos.x = newX;
            this.playerPos.y = newY;
            this.moves++;
            this.updateUI();
            this.draw();
            
            if (this.soundEnabled) {
                this.playSound('move');
            }
            
            // Check win condition
            if (this.playerPos.x === this.exitPos.x && this.playerPos.y === this.exitPos.y) {
                this.levelComplete();
            }
        }
    }
    
    levelComplete() {
        this.gameComplete = true;
        this.stopTimer();
        
        if (this.soundEnabled) {
            this.playSound('win');
        }
        
        const time = document.getElementById('time').textContent;
        this.showMessage(
            'Level Complete!',
            `Level ${this.currentLevel + 1} done in ${this.moves} moves and ${time}s`,
            this.currentLevel < LEVELS.length - 1 ? 'Next Level' : 'Finish',
            () => this.nextLevel()
        );
    }
    
    nextLevel() {
        document.getElementById('message').classList.add('hidden');
        this.loadLevel(this.currentLevel + 1);
    }
    
    reset() {
        this.loadLevel(this.currentLevel);
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        document.getElementById('soundBtn').textContent = this.soundEnabled ? '🔊 Sound' : '🔇 Sound';
    }
    
    playSound(type) {
        // Simple synthesized sounds using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        if (type === 'move') {
            oscillator.frequency.value = 400;
            gainNode.gain.value = 0.1;
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.05);
        } else if (type === 'win') {
            oscillator.frequency.value = 800;
            gainNode.gain.value = 0.2;
            oscillator.type = 'sine';
            oscillator.start();
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator.stop(audioContext.currentTime + 0.5);
        }
    }
    
    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            document.getElementById('time').textContent = elapsed;
        }, 1000);
    }
    
    stopTimer() {
        clearInterval(this.timerInterval);
    }
    
    updateUI() {
        document.getElementById('level').textContent = this.currentLevel + 1;
        document.getElementById('moves').textContent = this.moves;
    }
    
    showMessage(title, text, buttonText, callback) {
        document.getElementById('messageTitle').textContent = title;
        document.getElementById('messageText').textContent = text;
        document.getElementById('messageBtn').textContent = buttonText;
        document.getElementById('message').classList.remove('hidden');
        
        // Replace the click handler
        const btn = document.getElementById('messageBtn');
        btn.onclick = callback;
    }
    
    draw() {
        const ctx = this.ctx;
        const cs = this.cellSize;
        
        // Clear canvas
        ctx.fillStyle = '#0d1117';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                const cell = this.grid[y][x];
                const px = x * cs;
                const py = y * cs;
                
                if (cell === 0) {
                    // Wall - dark with subtle gradient
                    const gradient = ctx.createLinearGradient(px, py, px + cs, py + cs);
                    gradient.addColorStop(0, '#1a1a2e');
                    gradient.addColorStop(1, '#0f0f1a');
                    ctx.fillStyle = gradient;
                    ctx.fillRect(px, py, cs, cs);
                    
                    // Wall border glow
                    ctx.strokeStyle = 'rgba(123, 44, 191, 0.2)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(px, py, cs, cs);
                } else {
                    // Path - very subtle
                    ctx.fillStyle = '#161b22';
                    ctx.fillRect(px, py, cs, cs);
                }
                
                // Exit
                if (x === this.exitPos.x && y === this.exitPos.y) {
                    ctx.fillStyle = 'rgba(0, 212, 255, 0.3)';
                    ctx.fillRect(px + 2, py + 2, cs - 4, cs - 4);
                    ctx.fillStyle = '#00d4ff';
                    ctx.font = `bold ${cs * 0.6}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('★', px + cs/2, py + cs/2);
                }
            }
        }
        
        // Draw player
        const px = this.playerPos.x * cs;
        const py = this.playerPos.y * cs;
        
        // Player glow effect
        const glowGradient = ctx.createRadialGradient(
            px + cs/2, py + cs/2, 0,
            px + cs/2, py + cs/2, cs/2
        );
        glowGradient.addColorStop(0, 'rgba(0, 212, 255, 0.6)');
        glowGradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(px - cs/4, py - cs/4, cs * 1.5, cs * 1.5);
        
        // Player circle
        ctx.beginPath();
        ctx.arc(px + cs/2, py + cs/2, cs * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = '#00d4ff';
        ctx.fill();
        
        // Player inner highlight
        ctx.beginPath();
        ctx.arc(px + cs/2, py + cs/2, cs * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        
        // Draw fog of war (darken areas far from player)
        const fogRadius = 4;
        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                const dist = Math.sqrt(
                    Math.pow(x - this.playerPos.x, 2) + 
                    Math.pow(y - this.playerPos.y, 2)
                );
                
                if (dist > fogRadius) {
                    const alpha = Math.min(0.7, (dist - fogRadius) * 0.15);
                    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
                    ctx.fillRect(x * cs, y * cs, cs, cs);
                }
            }
        }
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    new MazeGame();
});
