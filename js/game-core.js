/* File: js/game-core.js
   Purpose: Core DOM/state definitions and shared game utilities.
*/

const el = {
  app: document.getElementById("app"),
  titleScreen: document.getElementById("titleScreen"),
  gameScreen: document.getElementById("gameScreen"),
  titleMenu: [...document.querySelectorAll(".menu-item")],
  audioToggles: [...document.querySelectorAll("[data-audio-toggle]")],
  howtoPanel: document.getElementById("howtoPanel"),
  closeHowto: document.getElementById("closeHowto"),
  bgA: document.getElementById("bgA"),
  bgB: document.getElementById("bgB"),
  wipe: document.getElementById("wipe"),
  hud: document.getElementById("hud"),
  gState: document.getElementById("gState"),
  bState: document.getElementById("bState"),
  dState: document.getElementById("dState"),
  charaLeft: document.getElementById("charaLeft"),
  charaRight: document.getElementById("charaRight"),
  nameTag: document.getElementById("nameTag"),
  dialog: document.getElementById("dialog"),
  choices: document.getElementById("choices"),
  nextIndicator: document.getElementById("nextIndicator"),
  textboxAdvance: document.getElementById("textboxAdvance"),
  audioBtn: document.getElementById("audioBtn"),
  backTitleBtn: document.getElementById("backTitleBtn"),
  bgm: document.getElementById("bgm"),
  liveGameLayer: document.getElementById("liveGameLayer"),
  liveField: document.getElementById("liveField"),
  liveCastLane: document.getElementById("liveCastLane"),
  liveCast1: document.getElementById("liveCast1"),
  liveCast2: document.getElementById("liveCast2"),
  liveCast3: document.getElementById("liveCast3"),
  liveCast4: document.getElementById("liveCast4"),
  liveCutin: document.getElementById("liveCutin"),
  liveCutinImg: document.getElementById("liveCutinImg"),
  liveCutinText: document.getElementById("liveCutinText"),
  liveComboBurst: document.getElementById("liveComboBurst"),
  liveComboBurstMain: document.getElementById("liveComboBurstMain"),
  liveStreakFx: document.getElementById("liveStreakFx"),
  liveCallFx: document.getElementById("liveCallFx"),
  liveKeyMini: document.getElementById("liveKeyMini"),
  liveKeyMiniPrompt: document.getElementById("liveKeyMiniPrompt"),
  liveKeyMiniTyped: document.getElementById("liveKeyMiniTyped"),
  liveKeyMiniTimer: document.getElementById("liveKeyMiniTimer"),
  liveKeyMiniResult: document.getElementById("liveKeyMiniResult"),
  liveStartBtn: document.getElementById("liveStartBtn"),
  liveMusicSelect: document.getElementById("liveMusicSelect"),
  liveTimer: document.getElementById("liveTimer"),
  liveFeverStatus: document.getElementById("liveFeverStatus"),
  liveScoreLabel: document.getElementById("liveScoreLabel"),
  liveScoreFill: document.getElementById("liveScoreFill"),
  liveComboBonus: document.getElementById("liveComboBonus"),
  liveCombo: document.getElementById("liveCombo"),
  liveNote: document.getElementById("liveNote"),
  liveFeverBtn: document.getElementById("liveFeverBtn"),
  statusPanel: document.getElementById("statusPanel"),
  guitarStars: document.getElementById("guitarStars"),
  bassStars: document.getElementById("bassStars"),
  drumStars: document.getElementById("drumStars"),
  guitarGameLayer: document.getElementById("guitarGameLayer"),
  guitarCanvas: document.getElementById("guitarCanvas"),
  guitarStartBtn: document.getElementById("guitarStartBtn"),
  guitarJumpBtn: document.getElementById("guitarJumpBtn"),
  guitarSlideBtn: document.getElementById("guitarSlideBtn"),
  guitarShootBtn: document.getElementById("guitarShootBtn"),
  guitarTutorialEndBtn: document.getElementById("guitarTutorialEndBtn"),
  guitarBrief: document.getElementById("guitarBrief"),
  guitarBriefStart: document.getElementById("guitarBriefStart"),
  guitarBriefTutorial: document.getElementById("guitarBriefTutorial"),
  guitarBriefPreview: document.getElementById("guitarBriefPreview"),
  guitarTimer: document.getElementById("guitarTimer"),
  guitarBest: document.getElementById("guitarBest"),
  guitarHint: document.getElementById("guitarHint"),
  bassGameLayer: document.getElementById("bassGameLayer"),
  bassQuizProgress: document.getElementById("bassQuizProgress"),
  bassQuizCorrect: document.getElementById("bassQuizCorrect"),
  bassQuizScore: document.getElementById("bassQuizScore"),
  bassQuizHint: document.getElementById("bassQuizHint"),
  bassBrief: document.getElementById("bassBrief"),
  bassBriefStart: document.getElementById("bassBriefStart"),
  bassQuizCard: document.getElementById("bassQuizCard"),
  bassTimeGrid: document.getElementById("bassTimeGrid"),
  bassQuestionTitle: document.getElementById("bassQuestionTitle"),
  bassQuestionText: document.getElementById("bassQuestionText"),
  bassQuizSpeech: document.getElementById("bassQuizSpeech"),
  bassAnswerExplain: document.getElementById("bassAnswerExplain"),
  bassOptions: document.getElementById("bassOptions"),
  drumGameLayer: document.getElementById("drumGameLayer"),
  drumCanvas: document.getElementById("drumCanvas"),
  drumCommsLayer: document.getElementById("drumCommsLayer"),
  drumCommsPanel: document.getElementById("drumCommsPanel"),
  drumCommsLine: document.getElementById("drumCommsLine"),
  drumCommsClaim: document.getElementById("drumCommsClaim"),
  drumCommsInfo: document.getElementById("drumCommsInfo"),
  drumCommsTimeFill: document.getElementById("drumCommsTimeFill"),
  drumCommsTimeLabel: document.getElementById("drumCommsTimeLabel"),
  drumCommsResult: document.getElementById("drumCommsResult"),
  drumCommsShot: document.getElementById("drumCommsShot"),
  drumKills: document.getElementById("drumKills"),
  drumBossGauge: document.getElementById("drumBossGauge"),
  drumBossFill: document.getElementById("drumBossFill"),
  drumBossLabel: document.getElementById("drumBossLabel"),
  drumScoreText: document.getElementById("drumScoreText"),
  drumHpGauge: document.getElementById("drumHpGauge"),
  drumHpFill: document.getElementById("drumHpFill"),
  drumHpLabel: document.getElementById("drumHpLabel"),
  drumDashGauge: document.getElementById("drumDashGauge"),
  drumDashFill: document.getElementById("drumDashFill"),
  drumDashLabel: document.getElementById("drumDashLabel"),
  drumUpBtn: document.getElementById("drumUpBtn"),
  drumDownBtn: document.getElementById("drumDownBtn"),
  drumLeftBtn: document.getElementById("drumLeftBtn"),
  drumRightBtn: document.getElementById("drumRightBtn")
};

const state = {
  menuIndex: 0,
  typing: false,
  fullText: "",
  shownText: "",
  typeProgress: 0,
  typeSpeed: 28,
  typeLastTime: 0,
  typeOnDone: null,
  storyAdvanceLockUntil: 0,
  currentScene: "intro1",
  currentBgKey: null,
  waitingChoice: false,
  members: { guitar: false, bass: false, drum: false },
  audioUnlocked: false,
  audioOn: false,
  useBgA: true,
  liveActive: false,
  liveRunning: false,
  liveScore: 0,
  liveTarget: 10,
  liveMood: 50,
  liveCombo: 0,
  liveBestCombo: 0,
  liveDurationSec: 150,
  liveTimeLeft: 0,
  liveSuccess: false,
  livePerformanceTier: "fail",
  liveMusic: "track1",
  defaultBgm: "bgm/\u653e\u8ab2\u5f8c\u306e\u592a\u967d\u5149\u7dda.mp3",
  liveVoices: [],
  liveSpawnAcc: 0,
  liveLoopId: 0,
  liveLastTick: 0,
  livePositiveTexts: ["最高のノリだ！", "その調子！", "もっと響かせて！", "会場が熱い！"],
  liveNegativeTexts: ["なにこれ？", "リズムがズレてる", "今のミス痛い", "まだいける？"],
  liveCastActors: [],
  liveCastJumpAcc: 0,
  liveElapsed: 0,
  liveNextCutinAt: 20,
  liveNegativeRate: 0.46,
  liveSpeedScale: 1,
  liveScoreBonus: 0,
  liveCamKickUntil: 0,
  liveCamDriftUntil: 0,
  liveCamSeed: 0,
  liveComboMilestoneShown: 0,
  liveFeverEligible: false,
  liveFeverAvailable: false,
  liveFeverActive: false,
  liveFeverEndAt: 0,
  liveFeverShield: false,
  seContext: null,
  liveCutins: [
    { key: "hero", text: "主人公: この一音で、全員をつなぐ！" },
    { key: "guitar", text: "香: ギター、もっと前に出る！" },
    { key: "bass", text: "三つ葉: 低音で支える、いくよ。" },
    { key: "drum", text: "茉桜: ビートで会場ごと揺らしていく！" }
  ],
  liveCutinIndex: 0,
  liveCutinFinished: false,
  liveCutinScoreBonus: 1,
  liveKeyMiniActive: false,
  liveKeyMiniWaitingInput: false,
  liveKeyMiniPromptKana: "",
  liveKeyMiniCandidates: [],
  liveKeyMiniTyped: "",
  liveKeyMiniDeadlineAt: 0,
  liveKeyMiniResumeAt: 0,
  liveKeyMiniNextAt: 20,
  liveKeyMiniStreak: 0,
  liveKeyMiniPauseStartedAt: 0,
  liveKeyMiniCallActive: false,
  liveKeyMiniCallUntil: 0,
  memberStatus: { guitar: 0, bass: 0, drum: 0 },
  recruitMiss: { bass: 0, drum: 0 },
  guitarGameActive: false,
  guitarGameRunning: false,
  guitarLoopId: 0,
  guitarRank: 1,
  guitarTime: 0,
  guitarTimeLimit: 85,
  guitarTutorialMode: false,
  guitarLastTick: 0,
  guitarWorld: null,
  bassQuizActive: false,
  bassQuizRunning: false,
  bassQuizQuestions: [],
  bassQuizIndex: 0,
  bassQuizCorrectCount: 0,
  bassQuizScore: 0,
  bassQuizAwaitingNext: false,
  bassQuizTimeLimitSec: 20,
  bassQuizQuestionEndsAt: 0,
  bassQuizSpeechTimerId: 0,
  bassQuizLoopId: 0,
  drumGameActive: false,
  drumGameRunning: false,
  drumLoopId: 0,
  drumLastTick: 0,
  drumTime: 0,
  drumTimeLimit: 75,
  drumTargetKills: 100,
  drumCommsActive: false,
  drumCommsInfoSelected: "",
  drumCommsData: null,
  drumCommsUiBound: false,
  drumCommsWarnTimer: 0,
  drumCommsIntroTimer: 0,
  drumCommsPending: false,
  drumWorld: null,
  drumTouchInput: {
    up: false,
    down: false,
    left: false,
    right: false,
    shoot: false
  },
  drumKeyHeld: {
    up: false,
    down: false,
    left: false,
    right: false,
    shoot: false
  },
  drumAutoFire: false,
  drumInput: {
    up: false,
    down: false,
    left: false,
    right: false,
    shoot: false
  }
};

function selectMenu(index) {
  state.menuIndex = (index + el.titleMenu.length) % el.titleMenu.length;
  el.titleMenu.forEach((btn, i) => btn.classList.toggle("selected", i === state.menuIndex));
}

function showHowto(show) {
  el.howtoPanel.classList.toggle("show", show);
}

async function unlockAudio() {
  if (state.audioUnlocked) return;
  state.audioUnlocked = true;
  el.bgm.volume = 0.6;
  try {
    await el.bgm.play();
    el.bgm.pause();
    el.bgm.currentTime = 0;
  } catch (_err) {
    state.audioUnlocked = false;
  }
}

async function toggleAudio(force) {
  await unlockAudio();
  if (!state.audioUnlocked) return;
  if (typeof force === "boolean") state.audioOn = force;
  else state.audioOn = !state.audioOn;

  if (state.audioOn) {
    try {
      await el.bgm.play();
    } catch (_err) {
      state.audioOn = false;
    }
  } else {
    el.bgm.pause();
  }
  updateAudioToggleLabels();
}

function updateAudioToggleLabels() {
  const label = `BGM: ${state.audioOn ? "ON" : "OFF"}`;
  el.audioToggles.forEach((btn) => {
    btn.textContent = label;
  });
}

function restoreDefaultBgm() {
  if (el.bgm.getAttribute("src") !== state.defaultBgm) {
    el.bgm.src = state.defaultBgm;
    el.bgm.load();
  }
  el.bgm.loop = true;
  el.bgm.playbackRate = 1;
  if (state.audioOn) {
    el.bgm.play().catch(() => {});
  } else {
    el.bgm.pause();
  }
}

function updateHud() {
  el.gState.className = state.members.guitar ? "done" : "";
  el.bState.className = state.members.bass ? "done" : "";
  el.dState.className = state.members.drum ? "done" : "";
  el.gState.textContent = state.members.guitar ? "Guitar OK" : "Guitar";
  el.bState.textContent = state.members.bass ? "Bass OK" : "Bass";
  el.dState.textContent = state.members.drum ? "Drum OK" : "Drum";
}

function starText(level) {
  const n = Math.max(0, Math.min(3, level | 0));
  if (n === 0) return "---";
  return "\u2605".repeat(n) + "\u2606".repeat(3 - n);
}

function updateStatusPanel() {
  el.guitarStars.textContent = starText(state.memberStatus.guitar);
  el.bassStars.textContent = starText(state.memberStatus.bass);
  el.drumStars.textContent = starText(state.memberStatus.drum);
}

function setMemberStatus(member, rank) {
  state.memberStatus[member] = Math.max(1, Math.min(3, rank | 0));
  updateStatusPanel();
}

function applyGuitarRank(rank, clearTimeSec) {
  state.guitarRank = rank;
  state.guitarTime = clearTimeSec;
  setMemberStatus("guitar", rank);
  el.guitarBest.textContent = `RANK: ${rank === 3 ? "S" : rank === 2 ? "A" : "B"}`;
}

function rankBySeconds(sec) {
  if (sec >= 35) return 3;
  if (sec >= 22) return 2;
  return 1;
}





