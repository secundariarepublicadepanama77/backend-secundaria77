const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.options('*', cors()); // ✅ << ESTA LÍNEA
app.use(express.json());


// Supabase config
const supabase = createClient(
  "https://ohjdzyzckqeepbnezcem.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oamR6eXpja3FlZXBibmV6Y2VtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxODIzNTUsImV4cCI6MjA2NDc1ODM1NX0.6Qtr7jk8Grr18FxRctmQqK_mZoNUsSaq8SUhZItFSk8"
);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Test de conexión
app.get("/probar-supabase", async (req, res) => {
  const { data, error } = await supabase.from("tabla_usuarios").select("*").limit(1);
  if (error) return res.status(500).json({ error: "❌ No se pudo conectar a Supabase" });
  res.json({ mensaje: "✅ Conectado correctamente", ejemplo: data });
});

// Ruta raíz
app.get("/", (req, res) => {
  res.send("¡Servidor de Secundaria 77 funcionando correctamente! ✅");
});

// Usuarios administrativos
app.post("/api/usuarios", async (req, res) => {
  const { nombre, usuario, contrasena, tipo } = req.body;
  if (!nombre || !usuario || !contrasena || !tipo)
    return res.status(400).json({ error: "Todos los campos son obligatorios" });

  const { error } = await supabase
    .from("tabla_admon")
    .insert([{ nombre, usuario, contrasena, tipo }]);

  if (error) {
    if (error.message.includes("duplicate")) {
      return res.status(400).json({ error: "El usuario ya existe" });
    }
    return res.status(500).json({ error: "Error al agregar usuario" });
  }

  res.status(201).json({ mensaje: "Usuario agregado correctamente" });
});

app.post("/api/login", async (req, res) => {
  const { usuario, contrasena } = req.body;
  if (!usuario || !contrasena)
    return res.status(400).json({ error: "Faltan campos" });

  const { data, error } = await supabase
    .from("tabla_admon")
    .select("*")
    .eq("usuario", usuario)
    .eq("contrasena", contrasena)
    .limit(1);

  if (error || !data || data.length === 0)
    return res.status(401).json({ error: "Credenciales inválidas" });

  const usuarioLogeado = data[0];
  res.json({
    mensaje: "Inicio de sesión exitoso",
    tipo: usuarioLogeado.tipo,
    nombre: usuarioLogeado.nombre
  });
});

app.get("/api/usuarios", async (req, res) => {
  const { data, error } = await supabase
    .from("tabla_admon")
    .select("id, nombre, usuario, tipo")
    .order("id", { ascending: false });
  if (error) return res.status(500).json({ error: "Error al obtener usuarios" });
  res.json(data);
});

app.delete("/api/usuarios/:id", async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from("tabla_admon").delete().eq("id", id);
  if (error) return res.status(500).json({ error: "Error al eliminar usuario" });
  res.json({ mensaje: "Usuario eliminado correctamente" });
});

// Login solo admin
app.post("/api/login-admin", async (req, res) => {
  const { usuario, contrasena } = req.body;
  const { data, error } = await supabase
    .from("tabla_admon")
    .select("*")
    .eq("usuario", usuario)
    .eq("contrasena", contrasena)
    .limit(1);

  if (error || !data || data.length === 0)
    return res.status(401).json({ success: false, mensaje: "Credenciales inválidas" });

  const admin = data[0];
  if (admin.tipo !== "admin")
    return res.status(403).json({ success: false, mensaje: "Acceso denegado" });

  res.json({ success: true, mensaje: "Inicio de sesión exitoso", tipo: admin.tipo, nombre: admin.nombre });
});

// 📝 Registrar nuevo usuario en tabla_usuarios (matrículas)
app.post("/api/matriculas", async (req, res) => {
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

  const { data, error } = await supabase
    .from("tabla_usuarios")
    .insert([{
      matricula,
      nombres,
      apellido_paterno,
      apellido_materno,
      grado,
      grupo,
      ciclo_escolar,
      tipo,
      foto
    }]);

  if (error) {
    console.error("❌ Error al registrar usuario:", error.message);
    return res.status(500).json({ success: false, mensaje: "Error al registrar usuario" });
  }

  res.status(201).json({ success: true, mensaje: "Usuario registrado correctamente" });
});
// 📄 Obtener todos los usuarios registrados en tabla_usuarios
app.get("/api/matriculas", async (req, res) => {
  const { data, error } = await supabase
    .from("tabla_usuarios")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    console.error("❌ Error al obtener registros:", error.message);
    return res.status(500).json({ error: "Error al obtener registros" });
  }

  res.json(data);
});
// ✏️ Editar usuario en tabla_usuarios
app.post("/api/matriculas/editar", async (req, res) => {
  const {
    id, matricula, nombres, apellido_paterno,
    apellido_materno, grado, grupo, ciclo_escolar, tipo, foto
  } = req.body;

  const { error } = await supabase
    .from("tabla_usuarios")
    .update({
      matricula,
      nombres,
      apellido_paterno,
      apellido_materno,
      grado,
      grupo,
      ciclo_escolar,
      tipo,
      foto
    })
    .eq("id", id);

  if (error) {
    console.error("❌ Error al actualizar usuario:", error.message);
    return res.status(500).json({ success: false, mensaje: "Error al actualizar usuario" });
  }

  res.json({ success: true, mensaje: "Usuario actualizado correctamente" });
});
// 🗑️ Eliminar usuario de tabla_usuarios por matrícula
app.delete("/api/matriculas/:matricula", async (req, res) => {
  const { matricula } = req.params;

  const { error } = await supabase
    .from("tabla_usuarios")
    .delete()
    .eq("matricula", matricula);

  if (error) {
    console.error("❌ Error al eliminar usuario:", error.message);
    return res.status(500).json({ success: false, mensaje: "Error al eliminar" });
  }

  res.json({ success: true, mensaje: "Usuario eliminado correctamente" });
});
// Actualizar horarios
app.post("/actualizar-horarios", async (req, res) => {
  const { id, entrada, salida } = req.body;
  const { error } = await supabase
    .from("tabla_registro")
    .update({ hora_entrada: entrada, hora_salida: salida })
    .eq("id", id);
  if (error) return res.status(500).json({ success: false, mensaje: "Error al actualizar" });
  res.json({ success: true, mensaje: "Actualizado correctamente" });
});
app.get("/api/reportes/:matricula", async (req, res) => {
  const { matricula } = req.params;
  const { data, error } = await supabase
    .from("reportes_conducta")
    .select("*")
    .eq("matricula", matricula)
    .order("id", { ascending: false });
  if (error) return res.status(500).json({ success: false, mensaje: "Error al obtener reportes" });
  res.json(data);
});
// ✅ Ruta para registrar asistencia
app.post("/api/registrar", async (req, res) => {
  const { matricula } = req.body;
  const hoy = new Date().toISOString().split("T")[0];
  const horaActual = new Date().toLocaleTimeString("es-MX");

  const { data: usuarios, error: errorUsuario } = await supabase
    .from("tabla_usuarios")
    .select("*")
    .eq("matricula", matricula)
    .limit(1);

  if (errorUsuario || usuarios.length === 0) {
    return res.json({ tipo: "fallido" });
  }

  const usuario = usuarios[0];
  const nombreCompleto = `${usuario.nombres} ${usuario.apellido_paterno} ${usuario.apellido_materno}`;

  const { data: registrosHoy, error: errorRegistro } = await supabase
    .from("tabla_registro")
    .select("*")
    .eq("matricula", matricula)
    .eq("fecha", hoy)
    .limit(1);

  if (errorRegistro) {
    return res.status(500).json({ tipo: "fallido" });
  }

  if (registrosHoy.length === 0) {
    await supabase.from("tabla_registro").insert([{
      matricula: usuario.matricula,
      nombres: usuario.nombres,
      apellido_paterno: usuario.apellido_paterno,
      apellido_materno: usuario.apellido_materno,
      grado: usuario.grado,
      grupo: usuario.grupo,
      ciclo_escolar: usuario.ciclo_escolar,
      tipo: usuario.tipo,
      foto: usuario.foto,
      fecha: hoy,
      hora_entrada: horaActual
    }]);

    return res.json({
      nombre: nombreCompleto,
      tipo: usuario.tipo,
      foto: usuario.foto,
      registro: "entrada",
      hora: horaActual
    });
  }

  const registroExistente = registrosHoy[0];

  if (!registroExistente.hora_salida) {
    await supabase
      .from("tabla_registro")
      .update({ hora_salida: horaActual })
      .eq("id", registroExistente.id);

    return res.json({
      nombre: nombreCompleto,
      tipo: usuario.tipo,
      foto: usuario.foto,
      registro: "salida",
      hora: horaActual
    });
  }

  return res.json({
    nombre: nombreCompleto,
    tipo: usuario.tipo,
    foto: usuario.foto,
    registro: "ya_registrado",
    hora: horaActual
  });
});

// ✅ Consultar registros
app.get("/registros", async (req, res) => {
  const { data, error } = await supabase
    .from("tabla_registro")
    .select("*")
    .order("id", { ascending: false });

  if (error) return res.status(500).json({ error: "❌ No se pudieron obtener los registros" });

  res.json(data);
});

// ✅ Eliminar registro
app.delete("/eliminar-registro/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("tabla_registro")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("❌ Error al eliminar registro:", error.message);
    return res.status(500).json({ success: false, mensaje: "Error al eliminar el registro." });
  }

  res.json({ success: true, mensaje: "Registro eliminado correctamente." });
});

// ✅ Guardar nuevo reporte
app.post("/api/reportes", async (req, res) => {
  const { matricula, nombre_completo, grado, grupo, quien_reporta, clase, hora, descripcion } = req.body;

  if (!matricula || !quien_reporta || !descripcion) {
    return res.status(400).json({ success: false, mensaje: "Faltan campos obligatorios" });
  }

  const { error } = await supabase.from("reportes_conducta").insert([{
    matricula,
    nombre_completo,
    grado,
    grupo,
    quien_reporta,
    clase,
    hora,
    descripcion
  }]);

  if (error) {
    console.error("❌ Error al guardar el reporte:", error.message);
    return res.status(500).json({ success: false, mensaje: "Error al guardar el reporte" });
  }

  res.json({ success: true, mensaje: "Reporte guardado correctamente" });
});

// ✅ Obtener reportes por matrícula
app.get("/api/reportes/:matricula", async (req, res) => {
  const { matricula } = req.params;

  const { data, error } = await supabase
    .from("reportes_conducta")
    .select("*")
    .eq("matricula", matricula)
    .order("fecha", { ascending: false });

  if (error) {
    console.error("❌ Error al obtener reportes:", error.message);
    return res.status(500).json({ success: false, mensaje: "Error al obtener reportes" });
  }

  res.json(data);
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en: http://localhost:${PORT}`);
});
