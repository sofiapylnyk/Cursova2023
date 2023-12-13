"use strict";

var _shared = require("./shared");
var _match = _interopRequireDefault(require("./match"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
// Налаштування сервера за допомогою Express та WebSocket
var path = require('path');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var WebSocket = require('ws');
var PORT = process.env.PORT || 8000;
app.use(express["static"](path.join(__dirname, '../public')));
server.listen(PORT, function () {
  console.log("Listening on port ".concat(PORT));
});
// Створюємо WebSocket сервер, пов'язаний з Express сервером
var wss = new WebSocket.Server({
  server: server
});
// Клас для керування матчами
var MatchManager = /*#__PURE__*/function () {
  function MatchManager() {
    _classCallCheck(this, MatchManager);
    this.matches = []; // Масив активних матчів
    this.matchesQueue = []; // Черга матчів
    this.matchesCount = 0; // Лічильник матчів
  }
  // Додаємо матч до черги
  _createClass(MatchManager, [{
    key: "addMatchToQueue",
    value: function addMatchToQueue(matchId) {
      this.matchesQueue.push(matchId);
    }
    // Знаходить доступний матч для гравця
  }, {
    key: "findAvailableMatch",
    value: function findAvailableMatch() {
      if (this.matchesQueue[0] !== undefined) {
        var matchId = this.matchesQueue[0];
        var _iterator = _createForOfIteratorHelper(this.matches),
          _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var match = _step.value;
            if (match.id == matchId) {
              if (match.playerCount == 1) {
                this.matchesQueue.shift();
              }
              return match;
            }
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      }
      // Немає доступних матчів у черзі => створюємо новий
      var newMatch = new _match["default"](this.matchesCount, this);
      this.matches.push(newMatch);
      // Додаємо новий матч до черги та збільшуємо лічильник
      this.matchesQueue.push(newMatch.id);
      this.matchesCount++;
      return newMatch;
    }
  }]);
  return MatchManager;
}(); // Створюємо екземпляр класу MatchManager
var matchManager = new MatchManager();
// Обробник подій при підключенні нового клієнта через WebSocket
wss.on('connection', function (socket, req) {
  console.log("New connection received");
  // Знаходимо доступний матч для клієнта та додаємо його до матчу
  socket.match = matchManager.findAvailableMatch();
  socket.match.joinPlayer(socket);
  // Обробник події при отриманні повідомлення від клієнта
  socket.on('message', function (message) {
    // Розбиваємо повідомлення на потоки та обробляємо кожен
    var streams = message.split(';');
    for (var i = 0; i < streams.length; i++) {
      var stream = streams[i].split('-');
      // В залежності від типу події викликаємо відповідний метод матчу            
      switch (parseInt(stream[0])) {
        case _shared.Events.ChangeCell:
          var value = parseInt(stream[1]);
          // Якщо значення коректне, міняємо комірку у матчі                    
          if (!isNaN(value)) {
            socket.match.changeCell(socket, value);
          }
          break;
        case _shared.Events.FindGame:
          // Знаходимо новий матч для гравця
          socket.match = matchManager.findAvailableMatch();
          socket.match.joinPlayer(socket);
        default:
          break;
      }
    }
  });
  // Обробник події при закритті з'єднання з клієнтом
  socket.on('close', function () {
    // Якщо клієнт був у матчі, видаляємо його
    if (socket.match) socket.match.leavePlayer(socket);
  });
});