const express = require("express");
const cors = require("cors");
const db = require("./database");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // Servir frontend desde /public

// 🟢 AGREGAR USUARIO
app.post("/api/usuarios", (req, res) => {
  const { nombre, usuario, contrasena, tipo } = req.body;

  if (!nombre || !usuario || !contrasena || !tipo) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  const stmt = `
    INSERT INTO usuarios (nombre, usuario, contrasena, tipo)
    VALUES (?, ?, ?, ?)
  `;

  db.run(stmt, [nombre, usuario, contrasena, tipo], function (err) {
    if (err) {
      if (err.message.includes("UNIQUE")) {
        return res.status(400).json({ error: "El usuario ya existe" });
      }
      return res.status(500).json({ error: "Error en el servidor" });
    }

    res.status(201).json({ mensaje: "Usuario agregado", id: this.lastID });
  });
});

// 🔐 LOGIN DE USUARIOS
app.post("/api/login", (req, res) => {
  const { usuario, contrasena } = req.body;

  if (!usuario || !contrasena) {
    return res.status(400).json({ error: "Faltan campos" });
  }

  const query = `
    SELECT * FROM usuarios WHERE usuario = ? AND contrasena = ?
  `;

  db.get(query, [usuario, contrasena], (err, row) => {
    if (err) {
      return res.status(500).json({ error: "Error del servidor" });
    }

    if (!row) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    res.json({
      mensaje: "Inicio de sesión exitoso",
      tipo: row.tipo, // 'admin', 'docente' o 'alumno'
      nombre: row.nombre
    });
  });
});
// Obtener todos los usuarios
app.get("/api/usuarios", (req, res) => {
    const query = `SELECT id, nombre, usuario, tipo FROM usuarios ORDER BY id DESC`;
    db.all(query, [], (err, rows) => {
      if (err) return res.status(500).json({ error: "Error al obtener usuarios" });
      res.json(rows);
    });
  });
// Eliminar usuario por ID
app.delete("/api/usuarios/:id", (req, res) => {
    const id = req.params.id;
    const stmt = `DELETE FROM usuarios WHERE id = ?`;
  
    db.run(stmt, [id], function (err) {
      if (err) return res.status(500).json({ error: "Error al eliminar usuario" });
  
      if (this.changes === 0) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
  
      res.json({ mensaje: "Usuario eliminado correctamente" });
    });
  });
  // 🔐 LOGIN SOLO ADMINISTRATIVOS
  app.post("/api/login-admin", (req, res) => {
    const { usuario, contrasena } = req.body;
  
    if (!usuario || !contrasena) {
      return res.status(400).json({ success: false, mensaje: "Faltan campos" });
    }
  
    const query = `
      SELECT * FROM usuarios WHERE usuario = ? AND contrasena = ?
    `;
  
    db.get(query, [usuario, contrasena], (err, row) => {
      if (err) {
        return res.status(500).json({ success: false, mensaje: "Error del servidor" });
      }
  
      if (!row) {
        return res.status(401).json({ success: false, mensaje: "Credenciales inválidas" });
      }
  
      if (row.tipo !== "admin") {
        return res.status(403).json({ success: false, mensaje: "Acceso solo para administrativos" });
      }
  
      res.json({
        success: true,
        mensaje: "Inicio de sesión exitoso",
        tipo: row.tipo,
        nombre: row.nombre
      });
    });
  }); 
// 📝 Registrar nuevo usuario en la tabla matriculas
app.post("/api/matriculas", (req, res) => {
  const {
    matricula,
    nombres,
    apellido_paterno,
    apellido_materno,
    grado,
    grupo,
    ciclo_escolar,
    tipo,
    foto
  } = req.body;

  if (!matricula || !nombres || !apellido_paterno || !apellido_materno || !ciclo_escolar || !tipo) {
    return res.status(400).json({ success: false, mensaje: "Faltan campos obligatorios" });
  }

  const query = `
    INSERT INTO matriculas (matricula, nombres, apellido_paterno, apellido_materno, grado, grupo, ciclo_escolar, tipo, foto)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [matricula, nombres, apellido_paterno, apellido_materno, grado, grupo, ciclo_escolar, tipo, foto], function(err) {
    if (err) {
      console.error("Error al insertar en matriculas:", err.message);
      return res.status(500).json({ success: false, mensaje: "Error al registrar usuario" });
    }
    res.status(201).json({ success: true, mensaje: "Usuario registrado correctamente" });
  });
});
app.get("/api/matriculas", (req, res) => {
  const query = `SELECT * FROM matriculas ORDER BY id DESC`;
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("Error al obtener registros:", err.message);
      return res.status(500).json({ error: "Error al obtener registros" });
    }
    res.json(rows);
  });
});
app.post("/api/matriculas/editar", (req, res) => {
  const {
    id, matricula, nombres, apellido_paterno,
    apellido_materno, grado, grupo, ciclo_escolar, tipo, foto
  } = req.body;

  const query = `
    UPDATE matriculas SET
      matricula = ?, nombres = ?, apellido_paterno = ?, apellido_materno = ?,
      grado = ?, grupo = ?, ciclo_escolar = ?, tipo = ?, foto = ?
    WHERE id = ?
  `;

  db.run(query, [matricula, nombres, apellido_paterno, apellido_materno, grado, grupo, ciclo_escolar, tipo, foto, id], function(err) {
    if (err) {
      return res.status(500).json({ success: false, mensaje: "Error al actualizar" });
    }
    res.json({ success: true, mensaje: "Usuario actualizado correctamente" });
  });
});
// 🔧 ACTUALIZAR USUARIO DE TABLA matriculas
app.put("/api/matriculas", (req, res) => {
  const {
    matricula,
    nombres,
    apellido_paterno,
    apellido_materno,
    grado,
    grupo,
    ciclo_escolar,
    tipo
  } = req.body;

  const query = `
    UPDATE matriculas SET 
      nombres = ?, 
      apellido_paterno = ?, 
      apellido_materno = ?, 
      grado = ?, 
      grupo = ?, 
      ciclo_escolar = ?, 
      tipo = ?
    WHERE matricula = ?
  `;

  db.run(query, [nombres, apellido_paterno, apellido_materno, grado, grupo, ciclo_escolar, tipo, matricula], function(err) {
    if (err) {
      console.error("❌ Error al actualizar:", err.message);
      return res.status(500).json({ success: false, mensaje: "Error al actualizar usuario" });
    }
    res.json({ success: true, mensaje: "Usuario actualizado correctamente" });
  });
});
// 🗑️ ELIMINAR USUARIO DE MATRICULAS POR MATRÍCULA
app.delete("/api/matriculas/:matricula", (req, res) => {
  const matricula = req.params.matricula;
  console.log("➡️ Intentando eliminar matrícula:", matricula);

  const query = `DELETE FROM matriculas WHERE matricula = ?`;
  db.run(query, [matricula], function(err) {
    if (err) {
      console.error("❌ Error al eliminar:", err.message);
      return res.status(500).json({ success: false, mensaje: "Error al eliminar" });
    }

    if (this.changes === 0) {
      return res.status(404).json({ success: false, mensaje: "Usuario no encontrado" });
    }

    res.json({ success: true, mensaje: "Usuario eliminado correctamente" });
  });
});
// 🕒 Registrar entrada o salida
app.post("/api/registrar", (req, res) => {
  const { matricula } = req.body;
  const hoy = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
  const horaActual = new Date().toLocaleTimeString("es-MX");

  db.get(`SELECT * FROM matriculas WHERE matricula = ?`, [matricula], (err, usuario) => {
    if (err || !usuario) {
      return res.json({ tipo: "fallido" });
    }

    db.get(
      `SELECT * FROM tabla_registro WHERE matricula = ? AND fecha = ?`,
      [matricula, hoy],
      (err, registroExistente) => {
        if (!registroExistente) {
          // No hay registro aún, guardar entrada
          const insertar = `
            INSERT INTO tabla_registro (matricula, nombres, apellido_paterno, apellido_materno, grado, grupo, ciclo_escolar, tipo, foto, fecha, hora_entrada)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          db.run(insertar, [
            usuario.matricula,
            usuario.nombres,
            usuario.apellido_paterno,
            usuario.apellido_materno,
            usuario.grado,
            usuario.grupo,
            usuario.ciclo_escolar,
            usuario.tipo,
            usuario.foto,
            hoy,
            horaActual
          ], () => {
            res.json({
              nombre: `${usuario.nombres} ${usuario.apellido_paterno} ${usuario.apellido_materno}`,
              tipo: usuario.tipo,
              foto: usuario.foto,
              registro: "entrada",
              hora: horaActual
            });
          });
        } else if (!registroExistente.hora_salida) {
          // Ya hay entrada, guardar salida
          db.run(
            `UPDATE tabla_registro SET hora_salida = ? WHERE id = ?`,
            [horaActual, registroExistente.id],
            () => {
              res.json({
                nombre: `${usuario.nombres} ${usuario.apellido_paterno} ${usuario.apellido_materno}`,
                tipo: usuario.tipo,
                foto: usuario.foto,
                registro: "salida",
                hora: horaActual
              });
            }
          );
        } else {
          // Ya tiene entrada y salida
          res.json({
            nombre: `${usuario.nombres} ${usuario.apellido_paterno} ${usuario.apellido_materno}`,
            tipo: usuario.tipo,
            foto: usuario.foto,
            registro: "ya_registrado",
            hora: horaActual
          });
        }
      }
    );
  });
});
app.get("/registros", (req, res) => {
  const query = "SELECT * FROM tabla_registro ORDER BY id DESC";
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("❌ Error al obtener registros:", err.message);
      return res.status(500).json({ error: "Error al obtener registros" });
    }
    res.json(rows);
  });
});
app.post("/actualizar-horarios", (req, res) => {
  const { id, entrada, salida } = req.body;

  const query = `
    UPDATE tabla_registro
    SET hora_entrada = ?, hora_salida = ?
    WHERE id = ?
  `;

  db.run(query, [entrada, salida, id], function (err) {
    if (err) {
      console.error("❌ Error al actualizar horarios:", err.message);
      return res.status(500).json({ success: false, mensaje: "Error al actualizar horarios" });
    }

    res.json({ success: true, mensaje: "Horarios actualizados correctamente" });
  });
});
app.delete("/eliminar-registro/:id", async (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM tabla_registro WHERE id = ?", [id], function(err) {
    if (err) {
      console.error("❌ Error al eliminar registro:", err.message);
      return res.status(500).json({ success: false, mensaje: "Error al eliminar el registro." });
    }

    if (this.changes === 0) {
      return res.status(404).json({ success: false, mensaje: "Registro no encontrado." });
    }

    res.json({ success: true, mensaje: "Registro eliminado correctamente." });
  });
});
// 📥 Guardar nuevo reporte
app.post("/api/reportes", (req, res) => {
  const { matricula, nombre_completo, grado, grupo, quien_reporta, clase, hora, descripcion } = req.body;

  if (!matricula || !quien_reporta || !descripcion) {
    return res.status(400).json({ success: false, mensaje: "Faltan campos obligatorios" });
  }

  const query = `
    INSERT INTO reportes_conducta (matricula, nombre_completo, grado, grupo, quien_reporta, clase, hora, descripcion)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [matricula, nombre_completo, grado, grupo, quien_reporta, clase, hora, descripcion], function(err) {
    if (err) {
      console.error("❌ Error al guardar el reporte:", err.message);
      return res.status(500).json({ success: false, mensaje: "Error al guardar el reporte" });
    }
    res.json({ success: true, mensaje: "Reporte guardado correctamente" });
  });
});

// 📤 Obtener todos los reportes de un alumno por matrícula
app.get("/api/reportes/:matricula", (req, res) => {
  const matricula = req.params.matricula;

  const query = `
    SELECT * FROM reportes_conducta WHERE matricula = ? ORDER BY fecha DESC, id DESC
  `;

  db.all(query, [matricula], (err, rows) => {
    if (err) {
      console.error("❌ Error al obtener reportes:", err.message);
      return res.status(500).json({ success: false, mensaje: "Error al obtener reportes" });
    }

    res.json(rows);
  });
});


// 🚀 Iniciar el servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en: http://localhost:${PORT}`);
});
