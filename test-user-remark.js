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
  if (!html.includes("openRemark") || !html.includes("后台备注")) throw new Error("admin html missing remark UI");

  const adminLogin = await post("/admin/api/login", { username: "ouzai888", password: "a321321" });
  const admin = { "admin-token": adminLogin.data.token };
  const phone = "remark01";
  let created = await post(
    "/admin/api/user/create",
    { phone, password: "123456", name: phone, amount: 10, accountType: 1, remark: "卡第15单198" },
    admin
  );
  if (created.code !== 1) {
    const users = await post("/admin/api/users", { phone, limit: 10 }, admin);
    created = { code: 1, data: (users.data.list || []).find((u) => u.phone === phone) };
  }
  const uid = created.data.id;
  if (created.data.remark && created.data.remark !== "卡第15单198") {
    /* create may have been an existing row; force edit */
  }
  const edit = await post("/admin/api/user/action", { id: uid, action: "edit", remark: "卡第15单198，已补余额" }, admin);
  if (edit.code !== 1) throw new Error("edit fail " + edit.info);
  if (edit.data.remark !== "卡第15单198，已补余额") throw new Error("remark not saved " + edit.data.remark);

  const list = await post("/admin/api/users", { remark: "已补余额", accountType: 1, limit: 20 }, admin);
  const row = (list.data.list || []).find((u) => String(u.id) === String(uid));
  if (!row) throw new Error("search by remark missed user");
  if (row.remark !== "卡第15单198，已补余额") throw new Error("list remark " + row.remark);
  console.log("user-remark ok", uid, row.remark);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
