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
  const login = await post("/data/api.login/login", { mobile: "2222", password: "123456" });
  if (login.code !== 1) throw new Error("login fail " + login.info);
  const uh = { "Api-Token": login.data.token, Authorization: "Bearer " + login.data.token };
  const before = await post("/data/api.user/getMemberInfo", {}, uh);
  const start = Number(before.data.amount);
  const rec = await post("/data/api.user/userRecharge", { money: 25, type: 1 }, uh);
  if (rec.code !== 1) throw new Error("recharge fail " + rec.info);
  if (rec.data.type !== "TRC20") throw new Error("type not TRC20 " + rec.data.type);
  const after = await post("/data/api.user/getMemberInfo", {}, uh);
  const end = Number(after.data.amount);
  if (Math.abs(end - (start + 25)) > 0.0002) throw new Error(`balance ${start} -> ${end}, want ${start + 25}`);
  const list = await post("/data/api.user/getRechargeAddressList", {}, uh);
  const rows = Array.isArray(list.data) ? list.data : [];
  if (rows.some((x) => String(x.type).toUpperCase() !== "TRC20")) throw new Error("non-TRC20 leaked " + JSON.stringify(rows));
  console.log("recharge-auto ok", start, "+25 =", end, "addrs", rows.map((x) => x.type).join(","));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
