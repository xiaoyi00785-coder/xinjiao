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
  const login = await post("/admin/api/login", { username: "ouzai888", password: "a321321" });
  const admin = { "admin-token": login.data.token };
  let created = await post(
    "/admin/api/user/create",
    { phone: "baltest", password: "123456", name: "baltest", amount: 1000, vip_level: 1, accountType: 1 },
    admin
  );
  if (created.code !== 1) {
    const users = await post("/admin/api/users", { phone: "baltest", limit: 10 }, admin);
    created = { code: 1, data: (users.data.list || []).find((u) => u.phone === "baltest") };
  }
  const uid = created.data.id;
  await post("/admin/api/user/action", { id: uid, action: "grab", value: 1 }, admin);
  await post("/admin/api/user/action", { id: uid, action: "reset" }, admin);
  await post("/admin/api/user/action", { id: uid, action: "edit", amount: 1000, task_number_vip: 40 }, admin);

  const ulogin = await post("/data/api.login/login", { mobile: "baltest", password: "123456" });
  const uh = { "Api-Token": ulogin.data.token, Authorization: "Bearer " + ulogin.data.token };
  const before = await post("/data/api.user/getMemberInfo", {}, uh);
  const start = Number(before.data.amount);
  const createdOrder = await post("/data/api.order/create", { source_web: "Luxury" }, uh);
  if (createdOrder.code !== 1) throw new Error("create fail " + createdOrder.info);
  const commission = Number(createdOrder.data.commission_money || createdOrder.data.commission);
  const submitted = await post("/data/api.order/submitOrder", { order_no: createdOrder.data.order_no }, uh);
  if (submitted.code !== 1) throw new Error("submit fail " + submitted.info);
  const after = await post("/data/api.user/getMemberInfo", {}, uh);
  const end = Number(after.data.amount);
  const expect = Number((start + commission).toFixed(4));
  if (Math.abs(end - expect) > 0.0002) {
    throw new Error(`balance ${start} -> ${end}, want ${expect} (commission ${commission}, order ${createdOrder.data.amount})`);
  }
  if (!(end > start)) throw new Error(`balance did not increase: ${start} -> ${end}`);
  console.log("order-balance ok", start, "+", commission, "=", end);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
