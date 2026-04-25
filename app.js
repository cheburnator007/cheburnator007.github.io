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
    userStroke = []; // Очищаем старый массив при новом начале
    
    // Рисуем первую точку
    draw(e);
}

function draw(e) {
    if (!isDrawing) return;

    // Получаем точные координаты относительно холста
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Сохраняем координаты для будущего анализа
    userStroke.push({ x, y, timestamp: Date.now() });

    // Визуализация на холсте (черная линия поверх серого трафарета)
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#2c3e50'; // Темно-синий/черный цвет для контраста
    
    // Рисуем линию к текущей точке
    if (userStroke.length > 1) {
        const prevPoint = userStroke[userStroke.length - 2];
        ctx.beginPath();
        ctx.moveTo(prevPoint.x, prevPoint.y);
        ctx.lineTo(x, y);
        ctx.stroke();
    }
}

function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    
    console.log(`✅ Линия закончена. Собрано точек: ${userStroke.length}`);
    
    // Ловушка психологии: если точек слишком мало, значит это был случайный тык
    if (userStroke.length > 5) {
        console.log("🚀 Пора переходить к Фазе 4: Проверка точности!");
        // Здесь мы скоро вызовем функцию проверки
    }
}

// Полезная кнопка: Очистка холста
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    userStroke = [];
    drawTargetLetter(); // Перерисовываем серый трафарет после очистки
    console.log("🧹 Холст очищен");
}