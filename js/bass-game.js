/* File: js/bass-game.js
   Purpose: Bass quiz minigame logic.
*/

const BASS_QUIZ_QUESTIONS = [
  {
    q: "14982+98221+12345は？　ヒント：１の位に注目",
    options: ["65,535", "123,689", "125,548", "127,894"],
    answer: 2,
    explain: "1の位を計算した後に、選択肢の1の位を見ると？"
  },
  {
    q: "銃の安全装置をかけると？",
    options: [
      "引き金を引けなくなり、発砲を完全に防ぐことが出来る。",
      "引き金を引けなくなるが、発砲を完全に防ぐことはできない。",
      "銃が消滅し、世界が平和になる。",
      "人が死ななくなる"
    ],
    answer: 1,
    explain: ""
  },
  {
    q: "見てはいけない、禁止といわれるほど、逆に気になってしまう心理を何という？",
    options: ["ミナイデ効果", "カリギュラ効果", "バーナム効果", "モンティーホール問題"],
    answer: 1,
    explain: "映画の名前「カリギュラ」が由来。過激な内容で上映禁止となり、それがかえって世間の注目を引いたということがもとになっているとされている。"
  },
  {
    q: "恐怖、緊張を感じる状況で、一緒にいる相手を魅力的だと感じてしまう現象は？",
    options: ["吊り橋効果", "ドキドキ効果", "お化け屋敷効果", "ときめき効果"],
    answer: 0,
    explain: "恐怖や緊張による心臓の鼓動を、脳が恋愛感情のときめきと錯覚してしまうため起きる現象"
  },
  {
    q: "「あなたは最近大切な決断をしましたね？」というように、誰にでも当てはまりそうな説明を、自分だけに当てはまると感じてしまう心理は？",
    options: ["ニンベン師効果", "占い効果", "バーナム効果", "詐欺師効果"],
    answer: 2,
    explain: "占いが当たっていると感じる理由の代表例"
  },
  {
    q: "人から親切にされると、お返しをしなければならないと感じる心理は？",
    options: ["ホワイトデー効果", "3倍返しの法則", "返報性の原理", "同調圧力"],
    answer: 2,
    explain: "試食、無料サンプル、「いいね」返しにも使われる心理"
  },
  {
    q: "目の前でトラブルが起きているというのに、誰かがやるだろうと思ってしまい、誰も助けないという心理は？",
    options: ["傍観者効果", "人間原理", "ミテミヌフリ効果", "他人効果"],
    answer: 0,
    explain: "女性が襲われ、目撃者が多数いたにもかかわらず誰も助けようとせずに、そのまま殺されてしまったという事件がありました。"
  },
  {
    q: "20個のうち1つだけが当たりのくじがある。引いたくじは戻さないことにすると、10人目が引いたときに当たる確率は？",
    options: ["1/10", "1/20", "20/20", "1/255"],
    answer: 1,
    explain: "どの順番でも、確率は同じです。"
  },
  {
    q: "最初に相手に小さな要求を承諾させ、段々と要求を大きくしていくことで、目的となる要求を承諾させるという、心理的なテクニックは？",
    options: ["詐欺師効果", "巡回セールスマン問題", "フットインザドア", "卑怯効果"],
    answer: 2,
    explain: "一度相手の要求を承諾してしまうと、次の要求を否定しにくくなるという心理です。"
  }
];

const BASS_QUIZ_TOTAL_QUESTIONS = 3;
const BASS_QUIZ_BGM_SRC = "bgm/黒い幕が上がる夜.mp3";
const BASS_HINT_SELECT = "1-4キー or タップで回答";
const BASS_HINT_NEXT = "Enter/クリックで次の問題へ";
const BASS_SCORE_PER_QUESTION_MAX = 15000;
const BASS_SCORE_DECAY_PER_SEC = 400;

function shuffleBassQuestions(questions) {
  const result = questions.slice();
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function pickBassQuizQuestions(questions, count) {
  const safeCount = Math.max(1, Math.min(count | 0, questions.length));
  return shuffleBassQuestions(questions).slice(0, safeCount);
}

function bassRankByCorrect(correct, total) {
  const questionTotal = Math.max(1, total | 0);
  const ratio = correct / questionTotal;
  if (ratio >= 0.8) return 3;
  if (ratio >= 0.5) return 2;
  return 1;
}

function bassRankByScore(score) {
  if (score >= 27000) return 3;
  if (score >= 18000) return 2;
  return 1;
}

function getBassOptionButtons() {
  if (!el.bassOptions) return [];
  return [...el.bassOptions.querySelectorAll(".bass-option")];
}

function getCurrentBassQuestion() {
  return state.bassQuizQuestions[state.bassQuizIndex] || null;
}

function cancelBassQuizLoop() {
  if (!state.bassQuizLoopId) return;
  cancelAnimationFrame(state.bassQuizLoopId);
  state.bassQuizLoopId = 0;
}

function buildBassTimeGauge() {
  if (!el.bassTimeGrid) return;
  const cellCount = Math.max(1, state.bassQuizTimeLimitSec | 0);
  el.bassTimeGrid.style.setProperty("--bass-time-cells", `${cellCount}`);
  el.bassTimeGrid.innerHTML = "";
  for (let i = 0; i < cellCount; i += 1) {
    const cell = document.createElement("div");
    cell.className = "bass-time-cell";
    el.bassTimeGrid.appendChild(cell);
  }
}

function renderBassTimeGauge(timeLeftSec) {
  if (!el.bassTimeGrid) return;
  const limitSec = Math.max(1, state.bassQuizTimeLimitSec | 0);
  const elapsedCells = Math.max(0, Math.min(limitSec, Math.floor(limitSec - Math.max(0, timeLeftSec))));
  [...el.bassTimeGrid.children].forEach((cell, i) => {
    cell.classList.toggle("off", i < elapsedCells);
  });
}

function updateBassQuizHud(timeLeftSec) {
  const totalQuestions = state.bassQuizQuestions.length || BASS_QUIZ_TOTAL_QUESTIONS;
  const currentQuestion = Math.min(totalQuestions, state.bassQuizIndex + 1);
  const sec = Math.max(0, Math.ceil(timeLeftSec));
  if (el.bassQuizProgress) el.bassQuizProgress.textContent = `Q ${currentQuestion}/${totalQuestions} / TIME ${sec}s`;
  if (el.bassQuizCorrect) el.bassQuizCorrect.textContent = `正解 ${state.bassQuizCorrectCount}`;
  if (el.bassQuizScore) el.bassQuizScore.textContent = `SCORE ${state.bassQuizScore}`;
}

function resetBassQuestionTimer() {
  state.bassQuizQuestionEndsAt = performance.now() + state.bassQuizTimeLimitSec * 1000;
  renderBassTimeGauge(state.bassQuizTimeLimitSec);
  updateBassQuizHud(state.bassQuizTimeLimitSec);
}

function setBassOptionLock(lock) {
  getBassOptionButtons().forEach((btn) => {
    btn.disabled = !!lock;
  });
}

function clearBassOptionResult() {
  getBassOptionButtons().forEach((btn) => {
    btn.classList.remove("correct", "wrong");
  });
}

function renderBassQuestionOptions(question) {
  getBassOptionButtons().forEach((btn, i) => {
    btn.textContent = `${i + 1}. ${question.options[i] || ""}`;
  });
}

function clearBassAnswerExplain() {
  if (!el.bassAnswerExplain) return;
  el.bassAnswerExplain.textContent = "";
  el.bassAnswerExplain.classList.remove("show", "correct", "wrong");
}

function showBassAnswerExplain(question, correct, isTimeout) {
  if (!el.bassAnswerExplain) return;
  const explain = question.explain || "";
  const label = correct ? "正解" : isTimeout ? "時間切れ" : "不正解";
  el.bassAnswerExplain.textContent = `${label}: 正解は ${question.answer + 1}. ${question.options[question.answer]}。${explain}`;
  el.bassAnswerExplain.classList.add("show");
  el.bassAnswerExplain.classList.toggle("correct", correct);
  el.bassAnswerExplain.classList.toggle("wrong", !correct);
}

function renderBassQuestion() {
  const question = getCurrentBassQuestion();
  if (!question) return;
  state.bassQuizAwaitingNext = false;
  clearBassOptionResult();
  clearBassAnswerExplain();
  setBassOptionLock(false);
  if (el.bassQuestionTitle) el.bassQuestionTitle.textContent = `QUESTION ${state.bassQuizIndex + 1}`;
  if (el.bassQuestionText) el.bassQuestionText.textContent = question.q;
  renderBassQuestionOptions(question);
  if (el.bassQuizHint) el.bassQuizHint.textContent = BASS_HINT_SELECT;
  resetBassQuestionTimer();
}

function revealBassAnswer(choiceIndex, isTimeout) {
  if (!state.bassQuizActive || !state.bassQuizRunning || state.bassQuizAwaitingNext) return;
  const question = getCurrentBassQuestion();
  if (!question) return;
  state.bassQuizAwaitingNext = true;
  setBassOptionLock(true);

  const answered = Number.isInteger(choiceIndex) && choiceIndex >= 0;
  const correct = answered && question.answer === choiceIndex;
  const options = getBassOptionButtons();
  if (options[question.answer]) options[question.answer].classList.add("correct");
  if (answered && !correct && options[choiceIndex]) options[choiceIndex].classList.add("wrong");

  if (correct) {
    state.bassQuizCorrectCount += 1;
    const leftSec = Math.max(0, (state.bassQuizQuestionEndsAt - performance.now()) / 1000);
    const elapsedWholeSec = Math.floor(Math.max(0, state.bassQuizTimeLimitSec - leftSec));
    const gained = Math.max(0, BASS_SCORE_PER_QUESTION_MAX - elapsedWholeSec * BASS_SCORE_DECAY_PER_SEC);
    state.bassQuizScore += gained;
  }

  cancelBassQuizLoop();
  updateBassQuizHud((state.bassQuizQuestionEndsAt - performance.now()) / 1000);
  showBassAnswerExplain(question, correct, isTimeout);
  if (el.bassQuizHint) el.bassQuizHint.textContent = BASS_HINT_NEXT;
}

function proceedBassQuiz() {
  if (!state.bassQuizActive || !state.bassQuizRunning || !state.bassQuizAwaitingNext) return;
  state.bassQuizAwaitingNext = false;
  state.bassQuizIndex += 1;
  if (state.bassQuizIndex >= state.bassQuizQuestions.length) {
    finishBassQuiz();
    return;
  }
  renderBassQuestion();
  state.bassQuizLoopId = requestAnimationFrame(bassQuizTick);
}

function finishBassQuiz() {
  if (!state.bassQuizActive) return;
  state.bassQuizRunning = false;
  cancelBassQuizLoop();
  const correct = state.bassQuizCorrectCount;
  const rank = bassRankByScore(state.bassQuizScore);
  state.bassFinalScore = state.bassQuizScore;
  state.members.bass = true;
  setMemberStatus("bass", rank);
  updateHud();
  if (rank === 3) {
    sceneData.bSuccess.text = "く、くやしいっ。わたしにクイズ王は早かったかなぁ？　わかった。ベースやるよ。";
  } else if (rank === 2) {
    sceneData.bSuccess.text = "ふ、ふーん。結構やるね。約束だし、ベースやってあげる。";
  } else {
    sceneData.bSuccess.text = "えっと。軽い練習にはなったかな。お礼にベースやったげる。";
  }
  stopBassQuizGame();
  goScene("bSuccess");
}

function skipBassQuiz() {
  if (!state.bassQuizActive) return;
  state.members.bass = true;
  setMemberStatus("bass", 3);
  updateHud();
  sceneData.bSuccess.text = "Sキーでクイズをスキップ。評価は★3として記録した。学園祭まで、全力で弾く。";
  stopBassQuizGame();
  goScene("bSuccess");
}

function answerBassQuiz(choiceIndex) {
  if (!state.bassQuizActive || !state.bassQuizRunning) return;
  revealBassAnswer(choiceIndex, false);
}

function bassQuizTick(now) {
  if (!state.bassQuizRunning) return;
  const leftSec = (state.bassQuizQuestionEndsAt - now) / 1000;
  renderBassTimeGauge(leftSec);
  updateBassQuizHud(leftSec);
  if (leftSec <= 0) {
    revealBassAnswer(-1, true);
    return;
  }
  state.bassQuizLoopId = requestAnimationFrame(bassQuizTick);
}

function setupBassQuizBgm() {
  if (el.bgm.getAttribute("src") !== BASS_QUIZ_BGM_SRC) {
    el.bgm.src = BASS_QUIZ_BGM_SRC;
    el.bgm.load();
  }
  el.bgm.loop = true;
  el.bgm.playbackRate = 1;
  el.bgm.currentTime = 0;
  if (state.audioOn) el.bgm.play().catch(() => {});
  else el.bgm.pause();
}

function startBassQuizRound() {
  if (!state.bassQuizActive || state.bassQuizRunning) return;
  state.bassQuizRunning = true;
  state.bassQuizQuestions = pickBassQuizQuestions(BASS_QUIZ_QUESTIONS, BASS_QUIZ_TOTAL_QUESTIONS);
  state.bassQuizIndex = 0;
  state.bassQuizCorrectCount = 0;
  state.bassQuizScore = 0;
  state.bassQuizAwaitingNext = false;
  buildBassTimeGauge();
  renderBassQuestion();
  if (el.bassGameLayer) el.bassGameLayer.classList.remove("wrong-hit");
  if (el.bassBrief) el.bassBrief.classList.remove("show");
  setupBassQuizBgm();
  state.bassQuizLoopId = requestAnimationFrame(bassQuizTick);
}

function openBassQuizGame() {
  state.bassQuizActive = true;
  state.bassQuizRunning = false;
  state.bassQuizQuestions = [];
  state.bassQuizIndex = 0;
  state.bassQuizCorrectCount = 0;
  state.bassQuizScore = 0;
  state.bassQuizAwaitingNext = false;
  if (el.bassGameLayer) el.bassGameLayer.classList.remove("wrong-hit");
  if (el.bassBrief) el.bassBrief.classList.add("show");
  if (el.bassAnswerExplain) {
    el.bassAnswerExplain.classList.remove("show", "correct", "wrong");
    el.bassAnswerExplain.textContent = "";
  }
  setBassOptionLock(true);
  buildBassTimeGauge();
  renderBassTimeGauge(state.bassQuizTimeLimitSec);
  updateBassQuizHud(state.bassQuizTimeLimitSec);
  setupBassQuizBgm();
  el.app.classList.add("bass-mode");
  el.bassGameLayer.classList.add("active");
  el.textboxAdvance.classList.add("hidden");
}

function stopBassQuizGame() {
  state.bassQuizActive = false;
  state.bassQuizRunning = false;
  state.bassQuizAwaitingNext = false;
  cancelBassQuizLoop();
  if (el.bassGameLayer) {
    el.bassGameLayer.classList.remove("active");
    el.bassGameLayer.classList.remove("wrong-hit");
  }
  if (el.bassBrief) el.bassBrief.classList.remove("show");
  el.app.classList.remove("bass-mode");
  el.textboxAdvance.classList.remove("hidden");
  restoreDefaultBgm();
}
