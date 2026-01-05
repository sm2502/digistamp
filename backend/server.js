const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
const db = require('./db');

app.use(cors());
app.use(express.json());

const SALT_ROUNDS = 10;

// Test-Route
app.get('/', (req, res) => {
  res.send('DigiStamp Backend läuft!');
});

// Registrierung (PASSWORT HASHEN)
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich!' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const regSql =
      'INSERT INTO users (name, email, password, stamps) VALUES (?,?,?,0)';

    db.run(regSql, [name || null, email, hashedPassword], function (err) {
      if (err) {
        console.error(err);
        if (err.code === 'SQLITE_CONSTRAINT') {
          return res.status(400).json({ error: 'E-Mail ist bereits registriert!' });
        }
        return res.status(500).json({ error: 'Datenbankfehler bei der Registrierung!' });
      }

      res.status(201).json({
        id: this.lastID,
        name: name || '',
        email,
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

  if (!email || !password) {
    return res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich!' });
  }

  // Passwort-Hash muss mit ausgewählt werden
  const loginSql =
    'SELECT id, name, email, password, stamps FROM users WHERE email = ?';

  db.get(loginSql, [email], async (err, row) => {
    try {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Datenbankfehler beim Login!' });
      }

      if (!row) {
        return res.status(401).json({ error: 'E-Mail oder Passwort falsch!' });
      }

      const ok = await bcrypt.compare(password, row.password);
      if (!ok) {
        return res.status(401).json({ error: 'E-Mail oder Passwort falsch!' });
      }

      // Passwort nicht zurückgeben
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

// Profil aktualisieren (Passwort nur hashen, wenn gesetzt)
app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;

  db.get('SELECT id, name, email, password, stamps FROM users WHERE id = ?', [id], async (err, row) => {
    try {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Fehler bei der Datenbank!' });
      }

      if (!row) {
        return res.status(404).json({ error: 'User nicht gefunden!' });
      }

      const newName = (name && name.trim() !== '') ? name.trim() : row.name;
      const newEmail = (email && email.trim() !== '') ? email.trim() : row.email;

      // Default: altes Passwort-Hash behalten
      let newPasswordHash = row.password;

      // Wenn neues Passwort eingegeben wurde: hashen
      if (password && password.trim() !== '') {
        newPasswordHash = await bcrypt.hash(password.trim(), SALT_ROUNDS);
      }

      db.run(
        'UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?',
        [newName, newEmail, newPasswordHash, id],
        function (err2) {
          if (err2) {
            console.error(err2);
            if (err2.code === 'SQLITE_CONSTRAINT') {
              return res.status(400).json({ error: 'E-Mail ist bereits vergeben!' });
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

// Server starten
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
