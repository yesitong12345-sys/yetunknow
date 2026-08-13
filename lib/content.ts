export type ContentKind = "ideas" | "daily" | "projects";

export type PublicEntry = {
  kind: ContentKind;
  slug: string;
  title: string;
  excerpt: string;
  body: string[];
  date: string;
  deskObjectKey: "note" | "journal" | "toolbox";
  tags: string[];
  example: boolean;
  role?: string;
  process?: string[];
  result?: string;
  link?: string;
};

export const kindMeta: Record<ContentKind, { label: string; singular: string; kicker: string; color: string }> = {
  ideas: { label: "奇思妙想", singular: "灵感便签", kicker: "脑海闪一下，未来改一下！", color: "red" },
  daily: { label: "日常记录", singular: "手账碎片", kicker: "我想说啥就说啥", color: "yellow" },
  projects: { label: "项目作品", singular: "纸板工具盒", kicker: "奇思妙想结果不容易啊！", color: "blue" },
};

export const entries: PublicEntry[] = [
  {
    kind: "ideas", slug: "weather-bookmarks", title: "机器人手可以做出按摩仪", date: "2026-07-26",
    excerpt: "未来居家机器人是常见现象，那么可以做个替换手按摩仪。",
    body: [ "这个想法源自于8月9号去老街，体验家用电器时。"],
    deskObjectKey: "note", tags: [], example: true,
  },
  {
    kind: "ideas", slug: "tiny-museum", title: "vebCoding", date: "2026-07-18",
    excerpt: "究竟是夯还是拉。",
    body: ["1.立体几何一键生成3D模型2.自配鸿蒙系统的手机桌面宠物3.记录规划，并且适当的安抚的喵self-pro版。"],
    deskObjectKey: "note", tags: ["示例内容", "收藏"], example: true,
  },
  {
    kind: "daily", slug: "window-light", title: "窗边那块慢慢移动的光", date: "2026-08-03",
    excerpt: "下午四点，光刚好爬到桌上的蓝色回形针旁边。",
    body: ["这是一则版式用的虚构日常示例，不是站主的真实经历。", "没有值得发朋友圈的大事，只记下一小块移动的光。它提醒我，普通的一天也有自己的刻度。"],
    deskObjectKey: "journal", tags: ["示例内容", "一瞬"], example: true,
  },
  {
    kind: "daily", slug: "paper-cup", title: "纸杯边缘的小月亮", date: "2026-07-29",
    excerpt: "咖啡喝到最后，杯沿留下一个不完整的圆。",
    body: ["这是用于演示精选日常的占位内容。", "把它描在手账角落，像一枚意外获得的印章。日常记录不必完整，只要当时的感觉没有逃走。"],
    deskObjectKey: "journal", tags: ["示例内容", "观察"], example: true,
  },
  {
    kind: "daily", slug: "three-sounds", title: "今天记住的三种声音", date: "2026-07-21",
    excerpt: "翻书、烧水，还有窗外一辆很慢的自行车。",
    body: ["这条日常仅用于本地预览和交互测试。", "如果照片太重、文字太长，也可以只留下声音的名字。它们排在一起，就像一天很短的片尾字幕。"],
    deskObjectKey: "journal", tags: ["示例内容", "声音"], example: true,
  },
  {
    kind: "projects", slug: "living-desk", title: "私人书桌实验", date: "2026-08-08",
    excerpt: "一个用剪纸、涂鸦和明确隐私边界构成的个人网站概念。",
    body: ["这是当前网站自身的示例项目条目，内容只描述本地原型。", "目标是让作品集不再像一排标准卡片，而像打开一个人正在生活和思考的桌面。"],
    deskObjectKey: "toolbox", tags: ["示例项目", "网页原型"], example: true,
    role: "概念、交互与视觉原型", process: ["梳理私密与公开的边界", "建立桌面物件信息架构", "用真实 HTML 和代码动效完成原型"], result: "本地可浏览的第一期原型；真实项目数据与部署待后续接入。",
  },
  {
    kind: "projects", slug: "blank-project-card", title: "你的下一个真实项目", date: "2026-07-15",
    excerpt: "预留给真实截图、过程记录、角色说明与项目链接的位置。",
    body: ["这是明确标注的项目占位符，不代表站主完成过该项目。", "替换时建议保留：为什么做、你负责什么、关键过程、最终结果，以及能够验证结果的真实材料。"],
    deskObjectKey: "toolbox", tags: ["示例项目", "待替换"], example: true,
    role: "待填写", process: ["补充真实项目背景", "上传真实过程与截图", "填写可验证的结果"], result: "待填写，当前不作任何成果陈述。",
  },
];

export function getEntries(kind: ContentKind) {
  return entries.filter((entry) => entry.kind === kind);
}

export function getEntry(kind: ContentKind, slug: string) {
  return entries.find((entry) => entry.kind === kind && entry.slug === slug);
}
