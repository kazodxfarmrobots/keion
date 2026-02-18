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
        el.guitarStartBtn.addEventListener("click", startGuitarGame);
        el.guitarJumpBtn.addEventListener("pointerdown", (e) => {
          e.preventDefault();
          guitarJump();
        });
        el.guitarCanvas.addEventListener("pointerdown", (e) => {
          e.preventDefault();
          guitarJump();
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
              if (e.key.toLowerCase() === "s") {
                e.preventDefault();
                state.guitarTime = 0;
                endGuitarGame(true);
                return;
              }
              if (e.key === " " || e.key === "ArrowUp") {
                e.preventDefault();
                guitarJump();
              }
              return;
            }
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              advance();
            }
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
