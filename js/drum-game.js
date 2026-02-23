/* File: js/drum-game.js
   Purpose: Drum shooter minigame logic.
*/

const DRUM_ENEMY_TYPES = ["scout", "zigzag", "shooter"];
const DRUM_POWER_ITEM_MAX = 6;
const DRUM_CLONE_MAX = 4;
const DRUM_BOMB_FUSE_SEC = 0.5;
const DRUM_BOMB_FIELD_LIFE_SEC = 1;
const DRUM_BOMB_FIELD_RADIUS = 70;
const DRUM_BOMB_TICK_SEC = 0.2;
const DRUM_BOMB_DAMAGE = 1;
const DRUM_BOSS_BOMB_INTERVAL_SEC = 4;
const DRUM_BOSS_BOMB_FUSE_SEC = 2;
const DRUM_BOSS_BOMB_FIELD_LIFE_SEC = 1;
const DRUM_BOSS_BOMB_FIELD_RADIUS = 86;
const DRUM_BGM_SRC = "bgm/命火のレクイエム.mp3";
const DRUM_COMMS_BEEP_DUR = 0.22;
const DRUM_COMMS_BEEP_GAP = 0.08;
const DRUM_COMMS_BEEP_COUNT = 3;
const DRUM_COMMS_WARN_LEAD =
  DRUM_COMMS_BEEP_DUR * DRUM_COMMS_BEEP_COUNT +
  DRUM_COMMS_BEEP_GAP * (DRUM_COMMS_BEEP_COUNT - 1) +
  0.08;
const DRUM_STAGE_CONFIGS = [
  { bossHp: 36, spawnBase: 0.44, speedScale: 1, bossFireIn: 0.38 },
  { bossHp: 50, spawnBase: 0.38, speedScale: 1.1, bossFireIn: 0.62 },
  { bossHp: 68, spawnBase: 0.34, speedScale: 1.22, bossFireIn: 0.8 }
];
const DRUM_STAGE_BOSS_SPAWN_SEC = 40;
const DRUM_COMMS_LINES = [
  {
    isEnemy: false,
    prefix: "お前も難儀な戦いに身を投じたな。帰ったら",
    claim: "東の基地",
    suffix: "で合流だ。キンキンに冷えたビールがまってるぜ！",
  },
  {
    isEnemy: false,
    prefix: "応答せよ！ ",
    claim: "ルード",
    suffix: "、大丈夫か！？ 生きてるか！？",
  },
  {
    isEnemy: false,
    prefix: "次の指令が来たわ！ ",
    claim: "ニイタカヤマノボレ",
    suffix: " よ！ わかったかしら！？",
  },
  {
    isEnemy: true,
    prefix: "お前も難儀な戦いに身を投じたな。帰ったら",
    claim: "西の基地",
    suffix: "で合流だ。キンキンに冷えたビールがまってるぜ！",
    requiredInfoKey: "base-east",
    shotText: "お前は敵だ！",
  },
  {
    isEnemy: true,
    prefix: "応答せよ！ ",
    claim: "コロン",
    suffix: "、大丈夫か！？ 生きてるか！？",
    requiredInfoKey: "dogtag-rude",
    shotText: "お前は敵だ！",
  },
  {
    isEnemy: true,
    prefix: "次の指令が来たわ！ ",
    claim: "ニイタカヤマニイキタイナア",
    suffix: "わかったかしら！？",
    requiredInfoKey: "niitaka-nobore",
    shotText: "お前は敵だ！",
  }
];

function getDrumCommsInfoButtons() {
  return [...document.querySelectorAll(".drum-comms-info")];
}

function getDrumCommsSelectableButtons() {
  const list = [];
  if (el.drumCommsClaim) list.push(el.drumCommsClaim);
  return list.concat(getDrumCommsInfoButtons());
}

function clearDrumCommsCursorUi() {
  getDrumCommsSelectableButtons().forEach((btn) => btn.classList.remove("kb-focus"));
}

function setDrumCommsCursor(index) {
  const buttons = getDrumCommsSelectableButtons();
  if (!buttons.length) {
    state.drumCommsCursor = 0;
    return;
  }
  const safe = Math.max(0, Math.min(buttons.length - 1, Number(index) || 0));
  state.drumCommsCursor = safe;
  buttons.forEach((btn) => btn.classList.remove("kb-focus"));
  const active = buttons[safe];
  if (!active) return;
  active.classList.add("kb-focus");
  if (typeof active.focus === "function") {
    active.focus({ preventScroll: true });
  }
}

function resetDrumCommsCursor() {
  state.drumCommsCursor = 0;
  clearDrumCommsCursorUi();
}

function initDrumCommsCursor() {
  const infoButtons = getDrumCommsInfoButtons();
  if (!infoButtons.length) {
    setDrumCommsCursor(0);
    return;
  }
  const selected = infoButtons.findIndex((btn) => (btn.dataset.infoKey || "") === state.drumCommsInfoSelected);
  setDrumCommsCursor(selected >= 0 ? selected + 1 : 1);
}

function moveDrumCommsCursor(key) {
  const buttons = getDrumCommsSelectableButtons();
  if (!buttons.length) return;
  const count = buttons.length;
  let cursor = Math.max(0, Math.min(count - 1, Number(state.drumCommsCursor) || 0));
  const inInfoRow = cursor > 0;
  if (key === "ArrowUp") {
    cursor = inInfoRow ? 0 : count - 1;
  } else if (key === "ArrowDown") {
    cursor = inInfoRow ? 0 : Math.min(1, count - 1);
  } else if (key === "ArrowLeft") {
    if (inInfoRow) {
      cursor -= 1;
      if (cursor < 1) cursor = count - 1;
    }
  } else if (key === "ArrowRight") {
    if (inInfoRow) {
      cursor += 1;
      if (cursor >= count) cursor = 1;
    }
  }
  setDrumCommsCursor(cursor);
}

function activateDrumCommsCursor() {
  const buttons = getDrumCommsSelectableButtons();
  if (!buttons.length) return;
  const cursor = Math.max(0, Math.min(buttons.length - 1, Number(state.drumCommsCursor) || 0));
  const target = buttons[cursor];
  if (target) target.click();
}

function handleDrumCommsKeydown(e) {
  if (!state.drumCommsActive || !state.drumCommsData || state.drumCommsData.resolving) return false;
  const key = e && typeof e.key === "string" ? e.key : "";
  if (key === "ArrowUp" || key === "ArrowDown" || key === "ArrowLeft" || key === "ArrowRight") {
    if (e.repeat && (key === "ArrowUp" || key === "ArrowDown")) return true;
    moveDrumCommsCursor(key);
    return true;
  }
  if (key === "Enter") {
    if (!e.repeat) activateDrumCommsCursor();
    return true;
  }
  return false;
}

function playDrumShootSe() {
  if (!state.audioOn) return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  if (!state.seContext) state.seContext = new Ctx();
  const ctx = state.seContext;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.13, now + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
  gain.connect(ctx.destination);

  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(430, now);
  osc.frequency.exponentialRampToValueAtTime(210, now + 0.1);
  osc.connect(gain);
  osc.start(now);
  osc.stop(now + 0.11);

  // Add short filtered noise burst for a gun-like attack.
  const noiseDur = 0.08;
  const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * noiseDur), ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.setValueAtTime(1600, now);
  band.Q.setValueAtTime(0.8, now);
  noise.connect(band);
  band.connect(gain);
  noise.start(now);
  noise.stop(now + noiseDur);
}

function playDrumCommsWarnSe() {
  if (!state.audioOn) return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  if (!state.seContext) state.seContext = new Ctx();
  const ctx = state.seContext;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  const t0 = ctx.currentTime;
  for (let i = 0; i < DRUM_COMMS_BEEP_COUNT; i += 1) {
    const start = t0 + i * (DRUM_COMMS_BEEP_DUR + DRUM_COMMS_BEEP_GAP);
    const end = start + DRUM_COMMS_BEEP_DUR;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.05, start + 0.016);
    gain.gain.setValueAtTime(0.05, end - 0.022);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    gain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(900, start);
    osc.frequency.exponentialRampToValueAtTime(1080, end);
    osc.connect(gain);
    osc.start(start);
    osc.stop(end);
  }
}

function applyDrumInputState() {
  if (!state.drumInput) return;
  const t = state.drumTouchInput || {};
  const k = state.drumKeyHeld || {};
  state.drumInput.up = !!(t.up || k.up);
  state.drumInput.down = !!(t.down || k.down);
  state.drumInput.left = !!(t.left || k.left);
  state.drumInput.right = !!(t.right || k.right);
  state.drumInput.shoot = true;
}

function resetDrumInputSources() {
  state.drumTouchInput = { up: false, down: false, left: false, right: false, shoot: false };
  state.drumKeyHeld = { up: false, down: false, left: false, right: false, shoot: false };
  state.drumInput = { up: false, down: false, left: false, right: false, shoot: false };
  state.drumAutoFire = true;
}

function updateDrumDashGauge() {
  if (!el.drumDashFill || !el.drumDashLabel) return;
  const w = state.drumWorld;
  if (!w) {
    el.drumDashFill.style.width = "100%";
    el.drumDashLabel.textContent = "DODGE";
    return;
  }
  const ratio = 1 - Math.max(0, Math.min(1, w.dashCooldown / w.dashCooldownMax));
  el.drumDashFill.style.width = `${Math.round(ratio * 100)}%`;
  el.drumDashLabel.textContent = "DODGE";
}

function updateDrumHpGauge() {
  if (!el.drumHpFill || !el.drumHpLabel) return;
  const w = state.drumWorld;
  if (!w) {
    el.drumHpFill.style.width = "100%";
    el.drumHpLabel.textContent = "HP";
    return;
  }
  const p = w.player;
  const ratio = p.maxHp > 0 ? Math.max(0, Math.min(1, p.hp / p.maxHp)) : 0;
  el.drumHpFill.style.width = `${Math.round(ratio * 100)}%`;
  el.drumHpLabel.textContent = `HP ${p.hp}/${p.maxHp}`;
}

function getDrumStageConfig(w) {
  const idx = Math.max(0, Math.min(DRUM_STAGE_CONFIGS.length - 1, (w?.stage || 1) - 1));
  return DRUM_STAGE_CONFIGS[idx];
}

function updateDrumStageHud() {
  if (!el.drumKills) return;
  const w = state.drumWorld;
  if (!w) {
    el.drumKills.textContent = "STAGE 1/3";
    return;
  }
  if (w.cleared) {
    el.drumKills.textContent = "STAGE CLEAR";
    return;
  }
  const stage = Math.max(1, Math.min(3, w.stage || 1));
  if (w.boss) {
    el.drumKills.textContent = `STAGE ${stage}/3 BOSS`;
    return;
  }
  const left = Math.max(0, w.stageBossAt - w.stageTimer);
  el.drumKills.textContent = `STAGE ${stage}/3 BOSS IN ${left.toFixed(1)}s`;
}

function updateDrumBossGauge() {
  if (!el.drumBossGauge || !el.drumBossFill || !el.drumBossLabel) return;
  const w = state.drumWorld;
  const boss = w ? w.boss : null;
  if (!boss || !boss.maxHp) {
    el.drumBossGauge.classList.remove("active");
    el.drumBossFill.style.width = "0%";
    el.drumBossLabel.textContent = "BOSS HP";
    return;
  }
  const ratio = Math.max(0, Math.min(1, boss.hp / boss.maxHp));
  el.drumBossGauge.classList.add("active");
  el.drumBossFill.style.width = `${Math.round(ratio * 100)}%`;
  el.drumBossLabel.textContent = `BOSS HP ${Math.max(0, Math.ceil(boss.hp))}/${boss.maxHp}`;
}

function updateDrumScoreText() {
  if (!el.drumScoreText) return;
  const w = state.drumWorld;
  const score = w ? w.score || 0 : 0;
  el.drumScoreText.textContent = `SCORE ${score}`;
}

function updateDrumPowerUi() {
  const w = state.drumWorld;
  const armed = w ? w.powerItemIndex : 0;
  const slots = document.querySelectorAll(".drum-power-slot");
  slots.forEach((slot) => {
    const num = Number(slot.getAttribute("data-slot"));
    slot.classList.toggle("active", num === armed);
  });
}

function updateDrumCommsTimeGauge() {
  if (!el.drumCommsTimeFill || !el.drumCommsTimeLabel) return;
  const d = state.drumCommsData;
  if (!d || !state.drumCommsActive) {
    el.drumCommsTimeFill.style.width = "100%";
    el.drumCommsTimeLabel.textContent = "10.0s";
    return;
  }
  const ratio = Math.max(0, Math.min(1, d.timeLeft / d.timeMax));
  el.drumCommsTimeFill.style.width = `${Math.round(ratio * 100)}%`;
  el.drumCommsTimeLabel.textContent = `${d.timeLeft.toFixed(1)}s`;
}

function setDrumCommsVisible(show) {
  if (!el.drumCommsLayer) return;
  el.drumCommsLayer.classList.toggle("active", !!show);
}

function setDrumCommsWarning(show) {
  if (!el.drumGameLayer) return;
  el.drumGameLayer.classList.toggle("comms-warning", !!show);
  if (el.app) {
    el.app.classList.toggle("comms-warning-full", !!show);
  }
}

function triggerDrumCommsWrongFx() {
  if (!el.drumGameLayer) return;
  el.drumGameLayer.classList.remove("comms-wrong");
  void el.drumGameLayer.offsetWidth;
  el.drumGameLayer.classList.add("comms-wrong");
  setTimeout(() => {
    if (el.drumGameLayer) el.drumGameLayer.classList.remove("comms-wrong");
  }, 320);
  if (typeof pulseShake === "function") pulseShake();
}

function applyDrumCommsPenalty() {
  const w = state.drumWorld;
  if (!w || !w.player) return;
  if (state.drumCommsData) state.drumCommsData.resolving = true;
  const p = w.player;
  p.hp = Math.max(0, p.hp - 1);
  p.invuln = Math.max(p.invuln || 0, 0.45);
  updateDrumHpGauge();
  triggerDrumCommsWrongFx();
  if (p.hp <= 0) {
    if (state.drumCommsData) state.drumCommsData.resolving = true;
    setTimeout(() => {
      endDrumCommsEncounter();
      endDrumGame(false);
    }, 380);
    return;
  }
  setTimeout(() => endDrumCommsEncounter(), 420);
}

function applyDrumCommsScoreBonus() {
  const w = state.drumWorld;
  const data = state.drumCommsData;
  if (!w || !data) return;
  const timeMax = Math.max(0, data.timeMax || 0);
  if (timeMax <= 0) return;
  const timeLeft = Math.max(0, Math.min(timeMax, data.timeLeft || 0));
  const bonus = Math.round((timeLeft / timeMax) * 1000);
  if (bonus <= 0) return;
  w.score += bonus;
}

function triggerDrumCommsWarning() {
  if (state.drumCommsWarnTimer) {
    clearTimeout(state.drumCommsWarnTimer);
    state.drumCommsWarnTimer = 0;
  }
  setDrumCommsWarning(true);
  playDrumCommsWarnSe();
  const warnMs = Math.round(DRUM_COMMS_WARN_LEAD * 1000);
  state.drumCommsWarnTimer = setTimeout(() => {
    setDrumCommsWarning(false);
    state.drumCommsWarnTimer = 0;
  }, warnMs);
}

function endDrumCommsEncounter() {
  state.drumCommsActive = false;
  state.drumCommsPending = false;
  state.drumCommsInfoSelected = "";
  state.drumCommsData = null;
  resetDrumCommsCursor();
  if (state.drumCommsWarnTimer) {
    clearTimeout(state.drumCommsWarnTimer);
    state.drumCommsWarnTimer = 0;
  }
  if (state.drumCommsIntroTimer) {
    clearTimeout(state.drumCommsIntroTimer);
    state.drumCommsIntroTimer = 0;
  }
  setDrumCommsVisible(false);
  setDrumCommsWarning(false);
  if (el.drumGameLayer) el.drumGameLayer.classList.remove("comms-wrong");
  updateDrumCommsTimeGauge();
}

function startDrumCommsEncounter() {
  if (!el.drumCommsClaim || !el.drumCommsResult || !el.drumCommsShot || !el.drumCommsLine) return;
  const line = DRUM_COMMS_LINES[Math.floor(Math.random() * DRUM_COMMS_LINES.length)];
  state.drumCommsActive = true;
  state.drumCommsInfoSelected = "";
  state.drumCommsData = {
    isEnemy: !!line.isEnemy,
    requiredInfoKey: line.requiredInfoKey || "",
    shotText: line.shotText || "",
    resolving: false,
    timeMax: 10,
    timeLeft: 10
  };

  el.drumCommsLine.textContent = "";
  if (line.prefix) el.drumCommsLine.append(document.createTextNode(`${line.prefix} `));
  el.drumCommsClaim.textContent = line.claim;
  el.drumCommsClaim.classList.remove("hit");
  el.drumCommsLine.append(el.drumCommsClaim);
  if (line.suffix) el.drumCommsLine.append(document.createTextNode(` ${line.suffix}`));
  document.querySelectorAll(".drum-comms-info").forEach((btn) => btn.classList.remove("active"));
  el.drumCommsResult.textContent = line.hint || "通信の内容を照合せよ";
  el.drumCommsShot.classList.remove("play");
  el.drumCommsShot.style.opacity = "0";
  updateDrumCommsTimeGauge();
  setDrumCommsVisible(true);
  initDrumCommsCursor();
}

function resolveDrumEnemyCommsSuccess(data) {
  if (!data || data.resolving || !el.drumCommsPanel || !el.drumCommsClaim || !el.drumCommsShot) return;
  data.resolving = true;
  // Fly from panel corner to the contradictory phrase, then break that text.
  const panelRect = el.drumCommsPanel.getBoundingClientRect();
  const claimRect = el.drumCommsClaim.getBoundingClientRect();
  const sx = panelRect.width - 96;
  const sy = panelRect.height - 28;
  const tx = claimRect.left + claimRect.width * 0.5 - panelRect.left - sx;
  const ty = claimRect.top + claimRect.height * 0.5 - panelRect.top - sy;
  el.drumCommsShot.textContent = data.shotText || "照合完了";
  el.drumCommsShot.style.setProperty("--tx", `${Math.round(tx)}px`);
  el.drumCommsShot.style.setProperty("--ty", `${Math.round(ty)}px`);
  el.drumCommsShot.classList.remove("play");
  void el.drumCommsShot.offsetWidth;
  el.drumCommsShot.classList.add("play");
  applyDrumCommsScoreBonus();
  el.drumCommsResult.textContent = "敵通信を看破！";
  setTimeout(() => el.drumCommsClaim.classList.add("hit"), 360);
  setTimeout(() => endDrumCommsEncounter(), 920);
}

function bindDrumCommsUi() {
  if (state.drumCommsUiBound) return;
  if (!el.drumCommsClaim || !el.drumCommsResult || !el.drumCommsShot || !el.drumCommsPanel) return;
  state.drumCommsUiBound = true;

  document.querySelectorAll(".drum-comms-info").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!state.drumCommsActive || !state.drumCommsData || state.drumCommsData.resolving) return;
      state.drumCommsInfoSelected = btn.dataset.infoKey || "";
      const infoButtons = getDrumCommsInfoButtons();
      const idx = infoButtons.indexOf(btn);
      if (idx >= 0) setDrumCommsCursor(idx + 1);
      document.querySelectorAll(".drum-comms-info").forEach((x) => x.classList.remove("active"));
      btn.classList.add("active");
      el.drumCommsResult.textContent = `照合: ${btn.textContent || ""}`;

      const data = state.drumCommsData;
      if (!data || data.resolving) return;
      if (!data.isEnemy) {
        if (state.drumCommsInfoSelected === "ok") {
          data.resolving = true;
          applyDrumCommsScoreBonus();
          el.drumCommsResult.textContent = "味方通信を確認。作戦継続。";
          setTimeout(() => endDrumCommsEncounter(), 700);
        } else {
          el.drumCommsResult.textContent = "味方通信。OK！を押して確認";
          applyDrumCommsPenalty();
        }
        return;
      }

      if (state.drumCommsInfoSelected === "ok") {
        el.drumCommsResult.textContent = "敵通信にOKは危険。照合失敗";
        applyDrumCommsPenalty();
        return;
      }
      if (state.drumCommsInfoSelected === data.requiredInfoKey) {
        resolveDrumEnemyCommsSuccess(data);
        return;
      }
      el.drumCommsResult.textContent = "照合不一致。通信判定失敗";
      applyDrumCommsPenalty();
    });
  });

  el.drumCommsClaim.addEventListener("click", () => {
    const data = state.drumCommsData;
    const w = state.drumWorld;
    if (!state.drumCommsActive || !data || data.resolving || !w) return;
    setDrumCommsCursor(0);
    if (data.isEnemy) {
      if (!state.drumCommsInfoSelected) {
        el.drumCommsResult.textContent = "先に情報を選択して照合";
        return;
      }
      if (state.drumCommsInfoSelected !== data.requiredInfoKey) {
        el.drumCommsResult.textContent = "照合不一致。別情報を選択";
        applyDrumCommsPenalty();
        return;
      }
      resolveDrumEnemyCommsSuccess(data);
      return;
    }

    el.drumCommsResult.textContent = "味方通信はOK！を押して確認";
  });
}

function resetDrumWorld() {
  const width = el.drumCanvas ? el.drumCanvas.width : 960;
  const height = el.drumCanvas ? el.drumCanvas.height : 480;
  const stars = [];
  for (let i = 0; i < 90; i += 1) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: 45 + Math.random() * 190,
      size: 1 + Math.random() * 2
    });
  }
  state.drumWorld = {
    width,
    height,
    pixelScale: 3,
    pixelBuffer: null,
    player: {
      x: width * 0.5,
      y: height * 0.78,
      r: 14,
      speed: 300,
      hp: 20,
      maxHp: 20,
      invuln: 0
    },
    bullets: [],
    enemyBullets: [],
    enemies: [],
    powerDrops: [],
    explosions: [],
    bombFields: [],
    enemyBombFields: [],
    stars,
    spawnIn: 0.45,
    nextCommsAt: 20,
    nextCommsWarnAt: Math.max(0, 20 - DRUM_COMMS_WARN_LEAD),
    commsWarned: false,
    killCount: 0,
    score: 0,
    stage: 1,
    stageKills: 0,
    stageTimer: 0,
    stageBossAt: DRUM_STAGE_BOSS_SPAWN_SEC,
    boss: null,
    cleared: false,
    enemySeq: 0,
    speedBoostLv: 0,
    powerItemIndex: 0,
    weaponMode: "normal",
    cloneActive: false,
    clone: null,
    clones: [],
    trail: [],
    shootCooldown: 0,
    dashCooldown: 0,
    dashCooldownMax: 2,
    dashActive: false,
    dashDur: 0.24,
    dashTime: 0,
    dashDirX: 0,
    dashDirY: -1,
    dashRoll: 0,
    dashRollDir: 1,
    lastMoveX: 0,
    lastMoveY: -1
  };
}

function spawnDrumExplosion(x, y, size) {
  const w = state.drumWorld;
  if (!w) return;
  const count = size === "big" ? 34 : 24;
  const baseSp = size === "big" ? 220 : 170;
  for (let i = 0; i < count; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const sp = baseSp * (0.55 + Math.random() * 0.85);
    w.explosions.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 0.36 + Math.random() * 0.22,
      maxLife: 0.58,
      r: 2 + Math.random() * 4,
      color: Math.random() < 0.5 ? "#ffd6a0" : "#ff7da5"
    });
  }
  w.explosions.push({
    x,
    y,
    vx: 0,
    vy: 0,
    life: 0.12,
    maxLife: 0.12,
    r: size === "big" ? 34 : 26,
    color: "#ffffff",
    ring: true
  });
}

function spawnDrumPowerDrop(x, y) {
  const w = state.drumWorld;
  if (!w) return;
  w.powerDrops.push({
    x,
    y,
    r: 18,
    vy: 110,
    spin: Math.random() * Math.PI * 2
  });
}

function drumPickupNextPowerItem() {
  const w = state.drumWorld;
  if (!w) return;
  w.powerItemIndex = (w.powerItemIndex % DRUM_POWER_ITEM_MAX) + 1;
  updateDrumPowerUi();
}

function showDrumPowerUseEffect(label) {
  const fx = document.getElementById("drumPowerUseFx");
  if (!fx) return;
  fx.textContent = `POWER ${label}`;
  fx.classList.remove("comms-alert");
  fx.classList.remove("play");
  void fx.offsetWidth;
  fx.classList.add("play");
}

function showDrumStageEffect(stageNum) {
  const fx = document.getElementById("drumPowerUseFx");
  if (!fx) return;
  fx.textContent = `STAGE ${stageNum}`;
  fx.classList.remove("comms-alert");
  fx.classList.remove("play");
  void fx.offsetWidth;
  fx.classList.add("play");
}

function showDrumCommsEntryEffect() {
  const fx = document.getElementById("drumPowerUseFx");
  if (!fx) return;
  fx.textContent = "通信だ！";
  fx.classList.add("comms-alert");
  fx.classList.remove("play");
  void fx.offsetWidth;
  fx.classList.add("play");
}

function drumUsePowerItem() {
  if (!state.drumGameActive || !state.drumGameRunning || !state.drumWorld) return;
  const w = state.drumWorld;
  const p = w.player;
  if (!w.powerItemIndex) return;
  let effectLabel = "";

  if (w.powerItemIndex === 1) {
    w.speedBoostLv += 1;
    p.speed += 55;
    effectLabel = "SPEED UP";
  } else if (w.powerItemIndex === 2) {
    p.hp = Math.min(p.maxHp, p.hp + 1);
    effectLabel = "HP HEAL";
  } else if (w.powerItemIndex === 3) {
    w.weaponMode = "bomb";
    effectLabel = "BOMB";
  } else if (w.powerItemIndex === 4) {
    w.weaponMode = "laser";
    effectLabel = "LASER";
  } else if (w.powerItemIndex === 5) {
    if (!Array.isArray(w.clones)) w.clones = [];
    if (w.clones.length < DRUM_CLONE_MAX) {
      const idx = w.clones.length;
      w.clones.push({ x: p.x, y: p.y + 18 + idx * 4, r: p.r });
    }
    w.cloneActive = w.clones.length > 0;
    w.clone = w.clones[0] || null;
    effectLabel = "CLONE";
  } else if (w.powerItemIndex === 6) {
    w.score += 10000;
    effectLabel = "SCORE +10000";
  }
  if (effectLabel) showDrumPowerUseEffect(effectLabel);
  if (w.powerItemIndex === 6) updateDrumScoreText();
  w.powerItemIndex = 0;
  updateDrumPowerUi();
}


function spawnDrumBombField(w, x, y) {
  if (!w) return;
  spawnDrumExplosion(x, y, "small");
  w.bombFields.push({
    x,
    y,
    r: DRUM_BOMB_FIELD_RADIUS,
    life: DRUM_BOMB_FIELD_LIFE_SEC,
    maxLife: DRUM_BOMB_FIELD_LIFE_SEC,
    tickIn: 0
  });
}
function fireDrumPlayerShot(w, x, y, r) {
  const shotY = y - r - 8;
  if (w.weaponMode === "bomb") {
    w.bullets.push({
      x,
      y: shotY,
      vx: 0,
      vy: -420,
      r: 10,
      type: "bomb",
      fuse: DRUM_BOMB_FUSE_SEC
    });
    return;
  }
  if (w.weaponMode === "laser") {
    w.bullets.push({
      x,
      y: shotY - 10,
      vx: 0,
      vy: -920,
      r: 9,
      damage: 0.5,
      type: "laser",
      pierce: true,
      life: 0.75,
      hitIds: {}
    });
    return;
  }
  w.bullets.push({ x, y: shotY, vx: 0, vy: -540, r: 10, damage: 1 });
}

function destroyDrumEnemyAt(w, enemyIndex) {
  const e = w.enemies[enemyIndex];
  if (!e) return;
  spawnDrumExplosion(e.x, e.y, e.kind === "shooter" ? "big" : "small");
  const dropX = e.x;
  const dropY = e.y;
  w.enemies.splice(enemyIndex, 1);
  w.killCount += 1;
  w.stageKills += 1;
  w.score += 100;
  if (w.killCount > 0 && w.killCount % 5 === 0) {
    spawnDrumPowerDrop(dropX, dropY);
  }
}

function updateDrumClone(rawDt) {
  const w = state.drumWorld;
  if (!w) return;
  const p = w.player;
  w.trail.unshift({ x: p.x, y: p.y });
  if (w.trail.length > 90) w.trail.length = 90;
  if (!Array.isArray(w.clones)) w.clones = [];
  w.cloneActive = w.clones.length > 0;
  if (!w.cloneActive) {
    w.clone = null;
    return;
  }
  const followRate = Math.min(1, rawDt * 11);
  const baseLagIndex = 18;
  const lagStep = 10;
  w.clones.forEach((c, idx) => {
    const lagIndex = baseLagIndex + idx * lagStep;
    const target = w.trail[Math.min(lagIndex, w.trail.length - 1)] || { x: p.x, y: p.y };
    c.x += (target.x - c.x) * followRate;
    c.y += (target.y + 18 - c.y) * followRate;
    c.r = p.r;
  });
  w.clone = w.clones[0] || null;
}

function drumSetMove(dir, active) {
  if (!state.drumTouchInput) return;
  state.drumTouchInput[dir] = !!active;
  applyDrumInputState();
}

function drumSetKey(code, active) {
  if (!state.drumKeyHeld) return;
  const on = !!active;
  const key = typeof code === "string" ? code : "";
  const num = typeof code === "number" ? code : Number.NaN;
  if (key === "ArrowUp" || num === 38) state.drumKeyHeld.up = on;
  if (key === "ArrowDown" || num === 40) state.drumKeyHeld.down = on;
  if (key === "ArrowLeft" || num === 37) state.drumKeyHeld.left = on;
  if (key === "ArrowRight" || num === 39) state.drumKeyHeld.right = on;

  applyDrumInputState();
}

function drumTryDash() {
  if (!state.drumGameActive || !state.drumGameRunning || !state.drumWorld) return;
  const w = state.drumWorld;
  const p = w.player;
  if (w.dashActive || w.dashCooldown > 0) return;
  let dx = (state.drumInput.right ? 1 : 0) - (state.drumInput.left ? 1 : 0);
  let dy = (state.drumInput.down ? 1 : 0) - (state.drumInput.up ? 1 : 0);
  if (dx === 0 && dy === 0) {
    dx = w.lastMoveX;
    dy = w.lastMoveY;
  }
  const n = Math.hypot(dx, dy) || 1;
  w.dashDirX = dx / n;
  w.dashDirY = dy / n;
  if (dx < 0) {
    w.dashRollDir = -1;
  } else if (dx > 0) {
    w.dashRollDir = 1;
  } else {
    w.dashRollDir = w.lastMoveX < 0 ? -1 : 1;
  }
  w.dashActive = true;
  w.dashTime = w.dashDur;
  w.dashRoll = 0;
  w.dashCooldown = w.dashCooldownMax;
  p.invuln = Math.max(p.invuln, w.dashDur + 0.08);
  updateDrumDashGauge();
}

function drumRankByResult(hpLeft, timeLeftSec) {
  if (hpLeft >= 4) return 3;
  if (hpLeft >= 2) return 2;
  return 1;
}

function spawnDrumEnemy() {
  const w = state.drumWorld;
  if (!w) return;
  const cfg = getDrumStageConfig(w);
  const kind = DRUM_ENEMY_TYPES[Math.floor(Math.random() * DRUM_ENEMY_TYPES.length)];
  const x = 44 + Math.random() * (w.width - 88);
  const base = {
    id: ++w.enemySeq,
    kind,
    x,
    y: -24,
    r: kind === "shooter" ? 27 : 22,
    hp: kind === "shooter" ? 3 : 2,
    t: Math.random() * Math.PI * 2,
    vx: 0,
    vy: (95 + Math.random() * 85) * cfg.speedScale,
    fireIn: 1.15 + Math.random() * 1.0
  };
  if (kind === "scout") {
    base.vy = (180 + Math.random() * 75) * cfg.speedScale;
  } else if (kind === "zigzag") {
    base.vy = (120 + Math.random() * 55) * cfg.speedScale;
    base.vx = Math.random() < 0.5 ? -90 : 90;
  } else {
    base.vy = (90 + Math.random() * 40) * cfg.speedScale;
  }
  w.enemies.push(base);
}

function spawnDrumBoss(w) {
  if (!w || w.boss || w.stage > 3) return;
  const cfg = getDrumStageConfig(w);
  w.enemies = [];
  w.enemyBullets = [];
  const baseVx = 150 + w.stage * 18;
  w.boss = {
    id: `boss-${w.stage}-${Date.now()}`,
    stage: w.stage,
    x: w.width * 0.5,
    y: -90,
    targetY: 130,
    vx: Math.random() < 0.5 ? -baseVx : baseVx,
    r: 42 + w.stage * 5,
    hp: cfg.bossHp,
    maxHp: cfg.bossHp,
    t: 0,
    phase: "sweep",
    sweepLeft: 1 + Math.floor(Math.random() * 3),
    edgeHits: 0,
    flashTime: 0,
    fireIn: cfg.bossFireIn + Math.random() * 0.35,
    bombIn: DRUM_BOSS_BOMB_INTERVAL_SEC,
    chargeVx: 0,
    chargeVy: 0,
    chargeTime: 0,
    returnX: w.width * 0.5
  };
}

function updateDrumBoss(w, p, rawDt) {
  const boss = w?.boss;
  if (!boss || !p) return;
  boss.t += rawDt;
  const left = boss.r + 8;
  const right = w.width - boss.r - 8;
  const enterRate = Math.min(1, rawDt * 1.4);
  const baseVx = 150 + boss.stage * 18;

  if (boss.phase === "sweep") {
    boss.y += (boss.targetY - boss.y) * enterRate;
    boss.x += boss.vx * rawDt;
    let bounced = false;
    if (boss.x < left) {
      boss.x = left;
      boss.vx = Math.abs(boss.vx);
      bounced = true;
    } else if (boss.x > right) {
      boss.x = right;
      boss.vx = -Math.abs(boss.vx);
      bounced = true;
    }
    if (bounced) {
      boss.edgeHits += 1;
      if (boss.edgeHits >= 2) {
        boss.edgeHits = 0;
        boss.sweepLeft -= 1;
        if (boss.sweepLeft <= 0) {
          boss.phase = "flash";
          boss.flashTime = 0.7;
          boss.vx = 0;
        }
      }
    }
  } else if (boss.phase === "flash") {
    boss.y += (boss.targetY - boss.y) * enterRate;
    boss.flashTime -= rawDt;
    if (boss.flashTime <= 0) {
      boss.phase = "charge";
      boss.returnX = boss.x;
      const dx = p.x - boss.x;
      const dy = (p.y + 40) - boss.y;
      const n = Math.hypot(dx, dy) || 1;
      const sp = 520 + boss.stage * 55;
      boss.chargeVx = (dx / n) * sp;
      boss.chargeVy = (dy / n) * sp;
      boss.chargeTime = 0;
    }
  } else if (boss.phase === "charge") {
    boss.chargeTime = (boss.chargeTime || 0) + rawDt;
    if (boss.chargeTime >= 3) {
      boss.chargeVx = 0;
      boss.chargeVy = 0;
      boss.chargeTime = 0;
      boss.phase = "return";
    }
    if (boss.phase === "charge") {
      // Light homing during charge: keep it subtle so the dash still feels readable.
      const chSp = Math.hypot(boss.chargeVx, boss.chargeVy) || (520 + boss.stage * 55);
      const tdx = p.x - boss.x;
      const tdy = (p.y + 28) - boss.y;
      const tn = Math.hypot(tdx, tdy) || 1;
      const targetVx = (tdx / tn) * chSp;
      const targetVy = (tdy / tn) * chSp;
      const steer = Math.min(1, rawDt * 1.25);
      boss.chargeVx += (targetVx - boss.chargeVx) * steer;
      boss.chargeVy += (targetVy - boss.chargeVy) * steer;
      boss.x += boss.chargeVx * rawDt;
      boss.y += boss.chargeVy * rawDt;
      const outBottom = boss.y > w.height + boss.r + 16;
      const outSide = boss.x < -boss.r - 24 || boss.x > w.width + boss.r + 24;
      if (outBottom || outSide) {
        boss.chargeVx = 0;
        boss.chargeVy = 0;
        boss.chargeTime = 0;
        boss.phase = "return";
        boss.x = left + Math.random() * (right - left);
        boss.y = -boss.r - 34;
      }
    }
  } else if (boss.phase === "return") {
    const backX = typeof boss.returnX === "number" ? boss.returnX : boss.x;
    boss.x += (backX - boss.x) * Math.min(1, rawDt * 2.1);
    boss.y += (boss.targetY - boss.y) * Math.min(1, rawDt * 2.05);
    if (Math.abs(boss.y - boss.targetY) < 8 && Math.abs(boss.x - backX) < 8) {
      boss.vx = Math.random() < 0.5 ? -baseVx : baseVx;
      boss.sweepLeft = 1 + Math.floor(Math.random() * 3);
      boss.edgeHits = 0;
      boss.phase = "sweep";
    }
  }
  if (boss.phase === "sweep" || boss.phase === "flash") {
    const cfg = getDrumStageConfig({ stage: boss.stage });
    boss.fireIn -= rawDt;
    if (boss.fireIn <= 0) {
      boss.fireIn = cfg.bossFireIn + Math.random() * 0.35;
      const dx = p.x - boss.x;
      const dy = p.y - boss.y;
      const baseAng = Math.atan2(dy, dx);
      const burst = boss.stage >= 2 ? 3 : 1;
      const offsets =
        burst === 1 ? [0] : burst === 2 ? [-0.09, 0.09] : [-0.14, 0, 0.14];
      offsets.forEach((off) => {
        const ang = baseAng + off;
        const baseSp = 230 + boss.stage * 22;
        const sp = boss.stage >= 2 ? baseSp * (0.78 + Math.random() * 0.56) : baseSp;
        w.enemyBullets.push({
          x: boss.x,
          y: boss.y + 10,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp,
          r: 7,
          type: "needle",
          fromBoss: true
        });
      });
    }
  }
  if (boss.stage >= 3 && (boss.phase === "sweep" || boss.phase === "flash")) {
    boss.bombIn -= rawDt;
    if (boss.bombIn <= 0) {
      boss.bombIn = DRUM_BOSS_BOMB_INTERVAL_SEC;
      const dx = p.x - boss.x;
      const dy = p.y - boss.y;
      const n = Math.hypot(dx, dy) || 1;
      const sp = 170;
      w.enemyBullets.push({
        x: boss.x,
        y: boss.y + 12,
        vx: (dx / n) * sp,
        vy: (dy / n) * sp,
        r: 12,
        type: "bossBomb",
        fromBoss: true,
        fuse: DRUM_BOSS_BOMB_FUSE_SEC
      });
    }
  }

  const shipHit = Math.hypot(p.x - boss.x, p.y - boss.y) <= p.r + boss.r - 6;
  if (shipHit && p.invuln <= 0) {
    p.hp -= 1;
    p.invuln = 1;
    pulseShake();
  }
}

function defeatDrumBoss(w) {
  if (!w || !w.boss) return;
  const b = w.boss;
  spawnDrumExplosion(b.x, b.y, "big");
  spawnDrumExplosion(b.x + 24, b.y - 10, "small");
  spawnDrumExplosion(b.x - 24, b.y + 8, "small");
  w.score += 1500;
  w.boss = null;
  w.stage += 1;
  w.stageKills = 0;
  w.stageTimer = 0;
  w.stageBossAt = DRUM_STAGE_BOSS_SPAWN_SEC;
  w.spawnIn = 0.7;
  w.enemyBullets = w.enemyBullets.filter((x) => !x.fromBoss);
  w.enemyBombFields = [];
  if (w.stage > 3) {
    w.cleared = true;
  } else {
    showDrumStageEffect(w.stage);
  }
}

const DRUM_ENEMY_PIXEL_ART = {
  scout: [
    "....1111....",
    "...122221...",
    "..12333321..",
    ".1233443321.",
    "123344443321",
    "..23344332..",
    "...233332...",
    "..2..22..2..",
    ".2...22...2.",
    "....22......",
    "...2..2.....",
    "..2....2...."
  ],
  zigzag: [
    "...1....1...",
    "..12....21..",
    ".123111321..",
    "123344443321",
    "..23444432..",
    ".223333322..",
    "2..23332..2.",
    "...23332....",
    "..23..32....",
    ".23....32...",
    "23......32..",
    ".2......2..."
  ],
  shooter: [
    "...111111...",
    "..12222221..",
    ".1233333321.",
    "123344443321",
    "123445554321",
    "123455555321",
    "123455555321",
    "123445554321",
    "123344443321",
    ".1233333321.",
    "..12222221..",
    "...11..11..."
  ]
};

const DRUM_ENEMY_PIXEL_PALETTE = {
  scout: { "1": "#1a2a2c", "2": "#5ff0c2", "3": "#2fcf9f", "4": "#d8fff3", "5": "#ffffff" },
  zigzag: { "1": "#10243a", "2": "#57a7ff", "3": "#2a6fcc", "4": "#d7ecff", "5": "#ffffff" },
  shooter: { "1": "#2b1020", "2": "#ff8db1", "3": "#d14e82", "4": "#ffd8e6", "5": "#ffffff" }
};

function drawDrumPixelEnemy(ctx, enemy, timeSec) {
  const art = DRUM_ENEMY_PIXEL_ART[enemy.kind];
  const palette = DRUM_ENEMY_PIXEL_PALETTE[enemy.kind];
  if (!art || !palette) return;

  const px = enemy.kind === "shooter" ? 3 : 2.7;
  const rows = art.length;
  const cols = art[0].length;
  const pulse = 0.8 + Math.max(0, Math.sin(timeSec * 10 + enemy.t * 1.5)) * 0.2;
  const glow = enemy.kind === "shooter" ? "#ff8db166" : enemy.kind === "zigzag" ? "#79bfff55" : "#73ffd455";

  ctx.save();
  ctx.translate(Math.round(enemy.x), Math.round(enemy.y));
  if (enemy.kind === "zigzag") {
    ctx.scale(Math.sin(enemy.t * 5) < 0 ? -1 : 1, 1);
  }

  ctx.globalAlpha = 0.45;
  ctx.fillStyle = glow;
  ctx.fillRect((-cols * px) / 2 - 4, (-rows * px) / 2 - 4, cols * px + 8, rows * px + 8);
  ctx.globalAlpha = 1;

  const ox = (-cols * px) / 2;
  const oy = (-rows * px) / 2;
  for (let y = 0; y < rows; y += 1) {
    const row = art[y];
    for (let x = 0; x < cols; x += 1) {
      const token = row[x];
      if (token === ".") continue;
      let color = palette[token] || "#ffffff";
      if (token === "5") {
        color = enemy.kind === "shooter" ? `rgba(255,255,255,${pulse})` : color;
      }
      ctx.fillStyle = color;
      ctx.fillRect(ox + x * px, oy + y * px, px, px);
    }
  }

  ctx.restore();
}

function drawDrumShip(ctx, x, y, r, opts = {}) {
  const alpha = typeof opts.alpha === "number" ? opts.alpha : 1;
  const timeSec = opts.timeSec || 0;
  const shooting = !!opts.shooting;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  if (opts.rollActive) {
    const rollPhase = (opts.roll || 0) * (opts.rollDir || 1);
    const wingScaleX = Math.max(0.2, Math.abs(Math.cos(rollPhase)));
    ctx.scale(wingScaleX, 1);
  }

  const thrust = 10 + (shooting ? 9 : 0) + Math.sin(timeSec * 28 + (opts.phase || 0)) * 2.4;
  const trailGrad = ctx.createLinearGradient(0, r * 0.25, 0, r + thrust + 16);
  trailGrad.addColorStop(0, "#dff5ff");
  trailGrad.addColorStop(0.45, "#9bc7df");
  trailGrad.addColorStop(1, "#7ca0b900");
  ctx.fillStyle = trailGrad;
  ctx.beginPath();
  ctx.moveTo(-5, r * 0.3);
  ctx.lineTo(5, r * 0.3);
  ctx.lineTo(2, r + thrust + 14);
  ctx.lineTo(-2, r + thrust + 14);
  ctx.closePath();
  ctx.fill();

  const hullGrad = ctx.createLinearGradient(0, -r - 10, 0, r + 8);
  hullGrad.addColorStop(0, "#f7fbff");
  hullGrad.addColorStop(0.55, "#c8d1db");
  hullGrad.addColorStop(1, "#8f99a4");
  ctx.fillStyle = hullGrad;
  ctx.beginPath();
  ctx.moveTo(0, -r - 11);
  ctx.lineTo(r * 1.28, r * 0.96);
  ctx.lineTo(0, r * 0.38);
  ctx.lineTo(-r * 1.28, r * 0.96);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#dde4ec";
  ctx.beginPath();
  ctx.moveTo(0, -r - 5);
  ctx.lineTo(r * 0.62, r * 0.52);
  ctx.lineTo(-r * 0.62, r * 0.52);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#24364a";
  ctx.fillRect(-3, -r * 0.46, 6, 12);
  ctx.fillStyle = "#b7d8ec";
  ctx.fillRect(-r * 0.9, r * 0.56, r * 0.54, 2.4);
  ctx.fillRect(r * 0.36, r * 0.56, r * 0.54, 2.4);
  if (opts.rollActive) {
    ctx.strokeStyle = "#d6efff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -r - 15);
    ctx.lineTo(r * 1.52, r * 1.05);
    ctx.lineTo(-r * 1.52, r * 1.05);
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();
}

function drawDrumGame(ctx) {
  const w = state.drumWorld;
  if (!w) return;
  const outCtx = ctx;
  const scale = Math.max(2, w.pixelScale || 3);
  const pw = Math.max(1, Math.floor(w.width / scale));
  const ph = Math.max(1, Math.floor(w.height / scale));
  if (!w.pixelBuffer || w.pixelBuffer.width !== pw || w.pixelBuffer.height !== ph) {
    w.pixelBuffer = document.createElement("canvas");
    w.pixelBuffer.width = pw;
    w.pixelBuffer.height = ph;
  }
  const pctx = w.pixelBuffer.getContext("2d");
  pctx.imageSmoothingEnabled = false;
  pctx.setTransform(pw / w.width, 0, 0, ph / w.height, 0, 0);
  pctx.clearRect(0, 0, w.width, w.height);
  ctx = pctx;

  const g = ctx.createLinearGradient(0, 0, 0, w.height);
  g.addColorStop(0, "#071326");
  g.addColorStop(0.6, "#060d1a");
  g.addColorStop(1, "#04060d");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w.width, w.height);

  w.stars.forEach((s) => {
    ctx.globalAlpha = 0.2 + (s.speed / 240) * 0.45;
    ctx.fillStyle = "#bfe7ff";
    ctx.fillRect(s.x, s.y, s.size, s.size * 2.6);
  });
  ctx.globalAlpha = 1;

  w.bullets.forEach((b) => {
    if (b.type === "laser") {
      ctx.fillStyle = "#b8efff";
      ctx.fillRect(b.x - 3.5, b.y - 32, 7, 44);
      ctx.fillStyle = "#e8fbff";
      ctx.fillRect(b.x - 1.5, b.y - 34, 3, 48);
    } else if (b.type === "bomb") {
      ctx.fillStyle = "#ffd98d";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r || 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff7dd";
      ctx.fillRect(b.x - 2, b.y - (b.r || 10) - 4, 4, 6);
    } else if (Math.abs(b.vx || 0) > Math.abs(b.vy || 0)) {
      ctx.fillStyle = "#8ffcff";
      ctx.fillRect(b.x - 16, b.y - 4.5, 22, 9);
    } else {
      ctx.fillStyle = "#8ffcff";
      ctx.fillRect(b.x - 4.5, b.y - 16, 9, 22);
    }
  });
  w.enemyBullets.forEach((b) => {
    const br = b.r || 5;
    if (b.type === "needle") {
      const ang = Math.atan2(b.vy || 0, b.vx || 0);
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(ang);
      ctx.fillStyle = "#ffcb87";
      ctx.fillRect(-br * 1.35, -br * 0.45, br * 2.7, br * 0.9);
      ctx.fillStyle = "#fff4df";
      ctx.fillRect(br * 0.8, -br * 0.26, br * 0.8, br * 0.52);
      ctx.restore();
    } else if (b.type === "bossBomb") {
      ctx.fillStyle = "#ff7c58";
      ctx.beginPath();
      ctx.arc(b.x, b.y, br, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffe6b8";
      ctx.beginPath();
      ctx.arc(b.x - br * 0.32, b.y - br * 0.32, br * 0.35, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = "#ff9ba9";
      ctx.fillRect(b.x - br * 0.5, b.y - br * 1.1, br, br * 2.2);
    }
  });

  w.explosions.forEach((p) => {
    const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
    ctx.globalAlpha = alpha;
    if (p.ring) {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (1 + (1 - alpha) * 0.6), 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.globalAlpha = 1;

  w.bombFields.forEach((f) => {
    const alpha = Math.max(0, Math.min(1, f.life / f.maxLife));
    ctx.globalAlpha = alpha * 0.45;
    ctx.fillStyle = "#ffb26a";
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = alpha * 0.95;
    ctx.strokeStyle = "#ffdca6";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
  w.enemyBombFields.forEach((f) => {
    const alpha = Math.max(0, Math.min(1, f.life / f.maxLife));
    ctx.globalAlpha = alpha * 0.44;
    ctx.fillStyle = "#ff5b6c";
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = alpha * 0.95;
    ctx.strokeStyle = "#ffd0b8";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;

  w.powerDrops.forEach((d) => {
    const s = d.r || 12;
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(d.spin);
    ctx.fillStyle = "#10243f";
    ctx.fillRect(-s, -s, s * 2, s * 2);
    ctx.fillStyle = "#88d2ff";
    ctx.fillRect(-s * 0.7, -s * 0.7, s * 1.4, s * 1.4);
    ctx.fillStyle = "#f1fbff";
    ctx.fillRect(-s * 0.18, -s * 0.92, s * 0.36, s * 1.84);
    ctx.fillRect(-s * 0.92, -s * 0.18, s * 1.84, s * 0.36);
    ctx.restore();
  });

  w.enemies.forEach((e) => drawDrumPixelEnemy(ctx, e, state.drumTime));
  if (w.boss) {
    const b = w.boss;
    const isFlash = b.phase === "flash";
    const flashOn = isFlash && Math.sin(state.drumTime * 26) > 0;
    ctx.save();
    ctx.translate(Math.round(b.x), Math.round(b.y));
    ctx.globalAlpha = isFlash ? (flashOn ? 0.9 : 0.25) : 0.55;
    ctx.fillStyle = isFlash ? (flashOn ? "#ff3f4f88" : "#a8203450") : "#ff93af55";
    ctx.beginPath();
    ctx.arc(0, 0, b.r + 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    if (b.stage === 1) {
      ctx.fillStyle = isFlash ? (flashOn ? "#4a0e16" : "#2a1021") : "#2a1021";
      ctx.fillRect(-b.r, -b.r * 0.78, b.r * 2, b.r * 1.56);
      ctx.fillStyle = isFlash ? (flashOn ? "#ff5668" : "#d35086") : "#d35086";
      ctx.fillRect(-b.r * 0.78, -b.r * 0.56, b.r * 1.56, b.r * 1.12);
      ctx.fillStyle = isFlash ? (flashOn ? "#ffd3cf" : "#ffe6f0") : "#ffe6f0";
      ctx.fillRect(-8, -b.r * 0.72, 16, b.r * 1.42);
      ctx.fillRect(-b.r * 0.5, -6, b.r, 12);
      ctx.fillStyle = isFlash
        ? (flashOn ? "#fff9df" : "#ffc0b7")
        : (Math.sin(state.drumTime * 10 + b.t * 1.2) > 0 ? "#fff0f6" : "#ffbdd3");
      ctx.fillRect(-7, -7, 14, 14);
    } else if (b.stage === 2) {
      ctx.fillStyle = isFlash ? (flashOn ? "#12253b" : "#101c2f") : "#101c2f";
      ctx.beginPath();
      ctx.moveTo(0, -b.r * 0.95);
      ctx.lineTo(b.r * 0.98, -b.r * 0.15);
      ctx.lineTo(b.r * 0.75, b.r * 0.85);
      ctx.lineTo(-b.r * 0.75, b.r * 0.85);
      ctx.lineTo(-b.r * 0.98, -b.r * 0.15);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = isFlash ? (flashOn ? "#49d7ff" : "#1caad8") : "#1caad8";
      ctx.fillRect(-b.r * 0.72, -b.r * 0.12, b.r * 1.44, b.r * 0.34);
      ctx.fillStyle = "#d6f6ff";
      ctx.fillRect(-b.r * 0.42, -b.r * 0.55, b.r * 0.84, b.r * 0.22);
      ctx.fillRect(-7, -7, 14, 14);
      ctx.fillStyle = "#153552";
      ctx.fillRect(-b.r * 1.05, -4, b.r * 0.3, 8);
      ctx.fillRect(b.r * 0.75, -4, b.r * 0.3, 8);
    } else {
      ctx.fillStyle = isFlash ? (flashOn ? "#3b130d" : "#28110c") : "#28110c";
      ctx.beginPath();
      ctx.arc(0, 0, b.r * 0.98, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = isFlash ? (flashOn ? "#ff8c4c" : "#d86634") : "#d86634";
      ctx.fillRect(-b.r * 0.88, -b.r * 0.22, b.r * 1.76, b.r * 0.44);
      ctx.fillStyle = "#ffe2be";
      ctx.fillRect(-10, -b.r * 0.7, 20, b.r * 1.4);
      ctx.fillRect(-b.r * 0.36, -7, b.r * 0.72, 14);
      ctx.fillStyle = "#ffb779";
      ctx.beginPath();
      ctx.moveTo(-b.r * 0.62, -b.r * 0.75);
      ctx.lineTo(-b.r * 0.36, -b.r * 1.08);
      ctx.lineTo(-b.r * 0.12, -b.r * 0.72);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(b.r * 0.62, -b.r * 0.75);
      ctx.lineTo(b.r * 0.36, -b.r * 1.08);
      ctx.lineTo(b.r * 0.12, -b.r * 0.72);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = isFlash ? "#fff3d4" : "#ffe8c7";
      ctx.fillRect(-8, -8, 16, 16);
    }
    ctx.restore();
  }

  const p = w.player;
  if (Array.isArray(w.clones) && w.clones.length > 0) {
    w.clones.forEach((c, idx) => {
      drawDrumShip(ctx, c.x, c.y, c.r, {
        alpha: 0.5,
        shooting: state.drumInput.shoot,
        timeSec: state.drumTime,
        phase: 1.3 + idx * 0.28
      });
    });
  }
  const playerAlpha = p.invuln > 0 && Math.floor(state.drumTime * 20) % 2 === 0 ? 0.35 : 1;
  drawDrumShip(ctx, p.x, p.y, p.r, {
    alpha: playerAlpha,
    shooting: state.drumInput.shoot,
    timeSec: state.drumTime,
    rollActive: w.dashActive,
    roll: w.dashRoll,
    rollDir: w.dashRollDir
  });

  if (!state.drumGameRunning) {
    ctx.fillStyle = "#00000099";
    ctx.fillRect(0, 0, w.width, w.height);
    ctx.strokeStyle = "#ffffffcc";
    ctx.strokeRect(w.width * 0.5 - 250, w.height * 0.5 - 56, 500, 108);
    ctx.fillStyle = "#f6fbff";
    ctx.font = "900 32px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("COSMIC SHOOTER", w.width * 0.5, w.height * 0.5 - 10);
    ctx.font = "700 18px sans-serif";
    ctx.fillText("ENTER / SPACE TO START", w.width * 0.5, w.height * 0.5 + 28);
  }

  outCtx.imageSmoothingEnabled = false;
  outCtx.clearRect(0, 0, w.width, w.height);
  outCtx.drawImage(w.pixelBuffer, 0, 0, w.width, w.height);
}

function endDrumGame(cleared) {
  if (!state.drumWorld) return;
  state.drumFinalScore = state.drumWorld.score || 0;
  if (state.drumTutorialMode) {
    finishDrumTutorial(cleared);
    return;
  }
  if (cleared) {
    const timeLeft = Math.max(0, state.drumTimeLimit - state.drumTime);
    const rank = drumRankByResult(state.drumWorld.player.hp, timeLeft);
    state.members.drum = true;
    setMemberStatus("drum", rank);
    updateHud();
    sceneData.dSuccess.text = `撃破 ${state.drumWorld.killCount}、3ステージ突破成功。学園祭まで全力で叩くよ。`;
    stopDrumGame();
    goScene("dSuccess");
    return;
  }

  // No retry path: on failure (including HP 0), join with 1-star status and continue.
  state.members.drum = true;
  setMemberStatus("drum", 1);
  updateHud();
  sceneData.dFail.text = "被弾で離脱したが、最低限の連携は取れた。次へ進もう。";
  stopDrumGame();
  goScene("dFail");
}

function finishDrumTutorial(_cleared) {
  state.drumGameRunning = false;
  state.drumTutorialMode = false;
  state.drumCommsPending = false;
  if (state.drumCommsIntroTimer) {
    clearTimeout(state.drumCommsIntroTimer);
    state.drumCommsIntroTimer = 0;
  }
  endDrumCommsEncounter();
  resetDrumInputSources();
  resetDrumWorld();
  updateDrumStageHud();
  updateDrumHpGauge();
  updateDrumDashGauge();
  updateDrumBossGauge();
  updateDrumScoreText();
  updateDrumCommsTimeGauge();
  updateDrumPowerUi();
  if (state.drumLoopId) {
    cancelAnimationFrame(state.drumLoopId);
    state.drumLoopId = 0;
  }
  if (el.drumBrief) {
    el.drumBrief.classList.add("show");
  }
  if (el.drumTutorialEndBtn) {
    el.drumTutorialEndBtn.hidden = true;
  }
  drawDrumGame(el.drumCanvas.getContext("2d"));
}

function stopDrumTutorialByButton() {
  if (!state.drumGameActive) return;
  if (!state.drumTutorialMode) return;
  finishDrumTutorial(false);
}
function drumTick(now) {
  if (!state.drumGameRunning || !state.drumWorld) return;
  if (!state.drumLastTick) state.drumLastTick = now;
  const rawDt = Math.max(0.001, Math.min(0.033, (now - state.drumLastTick) / 1000));
  state.drumLastTick = now;
  const w = state.drumWorld;
  const p = w.player;

  if (state.drumCommsActive) {
    if (state.drumCommsData && !state.drumCommsData.resolving) {
      state.drumCommsData.timeLeft = Math.max(0, state.drumCommsData.timeLeft - rawDt);
      updateDrumCommsTimeGauge();
      if (state.drumCommsData.timeLeft <= 0) {
        if (el.drumCommsResult) {
          el.drumCommsResult.textContent = "TIME UP / 照合失敗";
        }
        applyDrumCommsPenalty();
      }
    }
    drawDrumGame(el.drumCanvas.getContext("2d"));
    updateDrumStageHud();
    updateDrumHpGauge();
    updateDrumDashGauge();
    updateDrumBossGauge();
    updateDrumScoreText();
    state.drumLoopId = requestAnimationFrame(drumTick);
    return;
  }
  if (state.drumCommsPending) {
    drawDrumGame(el.drumCanvas.getContext("2d"));
    updateDrumStageHud();
    updateDrumHpGauge();
    updateDrumDashGauge();
    updateDrumBossGauge();
    updateDrumScoreText();
    state.drumLoopId = requestAnimationFrame(drumTick);
    return;
  }

  state.drumTime += rawDt;
  if (!w.commsWarned && state.drumTime >= w.nextCommsWarnAt) {
    w.commsWarned = true;
    triggerDrumCommsWarning();
  }
  if (state.drumTime >= w.nextCommsAt) {
    w.nextCommsAt += 20;
    w.nextCommsWarnAt = Math.max(0, w.nextCommsAt - DRUM_COMMS_WARN_LEAD);
    w.commsWarned = false;
    state.drumCommsPending = true;
    showDrumCommsEntryEffect();
    if (state.drumCommsIntroTimer) clearTimeout(state.drumCommsIntroTimer);
    state.drumCommsIntroTimer = setTimeout(() => {
      state.drumCommsIntroTimer = 0;
      if (!state.drumGameActive || !state.drumGameRunning || !state.drumWorld) {
        state.drumCommsPending = false;
        return;
      }
      state.drumCommsPending = false;
      startDrumCommsEncounter();
    }, 720);
    drawDrumGame(el.drumCanvas.getContext("2d"));
    updateDrumStageHud();
    updateDrumHpGauge();
    updateDrumDashGauge();
    updateDrumBossGauge();
    updateDrumScoreText();
    state.drumLoopId = requestAnimationFrame(drumTick);
    return;
  }

  p.invuln = Math.max(0, p.invuln - rawDt);
  w.shootCooldown = Math.max(0, w.shootCooldown - rawDt);
  w.dashCooldown = Math.max(0, w.dashCooldown - rawDt);

  const ax = (state.drumInput.right ? 1 : 0) - (state.drumInput.left ? 1 : 0);
  const ay = (state.drumInput.down ? 1 : 0) - (state.drumInput.up ? 1 : 0);
  if (w.dashActive) {
    const dashSpeed = 760;
    p.x += w.dashDirX * dashSpeed * rawDt;
    p.y += w.dashDirY * dashSpeed * rawDt;
    w.dashRoll += rawDt * 24;
    w.dashTime -= rawDt;
    p.invuln = Math.max(p.invuln, 0.08);
    if (w.dashTime <= 0) {
      w.dashActive = false;
      w.dashRoll = 0;
    }
  } else if (ax !== 0 || ay !== 0) {
    const n = Math.hypot(ax, ay) || 1;
    const mx = ax / n;
    const my = ay / n;
    p.x += mx * p.speed * rawDt;
    p.y += my * p.speed * rawDt;
    w.lastMoveX = mx;
    w.lastMoveY = my;
  }
  p.x = Math.max(p.r + 8, Math.min(w.width - p.r - 8, p.x));
  p.y = Math.max(p.r + 8, Math.min(w.height - p.r - 8, p.y));
  updateDrumClone(rawDt);

  if (state.drumInput.shoot && w.shootCooldown <= 0) {
    const bombBusy =
      w.weaponMode === "bomb" &&
      (
        w.bullets.some((b) => b.type === "bomb") ||
        (Array.isArray(w.bombFields) && w.bombFields.length > 0)
      );
    if (!bombBusy) {
      w.shootCooldown = w.weaponMode === "laser" ? 0.2 : w.weaponMode === "bomb" ? 0.08 : 0.16;
      fireDrumPlayerShot(w, p.x, p.y, p.r);
      if (Array.isArray(w.clones) && w.clones.length > 0) {
        w.clones.forEach((c) => fireDrumPlayerShot(w, c.x, c.y, c.r));
      }
      playDrumShootSe();
    }
  }

  if (!w.boss && !w.cleared) {
    w.stageTimer += rawDt;
  }
  const stageCfg = getDrumStageConfig(w);
  const canSpawnMobs = !w.boss && !w.cleared && w.stageTimer < w.stageBossAt;
  w.spawnIn -= rawDt;
  if (canSpawnMobs && w.spawnIn <= 0) {
    spawnDrumEnemy();
    const density = stageCfg.spawnBase - Math.min(0.12, state.drumTime * 0.0015);
    w.spawnIn = Math.max(0.18, density + Math.random() * 0.22);
  }
  if (!w.boss && !w.cleared && w.stageTimer >= w.stageBossAt && w.enemies.length === 0) {
    spawnDrumBoss(w);
  }

  w.stars.forEach((s) => {
    s.y += s.speed * rawDt;
    if (s.y > w.height + 8) {
      s.y = -8;
      s.x = Math.random() * w.width;
    }
  });

  w.bullets = w.bullets.filter((b) => {
    b.x += (b.vx || 0) * rawDt;
    b.y += b.vy * rawDt;
    if (typeof b.life === "number") b.life -= rawDt;
    if (b.type === "bomb") {
      b.fuse = Math.max(0, (b.fuse || 0) - rawDt);
      if (b.fuse <= 0) {
        spawnDrumBombField(w, b.x, b.y);
        return false;
      }
    }
    if (b.y < -70 || b.y > w.height + 20 || b.x < -30 || b.x > w.width + 30) return false;
    if (typeof b.life === "number" && b.life <= 0) return false;

    let consumed = false;
    if (w.boss) {
      const boss = w.boss;
      const bulletR = b.r || 8;
      const laserPad = b.type === "laser" ? 10 : 0;
      if (Math.hypot(b.x - boss.x, b.y - boss.y) <= boss.r + bulletR + 6 + laserPad) {
        if (b.type === "bomb") {
          spawnDrumBombField(w, b.x, b.y);
          return false;
        }
        if (b.pierce) {
          if (!b.hitIds) b.hitIds = {};
          if (!b.hitIds[boss.id]) {
            b.hitIds[boss.id] = 1;
            boss.hp -= b.damage || 1;
          }
        } else {
          consumed = true;
          boss.hp -= b.damage || 1;
        }
        if (boss.hp <= 0) {
          defeatDrumBoss(w);
        }
        if (!b.pierce) return !consumed;
      }
    }
    for (let i = 0; i < w.enemies.length; i += 1) {
      const e = w.enemies[i];
      const bulletR = b.r || 8;
      const laserPad = b.type === "laser" ? 10 : 0;
      if (Math.hypot(b.x - e.x, b.y - e.y) > e.r + bulletR + 6 + laserPad) continue;
      if (b.type === "bomb") {
        spawnDrumBombField(w, b.x, b.y);
        return false;
      }

      if (b.pierce) {
        if (!b.hitIds) b.hitIds = {};
        if (b.hitIds[e.id]) continue;
        b.hitIds[e.id] = 1;
      } else {
        consumed = true;
      }

      e.hp -= b.damage || 1;
      if (e.hp <= 0) {
        destroyDrumEnemyAt(w, i);
        i -= 1;
      }
      if (!b.pierce) break;
    }
    return !consumed;
  });

  w.enemies = w.enemies.filter((e) => {
    e.t += rawDt;
    if (e.kind === "zigzag") {
      e.x += Math.sin(e.t * 3.8) * 110 * rawDt + e.vx * rawDt * 0.1;
    }
    e.y += e.vy * rawDt;
    e.x = Math.max(e.r + 4, Math.min(w.width - e.r - 4, e.x));

    if (e.kind === "shooter") {
      e.fireIn -= rawDt;
      if (e.fireIn <= 0) {
        e.fireIn = 0.9 + Math.random() * 0.75;
        const dx = p.x - e.x;
        const dy = p.y - e.y;
        const n = Math.hypot(dx, dy) || 1;
        const sp = 205;
        w.enemyBullets.push({
          x: e.x,
          y: e.y + 6,
          vx: (dx / n) * sp,
          vy: (dy / n) * sp,
          r: 6,
          type: "needle"
        });
      }
    }

    const shipHit = Math.hypot(p.x - e.x, p.y - e.y) <= p.r + e.r + 4;
    if (shipHit && p.invuln <= 0) {
      p.hp -= 1;
      p.invuln = 1;
      pulseShake();
      return false;
    }
    return e.y < w.height + 36;
  });
  updateDrumBoss(w, p, rawDt);

  w.powerDrops = w.powerDrops.filter((d) => {
    d.spin += rawDt * 4.8;
    d.y += d.vy * rawDt;
    d.vy = Math.min(220, d.vy + 120 * rawDt);
    const picked = Math.hypot(p.x - d.x, p.y - d.y) <= p.r + d.r + 5;
    if (picked) {
      drumPickupNextPowerItem();
      spawnDrumExplosion(d.x, d.y, "small");
      return false;
    }
    return d.y < w.height + 36;
  });

  w.enemyBullets = w.enemyBullets.filter((b) => {
    if (b.type === "needle") {
      b.vx *= 0.996;
      b.vy += 14 * rawDt;
    } else if (b.type === "bossBomb") {
      b.vy += 28 * rawDt;
    }
    b.x += b.vx * rawDt;
    b.y += b.vy * rawDt;
    if (typeof b.fuse === "number") {
      b.fuse -= rawDt;
      if (b.fuse <= 0) {
        spawnDrumExplosion(b.x, b.y, "small");
        w.enemyBombFields.push({
          x: b.x,
          y: b.y,
          r: DRUM_BOSS_BOMB_FIELD_RADIUS,
          life: DRUM_BOSS_BOMB_FIELD_LIFE_SEC,
          maxLife: DRUM_BOSS_BOMB_FIELD_LIFE_SEC
        });
        return false;
      }
    }
    const erasedByBomb =
      Array.isArray(w.bombFields) &&
      w.bombFields.some((f) => Math.hypot(b.x - f.x, b.y - f.y) <= f.r + (b.r || 3));
    if (erasedByBomb) return false;
    const hit = Math.hypot(p.x - b.x, p.y - b.y) <= p.r + (b.r || 3);
    if (hit && p.invuln <= 0) {
      p.hp -= 1;
      p.invuln = 1;
      pulseShake();
      return false;
    }
    return b.y > -20 && b.y < w.height + 20 && b.x > -20 && b.x < w.width + 20;
  });
  w.enemyBombFields = w.enemyBombFields.filter((f) => {
    f.life -= rawDt;
    if (f.life <= 0) return false;
    const hit = Math.hypot(p.x - f.x, p.y - f.y) <= p.r + f.r;
    if (hit && p.invuln <= 0) {
      p.hp -= 1;
      p.invuln = 1;
      pulseShake();
    }
    return true;
  });

  w.bombFields = w.bombFields.filter((f) => {
    f.life -= rawDt;
    f.tickIn -= rawDt;
    if (f.life <= 0) return false;
    while (f.tickIn <= 0) {
      f.tickIn += DRUM_BOMB_TICK_SEC;
      if (w.boss) {
        const boss = w.boss;
        if (Math.hypot(f.x - boss.x, f.y - boss.y) <= f.r + boss.r) {
          boss.hp -= DRUM_BOMB_DAMAGE;
          if (boss.hp <= 0) {
            defeatDrumBoss(w);
          }
        }
      }
      for (let i = 0; i < w.enemies.length; i += 1) {
        const e = w.enemies[i];
        if (Math.hypot(f.x - e.x, f.y - e.y) > f.r + e.r) continue;
        e.hp -= DRUM_BOMB_DAMAGE;
        if (e.hp <= 0) {
          destroyDrumEnemyAt(w, i);
          i -= 1;
        }
      }
    }
    return true;
  });

  w.explosions = w.explosions.filter((p) => {
    p.life -= rawDt;
    if (p.ring) return p.life > 0;
    p.x += p.vx * rawDt;
    p.y += p.vy * rawDt;
    p.vx *= 0.96;
    p.vy = p.vy * 0.96 + 180 * rawDt;
    return p.life > 0;
  });

  drawDrumGame(el.drumCanvas.getContext("2d"));
  updateDrumStageHud();
  updateDrumHpGauge();
  updateDrumDashGauge();
  updateDrumBossGauge();
  updateDrumScoreText();

  if (p.hp <= 0) {
    endDrumGame(false);
    return;
  }
  if (w.cleared) {
    endDrumGame(true);
    return;
  }
  state.drumLoopId = requestAnimationFrame(drumTick);
}

function openDrumGame() {
  state.drumGameActive = true;
  state.drumGameRunning = false;
  state.drumTutorialMode = false;
  state.drumTime = 0;
  state.drumLastTick = 0;
  state.drumStartLockUntil = (window.performance ? performance.now() : Date.now()) + 280;
  state.drumCommsPending = false;
  if (state.drumCommsIntroTimer) {
    clearTimeout(state.drumCommsIntroTimer);
    state.drumCommsIntroTimer = 0;
  }
  endDrumCommsEncounter();
  bindDrumCommsUi();
  resetDrumInputSources();
  resetDrumWorld();
  updateDrumStageHud();
  updateDrumHpGauge();
  updateDrumDashGauge();
  updateDrumBossGauge();
  updateDrumScoreText();
  updateDrumCommsTimeGauge();
  updateDrumPowerUi();

  if (el.bgm.getAttribute("src") !== DRUM_BGM_SRC) {
    el.bgm.src = DRUM_BGM_SRC;
    el.bgm.load();
  }
  el.bgm.loop = true;
  el.bgm.playbackRate = 1;
  el.bgm.currentTime = 0;
  el.bgm.pause();

  el.app.classList.add("drum-mode");
  el.drumGameLayer.classList.add("active");
  if (el.drumBrief) {
    el.drumBrief.classList.add("show");
  }
  if (el.drumTutorialEndBtn) {
    el.drumTutorialEndBtn.hidden = true;
  }
  el.textboxAdvance.classList.add("hidden");
  drawDrumGame(el.drumCanvas.getContext("2d"));
}

function startDrumGame(tutorialMode = false) {
  if (!state.drumGameActive || state.drumGameRunning) return;
  const now = window.performance ? performance.now() : Date.now();
  if (state.drumStartLockUntil && now < state.drumStartLockUntil) return;
  state.drumTutorialMode = !!tutorialMode;
  state.drumGameRunning = true;
  state.drumTime = 0;
  state.drumLastTick = 0;
  state.drumCommsPending = false;
  if (state.drumCommsIntroTimer) {
    clearTimeout(state.drumCommsIntroTimer);
    state.drumCommsIntroTimer = 0;
  }
  endDrumCommsEncounter();
  bindDrumCommsUi();
  resetDrumInputSources();
  resetDrumWorld();
  showDrumStageEffect(1);
  updateDrumStageHud();
  updateDrumHpGauge();
  updateDrumDashGauge();
  updateDrumBossGauge();
  updateDrumScoreText();
  updateDrumCommsTimeGauge();
  updateDrumPowerUi();
  if (el.drumBrief) {
    el.drumBrief.classList.remove("show");
  }
  if (el.drumTutorialEndBtn) {
    el.drumTutorialEndBtn.hidden = !state.drumTutorialMode;
  }
  if (el.bgm.getAttribute("src") !== DRUM_BGM_SRC) {
    el.bgm.src = DRUM_BGM_SRC;
    el.bgm.load();
  }
  el.bgm.loop = true;
  el.bgm.playbackRate = 1;
  el.bgm.currentTime = 0;
  if (state.audioOn) {
    el.bgm.play().catch(() => {});
  } else {
    el.bgm.pause();
  }
  state.drumLoopId = requestAnimationFrame(drumTick);
}

function startDrumTutorial() {
  startDrumGame(true);
}

function skipDrumToBoss() {
  if (!state.drumGameActive || !state.drumGameRunning || !state.drumWorld) return;
  const w = state.drumWorld;
  if (w.cleared || w.boss || w.stage > 3) return;
  w.stageTimer = w.stageBossAt;
  w.spawnIn = 999;
  w.enemies = [];
  w.enemyBullets = [];
  spawnDrumBoss(w);
  updateDrumStageHud();
  updateDrumBossGauge();
}

function skipDrumGame() {
  if (!state.drumGameActive) return;
  if (state.drumTutorialMode) {
    finishDrumTutorial(false);
    return;
  }
  state.members.drum = true;
  setMemberStatus("drum", 3);
  updateHud();
  sceneData.dSuccess.text = "Sキーでステージをスキップ。評価は★3として記録した。学園祭まで全力で叩くよ。";
  stopDrumGame();
  goScene("dSuccess");
}

function stopDrumGame() {
  state.drumGameActive = false;
  state.drumGameRunning = false;
  state.drumTutorialMode = false;
  state.drumCommsPending = false;
  if (state.drumCommsIntroTimer) {
    clearTimeout(state.drumCommsIntroTimer);
    state.drumCommsIntroTimer = 0;
  }
  endDrumCommsEncounter();
  state.drumWorld = null;
  resetDrumInputSources();
  updateDrumHpGauge();
  updateDrumDashGauge();
  updateDrumCommsTimeGauge();
  updateDrumPowerUi();
  updateDrumScoreText();
  if (state.drumLoopId) {
    cancelAnimationFrame(state.drumLoopId);
    state.drumLoopId = 0;
  }
  el.app.classList.remove("drum-mode");
  if (el.drumGameLayer) {
    el.drumGameLayer.classList.remove("active");
  }
  if (el.drumBrief) {
    el.drumBrief.classList.remove("show");
  }
  if (el.drumTutorialEndBtn) {
    el.drumTutorialEndBtn.hidden = true;
  }
  el.textboxAdvance.classList.remove("hidden");
  restoreDefaultBgm();
}







