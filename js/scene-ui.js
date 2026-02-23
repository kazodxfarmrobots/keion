/* File: js/scene-ui.js
   Purpose: Scene and background UI helpers.
*/

const BLANK_IMAGE = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

function runWipe() {
  el.wipe.classList.remove("play");
  void el.wipe.offsetWidth;
  el.wipe.classList.add("play");
}

function setBackground(key, opts = {}) {
  const url = assets.bg[key];
  if (!url) return;
  if (state.currentBgKey === key) return;

  if (state.currentBgKey === null || opts.instant) {
    el.bgA.style.backgroundImage = `url('${url}')`;
    el.bgA.style.opacity = "1";
    el.bgB.style.opacity = "0";
    state.useBgA = true;
    state.currentBgKey = key;
    return;
  }

  const front = state.useBgA ? el.bgA : el.bgB;
  const back = state.useBgA ? el.bgB : el.bgA;
  back.style.backgroundImage = `url('${url}')`;
  back.style.opacity = "1";
  front.style.opacity = "0";
  state.useBgA = !state.useBgA;
  runWipe();
  state.currentBgKey = key;
}

function setCharacters(chars = []) {
  const left = chars.find((c) => c.slot === "left");
  const right = chars.find((c) => c.slot === "right");
  const leftSrc = left && assets.chara[left.key];
  const rightSrc = right && assets.chara[right.key];

  if (leftSrc) {
    el.charaLeft.src = leftSrc;
    el.charaLeft.classList.add("show");
  } else {
    el.charaLeft.classList.remove("show");
  }

  if (rightSrc) {
    el.charaRight.src = rightSrc;
    el.charaRight.classList.add("show");
  } else {
    el.charaRight.classList.remove("show");
  }
}

function clearChoices() {
  state.waitingChoice = false;
  el.choices.innerHTML = "";
}



