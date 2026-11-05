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
  const html = await (await fetch(BASE + "/admin/")).text();
  if (!html.includes("修改密码") || !html.includes("后台账号密码")) throw new Error("admin html missing password ui");

  const superLogin = await post("/admin/api/login", { username: "ouzai888", password: "a321321" });
  const superH = { "admin-token": superLogin.data.token };

  const saved = await post(
    "/admin/api/admin/save",
    { username: "admintest", password: "oldpass1", name: "测改密", role: "super", enabled: 1 },
    superH
  );
  if (saved.code !== 1) throw new Error("save admin " + saved.info);

  const loginOld = await post("/admin/api/login", { username: "admintest", password: "oldpass1" });
  if (loginOld.code !== 1) throw new Error("old password login fail " + loginOld.info);
  const h = { "admin-token": loginOld.data.token };

  const badOld = await post("/admin/api/password", { old_password: "wrong", password: "newpass1" }, h);
  if (badOld.code === 1) throw new Error("wrong old password should fail");

  const changed = await post("/admin/api/password", { old_password: "oldpass1", password: "newpass1" }, h);
  if (changed.code !== 1) throw new Error("self change fail " + changed.info);

  const loginNew = await post("/admin/api/login", { username: "admintest", password: "newpass1" });
  if (loginNew.code !== 1) throw new Error("new password login fail " + loginNew.info);

  const loginDead = await post("/admin/api/login", { username: "admintest", password: "oldpass1" });
  if (loginDead.code === 1) throw new Error("old password still works");

  const reset = await post(
    "/admin/api/admin/save",
    { id: saved.data.id, username: "admintest", password: "reset99" },
    superH
  );
  if (reset.code !== 1) throw new Error("super reset fail " + reset.info);
  const loginReset = await post("/admin/api/login", { username: "admintest", password: "reset99" });
  if (loginReset.code !== 1) throw new Error("reset password login fail " + loginReset.info);

  await post(
    "/admin/api/agent/save",
    { username: "agent01", password: "123456", name: "代理01", enabled: 1, yqm: "880001" },
    superH
  );
  const agentLogin = await post("/admin/api/login", { username: "agent01", password: "123456" });
  const agentH = { "admin-token": agentLogin.data.token };
  const blocked = await post("/admin/api/admins", {}, agentH);
  if (blocked.code === 1) throw new Error("agent listed admins");

  console.log("admin-password ok", saved.data.username);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
