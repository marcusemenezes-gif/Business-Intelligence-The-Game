const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameState = "menu"; 
let difficulty = null;
const gravity = 0.8;
const keys = {};
let score = 0;
let dataQuality = 100;

let player = {
    x: 580, y: 530, width: 40, height: 50,
    dx: 0, speed: 10 
};

let dataBlocks = [];
let spawnInterval = 600;
let spawnTimer;

const diffSettings = {
    facil: { spawnTime: 800, badChance: 0.3, speedMult: 1 },
    medio: { spawnTime: 500, badChance: 0.6, speedMult: 1.3 },
    dificil: { spawnTime: 300, badChance: 0.8, speedMult: 1.7 }
};

// --- DESENHO DO ANALISTA ---
function drawPlayer(x, y) {
    const p = 3;
    ctx.fillStyle = "#ffdbac"; ctx.fillRect(x + (p * 4), y, p * 4, p * 4); 
    ctx.fillStyle = "#3e2723"; ctx.fillRect(x + (p * 4), y, p * 4, p * 1); 
    ctx.fillStyle = "#2c3e50"; ctx.fillRect(x + (p * 3), y + (p * 4), p * 6, p * 7);
    ctx.fillStyle = "#2c3e50"; ctx.fillRect(x + (p * 1), y + (p * 5), p * 2, p * 4); 
    ctx.fillStyle = "#555"; ctx.fillRect(x + (p * 2), y + (p * 6), p * 5, p * 4); 
    ctx.fillStyle = "#2c3e50"; ctx.fillRect(x + (p * 9), y + (p * 6), p * 3, p * 2); 
    ctx.fillStyle = "#ffdbac"; ctx.fillRect(x + (p * 11), y + (p * 5), p * 2, p * 1); 
    ctx.fillStyle = "white"; ctx.fillRect(x + (p * 5), y + (p * 4), p * 2, p * 3);
    ctx.fillStyle = "#e74c3c"; ctx.fillRect(x + (p * 5.5), y + (p * 4), p * 1, p * 4);
    ctx.fillStyle = "#1a252f"; ctx.fillRect(x + (p * 3), y + (p * 11), p * 2, p * 4); 
    ctx.fillRect(x + (p * 7), y + (p * 11), p * 2, p * 4); 
}

function drawMenu() {
    ctx.fillStyle = "#2c3e50";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.font = "bold 50px Arial";
    ctx.fillText("BUSINESS INTELLIGENCE: THE GAME", canvas.width / 2, 150);
    ctx.font = "25px Arial";
    ctx.fillText("Escolha a dificuldade:", canvas.width / 2, 230);
    ctx.fillStyle = "#27ae60"; ctx.fillText("[ 1 ] FÁCIL", canvas.width / 2, 300);
    ctx.fillStyle = "#f39c12"; ctx.fillText("[ 2 ] MÉDIO", canvas.width / 2, 350);
    ctx.fillStyle = "#e74c3c"; ctx.fillText("[ 3 ] DIFÍCIL", canvas.width / 2, 400);
    ctx.textAlign = "left";
}

function setDifficulty(level) {
    difficulty = diffSettings[level];
    spawnInterval = difficulty.spawnTime;
    gameState = "playing";
    if (spawnTimer) clearInterval(spawnTimer);
    spawnTimer = setInterval(() => { if (gameState === "playing") spawnData(); }, spawnInterval);
}

function spawnData() {
    let type = Math.random() < difficulty.badChance ? 'bad' : 'good';
    let xPosition = Math.random() * (canvas.width - 30);
    let baseSpeed = type === 'bad' ? (6 + Math.random() * 5) : (3 + Math.random() * 3);
    // Agora o bloco começa EXATAMENTE abaixo da barra azul (60px)
    dataBlocks.push({ x: xPosition, y: 60, width: 30, height: 30, type: type, speed: baseSpeed * difficulty.speedMult });
}

window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (gameState === "menu") {
        if (e.key === "1") setDifficulty("facil");
        if (e.key === "2") setDifficulty("medio");
        if (e.key === "3") setDifficulty("dificil");
    }
    if (e.code === "Space" && gameState === "gameover") {
        score = 0; dataQuality = 100; dataBlocks = []; player.x = 580; gameState = "menu";
    }
});
window.addEventListener("keyup", (e) => { keys[e.code] = false; });

function update() {
    if (gameState !== "playing") { draw(); requestAnimationFrame(update); return; }

    if (keys["ArrowRight"] || keys["KeyD"]) player.dx = player.speed;
    else if (keys["ArrowLeft"] || keys["KeyA"]) player.dx = -player.speed;
    else player.dx = 0;

    player.x += player.dx;
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    dataBlocks.forEach((block, index) => {
        block.y += block.speed;
        if (player.x < block.x + block.width && player.x + player.width > block.x &&
            player.y < block.y + block.height && player.y + player.height > block.y) {
            if (block.type === 'good') { score += 1000; dataQuality = Math.min(dataQuality + 5, 100); }
            else { score = Math.max(0, score - 300); dataQuality -= 10; }
            dataBlocks.splice(index, 1);
        }
        if (block.y > canvas.height) dataBlocks.splice(index, 1);
    });

    if (dataQuality <= 0) gameState = "gameover";
    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === "menu") {
        drawMenu();
    } 
    else if (gameState === "playing") {
        // 1. PRIMEIRO desenha os dados e o jogador (ficam no fundo)
        dataBlocks.forEach(block => {
            ctx.fillStyle = block.type === 'good' ? "#27ae60" : "#c0392b";
            ctx.fillRect(block.x, block.y, block.width, block.height);
            ctx.fillStyle = "white";
            ctx.font = "bold 12px Arial";
            ctx.fillText(block.type === 'good' ? "$" : "!", block.x + 8, block.y + 20);
        });

        drawPlayer(player.x, player.y);

        // 2. POR ÚLTIMO desenha a barra de Dashboard (fica no topo de tudo)
        ctx.fillStyle = "#2c3e50";
        ctx.fillRect(0, 0, canvas.width, 60); 
        
        ctx.fillStyle = "white";
        ctx.font = "bold 20px Arial";
        ctx.fillText(`RECEITA: $${score}`, 30, 38);
        
        let barX = canvas.width - 320;
        ctx.fillText(`QUALIDADE:`, barX, 38);
        ctx.strokeStyle = "white";
        ctx.strokeRect(barX + 130, 20, 150, 25);
        ctx.fillStyle = dataQuality > 30 ? "#27ae60" : "#c0392b";
        ctx.fillRect(barX + 131, 21, (dataQuality * 1.48), 23); 
    } 
    else if (gameState === "gameover") {
        ctx.fillStyle = "rgba(0,0,0,0.95)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#e74c3c";
        ctx.textAlign = "center";
        ctx.font = "bold 45px Arial";
        ctx.fillText("DATA CRASH: QUALIDADE EM 0%", canvas.width / 2, 250);
        ctx.fillStyle = "white";
        ctx.font = "30px Arial";
        ctx.fillText(`Score Final: $${score}`, canvas.width / 2, 320);
        ctx.font = "20px Arial";
        ctx.fillText("ESPAÇO PARA VOLTAR AO MENU", canvas.width / 2, 420);
        ctx.textAlign = "left";
    }
}

update();