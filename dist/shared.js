"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Values = exports.Events = exports.DataStream = void 0;
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
// Клас для представлення потоку даних
var DataStream = exports.DataStream = /*#__PURE__*/function () {
  // Цей клас представляє чергу подій у наступному форматі:
  // event-value;event-value;event-value....
  // Масиви можуть бути представлені за допомогою ',':
  // event-value,value,value;event-value;event-value,value
  function DataStream() {
    _classCallCheck(this, DataStream);
    // Масив для зберігання потоків подій
    this.streams = [];
  }
  // Додає подію та значення до потоку
  _createClass(DataStream, [{
    key: "queue",
    value: function queue(event, value) {
      var stream = [event.toString()];
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
  }, {
    key: "output",
    value: function output() {
      var result = [];
      for (var i = 0; i < this.streams.length; i++) {
        var stream = this.streams[i];
        result.push(stream.join('-'));
      }
      // Очищення масиву потоків
      this.streams.splice(0, this.streams.length);
      return result.join(';');
    }
  }]);
  return DataStream;
}(); // Константи для подій та значень
var Events = exports.Events = {
  GameStart: 0,
  GameOver: 1,
  GameTied: 2,
  ChangeCell: 3,
  YouAre: 4,
  ChangeTurn: 5,
  WinnerCells: 6,
  FindGame: 7,
  EnemyLeave: 8
};
var Values = exports.Values = {
  None: 0,
  Cross: 1,
  Circle: 2,
  Tie: 3
};