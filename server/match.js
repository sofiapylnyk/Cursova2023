import { DataStream, Values, Events } from './shared';
const { None, Cross, Circle, Tie } = Values;
// Комбінації для перемоги
const winningPositions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],

    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],

    [0, 4, 8],
    [2, 4, 6]
];
// Клас для представлення матчу
export default class Match {
    constructor(id, matchManager) {
        this.id = id; // Ідентифікатор матчу
        this.matchManager = matchManager; // Менеджер матчів
        this.crossPlayer = null; // Гравець, який грає за Х
        this.circlePlayer = null; // Гравець, який грає за О
        this.turn = None; // Поточний хід (None, Cross або Circle)
        this._isOver = false; // Прапорець, що позначає закінчення матчу
        this.board = Array(9).fill(None); // Масив, що представляє ігрове поле
        this.stream = new DataStream(); // Потік даних для взаємодії з клієнтами
    }
    // Метод для початку матчу
    startMatch() {
        console.log(`Starting game...`);
        // Роль у грі та початок матчу
        this.crossPlayer.send(this.stream
            .queue(Events.YouAre, Values.Cross)
            .queue(Events.GameStart)
        .output());
        this.circlePlayer.send(this.stream
            .queue(Events.YouAre, Values.Circle)
            .queue(Events.GameStart)
        .output());
        // Розпочати гру
        this.changeTurn();
    }
    // Метод для завершення матчу
    endMatch(isTied, winnerCells) {
        console.log(`Game over!`);
        this._isOver = true;
        // Якщо гра закінчилася нічиєю
        if (isTied) {
            this.crossPlayer.send(this.stream
                .queue(Events.GameTied)
                .output()
            );
            this.circlePlayer.send(this.stream
                .queue(Events.GameTied)
                .output()
            );
            return;
        }
        // Якщо є переможець
        this.crossPlayer.send(this.stream
            .queue(Events.GameOver, this.turn)
            .queue(Events.WinnerCells, winnerCells)
            .output()
        );
        this.circlePlayer.send(this.stream
            .queue(Events.GameOver, this.turn)
            .queue(Events.WinnerCells, winnerCells)
            .output()
        );
        // Скидаємо стан матчу для нової гри
        this.resetMatch();
    }
    // Метод для зміни значення комірки на полі
    changeCell(socket, cell) {
        if (this.turn == None)
            return;
        // Перевірка чи гра взагалі триває та чи обрано правильного гравця
        if ((this.circlePlayer == socket && this.turn != Circle)
            || (this.crossPlayer == socket && this.turn != Cross))
            return;
        // Перевірка валідності комірки
        if (cell >= 0 && cell <= 8) {
            if (this.board[cell] != None)
                return;
            // Оновлюємо ігрове поле та повідомляємо гравців
            this.board[cell] = this.turn;
            this.crossPlayer.send(this.stream
                .queue(Events.ChangeCell, [cell, this.turn])
                .output()
            );
            this.circlePlayer.send(this.stream
                .queue(Events.ChangeCell, [cell, this.turn])
                .output()
            );
            // Перевірка на наявність переможця чи нічиєї
            let winner = this.checkWinner();
            if (!winner) {
                this.changeTurn();
            }
            else if (winner == Tie) {
                console.log('A tie!');
                this.endMatch(true);
            }
            else {
                console.log(`${winner[0] == Cross ? 'X' : 'O'} won!`);
                this.endMatch(false, winner[1]);
            }
        }
    }
    // Метод для додавання гравця до матчу
    joinPlayer(socket) {
        if (this.crossPlayer && this.circlePlayer) {
            console.error(`Connection Denied (${socket})`);
            return false;
        }
        // Додавання гравця залежно від того, хто ще не обраний
        if (!this.crossPlayer) {
            this.crossPlayer = socket;
            console.log(`Player entered the room as X.`);
            if (this.circlePlayer) {
                this.startMatch();
            }
            return true;
        }
        if (!this.circlePlayer) {
            this.circlePlayer = socket;
            console.log(`Player entered the room as O.`);
            if (this.crossPlayer) {
                this.startMatch();
            }
            return true;
        }
    }
    // Метод для видалення гравця та скидання матчу
    leavePlayer(socket, reason) {
        // Видалення гравця та повідомлення іншого гравця про його вихід
        if (this.circlePlayer == socket) {
            this.circlePlayer = null;
            if (!this.isOver && this.crossPlayer) {
                this.crossPlayer.send(this.stream
                    .queue(Events.EnemyLeave)
                    .queue(Events.GameOver, Values.Cross)
                    .output()
                );
            }
        }
        if (this.crossPlayer == socket) {
            this.crossPlayer = null;
            if (!this.isOver && this.circlePlayer) {
                this.circlePlayer.send(this.stream
                    .queue(Events.EnemyLeave)
                    .queue(Events.GameOver, Values.Circle)
                    .output()
                );
            }
        }
        this.turn = None;
        this.resetMatch();
    }
    // Метод для перевірки переможця або нічиєї
    checkWinner() {
        const board = this.board;
        for (const combination of winningPositions) {
            if (board[combination[0]] == board[combination[1]] 
                && board[combination[0]] == board[combination[2]] 
                && board[combination[0]] != None) {
                return [board[combination[0]], combination];
            }
        }
        // Перевірка на наявність нічиєї
        let checked = 0;
        for (const cell of board) {
            if (cell != None)
                checked++;
        }
        if (checked == 9)
            return Tie;

        return null;
    }
    // Метод для зміни поточного гравця
    changeTurn() {
        this.turn = this.turn == Cross ? Circle : Cross;
        this.crossPlayer.send(this.stream
            .queue(Events.ChangeTurn, this.turn)
            .output()
        );
        this.circlePlayer.send(this.stream
            .queue(Events.ChangeTurn, this.turn)
            .output()
        );
    }
    // Метод для скидання стану матчу
    resetMatch() {
        // Знищення зв'язку з матчем для гравців
        if (this.crossPlayer)
            this.crossPlayer.match = undefined;
        if (this.circlePlayer)
            this.circlePlayer.match = undefined;
        // Скидання стану матчу
        this.crossPlayer = null;
        this.circlePlayer = null;
        this._isOver = false;
        this.turn = None;
        this.board = Array(9).fill(None);
        this.stream.output();
        // Додавання матчу до черги для нової гри
        this.matchManager.addMatchToQueue(this.id);
    }
    // Властивість, яка показує, чи закінчено матч
    get isOver() {
        return this._isOver;
    }
    // Властивість, яка показує, чи доступний матч для гравців 
    get isAvailable() {
        return (!this.crossPlayer || !this.circlePlayer);
    }
    // Властивість, яка показує кількість гравців у матчі
    get playerCount() {
        let count = 0;
        if (this.crossPlayer)
            count++;
        if (this.circlePlayer)
            count++;
        
        return count;
    }
}