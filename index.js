function clamp(number, min, max) {
  return Math.max(min, Math.min(number, max));
}

const Red = "#B31942";
const Blue = "#0A3161";
const White = "#FFFFFF";
const Gold = "goldenrod";
const tileSize = 25;
const showgird = document.getElementById("showgird");

class Tile {
  static size = tileSize;
  gold = false;
  color;
  border;
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.height = Tile.size;
    this.width = Tile.size;
  }
  draw(ctx) {
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.fillStyle = this.gold ? Gold : this.color;
    ctx.strokeStyle = White;
    ctx.rect(this.x, this.y, this.width, this.height);
    ctx.fill();
    if (showgird.checked) ctx.stroke();
  }
  hasOtherBall(balls, currentBall) {
    let has = false;
    balls
      .filter((b) => b.id !== currentBall.id)
      .forEach((ball) => {
        let closestX = clamp(ball.x, this.x, this.x + this.width);
        let closestY = clamp(ball.y, this.y, this.y + this.height);
        let distanceX = ball.x - closestX;
        let distanceY = ball.y - closestY;
        let distanceSquared = distanceX * distanceX + distanceY * distanceY;
        if (distanceSquared < ball.radius * ball.radius) {
          has = true;
        }
      });
    return has;
  }
}

class Ball {
  id;
  dx = 0;
  dy = 0;
  score = 0;
  minSpeed = 5;
  maxSpeed = 10;
  constructor(id, x, y, color, reverseColor, radius) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.color = color;
    this.reverseColor = reverseColor;
    this.radius = radius;
  }
  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = White;
    ctx.lineWidth = 2;
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.stroke();
    ctx.closePath();
  }

  move() {
    this.x += this.dx;
    this.y += this.dy;
  }

  randomize() {
    this.dx += Math.random() * 0.05 - 0.005;
    this.dy += Math.random() * 0.05 - 0.005;
    this.dx = Math.min(Math.max(this.dx, -this.maxSpeed), this.maxSpeed);
    this.dy = Math.min(Math.max(this.dy, -this.maxSpeed), this.maxSpeed);
    if (Math.abs(this.dx) < this.minSpeed)
      this.dx = this.dx > 0 ? this.minSpeed : -this.minSpeed;
    if (Math.abs(this.dy) < this.minSpeed)
      this.dy = this.dy > 0 ? this.minSpeed : -this.minSpeed;
  }

  checkBoundaryCollision(maxX, maxY) {
    if (
      this.x + this.dx > maxX - this.radius ||
      this.x + this.dx < this.radius
    ) {
      this.dx = -this.dx;
    }
    if (
      this.y + this.dy > maxY - this.radius ||
      this.y + this.dy < this.radius
    ) {
      this.dy = -this.dy;
    }
  }

  checkTileCollision(numTilesX, tiles, balls) {
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
      const checkX = this.x + Math.cos(angle) * this.radius;
      const checkY = this.y + Math.sin(angle) * this.radius;

      const i = Math.floor(checkX / Tile.size);
      const j = Math.floor(checkY / Tile.size);
      const index = i * numTilesX + j;
      if (index < tiles.length) {
        const tile = tiles[index];
        if (
          tile?.color !== this?.reverseColor &&
          !tile?.hasOtherBall(balls, this)
        ) {
          this.score++;
          tile.border = this.color;
          tile.color = this.reverseColor;
          if (Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle))) {
            this.dx = -this.dx;
          } else {
            this.dy = -this.dy;
          }
          if (tile.gold) {
            return true;
          }
        }
      }
    }
  }
}

const leftTileColor = Blue;
const leftTileBorderColor = White;
const leftBallColor = Blue;
const rightTileColor = Red;
const rightTileBorderColor = White;
const rightBallColor = Red;

const canvas = document.getElementById("canvas");
const numTilesX = canvas.width / Tile.size;
const numTilesY = canvas.height / Tile.size;
const ctx = canvas.getContext("2d");
const score = document.getElementById("score");
let rightScore;
let leftScore;

let tiles;
let balls;
let leftBall;
let rightBall;

function init() {
  rightScore = 0;
  leftScore = 0;
  tiles = [];
  balls = [];
  for (let i = 0; i < numTilesX; i++) {
    for (let j = 0; j < numTilesY; j++) {
      const t = new Tile(i * Tile.size, j * Tile.size);
      const isItOnLeft = i < numTilesX / 2;
      t.color = isItOnLeft ? leftTileColor : rightTileColor;
      t.border = isItOnLeft ? leftTileBorderColor : rightTileBorderColor;
      if (i == numTilesX / 4 && j == numTilesY / 2) {
        t.gold = true;
      }
      if (
        i == Math.floor(numTilesX - numTilesX / 4) &&
        j == Math.floor(numTilesY / 2)
      ) {
        t.gold = true;
      }

      tiles.push(t);
    }
  }
  leftBall = new Ball(
    "Blue",
    canvas.width / 4,
    canvas.height / 2,
    leftBallColor,
    leftTileColor,
    Tile.size / 2
  );

  rightBall = new Ball(
    "Red",
    canvas.width - canvas.width / 4,
    canvas.height / 2,
    rightBallColor,
    rightTileColor,
    Tile.size / 2
  );
  balls.push(leftBall);
  balls.push(rightBall);
  draw();
}

function drawTiles() {
  rightScore = 0;
  leftScore = 0;
  tiles.forEach((tile) => {
    tile.draw(ctx);
    tile.hasBall = false;
    if (tile.color === leftTileColor) leftScore++;
    if (tile.color === rightTileColor) rightScore++;
  });
}

function drawBalls() {
  for (const ball of balls) {
    ball.draw(ctx);
    ball.move();
    ball.checkBoundaryCollision(canvas.width, canvas.height);
    const hitGold = ball.checkTileCollision(numTilesX, tiles, balls);
    if (hitGold) {
      return ball;
    }
    ball.randomize();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawTiles();
  const winner = drawBalls();
  if (winner) {
    return winner;
  }
}

function run() {
  const winner = draw();
  if (winner) {
    score.textContent = `${winner.id} got the gold!`;
    document.getElementById("button").disabled = false;
    document.getElementById("showgird").disabled = false;
    return;
  }
  requestAnimationFrame(run);
}

init();

function handleClick() {
  document.getElementById("button").disabled = true;
  document.getElementById("showgird").disabled = true;
  score.textContent = "Gold Wars!";
  init();
  requestAnimationFrame(run);
}
