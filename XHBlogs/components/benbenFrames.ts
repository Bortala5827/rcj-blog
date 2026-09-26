// 奔奔真·像素精灵帧数据：24×24 网格，字符→调色板映射
// 设计原则（参考 vscode-pets / Shimeji / 电子鸡）：
//   - 剪影优先：坐姿小狗轮廓一眼可读
//   - 立体感 = 暗部色阶（耳下/腿间/爪缝压暗）+ 提亮（脸颊/爪背）
//   - idle 靠 2-4 帧循环（尾巴两态 + 眨眼）就有生命感
// 字符含义：
//   . 透明   o 描边(深棕)   f 主毛色   l 亮毛   s 暗毛
//   m 口鼻深棕   n 眼/鼻近黑   w 眼中高光   t 舌/腮红粉
export const PALETTE: Record<string, string> = {
  o: "#3A2415",
  f: "#E8A85C",
  l: "#F8DFAE",
  s: "#C07F3C",
  m: "#6B4423",
  n: "#241610",
  w: "#FFF3DC",
  t: "#F28CA0",
};

export const GRID = 24;

// 基础帧：端坐、睁眼（含高光）、嘴微笑、尾巴垂右
export const BASE: string[] = [
  "........................",
  "......oo........oo......",
  ".....offo......offo.....",
  "....offffo....offffo....",
  ".....oooooooooooooo.....",
  "....offffffffffffffo....",
  "...offffffffffffffffo...",
  "..olloffwnffffffwnffollo",
  "..olloffnnffffffnnffollo",
  "..olloffmmmnnnnmmmffollo",
  "..olloffmmmmmmmmmmffollo",
  "..olloffmmmmnnmmmmffollo",
  "..olloffoooooooooooffollo".slice(0, 24),
  "...offffffffffffffffooo.",
  "....offffffffffffffoffo.",
  ".....olflllllllllfloffo.",
  ".....ollfffffffflloo....",
  "......offffffffffo......",
  "......offfssssfffo......",
  "......offfssssfffo......",
  ".....ollllssssllllo.....",
  ".....ollllssssllllo.....",
  ".....oooooooooooooo.....",
  "........................",
  "........................",
];

// 用「整行替换」派生其余帧，避免逐格拼接出错
const withRows = (patch: Record<number, string>): string[] => {
  const rows = [...BASE];
  for (const k of Object.keys(patch)) rows[Number(k)] = patch[Number(k)];
  return rows;
};

// 尾巴上翘：尾团从 R13-16 上移到 R12-15
export const TAIL_UP = withRows({
  12: "..olloffooooooooooffoooo",
  13: "...offffffffffffffffofo.",
  15: ".....olflllllllllflo....",
  16: ".....ollffffffffllo.....",
});

// 眨眼：睁眼行变毛色，只留下一行的闭眼横线
export const BLINK = withRows({
  7: "..olloffffffffffffffollo",
});

// 被摸 A：眯眼 + 张嘴吐舌 + 腮红 + 尾巴上翘
export const HAPPY_A = withRows({
  7: "..olloffffffffffffffollo",
  10: "..oltloffmmmmmmmmmmfftllo".slice(0, 24),
  11: "..olloffmmmttttmmmffollo",
  12: "..olloffooottttooooffollo".slice(0, 24),
  15: ".....olflllllllllflo....",
  16: ".....ollffffffffllo.....",
});

// 被摸 B：同 A 但舌头偏右（舔嘴动感）
export const HAPPY_B = withRows({
  7: "..olloffffffffffffffollo",
  10: "..oltloffmmmmmmmmmmfftllo".slice(0, 24),
  11: "..olloffmmmtttmmmffollo.",
  12: "..olloffooottttooooffollo".slice(0, 24),
  15: ".....olflllllllllflo....",
  16: ".....ollffffffffllo.....",
});

// 思考 A：眼睛上瞟（只留 R7 高光点）+ 尾巴垂下
export const THINK_A = withRows({
  8: "..olloffffffffffffffollo",
});

// 思考 B：闭眼（配合 DOM 冒泡的 ? 号）
export const THINK_B = withRows({
  7: "..olloffffffffffffffollo",
});

export const FRAMES = {
  idleDown: BASE,
  idleUp: TAIL_UP,
  blink: BLINK,
  happyA: HAPPY_A,
  happyB: HAPPY_B,
  thinkA: THINK_A,
  thinkB: THINK_B,
} as const;

export type FrameName = keyof typeof FRAMES;

// 每个状态的动作序列：[帧名, 时长ms]
export const SEQUENCES: Record<"idle" | "happy" | "think", [FrameName, number][]> = {
  idle: [
    ["idleDown", 620],
    ["idleUp", 260],
    ["idleDown", 620],
    ["idleUp", 260],
  ],
  happy: [
    ["happyA", 340],
    ["happyB", 340],
  ],
  think: [
    ["thinkA", 480],
    ["thinkB", 480],
  ],
};
