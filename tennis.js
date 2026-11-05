// Tennis game for the 128x160 screen, after the user's reference GIF:
// green LCD palette, court seen from above, the ball is a rouble sign with a glow.
// Portrait screen, so the court is vertical: opponent at the top, you at the bottom.
// Uses globals from index.html: ctx, W, H, S, draw, drawText.

const TP = {                                // palette sampled from the reference GIF
  bg: [[163, 208, 78], [157, 197, 81], [147, 186, 74], [136, 172, 66], [125, 160, 60]],
  line: 'rgb(196,232,120)',
  dark: 'rgb(13,15,11)',
  mid: 'rgb(33,50,21)',
  light: 'rgb(214,240,150)',
  glow: 'rgba(230,255,170,',
};

// y 0..12 phone status bar, 14..25 score, court below, softkey bar from y 143
const COURT = { l: 6, r: 121, t: 36, b: 137, sl: 18, sr: 109, net: 86, svT: 61, svB: 112 };
const HIT_Y = { top: COURT.t + 10, bottom: COURT.b - 12 };
const REACH = 11;

// '#' dark, 'o' light, '.' transparent
const SPR = {
  you: [                                   // seen from behind: hat, hair, neck, suit, shoes
    '...####...', '..######..', '.########.', '..######..', '..######..', '...oooo...',
    '.########.', '##########', '##########', '##########', '..######..', '..##..##..', '..##..##..',
    '.###..###.'],
  cpu: [                                   // cap, white shirt
    '..######..', '.#######..', '.########.', '..oooooo..', '..o#oo#o..', '..oooooo..', '...o##o...',
    '.########.', '#oooooooo#', '#oo#oo#oo#', '#oooooooo#', '.########.', '..##..##..', '..##..##..'],
  racket: ['.###.', '#o#o#', '##o##', '#o#o#', '.###.', '..#..', '..#..'],
  racketTilt: [                            // held at an angle: handle bottom left, head top right
    '.....##.', '....#oo#', '...#o#o#', '...#oo#.', '...###..', '..#.....', '.#......', '#.......'],
  rouble: ['#####.', '##..##', '##..##', '##..##', '#####.', '##....', '#####.', '##....', '##....'],
};

function tSprite(rows, x, y, flip = false) {
  rows.forEach((r, j) => [...r].forEach((p, i) => {
    if (p === '.') return;
    ctx.fillStyle = p === '#' ? TP.dark : TP.light;
    ctx.fillRect(Math.round(x + (flip ? r.length - 1 - i : i)), Math.round(y + j), 1, 1);
  }));
}

const T = {
  you: { x: 64, dir: 1, score: { pts: 0, games: 0, sets: 0 } },
  cpu: { x: 64, dir: 1, score: { pts: 0, games: 0, sets: 0 } },
  ball: null,                                // { x0, y0, x1, y1, t, dur, by }
  wait: 15,                                  // ticks before the next serve
  server: 'you',
  paused: false,
  keys: { left: false, right: false },
  timer: null,
};

const rand = (a, b) => a + Math.random() * (b - a);

function shoot(from) {
  const top = from === 'you';                // you hit up towards the top
  const p = T[from];
  T.ball = {
    by: from,
    x0: p.x + (top ? 6 : -6), y0: top ? HIT_Y.bottom : HIT_Y.top,
    x1: rand(COURT.sl + 4, COURT.sr - 4), y1: top ? HIT_Y.top : HIT_Y.bottom,
    t: 0, dur: Math.round(rand(30, 38)),     // about 2-2.5 s over the court
  };
}

function point(winner) {
  const w = T[winner].score, l = T[winner === 'you' ? 'cpu' : 'you'].score;
  w.pts++;
  if (w.pts >= 4 && w.pts - l.pts >= 2) {    // game
    w.pts = l.pts = 0; w.games++;
    T.server = T.server === 'you' ? 'cpu' : 'you';
    if (w.games >= 6 && w.games - l.games >= 2) { w.games = l.games = 0; w.sets++; }
  }
  T.ball = null; T.wait = 20;
}

function tick() {
  if (T.paused || S.mode !== 'tennis') return;
  const you = T.you, cpu = T.cpu, b = T.ball;
  if (T.keys.left) { you.x -= 2.5; you.dir = -1; }
  if (T.keys.right) { you.x += 2.5; you.dir = 1; }
  you.x = Math.max(COURT.l + 4, Math.min(COURT.r - 4, you.x));

  // opponent runs to where the ball will land, a little slower than the ball can go
  const aim = b && b.by === 'you' ? b.x1 : 64;
  const step = Math.max(-1.3, Math.min(1.3, aim - cpu.x));
  cpu.x += step;
  if (Math.abs(step) > 0.3) cpu.dir = Math.sign(step);


  if (!b) {
    if (--T.wait <= 0) shoot(T.server);
  } else {
    b.t = Math.min(b.dur, b.t + +document.getElementById('ballSpeed').value);   // speed slider: 1 = normal
    const k = b.t / b.dur;
    const x = b.x0 + (b.x1 - b.x0) * k, y = b.y0 + (b.y1 - b.y0) * k;
    if (b.t >= b.dur) {
      const recv = b.by === 'you' ? 'cpu' : 'you';
      if (Math.abs(T[recv].x - b.x1) <= REACH) shoot(recv);
      else point(b.by);
    }
  }
  draw();
}

function courtBg() {
  ctx.fillStyle = `rgb(${TP.bg[0]})`;
  ctx.fillRect(0, 0, W, H);
}

function scoreBox(n, x, y) {
  ctx.fillStyle = TP.dark; ctx.fillRect(x, y, 9, 12);
  ctx.fillStyle = `rgb(${TP.bg[0]})`; ctx.fillRect(x + 1, y + 1, 7, 10);
  drawText(ctx, 'small', String(n % 10), x + 5, y + 1, TP.dark, 'center');
}

function drawTennis() {
  courtBg();
  const c = COURT;
  // score: you on the left, opponent on the right
  drawText(ctx, 'small', 'Sets  Games', 64, 14, TP.dark, 'center');
  scoreBox(T.you.score.sets, 2, 14); scoreBox(T.you.score.games, 12, 14);
  scoreBox(T.cpu.score.sets, 107, 14); scoreBox(T.cpu.score.games, 117, 14);

  // court lines
  ctx.fillStyle = TP.line;
  ctx.fillRect(c.l, c.t, c.r - c.l + 1, 1); ctx.fillRect(c.l, c.b, c.r - c.l + 1, 1);
  ctx.fillRect(c.l, c.t, 1, c.b - c.t + 1); ctx.fillRect(c.r, c.t, 1, c.b - c.t + 1);
  ctx.fillRect(c.sl, c.t, 1, c.b - c.t + 1); ctx.fillRect(c.sr, c.t, 1, c.b - c.t + 1);
  ctx.fillRect(c.sl, c.svT, c.sr - c.sl + 1, 1); ctx.fillRect(c.sl, c.svB, c.sr - c.sl + 1, 1);
  ctx.fillRect(64, c.svT, 1, c.svB - c.svT + 1);
  ctx.fillStyle = TP.mid;                    // net: dashed
  for (let x = c.l - 2; x <= c.r + 2; x += 4) ctx.fillRect(x, c.net, 2, 1);


  // players with rackets: opponent faces down, you face up
  const cy = c.t - 8, cd = T.cpu.dir;
  tSprite(SPR.cpu, T.cpu.x - 5, cy);
  tSprite(SPR.racketTilt, cd > 0 ? T.cpu.x + 5 : T.cpu.x - 13, cy, cd < 0);
  // your racket is on the side you run to, tilted outwards
  const yy = c.b - 18, d = T.you.dir;
  tSprite(SPR.you, T.you.x - 5, yy);
  tSprite(SPR.racketTilt, d > 0 ? T.you.x + 5 : T.you.x - 13, yy, d < 0);

  const b = T.ball;
  if (b) {
    const k = b.t / b.dur, x = b.x0 + (b.x1 - b.x0) * k, y = b.y0 + (b.y1 - b.y0) * k, z = 20 * k * (1 - k);
    const gx = x, gy = y - z;
    for (let r = 9; r > 0; r -= 3) {
      ctx.fillStyle = TP.glow + (0.18 + (9 - r) * 0.04) + ')';
      ctx.beginPath(); ctx.arc(gx, gy, r, 0, Math.PI * 2); ctx.fill();
    }
    tSprite(SPR.rouble, gx - 3, gy - 4);
  }

  if (T.paused) drawText(ctx, 'bold', 'Пауза', 64, 66, TP.dark, 'center');
  gameChrome(T.paused ? 'Дальше' : 'Пауза');
}

// Phone status bar on top (signal, clock, battery) and the softkey bar below, in the screen theme.
function gameChrome(mid) {
  const t = th(), barBg = t ? t.status : '#ffffff', softBg = t ? t.soft : '#ffffff';
  px(barBg, 0, 0, W, 13);
  statusBars();
  clock(t ? t.clock : C.ink);
  px(softBg, 0, 143, W, H - 143);
  softkeys('Опции', mid, 'Назад');
}

function openTennis() {
  S.mode = 'tennis';
  Object.assign(T.you, { x: 64 }); Object.assign(T.cpu, { x: 64 });
  T.you.score = { pts: 0, games: 0, sets: 0 }; T.cpu.score = { pts: 0, games: 0, sets: 0 };
  T.ball = null; T.wait = 15; T.server = 'you'; T.paused = false;
  clearInterval(T.timer);
  T.timer = setInterval(tick, 66);           // ~15 fps, like a phone game of the time
  draw();
}
function closeTennis() { clearInterval(T.timer); T.timer = null; }
function pauseTennis() { T.paused = !T.paused; draw(); }
