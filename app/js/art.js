// Elena (classic model) and the town illustrations. All drawn as inline SVG.
const INK = "#2A1A12";
const STAGE = "#D3E6F1";
const STAGE_RING = "#A9CBE0";
const E = { skin: "#F6C9A4", hair: "#4A2C1A", top: "#C8322B", trim: "#F2B705", bag: "#1C5D86", mouth: "#8A2F25", cheek: "#EE8A76" };
const O = `stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"`;

function sunMark(x, y, r1, r2, c) {
  let s = "";
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    s += `<line x1="${(x + Math.cos(a) * r1).toFixed(1)}" y1="${(y + Math.sin(a) * r1).toFixed(1)}" x2="${(x + Math.cos(a) * r2).toFixed(1)}" y2="${(y + Math.sin(a) * r2).toFixed(1)}" stroke="${c}" stroke-width="2.6" stroke-linecap="round"/>`;
  }
  return s + `<circle cx="${x}" cy="${y}" r="${r1 - 1.5}" fill="${c}" stroke="${INK}" stroke-width="1.2"/>`;
}

const EYES = {
  joy: `<path d="M58 84 Q65 76 72 84" stroke="${INK}" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="M88 84 Q95 76 102 84" stroke="${INK}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`,
  wave: `<circle cx="65" cy="82" r="4.2" fill="${INK}"/><circle cx="95" cy="82" r="4.2" fill="${INK}"/><circle cx="66.5" cy="80.5" r="1.4" fill="#fff"/><circle cx="96.5" cy="80.5" r="1.4" fill="#fff"/>`,
  think: `<circle cx="67" cy="79" r="4.2" fill="${INK}"/><circle cx="97" cy="79" r="4.2" fill="${INK}"/><circle cx="68.4" cy="77.6" r="1.4" fill="#fff"/><circle cx="98.4" cy="77.6" r="1.4" fill="#fff"/><path d="M59 70 L72 68" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/><path d="M89 67 L102 71" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`,
  wow: `<circle cx="65" cy="82" r="6.2" fill="${INK}"/><circle cx="95" cy="82" r="6.2" fill="${INK}"/><circle cx="67" cy="80" r="2.1" fill="#fff"/><circle cx="97" cy="80" r="2.1" fill="#fff"/><path d="M58 69 Q65 64 72 68" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M88 68 Q95 64 102 69" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
  oops: `<circle cx="65" cy="83" r="4.2" fill="${INK}"/><circle cx="95" cy="83" r="4.2" fill="${INK}"/><circle cx="66.5" cy="81.5" r="1.4" fill="#fff"/><circle cx="96.5" cy="81.5" r="1.4" fill="#fff"/><path d="M58 72 L71 75" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/><path d="M89 75 L102 72" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`,
  cheer: `<path d="M58 82 Q65 74 72 82" stroke="${INK}" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="M88 82 Q95 74 102 82" stroke="${INK}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`,
};
const MOUTH = {
  joy: `<path d="M70 99 Q80 111 90 99 Z" fill="${E.mouth}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`,
  wave: `<path d="M72 100 Q80 107 88 100" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
  think: `<path d="M75 103 Q81 101 86 104" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
  wow: `<ellipse cx="80" cy="103" rx="4.5" ry="6" fill="${E.mouth}" stroke="${INK}" stroke-width="1.6"/>`,
  oops: `<path d="M70 104 Q75 99 80 104 Q85 109 90 104" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
  cheer: `<path d="M66 97 Q80 116 94 97 Z" fill="${E.mouth}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/><path d="M71 101 Q80 106 89 101" stroke="#fff" stroke-width="2" fill="none"/>`,
};
const ARMS = {
  joy: [[52, 150, 42, 186], [108, 150, 118, 186]],
  wave: [[52, 150, 42, 186], [108, 148, 134, 114]],
  think: [[52, 150, 42, 186], [108, 150, 96, 120]],
  wow: [[52, 150, 32, 170], [108, 150, 128, 170]],
  oops: [[52, 150, 42, 186], [108, 148, 120, 112]],
  cheer: [[52, 146, 30, 108], [108, 146, 130, 108]],
};

function arm([x1, y1, x2, y2]) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${INK}" stroke-width="17" stroke-linecap="round"/><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${E.top}" stroke-width="12" stroke-linecap="round"/><circle cx="${x2}" cy="${y2}" r="7" fill="${E.skin}" ${O}/>`;
}

export function elena(pose = "joy", { stage = true } = {}) {
  const arms = ARMS[pose] || ARMS.joy;
  const front = pose === "think";
  const extra =
    pose === "oops" ? `<path d="M124 64 Q130 73 124 78 Q118 73 124 64 Z" fill="#7FC3E8" ${O}/>`
    : pose === "cheer" ? sunMark(22, 84, 4, 8, "#F2B705") + sunMark(140, 74, 4, 8, "#F2B705")
    : pose === "wow" ? `<path d="M128 46 l3 8 l8 1 l-6 5 l2 8 l-7 -4 l-7 4 l2 -8 l-6 -5 l8 -1 z" fill="#F2B705" ${O}/>`
    : "";
  return `<svg viewBox="0 0 160 200" role="img" aria-label="Elena">
${stage ? `<circle cx="80" cy="98" r="76" fill="${STAGE}" stroke="${STAGE_RING}" stroke-width="2"/>` : ""}
<path d="M36 84 Q32 30 80 28 Q128 30 124 84 L124 118 Q102 126 80 124 Q58 126 36 118 Z" fill="${E.hair}" ${O}/>
${front ? arm(arms[0]) : arms.map(arm).join("")}
<path d="M44 200 L48 152 Q52 128 80 126 Q108 128 112 152 L116 200 Z" fill="${E.top}" ${O}/>
<path d="M64 129 Q80 142 96 129" stroke="${E.trim}" stroke-width="5" fill="none" stroke-linecap="round"/>
<path d="M56 176 H104" stroke="${E.trim}" stroke-width="3" stroke-dasharray="2 6" stroke-linecap="round"/>
<line x1="58" y1="134" x2="55" y2="200" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><line x1="58" y1="134" x2="55" y2="200" stroke="${E.bag}" stroke-width="6" stroke-linecap="round"/>
<line x1="102" y1="134" x2="105" y2="200" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><line x1="102" y1="134" x2="105" y2="200" stroke="${E.bag}" stroke-width="6" stroke-linecap="round"/>
<rect x="72" y="110" width="16" height="20" rx="6" fill="${E.skin}" ${O}/>
<circle cx="80" cy="84" r="38" fill="${E.skin}" ${O}/>
<path d="M42 80 Q44 40 80 40 Q116 40 118 80 Q106 62 94 64 Q86 52 76 61 Q60 56 42 80 Z" fill="${E.hair}" ${O}/>
${sunMark(110, 50, 7, 12.5, "#F2B705")}
<circle cx="58" cy="96" r="6.5" fill="${E.cheek}" opacity=".5"/><circle cx="102" cy="96" r="6.5" fill="${E.cheek}" opacity=".5"/>
${EYES[pose] || EYES.joy}${MOUTH[pose] || MOUTH.joy}${front ? arm(arms[1]) : ""}${extra}
</svg>`;
}

// Small sun used for scores. on = earned.
export function sun(on = true) {
  const c = on ? "#F2B705" : "#C9D3DA";
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${sunMark(12, 12, 5, 10, c).replace(/stroke-width="1.2"/, 'stroke-width="0"')}</svg>`;
}

/* ---------- Towns ---------- */
const SKY = "#CFE6F2", HILL = "#7FB27A", HILL2 = "#5E9A5F", WATER = "#4F9BC9", STONE = "#D9C7A6", ROOF = "#C8322B", WALL = "#FBF6EC";
function frame(inner, label) {
  return `<svg class="scene" viewBox="0 0 320 130" role="img" aria-label="${label}"><rect width="320" height="130" fill="${SKY}"/>${inner}</svg>`;
}
export const SCENES = {
  skopje: () => frame(`<circle cx="270" cy="30" r="14" fill="#F2B705"/><path d="M0 70 Q60 30 120 62 Q170 40 220 66 L320 60 L320 130 L0 130 Z" fill="${HILL}"/><line x1="70" y1="38" x2="70" y2="58" stroke="${INK}" stroke-width="2.4"/><line x1="63" y1="45" x2="77" y2="45" stroke="${INK}" stroke-width="2.4"/><rect x="0" y="98" width="320" height="32" fill="${WATER}"/><path d="M40 98 V84 H280 V98 Q262 76 244 98 Q226 76 208 98 Q190 76 172 98 Q154 76 136 98 Q118 76 100 98 Q82 76 64 98 Q52 84 40 98 Z" fill="${STONE}" stroke="${INK}" stroke-width="2"/>`, "Skopje: the Stone Bridge and Vodno"),
  ohrid: () => frame(`<circle cx="60" cy="30" r="14" fill="#F2B705"/><path d="M0 72 Q90 44 170 70 L170 130 L0 130 Z" fill="${HILL2}"/><rect x="0" y="82" width="320" height="48" fill="${WATER}"/><path d="M200 130 L210 70 Q240 52 280 60 L320 66 L320 130 Z" fill="${STONE}" stroke="${INK}" stroke-width="2"/><rect x="232" y="44" width="30" height="20" fill="#E9D3B0" stroke="${INK}" stroke-width="2"/><path d="M236 44 Q247 28 258 44 Z" fill="${ROOF}" stroke="${INK}" stroke-width="2"/><line x1="247" y1="20" x2="247" y2="32" stroke="${INK}" stroke-width="2"/><line x1="243" y1="25" x2="251" y2="25" stroke="${INK}" stroke-width="2"/><path d="M60 104 l26 0 l-6 8 l-16 0 z" fill="${WALL}" stroke="${INK}" stroke-width="1.6"/><line x1="72" y1="104" x2="72" y2="88" stroke="${INK}" stroke-width="1.6"/><path d="M72 88 l10 12 l-10 0 z" fill="${WALL}" stroke="${INK}" stroke-width="1.4"/>`, "Ohrid: the lake and the church on the cliff"),
  bitola: () => frame(`<path d="M0 74 L70 30 L130 64 L190 36 L320 76 L320 130 L0 130 Z" fill="#9BB6C8"/><path d="M60 44 L70 30 L80 42 Z M180 46 L190 36 L200 46 Z" fill="#fff"/><rect x="0" y="100" width="320" height="30" fill="${STONE}"/><rect x="146" y="40" width="28" height="64" fill="#E9D3B0" stroke="${INK}" stroke-width="2"/><path d="M142 40 L160 18 L178 40 Z" fill="${ROOF}" stroke="${INK}" stroke-width="2"/><circle cx="160" cy="56" r="8" fill="#fff" stroke="${INK}" stroke-width="2"/><line x1="160" y1="56" x2="160" y2="51" stroke="${INK}" stroke-width="1.6"/><line x1="160" y1="56" x2="164" y2="57" stroke="${INK}" stroke-width="1.6"/>${[40, 80, 220, 260].map((x) => `<rect x="${x}" y="84" width="26" height="20" fill="${WALL}" stroke="${INK}" stroke-width="1.6"/><path d="M${x - 3} 84 L${x + 13} 72 L${x + 29} 84 Z" fill="${ROOF}" stroke="${INK}" stroke-width="1.6"/>`).join("")}`, "Bitola: the clock tower and Pelister"),
  strumica: () => frame(`<circle cx="280" cy="28" r="14" fill="#F2B705"/><path d="M0 80 Q80 50 160 76 Q240 52 320 78 L320 130 L0 130 Z" fill="${HILL}"/>${[[30, "#C8322B"], [120, "#1C5D86"], [210, "#F2B705"]].map(([x, c]) => `<rect x="${x}" y="78" width="70" height="34" fill="${WALL}" stroke="${INK}" stroke-width="1.6"/><path d="M${x - 4} 78 L${x + 74} 78 L${x + 66} 62 L${x + 4} 62 Z" fill="${c}" stroke="${INK}" stroke-width="1.6"/>${[0, 1, 2].map((i) => `<circle cx="${x + 14 + i * 20}" cy="104" r="7" fill="${["#C8322B", "#E35D2F", "#5E9A5F"][i]}" stroke="${INK}" stroke-width="1.2"/>`).join("")}`).join("")}`, "Strumica: the market"),
};
