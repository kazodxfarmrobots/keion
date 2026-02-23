/* File: js/bootstrap.js
   Purpose: App bootstrap and input/event bindings.
*/

function bindEvents() {
  function drumKeyToken(e) {
    const code = e.code || "";
    const key = e.key || "";
    const kc = typeof e.keyCode === "number" ? e.keyCode : -1;
    if (code === "ArrowUp" || key === "ArrowUp" || key === "Up" || kc === 38) return "ArrowUp";
    if (code === "ArrowDown" || key === "ArrowDown" || key === "Down" || kc === 40) return "ArrowDown";
    if (code === "ArrowLeft" || key === "ArrowLeft" || key === "Left" || kc === 37) return "ArrowLeft";
    if (code === "ArrowRight" || key === "ArrowRight" || key === "Right" || kc === 39) return "ArrowRight";
    if (code === "ShiftLeft" || code === "ShiftRight" || key === "Shift" || kc === 16) return "Shift";
    return "";
  }
  window.addEventListener("pointerdown", () => unlockAudio(), { once: true });
  window.addEventListener("keydown", () => unlockAudio(), { once: true });

  el.titleMenu.forEach((btn, i) => {
    btn.addEventListener("mouseenter", () => selectMenu(i));
    btn.addEventListener("click", () => menuAction(btn.dataset.action));
  });

  el.audioToggles.forEach((btn) => {
    if (btn.dataset.action === "audio") return;
    btn.addEventListener("click", () => toggleAudio());
  });
  el.backTitleBtn.addEventListener("click", () => switchScreen("title"));
  el.liveStartBtn.addEventListener("click", startLiveRound);
  el.liveFeverBtn.addEventListener("click", activateLiveFever);
  if (el.guitarStartBtn) {
    el.guitarStartBtn.addEventListener("click", () => startGuitarGame(false));
  }
  if (el.guitarBriefStart) {
    el.guitarBriefStart.addEventListener("click", () => startGuitarGame(false));
  }
  if (el.guitarBriefTutorial) {
    el.guitarBriefTutorial.addEventListener("click", startGuitarTutorial);
  }
  el.guitarJumpBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    guitarStartJumpCharge();
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach((evt) => {
    el.guitarJumpBtn.addEventListener(evt, (e) => {
      e.preventDefault();
      guitarReleaseJump();
    });
  });
  el.guitarSlideBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    guitarSlide(true);
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach((evt) => {
    el.guitarSlideBtn.addEventListener(evt, (e) => {
      e.preventDefault();
      guitarSlide(false);
    });
  });
  el.guitarCanvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    guitarStartJumpCharge();
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach((evt) => {
    el.guitarCanvas.addEventListener(evt, (e) => {
      e.preventDefault();
      guitarReleaseJump();
    });
  });
  el.guitarShootBtn.addEventListener("click", (e) => {
    e.preventDefault();
    guitarShoot();
  });
  if (el.guitarTutorialEndBtn) {
    el.guitarTutorialEndBtn.addEventListener("click", (e) => {
      e.preventDefault();
      stopGuitarTutorialByButton();
    });
  }
  if (el.bassOptions) {
    [...el.bassOptions.querySelectorAll(".bass-option")].forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        answerBassQuiz(Number(btn.dataset.choice));
      });
    });
  }
  if (el.bassQuizCard) {
    el.bassQuizCard.addEventListener("click", (e) => {
      if (!state.bassQuizActive || !state.bassQuizAwaitingNext) return;
      if (e.target && e.target.closest && e.target.closest(".bass-option")) return;
      e.preventDefault();
      proceedBassQuiz();
    });
  }
  if (el.bassBriefStart) {
    el.bassBriefStart.addEventListener("click", startBassQuizRound);
  }
  if (el.drumUpBtn) {
    el.drumUpBtn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      drumSetMove("up", true);
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach((evt) => {
      el.drumUpBtn.addEventListener(evt, (e) => {
        e.preventDefault();
        drumSetMove("up", false);
      });
    });
  }
  if (el.drumDownBtn) {
    el.drumDownBtn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      drumSetMove("down", true);
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach((evt) => {
      el.drumDownBtn.addEventListener(evt, (e) => {
        e.preventDefault();
        drumSetMove("down", false);
      });
    });
  }
  if (el.drumLeftBtn) {
    el.drumLeftBtn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      drumSetMove("left", true);
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach((evt) => {
      el.drumLeftBtn.addEventListener(evt, (e) => {
        e.preventDefault();
        drumSetMove("left", false);
      });
    });
  }
  if (el.drumRightBtn) {
    el.drumRightBtn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      drumSetMove("right", true);
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach((evt) => {
      el.drumRightBtn.addEventListener(evt, (e) => {
        e.preventDefault();
        drumSetMove("right", false);
      });
    });
  }
  if (el.drumCanvas) {
    el.drumCanvas.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (!state.drumGameRunning) startDrumGame();
    });
  }

  el.closeHowto.addEventListener("click", () => showHowto(false));
  el.howtoPanel.addEventListener("click", (e) => {
    if (e.target === el.howtoPanel) showHowto(false);
  });

  el.textboxAdvance.addEventListener("click", advance);
  window.addEventListener("keydown", (e) => {
    if (el.howtoPanel.classList.contains("show") && e.key === "Escape") {
      showHowto(false);
      return;
    }

    if (el.titleScreen.classList.contains("active")) {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        selectMenu(state.menuIndex - 1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        selectMenu(state.menuIndex + 1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const btn = el.titleMenu[state.menuIndex];
        if (btn) menuAction(btn.dataset.action);
      }
    } else if (el.gameScreen.classList.contains("active")) {
      if (state.bassQuizActive) {
        if (e.key === "Enter") {
          e.preventDefault();
          if (!e.repeat) proceedBassQuiz();
          return;
        }
        if (e.key.toLowerCase() === "s") {
          e.preventDefault();
          if (!e.repeat) skipBassQuiz();
          return;
        }
        const n = Number(e.key);
        if (n >= 1 && n <= 4) {
          e.preventDefault();
          if (!e.repeat) answerBassQuiz(n - 1);
          return;
        }
        return;
      }
      if (state.guitarGameActive) {
        if (e.key.toLowerCase() === "s") {
          e.preventDefault();
          if (!e.repeat) skipGuitarGame();
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          return;
        }
        if (!state.guitarGameRunning && e.key === " ") {
          e.preventDefault();
          startGuitarGame();
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          if (!e.repeat) guitarStartJumpCharge();
          return;
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          guitarSlide(true);
          return;
        }
        if (e.key.toLowerCase() === "z") {
          e.preventDefault();
          if (!e.repeat) guitarShoot();
          return;
        }
        return;
      }
      if (state.drumGameActive) {
        if (handleDrumCommsKeydown(e)) {
          e.preventDefault();
          return;
        }
        const drumKey = drumKeyToken(e);
        const isZ = e.code === "KeyZ" || e.key === "z" || e.key === "Z";
        if (e.key.toLowerCase() === "s") {
          e.preventDefault();
          if (!e.repeat) skipDrumGame();
          return;
        }
        if (e.key === "Enter" || e.code === "Enter") {
          e.preventDefault();
          if (!state.drumGameRunning) startDrumGame();
          return;
        }
        if (e.code === "Space" || e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          return;
        }
        if (isZ) {
          e.preventDefault();
          if (!e.repeat) drumUsePowerItem();
          return;
        }
        if (drumKey === "Shift") {
          e.preventDefault();
          if (!e.repeat) drumTryDash();
          return;
        }
        if (drumKey) {
          e.preventDefault();
          drumSetKey(drumKey, true);
          return;
        }
        return;
      }
      if (state.liveActive) {
        if (handleLiveKeyboardMiniKey(e)) {
          e.preventDefault();
          return;
        }
        if (e.key === "Enter" || e.code === "Space" || e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          return;
        }
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        advance();
      }
    }
  });
  window.addEventListener("keyup", (e) => {
    if (state.drumGameActive) {
      const drumKey = drumKeyToken(e);
      if (drumKey && drumKey !== "Shift") {
        e.preventDefault();
        drumSetKey(drumKey, false);
      }
      return;
    }
    if (!state.guitarGameActive) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      guitarSlide(false);
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      guitarReleaseJump();
    }
  });

  window.addEventListener("resize", refreshLiveCastLayout);
}

function preloadImages() {
  Object.values(assets.bg).concat(Object.values(assets.chara)).forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

preloadImages();
bindEvents();
selectMenu(0);
updateAudioToggleLabels();
updateHud();
updateStatusPanel();
setBackground("classroom", { instant: true });




