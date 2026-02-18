      function resetGuitarWorld() {
        state.guitarWorld = {
          heroX: 0,
          heroY: 0,
          heroVy: 0,
          heroW: 42,
          heroH: 52,
          heroScreenX: 150,
          heroSpeed: 210,
          thiefX: 460,
          thiefW: 42,
          thiefH: 56,
          thiefSpeed: 176,
          gravity: 1300,
          jumpV: 510,
          obstacleAcc: 0,
          obstacles: [],
          hitLock: 0,
          runPhase: 0
        };
      }

      function guitarJump() {
        if (!state.guitarGameRunning || !state.guitarWorld) return;
        const w = state.guitarWorld;
        if (w.heroY === 0) {
          w.heroVy = w.jumpV;
        }
      }

      function drawGuitarGame(ctx, width, height) {
        const w = state.guitarWorld;
        const groundY = height - 40;
        const stride = Math.sin(w.runPhase || 0);
        const stride2 = Math.sin((w.runPhase || 0) + Math.PI);
        ctx.clearRect(0, 0, width, height);

        const bg = ctx.createLinearGradient(0, 0, 0, groundY);
        bg.addColorStop(0, "#2f0f15");
        bg.addColorStop(0.55, "#1b1b24");
        bg.addColorStop(1, "#121212");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, width, groundY);

        ctx.globalAlpha = 0.18;
        ctx.fillStyle = "#ffd447";
        ctx.fillRect(0, 26, width, 5);
        ctx.globalAlpha = 1;

        ctx.fillStyle = "#0c0c0f";
        ctx.fillRect(0, groundY, width, height - groundY);
        ctx.strokeStyle = "#ffffff22";
        for (let i = 0; i < width; i += 56) {
          ctx.beginPath();
          ctx.moveTo(i, groundY);
          ctx.lineTo(i + 34, height);
          ctx.stroke();
        }

        w.obstacles.forEach((obs) => {
          const sx = obs.x - w.heroX + w.heroScreenX;
          ctx.fillStyle = "#0f0f10";
          ctx.fillRect(sx, groundY - obs.h, obs.w, obs.h);
          ctx.fillStyle = "#cb101e";
          ctx.fillRect(sx + 2, groundY - obs.h + 2, obs.w - 4, obs.h - 4);
          ctx.fillStyle = "#ffe3e6";
          ctx.fillRect(sx + 4, groundY - obs.h + 5, Math.max(2, obs.w - 8), 3);
          ctx.strokeStyle = "#fff";
          ctx.strokeRect(sx + 1, groundY - obs.h + 1, obs.w - 2, obs.h - 2);
        });

        const thiefScreenX = w.thiefX - w.heroX + w.heroScreenX;
        const thiefTop = groundY - w.thiefH;
        const thiefBob = Math.max(0, Math.sin((w.runPhase || 0) * 0.95) * 2);
        ctx.fillStyle = "#121212";
        ctx.fillRect(thiefScreenX, thiefTop - thiefBob, w.thiefW, w.thiefH);
        ctx.fillStyle = "#ffd447";
        ctx.fillRect(thiefScreenX + 4, thiefTop + 6 - thiefBob, w.thiefW - 8, w.thiefH - 12);
        ctx.fillStyle = "#111";
        ctx.fillRect(thiefScreenX + 10, thiefTop + 10 - thiefBob, 22, 14);
        ctx.fillStyle = "#fff";
        ctx.fillRect(thiefScreenX + 8, thiefTop + 2 - thiefBob, 26, 3);
        ctx.fillStyle = "#ff3350";
        ctx.fillRect(thiefScreenX - 18, thiefTop + 9 - thiefBob, 12, 8);
        ctx.fillStyle = "#fff";
        ctx.fillRect(thiefScreenX - 20, thiefTop + 7 - thiefBob, 16, 2);
        ctx.fillStyle = "#111";
        ctx.fillRect(thiefScreenX + 6 + stride * 4, groundY - 6, 10, 6);
        ctx.fillRect(thiefScreenX + 24 + stride2 * 4, groundY - 6, 10, 6);

        const heroBob = w.heroY > 0 ? 0 : Math.max(0, Math.sin((w.runPhase || 0) * 1.2) * 2);
        const heroTop = groundY - w.heroH - w.heroY - heroBob;
        ctx.fillStyle = "#0f1220";
        ctx.fillRect(w.heroScreenX, heroTop, w.heroW, w.heroH);
        ctx.fillStyle = "#37d4ff";
        ctx.fillRect(w.heroScreenX + 3, heroTop + 3, w.heroW - 6, w.heroH - 6);
        ctx.fillStyle = "#fff";
        ctx.fillRect(w.heroScreenX + 10, heroTop + 8, 20, 12);
        ctx.fillStyle = "#ff2940";
        ctx.fillRect(w.heroScreenX + 32, heroTop + 14, 12, 26);
        ctx.fillStyle = "#ffe46b";
        ctx.fillRect(w.heroScreenX + 35, heroTop + 18, 6, 16);
        ctx.fillStyle = "#0f1220";
        ctx.fillRect(w.heroScreenX + 5 + stride * 4, groundY - 6, 10, 6);
        ctx.fillRect(w.heroScreenX + 23 + stride2 * 4, groundY - 6, 10, 6);
        ctx.fillRect(w.heroScreenX - 4, heroTop + 16 + stride * 3, 7, 16);
        ctx.fillRect(w.heroScreenX + w.heroW - 3, heroTop + 16 + stride2 * 3, 7, 16);

        ctx.globalAlpha = 0.32;
        ctx.fillStyle = "#37d4ff";
        ctx.fillRect(w.heroScreenX - 26, heroTop + 14, 22, 7);
        ctx.globalAlpha = 1;
      }

      function endGuitarGame(caught) {
        const t = state.guitarTime;
        let rank = 1;
        if (caught) {
          rank = rankBySeconds(t);
        }
        applyGuitarRank(rank, t);
        state.members.guitar = true;
        updateHud();
        stopGuitarGame();
        if (caught) {
          sceneData.gSuccess.text = `...${t.toFixed(1)}秒で追いついたの！？ その本気、信じる。私も弾く。`;
        } else {
          sceneData.gSuccess.text = "捕まえきれなかったけど、追ってくれた気持ちは伝わった。私も弾く。";
        }
        goScene("gSuccess");
      }

      function guitarTick(now) {
        if (!state.guitarGameRunning || !state.guitarWorld) return;
        if (!state.guitarLastTick) state.guitarLastTick = now;
        const dt = Math.max(0.001, (now - state.guitarLastTick) / 1000);
        state.guitarLastTick = now;
        state.guitarTime += dt;

        const w = state.guitarWorld;
        w.obstacleAcc += dt;
        if (w.obstacleAcc >= 1.45) {
          w.obstacleAcc = 0;
          w.obstacles.push({
            x: w.heroX + 860 + Math.random() * 260,
            w: 18 + Math.random() * 16,
            h: 18 + Math.random() * 22
          });
        }

        if (w.heroY > 0 || w.heroVy > 0) {
          w.heroY += w.heroVy * dt;
          w.heroVy -= w.gravity * dt;
          if (w.heroY < 0) {
            w.heroY = 0;
            w.heroVy = 0;
          }
        }

        const speedScale = w.hitLock > 0 ? 0.45 : 1;
        w.heroX += w.heroSpeed * dt * speedScale;
        w.thiefX += w.thiefSpeed * dt;
        w.hitLock = Math.max(0, w.hitLock - dt);
        w.runPhase += dt * 14 * speedScale;

        const heroTop = 360 - 40 - w.heroH - w.heroY;
        const heroBottom = heroTop + w.heroH;
        const heroLeft = w.heroScreenX;
        const heroRight = heroLeft + w.heroW;

        w.obstacles = w.obstacles.filter((obs) => {
          const sx = obs.x - w.heroX + w.heroScreenX;
          const oLeft = sx;
          const oRight = sx + obs.w;
          const oTop = 360 - 40 - obs.h;
          const oBottom = 360 - 40;
          const hit = heroRight > oLeft && heroLeft < oRight && heroBottom > oTop && heroTop < oBottom;
          if (hit) {
            w.hitLock = 0.35;
            return false;
          }
          return sx > -80;
        });

        const distance = w.thiefX - w.heroX;
        const ctx = el.guitarCanvas.getContext("2d");
        drawGuitarGame(ctx, el.guitarCanvas.width, el.guitarCanvas.height);
        el.guitarTimer.textContent = `TIME: ${state.guitarTime.toFixed(1)}`;
        const liveRank = rankBySeconds(state.guitarTime);
        el.guitarBest.textContent = `RANK NOW: ${liveRank === 3 ? "S" : liveRank === 2 ? "A" : "B"}`;

        if (distance <= 70) {
          endGuitarGame(true);
          return;
        }
        if (state.guitarTime >= state.guitarTimeLimit) {
          endGuitarGame(false);
          return;
        }
        state.guitarLoopId = requestAnimationFrame(guitarTick);
      }

      function openGuitarGame() {
        state.guitarGameActive = true;
        state.guitarGameRunning = false;
        state.guitarTime = 0;
        state.guitarLastTick = 0;
        resetGuitarWorld();
        el.guitarTimer.textContent = "TIME: 0.0";
        el.guitarBest.textContent = "RANK: -";
        el.guitarHint.textContent = "S:16.0秒以内 / A:28.0秒以内 / B:40.0秒以内";
        el.guitarStartBtn.style.display = "block";
        el.app.classList.add("guitar-mode");
        el.guitarGameLayer.classList.add("active");
        el.textboxAdvance.classList.add("hidden");
        const ctx = el.guitarCanvas.getContext("2d");
        drawGuitarGame(ctx, el.guitarCanvas.width, el.guitarCanvas.height);
      }

      function startGuitarGame() {
        if (!state.guitarGameActive) return;
        if (state.guitarGameRunning) return;
        state.guitarGameRunning = true;
        state.guitarTime = 0;
        state.guitarLastTick = 0;
        resetGuitarWorld();
        el.guitarStartBtn.style.display = "none";
        el.guitarHint.textContent = "追跡中... Space / タップでジャンプ / S:16.0 A:28.0 B:40.0";
        state.guitarLoopId = requestAnimationFrame(guitarTick);
      }

      function stopGuitarGame() {
        state.guitarGameActive = false;
        state.guitarGameRunning = false;
        if (state.guitarLoopId) {
          cancelAnimationFrame(state.guitarLoopId);
          state.guitarLoopId = 0;
        }
        el.app.classList.remove("guitar-mode");
        el.guitarGameLayer.classList.remove("active");
        el.textboxAdvance.classList.remove("hidden");
      }
