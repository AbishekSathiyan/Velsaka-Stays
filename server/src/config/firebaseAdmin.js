const fs = require("fs");
const path = require("path");

const {
  initializeApp,
  cert,
  getApps,
} = require("firebase-admin/app");

const { getAuth } = require("firebase-admin/auth");

const serviceAccountPath = path.resolve(
  __dirname,
  "../../credentials/firebase-service-account.json"
);

if (!fs.existsSync(serviceAccountPath)) {
  throw new Error("Firebase service account JSON not found.");
}

const serviceAccount = JSON.parse(
  fs.readFileSync(serviceAccountPath, "utf8")
);

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });

  console.log("Firebase Admin initialized successfully.");
}

module.exports = {
  auth: () => getAuth(),
};