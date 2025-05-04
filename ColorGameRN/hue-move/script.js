// TODO
// 1. so much refactoring
// 2. make a button to show/hide options
// 3. record # of moves made / show best # of moves per "level" (score)
// 4. More variation between colors (grays)
// 5. actually make levels? choose btwn lvls or rand?

const PUZZLE_HOVER_TINT = "#FFFFFF";

var PUZZLE_WIDTH = 6;
var PUZZLE_HEIGHT = 6;

var TopLeft,
  TopRight,
  BottomLeft,
  BottomRight,
  _canvas,
  _stage,
  _img,
  _pieces,
  _puzzleWidth,
  _puzzleHeight,
  _pieceWidth,
  _pieceHeight,
  _currentPiece,
  _currentDropPiece,
  _mouse;

var _modifier = minMax(1, 7);
var _moveCount = 0;
var _lowestMoveCount = 0;
var _isFirst = false;

var _modal = document.getElementById("modal");
var _won = document.getElementById("winner");
var _new = document.getElementById("start");
var _startBtn = document.getElementById("startGame");
var _movecountText = document.getElementById("movecount");

function checkCount() {
  _lowestMoveCount =
    _lowestMoveCount > _moveCount ? _moveCount : _lowestMoveCount;
}

function minMax(min, max) {
  return Math.floor(min + Math.random() * (max - min));
}

// assign hsl count down
function hsl(i, j, x) {
  var h = _modifier % 2 === 0 ? Math.floor(x - j * i) : Math.floor(x + i * j);
  var s = _modifier % 2 !== 0 ? 100 : 50;
  var l = _modifier % 2 === 0 ? 100 : 50;

  var hsl = `hsl(${h}, ${s}%, ${l}%)`;

  return hsl;
}

function touchHandler(event) {
  var touch = event.changedTouches[0];
  event.preventDefault();

  var simulatedEvent = document.createEvent("MouseEvent");
  simulatedEvent.initMouseEvent(
    {
      touchstart: "mousedown",
      touchmove: "mousemove",
      touchend: "mouseup",
    }[event.type],
    true,
    true,
    window,
    1,
    touch.screenX,
    touch.screenY,
    touch.clientX,
    touch.clientY,
    false,
    false,
    false,
    false,
    0,
    null
  );

  touch.target.dispatchEvent(simulatedEvent);
}

function preventBehavior(e) {
  e.preventDefault();
  touchHandler(e);
}

function init() {
  document.addEventListener("touchstart", touchHandler, true);
  document.addEventListener("touchmove", preventBehavior, { passive: false });
  document.addEventListener("touchend", touchHandler, true);
  document.addEventListener("touchcancel", touchHandler, true);
}

function makeDots(ctx, pw, ph, cw, ch) {
  var dotSize = 3;

  ctx.beginPath();
  ctx.fillStyle = "#000000";

  ctx.arc(pw / 2, ph / 2, dotSize, 0, Math.PI * 2, true); // Top Left

  ctx.moveTo(pw / 2, ch - ph / 2);
  ctx.arc(pw / 2, ch - ph / 2, dotSize, 0, Math.PI * 2, true); // Bottom Left

  ctx.moveTo(cw - pw / 2, ch - ph / 2);
  ctx.arc(cw - pw / 2, ch - ph / 2, dotSize, 0, Math.PI * 2, true); // Bottom Right

  ctx.moveTo(cw - pw / 2, ph / 2);
  ctx.arc(cw - pw / 2, ph / 2, dotSize, 0, Math.PI * 2, true); // Bottom Right

  ctx.fill();
  ctx.stroke();
}

function rgb(i, j, x) {
  var stepi = 255 / PUZZLE_HEIGHT;
  var stepj = 255 / PUZZLE_WIDTH;
  var r =
    _modifier % 2 === 0
      ? Math.floor(255 - stepi * i)
      : Math.floor(0 + stepi * i);
  var g =
    _modifier % 2 === 0
      ? Math.floor(0 + stepj * j)
      : Math.floor(255 - stepj * j);
  var b = _modifier % 2 === 0 ? x + i : Math.floor(255 - stepi * i);
  var rgb;

  switch (_modifier) {
    case 2:
      rgb = "rgb(" + b + ", " + r + ", " + g + ")";
      break;
    case 3:
      rgb = "rgb(" + g + ", " + b + ", " + r + ")";
      break;
    case 4:
      rgb = "rgb(" + r + ", " + b + ", " + g + ")";
      break;
    case 5:
      rgb = "rgb(" + b + ", " + g + ", " + r + ")";
      break;
    case 6:
      rgb = "rgb(" + g + ", " + r + ", " + b + ")";
      break;
    default:
      rgb = "rgb(" + r + ", " + g + ", " + b + ")";
  }
  return rgb;
}

function draw() {
  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");
  var i,
    j,
    x = minMax(0, 255);

  var pieceWidth = canvas.width / PUZZLE_WIDTH;
  var pieceHeight = canvas.height / PUZZLE_HEIGHT;

  for (i = 0; i < PUZZLE_HEIGHT; i++) {
    for (j = 0; j < PUZZLE_WIDTH; j++) {
      x++;
      ctx.fillStyle = rgb(i, j, x);
      ctx.fillRect(j * pieceWidth, i * pieceHeight, pieceWidth, pieceHeight);
    }
  }

  makeDots(ctx, pieceWidth, pieceHeight, canvas.width, canvas.height);

  _img = new Image();
  _img.addEventListener("load", onImage, false);
  _img.src = document.getElementById("canvas").toDataURL("image/png");
}

function onImage(e) {
  _pieceWidth = Math.floor(_img.width / PUZZLE_WIDTH);
  _pieceHeight = Math.floor(_img.height / PUZZLE_HEIGHT);
  _puzzleWidth = _pieceWidth * PUZZLE_WIDTH;
  _puzzleHeight = _pieceHeight * PUZZLE_HEIGHT;
  setCanvas();
  initPuzzle();
}

function setCanvas() {
  _canvas = document.getElementById("canvas");
  _stage = _canvas.getContext("2d");
  _canvas.width = _puzzleWidth;
  _canvas.height = _puzzleHeight;
}

function initPuzzle() {
  _pieces = [];
  _mouse = { x: 0, y: 0 };
  _currentPiece = null;
  _currentDropPiece = null;
  _stage.drawImage(
    _img,
    0,
    0,
    _puzzleWidth,
    _puzzleHeight,
    0,
    0,
    _puzzleWidth,
    _puzzleHeight
  );
  buildPieces();
}

function buildPieces() {
  var i;
  var piece;
  var xPos = 0;
  var yPos = 0;

  for (i = 0; i < PUZZLE_WIDTH * PUZZLE_HEIGHT; i++) {
    piece = {};
    piece.sx = xPos;
    piece.sy = yPos;
    _pieces.push(piece);
    xPos += _pieceWidth;
    if (xPos >= _puzzleWidth) {
      xPos = 0;
      yPos += _pieceHeight;
    }
  }
  if (_isFirst) {
    shufflePuzzle();
  } else {
    _canvas.onmousedown = shufflePuzzle;
  }
}

// remove tiles from specific points in the array
function removeTiles(a, remove) {
  // a: array, remove: array
  // loop through remove array
  for (var i = 0; i < remove.length; i++) {
    var index = a.indexOf(remove[i]);
    a.splice(index, 1);
  }
}

function addTiles(a, add, tiles) {
  // a: array, add: array
  // loop through remove array
  for (var i = 0; i < add.length; i++) {
    a.splice(add[0], 0, tiles[0]);
  }
}

function initialShuffle(o) {
  // make a copy of the array
  const oCopy = JSON.parse(JSON.stringify(o));

  const fixedTiles = [o[TopLeft], o[TopRight], o[BottomLeft], o[BottomRight]];
  const copyTiles = [
    oCopy[TopLeft],
    oCopy[TopRight],
    oCopy[BottomLeft],
    oCopy[BottomRight],
  ];

  // remove items from array
  removeTiles(o, fixedTiles);

  // shuffle remaining array
  for (
    var j, x, i = o.length;
    i;
    j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x
  );

  // add the original tiles back into their original positions
  o.splice(TopLeft, 0, copyTiles[0]);
  o.splice(TopRight, 0, copyTiles[1]);
  o.splice(BottomLeft, 0, copyTiles[2]);
  o.splice(BottomRight, 0, copyTiles[3]);

  return o;
}

function shuffleArray(o) {
  // shuffle remaining array
  for (
    var j, x, i = o.length;
    i;
    j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x
  );
  return o;
}

function shufflePuzzle() {
  _startBtn.style.display = "none";
  _pieces = initialShuffle(_pieces);
  _stage.clearRect(0, 0, _puzzleWidth, _puzzleHeight);
  var i;
  var piece;
  var xPos = 0;
  var yPos = 0;
  for (i = 0; i < _pieces.length; i++) {
    piece = _pieces[i];
    piece.xPos = xPos;
    piece.yPos = yPos;
    _stage.drawImage(
      _img,
      piece.sx,
      piece.sy,
      _pieceWidth,
      _pieceHeight,
      xPos,
      yPos,
      _pieceWidth,
      _pieceHeight
    );
    xPos += _pieceWidth;
    if (xPos >= _puzzleWidth) {
      xPos = 0;
      yPos += _pieceHeight;
    }
  }
  _canvas.onmousedown = onPuzzleClick;
}

function onPuzzleClick(e) {
  if (e.layerX || e.layerX == 0) {
    _mouse.x = e.layerX;
    _mouse.y = e.layerY;
  } else if (e.offsetX || e.offsetX == 0) {
    _mouse.x = e.offsetX;
    _mouse.y = e.offsetY;
  }
  _currentPiece = checkPieceClicked();
  if (_currentPiece != null) {
    _stage.clearRect(
      _currentPiece.xPos,
      _currentPiece.yPos,
      _pieceWidth,
      _pieceHeight
    );
    _stage.save();
    _stage.globalAlpha = 1;
    _stage.drawImage(
      _img,
      _currentPiece.sx,
      _currentPiece.sy,
      _pieceWidth,
      _pieceHeight,
      _mouse.x - _pieceWidth / 2,
      _mouse.y - _pieceHeight / 2,
      _pieceWidth,
      _pieceHeight
    );
    _stage.restore();
    _canvas.onmousemove = updatePuzzle;
    _canvas.onmouseup = pieceDropped;
  }
}

function checkPieceClicked() {
  var i;
  var piece;
  for (i = 0; i < _pieces.length; i++) {
    piece = _pieces[i];

    if (
      _mouse.x < piece.xPos ||
      _mouse.x > piece.xPos + _pieceWidth ||
      _mouse.y < piece.yPos ||
      _mouse.y > piece.yPos + _pieceHeight
    ) {
      //PIECE NOT HIT
    } else {
      if (
        i === TopLeft ||
        i === TopRight ||
        i === BottomLeft ||
        i === BottomRight
      ) {
        return null;
      } else {
        return piece;
      }
    }
  }
  return null;
}

function updatePuzzle(e) {
  _currentDropPiece = null;
  if (e.layerX || e.layerX == 0) {
    _mouse.x = e.layerX;
    _mouse.y = e.layerY;
  } else if (e.offsetX || e.offsetX == 0) {
    _mouse.x = e.offsetX;
    _mouse.y = e.offsetY;
  }
  _stage.clearRect(0, 0, _puzzleWidth, _puzzleHeight);
  var i;
  var piece;

  for (i = 0; i < _pieces.length; i++) {
    piece = _pieces[i];
    if (piece == _currentPiece) {
      continue;
    }
    _stage.drawImage(
      _img,
      piece.sx,
      piece.sy,
      _pieceWidth,
      _pieceHeight,
      piece.xPos,
      piece.yPos,
      _pieceWidth,
      _pieceHeight
    );
    if (_currentDropPiece === null) {
      if (
        _mouse.x < piece.xPos ||
        _mouse.x > piece.xPos + _pieceWidth ||
        _mouse.y < piece.yPos ||
        _mouse.y > piece.yPos + _pieceHeight
      ) {
        //NOT OVER
      } else {
        _currentDropPiece = piece;
        _stage.save();
        _stage.globalAlpha = 1;
        _stage.fillStyle = PUZZLE_HOVER_TINT;
        _stage.fillRect(
          _currentDropPiece.xPos,
          _currentDropPiece.yPos,
          _pieceWidth,
          _pieceHeight
        );
        _stage.restore();
      }
    }
  }

  _stage.save();
  _stage.globalAlpha = 1;
  _stage.drawImage(
    _img,
    _currentPiece.sx,
    _currentPiece.sy,
    _pieceWidth,
    _pieceHeight,
    _mouse.x - _pieceWidth / 2,
    _mouse.y - _pieceHeight / 2,
    _pieceWidth,
    _pieceHeight
  );
  _stage.restore();
}

function pieceDropped(e) {
  _canvas.onmousemove = null;
  _canvas.onmouseup = null;
  if (_currentDropPiece != null) {
    var tmp = { xPos: _currentPiece.xPos, yPos: _currentPiece.yPos };
    _currentPiece.xPos = _currentDropPiece.xPos;
    _currentPiece.yPos = _currentDropPiece.yPos;
    _currentDropPiece.xPos = tmp.xPos;
    _currentDropPiece.yPos = tmp.yPos;
  }
  resetPuzzleAndCheckWin();
}

function resetPuzzleAndCheckWin() {
  _moveCount++;
  _stage.clearRect(0, 0, _puzzleWidth, _puzzleHeight);
  var gameWin = true;
  var i;
  var piece;
  for (i = 0; i < _pieces.length; i++) {
    piece = _pieces[i];
    _stage.drawImage(
      _img,
      piece.sx,
      piece.sy,
      _pieceWidth,
      _pieceHeight,
      piece.xPos,
      piece.yPos,
      _pieceWidth,
      _pieceHeight
    );
    if (piece.xPos != piece.sx || piece.yPos != piece.sy) {
      gameWin = false;
    }
  }
  if (gameWin) {
    setTimeout(gameOver, 100);
  }
}

function startGame() {
  _moveCount = 0;
  _modifier = minMax(1, 7);
  _modal.style.display = "none";
  _won.style.display = "none";
  _new.style.display = "none";
  _startBtn.style.display = "block";
  TopLeft = 0;
  TopRight = PUZZLE_WIDTH - 1;
  BottomLeft = PUZZLE_WIDTH * PUZZLE_HEIGHT - PUZZLE_WIDTH;
  BottomRight = PUZZLE_WIDTH * PUZZLE_HEIGHT - 1;
  draw();
}

function gameOver() {
  checkCount();
  _isFirst = false;
  _modal.style.display = "block";
  _won.style.display = "flex";
  _movecountText.innerHTML = _moveCount;
  _canvas.onmousedown = null;
  _canvas.onmousemove = null;
  _canvas.onmouseup = null;
}

init();
startGame();

function moreDifficult() {
  _startBtn.style.display = "block";
  PUZZLE_HEIGHT = PUZZLE_HEIGHT + 2;
  PUZZLE_WIDTH = PUZZLE_WIDTH + 2;
  startGame();
}

function lessDifficult() {
  _startBtn.style.display = "block";
  PUZZLE_HEIGHT = PUZZLE_HEIGHT - 2;
  PUZZLE_WIDTH = PUZZLE_WIDTH - 2;
  startGame();
}
