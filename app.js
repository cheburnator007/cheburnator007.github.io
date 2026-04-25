// --- ФАЗА 1: НАСТРОЙКА ХОЛСТА ---
const canvas = document.getElementById('drawingBoard');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth * 0.9;
    canvas.height = window.innerHeight * 0.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
}

window.addEventListener('resize', () => {
    resizeCanvas();
    drawTargetLetter(); 
});
resizeCanvas();

// --- ФАЗА 2: РАБОТА СО ШРИФТОМ И АЛФАВИТОМ ---
let targetFont = null;
let letterPath = null;
let targetLetter = ''; 

// Задаем наш словарь. 
// Я вписал алфавит иврита для отработки моторики письма справа-налево
const alphabet = Object.keys(lettersDictionary);

// Обновленная функция: выбирает букву и обновляет UI
function setRandomLetter() {
    const randomIndex = Math.floor(Math.random() * alphabet.length);
    targetLetter = alphabet[randomIndex];
    
    // Достаем данные выбранной буквы из словаря
    const letterInfo = lettersDictionary[targetLetter];

    // Выводим данные в HTML
    document.getElementById('letterTitle').innerText = letterInfo.name;
    document.getElementById('letterTrans').innerText = `Произношение: ${letterInfo.transcription}`;
    document.getElementById('letterDesc').innerText = letterInfo.desc;

    console.log(`🔀 Выбрана новая буква: ${targetLetter} (${letterInfo.name})`);
}

opentype.load('BN_World.ttf', function(err, font) {
    if (err) {
        console.error('Ошибка загрузки шрифта!', err);
        return;
    }
    targetFont = font;
    
    // При первом запуске берем случайную букву, а не фиксированную
    setRandomLetter(); 
    drawTargetLetter();
});

function drawTargetLetter() {
    if (!targetFont || !targetLetter) return;

    const fontSize = Math.min(canvas.width, canvas.height) * 0.8; 
    const textWidth = targetFont.getAdvanceWidth(targetLetter, fontSize);
    
    const startX = (canvas.width - textWidth) / 2;
    const startY = canvas.height * 0.45; 

    letterPath = targetFont.getPath(targetLetter, startX, startY, fontSize);
    letterPath.fill = '#e0e0e0'; 
    letterPath.draw(ctx);
}

// НОВАЯ ФУНКЦИЯ: Вызывается при нажатии кнопки "Далее ➔"
function nextLetter() {
    setRandomLetter(); // 1. Выбираем новую букву
    clearCanvas();     // 2. Очищаем холст (эта функция сама перерисует новую targetLetter)
}

// --- ФАЗА 3: ЗАХВАТ ВВОДА (ПОДДЕРЖКА ОТРЫВНЫХ ШТРИХОВ) ---
let isDrawing = false;
let userStroke = []; 

canvas.addEventListener('pointerdown', startDrawing);
canvas.addEventListener('pointermove', draw);
canvas.addEventListener('pointerup', stopDrawing);
canvas.addEventListener('pointercancel', stopDrawing);

function startDrawing(e) {
    isDrawing = true;
    ctx.beginPath(); // Начинаем новый визуальный штрих
    draw(e);
}

function draw(e) {
    if (!isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    userStroke.push({ x, y, timestamp: Date.now() });

    ctx.lineWidth = 8;
    ctx.strokeStyle = '#2c3e50';
    
    ctx.lineTo(x, y);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    ctx.beginPath(); // Сбрасываем путь, чтобы линии не склеивались
    console.log(`Штрих завершен. Всего точек в памяти: ${userStroke.length}`);
}

// --- ФАЗА 4: АЛГОРИТМ ПРОВЕРКИ (ТО, ЧТО ПОТЕРЯЛОСЬ) ---
function checkAccuracy() {
    if (!letterPath || userStroke.length === 0) {
        alert("Сначала нарисуй букву!");
        return;
    }

    const svgPathString = letterPath.toPathData(2); 
    const canvasPath = new Path2D(svgPathString);

    let hitCount = 0;
    ctx.lineWidth = 40; // Допуск погрешности (толщина эталона)

    for (let i = 0; i < userStroke.length; i++) {
        const point = userStroke[i];
        if (ctx.isPointInStroke(canvasPath, point.x, point.y)) {
            hitCount++;
        }
    }

    const accuracy = Math.round((hitCount / userStroke.length) * 100);
    
    // Вывод результата
    const resultElement = document.getElementById('resultText');
    if (accuracy >= 80) {
        resultElement.innerText = `Отлично! Точность: ${accuracy}% 🏆`;
        resultElement.style.color = "#4CAF50"; 
    } else if (accuracy >= 50) {
        resultElement.innerText = `Неплохо: ${accuracy}%. Попробуй ровнее!`;
        resultElement.style.color = "#FF9800"; 
    } else {
        resultElement.innerText = `Мимо: ${accuracy}%. Давай еще раз!`;
        resultElement.style.color = "#F44336"; 
    }
}

// --- КНОПКА: ОЧИСТКА ХОЛСТА ---
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    userStroke = []; // Сбрасываем память точек
    drawTargetLetter(); 
    
    const resultElement = document.getElementById('resultText');
    if(resultElement) {
        resultElement.innerText = "Нарисуй букву";
        resultElement.style.color = "#333";
    }
}
//НОВЫЙ