/* 贪吃蛇大冒险 - 游戏逻辑 */

// 游戏配置
const CONFIG = {
    // 游戏画布设置
    canvasWidth: 800,
    canvasHeight: 600,
    gridSize: 20,
    
    // 游戏速度设置（毫秒）
    speeds: {
        easy: 200,
        medium: 150,
        hard: 100,
        expert: 70
    },
    
    // 颜色配置
    colors: {
        snake: '#4ecdc4',
        snakeHead: '#00b4d8',
        food: '#ff6b6b',
        foodDouble: '#ff4757',
        foodSpeed: '#ffd166',
        foodSlow: '#118ab2',
        obstacle: '#6d6875',
        background: '#0a0a1a',
        grid: 'rgba(255, 255, 255, 0.05)'
    },
    
    // 游戏模式配置
    modes: {
        classic: {
            name: '经典模式',
            hasWalls: true,
            hasObstacles: false,
            timeLimit: 0
        },
        timed: {
            name: '限时模式',
            hasWalls: true,
            hasObstacles: false,
            timeLimit: 180 // 3分钟
        },
        challenge: {
            name: '挑战模式',
            hasWalls: true,
            hasObstacles: true,
            timeLimit: 0
        },
        endless: {
            name: '无尽模式',
            hasWalls: false,
            hasObstacles: false,
            timeLimit: 0
        }
    },
    
    // 难度配置
    difficulties: {
        easy: {
            name: '简单',
            speed: 'easy',
            specialFoodChance: 0.1,
            obstacleCount: 0
        },
        medium: {
            name: '中等',
            speed: 'medium',
            specialFoodChance: 0.2,
            obstacleCount: 3
        },
        hard: {
            name: '困难',
            speed: 'hard',
            specialFoodChance: 0.3,
            obstacleCount: 6
        },
        expert: {
            name: '专家',
            speed: 'expert',
            specialFoodChance: 0.4,
            obstacleCount: 10
        }
    },
    
    // 食物类型
    foodTypes: {
        normal: {
            color: '#ff6b6b',
            score: 10,
            length: 1,
            duration: 0,
            speedMultiplier: 1
        },
        double: {
            color: '#ff4757',
            score: 20,
            length: 2,
            duration: 0,
            speedMultiplier: 1
        },
        speed: {
            color: '#ffd166',
            score: 15,
            length: 1,
            duration: 10000, // 10秒
            speedMultiplier: 1.5
        },
        slow: {
            color: '#118ab2',
            score: 15,
            length: 1,
            duration: 10000, // 10秒
            speedMultiplier: 0.7
        }
    }
};

// 游戏状态
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over'
};

// 游戏主类
class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameOverlay = document.getElementById('game-overlay');
        this.overlayTitle = document.getElementById('overlay-title');
        this.overlayMessage = document.getElementById('overlay-message');
        
        // 游戏状态
        this.state = GameState.MENU;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
        this.gameTime = 0;
        this.gameTimer = null;
        this.gameLoop = null;
        this.snakeSpeed = CONFIG.speeds.medium;
        this.currentSpeedMultiplier = 1;
        
        // 游戏设置
        this.currentMode = 'classic';
        this.currentDifficulty = 'medium';
        this.lives = 3;
        this.isMuted = false;
        
        // 游戏对象
        this.snake = [];
        this.food = null;
        this.obstacles = [];
        this.specialEffect = null;
        this.specialEffectEndTime = 0;
        
        // 控制状态
        this.direction = 'right';
        this.nextDirection = 'right';
        this.isChangingDirection = false;
        
        // 音频
        this.audio = {
            bgm: document.getElementById('bgm'),
            eat: document.getElementById('eat-sound'),
            gameover: document.getElementById('gameover-sound'),
            move: document.getElementById('move-sound')
        };
        
        // 音量
        this.volumes = {
            bgm: 0.5,
            sfx: 0.7
        };
        
        // 统计数据
        this.stats = {
            totalGames: parseInt(localStorage.getItem('snakeTotalGames')) || 0,
            totalTime: parseInt(localStorage.getItem('snakeTotalTime')) || 0,
            totalFood: parseInt(localStorage.getItem('snakeTotalFood')) || 0,
            maxLength: parseInt(localStorage.getItem('snakeMaxLength')) || 3
        };
        
        this.init();
    }
    
    // 初始化游戏
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.setupUI();
        this.updateUI();
        this.showMenu();
        this.loadLeaderboard();
        this.updateStats();
        
        // 设置音频音量
        this.updateAudioVolumes();
    }
    
    // 设置画布
    setupCanvas() {
        // 根据设备调整画布大小
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // 保持16:9比例
        const aspectRatio = 16 / 9;
        let width = Math.min(containerWidth, containerHeight * aspectRatio);
        let height = width / aspectRatio;
        
        // 确保不超过最大尺寸
        width = Math.min(width, CONFIG.canvasWidth);
        height = Math.min(height, CONFIG.canvasHeight);
        
        this.canvas.width = width;
        this.canvas.height = height;
        
        // 计算网格尺寸
        this.gridWidth = Math.floor(width / CONFIG.gridSize);
        this.gridHeight = Math.floor(height / CONFIG.gridSize);
    }
    
    // 设置事件监听器
    setupEventListeners() {
        // 键盘控制
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // 游戏控制按钮
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        
        // 覆盖层按钮
        document.getElementById('overlay-start').addEventListener('click', () => this.startGame());
        document.getElementById('overlay-help').addEventListener('click', () => this.showHelp());
        
        // 游戏模式选择
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                this.selectMode(mode);
            });
        });
        
        // 难度选择
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const difficulty = btn.dataset.difficulty;
                this.selectDifficulty(difficulty);
            });
        });
        
        // 音量控制
        document.getElementById('bgm-volume').addEventListener('input', (e) => {
            this.volumes.bgm = e.target.value / 100;
            document.getElementById('bgm-value').textContent = `${e.target.value}%`;
            this.updateAudioVolumes();
        });
        
        document.getElementById('sfx-volume').addEventListener('input', (e) => {
            this.volumes.sfx = e.target.value / 100;
            document.getElementById('sfx-value').textContent = `${e.target.value}%`;
            this.updateAudioVolumes();
        });
        
        // 静音按钮
        document.getElementById('mute-btn').addEventListener('click', () => this.toggleMute());
        
        // 模态框关闭
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('help-modal').classList.remove('active');
                document.getElementById('gameover-modal').classList.remove('active');
            });
        });
        
        // 游戏结束按钮
        document.getElementById('play-again-btn').addEventListener('click', () => {
            document.getElementById('gameover-modal').classList.remove('active');
            this.restartGame();
        });
        
        document.getElementById('back-to-menu-btn').addEventListener('click', () => {
            document.getElementById('gameover-modal').classList.remove('active');
            this.showMenu();
        });
        
        // 窗口大小调整
        window.addEventListener('resize', () => {
            this.setupCanvas();
            if (this.state === GameState.PLAYING || this.state === GameState.PAUSED) {
                this.draw();
            }
        });
        
        // 触摸控制（移动端）
        this.setupTouchControls();
    }
    
    // 设置触摸控制
    setupTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;
            
            // 确定滑动方向
            if (Math.abs(dx) > Math.abs(dy)) {
                // 水平滑动
                if (dx > 0 && this.direction !== 'left') {
                    this.nextDirection = 'right';
                } else if (dx < 0 && this.direction !== 'right') {
                    this.nextDirection = 'left';
                }
            } else {
                // 垂直滑动
                if (dy > 0 && this.direction !== 'up') {
                    this.nextDirection = 'down';
                } else if (dy < 0 && this.direction !== 'down') {
                    this.nextDirection = 'up';
                }
            }
            
            this.isChangingDirection = false;
        });
    }
    
    // 设置UI
    setupUI() {
        // 更新最高分显示
        document.getElementById('high-score').textContent = this.highScore;
        
        // 设置默认选中
        this.selectMode('classic');
        this.selectDifficulty('medium');
    }
    
    // 选择游戏模式
    selectMode(mode) {
        this.currentMode = mode;
        
        // 更新按钮状态
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            }
        });
        
        // 更新游戏说明
        this.updateGameInstructions();
    }
    
    // 选择难度
    selectDifficulty(difficulty) {
        this.currentDifficulty = difficulty;
        this.snakeSpeed = CONFIG.speeds[CONFIG.difficulties[difficulty].speed];
        
        // 更新按钮状态
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.difficulty === difficulty) {
                btn.classList.add('active');
            }
        });
        
        // 更新游戏速度显示
        document.getElementById('game-speed').textContent = CONFIG.difficulties[difficulty].name;
    }
    
    // 更新游戏说明
    updateGameInstructions() {
        const mode = CONFIG.modes[this.currentMode];
        const modeList = document.querySelector('.mode-list');
        
        // 更新模式列表的选中状态
        document.querySelectorAll('.mode-list li').forEach((li, index) => {
            const items = Array.from(modeList.children);
            if (items[index].textContent.includes(mode.name)) {
                li.classList.add('highlight');
            } else {
                li.classList.remove('highlight');
            }
        });
    }
    
    // 处理键盘输入
    handleKeyDown(e) {
        if (this.isChangingDirection) return;
        
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                if (this.direction !== 'down') this.nextDirection = 'up';
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                if (this.direction !== 'up') this.nextDirection = 'down';
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                if (this.direction !== 'right') this.nextDirection = 'left';
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                if (this.direction !== 'left') this.nextDirection = 'right';
                break;
            case ' ':
                // 空格键暂停/继续
                if (this.state === GameState.PLAYING || this.state === GameState.PAUSED) {
                    this.togglePause();
                }
                break;
            case 'r':
            case 'R':
                // R键重新开始
                if (this.state === GameState.PLAYING || this.state === GameState.PAUSED || this.state === GameState.GAME_OVER) {
                    this.restartGame();
                }
                break;
            case 'Escape':
                // ESC键返回菜单
                if (this.state === GameState.PLAYING || this.state === GameState.PAUSED) {
                    this.showMenu();
                }
                break;
        }
        
        this.isChangingDirection = true;
    }
    
    // 开始游戏
    startGame() {
        if (this.state === GameState.PLAYING) return;
        
        // 重置游戏状态
        this.resetGame();
        
        // 更新游戏状态
        this.state = GameState.PLAYING;
        
        // 隐藏菜单覆盖层
        this.gameOverlay.style.display = 'none';
        
        // 更新UI
        this.updateUI();
        
        // 开始游戏循环
        this.startGameLoop();
        
        // 开始游戏计时器
        this.startGameTimer();
        
        // 播放背景音乐
        if (!this.isMuted) {
            this.audio.bgm.currentTime = 0;
            this.audio.bgm.play().catch(e => console.log('音频播放失败:', e));
        }
        
        // 更新统计数据
        this.stats.totalGames++;
        localStorage.setItem('snakeTotalGames', this.stats.totalGames);
        this.updateStats();
    }
    
    // 重置游戏
    resetGame() {
        // 重置蛇
        this.snake = [];
        const startX = Math.floor(this.gridWidth / 4);
        const startY = Math.floor(this.gridHeight / 2);
        
        // 创建初始蛇身（3节）
        for (let i = 0; i < 3; i++) {
            this.snake.push({
                x: startX - i,
                y: startY
            });
        }
        
        // 重置方向
        this.direction = 'right';
        this.nextDirection = 'right';
        
        // 重置分数
        this.score = 0;
        
        // 重置游戏时间
        this.gameTime = 0;
        
        // 重置生命值
        this.lives = 3;
        
        // 重置特殊效果
        this.specialEffect = null;
        this.specialEffectEndTime = 0;
        this.currentSpeedMultiplier = 1;
        
        // 生成食物
        this.generateFood();
        
        // 生成障碍物（根据模式）
        this.generateObstacles();
        
        // 更新UI
        this.updateScore();
        this.updateSnakeLength();
        this.updateLives();
    }
    
    // 生成食物
    generateFood() {
        let foodX, foodY;
        let validPosition = false;
        
        // 尝试找到有效位置
        while (!validPosition) {
            foodX = Math.floor(Math.random() * this.gridWidth);
            foodY = Math.floor(Math.random() * this.gridHeight);
            
            // 检查是否与蛇身重叠
            validPosition = !this.snake.some(segment => segment.x === foodX && segment.y === foodY);
            
            // 检查是否与障碍物重叠
            if (validPosition) {
                validPosition = !this.obstacles.some(obstacle => obstacle.x === foodX && obstacle.y === foodY);
            }
            
            // 如果位置无效，继续尝试
            if (!validPosition) continue;
            
            // 确定食物类型
            const rand = Math.random();
            const specialChance = CONFIG.difficulties[this.currentDifficulty].specialFoodChance;
            
            if (rand < specialChance * 0.3) {
                // 30%的特殊食物概率中，生成双倍食物
                this.food = {
                    x: foodX,
                    y: foodY,
                    type: 'double',
                    ...CONFIG.foodTypes.double
                };
            } else if (rand < specialChance * 0.6) {
                // 30%的特殊食物概率中，生成加速食物
                this.food = {
                    x: foodX,
                    y: foodY,
                    type: 'speed',
                    ...CONFIG.foodTypes.speed
                };
            } else if (rand < specialChance) {
                // 40%的特殊食物概率中，生成减速食物
                this.food = {
                    x: foodX,
                    y: foodY,
                    type: 'slow',
                    ...CONFIG.foodTypes.slow
                };
            } else {
                // 普通食物
                this.food = {
                    x: foodX,
                    y: foodY,
                    type: 'normal',
                    ...CONFIG.foodTypes.normal
                };
            }
        }
    }
    
    // 生成障碍物
    generateObstacles() {
        this.obstacles = [];
        const mode = CONFIG.modes[this.currentMode];
        const difficulty = CONFIG.difficulties[this.currentDifficulty];
        
        if (!mode.hasObstacles) return;
        
        const obstacleCount = difficulty.obstacleCount;
        
        for (let i = 0; i < obstacleCount; i++) {
            let obstacleX, obstacleY;
            let validPosition = false;
            let attempts = 0;
            
            // 尝试找到有效位置
            while (!validPosition && attempts < 100) {
                obstacleX = Math.floor(Math.random() * this.gridWidth);
                obstacleY = Math.floor(Math.random() * this.gridHeight);
                
                // 检查是否与蛇的起始位置重叠
                const startX = Math.floor(this.gridWidth / 4);
                const startY = Math.floor(this.gridHeight / 2);
                const isNearStart = Math.abs(obstacleX - startX) < 3 && Math.abs(obstacleY - startY) < 3;
                
                // 检查是否与蛇身重叠
                validPosition = !this.snake.some(segment => segment.x === obstacleX && segment.y === obstacleY);
                
                // 检查是否与现有障碍物重叠
                if (validPosition) {
                    validPosition = !this.obstacles.some(obstacle => obstacle.x === obstacleX && obstacle.y === obstacleY);
                }
                
                // 检查是否离起始位置太近
                if (validPosition && isNearStart) {
                    validPosition = false;
                }
                
                // 检查是否与食物位置重叠
                if (validPosition && this.food) {
                    validPosition = !(obstacleX === this.food.x && obstacleY === this.food.y);
                }
                
                attempts++;
            }
            
            if (validPosition) {
                this.obstacles.push({
                    x: obstacleX,
                    y: obstacleY,
                    width: 1,
                    height: 1
                });
            }
        }
    }
    
    // 开始游戏循环
    startGameLoop() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
        }
        
        const updateGame = () => {
            this.update();
            this.draw();
        };
        
        // 根据当前速度乘数调整游戏速度
        const speed = this.snakeSpeed / this.currentSpeedMultiplier;
        this.gameLoop = setInterval(updateGame, speed);
    }
    
    // 开始游戏计时器
    startGameTimer() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
        }
        
        this.gameTimer = setInterval(() => {
            this.gameTime++;
            this.updateGameTime();
            
            // 检查限时模式
            if (this.currentMode === 'timed') {
                const timeLimit = CONFIG.modes.timed.timeLimit;
                if (this.gameTime >= timeLimit) {
                    this.gameOver('时间到！');
                }
            }
            
            // 检查特殊效果是否过期
            if (this.specialEffect && Date.now() > this.specialEffectEndTime) {
                this.clearSpecialEffect();
            }
        }, 1000);
    }
    
    // 更新游戏逻辑
    update() {
        // 更新方向
        this.direction = this.nextDirection;
        this.isChangingDirection = false;
        
        // 移动蛇头
        const head = { ...this.snake[0] };
        
        switch (this.direction) {
            case 'up':
                head.y--;
                break;
            case 'down':
                head.y++;
                break;
            case 'left':
                head.x--;
                break;
            case 'right':
                head.x++;
                break;
        }
        
        // 检查边界（无尽模式可以穿墙）
        const mode = CONFIG.modes[this.currentMode];
        if (mode.hasWalls) {
            if (head.x < 0 || head.x >= this.gridWidth || head.y < 0 || head.y >= this.gridHeight) {
                this.loseLife();
                return;
            }
        } else {
            // 无尽模式：穿墙
            if (head.x < 0) head.x = this.gridWidth - 1;
            if (head.x >= this.gridWidth) head.x = 0;
            if (head.y < 0) head.y = this.gridHeight - 1;
            if (head.y >= this.gridHeight) head.y = 0;
        }
        
        // 检查是否撞到自己
        if (this.snake.some((segment, index) => index > 0 && segment.x === head.x && segment.y === head.y)) {
            this.loseLife();
            return;
        }
        
        // 检查是否撞到障碍物
        if (this.obstacles.some(obstacle => obstacle.x === head.x && obstacle.y === head.y)) {
            this.loseLife();
            return;
        }
        
        // 添加到蛇头
        this.snake.unshift(head);
        
        // 播放移动音效
        if (!this.isMuted && this.volumes.sfx > 0) {
            this.audio.move.currentTime = 0;
            this.audio.move.volume = this.volumes.sfx;
            this.audio.move.play().catch(e => console.log('移动音效播放失败:', e));
        }
        
        // 检查是否吃到食物
        if (this.food && head.x === this.food.x && head.y === this.food.y) {
            this.eatFood();
        } else {
            // 如果没有吃到食物，移除蛇尾
            this.snake.pop();
        }
        
        // 更新UI
        this.updateSnakeLength();
    }
    
    // 吃到食物
    eatFood() {
        // 增加分数
        this.score += this.food.score;
        
        // 更新统计数据
        this.stats.totalFood++;
        localStorage.setItem('snakeTotalFood', this.stats.totalFood);
        
        // 检查最高分
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
            document.getElementById('high-score').textContent = this.highScore;
        }
        
        // 检查最长蛇身
        if (this.snake.length > this.stats.maxLength) {
            this.stats.maxLength = this.snake.length;
            localStorage.setItem('snakeMaxLength', this.stats.maxLength);
            document.getElementById('max-length').textContent = this.stats.maxLength;
        }
        
        // 应用食物效果
        this.applyFoodEffect(this.food);
        
        // 播放吃食物音效
        if (!this.isMuted && this.volumes.sfx > 0) {
            this.audio.eat.currentTime = 0;
            this.audio.eat.volume = this.volumes.sfx;
            this.audio.eat.play().catch(e => console.log('吃食物音效播放失败:', e));
        }
        
        // 生成新食物
        this.generateFood();
        
        // 更新UI
        this.updateScore();
        this.updateStats();
    }
    
    // 应用食物效果
    applyFoodEffect(food) {
        if (food.type === 'speed' || food.type === 'slow') {
            this.specialEffect = food.type;
            this.specialEffectEndTime = Date.now() + food.duration;
            this.currentSpeedMultiplier = food.speedMultiplier;
            
            // 重新开始游戏循环以应用新的速度
            this.startGameLoop();
            
            // 显示效果提示
            this.showEffectMessage(`${food.type === 'speed' ? '加速' : '减速'}效果生效！`);
        }
    }
    
    // 清除特殊效果
    clearSpecialEffect() {
        this.specialEffect = null;
        this.currentSpeedMultiplier = 1;
        this.startGameLoop();
        this.showEffectMessage('效果结束');
    }
    
    // 显示效果消息
    showEffectMessage(message) {
        // 这里可以添加一个临时消息显示
        console.log(message);
    }
    
    // 失去生命
    loseLife() {
        this.lives--;
        this.updateLives();
        
        if (this.lives <= 0) {
            this.gameOver('游戏结束！');
        } else {
            // 重置蛇的位置
            const startX = Math.floor(this.gridWidth / 4);
            const startY = Math.floor(this.gridHeight / 2);
            
            this.snake = [];
            for (let i = 0; i < 3; i++) {
                this.snake.push({
                    x: startX - i,
                    y: startY
                });
            }
            
            this.direction = 'right';
            this.nextDirection = 'right';
            
            // 显示生命值减少提示
            this.showEffectMessage(`生命值减少！剩余 ${this.lives} 条命`);
        }
    }
    
    // 游戏结束
    gameOver(reason) {
        this.state = GameState.GAME_OVER;
        
        // 停止游戏循环和计时器
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
        
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
        
        // 停止背景音乐
        this.audio.bgm.pause();
        this.audio.bgm.currentTime = 0;
        
        // 播放游戏结束音效
        if (!this.isMuted && this.volumes.sfx > 0) {
            this.audio.gameover.currentTime = 0;
            this.audio.gameover.volume = this.volumes.sfx;
            this.audio.gameover.play().catch(e => console.log('游戏结束音效播放失败:', e));
        }
        
        // 更新总游戏时间
        this.stats.totalTime += this.gameTime;
        localStorage.setItem('snakeTotalTime', this.stats.totalTime);
        
        // 保存到排行榜
        this.saveToLeaderboard();
        
        // 显示游戏结束模态框
        this.showGameOverModal(reason);
        
        // 更新UI
        this.updateUI();
        this.updateStats();
    }
    
    // 显示游戏结束模态框
    showGameOverModal(reason) {
        const modal = document.getElementById('gameover-modal');
        const finalScore = document.getElementById('final-score');
        const finalLength = document.getElementById('final-length');
        const finalTime = document.getElementById('final-time');
        const gameoverText = document.getElementById('gameover-text');
        
        // 设置数据
        finalScore.textContent = this.score;
        finalLength.textContent = this.snake.length;
        finalTime.textContent = this.formatTime(this.gameTime);
        gameoverText.textContent = reason;
        
        // 显示模态框
        modal.classList.add('active');
    }
    
    // 切换暂停状态
    togglePause() {
        if (this.state === GameState.PLAYING) {
            this.state = GameState.PAUSED;
            
            // 停止游戏循环和计时器
            if (this.gameLoop) {
                clearInterval(this.gameLoop);
                this.gameLoop = null;
            }
            
            if (this.gameTimer) {
                clearInterval(this.gameTimer);
                this.gameTimer = null;
            }
            
            // 暂停背景音乐
            this.audio.bgm.pause();
            
            // 显示暂停覆盖层
            this.showPauseOverlay();
        } else if (this.state === GameState.PAUSED) {
            this.state = GameState.PLAYING;
            
            // 恢复游戏循环和计时器
            this.startGameLoop();
            this.startGameTimer();
            
            // 恢复背景音乐
            if (!this.isMuted) {
                this.audio.bgm.play().catch(e => console.log('音频播放失败:', e));
            }
            
            // 隐藏暂停覆盖层
            this.gameOverlay.style.display = 'none';
        }
        
        this.updateUI();
    }
    
    // 显示暂停覆盖层
    showPauseOverlay() {
        this.overlayTitle.textContent = '游戏暂停';
        this.overlayMessage.textContent = '按空格键或点击继续按钮恢复游戏';
        
        // 更新覆盖层按钮
        const overlayStart = document.getElementById('overlay-start');
        overlayStart.innerHTML = '<i class="fas fa-play"></i> 继续游戏';
        overlayStart.onclick = () => this.togglePause();
        
        const overlayHelp = document.getElementById('overlay-help');
        overlayHelp.innerHTML = '<i class="fas fa-home"></i> 返回菜单';
        overlayHelp.onclick = () => this.showMenu();
        
        this.gameOverlay.style.display = 'flex';
    }
    
    // 显示菜单
    showMenu() {
        if (this.state === GameState.PLAYING) {
            this.togglePause();
        }
        
        this.state = GameState.MENU;
        
        this.overlayTitle.textContent = '贪吃蛇大冒险';
        this.overlayMessage.textContent = '准备好开始冒险了吗？';
        
        // 重置覆盖层按钮
        const overlayStart = document.getElementById('overlay-start');
        overlayStart.innerHTML = '<i class="fas fa-play"></i> 开始游戏';
        overlayStart.onclick = () => this.startGame();
        
        const overlayHelp = document.getElementById('overlay-help');
        overlayHelp.innerHTML = '<i class="fas fa-question-circle"></i> 游戏说明';
        overlayHelp.onclick = () => this.showHelp();
        
        this.gameOverlay.style.display = 'flex';
        this.updateUI();
    }
    
    // 显示帮助
    showHelp() {
        document.getElementById('help-modal').classList.add('active');
    }
    
    // 重新开始游戏
    restartGame() {
        if (this.state === GameState.PLAYING || this.state === GameState.PAUSED) {
            // 停止当前的游戏循环和计时器
            if (this.gameLoop) {
                clearInterval(this.gameLoop);
                this.gameLoop = null;
            }
            
            if (this.gameTimer) {
                clearInterval(this.gameTimer);
                this.gameTimer = null;
            }
            
            // 停止背景音乐
            this.audio.bgm.pause();
            this.audio.bgm.currentTime = 0;
        }
        
        // 开始新游戏
        this.startGame();
    }
    
    // 绘制游戏
    draw() {
        // 清除画布
        this.ctx.fillStyle = CONFIG.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格
        this.drawGrid();
        
        // 绘制障碍物
        this.drawObstacles();
        
        // 绘制食物
        this.drawFood();
        
        // 绘制蛇
        this.drawSnake();
        
        // 绘制游戏信息
        this.drawGameInfo();
    }
    
    // 绘制网格
    drawGrid() {
        this.ctx.strokeStyle = CONFIG.colors.grid;
        this.ctx.lineWidth = 0.5;
        
        // 绘制垂直线
        for (let x = 0; x <= this.gridWidth; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * CONFIG.gridSize, 0);
            this.ctx.lineTo(x * CONFIG.gridSize, this.canvas.height);
            this.ctx.stroke();
        }
        
        // 绘制水平线
        for (let y = 0; y <= this.gridHeight; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * CONFIG.gridSize);
            this.ctx.lineTo(this.canvas.width, y * CONFIG.gridSize);
            this.ctx.stroke();
        }
    }
    
    // 绘制障碍物
    drawObstacles() {
        this.ctx.fillStyle = CONFIG.colors.obstacle;
        
        for (const obstacle of this.obstacles) {
            const x = obstacle.x * CONFIG.gridSize;
            const y = obstacle.y * CONFIG.gridSize;
            const size = CONFIG.gridSize;
            
            // 绘制障碍物主体
            this.ctx.fillRect(x, y, size, size);
            
            // 添加纹理效果
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
        }
    }
    
    // 绘制食物
    drawFood() {
        if (!this.food) return;
        
        const x = this.food.x * CONFIG.gridSize;
        const y = this.food.y * CONFIG.gridSize;
        const size = CONFIG.gridSize;
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        const radius = size / 2 - 2;
        
        // 绘制食物
        this.ctx.fillStyle = this.food.color;
        
        // 绘制圆形食物
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 添加高光效果
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(centerX - radius/3, centerY - radius/3, radius/4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 如果是特殊食物，添加动画效果
        if (this.food.type !== 'normal') {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // 添加脉动效果
            const pulseSize = Math.sin(Date.now() / 200) * 2;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius + pulseSize, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }
    
    // 绘制蛇
    drawSnake() {
        // 绘制蛇身
        for (let i = 0; i < this.snake.length; i++) {
            const segment = this.snake[i];
            const x = segment.x * CONFIG.gridSize;
            const y = segment.y * CONFIG.gridSize;
            const size = CONFIG.gridSize;
            
            // 蛇头使用不同颜色
            if (i === 0) {
                this.ctx.fillStyle = CONFIG.colors.snakeHead;
            } else {
                // 蛇身使用渐变颜色
                const gradient = this.ctx.createLinearGradient(x, y, x + size, y + size);
                const alpha = 1 - (i / this.snake.length) * 0.5;
                gradient.addColorStop(0, `rgba(78, 205, 196, ${alpha})`);
                gradient.addColorStop(1, `rgba(0, 180, 216, ${alpha})`);
                this.ctx.fillStyle = gradient;
            }
            
            // 绘制圆角矩形
            this.drawRoundedRect(x, y, size, size, 4);
            
            // 绘制蛇眼（只在蛇头上）
            if (i === 0) {
                this.ctx.fillStyle = 'white';
                
                // 根据方向确定眼睛位置
                let eye1X, eye1Y, eye2X, eye2Y;
                const eyeSize = size / 5;
                
                switch (this.direction) {
                    case 'right':
                        eye1X = x + size - eyeSize * 2;
                        eye1Y = y + eyeSize * 1.5;
                        eye2X = x + size - eyeSize * 2;
                        eye2Y = y + size - eyeSize * 2.5;
                        break;
                    case 'left':
                        eye1X = x + eyeSize;
                        eye1Y = y + eyeSize * 1.5;
                        eye2X = x + eyeSize;
                        eye2Y = y + size - eyeSize * 2.5;
                        break;
                    case 'up':
                        eye1X = x + eyeSize * 1.5;
                        eye1Y = y + eyeSize;
                        eye2X = x + size - eyeSize * 2.5;
                        eye2Y = y + eyeSize;
                        break;
                    case 'down':
                        eye1X = x + eyeSize * 1.5;
                        eye1Y = y + size - eyeSize * 2;
                        eye2X = x + size - eyeSize * 2.5;
                        eye2Y = y + size - eyeSize * 2;
                        break;
                }
                
                // 绘制眼睛
                this.ctx.beginPath();
                this.ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.beginPath();
                this.ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
                this.ctx.fill();
                
                // 绘制瞳孔
                this.ctx.fillStyle = 'black';
                this.ctx.beginPath();
                this.ctx.arc(eye1X, eye1Y, eyeSize/2, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.beginPath();
                this.ctx.arc(eye2X, eye2Y, eyeSize/2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }
    
    // 绘制圆角矩形
    drawRoundedRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    // 绘制游戏信息
    drawGameInfo() {
        // 绘制当前模式
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`模式: ${CONFIG.modes[this.currentMode].name}`, 10, 20);
        
        // 绘制当前难度
        this.ctx.fillText(`难度: ${CONFIG.difficulties[this.currentDifficulty].name}`, 10, 40);
        
        // 绘制当前分数
        this.ctx.fillText(`分数: ${this.score}`, 10, 60);
        
        // 绘制蛇的长度
        this.ctx.fillText(`长度: ${this.snake.length}`, 10, 80);
        
        // 绘制游戏时间
        this.ctx.fillText(`时间: ${this.formatTime(this.gameTime)}`, 10, 100);
        
        // 绘制生命值
        this.ctx.fillText(`生命: ${this.lives}`, 10, 120);
        
        // 绘制特殊效果（如果有）
        if (this.specialEffect) {
            const effectName = this.specialEffect === 'speed' ? '加速' : '减速';
            const remainingTime = Math.max(0, Math.ceil((this.specialEffectEndTime - Date.now()) / 1000));
            
            this.ctx.fillStyle = this.specialEffect === 'speed' ? '#ffd166' : '#118ab2';
            this.ctx.fillText(`${effectName}效果: ${remainingTime}秒`, 10, 140);
        }
        
        // 绘制控制提示
        if (this.state === GameState.PLAYING) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'right';
            this.ctx.fillText('空格键: 暂停/继续', this.canvas.width - 10, 20);
            this.ctx.fillText('R键: 重新开始', this.canvas.width - 10, 40);
            this.ctx.fillText('ESC键: 返回菜单', this.canvas.width - 10, 60);
        }
    }
    
    // 更新UI
    updateUI() {
        // 更新按钮状态
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const restartBtn = document.getElementById('restart-btn');
        
        switch (this.state) {
            case GameState.MENU:
                startBtn.disabled = false;
                pauseBtn.disabled = true;
                restartBtn.disabled = true;
                startBtn.innerHTML = '<i class="fas fa-play"></i> 开始游戏';
                break;
            case GameState.PLAYING:
                startBtn.disabled = true;
                pauseBtn.disabled = false;
                restartBtn.disabled = false;
                pauseBtn.innerHTML = '<i class="fas fa-pause"></i> 暂停游戏';
                break;
            case GameState.PAUSED:
                startBtn.disabled = true;
                pauseBtn.disabled = false;
                restartBtn.disabled = false;
                pauseBtn.innerHTML = '<i class="fas fa-play"></i> 继续游戏';
                break;
            case GameState.GAME_OVER:
                startBtn.disabled = false;
                pauseBtn.disabled = true;
                restartBtn.disabled = false;
                startBtn.innerHTML = '<i class="fas fa-redo"></i> 重新开始';
                break;
        }
        
        // 更新食物数量显示
        document.getElementById('food-count').textContent = this.stats.totalFood;
    }
    
    // 更新分数
    updateScore() {
        document.getElementById('current-score').textContent = this.score;
    }
    
    // 更新蛇的长度
    updateSnakeLength() {
        document.getElementById('snake-length').textContent = this.snake.length;
    }
    
    // 更新游戏时间
    updateGameTime() {
        document.getElementById('game-time').textContent = this.formatTime(this.gameTime);
    }
    
    // 更新生命值
    updateLives() {
        document.getElementById('lives-count').textContent = this.lives;
    }
    
    // 更新统计数据
    updateStats() {
        document.getElementById('total-games').textContent = this.stats.totalGames;
        document.getElementById('total-time').textContent = this.formatTime(this.stats.totalTime);
        document.getElementById('avg-score').textContent = this.stats.totalGames > 0 
            ? Math.round(this.highScore / this.stats.totalGames) 
            : 0;
        document.getElementById('max-length').textContent = this.stats.maxLength;
        document.getElementById('total-food').textContent = this.stats.totalFood;
    }
    
    // 更新音频音量
    updateAudioVolumes() {
        this.audio.bgm.volume = this.isMuted ? 0 : this.volumes.bgm;
        this.audio.eat.volume = this.isMuted ? 0 : this.volumes.sfx;
        this.audio.gameover.volume = this.isMuted ? 0 : this.volumes.sfx;
        this.audio.move.volume = this.isMuted ? 0 : this.volumes.sfx;
    }
    
    // 切换静音
    toggleMute() {
        this.isMuted = !this.isMuted;
        const muteBtn = document.getElementById('mute-btn');
        const icon = muteBtn.querySelector('i');
        
        if (this.isMuted) {
            icon.className = 'fas fa-volume-mute';
            muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i> 取消静音';
        } else {
            icon.className = 'fas fa-volume-up';
            muteBtn.innerHTML = '<i class="fas fa-volume-up"></i> 静音';
            
            // 如果游戏正在进行，恢复背景音乐
            if (this.state === GameState.PLAYING) {
                this.audio.bgm.play().catch(e => console.log('音频播放失败:', e));
            }
        }
        
        this.updateAudioVolumes();
    }
    
    // 格式化时间（秒转换为MM:SS）
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    // 加载排行榜
    loadLeaderboard() {
        const leaderboard = JSON.parse(localStorage.getItem('snakeLeaderboard')) || [];
        const leaderboardList = document.getElementById('leaderboard-list');
        
        leaderboardList.innerHTML = '';
        
        // 显示前10名
        const top10 = leaderboard.slice(0, 10);
        
        top10.forEach((entry, index) => {
            const item = document.createElement('div');
            item.className = `leaderboard-item rank-${index + 1}`;
            
            item.innerHTML = `
                <span>${index + 1}</span>
                <span>${entry.name}</span>
                <span>${entry.score}</span>
            `;
            
            leaderboardList.appendChild(item);
        });
        
        // 如果排行榜为空，显示提示
        if (top10.length === 0) {
            const emptyItem = document.createElement('div');
            emptyItem.className = 'leaderboard-item';
            emptyItem.innerHTML = '<span colspan="3" style="text-align: center; grid-column: 1 / 4;">暂无记录</span>';
            leaderboardList.appendChild(emptyItem);
        }
    }
    
    // 保存到排行榜
    saveToLeaderboard() {
        const leaderboard = JSON.parse(localStorage.getItem('snakeLeaderboard')) || [];
        
        // 添加新记录
        leaderboard.push({
            name: '玩家',
            score: this.score,
            length: this.snake.length,
            time: this.gameTime,
            mode: this.currentMode,
            difficulty: this.currentDifficulty,
            date: new Date().toISOString()
        });
        
        // 按分数排序
        leaderboard.sort((a, b) => b.score - a.score);
        
        // 只保留前50名
        const top50 = leaderboard.slice(0, 50);
        
        // 保存到本地存储
        localStorage.setItem('snakeLeaderboard', JSON.stringify(top50));
        
        // 更新排行榜显示
        this.loadLeaderboard();
    }
}

// 页面加载完成后初始化游戏
window.addEventListener('DOMContentLoaded', () => {
    const game = new SnakeGame();
    
    // 将游戏实例暴露给全局，方便调试
    window.snakeGame = game;
    
    console.log('贪吃蛇大冒险已加载！');
    console.log('游戏控制：');
    console.log('- 方向键/WASD：控制蛇的移动');
    console.log('- 空格键：暂停/继续游戏');
    console.log('- R键：重新开始游戏');
    console.log('- ESC键：返回主菜单');
});
