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
  const adminLogin = await post("/admin/api/login", { username: "ouzai888", password: "a321321" });
  const admin = { "admin-token": adminLogin.data.token };
  const login = await post("/data/api.login/login", { mobile: "2222", password: "123456" });
  if (login.code !== 1) throw new Error("login fail " + login.info);
  const uh = { "Api-Token": login.data.token, Authorization: "Bearer " + login.data.token };
  const before = await post("/data/api.user/getMemberInfo", {}, uh);
  const start = Number(before.data.amount);

  const rec = await post("/data/api.user/userRecharge", { money: 17.5, type: 1 }, uh);
  if (rec.code !== 1) throw new Error("recharge fail " + rec.info);
  if (Number(rec.data.status) !== 0) throw new Error("should pending, got " + rec.data.status);
  const mid = await post("/data/api.user/getMemberInfo", {}, uh);
  if (Math.abs(Number(mid.data.amount) - start) > 0.0002) throw new Error("submit must not credit");

  const ok = await post("/admin/api/recharge/review", { id: rec.data.id, status: 1 }, admin);
  if (ok.code !== 1) throw new Error("review fail " + ok.info);
  const after = await post("/data/api.user/getMemberInfo", {}, uh);
  const end = Number(after.data.amount);
  if (Math.abs(end - (start + 17.5)) > 0.0002) throw new Error(`approve ${start} -> ${end}`);

  const rec2 = await post("/data/api.user/userRecharge", { money: 9.25, type: 1 }, uh);
  const chain = await post(
    "/admin/api/chain/ingest",
    { txid: "testtx" + Date.now(), from: "TFromTest111", amount: 9.25 },
    admin
  );
  if (chain.code !== 1) throw new Error("ingest fail " + chain.info);
  const after2 = await post("/data/api.user/getMemberInfo", {}, uh);
  if (Math.abs(Number(after2.data.amount) - (end + 9.25)) > 0.0002) {
    throw new Error("chain match did not credit " + after2.data.amount);
  }
  const list = await post("/data/api.user/getRechargeAddressList", {}, uh);
  const rows = Array.isArray(list.data) ? list.data : [];
  if (rows.some((x) => String(x.type).toUpperCase() !== "TRC20")) throw new Error("non-TRC20 leaked");
  console.log("recharge-review ok", start, "->", end, "chain", after2.data.amount, "pending", rec2.data.id);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
