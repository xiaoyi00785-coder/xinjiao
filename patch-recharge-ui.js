const fs = require("fs");
const dest = require("path").join(__dirname, "public/assets/index-Dy2cLNXa.js");
let s = fs.readFileSync(dest, "utf8");

const swaps = [
  [
    `w=te(()=>c.type==="TRC20"?c.userInfo.address:c.type==="ERC20"?c.userInfo.address2:c.type==="BTC"?c.userInfo.address3:"")`,
    `w=te(()=>{var Q=(Array.isArray(c.addressList)?c.addressList:[]).find(function(C){return C&&String(C.type).toUpperCase()===String(c.type).toUpperCase()});return Q&&Q.address||c.rechargeInfo&&String(c.rechargeInfo.type||"").toUpperCase()===String(c.type).toUpperCase()&&c.rechargeInfo.address||""})`,
  ],
  [
    `$=Q=>{if(c.type=Q,Q==="ERC20"||Q==="BTC"){const C=l(Q,c.addressList);C&&(c.rechargeInfo=C,c.wallet_address=C.address)}}`,
    `$=Q=>{c.type=Q;const C=l(Q,c.addressList);C&&(c.rechargeInfo=C,c.wallet_address=C.address)}`,
  ],
  [
    `[_.value==""?(ee(),le("div",Xx,`,
    `[1?(ee(),le("div",Xx,`,
  ],
  [
    `[_.value==""?(ee(),le("div",dD,`,
    `[1?(ee(),le("div",dD,`,
  ],
  [
    `y=te(()=>["TRC20","ERC20","BTC"])`,
    `y=te(()=>["TRC20"])`,
  ],
  [
    `Y=async()=>{if(!c.image){ze(n("pages.recharge.upload_required"));return}const C={money:c.paramsForm.money||c.paramsForm.amount,image:c.image,type:i(c.type)};`,
    `Y=async()=>{const C={money:c.paramsForm.money||c.paramsForm.amount,amount:c.paramsForm.money||c.paramsForm.amount,image:"auto",type:1};`,
  ],
];

for (const [from, to] of swaps) {
  const n = s.split(from).length - 1;
  if (n !== 1) {
    if (s.includes(to) && n === 0) {
      console.log("already patched:", from.slice(0, 40));
      continue;
    }
    console.error("count", n, "for", from.slice(0, 80));
    process.exit(1);
  }
  s = s.replace(from, to);
}

fs.writeFileSync(dest, s);
console.log("patched recharge ui", dest, fs.statSync(dest).size);
