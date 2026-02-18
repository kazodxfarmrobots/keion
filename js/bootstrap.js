      function bindEvents() {
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
          el.guitarStartBtn.addEventListener("click", startGuitarGame);
        }
        if (el.guitarBriefStart) {
          el.guitarBriefStart.addEventListener("click", startGuitarGame);
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
            if (state.guitarGameActive) {
              if (!state.guitarGameRunning && (e.key === "Enter" || e.key === " ")) {
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
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              advance();
            }
          }
        });
        window.addEventListener("keyup", (e) => {
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

