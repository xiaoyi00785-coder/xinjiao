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
    { phone: "wallettest", password: "123456", name: "wallettest", amount: 100, accountType: 1 },
    admin
  );
  if (created.code !== 1) {
    const users = await post("/admin/api/users", { phone: "wallettest", limit: 10 }, admin);
    created = { code: 1, data: (users.data.list || []).find((u) => u.phone === "wallettest") };
  }
  const uid = created.data.id;
  await post("/admin/api/user/action", { id: uid, action: "edit", address: "", address2: "", address3: "" }, admin);

  const ulogin = await post("/data/api.login/login", { mobile: "wallettest", password: "123456" });
  const uh = { "Api-Token": ulogin.data.token, Authorization: "Bearer " + ulogin.data.token };
  const trc = "TWalletSaveTest11111111111111111111";
  const erc = "0xWalletSaveTest22222222222222222222";

  const empty = await post("/data/api.user/getNewPersonWalletList", {}, uh);
  if (empty.code !== 1) throw new Error("list fail " + empty.info);
  const before = Array.isArray(empty.data) ? empty.data : [];
  if (before.some((x) => x.address === trc)) throw new Error("already had trc");

  const save = await post("/data/api.user/setMulWalletInfo", { wallet_type: "TRC20", wallet_address: trc }, uh);
  if (save.code !== 1) throw new Error("save fail " + save.info);

  const list = await post("/data/api.user/getNewPersonWalletList", {}, uh);
  const rows = Array.isArray(list.data) ? list.data : [];
  const hit = rows.find((x) => String(x.type).toUpperCase() === "TRC20");
  if (!hit || hit.address !== trc) throw new Error("list not saved " + JSON.stringify(list.data));

  const info = await post("/data/api.user/getMemberInfo", {}, uh);
  if (info.data.address !== trc) throw new Error("member address not " + trc + " got " + info.data.address);
  if (info.data.wallet_address !== trc) throw new Error("wallet_address not saved " + info.data.wallet_address);

  const save2 = await post("/data/api.user/setMulWalletInfo", { wallet_type: "ERC20", wallet_address: erc }, uh);
  if (save2.code !== 1) throw new Error("erc save fail " + save2.info);
  const list2 = await post("/data/api.user/getNewPersonWalletList", {}, uh);
  const rows2 = Array.isArray(list2.data) ? list2.data : [];
  const trcHit = rows2.find((x) => String(x.type).toUpperCase() === "TRC20");
  const ercHit = rows2.find((x) => String(x.type).toUpperCase() === "ERC20");
  if (!trcHit || trcHit.address !== trc) throw new Error("trc lost after erc save");
  if (!ercHit || ercHit.address !== erc) throw new Error("erc not saved " + JSON.stringify(list2.data));

  const again = await post("/data/api.user/getNewPersonWalletList", {}, uh);
  if ((again.data || []).find((x) => x.type === "TRC20").address !== trc) throw new Error("reload lost address");
  console.log("wallet-save ok", trc);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
