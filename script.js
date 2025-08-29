
// Get the canvas and its context for drawing
const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');

// Get the display elements
const scoreDisplay = document.getElementById('score');
const nextPieceDisplay = document.getElementById('next-piece-display');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const restartBtn = document.getElementById('restart-btn');

// Get the new movement buttons
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');
const rotateBtn = document.getElementById('rotate-btn');
const downBtn = document.getElementById('down-btn');


// Game constants and variables
const COLUMNS = 10;
const ROWS = 20;
const BLOCK_SIZE = 20;
const board = Array.from({ length: ROWS }, () => Array(COLUMNS).fill(0));
let score = 0;
let gameOver = true;
let gamePaused = false;
let gameInterval;
const SPEED = 1000; // Time in ms for the piece to drop one block
let currentPiece = null;
let nextPiece = null;

// Tetromino shapes with their rotation variations and colors
const TETROMINOS = [
    { shape: [[1, 1, 1, 1]], color: '#00ffff' }, // I
    { shape: [[1, 1], [1, 1]], color: '#ffff00' }, // O
    { shape: [[0, 1, 0], [1, 1, 1]], color: '#800080' }, // T
    { shape: [[1, 1, 0], [0, 1, 1]], color: '#00ff00' }, // S
    { shape: [[0, 1, 1], [1, 1, 0]], color: '#ff0000' }, // Z
    { shape: [[1, 0, 0], [1, 1, 1]], color: '#ffa500' }, // J
    { shape: [[0, 0, 1], [1, 1, 1]], color: '#0000ff' }  // L
];

// --- Game Logic ---

function drawBlock(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    ctx.strokeStyle = '#2c3e50';
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

function drawBoard() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
            if (board[row][col] !== 0) {
                drawBlock(col, row, board[row][col]);
            }
        }
    }
}

function drawPiece() {
    if (currentPiece) {
        currentPiece.shape.forEach((row, rowIndex) => {
            row.forEach((value, colIndex) => {
                if (value) {
                    drawBlock(
                        currentPiece.x + colIndex,
                        currentPiece.y + rowIndex,
                        currentPiece.color
                    );
                }
            });
        });
    }
}

function checkCollision(piece, newX, newY, newShape) {
    const shape = newShape || piece.shape;
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col] !== 0) {
                const boardX = piece.x + col + newX;
                const boardY = piece.y + row + newY;

                if (boardX < 0 || boardX >= COLUMNS || boardY >= ROWS) {
                    return true;
                }
                if (boardY < 0) continue;
                if (board[boardY][boardX] !== 0) {
                    return true;
                }
            }
        }
    }
    return false;
}

function lockPiece() {
    currentPiece.shape.forEach((row, rowIndex) => {
        row.forEach((value, colIndex) => {
            if (value) {
                const boardX = currentPiece.x + colIndex;
                const boardY = currentPiece.y + rowIndex;
                board[boardY][boardX] = currentPiece.color;
            }
        });
    });
    clearRows();
    spawnNewPiece();
}

function clearRows() {
    let rowsCleared = 0;
    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row].every(cell => cell !== 0)) {
            board.splice(row, 1);
            board.unshift(Array(COLUMNS).fill(0));
            rowsCleared++;
            row++;
        }
    }
    if (rowsCleared > 0) {
        score += rowsCleared * 10;
        scoreDisplay.textContent = score;
    }
}

function rotatePiece() {
    if (gameOver || gamePaused) return;
    const newShape = currentPiece.shape[0].map((_, colIndex) =>
        currentPiece.shape.map(row => row[colIndex]).reverse()
    );
    if (!checkCollision(currentPiece, 0, 0, newShape)) {
        currentPiece.shape = newShape;
    }
}

function createPiece() {
    const randomIndex = Math.floor(Math.random() * TETROMINOS.length);
    const piece = TETROMINOS[randomIndex];
    return {
        shape: piece.shape,
        color: piece.color,
        x: Math.floor(COLUMNS / 2) - Math.floor(piece.shape[0].length / 2),
        y: 0
    };
}

function spawnNewPiece() {
    currentPiece = nextPiece || createPiece();
    nextPiece = createPiece();

    if (checkCollision(currentPiece, 0, 0)) {
        endGame();
        return;
    }
    updateNextPieceDisplay();
}

function updateNextPieceDisplay() {
    const displayCanvas = document.createElement('canvas');
    displayCanvas.width = 80;
    displayCanvas.height = 80;
    const displayCtx = displayCanvas.getContext('2d');
    nextPieceDisplay.innerHTML = '';
    nextPieceDisplay.appendChild(displayCanvas);

    const nextPieceShape = nextPiece.shape;
    const pieceWidth = nextPieceShape[0].length;
    const pieceHeight = nextPieceShape.length;

    const startX = (4 - pieceWidth) / 2;
    const startY = (4 - pieceHeight) / 2;

    nextPieceShape.forEach((row, rowIndex) => {
        row.forEach((value, colIndex) => {
            if (value) {
                displayCtx.fillStyle = nextPiece.color;
                displayCtx.fillRect(
                    (startX + colIndex) * (BLOCK_SIZE / 2),
                    (startY + rowIndex) * (BLOCK_SIZE / 2),
                    BLOCK_SIZE / 2,
                    BLOCK_SIZE / 2
                );
                displayCtx.strokeStyle = '#2c3e50';
                displayCtx.strokeRect(
                    (startX + colIndex) * (BLOCK_SIZE / 2),
                    (startY + rowIndex) * (BLOCK_SIZE / 2),
                    BLOCK_SIZE / 2,
                    BLOCK_SIZE / 2
                );
            }
        });
    });
}

function gameLoop() {
    if (gameOver || gamePaused) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard();
    if (!checkCollision(currentPiece, 0, 1)) {
        currentPiece.y++;
    } else {
        lockPiece();
    }
    drawPiece();
}

// --- Game Control Functions ---

function startGame() {
    if (!gameOver) return;
    gameOver = false;
    score = 0;
    scoreDisplay.textContent = score;
    board.forEach(row => row.fill(0));
    spawnNewPiece();
    gameInterval = setInterval(gameLoop, SPEED);
    pauseBtn.textContent = 'Pause';
}

function pauseGame() {
    if (gameOver) return;
    if (gamePaused) {
        gamePaused = false;
        gameInterval = setInterval(gameLoop, SPEED);
        pauseBtn.textContent = 'Pause';
    } else {
        gamePaused = true;
        clearInterval(gameInterval);
        pauseBtn.textContent = 'Resume';
    }
}

function restartGame() {
    clearInterval(gameInterval);
    startGame();
}

function endGame() {
    gameOver = true;
    clearInterval(gameInterval);
    alert('Game Over! Your final score is ' + score);
}

// --- Event Listeners ---
document.addEventListener('keydown', e => {
    if (gameOver || gamePaused) return;
    switch (e.key) {
        case 'ArrowUp':
            rotatePiece();
            break;
        case 'ArrowDown':
            if (!checkCollision(currentPiece, 0, 1)) {
                currentPiece.y++;
            }
            break;
        case 'ArrowLeft':
            if (!checkCollision(currentPiece, -1, 0)) {
                currentPiece.x--;
            }
            break;
        case 'ArrowRight':
            if (!checkCollision(currentPiece, 1, 0)) {
                currentPiece.x++;
            }
            break;
    }
});

startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', pauseGame);
restartBtn.addEventListener('click', restartGame);

// Add event listeners for the new movement buttons
if (leftBtn) {
    leftBtn.addEventListener('click', () => {
        if (!gameOver && !gamePaused && !checkCollision(currentPiece, -1, 0)) {
            currentPiece.x--;
        }
    });
}
if (rightBtn) {
    rightBtn.addEventListener('click', () => {
        if (!gameOver && !gamePaused && !checkCollision(currentPiece, 1, 0)) {
            currentPiece.x++;
        }
    });
}
if (rotateBtn) {
    rotateBtn.addEventListener('click', rotatePiece);
}
if (downBtn) {
    downBtn.addEventListener('click', () => {
        if (!gameOver && !gamePaused && !checkCollision(currentPiece, 0, 1)) {
            currentPiece.y++;
        }
    });
}

// --- Touch Controls for Mobile ---
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

canvas.addEventListener('touchstart', e => {
    if (gameOver || gamePaused) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    // Prevent the default scroll/zoom behavior
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', e => {
    if (gameOver || gamePaused) return;
    touchEndX = e.changedTouches[0].clientX;
    touchEndY = e.changedTouches[0].clientY;
    handleSwipe();
}, { passive: false });

function handleSwipe() {
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx > absDy) {
        // Horizontal swipe
        if (dx > 0) {
            // Right swipe
            if (!checkCollision(currentPiece, 1, 0)) {
                currentPiece.x++;
            }
        } else {
            // Left swipe
            if (!checkCollision(currentPiece, -1, 0)) {
                currentPiece.x--;
            }
        }
    } else {
        // Vertical swipe
        if (dy > 0) {
            // Down swipe
            if (!checkCollision(currentPiece, 0, 1)) {
                currentPiece.y++;
            }
        } else {
            // Up swipe
            rotatePiece();
        }
    }
}
