(function(){
'use strict';

/* ---------- constants ---------- */
const PREFILL = { age: 37, height: 183, weight: 85, goal: 'recomp' };
const ACT = [
  { id:'sed',   f:1.2,   t:'Sedentar',        d:'Puțină mișcare, fără antrenamente' },
  { id:'light', f:1.375, t:'Ușor activ',      d:'1–3 antrenamente pe săptămână' },
  { id:'mod',   f:1.55,  t:'Moderat activ',   d:'3–5 antrenamente pe săptămână' },
  { id:'high',  f:1.725, t:'Foarte activ',    d:'6–7 antrenamente pe săptămână' },
  { id:'xtra',  f:1.9,   t:'Extrem de activ', d:'Muncă fizică grea și antrenament zilnic' }
];
const GOALS = [
  { id:'cut',    adj:-0.20, prot:2.2, t:'Slăbire',        d:'Pierd grăsime constant (−20% față de menținere)' },
  { id:'recomp', adj:-0.10, prot:2.2, t:'Recompoziție',   d:'Pierd grăsime și păstrez sau câștig mușchi (−10%)' },
  { id:'keep',   adj:0,     prot:1.8, t:'Menținere',      d:'Rămân la greutatea de acum' },
  { id:'bulk',   adj:0.10,  prot:2.0, t:'Masă musculară', d:'Câștig masă cu un surplus mic (+10%)' }
];
const FAST_PLANS = [{ id: '14:10', h: 14 }, { id: '16:8', h: 16 }, { id: '18:6', h: 18 }, { id: '20:4', h: 20 }];
function normConsent(c){ return (c && typeof c === 'object' && Number(c.v)) ? { v: Number(c.v), health: Number(c.health) || 0, ai: Number(c.ai) || 0, age: !!c.age } : null; }
function normAdapt(a){ return (a && typeof a === 'object') ? { auto: !!a.auto, last: Number(a.last) || 0 } : null; }
function normFast(f){
  if (!f || typeof f !== 'object') return null;
  const log = Array.isArray(f.log) ? f.log.map(x => ({ start: Number(x && x.start) || 0, end: Number(x && x.end) || 0, goal: Number(x && x.goal) || 16 })).filter(x => x.start && x.end > x.start).slice(0, 30) : [];
  const st = Number(f.start) || null;
  return { plan: FAST_PLANS.some(x => x.id === f.plan) ? f.plan : '16:8', start: st && st <= Date.now() + 6e4 ? st : null, log, hide: !!f.hide };
}
const MEALS = [
  { id:'breakfast', t:'Mic dejun' },
  { id:'lunch',     t:'Prânz' },
  { id:'snack',     t:'Gustare' },
  { id:'dinner',    t:'Cină' }
];
const DAY_ABBR = ['Du','Lu','Ma','Mi','Jo','Vi','Sâ'];
const X_ICON = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const CAM_ICON = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>';

const THEMES = {
  cobalt: { t:'Cobalt', d:'albastru intens cu accent galben', logo:{ bg1:'#5C74FF', bg2:'#1C2EA0', s1:'#FFFFFF', s2:'#DCE3FF', dot:'#E9A92A', dot2:'#FFE7A8' },
    light:{ bg:'#EEF1F6', surface:'#FFFFFF', sunk:'#E4E8F0', ink:'#0F1420', muted:'#596377', line:'#D8DDE7', track:'#E2E6EE', kcal:'#2C45D6', 'kcal-soft':'#E5E9FF', 'on-kcal':'#FFFFFF', prot:'#D7385A', carb:'#E09A12', fat:'#1F9469', water:'#1B93CC', over:'#E2561C', 'toast-bg':'#0F1420', 'toast-fg':'#F2F4F9', 'toast-act':'#A9B8FF' },
    dark:{ bg:'#0B0E14', surface:'#151922', sunk:'#1D222D', ink:'#EDF0F6', muted:'#9099AC', line:'#262C39', track:'#242A36', kcal:'#7D91FF', 'kcal-soft':'#222A4D', 'on-kcal':'#0B0E14', prot:'#FF6E88', carb:'#F4BC48', fat:'#4CCB9C', water:'#55BEEE', over:'#FF7C47', 'toast-bg':'#EDF0F6', 'toast-fg':'#0F1420', 'toast-act':'#2C45D6' } },
  energic: { t:'Energic', d:'portocaliu și grafit, sportiv', logo:{ bg1:'#FF8A4C', bg2:'#C93A0B', s1:'#FFFFFF', s2:'#FFE0D2', dot:'#1A1512', dot2:'#6B5A4F' },
    light:{ bg:'#F4F2F0', surface:'#FFFFFF', sunk:'#EAE6E2', ink:'#1A1512', muted:'#6B6058', line:'#E2DCD6', track:'#ECE7E2', kcal:'#DD4A14', 'kcal-soft':'#FFE6DB', 'on-kcal':'#FFFFFF', prot:'#D6336C', carb:'#F2B705', fat:'#159A8C', water:'#2D8FD8', over:'#B3261E', 'toast-bg':'#1A1512', 'toast-fg':'#F4EEE9', 'toast-act':'#FFB38F' },
    dark:{ bg:'#100D0B', surface:'#1B1714', sunk:'#25201C', ink:'#F4EEE9', muted:'#A39A92', line:'#2F2925', track:'#2C2622', kcal:'#FF6B33', 'kcal-soft':'#3A2218', 'on-kcal':'#160F0B', prot:'#FF5C8D', carb:'#FFCB2E', fat:'#34C7B5', water:'#5AB2F2', over:'#FF5A4E', 'toast-bg':'#F4EEE9', 'toast-fg':'#1A1512', 'toast-act':'#C2410C' } },
  proaspat: { t:'Proaspăt', d:'verde și coral, sănătos', free:true, logo:{ bg1:'#36CC8A', bg2:'#0A6B3F', s1:'#FFFFFF', s2:'#CDF5DF', dot:'#F0603A', dot2:'#FFC3AF' },
    light:{ bg:'#EFF4F1', surface:'#FFFFFF', sunk:'#E2EAE5', ink:'#0F1C16', muted:'#57685F', line:'#D5E0D9', track:'#DFE8E2', kcal:'#11874F', 'kcal-soft':'#DDF3E7', 'on-kcal':'#FFFFFF', prot:'#E5484D', carb:'#E9A100', fat:'#4F6BED', water:'#14A3C7', over:'#E8590C', 'toast-bg':'#0F1C16', 'toast-fg':'#E9F2EC', 'toast-act':'#8FE3B5' },
    dark:{ bg:'#0A110E', surface:'#131C17', sunk:'#1A2620', ink:'#E9F2EC', muted:'#8FA398', line:'#22302A', track:'#21302A', kcal:'#3DD68C', 'kcal-soft':'#173426', 'on-kcal':'#06120C', prot:'#FF6B6F', carb:'#FFC233', fat:'#7D93FF', water:'#4CCFEA', over:'#FF8A3D', 'toast-bg':'#E9F2EC', 'toast-fg':'#0F1C16', 'toast-act':'#11874F' } },
  premium: { t:'Regal', d:'bleumarin și auriu, calm', logo:{ bg1:'#2E3F8A', bg2:'#0A0F2E', chrome:'blue', glow:'#6F84FF', dot:'#C2902A', dot2:'#FFE7A8' },
    light:{ bg:'#F1F2F6', surface:'#FFFFFF', sunk:'#E6E8EF', ink:'#141A33', muted:'#5D6580', line:'#DADDE7', track:'#E3E6EE', kcal:'#1F2C66', 'kcal-soft':'#E4E7F3', 'on-kcal':'#FFFFFF', prot:'#C2416B', carb:'#C9972B', fat:'#2F8F7E', water:'#3B82C4', over:'#E8590C', 'toast-bg':'#141A33', 'toast-fg':'#F3F1EA', 'toast-act':'#E3C26B' },
    dark:{ bg:'#0A0D1A', surface:'#131829', sunk:'#1B2136', ink:'#EEF0F7', muted:'#9298B0', line:'#252C44', track:'#232A40', kcal:'#A8B6FF', 'kcal-soft':'#232B4D', 'on-kcal':'#0A0D1A', prot:'#F07198', carb:'#E3B652', fat:'#4CC2AA', water:'#62A8E8', over:'#FF8A4C', 'toast-bg':'#EEF0F7', 'toast-fg':'#141A33', 'toast-act':'#1F2C66' } },
  smarald: { t:'Smarald', d:'verde închis și crom lustruit', logo:{ bg1:'#17402F', bg2:'#040A07', chrome:'green', glow:'#2BC27F', dot:'#F0603A', dot2:'#FFC3AF' },
    light:{ bg:'#EEF3F0', surface:'#FFFFFF', sunk:'#E1E9E4', ink:'#0C1A13', muted:'#55665D', line:'#D3DDD7', track:'#DCE5DF', kcal:'#0F5C3C', 'kcal-soft':'#DCEDE4', 'on-kcal':'#FFFFFF', prot:'#D9475B', carb:'#C99A2E', fat:'#4F6BED', water:'#1E8FB8', over:'#E8590C', 'toast-bg':'#0C1A13', 'toast-fg':'#EAF2ED', 'toast-act':'#9FE0BE' },
    dark:{ bg:'#06100B', surface:'#0F1C15', sunk:'#16261D', ink:'#E6EFEA', muted:'#8EA096', line:'#1F3128', track:'#1D2E25', kcal:'#4FD69A', 'kcal-soft':'#14352A', 'on-kcal':'#04100A', prot:'#FF6B7D', carb:'#E8C25A', fat:'#8197FF', water:'#4CC7E8', over:'#FF8A3D', 'toast-bg':'#E6EFEA', 'toast-fg':'#0C1A13', 'toast-act':'#0F5C3C' } },
  platinum: { t:'Platinum', d:'argintiu rece și grafit', logo:{ bg1:'#4A515C', bg2:'#0E1014', chrome:'platinum', glow:'#C9D3E2', dot:'#B8C0CC', dot2:'#FFFFFF' },
    light:{ bg:'#F1F2F4', surface:'#FFFFFF', sunk:'#E6E8EC', ink:'#14171C', muted:'#5E6570', line:'#DADDE2', track:'#E3E6EA', kcal:'#3B4656', 'kcal-soft':'#E4E8EE', 'on-kcal':'#FFFFFF', prot:'#C8485E', carb:'#B88A2A', fat:'#4E78C4', water:'#3C93B8', over:'#E8590C', 'toast-bg':'#14171C', 'toast-fg':'#F1F2F4', 'toast-act':'#C9D3E2' },
    dark:{ bg:'#0B0C0F', surface:'#15171B', sunk:'#1C1F24', ink:'#EEF0F3', muted:'#9298A3', line:'#262A30', track:'#24272D', kcal:'#D3DAE5', 'kcal-soft':'#2A2F37', 'on-kcal':'#0B0C0F', prot:'#F2788C', carb:'#E5C06A', fat:'#86A6F0', water:'#6FC2E2', over:'#FF8A4C', 'toast-bg':'#EEF0F3', 'toast-fg':'#14171C', 'toast-act':'#3B4656' } },
  vip: { t:'Ultra Gold', d:'negru și aur', logo:{ bg1:'#26221B', bg2:'#000000', chrome:'gold', glow:'#E3BE5A', dot:'#C99A2E', dot2:'#FFF3C8' },
    light:{ bg:'#F3F1EC', surface:'#FFFFFF', sunk:'#E8E4DB', ink:'#16130E', muted:'#655D50', line:'#DDD7CB', track:'#E6E1D7', kcal:'#8A6510', 'kcal-soft':'#F2E8CF', 'on-kcal':'#FFFFFF', prot:'#C2416B', carb:'#D9822B', fat:'#3E7FC7', water:'#2B9BB8', over:'#B42318', 'toast-bg':'#16130E', 'toast-fg':'#F3F1EC', 'toast-act':'#E3BE5A' },
    dark:{ bg:'#050505', surface:'#121110', sunk:'#1A1816', ink:'#F3EEE3', muted:'#A39B8C', line:'#26231F', track:'#23201C', kcal:'#E3BE5A', 'kcal-soft':'#2E2614', 'on-kcal':'#0B0A08', prot:'#F07198', carb:'#F2A04A', fat:'#7FA8F0', water:'#5EC2DE', over:'#FF6B5A', 'toast-bg':'#F3EEE3', 'toast-fg':'#16130E', 'toast-act':'#8A6510' } },
  ocean: { t:'Ocean', d:'turcoaz și albastru, cu luciu', logo:{ bg1:'#3FD3E6', bg2:'#065A73', s1:'#FFFFFF', s2:'#D3F6FB', dot:'#FF8A5C', dot2:'#FFD0BC' },
    light:{ bg:'#EDF5F7', surface:'#FFFFFF', sunk:'#DFECEF', ink:'#0B1C22', muted:'#4F6870', line:'#D2E2E6', track:'#DAE8EC', kcal:'#0B7A8F', 'kcal-soft':'#D8F0F4', 'on-kcal':'#FFFFFF', prot:'#E0485F', carb:'#E39A1B', fat:'#7A5CF0', water:'#2F86E8', over:'#E8590C', 'toast-bg':'#0B1C22', 'toast-fg':'#E8F4F6', 'toast-act':'#7FE3F2' },
    dark:{ bg:'#061317', surface:'#0D1E23', sunk:'#13282E', ink:'#E4F2F5', muted:'#8AA6AD', line:'#1B3238', track:'#1A3037', kcal:'#3FD3E6', 'kcal-soft':'#103941', 'on-kcal':'#041014', prot:'#FF6F82', carb:'#FFC04A', fat:'#A68CFF', water:'#6AAEFF', over:'#FF8A3D', 'toast-bg':'#E4F2F5', 'toast-fg':'#0B1C22', 'toast-act':'#0B7A8F' } },
  apus: { t:'Apus', d:'portocaliu, roz și violet, cu luciu', logo:{ bg1:'#FFA94D', bgMid:'#F0477A', bg2:'#6A2BD8', s1:'#FFFFFF', s2:'#FFE3EE', dot:'#FFD43B', dot2:'#FFFBE0' },
    light:{ bg:'#F6F0F2', surface:'#FFFFFF', sunk:'#EDE3E7', ink:'#1E1218', muted:'#6B5560', line:'#E3D6DC', track:'#ECE1E6', kcal:'#C2185B', 'kcal-soft':'#FBE1EC', 'on-kcal':'#FFFFFF', prot:'#F06A3A', carb:'#E8A317', fat:'#5B6CF0', water:'#1E9BD7', over:'#9B1C1C', 'toast-bg':'#1E1218', 'toast-fg':'#F6EEF1', 'toast-act':'#FF9EC4' },
    dark:{ bg:'#120A0F', surface:'#1C1218', sunk:'#251820', ink:'#F5EBF0', muted:'#A8909C', line:'#2E1F27', track:'#2B1D25', kcal:'#FF6FA8', 'kcal-soft':'#3A1A2A', 'on-kcal':'#14080E', prot:'#FF8A5C', carb:'#FFC24A', fat:'#8FA0FF', water:'#5EC0F0', over:'#FF5A4E', 'toast-bg':'#F5EBF0', 'toast-fg':'#1E1218', 'toast-act':'#C2185B' } },
  rosegold: { t:'Rose Gold', d:'aur roz și vișiniu', logo:{ bg1:'#5A2E35', bg2:'#1A0B0E', chrome:'rose', glow:'#F2B9A3', dot:'#E9DCCB', dot2:'#FFFFFF' },
    light:{ bg:'#F7F1EF', surface:'#FFFFFF', sunk:'#EEE4E1', ink:'#1D1412', muted:'#6E5B57', line:'#E5D8D4', track:'#EDE3E0', kcal:'#A8543F', 'kcal-soft':'#F6E1DA', 'on-kcal':'#FFFFFF', prot:'#C2416B', carb:'#D9952B', fat:'#4E78C4', water:'#2E9BB8', over:'#B42318', 'toast-bg':'#1D1412', 'toast-fg':'#F7F1EF', 'toast-act':'#F2C2B0' },
    dark:{ bg:'#100B0A', surface:'#1A1312', sunk:'#231A18', ink:'#F6EDEA', muted:'#A8958F', line:'#2E2321', track:'#2B201E', kcal:'#F2B9A3', 'kcal-soft':'#3A2520', 'on-kcal':'#140C0A', prot:'#F07198', carb:'#F2B24A', fat:'#86A6F0', water:'#6FC2E2', over:'#FF6B5A', 'toast-bg':'#F6EDEA', 'toast-fg':'#1D1412', 'toast-act':'#A8543F' } },
  neon: { t:'Neon', d:'verde neon pe negru, cu strălucire', logo:{ fx:'neon', bg1:'#0E1424', bg2:'#03050A', s1:'#39FF9F', glow:'#39FF9F', dot:'#FF4FA3', dot2:'#FFC2E1' },
    light:{ bg:'#F2F4F7', surface:'#FFFFFF', sunk:'#E6E9EE', ink:'#0A0D12', muted:'#5A6170', line:'#DADEE5', track:'#E2E6EC', kcal:'#00875F', 'kcal-soft':'#D6F5E8', 'on-kcal':'#FFFFFF', prot:'#E0287F', carb:'#C99A00', fat:'#2F6FE0', water:'#0094B8', over:'#E8430C', 'toast-bg':'#0A0D12', 'toast-fg':'#F2F4F7', 'toast-act':'#39FF9F' },
    dark:{ bg:'#05070A', surface:'#0C1016', sunk:'#121821', ink:'#ECF4F0', muted:'#8C99A6', line:'#1A222D', track:'#18202A', kcal:'#39FF9F', 'kcal-soft':'#0E2A20', 'on-kcal':'#03100A', prot:'#FF4FA3', carb:'#FFE14D', fat:'#4DA3FF', water:'#3DF2FF', over:'#FF5A3D', 'toast-bg':'#ECF4F0', 'toast-fg':'#0A0D12', 'toast-act':'#00875F' } },
  holo: { t:'Holografic', d:'sidef irizat pe violet închis', logo:{ fx:'holo', bg1:'#241B45', bg2:'#06050D', glow:'#B9A6FF', dot:'#D9D2FF', dot2:'#FFFFFF' },
    light:{ bg:'#F3F1F8', surface:'#FFFFFF', sunk:'#E8E4F2', ink:'#16122A', muted:'#625C7A', line:'#DCD6EA', track:'#E5E0F0', kcal:'#6D4BD8', 'kcal-soft':'#EAE3FF', 'on-kcal':'#FFFFFF', prot:'#E0487A', carb:'#E3A21A', fat:'#2B9BD8', water:'#18A8B8', over:'#E8590C', 'toast-bg':'#16122A', 'toast-fg':'#F3F1F8', 'toast-act':'#C9B8FF' },
    dark:{ bg:'#07060F', surface:'#110F1C', sunk:'#191628', ink:'#F0EDFA', muted:'#9A93B5', line:'#241F38', track:'#221D35', kcal:'#B9A6FF', 'kcal-soft':'#2A2250', 'on-kcal':'#0A0814', prot:'#FF8FC0', carb:'#FFD36B', fat:'#7FD4FF', water:'#7FF0E6', over:'#FF8A4C', 'toast-bg':'#F0EDFA', 'toast-fg':'#16122A', 'toast-act':'#6D4BD8' } }
};
function hx(h){ const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function mix(a, b, t){ const A = hx(a), B = hx(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('').toUpperCase(); }
function pal(o){
  const t = o.tint;
  const light = { bg: mix('#FFFFFF', t, 0.07), surface: '#FFFFFF', sunk: mix('#FFFFFF', t, 0.13), ink: mix('#0A0C12', t, 0.12), muted: mix('#596070', t, 0.22), line: mix('#FFFFFF', t, 0.17), track: mix('#FFFFFF', t, 0.14), kcal: o.accL, 'kcal-soft': mix('#FFFFFF', o.accL, 0.14), 'on-kcal': '#FFFFFF', prot: '#E0485F', carb: '#E39A1B', fat: '#5B6CF0', water: '#1E9BD7', over: '#E8590C', 'toast-bg': mix('#0A0C12', t, 0.12), 'toast-fg': '#F2F4F8', 'toast-act': o.accD };
  const dark = { bg: mix('#05060A', t, 0.07), surface: mix('#10121A', t, 0.09), sunk: mix('#171A24', t, 0.11), ink: '#EEF0F6', muted: mix('#9298A8', t, 0.2), line: mix('#1F2330', t, 0.14), track: mix('#1D212D', t, 0.14), kcal: o.accD, 'kcal-soft': mix('#10121A', o.accD, 0.22), 'on-kcal': mix('#05060A', t, 0.07), prot: '#FF6F82', carb: '#FFC04A', fat: '#8FA0FF', water: '#5EC0F0', over: '#FF8A3D', 'toast-bg': '#EEF0F6', 'toast-fg': mix('#0A0C12', t, 0.12), 'toast-act': o.accL };
  return { light: Object.assign(light, o.oL || {}), dark: Object.assign(dark, o.oD || {}) };
}
function bands(){ return Array.prototype.map.call(arguments, s => '<stop offset="' + s[1] + '" stop-color="' + s[0] + '"/>').join(''); }
function mkTheme(t, d, extra, o){ return Object.assign({ t, d }, extra || {}, pal(o)); }
Object.assign(THEMES, {
  craciun: mkTheme('Crăciun', 'roșu, brad și ninsoare', { free: true, logo: { fx: 'xmas', bg1: '#26A86A', bg2: '#0A3A24', s1: '#FFFFFF', s2: '#EAF7EF', dot: '#D9A520', dot2: '#FFF1B8' } }, { tint: '#1F6B45', accL: '#B3202C', accD: '#FF6B6B', oL: { carb: '#C99A2E', prot: '#C2416B' }, oD: { carb: '#F4C542' } }),
  mercur: mkTheme('Mercur', 'gri cald, ca roca', { logo: { fx: 'planet', bg1: '#2A2D35', bg2: '#05060A', bands: bands(['#F2F0EC', 0], ['#C9C3BC', 0.35], ['#8E8780', 0.55], ['#D8D3CD', 0.8], ['#9A938B', 1]), glow: '#C9CED6', dot: '#F2B46A', dot2: '#FFE6C2' } }, { tint: '#8A8D93', accL: '#5B616B', accD: '#C9CED6' }),
  venus: mkTheme('Venus', 'auriu pal și nori calzi', { logo: { fx: 'planet', bg1: '#3A2A12', bg2: '#070503', bands: bands(['#FFF4D6', 0], ['#F4D79A', 0.35], ['#E2B868', 0.55], ['#F8E6B8', 0.8], ['#D9A955', 1]), glow: '#F2CF7E', dot: '#E8E2FF', dot2: '#FFFFFF' } }, { tint: '#C9A15A', accL: '#946510', accD: '#F2CF7E', oL: { carb: '#D9822B' }, oD: { carb: '#FFA94D' } }),
  pamant: mkTheme('Pământ', 'oceane albastre și continente verzi', { logo: { fx: 'planet', bg1: '#0F2A4A', bg2: '#02060D', bands: bands(['#E9F7FF', 0], ['#5DB8F0', 0.3], ['#2E8B57', 0.5], ['#3FA0E0', 0.7], ['#1B5E9E', 1]), glow: '#6CC3FF', dot: '#C9CED6', dot2: '#FFFFFF' } }, { tint: '#2E7BB8', accL: '#1D6FA8', accD: '#6CC3FF', oL: { fat: '#7A5CF0' }, oD: { fat: '#B39CFF' } }),
  marte: mkTheme('Marte', 'roșu ruginiu', { logo: { fx: 'planet', bg1: '#3A140A', bg2: '#080302', bands: bands(['#FFD9C2', 0], ['#E8835A', 0.3], ['#B5532E', 0.55], ['#D9714A', 0.78], ['#8A3A1E', 1]), glow: '#FF8A5C', dot: '#D9CBB8', dot2: '#FFFFFF' } }, { tint: '#B5532E', accL: '#A8401C', accD: '#FF8A5C', oL: { over: '#7C1D3A', prot: '#C2416B' }, oD: { over: '#FF5A9E' } }),
  luna: mkTheme('Luna', 'argintiu cu cratere', { logo: { fx: 'planet', bg1: '#23262E', bg2: '#04050A', bands: bands(['#FFFFFF', 0], ['#DADDE3', 0.4], ['#B7BCC6', 0.6], ['#E9ECF1', 0.85], ['#A6ACB8', 1]), glow: '#DDE2EA', dot: '#8E95A3', dot2: '#C9CED6' } }, { tint: '#9AA0AC', accL: '#4F5866', accD: '#DDE2EA' }),
  jupiter: mkTheme('Jupiter', 'benzi crem, portocalii și maro', { logo: { fx: 'planet', bg1: '#2E1A0C', bg2: '#060302', bands: bands(['#FFF1DC', 0], ['#E8B98A', 0.2], ['#B5703C', 0.38], ['#F2D3AE', 0.55], ['#C9814A', 0.72], ['#8E4E25', 1]), glow: '#F2B27A', dot: '#D9573A', dot2: '#FF9E7A' } }, { tint: '#B07A4A', accL: '#9A5A1E', accD: '#F2B27A', oL: { carb: '#C99A2E' } }),
  saturn: mkTheme('Saturn', 'auriu, cu inel', { logo: { fx: 'planet', bg1: '#2E2410', bg2: '#060402', bands: bands(['#FFF4D9', 0], ['#EBD39C', 0.35], ['#C9A35A', 0.55], ['#F2E0B4', 0.78], ['#B08A44', 1]), glow: '#EAC97E', ring: '#F2E0B4', dot: '#E8DFC8', dot2: '#FFFFFF' } }, { tint: '#C4A160', accL: '#8A6510', accD: '#EAC97E', oL: { carb: '#D9822B' }, oD: { carb: '#FFA94D' } }),
  uranus: mkTheme('Uranus', 'turcoaz pal, înghețat', { logo: { fx: 'planet', bg1: '#0C2C33', bg2: '#020709', bands: bands(['#E9FFFF', 0], ['#A8F0F5', 0.4], ['#6FD3DE', 0.6], ['#C9F7FA', 0.85], ['#4FB7C4', 1]), glow: '#8AEAF2', dot: '#FFFFFF', dot2: '#FFFFFF' } }, { tint: '#5FC4CF', accL: '#0E7C86', accD: '#8AEAF2', oL: { water: '#2F6FE0' }, oD: { water: '#7FA8FF' } }),
  neptun: mkTheme('Neptun', 'albastru adânc', { logo: { fx: 'planet', bg1: '#0E1648', bg2: '#02030C', bands: bands(['#DDE6FF', 0], ['#6F8CFF', 0.35], ['#2F4FD8', 0.55], ['#5C7CFF', 0.78], ['#1A2E9A', 1]), glow: '#7E9BFF', dot: '#BFD0FF', dot2: '#FFFFFF' } }, { tint: '#2F4FD8', accL: '#2846C4', accD: '#7E9BFF', oL: { fat: '#7A5CF0' }, oD: { fat: '#B39CFF' } }),
  soare: mkTheme('Soarele', 'foc auriu care strălucește', { logo: { fx: 'planet', sun: true, bg1: '#3A1606', bg2: '#080201', bands: bands(['#FFFBE0', 0], ['#FFE066', 0.3], ['#FF9F1C', 0.55], ['#FFD24D', 0.78], ['#F2600C', 1]), glow: '#FF9F1C', dot: '#FFFFFF', dot2: '#FFFBE0' } }, { tint: '#E8892A', accL: '#B4520A', accD: '#FFB347', oL: { carb: '#C99A2E', over: '#9B1C1C' }, oD: { carb: '#FFE066', over: '#FF5A7A' } }),
  fulger: mkTheme('Fulger', 'erou al fulgerului: albastru și galben', { logo: { fx: 'comic', bg1: '#3B5BFF', bg2: '#1528A8', s1: '#FFE14D', dot: '#FFFFFF', dot2: '#FFFFFF' } }, { tint: '#2B4BEA', accL: '#2440D0', accD: '#FFE14D', oL: { fat: '#7A5CF0' }, oD: { carb: '#FFA94D' } }),
  flacara: mkTheme('Flacăra', 'eroină a focului: roșu și portocaliu', { logo: { fx: 'comic', bg1: '#FF6A3D', bg2: '#B3200C', s1: '#FFE7A3', dot: '#FFFFFF', dot2: '#FFFFFF' } }, { tint: '#E8452C', accL: '#C2331B', accD: '#FF8A5C', oL: { over: '#7C1D3A', prot: '#C2416B' }, oD: { over: '#FF5A9E' } }),
  umbra: mkTheme('Umbra', 'erou al umbrelor: violet și negru', { logo: { fx: 'comic', bg1: '#4A2C85', bg2: '#0D0718', s1: '#D7C2FF', dot: '#FFFFFF', dot2: '#FFFFFF' } }, { tint: '#6A3FD0', accL: '#5B34C4', accD: '#C9A6FF' }),
  gheata: mkTheme('Gheață', 'eroina gheții: cristale, țurțuri și chiciură', { logo: { fx: 'ice', bg1: '#C6F3FF', bgMid: '#55B9E8', bg2: '#0B4A8F', s1: '#FFFFFF', glow: '#9FF0FF', dot: '#FFFFFF', dot2: '#FFFFFF' } }, { tint: '#1A9CD8', accL: '#0B6FA8', accD: '#8FE9FF', oL: { water: '#2F6FE0' }, oD: { water: '#7FA8FF' } })
});
THEMES.bujor = { t: 'Bujor', d: 'nuanțe de roz, de la pudră la fucsia, cu petale', logo: { fx: 'bloom', bg1: '#FFC6D9', bgMid: '#F06292', bg2: '#9E1A58', s1: '#FFFFFF', glow: '#FF9EC0', dot: '#F8A5C2', dot2: '#FFFFFF' },
  light: { bg: '#FFF4F7', surface: '#FFFFFF', sunk: '#FCE7EE', ink: '#2B0F1D', muted: '#86566B', line: '#F5D5E0', track: '#F9DFE8', kcal: '#D6336C', 'kcal-soft': '#FDE2EB', 'on-kcal': '#FFFFFF', prot: '#9C1F5C', carb: '#F2785C', fat: '#A54BC4', water: '#6C7FE0', over: '#D9480F', 'toast-bg': '#2B0F1D', 'toast-fg': '#FFF4F7', 'toast-act': '#FF9EBB' },
  dark: { bg: '#170A11', surface: '#22111B', sunk: '#2C1723', ink: '#FDEBF2', muted: '#C597AB', line: '#3B2131', track: '#381F2D', kcal: '#FF6B9D', 'kcal-soft': '#4A1D33', 'on-kcal': '#1A0811', prot: '#FFB0CA', carb: '#FFA987', fat: '#D199F2', water: '#94A8FF', over: '#FF7A45', 'toast-bg': '#FDEBF2', 'toast-fg': '#2B0F1D', 'toast-act': '#D6336C' } };
THEMES.futurist = { t: 'Futurist', d: 'interfață SF: grilă de lumină, cyan și magenta', logo: { fx: 'hud', bg1: '#0D2147', bgMid: '#071025', bg2: '#02040A', s1: '#FFFFFF', glow: '#00E5FF', dot: '#FFFFFF', dot2: '#FFFFFF' },
  light: { bg: '#F2F6FB', surface: '#FFFFFF', sunk: '#E7EEF7', ink: '#0A1426', muted: '#55657F', line: '#D3DEEC', track: '#DFE7F2', kcal: '#0088B3', 'kcal-soft': '#DDF5FC', 'on-kcal': '#FFFFFF', prot: '#D61F6E', carb: '#B87F00', fat: '#6B3FE0', water: '#0E9C78', over: '#D9480F', 'toast-bg': '#0A1426', 'toast-fg': '#F2F6FB', 'toast-act': '#00E5FF' },
  dark: { bg: '#05070D', surface: '#0B1020', sunk: '#111833', ink: '#E6F7FF', muted: '#7E94B8', line: '#1C2A4A', track: '#16213D', kcal: '#00E5FF', 'kcal-soft': '#062A3A', 'on-kcal': '#00141A', prot: '#FF2E88', carb: '#FFD23F', fat: '#9B6BFF', water: '#3DF5C4', over: '#FF6B3D', 'toast-bg': '#E6F7FF', 'toast-fg': '#05070D', 'toast-act': '#007C99' } };
const THEME_IDS = ['proaspat', 'craciun', 'energic', 'cobalt', 'ocean', 'apus', 'premium', 'smarald', 'platinum', 'rosegold', 'bujor', 'neon', 'mercur', 'venus', 'pamant', 'marte', 'luna', 'fulger', 'flacara', 'umbra', 'gheata', 'vip', 'holo', 'futurist', 'jupiter', 'saturn', 'uranus', 'neptun', 'soare'];
const TIER_OF = { energic: 'plus', cobalt: 'plus', ocean: 'plus', apus: 'plus', premium: 'plus', smarald: 'plus', platinum: 'platinum', rosegold: 'platinum', bujor: 'platinum', neon: 'platinum', mercur: 'platinum', venus: 'platinum', pamant: 'platinum', marte: 'platinum', luna: 'platinum', fulger: 'platinum', flacara: 'platinum', umbra: 'platinum', gheata: 'platinum', vip: 'vip', holo: 'vip', futurist: 'vip', jupiter: 'vip', saturn: 'vip', uranus: 'vip', neptun: 'vip', soare: 'vip' };
Object.keys(TIER_OF).forEach(id => { if (THEMES[id]) THEMES[id].tier = TIER_OF[id]; });
const TIERS = {
  plus: { name: 'Plus', month: 19.99, year: 99.99, logo: 'cobalt', perks: [
    ['Calorii din poze și din text', 'Fără limită de mese pe zi, cu nivel de siguranță la fiecare aliment'],
    ['Ținta inteligentă', 'Se ajustează singură după ce mănânci și cum se mișcă greutatea'],
    ['Idei de mese și rețete', 'Variante după ce ți-a rămas din zi și rețetele tale'],
    ['6 teme de culori și logo', 'Energic, Cobalt, Ocean, Apus, Regal și Smarald']
  ] },
  platinum: { name: 'Premium', month: 29.99, year: 149.99, logo: 'platinum', perks: [
    ['Tot ce include Plus', 'Inclusiv cele 6 teme'],
    ['Raportul săptămânal cu Claude', 'Notă, ce a mers bine și un obiectiv pentru săptămâna următoare'],
    ['Ținte pentru zile de sală și de pauză', 'Mai multe glucide când te antrenezi'],
    ['Temele Platinum, Rose Gold și Neon', 'Logo din platină, aur roz sau neon, cu inele care strălucesc la Neon'],
    ['Tema Bujor, în nuanțe de roz', 'De la roz pudră la fucsia, cu logo perlat și petale care cad'],
    ['5 planete și 4 eroi', 'Mercur, Venus, Pământ, Marte, Luna și eroii Fulger, Flacăra, Umbra, Gheață']
  ] },
  vip: { name: 'Ultra', month: 49.99, year: 249.99, logo: 'vip', perks: [
    ['Tot ce include Premium', 'Raport săptămânal, ținte pe zile și toate temele de mai sus'],
    ['Temele Ultra Gold și Holografic', 'Negru cu aur sau sidef irizat, doar pentru membrii Ultra'],
    ['Tema Futurist', 'Interfață SF cu grilă de lumină, colțuri HUD și cifre care strălucesc'],
    ['5 planete gigant', 'Jupiter, Saturn, Uranus, Neptun și Soarele, cu cer înstelat'],
    ['Primul acces la funcțiile noi', 'Le primești înaintea celorlalți']
  ] }
};
const TIER_IDS = ['plus', 'platinum', 'vip'];
const FREE_FOREVER = 'Jurnalul, codul de bare, apa, greutatea, seriile, provocările și postul intermitent.';
const PROMISES = ['7 zile gratuit: dacă anulezi înainte să se termine, nu plătești nimic', 'Vezi data primei plăți înainte să confirmi', 'Anulezi oricând, din Setări → Gestionează abonamentul'];
const SKINS_PRICE = 9.99;
const LOCK_ICON = '<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
const CHECK_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7"/></svg>';
function tokCss(o){ return Object.keys(o).map(k => '--' + k + ':' + o[k] + ';').join(''); }
/* How dark the dark mode is: each step lifts the surfaces toward a soft, theme-tinted light */
const DARK_SHADES = [['noapte', 'Noapte', 0], ['grafit', 'Grafit', 0.07], ['ardezie', 'Ardezie', 0.13], ['amurg', 'Amurg', 0.2], ['ceata', 'Ceață', 0.27]];
function shadeAmt(id){ const s = DARK_SHADES.find(x => x[0] === (id || S.darkShade)); return s ? s[2] : 0; }
function liftDark(d, a){
  if (!a) return d;
  const o = Object.assign({}, d), to = mix('#FFFFFF', d.kcal, 0.12);
  ['bg', 'surface', 'sunk', 'kcal-soft'].forEach(k => { if (o[k]) o[k] = mix(o[k], to, a); });
  ['line', 'track'].forEach(k => { if (o[k]) o[k] = mix(o[k], to, a * 1.2); });
  /* keep text readable on the lighter surfaces: lighten until it clears the contrast bar */
  const fit = (k, min) => { if (!o[k]) return; const f = d[k]; for (let t = a * 0.9; t <= 1 && contrast(o[k], o.sunk) < min; t += 0.03) o[k] = mix(f, '#FFFFFF', t); };
  fit('muted', 4.6); fit('ink', 9);
  ['kcal', 'prot', 'carb', 'fat', 'water', 'over'].forEach(k => fit(k, 3.2));
  return o;
}
function lum(h){ const c = hx(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
function contrast(x, y){ const p = lum(x), q = lum(y); return (Math.max(p, q) + 0.05) / (Math.min(p, q) + 0.05); }
function themeCss(id){
  const t = THEMES[id]; if (!t) return '';
  if (!t.light) return '';
  const d = tokCss(liftDark(t.dark, shadeAmt()));
  return ':root{' + tokCss(t.light) + '}@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){' + d + 'color-scheme:dark}}:root[data-theme="dark"]{' + d + 'color-scheme:dark}';
}
const P_PATH = 'M 26 78 C 31 77 34 73 34 67 L 34 42 A 17 17 0 1 1 51 59';
const SHEEN_PATH = 'M 0 22.5 A 22.5 22.5 0 0 1 22.5 0 L 77.5 0 A 22.5 22.5 0 0 1 100 22.5 L 100 40 C 72 50 28 50 0 40 Z';
const CHROME_STOPS = {
  blue: '<stop offset="0" stop-color="#FFFFFF"/><stop offset=".3" stop-color="#DDE3F2"/><stop offset=".47" stop-color="#7C86A6"/><stop offset=".53" stop-color="#394263"/><stop offset=".7" stop-color="#EEF1FA"/><stop offset="1" stop-color="#A9B2CC"/>',
  green: '<stop offset="0" stop-color="#FFFFFF"/><stop offset=".3" stop-color="#DCE8E1"/><stop offset=".47" stop-color="#76887F"/><stop offset=".53" stop-color="#3A4842"/><stop offset=".7" stop-color="#E9F2EC"/><stop offset="1" stop-color="#A3B5AC"/>',
  platinum: '<stop offset="0" stop-color="#FFFFFF"/><stop offset=".3" stop-color="#EEF1F6"/><stop offset=".47" stop-color="#9AA3B2"/><stop offset=".53" stop-color="#5D6574"/><stop offset=".7" stop-color="#F4F6FA"/><stop offset="1" stop-color="#C4CBD6"/>',
  rose: '<stop offset="0" stop-color="#FFF1EC"/><stop offset=".3" stop-color="#F2C2B0"/><stop offset=".47" stop-color="#B0705C"/><stop offset=".53" stop-color="#7A4636"/><stop offset=".7" stop-color="#FBD9CC"/><stop offset="1" stop-color="#D49A86"/>',
  gold: '<stop offset="0" stop-color="#FFF6D5"/><stop offset=".3" stop-color="#F0D27A"/><stop offset=".47" stop-color="#A67C20"/><stop offset=".53" stop-color="#6B4C0E"/><stop offset=".7" stop-color="#FBE6A2"/><stop offset="1" stop-color="#C79A35"/>'
};
const STARS_SVG = [[14, 16, 0.9], [82, 13, 0.7], [90, 62, 1], [11, 70, 0.6], [72, 88, 0.8], [40, 9, 0.5], [93, 36, 0.6], [22, 90, 0.7], [60, 94, 0.5]].map(s => '<circle cx="' + s[0] + '" cy="' + s[1] + '" r="' + s[2] + '" fill="#FFFFFF" opacity=".8"/>').join('');
function flakeSvg(cx, cy, r){
  let d = '';
  for (let i = 0; i < 6; i++){
    const a = i * Math.PI / 3 - Math.PI / 2, ex = cx + Math.cos(a) * r, ey = cy + Math.sin(a) * r;
    d += 'M' + cx + ' ' + cy + 'L' + ex.toFixed(2) + ' ' + ey.toFixed(2);
    const bx = cx + Math.cos(a) * r * 0.58, by = cy + Math.sin(a) * r * 0.58;
    for (const s of [-1, 1]){ const b = a + s * 0.75; d += 'M' + bx.toFixed(2) + ' ' + by.toFixed(2) + 'L' + (bx + Math.cos(b) * r * 0.36).toFixed(2) + ' ' + (by + Math.sin(b) * r * 0.36).toFixed(2); }
  }
  return '<path d="' + d + '" fill="none" stroke="#FFFFFF" stroke-width="' + (r * 0.24).toFixed(2) + '" stroke-linecap="round" opacity=".9"/>';
}
const SNOW_SVG = [[13, 15, 3.2], [13, 50, 2.4], [86, 42, 2.8], [87, 76, 3.3], [16, 86, 2.7], [66, 88, 2.2], [44, 91, 1.9]].map(s => flakeSvg(s[0], s[1], s[2])).join('');
const SANTA_HAT = '<defs><linearGradient id="hatRed" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F0404F"/><stop offset="1" stop-color="#9E1020"/></linearGradient><linearGradient id="hatFur" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#DCE6EE"/></linearGradient></defs>' +
  '<g transform="rotate(-8 51 18)">' +
  '<path d="M 36 18 Q 43 2 61 2.5 Q 76 3.5 81.5 15 L 75.5 17 Q 72.5 11.5 66.5 10.5 Q 67.5 14 67.5 18 Z" fill="url(#hatRed)"/>' +
  '<path d="M 44 9 Q 52 4.5 60 5" fill="none" stroke="#FFFFFF" stroke-opacity=".3" stroke-width="2" stroke-linecap="round"/>' +
  '<rect x="32.5" y="16" width="38" height="8" rx="4" fill="#000000" opacity=".22" transform="translate(0 1.6)" filter="url(#pBlur)"/>' +
  '<rect x="32.5" y="16" width="38" height="8" rx="4" fill="url(#hatFur)"/>' +
  '<circle cx="80.5" cy="17" r="4.8" fill="url(#hatFur)"/>' +
  '</g>';
/* Ice: faceted crystal tile, frost, icicles along the top edge and glints */
function iciclePath(w, base, drips){
  const f = n => (+n).toFixed(2);
  let d = 'M0 0 H' + f(w) + ' V' + f(base);
  drips.slice().sort((a, b) => b[0] - a[0]).forEach(dr => {
    const c = dr[0], dw = dr[1], l = dr[2], tip = base + l;
    d += ' L' + f(c + dw / 2) + ' ' + f(base) + ' C' + f(c + dw * 0.22) + ' ' + f(base + l * 0.55) + ' ' + f(c + 0.6) + ' ' + f(tip) + ' ' + f(c) + ' ' + f(tip) +
      ' C' + f(c - 0.6) + ' ' + f(tip) + ' ' + f(c - dw * 0.22) + ' ' + f(base + l * 0.55) + ' ' + f(c - dw / 2) + ' ' + f(base);
  });
  return d + ' L0 ' + f(base) + ' Z';
}
function iceRng(seed){ return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
/* Natural ice cracks: fractal lines that taper, with side branches and thin twigs (no impact web) */
function crackPts(rnd, a, b, lv, rough){
  let pts = [a, b];
  for (let l = 0; l < lv; l++, rough *= 0.6){
    const np = [pts[0]];
    for (let i = 1; i < pts.length; i++){
      const p = pts[i - 1], q = pts[i], dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy) || 1, off = (rnd() - 0.5) * len * rough;
      np.push([(p[0] + q[0]) / 2 - dy / len * off, (p[1] + q[1]) / 2 + dx / len * off], q);
    }
    pts = np;
  }
  return pts;
}
function crackPoly(pts, wf){
  const n = pts.length, L = [], R = [];
  for (let i = 0; i < n; i++){
    const p = pts[Math.max(0, i - 1)], q = pts[Math.min(n - 1, i + 1)], dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy) || 1, w = wf(i / (n - 1)) / 2;
    L.push((pts[i][0] - dy / len * w).toFixed(2) + ' ' + (pts[i][1] + dx / len * w).toFixed(2));
    R.push((pts[i][0] + dy / len * w).toFixed(2) + ' ' + (pts[i][1] - dx / len * w).toFixed(2));
  }
  return 'M' + L.join('L') + 'L' + R.reverse().join('L') + 'Z';
}
function crackTree(rnd, a, b, w0, depth, lv, out, main){
  const pts = crackPts(rnd, a, b, lv, 0.3), ph = rnd() * 6;
  const wf = main ? t => w0 * (0.3 + 0.7 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.05 + t * 0.9)), 0.7)) * (0.85 + 0.15 * Math.sin(t * 17 + ph))
                  : t => w0 * Math.pow(1 - t, 0.9) * (0.85 + 0.15 * Math.sin(t * 13 + ph)) + 0.04;
  out.push({ pts, wf });
  if (depth <= 0) return;
  const total = Math.hypot(b[0] - a[0], b[1] - a[1]), ang = Math.atan2(b[1] - a[1], b[0] - a[0]), nb = depth > 1 ? 2 + Math.floor(rnd() * 3) : 1 + Math.floor(rnd() * 2);
  for (let k = 0; k < nb; k++){
    const t = 0.12 + rnd() * 0.76, p = pts[Math.round(t * (pts.length - 1))];
    const dir = ang + (rnd() < 0.5 ? -1 : 1) * (0.3 + rnd() * 0.65), len = total * (0.12 + rnd() * 0.22) * (depth > 1 ? 1 : 0.6);
    crackTree(rnd, p, [p[0] + Math.cos(dir) * len, p[1] + Math.sin(dir) * len], Math.max(0.3, wf(t) * 0.55), depth - 1, Math.max(3, lv - 2), out, false);
  }
}
function crackPath(list, sc){ return list.map(c => crackPoly(c.pts, t => c.wf(t) * sc)).join(''); }
function iceCracksOn(){ return lsGet('portia-cracks') !== false; }
function sparkPath(x, y, r){ return 'M' + x + ' ' + (y - r) + 'Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + (y + r) + 'Q' + x + ' ' + y + ' ' + (x - r) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + (y - r) + 'Z'; }
const ICE_STOPS = '<stop offset="0" stop-color="#FFFFFF"/><stop offset=".24" stop-color="#EEFCFF"/><stop offset=".47" stop-color="#86D8F4"/><stop offset=".56" stop-color="#FFFFFF"/><stop offset=".8" stop-color="#C6F2FD"/><stop offset="1" stop-color="#FFFFFF"/>';
const ICE_FACETS = '<g clip-path="url(#pTile)">' + [['0,0 46,0 18,38 0,30', .16], ['46,0 100,0 100,24 70,30', .1], ['0,62 26,52 40,100 0,100', .08], ['84,60 100,70 100,100 62,100', .12]]
  .map(f => '<polygon points="' + f[0] + '" fill="#FFFFFF" opacity="' + f[1] + '"/>').join('') + '</g>';
const ICE_LOGO_CRACK = (() => {
  const rnd = iceRng(31), cr = [];
  crackTree(rnd, [104, 24], [36, 104], 1.9, 2, 6, cr, true);
  crackTree(rnd, [-4, 52], [23, 27], 1.1, 1, 5, cr, true);
  return '<g clip-path="url(#pTile)"><path d="' + crackPath(cr, 3.4) + '" fill="#E6FAFF" opacity=".45" filter="url(#pCrackBlur)"/>' +
    '<path d="' + crackPath(cr, 1.2) + '" fill="#04305F" opacity=".32" transform="translate(.45 .6)"/><path d="' + crackPath(cr, 1) + '" fill="#FFFFFF"/></g>';
})();
function iceDeco(){ return ICE_FACETS + (iceCracksOn() ? ICE_LOGO_CRACK : ''); }
const ICE_TOP = '<g clip-path="url(#pTile)"><path d="' + iciclePath(100, 4.5, [[11, 7, 13], [21, 5, 8], [30, 5.5, 5], [43, 5, 3.5], [57, 6, 5], [69, 5, 3.5], [79, 7, 12], [89, 5.5, 8]]) + '" fill="#062E5C" opacity=".22" transform="translate(0 1.4)" filter="url(#pIceBlur)"/>' +
  '<path d="' + iciclePath(100, 4.5, [[11, 7, 13], [21, 5, 8], [30, 5.5, 5], [43, 5, 3.5], [57, 6, 5], [69, 5, 3.5], [79, 7, 12], [89, 5.5, 8]]) + '" fill="url(#pIcicle)"/>' +
  [[11, 13], [21, 8], [79, 12], [89, 8]].map(dr => '<path d="M' + (dr[0] - 1.3) + ' 5.5 L' + (dr[0] - 0.5) + ' ' + (4.5 + dr[1] * 0.72) + '" stroke="#FFFFFF" stroke-width=".9" stroke-linecap="round"/>').join('') + '</g>';
const ICE_DOT = '<circle cx="51" cy="42" r="8" fill="url(#pGlint)" opacity=".6"/><circle cx="51" cy="42" r="4.8" fill="url(#pIceDot)"/><circle cx="49.5" cy="40.5" r="1.3" fill="#FFFFFF"/>';
const ICE_SPARKS = [[84, 31, 5.2], [15, 58, 3.6], [68, 84, 3.2], [41, 21, 3.8]].map(g => '<circle cx="' + g[0] + '" cy="' + g[1] + '" r="' + (g[2] * 1.25) + '" fill="url(#pGlint)"/><path d="' + sparkPath(g[0], g[1], g[2]) + '" fill="#FFFFFF"/>').join('');
const ICE_GLOSS = '<g clip-path="url(#pTile)"><path d="M-6 58 L58 -6 L70 -6 L6 58 Z" fill="#FFFFFF" opacity=".16"/><path d="M-6 74 L74 -6 L78 -6 L-2 74 Z" fill="#FFFFFF" opacity=".24"/></g>' +
  '<path d="' + SHEEN_PATH + '" fill="url(#pSheenIce)"/><rect x="1.4" y="1.4" width="97.2" height="97.2" rx="21.2" fill="none" stroke="url(#pRimIce)" stroke-width="1.5"/>';
/* Bujor: layered pinks, soft bokeh, two petals, a pearl for the dot */
function petalPath(r){ return 'M0 ' + r + ' C' + (-0.78 * r) + ' ' + (0.35 * r) + ' ' + (-0.72 * r) + ' ' + (-0.62 * r) + ' ' + (-0.28 * r) + ' ' + (-0.95 * r) + ' L0 ' + (-0.7 * r) + ' L' + (0.28 * r) + ' ' + (-0.95 * r) + ' C' + (0.72 * r) + ' ' + (-0.62 * r) + ' ' + (0.78 * r) + ' ' + (0.35 * r) + ' 0 ' + r + 'Z'; }
const BLOOM_STOPS = '<stop offset="0" stop-color="#FFFFFF"/><stop offset=".3" stop-color="#FFE6EE"/><stop offset=".5" stop-color="#FFA8C5"/><stop offset=".6" stop-color="#FFF6F9"/><stop offset=".82" stop-color="#FFC9DA"/><stop offset="1" stop-color="#FFFFFF"/>';
const BLOOM_DECO = '<g clip-path="url(#pTile)">' +
  [[14, 18, 13, '#FFFFFF', .2], [86, 14, 9, '#FFE0EA', .3], [90, 80, 15, '#FF8FB8', .28], [10, 84, 10, '#FFFFFF', .14], [62, 92, 6, '#FFE0EA', .35], [92, 47, 5, '#FFFFFF', .3], [30, 8, 4, '#FFFFFF', .35]]
    .map(c => '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '" fill="' + c[3] + '" opacity="' + c[4] + '"/>').join('') +
  [[84, 33, 6.5, 35], [15, 60, 5, -40]].map(pt => '<path d="' + petalPath(pt[2]) + '" transform="translate(' + pt[0] + ' ' + pt[1] + ') rotate(' + pt[3] + ')" fill="url(#pPetal)" opacity=".95"/>').join('') + '</g>';
const BLOOM_DOT = '<circle cx="51" cy="42" r="8" fill="url(#pGlint)" opacity=".6"/><circle cx="51" cy="42" r="4.9" fill="url(#pPearl)"/><circle cx="49.5" cy="40.4" r="1.3" fill="#FFFFFF"/>';
const BLOOM_GLOSS = '<g clip-path="url(#pTile)"><path d="M-6 66 L66 -6 L74 -6 L2 66 Z" fill="#FFFFFF" opacity=".14"/></g>' + [[70, 86, 3.2], [36, 20, 3.4]].map(g => '<circle cx="' + g[0] + '" cy="' + g[1] + '" r="' + (g[2] * 1.25) + '" fill="url(#pGlint)"/><path d="' + sparkPath(g[0], g[1], g[2]) + '" fill="#FFFFFF"/>').join('') +
  '<path d="' + SHEEN_PATH + '" fill="url(#pSheenIce)"/><rect x="1.4" y="1.4" width="97.2" height="97.2" rx="21.2" fill="none" stroke="url(#pRimIce)" stroke-width="1.5"/>';
/* Futurist: grid, circuit traces, HUD brackets, chromatic P, scanlines */
const HUD_STOPS = '<stop offset="0" stop-color="#E9FDFF"/><stop offset=".45" stop-color="#7DF3FF"/><stop offset=".55" stop-color="#FFFFFF"/><stop offset="1" stop-color="#00C8F0"/>';
const HUD_DECO = '<g clip-path="url(#pTile)"><rect width="100" height="100" fill="url(#pGrid)"/>' +
  '<path d="M0 72 H11 L19 64 H25 M100 28 H89 L81 20 V11 M72 100 V90 L82 80 H100 M9 0 V7 L17 15 H22 M100 60 H93 L88 65 V74" fill="none" stroke="#00E5FF" stroke-opacity=".5" stroke-width=".9"/>' +
  [[25, 64], [81, 11], [82, 80], [22, 15], [88, 74]].map(n => '<circle cx="' + n[0] + '" cy="' + n[1] + '" r="1.5" fill="#00E5FF"/>').join('') + '</g>' +
  '<path d="M8 18 V8 H18 M82 8 H92 V18 M92 82 V92 H82 M18 92 H8 V82" fill="none" stroke="#00E5FF" stroke-width="1.6" stroke-opacity=".9" stroke-linecap="square"/>';
const HUD_DOT = '<circle cx="51" cy="42" r="8.5" fill="url(#pGlint)" opacity=".45"/><circle cx="51" cy="42" r="6.3" fill="none" stroke="#00E5FF" stroke-width="1.1" stroke-dasharray="2.2 1.6"/><circle cx="51" cy="42" r="3.3" fill="#FFFFFF"/>';
const HUD_GLOSS = '<g clip-path="url(#pTile)"><rect width="100" height="100" fill="url(#pScan)"/></g><path d="' + SHEEN_PATH + '" fill="url(#pSheenSoft)"/><rect x="0.8" y="0.8" width="98.4" height="98.4" rx="22" fill="none" stroke="#00E5FF" stroke-opacity=".55" stroke-width="1.2"/>';
const HOLO_STOPS ='<stop offset="0" stop-color="#FF9ECD"/><stop offset=".25" stop-color="#C3A6FF"/><stop offset=".5" stop-color="#8FF3FF"/><stop offset=".72" stop-color="#A8FFCF"/><stop offset="1" stop-color="#FFF1A6"/>';
function logoSvg(id, size){
  const th = THEMES[id] || THEMES.proaspat, L = th.logo, k = 'lg' + (THEMES[id] ? id : 'proaspat');
  const fx = L.fx || (L.chrome ? 'chrome' : 'gloss');
  let strands = '<stop offset="0" stop-color="' + L.s1 + '"/><stop offset="1" stop-color="' + L.s2 + '"/>', sx2 = 0.4, sy2 = 1;
  if (fx === 'chrome'){ strands = CHROME_STOPS[L.chrome] || CHROME_STOPS.blue; sx2 = 0; }
  if (fx === 'holo'){ strands = HOLO_STOPS; sx2 = 1; sy2 = 0.6; }
  if (fx === 'neon') strands = '<stop offset="0" stop-color="#FFFFFF"/><stop offset=".35" stop-color="' + L.s1 + '"/><stop offset="1" stop-color="' + L.s1 + '"/>';
  if (fx === 'planet'){ strands = L.bands; sx2 = 0; sy2 = 1; }
  if (fx === 'comic') strands = '<stop offset="0" stop-color="' + L.s1 + '"/><stop offset="1" stop-color="' + L.s1 + '"/>';
  if (fx === 'ice'){ strands = ICE_STOPS; sx2 = 1; sy2 = 0.8; }
  if (fx === 'bloom'){ strands = BLOOM_STOPS; sx2 = 1; sy2 = 0.8; }
  if (fx === 'hud'){ strands = HUD_STOPS; sx2 = 0.3; sy2 = 1; }
  const deco = fx === 'planet' ? STARS_SVG : fx === 'comic' ? '<rect width="100" height="100" rx="22.5" fill="url(#pDots)" opacity=".2"/>' : fx === 'xmas' ? SNOW_SVG : fx === 'ice' ? iceDeco() : fx === 'bloom' ? BLOOM_DECO : fx === 'hud' ? HUD_DECO : '';
  const ring = L.ring ? '<ellipse cx="51" cy="44" rx="31" ry="8.5" fill="none" stroke="' + L.ring + '" stroke-width="2.6" opacity=".9" transform="rotate(-18 51 44)"/>' : '';
  const under = (fx === 'gloss' || fx === 'xmas')
    ?'<path d="' + P_PATH + '" fill="none" stroke="#000000" stroke-opacity=".32" stroke-width="18" stroke-linejoin="round" transform="translate(0 2.6)" filter="url(#pBlur)"/>'
    : fx === 'neon'
      ? '<path d="' + P_PATH + '" fill="none" stroke="' + L.glow + '" stroke-opacity=".45" stroke-width="26" stroke-linejoin="round" filter="url(#pGlow)"/><path d="' + P_PATH + '" fill="none" stroke="' + L.glow + '" stroke-opacity=".75" stroke-width="16" stroke-linejoin="round" filter="url(#pBlur)"/>'
      : '<path d="' + P_PATH + '" fill="none" stroke="' + L.glow + '" stroke-opacity=".35" stroke-width="20" stroke-linejoin="round" filter="url(#pBlur)"/>';
  const under2 = fx === 'planet'
    ? '<path d="' + P_PATH + '" fill="none" stroke="' + L.glow + '" stroke-opacity="' + (L.sun ? '.8' : '.45') + '" stroke-width="' + (L.sun ? 27 : 22) + '" stroke-linejoin="round" filter="url(#' + (L.sun ? 'pGlow' : 'pBlur') + ')"/>'
    : fx === 'hud'
      ? '<path d="' + P_PATH + '" fill="none" stroke="#00E5FF" stroke-opacity=".45" stroke-width="22" stroke-linejoin="round" filter="url(#pIceBlur)"/><rect width="100" height="100" fill="#FF2E88" opacity=".8" mask="url(#pMask)" transform="translate(-1.8 .5)"/><rect width="100" height="100" fill="#00E5FF" opacity=".7" mask="url(#pMask)" transform="translate(1.8 -.5)"/>'
    : fx === 'bloom'
      ? '<path d="' + P_PATH + '" fill="none" stroke="#5E0A33" stroke-opacity=".35" stroke-width="19" stroke-linejoin="round" transform="translate(0 2.4)" filter="url(#pIceBlur)"/><path d="' + P_PATH + '" fill="none" stroke="' + L.glow + '" stroke-opacity=".55" stroke-width="22" stroke-linejoin="round" filter="url(#pIceBlur)"/>'
    : fx === 'ice'
      ? '<path d="' + P_PATH + '" fill="none" stroke="#062E5C" stroke-opacity=".35" stroke-width="19" stroke-linejoin="round" transform="translate(0 2.4)" filter="url(#pIceBlur)"/><path d="' + P_PATH + '" fill="none" stroke="' + L.glow + '" stroke-opacity=".5" stroke-width="22" stroke-linejoin="round" filter="url(#pIceBlur)"/>'
    : fx === 'comic'
      ? '<path d="' + P_PATH + '" fill="none" stroke="#0B0B0F" stroke-opacity=".5" stroke-width="22" stroke-linejoin="round" transform="translate(2.6 2.6)"/><path d="' + P_PATH + '" fill="none" stroke="#0B0B0F" stroke-width="21.5" stroke-linejoin="round"/>'
      : under;
  const sheen = fx === 'ice' ? ICE_GLOSS : fx === 'bloom' ? BLOOM_GLOSS : fx === 'hud' ? HUD_GLOSS : (fx === 'neon' || fx === 'comic') ? '' : '<path d="' + SHEEN_PATH + '" fill="url(#' + ((fx === 'gloss' || fx === 'xmas' || fx === 'ice') ? 'pSheen' : 'pSheenSoft') + ')"/>';
  const dotGlow = fx === 'neon' ? '<circle cx="51" cy="42" r="7.5" fill="' + L.dot + '" opacity=".65" filter="url(#pBlur)"/>' : fx === 'comic' ? '<circle cx="51" cy="42" r="6.2" fill="#0B0B0F"/>' : '';
  return '<svg viewBox="0 0 100 100" width="' + size + '" height="' + size + '" aria-hidden="true"><defs>' +
    (fx === 'planet' ? '<radialGradient id="' + k + 'Bg" cx=".3" cy=".25" r="1">' : '<linearGradient id="' + k + 'Bg" x1="0" y1="0" x2="1" y2="1">') + '<stop offset="0" stop-color="' + L.bg1 + '"/>' + (L.bgMid ? '<stop offset=".5" stop-color="' + L.bgMid + '"/>' : '') + '<stop offset="1" stop-color="' + L.bg2 + '"/>' + (fx === 'planet' ? '</radialGradient>' : '</linearGradient>') +
    '<linearGradient id="' + k + 'St" x1="0" y1="0" x2="' + sx2 + '" y2="' + sy2 + '">' + strands + '</linearGradient>' +
    '<radialGradient id="' + k + 'Dot" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="' + L.dot2 + '"/><stop offset="1" stop-color="' + L.dot + '"/></radialGradient>' +
    '</defs>' +
    '<rect width="100" height="100" rx="22.5" fill="url(#' + k + 'Bg)"/>' +
    deco + under2 +
    '<rect width="100" height="100" fill="url(#' + k + 'St)" mask="url(#pMask)"/>' + ring +
    (fx === 'ice' ? ICE_DOT + ICE_TOP + ICE_SPARKS : fx === 'bloom' ? BLOOM_DOT : fx === 'hud' ? HUD_DOT : dotGlow + '<circle cx="51" cy="42" r="4.5" fill="url(#' + k + 'Dot)"/>') + (fx === 'xmas' ? SANTA_HAT : '') +
    sheen +
    '<rect x="0.6" y="0.6" width="98.8" height="98.8" rx="22" fill="none" stroke="url(#pRim)" stroke-width="1.2"/>' +
    '</svg>';
}

/* ---------- helpers ---------- */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nf0 = new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 2 });
const nf3 = new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 3 });
const fmt = n => nf0.format(Math.round(n || 0));
const fmt1 = n => nf1.format(Math.round((n || 0) * 10) / 10);
const fmtL = ml => nf2.format(Math.round((ml || 0) / 10) / 100);
const r1 = n => Math.round((n || 0) * 10) / 10;
const inVal = n => (n == null || !isFinite(n)) ? '' : String(r1(n)).replace('.', ',');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clone = o => JSON.parse(JSON.stringify(o));
const newId = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
const num = v => { const n = parseFloat(String(v == null ? '' : v).replace(',', '.').replace(/[^\d.\-]/g, '')); return isFinite(n) ? n : NaN; };
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
const lsGet = k => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
const reduceMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const scrollTo = el => { if (el && el.scrollIntoView) el.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' }); };

function keyOf(d){ return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }
function parseKey(k){ const p = k.split('-').map(Number); return new Date(p[0], p[1]-1, p[2]); }
function addDays(k, n){ const d = parseKey(k); d.setDate(d.getDate() + n); return keyOf(d); }
function todayKey(){ return keyOf(new Date()); }
function dayWord(k){
  const t = todayKey();
  if (k === t) return 'Azi';
  if (k === addDays(t, -1)) return 'Ieri';
  return cap(parseKey(k).toLocaleDateString('ro-RO', { weekday:'long' }));
}
function dateLine(k){
  const t = todayKey();
  const opts = (k === t || k === addDays(t, -1)) ? { weekday:'long', day:'numeric', month:'long' } : { day:'numeric', month:'long', year:'numeric' };
  return parseKey(k).toLocaleDateString('ro-RO', opts);
}
const shortDate = k => parseKey(k).toLocaleDateString('ro-RO', { day:'numeric', month:'short' });
function autoMeal(){
  const d = new Date(); const h = d.getHours() + d.getMinutes()/60;
  if (h < 10.5) return 'breakfast';
  if (h < 15) return 'lunch';
  if (h < 18) return 'snack';
  return 'dinner';
}
const mealName = id => (MEALS.find(m => m.id === id) || MEALS[3]).t;

/* ---------- data shapes ---------- */
function computeTargets(p){
  const bmr = 10*p.weight + 6.25*p.height - 5*p.age + (p.sex === 'f' ? -161 : 5);
  const act = (ACT.find(a => a.id === p.activity) || ACT[2]).f;
  const g = GOALS.find(x => x.id === p.goal) || GOALS[2];
  const tdee = bmr * act;
  let kcal = Math.round(tdee * (1 + g.adj) / 10) * 10;
  kcal = Math.max(kcal, p.sex === 'f' ? 1200 : 1500);
  const protein = Math.round(p.weight * g.prot);
  const fat = Math.round(kcal * 0.25 / 9);
  const carbs = Math.max(0, Math.round((kcal - protein*4 - fat*9) / 4));
  const water = Math.max(1500, Math.round(p.weight * 35 / 250) * 250);
  return { bmr: Math.round(bmr), tdee: Math.round(tdee), actF: act, adj: g.adj, protPerKg: g.prot, kcal, protein, carbs, fat, water };
}
function normEntry(e){
  if (!e || typeof e !== 'object') return null;
  const name = String(e.name || '').trim().slice(0, 120);
  if (!name) return null;
  const g = num(e.grams);
  return {
    id: String(e.id || newId()), name,
    grams: isFinite(g) && g > 0 ? Math.round(g) : null,
    kcal: Math.max(0, Math.round(num(e.kcal) || 0)),
    protein: Math.max(0, r1(num(e.protein) || 0)),
    carbs: Math.max(0, r1(num(e.carbs) || 0)),
    fat: Math.max(0, r1(num(e.fat) || 0)),
    meal: MEALS.some(m => m.id === e.meal) ? e.meal : 'snack',
    at: Number(e.at) || Date.now(),
    src: e.src ? String(e.src).slice(0, 12) : 'text'
  };
}
function normDay(d, k){
  const entries = Array.isArray(d && d.entries) ? d.entries.map(normEntry).filter(Boolean) : [];
  const water = Math.max(0, Math.round(num(d && d.water) || 0));
  const w = num(d && d.weight);
  const out = { date: k, entries, water };
  if (w >= 20 && w <= 400) out.weight = r1(w);
  if (d && (d.type === 'train' || d.type === 'rest')) out.type = d.type;
  return out;
}
const dayEmpty = d => !d.entries.length && !d.water && !d.weight && !d.type;
function normDays(obj){
  const out = {};
  if (obj && typeof obj === 'object') for (const k of Object.keys(obj)) if (/^\d{4}-\d{2}-\d{2}$/.test(k)) {
    const d = normDay(obj[k], k); if (!dayEmpty(d)) out[k] = d;
  }
  return out;
}
function normProfile(p){
  if (!p || typeof p !== 'object') return null;
  const t = p.targets || {};
  const kcal = num(t.kcal);
  if (!(kcal > 0)) return null;
  return {
    sex: p.sex === 'f' ? 'f' : (p.sex === 'm' ? 'm' : null),
    age: num(p.age) || null, height: num(p.height) || null, weight: num(p.weight) || null,
    activity: p.activity || null, goal: p.goal || null,
    custom: !!p.custom, updatedAt: Number(p.updatedAt) || Date.now(),
    skin: (p.skin && THEMES[p.skin]) ? p.skin : null,
    cycle: normCycle(p.cycle),
    adapt: normAdapt(p.adapt),
    consent: normConsent(p.consent),
    fast: normFast(p.fast),
    targets: { kcal: Math.round(kcal), protein: Math.round(num(t.protein) || 0), carbs: Math.round(num(t.carbs) || 0), fat: Math.round(num(t.fat) || 0), water: Math.round(num(t.water) || 2500) }
  };
}
function getDay(k){ return S.days[k] || { date: k, entries: [], water: 0 }; }
function dayTotals(d){
  const t = { kcal:0, protein:0, carbs:0, fat:0, n:0 };
  if (d && d.entries) for (const e of d.entries){ t.kcal += e.kcal; t.protein += e.protein; t.carbs += e.carbs; t.fat += e.fat; t.n++; }
  return t;
}

/* ---------- state ---------- */
const S = {
  mode: 'loading', loaded: false, profileKnown: false, syncErr: false,
  uid: null, db: null, profileRef: null, daysCol: null,
  profile: null, days: {}, view: todayKey(),
  meal: autoMeal(), tab: 'text', draft: null, photo: null, ctl: null,
  samplePromise: null, imgLimits: null, aiOff: false, photoOff: false,
  ideas: null, ideaCtl: null, edit: null,
  setup: null, restoring: false, migrated: false, resub: {},
  theme: 'proaspat', isOwner: true, previewing: false, plan: 'year', tier: 'plus', unsubs: [],
  appearance: lsGet('portia-appearance') || 'auto', darkShade: lsGet('portia-dark') || 'noapte', hostTheme: null, modeSet: null,
  library: { recipes: [], favorites: [], reports: [], products: [] }, bc: null, bcCtl: null, libRef: null, mini: null, rdraft: null, rctl: null, repCtl: null
};
function fallbackToLocal(){
  if (S.mode !== 'cloud') return;
  S.unsubs.forEach(u => { try { u(); } catch (e) {} });
  S.unsubs = [];
  S.mode = 'local'; S.syncErr = false;
  persistLocal(); renderSync();
  toast('Contul nu permite salvarea aici, așa că datele se salvează în acest browser.');
}

/* ---------- storage ---------- */
const W = new Map();
function isBusy(key){ const q = W.get(key); return !!q && (q.running || q.dirty); }
function anyBusy(){ for (const q of W.values()) if (q.running || q.dirty) return true; return false; }
function queueWrite(key, refFn, dataFn){
  let q = W.get(key);
  if (!q){ q = { running:false, dirty:false }; W.set(key, q); }
  q.dirty = true; renderSync();
  if (q.running) return;
  q.running = true;
  (async () => {
    let tries = 0;
    while (q.dirty){
      q.dirty = false;
      const data = dataFn();
      try {
        if (data) await refFn().set(clone(data)); else await refFn().delete();
        S.syncErr = false; tries = 0;
      } catch (e) {
        const c = e && e.code;
        if (c === 'invalid_argument'){ q.dirty = false; fallbackToLocal(); break; }
        if ((c === 'unavailable' || c === 'resource_exhausted') && tries < 2){
          tries++; q.dirty = true;
          await sleep(c === 'resource_exhausted' ? 2500 : 700 + Math.random()*800);
          continue;
        }
        writeError(e);
      }
    }
    q.running = false; renderSync();
  })();
}
function writeError(e){
  const c = e && e.code;
  S.syncErr = true;
  const msg = c === 'quota_exceeded' ? 'Spațiul de stocare e plin. Fă un cod de backup din Setări.'
    : c === 'invalid_argument' ? 'Nu am putut salva. Verifică dacă ești autentificat în Claude.'
    : c === 'revoked' ? 'Accesul la date s-a oprit. Reîncarcă pagina.'
    : 'Ultima modificare nu s-a salvat. Reîncarcă pagina și încearcă din nou.';
  toast(msg);
  renderSync();
}
let cacheT = null;
function cacheNow(){
  clearTimeout(cacheT);
  cacheT = setTimeout(() => {
    if (S.mode !== 'cloud') return;
    const keep = {}; const cutoff = addDays(todayKey(), -30);
    for (const k in S.days) if (k >= cutoff) keep[k] = S.days[k];
    lsSet('mt-last', { uid: S.uid, profile: S.profile, days: keep, library: S.library });
  }, 500);
}
function persistLocal(){
  if (S.mode !== 'local') return;
  if (!lsSet('mt-local', { profile: S.profile, days: S.days, library: S.library })){ S.mode = 'memory'; renderSync(); }
}
function saveProfile(){
  if (S.mode === 'cloud') queueWrite('profile', () => S.profileRef, () => S.profile);
  else persistLocal();
  cacheNow();
}
function saveDay(k){
  if (S.mode === 'cloud') queueWrite('day:' + k, () => S.daysCol.doc(k), () => S.days[k] || null);
  else persistLocal();
  cacheNow();
}
function mutateDay(k, fn){
  const d = clone(getDay(k)); d.date = k;
  const before = d.entries.length;
  fn(d);
  if (dayEmpty(d)) delete S.days[k]; else S.days[k] = d;
  saveDay(k);
  renderDayParts();
  const f = S.profile && S.profile.fast;
  if (k === todayKey() && d.entries.length > before && f && f.start && Date.now() - f.start > 36e5) stopFast(true);
}
async function withRetry(fn){
  try { return await fn(); }
  catch (e) {
    const c = e && e.code;
    if (c === 'unavailable' || c === 'resource_exhausted'){ await sleep(c === 'resource_exhausted' ? 2500 : 800 + Math.random()*700); return await fn(); }
    throw e;
  }
}
async function uploadAll(replace){
  if (S.mode !== 'cloud'){ persistLocal(); return true; }
  S.restoring = true; renderSync();
  try {
    if (S.profile) await withRetry(() => S.profileRef.set(clone(S.profile)));
    await withRetry(() => S.libRef.set(clone(S.library)));
    if (replace){
      const ex = await withRetry(() => S.daysCol.orderBy('date', 'desc').limit(1000).get());
      for (const d of ex.docs) if (!S.days[d.id]){ await withRetry(() => S.daysCol.doc(d.id).delete()); await sleep(40); }
    }
    for (const k of Object.keys(S.days)){ await withRetry(() => S.daysCol.doc(k).set(clone(S.days[k]))); await sleep(40); }
    S.syncErr = false;
    return true;
  } catch (e) {
    if (e && e.code === 'invalid_argument'){ S.restoring = false; fallbackToLocal(); return true; }
    writeError(e); return false;
  }
  finally { S.restoring = false; cacheNow(); renderSync(); }
}

/* ---------- boot ---------- */
function loadCache(){
  const last = lsGet('mt-last'), local = lsGet('mt-local');
  const src = (last && last.profile) ? last : local;
  if (src){ S.profile = normProfile(src.profile); S.days = normDays(src.days); S.library = normLibrary(src.library); }
}
async function boot(){
  S.hostTheme = document.documentElement.getAttribute('data-theme');
  applyMode();
  try {
    new MutationObserver(() => {
      const v = document.documentElement.getAttribute('data-theme');
      if (v === S.modeSet) return;
      S.hostTheme = v;
      applyMode(); refreshAppear();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  } catch (e) {}
  loadCache();
  applyTheme(savedSkin());
  bindStatic();
  renderAll();
  setInterval(() => { const f = S.profile && S.profile.fast; if (f && f.start && !document.hidden) renderFast(); }, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) renderFast(); });
  const C = window.claude;
  if (!C || typeof C.use !== 'function'){ S.samplePromise = Promise.resolve(null); setupSample(null); startLocal(); return; }
  S.samplePromise = C.use('sample').catch(() => null);
  S.samplePromise.then(setupSample);
  let db = null, uid = null;
  try { db = await C.use('db'); } catch (e) { db = null; }
  try { const u = await C.use('user'); uid = u ? await u.id() : null; S.isOwner = u ? await u.isOwner() : true; } catch (e) { uid = null; }
  if (db && uid) startCloud(db, uid); else startLocal();
}
function startLocal(){
  S.mode = 'local';
  const d = lsGet('mt-local');
  S.profile = d ? normProfile(d.profile) : null;
  S.days = d ? normDays(d.days) : {};
  S.library = normLibrary(d && d.library);
  if (!lsSet('mt-probe', 1)) S.mode = 'memory';
  S.profileKnown = true;
  afterLoad();
}
function startCloud(db, uid){
  S.mode = 'cloud'; S.db = db; S.uid = uid;
  const last = lsGet('mt-last');
  if (!last || last.uid !== uid){ S.profile = null; S.days = {}; S.library = normLibrary(null); }
  S.profileRef = db.doc('data/users/' + uid + '/profile');
  S.daysCol = S.profileRef.collection('days');
  S.libRef = db.doc('data/users/' + uid + '/library');
  subProfile(); subDays(); subLibrary();
  setTimeout(() => { if (!S.profileKnown){ S.profileKnown = true; afterLoad(); } }, 5000);
  renderSync();
}
function subProfile(){
  S.unsubs.push(S.profileRef.onSnapshot(snap => {
    if (S.restoring || isBusy('profile')) return;
    const fromCache = !!(snap.metadata && snap.metadata.fromCache);
    if (snap.exists){ S.profile = normProfile(snap.data()); S.profileKnown = true; }
    else if (!fromCache){ S.profile = null; S.profileKnown = true; maybeMigrate(); }
    afterLoad();
  }, e => subErr(e, 'profile')));
}
function subDays(){
  S.unsubs.push(S.daysCol.orderBy('date', 'desc').limit(400).onSnapshot(qs => {
    if (S.restoring) return;
    if (qs.empty && qs.metadata && qs.metadata.fromCache && Object.keys(S.days).length) return;
    const next = {};
    qs.docs.forEach(d => { const v = d.data(); if (v) next[d.id] = normDay(v, d.id); });
    for (const key of W.keys()) if (key.indexOf('day:') === 0 && isBusy(key)){
      const dk = key.slice(4);
      if (S.days[dk]) next[dk] = S.days[dk]; else delete next[dk];
    }
    S.days = next;
    afterLoad();
  }, e => subErr(e, 'days')));
}
function subErr(e, which){
  if (e && e.code === 'unavailable' && !S.resub[which]){
    S.resub[which] = true;
    setTimeout(() => { which === 'profile' ? subProfile() : which === 'days' ? subDays() : subLibrary(); }, 1500);
    return;
  }
  S.syncErr = true; renderSync();
}
function maybeMigrate(){
  if (S.migrated) return;
  S.migrated = true;
  const local = lsGet('mt-local');
  const p = local && normProfile(local.profile);
  if (!p) return;
  S.profile = p; S.days = normDays(local.days); S.library = normLibrary(local.library);
  uploadAll(false).then(ok => { if (ok) toast('Am mutat datele din browser în contul tău.'); });
}
function anySheetOpen(){ return $$('.sheet').some(s => !s.hidden); }
/* Light / dark: "auto" follows the phone and the Claude app; light or dark pins it for this app */
function applyMode(){
  const r = document.documentElement, pref = S.appearance;
  const v = pref === 'light' || pref === 'dark' ? pref : (S.hostTheme || null);
  S.modeSet = v;
  if (v) r.setAttribute('data-theme', v); else r.removeAttribute('data-theme');
}
/* what "Automat" resolves to right now: the Claude app's fixed theme if it has one, else the phone */
function phoneMode(){
  if (S.hostTheme === 'light' || S.hostTheme === 'dark') return S.hostTheme;
  try { return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; } catch (e) { return 'light'; }
}
function modeNote(){
  const ph = phoneMode() === 'dark' ? 'întunecat' : 'luminos';
  if (S.appearance === 'light') return 'Porția rămâne luminoasă, orice ar fi pe telefon.';
  if (S.appearance === 'dark') return 'Porția rămâne întunecată, orice ar fi pe telefon.';
  return 'Automat copiază telefonul, care acum e pe ' + ph + ', de aceea arată ca ' + (ph === 'luminos' ? 'Luminos' : 'Întunecat') + '. Când telefonul trece pe ' + (ph === 'luminos' ? 'întunecat' : 'luminos') + ', Porția trece singură.';
}
function appearanceSection(){
  const now = phoneMode() === 'dark' ? 'întunecat' : 'luminos';
  const opts = [['auto', 'Automat <span class="chip-sub">· ' + now + '</span>'], ['light', 'Luminos'], ['dark', 'Întunecat']];
  return '<h3>Aspect</h3>' +
    '<div class="row" role="radiogroup" aria-label="Aspect">' + opts.map(o => '<button class="chip" role="radio" data-action="appearance" data-v="' + o[0] + '" aria-checked="' + (S.appearance === o[0]) + '">' + o[1] + '</button>').join('') + '</div>' +
    '<p class="hint mode-note" style="margin-top:8px">' + modeNote() + '</p>' +
    '<span class="lbl" style="margin-top:16px">Nuanța modului întunecat</span>' +
    '<div class="shades" role="radiogroup" aria-label="Nuanța modului întunecat">' + shadeOpts() + '</div>' +
    '<p class="hint" style="margin-top:8px">De la Noapte, aproape negru, până la Ceață, cea mai deschisă.</p>';
}
function refreshAppear(){
  const sec = $('#appearSec'); if (!sec) return;
  const f = document.activeElement, sel = f && sec.contains(f) && f.dataset.action ? '[data-action="' + f.dataset.action + '"][data-v="' + f.dataset.v + '"]' : null;
  sec.innerHTML = appearanceSection();
  if (sel){ const n = sec.querySelector(sel); if (n) n.focus(); }
}
function shadeOpts(){
  const t = THEMES[S.theme] || THEMES.proaspat;
  return DARK_SHADES.map(s => {
    const d = liftDark(t.dark, s[2]);
    return '<button class="shade" role="radio" data-action="dark-shade" data-v="' + s[0] + '" aria-checked="' + (S.darkShade === s[0]) + '">' +
      '<span class="sw" style="background:' + d.bg + '"><span class="sw-card" style="background:' + d.surface + ';border-color:' + d.line + '"><i style="background:' + d.kcal + '"></i><i style="background:' + d.muted + '"></i></span></span><b>' + s[1] + '</b></button>';
  }).join('');
}
function applyTheme(id){
  if (!THEMES[id]) id = 'proaspat';
  S.theme = id;
  const el = $('#themeStyle'); if (el) el.textContent = themeCss(id);
  const mk = $('#brandMark'); if (mk) mk.innerHTML = logoSvg(id, 40);
  const fx = THEMES[id].logo.fx;
  if (fx) document.documentElement.setAttribute('data-fx', fx); else document.documentElement.removeAttribute('data-fx');
  updateSnow(); updateIce(); updateHud();
}
const savedSkin = () => (S.profile && S.profile.skin) || lsGet('portia-skin') || 'proaspat';
function themeBtn(id){
  const t = THEMES[id], locked = !t.free && !S.isOwner;
  const tier = TIERS[t.tier] || TIERS.plus;
  return '<button class="topt" data-action="theme-set" data-theme-id="' + id + '" aria-pressed="' + (S.theme === id) + '" aria-label="' + t.t + ': ' + t.d + (t.free ? ', gratuită' : ', inclusă în Porția ' + tier.name) + '">' +
    (locked ? '<span class="badge badge-' + (t.tier || 'plus') + '">' + LOCK_ICON + tier.name + '</span>' : '') + logoSvg(id, 30) + '<b>' + t.t + '</b></button>';
}
function themeOpts(){
  const groups = [['free', 'Gratuite'], ['plus', 'Plus'], ['platinum', 'Premium'], ['vip', 'Ultra']];
  return groups.map(g => {
    const ids = THEME_IDS.filter(id => (THEMES[id].free ? 'free' : (THEMES[id].tier || 'plus')) === g[0]);
    return ids.length ? '<div class="tgroup"><span class="lbl">' + g[1] + '</span><div class="topts">' + ids.map(themeBtn).join('') + '</div></div>' : '';
  }).join('');
}
function themeSection(){
  const ice = !!(THEMES[S.theme] && THEMES[S.theme].logo.fx === 'ice'), bloom = !!(THEMES[S.theme] && THEMES[S.theme].logo.fx === 'bloom'), petalsOn = lsGet('portia-petals') !== false;
  const xmas = !!(THEMES[S.theme] && THEMES[S.theme].logo.fx === 'xmas'), snowOn = lsGet('portia-snow') !== false;
  return '<h3>Teme de culori</h3><p>Proaspăt și Crăciun sunt gratuite. Celelalte se deblochează cu Porția Plus, Premium sau Ultra. Tema se aplică imediat, cu tot cu logo și efecte.</p>' +
    '<div class="tgroups">' + themeOpts() + '</div>' +
    (ice ? '<div class="row" style="margin-top:14px;justify-content:space-between"><span class="hint">Crăpături în gheață</span><button class="chip" role="switch" data-action="cracks-toggle" aria-checked="' + iceCracksOn() + '">' + (iceCracksOn() ? 'Pornite' : 'Oprite') + '</button></div>' : '') +
    (bloom ? '<div class="row" style="margin-top:14px;justify-content:space-between"><span class="hint">Petale în aplicație</span><button class="chip" role="switch" data-action="petals-toggle" aria-checked="' + petalsOn + '">' + (petalsOn ? 'Pornite' : 'Oprite') + '</button></div>' : '') +
    (xmas ? '<div class="row" style="margin-top:14px;justify-content:space-between"><span class="hint">Ninsoare în aplicație</span><button class="chip" role="switch" data-action="snow-toggle" aria-checked="' + snowOn + '">' + (snowOn ? 'Pornită' : 'Oprită') + '</button></div>' : '') +
    (S.isOwner ? '<p class="hint" style="margin-top:10px">Ca proprietar, le ai pe toate deblocate. Clienții le vor debloca prin abonament.</p>' : '') +
    '<button class="btn ghost sm" style="margin-top:10px" data-action="open-plus">Vezi ofertele</button>';
}
function setSkin(id){
  applyTheme(id); lsSet('portia-skin', S.theme);
  if (S.profile && S.profile.skin !== S.theme){ S.profile = Object.assign(clone(S.profile), { skin: S.theme }); saveProfile(); }
  const sec = $('#themeSec'); if (sec) sec.innerHTML = themeSection();
  const sh = $('.shades'); if (sh) sh.innerHTML = shadeOpts();
}
const lei = n => new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + ' lei';
function openPlus(previewId){
  if (previewId){ S.previewing = true; applyTheme(previewId); S.tier = (THEMES[previewId] && THEMES[previewId].tier) || 'plus'; }
  S.plan = S.plan || 'year';
  renderPlus();
  showSheet('#plusSheet');
  const h = $('#plusTitle'); if (h) h.focus({ preventScroll: true });
}
function closePlus(){
  closeSheet('#plusSheet');
  if (S.previewing){ S.previewing = false; applyTheme(savedSkin()); }
}
function renderPlus(){
  const T = TIERS[S.tier] || TIERS.plus;
  if (S.plan === 'skins' && S.tier !== 'plus') S.plan = 'year';
  const t = THEMES[S.theme] || THEMES.proaspat;
  const save = Math.round((1 - T.year / (T.month * 12)) * 100);
  const plans = [
    { id:'year', name:'Anual', tag:'Cel mai avantajos', price: lei(T.year) + '/an', sub: lei(T.year / 12) + ' pe lună, cu ' + save + '% mai puțin decât lunar' },
    { id:'month', name:'Lunar', tag:'', price: lei(T.month) + '/lună', sub:'Anulezi oricând' }
  ];
  if (S.tier === 'plus') plans.push({ id:'skins', name:'Doar cele 6 teme Plus', tag:'', price: lei(SKINS_PRICE), sub:'O singură plată, fără funcțiile cu Claude' });
  $('#plusCard').innerHTML =
    '<div class="sheet-head"><div class="row" style="gap:12px;flex-wrap:nowrap">' + logoSvg(S.previewing ? S.theme : T.logo, 46) + '<div><h2 id="plusTitle" tabindex="-1">Porția ' + T.name + '</h2><span class="meta">Previzualizare ofertă' + (S.previewing ? ' · vezi tema ' + esc(t.t) + ' în spate' : '') + '</span></div></div><button class="icon-btn" data-action="close-plus" aria-label="Închide">' + X_ICON + '</button></div>' +
    '<div class="seg" role="tablist" aria-label="Nivel de abonament" style="margin-bottom:16px">' + TIER_IDS.map(id => '<button role="tab" data-action="pick-tier" data-tier="' + id + '" aria-selected="' + (S.tier === id) + '">' + TIERS[id].name + '</button>').join('') + '</div>' +
    '<div class="freebox"><b>Gratuit pentru totdeauna</b><span>' + FREE_FOREVER + ' Nu le mutăm niciodată la plată.</span></div>' +
    '<ul class="perks">' + T.perks.map(p => '<li>' + CHECK_ICON + '<span><b>' + p[0] + '</b>' + p[1] + '</span></li>').join('') + '</ul>' +
    '<div class="plans" role="radiogroup" aria-label="Plan">' + plans.map(p =>
      '<button class="plan" role="radio" data-action="pick-plan" data-plan="' + p.id + '" aria-checked="' + (S.plan === p.id) + '"><span>' + (p.tag ? '<span class="tag">' + p.tag + '</span>' : '') + '<b>' + p.name + '</b><small>' + p.sub + '</small></span><span class="pr">' + p.price + '</span></button>').join('') +
    '</div>' +
    '<ul class="promise">' + PROMISES.map(x => '<li>' + CHECK_ICON + '<span>' + x + '</span></li>').join('') + '</ul>' +
    '<button class="btn primary" style="width:100%" disabled>Începe proba gratuită de 7 zile</button>' +
    '<p class="foot">Prețurile includ TVA. Abonamentul se reînnoiește automat la sfârșitul fiecărei perioade, până îl anulezi. Plata și anularea se fac prin App Store sau Google Play.</p>' +
    '<p class="foot">Aceasta e o previzualizare a ofertei. Plata va funcționa în versiunea publică a aplicației.' + (S.isOwner ? ' Tu, ca proprietar, ai deja toate temele deblocate.' : '') + '</p>';
}
function afterLoad(){
  S.loaded = true;
  syncConsent();
  if (!S.previewing && savedSkin() !== S.theme) applyTheme(savedSkin());
  cacheNow();
  renderAll();
  if (S.profileKnown && !hasConsent()){ if (!anySheetOpen()) openConsent(); }
  else if (S.profileKnown && !S.profile && !anySheetOpen()) openSetup(true);
  maybeAutoAdapt();
}

/* ---------- consent: health data, AI, age ---------- */
const CONSENT_V = 1;
const consentValid = c => !!(c && c.v >= CONSENT_V && c.health && c.age);
function consentOf(){ const p = S.profile && S.profile.consent, l = normConsent(lsGet('portia-consent')); return consentValid(p) ? p : consentValid(l) ? l : null; }
function hasConsent(){ return !!consentOf(); }
function aiConsentOn(){ const c = consentOf(); return !!(c && c.ai); }
function syncConsent(){
  const l = normConsent(lsGet('portia-consent'));
  if (S.profile && !consentValid(S.profile.consent) && consentValid(l)){ S.profile = Object.assign(clone(S.profile), { consent: l }); saveProfile(); }
  else if (S.profile && consentValid(S.profile.consent) && !consentValid(l)) lsSet('portia-consent', S.profile.consent);
  S.aiOff = !!(S.noSample || !aiConsentOn());
  if (S.aiOff && (S.tab === 'text' || S.tab === 'photo')) S.tab = 'manual';
}
function saveConsent(c){
  lsSet('portia-consent', c);
  if (S.profile){ S.profile = Object.assign(clone(S.profile), { consent: c }); saveProfile(); }
  syncConsent(); renderAll();
}
function openConsent(){
  S.cdraft = { health: false, ai: false, age: false };
  renderConsent(); showSheet('#consentSheet');
  const h = $('#cTitle'); if (h) h.focus({ preventScroll: true });
}
function renderConsent(){
  const d = S.cdraft || {};
  const box = (k, req, title, sub) => '<label class="cbox"><input type="checkbox" data-consent="' + k + '"' + (d[k] ? ' checked' : '') + '><span><b>' + title + (req ? '' : ' <em>opțional</em>') + '</b><small>' + sub + '</small></span></label>';
  $('#consentCard').innerHTML =
    '<div class="sbody"><h2 id="cTitle" tabindex="-1">Înainte să începi</h2>' +
    '<p>Porția îți păstrează mesele, greutatea și țintele. Sunt date despre sănătatea ta, așa că îți cerem acordul explicit. Nimic nu e bifat dinainte.</p>' +
    box('health', true, 'Datele despre alimentație și greutate', 'Sunt de acord ca Porția să-mi păstreze mesele, apa, greutatea, țintele și posturile, ca să-mi calculeze progresul. Le văd doar eu și le pot șterge oricând.') +
    box('ai', false, 'Estimări cu AI', 'Sunt de acord ca textul și pozele meselor, plus totalurile zilelor pentru idei și raport, să fie trimise la Claude, un AI al companiei Anthropic, ca să estimeze caloriile. Fără numele sau e-mailul meu. Fără acest acord notez valorile manual.') +
    box('age', true, 'Am cel puțin 16 ani', 'Porția nu e pentru copii.') +
    '<div class="medwarn"><b>Porția nu e un dispozitiv medical.</b> Nu înlocuiește sfatul unui medic sau nutriționist, iar estimările sunt aproximative. Dacă ai o afecțiune, ești însărcinată sau ai avut tulburări de alimentație, vorbește întâi cu medicul.</div>' +
    '<p class="hint">Poți porni sau opri AI-ul și poți șterge totul oricând, din Setări → Datele tale.</p></div>' +
    '<div class="sfoot"><button class="btn primary wide" data-action="consent-ok"' + (d.health && d.age ? '' : ' disabled') + '>Continuă</button></div>';
}
function acceptConsent(){
  const d = S.cdraft; if (!d || !d.health || !d.age) return;
  const now = Date.now();
  closeSheet('#consentSheet'); S.cdraft = null;
  saveConsent({ v: CONSENT_V, health: now, ai: d.ai ? now : 0, age: true });
  if (!S.profile && S.profileKnown) openSetup(true);
}

/* ---------- your data: AI switch, account deletion ---------- */
function dataSection(){
  const c = consentOf(), ai = aiConsentOn();
  const where = S.mode === 'cloud' ? 'în contul tău Claude' : S.mode === 'local' ? 'doar în acest browser' : 'doar cât timp e deschisă pagina';
  return '<h3>Datele tale</h3><p>Porția păstrează mesele, apa, greutatea, țintele, posturile și setările, ' + where + '. Când folosești AI, textul sau poza mesei merg la Claude (Anthropic) doar ca să fie estimate, fără numele sau e-mailul tău.</p>' +
    '<div class="row" style="justify-content:space-between;margin-bottom:12px"><span class="hint">Estimări cu AI (Claude)</span><button class="chip" role="switch" data-action="consent-ai" aria-checked="' + ai + '"' + (S.noSample ? ' disabled' : '') + '>' + (ai ? 'Pornite' : 'Oprite') + '</button></div>' +
    (c ? '<p class="hint" style="margin-bottom:12px">Ai dat acordul pentru datele de sănătate pe ' + esc(new Date(c.health).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })) + '. Ca să-l retragi, șterge contul, pentru că fără aceste date aplicația nu poate funcționa. Codul de backup de mai jos îți dă o copie a tuturor datelor.</p>' : '') +
    '<div id="delBox"><button class="btn danger-ghost" data-action="del-account">Șterge contul și toate datele</button></div>';
}
function delConfirmHtml(){
  return '<div class="confirm"><p><b>Ștergi definitiv contul și toate datele?</b> Mesele, greutatea, țintele, rețetele, favoritele, rapoartele și posturile dispar și nu mai pot fi recuperate. Dacă vrei să le păstrezi, generează întâi codul de backup.</p>' +
    '<p class="hint">Dacă ai un abonament, ștergerea contului nu îl oprește. Plata continuă prin App Store sau Google Play până îl anulezi din Gestionează abonamentul.</p>' +
    '<label class="lbl" for="delIn">Scrie ȘTERGE ca să confirmi</label><input type="text" id="delIn" autocomplete="off" autocapitalize="characters">' +
    '<div class="row"><button class="btn ghost" data-action="del-cancel">Renunță</button><button class="btn danger" data-action="del-confirm">Șterge definitiv</button></div><p class="ferr" id="delErr"></p></div>';
}
async function deleteAccount(){
  const inp = $('#delIn'), err = $('#delErr'), btn = $('[data-action="del-confirm"]');
  const v = (inp ? inp.value : '').trim().toUpperCase().replace(/Ș|Ş/g, 'S');
  if (v !== 'STERGE'){ if (err) err.textContent = 'Scrie ȘTERGE ca să confirmi.'; if (inp) inp.focus(); return; }
  if (btn){ btn.disabled = true; btn.textContent = 'Se șterge…'; }
  try {
    if (S.mode === 'cloud'){
      S.restoring = true;
      const ex = await withRetry(() => S.daysCol.orderBy('date', 'desc').limit(2000).get());
      for (const d of ex.docs){ await withRetry(() => S.daysCol.doc(d.id).delete()); await sleep(30); }
      await withRetry(() => S.libRef.delete());
      await withRetry(() => S.profileRef.delete());
    }
  } catch (e) {
    S.restoring = false;
    if (err) err.textContent = 'Nu am putut șterge tot. Verifică conexiunea și încearcă din nou.';
    if (btn){ btn.disabled = false; btn.textContent = 'Șterge definitiv'; }
    return;
  }
  try { Object.keys(localStorage).filter(k => /^(mt-|portia-)/.test(k)).forEach(k => localStorage.removeItem(k)); } catch (e) {}
  S.profile = null; S.days = {}; S.library = normLibrary(null); S.draft = null; S.ideas = null; S.newBadge = null; S.adaptChecked = false;
  S.restoring = false;
  closeSheet('#settings');
  applyTheme('proaspat'); syncConsent(); renderAll();
  toast('Contul și toate datele au fost șterse.');
  openConsent();
}

/* ---------- Claude ---------- */
async function setupSample(sample){
  if (!sample){ S.noSample = true; S.aiOff = true; if (S.tab !== 'manual') S.tab = 'manual'; renderTabs(); renderHero(); return; }
  try {
    const lim = await sample.limits();
    S.imgLimits = (lim && lim.images) ? lim.images : null;
  } catch (e) { S.imgLimits = null; }
  if (!S.imgLimits){ S.photoOff = true; if (S.tab === 'photo') S.tab = 'text'; }
  else if (S.imgLimits.mediaTypes && S.imgLimits.mediaTypes.length) $('#photoInput').accept = S.imgLimits.mediaTypes.join(',');
  renderTabs();
}
const ITEM_RULES = [
  '- Valorile sunt pentru toată porția, nu la 100 g.',
  '- Numele în română, scurte, cu cantitatea, de exemplu "2 ouă fierte" sau "Pâine integrală, 1 felie".'
];
function buildPrompt(kind, text){
  const lines = [
    'Ești nutriționist și estimezi valorile nutriționale ale unei mese pentru un jurnal alimentar.',
    kind === 'photo' ? 'Imaginea atașată arată mâncarea sau eticheta unui produs. Dacă e o etichetă, citește valorile de pe ea pentru porția descrisă (sau 100 g dacă nu e precizată). Dacă e o farfurie, identifică fiecare aliment și estimează porția după mărimea farfuriei și a tacâmurilor.' : '',
    text ? ((kind === 'photo' ? 'Detalii de la utilizator: ' : 'Ce a mâncat utilizatorul: ') + '"""' + text.slice(0, 1500) + '"""') : '',
    'Reguli:',
    '- Împarte masa în alimente separate (cel mult 12).',
    '- Dacă lipsește cantitatea, presupune o porție obișnuită pentru un adult.',
    '- Pentru produse de marcă sau preparate de restaurant folosește valorile publicate pe care le cunoști.'
  ].concat(ITEM_RULES, [
    'Răspunde doar cu JSON în această formă:',
    '{"items":[{"name":"2 ouă fierte","grams":100,"kcal":143,"protein":12.6,"carbs":0.7,"fat":9.5,"sigur":"mare"}],"confidence":"medie","intrebare":"","note":"O propoziție scurtă despre ce ai presupus."}',
    'sigur, la fiecare aliment: "mare" dacă e un produs ambalat, o etichetă sau cantitatea e dată clar; "medie" dacă ai estimat porția unui aliment simplu; "mică" dacă e o mâncare amestecată sau gătită (ciorbă, tocăniță, paste cu sos, prăjeli, salată cu dressing), dacă poate avea ulei, unt sau sos ascuns, sau dacă porția nu se vede bine.',
    'intrebare: o singură întrebare scurtă, pe care utilizatorul o poate răspunde din memorie, care ar schimba cel mai mult caloriile (de exemplu "Cât ulei ai folosit la gătit?" sau "Câte linguri de orez au fost?"). Pune "" dacă toate alimentele sunt "mare" sau dacă răspunsul nu ar schimba mult.',
    'confidence este "mare", "medie" sau "mică", pentru toată masa. Dacă textul sau poza nu arată mâncare sau băutură, întoarce "items": [] și explică în note.'
  ]);
  return lines.filter(Boolean).join('\n');
}
const HIDE_CODES = new Set(['not_granted','sampling_disabled','not_declared','capability_disabled','capability_removed']);
const ERR_MSG = {
  rate_limited: 'Prea multe cereri într-un timp scurt. Încearcă din nou peste un minut.',
  session_expired: 'Sesiunea Claude a expirat. Autentifică-te din nou, apoi reîncearcă.',
  image_rejected: 'Poza nu a putut fi citită. Alege altă poză, JPG sau PNG.',
  refused: 'Cererea nu a putut fi procesată. Descrie doar ce ai mâncat.',
  empty_completion: 'Nu am primit niciun răspuns. Reformulează mai simplu.',
  invalid_json: 'Răspunsul nu a putut fi citit. Încearcă din nou.',
  prompt_too_large: 'Textul e prea lung. Scurtează-l și încearcă din nou.'
};
function sampleErrMsg(e){
  const code = e && e.code;
  if (code === 'cancelled') return null;
  if (HIDE_CODES.has(code)){ S.noSample = true; S.aiOff = true; S.tab = 'manual'; renderTabs(); renderHero(); return null; }
  if (code === 'images_unavailable'){ S.photoOff = true; if (S.tab === 'photo') S.tab = 'text'; renderTabs(); return 'Pozele nu pot fi trimise aici. Descrie masa în cuvinte.'; }
  return ERR_MSG[code] || 'Ceva nu a mers. Încearcă din nou.';
}
let busyTimer = null;
function setBusy(on, msg){
  $('#estStatus').hidden = !on;
  $$('[data-action="estimate-text"],[data-action="estimate-photo"]').forEach(b => b.disabled = on || (b.id === 'photoBtn' && !S.photo));
  clearInterval(busyTimer);
  if (on){
    $('#estMsg').textContent = msg;
    const t0 = Date.now(); $('#estElapsed').textContent = '';
    busyTimer = setInterval(() => { const s = Math.round((Date.now()-t0)/1000); $('#estElapsed').textContent = s >= 3 ? s + ' s' : ''; }, 1000);
  }
}
function showErr(msg){ const el = $('#estErr'); el.textContent = msg || ''; el.hidden = !msg; }
function itemsFrom(arr){
  return (Array.isArray(arr) ? arr : []).map(it => {
    const e = normEntry(Object.assign({}, it, { meal: S.meal }));
    const cf = String(it && it.sigur || '').toLowerCase();
    return e ? { name: e.name, grams: e.grams, kcal: e.kcal, protein: e.protein, carbs: e.carbs, fat: e.fat, mult: 1, conf: ['mare', 'medie', 'mică'].includes(cf) ? cf : '' } : null;
  }).filter(Boolean).slice(0, 12);
}
async function estimate(kind, follow){
  showErr('');
  const base = kind === 'text' ? $('#foodText').value.trim() : $('#photoNote').value.trim();
  const text = follow ? (base ? base + '\n' : '') + follow : base;
  if (kind === 'text' && !text){ showErr('Scrie ce ai mâncat, de exemplu „2 ouă și o felie de pâine”.'); $('#foodText').focus(); return; }
  if (kind === 'photo' && !S.photo){ showErr('Alege întâi o poză.'); return; }
  if (S.ctl) S.ctl.abort();
  const ctl = new AbortController(); S.ctl = ctl;
  setBusy(true, follow ? 'Claude recalculează cu răspunsul tău…' : kind === 'photo' ? 'Claude se uită la poză…' : 'Claude calculează…');
  try {
    const sample = await S.samplePromise;
    if (ctl.signal.aborted) return;
    if (!sample){ S.noSample = true; S.aiOff = true; S.tab = 'manual'; renderTabs(); return; }
    const opts = { signal: ctl.signal, modelTier: kind === 'photo' ? 'default' : 'quick' };
    if (kind === 'photo') opts.images = [S.photo.blob];
    const res = await sample.json(buildPrompt(kind, text), opts);
    if (ctl.signal.aborted) return;
    const items = itemsFrom(res && res.items);
    if (!items.length){ showErr((res && res.note) ? String(res.note) : 'Nu am găsit alimente. Adaugă mai multe detalii.'); return; }
    const conf = String(res.confidence || '').toLowerCase();
    const q = String(res.intrebare || '').trim().slice(0, 160);
    S.draft = { items, note: String(res.note || '').slice(0, 300), confidence: ['mare','medie','mică'].includes(conf) ? conf : '', question: q, follow: follow || '', src: kind };
    renderPreview();
    scrollTo($('#preview'));
  } catch (e) {
    const m = sampleErrMsg(e); if (m) showErr(m);
  } finally {
    if (S.ctl === ctl){ S.ctl = null; setBusy(false); }
  }
}
async function getIdeas(){
  if (!S.profile) return;
  if (S.ideaCtl) S.ideaCtl.abort();
  const ctl = new AbortController(); S.ideaCtl = ctl;
  const meal = S.meal;
  S.ideas = { state: 'loading', meal, list: [] };
  renderIdeas(); scrollTo($('#ideas'));
  const T = targetsFor(S.view), day = getDay(S.view), t = dayTotals(day);
  const rem = { kcal: Math.max(0, T.kcal - t.kcal), p: Math.max(0, T.protein - t.protein), c: Math.max(0, T.carbs - t.carbs), f: Math.max(0, T.fat - t.fat) };
  const eaten = day.entries.map(e => e.name).slice(0, 30).join('; ') || 'nimic încă';
  const goal = GOALS.find(g => g.id === S.profile.goal);
  const prompt = [
    'Ești nutriționist. Utilizatorul își notează mesele și vrea idei pentru ' + mealName(meal).toLowerCase() + ', ca să-și atingă țintele de azi.',
    'Mai are disponibil azi: ' + Math.round(rem.kcal) + ' kcal, ' + Math.round(rem.p) + ' g proteine, ' + Math.round(rem.c) + ' g glucide, ' + Math.round(rem.f) + ' g grăsimi.',
    'Ce a mâncat deja azi: ' + eaten + '.',
    goal ? 'Obiectivul lui: ' + goal.t.toLowerCase() + '.' : '',
    'Nu da sfaturi medicale și nu vorbi despre boli, diete medicale sau medicamente.',
    'Propune 3 variante diferite, cu alimente obișnuite în România, ușor de găsit sau de gătit. Fiecare variantă să nu depășească caloriile rămase pentru o singură masă (dacă mai urmează și alte mese, folosește cam jumătate) și să aducă cât mai multe din proteinele rămase.',
    'Reguli pentru alimente:'
  ].concat(ITEM_RULES, [
    'Răspunde doar cu JSON în această formă:',
    '{"ideas":[{"title":"Omletă cu brânză și legume","why":"O propoziție despre de ce se potrivește.","items":[{"name":"3 ouă","grams":150,"kcal":215,"protein":19,"carbs":1,"fat":15}]}]}'
  ]).filter(Boolean).join('\n');
  try {
    const sample = await S.samplePromise;
    if (ctl.signal.aborted) return;
    if (!sample){ S.noSample = true; S.aiOff = true; S.ideas = null; renderIdeas(); renderHero(); renderTabs(); return; }
    const res = await sample.json(prompt, { signal: ctl.signal, cache: false });
    if (ctl.signal.aborted) return;
    const list = (res && Array.isArray(res.ideas) ? res.ideas : []).map(i => ({
      title: String(i && i.title || '').slice(0, 80), why: String(i && i.why || '').slice(0, 220), items: itemsFrom(i && i.items)
    })).filter(i => i.title && i.items.length).slice(0, 3);
    S.ideas = list.length ? { state: 'done', meal, list } : { state: 'error', meal, msg: 'Nu am primit idei potrivite. Încearcă din nou.' };
  } catch (e) {
    const m = sampleErrMsg(e);
    S.ideas = m ? { state: 'error', meal, msg: m } : null;
  } finally {
    if (S.ideaCtl === ctl) S.ideaCtl = null;
    renderIdeas();
  }
}

/* ---------- photo ---------- */
async function loadBitmap(file){
  if (window.createImageBitmap){ try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) {} }
  return await new Promise((res, rej) => {
    const url = URL.createObjectURL(file); const img = new Image();
    img.onload = () => res(img); img.onerror = () => rej(new Error('decode')); img.src = url;
  });
}
async function prepareImage(file){
  const types = (S.imgLimits && S.imgLimits.mediaTypes) || ['image/jpeg','image/png','image/webp','image/gif'];
  const maxB = (S.imgLimits && S.imgLimits.maxInputBytes) || 5e6;
  if (types.includes(file.type) && file.size <= Math.min(maxB, 4e6)) return file;
  const bmp = await loadBitmap(file);
  const w = bmp.width || bmp.naturalWidth, h = bmp.height || bmp.naturalHeight;
  const sc = Math.min(1, 1600 / Math.max(w, h));
  const c = document.createElement('canvas'); c.width = Math.round(w*sc); c.height = Math.round(h*sc);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return await new Promise((res, rej) => c.toBlob(b => b ? res(b) : rej(new Error('encode')), 'image/jpeg', 0.86));
}
async function onPhoto(file){
  showErr('');
  if (!file) return;
  try {
    const blob = await prepareImage(file);
    if (S.photo && S.photo.url) URL.revokeObjectURL(S.photo.url);
    const url = URL.createObjectURL(blob);
    S.photo = { blob, url };
    $('#photoThumb').innerHTML = '<img alt="" src="' + url + '">';
    $('#photoTitle').textContent = 'Poză pregătită';
    $('#photoSub').textContent = 'Atinge ca să alegi alta';
    $('#photoBtn').disabled = false;
  } catch (e) {
    showErr('Nu am putut deschide poza. Încearcă una în format JPG sau PNG.');
  }
}
function clearPhoto(){
  if (S.photo && S.photo.url) URL.revokeObjectURL(S.photo.url);
  S.photo = null;
  $('#photoInput').value = '';
  $('#photoThumb').innerHTML = CAM_ICON;
  $('#photoTitle').textContent = 'Fă o poză farfuriei';
  $('#photoSub').textContent = 'sau etichetei de pe ambalaj';
  $('#photoNote').value = '';
  $('#photoBtn').disabled = true;
}

/* ---------- actions ---------- */
function scaled(it){
  const m = it.mult || 1;
  const name = (m !== 1 && !it.grams) ? it.name + ' (×' + fmt1(m) + ')' : it.name;
  return { name, grams: it.grams ? Math.round(it.grams*m) : null, kcal: Math.round(it.kcal*m), protein: r1(it.protein*m), carbs: r1(it.carbs*m), fat: r1(it.fat*m) };
}
function commitDraft(){
  const d = S.draft; if (!d || !d.items.length) return;
  const k = S.view, meal = S.meal, now = Date.now();
  const entries = d.items.map((it, i) => Object.assign(scaled(it), { id: newId(), meal, at: now + i, src: d.src }));
  const ids = new Set(entries.map(e => e.id));
  S.draft = null;
  mutateDay(k, day => { day.entries.push(...entries); });
  if (d.src === 'text') $('#foodText').value = '';
  else if (d.src === 'photo') clearPhoto();
  else if (d.src === 'idea'){ S.ideas = null; renderIdeas(); }
  const kc = entries.reduce((a, e) => a + e.kcal, 0);
  toast('Adăugat la ' + mealName(meal) + ' · ' + fmt(kc) + ' kcal', 'Anulează', () => mutateDay(k, day => { day.entries = day.entries.filter(e => !ids.has(e.id)); }));
}
function addManual(){
  const name = $('#mName').value.trim();
  const g = num($('#mGrams').value), p = num($('#mP').value), c = num($('#mC').value), f = num($('#mF').value);
  let kcal = num($('#mKcal').value);
  if (!name){ showErr('Scrie numele alimentului.'); $('#mName').focus(); return; }
  const P = p > 0 ? p : 0, Cc = c > 0 ? c : 0, F = f > 0 ? f : 0;
  if (!(kcal > 0)){
    if (P || Cc || F) kcal = P*4 + Cc*4 + F*9;
    else { showErr('Completează caloriile sau macronutrienții.'); $('#mKcal').focus(); return; }
  }
  showErr('');
  const e = normEntry({ id: newId(), name, grams: g, kcal, protein: P, carbs: Cc, fat: F, meal: S.meal, at: Date.now(), src: 'manual' });
  const k = S.view;
  mutateDay(k, day => day.entries.push(e));
  ['#mName','#mGrams','#mKcal','#mP','#mC','#mF'].forEach(s => $(s).value = '');
  toast('Adăugat la ' + mealName(e.meal) + ' · ' + fmt(e.kcal) + ' kcal', 'Anulează', () => mutateDay(k, day => { day.entries = day.entries.filter(x => x.id !== e.id); }));
}
function recentFoods(){
  const all = [];
  for (const k in S.days) for (const e of S.days[k].entries) all.push(e);
  all.sort((a, b) => b.at - a.at);
  const seen = new Set(), out = [];
  for (const e of all){ const key = e.name.toLowerCase(); if (seen.has(key)) continue; seen.add(key); out.push(e); if (out.length >= 12) break; }
  return out;
}
function addRecent(i){
  const src = S._recent && S._recent[i]; if (!src) return;
  const k = S.view;
  const e = Object.assign(clone(src), { id: newId(), meal: S.meal, at: Date.now(), src: 'repeat' });
  mutateDay(k, day => day.entries.push(e));
  toast('Adăugat: ' + e.name, 'Anulează', () => mutateDay(k, day => { day.entries = day.entries.filter(x => x.id !== e.id); }));
}
function repeatMeal(){
  const k = S.view, meal = S.meal;
  const src = getDay(addDays(k, -1)).entries.filter(e => e.meal === meal);
  if (!src.length) return;
  const now = Date.now();
  const copies = src.map((e, i) => Object.assign(clone(e), { id: newId(), at: now + i, src: 'repeat' }));
  const ids = new Set(copies.map(e => e.id));
  mutateDay(k, day => day.entries.push(...copies));
  toast(mealName(meal) + ' ca ieri · ' + fmt(copies.reduce((a, e) => a + e.kcal, 0)) + ' kcal', 'Anulează', () => mutateDay(k, day => { day.entries = day.entries.filter(e => !ids.has(e.id)); }));
}
function delEntry(id){
  const k = S.view; const day = getDay(k);
  const idx = day.entries.findIndex(e => e.id === id); if (idx < 0) return;
  const e = clone(day.entries[idx]);
  mutateDay(k, d => { d.entries.splice(idx, 1); });
  toast('Șters: ' + e.name, 'Anulează', () => mutateDay(k, d => { if (!d.entries.some(x => x.id === e.id)) d.entries.splice(Math.min(idx, d.entries.length), 0, e); }));
}
function waterAdd(ml){ mutateDay(S.view, d => { d.water = Math.max(0, Math.min(10000, (d.water || 0) + ml)); }); }
function waterSet(ml, per){
  mutateDay(S.view, d => { const cur = d.water || 0; d.water = Math.abs(cur - ml) < 1 ? Math.max(0, Math.round(ml - per)) : ml; });
}
function saveWeight(){
  const inp = $('#wIn'); const v = num(inp.value);
  if (!(v >= 30 && v <= 300)){ toast('Scrie greutatea în kg, de exemplu 84,6.'); inp.focus(); return; }
  const k = S.view, prev = getDay(k).weight || null, w = r1(v);
  mutateDay(k, d => { d.weight = w; });
  inp.value = ''; inp.blur();
  toast('Greutate notată: ' + fmt1(w) + ' kg', 'Anulează', () => mutateDay(k, d => { if (prev) d.weight = prev; else delete d.weight; }));
}
function delWeight(){
  const k = S.view, prev = getDay(k).weight; if (!prev) return;
  mutateDay(k, d => { delete d.weight; });
  toast('Greutatea a fost ștearsă.', 'Anulează', () => mutateDay(k, d => { d.weight = prev; }));
}
function recalcFromWeight(w){
  const p = S.profile; if (!p || !p.sex || !p.activity || !p.goal || !p.age || !p.height) return;
  const old = clone(p);
  const T = computeTargets(Object.assign({}, p, { weight: w }));
  S.profile = Object.assign(clone(p), { weight: w, updatedAt: Date.now(), targets: { kcal: T.kcal, protein: T.protein, carbs: T.carbs, fat: T.fat, water: T.water } });
  saveProfile(); renderAll();
  toast('Ținta nouă: ' + fmt(T.kcal) + ' kcal', 'Anulează', () => { S.profile = old; saveProfile(); renderAll(); });
}

/* ---------- smart target: real expenditure from what was eaten and how weight moved ---------- */
const ADAPT_WIN = 28, ADAPT_MIN_SPAN = 14, ADAPT_MIN_LOGGED = 10, ADAPT_MIN_WEIGHTS = 4, ADAPT_STEP = 250;
function recentAvgWeight(){ const pts = weightSeries(todayKey(), 7); return pts.length ? pts.reduce((a, x) => a + x.w, 0) / pts.length : null; }
function adaptInfo(){
  const p = S.profile; if (!p || !p.targets) return null;
  const today = todayKey(), logged = [], weights = [];
  for (let i = ADAPT_WIN; i >= 0; i--){
    const k = addDays(today, -i), d = S.days[k]; if (!d) continue;
    if (d.weight) weights.push({ i: ADAPT_WIN - i, w: d.weight });
    if (i === 0) continue;
    const t = dayTotals(d), T = targetsFor(k);
    if (t.n && t.kcal >= Math.max(800, (T ? T.kcal : 2000) * 0.5)) logged.push({ k, kcal: t.kcal });
  }
  const span = logged.length ? Math.round((parseKey(today) - parseKey(logged[0].k)) / 864e5) : 0;
  const wSpan = weights.length >= 2 ? weights[weights.length - 1].i - weights[0].i : 0;
  const need = { days: Math.max(0, ADAPT_MIN_LOGGED - logged.length), weights: Math.max(0, ADAPT_MIN_WEIGHTS - weights.length), span: Math.max(0, ADAPT_MIN_SPAN - span), wspan: Math.max(0, 10 - wSpan) };
  if (need.days || need.weights || need.span || need.wspan) return { ready: false, need, logged: logged.length, weights: weights.length };
  const n = weights.length, mx = weights.reduce((a, x) => a + x.i, 0) / n, my = weights.reduce((a, x) => a + x.w, 0) / n;
  let sxy = 0, sxx = 0; weights.forEach(x => { sxy += (x.i - mx) * (x.w - my); sxx += (x.i - mx) * (x.i - mx); });
  const slope = sxx ? sxy / sxx : 0;
  const intake = logged.reduce((a, x) => a + x.kcal, 0) / logged.length;
  const observed = intake - slope * 7700;
  const formula = (p.sex && p.age && p.height && p.weight && p.activity) ? computeTargets(p).tdee : null;
  const trust = Math.min(1, logged.length / 21);
  const tdee = Math.max(1300, Math.min(5000, formula ? trust * observed + (1 - trust) * formula : observed));
  const g = GOALS.find(x => x.id === p.goal) || GOALS[2], cur = p.targets.kcal;
  let ideal = Math.max(Math.round(tdee * (1 + g.adj) / 10) * 10, p.sex === 'f' ? 1200 : 1500);
  const kcal = Math.round((cur + Math.max(-ADAPT_STEP, Math.min(ADAPT_STEP, ideal - cur))) / 10) * 10;
  return { ready: true, intake: Math.round(intake), slopeWeek: slope * 7, tdee: Math.round(tdee / 10) * 10, kcal, ideal, cur, diff: kcal - cur, logged: logged.length, weights: n, goal: g };
}
function adaptTargets(kcal){
  const T = S.profile.targets, share = T.kcal ? Math.max(0.15, Math.min(0.4, T.fat * 9 / T.kcal)) : 0.25;
  const fat = Math.round(kcal * share / 9), protein = T.protein;
  return { kcal, protein, carbs: Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4)), fat, water: T.water };
}
function applyAdapt(auto){
  const A = adaptInfo(); if (!A || !A.ready || Math.abs(A.diff) < 50) return false;
  if (!auto && S.profile.adapt && Date.now() - (S.profile.adapt.last || 0) < 7 * 864e5) return false;
  const old = clone(S.profile), avg = recentAvgWeight();
  S.profile = Object.assign(clone(S.profile), { updatedAt: Date.now(), targets: adaptTargets(A.kcal), adapt: Object.assign({ auto: false }, S.profile.adapt || {}, { last: Date.now() }) }, avg ? { weight: r1(avg) } : {});
  saveProfile(); renderAll();
  toast((auto ? 'Ținta s-a ajustat singură: ' : 'Ținta nouă: ') + fmt(A.kcal) + ' kcal', 'Anulează', () => { S.profile = old; saveProfile(); renderAll(); });
  return true;
}
function maybeAutoAdapt(){
  const p = S.profile; if (S.adaptChecked || !p || !p.adapt || !p.adapt.auto) return;
  S.adaptChecked = true;
  if (Date.now() - (p.adapt.last || 0) < 7 * 864e5) return;
  const A = adaptInfo(); if (!A || !A.ready) return;
  if (Math.abs(A.diff) < 50){ S.profile = Object.assign(clone(p), { adapt: Object.assign({}, p.adapt, { last: Date.now() }) }); saveProfile(); return; }
  applyAdapt(true);
}
function setAdaptAuto(on){
  if (!S.profile) return;
  S.profile = Object.assign(clone(S.profile), { adapt: Object.assign({ last: 0 }, S.profile.adapt || {}, { auto: on }) });
  saveProfile(); renderAdapt();
  toast(on ? 'Ținta se va ajusta singură o dată pe săptămână.' : 'Ajustarea automată e oprită. Ți-o propun doar aici.');
}
function renderAdapt(){
  const el = $('#adapt'); if (!el) return;
  const A = adaptInfo(); if (!A){ el.innerHTML = ''; return; }
  const auto = !!(S.profile.adapt && S.profile.adapt.auto);
  const head = '<div class="adapt-head"><b>Ținta inteligentă</b><span class="meta">' + (A.ready ? 'din ultimele ' + ADAPT_WIN + ' de zile' : 'se pregătește') + '</span></div>';
  if (!A.ready){
    const doneD = Math.min(ADAPT_MIN_LOGGED, A.logged), doneW = Math.min(ADAPT_MIN_WEIGHTS, A.weights);
    const pct = Math.round((doneD / ADAPT_MIN_LOGGED * 0.6 + doneW / ADAPT_MIN_WEIGHTS * 0.4) * 100);
    const left = [];
    if (A.need.days) left.push(A.need.days + (A.need.days === 1 ? ' zi notată' : ' zile notate'));
    if (A.need.weights) left.push(A.need.weights + (A.need.weights === 1 ? ' cântărire' : ' cântăriri'));
    if (!left.length && (A.need.span || A.need.wspan)) left.push('încă ' + Math.max(A.need.span, A.need.wspan) + ' zile de date');
    el.innerHTML = '<div class="adapt">' + head + '<p>Calculez cât arzi de fapt, din ce mănânci și cum se mișcă greutatea. Am nevoie de cel puțin 2 săptămâni cu mese notate și câteva cântăriri dimineața.</p>' +
      '<div class="adapt-prog"><span><i style="width:' + pct + '%"></i></span><small>Mai ai nevoie de ' + left.join(' și ') + '.</small></div></div>';
    return;
  }
  const last = (S.profile.adapt && S.profile.adapt.last) || 0, recent = Date.now() - last < 7 * 864e5;
  const sw = A.slopeWeek, moved = Math.abs(sw) < 0.05 ? 'a rămas aproape la fel' : (sw < 0 ? 'a scăzut ' : 'a crescut ') + (Math.abs(sw) < 0.05 ? '' : fmt1(Math.abs(sw)) + ' kg pe săptămână');
  const body = '<p>Ai mâncat în medie <strong>' + fmt(A.intake) + ' kcal</strong> pe zi, iar greutatea ' + moved + '. Asta înseamnă că arzi cam <strong>' + fmt(A.tdee) + ' kcal</strong> pe zi.</p>' +
    (recent
      ? '<p>Pe ' + esc(shortDate(keyOf(new Date(last)))) + ' am ajustat ținta la <strong>' + fmt(A.cur) + ' kcal</strong>. Las câteva zile să se vadă efectul. Următoarea ajustare e posibilă de pe ' + esc(shortDate(keyOf(new Date(last + 7 * 864e5)))) + ', ' + (auto ? 'singură.' : 'din acest card.') + '</p>'
      : Math.abs(A.diff) >= 50
        ? (A.kcal !== A.ideal
          ? '<p>Pentru ' + esc(A.goal.t.toLowerCase()) + ', ținta potrivită e <strong>' + fmt(A.ideal) + ' kcal</strong>. Ca să nu fie o schimbare bruscă, o mut treptat: întâi la <strong>' + fmt(A.kcal) + ' kcal</strong> (acum ai ' + fmt(A.cur) + ').</p>'
          : '<p>Pentru ' + esc(A.goal.t.toLowerCase()) + ', ținta potrivită e <strong>' + fmt(A.kcal) + ' kcal</strong> (acum ai ' + fmt(A.cur) + ').</p>') +
          '<div class="row"><button class="btn primary sm" data-action="adapt-apply">Aplică ' + fmt(A.kcal) + ' kcal</button></div>'
        : '<p>Ținta ta de acum, ' + fmt(A.cur) + ' kcal, e potrivită pentru ' + esc(A.goal.t.toLowerCase()) + '.</p>');
  el.innerHTML = '<div class="adapt">' + head + body +
    '<div class="row adapt-auto"><span class="hint">Automat, în fiecare săptămână</span><button class="chip" role="switch" data-action="adapt-auto" aria-checked="' + auto + '">' + (auto ? 'Pornit' : 'Oprit') + '</button></div>' +
    '<p class="hint">Proteinele rămân la fel. Se schimbă glucidele și grăsimile.</p></div>';
}

/* ---------- intermittent fasting ---------- */
function fastOf(){ return (S.profile && S.profile.fast) || { plan: '16:8', start: null, log: [], hide: false }; }
function fastHours(f){ return (FAST_PLANS.find(x => x.id === f.plan) || FAST_PLANS[1]).h; }
function setFast(patch){
  if (!S.profile) return;
  S.profile = Object.assign(clone(S.profile), { fast: Object.assign({}, fastOf(), patch) });
  saveProfile(); renderFast(); renderHero();
  const sec = $('#fastSec'); if (sec) sec.innerHTML = fastSection();
}
function lastMealAt(){ let best = 0; const t = todayKey(); [t, addDays(t, -1)].forEach(k => { const d = S.days[k]; if (d) d.entries.forEach(e => { if (e.at > best && e.at <= Date.now()) best = e.at; }); }); return best; }
const hm = ms => { const m = Math.max(0, Math.round(ms / 6e4)), h = Math.floor(m / 60), r = m % 60; return h ? h + ' h' + (r ? ' ' + r + ' min' : '') : r + ' min'; };
const clockOf = ts => new Date(ts).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
function whenOf(ts){ const k = keyOf(new Date(ts)), t = todayKey(); return (k === t ? 'azi' : k === addDays(t, -1) ? 'ieri' : k === addDays(t, 1) ? 'mâine' : shortDate(k)) + ' la ' + clockOf(ts); }
function startFast(fromLast){ const at = fromLast ? lastMealAt() : Date.now(); if (!at) return; setFast({ start: at }); toast('Post pornit. Se termină ' + whenOf(at + fastHours(fastOf()) * 36e5) + '.'); }
function stopFast(auto){
  const f = fastOf(); if (!f.start) return;
  const end = Date.now(), dur = end - f.start, goal = fastHours(f);
  if (dur < 6e4){ setFast({ start: null }); return; }
  setFast({ start: null, log: [{ start: f.start, end, goal }].concat(f.log).slice(0, 30) });
  if (!auto) toast('Post încheiat: ' + hm(dur) + (dur >= goal * 36e5 ? '. Ținta atinsă!' : '.'));
}
function renderFast(){
  const el = $('#fast'); if (!el) return;
  const p = S.profile, f = fastOf();
  if (!p || f.hide){ el.hidden = true; el.innerHTML = ''; return; }
  el.hidden = false;
  const goalH = fastHours(f), now = Date.now(), last = f.log[0];
  const head = (meta) => '<div class="panel-head"><h2 id="fastTitle">Post intermitent</h2><span class="meta">' + meta + '</span></div>';
  if (!f.start){
    const lm = lastMealAt(), since = lm ? now - lm : 0, canLast = lm && since > 6e4 && since < goalH * 36e5;
    el.innerHTML = head(goalH + ' h post · ' + (24 - goalH) + ' h mese') +
      '<div class="row" role="radiogroup" aria-label="Planul de post">' + FAST_PLANS.map(x => '<button class="chip" role="radio" data-action="fast-plan" data-plan="' + x.id + '" aria-checked="' + (f.plan === x.id) + '">' + x.id + '</button>').join('') + '</div>' +
      '<p class="fast-meal">' + (lm ? 'Ultima masă notată: ' + whenOf(lm) + ', acum ' + hm(since) + '.' : 'Pornește postul după ultima masă a zilei.') + '</p>' +
      '<div class="row"><button class="btn primary sm" data-action="fast-start">Pornește acum</button>' + (canLast ? '<button class="btn soft sm" data-action="fast-start-last">De la ultima masă</button>' : '') + '</div>' +
      (last ? '<p class="hint" style="margin-top:12px">Ultimul post: ' + hm(last.end - last.start) + ((last.end - last.start) / 36e5 >= last.goal - 0.01 ? ', ținta de ' + last.goal + ' h atinsă.' : ', din ' + last.goal + ' h.') + '</p>' : '') +
      '<button class="rm fast-hide" data-action="fast-hide">Nu țin post, ascunde panoul</button>';
    return;
  }
  const ms = now - f.start, goal = goalH * 36e5, frac = Math.min(1, ms / goal), done = ms >= goal;
  const C = 2 * Math.PI * 52, mins = Math.floor(ms / 6e4), clock = Math.floor(mins / 60) + ':' + String(mins % 60).padStart(2, '0');
  el.innerHTML = head(f.plan + ' · ' + (done ? 'ținta atinsă' : 'în desfășurare')) +
    '<div class="fast-run"><div class="fring' + (done ? ' done' : '') + '" role="img" aria-label="' + hm(ms) + ' din ' + goalH + ' ore"><svg viewBox="0 0 128 128" aria-hidden="true"><circle class="trk" cx="64" cy="64" r="52"/><circle class="val" cx="64" cy="64" r="52" stroke-dasharray="' + C.toFixed(2) + '" stroke-dashoffset="' + (C * (1 - frac)).toFixed(2) + '"/></svg><div aria-hidden="true"><b>' + clock + '</b><small>' + (done ? 'gata!' : 'din ' + goalH + ' h') + '</small></div></div>' +
    '<dl class="fast-info"><div><dt>A început</dt><dd>' + whenOf(f.start) + '</dd></div><div><dt>' + (done ? 'Ținta atinsă' : 'Se termină') + '</dt><dd>' + whenOf(f.start + goal) + '</dd></div><div><dt>' + (done ? 'Peste țintă' : 'Mai ai') + '</dt><dd>' + hm(Math.abs(goal - ms)) + '</dd></div></dl></div>' +
    '<div class="row"><button class="btn ' + (done ? 'primary' : 'ghost') + ' sm" data-action="fast-stop">' + (done ? 'Încheie postul' : 'Oprește postul') + '</button></div>' +
    '<p class="hint" style="margin-top:10px">Când notezi o masă, postul se oprește singur.</p>';
}
function fastSection(){
  const f = fastOf();
  return '<h3>Post intermitent</h3><p>Panoul cu cronometrul de post apare pe pagina principală, sub apă.</p><div class="row"><button class="chip" role="switch" data-action="fast-show" aria-checked="' + !f.hide + '">' + (f.hide ? 'Ascuns' : 'Afișat') + '</button></div>';
}

/* ---------- streaks and challenges ---------- */
const loggedDay = k => { const d = S.days[k]; return !!(d && d.entries && d.entries.length); };
function streakNow(){
  let k = todayKey(); if (!loggedDay(k)) k = addDays(k, -1);
  let n = 0; while (n < 2000 && loggedDay(k)){ n++; k = addDays(k, -1); }
  return n;
}
function bestStreak(){
  let best = 0, run = 0, prev = null;
  for (const k of Object.keys(S.days).filter(loggedDay).sort()){ run = (prev && addDays(prev, 1) === k) ? run + 1 : 1; if (run > best) best = run; prev = k; }
  return best;
}
function badgeStats(){
  const keys = Object.keys(S.days).sort(), st = { entries: 0, protDays: 0, waterDays: 0, inTarget: 0, weighIns: 0, kg: 0, fasts: 0 };
  for (const k of keys){
    const d = S.days[k], t = dayTotals(d), T = targetsFor(k);
    st.entries += t.n; if (d.weight) st.weighIns++;
    if (T && t.n){ if (t.protein >= T.protein * 0.9) st.protDays++; if (Math.abs(t.kcal - T.kcal) <= T.kcal * 0.1) st.inTarget++; }
    if (T && d.water && d.water >= T.water) st.waterDays++;
  }
  const wk = keys.filter(k => S.days[k].weight), goal = S.profile && S.profile.goal;
  if (wk.length >= 2 && goal && goal !== 'keep'){
    const first = S.days[wk[0]].weight, now = recentAvgWeight() || S.days[wk[wk.length - 1]].weight;
    st.kg = Math.max(0, (now - first) * (goal === 'bulk' ? 1 : -1));
  }
  const f = S.profile && S.profile.fast; if (f) st.fasts = f.log.filter(x => (x.end - x.start) / 36e5 >= x.goal - 0.01).length;
  st.streak = streakNow(); st.best = Math.max(bestStreak(), st.streak);
  return st;
}
const BADGES = [
  { id: 'first', t: 'Prima masă', d: 'Notează primul aliment', icon: 'plate', v: s => s.entries, goal: 1 },
  { id: 's3', t: '3 zile la rând', d: 'Notează mesele 3 zile la rând', icon: 'flame', v: s => s.best, goal: 3 },
  { id: 's7', t: 'O săptămână', d: '7 zile la rând cu mese notate', icon: 'flame', v: s => s.best, goal: 7 },
  { id: 's14', t: 'Două săptămâni', d: '14 zile la rând', icon: 'flame', v: s => s.best, goal: 14 },
  { id: 's30', t: 'O lună întreagă', d: '30 de zile la rând', icon: 'flame', v: s => s.best, goal: 30 },
  { id: 'm50', t: '50 de alimente', d: 'Notează 50 de alimente', icon: 'plate', v: s => s.entries, goal: 50 },
  { id: 'prot5', t: 'Proteine bifate', d: 'Atinge proteinele în 5 zile', icon: 'bolt', v: s => s.protDays, goal: 5 },
  { id: 'target7', t: 'În țintă', d: '7 zile la ±10% de ținta de calorii', icon: 'target', v: s => s.inTarget, goal: 7 },
  { id: 'water7', t: 'Bine hidratat', d: 'Bea toată apa în 7 zile', icon: 'drop', v: s => s.waterDays, goal: 7 },
  { id: 'w1', t: 'Prima cântărire', d: 'Notează-ți greutatea', icon: 'scale', v: s => s.weighIns, goal: 1 },
  { id: 'w10', t: '10 dimineți', d: 'Cântărește-te în 10 dimineți', icon: 'scale', v: s => s.weighIns, goal: 10 },
  { id: 'kg1', t: 'Primul kilogram', d: 'Primul kg spre obiectivul tău', icon: 'star', v: s => s.kg, goal: 1, skip: () => !S.profile || S.profile.goal === 'keep' },
  { id: 'fast1', t: 'Primul post', d: 'Termină un post intermitent', icon: 'clock', v: s => s.fasts, goal: 1 }
];
const B_ICON = {
  flame: '<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.2 1-3.8 2.4-5 .1 1.6.8 2.7 1.8 3.2C11 8.6 11.3 5.6 12 3z"/>',
  plate: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/>',
  bolt: '<path d="M13 3L5 13.5h6L10 21l8-10.5h-6L13 3z"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1.2"/>',
  drop: '<path d="M12 3.5c3 4 6 7.2 6 10.5a6 6 0 0 1-12 0c0-3.3 3-6.5 6-10.5z"/>',
  scale: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M9 9.5a4 4 0 0 1 6 0M12 9.5l1.5-1.5"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.9l-5.3 2.7 1-5.8-4.2-4.1 5.9-.9L12 3.5z"/>',
  clock: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9.5 2.8h5"/>'
};
const bIcon = (k, sz) => '<svg viewBox="0 0 24 24" width="' + (sz || 20) + '" height="' + (sz || 20) + '" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (B_ICON[k] || B_ICON.star) + '</svg>';
function badgeList(){ const st = badgeStats(); return { st, list: BADGES.filter(b => !(b.skip && b.skip())).map(b => { const v = b.v(st); return Object.assign({}, b, { val: v, done: v >= b.goal }); }) }; }
function checkBadges(){
  if (!S.loaded || !S.profile) return;
  const { list } = badgeList(), done = list.filter(b => b.done).map(b => b.id);
  const seen = lsGet('portia-badges');
  if (!Array.isArray(seen)){ lsSet('portia-badges', done); return; }
  const fresh = done.filter(id => !seen.includes(id));
  if (!fresh.length) return;
  lsSet('portia-badges', seen.concat(fresh));
  const b = BADGES.find(x => x.id === fresh[fresh.length - 1]);
  S.newBadge = fresh.length > 1 ? { id: 'many', many: fresh.length, icon: 'star', until: Date.now() + 12000 } : { id: b.id, t: b.t, icon: b.icon, until: Date.now() + 12000 };
  setTimeout(() => { if (S.newBadge && Date.now() >= S.newBadge.until){ S.newBadge = null; renderHero(); } }, 12200);
}
function openBadges(){ S.newBadge = null; S.mini = { kind: 'badges' }; renderBadges(); showSheet('#miniSheet'); $('#miniTitle').focus({ preventScroll: true }); renderHero(); }
function renderBadges(){
  if (!S.mini || S.mini.kind !== 'badges') return;
  const { st, list } = badgeList(), nDone = list.filter(b => b.done).length;
  $('#miniCard').innerHTML = sheetHead('miniTitle', 'Serii și provocări', 'close-mini') +
    '<div class="bstats"><div><dt>Seria</dt><dd>' + st.streak + '<small>' + (st.streak === 1 ? ' zi' : ' zile') + '</small></dd></div><div><dt>Record</dt><dd>' + st.best + '<small>' + (st.best === 1 ? ' zi' : ' zile') + '</small></dd></div><div><dt>Provocări</dt><dd>' + nDone + '<small>/' + list.length + '</small></dd></div></div>' +
    '<p class="hint" style="margin:12px 0">O zi intră în serie dacă notezi măcar un aliment. Dacă azi n-ai notat încă, seria rămâne vie până diseară.</p>' +
    '<ul class="badges">' + list.map(b => {
      const pct = Math.max(0, Math.min(100, Math.round(b.val / b.goal * 100)));
      const prog = b.done ? 'Gata' : (b.id === 'kg1' ? fmt1(b.val) + ' / 1 kg' : fmt(Math.floor(b.val)) + ' / ' + b.goal);
      return '<li class="bdg' + (b.done ? ' done' : '') + '"><span class="bic">' + bIcon(b.icon) + '</span><span class="btx"><b>' + esc(b.t) + '</b><small>' + esc(b.d) + '</small><span class="bbar"><i style="width:' + pct + '%"></i></span></span><span class="bpr">' + prog + '</span></li>';
    }).join('') + '</ul>';
}

/* ---------- edit entry ---------- */
function openEdit(id){
  const k = S.view; const e = getDay(k).entries.find(x => x.id === id); if (!e) return;
  S.edit = { id, k, base: clone(e), meal: e.meal, mult: 1 };
  const b = S.edit.base;
  $('#editCard').innerHTML =
    '<div class="sheet-head"><h2 id="edTitle" tabindex="-1">Editează alimentul</h2><button class="icon-btn" data-action="close-edit" aria-label="Închide">' + X_ICON + '</button></div>' +
    '<div class="mgrid">' +
      '<div class="full"><label class="lbl" for="eName">Aliment</label><input type="text" id="eName" value="' + esc(b.name) + '"></div>' +
      '<div class="half"><label class="lbl" for="eK">Calorii</label><div class="unit"><input type="text" inputmode="decimal" id="eK" value="' + inVal(b.kcal) + '"><em>kcal</em></div></div>' +
      '<div class="half"><label class="lbl" for="eG">Cantitate</label><div class="unit"><input type="text" inputmode="decimal" id="eG" value="' + inVal(b.grams) + '" placeholder="opțional"><em>g</em></div></div>' +
      '<div class="half"><label class="lbl" for="eP">Proteine</label><div class="unit"><input type="text" inputmode="decimal" id="eP" value="' + inVal(b.protein) + '"><em>g</em></div></div>' +
      '<div class="half"><label class="lbl" for="eC">Glucide</label><div class="unit"><input type="text" inputmode="decimal" id="eC" value="' + inVal(b.carbs) + '"><em>g</em></div></div>' +
      '<div class="half"><label class="lbl" for="eF">Grăsimi</label><div class="unit"><input type="text" inputmode="decimal" id="eF" value="' + inVal(b.fat) + '"><em>g</em></div></div>' +
    '</div>' +
    '<div class="edit-block"><span class="lbl">Porție față de cea notată</span><div class="row">' +
      [[0.5,'½'],[0.75,'¾'],[1,'1×'],[1.5,'1½'],[2,'2×']].map(x => '<button class="chip" data-action="e-scale" data-m="' + x[0] + '" aria-pressed="' + (x[0] === 1) + '">' + x[1] + '</button>').join('') +
    '</div></div>' +
    '<div class="edit-block"><span class="lbl">Masa</span><div class="row" role="radiogroup" aria-label="Masa">' +
      MEALS.map(m => '<button class="chip" role="radio" data-action="e-meal" data-meal="' + m.id + '" aria-checked="' + (m.id === b.meal) + '">' + m.t + '</button>').join('') +
    '</div></div>' +
    '<p class="ferr" id="eErr" style="margin-top:12px"></p>' +
    '<div class="row"><button class="btn danger-ghost" data-action="e-del">Șterge</button><button class="btn primary wide" data-action="e-save">Salvează</button></div>';
  showSheet('#editSheet');
  $('#edTitle').focus({ preventScroll: true });
}
function editScale(m){
  const ed = S.edit, b = ed.base; ed.mult = m;
  $('#eK').value = inVal(Math.round(b.kcal*m));
  $('#eG').value = b.grams ? inVal(Math.round(b.grams*m)) : '';
  $('#eP').value = inVal(b.protein*m); $('#eC').value = inVal(b.carbs*m); $('#eF').value = inVal(b.fat*m);
  $$('[data-action="e-scale"]').forEach(x => x.setAttribute('aria-pressed', String(Number(x.dataset.m) === m)));
}
function editSave(){
  const ed = S.edit; if (!ed) return;
  const name = $('#eName').value.trim();
  const P = Math.max(0, num($('#eP').value) || 0), Cc = Math.max(0, num($('#eC').value) || 0), F = Math.max(0, num($('#eF').value) || 0);
  let kcal = num($('#eK').value);
  if (!name){ $('#eErr').textContent = 'Numele nu poate fi gol.'; return; }
  if (!(kcal >= 0)){ if (P || Cc || F) kcal = P*4 + Cc*4 + F*9; else { $('#eErr').textContent = 'Completează caloriile.'; return; } }
  const k = ed.k, before = clone(ed.base);
  const after = normEntry(Object.assign({}, ed.base, { name, grams: num($('#eG').value), kcal, protein: P, carbs: Cc, fat: F, meal: ed.meal }));
  closeSheet('#editSheet'); S.edit = null;
  mutateDay(k, d => { const i = d.entries.findIndex(x => x.id === before.id); if (i >= 0) d.entries[i] = after; });
  toast('Salvat: ' + after.name, 'Anulează', () => mutateDay(k, d => { const i = d.entries.findIndex(x => x.id === before.id); if (i >= 0) d.entries[i] = before; }));
}

/* ---------- day type (gym vs rest) ---------- */
const DEFAULT_CYCLE = { on: true, days: [1, 2, 4, 5], extra: 200 };
const WD_ORDER = [1, 2, 3, 4, 5, 6, 0];
const WD_NAME = { 1:'Lu', 2:'Ma', 3:'Mi', 4:'Jo', 5:'Vi', 6:'Sâ', 0:'Du' };
function normCycle(c){
  if (!c || typeof c !== 'object') return null;
  const days = Array.isArray(c.days) ? Array.from(new Set(c.days.map(Number).filter(n => n >= 0 && n <= 6))) : DEFAULT_CYCLE.days.slice();
  const ex = Math.round(num(c.extra));
  return { on: c.on !== false, days, extra: ex >= 50 && ex <= 600 ? ex : 200 };
}
function cycleOf(){ return (S.profile && S.profile.cycle) || DEFAULT_CYCLE; }
function cycleDeltas(){
  const c = cycleOf(), n = c.days.length;
  if (!c.on || n === 0 || n === 7) return null;
  return { train: c.extra, rest: -Math.round(c.extra * n / (7 - n)) };
}
const schedType = k => cycleOf().days.includes(parseKey(k).getDay()) ? 'train' : 'rest';
function dayType(k){ const d = S.days[k]; return (d && d.type) ? d.type : schedType(k); }
function targetsFor(k){
  const base = S.profile ? S.profile.targets : null;
  if (!base) return null;
  const dl = cycleDeltas();
  if (!dl) return Object.assign({ type: null, delta: 0 }, base);
  const type = dayType(k);
  let delta = dl[type], carbs = Math.round(base.carbs + delta / 4);
  if (carbs < 40){ carbs = 40; delta = (40 - base.carbs) * 4; }
  return Object.assign({}, base, { kcal: Math.round(base.kcal + delta), carbs, type, delta });
}
function toggleDayType(){
  const k = S.view, next = dayType(k) === 'train' ? 'rest' : 'train';
  mutateDay(k, d => { if (next === schedType(k)) delete d.type; else d.type = next; });
  const T = targetsFor(k);
  toast(next === 'train' ? 'Zi de sală: ' + fmt(T.kcal) + ' kcal, mai multe glucide.' : 'Zi de pauză: ' + fmt(T.kcal) + ' kcal, mai puține glucide.');
}
function cycleSection(){
  const c = cycleOf(), dl = cycleDeltas(), b = S.profile.targets;
  return '<h3>Zile de sală și de pauză</h3><p>În zilele de sală primești mai multe glucide, în cele de pauză mai puține. Media pe săptămână rămâne ' + fmt(b.kcal) + ' kcal.</p>' +
    '<div class="row" style="margin-bottom:12px"><button class="chip" role="switch" data-action="cycle-on" aria-checked="' + c.on + '">' + (c.on ? 'Activat' : 'Dezactivat') + '</button></div>' +
    (c.on
      ? '<span class="lbl">Zilele tale de sală</span><div class="row" style="margin-bottom:12px">' + WD_ORDER.map(d => '<button class="chip" data-action="cycle-day" data-d="' + d + '" aria-pressed="' + c.days.includes(d) + '">' + WD_NAME[d] + '</button>').join('') + '</div>' +
        '<span class="lbl">În plus în zilele de sală</span><div class="row" style="margin-bottom:12px">' + [150, 200, 300].map(x => '<button class="chip" data-action="cycle-extra" data-x="' + x + '" aria-pressed="' + (c.extra === x) + '">+' + x + ' kcal</button>').join('') + '</div>' +
        (dl ? '<p class="hint">Sală: ' + fmt(b.kcal + dl.train) + ' kcal · Pauză: ' + fmt(b.kcal + dl.rest) + ' kcal. Diferența vine din glucide. Poți schimba tipul oricărei zile din panoul principal.</p>' : '<p class="hint">Alege între 1 și 6 zile de sală.</p>')
      : '');
}
function setCycle(patch){
  if (!S.profile) return;
  S.profile = Object.assign(clone(S.profile), { cycle: Object.assign({}, cycleOf(), patch) });
  saveProfile();
  const sec = $('#cycleSec'); if (sec) sec.innerHTML = cycleSection();
  renderAll();
}

/* ---------- library: recipes, favorites, reports ---------- */
const sheetHead = (id, title, closeAction) => '<div class="sheet-head"><h2 id="' + id + '" tabindex="-1">' + esc(title) + '</h2><button class="icon-btn" data-action="' + closeAction + '" aria-label="Închide">' + X_ICON + '</button></div>';
const mxHtml = (p, c, f) => '<span class="mx"><span><i class="dot p"></i>' + fmt1(p) + ' g</span><span><i class="dot c"></i>' + fmt1(c) + ' g</span><span><i class="dot f"></i>' + fmt1(f) + ' g</span></span>';
function normItem(it){ const e = normEntry(Object.assign({}, it, { meal: 'snack' })); return e ? { name: e.name, grams: e.grams, kcal: e.kcal, protein: e.protein, carbs: e.carbs, fat: e.fat } : null; }
function normReport(d){
  d = d || {};
  const arr = a => (Array.isArray(a) ? a : []).map(x => String(x).slice(0, 300)).filter(Boolean).slice(0, 4);
  const sc = Math.round(num(d.score));
  return { title: String(d.title || 'Săptămâna ta').slice(0, 90), score: sc >= 0 && sc <= 10 ? sc : null, summary: String(d.summary || '').slice(0, 600), wins: arr(d.wins), fixes: arr(d.fixes), focus: String(d.focus || '').slice(0, 300) };
}
function normLibrary(l){
  const out = { recipes: [], favorites: [], reports: [], products: [] };
  if (!l || typeof l !== 'object') return out;
  if (Array.isArray(l.products)) out.products = l.products.map(normProduct).filter(Boolean).slice(0, 300);
  if (Array.isArray(l.recipes)) out.recipes = l.recipes.map(r => {
    if (!r || !r.name) return null;
    const items = (Array.isArray(r.items) ? r.items : []).map(normItem).filter(Boolean).slice(0, 40);
    const sv = Math.round(num(r.servings)), tg = num(r.totalGrams);
    return items.length ? { id: String(r.id || newId()), name: String(r.name).trim().slice(0, 80), items, servings: sv >= 1 && sv <= 50 ? sv : 4, totalGrams: tg > 0 ? Math.round(tg) : null, at: Number(r.at) || Date.now() } : null;
  }).filter(Boolean).slice(0, 100);
  if (Array.isArray(l.favorites)) out.favorites = l.favorites.map(f => {
    if (!f || !f.name) return null;
    const items = (Array.isArray(f.items) ? f.items : []).map(normItem).filter(Boolean).slice(0, 30);
    return items.length ? { id: String(f.id || newId()), name: String(f.name).trim().slice(0, 80), items, at: Number(f.at) || Date.now() } : null;
  }).filter(Boolean).slice(0, 100);
  if (Array.isArray(l.reports)) out.reports = l.reports.filter(r => r && r.data && /^\d{4}-\d{2}-\d{2}$/.test(String(r.id))).map(r => ({ id: String(r.id), at: Number(r.at) || Date.now(), data: normReport(r.data) })).slice(0, 8);
  return out;
}
const sumItems = items => items.reduce((a, it) => { a.kcal += it.kcal; a.protein += it.protein; a.carbs += it.carbs; a.fat += it.fat; return a; }, { kcal: 0, protein: 0, carbs: 0, fat: 0 });
function saveLibrary(){
  if (S.mode === 'cloud') queueWrite('library', () => S.libRef, () => S.library);
  else persistLocal();
  cacheNow();
}
function subLibrary(){
  S.unsubs.push(S.libRef.onSnapshot(snap => {
    if (S.restoring || isBusy('library')) return;
    if (snap.exists) S.library = normLibrary(snap.data());
    else if (!(snap.metadata && snap.metadata.fromCache)) S.library = normLibrary(null);
    else return;
    cacheNow();
    renderRecent(); renderHistory();
    if (!$('#libSheet').hidden) renderLib();
  }, e => subErr(e, 'library')));
}
function libChanged(){ saveLibrary(); renderRecent(); renderHistory(); if (!$('#libSheet').hidden) renderLib(); }

function openLib(){ renderLib(); showSheet('#libSheet'); $('#libTitle').focus({ preventScroll: true }); }
function renderLib(){
  const L = S.library;
  const rec = L.recipes.length
    ? '<ul class="lib-list">' + L.recipes.map(r => { const s = sumItems(r.items); return '<li><div><b>' + esc(r.name) + '</b><span>' + r.servings + (r.servings === 1 ? ' porție' : ' porții') + ' · ' + fmt(s.kcal / r.servings) + ' kcal pe porție' + (r.totalGrams ? ' · ' + fmt(r.totalGrams) + ' g gătit' : '') + '</span></div><div class="row"><button class="rm" data-action="recipe-edit" data-id="' + esc(r.id) + '">Editează</button><button class="btn soft sm" data-action="recipe-log" data-id="' + esc(r.id) + '">Adaugă</button></div></li>'; }).join('') + '</ul>'
    : '<p class="empty">Salvează o mâncare gătită acasă o singură dată, apoi notezi doar cât ai mâncat din ea.</p>';
  const fav = L.favorites.length
    ? '<ul class="lib-list">' + L.favorites.map(f => { const s = sumItems(f.items); return '<li><div><b>' + esc(f.name) + '</b><span>' + f.items.length + (f.items.length === 1 ? ' aliment' : ' alimente') + ' · ' + fmt(s.kcal) + ' kcal</span></div><div class="row"><button class="rm" data-action="fav-del" data-id="' + esc(f.id) + '">Șterge</button><button class="btn soft sm" data-action="fav-add" data-id="' + esc(f.id) + '">Adaugă</button></div></li>'; }).join('') + '</ul>'
    : '<p class="empty">În jurnal, apasă „☆ Salvează” lângă o masă ca s-o păstrezi aici.</p>';
  $('#libCard').innerHTML = sheetHead('libTitle', 'Rețete și favorite', 'close-lib') +
    '<section><div class="panel-head" style="margin-bottom:8px"><h3>Rețetele mele</h3><button class="btn primary sm" data-action="recipe-new">+ Rețetă nouă</button></div>' + rec + '</section>' +
    '<section><h3 style="margin-bottom:8px">Mese favorite</h3>' + fav + '</section>' +
    '<section><h3 style="margin-bottom:8px">Produse scanate</h3>' + (L.products.length
      ? '<ul class="lib-list">' + L.products.map(p => '<li><div><b>' + esc(p.name) + '</b><span>' + fmt(p.per100.kcal) + ' kcal la 100 ' + p.unit + ' · cod ' + esc(p.code) + '</span></div><div class="row"><button class="rm" data-action="prod-del" data-code="' + esc(p.code) + '">Șterge</button></div></li>').join('') + '</ul>'
      : '<p class="empty">Produsele salvate prin codul de bare apar aici.</p>') + '</section>' +
    '<p class="foot">Se adaugă la ' + mealName(S.meal).toLowerCase() + (S.view === todayKey() ? '' : ', ' + dayWord(S.view).toLowerCase()) + '. Masa o alegi din panoul „Ce ai mâncat?”.</p>';
}

/* favorites */
function addFavorite(id){
  const f = S.library.favorites.find(x => x.id === id); if (!f) return;
  const k = S.view, meal = S.meal, now = Date.now();
  const entries = f.items.map((it, i) => Object.assign(clone(it), { id: newId(), meal, at: now + i, src: 'fav' }));
  const ids = new Set(entries.map(e => e.id));
  mutateDay(k, d => d.entries.push(...entries));
  toast(f.name + ' la ' + mealName(meal).toLowerCase() + ' · ' + fmt(sumItems(f.items).kcal) + ' kcal', 'Anulează', () => mutateDay(k, d => { d.entries = d.entries.filter(e => !ids.has(e.id)); }));
}
function openFavSave(meal){
  const items = getDay(S.view).entries.filter(e => e.meal === meal).sort((a, b) => a.at - b.at).map(normItem).filter(Boolean);
  if (!items.length) return;
  S.mini = { kind: 'fav', items };
  const def = { breakfast: 'Mic dejun obișnuit', lunch: 'Prânz obișnuit', snack: 'Gustare obișnuită', dinner: 'Cină obișnuită' }[meal] || 'Masă favorită';
  $('#miniCard').innerHTML = sheetHead('miniTitle', 'Salvează ca masă favorită', 'close-mini') +
    '<label class="lbl" for="favName">Nume</label><input type="text" id="favName" value="' + esc(def) + '">' +
    '<ul class="mini-list">' + items.map(it => '<li><span>' + esc(it.name) + '</span><b>' + fmt(it.kcal) + '</b><span></span></li>').join('') + '</ul>' +
    '<p class="hint" style="margin-top:10px">O adaugi apoi dintr-o atingere, din „Rețete și favorite”.</p>' +
    '<div class="row" style="margin-top:14px"><button class="btn primary wide" data-action="fav-confirm">Salvează</button></div>';
  showSheet('#miniSheet'); $('#miniTitle').focus({ preventScroll: true });
}
function confirmFav(){
  if (!S.mini || S.mini.kind !== 'fav') return;
  const name = ($('#favName').value.trim() || 'Masă favorită').slice(0, 80);
  S.library.favorites.unshift({ id: newId(), name, items: S.mini.items, at: Date.now() });
  closeMini(); libChanged();
  toast('Salvat la favorite: ' + name);
}
function delFavorite(id){
  const i = S.library.favorites.findIndex(f => f.id === id); if (i < 0) return;
  const f = S.library.favorites.splice(i, 1)[0];
  libChanged();
  toast('Șters: ' + f.name, 'Anulează', () => { S.library.favorites.splice(i, 0, f); libChanged(); });
}

/* recipes */
function openRecipe(id){
  const r = id ? S.library.recipes.find(x => x.id === id) : null;
  S.rdraft = r ? clone(r) : { id: null, name: '', items: [], servings: 4, totalGrams: null };
  renderRecipe(); showSheet('#recipeSheet'); $('#recTitle').focus({ preventScroll: true });
}
function closeRecipe(){ if (S.rctl){ S.rctl.abort(); S.rctl = null; } closeSheet('#recipeSheet'); S.rdraft = null; }
function renderRecipe(){
  const d = S.rdraft;
  $('#recipeCard').innerHTML = sheetHead('recTitle', d.id ? 'Editează rețeta' : 'Rețetă nouă', 'close-recipe') +
    '<label class="lbl" for="rName">Nume</label><input type="text" id="rName" value="' + esc(d.name) + '" placeholder="ex: Ciorbă de pui">' +
    '<div class="edit-block"><label class="lbl" for="rText">Ingrediente</label>' +
      (S.aiOff ? '' : '<textarea id="rText" rows="3" placeholder="ex: 1 kg piept de pui, 2 cepe, 2 morcovi, 300 g orez, 3 linguri ulei"></textarea><button class="btn soft" data-action="recipe-ai" id="rAiBtn">Calculează ingredientele</button>') +
      '<div class="status" id="rStatus" hidden><span class="spin" aria-hidden="true"></span><p>Claude calculează ingredientele…</p><button class="btn ghost sm" data-action="recipe-stop">Oprește</button></div><p class="err" id="rErr" hidden></p></div>' +
    '<div id="rItems"></div>' +
    '<details class="manual"' + (S.aiOff ? ' open' : '') + '><summary>Adaugă un ingredient manual</summary><div class="mgrid">' +
      '<div class="full"><label class="lbl" for="rmName">Ingredient</label><input type="text" id="rmName" placeholder="ex: Smântână 12%, 200 g"></div>' +
      '<div class="half"><label class="lbl" for="rmK">Calorii</label><div class="unit"><input type="text" inputmode="decimal" id="rmK" placeholder="0"><em>kcal</em></div></div>' +
      '<div class="half"><label class="lbl" for="rmG">Cantitate</label><div class="unit"><input type="text" inputmode="decimal" id="rmG" placeholder="opțional"><em>g</em></div></div>' +
      '<div><label class="lbl" for="rmP">Prot.</label><input type="text" inputmode="decimal" id="rmP" placeholder="g"></div>' +
      '<div><label class="lbl" for="rmC">Glucide</label><input type="text" inputmode="decimal" id="rmC" placeholder="g"></div>' +
      '<div><label class="lbl" for="rmF">Grăsimi</label><input type="text" inputmode="decimal" id="rmF" placeholder="g"></div>' +
      '<div style="display:flex;align-items:flex-end"><button class="btn soft" style="width:100%" data-action="recipe-add-manual">Adaugă</button></div>' +
    '</div></details>' +
    '<div class="tgrid" style="margin-top:14px"><div><label class="lbl" for="rServ">Porții</label><div class="unit"><input type="text" inputmode="numeric" id="rServ" value="' + d.servings + '"><em>porții</em></div></div>' +
      '<div><label class="lbl" for="rWeight">Greutate gătită</label><div class="unit"><input type="text" inputmode="numeric" id="rWeight" value="' + (d.totalGrams || '') + '" placeholder="opțional"><em>g</em></div></div></div>' +
    '<p class="hint">Cântărește mâncarea gătită (oala plină minus oala goală) și poți nota exact în grame. Fără greutate, notezi pe porții.</p>' +
    '<p class="ferr" id="recErr" style="margin-top:10px"></p>' +
    '<div class="row">' + (d.id ? '<button class="btn danger-ghost" data-action="recipe-del">Șterge</button>' : '') + '<button class="btn primary wide" data-action="recipe-save">Salvează rețeta</button></div>';
  renderRecipeItems();
}
function renderRecipeItems(){
  const d = S.rdraft, el = $('#rItems'); if (!d || !el) return;
  if (!d.items.length){ el.innerHTML = '<p class="empty" style="margin-top:12px">Încă nu ai ingrediente. Scrie-le mai sus' + (S.aiOff ? '' : ' și apasă „Calculează”') + ', sau adaugă-le manual.</p>'; return; }
  const s = sumItems(d.items);
  el.innerHTML = '<ul class="mini-list" style="margin-top:12px">' + d.items.map((it, i) => '<li><span>' + esc(it.name) + '<small>P ' + fmt1(it.protein) + ' · G ' + fmt1(it.carbs) + ' · Gr ' + fmt1(it.fat) + '</small></span><b>' + fmt(it.kcal) + '</b><button class="del" data-action="recipe-rm" data-i="' + i + '" aria-label="Scoate ' + esc(it.name) + '">' + X_ICON + '</button></li>').join('') + '</ul>' +
    '<div class="ptotal">' + mxHtml(s.protein, s.carbs, s.fat) + '<b>' + fmt(s.kcal) + ' kcal</b></div>' +
    '<p class="hint" style="margin-top:6px">Pe porție: ' + fmt(s.kcal / d.servings) + ' kcal · ' + fmt1(s.protein / d.servings) + ' g proteine</p>';
}
async function recipeAi(){
  const ta = $('#rText'), err = $('#rErr'); const txt = ta ? ta.value.trim() : '';
  err.hidden = true;
  if (!txt){ err.textContent = 'Scrie ingredientele cu cantități.'; err.hidden = false; return; }
  if (S.rctl) S.rctl.abort();
  const ctl = new AbortController(); S.rctl = ctl;
  $('#rStatus').hidden = false; $('#rAiBtn').disabled = true;
  try {
    const sample = await S.samplePromise;
    if (ctl.signal.aborted) return;
    if (!sample){ S.noSample = true; S.aiOff = true; renderTabs(); err.textContent = 'Estimarea automată nu e disponibilă aici. Adaugă ingredientele manual.'; err.hidden = false; return; }
    const prompt = [
      'Ești nutriționist. Calculează valorile nutriționale ale ingredientelor unei rețete gătite acasă.',
      'Ingrediente: """' + txt.slice(0, 2000) + '"""',
      'Reguli:',
      '- Câte un element pentru fiecare ingredient, cu cantitatea din text, pentru ingredientul crud.',
      '- Valorile sunt pentru toată cantitatea din rețetă, nu la 100 g.',
      '- Dacă lipsește cantitatea, presupune o cantitate obișnuită pentru o oală de 4 porții.',
      '- Numele în română, scurte, cu cantitatea, de exemplu "Piept de pui, 1 kg".',
      'Răspunde doar cu JSON în forma:',
      '{"items":[{"name":"Piept de pui, 1 kg","grams":1000,"kcal":1200,"protein":225,"carbs":0,"fat":26}]}'
    ].join('\n');
    const res = await sample.json(prompt, { signal: ctl.signal, modelTier: 'default' });
    if (ctl.signal.aborted || !S.rdraft) return;
    const items = (res && Array.isArray(res.items) ? res.items : []).map(normItem).filter(Boolean).slice(0, 30);
    if (!items.length){ err.textContent = 'Nu am găsit ingrediente. Scrie-le cu cantități, separate prin virgulă.'; err.hidden = false; return; }
    S.rdraft.items.push(...items);
    if (ta) ta.value = '';
    renderRecipeItems();
  } catch (e) {
    const m = sampleErrMsg(e); if (m && $('#rErr')){ err.textContent = m; err.hidden = false; }
  } finally {
    if (S.rctl === ctl){ S.rctl = null; const st = $('#rStatus'); if (st) st.hidden = true; const b = $('#rAiBtn'); if (b) b.disabled = false; }
  }
}
function recipeAddManual(){
  const name = $('#rmName').value.trim(), e = $('#recErr');
  const P = Math.max(0, num($('#rmP').value) || 0), C = Math.max(0, num($('#rmC').value) || 0), F = Math.max(0, num($('#rmF').value) || 0);
  let kcal = num($('#rmK').value);
  if (!name){ e.textContent = 'Scrie numele ingredientului.'; return; }
  if (!(kcal > 0)){ if (P || C || F) kcal = P*4 + C*4 + F*9; else { e.textContent = 'Completează caloriile ingredientului.'; return; } }
  S.rdraft.items.push(normItem({ name, grams: num($('#rmG').value), kcal, protein: P, carbs: C, fat: F }));
  ['#rmName','#rmG','#rmK','#rmP','#rmC','#rmF'].forEach(s => $(s).value = '');
  e.textContent = '';
  renderRecipeItems();
}
function saveRecipe(){
  const d = S.rdraft, e = $('#recErr'); if (!d) return;
  const name = $('#rName').value.trim(), sv = Math.round(num($('#rServ').value)), tg = num($('#rWeight').value);
  if (!name){ e.textContent = 'Dă un nume rețetei.'; return; }
  if (!d.items.length){ e.textContent = 'Adaugă cel puțin un ingredient.'; return; }
  if (!(sv >= 1 && sv <= 50)){ e.textContent = 'Numărul de porții trebuie să fie între 1 și 50.'; return; }
  const rec = { id: d.id || newId(), name: name.slice(0, 80), items: d.items, servings: sv, totalGrams: tg > 0 ? Math.round(tg) : null, at: Date.now() };
  const i = S.library.recipes.findIndex(x => x.id === rec.id);
  if (i >= 0) S.library.recipes[i] = rec; else S.library.recipes.unshift(rec);
  closeRecipe(); libChanged();
  toast('Rețetă salvată: ' + rec.name);
}
function delRecipe(){
  const d = S.rdraft; if (!d || !d.id) return;
  const i = S.library.recipes.findIndex(r => r.id === d.id); if (i < 0) return;
  const r = S.library.recipes.splice(i, 1)[0];
  closeRecipe(); libChanged();
  toast('Rețetă ștearsă: ' + r.name, 'Anulează', () => { S.library.recipes.splice(i, 0, r); libChanged(); });
}
function openRecipeLog(id){
  const r = S.library.recipes.find(x => x.id === id); if (!r) return;
  S.mini = { kind: 'recipe', id, mode: 'portion', qty: 1, meal: S.meal };
  renderRecipeLog(); showSheet('#miniSheet'); $('#miniTitle').focus({ preventScroll: true });
}
function recipeCalc(){
  const m = S.mini; if (!m || m.kind !== 'recipe') return null;
  const r = S.library.recipes.find(x => x.id === m.id); if (!r) return null;
  const s = sumItems(r.items), q = m.qty || 0;
  const byG = m.mode === 'grams' && r.totalGrams;
  const f = byG ? q / r.totalGrams : q / r.servings;
  const grams = byG ? Math.round(q) : (r.totalGrams ? Math.round(r.totalGrams / r.servings * q) : null);
  const label = byG ? fmt(q) + ' g' : (q === 1 ? '1 porție' : fmt1(q) + ' porții');
  return { r, name: r.name + ' · ' + label, grams, kcal: Math.round(s.kcal * f), protein: r1(s.protein * f), carbs: r1(s.carbs * f), fat: r1(s.fat * f) };
}
function renderRecipeLog(){
  const m = S.mini, v = recipeCalc(); if (!v) return;
  const r = v.r;
  $('#miniCard').innerHTML = sheetHead('miniTitle', r.name, 'close-mini') +
    (r.totalGrams ? '<div class="seg" role="tablist" aria-label="Unitate" style="margin-bottom:14px"><button role="tab" data-action="rl-mode" data-mode="portion" aria-selected="' + (m.mode === 'portion') + '">Porții</button><button role="tab" data-action="rl-mode" data-mode="grams" aria-selected="' + (m.mode === 'grams') + '">Grame</button></div>' : '') +
    (m.mode === 'portion'
      ? '<span class="lbl">Cât ai mâncat</span><div class="row">' + [[0.5, '½ porție'], [1, '1 porție'], [1.5, '1½'], [2, '2 porții']].map(x => '<button class="chip" data-action="rl-qty" data-q="' + x[0] + '" aria-pressed="' + (m.qty === x[0]) + '">' + x[1] + '</button>').join('') + '</div>'
      : '<label class="lbl" for="rlG">Cât ai mâncat</label><div class="unit"><input type="text" inputmode="numeric" id="rlG" value="' + (m.qty || '') + '"><em>g</em></div>') +
    '<div class="edit-block"><span class="lbl">Masa</span><div class="row" role="radiogroup" aria-label="Masa">' + MEALS.map(x => '<button class="chip" role="radio" data-action="rl-meal" data-meal="' + x.id + '" aria-checked="' + (x.id === m.meal) + '">' + x.t + '</button>').join('') + '</div></div>' +
    '<div class="ptotal" id="rlPrev" style="margin-top:16px"></div>' +
    '<div class="row" style="margin-top:14px"><button class="btn primary wide" data-action="rl-add">Adaugă în jurnal</button></div>';
  updateRecipeLogPrev();
}
function updateRecipeLogPrev(){ const v = recipeCalc(), el = $('#rlPrev'); if (v && el) el.innerHTML = mxHtml(v.protein, v.carbs, v.fat) + '<b>' + fmt(v.kcal) + ' kcal</b>'; }
function addRecipeLog(){
  const v = recipeCalc(); if (!v || !(v.kcal > 0)){ toast('Alege cât ai mâncat.'); return; }
  const k = S.view, meal = S.mini.meal;
  const e = normEntry({ id: newId(), name: v.name, grams: v.grams, kcal: v.kcal, protein: v.protein, carbs: v.carbs, fat: v.fat, meal, at: Date.now(), src: 'recipe' });
  closeMini(); closeSheet('#libSheet');
  mutateDay(k, d => d.entries.push(e));
  toast('Adăugat la ' + mealName(meal) + ' · ' + fmt(e.kcal) + ' kcal', 'Anulează', () => mutateDay(k, d => { d.entries = d.entries.filter(x => x.id !== e.id); }));
}

/* weekly report */
function reportRow(){
  if (!S.profile) return '';
  const last = S.library.reports[0], sunday = new Date().getDay() === 0;
  if (S.aiOff && !last) return '';
  return '<div class="report-row">' +
    (S.aiOff ? '<span></span>' : '<button class="btn ' + (sunday ? 'primary' : 'soft') + ' sm" data-action="report-new">' + (sunday ? 'Fă raportul de duminică' : 'Raportul săptămânii') + '</button>') +
    (last ? '<button class="rm" data-action="report-open">Ultimul raport: ' + esc(shortDate(last.id)) + '</button>' : '') + '</div>';
}
function closeMini(){ if (S.repCtl){ S.repCtl.abort(); S.repCtl = null; } closeSheet('#miniSheet'); S.mini = null; }
function openReport(){
  const r = S.library.reports[0]; if (!r) return;
  S.mini = { kind: 'report', state: 'done', report: r };
  renderReport(); showSheet('#miniSheet'); $('#miniTitle').focus({ preventScroll: true });
}
function renderReport(){
  const m = S.mini; if (!m || m.kind !== 'report') return;
  let body = '';
  if (m.state === 'loading'){
    body = '<div class="status" style="margin-top:0"><span class="spin" aria-hidden="true"></span><p>Claude analizează ultimele 7 zile…<small>Durează de obicei 20–60 de secunde.</small></p><button class="btn ghost sm" data-action="close-mini">Oprește</button></div>';
  } else if (m.state === 'error'){
    body = '<p class="err" style="margin-top:0">' + esc(m.msg) + '</p>' + (m.retry ? '<div class="row" style="margin-top:12px"><button class="btn soft sm" data-action="report-new">Încearcă din nou</button></div>' : '');
  } else {
    const R = m.report.data;
    body = '<div class="rep"><div class="rep-top"><div><span class="meta">7 zile până la ' + esc(shortDate(m.report.id)) + '</span><h3 class="rep-title">' + esc(R.title) + '</h3></div>' +
      (R.score != null ? '<div class="score" aria-label="Nota ' + R.score + ' din 10"><b>' + R.score + '</b><span>/10</span></div>' : '') + '</div>' +
      (R.summary ? '<p>' + esc(R.summary) + '</p>' : '') +
      (R.wins.length ? '<h4>Ce a mers bine</h4><ul>' + R.wins.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '') +
      (R.fixes.length ? '<h4>De ajustat</h4><ul>' + R.fixes.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '') +
      (R.focus ? '<div class="focus"><span class="lbl">Focus pentru săptămâna viitoare</span><p>' + esc(R.focus) + '</p></div>' : '') + '</div>' +
      (S.aiOff ? '' : '<div class="row" style="margin-top:16px"><button class="rm" data-action="report-new">Refă raportul cu datele de acum</button></div>') +
      '<p class="hint" style="margin-top:12px">Raport generat de AI (Claude). Nu e sfat medical.</p>';
  }
  $('#miniCard').innerHTML = sheetHead('miniTitle', 'Raportul săptămânii', 'close-mini') + body;
}
async function makeReport(){
  if (!S.profile) return;
  if (S.repCtl) S.repCtl.abort();
  const ctl = new AbortController(); S.repCtl = ctl;
  S.mini = { kind: 'report', state: 'loading' };
  renderReport();
  if ($('#miniSheet').hidden){ showSheet('#miniSheet'); $('#miniTitle').focus({ preventScroll: true }); }
  const today = todayKey(), rows = [];
  for (let i = 6; i >= 0; i--){ const k = addDays(today, -i); const d = getDay(k); rows.push({ k, d, t: dayTotals(d), T: targetsFor(k) }); }
  const logged = rows.filter(r => r.t.n > 0);
  if (logged.length < 2){
    if (S.repCtl === ctl) S.repCtl = null;
    S.mini = { kind: 'report', state: 'error', msg: 'Notează mesele în cel puțin două zile din ultima săptămână, ca raportul să aibă din ce să tragă concluzii.' };
    renderReport(); return;
  }
  const foods = {};
  logged.forEach(r => r.d.entries.forEach(e => { foods[e.name] = (foods[e.name] || 0) + 1; }));
  const top = Object.entries(foods).sort((a, b) => b[1] - a[1]).slice(0, 12).map(x => x[0] + ' (' + x[1] + 'x)').join('; ');
  const lines = rows.map(r => '- ' + dateLine(r.k) + (r.T.type ? ' [' + (r.T.type === 'train' ? 'zi de sală' : 'zi de pauză') + ']' : '') + ': ' +
    (r.t.n ? Math.round(r.t.kcal) + ' kcal din ' + r.T.kcal + '; proteine ' + Math.round(r.t.protein) + ' g din ' + r.T.protein + '; glucide ' + Math.round(r.t.carbs) + ' g din ' + r.T.carbs + '; grăsimi ' + Math.round(r.t.fat) + ' g din ' + r.T.fat : 'mesele nu au fost notate') +
    '; apă ' + (r.d.water || 0) + ' ml din ' + r.T.water + (r.d.weight ? '; greutate ' + r.d.weight + ' kg' : ''));
  const goal = GOALS.find(g => g.id === S.profile.goal);
  const prompt = [
    'Ești un antrenor de nutriție prietenos și direct. Analizează ultima săptămână a utilizatorului și scrie în română, simplu, fără jargon.',
    goal ? 'Obiectivul lui: ' + goal.t.toLowerCase() + ' (' + goal.d + ').' : '',
    'Zilele:', lines.join('\n'),
    'Ce a mâncat cel mai des: ' + (top || '-') + '.',
    'Reguli: fii concret și folosește cifrele. Nu da sfaturi medicale, nu pune diagnostice și nu vorbi despre boli. Dacă vezi zile cu foarte puține calorii, sub 1.000, nu lăuda restricția: spune blând că e important să mănânce suficient și că, dacă îi e greu cu mâncatul, poate vorbi cu un medic. Zilele nenotate nu înseamnă că nu a mâncat, doar că nu a notat. Nota 0–10 arată cât de aproape a fost de ținte și cât de constant a notat.',
    'Răspunde doar cu JSON în forma:',
    '{"title":"Titlu scurt al săptămânii","score":7,"summary":"2-3 propoziții","wins":["ce a mers bine"],"fixes":["ce să ajusteze, concret"],"focus":"un singur obiectiv clar pentru săptămâna viitoare"}'
  ].filter(Boolean).join('\n');
  try {
    const sample = await S.samplePromise;
    if (ctl.signal.aborted) return;
    if (!sample){ S.noSample = true; S.aiOff = true; renderTabs(); S.mini = { kind: 'report', state: 'error', msg: 'Raportul cu Claude nu e disponibil aici.' }; renderReport(); renderHistory(); return; }
    const res = await sample.json(prompt, { signal: ctl.signal, cache: false });
    if (ctl.signal.aborted || !S.mini || S.mini.kind !== 'report') return;
    const entry = { id: today, at: Date.now(), data: normReport(res) };
    S.library.reports = [entry].concat(S.library.reports.filter(r => r.id !== today)).slice(0, 8);
    libChanged();
    S.mini = { kind: 'report', state: 'done', report: entry };
    renderReport();
  } catch (e) {
    if (ctl.signal.aborted || !S.mini) return;
    const m = sampleErrMsg(e);
    S.mini = { kind: 'report', state: 'error', msg: m || 'Raportul nu e disponibil aici.', retry: !!m };
    renderReport();
  } finally {
    if (S.repCtl === ctl) S.repCtl = null;
  }
}

/* ---------- barcode ---------- */
const ZX_URLS = ['https://unpkg.com/@zxing/library@0.21.3/umd/index.min.js', 'https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js'];
let zxingPromise = null;
function loadScript(src){
  return new Promise((res, rej) => {
    const s = document.createElement('script'); let done = false;
    const t = setTimeout(() => { if (!done){ done = true; rej(new Error('timeout')); } }, 9000);
    s.src = src; s.async = true;
    s.onload = () => { if (!done){ done = true; clearTimeout(t); res(); } };
    s.onerror = () => { if (!done){ done = true; clearTimeout(t); rej(new Error('load')); } };
    document.head.appendChild(s);
  });
}
function loadZXing(){
  if (window.ZXing) return Promise.resolve(window.ZXing);
  if (!zxingPromise) zxingPromise = (async () => {
    for (const u of ZX_URLS){ try { await loadScript(u); if (window.ZXing) return window.ZXing; } catch (e) {} }
    zxingPromise = null; throw new Error('zxing');
  })();
  return zxingPromise;
}
function validCode(c){
  if (!/^(\d{8}|\d{12,14})$/.test(c)) return false;
  const d = c.split('').map(Number), check = d.pop();
  let sum = 0; d.reverse().forEach((n, i) => { sum += n * (i % 2 === 0 ? 3 : 1); });
  return (10 - sum % 10) % 10 === check;
}
function normProduct(p){
  if (!p || !p.code) return null;
  const code = String(p.code).replace(/\D/g, '').slice(0, 14); if (code.length < 6) return null;
  const per = p.per100 || {}, kcal = num(per.kcal);
  if (!(kcal >= 0)) return null;
  const sv = num(p.serving), pk = num(p.pack);
  return { code, name: String(p.name || ('Produs ' + code)).trim().slice(0, 80), unit: p.unit === 'ml' ? 'ml' : 'g',
    per100: { kcal: Math.round(kcal), protein: Math.max(0, r1(num(per.protein) || 0)), carbs: Math.max(0, r1(num(per.carbs) || 0)), fat: Math.max(0, r1(num(per.fat) || 0)) },
    serving: sv > 0 ? Math.round(sv) : null, pack: pk > 0 ? Math.round(pk) : null, at: Number(p.at) || Date.now() };
}
function drawScaled(bmp, maxSide, rot){
  const w = bmp.width || bmp.naturalWidth, h = bmp.height || bmp.naturalHeight;
  const sc = Math.min(1, maxSide / Math.max(w, h)), W = Math.round(w * sc), H = Math.round(h * sc);
  const c = document.createElement('canvas'); const ctx = c.getContext('2d', { willReadFrequently: true });
  if (rot === 90){ c.width = H; c.height = W; ctx.translate(H, 0); ctx.rotate(Math.PI / 2); } else { c.width = W; c.height = H; }
  ctx.drawImage(bmp, 0, 0, W, H);
  return c;
}
function lumSource(Z, canvas){
  if (Z.HTMLCanvasElementLuminanceSource) return new Z.HTMLCanvasElementLuminanceSource(canvas);
  const d = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
  const g = new Uint8ClampedArray(canvas.width * canvas.height);
  for (let i = 0, j = 0; i < d.length; i += 4, j++) g[j] = (d[i] * 306 + d[i + 1] * 601 + d[i + 2] * 117) >> 10;
  return new Z.RGBLuminanceSource(g, canvas.width, canvas.height);
}
async function decodeBarcode(file){
  const bmp = await loadBitmap(file);
  if ('BarcodeDetector' in window){
    try {
      const det = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] });
      const r = await det.detect(bmp);
      if (r && r[0] && r[0].rawValue) return String(r[0].rawValue);
    } catch (e) {}
  }
  let Z = null;
  try { Z = await loadZXing(); } catch (e) { return null; }
  const hints = new Map();
  hints.set(Z.DecodeHintType.TRY_HARDER, true);
  hints.set(Z.DecodeHintType.POSSIBLE_FORMATS, [Z.BarcodeFormat.EAN_13, Z.BarcodeFormat.EAN_8, Z.BarcodeFormat.UPC_A, Z.BarcodeFormat.UPC_E, Z.BarcodeFormat.CODE_128]);
  const reader = new Z.MultiFormatReader(); reader.setHints(hints);
  for (const side of [1200, 1800, 800]) for (const rot of [0, 90]){
    await sleep(0);
    try {
      const r = reader.decode(new Z.BinaryBitmap(new Z.HybridBinarizer(lumSource(Z, drawScaled(bmp, side, rot)))));
      if (r && r.getText()) return r.getText();
    } catch (e) {}
  }
  return null;
}
async function aiReadCode(blob){
  const sample = await S.samplePromise;
  if (!sample || S.aiOff || !S.imgLimits) return null;
  try {
    const res = await sample.json('Imaginea ar trebui să arate codul de bare al unui produs. Citește cifrele tipărite sub codul de bare (EAN sau UPC). Răspunde doar cu JSON în forma {"code":"5941234567890"}, sau {"code":null} dacă cifrele nu se văd clar.', { images: [blob], modelTier: 'quick' });
    const c = String((res && res.code) || '').replace(/\D/g, '');
    return c.length >= 8 ? c : null;
  } catch (e) { return null; }
}
async function onBarcodePhoto(file){
  if (!file) return;
  showErr('');
  S.bc = { state: 'scanning' }; renderBarcode();
  let code = null;
  try { code = await decodeBarcode(file); } catch (e) { code = null; }
  if (!code && S.imgLimits && !S.aiOff){
    S.bc = { state: 'scanning', ai: true }; renderBarcode();
    try { code = await aiReadCode(await prepareImage(file)); } catch (e) { code = null; }
  }
  $('#bcInput').value = '';
  if (!code){ S.bc = { state: 'error', msg: 'Nu am putut citi codul. Fă poza mai de aproape, cu codul drept și bine luminat, sau scrie cifrele de sub cod.' }; renderBarcode(); return; }
  $('#bcCode').value = code;
  lookupCode(code);
}
function lookupCode(raw){
  const code = String(raw || '').replace(/\D/g, '');
  if (code.length < 8){ S.bc = { state: 'error', msg: 'Codul de bare are de obicei 8 sau 13 cifre. Verifică cifrele.' }; renderBarcode(); return; }
  const p = S.library.products.find(x => x.code === code);
  if (p) S.bc = { state: 'found', code, qty: String(p.serving || 100) };
  else S.bc = { state: 'new', code, warn: !validCode(code), draft: { name: '', unit: 'g', kcal: '', protein: '', carbs: '', fat: '', serving: '', pack: '' } };
  renderBarcode();
}
const bcProduct = () => S.bc && S.library.products.find(x => x.code === S.bc.code);
function bcCalc(){
  const p = bcProduct(), q = num(S.bc && S.bc.qty);
  if (!p || !(q > 0)) return null;
  const f = q / 100;
  return { p, q, kcal: Math.round(p.per100.kcal * f), protein: r1(p.per100.protein * f), carbs: r1(p.per100.carbs * f), fat: r1(p.per100.fat * f) };
}
function updateBcPrev(){
  const el = $('#bcPrev'); if (!el) return;
  const v = bcCalc();
  el.innerHTML = v ? mxHtml(v.protein, v.carbs, v.fat) + '<b>' + fmt(v.kcal) + ' kcal</b>' : '<span class="hint">Scrie cantitatea.</span><b>–</b>';
}
function renderBarcode(){
  const el = $('#bcResult'); if (!el) return;
  const B = S.bc;
  if (!B){ el.innerHTML = ''; return; }
  if (B.state === 'scanning'){
    el.innerHTML = '<div class="status" style="margin-top:0"><span class="spin" aria-hidden="true"></span><p>' + (B.ai ? 'Claude citește cifrele codului…' : 'Citesc codul de bare…') + '</p></div>';
    return;
  }
  if (B.state === 'error'){ el.innerHTML = '<p class="err" style="margin-top:0">' + esc(B.msg) + '</p>'; return; }
  if (B.state === 'found'){
    const p = bcProduct(); if (!p){ S.bc = null; el.innerHTML = ''; return; }
    const chips = [];
    if (p.serving) chips.push([p.serving, 'O porție (' + fmt(p.serving) + ' ' + p.unit + ')']);
    chips.push([100, '100 ' + p.unit]);
    if (p.pack && p.pack !== 100) chips.push([p.pack, 'Tot pachetul (' + fmt(p.pack) + ' ' + p.unit + ')']);
    el.innerHTML = '<div class="bc-card"><div class="bc-top"><div><b>' + esc(p.name) + '</b><span class="meta">La 100 ' + p.unit + ': ' + fmt(p.per100.kcal) + ' kcal · P ' + fmt1(p.per100.protein) + ' · G ' + fmt1(p.per100.carbs) + ' · Gr ' + fmt1(p.per100.fat) + '</span></div><button class="rm" data-action="bc-edit">Editează</button></div>' +
      '<span class="lbl">Cât ai mâncat</span><div class="row">' + chips.map(c => '<button class="chip" data-action="bc-qty" data-q="' + c[0] + '" aria-pressed="' + (num(B.qty) === c[0]) + '">' + esc(c[1]) + '</button>').join('') + '</div>' +
      '<div class="unit"><label class="sr" for="bcQty">Cantitate</label><input type="text" inputmode="decimal" id="bcQty" value="' + esc(B.qty) + '"><em>' + p.unit + '</em></div>' +
      '<div class="ptotal" id="bcPrev"></div>' +
      '<div class="row"><button class="btn ghost" data-action="bc-cancel">Renunță</button><button class="btn primary wide" data-action="bc-add">Adaugă la ' + mealName(S.meal) + '</button></div></div>';
    updateBcPrev();
    return;
  }
  const d = B.draft, canAI = !S.aiOff && !!S.imgLimits;
  const accept = (S.imgLimits && S.imgLimits.mediaTypes && S.imgLimits.mediaTypes.join(',')) || 'image/jpeg,image/png,image/webp';
  const field = (id, label, key, unit, cls, mode) => '<div class="' + (cls || '') + '"><label class="lbl" for="' + id + '">' + label + '</label>' + (unit ? '<div class="unit">' : '') + '<input type="text" id="' + id + '"' + (mode ? ' inputmode="' + mode + '"' : '') + ' value="' + esc(d[key]) + '">' + (unit ? '<em>' + unit + '</em></div>' : '') + '</div>';
  el.innerHTML = '<div class="bc-card"><div class="bc-top"><div><b>' + (B.editing ? 'Editează produsul' : 'Produs nou') + '</b><span class="meta">Cod ' + esc(B.code) + (B.warn ? ' · verifică cifrele, codul pare incomplet' : '') + '</span></div></div>' +
    (B.editing ? '' : '<p class="hint">Nu e încă în lista ta. ' + (canAI ? 'Fotografiază tabelul cu valori nutriționale de pe ambalaj sau completează manual.' : 'Completează valorile de pe etichetă.') + ' Îl salvez, ca data viitoare să-l găsești instant.</p>') +
    (canAI ? '<label class="photo-pick" for="bcLabelInput"><input type="file" id="bcLabelInput" accept="' + accept + '"><span class="ph">' + CAM_ICON + '</span><span><b>Fotografiază eticheta</b><span>tabelul „Valori nutriționale”</span></span></label>' : '') +
    (B.reading ? '<div class="status" style="margin-top:0"><span class="spin" aria-hidden="true"></span><p>Claude citește eticheta…<small>Durează de obicei 10–30 de secunde.</small></p></div>' : '') +
    (B.note ? '<p class="hint">' + esc(B.note) + '</p>' : '') +
    (B.err ? '<p class="err" style="margin-top:0">' + esc(B.err) + '</p>' : '') +
    '<div class="mgrid">' +
      field('bpName', 'Nume produs', 'name', '', 'full') +
      '<div class="full"><span class="lbl">Valorile sunt la</span><div class="row" style="margin-top:6px">' + ['g', 'ml'].map(u => '<button class="chip" data-action="bc-unit" data-u="' + u + '" aria-pressed="' + (d.unit === u) + '">100 ' + u + '</button>').join('') + '</div></div>' +
      field('bpK', 'Calorii', 'kcal', 'kcal', 'half', 'decimal') +
      field('bpP', 'Proteine', 'protein', 'g', 'half', 'decimal') +
      field('bpC', 'Glucide', 'carbs', 'g', 'half', 'decimal') +
      field('bpF', 'Grăsimi', 'fat', 'g', 'half', 'decimal') +
      field('bpServ', 'O porție', 'serving', d.unit, 'half', 'decimal') +
      field('bpPack', 'Tot pachetul', 'pack', d.unit, 'half', 'decimal') +
    '</div>' +
    '<p class="ferr" id="bpErr"></p>' +
    '<div class="row"><button class="btn ghost" data-action="bc-cancel">Renunță</button><button class="btn primary wide" data-action="bc-save">Salvează produsul</button></div></div>';
}
const LABEL_PROMPT = [
  'Imaginea arată eticheta unui produs alimentar, cu tabelul de valori nutriționale.',
  'Citește valorile la 100 g sau la 100 ml. Dacă sunt date doar pe porție, calculează-le la 100.',
  'Răspunde doar cu JSON în această formă:',
  '{"name":"numele produsului, scurt","unit":"g","per100":{"kcal":250,"kj":1046,"protein":10,"carbs":30,"fat":9},"serving":30,"package":400}',
  'unit este "g" sau "ml". serving = cantitatea unei porții dacă e scrisă pe etichetă, altfel null. package = cantitatea netă din ambalaj dacă se vede, altfel null. Dacă numele nu se vede, descrie produsul pe scurt.',
  'Dacă imaginea nu arată un tabel cu valori nutriționale, întoarce {"per100":null}.'
].join('\n');
async function readLabel(file){
  if (!file || !S.bc || S.bc.state !== 'new') return;
  const B = S.bc; B.reading = true; B.err = ''; B.note = ''; renderBarcode();
  if (S.bcCtl) S.bcCtl.abort();
  const ctl = new AbortController(); S.bcCtl = ctl;
  try {
    const blob = await prepareImage(file);
    const sample = await S.samplePromise;
    if (!sample) throw { code: 'not_granted' };
    const res = await sample.json(LABEL_PROMPT, { images: [blob], signal: ctl.signal, modelTier: 'default' });
    if (ctl.signal.aborted || S.bc !== B) return;
    const per = res && res.per100;
    if (!per){ B.err = 'Nu am găsit tabelul cu valori nutriționale. Fă poza mai de aproape, doar pe tabel.'; return; }
    let kcal = num(per.kcal); if (!(kcal > 0) && num(per.kj) > 0) kcal = num(per.kj) / 4.184;
    B.draft = { name: String((res && res.name) || '').slice(0, 80), unit: res.unit === 'ml' ? 'ml' : 'g', kcal: inVal(Math.round(kcal)), protein: inVal(num(per.protein)), carbs: inVal(num(per.carbs)), fat: inVal(num(per.fat)),
      serving: num(res.serving) > 0 ? String(Math.round(num(res.serving))) : '', pack: num(res.package) > 0 ? String(Math.round(num(res.package))) : '' };
    B.note = 'Am completat valorile de pe etichetă. Verifică-le, apoi salvează.';
  } catch (e) {
    if (ctl.signal.aborted) return;
    const m = sampleErrMsg(e); B.err = m || 'Citirea etichetei nu e disponibilă aici. Completează valorile manual.';
  } finally {
    if (S.bcCtl === ctl) S.bcCtl = null;
    const inp = $('#bcLabelInput'); if (inp) inp.value = '';
    if (S.bc === B){ B.reading = false; renderBarcode(); }
  }
}
function saveProduct(){
  const B = S.bc; if (!B || B.state !== 'new') return;
  const d = B.draft, err = $('#bpErr');
  if (!(num(d.kcal) >= 0)){ err.textContent = 'Completează caloriile la 100 ' + d.unit + '.'; return; }
  const p = normProduct({ code: B.code, name: d.name.trim() || ('Produs ' + B.code), unit: d.unit, per100: { kcal: num(d.kcal), protein: num(d.protein), carbs: num(d.carbs), fat: num(d.fat) }, serving: num(d.serving), pack: num(d.pack) });
  if (!p){ err.textContent = 'Verifică valorile introduse.'; return; }
  const i = S.library.products.findIndex(x => x.code === p.code);
  if (i >= 0) S.library.products[i] = p; else S.library.products.unshift(p);
  libChanged();
  S.bc = { state: 'found', code: p.code, qty: String(p.serving || 100) };
  renderBarcode();
  toast('Produs salvat: ' + p.name);
}
function addBarcodeEntry(){
  const v = bcCalc(); if (!v){ toast('Scrie cât ai mâncat.'); return; }
  const k = S.view, meal = S.meal;
  const e = normEntry({ id: newId(), name: v.p.name + ' · ' + fmt(v.q) + ' ' + v.p.unit, grams: v.q, kcal: v.kcal, protein: v.protein, carbs: v.carbs, fat: v.fat, meal, at: Date.now(), src: 'barcode' });
  mutateDay(k, d => d.entries.push(e));
  S.bc = null; renderBarcode(); $('#bcCode').value = '';
  toast('Adăugat la ' + mealName(meal) + ' · ' + fmt(e.kcal) + ' kcal', 'Anulează', () => mutateDay(k, d => { d.entries = d.entries.filter(x => x.id !== e.id); }));
}
function delProduct(code){
  const i = S.library.products.findIndex(p => p.code === code); if (i < 0) return;
  const p = S.library.products.splice(i, 1)[0];
  libChanged();
  toast('Șters: ' + p.name, 'Anulează', () => { S.library.products.splice(i, 0, p); libChanged(); });
}

/* ---------- snow (falls from the top) ---------- */
const Snow = { kind: null, on: false, raf: 0, flakes: [], cvs: null, ctx: null, color: '', dark: true, sprites: [], w: 0, h: 0, last: 0 };
function fallKind(){
  const fx = THEMES[S.theme] && THEMES[S.theme].logo.fx;
  if (fx === 'xmas' && lsGet('portia-snow') !== false) return 'snow';
  if (fx === 'bloom' && lsGet('portia-petals') !== false) return 'petals';
  return null;
}
function snowEnabled(){ return !!fallKind(); }
function drawIce(){
  const fx = $('#iceFx'), top = $('#iceTop'); if (!fx || !top) return;
  const w = Math.max(320, window.innerWidth), h = Math.max(480, window.innerHeight), rnd = iceRng(7), diag = Math.hypot(w, h);
  let svg = '';
  const spots = [];
  if (iceCracksOn()){
    const cr = [], r2 = iceRng(41);
    crackTree(r2, [w * 0.76, -10], [w * 0.36, h * 0.5], 3.2, 2, 7, cr, true);
    crackTree(r2, [w + 10, h * 0.5], [w * 0.3, h + 10], 2.8, 2, 7, cr, true);
    crackTree(r2, [-10, h * 0.8], [w * 0.4, h * 0.62], 2, 1, 6, cr, true);
    svg = '<defs><filter id="iceCrackBlur" filterUnits="userSpaceOnUse" x="0" y="0" width="' + w + '" height="' + h + '"><feGaussianBlur stdDeviation="3"/></filter></defs>' +
      '<path d="' + crackPath(cr, 3.4) + '" style="fill:var(--crack-glow)" filter="url(#iceCrackBlur)"/>' +
      '<path d="' + crackPath(cr, 1.2) + '" style="fill:var(--crack-lo)" transform="translate(.7 .9)"/><path d="' + crackPath(cr, 1) + '" style="fill:var(--crack-hi)"/>';
    cr.slice(0, 12).forEach(c => { const pt = c.pts[Math.floor(c.pts.length * (0.2 + rnd() * 0.6))]; if (pt[0] > 12 && pt[0] < w - 12 && pt[1] > 44 && pt[1] < h - 12) spots.push(pt); });
  }
  while (spots.length < 10) spots.push([12 + rnd() * (w - 24), 50 + rnd() * (h - 70)]);
  let sparks = '';
  spots.slice(0, 12).forEach(pt => {
    const sz = 6 + rnd() * 7;
    sparks += '<i class="spark" style="left:' + pt[0].toFixed(0) + 'px;top:' + pt[1].toFixed(0) + 'px;width:' + sz.toFixed(1) + 'px;height:' + sz.toFixed(1) + 'px;animation-delay:' + (-rnd() * 4.2).toFixed(2) + 's;animation-duration:' + (3.4 + rnd() * 2.4).toFixed(2) + 's"></i>';
  });
  fx.innerHTML = '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none">' + svg + '</svg>' + sparks;
  const drips = [];
  for (let x = 6 + rnd() * 6; x < w - 6; x += 9 + rnd() * 13){
    const long = rnd() < 0.22;
    drips.push([x, 6 + rnd() * 5, long ? 16 + rnd() * 12 : 4 + rnd() * 9]);
  }
  const d = iciclePath(w, 5, drips);
  top.innerHTML = '<svg viewBox="0 0 ' + w + ' 34" preserveAspectRatio="none"><defs><linearGradient id="iceDrip" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--ice-hi)"/><stop offset="1" style="stop-color:var(--ice-lo)"/></linearGradient></defs>' +
    '<path d="' + d + '" style="fill:var(--ice-shade)" transform="translate(0 1.6)"/><path d="' + d + '" fill="url(#iceDrip)" style="stroke:var(--ice-edge)" stroke-width=".8"/>' +
    drips.filter(dr => dr[2] > 6).map(dr => '<path d="M' + (dr[0] - dr[1] * 0.18).toFixed(1) + ' 6.5 L' + (dr[0] - 0.4).toFixed(1) + ' ' + (5 + dr[2] * 0.78).toFixed(1) + '" stroke="#FFFFFF" stroke-opacity=".95" stroke-width="1.1" stroke-linecap="round"/>').join('') +
    '<rect x="0" y="0" width="' + w + '" height="2.2" fill="#FFFFFF" opacity=".75"/>' + '</svg>';
}
function updateIce(){
  const on = !!(THEMES[S.theme] && THEMES[S.theme].logo.fx === 'ice');
  let fx = $('#iceFx'), top = $('#iceTop');
  if (!on){ if (fx) fx.remove(); if (top) top.remove(); return; }
  if (!fx){ fx = document.createElement('div'); fx.id = 'iceFx'; fx.setAttribute('aria-hidden', 'true'); document.body.prepend(fx); }
  if (!top){ top = document.createElement('div'); top.id = 'iceTop'; top.setAttribute('aria-hidden', 'true'); document.body.appendChild(top); }
  drawIce();
  if (!S.iceResize){ S.iceResize = true; let tm; window.addEventListener('resize', () => { clearTimeout(tm); tm = setTimeout(() => { if ($('#iceFx')) drawIce(); }, 150); }); }
}
function updateHud(){
  const on = !!(THEMES[S.theme] && THEMES[S.theme].logo.fx === 'hud');
  let el = $('#hudFx');
  if (!on){ if (el) el.remove(); return; }
  if (!el){ el = document.createElement('div'); el.id = 'hudFx'; el.setAttribute('aria-hidden', 'true'); el.innerHTML = '<i class="hud-floor"></i><i class="hud-scan"></i>'; document.body.prepend(el); }
}
function updateSnow(){
  const k = fallKind();
  if (k && k !== Snow.kind){ Snow.kind = k; Snow.flakes = []; Snow.color = ''; Snow.sprites = []; }
  if (k) startSnow(); else stopSnow();
}
const PETAL_TONES = [['#FFF5F8', '#FFC1D4'], ['#FFE3EC', '#FF9EBB'], ['#FFD6E4', '#F7679A'], ['#FFFFFF', '#FFB3C8'], ['#FFE9F0', '#E8508A']];
function makePetalSprite(tone, shadow, blur){
  const px = 90, c = document.createElement('canvas'); c.width = px; c.height = px;
  const g = c.getContext('2d'), R = 30;
  g.translate(px / 2, px / 2);
  const gr = g.createLinearGradient(0, -R, 0, R); gr.addColorStop(0, tone[0]); gr.addColorStop(1, tone[1]);
  g.fillStyle = gr; g.shadowColor = shadow; g.shadowBlur = blur;
  g.beginPath(); g.moveTo(0, R);
  g.bezierCurveTo(-0.78 * R, 0.35 * R, -0.72 * R, -0.62 * R, -0.28 * R, -0.95 * R);
  g.lineTo(0, -0.7 * R); g.lineTo(0.28 * R, -0.95 * R);
  g.bezierCurveTo(0.72 * R, -0.62 * R, 0.78 * R, 0.35 * R, 0, R);
  g.fill();
  g.shadowBlur = 0; g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(0, 0.82 * R); g.quadraticCurveTo(-0.08 * R, 0, 0, -0.6 * R); g.stroke();
  return c;
}
/* Six-armed crystal designs: side branches as [position along the arm, length, angle], plus a hexagon core and tip style */
const FLAKE_DESIGNS = [
  { br: [[0.32, 0.26, 0.8], [0.56, 0.34, 0.8], [0.8, 0.2, 0.8]], hex: 0, tip: 0 },
  { br: [[0.28, 0.2, 1.05], [0.48, 0.34, 1.05], [0.68, 0.28, 1.05], [0.86, 0.14, 1.05]], hex: 0.2, tip: 0 },
  { br: [[0.4, 0.4, 0.75], [0.7, 0.24, 0.75]], hex: 0.24, tip: 1 },
  { br: [[0.22, 0.16, 1.05], [0.38, 0.27, 1.05], [0.54, 0.32, 1.05], [0.7, 0.25, 1.05], [0.85, 0.14, 1.05]], hex: 0, tip: 0 },
  { br: [[0.36, 0.3, 0.7], [0.36, 0.3, 2.2], [0.64, 0.26, 0.8], [0.84, 0.14, 0.8]], hex: 0.16, tip: 1 }
];
function makeDotSprite(color, shadow, blur){
  const c = document.createElement('canvas'); c.width = 24; c.height = 24;
  const g = c.getContext('2d');
  g.shadowColor = shadow; g.shadowBlur = blur; g.fillStyle = color;
  g.beginPath(); g.arc(12, 12, 5.5, 0, Math.PI * 2); g.fill();
  return c;
}
function makeFlakeSprite(design, color, shadow, blur){
  const size = 64, pad = 1.4, px = Math.ceil(size * pad);
  const c = document.createElement('canvas'); c.width = px; c.height = px;
  const g = c.getContext('2d'); const R = size / 2;
  g.translate(px / 2, px / 2);
  g.strokeStyle = color; g.fillStyle = color; g.lineCap = 'round'; g.lineJoin = 'round';
  g.shadowColor = shadow; g.shadowBlur = blur;
  for (let i = 0; i < 6; i++){
    g.save(); g.rotate(i * Math.PI / 3);
    g.lineWidth = 4.6; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -R * 0.96); g.stroke();
    g.lineWidth = 3.6;
    for (const b of design.br){
      const y = -R * b[0], l = R * b[1], dx = Math.sin(b[2]) * l, dy = -Math.cos(b[2]) * l;
      g.beginPath(); g.moveTo(0, y); g.lineTo(dx, y + dy); g.moveTo(0, y); g.lineTo(-dx, y + dy); g.stroke();
    }
    if (design.tip){ g.beginPath(); g.arc(0, -R * 0.96, 2.6, 0, Math.PI * 2); g.fill(); }
    g.restore();
  }
  if (design.hex){
    g.lineWidth = 2.4; g.beginPath();
    for (let i = 0; i <= 6; i++){ const a = i * Math.PI / 3 - Math.PI / 2, x = Math.cos(a) * R * design.hex, y = Math.sin(a) * R * design.hex; i ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke();
  }
  return c;
}
function snowColor(){
  const r = document.documentElement, t = r.getAttribute('data-theme');
  const dark = t === 'dark' || (t !== 'light' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
  const key = (Snow.kind || 'snow') + (dark ? '-dark' : '-light');
  if (key === Snow.color && Snow.sprites.length) return;
  Snow.color = key; Snow.dark = dark;
  if (Snow.kind === 'petals'){
    Snow.sprites = PETAL_TONES.map(t => makePetalSprite(t, dark ? 'rgba(255,140,180,0.55)' : 'rgba(150,30,80,0.28)', dark ? 10 : 6));
    Snow.dot = makeDotSprite('#FFC1D4', dark ? 'rgba(255,140,180,0.6)' : 'rgba(150,30,80,0.3)', 4);
    return;
  }
  const shadow = dark ? 'rgba(255,255,255,0.75)' : 'rgba(30,60,100,0.6)', blur = dark ? 8 : 6;
  Snow.sprites = FLAKE_DESIGNS.map(d => makeFlakeSprite(d, '#FFFFFF', shadow, blur));
  Snow.dot = makeDotSprite('#FFFFFF', shadow, dark ? 5 : 4);
}
function sizeSnow(){
  const c = Snow.cvs; if (!c) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  Snow.w = window.innerWidth; Snow.h = window.innerHeight;
  c.width = Math.round(Snow.w * dpr); c.height = Math.round(Snow.h * dpr);
  c.style.width = Snow.w + 'px'; c.style.height = Snow.h + 'px';
  Snow.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
/* depth z: 0 = far (small soft dots), 1 = near (large crystals, faster, more opaque) */
function newFlake(anywhere){
  if (Snow.kind === 'petals'){
    const z = Math.pow(Math.random(), 1.2), size = 6 + z * 9;
    return {
      x: Math.random() * (Snow.w + 40) - 20, y: anywhere ? Math.random() * Snow.h : -size * 2 - 10, z, crystal: true, size, petal: true,
      sp: Math.floor(Math.random() * PETAL_TONES.length),
      vy: 14 + z * 30 + Math.random() * 8, sway: 16 + z * 26, ph: Math.random() * Math.PI * 2, fs: 0.4 + Math.random() * 0.7,
      rot: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 1.8, fl: Math.random() * Math.PI * 2, fv: 1.2 + Math.random() * 2, a: 0.7 + z * 0.3
    };
  }
  const z = Math.pow(Math.random(), 1.4);
  const crystal = z > 0.3;
  const size = crystal ? 5 + z * 11 : 1.4 + z * 3;
  return {
    x: Math.random() * (Snow.w + 40) - 20, y: anywhere ? Math.random() * Snow.h : -size - 10, z, crystal, size,
    sp: Math.floor(Math.random() * FLAKE_DESIGNS.length),
    vy: 20 + z * 55 + Math.random() * 12, sway: 5 + z * 18, ph: Math.random() * Math.PI * 2, fs: 0.5 + Math.random() * 0.9,
    rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 1.1, a: crystal ? 0.55 + z * 0.45 : 0.35 + z * 0.5
  };
}
function drawSnow(){
  const g = Snow.ctx; if (!g) return;
  g.clearRect(0, 0, Snow.w, Snow.h);
  for (const f of Snow.flakes){
    const x = f.x + Math.sin(f.ph) * f.sway;
    g.globalAlpha = Snow.dark ? f.a : Math.min(1, f.a * 0.9);
    if (f.petal && Snow.sprites[f.sp]){
      const s = f.size * 2;
      g.save(); g.translate(x, f.y); g.rotate(f.rot); g.scale(Math.max(0.22, Math.abs(Math.cos(f.fl))), 1);
      g.drawImage(Snow.sprites[f.sp], -s / 2, -s / 2, s, s);
      g.restore();
    } else if (f.crystal && Snow.sprites[f.sp]){
      const s = f.size * 1.4;
      g.save(); g.translate(x, f.y); g.rotate(f.rot);
      g.drawImage(Snow.sprites[f.sp], -s / 2, -s / 2, s, s);
      g.restore();
    } else if (Snow.dot){
      const s = f.size * 2.2;
      g.drawImage(Snow.dot, x - s / 2, f.y - s / 2, s, s);
    }
  }
  g.globalAlpha = 1;
}
function tickSnow(now){
  if (!Snow.on) return;
  let dt = (now - Snow.last) / 1000; Snow.last = now;
  dt = Math.max(0, Math.min(0.05, dt));
  const k = reduceMotion() ? 0.45 : 1;
  if (!document.hidden){
    for (const f of Snow.flakes){
      f.y += f.vy * dt * k; f.ph += f.fs * dt * k; f.rot += f.vr * dt * k; if (f.petal) f.fl += f.fv * dt * k;
      if (f.y > Snow.h + f.size + 10) Object.assign(f, newFlake(false));
    }
    drawSnow();
  }
  Snow.raf = requestAnimationFrame(tickSnow);
}
function startSnow(){
  if (!Snow.cvs){
    const c = document.createElement('canvas'); c.id = 'snow'; c.setAttribute('aria-hidden', 'true');
    document.body.appendChild(c); Snow.cvs = c; Snow.ctx = c.getContext('2d');
    window.addEventListener('resize', () => { if (Snow.cvs && !Snow.cvs.hidden){ sizeSnow(); drawSnow(); } });
  }
  Snow.cvs.hidden = false; sizeSnow(); snowColor();
  if (!Snow.flakes.length){ for (let i = 0, n = Snow.kind === 'petals' ? 26 : 95; i < n; i++) Snow.flakes.push(newFlake(true)); Snow.flakes.sort((a, b) => a.z - b.z); }
  drawSnow();
  if (!Snow.on){ Snow.on = true; Snow.last = performance.now(); Snow.raf = requestAnimationFrame(tickSnow); }
}
function stopSnow(){ Snow.on = false; cancelAnimationFrame(Snow.raf); if (Snow.cvs) Snow.cvs.hidden = true; }

/* ---------- toast ---------- */
let toastT = null, toastFn = null;
function toast(msg, label, fn){
  const el = $('#toast'), b = $('#toastBtn');
  $('#toastMsg').textContent = msg;
  toastFn = fn || null;
  b.hidden = !fn; b.textContent = label || '';
  el.hidden = false;
  clearTimeout(toastT);
  toastT = setTimeout(() => { el.hidden = true; toastFn = null; }, fn ? 6000 : 3500);
}

/* ---------- render ---------- */
function renderAll(){ renderSync(); renderHeader(); renderHero(); renderMeals(); renderTabs(); renderRecent(); renderPreview(); renderIdeas(); renderDiary(); renderWater(); renderFast(); renderWeight(); renderHistory(); }
function renderDayParts(){ renderHeader(); renderHero(); renderRecent(); renderDiary(); renderWater(); renderFast(); renderWeight(); renderHistory(); renderPreview(); }
function renderSync(){
  const el = $('#sync'); let st = 'idle', txt = 'Se încarcă…';
  if (S.mode === 'cloud'){
    const saving = S.restoring || anyBusy();
    st = S.syncErr ? 'err' : saving ? 'busy' : 'ok';
    txt = S.syncErr ? 'Problemă la salvare' : saving ? 'Se salvează…' : 'Salvat în contul tău';
  } else if (S.mode === 'local'){ st = 'ok'; txt = 'Salvat în acest browser'; }
  else if (S.mode === 'memory'){ st = 'err'; txt = 'Datele nu se pot salva aici'; }
  el.dataset.state = st; el.textContent = txt;
}
function renderHeader(){
  const t = todayKey();
  $('#dayName').textContent = dayWord(S.view);
  $('#dayDate').textContent = dateLine(S.view);
  $('#toToday').hidden = S.view >= addDays(t, -1);
  $('[data-action="next-day"]').disabled = S.view >= t;
  $('[data-action="prev-day"]').disabled = S.view <= addDays(t, -365);
  $('#logFor').textContent = S.view === t ? '' : 'se adaugă la ' + dayWord(S.view).toLowerCase();
}
function renderHero(){
  const el = $('#hero'); const p = S.profile;
  let ey = '<p class="eyebrow">Valori nutriționale · ' + esc(dayWord(S.view).toLowerCase()) + '</p>';
  if (p && S.loaded){
    checkBadges();
    const sn = streakNow(), nb = S.newBadge && Date.now() < S.newBadge.until ? S.newBadge : null;
    ey = '<div class="hero-head">' + ey + '<button class="streak' + (sn ? ' on' : '') + '" data-action="open-badges" aria-label="' + (sn ? 'Serie: ' + sn + (sn === 1 ? ' zi' : ' zile') + ' la rând. ' : '') + 'Vezi seriile și provocările.">' + bIcon(sn ? 'flame' : 'star', 16) + '<span>' + (sn ? sn + (sn === 1 ? ' zi' : ' zile') : 'Provocări') + '</span></button></div>' +
      (nb ? '<button class="newbadge" data-action="open-badges">' + bIcon(nb.icon, 18) + '<span>' + (nb.many ? 'Ai îndeplinit <b>' + nb.many + ' provocări</b> noi' : 'Provocare îndeplinită: <b>' + esc(nb.t) + '</b>') + '</span><em>Vezi</em></button>' : '');
  }
  if (!p){
    el.className = 'panel';
    el.innerHTML = ey + (S.loaded
      ? '<div class="hero-empty"><h2>Hai să-ți calculăm ținta zilnică</h2><p class="muted">Cinci întrebări scurte. Calculez caloriile și macronutrienții pentru tine, nu trebuie să știi niciun număr.</p><button class="btn primary" data-action="open-setup">Începe interviul</button></div>'
      : '<div class="hero-empty"><div class="skel" aria-hidden="true"></div><p class="muted">Se încarcă jurnalul tău…</p></div>');
    return;
  }
  const T = targetsFor(S.view), t = dayTotals(S.days[S.view]);
  const dayChip = T.type ? '<div class="dayrow"><button class="daytype ' + T.type + '" data-action="toggle-daytype" aria-label="' + (T.type === 'train' ? 'Zi de sală' : 'Zi de pauză') + '. Atinge ca să schimbi tipul zilei."><i></i>' + (T.type === 'train' ? 'Zi de sală · +' + fmt(T.delta) : 'Zi de pauză · −' + fmt(-T.delta)) + ' kcal</button><span class="hint">atinge ca să schimbi</span></div>' : '';
  const rem = T.kcal - t.kcal, over = rem < 0;
  const R = 88, C = 2*Math.PI*R, frac = T.kcal ? Math.min(1, t.kcal/T.kcal) : 0;
  const pct = T.kcal ? Math.round(t.kcal / T.kcal * 100) : 0;
  const remP = Math.round(T.protein - t.protein);
  const showIdeas = !S.aiOff && S.view === todayKey() && rem > 150;
  el.className = 'panel' + (over ? ' is-over' : '');
  el.innerHTML = ey + dayChip +
    '<div class="hero-top">' +
      '<div class="ringwrap"><svg viewBox="0 0 200 200" aria-hidden="true"><circle class="r-trk" cx="100" cy="100" r="' + R + '"/>' +
        (frac > 0 ? '<circle class="r-val" cx="100" cy="100" r="' + R + '" stroke-dasharray="' + C.toFixed(2) + '" stroke-dashoffset="' + (C*(1-frac)).toFixed(2) + '"/>' : '') +
      '</svg><div class="ring-center"><span class="big-num">' + (over ? '+' : '') + fmt(Math.abs(rem)) + '</span><small>' + (over ? 'kcal peste țintă' : 'kcal rămase') + '</small></div></div>' +
      '<dl class="kstats">' +
        '<div><dt>Țintă</dt><dd>' + fmt(T.kcal) + '<small>kcal · ' + fmt(T.kcal*4.184) + ' kJ</small></dd></div>' +
        '<div><dt>Mâncat</dt><dd>' + fmt(t.kcal) + '<small>kcal</small></dd></div>' +
        '<div><dt>Din țintă</dt><dd>' + pct + '<small>%</small></dd></div>' +
      '</dl>' +
    '</div>' +
    '<div class="macros">' + macroTile('p', 'Proteine', t.protein, T.protein) + macroTile('c', 'Glucide', t.carbs, T.carbs) + macroTile('f', 'Grăsimi', t.fat, T.fat) + '</div>' +
    (showIdeas ? '<div class="hero-foot"><p>' + (remP > 0 ? 'Mai ai ' + fmt(remP) + ' g proteine de luat azi.' : 'Ai atins proteinele de azi.') + '</p><button class="btn soft sm" data-action="ideas">Idei pentru ' + mealName(S.meal).toLowerCase() + '</button></div>' : '');
}
function macroTile(key, label, eaten, target){
  const r = 27, C = 2*Math.PI*r, frac = target ? Math.min(1, eaten/target) : 0;
  const over = target && eaten > target * 1.1;
  return '<div class="macro m-' + key + (over ? ' is-over' : '') + '"><div class="mring"><svg viewBox="0 0 66 66" width="66" height="66" aria-hidden="true"><circle class="trk" cx="33" cy="33" r="' + r + '"/>' +
    (frac > 0 ? '<circle class="val" cx="33" cy="33" r="' + r + '" stroke-dasharray="' + C.toFixed(2) + '" stroke-dashoffset="' + (C*(1-frac)).toFixed(2) + '"/>' : '') +
    '</svg><span>' + fmt(eaten) + '</span></div><b>' + label + '</b><em>din ' + fmt(target) + ' g</em></div>';
}
function renderMeals(){
  $('#meals').innerHTML = MEALS.map(m => '<button class="chip" role="radio" data-action="meal" data-meal="' + m.id + '" aria-checked="' + (m.id === S.meal) + '">' + m.t + '</button>').join('');
}
function renderTabs(){
  $$('#logger [data-tab]').forEach(b => {
    const t = b.dataset.tab;
    b.hidden = (t === 'text' && S.aiOff) || (t === 'photo' && (S.aiOff || S.photoOff));
    b.setAttribute('aria-selected', String(t === S.tab));
  });
  $$('#logger [data-pane]').forEach(p => p.hidden = p.dataset.pane !== S.tab);
  $('#aiNote').hidden = !S.aiOff;
  $('#aiNote').textContent = S.noSample ? 'Estimarea automată nu e disponibilă aici, așa că notezi valorile manual.' : 'Ai ales să nu trimiți mesele la AI, așa că notezi valorile manual. Poți porni estimările din Setări → Datele tale.';
}
function renderRecent(){
  const el = $('#recent'); const list = recentFoods(); S._recent = list;
  const y = getDay(addDays(S.view, -1)).entries.filter(e => e.meal === S.meal);
  let html = '';
  if (y.length){
    const yk = y.reduce((a, e) => a + e.kcal, 0);
    html += '<div><label class="lbl">Repetă</label><div class="chips"><button class="chip accent" data-action="repeat-meal">' + mealName(S.meal) + ' ca ieri<i>' + y.length + (y.length === 1 ? ' aliment' : ' alimente') + ' · ' + fmt(yk) + ' kcal</i></button></div></div>';
  }
  if (S.profile){
    const L = S.library;
    const chips = L.favorites.map(f => '<button class="chip" data-action="fav-add" data-id="' + esc(f.id) + '">★ ' + esc(f.name) + '<i>' + fmt(sumItems(f.items).kcal) + '</i></button>').join('') +
      L.recipes.map(r => '<button class="chip" data-action="recipe-log" data-id="' + esc(r.id) + '">' + esc(r.name) + '<i>' + fmt(sumItems(r.items).kcal / r.servings) + '/porție</i></button>').join('') +
      '<button class="chip accent" data-action="open-lib">' + (L.favorites.length || L.recipes.length ? 'Gestionează' : '+ Rețete și mese favorite') + '</button>';
    html += '<div><label class="lbl">Rețete și favorite</label><div class="chips">' + chips + '</div></div>';
  }
  if (list.length){
    html += '<div><label class="lbl">Adaugă rapid din ce ai mai mâncat</label><div class="chips">' +
      list.map((e, i) => '<button class="chip" data-action="recent" data-i="' + i + '" aria-label="Adaugă ' + esc(e.name) + ', ' + fmt(e.kcal) + ' kcal">' + esc(e.name) + '<i>' + fmt(e.kcal) + '</i></button>').join('') + '</div></div>';
  }
  el.hidden = !html; el.innerHTML = html;
}
const AI_SRC = new Set(['text', 'photo', 'idea']);
const CONF = { 'mare': { cls: 'hi', t: 'sigur', u: 0.07 }, 'medie': { cls: 'mid', t: 'estimat', u: 0.18 }, 'mică': { cls: 'lo', t: 'verifică', u: 0.35 } };
function renderPreview(){
  const el = $('#preview'); const d = S.draft;
  if (!d){ el.hidden = true; el.innerHTML = ''; return; }
  const tot = { kcal:0, protein:0, carbs:0, fat:0 }; let lo = 0, hi = 0, unsure = 0;
  const rows = d.items.map((it, i) => {
    const s = scaled(it); tot.kcal += s.kcal; tot.protein += s.protein; tot.carbs += s.carbs; tot.fat += s.fat;
    const c = CONF[it.conf]; const u = c ? c.u : 0;
    lo += s.kcal * (1 - u); hi += s.kcal * (1 + u); if (it.conf && it.conf !== 'mare') unsure++;
    return '<li class="pitem' + (it.conf === 'mică' ? ' is-unsure' : '') + '"><span class="nm">' + esc(it.name) + (c ? ' <span class="cf cf-' + c.cls + '">' + c.t + '</span>' : '') + '</span><span class="kc">' + fmt(s.kcal) + ' <small>kcal</small></span>' +
      '<div class="ctrl"><span class="mx"><span><i class="dot p"></i>' + fmt1(s.protein) + ' g</span><span><i class="dot c"></i>' + fmt1(s.carbs) + ' g</span><span><i class="dot f"></i>' + fmt1(s.fat) + ' g</span>' + (s.grams ? '<span>' + fmt(s.grams) + ' g porție</span>' : '') + '</span>' +
      '<span class="row"><span class="stepper"><button data-action="mult" data-i="' + i + '" data-d="-1" aria-label="Porție mai mică">−</button><output aria-live="polite">×' + fmt1(it.mult) + '</output><button data-action="mult" data-i="' + i + '" data-d="1" aria-label="Porție mai mare">+</button></span>' +
      '<button class="rm" data-action="rm-item" data-i="' + i + '">Scoate</button></span></div></li>';
  }).join('');
  const dayNote = S.view === todayKey() ? '' : ' (' + dayWord(S.view).toLowerCase() + ')';
  el.hidden = false;
  const cc = CONF[d.confidence];
  const range = unsure && Math.round(hi) - Math.round(lo) >= 40 ? '<p class="krange">Probabil între ' + fmt(Math.round(lo / 10) * 10) + ' și ' + fmt(Math.round(hi / 10) * 10) + ' kcal' + (d.question ? '. Răspunsul de mai jos îl strânge.' : d.items.some(it => it.conf === 'mică') ? '. Ajustează porțiile marcate cu „verifică”.' : '.') + '</p>' : '';
  const ask = d.question && (d.src === 'text' || d.src === 'photo') && !S.aiOff
    ? '<div class="ask"><p><b>Claude întreabă:</b> ' + esc(d.question) + '</p><div class="ask-row"><label class="sr" for="askIn">Răspunsul tău</label><input type="text" id="askIn" placeholder="ex: o lingură"><button class="btn soft sm" data-action="ask-send">Recalculează</button></div></div>' : '';
  el.innerHTML = '<div class="panel-head"><h2 id="pvTitle">Verifică și adaugă</h2>' + '<span class="aichip">Generat de AI</span>' + (cc ? '<span class="conf cf-' + cc.cls + '"><i></i>Siguranță ' + esc(d.confidence) + '</span>' : '') + '</div>' +
    '<ul class="pitems">' + rows + '</ul>' +
    '<div class="ptotal"><span class="mx"><span><i class="dot p"></i>' + fmt1(tot.protein) + ' g</span><span><i class="dot c"></i>' + fmt1(tot.carbs) + ' g</span><span><i class="dot f"></i>' + fmt1(tot.fat) + ' g</span></span><b>' + fmt(tot.kcal) + ' kcal</b></div>' +
    range + ask +
    (d.note ? '<p class="note">' + esc(d.note) + '</p>' : '<div style="height:12px"></div>') +
    '<div class="row"><button class="btn ghost" data-action="discard">Renunță</button><button class="btn primary wide" data-action="commit">Adaugă la ' + mealName(S.meal) + dayNote + '</button></div>';
}
function renderIdeas(){
  const el = $('#ideas'); const I = S.ideas;
  if (!I){ el.hidden = true; el.innerHTML = ''; return; }
  el.hidden = false;
  let body = '';
  if (I.state === 'loading'){
    body = '<div class="status" style="margin-top:0"><span class="spin" aria-hidden="true"></span><p>Claude caută variante care se potrivesc cu ce ți-a rămas…<small>Durează de obicei 10–30 de secunde.</small></p><button class="btn ghost sm" data-action="stop-ideas">Oprește</button></div>';
  } else if (I.state === 'error'){
    body = '<p class="err" style="margin-top:0">' + esc(I.msg) + '</p><div class="row" style="margin-top:10px"><button class="btn soft sm" data-action="ideas">Încearcă din nou</button></div>';
  } else {
    body = '<div class="ideas-list">' + I.list.map((idea, n) => {
      const tot = idea.items.reduce((a, it) => { a.k += it.kcal; a.p += it.protein; a.c += it.carbs; a.f += it.fat; return a; }, { k:0, p:0, c:0, f:0 });
      return '<div class="idea"><h3>' + esc(idea.title) + '<span>' + fmt(tot.k) + ' kcal</span></h3>' + (idea.why ? '<p>' + esc(idea.why) + '</p>' : '') +
        '<ul>' + idea.items.map(it => '<li>' + esc(it.name) + '</li>').join('') + '</ul>' +
        '<div class="row"><span class="mx"><span><i class="dot p"></i>' + fmt1(tot.p) + ' g</span><span><i class="dot c"></i>' + fmt1(tot.c) + ' g</span><span><i class="dot f"></i>' + fmt1(tot.f) + ' g</span></span><button class="btn soft sm" data-action="use-idea" data-i="' + n + '">Aleg asta</button></div></div>';
    }).join('') + '</div><div class="row" style="margin-top:10px"><button class="rm" data-action="ideas">Alte idei</button></div>';
  }
  body += '<p class="hint" style="margin-top:10px">Idei generate de AI (Claude). Verifică porțiile înainte să le adaugi.</p>';
  el.innerHTML = '<div class="panel-head"><h2 id="idTitle">Idei pentru ' + mealName(I.meal).toLowerCase() + '</h2><button class="icon-btn" style="width:36px;height:36px" data-action="close-ideas" aria-label="Închide ideile">' + X_ICON + '</button></div>' + body;
}
function renderWater(){
  const el = $('#water');
  const target = (S.profile && S.profile.targets.water) || 2500;
  const w = getDay(S.view).water || 0;
  const cells = Math.min(16, Math.max(4, Math.round(target / 250)));
  const per = target / cells;
  let g = '';
  for (let i = 0; i < cells; i++){
    const lo = per*i, hi = per*(i+1);
    const fill = w >= hi - 0.5 ? 1 : (w > lo ? (w - lo)/per : 0);
    g += '<button class="glass' + (fill >= 1 ? ' on' : '') + '" style="--fill:' + fill.toFixed(2) + '" data-action="water-set" data-ml="' + Math.round(hi) + '" data-per="' + Math.round(per) + '" aria-label="Setează ' + fmt(hi) + ' ml"></button>';
  }
  el.innerHTML = '<div class="panel-head"><h2>Apă</h2><span class="meta"><strong>' + fmtL(w) + ' L</strong> din ' + fmtL(target) + ' L</span></div>' +
    '<div class="glasses" style="--n:' + cells + '">' + g + '</div>' +
    '<div class="row"><button class="btn ghost sm" data-action="water-add" data-ml="-250" ' + (w <= 0 ? 'disabled' : '') + '>−250 ml</button><button class="btn soft sm" data-action="water-add" data-ml="250">+250 ml</button><button class="btn soft sm" data-action="water-add" data-ml="500">+500 ml</button></div>';
}
function renderDiary(){
  const el = $('#diary'); const day = getDay(S.view); const t = dayTotals(day);
  let html = '<div class="panel-head"><h2>Jurnal</h2><span class="meta">' + (t.n ? t.n + (t.n === 1 ? ' aliment' : ' alimente') + ' · <strong>' + fmt(t.kcal) + ' kcal</strong>' : '') + '</span></div>';
  if (!t.n){
    html += '<p class="empty"><b>' + (S.loaded ? 'Nimic notat ' + (S.view === todayKey() ? 'azi' : 'în ziua asta') : 'Se încarcă…') + '</b>Mesele apar aici, pe mic dejun, prânz, gustare și cină. Scrie ce ai mâncat sau fă o poză farfuriei. Atinge apoi orice aliment ca să-l corectezi.</p>';
  } else {
    html += '<div class="legend"><span><i class="dot p"></i>Proteine</span><span><i class="dot c"></i>Glucide</span><span><i class="dot f"></i>Grăsimi</span><span>atinge un aliment ca să-l editezi</span></div>';
    for (const m of MEALS){
      const list = day.entries.filter(e => e.meal === m.id).sort((a, b) => a.at - b.at);
      if (!list.length){
        html += '<div class="meal-group"><h3>' + m.t + '<button class="addhere" data-action="add-to" data-meal="' + m.id + '">+ Adaugă</button></h3></div>';
        continue;
      }
      const mk = list.reduce((a, e) => a + e.kcal, 0);
      html += '<div class="meal-group"><h3>' + m.t + '<span class="mg-r"><button class="addhere" data-action="fav-save" data-meal="' + m.id + '" aria-label="Salvează ' + m.t.toLowerCase() + ' ca masă favorită">☆ Salvează</button><span>' + fmt(mk) + ' kcal</span></span></h3><ul class="entries">' + list.map(e =>
        '<li class="entry"><button class="e-main" data-action="edit" data-id="' + esc(e.id) + '" aria-label="Editează ' + esc(e.name) + '"><span class="nm">' + esc(e.name) + (AI_SRC.has(e.src) ? ' <span class="aitag" title="Estimat de AI">AI</span>' : '') + '</span><span class="mx"><span><i class="dot p"></i>' + fmt1(e.protein) + '</span><span><i class="dot c"></i>' + fmt1(e.carbs) + '</span><span><i class="dot f"></i>' + fmt1(e.fat) + '</span>' + (e.grams ? '<span>' + fmt(e.grams) + ' g</span>' : '') + '</span></button>' +
        '<span class="kc">' + fmt(e.kcal) + '</span><button class="del" data-action="del" data-id="' + esc(e.id) + '" aria-label="Șterge ' + esc(e.name) + '">' + X_ICON + '</button></li>').join('') + '</ul></div>';
    }
  }
  el.innerHTML = html;
}
function weightSeries(endKey, n){
  const pts = [];
  for (let i = n - 1; i >= 0; i--){ const k = addDays(endKey, -i); const w = S.days[k] && S.days[k].weight; if (w) pts.push({ k, x: n - 1 - i, w }); }
  return pts;
}
function renderWeight(){
  const today = todayKey(); const cur = getDay(S.view).weight || null;
  $('#wMeta').innerHTML = cur
    ? esc(dayWord(S.view)) + ': <strong>' + fmt1(cur) + ' kg</strong> <button class="rm" data-action="w-del" aria-label="Șterge greutatea notată">șterge</button>'
    : esc(dayWord(S.view)) + ': nenotată';
  let lastW = null;
  const keys = Object.keys(S.days).filter(k => S.days[k].weight && k <= S.view).sort();
  if (keys.length) lastW = S.days[keys[keys.length - 1]].weight;
  else if (S.profile && S.profile.weight) lastW = S.profile.weight;
  $('#wIn').placeholder = lastW ? fmt1(lastW) : '0,0';

  const N = 30, pts = weightSeries(today, N);
  const chart = $('#wChart'), stats = $('#wStats'), banner = $('#wBanner');
  if (pts.length < 2){
    chart.innerHTML = '<p class="wempty">' + (pts.length ? 'Ai o greutate notată. După încă câteva dimineți apare aici graficul tendinței.' : 'Notează-ți greutatea câteva dimineți la rând și aici apare tendința pe 30 de zile.') + '</p>';
  } else {
    const ws = pts.map(p => p.w);
    let lo = Math.min(...ws), hi = Math.max(...ws);
    if (hi - lo < 2){ const mid = (hi + lo)/2; lo = mid - 1; hi = mid + 1; }
    lo -= 0.3; hi += 0.3;
    const Wd = 336, top = 18, base = 96, left = 34, right = 326;
    const x = i => left + (right - left) * (i / (N - 1));
    const y = v => base - (v - lo) / (hi - lo) * (base - top);
    const line = pts.map((p, i) => (i ? 'L' : 'M') + x(p.x).toFixed(1) + ' ' + y(p.w).toFixed(1)).join(' ');
    const area = line + ' L' + x(pts[pts.length-1].x).toFixed(1) + ' ' + base + ' L' + x(pts[0].x).toFixed(1) + ' ' + base + ' Z';
    const last = pts[pts.length - 1];
    const lx = x(last.x), ly = y(last.w);
    chart.innerHTML = '<div class="chart"><svg viewBox="0 0 ' + Wd + ' 122" role="img" aria-label="Greutatea în ultimele 30 de zile, de la ' + fmt1(pts[0].w) + ' la ' + fmt1(last.w) + ' kg">' +
      '<line class="wgrid" x1="' + left + '" x2="' + right + '" y1="' + top + '" y2="' + top + '"/><line class="wgrid" x1="' + left + '" x2="' + right + '" y1="' + base + '" y2="' + base + '"/>' +
      '<text x="' + (left - 6) + '" y="' + (top + 4) + '" text-anchor="end">' + fmt1(hi) + '</text><text x="' + (left - 6) + '" y="' + (base + 4) + '" text-anchor="end">' + fmt1(lo) + '</text>' +
      '<path class="warea" d="' + area + '" opacity=".6"/><path class="wline" d="' + line + '"/>' +
      pts.slice(0, -1).map(p => '<circle class="wdot" cx="' + x(p.x).toFixed(1) + '" cy="' + y(p.w).toFixed(1) + '" r="2.6"/>').join('') +
      '<circle class="wlast" cx="' + lx.toFixed(1) + '" cy="' + ly.toFixed(1) + '" r="4.5"/>' +
      '<text class="wv" x="' + Math.min(lx, right - 14).toFixed(1) + '" y="' + Math.max(12, ly - 9).toFixed(1) + '" text-anchor="middle">' + fmt1(last.w) + '</text>' +
      '<text x="' + left + '" y="116">' + esc(shortDate(addDays(today, -(N - 1)))) + '</text><text x="' + right + '" y="116" text-anchor="end">azi</text>' +
      '</svg></div>';
  }
  if (pts.length){
    const recent = pts.filter(p => p.x >= N - 7);
    const avg7 = recent.length ? recent.reduce((a, p) => a + p.w, 0) / recent.length : null;
    const change = pts.length >= 2 ? pts[pts.length - 1].w - pts[0].w : null;
    stats.hidden = false;
    stats.innerHTML = '<div><dt>Medie 7 zile</dt><dd>' + (avg7 ? fmt1(avg7) + ' kg' : '–') + '</dd></div>' +
      '<div><dt>În 30 de zile</dt><dd>' + (change == null ? '–' : (change > 0 ? '+' : change < 0 ? '−' : '') + fmt1(Math.abs(change)) + ' kg') + '</dd></div>' +
      '<div><dt>În profil</dt><dd>' + (S.profile && S.profile.weight ? fmt1(S.profile.weight) + ' kg' : '–') + '</dd></div>';
    const p = S.profile;
    const AI_ = adaptInfo();
    if (p && !p.custom && p.weight && p.sex && p.activity && p.goal && recent.length >= 3 && Math.abs(avg7 - p.weight) >= 2 && !(AI_ && AI_.ready)){
      const diff = avg7 - p.weight;
      banner.innerHTML = '<div class="banner"><p>Media ta din ultimele zile e ' + fmt1(avg7) + ' kg, cu ' + fmt1(Math.abs(diff)) + ' kg ' + (diff < 0 ? 'sub' : 'peste') + ' greutatea din profil. Recalculează țintele ca să rămână potrivite.</p><button class="btn primary sm" data-action="w-recalc" data-w="' + r1(avg7) + '">Recalculează țintele</button></div>';
    } else banner.innerHTML = '';
  } else { stats.hidden = true; stats.innerHTML = ''; banner.innerHTML = ''; }
  renderAdapt();
}
function renderHistory(){
  const el = $('#history'); const today = todayKey();
  const T = S.profile ? S.profile.targets : null;
  const days = [];
  for (let i = 6; i >= 0; i--){ const k = addDays(today, -i); const t = dayTotals(S.days[k]); days.push(Object.assign({ k }, t)); }
  const W_ = 336, top = 24, base = 112, left = 4, right = 332;
  const maxV = Math.max(T ? T.kcal * 1.2 : 2500, ...days.map(d => d.kcal * 1.08), 1);
  const y = v => base - (v / maxV) * (base - top);
  const slot = (right - left) / 7, bw = Math.min(30, slot * 0.6);
  let bars = '';
  days.forEach((d, i) => {
    const cx = left + slot*i + slot/2;
    const Td = targetsFor(d.k);
    const over = Td && d.kcal > Td.kcal * 1.1;
    const sel = d.k === S.view;
    const dt = parseKey(d.k);
    bars += '<g data-day="' + d.k + '" class="' + (sel ? 'sel' : '') + '" role="button" tabindex="0" aria-label="' + esc(dateLine(d.k)) + ': ' + fmt(d.kcal) + ' kcal">' +
      '<rect class="hit" x="' + (cx - slot/2).toFixed(1) + '" y="0" width="' + slot.toFixed(1) + '" height="150"/>' +
      '<rect class="track" x="' + (cx - bw/2).toFixed(1) + '" y="' + top + '" width="' + bw.toFixed(1) + '" height="' + (base - top) + '" rx="7"/>' +
      (d.kcal > 0 ? '<rect class="' + (over ? 'b-over' : 'b-ok') + '" x="' + (cx - bw/2).toFixed(1) + '" y="' + Math.min(base - 4, y(d.kcal)).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(4, base - y(d.kcal)).toFixed(1) + '" rx="7"/>' +
        '<text class="hv" x="' + cx.toFixed(1) + '" y="' + (Math.min(base - 4, y(d.kcal)) - 6).toFixed(1) + '" text-anchor="middle">' + fmt(d.kcal) + '</text>' : '') +
      '<text class="hl" x="' + cx.toFixed(1) + '" y="' + (base + 18) + '" text-anchor="middle">' + DAY_ABBR[dt.getDay()] + '</text>' +
      '<text class="hd" x="' + cx.toFixed(1) + '" y="' + (base + 32) + '" text-anchor="middle">' + dt.getDate() + '</text></g>';
  });
  const tline = T ? '<line class="tline" x1="' + left + '" x2="' + right + '" y1="' + y(T.kcal).toFixed(1) + '" y2="' + y(T.kcal).toFixed(1) + '"/>' : '';
  const logged = days.filter(d => d.n > 0);
  const avgK = logged.length ? logged.reduce((a, d) => a + d.kcal, 0) / logged.length : 0;
  const avgP = logged.length ? logged.reduce((a, d) => a + d.protein, 0) / logged.length : 0;
  const inT = T ? logged.filter(d => { const Td = targetsFor(d.k); return Math.abs(d.kcal - Td.kcal) <= Td.kcal * 0.1; }).length : 0;
  el.innerHTML = '<div class="panel-head"><h2>Ultimele 7 zile</h2>' + (T ? '<span class="meta tleg">' + (cycleDeltas() ? 'țintă medie ' : 'țintă ') + fmt(T.kcal) + ' kcal</span>' : '') + '</div>' +
    '<div class="chart"><svg viewBox="0 0 ' + W_ + ' 150" role="group" aria-label="Calorii pe ultimele 7 zile. Atinge o zi ca s-o deschizi.">' + bars + tline + '</svg></div>' +
    '<dl class="hstats"><div><dt>Medie</dt><dd>' + (logged.length ? fmt(avgK) : '–') + '</dd></div><div><dt>Proteine/zi</dt><dd>' + (logged.length ? fmt(avgP) + ' g' : '–') + '</dd></div><div><dt>Zile în țintă</dt><dd>' + (T && logged.length ? inT + '/' + logged.length : '–') + '</dd></div></dl>' + reportRow();
}

/* ---------- setup interview ---------- */
const STEPS = ['intro','sex','age','body','activity','goal','result'];
function openSetup(first){
  closeSheet('#settings');
  const base = S.profile ? S.profile : PREFILL;
  S.setup = {
    step: S.profile ? 1 : 0, first: !S.profile && !!first,
    d: { sex: base.sex || null, age: base.age || PREFILL.age, height: base.height || PREFILL.height, weight: base.weight || PREFILL.weight, activity: base.activity || null, goal: base.goal || PREFILL.goal }
  };
  $('#sClose').hidden = S.setup.first;
  showSheet('#setup');
  renderSetup();
}
function stepValid(){
  const d = S.setup.d, st = STEPS[S.setup.step];
  if (st === 'sex') return !!d.sex;
  if (st === 'age') return d.age >= 14 && d.age <= 90;
  if (st === 'body') return d.height >= 120 && d.height <= 230 && d.weight >= 35 && d.weight <= 250;
  if (st === 'activity') return !!d.activity;
  if (st === 'goal') return !!d.goal;
  return true;
}
function optList(field, list){
  const v = S.setup.d[field];
  return '<div class="opts" role="radiogroup">' + list.map(o => '<button class="opt" role="radio" data-action="s-pick" data-field="' + field + '" data-v="' + o.id + '" aria-checked="' + (v === o.id) + '"><b>' + o.t + '</b>' + (o.d ? '<span>' + o.d + '</span>' : '') + '</button>').join('') + '</div>';
}
function renderSetup(){
  const s = S.setup, d = s.d, st = STEPS[s.step];
  $('#sProg').innerHTML = [1,2,3,4,5].map(i => '<i class="' + (i <= s.step ? 'on' : '') + '"></i>').join('');
  let b = '';
  if (st === 'intro'){
    b = '<h2 id="sTitle" tabindex="-1">Bun venit în Porția</h2><p>Cinci întrebări scurte. La final îți calculez caloriile, proteinele, glucidele, grăsimile și apa. Nu trebuie să știi niciun număr.</p><p>Am completat deja ce știu despre tine. Verifică și corectează unde e cazul.</p>';
  } else if (st === 'sex'){
    b = '<h2 id="sTitle" tabindex="-1">Sexul biologic</h2><p>Formula metabolismului diferă puțin între bărbați și femei.</p>' + optList('sex', [{ id:'m', t:'Bărbat' }, { id:'f', t:'Femeie' }]);
  } else if (st === 'age'){
    b = '<h2 id="sTitle" tabindex="-1">Câți ani ai?</h2><p>Metabolismul încetinește puțin cu vârsta.</p>' +
      '<div class="numfield"><button class="round" data-action="s-step" data-field="age" data-d="-1" aria-label="Mai puțin">−</button><div class="unit"><label class="sr" for="sAge">Vârstă</label><input type="text" inputmode="numeric" id="sAge" data-field="age" value="' + esc(d.age) + '"><em>ani</em></div><button class="round" data-action="s-step" data-field="age" data-d="1" aria-label="Mai mult">+</button></div><p class="ferr" id="sErr"></p>';
  } else if (st === 'body'){
    b = '<h2 id="sTitle" tabindex="-1">Înălțime și greutate</h2><p>Greutatea de acum, de dimineață dacă o știi.</p>' +
      '<label class="lbl" for="sHeight" style="margin-top:6px">Înălțime</label><div class="numfield"><button class="round" data-action="s-step" data-field="height" data-d="-1" aria-label="Mai puțin">−</button><div class="unit"><input type="text" inputmode="numeric" id="sHeight" data-field="height" value="' + esc(d.height) + '"><em>cm</em></div><button class="round" data-action="s-step" data-field="height" data-d="1" aria-label="Mai mult">+</button></div>' +
      '<label class="lbl" for="sWeight" style="margin-top:10px">Greutate</label><div class="numfield"><button class="round" data-action="s-step" data-field="weight" data-d="-0.5" aria-label="Mai puțin">−</button><div class="unit"><input type="text" inputmode="decimal" id="sWeight" data-field="weight" value="' + esc(fmt1(d.weight)) + '"><em>kg</em></div><button class="round" data-action="s-step" data-field="weight" data-d="0.5" aria-label="Mai mult">+</button></div><p class="ferr" id="sErr"></p>';
  } else if (st === 'activity'){
    b = '<h2 id="sTitle" tabindex="-1">Cât de activ ești într-o săptămână obișnuită?</h2><p>Numără toate antrenamentele: sală, alergare, cardio, sport.</p>' + optList('activity', ACT);
  } else if (st === 'goal'){
    b = '<h2 id="sTitle" tabindex="-1">Ce vrei să obții?</h2>' + optList('goal', GOALS);
  } else {
    const T = computeTargets(d);
    const g = GOALS.find(x => x.id === d.goal);
    const adjTxt = T.adj === 0 ? 'fără ajustare pentru menținere' : (T.adj > 0 ? '+' : '−') + Math.abs(Math.round(T.adj*100)) + '% pentru ' + g.t.toLowerCase();
    b = '<h2 id="sTitle" tabindex="-1">Ținta ta zilnică</h2><div class="result"><div class="kbig">' + fmt(T.kcal) + '<small>kcal pe zi</small></div>' +
      '<dl class="rgrid"><div><dt><i class="dot p"></i>Proteine</dt><dd>' + fmt(T.protein) + ' g</dd></div><div><dt><i class="dot c"></i>Glucide</dt><dd>' + fmt(T.carbs) + ' g</dd></div><div><dt><i class="dot f"></i>Grăsimi</dt><dd>' + fmt(T.fat) + ' g</dd></div><div><dt>Apă</dt><dd>' + fmtL(T.water) + ' L</dd></div></dl>' +
      '<p class="how">Cum am calculat: metabolism bazal ' + fmt(T.bmr) + ' kcal (formula Mifflin-St Jeor) × ' + nf3.format(T.actF) + ' pentru activitate = ' + fmt(T.tdee) + ' kcal de menținere, apoi ' + adjTxt + '. Proteine ' + fmt1(T.protPerKg) + ' g pe kg, grăsimi 25% din calorii, restul glucide. Poți ajusta oricând numerele din Setări.</p></div>';
  }
  $('#sBody').innerHTML = b;
  const isLast = st === 'result';
  $('#sFoot').innerHTML = (s.step > (S.profile ? 1 : 0) ? '<button class="btn ghost" data-action="s-back">Înapoi</button>' : '') +
    '<button class="btn primary wide" data-action="' + (isLast ? 's-save' : 's-next') + '" id="sNext"' + (stepValid() ? '' : ' disabled') + '>' + (st === 'intro' ? 'Începe' : isLast ? 'Salvează și începe' : 'Continuă') + '</button>';
  const h = $('#sTitle'); if (h) h.focus({ preventScroll: true });
}
function setupInput(field, raw){
  const v = num(raw);
  S.setup.d[field] = isFinite(v) ? (field === 'weight' ? r1(v) : Math.round(v)) : NaN;
  const ok = stepValid();
  $('#sNext').disabled = !ok;
  const err = $('#sErr');
  if (err) err.textContent = ok ? '' : (STEPS[S.setup.step] === 'age' ? 'Introdu o vârstă între 14 și 90 de ani.' : 'Verifică valorile: înălțime 120–230 cm, greutate 35–250 kg.');
}
function saveSetup(){
  const d = S.setup.d, T = computeTargets(d);
  S.profile = { sex: d.sex, age: d.age, height: d.height, weight: d.weight, activity: d.activity, goal: d.goal, custom: false, updatedAt: Date.now(), skin: S.profile ? (S.profile.skin || null) : (lsGet('portia-skin') || null), cycle: S.profile ? (S.profile.cycle || null) : null,
    adapt: S.profile ? (S.profile.adapt || null) : null, fast: S.profile ? (S.profile.fast || null) : null, consent: (S.profile && S.profile.consent) || normConsent(lsGet('portia-consent')),
    targets: { kcal: T.kcal, protein: T.protein, carbs: T.carbs, fat: T.fat, water: T.water } };
  saveProfile();
  closeSheet('#setup');
  renderAll();
  toast('Ținta ta: ' + fmt(T.kcal) + ' kcal pe zi');
}

/* ---------- settings ---------- */
function openSettings(){
  if (!S.profile){ openSetup(true); return; }
  renderSettings();
  showSheet('#settings');
  const h = $('#setTitle'); if (h) h.focus({ preventScroll: true });
}
function renderSettings(){
  const p = S.profile, T = p.targets;
  const act = ACT.find(a => a.id === p.activity), g = GOALS.find(x => x.id === p.goal);
  const summary = [p.sex === 'f' ? 'Femeie' : p.sex === 'm' ? 'Bărbat' : null, p.age ? p.age + ' ani' : null, p.height ? p.height + ' cm' : null, p.weight ? fmt1(p.weight) + ' kg' : null, act ? act.t : null, g ? g.t : null].filter(Boolean).join(' · ');
  const store = S.mode === 'cloud' ? 'Datele se salvează în contul tău Claude și le vezi doar tu, pe orice dispozitiv.'
    : S.mode === 'local' ? 'Datele se salvează doar în acest browser. Folosește codul de backup ca să nu le pierzi.'
    : 'Datele nu se pot salva aici. Copiază codul de backup înainte să închizi pagina.';
  $('#settingsCard').innerHTML =
    '<div class="sheet-head"><h2 id="setTitle" tabindex="-1">Setări</h2><button class="icon-btn" data-action="close-settings" aria-label="Închide">' + X_ICON + '</button></div>' +
    '<section id="appearSec">' + appearanceSection() + '</section>' +
    '<section id="themeSec">' + themeSection() + '</section>' +
    '<section><h3>Ținte zilnice</h3><p>' + (p.custom ? 'Ținte ajustate de tine.' : 'Calculate din interviu. Le poți ajusta manual.') + '</p>' +
      '<div class="tgrid">' +
        tField('tK', 'Calorii', T.kcal, 'kcal') + tField('tW', 'Apă', T.water, 'ml') +
        tField('tP', 'Proteine', T.protein, 'g') + tField('tC', 'Glucide', T.carbs, 'g') + tField('tF', 'Grăsimi', T.fat, 'g') +
      '</div><p class="hint" id="tSum"></p><p class="ferr" id="tErr"></p>' +
      '<button class="btn primary" data-action="save-targets">Salvează țintele</button></section>' +
    '<section id="cycleSec">' + cycleSection() + '</section>' +
    '<section id="fastSec">' + fastSection() + '</section>' +
    '<section><h3>Abonament</h3><p>' + (S.isOwner ? 'Ai toate funcțiile și temele deblocate, ca proprietar.' : 'Folosești Porția gratuit. ' + FREE_FOREVER.replace(/\.$/, '') + ' rămân gratuite.') + '</p>' +
      '<div class="row"><button class="btn soft" data-action="open-plus">Vezi ofertele</button><button class="btn ghost" data-action="sub-manage">Gestionează abonamentul</button></div>' +
      '<p class="hint" style="margin-top:8px">Butonul deschide pagina de abonamente din App Store sau Google Play, unde îl anulezi dintr-o atingere.</p></section>' +
    '<section id="dataSec">' + dataSection() + '</section>' +
    '<section><h3>Profil</h3><p>' + esc(summary || 'Fără date de profil') + '</p><button class="btn ghost" data-action="redo-setup">Refă interviul</button></section>' +
    '<section><h3>Cum îl folosești cel mai bine</h3><ul class="tips">' +
      '<li>Notează mesele imediat după ce mănânci, cât le ții minte.</li>' +
      '<li>Pentru porții precise, scrie gramajul („150 g piept de pui”) sau fotografiază eticheta.</li>' +
      '<li>Atinge orice aliment din jurnal ca să-i corectezi cantitatea sau masa.</li>' +
      '<li>„Ca ieri” copiază aceeași masă de ieri dintr-o atingere.</li>' +
      '<li>Estimările din text și poze sunt aproximative. Contează să notezi constant, nu perfect.</li>' +
    '</ul></section>' +
    '<section><h3>Despre Porția</h3><p>Porția e o aplicație de stil de viață, nu un dispozitiv medical. Nu înlocuiește sfatul unui medic sau nutriționist. Estimările, ideile de mese și raportul sunt generate de AI (Claude) și pot greși.</p></section>' +
    '<section><h3>Cod de backup</h3><p>Un cod care conține tot jurnalul și țintele. Păstrează-l într-o notiță și îl poți restaura oricând.</p>' +
      '<div class="row"><button class="btn soft" data-action="make-backup">Generează codul</button><button class="btn ghost" data-action="copy-backup" id="copyBtn" hidden>Copiază</button></div>' +
      '<label class="sr" for="bkOut">Codul de backup</label><textarea class="code" id="bkOut" readonly hidden></textarea>' +
      '<div style="margin-top:14px"><label class="lbl" for="bkIn">Restaurează din cod</label><textarea class="code" id="bkIn" placeholder="Lipește aici codul care începe cu PORTIA1."></textarea>' +
      '<div class="row" style="margin-top:8px"><button class="btn ghost" data-action="check-restore">Restaurează</button></div><p class="ferr" id="bkErr"></p><div id="bkConfirm"></div></div></section>' +
    '<p class="foot">' + store + ' Luminos sau întunecat se alege din Aspect, mai sus.</p>';
  updateTargetSum();
}
function tField(id, label, val, unit){
  return '<div><label class="lbl" for="' + id + '">' + label + '</label><div class="unit"><input type="text" inputmode="numeric" id="' + id + '" value="' + esc(val) + '"><em>' + unit + '</em></div></div>';
}
function updateTargetSum(){
  const p = num($('#tP').value) || 0, c = num($('#tC').value) || 0, f = num($('#tF').value) || 0, k = num($('#tK').value) || 0;
  const mk = Math.round(p*4 + c*4 + f*9);
  $('#tSum').textContent = 'Macronutrienții însumează ' + fmt(mk) + ' kcal' + (k ? (Math.abs(mk - k) > 50 ? ', față de ținta de ' + fmt(k) + ' kcal.' : ', potrivit cu ținta.') : '.');
}
function saveTargets(){
  const k = Math.round(num($('#tK').value)), w = Math.round(num($('#tW').value)), p = Math.round(num($('#tP').value)), c = Math.round(num($('#tC').value)), f = Math.round(num($('#tF').value));
  const err = $('#tErr');
  if (!(k >= 800 && k <= 6000)){ err.textContent = 'Caloriile trebuie să fie între 800 și 6000.'; return; }
  if (![p, c, f].every(x => x >= 0 && x <= 600)){ err.textContent = 'Macronutrienții trebuie să fie între 0 și 600 g.'; return; }
  if (!(w >= 500 && w <= 8000)){ err.textContent = 'Apa trebuie să fie între 500 și 8000 ml.'; return; }
  err.textContent = '';
  S.profile = Object.assign(clone(S.profile), { custom: true, updatedAt: Date.now(), targets: { kcal: k, protein: p, carbs: c, fat: f, water: w } });
  saveProfile();
  closeSheet('#settings');
  renderAll();
  toast('Țintele au fost salvate.');
}
function toB64(str){
  const bytes = new TextEncoder().encode(str); let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
function fromB64(b){
  const bin = atob(b.replace(/\s+/g, ''));
  const bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
function makeBackup(){
  const payload = { app: 'portia', v: 1, exportedAt: new Date().toISOString(), profile: S.profile, days: S.days, library: S.library };
  const out = $('#bkOut'); out.value = 'PORTIA1.' + toB64(JSON.stringify(payload)); out.hidden = false;
  $('#copyBtn').hidden = false;
  const n = Object.keys(S.days).length;
  toast('Cod generat pentru ' + n + (n === 1 ? ' zi' : ' zile') + '.');
}
function copyBackup(){
  const ta = $('#bkOut'); const text = ta.value;
  const fallback = () => { ta.focus(); ta.select(); toast('Codul e selectat. Copiază-l din meniul telefonului.'); };
  try {
    navigator.clipboard.writeText(text).then(() => toast('Codul a fost copiat.'), fallback);
  } catch (e) { fallback(); }
}
let pendingRestore = null;
function checkRestore(){
  const err = $('#bkErr'); err.textContent = ''; $('#bkConfirm').innerHTML = ''; pendingRestore = null;
  let raw = $('#bkIn').value.trim();
  if (!raw){ err.textContent = 'Lipește întâi codul.'; return; }
  raw = raw.replace(/^(PORTIA1|MT1)\./, '');
  let data;
  try { data = JSON.parse(fromB64(raw)); } catch (e) { err.textContent = 'Codul nu e valid. Verifică să fie copiat complet.'; return; }
  if (!data || (data.app !== 'portia' && data.app !== 'macro-tracker')){ err.textContent = 'Codul nu e de la Porția.'; return; }
  const profile = normProfile(data.profile), days = normDays(data.days);
  if (!profile){ err.textContent = 'Codul nu conține ținte valide.'; return; }
  pendingRestore = { profile, days, library: normLibrary(data.library) };
  const n = Object.keys(days).length;
  $('#bkConfirm').innerHTML = '<div class="confirm"><p>Codul are ' + n + (n === 1 ? ' zi' : ' zile') + ' de jurnal. Datele de acum vor fi înlocuite cu cele din cod.</p><div class="row"><button class="btn ghost sm" data-action="cancel-restore">Anulează</button><button class="btn danger sm" data-action="do-restore">Înlocuiește datele</button></div></div>';
}
async function doRestore(){
  if (!pendingRestore) return;
  S.profile = pendingRestore.profile; S.days = pendingRestore.days; S.library = pendingRestore.library; pendingRestore = null;
  closeSheet('#settings');
  renderAll();
  toast('Se restaurează…');
  const ok = await uploadAll(true);
  persistLocal();
  if (ok) toast('Datele au fost restaurate.');
}

/* ---------- sheets ---------- */
function showSheet(sel){ $(sel).hidden = false; document.body.style.overflow = 'hidden'; }
function closeSheet(sel){
  const el = $(sel); if (!el || el.hidden) return;
  el.hidden = true;
  if (!anySheetOpen()) document.body.style.overflow = '';
}
function goToLogger(){
  scrollTo($('#logger'));
  if (S.tab === 'text' && !S.aiOff) setTimeout(() => $('#foodText').focus({ preventScroll: true }), reduceMotion() ? 0 : 350);
}

/* ---------- events ---------- */
const CLOSERS = {
  setup: () => { if (!S.setup || !S.setup.first) closeSheet('#setup'); },
  settings: () => closeSheet('#settings'),
  editSheet: () => { closeSheet('#editSheet'); S.edit = null; },
  libSheet: () => closeSheet('#libSheet'),
  recipeSheet: () => closeRecipe(),
  miniSheet: () => closeMini(),
  plusSheet: () => closePlus()
};
function bindStatic(){
  document.addEventListener('click', ev => {
    const dayG = ev.target.closest && ev.target.closest('[data-day]');
    if (dayG){ S.view = dayG.getAttribute('data-day'); renderDayParts(); return; }
    const b = ev.target.closest && ev.target.closest('[data-action]');
    if (!b) return;
    const a = b.dataset.action;
    switch (a){
      case 'open-settings': openSettings(); break;
      case 'close-settings': closeSheet('#settings'); break;
      case 'open-setup': openSetup(false); break;
      case 'redo-setup': openSetup(false); break;
      case 'close-setup': if (!S.setup || !S.setup.first) closeSheet('#setup'); break;
      case 'prev-day': S.view = addDays(S.view, -1); renderDayParts(); break;
      case 'next-day': if (S.view < todayKey()){ S.view = addDays(S.view, 1); renderDayParts(); } break;
      case 'go-today': S.view = todayKey(); renderDayParts(); break;
      case 'tab': S.tab = b.dataset.tab; showErr(''); renderTabs(); break;
      case 'meal': S.meal = b.dataset.meal; renderMeals(); renderRecent(); renderPreview(); renderHero(); if (S.bc && S.bc.state === 'found') renderBarcode(); break;
      case 'add-to': S.meal = b.dataset.meal; renderMeals(); renderRecent(); renderPreview(); renderHero(); if (S.bc && S.bc.state === 'found') renderBarcode(); goToLogger(); break;
      case 'estimate-text': estimate('text'); break;
      case 'estimate-photo': estimate('photo'); break;
      case 'stop': if (S.ctl) S.ctl.abort(); break;
      case 'add-manual': addManual(); break;
      case 'recent': addRecent(Number(b.dataset.i)); break;
      case 'repeat-meal': repeatMeal(); break;
      case 'mult': {
        const it = S.draft && S.draft.items[Number(b.dataset.i)]; if (!it) break;
        it.mult = Math.max(0.25, Math.min(5, Math.round((it.mult + 0.25*Number(b.dataset.d)) * 4) / 4));
        renderPreview(); break;
      }
      case 'rm-item': {
        if (!S.draft) break;
        S.draft.items.splice(Number(b.dataset.i), 1);
        if (!S.draft.items.length) S.draft = null;
        renderPreview(); break;
      }
      case 'discard': S.draft = null; renderPreview(); break;
      case 'commit': commitDraft(); break;
      case 'ask-send': {
        const d = S.draft, inp = $('#askIn'); if (!d || !inp) break;
        const ans = inp.value.trim(); if (!ans){ inp.focus(); break; }
        estimate(d.src, (d.follow ? d.follow + '\n' : '') + 'Răspuns la întrebarea „' + d.question + '”: ' + ans.slice(0, 200));
        break;
      }
      case 'ideas': getIdeas(); break;
      case 'stop-ideas': if (S.ideaCtl) S.ideaCtl.abort(); S.ideas = null; renderIdeas(); break;
      case 'close-ideas': if (S.ideaCtl) S.ideaCtl.abort(); S.ideas = null; renderIdeas(); break;
      case 'use-idea': {
        const idea = S.ideas && S.ideas.list && S.ideas.list[Number(b.dataset.i)]; if (!idea) break;
        S.meal = S.ideas.meal; renderMeals();
        S.draft = { items: clone(idea.items), note: idea.why, confidence: '', src: 'idea' };
        renderPreview(); scrollTo($('#preview')); break;
      }
      case 'edit': openEdit(b.dataset.id); break;
      case 'close-edit': closeSheet('#editSheet'); S.edit = null; break;
      case 'e-scale': editScale(Number(b.dataset.m)); break;
      case 'e-meal': if (S.edit){ S.edit.meal = b.dataset.meal; $$('[data-action="e-meal"]').forEach(x => x.setAttribute('aria-checked', String(x.dataset.meal === S.edit.meal))); } break;
      case 'e-save': editSave(); break;
      case 'e-del': { const id = S.edit && S.edit.id; closeSheet('#editSheet'); S.edit = null; if (id) delEntry(id); break; }
      case 'del': delEntry(b.dataset.id); break;
      case 'water-add': waterAdd(Number(b.dataset.ml)); break;
      case 'water-set': waterSet(Number(b.dataset.ml), Number(b.dataset.per)); break;
      case 'w-save': saveWeight(); break;
      case 'w-del': delWeight(); break;
      case 'w-recalc': recalcFromWeight(Number(b.dataset.w)); break;
      case 'adapt-apply': applyAdapt(false); break;
      case 'adapt-auto': setAdaptAuto(b.getAttribute('aria-checked') !== 'true'); break;
      case 's-pick': S.setup.d[b.dataset.field] = b.dataset.v; renderSetup(); break;
      case 's-step': {
        const f = b.dataset.field, dlt = Number(b.dataset.d);
        const cur = isFinite(S.setup.d[f]) ? S.setup.d[f] : PREFILL[f];
        const v = f === 'weight' ? r1(cur + dlt) : Math.round(cur + dlt);
        S.setup.d[f] = v;
        const inp = $('input[data-field="' + f + '"]', $('#sBody')); if (inp) inp.value = f === 'weight' ? fmt1(v) : v;
        setupInput(f, String(v)); break;
      }
      case 's-next': if (stepValid()){ S.setup.step = Math.min(STEPS.length - 1, S.setup.step + 1); renderSetup(); } break;
      case 's-back': S.setup.step = Math.max(0, S.setup.step - 1); renderSetup(); break;
      case 's-save': saveSetup(); break;
      case 'save-targets': saveTargets(); break;
      case 'make-backup': makeBackup(); break;
      case 'copy-backup': copyBackup(); break;
      case 'check-restore': checkRestore(); break;
      case 'cancel-restore': pendingRestore = null; $('#bkConfirm').innerHTML = ''; break;
      case 'do-restore': doRestore(); break;
      case 'bc-lookup': lookupCode($('#bcCode').value); break;
      case 'bc-qty': if (S.bc){ S.bc.qty = b.dataset.q; const q = $('#bcQty'); if (q) q.value = b.dataset.q; $$('[data-action="bc-qty"]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.q === b.dataset.q))); updateBcPrev(); } break;
      case 'bc-add': addBarcodeEntry(); break;
      case 'bc-cancel': if (S.bcCtl) S.bcCtl.abort(); S.bc = null; renderBarcode(); break;
      case 'bc-edit': { const p = bcProduct(); if (p){ S.bc = { state: 'new', editing: true, code: p.code, draft: { name: p.name, unit: p.unit, kcal: inVal(p.per100.kcal), protein: inVal(p.per100.protein), carbs: inVal(p.per100.carbs), fat: inVal(p.per100.fat), serving: p.serving ? String(p.serving) : '', pack: p.pack ? String(p.pack) : '' } }; renderBarcode(); } break; }
      case 'bc-unit': if (S.bc && S.bc.draft){ S.bc.draft.unit = b.dataset.u; renderBarcode(); } break;
      case 'bc-save': saveProduct(); break;
      case 'prod-del': delProduct(b.dataset.code); break;
      case 'toggle-daytype': toggleDayType(); break;
      case 'cycle-on': setCycle({ on: !cycleOf().on }); break;
      case 'cycle-day': { const dd = Number(b.dataset.d); const days = cycleOf().days.slice(); const ix = days.indexOf(dd); if (ix >= 0) days.splice(ix, 1); else days.push(dd); setCycle({ days }); break; }
      case 'cycle-extra': setCycle({ extra: Number(b.dataset.x) }); break;
      case 'open-lib': openLib(); break;
      case 'close-lib': closeSheet('#libSheet'); break;
      case 'fav-add': addFavorite(b.dataset.id); closeSheet('#libSheet'); break;
      case 'fav-del': delFavorite(b.dataset.id); break;
      case 'fav-save': openFavSave(b.dataset.meal); break;
      case 'fav-confirm': confirmFav(); break;
      case 'recipe-new': openRecipe(null); break;
      case 'recipe-edit': openRecipe(b.dataset.id); break;
      case 'recipe-log': openRecipeLog(b.dataset.id); break;
      case 'recipe-ai': recipeAi(); break;
      case 'recipe-stop': if (S.rctl) S.rctl.abort(); break;
      case 'recipe-rm': if (S.rdraft){ S.rdraft.items.splice(Number(b.dataset.i), 1); renderRecipeItems(); } break;
      case 'recipe-add-manual': recipeAddManual(); break;
      case 'recipe-save': saveRecipe(); break;
      case 'recipe-del': delRecipe(); break;
      case 'close-recipe': closeRecipe(); break;
      case 'close-mini': closeMini(); break;
      case 'open-badges': openBadges(); break;
      case 'fast-plan': setFast({ plan: b.dataset.plan }); break;
      case 'fast-start': startFast(false); break;
      case 'fast-start-last': startFast(true); break;
      case 'fast-stop': stopFast(false); break;
      case 'fast-hide': setFast({ hide: true }); toast('Panoul de post e ascuns. Îl readuci din Setări.', 'Anulează', () => setFast({ hide: false })); break;
      case 'fast-show': setFast({ hide: b.getAttribute('aria-checked') === 'true' }); { const n = $('[data-action="fast-show"]'); if (n) n.focus(); } break;
      case 'rl-mode': {
        const v = recipeCalc(); if (!v) break;
        S.mini.mode = b.dataset.mode;
        S.mini.qty = S.mini.mode === 'grams' ? Math.round(v.r.totalGrams / v.r.servings) : 1;
        renderRecipeLog(); break;
      }
      case 'rl-qty': S.mini.qty = Number(b.dataset.q); $$('[data-action="rl-qty"]').forEach(x => x.setAttribute('aria-pressed', String(Number(x.dataset.q) === S.mini.qty))); updateRecipeLogPrev(); break;
      case 'rl-meal': S.mini.meal = b.dataset.meal; $$('[data-action="rl-meal"]').forEach(x => x.setAttribute('aria-checked', String(x.dataset.meal === S.mini.meal))); break;
      case 'rl-add': addRecipeLog(); break;
      case 'report-new': makeReport(); break;
      case 'report-open': openReport(); break;
      case 'theme-set': {
        const id = b.dataset.themeId, th = THEMES[id]; if (!th) break;
        if (!th.free && !S.isOwner){ openPlus(id); break; }
        setSkin(id); break;
      }
      case 'open-plus': openPlus(null); break;
      case 'consent-ok': acceptConsent(); break;
      case 'consent-ai': {
        const c = consentOf(); if (!c) break;
        const on = b.getAttribute('aria-checked') !== 'true';
        saveConsent(Object.assign({}, c, { ai: on ? Date.now() : 0 }));
        const sec = $('#dataSec'); if (sec){ sec.innerHTML = dataSection(); const n = sec.querySelector('[data-action="consent-ai"]'); if (n) n.focus(); }
        toast(on ? 'Estimările cu AI sunt pornite.' : 'Estimările cu AI sunt oprite. Nimic nu mai pleacă spre Claude.');
        break;
      }
      case 'del-account': { const box = $('#delBox'); if (box){ box.innerHTML = delConfirmHtml(); $('#delIn').focus(); } break; }
      case 'del-cancel': { const box = $('#delBox'); if (box){ box.innerHTML = '<button class="btn danger-ghost" data-action="del-account">Șterge contul și toate datele</button>'; box.firstChild.focus(); } break; }
      case 'del-confirm': deleteAccount(); break;
      case 'sub-manage': toast('În aplicația din magazin, aici se deschide pagina de abonamente din App Store sau Google Play. ' + (S.isOwner ? 'Ca proprietar nu ai un abonament.' : 'Acum nu ai niciun abonament activ.')); break;
      case 'close-plus': closePlus(); break;
      case 'appearance': {
        S.appearance = b.dataset.v; lsSet('portia-appearance', S.appearance); applyMode(); refreshAppear();
        break;
      }
      case 'dark-shade': {
        S.darkShade = b.dataset.v; lsSet('portia-dark', S.darkShade);
        const el = $('#themeStyle'); if (el) el.textContent = themeCss(S.theme);
        $$('[data-action="dark-shade"]').forEach(x => x.setAttribute('aria-checked', String(x.dataset.v === S.darkShade)));
        break;
      }
      case 'petals-toggle': {
        lsSet('portia-petals', lsGet('portia-petals') === false); updateSnow();
        const sec = $('#themeSec'); if (sec){ sec.innerHTML = themeSection(); const n = sec.querySelector('[data-action="petals-toggle"]'); if (n) n.focus(); }
        break;
      }
      case 'cracks-toggle': {
        lsSet('portia-cracks', !iceCracksOn()); applyTheme(S.theme);
        const sec = $('#themeSec'); if (sec){ sec.innerHTML = themeSection(); const n = sec.querySelector('[data-action="cracks-toggle"]'); if (n) n.focus(); }
        break;
      }
      case 'snow-toggle': { lsSet('portia-snow', lsGet('portia-snow') === false); updateSnow(); const sec = $('#themeSec'); if (sec) sec.innerHTML = themeSection(); break; }
      case 'pick-tier': S.tier = b.dataset.tier; renderPlus(); break;
      case 'pick-plan': S.plan = b.dataset.plan; $$('[data-action="pick-plan"]').forEach(x => x.setAttribute('aria-checked', String(x.dataset.plan === S.plan))); break;
    }
  });
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Enter' && ev.target && ev.target.id === 'askIn'){ ev.preventDefault(); const b = $('[data-action="ask-send"]'); if (b) b.click(); return; }
    const g = ev.target.closest && ev.target.closest('[data-day]');
    if (g && (ev.key === 'Enter' || ev.key === ' ')){ ev.preventDefault(); S.view = g.getAttribute('data-day'); renderDayParts(); return; }
    if (ev.key === 'Escape'){
      const open = $$('.sheet').filter(s => !s.hidden), top = open[open.length - 1];
      if (top && CLOSERS[top.id]) CLOSERS[top.id]();
    }
    if (ev.target.id === 'foodText' && ev.key === 'Enter' && (ev.metaKey || ev.ctrlKey)){ ev.preventDefault(); estimate('text'); }
    if (ev.target.id === 'wIn' && ev.key === 'Enter'){ ev.preventDefault(); saveWeight(); }
    if (ev.target.id === 'bcCode' && ev.key === 'Enter'){ ev.preventDefault(); lookupCode(ev.target.value); }
  });
  document.addEventListener('input', ev => {
    const t = ev.target;
    if (t.closest('#sBody') && t.dataset.field) setupInput(t.dataset.field, t.value);
    if (/^t[KPCFW]$/.test(t.id)) updateTargetSum();
    if (S.rdraft && t.id === 'rName') S.rdraft.name = t.value;
    if (S.rdraft && t.id === 'rServ'){ const v = Math.round(num(t.value)); if (v >= 1 && v <= 50){ S.rdraft.servings = v; renderRecipeItems(); } }
    if (S.rdraft && t.id === 'rWeight'){ const v = num(t.value); S.rdraft.totalGrams = v > 0 ? Math.round(v) : null; }
    if (S.mini && S.mini.kind === 'recipe' && t.id === 'rlG'){ S.mini.qty = Math.max(0, num(t.value) || 0); updateRecipeLogPrev(); }
    if (S.bc && t.id === 'bcQty'){ S.bc.qty = t.value; $$('[data-action="bc-qty"]').forEach(x => x.setAttribute('aria-pressed', String(num(x.dataset.q) === num(t.value)))); updateBcPrev(); }
    const BPF = { bpName: 'name', bpK: 'kcal', bpP: 'protein', bpC: 'carbs', bpF: 'fat', bpServ: 'serving', bpPack: 'pack' };
    if (S.bc && S.bc.draft && BPF[t.id]) S.bc.draft[BPF[t.id]] = t.value;
  });
  $('#photoInput').addEventListener('change', ev => onPhoto(ev.target.files && ev.target.files[0]));
  document.addEventListener('change', ev => {
    const t = ev.target;
    if (t.id === 'bcInput') onBarcodePhoto(t.files && t.files[0]);
    if (t.id === 'bcLabelInput') readLabel(t.files && t.files[0]);
    if (t.dataset && t.dataset.consent && S.cdraft){ S.cdraft[t.dataset.consent] = t.checked; const b = $('[data-action="consent-ok"]'); if (b) b.disabled = !(S.cdraft.health && S.cdraft.age); }
  });
  $('#toastBtn').addEventListener('click', () => { const fn = toastFn; toastFn = null; $('#toast').hidden = true; if (fn) fn(); });
  $$('.sheet').forEach(s => s.addEventListener('click', ev => { if (ev.target === s && s.id !== 'setup' && CLOSERS[s.id]) CLOSERS[s.id](); }));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) renderDayParts(); });
  const recolorSnow = () => { if (Snow.cvs && !Snow.cvs.hidden){ snowColor(); drawSnow(); } };
  try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', recolorSnow); } catch (e) {}
  try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', refreshAppear); } catch (e) {}
  try { new MutationObserver(recolorSnow).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); } catch (e) {}
}

boot();
})();
