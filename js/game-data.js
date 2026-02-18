      const assets = {
        bg: {
          classroom: "images/haikei/音楽室.png",
          hallway: "images/haikei/廊下.png",
          stage: "images/haikei/ステージ.png"
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
          bg: "classroom",
          chars: [{ slot: "left", key: "hero" }],
          speaker: "主人公",
          text: "学園祭ライブまで、あと一週間。軽音部を立て直すには、3人の力が必要だ。",
          next: "intro2"
        },
        intro2: {
          bg: "hallway",
          chars: [{ slot: "left", key: "hero" }, { slot: "right", key: "guitar" }],
          speaker: "ギター担当・香",
          text: "最近ずっとソロ練だけ。バンドで鳴らす理由が見つからないの。",
          next: "guitarChaseIntro"
        },
        guitarChaseIntro: {
          bg: "hallway",
          chars: [{ slot: "left", key: "hero" }, { slot: "right", key: "guitar" }],
          speaker: "香",
          text: "今日の私は逃げない。まずは廊下の危険地帯、45秒耐えてみせて。",
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
          next: "introBass"
        },
        introBass: {
          bg: "classroom",
          chars: [{ slot: "left", key: "hero" }, { slot: "right", key: "bass" }],
          speaker: "ベース担当・三つ葉",
          text: "目立つのは苦手。でも、低音で支えるのは嫌いじゃない。",
          next: "pickBass"
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
          next: "pickDrum"
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
          next: "dRetry"
        },
        dRetry: {
          bg: "stage",
          chars: [{ slot: "left", key: "hero" }, { slot: "right", key: "drum" }],
          speaker: "主人公",
          text: "呼吸を整え、もう一度伝える。",
          next: "pickDrum"
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
