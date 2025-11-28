/* ===================================
   ENDLESS DASH - GAME LOGIC
   A Geometry Dash-style platformer game
   =================================== */

// ===================================
// CANVAS SETUP
// ===================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set initial canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Update ground position based on canvas height
    if (typeof ground !== 'undefined') {
        ground.y = canvas.height - 200;

        // Update player position if on ground
        if (typeof Game.player !== 'undefined' && !Game.player.isJumping) {
            Game.player.y = ground.y - Game.player.height;
        }
    }
}

window.addEventListener('resize', resizeCanvas);


// ===================================
// GAME NAMESPACE
// ===================================

const Game = {
    // Menu particles
    menuParticles: {
        list: [],

        init() {
            // Create initial menu particles
            for (let i = 0; i < 30; i++) {
                this.list.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    size: Math.random() * 4 + 2,
                    color: Math.random() > 0.5 ? '#00d4ff' : '#ffffff',
                    alpha: Math.random() * 0.5 + 0.3
                });
            }
        },

        update() {
            this.list.forEach(particle => {
                particle.x += particle.vx;
                particle.y += particle.vy;

                // Wrap around screen edges
                if (particle.x < 0) particle.x = canvas.width;
                if (particle.x > canvas.width) particle.x = 0;
                if (particle.y < 0) particle.y = canvas.height;
                if (particle.y > canvas.height) particle.y = 0;
            });
        },

        draw(ctx) {
            this.list.forEach(particle => {
                ctx.fillStyle = particle.color;
                ctx.globalAlpha = particle.alpha;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            });
        }
    },

    // Particle system
    particles: {
        list: [],

        create(x, y, color) {
            for (let i = 0; i < 8; i++) {
                this.list.push({
                    x: x,
                    y: y,
                    vx: (Math.random() - 0.5) * 8,
                    vy: (Math.random() - 0.5) * 8,
                    life: 30,
                    color: color
                });
            }
        },

        update() {
            for (let i = this.list.length - 1; i >= 0; i--) {
                this.list[i].x += this.list[i].vx;
                this.list[i].y += this.list[i].vy;
                this.list[i].life--;
                if (this.list[i].life <= 0) {
                    this.list.splice(i, 1);
                }
            }
        },

        draw(ctx) {
            this.list.forEach(particle => {
                ctx.fillStyle = particle.color;
                ctx.globalAlpha = particle.life / 30;
                ctx.fillRect(particle.x, particle.y, 4, 4);
                ctx.globalAlpha = 1;
            });
        }
    },

    // Player
    player: {
        x: 100,
        y: 0,
        width: 40,
        height: 40,
        velocityY: 0,
        gravity: 0.8,
        jumpPower: -15,
        isJumping: false,
        rotation: 0,
        color: '#00d4ff',

        jump() {
            if (!gameRunning) return;

            // Check for orb activation (double jump)
            for (let obstacle of Game.obstacles.list) {
                if (obstacle.type === 'orb' && !obstacle.activated && Game.physics.checkCollision(Game.player, obstacle)) {
                    Game.player.velocityY = Game.player.jumpPower;
                    obstacle.activated = true;
                    Game.particles.create(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, obstacle.color);
                    Game.particles.create(Game.player.x + Game.player.width / 2, Game.player.y + Game.player.height / 2, Game.player.color);
                    Game.player.isJumping = true;
                    return;
                }
            }

            // Normal jump (only when on ground)
            if (!Game.player.isJumping && gameRunning) {
                Game.player.velocityY = Game.player.jumpPower;
                Game.player.isJumping = true;
                Game.particles.create(Game.player.x + Game.player.width / 2, Game.player.y + Game.player.height, Game.player.color);
            }
        }
    },

    // Obstacles
    obstacles: {
        list: [],

        create(type, xOffset = 0) {
            if (type === 'spike') {
                this.list.push({
                    x: canvas.width + xOffset,
                    y: ground.y - 40,
                    width: 40,
                    height: 40,
                    type: 'spike',
                    color: '#ff6b6b'
                });
            }
            else if (type === 'block') {
                this.list.push({
                    x: canvas.width + xOffset,
                    y: ground.y - 40,
                    width: 40,
                    height: 40,
                    type: 'block',
                    color: '#ff4444'
                });
            }
            else if (type === 'platform') {
                this.list.push({
                    x: canvas.width + xOffset,
                    y: ground.y - 40,
                    width: 40,
                    height: 40,
                    type: 'platform',
                    color: '#4ecca3'
                });
            }
            else if (type === 'orb') {
                this.list.push({
                    x: canvas.width + xOffset,
                    y: ground.y - 150,
                    width: 30,
                    height: 30,
                    type: 'orb',
                    color: '#ffd93d',
                    activated: false,
                    pulsePhase: 0
                });
            }
        },

        createRandom() {
            const types = ['spike', 'block', 'platform', 'double', 'triple', 'platformHop', 'orb', 'longSpikes'];
            const type = types[Math.floor(Math.random() * types.length)];

            if (type === 'spike') {
                this.create('spike');
            }
            else if (type === 'block') {
                this.create('block');
            }
            else if (type === 'platform') {
                this.create('platform');
            }
            else if (type === 'double') {
                this.create('spike', 0);
                this.create('spike', 40);
            }
            else if (type === 'triple') {
                this.create('spike', 0);
                this.create('spike', 40);
                this.create('spike', 80);
            }
            else if (type === 'platformHop') {
                this.create('platform', 0);
                this.create('platform', 150);
            }
            else if (type === 'orb') {
                this.create('orb', 0);
            }
            else if (type === 'longSpikes') {
                // 5 spikes with orb above
                this.create('spike', 0);
                this.create('spike', 40);
                this.create('spike', 80);
                this.create('spike', 120);
                this.create('spike', 160);
                this.create('orb', 80);
            }
        }
    },

    // Audio system
    audio: {
        tracks: {
            menu: 'https://cdn.pixabay.com/audio/2023/07/14/audio_85276704c6.mp3',
            level1: 'https://cdn.pixabay.com/audio/2023/07/14/audio_85276704c6.mp3',
            level2: 'https://cdn.pixabay.com/audio/2025/05/21/audio_fa20813ea6.mp3',
            level3: 'https://cdn.pixabay.com/audio/2025/08/30/audio_00ae00f400.mp3',
            endless: 'https://audio.ngfiles.com/952000/952542_naither.mp3?f1595965602'
        },
        menuMusic: null,
        level1Music: null,
        level2Music: null,
        level3Music: null,
        endlessMusic: null,
        currentMusic: null,
        enabled: true,
        volume: 0.3, // Default volume (0.0 to 1.0)

        init() {
            try {
                this.menuMusic = new Audio(this.tracks.menu);
                this.level1Music = new Audio(this.tracks.level1);
                this.level2Music = new Audio(this.tracks.level2);
                this.level3Music = new Audio(this.tracks.level3);
                this.endlessMusic = new Audio(this.tracks.endless);

                // Set all music to loop
                this.menuMusic.loop = true;
                this.level1Music.loop = false;
                this.level2Music.loop = false;
                this.level3Music.loop = false;
                this.endlessMusic.loop = true;

                // Set volume
                this.menuMusic.volume = this.volume;
                this.level1Music.volume = this.volume;
                this.level2Music.volume = this.volume;
                this.level3Music.volume = this.volume;
                this.endlessMusic.volume = this.volume;
            } catch (error) {
                console.log('Music initialization failed:', error);
                this.enabled = false;
            }
        },

        play(track) {
            if (!this.enabled) return;

            // Stop current music
            this.stop();

            // Play new track
            if (track === 'menu' && this.menuMusic) {
                this.currentMusic = this.menuMusic;
            } else if (track === 'level1' && this.level1Music) {
                this.currentMusic = this.level1Music;
            } else if (track === 'level2' && this.level2Music) {
                this.currentMusic = this.level2Music;
            } else if (track === 'level3' && this.level3Music) {
                this.currentMusic = this.level3Music;
            } else if (track === 'endless' && this.endlessMusic) {
                this.currentMusic = this.endlessMusic;
            }

            if (this.currentMusic) {
                this.currentMusic.currentTime = 0;
                this.currentMusic.play().catch(error => {
                    console.log('Music playback failed:', error);
                });
            }
        },

        stop() {
            if (this.currentMusic) {
                this.currentMusic.pause();
                this.currentMusic.currentTime = 0;
            }
        },

        toggle() {
            this.enabled = !this.enabled;

            if (this.enabled) {
                // Resume music based on current game state
                if (gameState === 'menu') {
                    this.play('menu');
                } else if (gameRunning && currentMode === 'level') {
                    this.play('level' + currentLevel);
                } else if (gameRunning && currentMode === 'endless') {
                    this.play('endless');
                }
            } else {
                this.stop();
            }
        },

        setVolume(value) {
            // value should be 0-100, convert to 0.0-1.0
            this.volume = value / 100;

            // Update all tracks
            if (this.menuMusic) this.menuMusic.volume = this.volume;
            if (this.level1Music) this.level1Music.volume = this.volume;
            if (this.level2Music) this.level2Music.volume = this.volume;
            if (this.level3Music) this.level3Music.volume = this.volume;
            if (this.endlessMusic) this.endlessMusic.volume = this.volume;

            // Save to localStorage
            localStorage.setItem('endlessDashVolume', value);
        }
    },

    // Physics
    physics: {
        checkCollision(rect1, rect2) {
            return rect1.x < rect2.x + rect2.width &&
                   rect1.x + rect1.width > rect2.x &&
                   rect1.y < rect2.y + rect2.height &&
                   rect1.y + rect1.height > rect2.y;
        },

        pointInTriangle(px, py, x1, y1, x2, y2, x3, y3) {
            const denominator = ((y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3));
            const a = ((y2 - y3) * (px - x3) + (x3 - x2) * (py - y3)) / denominator;
            const b = ((y3 - y1) * (px - x3) + (x1 - x3) * (py - y3)) / denominator;
            const c = 1 - a - b;

            return a >= 0 && a <= 1 && b >= 0 && b <= 1 && c >= 0 && c <= 1;
        },

        checkTriangleCollision(rect, triangle) {
            // Triangle points for spike: bottom-left, top-center, bottom-right
            const x1 = triangle.x;
            const y1 = triangle.y + triangle.height;
            const x2 = triangle.x + triangle.width / 2;
            const y2 = triangle.y;
            const x3 = triangle.x + triangle.width;
            const y3 = triangle.y + triangle.height;

            // Check if any corner of the rectangle is inside the triangle
            const corners = [
                { x: rect.x, y: rect.y },
                { x: rect.x + rect.width, y: rect.y },
                { x: rect.x, y: rect.y + rect.height },
                { x: rect.x + rect.width, y: rect.y + rect.height }
            ];

            for (let corner of corners) {
                if (this.pointInTriangle(corner.x, corner.y, x1, y1, x2, y2, x3, y3)) {
                    return true;
                }
            }

            // Check if triangle peak is inside rectangle
            if (x2 >= rect.x && x2 <= rect.x + rect.width &&
                y2 >= rect.y && y2 <= rect.y + rect.height) {
                return true;
            }

            return false;
        },

        isLandingOnTop(playerRect, obstacleRect) {
            const bottomY = playerRect.y + playerRect.height;
            const tolerance = 15;

            return bottomY >= obstacleRect.y &&
                   bottomY <= obstacleRect.y + tolerance &&
                   playerRect.velocityY >= 0;
        }
    },

    // Renderer
    renderer: {
        drawSpike(obstacle) {
            ctx.fillStyle = obstacle.color;
            ctx.beginPath();
            ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
            ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y);
            ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        },

        drawBlock(obstacle) {
            ctx.fillStyle = obstacle.color;
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        },

        drawPlatform(obstacle) {
            ctx.fillStyle = obstacle.color;
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

            // Safe top indicator
            ctx.strokeStyle = '#6fffb0';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(obstacle.x, obstacle.y);
            ctx.lineTo(obstacle.x + obstacle.width, obstacle.y);
            ctx.stroke();
        },

        drawOrb(obstacle) {
            const centerX = obstacle.x + obstacle.width / 2;
            const centerY = obstacle.y + obstacle.height / 2;
            const pulseSize = obstacle.activated ? 0.5 : 1 + Math.sin(obstacle.pulsePhase) * 0.15;
            const radius = (obstacle.width / 2) * pulseSize;

            // Outer glow
            if (!obstacle.activated) {
                ctx.shadowBlur = 20;
                ctx.shadowColor = obstacle.color;
            }

            // Orb circle
            ctx.fillStyle = obstacle.activated ? 'rgba(255, 217, 61, 0.3)' : obstacle.color;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();

            // Outline
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Inner shine
            if (!obstacle.activated) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.beginPath();
                ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.3, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.shadowBlur = 0;
        },

        drawPlayer() {
            ctx.save();
            ctx.translate(Game.player.x + Game.player.width / 2, Game.player.y + Game.player.height / 2);
            ctx.rotate(Game.player.rotation * Math.PI / 180);

            // Glow effect
            ctx.shadowBlur = 20;
            ctx.shadowColor = Game.player.color;
            ctx.strokeStyle = Game.player.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(-Game.player.width / 2, -Game.player.height / 2, Game.player.width, Game.player.height);
            ctx.shadowBlur = 0;

            // Cube body
            ctx.fillStyle = Game.player.color;
            ctx.fillRect(-Game.player.width / 2, -Game.player.height / 2, Game.player.width, Game.player.height);

            // Cube outline
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.strokeRect(-Game.player.width / 2, -Game.player.height / 2, Game.player.width, Game.player.height);

            // Inner detail
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.strokeRect(-Game.player.width / 2 + 5, -Game.player.height / 2 + 5, Game.player.width - 10, Game.player.height - 10);

            ctx.restore();
        }
    },

    // Game state and control methods
    startLevel(level) {
        currentLevel = level;
        currentMode = 'level';
        const levelData = levels[level];
        gameSpeed = levelData.speed;

        // Reset spawned flags for all obstacles
        levelData.obstacles.forEach(obs => obs.spawned = false);

        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('levelName').textContent = levelData.name;
        this.reset();
        gameState = 'playing';
        gameRunning = true;
        this.audio.play('level' + level);
        this.loop();
    },

    startEndless() {
        currentMode = 'endless';
        gameSpeed = 5;
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('levelName').textContent = 'Endless Mode';
        document.getElementById('progress').textContent = '';
        this.reset();
        gameState = 'playing';
        gameRunning = true;
        this.audio.play('endless');
        this.loop();
    },

    reset() {
        score = 0;
        frameCount = 0;
        currentLevelTime = 0;
        lastFrameTime = performance.now();
        this.obstacles.list = [];
        this.particles.list = [];
        this.player.y = ground.y - this.player.height;
        this.player.velocityY = 0;
        this.player.isJumping = false;
        this.player.rotation = 0;
        obstacleTimer = 0;
        lastSpeedIncreaseScore = 0;
        document.getElementById('score').textContent = score;
        document.getElementById('ui').style.display = 'block';
        document.getElementById('instructions').style.display = 'block';
    },

    showMenu() {
        document.getElementById('gameOver').style.display = 'none';
        document.getElementById('levelComplete').style.display = 'none';
        document.getElementById('ui').style.display = 'none';
        document.getElementById('instructions').style.display = 'none';
        document.getElementById('mainMenu').style.display = 'block';
        gameState = 'menu';
        gameRunning = false;
        this.audio.play('menu');
        this.menuLoop(); // Restart menu animation
    },

    gameOver() {
        gameRunning = false;
        gameState = 'gameOver';
        document.getElementById('finalScore').textContent = score;
        document.getElementById('gameOver').style.display = 'block';
        document.getElementById('instructions').style.display = 'none';
    },

    levelComplete() {
        gameRunning = false;
        gameState = 'levelComplete';
        document.getElementById('levelScore').textContent = score;
        document.getElementById('levelComplete').style.display = 'block';
        document.getElementById('instructions').style.display = 'none';

        // Update next level button
        if (currentLevel >= 3) {
            document.getElementById('nextLevelBtn').textContent = 'Back to Menu';
        } else {
            document.getElementById('nextLevelBtn').textContent = 'Next Level';
        }
    },

    update() {
        if (!gameRunning) return;

        // Calculate delta time for frame-rate independence
        const currentTime = performance.now();
        const deltaTime = (currentTime - lastFrameTime) / 1000; // Convert to seconds
        lastFrameTime = currentTime;

        frameCount++;

        // ===== Level Mode Logic =====
        if (currentMode === 'level') {
            // Update level time
            currentLevelTime += deltaTime;

            const levelData = levels[currentLevel];
            const progress = Math.min(100, Math.floor((currentLevelTime / levelData.duration) * 100));
            document.getElementById('progress').textContent = `Progress: ${progress}%`;

            // Check level completion
            if (currentLevelTime >= levelData.duration && this.obstacles.list.length === 0) {
                this.levelComplete();
                return;
            }

            // Spawn level obstacles based on time
            const obstaclesAtTime = levelData.obstacles.filter(obs =>
                obs.time <= currentLevelTime && !obs.spawned
            );
            obstaclesAtTime.forEach(obstacleData => {
                this.obstacles.create(obstacleData.type, obstacleData.x);
                obstacleData.spawned = true; // Mark as spawned
            });
        }
        // ===== Endless Mode Logic =====
        else {
            obstacleTimer++;
            if (obstacleTimer > obstacleSpawnRate) {
                this.obstacles.createRandom();
                obstacleTimer = 0;
            }

            // Increase difficulty every 10 obstacles
            if (score > 0 && score >= lastSpeedIncreaseScore + 10) {
                gameSpeed += 0.5;
                obstacleSpawnRate = Math.max(50, obstacleSpawnRate - 5);
                lastSpeedIncreaseScore = score;
            }
        }

        // ===== Player Physics =====
        this.player.velocityY += this.player.gravity;
        this.player.y += this.player.velocityY;

        // Ground collision
        if (this.player.y + this.player.height >= ground.y) {
            this.player.y = ground.y - this.player.height;
            this.player.velocityY = 0;
            this.player.isJumping = false;
            this.player.rotation = Math.round(this.player.rotation / 90) * 90;
        }

        // Hold-to-jump on ground
        if (isHoldingJump && !this.player.isJumping && this.player.y + this.player.height >= ground.y - 1) {
            this.player.jump();
        }

        // Rotate cube while jumping
        if (this.player.isJumping) {
            this.player.rotation += 8;
        }

        // ===== Update Obstacles =====
        for (let i = this.obstacles.list.length - 1; i >= 0; i--) {
            this.obstacles.list[i].x -= gameSpeed;

            // Collision detection
            let collision = false;

            // Use triangular collision for spikes
            if (this.obstacles.list[i].type === 'spike') {
                collision = this.physics.checkTriangleCollision(this.player, this.obstacles.list[i]);
            } else {
                collision = this.physics.checkCollision(this.player, this.obstacles.list[i]);
            }

            if (collision) {
                // Orbs are not deadly
                if (this.obstacles.list[i].type === 'orb') {
                    continue;
                }
                // Platform safe landing
                else if (this.obstacles.list[i].type === 'platform' && this.physics.isLandingOnTop(this.player, this.obstacles.list[i])) {
                    this.player.y = this.obstacles.list[i].y - this.player.height;
                    this.player.velocityY = 0;
                    this.player.isJumping = false;
                    this.player.rotation = Math.round(this.player.rotation / 90) * 90;

                    if (isHoldingJump) {
                        this.player.jump();
                    }
                }
                // Deadly collision
                else {
                    this.gameOver();
                    return;
                }
            }

            // Update orb animation
            if (this.obstacles.list[i].type === 'orb') {
                this.obstacles.list[i].pulsePhase += 0.1;
            }

            // Remove off-screen obstacles
            if (this.obstacles.list[i].x + this.obstacles.list[i].width < 0) {
                this.obstacles.list.splice(i, 1);
                score++;
                document.getElementById('score').textContent = score;
            }
        }

        // ===== Update Particles =====
        this.particles.update();
    },

    draw() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (gameState === 'menu') return;

        // ===== Background Grid =====
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i < canvas.width; i += 40) {
            ctx.beginPath();
            ctx.moveTo(i - (frameCount * gameSpeed % 40), 0);
            ctx.lineTo(i - (frameCount * gameSpeed % 40), canvas.height);
            ctx.stroke();
        }

        // ===== Ground =====
        ctx.fillStyle = ground.color;
        ctx.fillRect(0, ground.y, canvas.width, canvas.height - ground.y);

        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, ground.y);
        ctx.lineTo(canvas.width, ground.y);
        ctx.stroke();

        // ===== Obstacles =====
        this.obstacles.list.forEach(obstacle => {
            if (obstacle.type === 'spike') {
                this.renderer.drawSpike(obstacle);
            }
            else if (obstacle.type === 'platform') {
                this.renderer.drawPlatform(obstacle);
            }
            else if (obstacle.type === 'orb') {
                this.renderer.drawOrb(obstacle);
            }
            else {
                this.renderer.drawBlock(obstacle);
            }
        });

        // ===== Particles =====
        this.particles.draw(ctx);

        // ===== Player =====
        this.renderer.drawPlayer();
    },

    loop() {
        this.update();
        this.draw();

        if (gameRunning) {
            requestAnimationFrame(() => this.loop());
        } else if (this.particles.list.length > 0) {
            // Continue drawing particles after game ends
            let particleLoop = setInterval(() => {
                this.draw();
                if (this.particles.list.length === 0) {
                    clearInterval(particleLoop);
                }
            }, 1000 / 60);
        }
    },

    // Menu animation loop
    menuLoop() {
        if (gameState === 'menu') {
            // Increment menu frame counter
            if (!this.menuFrameCount) this.menuFrameCount = 0;
            this.menuFrameCount++;

            const menuSpeed = 5; // Same as game speed 5

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw scrolling background grid
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            for (let i = 0; i < canvas.width; i += 40) {
                ctx.beginPath();
                ctx.moveTo(i - (this.menuFrameCount * menuSpeed % 40), 0);
                ctx.lineTo(i - (this.menuFrameCount * menuSpeed % 40), canvas.height);
                ctx.stroke();
            }

            // Update and draw menu particles
            this.menuParticles.update();
            this.menuParticles.draw(ctx);

            requestAnimationFrame(() => this.menuLoop());
        }
    }
};


// ===================================
// MUSIC SYSTEM (now in Game.audio)
// ===================================

// Initialize music on page load
Game.audio.init();

// Load saved volume from localStorage
const savedVolume = localStorage.getItem('endlessDashVolume');
if (savedVolume !== null) {
    const volumeValue = parseInt(savedVolume);
    document.getElementById('volumeSlider').value = volumeValue;
    document.getElementById('volumeValue').textContent = volumeValue;
    Game.audio.setVolume(volumeValue);
}

// Start menu music after user interaction (required by browsers)
let menuMusicStarted = false;
document.addEventListener('click', function initMenuMusic() {
    if (!menuMusicStarted && Game.audio.enabled) {
        Game.audio.play('menu');
        menuMusicStarted = true;
    }
}, { once: true });


// ===================================
// GAME STATE VARIABLES
// ===================================

let gameState = 'menu'; // 'menu', 'playing', 'gameOver', 'levelComplete'
let currentMode = 'endless'; // 'endless' or 'level'
let currentLevel = 1;
let gameRunning = false;
let score = 0;
let gameSpeed = 5;
let frameCount = 0;
let isHoldingJump = false;
let lastSpeedIncreaseScore = 0;

// Time tracking for frame-rate independent gameplay
let lastFrameTime = 0;
let currentLevelTime = 0; // Time elapsed in current level (seconds)

// Obstacle spawning variables (obstacles.list now in Game.obstacles)
let obstacleTimer = 0;
let obstacleSpawnRate = 90; // frames between obstacles in endless mode

// Particle effects (now in Game.particles)


// ===================================
// PLAYER OBJECT (now in Game.player)
// ===================================


// ===================================
// GROUND OBJECT
// ===================================

const ground = {
    y: canvas.height - 200,
    height: 80,
    color: '#1a1a2e'
};

Game.player.y = ground.y - Game.player.height;


// ===================================
// LEVEL DEFINITIONS
// ===================================

const levels = {
    1: {
        name: "Level 1: The Beginning",
        speed: 5,
        duration: 25, // seconds
        obstacles: [
            { time: 0.80, type: 'spike', x: 0 },
            { time: 1.67, type: 'spike', x: 0 },
            { time: 3.33, type: 'spike', x: 0 },
            { time: 3.33, type: 'spike', x: 40 },
            { time: 5.00, type: 'block', x: 0 },
            { time: 6.67, type: 'spike', x: 0 },
            { time: 7.50, type: 'spike', x: 40 },

            // 4 spikes with orb - teaching mechanic
            { time: 10.00, type: 'spike', x: 0 },
            { time: 10.00, type: 'spike', x: 40 },
            { time: 10.00, type: 'spike', x: 80 },
            { time: 10.00, type: 'spike', x: 120 },
            { time: 10.00, type: 'orb', x: 60 },

            { time: 13.33, type: 'platform', x: 0 },
            { time: 15.83, type: 'platform', x: 0 },
            { time: 18.33, type: 'spike', x: 0 },

            // Staircase
            { time: 20.83, type: 'platform', x: 0 },
            { time: 22.17, type: 'platform', x: 0 },
            { time: 23.50, type: 'platform', x: 0 },

            { time: 25.00, type: 'spike', x: 0 }
        ]
    },
    2: {
        name: "Level 2: Platform Jumper",
        speed: 6,
        duration: 27.5, // seconds
        obstacles: [
            { time: 1.33, type: 'spike', x: 0 },
            { time: 2.67, type: 'spike', x: 0 },
            { time: 4.00, type: 'block', x: 0 },

            // 5 spikes with orb
            { time: 6.33, type: 'spike', x: 0 },
            { time: 6.33, type: 'spike', x: 40 },
            { time: 6.33, type: 'spike', x: 80 },
            { time: 6.33, type: 'spike', x: 120 },
            { time: 6.33, type: 'spike', x: 160 },
            { time: 6.33, type: 'orb', x: 80 },

            // Platform hop sequence
            { time: 9.17, type: 'platform', x: 0 },
            { time: 11.33, type: 'platform', x: 0 },
            { time: 13.50, type: 'platform', x: 0 },

            { time: 15.83, type: 'spike', x: 0 },
            { time: 17.17, type: 'block', x: 0 },

            // High platform with orb
            { time: 19.17, type: 'orb', x: 0 },
            { time: 20.33, type: 'platform', x: 0 },

            // Staircase
            { time: 22.50, type: 'platform', x: 0 },
            { time: 23.67, type: 'platform', x: 0 },
            { time: 24.83, type: 'platform', x: 0 },
            { time: 24.83, type: 'spike', x: 60 },

            { time: 26.67, type: 'spike', x: 0 }
        ]
    },
    3: {
        name: "Level 3: Speed Trial",
        speed: 7,
        duration: 30, // seconds
        obstacles: [
            { time: 1.33, type: 'spike', x: 0 },
            { time: 2.67, type: 'spike', x: 0 },
            { time: 4.00, type: 'block', x: 0 },

            // 6 spikes with orb
            { time: 5.83, type: 'spike', x: 0 },
            { time: 5.83, type: 'spike', x: 40 },
            { time: 5.83, type: 'spike', x: 80 },
            { time: 5.83, type: 'spike', x: 120 },
            { time: 5.83, type: 'spike', x: 160 },
            { time: 5.83, type: 'spike', x: 200 },
            { time: 5.83, type: 'orb', x: 100 },

            // Platform hops
            { time: 9.17, type: 'platform', x: 0 },
            { time: 10.83, type: 'platform', x: 0 },

            // High platform with orb
            { time: 13.00, type: 'orb', x: 0 },
            { time: 14.17, type: 'platform', x: 0 },

            { time: 16.33, type: 'spike', x: 0 },

            // Staircase
            { time: 18.00, type: 'platform', x: 0 },
            { time: 19.00, type: 'platform', x: 0 },
            { time: 20.00, type: 'platform', x: 0 },
            { time: 21.00, type: 'platform', x: 0 },

            { time: 23.00, type: 'block', x: 0 },

            // 5 spikes with orb
            { time: 25.00, type: 'spike', x: 0 },
            { time: 25.00, type: 'spike', x: 40 },
            { time: 25.00, type: 'spike', x: 80 },
            { time: 25.00, type: 'spike', x: 120 },
            { time: 25.00, type: 'spike', x: 160 },
            { time: 25.00, type: 'orb', x: 80 },

            { time: 27.50, type: 'platform', x: 0 },

            // Final challenge
            { time: 29.17, type: 'spike', x: 0 },
            { time: 29.17, type: 'spike', x: 40 },
            { time: 29.17, type: 'spike', x: 80 },
            { time: 29.17, type: 'spike', x: 120 }
        ]
    }
};




// ===================================
// OBSTACLE CREATION (now in Game.obstacles)
// ===================================


// ===================================
// PARTICLE EFFECTS (now in Game.particles)
// ===================================


// ===================================
// PLAYER ACTIONS (now in Game.player)
// ===================================


// ===================================
// INPUT HANDLING
// ===================================

// Mouse input
canvas.addEventListener('mousedown', () => {
    isHoldingJump = true;
    if (gameRunning) Game.player.jump();
});

canvas.addEventListener('mouseup', () => {
    isHoldingJump = false;
});

// Touch input
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isHoldingJump = true;
    if (gameRunning) Game.player.jump();
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    isHoldingJump = false;
});

// Keyboard input
document.addEventListener('keydown', (e) => {
    if ((e.code === 'Space' || e.code === 'ArrowUp') && gameRunning) {
        e.preventDefault();
        if (!isHoldingJump) {
            isHoldingJump = true;
            Game.player.jump();
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        isHoldingJump = false;
    }
});


// ===================================
// BUTTON HANDLERS
// ===================================

// Music toggle button - opens popup
document.getElementById('musicToggle').addEventListener('click', () => {
    const popup = document.getElementById('musicControlPopup');
    popup.style.display = popup.style.display === 'block' ? 'none' : 'block';
});

// Close popup button
document.getElementById('closeMusicPopup').addEventListener('click', () => {
    document.getElementById('musicControlPopup').style.display = 'none';
});

// Toggle music mute button inside popup
document.getElementById('toggleMusicBtn').addEventListener('click', () => {
    Game.audio.toggle();
    const btn = document.getElementById('toggleMusicBtn');
    if (Game.audio.enabled) {
        btn.textContent = '🔊 Mute';
        btn.classList.remove('muted');
    } else {
        btn.textContent = '🔇 Unmute';
        btn.classList.add('muted');
    }
});

// Volume slider
document.getElementById('volumeSlider').addEventListener('input', (e) => {
    const value = e.target.value;
    document.getElementById('volumeValue').textContent = value;
    Game.audio.setVolume(value);
});

// Restart button
document.getElementById('restartBtn').addEventListener('click', () => {
    document.getElementById('gameOver').style.display = 'none';
    if (currentMode === 'level') {
        Game.startLevel(currentLevel);
    } else {
        Game.startEndless();
    }
});

document.getElementById('menuBtn').addEventListener('click', () => Game.showMenu());
document.getElementById('menuBtn2').addEventListener('click', () => Game.showMenu());

document.getElementById('nextLevelBtn').addEventListener('click', () => {
    document.getElementById('levelComplete').style.display = 'none';
    if (currentLevel < 3) {
        Game.startLevel(currentLevel + 1);
    } else {
        Game.showMenu();
    }
});


// ===================================
// INITIALIZE MENU
// ===================================

// Initialize menu particles and start menu animation
Game.menuParticles.init();
Game.menuLoop();
