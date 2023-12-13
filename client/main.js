import { DataStream, Events } from '../server/shared';
// Отримання адреси сервера
let host = location.origin.replace(/^http/, 'ws');
// Створення WebSocket з'єднання
let ws = new WebSocket(host);
// Отримання посилань на HTML елементи
let infoEl = document.querySelector('#game-info');
let boardEl = document.querySelector('#board');
let newGameEl = document.querySelector('#new-game');
let abandonInfo = document.querySelector('#enemy-disconnect');
let yourMarkEl = document.querySelector('#your-mark');
// Прапорець, що вказує на завершення гри
let isGameOver = false;
// Змінна для зберігання поточного знаку гравця
let currentMark = null;
// Об'єкт для створення та форматування потоків даних
let streams = new DataStream();
// Обробник події відкриття WebSocket з'єднання
ws.onopen = function onopen() {
    console.log('Connected');
    infoEl.textContent = 'Searching for an opponent...';
};
// Обробник події закриття WebSocket з'єднання
ws.onclose = function close() {
    console.log('Disconnected');
};
// Обробник події помилки WebSocket з'єднання
ws.onerror = function error() {
    console.log('Failed to connect to the server');
    infoEl.textContent = 'Failed to connect to the server';
};
// Обробник події отримання повідомлення від сервера
ws.onmessage = function(message) {
    // Розділення повідомлення на окремі потоки
    let streams = message.data.split(';');
    // Обробка кожного потоку
    for (let i = 0; i < streams.length; i++) {
        const stream = streams[i].split('-');

        switch (parseInt(stream[0])) {
            // Початок гри
            case Events.GameStart:
                yourMarkEl.classList.remove('hidden');
                infoEl.classList.add('text-right');
                boardEl.classList.remove('hidden');
                break;
            // Зміна ходу гравців
            case Events.ChangeTurn:
                let value = parseInt(stream[1]);
                if (currentMark == value) {
                    infoEl.textContent = 'Your turn!';
                } else {
                    infoEl.textContent = `${(value == 1 ? 'X' : 'O')}'s turn!`;
                }
                break;
            // Зміна значення комірки
            case Events.ChangeCell:
                let values = stream[1].split(',');
                let cellId = parseInt(values[0]);
                let mark = parseInt(values[1]);
                let cellEl = document.querySelector(`#cell-${cellId}`);
                cellEl.textContent = mark == 1 ? 'X' : 'O';
                break;
            // Закінчення гри (перемога)
            case Events.GameOver:
                infoEl.textContent = (parseInt(stream[1]) == 1 ? 'X' : 'O') + ' won!';
                newGameEl.classList.remove('hidden');
                isGameOver = true;
                break;
            // Вихід противника
            case Events.EnemyLeave:
                abandonInfo.classList.remove('hidden');
                isGameOver = true;
                break;
            // Закінчення гри (нічия)
            case Events.GameTied:
                infoEl.textContent = 'Tie!';
                newGameEl.classList.remove('hidden');
                isGameOver = true;
                break;
            // Визначення знака гравця
            case Events.YouAre:
                currentMark = parseInt(stream[1]);
                yourMarkEl.textContent = `You're the ${(currentMark == 1 ? 'X' : 'O')}`;
                break;
            // Позначення переможних комірок
            case Events.WinnerCells:
                let cells = stream[1].split(',');
                for (const cellId of cells) {
                    document.querySelector(`#cell-${cellId}`).classList.add('cell-winner');
                }
                break;
            default:
                break;
        }
    }
}
// Обробник кліку на комірку
function onClickCell(event) {
    // Перевірка доступності WebSocket та стану гри
    if (ws.readyState == 1 && !isGameOver) {
        // Отримання ідентифікатора комірки
        let cell = event.target.id.split('-');
        cell.shift();
        // Відправлення потоку для зміни значення комірки
        ws.send(streams
            .queue(Events.ChangeCell, parseInt(cell[0]))
            .output()
        );
    }
}
// Додавання обробників подій до комірок
for (const cellEl of document.querySelectorAll('.cell')) {
    cellEl.addEventListener('click', onClickCell);
}
// Обробник кліку на кнопку нової гри
newGameEl.addEventListener('click', function(event) {
    // Скидання змінних та стану гри
    currentMark = null;
    isGameOver = false;
    // Сховання елементів та відображення інформації
    boardEl.classList.add('hidden');
    yourMarkEl.classList.add('hidden');
    infoEl.classList.remove('text-right');
    infoEl.textContent = 'Searching for an opponent...';
    abandonInfo.classList.add('hidden');
    // Очищення потоків та комірок
    streams.output();
    for (let i = 0; i < 9; i++) {
        let cellEl = document.querySelector(`#cell-${i}`);
        cellEl.classList.remove('cell-winner');
        cellEl.textContent = '';
    }
    // Приховування кнопки нової гри
    this.classList.add('hidden');
    // Відправлення потоку для пошуку нової гри
    ws.send(streams
        .queue(Events.FindGame)
        .output()
    );
});