import { Kanji } from "https://cdn.jsdelivr.net/npm/@marmooo/kanji@0.1.1/esm/kanji.js";
import { JKAT } from "https://cdn.jsdelivr.net/npm/@marmooo/kanji@0.1.1/esm/jkat.js";
import signaturePad from "https://cdn.jsdelivr.net/npm/signature_pad@5.1.0/+esm";

const jkat = new Kanji(JKAT);
const dirNames = [
  "小1",
  "小2",
  "小3",
  "小4",
  "小5",
  "小6",
  "中2",
  "中3",
  "高校",
  "常用",
  "準1級",
  "1級",
];
const kanjivgDir = "/kanjivg";
const canvasSize = 140;
const repeatCount = 3;
let kanjis = "";
let level = 2;
let clearCount = 0;
let audioContext;
const audioBufferCache = {};
let japaneseVoices = [];
loadVoices();
loadConfig();

// function toKanji(kanjiId) {
//   return String.fromCodePoint(parseInt("0x" + kanjiId));
// }

function getDictUrl(kanji) {
  const baseUrl = "https://marmooo.github.io";
  const grade = jkat.getGrade(kanji);
  if (grade < 0) {
    return null;
  } else {
    return baseUrl + "/kanji-dict/" + dirNames[grade] + "/" + kanji + "/";
  }
}

function loadConfig() {
  if (localStorage.getItem("darkMode") == 1) {
    document.documentElement.setAttribute("data-bs-theme", "dark");
  }
  if (localStorage.getItem("hint") == 1) {
    document.getElementById("hint").textContent = "EASY";
  }
  if (localStorage.getItem("touch-kanji-level")) {
    level = parseInt(localStorage.getItem("touch-kanji-level"));
  }
}

// TODO: :host-context() is not supportted by Safari/Firefox now
function toggleDarkMode() {
  if (localStorage.getItem("darkMode") == 1) {
    localStorage.setItem("darkMode", 0);
    document.documentElement.setAttribute("data-bs-theme", "light");
    boxes.forEach((box) => {
      const target = box.shadowRoot.querySelectorAll("object, canvas");
      [...target].forEach((canvas) => {
        canvas.removeAttribute("style");
      });
    });
  } else {
    localStorage.setItem("darkMode", 1);
    document.documentElement.setAttribute("data-bs-theme", "dark");
    boxes.forEach((box) => {
      const target = box.shadowRoot.querySelectorAll("object, canvas");
      [...target].forEach((canvas) => {
        canvas.setAttribute("style", "filter: invert(1) hue-rotate(180deg);");
      });
    });
  }
}

function toggleHint(event) {
  if (localStorage.getItem("hint") == 1) {
    localStorage.setItem("hint", 0);
    event.target.textContent = "HARD";
  } else {
    localStorage.setItem("hint", 1);
    event.target.textContent = "EASY";
  }
  toggleAllStroke();
}

function toggleScroll() {
  const scrollOn = document.getElementById("scrollOn");
  const scrollOff = document.getElementById("scrollOff");
  if (scrollOn.classList.contains("d-none")) {
    document.body.style.overflow = "visible";
    scrollOn.classList.remove("d-none");
    scrollOff.classList.add("d-none");
  } else {
    document.body.style.overflow = "hidden";
    scrollOn.classList.add("d-none");
    scrollOff.classList.remove("d-none");
  }
}

function toggleVoice() {
  const voiceOn = document.getElementById("voiceOn");
  const voiceOff = document.getElementById("voiceOff");
  if (voiceOn.classList.contains("d-none")) {
    voiceOn.classList.remove("d-none");
    voiceOff.classList.add("d-none");
  } else {
    voiceOn.classList.add("d-none");
    voiceOff.classList.remove("d-none");
  }
}

function createAudioContext() {
  if (globalThis.AudioContext) {
    return new globalThis.AudioContext();
  } else {
    console.error("Web Audio API is not supported in this browser");
    return null;
  }
}

function unlockAudio() {
  const uttr = new SpeechSynthesisUtterance("");
  uttr.lang = "ja-JP";
  speechSynthesis.speak(uttr);

  if (audioContext) {
    audioContext.resume();
  } else {
    audioContext = createAudioContext();
    loadAudio("stupid", "/touch-kanji/mp3/stupid5.mp3");
    loadAudio("correct", "/touch-kanji/mp3/correct3.mp3");
    loadAudio("correctAll", "/touch-kanji/mp3/correct1.mp3");
    loadAudio("incorrect", "/touch-kanji/mp3/incorrect1.mp3");
  }
  document.removeEventListener("click", unlockAudio);
  document.removeEventListener("keydown", unlockAudio);
}

async function loadAudio(name, url) {
  if (!audioContext) return;
  if (audioBufferCache[name]) return audioBufferCache[name];
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    audioBufferCache[name] = audioBuffer;
    return audioBuffer;
  } catch (error) {
    console.error(`Loading audio ${name} error:`, error);
    throw error;
  }
}

function playAudio(name, volume) {
  if (!audioContext) return;
  const audioBuffer = audioBufferCache[name];
  if (!audioBuffer) {
    console.error(`Audio ${name} is not found in cache`);
    return;
  }
  const sourceNode = audioContext.createBufferSource();
  sourceNode.buffer = audioBuffer;
  const gainNode = audioContext.createGain();
  if (volume) gainNode.gain.value = volume;
  gainNode.connect(audioContext.destination);
  sourceNode.connect(gainNode);
  sourceNode.start();
}

function loadVoices() {
  // https://stackoverflow.com/questions/21513706/
  const allVoicesObtained = new Promise((resolve) => {
    let voices = speechSynthesis.getVoices();
    if (voices.length !== 0) {
      resolve(voices);
    } else {
      let supported = false;
      speechSynthesis.addEventListener("voiceschanged", () => {
        supported = true;
        voices = speechSynthesis.getVoices();
        resolve(voices);
      });
      setTimeout(() => {
        if (!supported) {
          document.getElementById("noTTS").classList.remove("d-none");
        }
      }, 1000);
    }
  });
  allVoicesObtained.then((voices) => {
    japaneseVoices = voices.filter((voice) => voice.lang == "ja-JP");
  });
}

function loopVoice(text, n) {
  speechSynthesis.cancel();
  text = new Array(n).fill(`${text}。`).join(" ");
  const msg = new globalThis.SpeechSynthesisUtterance(text);
  msg.voice = japaneseVoices[Math.floor(Math.random() * japaneseVoices.length)];
  msg.lang = "ja-JP";
  speechSynthesis.speak(msg);
}

class ProblemBox extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [globalCSS];

    const template = document.getElementById("problem-box")
      .content.cloneNode(true);
    this.shadowRoot.appendChild(template);
  }
}
customElements.define("problem-box", ProblemBox);

class TehonBox extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [globalCSS];

    const template = document.getElementById("tehon-box")
      .content.cloneNode(true);
    this.shadowRoot.appendChild(template);

    if (document.documentElement.getAttribute("data-bs-theme") == "dark") {
      const target = this.shadowRoot.querySelectorAll("object, canvas");
      [...target].forEach((canvas) => {
        canvas.setAttribute("style", "filter: invert(1) hue-rotate(180deg);");
      });
    }
  }
}
customElements.define("tehon-box", TehonBox);

class TegakiBox extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.adoptedStyleSheets = [globalCSS];

    const template = document.getElementById("tegaki-box")
      .content.cloneNode(true);
    this.shadowRoot.appendChild(template);

    if (document.documentElement.getAttribute("data-bs-theme") == "dark") {
      const target = this.shadowRoot.querySelectorAll("object, canvas");
      [...target].forEach((canvas) => {
        canvas.setAttribute("style", "filter: invert(1) hue-rotate(180deg);");
      });
    }
  }
}
customElements.define("tegaki-box", TegakiBox);

function getKakusu(object, kanjiId) {
  let max = 1;
  while (true) {
    const path = object.contentDocument.getElementById(
      "kvg:" + kanjiId + "-s" + max,
    );
    if (path) {
      max += 1;
    } else {
      break;
    }
  }
  return max - 1;
}

async function getTehonCanvas(object, kanjiId, kakusu, kakuNo) {
  const clonedContent = object.contentDocument.cloneNode(true);
  const id = "kvg:StrokePaths_" + kanjiId;
  const paths = clonedContent.querySelector('[id="' + id + '"]');
  paths.style.stroke = "black";
  for (let j = 1; j <= kakusu; j++) {
    const path = clonedContent.getElementById("kvg:" + kanjiId + "-s" + j);
    if (kakuNo != j) {
      path.remove();
    }
  }
  const text = clonedContent.documentElement.outerHTML;
  const blob = new Blob([text], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.src = url;
  await new Promise((resolve) => {
    img.onload = resolve;
  });
  const canvas = document.createElement("canvas");
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, canvasSize, canvasSize);
  return canvas;
}

function toKanjiId(str) {
  const hex = str.codePointAt(0).toString(16);
  return ("00000" + hex).slice(-5);
}

function loadSVG(kanji, kanjiId, parentNode, pos, loadCanvas) {
  let box;
  if (loadCanvas) {
    box = new TegakiBox();
  } else {
    box = new TehonBox();
  }
  boxes.push(box);
  const object = box.shadowRoot.querySelector("object");
  object.setAttribute("alt", kanji);
  object.setAttribute("data", kanjivgDir + "/" + kanjiId + ".svg");
  object.setAttribute("data-id", kanjiId);
  object.setAttribute("data-pos", pos);
  if (loadCanvas) {
    object.onload = initSVG;
  }
  parentNode.appendChild(box);
  return object;
}

function showKanjiScore(
  kanjiScore,
  kakuScores,
  scoreObj,
  tehonKanji,
  object,
  kanjiId,
  kakusu,
) {
  kanjiScore = Math.floor(kanjiScore);
  if (kanjiScore >= 80) {
    playAudio("correct", 0.3);
  } else {
    playAudio("incorrect", 0.3);
  }
  scoreObj.classList.remove("d-none");
  scoreObj.textContent = kanjiScore;
  for (let i = 0; i < kakusu; i++) {
    changePathColor(i + 1, tehonKanji, kanjiId, "black");
  }
  for (let i = 0; i < kakusu; i++) {
    if (!kakuScores[i][0] || kakuScores[i][0] < 80) {
      changePathColor(i + 1, tehonKanji, kanjiId, "red");
    }
  }
  if (localStorage.getItem("hint") != 1) {
    changeAllColor(object, kanjiId, "lightgray");
  }
}

function getKanjiScores(
  kakuScores,
  scoreObj,
  tehonKanji,
  object,
  kanjiId,
  kakusu,
) {
  let kanjiScore = 0;
  let totalTehonCount = 0;
  kakuScores.forEach((kakuData) => {
    const [kakuScore, tehonCount] = kakuData;
    kanjiScore += kakuScore * tehonCount;
    totalTehonCount += tehonCount;
  });
  kanjiScore /= totalTehonCount;
  showKanjiScore(
    kanjiScore,
    kakuScores,
    scoreObj,
    tehonKanji,
    object,
    kanjiId,
    kakusu,
  );
  return kanjiScore;
}

async function getProblemScores(tegakiPanel, tehonPanel, objects, tegakiPads) {
  const scores = new Array(objects.length);
  for (let i = 0; i < objects.length; i++) {
    const object = objects[i];
    const kanjiId = object.dataset.id;
    const kakusu = getKakusu(object, kanjiId);
    const pos = parseInt(object.dataset.pos);
    const tegakiData = tegakiPads[i].toData();
    let kanjiScores = 0;
    if (tegakiData.length != 0) {
      const tehonKanji = tehonPanel.children[pos]
        .shadowRoot.querySelector("object");
      const scoreObj = tegakiPanel.children[pos]
        .shadowRoot.querySelector(".score");
      const kakuScores = await getKakuScores(
        tegakiData,
        object,
        kanjiId,
        kakusu,
      );
      kanjiScores = getKanjiScores(
        kakuScores,
        scoreObj,
        tehonKanji,
        object,
        kanjiId,
        kakusu,
      );
    }
    scores[i] = kanjiScores;
  }
  return scores;
}

function setScoringButton(
  problemBox,
  tegakiPanel,
  tehonPanel,
  objects,
  tegakiPads,
  word,
) {
  const scoring = problemBox.shadowRoot.querySelector(".scoring");
  scoring.addEventListener("click", async () => {
    const scores = await getProblemScores(
      tegakiPanel,
      tehonPanel,
      objects,
      tegakiPads,
    );
    if (scores.every((score) => score >= 80)) {
      clearCount += 1;
      problemBox.shadowRoot.querySelector(".guard").style.height = "100%";
      const next = problemBox.nextElementSibling;
      if (next) {
        const voiceOff = document.getElementById("voiceOn")
          .classList.contains("d-none");
        if (!voiceOff) {
          const hira = words[clearCount].split("|")[1];
          loopVoice(hira, repeatCount);
        }
        next.shadowRoot.querySelector(".guard").style.height = "0";
        const headerHeight = document.getElementById("header").offsetHeight;
        const top = next.getBoundingClientRect().top +
          document.documentElement.scrollTop - headerHeight;
        globalThis.scrollTo({ top: top, behavior: "smooth" });
      }
    }
    // 点数があまりにも低いものは合格リストから除外
    let clearedKanjis = localStorage.getItem("touch-kanji");
    if (clearedKanjis) {
      let removed = false;
      scores.forEach((score, i) => {
        if (score < 40) {
          clearedKanjis = clearedKanjis.replace(word[i], "");
          removed = true;
        }
      });
      if (removed) {
        localStorage.setItem("touch-kanji", clearedKanjis);
      }
    }
  });
}

function setSignaturePad(object) {
  const canvas = object.parentNode.querySelector("canvas");
  return new signaturePad(canvas, {
    minWidth: 2,
    maxWidth: 2,
    penColor: "black",
    throttle: 0,
    minDistance: 0,
  });
}

function setEraser(tegakiPad, tegakiPanel, tehonPanel, object, kanjiId) {
  const currKanji = object.getRootNode().host;
  const kanjiPos = [...tegakiPanel.children].findIndex((x) => x == currKanji);
  const eraser = tehonPanel.children[kanjiPos]
    .shadowRoot.querySelector(".eraser");
  eraser.onclick = () => {
    const data = tegakiPad.toData();
    if (data) {
      tegakiPad.clear();
    }
    const pos = parseInt(object.dataset.pos);
    const scoreObj = tegakiPanel.children[pos]
      .shadowRoot.querySelector(".score");
    scoreObj.classList.add("d-none");
    if (localStorage.getItem("hint") != 1) {
      changeAllColor(object, kanjiId, "none");
    }
  };
}

function setDict(tehonPanel, object, kanji) {
  const pos = parseInt(object.dataset.pos);
  const dict = tehonPanel.children[pos].shadowRoot.querySelector(".dict");
  const url = getDictUrl(kanji);
  if (url) {
    dict.href = url;
  } else {
    dict.classList.add("d-none");
  }
}

function loadProblem(wordYomi) {
  const [word, yomi] = wordYomi.split("|");
  const problemBox = new ProblemBox();
  const shadow = problemBox.shadowRoot;
  const info = shadow.querySelector(".info");
  info.textContent = yomi;
  const search = shadow.querySelector(".search");
  search.href = "https://www.google.com/search?q=" + word + "とは";
  const objects = [];
  const tegakiPads = [];
  const tehon = shadow.querySelector(".tehon");
  const tegaki = shadow.querySelector(".tegaki");
  word.split("").forEach((kanji, pos) => {
    const kanjiId = toKanjiId(kanji);
    loadSVG(kanji, kanjiId, tehon, pos, false);
    const object = loadSVG(kanji, kanjiId, tegaki, pos, true);
    const tegakiPad = setSignaturePad(object);
    objects.push(object);
    tegakiPads.push(tegakiPad);
    setEraser(tegakiPad, tegaki, tehon, object, kanjiId);
    setDict(tehon, object, kanji);
  });
  setScoringButton(problemBox, tegaki, tehon, objects, tegakiPads, word);
  document.getElementById("problems").appendChild(problemBox);
}

// 器用差の大きい低学年の採点が緩くなるよう太さを変える
function setStrokeWidth(kakusu) {
  return 15 + 6 / kakusu;
}

function toggleAllStroke() {
  const problems = document.getElementById("problems").children;
  for (const problem of problems) {
    const tegakiBoxes = problem.shadowRoot.querySelector(".tegaki").children;
    for (const tegakiBox of tegakiBoxes) {
      const object = tegakiBox.shadowRoot.querySelector("object");
      const kanjiId = object.dataset.id;
      const kakusu = getKakusu(object, kanjiId);
      toggleStroke(object, kanjiId, kakusu);
    }
  }
}

function toggleStroke(object, kanjiId, kakusu) {
  const id = "kvg:StrokePaths_" + kanjiId;
  const paths = object.contentDocument.querySelector('[id="' + id + '"]');
  if (localStorage.getItem("hint") != 1) {
    paths.style.stroke = "none";
  } else {
    paths.style.stroke = "lightgray";
  }
  paths.style.strokeWidth = setStrokeWidth(kakusu);
}

function changeAllColor(object, kanjiId, color) {
  const id = "kvg:StrokePaths_" + kanjiId;
  const paths = object.contentDocument.querySelector('[id="' + id + '"]');
  paths.style.stroke = color;
}

function changePathColor(pos, object, kanjiId, color) {
  const path = object.contentDocument.getElementById(
    "kvg:" + kanjiId + "-s" + pos,
  );
  path.setAttribute("stroke", color);
}

function removeNumbers(object, kanjiId) {
  const id = "kvg:StrokeNumbers_" + kanjiId;
  const numbers = object.contentDocument.querySelector('[id="' + id + '"]');
  numbers.remove();
}

function countNoTransparent(data) {
  let count = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] != 0) {
      count += 1;
    }
  }
  return count;
}

function getInclusionCount(tegakiImgData, tehonImgData) {
  for (let i = 3; i < tegakiImgData.length; i += 4) {
    if (tehonImgData[i] != 0) {
      tegakiImgData[i] = 0;
    }
  }
  const inclusionCount = countNoTransparent(tegakiImgData);
  return inclusionCount;
}

function getScoringFactor(level) {
  switch (level) {
    case 0:
      return 0.5 ** 2;
    case 1:
      return 0.6 ** 2;
    case 2:
      return 0.7 ** 2;
    case 3:
      return 0.8 ** 2;
    case 4:
      return 0.9 ** 2;
    default:
      return 0.7 ** 2;
  }
}

function calcKakuScore(tegakiCount, tehonCount, inclusionCount) {
  // 線長を優遇し過ぎると ["未","末"], ["土","士"] の見分けができなくなる
  let lineScore = 1 - Math.abs((tehonCount - tegakiCount) / tehonCount);
  if (lineScore > 1) lineScore = 1;
  // 包含率を優遇し過ぎると ["一","つ"], ["二","＝"] の見分けができなくなる
  let inclusionScore = (tegakiCount - inclusionCount) / tegakiCount;
  if (inclusionScore > 1) inclusionScore = 1;
  // 100点が取れないので少しだけ採点を甘くする
  let kakuScore = lineScore * inclusionScore * 100 / getScoringFactor(level);
  if (kakuScore < 0) kakuScore = 0;
  if (kakuScore > 100) kakuScore = 100;
  if (isNaN(kakuScore)) kakuScore = 0;
  return kakuScore;
}

async function getKakuScores(tegakiData, object, kanjiId, kakusu) {
  const scores = new Array(kakusu);
  const svgSize = 109;
  const markerWidth = setStrokeWidth(kakusu) * svgSize / canvasSize;
  for (let i = 0; i < kakusu; i++) {
    if (tegakiData[i]) {
      tegakiData[i].minWidth = markerWidth;
      tegakiData[i].maxWidth = markerWidth;
      const markerCanvas = document.createElement("canvas");
      markerCanvas.setAttribute("width", canvasSize);
      markerCanvas.setAttribute("height", canvasSize);
      const markerContext = markerCanvas.getContext("2d");
      const markerPad = new signaturePad(markerCanvas, {
        minWidth: markerWidth,
        maxWidth: markerWidth,
        penColor: "black",
      });
      markerPad.fromData([tegakiData[i]]);
      const kakuData =
        markerContext.getImageData(0, 0, canvasSize, canvasSize).data;
      const kakuCount = countNoTransparent(kakuData);
      const tehonCanvas = await getTehonCanvas(object, kanjiId, kakusu, i + 1);
      const tehonImgData = tehonCanvas.getContext("2d")
        .getImageData(0, 0, canvasSize, canvasSize).data;
      const tehonCount = countNoTransparent(tehonImgData);

      const inclusionCount = getInclusionCount(kakuData, tehonImgData);
      const kakuScore = calcKakuScore(
        kakuCount,
        tehonCount,
        inclusionCount,
      );
      scores[i] = [kakuScore, tehonCount];
    } else {
      const tehonCanvas = await getTehonCanvas(object, kanjiId, kakusu, i + 1);
      const tehonImgData = tehonCanvas.getContext("2d")
        .getImageData(0, 0, canvasSize, canvasSize).data;
      const tehonCount = countNoTransparent(tehonImgData);
      scores[i] = [0, tehonCount];
    }
  }
  return scores;
}

function initSVG(event) {
  const object = event.target;
  const kanjiId = object.dataset.id;
  const kakusu = getKakusu(object, kanjiId);
  toggleStroke(object, kanjiId, kakusu);
  removeNumbers(object, kanjiId);
}

function report() {
  const scores = [];
  const problems = document.getElementById("problems").children;
  for (let i = 0; i < problems.length; i++) {
    const tegakis = problems[i].shadowRoot.querySelector(".tegaki").children;
    for (let j = 0; j < tegakis.length; j++) {
      const score = tegakis[j].shadowRoot.querySelector(".score").textContent;
      scores.push(parseInt(score));
    }
  }
  let score = 0;
  for (let i = 0; i < scores.length; i++) {
    score += scores[i];
  }
  score /= scores.length;
  if (score >= 80) {
    playAudio("correctAll");
    let clearedKanjis = localStorage.getItem("touch-kanji");
    if (clearedKanjis) {
      Array.from(kanjis).forEach((kanji) => {
        if (!clearedKanjis.includes(kanji)) {
          clearedKanjis += kanji;
        }
      });
      localStorage.setItem("touch-kanji", clearedKanjis);
    } else {
      localStorage.setItem("touch-kanji", kanjis);
    }
    document.getElementById("report").classList.add("d-none");
    document.getElementById("correctReport").classList.remove("d-none");
    setTimeout(() => {
      location.href = "/touch-kanji/";
    }, 3000);
  } else {
    playAudio("stupid");
    document.getElementById("report").classList.add("d-none");
    document.getElementById("incorrectReport").classList.remove("d-none");
    setTimeout(() => {
      document.getElementById("report").classList.remove("d-none");
      document.getElementById("incorrectReport").classList.add("d-none");
    }, 6000);
  }
}

function shuffle(array) {
  for (let i = array.length; 1 < i; i--) {
    const k = Math.floor(Math.random() * i);
    [array[k], array[i - 1]] = [array[i - 1], array[k]];
  }
  return array;
}

async function fetchJson(grade) {
  const response = await fetch(`/touch-kanji/data/${grade + 1}.json`);
  return await response.json();
}

async function initWords() {
  const num = 5;
  const targetGrades = [];
  const targetKanjis = [];
  Array.from(kanjis).forEach((kanji) => {
    const grade = jkat.getGrade(kanji);
    if (grade >= 0) {
      targetGrades.push(grade);
      targetKanjis.push(kanji);
    }
  });
  const promises = targetGrades.map((grade) => fetchJson(grade));
  const data = await Promise.all(promises);
  const words = [];
  if (targetKanjis.length == 1) {
    const kanji = targetKanjis[0];
    const onkun = data[0][kanji].shift();
    const problems = shuffle(data[0][kanji]);
    words.push(onkun, ...problems.slice(0, num));
  } else {
    data.forEach((datum, i) => {
      const kanji = targetKanjis[i];
      datum[kanji].shift();
      const problems = shuffle(datum[kanji]);
      words.push(problems[0]);
    });
  }
  return words;
}

function initDrill() {
  words.forEach((word) => loadProblem(word));
  document.getElementById("problems").children[0]
    .shadowRoot.querySelector(".guard").style.height = "0";
}

function initQuery() {
  const params = new URLSearchParams(location.search);
  kanjis = params.get("q") || "学";
}

function getGlobalCSS() {
  let cssText = "";
  for (const stylesheet of document.styleSheets) {
    for (const rule of stylesheet.cssRules) {
      cssText += rule.cssText;
    }
  }
  const css = new CSSStyleSheet();
  css.replaceSync(cssText);
  return css;
}

const boxes = [];
initQuery();
const words = await initWords();
const globalCSS = getGlobalCSS();
initDrill();

document.getElementById("toggleDarkMode").onclick = toggleDarkMode;
document.getElementById("hint").onclick = toggleHint;
document.getElementById("toggleScroll").onclick = toggleScroll;
document.getElementById("toggleVoice").onclick = toggleVoice;
document.getElementById("reportButton").onclick = report;
document.addEventListener("click", unlockAudio, { once: true });
document.addEventListener("keydown", unlockAudio, { once: true });
