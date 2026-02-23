/* File: js/guitar-game.js
   Purpose: Guitar survival minigame logic.
*/

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
    jumpScale: 0.68,
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
    droneSpawnIn: 12,
    drones: [],
    droneFx: [],
    explosions: [],
    healItemIn: 8.5,
    healItems: [],
    maxHp: 20,
    hp: 20,
    invuln: 0,
    hitFlash: 0,
    healFlash: 0,
    screenShake: 0,
    slowMo: 0,
    streak: 0,
    bestStreak: 0,
    nearMiss: 0,
    score: 0,
    finalScore: 0,
    wave: 1,
    waveBanner: "STAGE 1",
    waveBannerAt: 1.8,
    stageFlash: 0,
    shootCooldown: 0,
    shotFlash: 0,
    shotTraceTime: 0,
    shotTraceDur: 0.1,
    shotTraceFromX: 0,
    shotTraceX: 0,
    shotTraceY: 0
  };
}

function getHeroHeight(w) {
  return w.heroStandH - (w.heroStandH - w.heroSlideH) * w.slideBlend;
}

function randRange(min, max) {
  return min + Math.random() * (max - min);
}

function isInHealSafeZone(worldX) {
  const w = state.guitarWorld;
  if (!w || !w.healItems.length) return false;
  // Keep space before/after healing pickup.
  const pad = 220;
  return w.healItems.some((item) => Math.abs(item.x - worldX) < pad);
}

function guitarStartJumpCharge() {
  if (!state.guitarGameRunning || !state.guitarWorld) return;
  state.guitarWorld.jumpChargeHold = true;
}

function guitarReleaseJump() {
  if (!state.guitarGameRunning || !state.guitarWorld) return;
  const w = state.guitarWorld;
  if (!w.jumpChargeHold) return;
  w.jumpChargeHold = false;
  if (w.heroY !== 0) return;
  const ratio = Math.min(1, w.jumpChargeSec / w.jumpChargeMaxSec);
  w.jumpScale = 0.68 + ratio * (1.2 - 0.68);
  w.heroVy = w.jumpV * w.jumpScale;
  w.jumpChargeSec = 0;
}

function guitarSlide(active) {
  if (!state.guitarWorld) return;
  state.guitarWorld.slideHold = !!active;
}

function obstacleRect(obs, groundY) {
  if (obs.kind === "break") {
    return {
      x: obs.x,
      y: groundY - 190,
      w: obs.w,
      h: 190
    };
  }
  if (obs.kind === "high") {
    return {
      x: obs.x,
      y: groundY - 168,
      w: obs.w,
      h: 130
    };
  }
  return {
    x: obs.x,
    y: groundY - obs.h,
    w: obs.w,
    h: obs.h
  };
}

function obstacleHitRect(obs, groundY) {
  const rect = obstacleRect(obs, groundY);
  if (obs.kind === "break") {
    return {
      x: rect.x + 3,
      y: rect.y + 2,
      w: rect.w - 6,
      h: rect.h - 4
    };
  }
  if (obs.kind === "high") {
    // Tighter hitbox around vertical guitar body/neck only.
    return {
      x: rect.x + rect.w * 0.34,
      y: rect.y + 8,
      w: rect.w * 0.34,
      h: rect.h - 16
    };
  }
  return rect;
}

function rankLabel(rank) {
  return rank === 3 ? "S" : rank === 2 ? "A" : "B";
}

function liveRankNow(_timeSec, hp) {
  if (hp >= 7) return 3;
  if (hp >= 4) return 2;
  return 1;
}

function guitarRankByScore(score) {
  if (score >= 30000) return 3;
  if (score >= 20000) return 2;
  return 1;
}

function jumpGaugePercent(w) {
  const min = 0.68;
  const max = 1.2;
  const t = (w.jumpScale - min) / (max - min);
  return Math.round(Math.max(0, Math.min(1, t)) * 100);
}

function drawGuitarBriefPreview() {
  if (!el.guitarBriefPreview) return;
  const ctx = el.guitarBriefPreview.getContext("2d");
  if (!ctx) return;
  const width = el.guitarBriefPreview.width;
  const height = el.guitarBriefPreview.height;
  const groundY = height - 20;

  ctx.clearRect(0, 0, width, height);
  const sky = ctx.createLinearGradient(0, 0, 0, groundY);
  sky.addColorStop(0, "#0c2231");
  sky.addColorStop(1, "#1e3e2c");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, groundY);
  ctx.fillStyle = "#0d1118";
  ctx.fillRect(0, groundY, width, height - groundY);

  // Low obstacle (amp)
  const lowX = 66;
  const lowY = groundY - 36;
  const lowW = 36;
  const lowH = 36;
  ctx.fillStyle = "#151515";
  ctx.fillRect(lowX, lowY, lowW, lowH);
  ctx.fillStyle = "#2a2a2a";
  ctx.fillRect(lowX + 2, lowY + 2, lowW - 4, lowH - 4);
  ctx.fillStyle = "#3b3b3b";
  ctx.fillRect(lowX + 4, lowY + 4, lowW - 8, lowH - 8);
  ctx.fillStyle = "#2d86ff";
  ctx.fillRect(lowX + 6, lowY + 6, lowW - 12, 7);

  // High obstacle (vertical guitar silhouette)
  const highX = 204;
  const highY = groundY - 98;
  const highW = 28;
  const highH = 94;
  const gx = highX + highW * 0.5;
  ctx.fillStyle = "#0f1119";
  ctx.beginPath();
  ctx.ellipse(gx, highY + highH - 13, 14, 13, 0, 0, Math.PI * 2);
  ctx.ellipse(gx, highY + highH - 34, 11, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(gx - 4, highY, 8, highH - 36);
  ctx.fillStyle = "#d3ecff";
  ctx.fillRect(gx - 2, highY + 2, 4, highH - 42);
  ctx.fillStyle = "#3ea3ff";
  ctx.fillRect(gx - 12, highY + highH - 40, 24, 5);

  // Break obstacle (barricade)
  const breakX = 336;
  const breakY = groundY - 84;
  const breakW = 40;
  const breakH = 84;
  ctx.fillStyle = "#131018";
  ctx.fillRect(breakX, breakY, breakW, breakH);
  ctx.fillStyle = "#3e2f56";
  ctx.fillRect(breakX + 2, breakY + 2, breakW - 4, breakH - 4);
  ctx.fillStyle = "#ff7ea9";
  for (let y = breakY + 8; y < breakY + breakH - 6; y += 12) {
    ctx.fillRect(breakX + 5, y, breakW - 10, 3);
  }
  ctx.fillStyle = "#0f0b16";
  ctx.fillRect(breakX + 4, breakY - 8, breakW - 8, 6);
  ctx.fillStyle = "#ff9bc0";
  ctx.fillRect(breakX + 4, breakY - 8, breakW - 8, 6);

  // Drone + warning
  const dx = 510;
  const dy = groundY - 56;
  ctx.fillStyle = "#1b1f2c";
  ctx.beginPath();
  ctx.ellipse(dx, dy, 18, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#7dd6ff";
  ctx.fillRect(dx - 8, dy - 2, 16, 4);
  ctx.fillStyle = "#aaf2c8";
  ctx.fillRect(dx - 4, dy + 4, 8, 3);
  ctx.fillStyle = "#101726";
  ctx.fillRect(dx - 34, dy - 31, 68, 14);
  ctx.strokeStyle = "#8fe8ff";
  ctx.strokeRect(dx - 34, dy - 31, 68, 14);
  ctx.fillStyle = "#8fe8ff";
  ctx.font = "900 10px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ATTACK!", dx, dy - 20);
}

function addGuitarScore(delta) {
  const w = state.guitarWorld;
  if (!w) return;
  w.score += delta;
}

function guitarStageScoreGain() {
  const w = state.guitarWorld;
  if (!w) return 100;
  if (w.wave >= 3) return 300;
  if (w.wave >= 2) return 200;
  return 100;
}

function spawnExplosion(x, y, kind) {
  const w = state.guitarWorld;
  if (!w) return;
  const isBig = kind === "break";
  const count = isBig ? 44 : 26;
  const baseSpeed = isBig ? 280 : 220;
  for (let i = 0; i < count; i += 1) {
    const a = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.35;
    const sp = baseSpeed * (0.55 + Math.random() * 0.85);
    w.explosions.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - (isBig ? 40 : 20),
      life: isBig ? 0.6 : 0.44,
      maxLife: isBig ? 0.6 : 0.44,
      size: isBig ? 4 + Math.random() * 5 : 3 + Math.random() * 3,
      color: isBig
        ? (Math.random() < 0.5 ? "#ff8fb3" : "#9de6ff")
        : (Math.random() < 0.5 ? "#ffe28f" : "#8ff0ff")
    });
  }
  w.explosions.push({
    x,
    y,
    vx: 0,
    vy: 0,
    life: 0.18,
    maxLife: 0.18,
    size: isBig ? 44 : 30,
    color: "#ffffff",
    ring: true
  });
}

function guitarShoot() {
  if (!state.guitarGameRunning || !state.guitarWorld) return;
  const w = state.guitarWorld;
  if (w.shootCooldown > 0) return;
  w.shootCooldown = 0.14;
  w.shotFlash = 0.14;
  const heroMuzzleX = w.heroScreenX + w.heroW + 8;
  const maxShotX = el.guitarCanvas ? el.guitarCanvas.width : 960;
  const shotY = (w.groundY || (360 - 40)) - w.heroStandH - w.heroY + 22;
  w.shotTraceFromX = heroMuzzleX;
  w.shotTraceY = shotY;
  let hitIndex = -1;
  let hitType = "";
  let bestScreenX = Number.POSITIVE_INFINITY;
  for (let i = 0; i < w.obstacles.length; i += 1) {
    const obs = w.obstacles[i];
    if (obs.kind !== "break") continue;
    const r = obstacleRect(obs, 360 - 40);
    const sx = r.x - w.scrollX + w.heroScreenX;
    if (sx < heroMuzzleX || sx > maxShotX) continue;
    if (sx < bestScreenX) {
      bestScreenX = sx;
      hitIndex = i;
      hitType = "break";
    }
  }
  for (let i = 0; i < w.drones.length; i += 1) {
    const d = w.drones[i];
    if (d.phase === "escape") continue;
    if (d.x < heroMuzzleX || d.x > maxShotX) continue;
    // Tight hit check against drone visual size.
    if (Math.abs(d.y - shotY) > 14) continue;
    if (d.x < bestScreenX) {
      bestScreenX = d.x;
      hitIndex = i;
      hitType = "drone";
    }
  }
  if (hitIndex >= 0 && hitType === "break") {
    const target = w.obstacles[hitIndex];
    const r = obstacleRect(target, 360 - 40);
    w.shotTraceX = r.x - w.scrollX + w.heroScreenX + r.w * 0.5;
    target.breakHp = Math.max(0, (target.breakHp ?? 4) - 1);
    if (target.breakHp <= 0) {
      spawnExplosion(w.shotTraceX, r.y + r.h * 0.45, "break");
      w.screenShake = Math.max(w.screenShake, 0.32);
      addGuitarScore(guitarStageScoreGain());
      w.obstacles.splice(hitIndex, 1);
    }
  } else if (hitIndex >= 0 && hitType === "drone") {
    const d = w.drones[hitIndex];
    w.shotTraceX = d.x;
    d.hp = Math.max(0, (d.hp || 1) - 1);
    if (d.hp <= 0) {
      spawnExplosion(d.x, d.y, "drone");
      w.screenShake = Math.max(w.screenShake, 0.26);
      addGuitarScore(guitarStageScoreGain());
      w.drones.splice(hitIndex, 1);
    }
  } else {
    w.shotTraceX = maxShotX;
  }
  w.shotTraceTime = w.shotTraceDur;
}

function drawGuitarGame(ctx, width, height) {
  const w = state.guitarWorld;
  const groundY = height - 40;
  w.groundY = groundY;
  const heroH = getHeroHeight(w);
  const heroTop = groundY - heroH - w.heroY;
  const heroBottom = heroTop + heroH;
  const heroLeft = w.heroScreenX;
  const speedN = Math.max(0, Math.min(1, (w.speed - 240) / 220));
  const runPhase = state.guitarTime * (16 + speedN * 14);
  const runBob = w.heroY === 0 && w.slideBlend < 0.58 ? Math.sin(runPhase) * (1.2 + speedN * 2.4) : 0;
  const heroDrawTop = heroTop + runBob;
  const heroDrawBottom = heroBottom + runBob;
  const shake = w.screenShake > 0 ? (Math.random() - 0.5) * 10 * (w.screenShake / 0.3) : 0;
  const farOffset = -(w.scrollX * 0.22) % width;
  const midOffset = -(w.scrollX * 0.56) % width;
  const laneOffset = -(w.scrollX * 1.6) % 56;

  ctx.save();
  ctx.translate(shake, 0);
  ctx.clearRect(-12, 0, width + 24, height);

  const sky = ctx.createLinearGradient(0, 0, 0, groundY);
  sky.addColorStop(0, "#0c2231");
  sky.addColorStop(0.5, "#163a34");
  sky.addColorStop(1, "#1e3e2c");
  ctx.fillStyle = sky;
  ctx.fillRect(-12, 0, width + 24, groundY);

  // Constant speed lines to amplify motion.
  const speedLineCount = 8 + Math.floor(speedN * 18);
  const speedLineSpan = width + 180;
  ctx.strokeStyle = "#d5f6ff";
  ctx.lineWidth = 1 + speedN * 0.8;
  for (let i = 0; i < speedLineCount; i += 1) {
    const speedLinePhase = i * 93 - w.scrollX * (2.4 + speedN * 2.8);
    const sx = (((speedLinePhase % speedLineSpan) + speedLineSpan) % speedLineSpan) - 90;
    const sy = 28 + ((i * 53 + state.guitarTime * 84) % Math.max(42, groundY - 110));
    const len = 16 + speedN * 40 + (i % 5) * 2;
    ctx.globalAlpha = 0.07 + speedN * 0.16;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + len, sy);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Forest parallax: far tree line
  for (let r = 0; r < 2; r += 1) {
    const baseX = r === 0 ? farOffset : farOffset + width;
    for (let i = -40; i < width + 80; i += 70) {
      const x = baseX + i;
      ctx.fillStyle = "#183126";
      ctx.fillRect(x + 10, groundY - 95, 8, 95);
      ctx.fillStyle = "#2a5a3e";
      ctx.beginPath();
      ctx.moveTo(x - 12, groundY - 86);
      ctx.lineTo(x + 14, groundY - 132);
      ctx.lineTo(x + 40, groundY - 86);
      ctx.closePath();
      ctx.fill();
    }
  }
  // Mid trees for speed feeling
  for (let r = 0; r < 2; r += 1) {
    const baseX = r === 0 ? midOffset : midOffset + width;
    for (let i = -40; i < width + 90; i += 88) {
      const x = baseX + i;
      ctx.fillStyle = "#1f3f2f";
      ctx.fillRect(x + 12, groundY - 122, 10, 122);
      ctx.fillStyle = "#3f7a50";
      ctx.beginPath();
      ctx.moveTo(x - 10, groundY - 112);
      ctx.lineTo(x + 16, groundY - 166);
      ctx.lineTo(x + 42, groundY - 112);
      ctx.closePath();
      ctx.fill();
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
  // Ground flow lines and dust to strengthen run speed impression.
  ctx.fillStyle = "#9cc8da";
  const flowGap = Math.max(18, 44 - speedN * 18);
  for (let i = -80; i < width + 120; i += flowGap) {
    const fx = i + (laneOffset * 1.45) % flowGap;
    const fl = 7 + speedN * 16;
    ctx.globalAlpha = 0.08 + speedN * 0.12;
    ctx.fillRect(fx, groundY + 6 + ((i / flowGap) % 2), fl, 2);
  }
  ctx.globalAlpha = 1;
  if (w.heroY === 0 && w.slideBlend < 0.6) {
    const dustCount = 3 + Math.floor(speedN * 5);
    for (let i = 0; i < dustCount; i += 1) {
      const t = state.guitarTime * (7.5 + speedN * 8.5) + i * 0.58;
      const dx = heroLeft - 8 - ((t * (48 + speedN * 76)) % 128);
      const dy = groundY - 4 - (Math.sin(t * 2.2) * (1.2 + speedN * 1.5));
      const dw = 7 + speedN * 9 + (i % 3);
      ctx.globalAlpha = 0.07 + speedN * 0.13;
      ctx.fillStyle = "#d7f4ff";
      ctx.fillRect(dx, dy, dw, 2 + (i % 2));
    }
    ctx.globalAlpha = 1;
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
    if (obs.kind === "break") {
      // Unavoidable barricade: breakable by shooting only.
      ctx.fillStyle = "#131018";
      ctx.fillRect(sx, rect.y, rect.w, rect.h);
      ctx.fillStyle = "#3e2f56";
      ctx.fillRect(sx + 2, rect.y + 2, rect.w - 4, rect.h - 4);
      ctx.fillStyle = "#ff7ea9";
      for (let y = rect.y + 10; y < rect.y + rect.h - 8; y += 14) {
        ctx.fillRect(sx + 6, y, rect.w - 12, 3);
      }
      const hp = Math.max(0, Math.min(4, obs.breakHp || 4));
      const barY = rect.y - 9;
      ctx.fillStyle = "#0f0b16";
      ctx.fillRect(sx + 4, barY, rect.w - 8, 6);
      ctx.fillStyle = "#ff9bc0";
      ctx.fillRect(sx + 4, barY, ((rect.w - 8) * hp) / 4, 6);
      ctx.strokeStyle = "#ffd6e7";
      ctx.strokeRect(sx + 4, barY, rect.w - 8, 6);
      ctx.strokeStyle = "#ffe3ee";
      ctx.strokeRect(sx + 1, rect.y + 1, rect.w - 2, rect.h - 2);
    } else if (obs.kind === "high") {
      // Floating obstacle: vertical guitar silhouette
      const hitRect = obstacleHitRect(obs, groundY);
      const hx = hitRect.x - w.scrollX + w.heroScreenX;
      const hy = hitRect.y;
      const hw = hitRect.w;
      const hh = hitRect.h;
      const gx = hx + hw * 0.5;
      const bottom = hy + hh;
      const lowerRy = Math.max(12, Math.min(16, hh * 0.2));
      const upperRy = Math.max(10, Math.min(14, hh * 0.16));
      const lowerRx = Math.max(13, Math.min(18, hw * 0.62));
      const upperRx = Math.max(10, Math.min(14, hw * 0.5));

      ctx.fillStyle = "#0f1119";
      ctx.beginPath();
      ctx.ellipse(gx, bottom - lowerRy, lowerRx, lowerRy, 0, 0, Math.PI * 2);
      ctx.ellipse(gx, bottom - lowerRy * 2.35, upperRx, upperRy, 0, 0, Math.PI * 2);
      ctx.fill();

      const neckTop = hy;
      const neckBottom = bottom - lowerRy * 2.9;
      const neckH = Math.max(14, neckBottom - neckTop);
      ctx.fillRect(gx - 4, neckTop, 8, neckH);
      ctx.fillStyle = "#3ea3ff";
      ctx.fillRect(gx - 11, bottom - lowerRy * 2.55, 22, 5);
      ctx.fillStyle = "#d3ecff";
      ctx.fillRect(gx - 2, neckTop + 3, 4, Math.max(8, neckH - 6));
      for (let i = 0; i < 3; i += 1) {
        const sx2 = gx - 4 + i * 4;
        ctx.fillStyle = "#d3ecff";
        ctx.fillRect(sx2, neckTop + 2, 1, Math.max(10, neckH + 24));
      }
    } else {
      // Ground obstacle: guitar amp
      const corner = Math.min(8, Math.floor(rect.h * 0.3));
      ctx.fillStyle = "#151515";
      ctx.fillRect(sx, rect.y, rect.w, rect.h);
      ctx.fillStyle = "#2a2a2a";
      ctx.fillRect(sx + 2, rect.y + 2, rect.w - 4, rect.h - 4);
      ctx.fillStyle = "#3b3b3b";
      ctx.fillRect(sx + 4, rect.y + 4, rect.w - 8, rect.h - 8);
      ctx.strokeStyle = "#5a5a5a";
      for (let gy = rect.y + 7; gy < rect.y + rect.h - 6; gy += 6) {
        ctx.beginPath();
        ctx.moveTo(sx + 6, gy);
        ctx.lineTo(sx + rect.w - 6, gy);
        ctx.stroke();
      }
      ctx.fillStyle = "#2d86ff";
      ctx.fillRect(sx + 5, rect.y + 5, Math.max(8, rect.w - 10), Math.max(6, Math.floor(rect.h * 0.18)));
      ctx.fillStyle = "#cde7ff";
      ctx.fillRect(sx + rect.w - 11, rect.y + 7, 4, 4);
      ctx.fillStyle = "#0f1118";
      ctx.fillRect(sx + 1, rect.y + rect.h - corner, 4, corner - 1);
      ctx.fillRect(sx + rect.w - 5, rect.y + rect.h - corner, 4, corner - 1);
      ctx.strokeStyle = "#cfd6de";
      ctx.strokeRect(sx + 1, rect.y + 1, rect.w - 2, rect.h - 2);
    }
  });

  w.drones.forEach((d) => {
    if (d.x < -40 || d.x > width + 80) return;
    const wobble = Math.sin((state.guitarTime + d.seed) * 8) * 3;
    const x = d.x;
    const y = d.y + (d.phase === "hover" || d.phase === "countdown" || d.phase === "attackDelay" ? wobble : wobble * 0.4);
    ctx.fillStyle = "#1b1f2c";
    ctx.beginPath();
    ctx.ellipse(x, y, 18, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#7dd6ff";
    ctx.fillRect(x - 8, y - 2, 16, 4);
    if (d.phase === "dive") {
      ctx.fillStyle = "#ff8ea8";
      ctx.fillRect(x - 18, y - 1, 36, 2);
    }
    ctx.fillStyle = "#9de6ff";
    ctx.fillRect(x - 14, y - 1, 4, 2);
    ctx.fillRect(x + 10, y - 1, 4, 2);
    ctx.fillStyle = "#aaf2c8";
    ctx.fillRect(x - 4, y + 4, 8, 3);
    const hp = Math.max(0, Math.min(2, d.hp || 2));
    ctx.fillStyle = "#0b0f16";
    ctx.fillRect(x - 12, y - 17, 24, 3);
    ctx.fillStyle = "#8cf3bf";
    ctx.fillRect(x - 12, y - 17, 12 * hp, 3);

    if (d.phase === "countdown") {
      ctx.fillStyle = "#101726";
      ctx.fillRect(x - 34, y - 39, 68, 14);
      ctx.strokeStyle = "#8fe8ff";
      ctx.strokeRect(x - 34, y - 39, 68, 14);
      ctx.fillStyle = "#8fe8ff";
      ctx.font = "900 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("ATTACK!", x, y - 28);

      ctx.fillStyle = "#162233";
      ctx.fillRect(x - 12, y - 24, 24, 16);
      ctx.strokeStyle = "#9de6ff";
      ctx.strokeRect(x - 12, y - 24, 24, 16);
      ctx.fillStyle = "#dff6ff";
      ctx.font = "900 12px sans-serif";
      ctx.fillText(`${Math.max(1, d.countdown || 1)}`, x, y - 12);
    } else if (d.phase === "attackDelay") {
      ctx.fillStyle = "#101726";
      ctx.fillRect(x - 34, y - 39, 68, 14);
      ctx.strokeStyle = "#ff8ea8";
      ctx.strokeRect(x - 34, y - 39, 68, 14);
      ctx.fillStyle = "#ff8ea8";
      ctx.font = "900 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("ATTACK!", x, y - 28);
    }
  });

  w.droneFx.forEach((fx) => {
    const t = Math.max(0, fx.time);
    const a = Math.min(1, t * 2.8);
    ctx.globalAlpha = a;
    ctx.fillStyle = "#111a26";
    ctx.fillRect(fx.x - 48, fx.y - 16, 96, 18);
    ctx.strokeStyle = "#9fe5ff";
    ctx.strokeRect(fx.x - 48, fx.y - 16, 96, 18);
    ctx.fillStyle = "#8fe8ff";
    ctx.font = "900 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ATTACK!", fx.x, fx.y - 3);
    ctx.globalAlpha = 1;
  });

  w.healItems.forEach((item) => {
    const sx = item.x - w.scrollX + w.heroScreenX;
    if (sx < -40 || sx > width + 40) return;
    const pulse = 1 + Math.sin((state.guitarTime + item.seed) * 7) * 0.08;
    const size = item.size * pulse;
    const x = sx - size / 2;
    const y = item.y - size / 2;
    ctx.fillStyle = "#0f2b28";
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = "#79ffd8";
    ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
    ctx.fillStyle = "#08322a";
    ctx.fillRect(sx - 2, item.y - 6, 4, 12);
    ctx.fillRect(sx - 6, item.y - 2, 12, 4);
    ctx.strokeStyle = "#e8fffa";
    ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
  });

  w.explosions.forEach((p) => {
    const a = Math.max(0, p.life / p.maxLife);
    if (p.ring) {
      ctx.globalAlpha = a * 0.9;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      const r = p.size * (1 + (1 - a) * 1.25);
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      return;
    }
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size * 0.5, p.y - p.size * 0.5, p.size, p.size);
    ctx.globalAlpha = 1;
  });

  ctx.fillStyle = "#0e1f2f";
  ctx.fillRect(heroLeft, heroDrawTop, w.heroW, heroH);
  ctx.fillStyle = "#34d7ff";
  ctx.fillRect(heroLeft + 3, heroDrawTop + 3, w.heroW - 6, heroH - 6);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(heroLeft + 11, heroDrawTop + 8, 18, 10);
  ctx.fillStyle = "#f44562";
  ctx.fillRect(heroLeft + w.heroW - 12, heroDrawTop + 12, 8, Math.max(10, heroH - 18));
  ctx.fillStyle = "#0e1f2f";
  if (w.heroY === 0) {
    if (w.slideBlend > 0.58) {
      ctx.fillRect(heroLeft + 6, heroDrawBottom - 5, 14, 5);
      ctx.fillRect(heroLeft + 24, heroDrawBottom - 5, 14, 5);
    } else {
      const stride = Math.sin(runPhase) * (3.2 + speedN * 2.8);
      const footY = groundY - 6 + Math.sin(runPhase * 2) * (0.6 + speedN * 0.8);
      ctx.fillRect(heroLeft + 5 + stride, footY, 11, 6);
      ctx.fillRect(heroLeft + 24 - stride, footY, 11, 6);
    }
  }

  if (w.invuln > 0) {
    ctx.globalAlpha = 0.28 + 0.18 * Math.sin(state.guitarTime * 26);
    ctx.fillStyle = "#ff4e68";
    ctx.fillRect(heroLeft - 4, heroDrawTop - 4, w.heroW + 8, heroH + 8);
    ctx.globalAlpha = 1;
  }
  if (w.healFlash > 0) {
    const a = Math.min(0.48, w.healFlash * 1.8);
    ctx.globalAlpha = a;
    ctx.fillStyle = "#63ff9b";
    ctx.fillRect(heroLeft - 8, heroDrawTop - 8, w.heroW + 16, heroH + 16);
    ctx.globalAlpha = a * 0.9;
    ctx.strokeStyle = "#b8ffd3";
    ctx.lineWidth = 2;
    ctx.strokeRect(heroLeft - 10, heroDrawTop - 10, w.heroW + 20, heroH + 20);
    ctx.globalAlpha = 1;
  }
  if (w.hitFlash > 0) {
    const a = Math.min(0.62, w.hitFlash * 2.1);
    ctx.globalAlpha = a;
    ctx.fillStyle = "#ff3658";
    ctx.fillRect(heroLeft - 8, heroDrawTop - 8, w.heroW + 16, heroH + 16);
    ctx.globalAlpha = a * 0.95;
    ctx.strokeStyle = "#ffb2c0";
    ctx.lineWidth = 2;
    ctx.strokeRect(heroLeft - 10, heroDrawTop - 10, w.heroW + 20, heroH + 20);
    ctx.globalAlpha = 1;
  }

  const progress = Math.min(1, state.guitarTime / state.guitarTimeLimit);
  ctx.fillStyle = "#ffffff24";
  ctx.fillRect(18, 14, width - 36, 8);
  ctx.fillStyle = "#58e0a6";
  ctx.fillRect(18, 14, (width - 36) * progress, 8);
  ctx.strokeStyle = "#ffffff8d";
  ctx.strokeRect(18, 14, width - 36, 8);

  const hpRatio = Math.max(0, Math.min(1, w.hp / w.maxHp));
  const hpBarX = 18;
  const hpBarY = 30;
  const hpBarW = 180;
  const hpBarH = 6;
  ctx.fillStyle = "#ffffff1e";
  ctx.fillRect(hpBarX, hpBarY, hpBarW, hpBarH);
  ctx.fillStyle = "#ff7a8f";
  ctx.fillRect(hpBarX, hpBarY, hpBarW * hpRatio, hpBarH);
  ctx.strokeStyle = "#ffffff8d";
  ctx.strokeRect(hpBarX, hpBarY, hpBarW, hpBarH);
  ctx.fillStyle = "#c9f1ff";
  ctx.font = "800 10px sans-serif";
  ctx.textAlign = "left";
  ctx.strokeStyle = "#001522";
  ctx.lineWidth = 2;
  ctx.strokeText(`HP ${Math.max(0, w.hp)}/${w.maxHp}`, hpBarX + hpBarW + 10, hpBarY + 6);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`HP ${Math.max(0, w.hp)}/${w.maxHp}`, hpBarX + hpBarW + 10, hpBarY + 6);

  const chargeRatio = Math.min(1, w.jumpChargeSec / w.jumpChargeMaxSec);
  ctx.fillStyle = "#ffffff1e";
  ctx.fillRect(18, 44, 180, 6);
  ctx.fillStyle = "#65beff";
  ctx.fillRect(18, 44, 180 * chargeRatio, 6);
  ctx.strokeStyle = "#ffffff8d";
  ctx.strokeRect(18, 44, 180, 6);
  ctx.fillStyle = "#9dd6ff";
  ctx.font = "800 10px sans-serif";
  ctx.textAlign = "left";
  ctx.strokeStyle = "#001522";
  ctx.lineWidth = 2;
  ctx.strokeText("JUMP DRIVE", 18 + 180 + 10, 50);
  ctx.fillText("JUMP DRIVE", 18 + 180 + 10, 50);

  ctx.fillStyle = "#ffe9a8";
  ctx.font = "900 16px sans-serif";
  ctx.textAlign = "right";
  ctx.strokeStyle = "#1a1300";
  ctx.lineWidth = 3;
  ctx.strokeText(`SCORE ${Math.round(w.score)}`, width - 18, 50);
  ctx.fillText(`SCORE ${Math.round(w.score)}`, width - 18, 50);

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

  if (w.stageFlash > 0) {
    const a = Math.min(0.34, w.stageFlash * 0.72);
    ctx.globalAlpha = a;
    ctx.fillStyle = "#77d8ff";
    ctx.fillRect(-12, 0, width + 24, height);
    ctx.globalAlpha = a * 0.65;
    ctx.fillStyle = "#ffffff";
    for (let y = 0; y < height; y += 14) {
      ctx.fillRect(-12, y, width + 24, 2);
    }
    ctx.globalAlpha = 1;
  }

  if (w.shotTraceTime > 0) {
    const alpha = Math.min(1, w.shotTraceTime * 16);
    const travel = Math.max(0.001, w.shotTraceDur);
    const t = 1 - w.shotTraceTime / travel;
    const bx = w.shotTraceFromX + (w.shotTraceX - w.shotTraceFromX) * t;
    const by = w.shotTraceY;
    ctx.globalAlpha = alpha;
    // Projectile: short tracer + solid bullet core.
    ctx.strokeStyle = "#ffd7cf";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(Math.max(w.shotTraceFromX, bx - 16), by);
    ctx.lineTo(bx, by);
    ctx.stroke();
    ctx.fillStyle = "#fff4d8";
    ctx.beginPath();
    ctx.arc(bx, by, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ff6a4f";
    ctx.beginPath();
    ctx.arc(bx, by, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  if (w.shotFlash > 0) {
    const mx = w.heroScreenX + w.heroW + 8;
    const my = heroDrawTop + 22;
    const a = Math.min(1, w.shotFlash * 8);
    ctx.globalAlpha = a;
    ctx.fillStyle = "#ff3b30";
    ctx.beginPath();
    ctx.arc(mx, my, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = a * 0.85;
    ctx.fillStyle = "#ff9a6e";
    ctx.beginPath();
    ctx.arc(mx + 5, my, 4.5, 0, Math.PI * 2);
    ctx.fill();
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
  if (state.guitarTutorialMode) {
    finishGuitarTutorial(cleared);
    return;
  }
  const t = state.guitarTime;
  const w = state.guitarWorld;
  const baseScore = w ? w.score : 0;
  const hpForBonus = Math.max(0, w ? w.hp : 0);
  const scoreMul = 1 + hpForBonus * 0.1;
  const finalScore = Math.round(baseScore * scoreMul);
  if (w) {
    w.finalScore = finalScore;
  }
  const rank = guitarRankByScore(finalScore);
  applyGuitarRank(rank, t);
  state.members.guitar = true;
  updateHud();
  stopGuitarGame();
  if (rank === 3) {
    sceneData.gSuccess.text = "すごいですすごいです！ かっこよかったですっ！ 私、全力でギター弾きます！";
  } else if (rank === 2) {
    sceneData.gSuccess.text = "かっこよかったですよ？ わかりました。ギター弾きます。学園祭ではよろしくお願いします。";
  } else {
    sceneData.gSuccess.text = "あ、えっと。頑張ってくれたんですよね。ありがとうございます。……しょうがないです。ギター弾きます。";
  }
  goScene("gSuccess");
}

function finishGuitarTutorial(_cleared) {
  state.guitarGameRunning = false;
  if (state.guitarWorld) {
    state.guitarWorld.slideHold = false;
    state.guitarWorld.jumpChargeHold = false;
  }
  if (state.guitarLoopId) {
    cancelAnimationFrame(state.guitarLoopId);
    state.guitarLoopId = 0;
  }
  state.guitarTutorialMode = false;
  state.guitarTime = 0;
  state.guitarLastTick = 0;
  resetGuitarWorld();
  if (el.guitarBrief) {
    el.guitarBrief.classList.add("show");
  }
  if (el.guitarTutorialEndBtn) {
    el.guitarTutorialEndBtn.hidden = true;
  }
  const ctx = el.guitarCanvas.getContext("2d");
  drawGuitarGame(ctx, el.guitarCanvas.width, el.guitarCanvas.height);
}

function stopGuitarTutorialByButton() {
  if (!state.guitarGameActive) return;
  if (!state.guitarTutorialMode) return;
  finishGuitarTutorial(false);
}

function skipGuitarGame() {
  if (!state.guitarGameActive) return;
  if (state.guitarTutorialMode) {
    finishGuitarTutorial(false);
    return;
  }
  applyGuitarRank(3, state.guitarTimeLimit);
  state.members.guitar = true;
  updateHud();
  sceneData.gSuccess.text = "Sキーでステージをスキップ。評価は★3として記録した。私も本気で弾く。";
  stopGuitarGame();
  goScene("gSuccess");
}

function spawnObstacle() {
  const w = state.guitarWorld;
  const phase = state.guitarTime < 30 ? 1 : state.guitarTime < 60 ? 2 : 3;
  const kindRoll = Math.random();
  let kind = "low";
  if (phase >= 2 && kindRoll < (phase === 2 ? 0.13 : 0.2)) kind = "break";
  else if (kindRoll < (phase === 1 ? 0.22 : phase === 2 ? 0.34 : 0.42)) kind = "high";
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

  const spawnX = w.scrollX + 900 + Math.random() * 220;
  if (isInHealSafeZone(spawnX)) {
    w.spawnIn = 0.55;
    return;
  }

  const obs = {
    kind,
    x: spawnX,
    w: kind === "break" ? randRange(30, 38) : (kind === "high" ? randRange(76, 102) : lowWidth),
    h: kind === "high" ? 22 : lowHeight,
    breakHp: kind === "break" ? 4 : 0,
    scoredNear: false,
    scoredClear: false
  };
  w.obstacles.push(obs);
  const minGap = phase === 1 ? 1.6 : phase === 2 ? 1.3 : 1.08;
  const maxGap = phase === 1 ? 2.2 : phase === 2 ? 1.8 : 1.46;
  w.spawnIn = minGap + Math.random() * (maxGap - minGap);
}

function spawnHealItem() {
  const w = state.guitarWorld;
  // Full-charge jump apex (roughly) so the pickup sits near max reachable height.
  const maxJumpY = (w.jumpV * 1.2 * (w.jumpV * 1.2)) / (2 * w.gravity);
  const itemY = (360 - 40) - w.heroStandH - maxJumpY + 28;
  const x = w.scrollX + 860 + Math.random() * 220;
  // Remove obstacles around the pickup to guarantee approach/recovery room.
  const safePad = 220;
  w.obstacles = w.obstacles.filter((obs) => Math.abs(obs.x - x) > safePad);
  w.healItems.push({
    x,
    y: itemY,
    size: 24,
    seed: Math.random() * Math.PI * 2
  });
}

function spawnDrone() {
  const w = state.guitarWorld;
  w.drones.push({
    x: (el.guitarCanvas ? el.guitarCanvas.width : 960) + 40,
    y: 90 + Math.random() * 110,
    driftVel: 34 + Math.random() * 26,
    driftDir: Math.random() < 0.5 ? -1 : 1,
    driftSwapIn: 0.24 + Math.random() * 0.55,
    phase: "approach",
    hoverFor: 0,
    countdown: 3,
    countdownTick: 0.36,
    countdownAcc: 0,
    attackDelay: 0.5,
    hp: 2,
    seed: Math.random() * Math.PI * 2
  });
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
  w.healFlash = Math.max(0, w.healFlash - rawDt);
  w.screenShake = Math.max(0, w.screenShake - rawDt);
  w.waveBannerAt = Math.max(0, w.waveBannerAt - rawDt);
  w.stageFlash = Math.max(0, w.stageFlash - rawDt);
  w.shootCooldown = Math.max(0, w.shootCooldown - rawDt);
  w.shotFlash = Math.max(0, w.shotFlash - rawDt);
  w.shotTraceTime = Math.max(0, w.shotTraceTime - rawDt);
  const dt = rawDt * (w.slowMo > 0 ? 0.38 : 1);
  state.guitarTime += dt;

  const phase = state.guitarTime < 30 ? 1 : state.guitarTime < 60 ? 2 : 3;
  if (phase !== w.wave) {
    w.wave = phase;
    w.waveBanner = `STAGE ${phase}`;
    w.waveBannerAt = 2.2;
    w.stageFlash = 0.55;
    w.screenShake = Math.max(w.screenShake, 0.22);
  }

  const speedTarget = 278 + phase * 42 + Math.min(98, state.guitarTime * 1.26);
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

  if (w.jumpChargeHold) {
    w.jumpChargeSec = Math.min(w.jumpChargeMaxSec, w.jumpChargeSec + rawDt);
    const ratio = Math.min(1, w.jumpChargeSec / w.jumpChargeMaxSec);
    w.jumpScale = 0.68 + ratio * (1.2 - 0.68);
  } else {
    w.jumpChargeSec = 0;
    w.jumpScale = 0.68;
  }

  const slideTarget = w.slideHold && w.heroY === 0 ? 1 : 0;
  w.slideBlend += (slideTarget - w.slideBlend) * Math.min(1, dt * 22);

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

  w.healItemIn -= dt;
  if (w.healItemIn <= 0) {
    spawnHealItem();
    w.healItemIn = 9.4 + Math.random() * 4.2;
  }

  w.droneSpawnIn -= dt;
  if (w.droneSpawnIn <= 0) {
    spawnDrone();
    w.droneSpawnIn = phase === 1 ? 14 + Math.random() * 5 : phase === 2 ? 11 + Math.random() * 4 : 9 + Math.random() * 3;
  }

  w.obstacles = w.obstacles.filter((obs) => {
    const rect = obstacleHitRect(obs, groundY);
    const oLeft = rect.x - w.scrollX + w.heroScreenX;
    const oRight = oLeft + rect.w;
    const oTop = rect.y;
    const oBottom = rect.y + rect.h;
    const hit = heroRight > oLeft && heroLeft < oRight && heroBottom > oTop && heroTop < oBottom;
    if (hit && w.invuln <= 0) {
      w.hp -= 1;
      addGuitarScore(-100);
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
      addGuitarScore(guitarStageScoreGain());
      w.streak += 1;
      w.bestStreak = Math.max(w.bestStreak, w.streak);
    }
    return oRight > -120;
  });

  w.drones = w.drones.filter((d) => {
    const targetX = w.heroScreenX + 104;
    const maxJumpY = (w.jumpV * 1.2 * (w.jumpV * 1.2)) / (2 * w.gravity);
    const hoverMinY = groundY - w.heroStandH - maxJumpY + 10;
    const hoverMaxY = groundY - 10;
    if (d.phase === "approach" || d.phase === "hover" || d.phase === "countdown" || d.phase === "attackDelay") {
      d.driftSwapIn -= dt;
      if (d.driftSwapIn <= 0) {
        d.driftSwapIn = 0.24 + Math.random() * 0.6;
        d.driftDir = Math.random() < 0.5 ? -1 : 1;
      }
      d.y += d.driftDir * d.driftVel * dt;
      if (d.y < hoverMinY) {
        d.y = hoverMinY;
        d.driftDir = 1;
      } else if (d.y > hoverMaxY) {
        d.y = hoverMaxY;
        d.driftDir = -1;
      }
    }
    if (d.phase === "approach") {
      d.x += (targetX - d.x) * Math.min(1, dt * 3.2);
      if (Math.abs(d.x - targetX) < 8) {
        d.phase = "hover";
        d.hoverFor = 7 + Math.random() * 1.8;
      }
    } else if (d.phase === "hover") {
      d.hoverFor -= dt;
      d.x += (targetX - d.x) * Math.min(1, dt * 2.4);
      if (d.hoverFor <= 0) {
        d.phase = "countdown";
        d.countdown = 3;
        d.countdownTick = 0.36;
        d.countdownAcc = 0;
      }
    } else if (d.phase === "countdown") {
      d.x += (targetX - d.x) * Math.min(1, dt * 2.1);
      d.countdownAcc += dt;
      if (d.countdownAcc >= d.countdownTick) {
        d.countdownAcc = 0;
        d.countdown -= 1;
        if (d.countdown <= 0) {
          d.phase = "attackDelay";
          d.attackDelay = 0.5;
        }
      }
    } else if (d.phase === "attackDelay") {
      d.x += (targetX - d.x) * Math.min(1, dt * 2.1);
      d.attackDelay -= dt;
      if (d.attackDelay <= 0) {
        d.phase = "dive";
        w.droneFx.push({
          x: d.x,
          y: d.y - 20,
          time: 0.38
        });
      }
    } else if (d.phase === "dive") {
      const diveY = groundY + 8;
      d.x -= 420 * dt;
      d.y += (diveY - d.y) * Math.min(1, dt * 7);
      if (d.x < w.heroScreenX - 60) {
        d.phase = "escape";
      }
    } else {
      d.x -= 300 * dt;
      d.y -= 40 * dt;
    }

    if (d.phase === "dive") {
      const dLeft = d.x - 16;
      const dRight = d.x + 16;
      const dTop = d.y - 9;
      const dBottom = d.y + 9;
      const hit = heroRight > dLeft && heroLeft < dRight && heroBottom > dTop && heroTop < dBottom;
      if (hit && w.invuln <= 0) {
        w.hp -= 1;
        addGuitarScore(-100);
        w.invuln = 0.9;
        w.hitFlash = 0.26;
        w.screenShake = 0.3;
        w.slowMo = 0.08;
        w.streak = 0;
        return false;
      }
    }
    return d.x > -70 && d.y > -60 && d.x < 1040;
  });

  w.droneFx = w.droneFx.filter((fx) => {
    fx.time -= dt;
    fx.y -= dt * 22;
    return fx.time > 0;
  });

  w.explosions = w.explosions.filter((p) => {
    p.life -= dt;
    if (p.ring) return p.life > 0;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.96;
    p.vy = p.vy * 0.96 + 580 * dt;
    return p.life > 0;
  });

  w.healItems = w.healItems.filter((item) => {
    const sx = item.x - w.scrollX + w.heroScreenX;
    const half = item.size / 2;
    const left = sx - half;
    const right = sx + half;
    const top = item.y - half;
    const bottom = item.y + half;
    const hit = heroRight > left && heroLeft < right && heroBottom > top && heroTop < bottom;
    if (hit) {
      w.hp = Math.min(w.maxHp, w.hp + 1);
      w.healFlash = 0.28;
      return false;
    }
    return right > -40;
  });

  const ctx = el.guitarCanvas.getContext("2d");
  drawGuitarGame(ctx, el.guitarCanvas.width, el.guitarCanvas.height);
  el.guitarTimer.textContent = "";
  el.guitarBest.textContent = "";
  el.guitarHint.textContent = "";

  if (w.hp <= 0) {
    endGuitarGame(false);
    return;
  }
  if (!state.guitarTutorialMode && state.guitarTime >= state.guitarTimeLimit) {
    endGuitarGame(true);
    return;
  }
  state.guitarLoopId = requestAnimationFrame(guitarTick);
}

function openGuitarGame() {
  state.guitarGameActive = true;
  state.guitarGameRunning = false;
  state.guitarTutorialMode = false;
  state.guitarTime = 0;
  state.guitarLastTick = 0;
  resetGuitarWorld();
  el.guitarTimer.textContent = "";
  el.guitarBest.textContent = "";
  el.guitarTimer.style.display = "none";
  el.guitarBest.style.display = "none";
  el.guitarHint.style.display = "none";
  el.guitarHint.textContent = "85秒生存でCLEAR / ↑長押しジャンプ / ↓しゃがみ / Zで射撃";
  if (el.guitarBrief) {
    el.guitarBrief.classList.add("show");
  }
  drawGuitarBriefPreview();

  if (el.bgm.getAttribute("src") !== "bgm/スター・チェンジ.mp3") {
    el.bgm.src = "bgm/スター・チェンジ.mp3";
    el.bgm.load();
  }
  el.bgm.loop = true;
  el.bgm.playbackRate = 1;
  el.bgm.currentTime = 0;
  el.bgm.pause();

  if (el.guitarStartBtn) {
    el.guitarStartBtn.style.display = "none";
  }
  if (el.guitarTutorialEndBtn) {
    el.guitarTutorialEndBtn.hidden = true;
  }
  el.app.classList.add("guitar-mode");
  el.guitarGameLayer.classList.add("active");
  el.textboxAdvance.classList.add("hidden");
  const ctx = el.guitarCanvas.getContext("2d");
  drawGuitarGame(ctx, el.guitarCanvas.width, el.guitarCanvas.height);
}

function startGuitarGame(tutorialMode = false) {
  if (!state.guitarGameActive) return;
  if (state.guitarGameRunning) return;
  state.guitarTutorialMode = !!tutorialMode;
  state.guitarGameRunning = true;
  state.guitarTime = 0;
  state.guitarLastTick = 0;
  resetGuitarWorld();
  if (el.bgm.getAttribute("src") !== "bgm/スター・チェンジ.mp3") {
    el.bgm.src = "bgm/スター・チェンジ.mp3";
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
  if (el.guitarBrief) {
    el.guitarBrief.classList.remove("show");
  }
  el.guitarHint.style.display = "none";
  if (el.guitarStartBtn) {
    el.guitarStartBtn.style.display = "none";
  }
  if (el.guitarTutorialEndBtn) {
    el.guitarTutorialEndBtn.hidden = !state.guitarTutorialMode;
  }
  el.guitarHint.textContent = "↑を離してジャンプ / ↓長押しでしゃがみ / Zで射撃";
  state.guitarLoopId = requestAnimationFrame(guitarTick);
}

function startGuitarTutorial() {
  startGuitarGame(true);
}

function stopGuitarGame() {
  state.guitarGameActive = false;
  state.guitarGameRunning = false;
  state.guitarTutorialMode = false;
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
  if (el.guitarBrief) {
    el.guitarBrief.classList.remove("show");
  }
  if (el.guitarTutorialEndBtn) {
    el.guitarTutorialEndBtn.hidden = true;
  }
  el.guitarHint.style.display = "";
  el.textboxAdvance.classList.remove("hidden");
  restoreDefaultBgm();
}







