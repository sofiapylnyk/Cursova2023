import { Events } from './shared';
import Match from './match';
// Налаштування сервера за допомогою Express та WebSocket
const path = require('path');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const WebSocket = require('ws');
const PORT = process.env.PORT || 8000;

app.use(express.static(path.join(__dirname, '../public')));

server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
// Створюємо WebSocket сервер, пов'язаний з Express сервером
const wss = new WebSocket.Server({
    server: server
});
// Клас для керування матчами
class MatchManager {
    constructor() {
        this.matches = []; // Масив активних матчів
        this.matchesQueue = []; // Черга матчів
        this.matchesCount = 0; // Лічильник матчів
    }
    // Додаємо матч до черги
    addMatchToQueue(matchId) {
        this.matchesQueue.push(matchId);
    }
    // Знаходить доступний матч для гравця
    findAvailableMatch() {
        if (this.matchesQueue[0] !== undefined) {
            let matchId = this.matchesQueue[0];
            for (const match of this.matches) {
                if (match.id == matchId) {
                    if (match.playerCount == 1) {
                        this.matchesQueue.shift();
                    }
                    return match;
                }
            }
        }
        // Немає доступних матчів у черзі => створюємо новий
        let newMatch = new Match(this.matchesCount, this);
        this.matches.push(newMatch);
        // Додаємо новий матч до черги та збільшуємо лічильник
        this.matchesQueue.push(newMatch.id);
        this.matchesCount++;
        return newMatch;
    }
}
// Створюємо екземпляр класу MatchManager
let matchManager = new MatchManager();
// Обробник подій при підключенні нового клієнта через WebSocket
wss.on('connection', (socket, req) => {
    console.log(`New connection received`);
// Знаходимо доступний матч для клієнта та додаємо його до матчу
    socket.match = matchManager.findAvailableMatch();
    socket.match.joinPlayer(socket);
// Обробник події при отриманні повідомлення від клієнта
    socket.on('message', (message) => {
 // Розбиваємо повідомлення на потоки та обробляємо кожен
        let streams = message.split(';');
        for (let i = 0; i < streams.length; i++) {
            const stream = streams[i].split('-');
// В залежності від типу події викликаємо відповідний метод матчу            
            switch (parseInt(stream[0])) {
                case Events.ChangeCell:
                    let value = parseInt(stream[1]);
// Якщо значення коректне, міняємо комірку у матчі                    
                    if (!isNaN(value)) {
                        socket.match.changeCell(socket, value);
                    }
                    break;
                case Events.FindGame:
                    // Знаходимо новий матч для гравця
                    socket.match = matchManager.findAvailableMatch();
                    socket.match.joinPlayer(socket);
                default:
                    break;
            }
        }
    });
// Обробник події при закритті з'єднання з клієнтом
    socket.on('close', () => {
        // Якщо клієнт був у матчі, видаляємо його
        if (socket.match)
            socket.match.leavePlayer(socket);
    });
});