      function resetGuitarWorld() {
        state.guitarWorld = {
          heroY: 0,
          heroVy: 0,
          heroW: 44,
          heroStandH: 52,
          heroSlideH: 34,
          heroScreenX: 150,
          gravity: 1380,
          jumpV: 540,
          jumpScale: 0.72,
          jumpChargeHold: false,
          jumpChargeSec: 0,
          jumpChargeMaxSec: 0.5,
          slideHold: false,
          slideBlend: 0,
          groundY: 320,
          scrollX: 0,
          speed: 240,
          spawnIn: 1.2,
          obstacles: [],
          hp: 3,
          invuln: 0,
          hitFlash: 0,
          screenShake: 0,
          slowMo: 0,
          streak: 0,
          bestStreak: 0,
          nearMiss: 0,
          wave: 1,
          waveBanner: "WAVE 1",
          waveBannerAt: 1.8
        };
      }

      function getHeroHeight(w) {
        return w.heroStandH - (w.heroStandH - w.heroSlideH) * w.slideBlend;
      }

      function randRange(min, max) {
        return min + Math.random() * (max - min);
      }

      function guitarStartJumpCharge() {
        if (!state.guitarGameRunning || !state.guitarWorld) return;
        const w = state.guitarWorld;
        if (w.heroY !== 0) return;
        w.jumpChargeHold = true;
      }

      function guitarReleaseJump() {
        if (!state.guitarGameRunning || !state.guitarWorld) return;
        const w = state.guitarWorld;
        if (!w.jumpChargeHold) return;
        w.jumpChargeHold = false;
        if (w.heroY !== 0) return;
        const ratio = Math.min(1, w.jumpChargeSec / w.jumpChargeMaxSec);
        w.jumpScale = 0.72 + ratio * (1.42 - 0.72);
        w.heroVy = w.jumpV * w.jumpScale;
        w.jumpChargeSec = 0;
      }

      function guitarSlide(active) {
        if (!state.guitarWorld) return;
        state.guitarWorld.slideHold = !!active;
      }

      function obstacleRect(obs, groundY) {
        if (obs.kind === "high") {
          return {
            x: obs.x,
            y: groundY - 74,
            w: obs.w,
            h: 22
          };
        }
        return {
          x: obs.x,
          y: groundY - obs.h,
          w: obs.w,
          h: obs.h
        };
      }

      function rankLabel(rank) {
        return rank === 3 ? "S" : rank === 2 ? "A" : "B";
      }

      function liveRankNow(timeSec, hp) {
        if (timeSec >= 34 && hp >= 2) return 3;
        if (timeSec >= 22 && hp >= 1) return 2;
        return 1;
      }

      function drawGuitarGame(ctx, width, height) {
        const w = state.guitarWorld;
        const groundY = height - 40;
        w.groundY = groundY;
        const heroH = getHeroHeight(w);
        const heroTop = groundY - heroH - w.heroY;
        const heroBottom = heroTop + heroH;
        const heroLeft = w.heroScreenX;
        const shake = w.screenShake > 0 ? (Math.random() - 0.5) * 10 * (w.screenShake / 0.3) : 0;
        const farOffset = -(w.scrollX * 0.18) % width;
        const midOffset = -(w.scrollX * 0.45) % width;
        const laneOffset = -(w.scrollX * 1.35) % 56;

        ctx.save();
        ctx.translate(shake, 0);
        ctx.clearRect(-12, 0, width + 24, height);

        const sky = ctx.createLinearGradient(0, 0, 0, groundY);
        sky.addColorStop(0, "#140f1f");
        sky.addColorStop(0.5, "#172839");
        sky.addColorStop(1, "#131922");
        ctx.fillStyle = sky;
        ctx.fillRect(-12, 0, width + 24, groundY);

        for (let r = 0; r < 2; r += 1) {
          ctx.globalAlpha = 0.2;
          ctx.fillStyle = "#7de3ff";
          const baseX = r === 0 ? farOffset : farOffset + width;
          for (let i = 0; i < width; i += 120) {
            ctx.fillRect(baseX + i, 42, 36, 2);
          }
        }
        for (let r = 0; r < 2; r += 1) {
          ctx.globalAlpha = 0.14;
          ctx.fillStyle = "#ffd25d";
          const baseX = r === 0 ? midOffset : midOffset + width;
          for (let i = 0; i < width; i += 82) {
            ctx.fillRect(baseX + i, 74, 20, 2);
            ctx.fillRect(baseX + i + 9, 97, 30, 2);
          }
        }
        ctx.globalAlpha = 1;

        ctx.fillStyle = "#0d1118";
        ctx.fillRect(-12, groundY, width + 24, height - groundY);
        ctx.strokeStyle = "#ffffff1f";
        for (let i = -56; i < width + 56; i += 56) {
          const x = i + laneOffset;
          ctx.beginPath();
          ctx.moveTo(x, groundY);
          ctx.lineTo(x + 34, height);
          ctx.stroke();
        }

        const warnDist = Math.max(120, w.speed * 0.6);
        w.obstacles.forEach((obs) => {
          const rect = obstacleRect(obs, groundY);
          const sx = rect.x - w.scrollX + w.heroScreenX;
          if (sx > width && sx < width + warnDist) {
            const t = 1 - (sx - width) / warnDist;
            const warnY = groundY - 11;
            ctx.globalAlpha = 0.28 + t * 0.55;
            ctx.fillStyle = obs.kind === "high" ? "#6ec6ff" : "#ff5f67";
            ctx.beginPath();
            ctx.moveTo(width - 14, warnY);
            ctx.lineTo(width - 40, warnY - 10);
            ctx.lineTo(width - 40, warnY + 10);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        });

        w.obstacles.forEach((obs) => {
          const rect = obstacleRect(obs, groundY);
          const sx = rect.x - w.scrollX + w.heroScreenX;
          if (sx < -120 || sx > width + 130) return;
          if (obs.kind === "high") {
            ctx.fillStyle = "#0f1721";
            ctx.fillRect(sx, rect.y, rect.w, rect.h);
            ctx.fillStyle = "#89d6ff";
            ctx.fillRect(sx + 3, rect.y + 3, rect.w - 6, rect.h - 6);
            ctx.fillStyle = "#dbf3ff";
            ctx.fillRect(sx + 8, rect.y + 7, Math.max(14, rect.w - 16), 3);
          } else {
            ctx.fillStyle = "#120e13";
            ctx.fillRect(sx, rect.y, rect.w, rect.h);
            ctx.fillStyle = "#ff4c5e";
            ctx.fillRect(sx + 2, rect.y + 2, rect.w - 4, rect.h - 4);
            ctx.fillStyle = "#ffe5e7";
            ctx.fillRect(sx + 5, rect.y + 5, Math.max(6, rect.w - 10), 3);
          }
          ctx.strokeStyle = "#ffffffcc";
          ctx.strokeRect(sx + 1, rect.y + 1, rect.w - 2, rect.h - 2);
        });

        ctx.fillStyle = "#0e1f2f";
        ctx.fillRect(heroLeft, heroTop, w.heroW, heroH);
        ctx.fillStyle = "#34d7ff";
        ctx.fillRect(heroLeft + 3, heroTop + 3, w.heroW - 6, heroH - 6);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(heroLeft + 11, heroTop + 8, 18, 10);
        ctx.fillStyle = "#f44562";
        ctx.fillRect(heroLeft + w.heroW - 12, heroTop + 12, 8, Math.max(10, heroH - 18));
        ctx.fillStyle = "#0e1f2f";
        if (w.heroY === 0) {
          if (w.slideBlend > 0.58) {
            ctx.fillRect(heroLeft + 6, heroBottom - 5, 14, 5);
            ctx.fillRect(heroLeft + 24, heroBottom - 5, 14, 5);
          } else {
            const stride = Math.sin(state.guitarTime * 18);
            ctx.fillRect(heroLeft + 5 + stride * 3, groundY - 6, 11, 6);
            ctx.fillRect(heroLeft + 24 - stride * 3, groundY - 6, 11, 6);
          }
        }

        if (w.invuln > 0) {
          ctx.globalAlpha = 0.28 + 0.18 * Math.sin(state.guitarTime * 26);
          ctx.fillStyle = "#6bd8ff";
          ctx.fillRect(heroLeft - 4, heroTop - 4, w.heroW + 8, heroH + 8);
          ctx.globalAlpha = 1;
        }

        const progress = Math.min(1, state.guitarTime / state.guitarTimeLimit);
        ctx.fillStyle = "#ffffff24";
        ctx.fillRect(18, 14, width - 36, 8);
        ctx.fillStyle = "#58e0a6";
        ctx.fillRect(18, 14, (width - 36) * progress, 8);
        ctx.strokeStyle = "#ffffff8d";
        ctx.strokeRect(18, 14, width - 36, 8);

        const chargeRatio = Math.min(1, w.jumpChargeSec / w.jumpChargeMaxSec);
        ctx.fillStyle = "#ffffff1e";
        ctx.fillRect(18, 28, 180, 6);
        ctx.fillStyle = "#65beff";
        ctx.fillRect(18, 28, 180 * chargeRatio, 6);
        ctx.strokeStyle = "#ffffff8d";
        ctx.strokeRect(18, 28, 180, 6);

        if (w.waveBannerAt > 0) {
          const alpha = Math.min(1, w.waveBannerAt * 1.2);
          ctx.globalAlpha = alpha;
          ctx.fillStyle = "#0a0a0ad4";
          ctx.fillRect(width * 0.5 - 130, 36, 260, 42);
          ctx.strokeStyle = "#ffffffcc";
          ctx.strokeRect(width * 0.5 - 130, 36, 260, 42);
          ctx.fillStyle = "#ffde6b";
          ctx.font = "900 26px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(w.waveBanner, width * 0.5, 66);
          ctx.globalAlpha = 1;
        }

        if (w.hitFlash > 0) {
          ctx.globalAlpha = Math.min(0.32, w.hitFlash * 1.4);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(-12, 0, width + 24, height);
          ctx.globalAlpha = 1;
        }
        ctx.restore();

        const pulse = Math.max(0, w.streak - 5);
        ctx.save();
        ctx.globalAlpha = Math.min(0.32, pulse * 0.025);
        ctx.fillStyle = "#73ffc8";
        ctx.fillRect(0, height - 74, width, 22);
        ctx.restore();
      }

      function endGuitarGame(cleared) {
        const t = state.guitarTime;
        const w = state.guitarWorld;
        const rank = cleared ? liveRankNow(t, w ? w.hp : 1) : 1;
        applyGuitarRank(rank, t);
        state.members.guitar = true;
        updateHud();
        stopGuitarGame();
        if (cleared) {
          sceneData.gSuccess.text = `...${t.toFixed(1)}秒生き残ったの！？ その度胸、信じられる。私も本気で弾く。`;
        } else {
          sceneData.gSuccess.text = "最後まで生き残れなかったけど、守ろうとしてくれたのは伝わった。私も弾く。";
        }
        goScene("gSuccess");
      }

      function spawnObstacle() {
        const w = state.guitarWorld;
        const phase = state.guitarTime < 15 ? 1 : state.guitarTime < 30 ? 2 : 3;
        const kindRoll = Math.random();
        let kind = kindRoll < (phase === 1 ? 0.22 : phase === 2 ? 0.34 : 0.42) ? "high" : "low";
        if (phase === 1 && w.obstacles.length > 0 && w.obstacles[w.obstacles.length - 1].kind === "high") {
          kind = "low";
        }

        let lowHeight = 32;
        let lowWidth = 30;
        if (kind === "low") {
          if (phase === 1) {
            lowHeight = randRange(22, 44);
            lowWidth = randRange(22, 36);
          } else if (phase === 2) {
            const tall = Math.random() < 0.33;
            lowHeight = tall ? randRange(56, 72) : randRange(28, 52);
            lowWidth = tall ? randRange(18, 26) : randRange(24, 38);
          } else {
            const tall = Math.random() < 0.58;
            lowHeight = tall ? randRange(68, 92) : randRange(34, 58);
            lowWidth = tall ? randRange(16, 24) : randRange(24, 36);
          }
        }

        const obs = {
          kind,
          x: w.scrollX + 900 + Math.random() * 220,
          w: kind === "high" ? randRange(76, 102) : lowWidth,
          h: kind === "high" ? 22 : lowHeight,
          scoredNear: false,
          scoredClear: false
        };
        w.obstacles.push(obs);
        const minGap = phase === 1 ? 1.06 : phase === 2 ? 0.8 : 0.64;
        const maxGap = phase === 1 ? 1.4 : phase === 2 ? 1.08 : 0.9;
        w.spawnIn = minGap + Math.random() * (maxGap - minGap);
      }

      function guitarTick(now) {
        if (!state.guitarGameRunning || !state.guitarWorld) return;
        if (!state.guitarLastTick) state.guitarLastTick = now;
        const rawDt = Math.max(0.001, (now - state.guitarLastTick) / 1000);
        state.guitarLastTick = now;
        const w = state.guitarWorld;

        w.slowMo = Math.max(0, w.slowMo - rawDt);
        w.invuln = Math.max(0, w.invuln - rawDt);
        w.hitFlash = Math.max(0, w.hitFlash - rawDt);
        w.screenShake = Math.max(0, w.screenShake - rawDt);
        w.waveBannerAt = Math.max(0, w.waveBannerAt - rawDt);
        const dt = rawDt * (w.slowMo > 0 ? 0.38 : 1);
        state.guitarTime += dt;

        const phase = state.guitarTime < 15 ? 1 : state.guitarTime < 30 ? 2 : 3;
        if (phase !== w.wave) {
          w.wave = phase;
          w.waveBanner = `WAVE ${phase}`;
          w.waveBannerAt = 1.6;
        }

        const speedTarget = 236 + phase * 34 + Math.min(72, state.guitarTime * 1.08);
        w.speed += (speedTarget - w.speed) * Math.min(1, dt * 2);
        w.scrollX += w.speed * dt;

        if (w.heroY > 0 || w.heroVy > 0) {
          w.heroY += w.heroVy * dt;
          w.heroVy -= w.gravity * dt;
          if (w.heroY < 0) {
            w.heroY = 0;
            w.heroVy = 0;
          }
        }

        if (w.heroY !== 0) {
          w.jumpChargeHold = false;
          w.jumpChargeSec = 0;
          w.jumpScale = 0.72;
        } else if (w.jumpChargeHold) {
          w.jumpChargeSec = Math.min(w.jumpChargeMaxSec, w.jumpChargeSec + rawDt);
          const ratio = Math.min(1, w.jumpChargeSec / w.jumpChargeMaxSec);
          w.jumpScale = 0.72 + ratio * (1.42 - 0.72);
        } else {
          w.jumpChargeSec = 0;
          w.jumpScale = 0.72;
        }

        const slideTarget = w.slideHold && w.heroY === 0 ? 1 : 0;
        w.slideBlend += (slideTarget - w.slideBlend) * Math.min(1, dt * 14);

        w.spawnIn -= dt;
        if (w.spawnIn <= 0) {
          spawnObstacle();
        }

        const groundY = 360 - 40;
        const heroH = getHeroHeight(w);
        const heroTop = groundY - heroH - w.heroY;
        const heroBottom = heroTop + heroH;
        const heroLeft = w.heroScreenX;
        const heroRight = heroLeft + w.heroW;

        w.obstacles = w.obstacles.filter((obs) => {
          const rect = obstacleRect(obs, groundY);
          const oLeft = rect.x - w.scrollX + w.heroScreenX;
          const oRight = oLeft + rect.w;
          const oTop = rect.y;
          const oBottom = rect.y + rect.h;
          const hit = heroRight > oLeft && heroLeft < oRight && heroBottom > oTop && heroTop < oBottom;
          if (hit && w.invuln <= 0) {
            w.hp -= 1;
            w.invuln = 0.9;
            w.hitFlash = 0.26;
            w.screenShake = 0.3;
            w.slowMo = 0.08;
            w.streak = 0;
            return false;
          }

          if (!obs.scoredClear && oRight < heroLeft) {
            const verticalClear = Math.min(Math.abs(heroBottom - oTop), Math.abs(oBottom - heroTop));
            if (!obs.scoredNear && verticalClear <= 20) {
              obs.scoredNear = true;
              w.nearMiss += 1;
            }
            obs.scoredClear = true;
            w.streak += 1;
            w.bestStreak = Math.max(w.bestStreak, w.streak);
          }
          return oRight > -120;
        });

        const ctx = el.guitarCanvas.getContext("2d");
        drawGuitarGame(ctx, el.guitarCanvas.width, el.guitarCanvas.height);
        const nowRank = liveRankNow(state.guitarTime, w.hp);
        el.guitarTimer.textContent = `TIME: ${state.guitarTime.toFixed(1)} / ${state.guitarTimeLimit.toFixed(0)}`;
        el.guitarBest.textContent = `HP: ${Math.max(0, w.hp)}`;
        el.guitarHint.textContent = `RANK NOW: ${rankLabel(nowRank)} / STREAK x${w.streak} / JUMP ${Math.round(w.jumpScale * 100)}% (long press)`;

        if (w.hp <= 0) {
          endGuitarGame(false);
          return;
        }
        if (state.guitarTime >= state.guitarTimeLimit) {
          endGuitarGame(true);
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
        el.guitarTimer.textContent = `TIME: 0.0 / ${state.guitarTimeLimit.toFixed(0)}`;
        el.guitarBest.textContent = "HP: 3";
        el.guitarHint.textContent = "Survive 45s / Hold JUMP to charge / Down: SLIDE";
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
        el.guitarHint.textContent = "Hold JUMP, release to jump / Down(S) to slide";
        state.guitarLoopId = requestAnimationFrame(guitarTick);
      }

      function stopGuitarGame() {
        state.guitarGameActive = false;
        state.guitarGameRunning = false;
        if (state.guitarWorld) {
          state.guitarWorld.slideHold = false;
          state.guitarWorld.jumpChargeHold = false;
        }
        if (state.guitarLoopId) {
          cancelAnimationFrame(state.guitarLoopId);
          state.guitarLoopId = 0;
        }
        el.app.classList.remove("guitar-mode");
        el.guitarGameLayer.classList.remove("active");
        el.textboxAdvance.classList.remove("hidden");
      }
