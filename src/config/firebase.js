const admin = require("firebase-admin");

// Cargar las credenciales desde GOOGLE_APPLICATION_CREDENTIALS
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

// Configurar opciones de Firestore
db.settings({
  timestampsInSnapshots: true
});

module.exports = { db, admin };