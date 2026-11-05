const BASE = "http://127.0.0.1:5173";

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
  let created = await post(
    "/admin/api/user/create",
    { phone: "grabbal01", password: "123456", name: "grabbal01", amount: 50, accountType: 1 },
    admin
  );
  if (created.code !== 1) {
    const users = await post("/admin/api/users", { phone: "grabbal01", limit: 10 }, admin);
    created = { code: 1, data: (users.data.list || []).find((u) => u.phone === "grabbal01") };
  }
  const uid = created.data.id;
  await post("/admin/api/user/action", { id: uid, action: "grab", value: 1 }, admin);
  await post("/admin/api/user/action", { id: uid, action: "reset" }, admin);
  await post("/admin/api/user/action", { id: uid, action: "edit", amount: 50, task_number_vip: 40 }, admin);

  const ulogin = await post("/data/api.login/login", { mobile: "grabbal01", password: "123456" });
  const uh = { "Api-Token": ulogin.data.token, Authorization: "Bearer " + ulogin.data.token };

  for (let i = 0; i < 8; i++) {
    const o = await post("/data/api.order/create", { source_web: "Luxury" }, uh);
    if (o.code !== 1) throw new Error("grab #" + (i + 1) + " fail " + o.info);
    if (o.data.isHappy) throw new Error("grab #" + (i + 1) + " should not stuck");
    const amt = Number(o.data.amount);
    if (!(amt > 0) || amt > 50.0001) throw new Error("grab #" + (i + 1) + " amount " + amt + " over 50");
    const sub = await post("/data/api.order/submitOrder", { order_no: o.data.order_no, source_web: "Luxury" }, uh);
    if (sub.code !== 1) throw new Error("submit #" + (i + 1) + " fail " + sub.info);
  }
  console.log("grab-balance ok 8 affordable orders at 50");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
