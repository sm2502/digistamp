const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require("path");


const app = express();
const db = require('./db');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));


const SALT_ROUNDS = 10;

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidId(id) {
  const n = Number(id);
  return Number.isInteger(n) && n > 0;
}

function sendValidation(res, errors) {
  return res.status(400).json({ errors }); // errors: [{ field, message }]
}


// Test-Route
//app.get('/', (req, res) => {
  //res.send('DigiStamp Backend läuft!');
//});

// Registrierung (PASSWORT HASHEN)
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const errors = [];
    if (!email || !isValidEmail(email)) errors.push({ field: "email", message: "Bitte eine gültige E-Mail-Adresse eingeben." });
    if (!password || String(password).trim().length < 6) errors.push({ field: "password", message: "Passwort muss mindestens 6 Zeichen haben." });

    // name optional, aber wenn vorhanden: nicht nur Leerzeichen
    if (name !== undefined && String(name).trim().length === 0) {
      errors.push({ field: "name", message: "Name darf nicht leer sein." });
    }

    if (errors.length) return sendValidation(res, errors);

    const hashedPassword = await bcrypt.hash(String(password), SALT_ROUNDS);

    const regSql =
      'INSERT INTO users (name, email, password, stamps) VALUES (?,?,?,0)';

    db.run(regSql, [name ? String(name).trim() : null, String(email).trim(), hashedPassword], function (err) {
      if (err) {
        console.error(err);
        if (err.code === 'SQLITE_CONSTRAINT') {
          return res.status(400).json({ errors: [{ field: "email", message: "E-Mail ist bereits registriert!" }] });
        }
        return res.status(500).json({ error: 'Datenbankfehler bei der Registrierung!' });
      }

      res.status(201).json({
        id: this.lastID,
        name: name ? String(name).trim() : '',
        email: String(email).trim(),
        stamps: 0
      });
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Serverfehler bei der Registrierung!' });
  }
});

// Login (HASH VERGLEICHEN)
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  const errors = [];
  if (!email || !isValidEmail(email)) errors.push({ field: "email", message: "Bitte eine gültige E-Mail-Adresse eingeben." });
  if (!password) errors.push({ field: "password", message: "Bitte Passwort eingeben." });
  if (errors.length) return sendValidation(res, errors);

  const loginSql =
    'SELECT id, name, email, password, stamps FROM users WHERE email = ?';

  db.get(loginSql, [String(email).trim()], async (err, row) => {
    try {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Datenbankfehler beim Login!' });
      }
      if (!row) {
        // absichtlich generisch
        return res.status(401).json({ error: 'E-Mail oder Passwort falsch!' });
      }

      const ok = await bcrypt.compare(String(password), row.password);
      if (!ok) {
        return res.status(401).json({ error: 'E-Mail oder Passwort falsch!' });
      }

      res.json({
        id: row.id,
        name: row.name,
        email: row.email,
        stamps: row.stamps
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Serverfehler beim Login!' });
    }
  });
});


// User-Daten holen
app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) {
    return sendValidation(res, [{ field: "id", message: "Ungültige User-ID." }]);
  }

  db.get(
    'SELECT id, name, email, stamps FROM users WHERE id = ?',
    [id],
    (err, row) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Fehler bei der Datenbank.' });
      }
      if (!row) {
        return res.status(404).json({ error: 'User nicht gefunden.' });
      }

      res.json(row);
    }
  );
});

// User-Daten aktualisieren
app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;

  if (!isValidId(id)) return sendValidation(res, [{ field: "id", message: "Ungültige User-ID." }]);

  const errors = [];
  if (name !== undefined && String(name).trim().length === 0) errors.push({ field: "name", message: "Name darf nicht leer sein." });
  if (email !== undefined && String(email).trim() !== "" && !isValidEmail(email)) errors.push({ field: "email", message: "Bitte eine gültige E-Mail-Adresse eingeben." });
  if (password !== undefined && String(password).trim() !== "" && String(password).trim().length < 6) errors.push({ field: "password", message: "Passwort muss mindestens 6 Zeichen haben." });
  if (errors.length) return sendValidation(res, errors);

  db.get('SELECT id, name, email, password, stamps FROM users WHERE id = ?', [id], async (err, row) => {
    try {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Fehler bei der Datenbank!' });
      }
      if (!row) {
        return res.status(404).json({ error: 'User nicht gefunden!' });
      }

      const newName = (name && String(name).trim() !== '') ? String(name).trim() : row.name;
      const newEmail = (email && String(email).trim() !== '') ? String(email).trim() : row.email;

      let newPasswordHash = row.password;
      if (password && String(password).trim() !== '') {
        newPasswordHash = await bcrypt.hash(String(password).trim(), SALT_ROUNDS);
      }

      db.run(
        'UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?',
        [newName, newEmail, newPasswordHash, id],
        function (err2) {
          if (err2) {
            console.error(err2);
            if (err2.code === 'SQLITE_CONSTRAINT') {
              return res.status(400).json({ errors: [{ field: "email", message: "E-Mail ist bereits vergeben!" }] });
            }
            return res.status(500).json({ error: 'Fehler bei Aktualisieren!' });
          }

          res.json({
            id: Number(id),
            name: newName,
            email: newEmail,
            stamps: row.stamps
          });
        }
      );
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Serverfehler beim Profil-Update!' });
    }
  });
});

// Stempel hinzufügen
app.post('/api/users/:id/scan', (req, res) => {
  const { id } = req.params;

  db.get('SELECT stamps FROM users WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Fehler bei der Datenbank.' });
    }
    if (!row) {
      return res.status(404).json({ error: 'User nicht gefunden.' });
    }

    const maxStamps = 5;
    const newStamps = Math.min(row.stamps + 1, maxStamps);

    db.run(
      'UPDATE users SET stamps = ? WHERE id = ?',
      [newStamps, id],
      (err2) => {
        if (err2) {
          console.error(err2);
          return res.status(500).json({ error: 'Fehler beim Aktualisieren der Stempel.' });
        }

        res.json({ id: Number(id), stamps: newStamps });
      }
    );
  });
});

// Stempel einlösen
app.post('/api/users/:id/redeem', (req, res) => {
  const { id } = req.params;

  db.run(
    'UPDATE users SET stamps = 0 WHERE id = ?',
    [id],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Fehler beim Einlösen.' });
      }

      res.json({ id: Number(id), stamps: 0 });
    }
  );
});

// NFC/Link-Route (iPhone/Android): öffnet URL und gibt Stempel 
/*
app.get("/stamp", (req, res) => {
  const id = req.query.id;

  if (!isValidId(id)) {
    return res.status(400).send("Ungültige oder fehlende User-ID.");
  }

  db.get("SELECT stamps FROM users WHERE id = ?", [id], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Datenbankfehler.");
    }
    if (!row) {
      return res.status(404).send("User nicht gefunden.");
    }

    const maxStamps = 5;
    const newStamps = Math.min(row.stamps + 1, maxStamps);

    db.run("UPDATE users SET stamps = ? WHERE id = ?", [newStamps, id], (err2) => {
      if (err2) {
        console.error(err2);
        return res.status(500).send("Fehler beim Aktualisieren der Stempel.");
      }

      res.send(`
        <h1>Stempel erhalten!</h1>
        <p>User: ${Number(id)}</p>
        <p>Stempelstand: ${newStamps}/${maxStamps}</p>
        <p>Du kannst dieses Fenster jetzt schließen.</p>
      `);
    });
  });
});

*/


// Server starten
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
