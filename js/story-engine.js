/* File: js/story-engine.js
   Purpose: Story progression, dialogue typing, and scene transitions.
*/

function showChoices(choices) {
  clearChoices();
  state.waitingChoice = true;
  choices.forEach((c) => {
    const b = document.createElement("button");
    b.className = "choice-btn";
    b.textContent = c.text;
    b.addEventListener("click", () => {
      if (c.next === "bFail") state.recruitMiss.bass += 1;
      if (c.next === "dFail") state.recruitMiss.drum += 1;
      if (c.recruit) {
        state.members[c.recruit] = true;
        if (c.recruit === "bass") {
          const rank = state.recruitMiss.bass === 0 ? 3 : state.recruitMiss.bass === 1 ? 2 : 1;
          setMemberStatus("bass", rank);
        }
        if (c.recruit === "drum") {
          const rank = state.recruitMiss.drum === 0 ? 3 : state.recruitMiss.drum === 1 ? 2 : 1;
          setMemberStatus("drum", rank);
        }
        updateHud();
      }
      goScene(c.next);
    });
    el.choices.appendChild(b);
  });
}

function typeText(text, onDone) {
  state.typing = true;
  state.fullText = text;
  state.shownText = "";
  state.typeProgress = 0;
  state.typeLastTime = performance.now();
  state.typeOnDone = onDone || null;
  el.dialog.textContent = "";
  el.nextIndicator.classList.remove("show");

  function tick(now) {
    if (!state.typing) return;
    const dt = now - state.typeLastTime;
    const step = Math.max(1, Math.floor(dt / state.typeSpeed));
    if (step > 0) {
      state.typeLastTime = now;
      state.typeProgress += step;
      if (state.typeProgress >= state.fullText.length) {
        state.typeProgress = state.fullText.length;
      }
      state.shownText = state.fullText.slice(0, state.typeProgress);
      el.dialog.textContent = state.shownText;
    }
    if (state.typeProgress < state.fullText.length) {
      requestAnimationFrame(tick);
    } else {
      state.typing = false;
      el.nextIndicator.classList.add("show");
      const done = state.typeOnDone;
      state.typeOnDone = null;
      if (done) done();
    }
  }

  requestAnimationFrame(tick);
}

function finishTypeNow() {
  if (!state.typing) return false;
  state.typing = false;
  el.dialog.textContent = state.fullText;
  el.nextIndicator.classList.add("show");
  const done = state.typeOnDone;
  state.typeOnDone = null;
  if (done) done();
  return true;
}

function pulseShake() {
  const root = document.getElementById("sceneRoot");
  root.classList.remove("shake");
  void root.offsetWidth;
  root.classList.add("shake");
}

function findTalkingSlot(scene) {
  if (scene.talker === "left" || scene.talker === "right") return scene.talker;
  if (!scene.chars || scene.chars.length === 0) return null;
  if (scene.chars.length === 1) return scene.chars[0].slot;
  const speaker = scene.speaker || "";
  const byName = [
    { key: "hero", words: ["主人公"] },
    { key: "guitar", words: ["香", "ギター"] },
    { key: "bass", words: ["三つ葉", "ベース"] },
    { key: "drum", words: ["茉桜", "ドラム"] }
  ];
  const hit = byName.find((row) => row.words.some((w) => speaker.includes(w)));
  if (!hit) return null;
  const char = scene.chars.find((c) => c.key === hit.key);
  return char ? char.slot : null;
}

function pulseTalkingCharacter(scene) {
  const slot = findTalkingSlot(scene);
  if (!slot) return;
  const node = slot === "left" ? el.charaLeft : el.charaRight;
  if (!node || !node.classList.contains("show")) return;
  node.classList.remove("talk-pop");
  void node.offsetWidth;
  node.classList.add("talk-pop");
}

function getResultScene() {
  if (state.livePerformanceTier === "legend") {
    return {
      bg: "stage",
      chars: [{ slot: "left", key: "hero" }, { slot: "right", key: "drum" }],
      speaker: "SYSTEM",
      text: `LEGEND LIVE: SCORE ${state.liveScore}。150ライン突破、会場全体が大熱狂！`,
      choices: [
        { text: "もう一度プレイする", next: "__restart" },
        { text: "タイトルへ戻る", next: "__title" }
      ]
    };
  }
  if (state.livePerformanceTier === "great") {
    return {
      bg: "stage",
      chars: [{ slot: "left", key: "hero" }, { slot: "right", key: "guitar" }],
      speaker: "SYSTEM",
      text: `GREAT LIVE: SCORE ${state.liveScore}。130ライン突破、ライブは大成功！`,
      choices: [
        { text: "もう一度プレイする", next: "__restart" },
        { text: "タイトルへ戻る", next: "__title" }
      ]
    };
  }
  if (state.livePerformanceTier === "good") {
    return {
      bg: "stage",
      chars: [{ slot: "left", key: "hero" }, { slot: "right", key: "bass" }],
      speaker: "SYSTEM",
      text: `GOOD LIVE: SCORE ${state.liveScore}。110ライン突破、観客はしっかり盛り上がった。`,
      choices: [
        { text: "もう一度プレイする", next: "__restart" },
        { text: "タイトルへ戻る", next: "__title" }
      ]
    };
  }
  if (state.livePerformanceTier === "clear") {
    return {
      bg: "classroom",
      chars: [{ slot: "left", key: "hero" }],
      speaker: "SYSTEM",
      text: `CLEAR: SCORE ${state.liveScore}。90ライン突破、ライブ成功！次はもっと上を目指そう。`,
      choices: [
        { text: "最初からやり直す", next: "__restart" },
        { text: "タイトルへ戻る", next: "__title" }
      ]
    };
  }
  return {
    bg: "classroom",
    chars: [{ slot: "left", key: "hero" }],
    speaker: "SYSTEM",
    text: `MISS: SCORE ${state.liveScore}。90ライン未達。次はリズムと判断を合わせよう。`,
    choices: [
      { text: "最初からやり直す", next: "__restart" },
      { text: "タイトルへ戻る", next: "__title" }
    ]
  };
}

function renderScene(scene) {
  setBackground(scene.bg);
  setCharacters(scene.chars);
  pulseTalkingCharacter(scene);
  el.nameTag.textContent = scene.speaker;
  clearChoices();

  if (scene.effect === "shake") pulseShake();

  typeText(scene.text, () => {
    if (scene.holdMs && scene.next && !scene.choices) {
      const delay = Math.max(0, scene.holdMs | 0);
      state.storyAdvanceLockUntil = performance.now() + delay;
      window.setTimeout(() => {
        if (state.currentScene && sceneData[state.currentScene] === scene && !state.typing && !state.waitingChoice) {
          goScene(scene.next);
        }
      }, delay);
      return;
    }
    if (scene.choices) {
      showChoices(scene.choices.map((choice) => ({
        ...choice,
        next: choice.next
      })));
    }
  });
}

function resolveSpecialNext(next) {
  if (next === "__restart") {
    startGame();
    return true;
  }
  if (next === "__title") {
    switchScreen("title");
    return true;
  }
  return false;
}

function goScene(key) {
  if (resolveSpecialNext(key)) return;
  state.currentScene = key;
  if (key === "guitarChaseGame") {
    const scene = sceneData[key];
    if (!scene) return;
    renderScene(scene);
    openGuitarGame();
    return;
  }
  if (key === "bassQuizGame") {
    const scene = sceneData[key];
    if (!scene) return;
    renderScene(scene);
    openBassQuizGame();
    return;
  }
  if (key === "drumShootGame") {
    const scene = sceneData[key];
    if (!scene) return;
    renderScene(scene);
    openDrumGame();
    return;
  }
  if (key === "liveGame") {
    const scene = sceneData[key];
    if (!scene) return;
    renderScene(scene);
    openLiveGame();
    return;
  }
  if (key === "result") {
    renderScene(getResultScene());
    return;
  }
  const scene = sceneData[key];
  if (!scene) return;
  renderScene(scene);
}

function advance() {
  if (performance.now() < (state.storyAdvanceLockUntil || 0)) return;
  if (state.bassQuizActive) return;
  if (state.guitarGameActive) return;
  if (state.drumGameActive) return;
  if (state.liveActive) return;
  if (finishTypeNow()) return;
  if (state.waitingChoice) return;
  const scene = sceneData[state.currentScene];
  if (!scene) return;
  if (scene.next) {
    state.storyAdvanceLockUntil = performance.now() + 180;
    goScene(scene.next);
  }
}

function switchScreen(mode) {
  const title = mode === "title";
  el.titleScreen.classList.toggle("active", title);
  el.gameScreen.classList.toggle("active", !title);
  if (title) stopBassQuizGame();
  if (title) stopGuitarGame();
  if (title) stopDrumGame();
  if (title) stopLiveGame();
}

function startGame() {
  stopBassQuizGame();
  stopGuitarGame();
  stopDrumGame();
  stopLiveGame();
  restoreDefaultBgm();
  state.members = { guitar: false, bass: false, drum: false };
  state.liveSuccess = false;
  state.livePerformanceTier = "fail";
  state.liveScore = 0;
  state.memberStatus = { guitar: 0, bass: 0, drum: 0 };
  state.recruitMiss = { bass: 0, drum: 0 };
  state.storyAdvanceLockUntil = 0;
  updateHud();
  updateStatusPanel();
  state.currentScene = "intro1";
  switchScreen("game");
  goScene("intro1");
}

function menuAction(action) {
  if (action === "start") {
    startGame();
  } else if (action === "howto") {
    showHowto(true);
  } else if (action === "audio") {
    toggleAudio();
  }
}



