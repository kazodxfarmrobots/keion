      const LIVE_SCORE_BAR_MAX = 150;

      function getLivePerformanceTier(score) {
        if (score >= 150) return "legend";
        if (score >= 130) return "great";
        if (score >= 110) return "good";
        if (score >= 90) return "clear";
        return "fail";
      }

      function updateLiveHud() {
        el.liveTimer.textContent = `TIME: ${state.liveTimeLeft.toFixed(1)}`;
        const fill = Math.max(0, Math.min(LIVE_SCORE_BAR_MAX, state.liveScore)) / LIVE_SCORE_BAR_MAX;
        el.liveScoreFill.style.width = `${(fill * 100).toFixed(2)}%`;
        el.liveCombo.textContent = `COMBO x${state.liveCombo}`;
        updateLiveFeverUi();
      }

      function hasLiveStar3Bonus() {
        return (
          state.memberStatus.guitar === 3 &&
          state.memberStatus.bass === 3 &&
          state.memberStatus.drum === 3
        );
      }

      function updateLiveFeverUi() {
        if (!state.liveFeverEligible) {
          el.liveFeverStatus.textContent = "FEVER: LOCK";
          el.liveFeverBtn.disabled = true;
          return;
        }
        if (state.liveFeverActive) {
          const left = Math.max(0, state.liveFeverEndAt - performance.now());
          el.liveFeverStatus.textContent = `FEVER: ON ${Math.ceil(left / 100) / 10}s`;
          el.liveFeverBtn.disabled = true;
          return;
        }
        if (state.liveFeverAvailable) {
          el.liveFeverStatus.textContent = "FEVER: FULL STAR";
          el.liveFeverBtn.disabled = !state.liveRunning;
          return;
        }
        el.liveFeverStatus.textContent = "FEVER: USED";
        el.liveFeverBtn.disabled = true;
      }

      function setLiveFeverVisual(active) {
        el.liveField.classList.toggle("fever-rainbow", !!active);
      }

      function activateLiveFever() {
        if (!state.liveRunning) return;
        if (!state.liveFeverAvailable) return;
        state.liveFeverAvailable = false;
        state.liveFeverActive = true;
        state.liveFeverEndAt = performance.now() + 9000;
        state.liveFeverShield = true;
        setLiveFeverVisual(true);
        triggerLiveCinematicFx(performance.now());
        updateLiveFeverUi();
      }

      function updateLiveFever(now) {
        if (!state.liveFeverActive) return;
        if (now < state.liveFeverEndAt) return;
        state.liveFeverActive = false;
        state.liveFeverEndAt = 0;
        state.liveFeverShield = false;
        setLiveFeverVisual(false);
        updateLiveFeverUi();
      }

      function removeVoice(voice) {
        if (voice.node && voice.node.parentNode) {
          voice.node.parentNode.removeChild(voice.node);
        }
      }

      function clearLiveVoices() {
        state.liveVoices.forEach((v) => removeVoice(v));
        state.liveVoices = [];
      }

      function spawnMiniFirework(x, y) {
        const offsets = [0, -30, 30];
        offsets.forEach((dx, idx) => {
          const node = document.createElement("span");
          node.className = "mini-firework";
          node.style.left = `${x + dx}px`;
          node.style.top = `${y + (idx === 0 ? 0 : 2)}px`;
          const baseHue = Math.floor(Math.random() * 360);
          node.style.setProperty("--fw-color", `hsl(${baseHue} 95% 62%)`);

          const core = document.createElement("span");
          core.className = "mini-firework-core";
          node.appendChild(core);

          const count = 14;
          for (let i = 0; i < count; i += 1) {
            const s = document.createElement("span");
            s.className = "mini-firework-spark";
            const ang = (360 / count) * i + (Math.random() * 14 - 7);
            const dist = 36 + Math.random() * 39;
            const delay = Math.floor(Math.random() * 80) + (idx === 0 ? 0 : 28);
            const hue = (baseHue + Math.floor(Math.random() * 100 - 50) + 360) % 360;
            const sat = 88 + Math.floor(Math.random() * 10);
            const light = 58 + Math.floor(Math.random() * 16);
            s.style.setProperty("--ang", `${ang}deg`);
            s.style.setProperty("--dist", `${dist}px`);
            s.style.setProperty("--delay", `${delay}ms`);
            s.style.setProperty("--spark-color", `hsl(${hue} ${sat}% ${light}%)`);
            node.appendChild(s);
          }

          el.liveField.appendChild(node);
          window.setTimeout(() => {
            if (node.parentNode) node.parentNode.removeChild(node);
          }, 700);
        });
      }

      function playVoiceTapEffect(voice) {
        const node = voice.node;
        if (!node) return;
        node.style.setProperty("--vx", `${voice.x}px`);
        node.style.setProperty("--vy", `${voice.y}px`);
        if (voice.type === "neg") {
          const cx = voice.x + (node.offsetWidth || 132) * 0.5;
          const cy = voice.y + (node.offsetHeight || 48) * 0.5;
          spawnMiniFirework(cx, cy);
          node.classList.add("hit", "hit-red");
        } else {
          node.classList.add("hit", "hit-green");
        }
        const ms = voice.type === "neg" ? 180 : 420;
        window.setTimeout(() => removeVoice(voice), ms);
      }

      function setupLiveCastLane() {
        const actors = [el.liveCast1, el.liveCast2, el.liveCast3, el.liveCast4];
        const laneW = (el.liveCastLane && el.liveCastLane.clientWidth) || el.liveField.clientWidth || 280;
        const laneH = (el.liveCastLane && el.liveCastLane.clientHeight) || 92;
        const count = actors.length;
        const desiredSize = window.innerWidth <= 780 ? 64 : 78;
        const minSize = 20;
        const sidePad = 4;
        const maxByWidth = Math.floor((laneW - sidePad * 2) / count) - 2;
        const maxByHeight = laneH - 8;
        const maxSize = Math.max(minSize, Math.min(maxByWidth, maxByHeight));
        let iconSize = Math.max(minSize, Math.min(desiredSize, maxSize));
        if (iconSize > maxByWidth || iconSize > maxByHeight) {
          iconSize = Math.max(14, Math.min(maxByWidth, maxByHeight));
        }
        const slotW = (laneW - sidePad * 2) / count;
        const y = Math.max(2, (laneH - iconSize) / 2);
        state.liveCastActors = actors.map((actor, i) => {
          const slotCenter = sidePad + slotW * (i + 0.5);
          const x = Math.max(2, Math.min(laneW - iconSize - 2, slotCenter - iconSize / 2));
          actor.style.left = `${x}px`;
          actor.style.right = "auto";
          actor.style.top = `${y}px`;
          actor.style.bottom = "auto";
          actor.style.width = `${iconSize}px`;
          actor.style.height = `${iconSize}px`;
          actor.classList.remove("jump");
          return { el: actor, x, y, width: iconSize, height: iconSize };
        });
      }

      function refreshLiveCastLayout() {
        if (!state.liveActive) return;
        setupLiveCastLane();
      }

      function triggerRandomCastJump() {
        if (!state.liveCastActors.length) return;
        const idx = Math.floor(Math.random() * state.liveCastActors.length);
        const actor = state.liveCastActors[idx].el;
        actor.classList.remove("jump");
        void actor.offsetWidth;
        actor.classList.add("jump");
      }

      function playComboMilestoneSe(combo) {
        if (!state.audioOn) return;
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        if (!state.seContext) state.seContext = new Ctx();
        const ctx = state.seContext;
        if (ctx.state === "suspended") ctx.resume().catch(() => {});

        const now = ctx.currentTime;
        const isMega = combo % 50 === 0;

        const master = ctx.createGain();
        master.gain.setValueAtTime(0.0001, now);
        master.gain.exponentialRampToValueAtTime(isMega ? 0.13 : 0.1, now + 0.004);
        master.gain.exponentialRampToValueAtTime(0.0001, now + (isMega ? 0.22 : 0.16));
        master.connect(ctx.destination);

        const hp = ctx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.setValueAtTime(isMega ? 1800 : 2100, now);
        hp.Q.value = 0.8;
        hp.connect(master);

        const shimmer = ctx.createOscillator();
        shimmer.type = "square";
        shimmer.frequency.setValueAtTime(isMega ? 2500 : 2900, now);
        shimmer.frequency.exponentialRampToValueAtTime(isMega ? 1800 : 2100, now + 0.11);
        const shimmerGain = ctx.createGain();
        shimmerGain.gain.setValueAtTime(0.0001, now);
        shimmerGain.gain.exponentialRampToValueAtTime(isMega ? 0.34 : 0.28, now + 0.003);
        shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);
        shimmer.connect(shimmerGain);
        shimmerGain.connect(hp);
        shimmer.start(now);
        shimmer.stop(now + 0.085);

        const body = ctx.createOscillator();
        body.type = "triangle";
        body.frequency.setValueAtTime(isMega ? 1680 : 1520, now + 0.006);
        body.frequency.exponentialRampToValueAtTime(isMega ? 980 : 900, now + 0.14);
        const bodyGain = ctx.createGain();
        bodyGain.gain.setValueAtTime(0.0001, now + 0.006);
        bodyGain.gain.exponentialRampToValueAtTime(isMega ? 0.14 : 0.1, now + 0.014);
        bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
        body.connect(bodyGain);
        bodyGain.connect(master);
        body.start(now + 0.006);
        body.stop(now + 0.16);

        if (isMega) {
          const tail = ctx.createOscillator();
          tail.type = "sine";
          tail.frequency.setValueAtTime(760, now + 0.012);
          tail.frequency.exponentialRampToValueAtTime(540, now + 0.19);
          const tailGain = ctx.createGain();
          tailGain.gain.setValueAtTime(0.0001, now + 0.012);
          tailGain.gain.exponentialRampToValueAtTime(0.09, now + 0.03);
          tailGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
          tail.connect(tailGain);
          tailGain.connect(master);
          tail.start(now + 0.012);
          tail.stop(now + 0.21);
        }
      }

      function triggerComboMilestone(combo) {
        if (combo <= 0 || combo % 10 !== 0) return;
        if (combo === state.liveComboMilestoneShown) return;
        state.liveComboMilestoneShown = combo;
        const isMega = combo % 50 === 0;
        el.liveComboBurstMain.textContent = isMega ? `${combo} COMBO BREAK!` : `${combo} COMBO!`;
        el.liveComboBurst.classList.toggle("mega", isMega);
        el.liveComboBurst.classList.remove("play");
        void el.liveComboBurst.offsetWidth;
        el.liveComboBurst.classList.add("play");
        const now = performance.now();
        triggerLiveCinematicFx(now);
        if (isMega) {
          state.liveCamKickUntil = Math.max(state.liveCamKickUntil, now + 460);
          state.liveCamDriftUntil = Math.max(state.liveCamDriftUntil, now + 1100);
        }
        playComboMilestoneSe(combo);
      }

      function resetLiveCinematicFx() {
        state.liveCamKickUntil = 0;
        state.liveCamDriftUntil = 0;
        state.liveCamSeed = 0;
        el.liveField.classList.remove("fx-speedline");
        el.liveField.style.transform = "translate3d(0, 0, 0) scale(1)";
        el.liveCastLane.style.setProperty("--live-cam-x", "0px");
        el.liveCastLane.style.setProperty("--live-cam-y", "0px");
      }

      function triggerLiveCinematicFx(now) {
        state.liveCamKickUntil = Math.max(state.liveCamKickUntil, now + 280);
        state.liveCamDriftUntil = Math.max(state.liveCamDriftUntil, now + 820);
        state.liveCamSeed = Math.random() * Math.PI * 2;
      }

      function updateLiveCinematicFx(now) {
        const kickDur = 280;
        const driftDur = 820;
        const kickLeft = Math.max(0, state.liveCamKickUntil - now);
        const driftLeft = Math.max(0, state.liveCamDriftUntil - now);
        const kickT = kickLeft > 0 ? kickLeft / kickDur : 0;
        const driftT = driftLeft > 0 ? driftLeft / driftDur : 0;
        const kickPulse = kickT > 0 ? Math.sin((1 - kickT) * Math.PI) * 15 * kickT : 0;
        const phase = now / 84 + state.liveCamSeed;
        const driftAmp = 7 * driftT;
        const camX = kickPulse + Math.sin(phase * 1.8) * driftAmp;
        const camY = -Math.abs(kickPulse) * 0.18 + Math.cos(phase * 1.4) * driftAmp * 0.42;
        const zoom = 1 + 0.018 * Math.max(kickT, driftT);
        const hasMotion = kickT > 0 || driftT > 0;

        el.liveField.style.transform = `translate3d(${camX.toFixed(2)}px, ${camY.toFixed(2)}px, 0) scale(${zoom.toFixed(4)})`;
        el.liveCastLane.style.setProperty("--live-cam-x", `${(-camX * 0.22).toFixed(2)}px`);
        el.liveCastLane.style.setProperty("--live-cam-y", `${(-camY * 0.2).toFixed(2)}px`);
        el.liveField.classList.toggle("fx-speedline", hasMotion);
      }

      function triggerLiveCutin() {
        if (!state.liveRunning) return;
        if (state.liveCutinFinished) return;
        const cuts = state.liveCutins;
        if (!cuts.length) return;
        let cut = null;
        while (state.liveCutinIndex < cuts.length) {
          const candidate = cuts[state.liveCutinIndex];
          state.liveCutinIndex += 1;
          if (candidate.key === "hero") {
            cut = candidate;
            break;
          }
          if (candidate.key === "guitar" && state.memberStatus.guitar === 3) {
            cut = candidate;
            break;
          }
          if (candidate.key === "bass" && state.memberStatus.bass === 3) {
            cut = candidate;
            break;
          }
          if (candidate.key === "drum" && state.memberStatus.drum === 3) {
            cut = candidate;
            break;
          }
        }
        if (!cut) {
          state.liveCutinFinished = true;
          return;
        }
        if (cut.key === "drum" || state.liveCutinIndex >= cuts.length) {
          state.liveCutinFinished = true;
        }
        const src = assets.chara[cut.key] || assets.chara.hero;
        el.liveCutinImg.src = src;
        const bonusText = cut.key === "hero" ? "" : "\nFULL STAR BONUS!";
        el.liveCutinText.textContent = `${cut.text}${bonusText}`;
        el.liveCutin.classList.remove("play");
        void el.liveCutin.offsetWidth;
        el.liveCutin.classList.add("play");
        changeLiveScore(state.liveCutinScoreBonus);
        triggerLiveCinematicFx(performance.now());
      }

      function changeLiveScore(delta) {
        state.liveScore += delta;
        updateLiveHud();
      }

      function changeLiveMood(delta) {
        state.liveMood = Math.max(0, Math.min(100, state.liveMood + delta));
        updateLiveHud();
      }

      function applyLiveJudge(voiceType, action) {
        const isFailure = (voiceType === "neg" && action === "miss") || (voiceType === "pos" && action === "tap");
        const isFever = state.liveFeverActive;
        if (isFailure && isFever && state.liveFeverShield) {
          state.liveFeverShield = false;
          updateLiveFeverUi();
          return;
        }
        if (voiceType === "neg" && action === "tap") {
          changeLiveScore(1 + state.liveScoreBonus);
          changeLiveMood(2);
          state.liveCombo += 1;
        } else if (voiceType === "neg" && action === "miss") {
          changeLiveScore(isFever ? 0 : -1);
          changeLiveMood(isFever ? -2 : -4);
          state.liveCombo = 0;
        } else if (voiceType === "pos" && action === "miss") {
          changeLiveScore(1);
          changeLiveMood(1);
          state.liveCombo += 1;
        } else if (voiceType === "pos" && action === "tap") {
          changeLiveScore(isFever ? 0 : -1);
          changeLiveMood(isFever ? -1 : -2);
          state.liveCombo = 0;
        }
        if (state.liveCombo > 0) {
          state.liveBestCombo = Math.max(state.liveBestCombo, state.liveCombo);
          if (state.liveCombo % 8 === 0) {
            changeLiveMood(1);
          }
        } else {
          state.liveComboMilestoneShown = 0;
        }
        triggerComboMilestone(state.liveCombo);
      }

      function applyLiveStatusEffect() {
        const total = (state.memberStatus.guitar || 0) + (state.memberStatus.bass || 0) + (state.memberStatus.drum || 0);
        const ratio = total / 9;
        state.liveScoreBonus = ratio >= 0.75 ? 1 : 0;
        state.liveNegativeRate = Math.max(0.3, 0.46 - ratio * 0.12);
        state.liveSpeedScale = Math.max(0.8, 1 - ratio * 0.14);

      }

      function spawnVoice() {
        if (!state.liveRunning) return;
        const isNegative = Math.random() < state.liveNegativeRate;
        const msgList = isNegative ? state.liveNegativeTexts : state.livePositiveTexts;
        const text = msgList[Math.floor(Math.random() * msgList.length)];
        const node = document.createElement("button");
        node.type = "button";
        node.className = `voice ${isNegative ? "neg" : "pos"}`;
        node.textContent = text;

        const fieldH = el.liveField.clientHeight || 220;
        const fieldW = el.liveField.clientWidth || 280;
        const laneH = el.liveCastLane ? (el.liveCastLane.offsetHeight || 92) : 92;
        let x;
        if (state.liveCastActors.length && Math.random() < 0.78) {
          const pick = state.liveCastActors[Math.floor(Math.random() * state.liveCastActors.length)];
          x = pick.x + 12 + (Math.random() * 24 - 12);
        } else {
          x = 8 + Math.random() * Math.max(1, fieldW - 130);
        }
        x = Math.max(8, Math.min(fieldW - 130, x));
        const voice = {
          node,
          type: isNegative ? "neg" : "pos",
          x,
          y: -56,
          driftX: (Math.random() * 2 - 1) * 18,
          speed: (110 + Math.random() * 110) * state.liveSpeedScale,
          hitY: fieldH - laneH - 8
        };

        node.style.left = "0px";
        node.style.top = "0px";
        node.style.setProperty("--vx", `${voice.x}px`);
        node.style.setProperty("--vy", `${voice.y}px`);
        const startDepth = Math.max(0, Math.min(1, voice.y / Math.max(1, fieldH)));
        const startScale = 0.92 + startDepth * 0.2;
        node.style.transform = `translate3d(${voice.x}px, ${voice.y}px, 0) scale(${startScale.toFixed(3)})`;
        node.addEventListener("pointerdown", (e) => {
          e.preventDefault();
          if (!state.liveRunning) return;
          applyLiveJudge(voice.type, "tap");
          state.liveVoices = state.liveVoices.filter((v) => v !== voice);
          playVoiceTapEffect(voice);
        });

        el.liveField.appendChild(node);
        state.liveVoices.push(voice);
      }

      function endLiveGame() {
        state.livePerformanceTier = getLivePerformanceTier(state.liveScore);
        state.liveSuccess = state.livePerformanceTier !== "fail";
        stopLiveGame();
        goScene("result");
      }

      async function prepareLiveTrack(trackKey) {
        const trackMap = {
          track1: { src: "bgm/スター・チェンジ.mp3", rate: 1.0, limitSec: 86 },
          track2: { src: "bgm/黒い幕が上がる夜.mp3", rate: 1.0, limitSec: 89 },
          track3: { src: "bgm/命火のレクイエム.mp3", rate: 1.0, limitSec: 68 }
        };
        const selected = trackMap[trackKey] || trackMap.track1;
        if (el.bgm.getAttribute("src") !== selected.src) {
          el.bgm.src = selected.src;
          el.bgm.load();
        }
        if (!(Number.isFinite(el.bgm.duration) && el.bgm.duration > 0)) {
          await new Promise((resolve) => {
            let done = false;
            const finish = () => {
              if (done) return;
              done = true;
              el.bgm.removeEventListener("loadedmetadata", finish);
              el.bgm.removeEventListener("error", finish);
              resolve();
            };
            el.bgm.addEventListener("loadedmetadata", finish, { once: true });
            el.bgm.addEventListener("error", finish, { once: true });
            setTimeout(finish, 1800);
          });
        }
        const duration = Number.isFinite(el.bgm.duration) && el.bgm.duration > 0 ? el.bgm.duration : 60;
        const cappedDuration = Math.min(duration, selected.limitSec);
        return { ...selected, duration: cappedDuration };
      }

      function liveTick(now) {
        if (!state.liveRunning) return;
        updateLiveCinematicFx(now);
        updateLiveFever(now);
        if (!state.liveLastTick) state.liveLastTick = now;
        const dt = Math.max(0, (now - state.liveLastTick) / 1000);
        state.liveLastTick = now;

        state.liveTimeLeft = Math.max(0, state.liveTimeLeft - dt);
        state.liveElapsed += dt;
        state.liveSpawnAcc += dt;
        state.liveCastJumpAcc += dt;
        if (!state.liveCutinFinished && state.liveElapsed >= state.liveNextCutinAt) {
          triggerLiveCutin();
          state.liveNextCutinAt += 16;
        }
        if (state.liveCastJumpAcc >= 0.7) {
          if (Math.random() < 0.45) triggerRandomCastJump();
          state.liveCastJumpAcc = 0;
        }
        if (state.liveSpawnAcc >= 0.64) {
          while (state.liveSpawnAcc >= 0.64) {
            spawnVoice();
            state.liveSpawnAcc -= 0.64;
          }
        }

        const nextVoices = [];
        const fieldH = el.liveField.clientHeight || 220;
        state.liveVoices.forEach((voice) => {
          voice.x += voice.driftX * dt;
          const feverSpeedFactor = state.liveFeverActive && voice.type === "neg" ? 0.72 : 1;
          voice.y += voice.speed * dt * feverSpeedFactor;
          voice.node.style.setProperty("--vx", `${voice.x}px`);
          voice.node.style.setProperty("--vy", `${voice.y}px`);
          const depth = Math.max(0, Math.min(1, voice.y / Math.max(1, fieldH)));
          const scale = 0.92 + depth * 0.2;
          const tilt = Math.max(-4, Math.min(4, (voice.driftX / 18) * 3.2));
          voice.node.style.transform = `translate3d(${voice.x}px, ${voice.y}px, 0) scale(${scale.toFixed(3)}) rotate(${tilt.toFixed(2)}deg)`;
          const outBottom = voice.y >= fieldH + 20;
          if (outBottom) {
            applyLiveJudge(voice.type, "miss");
            removeVoice(voice);
          } else {
            nextVoices.push(voice);
          }
        });
        state.liveVoices = nextVoices;

        updateLiveHud();

        if (state.liveTimeLeft <= 0) {
          endLiveGame();
          return;
        }
        state.liveLoopId = requestAnimationFrame(liveTick);
      }

      async function startLiveRound() {
        state.liveScore = 0;
        state.liveMood = 50;
        state.liveCombo = 0;
        state.liveBestCombo = 0;
        state.liveSpawnAcc = 0;
        state.liveCastJumpAcc = 0;
        state.liveElapsed = 0;
        state.liveNextCutinAt = 16;
        state.liveLastTick = 0;
        state.liveComboMilestoneShown = 0;
        state.liveCutinIndex = 0;
        state.liveCutinFinished = false;
        state.liveFeverEligible = hasLiveStar3Bonus();
        state.liveFeverAvailable = state.liveFeverEligible;
        state.liveFeverActive = false;
        state.liveFeverEndAt = 0;
        state.liveFeverShield = false;
        setLiveFeverVisual(false);
        state.liveRunning = true;
        resetLiveCinematicFx();
        state.liveMusic = el.liveMusicSelect.value;
        applyLiveStatusEffect();
        el.liveStartBtn.style.display = "none";
        el.liveMusicSelect.disabled = true;
        el.liveNote.textContent = "上から下へ流れる。赤はタップで消す、緑はスルー。下到達で判定。赤タップは少し＋、緑タップはマイナス。";
        clearLiveVoices();
        setupLiveCastLane();
        const selected = await prepareLiveTrack(state.liveMusic);
        if (!state.liveActive) return;
        state.liveDurationSec = Math.max(15, selected.duration);
        state.liveTimeLeft = state.liveDurationSec;
        updateLiveHud();
        el.bgm.loop = false;
        el.bgm.playbackRate = selected.rate;
        el.bgm.currentTime = 0;
        if (state.audioOn) {
          try {
            await el.bgm.play();
          } catch (_err) {
            state.audioOn = false;
            updateAudioToggleLabels();
          }
        } else {
          el.bgm.pause();
        }
        state.liveLoopId = requestAnimationFrame(liveTick);
      }

      function openLiveGame() {
        state.liveActive = true;
        state.liveRunning = false;
        state.liveScore = 0;
        state.liveMood = 50;
        state.liveCombo = 0;
        state.liveBestCombo = 0;
        state.liveTimeLeft = state.liveDurationSec;
        state.liveComboMilestoneShown = 0;
        state.liveCutinIndex = 0;
        state.liveCutinFinished = false;
        state.liveFeverEligible = hasLiveStar3Bonus();
        state.liveFeverAvailable = state.liveFeverEligible;
        state.liveFeverActive = false;
        state.liveFeverEndAt = 0;
        state.liveFeverShield = false;
        setLiveFeverVisual(false);
        clearLiveVoices();
        el.liveStartBtn.style.display = "block";
        el.liveMusicSelect.disabled = false;
        el.liveNote.textContent = "上から下へ流れる。赤はタップで消す、緑は触らず流す。下到達で判定。赤タップは少し＋、緑タップはマイナス。";
        el.liveCutin.classList.remove("play");
        el.liveComboBurst.classList.remove("play");
        el.liveComboBurst.classList.remove("mega");
        resetLiveCinematicFx();
        el.app.classList.add("live-mode");
        el.liveGameLayer.classList.add("active");
        el.textboxAdvance.classList.add("hidden");
        requestAnimationFrame(() => {
          setupLiveCastLane();
          updateLiveHud();
        });
      }

      function stopLiveGame() {
        state.liveActive = false;
        state.liveRunning = false;
        state.liveFeverActive = false;
        state.liveFeverEndAt = 0;
        state.liveFeverShield = false;
        setLiveFeverVisual(false);
        if (state.liveLoopId) {
          cancelAnimationFrame(state.liveLoopId);
          state.liveLoopId = 0;
        }
        el.bgm.loop = true;
        clearLiveVoices();
        el.app.classList.remove("live-mode");
        el.liveGameLayer.classList.remove("active");
        el.textboxAdvance.classList.remove("hidden");
        state.liveCastActors = [];
        el.liveCutin.classList.remove("play");
        el.liveComboBurst.classList.remove("play");
        el.liveComboBurst.classList.remove("mega");
        resetLiveCinematicFx();
        restoreDefaultBgm();
      }



