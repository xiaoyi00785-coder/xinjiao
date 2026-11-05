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
  if (!html.includes("代理后台管理") || !html.includes("super-only")) throw new Error("admin html missing agent menu");
  const agentHtml = await (await fetch(BASE + "/agent/")).text();
  if (!agentHtml.includes("代理后台")) throw new Error("agent path not serving admin ui");

  const superLogin = await post("/admin/api/login", { username: "ouzai888", password: "a321321" });
  const superH = { "admin-token": superLogin.data.token };
  const addr1 = "TAgentPayAddr11111111111111111111";
  const addr2 = "TAgentPayAddr22222222222222222222";
  const saved = await post(
    "/admin/api/agent/save",
    { username: "agent01", password: "123456", name: "代理01", recharge_address: addr1, enabled: 1, yqm: "880001" },
    superH
  );
  if (saved.code !== 1) throw new Error("save agent " + saved.info);

  const agentLogin = await post("/admin/api/login", { username: "agent01", password: "123456" });
  if (agentLogin.code !== 1 || agentLogin.data.role !== "agent") throw new Error("agent login " + agentLogin.info);
  const agentH = { "admin-token": agentLogin.data.token };

  const blocked = await post(
    "/admin/api/recharge-address/save",
    { type: "TRC20", address: "TShouldNotSave1111111111111111111", enabled: 1, is_default: 1 },
    agentH
  );
  if (blocked.code === 1) throw new Error("agent was able to change frontend address");

  const agentsBlocked = await post("/admin/api/agents", {}, agentH);
  if (agentsBlocked.code === 1) throw new Error("agent listed other agents");

  const created = await post(
    "/admin/api/user/create",
    { phone: "agentuser01", password: "123456", name: "agentuser01", amount: 50, accountType: 1 },
    agentH
  );
  if (created.code !== 1) throw new Error("agent create user " + created.info);
  if (created.data.parent !== "agent01") throw new Error("parent not agent01 got " + created.data.parent);

  const mainUsers = await post("/admin/api/users", { phone: "2222", limit: 10 }, agentH);
  if ((mainUsers.data.list || []).some((u) => u.phone === "2222")) throw new Error("agent saw main user 2222");

  const ulogin = await post("/data/api.login/login", { mobile: "agentuser01", password: "123456" });
  const uh = { "Api-Token": ulogin.data.token, Authorization: "Bearer " + ulogin.data.token };
  const list1 = await post("/data/api.user/getRechargeAddressList", {}, uh);
  const row1 = Array.isArray(list1.data) ? list1.data[0] : null;
  if (!row1 || row1.address !== addr1) throw new Error("user not on agent address " + JSON.stringify(list1.data));

  const changed = await post("/admin/api/agent/action", { id: saved.data.id, recharge_address: addr2 }, superH);
  if (changed.code !== 1) throw new Error("super change agent addr " + changed.info);
  const list2 = await post("/data/api.user/getRechargeAddressList", {}, uh);
  const row2 = Array.isArray(list2.data) ? list2.data[0] : null;
  if (!row2 || row2.address !== addr2) throw new Error("user still old agent address " + JSON.stringify(list2.data));

  console.log("agent-admin ok", saved.data.username, addr2);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
