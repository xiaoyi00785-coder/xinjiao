const http = require("http");

function req(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : "";
    const r = http.request(
      {
        hostname: "127.0.0.1",
        port: process.env.PORT || 5173,
        method,
        path,
        headers: {
          "Content-Type": "application/json",
          "api-name": "wap",
          ...headers,
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (c) => (raw += c));
        res.on("end", () => {
          let json = raw;
          try {
            json = JSON.parse(raw);
          } catch {}
          resolve({ status: res.statusCode, json, raw, type: res.headers["content-type"] });
        });
      }
    );
    r.on("error", reject);
    r.write(data);
    r.end();
  });
}

(async () => {
  const login = await req("POST", "/admin/api/login", { username: "ouzai888", password: "a321321" });
  if (login.json.code !== 1) throw new Error("admin login fail " + JSON.stringify(login.json));
  const token = login.json.data?.token || login.json.token;
  const auth = { "admin-token": token };

  const addr = "TTestRechargeAddr" + Date.now();
  const save = await req(
    "POST",
    "/admin/api/recharge-address/save",
    { id: 1, name: "USDT-TRC20", type: "TRC20", address: addr, enabled: 1, is_default: 1, sort: 1 },
    auth
  );
  if (save.json.code !== 1) throw new Error("save fail " + JSON.stringify(save.json));

  const list = await req("GET", "/data/api.user/getRechargeAddressList");
  const rows = list.json.data;
  if (!Array.isArray(rows)) throw new Error("list not array " + JSON.stringify(list.json));
  const trc = rows.find((x) => x.type === "TRC20");
  if (!trc || trc.address !== addr) throw new Error("frontend list missing new TRC20 " + JSON.stringify(rows));
  if (!trc.image || !trc.image.includes(encodeURIComponent(addr)) && !trc.image.includes("/qr?")) {
    throw new Error("missing qr image " + trc.image);
  }

  const def = await req("POST", "/data/api.user/getRechargeAddressDefault", {});
  if (!def.json.data || !def.json.data.address) throw new Error("default empty " + JSON.stringify(def.json));

  const qr = await req("GET", "/qr?data=" + encodeURIComponent(addr));
  if (qr.status !== 200 || !(qr.type || "").includes("png") || qr.raw.length < 100) {
    throw new Error("qr endpoint fail status=" + qr.status + " type=" + qr.type + " len=" + (qr.raw && qr.raw.length));
  }

  const fs = require("fs");
  const js = fs.readFileSync(__dirname + "/public/assets/index-Dy2cLNXa.js", "utf8");
  if (!js.includes("addressList")) throw new Error("frontend not patched");
  if (js.includes('c.type==="TRC20"?c.userInfo.address')) throw new Error("old userInfo address still used");

  console.log("recharge ok");
  console.log("TRC20", trc.address);
  console.log("default", def.json.data.type, def.json.data.address);
  console.log("list types", rows.map((x) => x.type).join(","));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
