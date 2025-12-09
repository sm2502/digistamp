const express = require('express');
const cors = require('cors');
const app = express();
const db = require('./db');

app.use(cors());
app.use(express.json());

// Test-Route
app.get('/', (req, res) => {
  res.send('DigiStamp Backend läuft!');
});


// Registrierung
app.post('/api/register', (req, res) => {

  const { name, email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich!' });
  }

  const regSql =
    'INSERT INTO users (name, email, password, stamps) VALUES (?,?,?,0)';

  db.run(regSql, [name || null, email, password], function (err) {

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

});



// Login
app.post('/api/login', (req, res) => {

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich!' });
  }

  const loginSql =
    'SELECT id, name, email, stamps FROM users WHERE email = ? AND password = ?';

  db.get(loginSql, [email, password], (err, row) => {

    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Datenbankfehler beim Login!' });
    }

    if (!row) {
      return res.status(401).json({ error: 'E-Mail oder Passwort falsch!' });
    }

    res.json(row);

  });

});


//User-Daten holen
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


//Stempel hinzufügen
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

    //Maximale Stempelanzahl
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


//Stempel einlösen (stempelcount auf 0 setzen)
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


//Profil aktualisieren
app.put('/api/users/:id', (req, res) => {

  const { id } = req.params;
  const { name, email, password } = req.body;

  //Nutzer von Datenbnak holen
  db.get('SELECT id, name, email, password, stamps FROM users WHERE id = ?', [id], (err, row) => {

    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Fehler bei der Datenbank!' });
    }

    if (!row) {
      return res.status(404).json({ error: 'User nicht gefunden!' });
    }


    const newName = (name && name.trim() !== '') ? name.trim() : row.name;
    const newEmail = (email && email.trim() !== '') ? email.trim() : row.email;
    const newPassword = (password && password.trim() !== '') ? password.trim() : row.password;

    db.run(
      'UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?',
      [newName, newEmail, newPassword, id],
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

  });

});



// Server starten
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));