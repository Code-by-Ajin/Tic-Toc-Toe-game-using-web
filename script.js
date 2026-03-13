/* --- BACKGROUND LOGIC --- */
const bgColors = [
    'rgb(20, 25, 40)', 'rgb(40, 20, 30)', 'rgb(20, 40, 30)', 'rgb(30, 40, 50)',
    'rgb(45, 25, 45)', 'rgb(15, 35, 45)', 'rgb(40, 35, 20)', 'rgb(25, 20, 45)',
    'rgb(45, 20, 20)', 'rgb(20, 45, 45)'
];

function changeBgColor() {
    document.body.style.backgroundColor = bgColors[Math.floor(Math.random() * bgColors.length)];
}

document.body.style.backgroundColor = bgColors[0];
setInterval(changeBgColor, 10000);

/* --- PARTICLES LOGIC --- */
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.r = Math.random() * 4 + 2;
        this.dx = (Math.random() - 0.5) * 2;
        this.dy = (Math.random() - 0.5) * 2;
        this.color = [Math.random()*155 + 100, Math.random()*155 + 100, Math.random()*155 + 100];
        this.targetColor = [Math.random()*155 + 100, Math.random()*155 + 100, Math.random()*155 + 100];
    }
    update() {
        this.x += this.dx;
        this.y += this.dy;
        if (this.x < 0 || this.x > canvas.width) this.dx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.dy *= -1;

        for (let i=0; i<3; i++) {
            if (this.color[i] < this.targetColor[i]) this.color[i] += 0.5;
            else if (this.color[i] > this.targetColor[i]) this.color[i] -= 0.5;
            
            if (Math.abs(this.color[i] - this.targetColor[i]) <= 1) {
                this.targetColor[i] = Math.random()*155 + 100;
            }
        }
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${this.color[0]}, ${this.color[1]}, ${this.color[2]})`;
        ctx.fill();
    }
}

for(let i=0; i<70; i++) particles.push(new Particle());

function animateCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animateCanvas);
}
animateCanvas();

/* --- AUDIO LOGIC --- */
const musicFiles = ['music/1.mp3', 'music/2.mp3', 'music/3.mp3', 'music/4.mp3', 'music/5.mp3'];
const audioEl = document.getElementById('bg-music');
let musicOn = true;
let audioStarted = false;

function playRandomMusic() {
    if (!musicOn) return;
    let src = musicFiles[Math.floor(Math.random() * musicFiles.length)];
    audioEl.src = src;
    
    // Play the audio and catch any browser autoplay blocks
    let playPromise = audioEl.play();
    if (playPromise !== undefined) {
        playPromise.then(_ => {
            audioStarted = true; // Audio is successfully playing
        }).catch(error => {
            console.log("Browser blocked audio. Waiting for user to click something.");
            audioStarted = false;
        });
    }
}

// When one song ends, play another one immediately
audioEl.addEventListener('ended', playRandomMusic);

function toggleMusic() {
    const btn = document.getElementById('btn-music');
    if (musicOn) {
        musicOn = false;
        btn.innerText = "Music: OFF";
        audioEl.pause();
    } else {
        musicOn = true;
        btn.innerText = "Music: ON";
        playRandomMusic();
    }
}

// Ensure audio plays the moment the user clicks ANY button on the screen
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (!audioStarted && musicOn) {
            playRandomMusic();
        }
    });
});


/* --- GAME VARIABLES --- */
let state = "MAIN_MENU";
let gameMode = null; 
let difficulty = null; 
let maxRounds = 0;
let scores = { X: 0, O: 0 };
let board = Array(9).fill(' ');
let roundStarter = 'X';
let currentPlayer = 'X';
let isBoardLocked = false; 

const boardEl = document.getElementById('game-board');

for(let i=0; i<9; i++) {
    let cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.index = i;
    cell.onclick = () => handleCellClick(i);
    boardEl.appendChild(cell);
}
const cellEls = document.querySelectorAll('.cell');

/* --- STATE MANAGEMENT --- */
function setState(newState) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(newState).classList.add('active');
    state = newState;
    
    if(state === 'PLAYING') {
        updateUI();
        checkAiTurn();
    }
}

function setMode(mode) {
    gameMode = mode;
    if(mode === 'SINGLE') setState('DIFF_SELECT');
    else setState('ROUND_SELECT');
}

function setDifficulty(diff) {
    difficulty = diff;
    setState('ROUND_SELECT');
}

function goBackFromRounds() {
    if (gameMode === 'SINGLE') setState('DIFF_SELECT');
    else setState('MODE_SELECT');
}

function setRounds(r) {
    maxRounds = r;
    fullReset();
    setState('PLAYING');
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Error: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

/* --- GAME LOGIC --- */
function fullReset() {
    scores = { X: 0, O: 0 };
    roundStarter = 'X';
    resetBoard();
}

function resetBoard() {
    board = Array(9).fill(' ');
    currentPlayer = roundStarter;
    isBoardLocked = false;
    updateUI();
}

function updateUI() {
    board.forEach((mark, i) => {
        cellEls[i].innerText = mark;
        cellEls[i].className = 'cell'; 
        if(mark === 'X') cellEls[i].classList.add('x-mark');
        else if(mark === 'O') cellEls[i].classList.add('o-mark');
    });

    const p1 = document.getElementById('score-p1');
    const p2 = document.getElementById('score-p2');
    
    if(gameMode === 'SINGLE') {
        p1.innerText = `Human (X): ${scores.X}`;
        p2.innerText = `Computer (O): ${scores.O}`;
    } else {
        p1.innerText = `Player 1 (X): ${scores.X}`;
        p2.innerText = `Player 2 (O): ${scores.O}`;
    }
    
    document.getElementById('target-rounds').innerText = `First to ${maxRounds} wins!`;

    let tName = "Player 1 (X)";
    if(currentPlayer === 'O') {
        tName = gameMode === 'SINGLE' ? "Computer (O)" : "Player 2 (O)";
    }
    document.getElementById('turn-indicator').innerText = `Turn: ${tName}`;
}

function checkWin(b, player) {
    const winCond = [[0,1,2], [3,4,5], [6,7,8], [0,3,6], [1,4,7], [2,5,8], [0,4,8], [2,4,6]];
    return winCond.some(cond => b[cond[0]] === player && b[cond[1]] === player && b[cond[2]] === player);
}

function checkDraw(b) {
    return !b.includes(' ');
}

function handleCellClick(index) {
    if(state !== 'PLAYING' || isBoardLocked) return;
    if(board[index] !== ' ') return;
    if(gameMode === 'SINGLE' && currentPlayer === 'O') return;

    makeMove(index, currentPlayer);
}

function makeMove(index, player) {
    board[index] = player;
    updateUI();
    
    if(checkWin(board, player)) {
        scores[player]++;
        endRound(player);
    } else if (checkDraw(board)) {
        endRound("DRAW");
    } else {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        updateUI();
        checkAiTurn();
    }
}

function endRound(result) {
    isBoardLocked = true; 
    updateUI(); 
    
    setTimeout(() => {
        if(result !== "DRAW" && scores[result] >= maxRounds) {
            showGameOver(result);
        } else {
            roundStarter = roundStarter === 'X' ? 'O' : 'X';
            resetBoard();
            checkAiTurn();
        }
    }, 1000); 
}

function showGameOver(winnerId) {
    let winText = winnerId === 'X' ? "Player 1" : "Player 2";
    if(gameMode === 'SINGLE') {
        winText = winnerId === 'X' ? "Human" : "Computer";
    }
    document.getElementById('win-text').innerText = `${winText} Won the Match!`;
    setState('GAME_OVER');
}

function restartGame() {
    fullReset();
    setState('PLAYING');
}

/* --- AI LOGIC --- */
function checkAiTurn() {
    if(gameMode === 'SINGLE' && currentPlayer === 'O' && !isBoardLocked) {
        isBoardLocked = true; 
        setTimeout(aiMove, 600); 
    }
}

function getEmptySpots(b) {
    return b.map((val, i) => val === ' ' ? i : null).filter(val => val !== null);
}

function aiMove() {
    if (state !== 'PLAYING') return;
    isBoardLocked = false;
    let empty = getEmptySpots(board);
    if(empty.length === 0) return;

    let move = -1;

    if(difficulty === 'EASY') {
        move = empty[Math.floor(Math.random() * empty.length)];
    } 
    else if (difficulty === 'MEDIUM') {
        for(let i of empty) {
            let bCopy = [...board]; bCopy[i] = 'O';
            if(checkWin(bCopy, 'O')) { move = i; break; }
        }
        if(move === -1) {
            for(let i of empty) {
                let bCopy = [...board]; bCopy[i] = 'X';
                if(checkWin(bCopy, 'X')) { move = i; break; }
            }
        }
        if(move === -1) move = empty[Math.floor(Math.random() * empty.length)];
    } 
    else { 
        let bestScore = -Infinity;
        move = empty[Math.floor(Math.random() * empty.length)];
        for(let i of empty) {
            board[i] = 'O';
            let score = minimax(board, 0, false);
            board[i] = ' ';
            if(score > bestScore) {
                bestScore = score;
                move = i;
            }
        }
    }

    makeMove(move, 'O');
}

function minimax(b, depth, isMaximizing) {
    if(checkWin(b, 'O')) return 10 - depth;
    if(checkWin(b, 'X')) return depth - 10;
    if(checkDraw(b)) return 0;

    let empty = getEmptySpots(b);

    if(isMaximizing) {
        let best = -Infinity;
        for(let i of empty) {
            b[i] = 'O';
            best = Math.max(best, minimax(b, depth + 1, false));
            b[i] = ' ';
        }
        return best;
    } else {
        let best = Infinity;
        for(let i of empty) {
            b[i] = 'X';
            best = Math.min(best, minimax(b, depth + 1, true));
            b[i] = ' ';
        }
        return best;
    }
}