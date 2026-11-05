// Author's settings, applied on the first visit (when this browser has none saved yet).
// Regenerate from a file made by "Сохранить все настройки".
const DEFAULT_SETTINGS = {
 "app": "nokia6070-emulator",
 "version": 1,
 "controls": {
  "showBody": true,
  "bodyKind": "silverA",
  "bodyBright": "0.15",
  "bodyGamma": "1",
  "bodySat": "1",
  "c:teal.status": "#48a8a8",
  "c:teal.title": "#122c42",
  "c:teal.body": "#b2e4dc",
  "c:teal.soft": "#122c42",
  "c:teal.softInk": "#ffffff",
  "c:teal.clock": "#122c42",
  "c:teal.sel": "#122c42",
  "c:teal.line": "#3c7880",
  "c:teal.idleTop": "#46a0a5",
  "c:teal.idleBottom": "#103448",
  "c:game.court": "#a3d04e",
  "c:game.line": "#c4e878",
  "c:game.dark": "#0d0f0b",
  "c:game.mid": "#213215",
  "bgBlur": "24",
  "bgBright": "1",
  "bgScale": "1",
  "bgX": "50",
  "bgY": "50",
  "vignette": "0.65",
  "bg1": "#1a1d1f",
  "bg2": "#101213",
  "bg3": "#050606",
  "reflEnv": "0",
  "reflBlur": "6",
  "reflBand": "0",
  "reflBandW": "0.3",
  "reflAngle": "25",
  "reflShift": "0",
  "reflFollow": true,
  "theme": "teal",
  "op": "",
  "time": "12:30",
  "date": "15.03.2008",
  "from": "900",
  "text": "Perevod 500r. na nomer 79161234567 vypolnen. Dengi dostavleny.",
  "inbox": "900 | Zachislenie 1200r. Balans 3450r.\nMama | Pozvoni mne vecherom\nSasha | Ty gde? Zhdu u metro\nOleg | Zavtra v 10 u vhoda\nLena | Kupi hleba po doroge\n900 | Spisanie 350r. Balans 2250r.\nPapa | Zabral mashinu iz servisa\nDima | V subbotu futbol v 11\nMarina | S dnem rozhdeniya!!!\n900 | Zachislenie 5000r. Balans 2600r.\nSasha | Opazdyvayu na 10 min\nMama | Ty poel?",
  "ballSpeed": "1",
  "scale": "3",
  "rotX": "48.5",
  "rotY": "-0.5",
  "rotZ": "0.5",
  "persp": "2560",
  "zoom": "2.53",
  "fxGrid": "0.25",
  "fxGridAlpha": "0.13",
  "fxGridBlur": "0.08",
  "fxNoise": "0.04",
  "fxDirt": "0.12",
  "fxCA": "0.35",
  "fxDefocus": "0",
  "fxFocus": "0.5",
  "fxDof": "0.45"
 },
 "pan": {
  "x": 161.26145362868877,
  "y": 927.05034367045
 },
 "cams": [],
 "bgImage": "",
 "shotCams": [
  {
   "rotX": "31.5",
   "rotY": "0",
   "rotZ": "0",
   "persp": "900",
   "zoom": "1.8",
   "pan": {
    "x": 37.45002298725484,
    "y": 591.7743515907185
   }
  },
  {
   "rotX": "48.5",
   "rotY": "-0.5",
   "rotZ": "0.5",
   "persp": "2560",
   "zoom": "2.53",
   "pan": {
    "x": 161.26145362868877,
    "y": 927.05034367045
   }
  }
 ]
};
// checked before the page writes anything to storage
let FIRST_VISIT = false;
try { FIRST_VISIT = !Object.keys(localStorage).some(k => k.startsWith('nokia6070-')); } catch (e) {}
