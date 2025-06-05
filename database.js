const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./usuarios.db"); // crea el archivo si no existe

// Crea la tabla si no existe
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      usuario TEXT UNIQUE NOT NULL,
      contrasena TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('admin', 'docente', 'alumno'))
    )
  `);
});

module.exports = db;
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS matriculas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      matricula TEXT UNIQUE,
      nombres TEXT,
      apellido_paterno TEXT,
      apellido_materno TEXT,
      grado TEXT,
      grupo TEXT,
      ciclo_escolar TEXT,
      tipo TEXT,
      foto TEXT
    )
  `);
});
