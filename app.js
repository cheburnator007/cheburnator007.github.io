const canvas = document.getElementById('drawingBoard');
const ctx = canvas.getContext('2d');

// Функция для подгонки размера холста под экран
function resizeCanvas() {
    // Делаем холст на 90% ширины и 80% высоты экрана
    canvas.width = window.innerWidth * 0.9;
    canvas.height = window.innerHeight * 0.8;
    
    // Сбрасываем стили линии на будущее (чтобы линия была сглаженной)
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 10;
}

// Вызываем при старте и при перевороте экрана телефона
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

console.log("✅ Фаза 1 завершена: Холст инициализирован. Размеры:", canvas.width, "x", canvas.height);
// --- ФАЗА 2: РАБОТА СО ШРИФТОМ ---

let targetFont = null;
let letterPath = null;
const targetLetter = 'א'; // Буква, которую будем тренировать писать

// Загружаем твой шрифт BN_World.ttf
opentype.load('BN_World.ttf', function(err, font) {
    if (err) {
        console.error('❌ Ошибка загрузки шрифта! Скорее всего проблема с CORS (ты открыл файл как file://). Запусти через Live Server.', err);
        return;
    }
    
    targetFont = font;
    console.log('✅ Шрифт BN_World.ttf успешно загружен!');
    
    // Как только шрифт загрузился, рисуем трафарет
    drawTargetLetter();
});

// Функция отрисовки эталонной буквы
function drawTargetLetter() {
    if (!targetFont) return;

    // Размер шрифта: берем 60% от меньшей стороны экрана, чтобы влезло везде
    const fontSize = Math.min(canvas.width, canvas.height) * 0.6; 
    
    // Чтобы буква была по центру, нужно вычислить её ширину
    const textWidth = targetFont.getAdvanceWidth(targetLetter, fontSize);
    
    // Координаты (x, y) для opentype указывают на левый нижний край базовой линии (baseline)
    const startX = (canvas.width - textWidth) / 2;
    const startY = canvas.height * 0.65; 

    // Достаем ВЕКТОРНЫЙ КОНТУР буквы из шрифта
    letterPath = targetFont.getPath(targetLetter, startX, startY, fontSize);
    
    // Настраиваем внешний вид трафарета
    letterPath.fill = '#e0e0e0'; // Светло-серый цвет заливки, чтобы не отвлекал
    
    // Рисуем на нашем холсте!
    letterPath.draw(ctx);
    
    console.log('✅ Трафарет буквы отрисован. Контур готов к извлечению точек.');
}

// Обновляем функцию resizeCanvas, чтобы при перевороте экрана буква перерисовывалась
window.addEventListener('resize', () => {
    resizeCanvas();
    drawTargetLetter(); // Перерисовываем трафарет при смене размера
});

// --- ФАЗА 3: ЗАХВАТ РИСОВАНИЯ ---

let isDrawing = false;
let userStroke = []; // Здесь будем хранить массив точек, которые нарисовал пользователь

// Обработчики событий (работают и для мыши, и для тачскрина)
canvas.addEventListener('pointerdown', startDrawing);
canvas.addEventListener('pointermove', draw);
canvas.addEventListener('pointerup', stopDrawing);
canvas.addEventListener('pointercancel', stopDrawing);

function startDrawing(e) {
    isDrawing = true;
    // ВАЖНО: Мы больше НЕ очищаем userStroke = [] здесь!
    
    ctx.beginPath(); // Начинаем новый визуальный путь (чтобы штрихи не склеивались)
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
    
    // Рисуем линию
    ctx.lineTo(x, y);
    ctx.stroke();
    
    // Сразу начинаем новый путь от этой же точки, чтобы линия была плавной
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    
    // Сбрасываем путь, чтобы следующий штрих (при новом касании) начался с чистого листа, а не тянулся от старого
    ctx.beginPath(); 
    
    // ВАЖНО: Мы больше НЕ вызываем checkAccuracy() автоматически!
    console.log(`Штрих завершен. Всего точек в памяти: ${userStroke.length}`);
}

// --- ФАЗА 4: ПРОВЕРКА ТОЧНОСТИ ---
function checkAccuracy() {
    if (!letterPath || userStroke.length === 0) return;

    // 1. Превращаем контур opentype.js в понятный для Canvas объект Path2D
    const svgPathString = letterPath.toPathData(2); 
    const canvasPath = new Path2D(svgPathString);

    let hitCount = 0;
    
    // 2. Задаем "допуск" (погрешность). Насколько широкой мы считаем линию буквы.
    // 40 пикселей означает, что если палец ушел в сторону на 20px, это еще ок.
    ctx.lineWidth = 40; 

    // 3. Проверяем каждую точку пользователя
    for (let i = 0; i < userStroke.length; i++) {
        const point = userStroke[i];
        
        // Спрашиваем у холста: эта точка (x, y) лежит внутри "толстого" контура буквы?
        if (ctx.isPointInStroke(canvasPath, point.x, point.y)) {
            hitCount++;
        }
    }

    // 4. Считаем проценты
    const accuracy = Math.round((hitCount / userStroke.length) * 100);
    console.log(`🎯 Попаданий: ${hitCount} из ${userStroke.length}. Точность: ${accuracy}%`);

    // --- ФАЗА 5: ПСИХОЛОГИЧЕСКИЙ ОТКЛИК (UI) ---
    const resultElement = document.getElementById('resultText');
    
    if (accuracy >= 80) {
        resultElement.innerText = `Отлично! Точность: ${accuracy}% 🏆`;
        resultElement.style.color = "#4CAF50"; // Зеленый
    } else if (accuracy >= 50) {
        resultElement.innerText = `Неплохо: ${accuracy}%. Попробуй ровнее!`;
        resultElement.style.color = "#FF9800"; // Оранжевый
    } else {
        resultElement.innerText = `Мимо: ${accuracy}%. Давай еще раз!`;
        resultElement.style.color = "#F44336"; // Красный
        
        // Маленький хак: если есть вибромоторчик в телефоне - вибрируем при ошибке
        if (navigator.vibrate) {
            navigator.vibrate(200); 
        }
    }
}

// Полезная кнопка: Очистка холста
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    userStroke = [];
    drawTargetLetter(); // Перерисовываем серый трафарет
    
    const resultElement = document.getElementById('resultText');
    if(resultElement) {
        resultElement.innerText = "Нарисуй букву";
        resultElement.style.color = "#333";
    }
    console.log("🧹 Холст очищен");
}