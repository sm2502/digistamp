const express = require('express');
const app = express();
const db = require('./db');

app.use(express.json());

// Beispiel-Route zum Testen
app.get('/', (req, res) => {
  res.send('DigiStamp Backend läuft! 🚀');
});

// Server starten
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));