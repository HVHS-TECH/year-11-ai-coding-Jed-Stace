// Game Variables
const gameContainer = document.getElementById('gameContainer');
const target = document.getElementById('target');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOver');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const nameInput = document.getElementById('nameInput');
const gun = document.getElementById('gun');
const crosshair = document.getElementById('crosshair');
const leaderboardDiv = document.getElementById('leaderboard');

const targetCountDisplay = document.getElementById('targetCount');
const timerDisplay = document.getElementById('timer');
const scoreDisplay = document.getElementById('score');
const avgReactionDisplay = document.getElementById('avgReaction');

const finalTargets = document.getElementById('finalTargets');
const finalScore = document.getElementById('finalScore');
const finalAvgReaction = document.getElementById('finalAvgReaction');

let gameActive = false;
let gameStarted = false;
let targetsHit = 0;
let totalScore = 0;
let reactionTimes = [];
let gameTime = 60;
let targetAppearTime = 0;
let timerInterval = null;
let targetTimeout = null;
let playerName = 'Player';
const MAX_LEADERBOARD = 10;

let mouseX = 0;
let mouseY = 0;

// Mouse tracking for gun rotation
document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;

  // Rotate gun to track mouse position
  if (gameStarted && gun.style.display === 'block') {
    const gunRect = gun.getBoundingClientRect();
    const gunCenterX = gunRect.left + gunRect.width / 2;
    const gunCenterY = gunRect.top + gunRect.height / 2;

    // Calculate angle to mouse
    const dx = mouseX - gunCenterX;
    const dy = mouseY - gunCenterY;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    // Apply rotation to gun while keeping 3D perspective
    gun.style.transform = `rotateX(15deg) rotateZ(5deg) rotateY(${angle * 0.3}deg) rotateX(${angle * 0.2}deg)`;
  }
});

// Start Game
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

function startGame() {
  // Get player name
  playerName = nameInput.value.trim() || 'Anonymous';
  
  // Reset variables
  gameActive = true;
  gameStarted = true;
  targetsHit = 0;
  totalScore = 0;
  reactionTimes = [];
  gameTime = 60;

  // Hide screens
  startScreen.style.display = 'none';
  gameOverScreen.style.display = 'none';

  // Show gun and hide crosshair
  gun.style.display = 'block';
  crosshair.style.display = 'none';

  // Show first target
  showTarget();

  // Start timer
  timerInterval = setInterval(updateTimer, 1000);
}

function showTarget() {
  if (!gameActive) return;

  // Random position (ensure target stays within bounds)
  const maxX = gameContainer.offsetWidth - 50;
  const maxY = gameContainer.offsetHeight - 50;

  const x = Math.random() * maxX;
  const y = Math.random() * maxY;

  target.style.left = x + 'px';
  target.style.top = y + 'px';
  target.style.display = 'block';

  targetAppearTime = Date.now();

  // Set timeout to hide target if not clicked (3 seconds max)
  clearTimeout(targetTimeout);
  targetTimeout = setTimeout(() => {
    if (gameActive) {
      target.style.display = 'none';
      showTarget();
    }
  }, 3000);
}

// Track misclicks on game container
gameContainer.addEventListener('click', (e) => {
  if (!gameActive || e.target !== gameContainer) return;

  // This is a misclick (clicked on empty space)
  totalScore = Math.max(0, totalScore - 1);
  showMissClickFeedback(e.clientX, e.clientY);
  updateStats();
});

// Target Click Handler
target.addEventListener('click', (e) => {
  if (!gameActive) return;

  e.stopPropagation();

  // Calculate reaction time
  const reactionTime = Date.now() - targetAppearTime;
  reactionTimes.push(reactionTime);

  // Add score (faster = more points)
  const points = Math.max(100 - Math.floor(reactionTime / 10), 10);
  totalScore += points;

  targetsHit++;

  // Fire bullet from gun toward center of screen (crosshair aim point)
  fireBullet(e.clientX, e.clientY);

  // Gun recoil effect
  gunRecoil();

  // Visual feedback
  target.classList.add('hit');
  setTimeout(() => {
    target.classList.remove('hit');
  }, 300);

  // Floating feedback
  showHitFeedback(e.clientX, e.clientY, reactionTime);

  // Update display
  updateStats();

  // Check if game should end (15 targets hit)
  if (targetsHit >= 15) {
    endGame();
  } else {
    // Show next target with slight delay
    setTimeout(() => {
      if (gameActive) showTarget();
    }, 300);
  }
});

function fireBullet(targetX, targetY) {
  const bullet = document.createElement('div');
  bullet.className = 'bullet';

  // Get gun position and calculate bullet start position from gun barrel
  const gunRect = gun.getBoundingClientRect();
  
  // Gun barrel muzzle is at approximately (260, 76) in the SVG
  // Scale barrel position to actual gun dimensions
  const barrelOffsetX = 260;
  const barrelOffsetY = 76;
  
  const scaledBarrelX = (barrelOffsetX / 280) * gunRect.width;
  const scaledBarrelY = (barrelOffsetY / 200) * gunRect.height;
  
  const startX = gunRect.left + scaledBarrelX;
  const startY = gunRect.top + scaledBarrelY;

  bullet.style.left = startX + 'px';
  bullet.style.top = startY + 'px';

  document.body.appendChild(bullet);

  // Calculate distance and angle to target
  const dx = targetX - startX;
  const dy = targetY - startY;

  // Animate bullet
  const duration = 300; // milliseconds
  const startTime = Date.now();

  function animateBullet() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const currentX = startX + dx * progress;
    const currentY = startY + dy * progress;

    bullet.style.left = currentX + 'px';
    bullet.style.top = currentY + 'px';

    if (progress < 1) {
      requestAnimationFrame(animateBullet);
    } else {
      bullet.style.animation = 'bulletTravel 0.3s ease-out forwards';
      setTimeout(() => {
        document.body.removeChild(bullet);
      }, 300);
    }
  }

  animateBullet();
}

function gunRecoil() {
  // Recoil animation - add scale effect on top of current rotation
  const currentTransform = gun.style.transform;
  gun.style.transition = 'transform 0.08s ease-out';
  gun.style.transform = currentTransform + ' scale(1.05)';

  setTimeout(() => {
    gun.style.transition = 'transform 0.15s ease-out';
    gun.style.transform = currentTransform + ' scale(1)';
  }, 80);
}

function updateTimer() {
  gameTime--;
  timerDisplay.textContent = gameTime;

  if (gameTime <= 0) {
    endGame();
  }
}

function updateStats() {
  targetCountDisplay.textContent = targetsHit;
  scoreDisplay.textContent = totalScore;

  if (reactionTimes.length > 0) {
    const avgReaction = Math.floor(
      reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
    );
    avgReactionDisplay.textContent = avgReaction;
  }
}

function endGame() {
  gameActive = false;
  gameStarted = false;
  clearInterval(timerInterval);
  clearTimeout(targetTimeout);
  target.style.display = 'none';
  gun.style.display = 'none';
  crosshair.style.display = 'none';

  // Calculate final stats
  const avgReaction =
    reactionTimes.length > 0
      ? Math.floor(
          reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
        )
      : 0;

  // Display final stats
  finalTargets.textContent = targetsHit;
  finalScore.textContent = totalScore;
  finalAvgReaction.textContent = avgReaction;

  // Save score to leaderboard
  saveScoreToLeaderboard(playerName, totalScore);
  displayLeaderboard();

  // Show game over screen
  gameOverScreen.style.display = 'flex';
}

function saveScoreToLeaderboard(name, score) {
  // Get existing leaderboard
  let leaderboard = JSON.parse(localStorage.getItem('shooterLeaderboard')) || [];

  // Add new score
  leaderboard.push({ name, score, date: new Date().toLocaleDateString() });

  // Sort by score descending
  leaderboard.sort((a, b) => b.score - a.score);

  // Keep only top 10
  leaderboard = leaderboard.slice(0, MAX_LEADERBOARD);

  // Save back to localStorage
  localStorage.setItem('shooterLeaderboard', JSON.stringify(leaderboard));
}

function displayLeaderboard() {
  const leaderboard = JSON.parse(localStorage.getItem('shooterLeaderboard')) || [];

  if (leaderboard.length === 0) {
    leaderboardDiv.innerHTML = '<div class="leaderboard-entry">No scores yet. Be the first!</div>';
    return;
  }

  let html = '';
  leaderboard.forEach((entry, index) => {
    html += `
      <div class="leaderboard-entry">
        <span class="leaderboard-rank">#${index + 1}</span>
        <span class="leaderboard-name">${entry.name}</span>
        <span class="leaderboard-score">${entry.score}</span>
      </div>
    `;
  });

  leaderboardDiv.innerHTML = html;
}

function showHitFeedback(x, y, time) {
  const feedback = document.createElement('div');
  feedback.className = 'hit-feedback';
  feedback.textContent = '+' + Math.max(100 - Math.floor(time / 10), 10);
  feedback.style.left = x + 'px';
  feedback.style.top = y + 'px';
  document.body.appendChild(feedback);

  feedback.style.animation = 'fadeOut 1s ease-out forwards';

  setTimeout(() => {
    document.body.removeChild(feedback);
  }, 1000);
}

function showMissClickFeedback(x, y) {
  const feedback = document.createElement('div');
  feedback.className = 'hit-feedback';
  feedback.textContent = '-1';
  feedback.style.left = x + 'px';
  feedback.style.top = y + 'px';
  feedback.style.color = '#ff4444';
  feedback.style.textShadow = '0 0 5px #ff4444';
  document.body.appendChild(feedback);

  feedback.style.animation = 'fadeOut 1s ease-out forwards';

  setTimeout(() => {
    document.body.removeChild(feedback);
  }, 1000);
}

console.log('🎮 FPS Shooter Reaction Time Game loaded!');