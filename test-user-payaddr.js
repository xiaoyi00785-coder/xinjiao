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
  let created = await post(
    "/admin/api/user/create",
    { phone: "payaddr01", password: "123456", name: "payaddr01", amount: 100, accountType: 1 },
    admin
  );
  if (created.code !== 1) {
    const users = await post("/admin/api/users", { phone: "payaddr01", limit: 10 }, admin);
    created = { code: 1, data: (users.data.list || []).find((u) => u.phone === "payaddr01") };
  }
  const uid = created.data.id;
  const addr = "TUserPayAddrTest1111111111111111111";
  const edit = await post("/admin/api/user/action", { id: uid, action: "edit", recharge_address: addr }, admin);
  if (edit.code !== 1) throw new Error("edit fail " + edit.info);
  if (edit.data.recharge_address !== addr) throw new Error("not saved " + edit.data.recharge_address);

  const ulogin = await post("/data/api.login/login", { mobile: "payaddr01", password: "123456" });
  const uh = { "Api-Token": ulogin.data.token, Authorization: "Bearer " + ulogin.data.token };
  const list = await post("/data/api.user/getRechargeAddressList", {}, uh);
  const rows = Array.isArray(list.data) ? list.data : [];
  if (!rows.length || rows[0].address !== addr) throw new Error("user list not personal " + JSON.stringify(list.data));
  const def = await post("/data/api.user/getRechargeAddressDefault", {}, uh);
  if (def.data.address !== addr) throw new Error("default not personal " + JSON.stringify(def.data));
  console.log("user-payaddr ok", addr);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
