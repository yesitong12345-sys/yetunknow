import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/", headers = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html", ...headers } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the complete living desk home", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /私人书桌/);
  assert.match(html, /灵感便签/);
  assert.match(html, /碰一下，翻开看看/);
  assert.match(html, /纸板工具盒/);
  assert.match(html, /上锁抽屉/);
  assert.doesNotMatch(html, /会生长的书桌|一张正在长大的私人桌面/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("renders every public collection and a detail route", async () => {
  for (const [path, label] of [["/ideas", "奇思妙想"], ["/daily", "日常记录"], ["/projects", "项目作品"], ["/ideas/weather-bookmarks", "detail-paper"]]) {
    const response = await render(path);
    assert.equal(response.status, 200, path);
    assert.match(await response.text(), new RegExp(label));
  }
});

test("studio HTML never contains private body data from browser storage", async () => {
  const response = await render("/studio");
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /上锁抽屉/);
  assert.match(html, /已同步.*云端确认|正在拉开抽屉/s);
  assert.doesNotMatch(html, /还没整理的念头/);
});
