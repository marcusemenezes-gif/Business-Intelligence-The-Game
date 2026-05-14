const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- CONFIGURAÇÃO DE RESOLUÇÃO INTERNA ---
const internalWidth = 1200;
const internalHeight = 600;

function resize() {
    const windowRatio = window.innerWidth / window.innerHeight;
    const gameRatio = internalWidth / internalHeight;

    if (windowRatio < gameRatio) {
        canvas.style.width = "100%";
        canvas.style.height = "auto";
    } else {
        canvas.style.width = "auto";
        canvas.style.height = "100%";
    }
}

// Configura o tamanho real do canvas (resolução interna)
canvas.width = internalWidth;
canvas.height = internalHeight;
window.addEventListener("resize", resize);
resize();

// --- TELA CHEIA AO CLICAR ---
canvas.addEventListener("click", () => {
    if (!document.fullscreenElement) {
        canvas.requestFullscreen().catch(err => {
            console.log(`Erro ao tentar modo tela cheia: ${err.message}`);
        });
    }
});

// --- VARIÁVEIS DO JOGO (CONTINUAÇÃO DO CÓDIGO ANTERIOR) ---
let gameState = "menu"; 
const keys = {};
let score = 0;
let dataQuality = 100;
let gameTimer = 60; 
let timerInterval;
let difficultyMultiplier = 1;
let bgOffset = 0;
let scoreHistory = []; 
const maxHistory = 40;  

let player = {
    x: 580, y: 530, width: 40, height: 50,
    baseHeight: 50, dx: 0, dy: 0,
    speed: 10, jumpPower: -15, gravity: 0.8,
    isJumping: false, isCrouching: false
};

const groundY = 530; 
let dataBlocks = [];
let spawnTimer;

// --- FUNÇÕES DE DESENHO (MANTIDAS) ---
function drawBackground() {
    let bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, "#05070a");
    bgGrad.addColorStop(1, "#0f172a");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    bgOffset += 0.5;
    ctx.strokeStyle = "rgba(0, 242, 255, 0.1)";
    ctx.lineWidth = 1;
    for (let i = -40; i < canvas.width; i += 40) {
        ctx.beginPath(); 
        ctx.moveTo(i + (bgOffset % 40), 0); 
        ctx.lineTo(i + (bgOffset % 40), canvas.height); 
        ctx.stroke();
    }
}

function drawPlayer(x, y) {
    const p = 3; 
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(x, groundY + 45, 40, 10);

    if (player.isCrouching) {
        ctx.fillStyle = "#1a252f";
        ctx.fillRect(x + (p * 2), y + (p * 11), p * 3, p * 3); 
        ctx.fillRect(x + (p * 7), y + (p * 11), p * 3, p * 3); 
        ctx.fillStyle = "#2c3e50";
        ctx.fillRect(x + (p * 3), y + (p * 6), p * 7, p * 6); 
        ctx.fillStyle = "#ffdbac";
        ctx.fillRect(x + (p * 4.5), y + (p * 7), p * 4, p * 4);
        ctx.fillStyle = "#2c3e50"; 
        ctx.fillRect(x + (p * 2.5), y + (p * 5), p * 2, p * 4); 
        ctx.fillRect(x + (p * 8.5), y + (p * 5), p * 2, p * 4); 
        ctx.fillStyle = "#ffdbac"; 
        ctx.fillRect(x + (p * 4), y + (p * 5), p * 3, p * 2); 
        ctx.fillRect(x + (p * 7), y + (p * 5), p * 3, p * 2); 
    } else {
        ctx.fillStyle = "#ffdbac"; ctx.fillRect(x + (p * 4), y, p * 4, p * 4); 
        ctx.fillStyle = "#3e2723"; ctx.fillRect(x + (p * 4), y, p * 4, p * 1); 
        ctx.fillStyle = "#2c3e50"; ctx.fillRect(x + (p * 3), y + (p * 4), p * 6, p * 7); 
        ctx.fillStyle = "white"; ctx.fillRect(x + (p * 5), y + (p * 4), p * 2, p * 3); 
        ctx.fillStyle = "#2c3e50";
        ctx.fillRect(x + (p * 1), y + (p * 4), p * 2, p * 5); 
        ctx.fillRect(x + (p * 9), y + (p * 4), p * 2, p * 5); 
        ctx.fillStyle = "#ffdbac"; 
        ctx.fillRect(x + (p * 1), y + (p * 9), p * 2, p * 2);
        ctx.fillRect(x + (p * 9), y + (p * 9), p * 2, p * 2);
        ctx.fillStyle = "#1a252f"; ctx.fillRect(x + (p * 3), y + (p * 11), p * 2, p * 5); 
        ctx.fillRect(x + (p * 7), y + (p * 11), p * 2, p * 5); 
    }
}

function drawDataIcon(block) {
    ctx.shadowBlur = 12;
    ctx.shadowColor = block.type === 'good' ? "#00ff88" : "#ff0000";
    if (block.type === 'good') {
        ctx.fillStyle = "#f1c40f"; 
        ctx.fillRect(block.x + 2, block.y + 6, block.width - 4, block.height - 8);
        ctx.fillRect(block.x + 2, block.y + 2, block.width / 2, 4);
    } else {
        ctx.fillStyle = "#ff4d4d";
        ctx.fillRect(block.x + 4, block.y + 4, block.width - 8, block.height - 8);
        ctx.fillStyle = "#000";
        ctx.fillRect(block.x + 7, block.y + 8, 4, 4); ctx.fillRect(block.x + 15, block.y + 8, 4, 4);
        ctx.fillRect(block.x + 7, block.y + 16, 12, 2);
    }
    ctx.shadowBlur = 0;
}

function drawScoreChart(x, y, width, height) {
    if (scoreHistory.length < 2) return;
    ctx.strokeStyle = "#00ff88"; ctx.lineWidth = 2; ctx.beginPath();
    let step = width / (maxHistory - 1);
    let maxVal = Math.max(...scoreHistory, 5000); 
    for (let i = 0; i < scoreHistory.length; i++) {
        let pX = x + (i * step);
        let pY = y + height - (scoreHistory[i] / maxVal * height);
        if (i === 0) ctx.moveTo(pX, pY); else ctx.lineTo(pX, pY);
    }
    ctx.stroke();
    ctx.lineTo(x + (scoreHistory.length - 1) * step, y + height);
    ctx.lineTo(x, y + height); ctx.fillStyle = "rgba(0, 255, 136, 0.1)"; ctx.fill();
}

function startMatch() {
    gameState = "playing"; score = 0; dataQuality = 100; gameTimer = 60; difficultyMultiplier = 1; 
    dataBlocks = []; scoreHistory = [0]; player.y = groundY; player.dy = 0;
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        gameTimer--;
        scoreHistory.push(score);
        if (scoreHistory.length > maxHistory) scoreHistory.shift();
        if (gameTimer % 15 === 0 && gameTimer > 0) { difficultyMultiplier += 0.4; startSpawning(); }
        if (gameTimer <= 0) { gameState = "win"; clearInterval(timerInterval); clearInterval(spawnTimer); }
    }, 1000);
    startSpawning();
}

function startSpawning() {
    if (spawnTimer) clearInterval(spawnTimer);
    let interval = Math.max(180, 550 / difficultyMultiplier);
    spawnTimer = setInterval(() => { if (gameState === "playing") spawnData(); }, interval);
}

function spawnData() {
    let badChance = Math.min(0.8, 0.35 * difficultyMultiplier);
    let type = Math.random() < badChance ? 'bad' : 'good';
    dataBlocks.push({ 
        x: Math.random() * (canvas.width - 30), y: 85, width: 24, height: 24, type: type, 
        speed: (type === 'bad' ? 5 : 3) * (0.8 + difficultyMultiplier * 0.2) 
    });
}

function update() {
    if (gameState !== "playing") { draw(); requestAnimationFrame(update); return; }

    let currentSpeed = player.isCrouching ? player.speed / 2 : player.speed;
    if (keys["ArrowRight"] || keys["KeyD"]) player.x += currentSpeed;
    if (keys["ArrowLeft"] || keys["KeyA"]) player.x -= currentSpeed;

    if ((keys["ArrowUp"] || keys["KeyW"] || keys["Space"]) && !player.isJumping) {
        player.dy = player.jumpPower; player.isJumping = true;
    }

    if (keys["ArrowDown"] || keys["KeyS"]) {
        player.isCrouching = true;
        player.height = player.baseHeight * 0.6;
    } else {
        player.isCrouching = false;
        player.height = player.baseHeight;
    }

    player.dy += player.gravity;
    player.y += player.dy;

    let floor = groundY + (player.baseHeight - player.height);
    if (player.y > floor) { player.y = floor; player.dy = 0; player.isJumping = false; }

    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    dataBlocks.forEach((block, index) => {
        block.y += block.speed;
        if (player.x < block.x + block.width && player.x + player.width > block.x &&
            player.y < block.y + block.height && player.y + player.height > block.y) {
            if (block.type === 'good') { 
                score += 500; dataQuality = Math.min(dataQuality + 4, 100); 
            } else { 
                score = Math.max(0, score - 200); dataQuality -= 12; 
            }
            dataBlocks.splice(index, 1);
        }
        if (block.y > canvas.height) {
            if (block.type === 'good') {
                score = Math.max(0, score - 100); 
                dataQuality = Math.max(0, dataQuality - 2); 
            }
            dataBlocks.splice(index, 1);
        }
    });

    if (dataQuality <= 0) { gameState = "gameover"; clearInterval(timerInterval); clearInterval(spawnTimer); }
    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (gameState === "menu") {
        drawBackground();
        ctx.fillStyle = "rgba(0,0,0,0.8)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#00f2ff"; ctx.textAlign = "center"; ctx.font = "bold 40px Courier New";
        ctx.fillText("BI-SPRINT", canvas.width / 2, 200);
        ctx.fillStyle = "white"; ctx.font = "16px Arial";
        ctx.fillText("CLIQUE NA TELA PARA TELA CHEIA | ESPAÇO PARA INICIAR", canvas.width / 2, 260);
    } 
    else if (gameState === "playing") {
        drawBackground();
        dataBlocks.forEach(block => drawDataIcon(block));
        drawPlayer(player.x, player.y);

        ctx.fillStyle = "rgba(5, 10, 20, 0.95)"; ctx.fillRect(0, 0, canvas.width, 85); 
        ctx.strokeStyle = "#00f2ff"; ctx.lineWidth = 2; ctx.strokeRect(0, 0, canvas.width, 85);
        ctx.fillStyle = "#00f2ff"; ctx.font = "bold 13px Courier New"; ctx.textAlign = "left";
        ctx.fillText(`RECEITA: $${score}`, 20, 25);
        drawScoreChart(20, 35, 150, 35);
        ctx.textAlign = "center"; ctx.fillStyle = gameTimer <= 10 ? "#ff4d4d" : "#00f2ff";
        ctx.font = "bold 18px Courier New"; ctx.fillText(`FECHAMENTO: ${gameTimer}s`, canvas.width/2, 45);
        let barWidth = 150; let barX = canvas.width - 170;
        ctx.fillStyle = "white"; ctx.textAlign = "right"; ctx.fillText(`QUALIDADE:`, barX - 10, 45); 
        ctx.strokeStyle = "#00f2ff"; ctx.strokeRect(barX, 30, barWidth, 20);
        ctx.fillStyle = dataQuality > 30 ? "#00ff88" : "#ff4d4d";
        ctx.fillRect(barX + 2, 32, (dataQuality * (barWidth / 100)) - 4, 16); 
    } 
    else {
        drawBackground();
        ctx.fillStyle = "rgba(0,0,0,0.9)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.textAlign = "center"; ctx.fillStyle = "#00f2ff"; ctx.font = "bold 35px Courier New";
        ctx.fillText(gameState === "win" ? "SPRINT FINALIZADA" : "BANCO DE DADOS CORROMPIDO", canvas.width / 2, 200);
        ctx.fillStyle = "white"; ctx.font = "25px Arial";
        ctx.fillText(`Faturamento: $${score}`, canvas.width / 2, 300);
    }
}

window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (e.code === "Escape") { gameState = "menu"; clearInterval(timerInterval); clearInterval(spawnTimer); }
    if (e.code === "Space" && (gameState !== "playing")) startMatch();
});
window.addEventListener("keyup", (e) => keys[e.code] = false);

update();