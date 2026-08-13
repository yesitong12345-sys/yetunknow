import "server-only";

import { z } from "zod";
import { readServerConfig } from "./config";

const ideaSchema = z.object({
  title: z.string().min(1).max(80),
  excerpt: z.string().max(240),
  body: z.string().min(1).max(12000),
  tags: z.array(z.string().min(1).max(24)).max(6),
});

const moderationSchema = z.object({
  decision: z.enum(["approve", "reject", "review"]),
  categories: z.array(z.string()).max(8),
  confidence: z.number().min(0).max(1),
  short_reason: z.string().max(160),
});

export type IdeaSuggestion = z.infer<typeof ideaSchema>;
export type ModerationDecision = z.infer<typeof moderationSchema>;

export class DeepSeekUnavailableError extends Error {}

async function requestJson<T>(schema: z.ZodType<T>, messages: Array<{ role: "system" | "user"; content: string }>) {
  const config = readServerConfig();
  if (!config.DEEPSEEK_API_KEY) throw new DeepSeekUnavailableError("AI 服务尚未配置");

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: config.DEEPSEEK_MODEL,
          messages,
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
        signal: controller.signal,
        cache: "no-store",
      });
      if ((response.status === 429 || response.status >= 500) && attempt === 0) continue;
      if (!response.ok) throw new DeepSeekUnavailableError(`AI 服务暂时不可用（${response.status}）`);
      const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const content = payload.choices?.[0]?.message?.content;
      if (!content) throw new DeepSeekUnavailableError("AI 返回了空结果");
      return schema.parse(JSON.parse(content));
    } catch (error) {
      if (attempt === 0 && (error instanceof TypeError || (error instanceof Error && error.name === "AbortError"))) continue;
      if (error instanceof DeepSeekUnavailableError) throw error;
      throw new DeepSeekUnavailableError("AI 返回格式无效，请稍后重试");
    } finally {
      clearTimeout(timer);
    }
  }
  throw new DeepSeekUnavailableError("AI 服务暂时不可用");
}

export function organizeIdea(rawIdea: string) {
  return requestJson(ideaSchema, [
    { role: "system", content: "你是私人书桌的想法整理员。只整理用户提供的材料，不添加经历、数据或事实。必须输出 JSON：title、excerpt、body、tags。标题表达核心意思，正文保留原意并补足结构。" },
    { role: "user", content: rawIdea.slice(0, 12_000) },
  ]);
}

export function moderateMessage(alias: string, body: string) {
  return requestJson(moderationSchema, [
    { role: "system", content: "你是‘门口的纸片管理员’，语气温和、边界坚定。判断匿名留言。尊重的提问和不同意见可 approve；攻击、羞辱、骚扰、威胁、仇恨、隐私曝光、性侵害内容、操纵和垃圾信息 reject；拿不准或语境不足 review。只输出 JSON：decision、categories、confidence、short_reason。" },
    { role: "user", content: JSON.stringify({ alias: alias.slice(0, 40), body: body.slice(0, 2000) }) },
  ]);
}
