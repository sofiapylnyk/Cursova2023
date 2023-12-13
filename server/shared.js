// Клас для представлення потоку даних
export class DataStream {
    // Цей клас представляє чергу подій у наступному форматі:
    // event-value;event-value;event-value....
    // Масиви можуть бути представлені за допомогою ',':
    // event-value,value,value;event-value;event-value,value
    constructor() {
        // Масив для зберігання потоків подій
        this.streams = [];
    }
    // Додає подію та значення до потоку
    queue(event, value) {
        let stream = [event.toString()];
        if (value !== undefined) {
            if (Array.isArray(value)) {
                stream.push(value.join(','));
            } else {
                stream.push(value.toString());
            }
        } 
        this.streams.push(stream);
        return this;
    }
    // Форматує та повертає весь потік у вигляді рядка
    output() {
        let result = [];
        for (let i = 0; i < this.streams.length; i++) {
            const stream = this.streams[i];
            result.push(stream.join('-'));
        }
        // Очищення масиву потоків
        this.streams.splice(0, this.streams.length);
        return result.join(';');
    }
}
// Константи для подій та значень
export const Events = {
    GameStart: 0,
    GameOver: 1,
    GameTied: 2,
    ChangeCell: 3,
    YouAre: 4,
    ChangeTurn: 5,
    WinnerCells: 6,
    FindGame: 7,
    EnemyLeave: 8,
};

export const Values = {
    None: 0,
    Cross: 1,
    Circle: 2,
    Tie: 3,
};