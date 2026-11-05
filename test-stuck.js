const BASE = "http://127.0.0.1:5173";

async function post(url, body, headers = {}) {
  const r = await fetch(BASE + url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-name": "wap", ...headers },
    body: JSON.stringify(body || {}),
  });
  return r.json();
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

(async () => {
  const fails = [];
  const ok = [];
  const login = await post("/admin/api/login", { username: "ouzai888", password: "a321321" });
  const admin = { "admin-token": login.data.token };
  let created = await post("/admin/api/user/create", {
    phone: "cardtest", password: "123456", name: "cardtest", amount: 8000, vip_level: 1, accountType: 1,
  }, admin);
  if (created.code !== 1) {
    const users = await post("/admin/api/users", { phone: "cardtest", limit: 10 }, admin);
    created = { code: 1, data: (users.data.list || []).find((u) => u.phone === "cardtest") };
  }
  const uid = created.data.id;
  await post("/admin/api/user/action", { id: uid, action: "grab", value: 1 }, admin);
  await post("/admin/api/user/action", { id: uid, action: "edit", amount: 8000, task_number_vip: 40 }, admin);

  async function wipe() {
    const list = await post("/admin/api/stuck/list", { uid }, admin);
    for (const p of list.data.list || []) {
      if (Number(p.status) === 0) await post("/admin/api/stuck/action", { id: p.id, action: "cancel" }, admin);
    }
    await post("/admin/api/user/action", { id: uid, action: "reset" }, admin);
    await post("/admin/api/user/action", { id: uid, action: "edit", amount: 8000 }, admin);
  }

  const ulogin = await post("/data/api.login/login", { mobile: "cardtest", password: "123456" });
  const uh = { "Api-Token": ulogin.data.token, Authorization: "Bearer " + ulogin.data.token };

  async function grab() {
    return post("/data/api.order/create", { source_web: "Luxury" }, uh);
  }
  async function submit(order) {
    return post("/data/api.order/submitOrder", { order_no: order.order_no, source_web: "Luxury" }, uh);
  }

  // 1 multi
  try {
    await wipe();
    const save = await post("/admin/api/stuck/save", {
      uid, type: "multi", current_number: "1/3/5", over_money: "100/200/300",
      commission_type: "rate", commission_rate: "2",
    }, admin);
    assert(save.code === 1, "multi save fail: " + save.info);
    const a1 = await grab();
    assert(Number(a1.data.amount) === 100 && a1.data.isHappy === 1, "multi #1 want 100 got " + a1.data.amount);
    assert(Number(a1.data.commission) === 2, "multi #1 commission want 2 got " + a1.data.commission);
    assert((await submit(a1.data)).code === 1, "multi submit #1 fail");
    const a2 = await grab();
    assert(a2.data.isHappy !== 1 && Number(a2.data.amount) !== 200, "multi #2 should be normal, got " + a2.data.amount);
    assert((await submit(a2.data)).code === 1, "multi submit #2 fail");
    const a3 = await grab();
    assert(Number(a3.data.amount) === 200 && a3.data.isHappy === 1, "multi #3 want 200 got " + a3.data.amount);
    assert((await submit(a3.data)).code === 1, "multi submit #3 fail");
    const a4 = await grab();
    assert(a4.data.isHappy !== 1, "multi #4 should be normal");
    assert((await submit(a4.data)).code === 1, "multi submit #4 fail");
    const a5 = await grab();
    assert(Number(a5.data.amount) === 300 && a5.data.isHappy === 1, "multi #5 want 300 got " + a5.data.amount);
    ok.push("多卡单 1/3/5 = 100/200/300 能用");
  } catch (e) {
    fails.push("多卡单: " + e.message);
  }

  // 2 normal
  try {
    await wipe();
    const save = await post("/admin/api/stuck/save", {
      uid, type: "normal", current_number: "1", over_money: "150",
      commission_type: "rate", commission_rate: "10", number: 2,
    }, admin);
    assert(save.code === 1, "normal save fail: " + save.info);
    const b1 = await grab();
    assert(Number(b1.data.amount) === 150 && Number(b1.data.commission) === 15, "normal #1 want 150/15 got " + b1.data.amount + "/" + b1.data.commission);
    assert((await submit(b1.data)).code === 1, "normal submit #1 fail");
    const b2 = await grab();
    assert(Number(b2.data.amount) === 150 && b2.data.isHappy === 1, "normal #2 want 150 got " + b2.data.amount);
    assert((await submit(b2.data)).code === 1, "normal submit #2 fail");
    const b3 = await grab();
    assert(b3.data.isHappy !== 1, "normal #3 should be normal got " + b3.data.amount);
    ok.push("常规卡单 第1单起连卡2次 150/10% 能用");
  } catch (e) {
    fails.push("常规卡单: " + e.message);
  }

  try {
    await wipe();
    for (let i = 1; i <= 4; i++) {
      const o = await grab();
      assert(o.code === 1, "warmup grab #" + i + " " + o.info);
      assert(o.data.isHappy !== 1, "warmup #" + i + " already stuck " + o.data.amount);
      assert((await submit(o.data)).code === 1, "warmup submit #" + i);
    }
    const save = await post("/admin/api/stuck/save", {
      uid, type: "normal", current_number: "15", over_money: "198",
      commission_type: "rate", commission_rate: "10", number: 1,
    }, admin);
    assert(save.code === 1, "task15 save fail: " + save.info);
    const fifth = await grab();
    assert(fifth.code === 1, "grab #5 fail " + fifth.info);
    assert(fifth.data.isHappy !== 1, "第5单不该卡，got " + fifth.data.amount + " happy=" + fifth.data.isHappy);
    assert(Number(fifth.data.amount) !== 198, "第5单金额不该是198");
    assert((await submit(fifth.data)).code === 1, "submit #5");
    for (let i = 6; i <= 14; i++) {
      const o = await grab();
      assert(o.code === 1, "grab #" + i + " " + o.info);
      assert(o.data.isHappy !== 1, "#" + i + " 不该卡 got " + o.data.amount);
      assert((await submit(o.data)).code === 1, "submit #" + i);
    }
    const hit = await grab();
    assert(Number(hit.data.amount) === 198 && hit.data.isHappy === 1, "第15单要198，got " + hit.data.amount + " happy=" + hit.data.isHappy);
    ok.push("常规卡单 第15单198，第5单不提前、金额也对");
  } catch (e) {
    fails.push("常规卡单第15单: " + e.message);
  }

  // 3 special
  try {
    await wipe();
    const save = await post("/admin/api/stuck/save", {
      uid, type: "special", current_number: "1", over_money: "888",
      commission_type: "rate", commission_rate: "5", goods: "Special Combo",
    }, admin);
    assert(save.code === 1, "special save fail: " + save.info);
    const c1 = await grab();
    assert(Number(c1.data.amount) === 888 && c1.data.isHappy === 1, "special want 888 got " + c1.data.amount);
    assert(Number(c1.data.commission) === 44.4, "special commission want 44.4 got " + c1.data.commission);
    assert(String(c1.data.goods_name).includes("Special"), "special goods " + c1.data.goods_name);
    assert((await submit(c1.data)).code === 1, "special submit fail");
    const c2 = await grab();
    assert(c2.data.isHappy !== 1, "special second should be normal");
    ok.push("特殊卡单 第1单 888/5% 能用");
  } catch (e) {
    fails.push("特殊卡单: " + e.message);
  }

  // 4 split
  try {
    await wipe();
    const save = await post("/admin/api/stuck/save", {
      uid, type: "split", current_number: "1", over_money: "100",
      commission_type: "rate", commission_rate: "10", number: 5,
    }, admin);
    assert(save.code === 1, "split save fail: " + save.info);
    const d1 = await grab();
    assert(Number(d1.data.amount) === 500, "split want 100*5=500 got " + d1.data.amount);
    assert(Number(d1.data.commission) === 50, "split commission want 50 got " + d1.data.commission);
    assert(d1.data.isHappy === 1 && String(d1.data.goods_name).includes("5"), "split goods " + d1.data.goods_name);
    const sub = await submit(d1.data);
    assert(sub.code === 1, "split submit fail " + sub.info);
    ok.push("拆分订单 第1单 每次100 x5=500 能用");
  } catch (e) {
    fails.push("拆分订单: " + e.message);
  }

  console.log("PASS");
  ok.forEach((x) => console.log("  " + x));
  if (fails.length) {
    console.log("FAIL");
    fails.forEach((x) => console.log("  " + x));
    process.exit(1);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
