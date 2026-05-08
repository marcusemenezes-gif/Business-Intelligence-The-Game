const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- ESTADOS E VARIÁVEIS GLOBAIS ---
let gameState = "menu"; 
const keys = {};
let score = 0;
let dataQuality = 100;
let gameTimer = 60; 
let timerInterval;
let difficultyMultiplier = 1;
let bgOffset = 0;

// Lógica do Gráfico de BI
let scoreHistory = []; 
const maxHistory = 40;  

let player = {
    x: 580, y: 530, width: 40, height: 50,
    dx: 0, speed: 11 
};

let dataBlocks = [];
let spawnTimer;

// --- 1. CENÁRIO TECNOLÓGICO ---
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
    for (let i = -40; i < canvas.height; i += 40) {
        ctx.beginPath(); 
        ctx.moveTo(0, i + (bgOffset % 40)); 
        ctx.lineTo(canvas.width, i + (bgOffset % 40)); 
        ctx.stroke();
    }
}

// --- 2. O ANALISTA (AGORA COM BRAÇOS!) ---
function drawPlayer(x, y) {
    const p = 3; // Escala dos "pixels" do boneco
    
    // Sombra
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(x, y + 45, 40, 10);

    // Cabeça e Cabelo
    ctx.fillStyle = "#ffdbac"; 
    ctx.fillRect(x + (p * 4), y, p * 4, p * 4); 
    ctx.fillStyle = "#3e2723"; 
    ctx.fillRect(x + (p * 4), y, p * 4, p * 1); 

    // Tronco (Camisa de Analista)
    ctx.fillStyle = "#2c3e50"; 
    ctx.fillRect(x + (p * 3), y + (p * 4), p * 6, p * 7); 
    ctx.fillStyle = "white"; 
    ctx.fillRect(x + (p * 5), y + (p * 4), p * 2, p * 3); 

    // BRAÇO ESQUERDO
    ctx.fillStyle = "#2c3e50"; // Manga
    ctx.fillRect(x + (p * 1), y + (p * 4), p * 2, p * 5); 
    ctx.fillStyle = "#ffdbac"; // Mão
    ctx.fillRect(x + (p * 1), y + (p * 9), p * 2, p * 2);

    // BRAÇO DIREITO
    ctx.fillStyle = "#2c3e50"; // Manga
    ctx.fillRect(x + (p * 9), y + (p * 4), p * 2, p * 5);
    ctx.fillStyle = "#ffdbac"; // Mão
    ctx.fillRect(x + (p * 9), y + (p * 9), p * 2, p * 2);

    // Pernas
    ctx.fillStyle = "#1a252f"; 
    ctx.fillRect(x + (p * 3), y + (p * 11), p * 2, p * 4); 
    ctx.fillRect(x + (p * 7), y + (p * 11), p * 2, p * 4); 
}

// --- 3. ÍCONES: PASTAS E HACKS ---
function drawDataIcon(block) {
    ctx.shadowBlur = 12;
    ctx.shadowColor = block.type === 'good' ? "#00ff88" : "#ff0000";
    
    if (block.type === 'good') {
        // Pasta amarela (reduzida)
        ctx.fillStyle = "#f1c40f"; 
        ctx.fillRect(block.x + 2, block.y + 6, block.width - 4, block.height - 8);
        ctx.fillRect(block.x + 2, block.y + 2, block.width / 2, 4);
        ctx.fillStyle = "white";
        ctx.fillRect(block.x + 5, block.y + 8, block.width - 10, 2);
    } else {
        // Símbolo de Hack/Erro
        ctx.fillStyle = "#ff4d4d";
        ctx.fillRect(block.x + 4, block.y + 4, block.width - 8, block.height - 8);
        ctx.fillStyle = "#000";
        ctx.fillRect(block.x + 7, block.y + 8, 4, 4); 
        ctx.fillRect(block.x + 15, block.y + 8, 4, 4);
        ctx.fillRect(block.x + 7, block.y + 16, 12, 2);
    }
    ctx.shadowBlur = 0;
}

// --- 4. GRÁFICO DE RECEITA ---
function drawScoreChart(x, y, width, height) {
    if (scoreHistory.length < 2) return;
    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 2;
    ctx.beginPath();
    let step = width / (maxHistory - 1);
    let maxVal = Math.max(...scoreHistory, 5000); 
    for (let i = 0; i < scoreHistory.length; i++) {
        let pointX = x + (i * step);
        let pointY = y + height - (scoreHistory[i] / maxVal * height);
        if (i === 0) ctx.moveTo(pointX, pointY);
        else ctx.lineTo(pointX, pointY);
    }
    ctx.stroke();
    ctx.lineTo(x + (scoreHistory.length - 1) * step, y + height);
    ctx.lineTo(x, y + height);
    ctx.fillStyle = "rgba(0, 255, 136, 0.1)";
    ctx.fill();
}

// --- 5. LÓGICA DO JOGO ---
function startMatch() {
    gameState = "playing";
    score = 0; dataQuality = 100; gameTimer = 60; difficultyMultiplier = 1; 
    dataBlocks = []; scoreHistory = [0]; 
    
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
    let xPosition = Math.random() * (canvas.width - 30);
    dataBlocks.push({ 
        x: xPosition, y: 85, width: 24, height: 24, type: type, 
        speed: (type === 'bad' ? 5 : 3) * (0.8 + difficultyMultiplier * 0.2) 
    });
}

function update() {
    if (gameState !== "playing") { draw(); requestAnimationFrame(update); return; }
    if (keys["ArrowRight"] || keys["KeyD"]) player.x += player.speed;
    if (keys["ArrowLeft"] || keys["KeyA"]) player.x -= player.speed;
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    dataBlocks.forEach((block, index) => {
        block.y += block.speed;
        if (player.x < block.x + block.width && player.x + player.width > block.x &&
            player.y < block.y + block.height && player.y + player.height > block.y) {
            if (block.type === 'good') { 
                score += 500; // Cada pasta = 500 pontos
                dataQuality = Math.min(dataQuality + 4, 100); 
            } else { 
                score = Math.max(0, score - 200); 
                dataQuality -= 12; 
            }
            dataBlocks.splice(index, 1);
        }
        if (block.y > canvas.height) dataBlocks.splice(index, 1);
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
        ctx.fillStyle = "#00f2ff"; ctx.textAlign = "center"; ctx.font = "bold 45px Courier New";
        ctx.fillText("BANCO DE DADOS: SPRINT", canvas.width / 2, 200);
        ctx.fillStyle = "white"; ctx.font = "20px Arial";
        ctx.fillText("PRESSIONE 'ESPAÇO' PARA SINCRONIZAR", canvas.width / 2, 380);
    } 
    else if (gameState === "playing") {
        drawBackground();
        dataBlocks.forEach(block => drawDataIcon(block));
        drawPlayer(player.x, player.y);

        // DASHBOARD
        ctx.fillStyle = "rgba(5, 10, 20, 0.95)";
        ctx.fillRect(0, 0, canvas.width, 85); 
        ctx.strokeStyle = "#00f2ff"; ctx.lineWidth = 2; ctx.strokeRect(0, 0, canvas.width, 85);

        // Receita e Gráfico
        ctx.fillStyle = "#00f2ff"; ctx.font = "bold 13px Courier New"; ctx.textAlign = "left";
        ctx.fillText(`RECEITA: $${score}`, 20, 25);
        drawScoreChart(20, 35, 150, 35);

        // Timer
        ctx.textAlign = "center";
        ctx.fillStyle = gameTimer <= 10 ? "#ff4d4d" : "#00f2ff";
        ctx.font = "bold 18px Courier New";
        ctx.fillText(`FECHAMENTO: ${gameTimer}s`, canvas.width/2, 45);

        // Qualidade
        let barWidth = 150;
        let barX = canvas.width - 170;
        ctx.fillStyle = "white"; ctx.textAlign = "right";
        ctx.fillText(`QUALIDADE:`, barX - 10, 45); 
        ctx.strokeStyle = "#00f2ff"; ctx.strokeRect(barX, 30, barWidth, 20);
        ctx.fillStyle = dataQuality > 30 ? "#00ff88" : "#ff4d4d";
        ctx.fillRect(barX + 2, 32, (dataQuality * (barWidth / 100)) - 4, 16); 
    } 
    else {
        drawBackground();
        ctx.fillStyle = "rgba(0,0,0,0.9)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.textAlign = "center"; ctx.fillStyle = "#00f2ff"; ctx.font = "bold 35px Courier New";
        ctx.fillText(gameState === "win" ? "BANCO DE DADOS OTIMIZADO" : "FALHA NA INTEGRIDADE", canvas.width / 2, 200);
        ctx.fillStyle = "white"; ctx.font = "25px Arial";
        ctx.fillText(`Receita Final: $${score}`, canvas.width / 2, 300);
        ctx.font = "16px Courier New";
        ctx.fillText("> ESPAÇO PARA REBOOT | ESC PARA MENU", canvas.width / 2, 400);
    }
}

// Eventos
window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (e.code === "Escape") { gameState = "menu"; clearInterval(timerInterval); clearInterval(spawnTimer); }
    if (e.code === "Space" && (gameState !== "playing")) startMatch();
});
window.addEventListener("keyup", (e) => keys[e.code] = false);

update();