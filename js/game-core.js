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
        liveStartBtn: document.getElementById("liveStartBtn"),
        liveMusicSelect: document.getElementById("liveMusicSelect"),
        liveTimer: document.getElementById("liveTimer"),
        liveFeverStatus: document.getElementById("liveFeverStatus"),
        liveScoreFill: document.getElementById("liveScoreFill"),
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
        guitarTimer: document.getElementById("guitarTimer"),
        guitarBest: document.getElementById("guitarBest"),
        guitarHint: document.getElementById("guitarHint")
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
        liveDurationSec: 18,
        liveTimeLeft: 0,
        liveSuccess: false,
        livePerformanceTier: "fail",
        liveMusic: "track1",
        defaultBgm: "bgm/放課後の太陽光線.mp3",
        liveVoices: [],
        liveSpawnAcc: 0,
        liveLoopId: 0,
        liveLastTick: 0,
        livePositiveTexts: ["かっこいい！", "おしゃれ！", "もっと歌って！", "さいこー！"],
        liveNegativeTexts: ["なにこれ？", "かっこわるい", "だれのパクリ？", "帰ろ帰ろ"],
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
          { key: "hero", text: "主人公: この一曲で、全部つなぐ！" },
          { key: "guitar", text: "香: ギター、もっと前に出す！" },
          { key: "bass", text: "三つ葉: 低音で支える、任せて。" },
          { key: "drum", text: "茉桜: ビートで会場ごと持っていく！" }
        ],
        liveCutinIndex: 0,
        liveCutinFinished: false,
        liveCutinScoreBonus: 1,
        memberStatus: { guitar: 0, bass: 0, drum: 0 },
        recruitMiss: { bass: 0, drum: 0 },
        guitarGameActive: false,
        guitarGameRunning: false,
        guitarLoopId: 0,
        guitarRank: 1,
        guitarTime: 0,
        guitarTimeLimit: 40,
        guitarLastTick: 0,
        guitarWorld: null
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
        return "★".repeat(n) + "☆".repeat(3 - n);
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
        if (sec <= 16) return 3;
        if (sec <= 28) return 2;
        return 1;
      }

