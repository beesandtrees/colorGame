

function checkCount() {
    _lowestMoveCount = _lowestMoveCount > _moveCount ? _moveCount : _lowestMoveCount;
  }
  
  function minMax(min, max) {
    return Math.floor(min + Math.random() * (max - min));
  }