// 3D fly-over film. Every frame is a pure function of t: seek(t) renders it.
'use strict';

const CONFIG = {
  brand: 'Macedonian with Vilma',
  line1: 'Learn Macedonian with Vilma.',
  line2: 'one friendly lesson at a time.',
};

const F = 1880, W = 1440, HF = 1152, CX = 720, CY = 576;
const SUB = 16, SHUTTER = 0.7 / 60;
const DEG = Math.PI / 180;

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const mix = (a, b, e) => a + (b - a) * e;
const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const ease5 = x => { x = clamp(x); return x * x * x * (x * (6 * x - 15) + 10); };
const quadIO = x => { x = clamp(x); return x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2; };
const outCubic = x => 1 - (1 - clamp(x)) ** 3;
const sm = (a, b, t) => ease((t - a) / (b - a));
const sm5 = (a, b, t) => ease5((t - a) / (b - a));

let J, PH, HERO_H = 740;

// ---------------------------------------------------------------- camera
// Speed down the page as a share of cruise.
function speed(t) {
  if (t < 0.6) return 0.5 * ease(t / 0.6);
  if (t < 1.25) return 0.5;
  if (t < 1.6) return 0.5 + 0.5 * ease((t - 1.25) / 0.35);
  if (t < 7.3) return 1.0;
  if (t < 8.3) return 1.0 - 0.88 * ease(t - 7.3);
  return 0.12 * (1 - ease((t - 8.3) / 0.6));
}
// Rise: smooth trapezoid speed in log-distance.
const riseSpeed = t => sm(7.75, 8.35, t) * (1 - sm(8.95, 9.25, t));

const DT = 0.0005, TMAX = 15;
const S_TAB = new Float64Array(Math.ceil(TMAX / DT) + 2);
const R_TAB = new Float64Array(Math.ceil(TMAX / DT) + 2);
(function integrate() {
  for (let i = 1; i < S_TAB.length; i++) {
    const tm = (i - 0.5) * DT;
    S_TAB[i] = S_TAB[i - 1] + speed(tm) * DT;
    R_TAB[i] = R_TAB[i - 1] + riseSpeed(tm) * DT;
  }
})();
const lookup = (tab, t) => { const x = clamp(t, 0, TMAX) / DT, i = Math.floor(x); return mix(tab[i], tab[i + 1], x - i); };

let Y0 = 430, CRUISE, D_OVER, D1, D_A, YTOP_A;
const FOOT_Y = 2009;

function setupCamera() {
  CRUISE = (FOOT_Y - Y0) / lookup(S_TAB, 8.0);
  D_OVER = F * PH / (HF - 2 * 42);
  D1 = W * F / 1018;
  D_A = D_OVER / 1.035;
  YTOP_A = CY - F * (PH / 2) / D_A;
}

function camera(t) {
  let th, d, ly;
  const RTOT = lookup(R_TAB, 9.3);
  if (t < 9.25) {
    th = 56 * DEG * (1 - sm(8.15, 8.95, t));
    if (t < 7.75) d = 1360 + 340 * ease(t / 7.75);
    else d = Math.exp(mix(Math.log(1700), Math.log(D_OVER), lookup(R_TAB, t) / RTOT));
    const glide = Y0 + CRUISE * lookup(S_TAB, t);
    const a = 534 * d / (F * Math.cos(th) + 534 * Math.sin(th));
    ly = mix(glide, PH - a, sm5(8.3, 8.65, t));
  } else if (t < 9.47) {
    th = 0; d = D_OVER / (1 + 0.035 * sm(9.25, 9.47, t)); ly = PH / 2;
  } else if (t < 9.97) {
    th = 0;
    const u = (t - 9.47) / 0.5;
    d = Math.exp(mix(Math.log(D_A), Math.log(D1), quadIO(u)));
    const yTop = mix(YTOP_A, 283, ease5((u - 0.3) / 0.7));
    ly = (CY - yTop) * d / F;
  } else {
    th = 0; d = D1 / (1 + 0.02 * sm(9.97, 14.5, t)); ly = 370 + 31.5 * d / F;
  }
  const s = Math.sin(th), c = Math.cos(th);
  return {
    t, th, d, ly,
    pos: [CX, ly + d * s, d * c],
    r: [1, 0, 0], u: [0, -c, s], f: [0, -s, -c],
    focus: d,
  };
}
// Camera-space point (screen x, screen y, depth) -> world.
function camToWorld(cam, sx, sy, zc) {
  const kx = (sx - CX) * zc / F, ky = (CY - sy) * zc / F, p = cam.pos;
  return [p[0] + cam.f[0] * zc + cam.r[0] * kx + cam.u[0] * ky,
          p[1] + cam.f[1] * zc + cam.r[1] * kx + cam.u[1] * ky,
          p[2] + cam.f[2] * zc + cam.r[2] * kx + cam.u[2] * ky];
}

// ---------------------------------------------------------------- choreography
function diveState(t) {
  const u = clamp((t - 9.47) / 0.5);
  return {
    u,
    clipBottom: mix(PH, HERO_H, ease5((u - 0.15) / 0.85)),
    radius: mix(24, 38 * D1 / F, ease5(u)),
    belowFade: ease(u / 0.6),
    belowCut: u > 0.95 ? 1 : 0,
  };
}

function layerState(l, t) {
  const idx = parseInt(l.id.replace(/\D/g, '') || '0', 10);
  let z = 16, a = 0, dx = 0, dy = 0, edge = 0, hz = 0, cut = 0;
  switch (l.kind) {
    case 'mockup': { const e = sm(0.1, 1.35, t); z = 24 + 16 * e; a = 8 * DEG * e; break; }
    case 'button': z = 16; break;
    case 'chip': {
      if (l.id.startsWith('flag')) {
        const e = sm(0.1 + 0.08 * idx, 1.35, t);
        z = mix(14, 60 + 10 * idx, e); a = 30 * DEG * e;
      } else {
        const e = sm(6.9 + 0.08 * idx, 7.9, t);
        z = mix(12, 34, e); a = 24 * DEG * e;
      }
      const s2 = sm(7.75, 9.25, t); z = mix(z, 14, s2); a = mix(a, 0, s2);
      break;
    }
    case 'photo': {
      const e = sm(1.35 + 0.1 * idx, 2.7, t);
      z = mix(18, [100, 130, 115][idx], e); a = 46 * DEG * e;
      const s2 = sm(7.75, 9.25, t); z = mix(z, 18, s2); a = mix(a, 0, s2); break;
    }
    case 'flychip': {
      const e = sm(1.35, 2.5, t);
      z = mix(20, 200, e); a = 54 * DEG * e;
      dx = (idx === 0 ? -1 : 1) * 150 * Math.pow(e, 1.6); dy = 60 * e;
      hz = sm(2.55, 2.85, t); cut = t > 2.9 ? 1 : 0;
      break;
    }
    case 'testimonial': {
      const e = sm(5.45, 6.3, t); z = mix(22, 112, e); a = 30 * DEG * e; edge = 34;
      const s2 = sm(7.75, 9.25, t); z = mix(z, 22, s2); a = mix(a, 0, s2); break;
    }
  }
  return { z, a, dx, dy, edge, hz, cut };
}

// screen x, screen y, depth, screen size while hanging
const TILE_HANG = [[110, 200, 1050, 170], [300, 105, 1250, 140], [1325, 190, 1000, 200], [1130, 95, 1200, 150]];
const TILE_END = [ // screen x, screen y, depth, screen size
  [211, 283, () => D1 - 520, 112],
  [1229, 283, () => D1 - 40, 124],
  [130, 1050, () => 640, 440],
  [1330, 1000, () => 760, 380],
];
const TILE_FROM = [[-160, -120], [1600, -160], [-360, 1500], [1800, 1460]];

function tileState(i, t, cam) {
  // returns {c:[x,y,z], X:[..], Y:[..], size, alpha, shadow}
  if (t < 3.6) {
    const sx = 452 + 16 + i * 44, sy = 539;
    const h = TILE_HANG[i];
    const e = ease5((t - 0.1 - 0.05 * i) / (1.25 - 0.05 * i));
    // anchor camera: follows the real camera, then slows to a stop (tiles trail, then fall behind)
    const x = clamp((t - 1.2) / 1.2);
    const ta = t < 1.2 ? t : 1.2 + 1.2 * (x - x * x / 2);
    const acam = camera(ta);
    const hp = camToWorld(acam, h[0], h[1], h[2]);
    const S = mix(32, h[3] * h[2] / F, e);
    const p = [mix(sx, hp[0], e), mix(sy, hp[1], e), mix(1.5, hp[2], e) + 60 * Math.sin(Math.PI * e)];
    const e3 = sm(2.3, 3.6, t); p[2] += 700 * e3; p[1] -= 200 * e3;
    return worldTile(p, S, acam.th * e, 1 - sm(3.3, 3.6, t));
  }
  if (i === 1 && t > 4.85 && t < 5.95) {
    const p = (t - 4.85) / 1.1;
    const sx = mix(330, -330, p), sy = mix(880, 760, p);
    return camTile(cam, sx, sy, 430, 210, 1, 0);
  }
  if (t >= 9.5) {
    const k = TILE_END[i], fr = TILE_FROM[i];
    const e = outCubic((t - 9.55 - 0.06 * i) / 0.75);
    const dr = sm(9.9, 14.5, t);
    const sx = mix(fr[0], k[0], e) + 6 * Math.sin(1.3 * t + i * 1.7) * dr;
    const sy = mix(fr[1], k[1], e) + 5 * Math.cos(1.1 * t + i * 2.3) * dr - (i >= 2 ? 26 * dr : 0);
    return camTile(cam, sx, sy, k[2](), k[3], e > 0 ? 1 : 0, i < 2 ? 1 : 0);
  }
  return null;
}
function worldTile(c, S, a, alpha) {
  const h = S / 2;
  return { c, X: [h, 0, 0], Y: [0, h * Math.cos(a), -h * Math.sin(a)], S, alpha, shadow: 1 - sm(300, 650, c[2]) };
}
function camTile(cam, sx, sy, zc, screenSize, alpha, shadow) {
  const c = camToWorld(cam, sx, sy, zc), h = screenSize * zc / F / 2;
  return { c, X: cam.r.map(v => v * h), Y: cam.u.map(v => -v * h), S: 2 * h, alpha, shadow: shadow * (1 - sm(300, 650, c[2])) };
}

// ---------------------------------------------------------------- GL
const canvas = document.getElementById('c');
const gl = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true, alpha: false, premultipliedAlpha: false });
gl.getExtension('EXT_color_buffer_float');
gl.getExtension('EXT_color_buffer_half_float');
gl.getExtension('OES_texture_float_linear');
const ANISO = gl.getExtension('EXT_texture_filter_anisotropic');

const VS = `#version 300 es
layout(location=0) in vec2 a;
uniform vec3 uC, uX, uY, uCam, uR, uU, uF;
uniform int uNDC;
out vec2 vUv; out float vZ;
void main(){
  vUv = a;
  if (uNDC == 1) { gl_Position = vec4(a * 2.0 - 1.0, 0.0, 1.0); vZ = 1e5; return; }
  vec3 P = uC + uX * (2.0 * a.x - 1.0) + uY * (2.0 * a.y - 1.0);
  vec3 v = P - uCam;
  float xc = dot(v, uR), yc = dot(v, uU), zc = dot(v, uF);
  vZ = zc;
  gl_Position = vec4(${F.toFixed(1)} * xc / 720.0, ${F.toFixed(1)} * yc / 576.0, 0.5 * zc, zc);
}`;

const FS = `#version 300 es
precision highp float;
in vec2 vUv; in float vZ;
layout(location=0) out vec4 oC;
layout(location=1) out vec4 oI;
uniform int uMode;
uniform sampler2D uTex;
uniform vec2 uSize;        // quad size in page px
uniform float uAlpha, uFocus;
uniform vec4 uRect;        // mode 2/4: x0,y0,x1,y1 in quad-local px (page clip / shadow rect)
uniform float uRadius, uBlur, uOpacity;
uniform vec3 uColor;
uniform float uFade, uFadeFrom;  // haze fade for page below y
uniform vec2 uTexOff;     // mode 1: footprint mapping
uniform float uCosA, uLod;
uniform vec4 uLayer;      // mode 1: layer rect in quad-local px (x0,y0,w,h of padded texture)

vec3 haze(){
  vec2 q = gl_FragCoord.xy / vec2(1440.0, 1152.0) - 0.5;
  float r = length(q * vec2(1.25, 1.0)) * 1.45;
  return mix(vec3(0.976, 0.984, 0.984), vec3(0.949, 0.953, 0.965), smoothstep(0.15, 1.0, r));
}
float sdRound(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
float rectSd(vec2 p, vec4 R, float r){ vec2 c = (R.xy + R.zw) * 0.5, b = (R.zw - R.xy) * 0.5; return sdRound(p - c, b, min(r, min(b.x, b.y))); }
float nearCoc(float z){ return z < uFocus ? min(120.0, 75.0 * (uFocus - z) / z) : 0.0; }
void outInfo(float a){ oI = vec4(vZ, nearCoc(vZ), 0.0, a); }

void main(){
  vec2 p = vUv * uSize;
  if (uMode == 6) { oC = vec4(haze(), 1.0); oI = vec4(6e4, 0.0, 0.0, 1.0); return; }
  if (uMode == 4) { // page
    float sd = rectSd(p, uRect, uRadius);
    float aa = fwidth(sd) * 0.75 + 1e-3;
    float a = 1.0 - smoothstep(-aa, aa, sd);
    if (a <= 0.0) discard;
    vec3 c = texture(uTex, vUv).rgb;
    if (p.y > uFadeFrom) c = mix(c, haze(), uFade);
    oC = vec4(c, a); outInfo(a); return;
  }
  if (uMode == 0) { // lifted piece
    vec4 t = texture(uTex, vUv);
    if (t.a <= 0.002) discard;
    vec3 c = t.rgb / max(t.a, 1e-4);
    c = mix(c, haze(), uFade);
    float a = t.a * uAlpha;
    oC = vec4(c, a); outInfo(a); return;
  }
  if (uMode == 1) { // textured shadow on page plane
    // map ground px -> layer uv (footprint is foreshortened by cos(a) in y)
    vec2 g = p - uTexOff;
    vec2 luv = vec2(g.x / uLayer.z, (g.y - uLayer.y) / max(uCosA, 0.05) / uLayer.w + 0.5);
    float s = 0.0;
    for (int i = 0; i < 12; i++) {
      float ang = float(i) * 2.39996, rr = sqrt((float(i) + 0.5) / 12.0);
      vec2 o = vec2(cos(ang), sin(ang)) * rr * uBlur / vec2(uLayer.z, uLayer.w * max(uCosA, 0.05));
      s += textureLod(uTex, luv + o, uLod).a;
    }
    s /= 12.0;
    float a = s * uOpacity * uAlpha;
    if (a <= 0.001) discard;
    oC = vec4(uColor, a); oI = vec4(0.0); return;
  }
  if (uMode == 2) { // analytic soft rounded-rect shadow
    float sd = rectSd(p, uRect, uRadius);
    float a = (1.0 - smoothstep(-uBlur, uBlur, sd)) * uOpacity * uAlpha;
    if (a <= 0.001) discard;
    oC = vec4(uColor, a); oI = vec4(0.0); return;
  }
  if (uMode == 3) { // logo tile
    vec2 q = (vUv - 0.5) * 2.0;
    float sd = sdRound(q, vec2(1.0), 0.44);
    float aa = fwidth(sd) * 0.75 + 1e-3;
    float a = (1.0 - smoothstep(-aa, aa, sd)) * uAlpha;
    if (a <= 0.001) discard;
    vec2 luv = (vUv - 0.5) / 0.86 + 0.5;
    vec4 l = texture(uTex, luv);
    vec3 c = mix(vec3(1.0), l.rgb / max(l.a, 1e-4), l.a * step(0.0, luv.x) * step(luv.x, 1.0) * step(0.0, luv.y) * step(luv.y, 1.0));
    c *= mix(1.0, 0.965, smoothstep(-0.2, 0.0, sd)); // faint rim
    oC = vec4(c, a); outInfo(a); return;
  }
  if (uMode == 5) { // slab edge
    vec3 c = mix(vec3(1.0), vec3(0.90, 0.915, 0.935), vUv.y);
    c = mix(c, haze(), uFade);
    float ex = min(vUv.x, 1.0 - vUv.x) * uSize.x;
    float a = smoothstep(0.0, 2.0, ex) * uAlpha;
    oC = vec4(c, a); outInfo(a); return;
  }
}`;

const VS_FULL = `#version 300 es
layout(location=0) in vec2 a; out vec2 vUv;
void main(){ vUv = a; gl_Position = vec4(a * 2.0 - 1.0, 0.0, 1.0); }`;

const FS_DOF = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uCol, uInfo; uniform float uFocus, uW;
const vec2 RES = vec2(1440.0, 1152.0);
float coc(float z){ return z < uFocus ? min(120.0, 75.0 * (uFocus - z) / z) : min(120.0, 6.0 * (z - uFocus) / z); }
void main(){
  vec4 i0 = texture(uInfo, vUv);
  float z0 = i0.x, R0 = coc(z0);
  float nearEst = textureLod(uInfo, vUv, 5.0).y * 2.2;
  float Rs = clamp(max(R0, nearEst), 0.0, 120.0);
  vec3 c0 = texture(uCol, vUv).rgb;
  if (Rs < 0.6) { o = vec4(c0 * uW, uW); return; }
  float lod = log2(max(1.0, Rs * 0.28));
  vec3 acc = c0 * 0.5; float wsum = 0.5;
  for (int i = 0; i < 40; i++) {
    float r = Rs * sqrt((float(i) + 0.5) / 40.0), a = float(i) * 2.39996323;
    vec2 p = vUv + vec2(cos(a), sin(a)) * r / RES;
    float zi = textureLod(uInfo, p, 0.0).x;
    float ci = coc(zi);
    float eff = zi > z0 ? min(ci, R0) : ci;
    float w = clamp(eff - r + 1.0, 0.0, 1.0);
    acc += textureLod(uCol, p, lod).rgb * w; wsum += w;
  }
  o = vec4(acc / wsum * uW, uW);
}`;

const FS_OUT = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o; uniform sampler2D uAcc;
void main(){ vec4 a = texture(uAcc, vUv); o = vec4(a.rgb / max(a.a, 1e-5), 1.0); }`;

function prog(vs, fs) {
  const p = gl.createProgram();
  for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    gl.attachShader(p, s);
  }
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const U = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const name = gl.getActiveUniform(p, i).name; U[name] = gl.getUniformLocation(p, name); }
  return { p, U };
}
const P_SCENE = prog(VS, FS), P_DOF = prog(VS_FULL, FS_DOF), P_OUT = prog(VS_FULL, FS_OUT);

const vbo = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

function mkTex(w, h, ifmt, fmt, type, mips) {
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
  const levels = mips ? Math.floor(Math.log2(Math.max(w, h))) + 1 : 1;
  gl.texStorage2D(gl.TEXTURE_2D, levels, ifmt, w, h);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mips ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return t;
}
const colTex = mkTex(W, HF, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, true);
const infoTex = mkTex(W, HF, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, true);
const accTex = mkTex(W, HF, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, false);
const sceneFB = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFB);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colTex, 0);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, infoTex, 0);
gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
const accFB = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, accFB);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, accTex, 0);

function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }
function imgTex(img) {
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  if (ANISO) gl.texParameterf(gl.TEXTURE_2D, ANISO.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(16, gl.getParameter(ANISO.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
  return t;
}

let TEX = {};

// ---------------------------------------------------------------- drawing
let CAM;
function setCam(U, cam) {
  gl.uniform3fv(U.uCam, cam.pos); gl.uniform3fv(U.uR, cam.r); gl.uniform3fv(U.uU, cam.u); gl.uniform3fv(U.uF, cam.f);
  gl.uniform1f(U.uFocus, cam.focus);
}
function quad(U, mode, c, X, Y, size, extra = {}) {
  gl.uniform1i(U.uMode, mode); gl.uniform1i(U.uNDC, mode === 6 ? 1 : 0);
  gl.uniform3fv(U.uC, c); gl.uniform3fv(U.uX, X); gl.uniform3fv(U.uY, Y);
  gl.uniform2fv(U.uSize, size);
  gl.uniform1f(U.uAlpha, extra.alpha ?? 1);
  gl.uniform1f(U.uFade, extra.fade ?? 0);
  gl.uniform1f(U.uFadeFrom, extra.fadeFrom ?? 1e9);
  if (extra.rect) gl.uniform4fv(U.uRect, extra.rect);
  gl.uniform1f(U.uRadius, extra.radius ?? 0);
  gl.uniform1f(U.uBlur, extra.blur ?? 1);
  gl.uniform1f(U.uOpacity, extra.opacity ?? 1);
  gl.uniform3fv(U.uColor, extra.color ?? [0.102, 0.129, 0.2]);
  if (extra.tex) { gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, extra.tex); gl.uniform1i(U.uTex, 0); }
  if (extra.layer) gl.uniform4fv(U.uLayer, extra.layer);
  if (extra.texOff) gl.uniform2fv(U.uTexOff, extra.texOff);
  gl.uniform1f(U.uCosA, extra.cosA ?? 1);
  gl.uniform1f(U.uLod, extra.lod ?? 0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
// flat rect on page plane at height z
function flat(x0, y0, x1, y1, z) { return { c: [(x0 + x1) / 2, (y0 + y1) / 2, z], X: [(x1 - x0) / 2, 0, 0], Y: [0, (y1 - y0) / 2, 0], size: [x1 - x0, y1 - y0] }; }

const SHADOW = z => ({ ox: 0.10 * z, oy: 4 + 0.36 * z, blur: 7 + 0.5 * z });

function renderScene(t) {
  const cam = camera(t); CAM = cam;
  const dv = diveState(t);
  const { U } = P_SCENE;
  for (const unit of [gl.TEXTURE1, gl.TEXTURE0]) { gl.activeTexture(unit); gl.bindTexture(gl.TEXTURE_2D, TEX.logo.t); }
  gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFB);
  gl.viewport(0, 0, W, HF);
  gl.useProgram(P_SCENE.p);
  setCam(U, cam);
  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  quad(U, 6, [0, 0, 0], [0, 0, 0], [0, 0, 0], [1, 1]);

  // page shadow (soft, wide) + page
  const clipB = t >= 9.47 ? dv.clipBottom : PH, rad = t >= 9.47 ? dv.radius : 24;
  const M = 260;
  let g = flat(-M, -M, W + M, PH + M, 0);
  quad(U, 2, g.c, g.X, g.Y, g.size, { rect: [M, M + 26, M + W, M + clipB + 26], radius: rad + 30, blur: 70, opacity: 0.13 });
  quad(U, 2, g.c, g.X, g.Y, g.size, { rect: [M, M + 4, M + W, M + clipB + 4], radius: rad + 4, blur: 10, opacity: 0.07 });
  g = flat(0, 0, W, PH, 0);
  quad(U, 4, g.c, g.X, g.Y, g.size, { tex: TEX.page, rect: [0, 0, W, clipB], radius: rad, fade: t >= 9.47 ? dv.belowFade : 0, fadeFrom: HERO_H });

  // pieces + tiles, lowest first
  const items = [];
  for (const l of J.layers) {
    const st = layerState(l, t);
    const below = l.y > HERO_H - 10;
    const fade = Math.max(st.hz, below && t >= 9.47 ? dv.belowFade : 0);
    const alpha = (below && t >= 9.47 ? 1 - dv.belowCut : 1) * (1 - st.cut);
    if (alpha <= 0) continue;
    items.push({ z: st.z, draw: () => drawLayer(U, l, st, fade, alpha) });
  }
  for (let i = 0; i < 4; i++) {
    const ts = tileState(i, t, cam);
    if (!ts || ts.alpha <= 0) continue;
    items.push({ z: ts.c[2] + 0.01 * i, draw: () => drawTile(U, ts) });
  }
  items.sort((a, b) => a.z - b.z);
  for (const it of items) it.draw();

  gl.bindTexture(gl.TEXTURE_2D, colTex); gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, infoTex); gl.generateMipmap(gl.TEXTURE_2D);
  return cam;
}

function drawLayer(U, l, st, fade, alpha) {
  const pad = J.pad;
  const cx = l.x + l.w / 2 + st.dx, cy = l.y + l.h / 2 + st.dy;
  const ca = Math.cos(st.a), sa = Math.sin(st.a);
  const hw = l.pw / 2, hh = l.ph / 2;
  // shadow on page
  const sh = SHADOW(st.z);
  const foot = hh * ca;
  const gx0 = cx - hw - sh.blur, gx1 = cx + hw + sh.blur, gy0 = cy - foot - sh.blur, gy1 = cy + foot + sh.blur;
  const g = flat(gx0 + sh.ox, gy0 + sh.oy, gx1 + sh.ox, gy1 + sh.oy, 0.02);
  const texScale = TEX[l.id].w / l.pw;
  quad(U, 1, g.c, g.X, g.Y, g.size, {
    tex: TEX[l.id].t, opacity: 0.26, blur: sh.blur, alpha: alpha * (1 - fade),
    layer: [0, sh.blur + foot, l.pw, l.ph], texOff: [sh.blur - 0, 0], cosA: ca,
    lod: Math.max(0, Math.log2(sh.blur * texScale * 0.5)),
  });
  // slab edge (bottom face)
  const C = [cx, cy, st.z];
  const Yv = [0, hh * ca, -hh * sa];
  if (st.edge > 0 && st.a > 0.01) {
    const bh = l.h / 2;                 // real card half-height (texture is padded)
    const B = [cx, cy + bh * ca, st.z - bh * sa];
    const n = [0, sa, ca];              // face normal
    const ins = l.radius * 0.6;
    quad(U, 5, [B[0], B[1] - n[1] * st.edge / 2, B[2] - n[2] * st.edge / 2], [l.w / 2 - ins, 0, 0], [0, -n[1] * st.edge / 2, -n[2] * st.edge / 2], [l.w - 2 * ins, st.edge], { fade, alpha });
  }
  quad(U, 0, C, [hw, 0, 0], Yv, [l.pw, l.ph], { tex: TEX[l.id].t, fade, alpha });
}

function drawTile(U, ts) {
  if (ts.shadow > 0.01) {
    const z = ts.c[2], sh = SHADOW(z);
    const hx = Math.hypot(...ts.X), hy = Math.abs(ts.Y[1]) + 0.001;
    const m = sh.blur * 1.5;
    const g = flat(ts.c[0] - hx - m + sh.ox, ts.c[1] - hy - m + sh.oy, ts.c[0] + hx + m + sh.ox, ts.c[1] + hy + m + sh.oy, 0.03);
    quad(U, 2, g.c, g.X, g.Y, g.size, { rect: [m, m, m + 2 * hx, m + 2 * hy], radius: 0.22 * 2 * hx, blur: sh.blur, opacity: 0.26 * ts.shadow * ts.alpha });
  }
  quad(U, 3, ts.c, ts.X, ts.Y, [ts.S, ts.S], { tex: TEX.logo.t, alpha: ts.alpha });
}

function renderFrame(t, sub = SUB) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, accFB);
  gl.viewport(0, 0, W, HF);
  gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
  for (let k = 0; k < sub; k++) {
    const ts = sub === 1 ? t : t + ((k + 0.5) / sub - 0.5) * SHUTTER;
    const cam = renderScene(Math.max(0, ts));
    gl.bindFramebuffer(gl.FRAMEBUFFER, accFB);
    gl.useProgram(P_DOF.p);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, colTex); gl.uniform1i(P_DOF.U.uCol, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, infoTex); gl.uniform1i(P_DOF.U.uInfo, 1);
    gl.uniform1f(P_DOF.U.uFocus, cam.focus); gl.uniform1f(P_DOF.U.uW, 1 / sub);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.disable(gl.BLEND);
  gl.useProgram(P_OUT.p);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, accTex); gl.uniform1i(P_OUT.U.uAcc, 0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.finish();
}

// ---------------------------------------------------------------- overlay
function words(el, text) { el.innerHTML = ''; return text.split(' ').map((w, i, a) => { const s = document.createElement('span'); s.className = 'w'; s.textContent = w; el.appendChild(s); if (i < a.length - 1) el.appendChild(document.createTextNode(' ')); return s; }); }
let W1, W2;
function wordAnim(spans, t0, step, t) {
  spans.forEach((s, i) => {
    const e = outCubic((t - t0 - i * step) / 0.34);
    s.style.opacity = e.toFixed(3);
    s.style.transform = `translateY(${(16 * (1 - e)).toFixed(2)}px)`;
    s.style.filter = e >= 1 ? 'none' : `blur(${(12 * (1 - e)).toFixed(2)}px)`;
  });
}
function overlay(t) {
  const b = document.getElementById('badge');
  const e = outCubic((t - 10.02) / 0.35);
  b.style.opacity = e.toFixed(3);
  b.style.transform = `translate(-50%, ${(8 * (1 - e)).toFixed(2)}px)`;
  wordAnim(W1, 10.12, 0.06, t);
  wordAnim(W2, 10.36, 0.05, t);
}

// ---------------------------------------------------------------- API
window.seek = function (t, sub) { renderFrame(t, sub ?? SUB); overlay(t); return true; };
window.project = (t, P) => { const c = camera(t); const v = P.map((x, i) => x - c.pos[i]); const dot = (a, b) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; const zc = dot(v, c.f); return [CX + F * dot(v, c.r) / zc, CY - F * dot(v, c.u) / zc, zc]; };
window.tileAt = (i, t) => { const c = camera(t); const s = tileState(i, t, c); return s && window.project(t, s.c).concat([s.S * F / window.project(t, s.c)[2]]); };
window.cameraAt = t => { const c = camera(t); return { th: c.th, d: c.d, ly: c.ly }; };
window.ready = (async () => {
  J = await (await fetch('assets/layers.json')).json();
  PH = J.H;
  setupCamera();
  const pageImg = await loadImg('assets/page.png');
  TEX.page = imgTex(pageImg);
  for (const l of J.layers) { const im = await loadImg(`assets/${l.id}.png`); TEX[l.id] = { t: imgTex(im), w: im.width }; }
  const lg = await loadImg('assets/logo.png'); TEX.logo = { t: imgTex(lg), w: lg.width };
  document.getElementById('brand').textContent = CONFIG.brand;
  W1 = words(document.getElementById('l1'), CONFIG.line1);
  W2 = words(document.getElementById('l2'), CONFIG.line2);
  await document.fonts.load('500 74px Geist'); await document.fonts.load('italic 82px "Instrument Serif"');
  await document.fonts.ready;
  window.seek(+(new URLSearchParams(location.search).get('t') || 0), 1);
  return { renderer: gl.getParameter(gl.RENDERER), aniso: !!ANISO };
})();
