export type DeterministicModeration = { decision: "reject" | "review"; categories: string[]; confidence: number; short_reason: string };

const hardRejectRules: Array<[RegExp, string]> = [
  [/(去死|弄死你|杀了你|打死你)/u, "threat"],
  [/(傻逼|贱人|废物|脑残|操你)/u, "targeted-abuse"],
  [/(人肉你|曝光你.*(?:地址|电话|身份证)|把你地址发)/u, "privacy-exposure"],
  [/(加群|刷单|代开发票|博彩).{0,20}(微信|QQ|链接)/iu, "spam"],
];

export function deterministicChineseModeration(body: string): DeterministicModeration | null {
  const normalized = body.normalize("NFKC").replace(/\s+/g, "");
  for (const [pattern, category] of hardRejectRules) {
    if (pattern.test(normalized)) return { decision: "reject", categories: [category], confidence: 0.99, short_reason: "触发明确的安全边界" };
  }
  if (/(滚|恶心|闭嘴)/u.test(normalized)) return { decision: "review", categories: ["possible-hostility"], confidence: 0.7, short_reason: "语气可能具有敌意，需要人工确认" };
  return null;
}
