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
                if (obstacle.type === 'orb' && !obstacle.activated && checkCollision(Game.player, obstacle)) {
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
                    y: ground.y - 60,
                    width: 60,
                    height: 60,
                    type: 'block',
                    color: '#ff4444'
                });
            }
            else if (type === 'platform') {
                this.list.push({
                    x: canvas.width + xOffset,
                    y: ground.y - 60,
                    width: 60,
                    height: 60,
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
                this.menuMusic.volume = 0.3;
                this.level1Music.volume = 0.3;
                this.level2Music.volume = 0.3;
                this.level3Music.volume = 0.3;
                this.endlessMusic.volume = 0.3;
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
            const musicBtn = document.getElementById('musicToggle');

            if (this.enabled) {
                musicBtn.textContent = '🔊 Music';
                musicBtn.classList.remove('muted');
                // Resume music based on current game state
                if (gameState === 'menu') {
                    this.play('menu');
                } else if (gameRunning && currentMode === 'level') {
                    this.play('level' + currentLevel);
                } else if (gameRunning && currentMode === 'endless') {
                    this.play('endless');
                }
            } else {
                musicBtn.textContent = '🔇 Muted';
                musicBtn.classList.add('muted');
                this.stop();
            }
        }
    }
};


// ===================================
// MUSIC SYSTEM (now in Game.audio)
// ===================================

// Initialize music on page load
Game.audio.init();
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
        duration: 1500, // frames (25 seconds at 60fps)
        obstacles: [
            { frame: 100, type: 'spike', x: 0 },
            { frame: 200, type: 'spike', x: 0 },
            { frame: 300, type: 'block', x: 0 },
            { frame: 400, type: 'spike', x: 0 },
            { frame: 450, type: 'spike', x: 40 },
            
            // 4 spikes with orb - teaching mechanic
            { frame: 600, type: 'spike', x: 0 },
            { frame: 600, type: 'spike', x: 40 },
            { frame: 600, type: 'spike', x: 80 },
            { frame: 600, type: 'spike', x: 120 },
            { frame: 600, type: 'orb', x: 60 },
            
            { frame: 800, type: 'platform', x: 0 },
            { frame: 950, type: 'platform', x: 0 },
            { frame: 1100, type: 'spike', x: 0 },
            
            // Staircase
            { frame: 1250, type: 'platform', x: 0 },
            { frame: 1330, type: 'platform', x: 0 },
            { frame: 1410, type: 'platform', x: 0 },
            
            { frame: 1500, type: 'spike', x: 0 }
        ]
    },
    2: {
        name: "Level 2: Platform Jumper",
        speed: 6,
        duration: 1650,
        obstacles: [
            { frame: 80, type: 'spike', x: 0 },
            { frame: 160, type: 'spike', x: 0 },
            { frame: 240, type: 'block', x: 0 },
            
            // 5 spikes with orb
            { frame: 380, type: 'spike', x: 0 },
            { frame: 380, type: 'spike', x: 40 },
            { frame: 380, type: 'spike', x: 80 },
            { frame: 380, type: 'spike', x: 120 },
            { frame: 380, type: 'spike', x: 160 },
            { frame: 380, type: 'orb', x: 80 },
            
            // Platform hop sequence
            { frame: 550, type: 'platform', x: 0 },
            { frame: 680, type: 'platform', x: 0 },
            { frame: 810, type: 'platform', x: 0 },
            
            { frame: 950, type: 'spike', x: 0 },
            { frame: 1030, type: 'block', x: 0 },
            
            // High platform with orb
            { frame: 1150, type: 'orb', x: 0 },
            { frame: 1220, type: 'platform', x: 0 },
            
            // Staircase
            { frame: 1350, type: 'platform', x: 0 },
            { frame: 1420, type: 'platform', x: 0 },
            { frame: 1490, type: 'platform', x: 0 },
            
            { frame: 1600, type: 'spike', x: 0 }
        ]
    },
    3: {
        name: "Level 3: Speed Trial",
        speed: 7,
        duration: 1800,
        obstacles: [
            { frame: 80, type: 'spike', x: 0 },
            { frame: 160, type: 'spike', x: 0 },
            { frame: 240, type: 'block', x: 0 },
            
            // 6 spikes with orb
            { frame: 350, type: 'spike', x: 0 },
            { frame: 350, type: 'spike', x: 40 },
            { frame: 350, type: 'spike', x: 80 },
            { frame: 350, type: 'spike', x: 120 },
            { frame: 350, type: 'spike', x: 160 },
            { frame: 350, type: 'spike', x: 200 },
            { frame: 350, type: 'orb', x: 100 },
            
            // Platform hops
            { frame: 550, type: 'platform', x: 0 },
            { frame: 650, type: 'platform', x: 0 },
            
            // High platform with orb
            { frame: 780, type: 'orb', x: 0 },
            { frame: 850, type: 'platform', x: 0 },
            
            { frame: 980, type: 'spike', x: 0 },
            
            // Staircase
            { frame: 1080, type: 'platform', x: 0 },
            { frame: 1140, type: 'platform', x: 0 },
            { frame: 1200, type: 'platform', x: 0 },
            { frame: 1260, type: 'platform', x: 0 },
            
            { frame: 1380, type: 'block', x: 0 },
            
            // 5 spikes with orb
            { frame: 1500, type: 'spike', x: 0 },
            { frame: 1500, type: 'spike', x: 40 },
            { frame: 1500, type: 'spike', x: 80 },
            { frame: 1500, type: 'spike', x: 120 },
            { frame: 1500, type: 'spike', x: 160 },
            { frame: 1500, type: 'orb', x: 80 },
            
            { frame: 1650, type: 'platform', x: 0 },
            
            // Final challenge
            { frame: 1750, type: 'spike', x: 0 },
            { frame: 1750, type: 'spike', x: 40 },
            { frame: 1750, type: 'spike', x: 80 },
            { frame: 1750, type: 'spike', x: 120 }
        ]
    }
};


// ===================================
// GAME MODE FUNCTIONS
// ===================================

function startLevel(level) {
    currentLevel = level;
    currentMode = 'level';
    const levelData = levels[level];
    gameSpeed = levelData.speed;
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('levelName').textContent = levelData.name;
    resetGame();
    gameState = 'playing';
    gameRunning = true;
    Game.audio.play('level' + level); // Play level-specific music (level1, level2, or level3)
    gameLoop();
}

function startEndless() {
    currentMode = 'endless';
    gameSpeed = 5;
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('levelName').textContent = 'Endless Mode';
    document.getElementById('progress').textContent = '';
    resetGame();
    gameState = 'playing';
    gameRunning = true;
    Game.audio.play('endless'); // Start endless music
    gameLoop();
}

function resetGame() {
    score = 0;
    frameCount = 0;
    Game.obstacles.list = [];
    Game.particles.list = [];
    Game.player.y = ground.y - Game.player.height;
    Game.player.velocityY = 0;
    Game.player.isJumping = false;
    Game.player.rotation = 0;
    obstacleTimer = 0;
    lastSpeedIncreaseScore = 0;
    document.getElementById('score').textContent = score;
    document.getElementById('ui').style.display = 'block';
    document.getElementById('instructions').style.display = 'block';
}

function showMenu() {
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('levelComplete').style.display = 'none';
    document.getElementById('ui').style.display = 'none';
    document.getElementById('instructions').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'block';
    gameState = 'menu';
    gameRunning = false;
    Game.audio.play('menu'); // Return to menu music
}


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

// Music toggle button
document.getElementById('musicToggle').addEventListener('click', () => Game.audio.toggle());

// Restart button
document.getElementById('restartBtn').addEventListener('click', () => {
    document.getElementById('gameOver').style.display = 'none';
    if (currentMode === 'level') {
        startLevel(currentLevel);
    } else {
        startEndless();
    }
});

document.getElementById('menuBtn').addEventListener('click', showMenu);
document.getElementById('menuBtn2').addEventListener('click', showMenu);

document.getElementById('nextLevelBtn').addEventListener('click', () => {
    document.getElementById('levelComplete').style.display = 'none';
    if (currentLevel < 3) {
        startLevel(currentLevel + 1);
    } else {
        showMenu();
    }
});


// ===================================
// COLLISION DETECTION
// ===================================

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Check if a point is inside a triangle using barycentric coordinates
function pointInTriangle(px, py, x1, y1, x2, y2, x3, y3) {
    const denominator = ((y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3));
    const a = ((y2 - y3) * (px - x3) + (x3 - x2) * (py - y3)) / denominator;
    const b = ((y3 - y1) * (px - x3) + (x1 - x3) * (py - y3)) / denominator;
    const c = 1 - a - b;

    return a >= 0 && a <= 1 && b >= 0 && b <= 1 && c >= 0 && c <= 1;
}

// Check if a rectangle collides with a triangle (spike)
function checkTriangleCollision(rect, triangle) {
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
        if (pointInTriangle(corner.x, corner.y, x1, y1, x2, y2, x3, y3)) {
            return true;
        }
    }

    // Check if triangle peak is inside rectangle (for when player lands on top of spike)
    if (x2 >= rect.x && x2 <= rect.x + rect.width &&
        y2 >= rect.y && y2 <= rect.y + rect.height) {
        return true;
    }

    return false;
}

function isLandingOnTop(playerRect, obstacleRect) {
    const bottomY = playerRect.y + playerRect.height;
    const tolerance = 15;

    return bottomY >= obstacleRect.y &&
           bottomY <= obstacleRect.y + tolerance &&
           playerRect.velocityY >= 0;
}


// ===================================
// GAME UPDATE LOGIC
// ===================================

function update() {
    if (!gameRunning) return;

    frameCount++;

    // ===== Level Mode Logic =====
    if (currentMode === 'level') {
        const levelData = levels[currentLevel];
        const progress = Math.min(100, Math.floor((frameCount / levelData.duration) * 100));
        document.getElementById('progress').textContent = `Progress: ${progress}%`;

        // Check level completion
        if (frameCount >= levelData.duration && Game.obstacles.list.length === 0) {
            levelComplete();
            return;
        }

        // Spawn level obstacles
        const obstaclesAtFrame = levelData.obstacles.filter(obs => obs.frame === frameCount);
        obstaclesAtFrame.forEach(obstacleData => {
            Game.obstacles.create(obstacleData.type, obstacleData.x);
        });
    } 
    // ===== Endless Mode Logic =====
    else {
        obstacleTimer++;
        if (obstacleTimer > obstacleSpawnRate) {
            Game.obstacles.createRandom();
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
    Game.player.velocityY += Game.player.gravity;
    Game.player.y += Game.player.velocityY;

    // Ground collision
    if (Game.player.y + Game.player.height >= ground.y) {
        Game.player.y = ground.y - Game.player.height;
        Game.player.velocityY = 0;
        Game.player.isJumping = false;
        Game.player.rotation = Math.round(Game.player.rotation / 90) * 90;
    }

    // Hold-to-jump on ground
    if (isHoldingJump && !Game.player.isJumping && Game.player.y + Game.player.height >= ground.y - 1) {
        Game.player.jump();
    }

    // Rotate cube while jumping
    if (Game.player.isJumping) {
        Game.player.rotation += 8;
    }

    // ===== Update Obstacles =====
    for (let i = Game.obstacles.list.length - 1; i >= 0; i--) {
        Game.obstacles.list[i].x -= gameSpeed;

        // Collision detection
        let collision = false;

        // Use triangular collision for spikes
        if (Game.obstacles.list[i].type === 'spike') {
            collision = checkTriangleCollision(Game.player, Game.obstacles.list[i]);
        } else {
            collision = checkCollision(Game.player, Game.obstacles.list[i]);
        }

        if (collision) {
            // Orbs are not deadly
            if (Game.obstacles.list[i].type === 'orb') {
                continue;
            }
            // Platform safe landing
            else if (Game.obstacles.list[i].type === 'platform' && isLandingOnTop(Game.player, Game.obstacles.list[i])) {
                Game.player.y = Game.obstacles.list[i].y - Game.player.height;
                Game.player.velocityY = 0;
                Game.player.isJumping = false;
                Game.player.rotation = Math.round(Game.player.rotation / 90) * 90;

                if (isHoldingJump) {
                    Game.player.jump();
                }
            }
            // Deadly collision
            else {
                gameOver();
                return;
            }
        }

        // Update orb animation
        if (Game.obstacles.list[i].type === 'orb') {
            Game.obstacles.list[i].pulsePhase += 0.1;
        }

        // Remove off-screen obstacles
        if (Game.obstacles.list[i].x + Game.obstacles.list[i].width < 0) {
            Game.obstacles.list.splice(i, 1);
            score++;
            document.getElementById('score').textContent = score;
        }
    }

    // ===== Update Particles =====
    Game.particles.update();
}


// ===================================
// RENDERING (DRAW)
// ===================================

function draw() {
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
    Game.obstacles.list.forEach(obstacle => {
        if (obstacle.type === 'spike') {
            drawSpike(obstacle);
        } 
        else if (obstacle.type === 'platform') {
            drawPlatform(obstacle);
        } 
        else if (obstacle.type === 'orb') {
            drawOrb(obstacle);
        } 
        else {
            drawBlock(obstacle);
        }
    });

    // ===== Particles =====
    Game.particles.draw(ctx);

    // ===== Player =====
    drawPlayer();
}

function drawSpike(obstacle) {
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
}

function drawBlock(obstacle) {
    ctx.fillStyle = obstacle.color;
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
}

function drawPlatform(obstacle) {
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
}

function drawOrb(obstacle) {
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
}

function drawPlayer() {
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


// ===================================
// GAME STATE FUNCTIONS
// ===================================

function gameOver() {
    gameRunning = false;
    gameState = 'gameOver';
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').style.display = 'block';
    document.getElementById('instructions').style.display = 'none';
}

function levelComplete() {
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
}


// ===================================
// GAME LOOP
// ===================================

function gameLoop() {
    update();
    draw();
    
    if (gameRunning) {
        requestAnimationFrame(gameLoop);
    } else if (Game.particles.list.length > 0) {
        // Continue drawing particles after game ends
        let particleLoop = setInterval(() => {
            draw();
            if (Game.particles.list.length === 0) {
                clearInterval(particleLoop);
            }
        }, 1000 / 60);
    }
}
