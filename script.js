/* ============================================
   Tic-Tac-Toe — Futuristic Edition
   Complete Game Logic with AI & Sound Effects
   ============================================ */

// ============================================
// GAME STATE
// ============================================
// The game state is stored in a simple array of 9 elements (indices 0–8),
// representing the 3×3 board read left-to-right, top-to-bottom.
// Each cell is either '' (empty), 'X', or 'O'.

const state = {
  board: ['', '', '', '', '', '', '', '', ''],   // 9-cell board
  currentPlayer: 'X',                             // 'X' always goes first
  gameActive: true,                               // Is the game in progress?
  mode: 'pvp',                                    // 'pvp' or 'pvc'
  difficulty: 'easy',                              // 'easy', 'medium', 'hard'
  scores: { X: 0, O: 0, draw: 0 },               // Scoreboard
  totalGames: 0,
  currentStreak: 0,
  lastWinner: null,
  soundEnabled: true,
};

// ============================================
// WINNING COMBINATIONS
// ============================================
// All possible ways to win: rows, columns, and diagonals.
// Winner detection works by checking if any of these 8 combinations
// contains three identical non-empty marks.

const WIN_COMBOS = [
  [0, 1, 2], // top row
  [3, 4, 5], // middle row
  [6, 7, 8], // bottom row
  [0, 3, 6], // left column
  [1, 4, 7], // middle column
  [2, 5, 8], // right column
  [0, 4, 8], // diagonal top-left to bottom-right
  [2, 4, 6], // diagonal top-right to bottom-left
];

// ============================================
// DOM REFERENCES
// ============================================
const cells = document.querySelectorAll('.cell');
const boardEl = document.getElementById('board');
const turnIndicator = document.getElementById('turn-indicator');
const turnSymbol = document.getElementById('turn-symbol');
const difficultyGroup = document.getElementById('difficulty-group');
const btnRestart = document.getElementById('btn-restart');
const btnResetScore = document.getElementById('btn-reset-score');
const soundToggle = document.getElementById('sound-toggle');
const scoreX = document.getElementById('score-x');
const scoreO = document.getElementById('score-o');
const scoreDraw = document.getElementById('score-draw');
const totalGamesEl = document.getElementById('total-games');
const currentStreakEl = document.getElementById('current-streak');
const popupOverlay = document.getElementById('popup-overlay');
const popupIcon = document.getElementById('popup-icon');
const popupTitle = document.getElementById('popup-title');
const popupMessage = document.getElementById('popup-message');
const btnPlayAgain = document.getElementById('btn-play-again');
const confettiCanvas = document.getElementById('confetti-canvas');
const confettiCtx = confettiCanvas.getContext('2d');

// Toggle button references
const modeBtns = document.querySelectorAll('#mode-toggle .toggle-btn');
const diffBtns = document.querySelectorAll('#difficulty-toggle .toggle-btn');

// ============================================
// SOUND EFFECTS (Web Audio API — no libraries)
// ============================================
// We generate all sounds programmatically using the Web Audio API.
// This avoids any external file dependencies.

let audioCtx = null;

/** Lazily initialize AudioContext (must happen after user gesture). */
function ensureAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

/** Play a soft click when placing a mark on the board. */
function playPlaceSound() {
  if (!state.soundEnabled) return;
  const ctx = ensureAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(700, ctx.currentTime);
  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.08);
}

/** Play a short 3-note chime for a win. */
function playWinSound() {
  if (!state.soundEnabled) return;
  const ctx = ensureAudioCtx();
  [523, 659, 784].forEach((freq, i) => {
    const t = ctx.currentTime + i * 0.12;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.25);
  });
}

/** Play a gentle low tone for a draw. */
function playDrawSound() {
  if (!state.soundEnabled) return;
  const ctx = ensureAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.3);
}

/** Play a simple click for buttons. */
function playClickSound() {
  if (!state.soundEnabled) return;
  const ctx = ensureAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1000, ctx.currentTime);
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.05);
}

/** Play a click for toggle switches (same as click). */
function playToggleSound() {
  playClickSound();
}

// ============================================
// CONFETTI SYSTEM
// ============================================
// Simple canvas-based confetti particles. Triggered ONLY when a human
// player wins (not the computer).

let confettiParticles = [];
let confettiAnimFrame = null;

function resizeConfettiCanvas() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
resizeConfettiCanvas();
window.addEventListener('resize', resizeConfettiCanvas);

/** Launch confetti particles. */
function launchConfetti() {
  confettiParticles = [];
  const colors = ['#00f0ff', '#ff00e5', '#39ff14', '#ffe600', '#ff6a00', '#ff2d55', '#ffffff'];
  for (let i = 0; i < 200; i++) {
    confettiParticles.push({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * confettiCanvas.height - confettiCanvas.height,
      w: Math.random() * 10 + 4,
      h: Math.random() * 6 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 4 + 2,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 8,
      opacity: 1,
    });
  }
  if (!confettiAnimFrame) animateConfetti();
}

/** Animate confetti loop. */
function animateConfetti() {
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  let alive = false;
  confettiParticles.forEach((p) => {
    if (p.opacity <= 0) return;
    alive = true;
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.05; // gravity
    p.rotation += p.rotSpeed;
    p.opacity -= 0.003;
    confettiCtx.save();
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate((p.rotation * Math.PI) / 180);
    confettiCtx.globalAlpha = Math.max(0, p.opacity);
    confettiCtx.fillStyle = p.color;
    confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    confettiCtx.restore();
  });
  if (alive) {
    confettiAnimFrame = requestAnimationFrame(animateConfetti);
  } else {
    confettiAnimFrame = null;
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }
}

// ============================================
// WINNER DETECTION
// ============================================
// We iterate over all 8 winning combinations. For each combo,
// we check if all three cells contain the same non-empty mark.
// Returns { winner: 'X'|'O'|null, combo: [indices]|null }.

function checkWinner(board) {
  for (const combo of WIN_COMBOS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], combo };
    }
  }
  return { winner: null, combo: null };
}

/** Check if the board is full (draw). */
function isBoardFull(board) {
  return board.every((cell) => cell !== '');
}

// ============================================
// COMPUTER AI
// ============================================
// Three difficulty levels:
//
// EASY: Picks a random empty cell.
// MEDIUM: 50% chance of using Minimax, 50% random.
// HARD: Full Minimax algorithm — unbeatable.
//
// MINIMAX ALGORITHM:
// A recursive search that evaluates every possible future game state.
// It assumes both players play optimally. The computer (maximizing player)
// picks the move that leads to the best guaranteed outcome:
//   +10 for a computer win, −10 for a player win, 0 for a draw.
// A depth penalty is applied so the AI prefers winning sooner.

function getComputerMove() {
  const emptyIndices = state.board
    .map((val, idx) => (val === '' ? idx : null))
    .filter((v) => v !== null);

  if (emptyIndices.length === 0) return -1;

  switch (state.difficulty) {
    case 'easy':
      return randomMove(emptyIndices);

    case 'medium':
      // 50% chance of smart play
      return Math.random() < 0.5 ? minimaxBest() : randomMove(emptyIndices);

    case 'hard':
      return minimaxBest();

    default:
      return minimaxBest();
  }
}

/** Pick a random move from available cells. */
function randomMove(emptyIndices) {
  return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
}

/** Find the best move using Minimax. Computer is always 'O'. */
function minimaxBest() {
  let bestScore = -Infinity;
  let bestMove = -1;
  const boardCopy = [...state.board];

  for (let i = 0; i < 9; i++) {
    if (boardCopy[i] !== '') continue;
    boardCopy[i] = 'O'; // Computer's mark
    const score = minimax(boardCopy, 0, false);
    boardCopy[i] = '';
    if (score > bestScore) {
      bestScore = score;
      bestMove = i;
    }
  }
  return bestMove;
}

/**
 * Minimax recursive scoring.
 * @param {string[]} board - Current board state.
 * @param {number} depth - How deep in the tree we are.
 * @param {boolean} isMaximizing - Is it the computer's turn?
 * @returns {number} The heuristic score of this board.
 */
function minimax(board, depth, isMaximizing) {
  const { winner } = checkWinner(board);

  // Terminal states
  if (winner === 'O') return 10 - depth;  // Computer wins (prefer sooner)
  if (winner === 'X') return depth - 10;  // Player wins (delay as long as possible)
  if (isBoardFull(board)) return 0;       // Draw

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] !== '') continue;
      board[i] = 'O';
      best = Math.max(best, minimax(board, depth + 1, false));
      board[i] = '';
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] !== '') continue;
      board[i] = 'X';
      best = Math.min(best, minimax(board, depth + 1, true));
      board[i] = '';
    }
    return best;
  }
}

// ============================================
// GAME LOGIC
// ============================================

/** Handle a cell click by the human player. */
function handleCellClick(e) {
  const cell = e.target;
  const index = parseInt(cell.dataset.index, 10);

  // Ignore if game over, cell taken, or it's computer's turn
  if (!state.gameActive) return;
  if (state.board[index] !== '') return;
  if (state.mode === 'pvc' && state.currentPlayer === 'O') return;

  makeMove(index);
}

/** Place a mark and check the result. */
function makeMove(index) {
  // Update state
  state.board[index] = state.currentPlayer;

  // Update UI
  const cell = cells[index];
  cell.textContent = state.currentPlayer;
  cell.classList.add(`cell--${state.currentPlayer.toLowerCase()}`, 'cell--taken');

  // Sound
  playPlaceSound();

  // Check for winner or draw
  const { winner, combo } = checkWinner(state.board);

  if (winner) {
    endGame(winner, combo);
    return;
  }

  if (isBoardFull(state.board)) {
    endGame(null, null);
    return;
  }

  // Switch turns
  state.currentPlayer = state.currentPlayer === 'X' ? 'O' : 'X';
  updateTurnIndicator();

  // If PvC and now computer's turn, make the AI move
  if (state.mode === 'pvc' && state.currentPlayer === 'O' && state.gameActive) {
    boardEl.classList.add('thinking');
    setTimeout(() => {
      const move = getComputerMove();
      if (move !== -1) makeMove(move);
      boardEl.classList.remove('thinking');
    }, 400); // small delay for UX
  }
}

/** End the game — show results, update score, maybe confetti. */
function endGame(winner, combo) {
  state.gameActive = false;
  state.totalGames++;

  if (winner) {
    // Highlight winning cells
    combo.forEach((idx) => cells[idx].classList.add('cell--winner'));

    // Update score
    state.scores[winner]++;

    // Streak tracking
    if (state.lastWinner === winner) {
      state.currentStreak++;
    } else {
      state.currentStreak = 1;
      state.lastWinner = winner;
    }

    // Determine if winner is a human (for confetti)
    const isHumanWin = !(state.mode === 'pvc' && winner === 'O');

    // Show popup
    setTimeout(() => {
      showPopup(winner, isHumanWin);
      if (isHumanWin) {
        playWinSound();
        launchConfetti();
      } else {
        playDrawSound(); // subdued sound for computer win
      }
    }, 500);
  } else {
    // Draw
    state.scores.draw++;
    state.currentStreak = 0;
    state.lastWinner = null;
    setTimeout(() => {
      showPopup(null, false);
      playDrawSound();
    }, 400);
  }

  updateScoreboard();
}

/** Display the result popup — shows "X Won", "O Won", or "Draw". */
function showPopup(winner, isHumanWin) {
  // Clear previous classes
  popupTitle.className = 'popup__title';

  if (winner) {
    popupIcon.textContent = isHumanWin ? '🏆' : '🤖';
    // Show "X Won" or "O Won" instead of "VICTORY"
    popupTitle.textContent = `${winner} WON!`;
    popupTitle.classList.add(winner === 'X' ? 'win-x' : 'win-o');

    if (state.mode === 'pvc') {
      popupMessage.textContent = isHumanWin
        ? `You beat the computer!`
        : `The computer wins this round.`;
    } else {
      popupMessage.textContent = `Player ${winner} wins the game!`;
    }
  } else {
    popupIcon.textContent = '🤝';
    popupTitle.textContent = "IT'S A DRAW!";
    popupTitle.classList.add('draw');
    popupMessage.textContent = 'No winner this round. Try again!';
  }

  popupOverlay.classList.add('active');
}

/** Hide the popup. */
function hidePopup() {
  popupOverlay.classList.remove('active');
}

// ============================================
// UI UPDATES
// ============================================

/** Update the turn indicator badge. */
function updateTurnIndicator() {
  turnSymbol.textContent = state.currentPlayer;
  turnIndicator.setAttribute('data-turn', state.currentPlayer);
}

/** Refresh the scoreboard numbers. */
function updateScoreboard() {
  scoreX.textContent = state.scores.X;
  scoreO.textContent = state.scores.O;
  scoreDraw.textContent = state.scores.draw;
  totalGamesEl.textContent = state.totalGames;
  currentStreakEl.textContent = state.currentStreak;

  // Bump animation
  [scoreX, scoreO, scoreDraw].forEach((el) => {
    el.classList.remove('bump');
    void el.offsetWidth; // force reflow
    el.classList.add('bump');
  });
}

/** Reset the board for a new game. */
function restartGame() {
  playClickSound();
  state.board = ['', '', '', '', '', '', '', '', ''];
  state.currentPlayer = 'X';
  state.gameActive = true;

  cells.forEach((cell) => {
    cell.textContent = '';
    cell.className = 'cell';
  });

  updateTurnIndicator();
  hidePopup();
}

/** Reset the scoreboard to zero. */
function resetScoreboard() {
  playClickSound();
  state.scores = { X: 0, O: 0, draw: 0 };
  state.totalGames = 0;
  state.currentStreak = 0;
  state.lastWinner = null;
  updateScoreboard();
}

// ============================================
// TOGGLE BUTTON HELPERS
// ============================================

/** Activate a button in a toggle group and deactivate siblings. */
function activateToggle(group, activeBtn) {
  group.querySelectorAll('.toggle-btn').forEach((btn) => btn.classList.remove('active'));
  activeBtn.classList.add('active');
}

// ============================================
// EVENT LISTENERS
// ============================================

// Cell clicks (no hover sound — only click)
cells.forEach((cell) => {
  cell.addEventListener('click', handleCellClick);
});

// Buttons
btnRestart.addEventListener('click', restartGame);
btnResetScore.addEventListener('click', resetScoreboard);
btnPlayAgain.addEventListener('click', () => {
  playClickSound();
  restartGame();
});

// Close popup by clicking overlay background
popupOverlay.addEventListener('click', (e) => {
  if (e.target === popupOverlay) {
    playClickSound();
    restartGame();
  }
});

// Mode toggle buttons
modeBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    if (btn.classList.contains('active')) return;
    playToggleSound();
    activateToggle(document.getElementById('mode-toggle'), btn);
    state.mode = btn.dataset.value;
    difficultyGroup.style.display = state.mode === 'pvc' ? 'flex' : 'none';
    restartGame();
  });
});

// Difficulty toggle buttons
diffBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    if (btn.classList.contains('active')) return;
    playToggleSound();
    activateToggle(document.getElementById('difficulty-toggle'), btn);
    state.difficulty = btn.dataset.value;
    restartGame();
  });
});

// Sound toggle
soundToggle.addEventListener('click', () => {
  state.soundEnabled = !state.soundEnabled;
  soundToggle.textContent = state.soundEnabled ? '🔊' : '🔇';
  soundToggle.classList.toggle('muted', !state.soundEnabled);
  if (state.soundEnabled) playClickSound();
});

// ============================================
// INITIALIZATION
// ============================================

updateTurnIndicator();
updateScoreboard();
