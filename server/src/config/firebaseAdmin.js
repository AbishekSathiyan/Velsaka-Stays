// Firebase Admin SDK configuration
const {
  initializeApp,
  cert,
  getApps,
} = require("firebase-admin/app");

const { getAuth } = require("firebase-admin/auth");

const credentials = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!credentials) {
  throw new Error(
    "FIREBASE_SERVICE_ACCOUNT_JSON environment variable is missing."
  );
}

let serviceAccount;

try {
  serviceAccount = JSON.parse(credentials);
} catch (error) {
  throw new Error("Firebase service account JSON is invalid.");
}

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key.replace(/\\n/g, "\n"),
    }),
  });

  console.log("Firebase Admin initialized successfully.");
}

module.exports = {
  auth: () => getAuth(),
};
