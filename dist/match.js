"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _shared = require("./shared");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var None = _shared.Values.None,
  Cross = _shared.Values.Cross,
  Circle = _shared.Values.Circle,
  Tie = _shared.Values.Tie;
// Комбінації для перемоги
var winningPositions = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
// Клас для представлення матчу
var Match = exports["default"] = /*#__PURE__*/function () {
  function Match(id, matchManager) {
    _classCallCheck(this, Match);
    this.id = id; // Ідентифікатор матчу
    this.matchManager = matchManager; // Менеджер матчів
    this.crossPlayer = null; // Гравець, який грає за Х
    this.circlePlayer = null; // Гравець, який грає за О
    this.turn = None; // Поточний хід (None, Cross або Circle)
    this._isOver = false; // Прапорець, що позначає закінчення матчу
    this.board = Array(9).fill(None); // Масив, що представляє ігрове поле
    this.stream = new _shared.DataStream(); // Потік даних для взаємодії з клієнтами
  }
  // Метод для початку матчу
  _createClass(Match, [{
    key: "startMatch",
    value: function startMatch() {
      console.log("Starting game...");
      // Роль у грі та початок матчу
      this.crossPlayer.send(this.stream.queue(_shared.Events.YouAre, _shared.Values.Cross).queue(_shared.Events.GameStart).output());
      this.circlePlayer.send(this.stream.queue(_shared.Events.YouAre, _shared.Values.Circle).queue(_shared.Events.GameStart).output());
      // Розпочати гру
      this.changeTurn();
    }
    // Метод для завершення матчу
  }, {
    key: "endMatch",
    value: function endMatch(isTied, winnerCells) {
      console.log("Game over!");
      this._isOver = true;
      // Якщо гра закінчилася нічиєю
      if (isTied) {
        this.crossPlayer.send(this.stream.queue(_shared.Events.GameTied).output());
        this.circlePlayer.send(this.stream.queue(_shared.Events.GameTied).output());
        return;
      }
      // Якщо є переможець
      this.crossPlayer.send(this.stream.queue(_shared.Events.GameOver, this.turn).queue(_shared.Events.WinnerCells, winnerCells).output());
      this.circlePlayer.send(this.stream.queue(_shared.Events.GameOver, this.turn).queue(_shared.Events.WinnerCells, winnerCells).output());
      // Скидаємо стан матчу для нової гри
      this.resetMatch();
    }
    // Метод для зміни значення комірки на полі
  }, {
    key: "changeCell",
    value: function changeCell(socket, cell) {
      if (this.turn == None) return;
      // Перевірка чи гра взагалі триває та чи обрано правильного гравця
      if (this.circlePlayer == socket && this.turn != Circle || this.crossPlayer == socket && this.turn != Cross) return;
      // Перевірка валідності комірки
      if (cell >= 0 && cell <= 8) {
        if (this.board[cell] != None) return;
        // Оновлюємо ігрове поле та повідомляємо гравців
        this.board[cell] = this.turn;
        this.crossPlayer.send(this.stream.queue(_shared.Events.ChangeCell, [cell, this.turn]).output());
        this.circlePlayer.send(this.stream.queue(_shared.Events.ChangeCell, [cell, this.turn]).output());
        // Перевірка на наявність переможця чи нічиєї
        var winner = this.checkWinner();
        if (!winner) {
          this.changeTurn();
        } else if (winner == Tie) {
          console.log('A tie!');
          this.endMatch(true);
        } else {
          console.log("".concat(winner[0] == Cross ? 'X' : 'O', " won!"));
          this.endMatch(false, winner[1]);
        }
      }
    }
    // Метод для додавання гравця до матчу
  }, {
    key: "joinPlayer",
    value: function joinPlayer(socket) {
      if (this.crossPlayer && this.circlePlayer) {
        console.error("Connection Denied (".concat(socket, ")"));
        return false;
      }
      // Додавання гравця залежно від того, хто ще не обраний
      if (!this.crossPlayer) {
        this.crossPlayer = socket;
        console.log("Player entered the room as X.");
        if (this.circlePlayer) {
          this.startMatch();
        }
        return true;
      }
      if (!this.circlePlayer) {
        this.circlePlayer = socket;
        console.log("Player entered the room as O.");
        if (this.crossPlayer) {
          this.startMatch();
        }
        return true;
      }
    }
    // Метод для видалення гравця та скидання матчу
  }, {
    key: "leavePlayer",
    value: function leavePlayer(socket, reason) {
      // Видалення гравця та повідомлення іншого гравця про його вихід
      if (this.circlePlayer == socket) {
        this.circlePlayer = null;
        if (!this.isOver && this.crossPlayer) {
          this.crossPlayer.send(this.stream.queue(_shared.Events.EnemyLeave).queue(_shared.Events.GameOver, _shared.Values.Cross).output());
        }
      }
      if (this.crossPlayer == socket) {
        this.crossPlayer = null;
        if (!this.isOver && this.circlePlayer) {
          this.circlePlayer.send(this.stream.queue(_shared.Events.EnemyLeave).queue(_shared.Events.GameOver, _shared.Values.Circle).output());
        }
      }
      this.turn = None;
      this.resetMatch();
    }
    // Метод для перевірки переможця або нічиєї
  }, {
    key: "checkWinner",
    value: function checkWinner() {
      var board = this.board;
      for (var _i = 0, _winningPositions = winningPositions; _i < _winningPositions.length; _i++) {
        var combination = _winningPositions[_i];
        if (board[combination[0]] == board[combination[1]] && board[combination[0]] == board[combination[2]] && board[combination[0]] != None) {
          return [board[combination[0]], combination];
        }
      }
      // Перевірка на наявність нічиєї
      var checked = 0;
      var _iterator = _createForOfIteratorHelper(board),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var cell = _step.value;
          if (cell != None) checked++;
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      if (checked == 9) return Tie;
      return null;
    }
    // Метод для зміни поточного гравця
  }, {
    key: "changeTurn",
    value: function changeTurn() {
      this.turn = this.turn == Cross ? Circle : Cross;
      this.crossPlayer.send(this.stream.queue(_shared.Events.ChangeTurn, this.turn).output());
      this.circlePlayer.send(this.stream.queue(_shared.Events.ChangeTurn, this.turn).output());
    }
    // Метод для скидання стану матчу
  }, {
    key: "resetMatch",
    value: function resetMatch() {
      // Знищення зв'язку з матчем для гравців
      if (this.crossPlayer) this.crossPlayer.match = undefined;
      if (this.circlePlayer) this.circlePlayer.match = undefined;
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
  }, {
    key: "isOver",
    get: function get() {
      return this._isOver;
    }
    // Властивість, яка показує, чи доступний матч для гравців 
  }, {
    key: "isAvailable",
    get: function get() {
      return !this.crossPlayer || !this.circlePlayer;
    }
    // Властивість, яка показує кількість гравців у матчі
  }, {
    key: "playerCount",
    get: function get() {
      var count = 0;
      if (this.crossPlayer) count++;
      if (this.circlePlayer) count++;
      return count;
    }
  }]);
  return Match;
}();