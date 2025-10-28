const admin = require("firebase-admin");

// Cargar las credenciales desde variable de entorno
if (!admin.apps.length) {
  let credential;
  
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    // En producción (Render) - desde variable de entorno
    const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    credential = admin.credential.cert(serviceAccount);
  } else {
    // En desarrollo local - desde archivo
    credential = admin.credential.applicationDefault();
  }
  
  admin.initializeApp({
    credential: credential,
  });
}

const db = admin.firestore();

db.settings({
  timestampsInSnapshots: true
});

module.exports = { db, admin };