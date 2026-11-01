
require("dotenv").config();

const crypto = require("crypto");

let key = process.env.FIREBASE_PRIVATE_KEY;

if (!key) {
  console.log("PRIVATE KEY: MISSING");
  process.exit(1);
}

key = key
  .trim()
  .replace(/^["']|["']$/g, "")
  .replace(/\\n/g, "\n");

console.log(
  "Header:",
  key.startsWith("-----BEGIN PRIVATE KEY-----")
);

console.log(
  "Footer:",
  key.endsWith("-----END PRIVATE KEY-----")
);

try {
  crypto.createPrivateKey(key);
  console.log("PRIVATE KEY: VALID");
} catch (error) {
  console.log("PRIVATE KEY: INVALID");
  console.log("Reason:", error.message);
}
