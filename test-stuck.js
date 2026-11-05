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
  async function bal() {
    const info = await post("/data/api.user/getMemberInfo", {}, uh);
    return Number(info.data.amount);
  }
  function eq(a, b, msg) {
    assert(Math.abs(Number(a) - Number(b)) < 0.02, msg);
  }
  async function coverAndSubmit(order, extra) {
    eq(order.diff_money, extra, "差额 want " + extra + " got " + order.diff_money);
    const blocked = await submit(order);
    assert(blocked.code !== 1, "没补差额不该能提交: " + blocked.info);
    const top = await post("/admin/api/user/action", { id: uid, action: "change", amount: extra, remark: "cover stuck" }, admin);
    assert(top.code === 1, "cover fail " + top.info);
    const sub = await submit(order);
    assert(sub.code === 1, "cover后提交失败 " + sub.info);
    return sub;
  }

  // 1 multi
  try {
    await wipe();
    const save = await post("/admin/api/stuck/save", {
      uid, type: "multi", current_number: "1/3/5", over_money: "100/200/300",
      commission_type: "fixed", commission_rate: "10/20/30",
    }, admin);
    assert(save.code === 1, "multi save fail: " + save.info);
    let b0 = await bal();
    const a1 = await grab();
    assert(a1.data.isHappy === 1, "multi #1 should stuck");
    eq(a1.data.amount, b0 + 100, "multi #1 want " + (b0 + 100) + " got " + a1.data.amount);
    eq(a1.data.commission, 10, "multi #1 commission want 10 got " + a1.data.commission);
    eq(a1.data.commission_money, 10, "multi #1 commission_money want 10 got " + a1.data.commission_money);
    await coverAndSubmit(a1.data, 100);
    const a2 = await grab();
    assert(a2.data.isHappy !== 1, "multi #2 should be normal, got " + a2.data.amount);
    assert((await submit(a2.data)).code === 1, "multi submit #2 fail");
    b0 = await bal();
    const a3 = await grab();
    assert(a3.data.isHappy === 1, "multi #3 should stuck");
    eq(a3.data.amount, b0 + 200, "multi #3 want " + (b0 + 200) + " got " + a3.data.amount);
    eq(a3.data.commission, 20, "multi #3 commission want 20 got " + a3.data.commission);
    await coverAndSubmit(a3.data, 200);
    const a4 = await grab();
    assert(a4.data.isHappy !== 1, "multi #4 should be normal");
    assert((await submit(a4.data)).code === 1, "multi submit #4 fail");
    b0 = await bal();
    const a5 = await grab();
    assert(a5.data.isHappy === 1, "multi #5 should stuck");
    eq(a5.data.amount, b0 + 300, "multi #5 want " + (b0 + 300) + " got " + a5.data.amount);
    eq(a5.data.commission, 30, "multi #5 commission want 30 got " + a5.data.commission);
    ok.push("多卡单 1/3/5 差额 100/200/300，佣金 10/20/30 填多少拿多少");
  } catch (e) {
    fails.push("多卡单: " + e.message);
  }

  // 2 normal
  try {
    await wipe();
    const save = await post("/admin/api/stuck/save", {
      uid, type: "normal", current_number: "1", over_money: "150",
      commission_type: "fixed", commission_rate: "50", number: 2,
    }, admin);
    assert(save.code === 1, "normal save fail: " + save.info);
    let b0 = await bal();
    const b1 = await grab();
    assert(b1.data.isHappy === 1, "normal #1 should stuck");
    eq(b1.data.amount, b0 + 150, "normal #1 want " + (b0 + 150) + " got " + b1.data.amount);
    eq(b1.data.commission, 50, "normal #1 commission want 50 got " + b1.data.commission);
    await coverAndSubmit(b1.data, 150);
    b0 = await bal();
    const b2 = await grab();
    assert(b2.data.isHappy === 1, "normal #2 should stuck");
    eq(b2.data.amount, b0 + 150, "normal #2 want " + (b0 + 150) + " got " + b2.data.amount);
    eq(b2.data.commission, 50, "normal #2 commission want 50 got " + b2.data.commission);
    await coverAndSubmit(b2.data, 150);
    const b3 = await grab();
    assert(b3.data.isHappy !== 1, "normal #3 should be normal got " + b3.data.amount);
    ok.push("常规卡单 第1单起连卡2次 差额150，佣金50填多少拿多少");
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
      commission_type: "fixed", commission_rate: "50", number: 1,
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
    const before15 = await bal();
    const hit = await grab();
    assert(hit.data.isHappy === 1, "第15单该卡");
    eq(hit.data.amount, before15 + 198, "第15单要余额+198=" + (before15 + 198) + " got " + hit.data.amount);
    eq(hit.data.diff_money, 198, "第15单差额要198 got " + hit.data.diff_money);
    const blocked = await submit(hit.data);
    assert(blocked.code !== 1, "没补198不该完成: " + blocked.info);
    ok.push("常规卡单 第15单差额198，订单=余额+198，第5单不提前");
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
    const c0 = await bal();
    const c1 = await grab();
    assert(c1.data.isHappy === 1, "special should stuck");
    eq(c1.data.amount, c0 + 888, "special want " + (c0 + 888) + " got " + c1.data.amount);
    assert(String(c1.data.goods_name).includes("Special"), "special goods " + c1.data.goods_name);
    await coverAndSubmit(c1.data, 888);
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
    const d0 = await bal();
    const d1 = await grab();
    assert(d1.data.isHappy === 1 && String(d1.data.goods_name).includes("5"), "split goods " + d1.data.goods_name);
    eq(d1.data.amount, d0 + 500, "split want 余额+500 got " + d1.data.amount);
    eq(d1.data.diff_money, 500, "split 差额要500 got " + d1.data.diff_money);
    ok.push("拆分订单 每次差额100 x5，订单=余额+500");
  } catch (e) {
    fails.push("拆分订单: " + e.message);
  }

  try {
    await wipe();
    await post("/admin/api/user/action", { id: uid, action: "edit", amount: 500 }, admin);
    const save = await post("/admin/api/stuck/save", {
      uid, type: "normal", current_number: "1", over_money: "198",
      commission_type: "fixed", commission_rate: "50", number: 1,
    }, admin);
    assert(save.code === 1, "500+198 save fail " + save.info);
    const o = await grab();
    eq(o.data.amount, 698, "500+198 要出698 got " + o.data.amount);
    eq(o.data.diff_money, 198, "差额要198 got " + o.data.diff_money);
    eq(o.data.commission, 50, "佣金填50就要拿50 got " + o.data.commission);
    eq(o.data.commission_money, 50, "commission_money 要50 got " + o.data.commission_money);
    const blocked = await submit(o.data);
    assert(blocked.code !== 1, "500块不该过698的单");
    await post("/admin/api/user/action", { id: uid, action: "change", amount: 198, remark: "cover 198" }, admin);
    const sub = await submit(o.data);
    assert(sub.code === 1, "补198后应能完成 " + sub.info);
    eq(await bal(), 748, "补198完成应拿佣金50，余额748 got " + (await bal()));
    ok.push("账户500卡198，出698，补198完成拿佣金50变748");
  } catch (e) {
    fails.push("余额加差额: " + e.message);
  }

  try {
    await wipe();
    const save = await post("/admin/api/stuck/save", {
      uid, type: "multi", current_number: "1/2", over_money: "100/200",
      commission_type: "fixed", commission_rate: "20/30",
    }, admin);
    assert(save.code === 1, "slash save fail " + save.info);
    const o = await grab();
    eq(o.data.commission, 20, "20/30 第1单佣金要20不能是0 got " + o.data.commission);
    eq(o.data.commission_money, 20, "commission_money 要20 got " + o.data.commission_money);
    ok.push("多卡单佣金 20/30 第1单显示20不是0");
  } catch (e) {
    fails.push("斜杠佣金: " + e.message);
  }

  try {
    await wipe();
    let save = await post("/admin/api/stuck/save", {
      uid, type: "normal", current_number: "1", over_money: "100",
      commission_type: "fixed", commission_rate: "0", number: 1,
    }, admin);
    assert(save.code === 1, "zero comm save fail " + save.info);
    let o = await grab();
    eq(o.data.commission, 0, "先出0佣金单");
    save = await post("/admin/api/stuck/save", {
      uid, type: "normal", current_number: "1", over_money: "100",
      commission_type: "fixed", commission_rate: "30", number: 1,
    }, admin);
    assert(save.code === 1, "resave 30 fail " + save.info);
    o = await grab();
    eq(o.data.commission, 30, "后台补填30后用户端要显示30 got " + o.data.commission);
    eq(o.data.commission_money, 30, "commission_money 要30 got " + o.data.commission_money);
    ok.push("待完成卡单佣金0时，后台改填30用户端立刻显示30");
  } catch (e) {
    fails.push("补填佣金: " + e.message);
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
