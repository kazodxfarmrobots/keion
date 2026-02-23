/* File: js/game-data.js
   Purpose: Static game assets and scene text data.
*/

const assets = {
  bg: {
    classroom: "images/haikei/音楽室.png",
    hallway: "images/haikei/廊下.png",
    stage: "images/haikei/ステージ.png",
    black: "data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%222%22%20height=%222%22%3E%3Crect%20width=%22100%25%22%20height=%22100%25%22%20fill=%22black%22/%3E%3C/svg%3E"
  },
  chara: {
    hero: "images/human/主人公.png",
    guitar: "images/human/ヒロイン1.png",
    bass: "images/human/ヒロイン2.png",
    drum: "images/human/ヒロイン3.png"
  }
};

const sceneData = {
  intro1: {
    bg: "hallway",
    chars: [{ slot: "left", key: "hero" }],
    speaker: "主人公",
    talker: "left",
    text: "学園祭でライブしたいな。ギター、ベース、ドラムの3人を集めないとなぁ。",
    next: "intro2"
  },
  intro2: {
    bg: "hallway",
    chars: [{ slot: "left", key: "hero" }, { slot: "right", key: "guitar" }],
    speaker: "主人公",
    talker: "left",
    text: "香さん、ギターできるよね？ 俺と一緒にライブしない？",
    next: "intro3"
  },
  intro3: {
    bg: "hallway",
    chars: [{ slot: "left", key: "hero" }, { slot: "right", key: "guitar" }],
    speaker: "香",
    talker: "right",
    text: "ギターは好きですけど、今はパルクールにはまってるんです。",
    next: "intro4"
  },
  intro4: {
    bg: "hallway",
    chars: [{ slot: "left", key: "hero" }, { slot: "right", key: "guitar" }],
    speaker: "香",
    talker: "right",
    text: "そうです。あなたがかっこいいパルクール見せてくれたら、ギター、一緒にやります。",
    next: "guitarChaseIntro"
  },
  guitarChaseIntro: {
    bg: "hallway",
    chars: [{ slot: "left", key: "hero" }, { slot: "right", key: "guitar" }],
    speaker: "主人公",
    talker: "left",
    text: "パルクールかぁ。うん。頑張ってみるから、見ててよ。",
    next: "guitarChaseGame"
  },
  guitarChaseGame: {
    bg: "hallway",
    chars: [{ slot: "left", key: "hero" }],
    speaker: "SURVIVAL SYSTEM",
    text: "2Dサバイバル回避: 障害物をJUMP/SLIDEで避け、45秒生き残れ。HPが0で終了。",
    next: "gSuccess"
  },
  pickGuitar: {
    bg: "hallway",
    chars: [{ slot: "left", key: "hero" }, { slot: "right", key: "guitar" }],
    speaker: "主人公",
    text: "香にどう伝える？",
    choices: [
      { text: "君のギターで、みんなの心拍を上げたい", recruit: "guitar", next: "gSuccess" },
      { text: "とりあえず人数合わせで頼む", next: "gFail" }
    ]
  },
  gFail: {
    bg: "hallway",
    chars: [{ slot: "right", key: "guitar" }],
    speaker: "香",
    text: "それじゃ響かない。今日は帰るね。",
    effect: "shake",
    next: "gRetry"
  },
  gRetry: {
    bg: "hallway",
    chars: [{ slot: "left", key: "hero" }, { slot: "right", key: "guitar" }],
    speaker: "主人公",
    text: "もう一度、言葉を選ぼう。",
    next: "pickGuitar"
  },
  gSuccess: {
    bg: "classroom",
    chars: [{ slot: "right", key: "guitar" }],
    speaker: "香",
    text: "...ありがとう。その覚悟、ちゃんと伝わった。私も本気で弾く。",
    next: "nextDay"
  },
  nextDay: {
    bg: "black",
    chars: [],
    speaker: "Narration",
    text: "翌日",
    holdMs: 2000,
    next: "introBass"
  },
  introBass: {
    bg: "hallway",
    chars: [{ slot: "left", key: "hero" }, { slot: "right", key: "bass" }],
    speaker: "主人公",
    talker: "left",
    text: "三つ葉さん、ベースできたよね。一緒に学園祭で演奏しない？",
    next: "bassQuizIntro"
  },
  bassQuizIntro: {
    bg: "hallway",
    chars: [{ slot: "left", key: "hero" }, { slot: "right", key: "bass" }],
    speaker: "三つ葉",
    talker: "right",
    text: "うーん。確かにベースはできるけどさ、わたし、クイズ王を目指してるんだよね。",
    next: "bassQuizIntro2"
  },
  bassQuizIntro2: {
    bg: "hallway",
    chars: [{ slot: "left", key: "hero" }, { slot: "right", key: "bass" }],
    speaker: "三つ葉",
    talker: "right",
    text: "そうだ、わたしとクイズ勝負しようよ。面白い勝負出来たら、一緒に演奏してあげる。",
    next: "bassQuizGame"
  },
  bassQuizGame: {
    bg: "classroom",
    chars: [{ slot: "left", key: "hero" }],
    speaker: "BASS QUIZ SYSTEM",
    text: "4択クイズを3問。問題は毎回ランダム順で出題され、同じ問題は重複しない。制限時間ゲージは上から1秒ごとに減る。",
    next: "bSuccess"
  },
  pickBass: {
    bg: "classroom",
    chars: [{ slot: "left", key: "hero" }, { slot: "right", key: "bass" }],
    speaker: "主人公",
    text: "三つ葉にかける言葉は？",
    choices: [
      { text: "君のベースがいると、バンドが前に進む", recruit: "bass", next: "bSuccess" },
      { text: "地味だけど、いないと困るし", next: "bFail" }
    ]
  },
  bFail: {
    bg: "classroom",
    chars: [{ slot: "right", key: "bass" }],
    speaker: "三つ葉",
    text: "その言い方は、ちょっと傷つく...。",
    effect: "shake",
    next: "bRetry"
  },
  bRetry: {
    bg: "classroom",
    chars: [{ slot: "left", key: "hero" }, { slot: "right", key: "bass" }],
    speaker: "主人公",
    text: "言い直してみよう。",
    next: "pickBass"
  },
  bSuccess: {
    bg: "hallway",
    chars: [{ slot: "right", key: "bass" }],
    speaker: "三つ葉",
    text: "分かった。学園祭まで、全力で弾く。",
    next: "introDrum"
  },
  introDrum: {
    bg: "stage",
    chars: [{ slot: "left", key: "hero" }, { slot: "right", key: "drum" }],
    speaker: "ドラム担当・茉桜",
    text: "爆音で空気を変えるのが私の仕事。覚悟、ある？",
    next: "drumShootIntro"
  },
  drumShootIntro: {
    bg: "stage",
    chars: [{ slot: "left", key: "hero" }, { slot: "right", key: "drum" }],
    speaker: "茉桜",
    text: "宇宙訓練シミュレーターで実力を見せて。75秒以内に45機撃破できたら、私も行く。",
    next: "drumShootGame"
  },
  drumShootGame: {
    bg: "stage",
    chars: [{ slot: "left", key: "hero" }],
    speaker: "COSMIC BATTLE SYSTEM",
    text: "縦スクロール2Dシューティング: WASD/矢印で8方向移動、Space/Zで射撃。45機撃破でCLEAR。",
    next: "dSuccess"
  },
  pickDrum: {
    bg: "stage",
    chars: [{ slot: "left", key: "hero" }, { slot: "right", key: "drum" }],
    speaker: "主人公",
    text: "茉桜へ最後のひと言。",
    choices: [
      { text: "君のビートで、この学校を揺らそう", recruit: "drum", next: "dSuccess" },
      { text: "静かめに叩いてくれれば十分", next: "dFail" }
    ]
  },
  dFail: {
    bg: "stage",
    chars: [{ slot: "right", key: "drum" }],
    speaker: "茉桜",
    text: "それは私じゃない。やるなら本気で。",
    effect: "shake",
    next: "festivalIntro"
  },
  dRetry: {
    bg: "stage",
    chars: [{ slot: "left", key: "hero" }, { slot: "right", key: "drum" }],
    speaker: "主人公",
    text: "呼吸を整え、もう一度伝える。",
    next: "drumShootIntro"
  },
  dSuccess: {
    bg: "stage",
    chars: [{ slot: "right", key: "drum" }],
    speaker: "茉桜",
    text: "いいね。暴れよう、学園祭で。",
    next: "festivalIntro"
  },
  festivalIntro: {
    bg: "stage",
    chars: [{ slot: "left", key: "hero" }, { slot: "right", key: "guitar" }],
    speaker: "主人公",
    text: "3人がそろった。あとは、鳴らすだけだ。",
    next: "festivalRoll"
  },
  festivalRoll: {
    bg: "stage",
    chars: [{ slot: "left", key: "bass" }, { slot: "right", key: "drum" }],
    speaker: "Narration",
    text: "赤いライト、割れる歓声。最初の一音で、会場はひとつになった。",
    next: "liveGame"
  },
  liveGame: {
    bg: "stage",
    chars: [{ slot: "left", key: "hero" }, { slot: "right", key: "guitar" }],
    speaker: "LIVE SYSTEM",
    text: "演奏ミニゲーム: 先にBGMを選択して開始。声は上から下へ流れる。下到達は緑+・赤-。赤タップは少し+、緑タップは-。",
    next: "result"
  },
  result: {
    bg: "stage",
    chars: [{ slot: "left", key: "hero" }, { slot: "right", key: "guitar" }],
    speaker: "SYSTEM",
    text: "判定へ...",
    next: null
  }
};



