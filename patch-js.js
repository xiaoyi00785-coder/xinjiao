const fs = require("fs");
const src = "C:/Users/Administrator/Desktop/0/_orig/index.js";
const dest = "C:/Users/Administrator/Desktop/0/luxury-clone/public/assets/index-Dy2cLNXa.js";
const s = fs.readFileSync(src, "utf8");
const n = s.replace('baseURL:"https://api.bestunionf4.cc/"', 'baseURL:"/"');
if (s === n) {
  console.error("baseURL not found");
  process.exit(1);
}
fs.writeFileSync(dest, n);
console.log("patched", fs.statSync(dest).size);
