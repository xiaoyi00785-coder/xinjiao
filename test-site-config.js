const BASE = "http://127.0.0.1:" + (process.env.PORT || 5173);

async function post(url, body, headers = {}) {
  const r = await fetch(BASE + url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-name": "wap", ...headers },
    body: JSON.stringify(body || {}),
  });
  return r.json();
}

(async () => {
  const html = await (await fetch(BASE + "/admin/")).text();
  if (!html.includes("系统配置") || !html.includes("首页轮播") || !html.includes("任务商品")) {
    throw new Error("main admin missing system config menus");
  }
  const superLogin = await post("/admin/api/login", { username: "ouzai888", password: "a321321" });
  const superH = { "admin-token": superLogin.data.token };
  const agentLogin = await post("/admin/api/login", { username: "agent01", password: "123456" });
  const agentH = { "admin-token": agentLogin.data.token };

  const blocked = await post("/admin/api/site/save", { kind: "notice", has_notice: 1, title: "x" }, agentH);
  if (blocked.code === 1) throw new Error("agent changed site config");

  const banner = "/assets/g4-BBjI9fpu.png";
  const saveCar = await post("/admin/api/site/save", { kind: "carousel", image: banner, title: "wired-banner", sort: 9, enabled: 1 }, superH);
  if (saveCar.code !== 1) throw new Error("carousel save " + saveCar.info);
  const car = await post("/data/api.data/carousel", {});
  const hit = (car.data || []).find((x) => x.title === "wired-banner" && x.image === banner);
  if (!hit) throw new Error("user carousel not wired " + JSON.stringify(car.data));

  const help = await post("/admin/api/site/save", {
    kind: "helps", id: 1, name: "help5", title: "Wired Help", content: "<p>from-admin</p>",
  }, superH);
  if (help.code !== 1) throw new Error("help save " + help.info);
  const helps = await post("/data/api.data/getHelpList", {});
  if (!(helps.data || []).some((x) => x.title === "Wired Help")) throw new Error("help not wired");

  const cs = await post("/admin/api/site/save", { kind: "services", id: 1, name: "WA", url: "https://wa.me/11111", enabled: 1 }, superH);
  if (cs.code !== 1) throw new Error("cs save " + cs.info);
  const csl = await post("/data/api.user/getCustomerServiceList", {});
  if (!(csl.data || []).some((x) => x.url === "https://wa.me/11111")) throw new Error("cs not wired");

  const prod = await post("/admin/api/site/save", { kind: "products", name: "AdminProduct", amount: 77.7, image: "/assets/goods1-wacp4OKz.png", enabled: 1 }, superH);
  if (prod.code !== 1) throw new Error("product save " + prod.info);

  const prize = await post("/admin/api/site/save", { kind: "prizes", title: "12USDT", amount: 12 }, superH);
  if (prize.code !== 1) throw new Error("prize save " + prize.info);
  const pl = await post("/data/api.user/getPrizeList", {});
  if (!(pl.data.data || []).some((x) => x.title === "12USDT")) throw new Error("prize not wired");

  const notice = await post("/admin/api/site/save", { kind: "notice", has_notice: 1, title: "Hello", content: "from admin" }, superH);
  if (notice.code !== 1) throw new Error("notice save " + notice.info);
  const n = await post("/data/api.user/getLastNotice", {});
  if (!n.data.has_notice || n.data.title !== "Hello") throw new Error("notice not wired " + JSON.stringify(n.data));

  console.log("site-config ok");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
