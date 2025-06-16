// VIB3CODE Interactive Demo Game Loader
// Demonstrates interactive content integration with magazine system

(function() {
    'use strict';
    
    console.log('🎮 Loading VIB3CODE Interactive Demo Game...');
    
    // Find the target container
    var gameContainer = document.getElementById('game-container-div');
    if (!gameContainer) {
        console.error('Game container not found');
        return;
    }
    
    // Game state
    var gameState = {
        score: 0,
        level: 1,
        blocksCleared: 0,
        isPlaying: false,
        colors: ['#00d9ff', '#ff0080', '#ff6b00', '#00ff41', '#ff00ff', '#ffff00']
    };
    
    // Create game UI
    function createGameUI() {
        gameContainer.innerHTML = 
            '<div class="vib3-game-wrapper" style="' +
                'background: linear-gradient(135deg, rgba(10,10,46,0.7), rgba(22,33,62,0.7));' +
                'border: 2px solid #00d9ff;' +
                'border-radius: 12px;' +
                'padding: 20px;' +
                'margin: 20px 0;' +
                'text-align: center;' +
                'font-family: \'Courier New\', monospace;' +
                'color: #ffffff;' +
                'box-shadow: 0 0 20px rgba(0,217,255,0.3);' +
            '">' +
                '<h3 style="color: #00d9ff; margin-bottom: 15px; text-shadow: 0 0 10px #00d9ff;">' +
                    '🎮 VIB3CODE BLOCK STACKER DEMO' +
                '</h3>' +
                
                '<div class="game-stats" style="' +
                    'display: flex;' +
                    'justify-content: space-around;' +
                    'margin: 15px 0;' +
                    'font-size: 14px;' +
                '">' +
                    '<div>Score: <span id="score" style="color: #ff0080;">0</span></div>' +
                    '<div>Level: <span id="level" style="color: #00ff41;">1</span></div>' +
                    '<div>Blocks: <span id="blocks" style="color: #ffff00;">0</span></div>' +
                '</div>' +
                
                '<div id="game-canvas" style="' +
                    'width: 300px;' +
                    'height: 200px;' +
                    'margin: 20px auto;' +
                    'background: rgba(0,0,0,0.5);' +
                    'border: 1px solid #ff0080;' +
                    'border-radius: 8px;' +
                    'position: relative;' +
                    'overflow: hidden;' +
                    'cursor: pointer;' +
                '"></div>' +
                
                '<div class="game-controls" style="margin: 15px 0;">' +
                    '<button id="startBtn" style="' +
                        'background: linear-gradient(45deg, #00d9ff, #ff0080);' +
                        'border: none;' +
                        'color: white;' +
                        'padding: 10px 20px;' +
                        'margin: 5px;' +
                        'border-radius: 5px;' +
                        'cursor: pointer;' +
                        'font-weight: bold;' +
                        'transition: all 0.3s ease;' +
                    '">START GAME</button>' +
                    
                    '<button id="resetBtn" style="' +
                        'background: linear-gradient(45deg, #ff6b00, #ff0080);' +
                        'border: none;' +
                        'color: white;' +
                        'padding: 10px 20px;' +
                        'margin: 5px;' +
                        'border-radius: 5px;' +
                        'cursor: pointer;' +
                        'font-weight: bold;' +
                        'transition: all 0.3s ease;' +
                    '">RESET</button>' +
                '</div>' +
                
                '<div class="game-instructions" style="' +
                    'font-size: 12px;' +
                    'color: #cccccc;' +
                    'margin-top: 15px;' +
                    'line-height: 1.4;' +
                '">' +
                    '<p>🎯 Click on the game area to stack colorful blocks!</p>' +
                    '<p>💫 Each click adds a block and increases your score</p>' +
                    '<p>🚀 Demonstrates VIB3CODE\'s interactive content capabilities</p>' +
                '</div>' +
                
                '<div class="ema-badge" style="' +
                    'margin-top: 15px;' +
                    'padding: 8px;' +
                    'background: rgba(255,0,128,0.1);' +
                    'border: 1px solid rgba(255,0,128,0.3);' +
                    'border-radius: 5px;' +
                    'font-size: 10px;' +
                    'color: #ff0080;' +
                '">' +
                    '⚡ EMA-Compliant Interactive Content • Exportable • Portable • Sovereign' +
                '</div>' +
            '</div>';
    }
    
    // Game logic
    function initializeGame() {
        var canvas = document.getElementById('game-canvas');
        var startBtn = document.getElementById('startBtn');
        var resetBtn = document.getElementById('resetBtn');
        var scoreEl = document.getElementById('score');
        var levelEl = document.getElementById('level');
        var blocksEl = document.getElementById('blocks');
        
        var blocks = [];
        
        function createBlock(x, y) {
            var block = document.createElement('div');
            var color = gameState.colors[Math.floor(Math.random() * gameState.colors.length)];
            
            block.style.cssText = 
                'position: absolute;' +
                'width: 20px;' +
                'height: 20px;' +
                'background: ' + color + ';' +
                'border: 1px solid rgba(255,255,255,0.3);' +
                'border-radius: 3px;' +
                'left: ' + x + 'px;' +
                'top: ' + y + 'px;' +
                'box-shadow: 0 0 8px ' + color + ';' +
                'transition: all 0.3s ease;' +
                'animation: blockAppear 0.5s ease-out;';
            
            // Add CSS animation keyframes
            if (!document.getElementById('block-animations')) {
                var style = document.createElement('style');
                style.id = 'block-animations';
                style.textContent = 
                    '@keyframes blockAppear {' +
                        '0% { transform: scale(0) rotate(180deg); opacity: 0; }' +
                        '100% { transform: scale(1) rotate(0deg); opacity: 1; }' +
                    '}' +
                    '@keyframes blockPulse {' +
                        '0%, 100% { transform: scale(1); }' +
                        '50% { transform: scale(1.1); }' +
                    '}';
                document.head.appendChild(style);
            }
            
            canvas.appendChild(block);
            blocks.push(block);
            
            // Add pulse effect
            setTimeout(function() {
                block.style.animation = 'blockPulse 2s infinite';
            }, 500);
            
            return block;
        }
        
        function updateStats() {
            scoreEl.textContent = gameState.score;
            levelEl.textContent = gameState.level;
            blocksEl.textContent = gameState.blocksCleared;
            
            // Level progression
            if (gameState.score > 0 && gameState.score % 100 === 0) {
                gameState.level = Math.floor(gameState.score / 100) + 1;
                showLevelUp();
            }
        }
        
        function showLevelUp() {
            var levelUpMsg = document.createElement('div');
            levelUpMsg.style.cssText = 
                'position: absolute;' +
                'top: 50%;' +
                'left: 50%;' +
                'transform: translate(-50%, -50%);' +
                'color: #00ff41;' +
                'font-weight: bold;' +
                'font-size: 16px;' +
                'text-shadow: 0 0 10px #00ff41;' +
                'z-index: 1000;' +
                'animation: levelUpAnim 2s ease-out forwards;';
            levelUpMsg.textContent = 'LEVEL ' + gameState.level + '!';
            
            if (!document.getElementById('levelup-animation')) {
                var style = document.createElement('style');
                style.id = 'levelup-animation';
                style.textContent = 
                    '@keyframes levelUpAnim {' +
                        '0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }' +
                        '50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }' +
                        '100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }' +
                    '}';
                document.head.appendChild(style);
            }
            
            canvas.appendChild(levelUpMsg);
            setTimeout(function() {
                if (levelUpMsg.parentNode) {
                    levelUpMsg.parentNode.removeChild(levelUpMsg);
                }
            }, 2000);
        }
        
        // Game interactions
        canvas.addEventListener('click', function(e) {
            if (!gameState.isPlaying) return;
            
            var rect = canvas.getBoundingClientRect();
            var x = e.clientX - rect.left - 10; // Center the block
            var y = e.clientY - rect.top - 10;
            
            // Keep blocks within bounds
            x = Math.max(0, Math.min(x, 280));
            y = Math.max(0, Math.min(y, 180));
            
            createBlock(x, y);
            gameState.score += 10;
            gameState.blocksCleared++;
            updateStats();
            
            // Visual feedback
            canvas.style.transform = 'scale(1.02)';
            setTimeout(function() {
                canvas.style.transform = 'scale(1)';
            }, 100);
        });
        
        startBtn.addEventListener('click', function() {
            gameState.isPlaying = !gameState.isPlaying;
            startBtn.textContent = gameState.isPlaying ? 'PAUSE GAME' : 'START GAME';
            startBtn.style.background = gameState.isPlaying ? 
                'linear-gradient(45deg, #ff6b00, #ff0080)' : 
                'linear-gradient(45deg, #00d9ff, #ff0080)';
        });
        
        resetBtn.addEventListener('click', function() {
            gameState.score = 0;
            gameState.level = 1;
            gameState.blocksCleared = 0;
            gameState.isPlaying = false;
            
            // Clear all blocks
            blocks.forEach(function(block) {
                if (block.parentNode) {
                    block.parentNode.removeChild(block);
                }
            });
            blocks = [];
            
            updateStats();
            startBtn.textContent = 'START GAME';
            startBtn.style.background = 'linear-gradient(45deg, #00d9ff, #ff0080)';
        });
        
        // Add button hover effects
        [startBtn, resetBtn].forEach(function(btn) {
            btn.addEventListener('mouseenter', function() {
                btn.style.transform = 'translateY(-2px)';
                btn.style.boxShadow = '0 4px 12px rgba(0,217,255,0.4)';
            });
            
            btn.addEventListener('mouseleave', function() {
                btn.style.transform = 'translateY(0)';
                btn.style.boxShadow = 'none';
            });
        });
        
        updateStats();
    }
    
    // Integration with VIB3CODE system
    function integrateWithVisualizer() {
        // Notify visualizer of interactive content activity
        if (window.VIB3VisualizerIntegration) {
            document.addEventListener('click', function() {
                if (gameState.isPlaying) {
                    window.VIB3VisualizerIntegration.state.clickIntensity = 1.0;
                }
            });
        }
    }
    
    // Initialize everything
    createGameUI();
    initializeGame();
    integrateWithVisualizer();
    
    console.log('✅ VIB3CODE Interactive Demo Game loaded successfully');
    
    // Report successful load to magazine system
    if (window.MagazineRouter) {
        console.log('🔌 Interactive content integrated with magazine system');
    }
    
})();