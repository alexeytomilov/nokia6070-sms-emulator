// Shot 120 of SBER185, timed frame by frame from the sketch SBER185_shot120_sketch06.mp4
// (1920x1080, 25 fps, 106 frames):
//   camera 1, frames 0-34   the rouble flies from your racket to the opponent
//   camera 1, frames 35-63  "Сообщение получено" pops up over the paused game
//   camera 2, frames 64-105 close-up of the inbox; the highlight steps down one line at a time
// Capture renders the shot as the 16:9 frame shows it (1920x1080) plus 50 px of overscan on every
// side, 2020x1180, into an .mp4 (WebCodecs H.264 + vendor/mp4-muxer.js), so it runs straight from disk.
// The shot uses the current screen settings, but always without defocus.
// Uses globals from index.html / tennis.js.

const SHOT_120 = {
  name: 'SBER185_shot120',
  fps: 25, frames: 106,
  ballFrom: 0, ballTo: 34,                 // rouble in flight
  popupAt: 35,                             // message received
  cut: 64,                                 // camera 2 from here
  listSteps: [69, 75, 80, 85, 91, 96, 103],  // highlight moves down one line on these frames
  listStart: 5,                            // highlight starts on the 6th line (Oleg)
};

// Shot "SMS": the received message opened on the read screen; after a short empty screen its lines
// load from the top, one per phone tick (15 fps), then it holds. One camera of its own (camera 3).
const SHOT_SMS = { name: 'SBER185_sms', fps: 25, frames: 75, loadAt: 6 };
const SMS_TEXT_DEFAULT = 'Mobile bank: Popolnenie scheta karty *3452 na summu 15 000.00 RUB. Balans: 23 450.00 RUB.';
let scenario = 's120', smsText = SMS_TEXT_DEFAULT;
try { scenario = localStorage.getItem('nokia6070-scenario') || 's120'; } catch (e) {}
try { smsText = localStorage.getItem('nokia6070-smstext') ?? SMS_TEXT_DEFAULT; } catch (e) {}
let SHOT = scenario === 'sms' ? SHOT_SMS : SHOT_120;
const saveScenario = () => { try {
  localStorage.setItem('nokia6070-scenario', scenario); localStorage.setItem('nokia6070-smstext', smsText);
} catch (e) {} };

// camera presets for the shot: rotation, perspective, zoom, offset (same fields as the camera buttons)
// fitted to the user's stills: court corners (camera 1) and list lines and names (camera 2);
// camera 2 sits one line lower than the still so the moving highlight on the bottom line stays in view
const SHOT_CAM_DEFAULTS = [
  // camera 1: the position the user set in the emulator on 2026-11-05
  { rotX: '27.5', rotY: '0', rotZ: '0', persp: '900', zoom: '1.65', pan: { x: 26.55, y: 546.78 } },
  { rotX: '44.7', rotY: '2.7', rotZ: '-2.95', persp: '2386', zoom: '2.377', pan: { x: 114.9, y: 719.6 } },
];
const SHOT_K = 3;                          // the cameras were fitted at screen scale x3
// look of the stills: teal theme, dark body, LCD grid, a little noise, defocus top and bottom
const SHOT_LOOK = {
  theme: 'teal', showBody: true, bodyKind: 'dark', scale: '3',
  fxGrid: '0.18', fxGridAlpha: '0.45', fxGridBlur: '0.25', fxNoise: '0.04', fxDirt: '0.12',
  fxCA: '0.35', fxDefocus: '1.6', fxFocus: '0.5', fxDof: '0.45',
  bgBlur: '24', bgBright: '1', vignette: '0.65', bg1: '#1a1d1f', bg2: '#101213', bg3: '#050606',
};

let shotCams;
try { shotCams = JSON.parse(localStorage.getItem('nokia6070-shotcams-v2') || 'null'); } catch (e) {}
if (!Array.isArray(shotCams) || shotCams.length < 2) shotCams = JSON.parse(JSON.stringify(SHOT_CAM_DEFAULTS));
if (!shotCams[2]) shotCams[2] = JSON.parse(JSON.stringify(shotCams[1]));   // camera 3: the SMS shot, starts as camera 2
const saveShotCams = () => { try { localStorage.setItem('nokia6070-shotcams-v2', JSON.stringify(shotCams)); } catch (e) {} };

// Output sizes. The shot renders through cameras 1 and 2 with overscan around the frame; the texture
// render plays the same shot flat: straight at the screen, the phone turned 90 degrees, no camera
// effects (no perspective, defocus, chromatic aberration or vignette), at the closeness set in its block.
let shotOut = { w: 1920, h: 1080, pad: 50 };
let tex = { w: 1920, h: 1080, zoom: 1 };
try { Object.assign(shotOut, JSON.parse(localStorage.getItem('nokia6070-shotout') || '{}')); } catch (e) {}
try { Object.assign(tex, JSON.parse(localStorage.getItem('nokia6070-tex') || '{}')); } catch (e) {}
const saveOut = () => { try {
  localStorage.setItem('nokia6070-shotout', JSON.stringify(shotOut));
  localStorage.setItem('nokia6070-tex', JSON.stringify(tex));
} catch (e) {} };
let texCam = null;                         // set while the texture render runs
const camForFrame = n => texCam || (SHOT === SHOT_SMS ? shotCams[2] : shotCams[n < SHOT.cut ? 0 : 1]);
// the view is flat when the phone faces the camera turned 90 degrees (the texture block puts it there)
const texView = () => +$('rotX').value === 0 && +$('rotY').value === 0 && +$('rotZ').value === -90;

// front camera with the phone turned 90 degrees, the screen filling the frame height
function flatCam(closer = 1) {
  if ($('scale').value !== String(SHOT_K)) { $('scale').value = String(SHOT_K); }
  present();
  // everything in pixels of the 1280 px reference frame, so the camera fits any window size
  const css = 1 / 1.25, k = LAYOUT.k, a = -90 * Math.PI / 180;
  // screen centre relative to the phone centre, CSS px before the transform
  const dx = (LAYOUT.sx + W * k / 2 - view.width / 2) * css, dy = (LAYOUT.sy + H * k / 2 - view.height / 2) * css;
  // turned 90 degrees the screen is H wide and W tall
  const fw = FRAME_REF, fh = FRAME_REF * 9 / 16, margin = 0.97;
  const z = closer * Math.min(fh * margin / (W * k * css), fw * margin / (H * k * css));
  const rx = dx * Math.cos(a) - dy * Math.sin(a), ry = dx * Math.sin(a) + dy * Math.cos(a);
  return { rotX: '0', rotY: '0', rotZ: '-90', persp: '3000', zoom: String(Math.max(-3, Math.min(3, Math.log2(z)))),
           pan: { x: -rx * z, y: -ry * z } };
}

function applyCam(c) {
  ROT_IDS.forEach(id => { if (id in c) $(id).value = c[id]; });
  Object.assign(pan, c.pan || { x: 0, y: 0 });
  place();
}

// Puts the phone screen and the camera into the state of frame n.
// cam: a camera to stand in instead of the one the shot uses on this frame
function shotFrame(n, cam) {
  if ($('scale').value !== String(SHOT_K)) $('scale').value = String(SHOT_K);
  closeTennis();                           // the shot drives the game itself, frame by frame
  if (SHOT === SHOT_SMS) {
    applyCam(cam || camForFrame(n));
    S.mode = 'read'; S.resume = null; S.from = null; S.scroll = 0;
    S.msg = { from: $('from').value, text: smsText, time: $('time').value, date: $('date').value, read: true };
    S.readLines = n < SHOT.loadAt ? 0 : Math.floor((n - SHOT.loadAt) * 15 / SHOT.fps) + 1;
    draw();
    return;
  }
  if (n < SHOT.cut) {
    applyCam(cam || camForFrame(n));
    T.you.score = { pts: 0, games: 0, sets: 0 }; T.cpu.score = { pts: 0, games: 0, sets: 0 };
    // the game runs at 15 fps on the phone, so everything moves in 15 fps steps
    const steps = Math.floor((n - SHOT.ballFrom) * 15 / SHOT.fps), total = (SHOT.ballTo - SHOT.ballFrom) * 15 / SHOT.fps;
    const k = Math.min(1, Math.max(0, steps / total)), ease = v => v * v * (3 - 2 * v);
    // diagonal rally: you hit from the left of the court, the rouble flies up to the right,
    // the opponent runs across to meet it and you drift back to the middle
    const HIT = { you: 40, cpu: 92 };
    T.ball = { by: 'you', x0: HIT.you + 6, y0: HIT_Y.bottom, x1: HIT.cpu, y1: HIT_Y.top, t: k, dur: 1 };
    T.cpu.x = 60 + (HIT.cpu - 60) * ease(Math.min(1, k * 1.25)); T.cpu.dir = 1;
    T.you.x = HIT.you + (58 - HIT.you) * ease(Math.min(1, Math.max(0, k - 0.15) / 0.7)); T.you.dir = 1;
    if (n < SHOT.popupAt) { S.mode = 'tennis'; T.paused = false; S.resume = null; }
    else { S.mode = 'incoming'; S.resume = 'tennis'; T.paused = true; S.unread = 1; S.reveal = 3; }
  } else {
    applyCam(cam || camForFrame(n));
    S.mode = 'inbox'; S.resume = null;
    S.received = [0, 1].map(() => ({ from: '900', text: $('text').value, time: $('time').value, date: $('date').value, read: false }));
    S.sel = SHOT.listStart + SHOT.listSteps.filter(f => n >= f).length;
    S.top = Math.max(0, S.sel - 5);
  }
  draw();
}

// the screen state outside the shot is kept and put back afterwards
function keepState() {
  return { S: JSON.parse(JSON.stringify({ ...S, revealTimer: null })), T: JSON.parse(JSON.stringify({ ...T, timer: null })),
           cam: { ...Object.fromEntries(ROT_IDS.map(id => [id, $(id).value])), pan: { ...pan } }, scale: $('scale').value };
}
function restoreState(k) {
  Object.assign(S, k.S); Object.assign(T, k.T, { timer: null });
  $('scale').value = k.scale;
  applyCam(k.cam);
  if (S.mode === 'tennis') T.timer = setInterval(tick, 66);
  draw();
}

// ---------- real-time preview ----------
let playing = null;
function playShot() {
  if (playing) return stopShot();
  const kept = keepState(), t0 = performance.now();
  $('shotPlay').textContent = '■ Стоп';
  const step = () => {
    const n = Math.floor((performance.now() - t0) / 1000 * SHOT.fps);
    if (n >= SHOT.frames || !playing) return stopShot();
    if (n !== playing.n) { playing.n = n; shotFrame(n); $('shotInfo').textContent = `Кадр ${n} / ${SHOT.frames - 1}`; }
    playing.raf = requestAnimationFrame(step);
  };
  playing = { kept, n: -1 };
  NO_DEFOCUS = true;
  step();
}
function stopShot() {
  if (!playing) return;
  cancelAnimationFrame(playing.raf);
  NO_DEFOCUS = false; FLAT = false;
  restoreState(playing.kept);
  playing = null;
  $('shotPlay').textContent = '▶ Проиграть шот';
}

// ---------- capture to mp4 ----------
let GL = null;
// output: the frame (1920x1080 by default) and the overscan around it; a flat camera sets its own size
const OUT_DEFAULT = { w: 1920, h: 1080, pad: 50 };
let FRAME_W, FRAME_H, PAD, OUT_W, OUT_H;
function setOut(o) {
  const even = v => Math.max(16, Math.min(4096, Math.round(+v / 2) * 2 || 16));
  const pad = Math.max(0, Math.min(500, Math.round(+o.pad || 0)));
  FRAME_W = even(o.w); FRAME_H = even(o.h); PAD = pad;
  OUT_W = FRAME_W + 2 * PAD; OUT_H = FRAME_H + 2 * PAD;
  GL = null;                               // the WebGL canvas and shader are made for one size
}
// output size of the current camera: a flat camera carries its own, the others use the default
const outFor = () => texCam ? { w: tex.w, h: tex.h, pad: 0 } : shotOut;
// output pixels per CSS pixel of the 16:9 frame; another aspect covers the frame, centred
const outScale = () => { const fr = $('frame').getBoundingClientRect(); return Math.max(FRAME_W / fr.width, FRAME_H / fr.height); };
setOut(OUT_DEFAULT);

// CSS gradients and the picture behind the phone, redrawn on a canvas
function drawBackground(g, s) {
  g.fillStyle = $('bg3').value; g.fillRect(0, 0, OUT_W, OUT_H);
  g.save(); g.translate(PAD, PAD);          // positions below are in frame coordinates
  const ellipse = (cx, cy, rx, ry, color, stop) => {
    g.save(); g.translate(cx, cy); g.scale(rx, ry);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1);
    gr.addColorStop(0, color); gr.addColorStop(stop, color + '00');
    g.fillStyle = gr; g.fillRect(-2, -2, 4, 4); g.restore();
  };
  ellipse(FRAME_W * 0.8, FRAME_H * 0.7, FRAME_W * 0.7, FRAME_H * 0.8, $('bg2').value, 0.75);
  ellipse(FRAME_W * 0.25, FRAME_H * 0.35, FRAME_W * 0.6, FRAME_H * 0.7, $('bg1').value, 0.7);
  if (reflImg && reflImg.complete && reflImg.naturalWidth) {   // #bgImg: inset -12%, cover, position, scale, blur
    const bw = FRAME_W * 1.24, bh = FRAME_H * 1.24, bx = -FRAME_W * 0.12, by = -FRAME_H * 0.12;
    const iw = reflImg.naturalWidth, ih = reflImg.naturalHeight, c = Math.max(bw / iw, bh / ih);
    const dw = iw * c, dh = ih * c, px0 = (bw - dw) * $('bgX').value / 100, py0 = (bh - dh) * $('bgY').value / 100;
    g.save();
    g.filter = `blur(${$('bgBlur').value * s}px) brightness(${$('bgBright').value})`;
    g.translate(FRAME_W / 2, FRAME_H / 2); g.scale(+$('bgScale').value, +$('bgScale').value); g.translate(-FRAME_W / 2, -FRAME_H / 2);
    g.drawImage(reflImg, bx + px0, by + py0, dw, dh);
    g.restore();
  }
  g.restore();
}
function drawVignette(g) {
  if (FLAT) return;                        // flat screen: no camera effects
  const rx = FRAME_W / 2 * Math.SQRT2, ry = FRAME_H / 2 * Math.SQRT2;
  g.save(); g.globalAlpha = +$('vignette').value;
  g.translate(OUT_W / 2, OUT_H / 2); g.scale(rx, ry);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1);
  gr.addColorStop(0.4, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.85)');
  g.fillStyle = gr; g.fillRect(-2, -2, 4, 4); g.restore();
}

// ---------- the phone in 3D, projected exactly as the browser shows it ----------
// A point (u, v) of the phone (0..1 across the image) is put through the phone's CSS transform and the
// frame's perspective, giving output pixels and the perspective divisor w. Points behind the camera
// (w <= 0) exist with strong perspective; WebGL clips them, like the browser does on screen.
function phoneProjector() {
  const frame = $('frame'), ph = $('phone');
  // exact (fractional) sizes; the phone is centred in the frame by flexbox
  const fr = frame.getBoundingClientRect(), fw = fr.width, fh = fr.height, s = outScale();
  const cx = PAD + FRAME_W / 2, cy = PAD + FRAME_H / 2;      // frame centre in the output
  const P = parseFloat(frame.style.perspective) || 1e9;
  const M = new DOMMatrix(getComputedStyle(ph).transform);
  const bw = parseFloat(view.style.width), bh = parseFloat(view.style.height), ox = (fw - bw) / 2, oy = (fh - bh) / 2;
  return (u, v) => {
    const p = M.transformPoint(new DOMPoint(u * bw - bw / 2, v * bh - bh / 2, 0, 1));
    const X = ox + bw / 2 + p.x / p.w, Y = oy + bh / 2 + p.y / p.w, Z = p.z / p.w;
    const w = (P - Z) / P;                 // perspective origin is the frame centre
    return { x: cx + s * (X - fw / 2) / w, y: cy + s * (Y - fh / 2) / w, w,
             // homogeneous output position, for the GPU to clip and divide
             hx: cx * w + s * (X - fw / 2), hy: cy * w + s * (Y - fh / 2) };
  };
}

function glSetup() {
  const c = document.createElement('canvas'); c.width = OUT_W; c.height = OUT_H;
  const gl = c.getContext('webgl2', { premultipliedAlpha: true, alpha: true, preserveDrawingBuffer: true });
  const sh = (type, src) => { const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return o; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, `#version 300 es
    in vec3 p; in vec2 uv; out vec2 v;   // p = (x*w, y*w, w) in output pixels
    void main() { v = uv; gl_Position = vec4(p.x / ${OUT_W}.0 * 2.0 - p.z, p.z - p.y / ${OUT_H}.0 * 2.0, 0.0, p.z); }`));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, `#version 300 es
    precision highp float; in vec2 v; uniform sampler2D t; out vec4 o;
    void main() { o = texture(t, v); }`));
  gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  const pL = gl.getAttribLocation(prog, 'p'), uL = gl.getAttribLocation(prog, 'uv');
  gl.enableVertexAttribArray(pL); gl.vertexAttribPointer(pL, 3, gl.FLOAT, false, 20, 0);
  gl.enableVertexAttribArray(uL); gl.vertexAttribPointer(uL, 2, gl.FLOAT, false, 20, 12);
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  GL = { c, gl };
}
function drawPhoneGL(pr) {
  if (!GL) glSetup();
  const { gl } = GL;
  const vert = (u, v) => { const q = pr(u, v); return [q.hx, q.hy, q.w, u, v]; };
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([[0, 0], [1, 0], [1, 1], [0, 0], [1, 1], [0, 1]].flatMap(([u, v]) => vert(u, v))), gl.DYNAMIC_DRAW);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, view);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.viewport(0, 0, OUT_W, OUT_H);
  gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  return GL.c;
}

// Fallback without WebGL: a fine grid of triangles, each drawn with an affine transform;
// cells with a corner behind the camera are skipped.
function drawPhoneMesh(g, pr, src) {
  const NX = 32, NY = 64, W = src.width, Hh = src.height;
  const pts = [];
  for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) pts.push(pr(i / NX, j / NY));
  const P = (i, j) => pts[j * (NX + 1) + i];
  const tri = (s0, s1, s2, d0, d1, d2) => {
    // grow the clip triangle a little so neighbours overlap and no seams show
    const cx = (d0[0] + d1[0] + d2[0]) / 3, cy = (d0[1] + d1[1] + d2[1]) / 3;
    const grow = p => { const dx = p[0] - cx, dy = p[1] - cy, l = Math.hypot(dx, dy) || 1; return [p[0] + dx / l * 0.6, p[1] + dy / l * 0.6]; };
    const [e0, e1, e2] = [d0, d1, d2].map(grow);
    const den = s0[0] * (s1[1] - s2[1]) + s1[0] * (s2[1] - s0[1]) + s2[0] * (s0[1] - s1[1]);
    const a = (d0[0] * (s1[1] - s2[1]) + d1[0] * (s2[1] - s0[1]) + d2[0] * (s0[1] - s1[1])) / den;
    const b = (d0[1] * (s1[1] - s2[1]) + d1[1] * (s2[1] - s0[1]) + d2[1] * (s0[1] - s1[1])) / den;
    const c = (d0[0] * (s2[0] - s1[0]) + d1[0] * (s0[0] - s2[0]) + d2[0] * (s1[0] - s0[0])) / den;
    const d = (d0[1] * (s2[0] - s1[0]) + d1[1] * (s0[0] - s2[0]) + d2[1] * (s1[0] - s0[0])) / den;
    const e = (d0[0] * (s1[0] * s2[1] - s2[0] * s1[1]) + d1[0] * (s2[0] * s0[1] - s0[0] * s2[1]) + d2[0] * (s0[0] * s1[1] - s1[0] * s0[1])) / den;
    const f = (d0[1] * (s1[0] * s2[1] - s2[0] * s1[1]) + d1[1] * (s2[0] * s0[1] - s0[0] * s2[1]) + d2[1] * (s0[0] * s1[1] - s1[0] * s0[1])) / den;
    g.save();
    g.beginPath(); g.moveTo(...e0); g.lineTo(...e1); g.lineTo(...e2); g.closePath(); g.clip();
    g.setTransform(a, b, c, d, e, f);
    g.drawImage(src, 0, 0);
    g.restore();
  };
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const c4 = [P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)];
    if (c4.some(p => p.w <= 0.02)) continue;
    const s = [[i / NX * W, j / NY * Hh], [(i + 1) / NX * W, j / NY * Hh], [(i + 1) / NX * W, (j + 1) / NY * Hh], [i / NX * W, (j + 1) / NY * Hh]];
    const d = c4.map(p => [p.x, p.y]);
    tri(s[0], s[1], s[2], d[0], d[1], d[2]);
    tri(s[0], s[2], s[3], d[0], d[2], d[3]);
  }
}

// Draws the phone into g: WebGL when it works here, else the triangle mesh. Returns the method used.
let phoneMethod = null;
function drawPhone(g) {
  const pr = phoneProjector();
  if (phoneMethod !== 'mesh') {
    try {
      const c = drawPhoneGL(pr);
      if (phoneMethod === 'webgl') { g.drawImage(c, 0, 0); return phoneMethod; }
      // first frame: compare with the mesh at a few points of the phone that are in the picture
      const probe = document.createElement('canvas'); probe.width = OUT_W; probe.height = OUT_H;
      drawPhoneMesh(probe.getContext('2d'), pr, view);
      const pg = probe.getContext('2d', { willReadFrequently: true }), gl = GL.gl, px = new Uint8Array(4);
      let seen = 0, drawn = 0;
      for (const [u, v] of [[0.5, 0.3], [0.5, 0.5], [0.3, 0.4], [0.7, 0.4], [0.5, 0.15], [0.5, 0.8]]) {
        const q = pr(u, v);
        if (q.w <= 0 || q.x < 0 || q.y < 0 || q.x >= OUT_W || q.y >= OUT_H) continue;
        if (pg.getImageData(Math.round(q.x), Math.round(q.y), 1, 1).data[3] === 0) continue;
        seen++;
        gl.readPixels(Math.round(q.x), OUT_H - 1 - Math.round(q.y), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        if (px[3] > 0) drawn++;
      }
      if (!seen || drawn === seen) { g.drawImage(c, 0, 0); phoneMethod = 'webgl'; return phoneMethod; }
    } catch (e) {}
    phoneMethod = 'mesh';
  }
  drawPhoneMesh(g, pr, view);
  return phoneMethod;
}

// texture resolution for a camera: about one texture pixel per output pixel where the screen is
function captureScale(kUser) {
  const pr = phoneProjector(), sw = LAYOUT.sx / view.width, sh = LAYOUT.sy / view.height;
  const a = pr(sw + 0.1 * (1 - 2 * sw), sh + 0.05), b = pr(1 - sw - 0.1 * (1 - 2 * sw), sh + 0.05);
  if (a.w <= 0 || b.w <= 0) return Math.min(10, kUser * 2);
  const wOut = Math.hypot(b.x - a.x, b.y - a.y) / (0.8 * (1 - 2 * sw));   // whole phone width at that depth
  return Math.max(kUser, Math.min(10, Math.ceil(kUser * wOut / view.width)));
}

// asTexture: the flat render, through the current flat view (or a fresh one at the block's closeness)
async function captureShot(asTexture) {
  if (playing) stopShot();
  texCam = asTexture ? (texView() ? { ...Object.fromEntries(ROT_IDS.map(id => [id, $(id).value])), pan: { ...pan } } : flatCam(tex.zoom)) : null;
  setOut(outFor());
  if (!('VideoEncoder' in window)) { texCam = null; alert('Этот браузер не умеет кодировать видео. Открой эмулятор в Chrome.'); return; }
  // software encoder first: the GPU encoder gave a black video on the author's machine
  // constant quality (quantizer 14, near-lossless) where the encoder allows it, else 40 Mbit/s
  const cfgs = ['prefer-software', 'no-preference'].flatMap(hw => ['quantizer', 'variable'].flatMap(mode =>
    ['avc1.640033', 'avc1.640034', 'avc1.640032', 'avc1.4d0033'].map(codec => ({
      codec, width: OUT_W, height: OUT_H, bitrate: 40e6, framerate: SHOT.fps, avc: { format: 'avc' },
      hardwareAcceleration: hw, latencyMode: 'quality', bitrateMode: mode }))));
  let cfg = null;
  for (const c of cfgs) if ((await VideoEncoder.isConfigSupported(c)).supported) { cfg = c; break; }
  if (!cfg) { alert('H.264 ' + OUT_W + 'x' + OUT_H + ' не поддерживается этим браузером.'); texCam = null; setOut(OUT_DEFAULT); return; }

  const kept = keepState(), kUser = SHOT_K;
  const btn = $(asTexture ? 'texRender' : 'shotCapture'); btn.disabled = true;
  NO_DEFOCUS = true; FLAT = !!asTexture;
  const via = !!asTexture, tag = via ? '_texture' : '';
  const muxer = new Mp4Muxer.Muxer({
    target: new Mp4Muxer.ArrayBufferTarget(),
    video: { codec: 'avc', width: OUT_W, height: OUT_H, frameRate: SHOT.fps },
    fastStart: 'in-memory',
  });
  let failed = null;
  const enc = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: e => { failed = e; } });
  enc.configure(cfg);
  const out = document.createElement('canvas'); out.width = OUT_W; out.height = OUT_H;
  const g = out.getContext('2d');
  const kFor = {};
  phoneMethod = null;
  try {
    for (let n = 0; n < SHOT.frames && !failed; n++) {
      const cam = via ? 'via' : SHOT === SHOT_SMS ? 2 : n < SHOT.cut ? 0 : 1;
      CAPTURE = null; shotFrame(n);
      if (!(cam in kFor)) kFor[cam] = captureScale(kUser);
      CAPTURE = { k: kFor[cam], kUser };
      present();
      drawBackground(g, outScale());
      drawPhone(g);
      drawVignette(g);
      const frame = new VideoFrame(out, { timestamp: Math.round(n * 1e6 / SHOT.fps), duration: Math.round(1e6 / SHOT.fps) });
      enc.encode(frame, cfg.bitrateMode === 'quantizer' ? { keyFrame: n % SHOT.fps === 0, avc: { quantizer: 14 } } : { keyFrame: n % SHOT.fps === 0 });
      frame.close();
      $('shotInfo').textContent = `Рендер: кадр ${n + 1} / ${SHOT.frames}`;
      while (enc.encodeQueueSize > 4) await new Promise(r => setTimeout(r, 5));
      await new Promise(r => setTimeout(r, 0));   // let the page repaint the progress
    }
    await enc.flush();
    if (failed) throw failed;
    muxer.finalize();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([muxer.target.buffer], { type: 'video/mp4' }));
    a.download = `${SHOT.name}${tag}_${OUT_W}x${OUT_H}.mp4`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    $('shotInfo').textContent = `Готово: ${a.download}, ${SHOT.frames} кадров (телефон: ${phoneMethod === 'webgl' ? 'WebGL' : '2D'})`;
  } catch (e) {
    $('shotInfo').textContent = 'Ошибка рендера: ' + (e.message || e);
  } finally {
    CAPTURE = null; NO_DEFOCUS = false; FLAT = false; texCam = null; setOut(OUT_DEFAULT);
    try { enc.close(); } catch (e) {}
    restoreState(kept);
    present();
    btn.disabled = false;
  }
}

// ---------- panel ----------
function applyShotLook() {
  for (const [id, v] of Object.entries(SHOT_LOOK)) {
    const el = $(id);
    if (el.type === 'checkbox') el.checked = v; else el.value = v;
    el.dispatchEvent(new Event('input')); el.dispatchEvent(new Event('change'));
  }
}

(() => {
  const sizeBox = p => `
    <label>Размер<select id="${p}Preset">
        <option value="1920,1080">1920×1080</option><option value="2560,1440">2560×1440</option>
        <option value="3840,2160">3840×2160</option><option value="1280,720">1280×720</option>
        <option value="800,640">800×640 (экран ×5)</option><option value="1600,1280">1600×1280 (экран ×10)</option>
        <option value="">свой</option></select></label>
    <div class="row" id="${p}Custom"><label>Ширина<input type="number" id="${p}W" min="16" max="4096" step="2"></label>
      <label>Высота<input type="number" id="${p}H" min="16" max="4096" step="2"></label></div>`;
  const box = document.createElement('fieldset');
  box.innerHTML = `
    <legend>Шот</legend>
    <label>Сценарий<select id="scenario"><option value="s120">Шот 120: рубль, «Сообщение получено», список</option><option value="sms">SMS: полученная смс</option></select></label>
    <div id="s120Box">
      <div class="hint">25 к/с, 106 кадров. Камера 1: рубль и «Сообщение получено» (кадры 0–63). Камера 2: список (64–105).</div>
      <div class="row"><button id="shotCam1">Встать в камеру 1</button><button id="shotSet1">Запомнить 1</button></div>
      <div class="row"><button id="shotCam2">Встать в камеру 2</button><button id="shotSet2">Запомнить 2</button></div>
    </div>
    <div id="smsBox">
      <div class="hint">25 к/с, 75 кадров. Открытая смс: строки загружаются сверху с 6-го кадра.</div>
      <label>Текст смс<textarea id="smsText"></textarea></label>
      <div class="row"><button id="shotCam3">Встать в камеру</button><button id="shotSet3">Запомнить</button></div>
    </div>
    ${sizeBox('shot')}
    <label>Поля вокруг кадра, px<input type="number" id="shotPad" min="0" max="500" step="2"></label>
    <button class="main" id="shotPlay">▶ Проиграть шот</button>
    <button class="main" id="shotCapture">● Capture</button>
    <div class="hint" id="shotInfo"></div>`;
  const tb = document.createElement('fieldset');
  tb.innerHTML = `
    <legend>Рендер в текстуру</legend>
    <button id="texGo">Плоский вид</button>
    <label>Крупность<span><input type="range" id="texZoom" min="0.5" max="4" step="0.01"><output></output></span></label>
    ${sizeBox('tex')}
    <button class="main" id="texRender">● Рендер</button>`;
  $('side').append(box);                  // camera, then the shot
  $('texPanel').append(tb);               // the texture render in its own column next to the frame
  // standing in a camera shows that camera's screen (mid-flight rouble / the list), so it can be set up
  $('shotCam1').onclick = () => { if (playing) stopShot(); shotFrame(17, shotCams[0]); };
  $('shotCam2').onclick = () => { if (playing) stopShot(); shotFrame(80, shotCams[1]); };
  const setCam = i => { shotCams[i] = { ...Object.fromEntries(ROT_IDS.map(id => [id, $(id).value])), pan: { ...pan } }; saveShotCams();
    $('shotInfo').textContent = i === 2 ? 'Камера смс записана' : `Камера ${i + 1} шота записана`; };
  $('shotSet1').onclick = () => setCam(0);
  $('shotSet2').onclick = () => setCam(1);
  $('shotCam3').onclick = () => { if (playing) stopShot(); shotFrame(SHOT_SMS.frames - 1, shotCams[2]); };
  $('shotSet3').onclick = () => setCam(2);
  $('smsText').value = smsText;
  $('smsText').oninput = () => { smsText = $('smsText').value; saveScenario(); if (S.mode === 'read' && SHOT === SHOT_SMS && !playing) shotFrame(SHOT_SMS.frames - 1); };
  $('scenario').onchange = () => { if (playing) stopShot(); scenario = $('scenario').value; saveScenario(); showScenario(); };
  showScenario();
  // size controls: a preset, or "свой" with width and height
  for (const [p, o] of [['shot', shotOut], ['tex', tex]]) {
    $(p + 'Preset').onchange = () => { const v = $(p + 'Preset').value;
      if (v) { [o.w, o.h] = v.split(',').map(Number); saveOut(); }
      showOut(p, !v); };
    [p + 'W', p + 'H'].forEach(id => $(id).onchange = () => {
      o.w = +$(p + 'W').value || 1920; o.h = +$(p + 'H').value || 1080; saveOut(); showOut(p, true); });
  }
  $('shotPad').onchange = () => { shotOut.pad = Math.max(0, +$('shotPad').value || 0); saveOut(); showOut(); };
  // the flat view: the shot's first camera screen, phone turned and filling the frame at the set closeness
  const goFlat = () => { if (playing) stopShot(); shotFrame(17, flatCam(tex.zoom)); };
  $('texGo').onclick = goFlat;
  $('texZoom').oninput = () => { tex.zoom = +$('texZoom').value; saveOut(); showOut(); goFlat(); };
  $('shotPlay').onclick = () => playShot();
  $('shotCapture').onclick = () => captureShot(false);
  $('texRender').onclick = () => captureShot(true);
  showOut();
})();
function showScenario() {
  SHOT = scenario === 'sms' ? SHOT_SMS : SHOT_120;
  $('scenario').value = scenario;
  $('s120Box').style.display = scenario === 'sms' ? 'none' : '';
  $('smsBox').style.display = scenario === 'sms' ? '' : 'none';
  $('smsText').value = smsText;
}
function showOut(only, custom) {
  for (const [p, o] of [['shot', shotOut], ['tex', tex]]) {
    const c = p === only && custom;
    const v = o.w + ',' + o.h, known = [...$(p + 'Preset').options].some(x => x.value === v);
    $(p + 'Preset').value = known && !c ? v : '';
    $(p + 'Custom').style.display = known && !c ? 'none' : '';
    $(p + 'W').value = o.w; $(p + 'H').value = o.h;
  }
  $('shotPad').value = shotOut.pad;
  $('texZoom').value = tex.zoom; $('texZoom').nextElementSibling.value = 'x' + (+tex.zoom).toFixed(2);
  const o = shotOut;
  $('shotCapture').textContent = `● Capture ${o.w + 2 * o.pad}×${o.h + 2 * o.pad}` + (o.pad ? ` (кадр ${o.w}×${o.h} + ${o.pad} px вокруг)` : '');
  $('texRender').textContent = `● Рендер ${tex.w}×${tex.h}`;
}

// Check mode for tuning: index.html#frame=N[&look] draws output frame N over the whole window
// (used to compare with the sketch in a headless Chrome screenshot).
if (/^#frame=\d+/.test(location.hash)) {
  setTimeout(() => {
    if (location.hash.includes('look')) applyShotLook();
    NO_DEFOCUS = true;
    const n = +location.hash.match(/frame=(\d+)/)[1], kUser = SHOT_K;
    const cm = location.hash.match(/cam=([-\d.,]+)/);       // rotX,rotY,rotZ,persp,zoom,panX,panY
    if (cm) {
      const v = cm[1].split(',');
      shotCams[SHOT === SHOT_SMS ? 2 : n < SHOT.cut ? 0 : 1] = { rotX: v[0], rotY: v[1], rotZ: v[2], persp: v[3], zoom: v[4], pan: { x: +v[5], y: +v[6] } };
    }
    if (/[&]flat/.test(location.hash)) texCam = flatCam(tex.zoom);
    FLAT = !!texCam;
    setOut(outFor());
    CAPTURE = null; shotFrame(n);
    CAPTURE = { k: captureScale(kUser), kUser }; present();
    const fr = $('frame').getBoundingClientRect(), out = document.createElement('canvas');
    out.width = OUT_W; out.height = OUT_H;
    const g = out.getContext('2d');
    drawBackground(g, outScale()); phoneMethod = /mesh/.test(location.hash) ? 'mesh' : null; drawPhone(g); drawVignette(g);
    CAPTURE = null;
    out.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:9999';
    document.documentElement.append(out);
  }, 1200);
}

// Test hook: index.html#autocapture=http://127.0.0.1:PORT/ renders the shot and POSTs the .mp4 there
// instead of downloading it (used to check the render in a headless Chrome).
if (/^#autocapture=/.test(location.hash)) {
  const sink = decodeURIComponent(location.hash.slice('#autocapture='.length).split('&')[0]);
  const click = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    if (!this.download || !this.download.endsWith('.mp4')) return click.call(this);
    fetch(this.href).then(r => r.blob()).then(b => fetch(sink, { method: 'POST', body: b }));
  };
  const set = location.hash.match(/[&?]set=([^&]+)/);     // set=id:value,id:value
  setTimeout(() => {
    if (set) for (const kv of decodeURIComponent(set[1]).split(',')) {
      const [id, v] = kv.split(':'); $(id).value = v; $(id).dispatchEvent(new Event('input')); $(id).dispatchEvent(new Event('change'));
    }
    captureShot();
  }, 1500);
}

// First visit in this browser: start from the author's settings (default-settings.js).
if (typeof FIRST_VISIT !== 'undefined' && FIRST_VISIT) applySettings(DEFAULT_SETTINGS);
