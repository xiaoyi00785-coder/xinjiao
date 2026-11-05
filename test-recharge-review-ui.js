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
  if (!html.includes("reviewRecharge") || !html.includes(">通过</button>") || !html.includes(">拒绝</button>")) {
    throw new Error("admin html missing review buttons");
  }
  const adminLogin = await post("/admin/api/login", { username: "ouzai888", password: "a321321" });
  const admin = { "admin-token": adminLogin.data.token };
  const ulogin = await post("/data/api.login/login", { mobile: "2222", password: "123456" });
  const uh = { "Api-Token": ulogin.data.token, Authorization: "Bearer " + ulogin.data.token };
  const rec = await post("/data/api.user/userRecharge", { money: 3.33, type: 1 }, uh);
  if (rec.code !== 1) throw new Error("submit fail " + rec.info);
  const list = await post("/admin/api/recharges", { page: 1, status: "0" }, admin);
  const row = (list.data.list || []).find((x) => String(x.id) === String(rec.data.id));
  if (!row || Number(row.status) !== 0) throw new Error("pending not listed " + JSON.stringify(list.data.list && list.data.list[0]));
  const okPass = await post("/admin/api/recharge/review", { id: rec.data.id, status: 1 }, admin);
  if (okPass.code !== 1) throw new Error("approve fail " + okPass.info);
  const rec2 = await post("/data/api.user/userRecharge", { money: 1.11, type: 1 }, uh);
  const rej = await post("/admin/api/recharge/review", { id: rec2.data.id, status: 2 }, admin);
  if (rej.code !== 1) throw new Error("reject fail " + rej.info);
  console.log("recharge-review-ui ok", rec.data.id, rec2.data.id);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
