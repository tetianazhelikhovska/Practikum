// js/main.js
import { getCurrentUser, logout } from './auth.js';

let currentImage = null;
let currentCanvas = null;

document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    initializeSelects();
    initializeButtons();
});

// Перевірка чи користувач авторизований
function checkAuthentication() {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }
    
    const usernameElement = document.querySelector('.header__username');
    if (usernameElement) {
        usernameElement.textContent = currentUser.username;
    }
    
    const exitButton = document.querySelector('.header__exit');
    if (exitButton) {
        exitButton.textContent = 'Вийти';
        exitButton.onclick = logout;
    }
}

// Ініціалізація селектів
function initializeSelects() {
    document.querySelectorAll('.image-processing__select').forEach(select => {
        const trigger = select.querySelector('.image-processing__select-trigger');
        const text = select.querySelector('.image-processing__select-text');
        const options = select.querySelectorAll('.image-processing__option');

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.image-processing__select').forEach(s => {
                if (s !== select) s.classList.remove('open');
            });
            select.classList.toggle('open');
        });

        options.forEach(option => {
            option.addEventListener('click', () => {
                const value = option.getAttribute('data-value');
                text.textContent = option.textContent;
                select.classList.remove('open');
                
                // Застосувати ефект при зміні налаштувань
                if (currentImage) {
                    applyImageEffect();
                }
            });
        });

        document.addEventListener('click', (e) => {
            if (!select.contains(e.target)) {
                select.classList.remove('open');
            }
        });
    });
}

// Ініціалізація кнопок та інших елементів
function initializeButtons() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }
    
    const hideMessageBtn = document.querySelector('.steganography__input-btn');
    const extractMessageBtn = document.querySelector('.steganography__output-btn');
    
    if (hideMessageBtn) {
        hideMessageBtn.addEventListener('click', handleHideMessage);
    }
    
    if (extractMessageBtn) {
        extractMessageBtn.addEventListener('click', handleExtractMessage);
    }
}

// Обробка завантаження файлу
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Перевіряємо чи це зображення (не тільки BMP)
    if (!file.type.startsWith('image/')) {
        alert('Будь ласка, виберіть файл зображення');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            currentImage = img;
            displayImagePreview(img);
            applyImageEffect();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Відображення попереднього перегляду зображення
function displayImagePreview(img) {
    const placeholder = document.querySelector('.image-processing__placeholder');
    if (!placeholder) return;
    
    // Очищуємо попередній вміст
    placeholder.innerHTML = '';
    
    // Створюємо canvas для відображення
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Розраховуємо розміри для збереження пропорцій
    const maxWidth = 550;
    const maxHeight = 400;
    let { width, height } = calculateAspectRatioFit(img.width, img.height, maxWidth, maxHeight);
    
    canvas.width = width;
    canvas.height = height;
    canvas.style.borderRadius = '20px';
    
    // Малюємо зображення
    ctx.drawImage(img, 0, 0, width, height);
    
    placeholder.appendChild(canvas);
    currentCanvas = canvas;
}

// Розрахунок розмірів із збереженням пропорцій
function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {
    const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
    return {
        width: srcWidth * ratio,
        height: srcHeight * ratio
    };
}

// Застосування ефекту до зображення
function applyImageEffect() {
    if (!currentImage || !currentCanvas) return;
    
    const ctx = currentCanvas.getContext('2d');
    const { width, height } = currentCanvas;
    
    // Очищуємо canvas
    ctx.clearRect(0, 0, width, height);
    
    // Малюємо оригінальне зображення
    ctx.drawImage(currentImage, 0, 0, width, height);
    
    // Отримуємо вибрані параметри
    const method = getSelectedMethod();
    const colorScheme = getSelectedColorScheme();
    
    // Застосовуємо ефект
    applyBitmapEffect(ctx, width, height, method, colorScheme);
}

// Отримання вибраного методу
function getSelectedMethod() {
    const methodSelect = document.querySelector('.image-processing__method-select .image-processing__select-text');
    const methodText = methodSelect ? methodSelect.textContent : 'Зональний колір';
    
    switch(methodText) {
        case 'Сітка': return 'grid';
        case 'Коло по центру': return 'circle';
        default: return 'quadrant';
    }
}

// Отримання вибраної кольорової схеми
function getSelectedColorScheme() {
    const colorSelect = document.querySelector('.image-processing__color-select .image-processing__select-text');
    const colorText = colorSelect ? colorSelect.textContent : 'Від синього до зеленого';
    
    switch(colorText) {
        case 'Від червоного до синього': return 'red-blue';
        case 'Від зеленого до червоного': return 'green-red';
        default: return 'blue-green';
    }
}

// Застосування бітового ефекту
function applyBitmapEffect(ctx, width, height, method, colorScheme) {
    // Створюємо накладання з прозорістю
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.6;
    
    switch(method) {
        case 'quadrant':
            applyQuadrantEffect(ctx, width, height, colorScheme);
            break;
        case 'grid':
            applyGridEffect(ctx, width, height, colorScheme);
            break;
        case 'circle':
            applyCircleEffect(ctx, width, height, colorScheme);
            break;
    }
    
    // Повертаємо нормальні параметри
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
}

// Зональний колір (квадранти)
function applyQuadrantEffect(ctx, width, height, colorScheme) {
    const colors = getColorPalette(colorScheme);
    
    // Верхній лівий квадрант
    const gradient1 = ctx.createLinearGradient(0, 0, width/2, height/2);
    gradient1.addColorStop(0, colors[0]);
    gradient1.addColorStop(1, colors[1]);
    ctx.fillStyle = gradient1;
    ctx.fillRect(0, 0, width/2, height/2);
    
    // Верхній правий квадрант
    const gradient2 = ctx.createLinearGradient(width/2, 0, width, height/2);
    gradient2.addColorStop(0, colors[1]);
    gradient2.addColorStop(1, colors[2]);
    ctx.fillStyle = gradient2;
    ctx.fillRect(width/2, 0, width/2, height/2);
    
    // Нижній лівий квадрант
    const gradient3 = ctx.createLinearGradient(0, height/2, width/2, height);
    gradient3.addColorStop(0, colors[2]);
    gradient3.addColorStop(1, colors[3]);
    ctx.fillStyle = gradient3;
    ctx.fillRect(0, height/2, width/2, height/2);
    
    // Нижній правий квадрант
    const gradient4 = ctx.createLinearGradient(width/2, height/2, width, height);
    gradient4.addColorStop(0, colors[3]);
    gradient4.addColorStop(1, colors[0]);
    ctx.fillStyle = gradient4;
    ctx.fillRect(width/2, height/2, width/2, height/2);
}




// Сітка
function applyGridEffect(ctx, width, height, colorScheme) {
    const colors = getColorPalette(colorScheme);
    const cellSize = 50;

    // Вибираємо перший і останній кольори для градієнта
    const colorStart = colors[0];
    const colorEnd = colors[colors.length - 1];

    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 2;

    // Вертикальні лінії з градієнтом
    for (let x = 0; x <= width; x += cellSize) {
        const gradient = ctx.createLinearGradient(x, 0, x, height);
        gradient.addColorStop(0, colorStart);
        gradient.addColorStop(1, colorEnd);
        ctx.strokeStyle = gradient;

        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }

    // Горизонтальні лінії з градієнтом
    for (let y = 0; y <= height; y += cellSize) {  
        const gradient = ctx.createLinearGradient(0, y, width, y);
        gradient.addColorStop(0, colorStart);
        gradient.addColorStop(1, colorEnd);
        ctx.strokeStyle = gradient;

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
}



// Коло по центру
function applyCircleEffect(ctx, width, height, colorScheme) {
    const colors = getColorPalette(colorScheme);
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2;
    
    // Створюємо радіальний градієнт від центру
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
    
    for (let i = 0; i < colors.length; i++) {
        gradient.addColorStop(i / (colors.length - 1), colors[i]);
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Додаємо концентричні кола
    for (let i = 1; i <= 5; i++) {
        const radius = (maxRadius / 5) * i;
        const colorIndex = i % colors.length;
        
        ctx.strokeStyle = colors[colorIndex];
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.globalAlpha = 0.6;
    }
}

// Отримання палітри кольорів
function getColorPalette(colorScheme) {
    switch(colorScheme) {
        case 'red-blue':
            return [
                'rgba(220, 20, 60, 0.8)',   // Темно-червоний
                'rgba(255, 69, 0, 0.8)',    // Помаранчево-червоний
                'rgba(138, 43, 226, 0.8)',  // Фіолетовий
                'rgba(0, 0, 255, 0.8)'      // Синій
            ];
        case 'green-red':
            return [
                'rgba(0, 128, 0, 0.8)',     // Зелений
                'rgba(154, 205, 50, 0.8)',  // Жовто-зелений
                'rgba(255, 165, 0, 0.8)',   // Помаранчевий
                'rgba(220, 20, 60, 0.8)'    // Червоний
            ];
        default: // blue-green
            return [
                'rgba(0, 0, 255, 0.8)',     // Синій
                'rgba(0, 191, 255, 0.8)',   // Блакитний
                'rgba(0, 255, 127, 0.8)',   // Весняно-зелений
                'rgba(0, 128, 0, 0.8)'      // Зелений
            ];
    }
}

// Обробка приховування повідомлення
function handleHideMessage() {
    const message = document.querySelector('.steganography__input').value;
    if (!message.trim()) {
        alert('Будь ласка, введіть повідомлення для приховування');
        return;
    }
    
    if (!currentImage) {
        alert('Будь ласка, завантажте зображення спочатку');
        return;
    }
    
    console.log('Приховування повідомлення:', message);
    alert('Повідомлення приховано в зображенні! (Функція стеганографії буде реалізована повністю пізніше)');
    
    // Додаємо до історії
    addToHistory('messages', message);
}

// Обробка витягування повідомлення
function handleExtractMessage() {
    if (!currentImage) {
        alert('Будь ласка, завантажте зображення спочатку'); Обробити
        return; 
    }
    
    console.log('Витягування прихованого повідомлення');
    
    const outputPlaceholder = document.querySelector('.steganography__output-placeholder');
    if (outputPlaceholder) {
        outputPlaceholder.style.display = 'flex';
        outputPlaceholder.style.alignItems = 'center';
        outputPlaceholder.style.justifyContent = 'center';
        outputPlaceholder.innerHTML = '<p>Приховане повідомлення: "Тестове повідомлення" (Демо)</p>';
    }
}

// Додавання до історії
function addToHistory(type, item) {
    const historyKey = `history_${type}`;
    let history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    
    // Додаємо новий елемент на початок
    history.unshift({
        item: item,
        timestamp: new Date().toLocaleString('uk-UA')
    });
    
    // Обмежуємо кількість елементів
    if (history.length > 10) {
        history = history.slice(0, 10);
    }
    
    localStorage.setItem(historyKey, JSON.stringify(history));
    updateHistoryDisplay();
}

// Оновлення відображення історії
function updateHistoryDisplay() {
    // Файли
    const filesHistory = JSON.parse(localStorage.getItem('history_files') || '[]');
    const filesContainer = document.querySelector('.history__last-files');
    if (filesContainer) {
        filesContainer.innerHTML = filesHistory.map(item => 
            `<div class="history-item">
                <div class="history-item-name">${item.item}</div>
                <div class="history-item-time">${item.timestamp}</div>
            </div>`
        ).join('');
    }
    
    // Патерни
    const patternsHistory = JSON.parse(localStorage.getItem('history_patterns') || '[]');
    const patternsContainer = document.querySelector('.history__last-patterns');
    if (patternsContainer) {
        patternsContainer.innerHTML = patternsHistory.map(item => 
            `<div class="history-item">
                <div class="history-item-name">${item.item}</div>
                <div class="history-item-time">${item.timestamp}</div>
            </div>`
        ).join('');
    }
    
    // Повідомлення
    const messagesHistory = JSON.parse(localStorage.getItem('history_messages') || '[]');
    const messagesContainer = document.querySelector('.history__last-messages');
    if (messagesContainer) {
        messagesContainer.innerHTML = messagesHistory.map(item => 
            `<div class="history-item">
                <div class="history-item-name">${item.item}</div>
                <div class="history-item-time">${item.timestamp}</div>
            </div>`
        ).join('');
    }
}

// Ініціалізація історії при завантаженні
document.addEventListener('DOMContentLoaded', function() {
    updateHistoryDisplay();
});

// Глобально доступна функція виходу
window.logout = logout;
