// GHOTS-CODER MOTOR v4.0 — By Faiiryz
// Analiza JS, HTML, JSON, CSS del proyecto completo

var acorn = require("acorn");
var estraverse = require("estraverse");
var fs = require("fs");
var path = require("path");

var args = process.argv.slice(2);
var FILE_TO_WATCH = (args[args.length - 1] || "index.js").trim();
var MODE = process.env.GHOTS_MODE || "ultra";

var SUPPORTED = [".js", ".mjs", ".cjs", ".ts", ".html", ".htm", ".json", ".css", ".scss", ".less"];
var IGNORE_DIRS = ["node_modules", ".git", "dist", "build", ".next", ".cache", "coverage", "__pycache__"];
var IGNORE_FILES = ["analisis.json", "package-lock.json", "yarn.lock", "bin.js", "motor.js"];

// ═══════════════════════════════════════════════
// ANALIZADOR JS / TS
// ═══════════════════════════════════════════════
function analyzeJS(filePath, source) {
  var errors = [];
  var warnings = [];
  var analysis = [];

  try {
    var cleanSource = source.replace(/^#!.*\n/, "// shebang\n");
    var ast = acorn.parse(cleanSource, {
      ecmaVersion: 2020,
      locations: true,
      sourceType: "module"
    });

    estraverse.traverse(ast, {
      enter: function (node) {
        // Mapeo de flujo
        if (node.type === "IfStatement")
          analysis.push({ line: node.loc.start.line, label: "DECISION / IF", style: "neon-green" });
        if (node.type === "ReturnStatement")
          analysis.push({ line: node.loc.start.line, label: "RETORNO", style: "neon-red" });
        if (node.type === "ThrowStatement")
          analysis.push({ line: node.loc.start.line, label: "LANZA ERROR", style: "neon-orange" });
        if (node.type === "TryStatement")
          analysis.push({ line: node.loc.start.line, label: "TRY/CATCH", style: "neon-blue" });

        // Variable declarada pero no usada
        if (node.type === "VariableDeclarator" && node.id && node.id.name) {
          var vn = node.id.name;
          var cnt = (source.match(new RegExp("\\b" + vn + "\\b", "g")) || []).length;
          if (cnt === 1) {
            warnings.push({
              line: node.loc.start.line,
              col: node.loc.start.column,
              type: "VARIABLE NO USADA",
              message: "La variable \"" + vn + "\" se declara aqui pero nunca se utiliza en el resto del codigo. Puedes eliminarla para mantener el codigo limpio.",
              severity: "warn"
            });
          }
        }

        // console.log en el codigo
        if (node.type === "CallExpression" &&
          node.callee && node.callee.type === "MemberExpression" &&
          node.callee.object && node.callee.object.name === "console") {
          var method = (node.callee.property && node.callee.property.name) || "log";
          warnings.push({
            line: node.loc.start.line,
            col: node.loc.start.column,
            type: "CONSOLE EN PRODUCCION",
            message: "Se encontro console." + method + "() en esta linea. Este tipo de llamadas deben eliminarse antes de subir el codigo a produccion porque exponen informacion en la consola del navegador.",
            severity: "info"
          });
        }
      }
    });

  } catch (e) {
    // Extraer numero de linea del error de acorn
    var raw = e.message || "Error de sintaxis desconocido";
    var mm = raw.match(/\((\d+):(\d+)\)/);
    var line = mm ? parseInt(mm[1], 10) : 1;
    var col = mm ? parseInt(mm[2], 10) : 0;

    // Traducir mensajes comunes al español
    var msg = raw.replace(/\(\d+:\d+\)/, "").trim();
    if (msg.indexOf("Unexpected token") !== -1)
      msg = "Token inesperado en esta posicion. Revisa si falta una coma, parentesis o llave de cierre cerca de esta linea.";
    else if (msg.indexOf("Unexpected end of input") !== -1)
      msg = "El archivo termina de forma inesperada. Probablemente falta cerrar una llave { }, un parentesis ( ) o un corchete [ ].";
    else if (msg.indexOf("Identifier") !== -1 && msg.indexOf("already been declared") !== -1)
      msg = "Esta variable ya fue declarada anteriormente. No puedes declarar la misma variable dos veces con 'let' o 'const' en el mismo bloque.";

    errors.push({
      line: line,
      col: col,
      type: "ERROR DE SINTAXIS",
      message: msg,
      severity: "error"
    });
  }

  return { errors: errors, warnings: warnings, analysis: analysis };
}

// ═══════════════════════════════════════════════
// ANALIZADOR JSON
// ═══════════════════════════════════════════════
function analyzeJSON(filePath, source) {
  var errors = [];
  var warnings = [];

  try {
    var parsed = JSON.parse(source);

    // Validaciones especificas para package.json
    if (path.basename(filePath) === "package.json") {
      if (!parsed.name)
        warnings.push({ line: 1, col: 0, type: "CAMPO FALTANTE", message: 'El campo "name" no esta definido en package.json. Este campo es obligatorio para publicar el paquete en npm.', severity: "warn" });
      if (!parsed.version)
        warnings.push({ line: 1, col: 0, type: "CAMPO FALTANTE", message: 'El campo "version" no esta definido en package.json. Sin version no puedes publicar el paquete correctamente.', severity: "warn" });
      if (!parsed.main && !parsed.bin)
        warnings.push({ line: 1, col: 0, type: "ENTRADA FALTANTE", message: 'No hay campo "main" ni "bin" en package.json. Node no sabra cual es el archivo principal del paquete.', severity: "warn" });
    }

  } catch (e) {
    var posM = (e.message || "").match(/position (\d+)/);
    var line = 1;
    if (posM) line = source.substring(0, parseInt(posM[1], 10)).split("\n").length;

    var msg = (e.message || "JSON invalido")
      .replace("Unexpected token", "Token inesperado —")
      .replace("Unexpected end of JSON input", "El JSON esta incompleto. Verifica que todas las llaves { } y corchetes [ ] esten correctamente cerrados.")
      .replace("Expected property name or '}'", "Se esperaba el nombre de una propiedad. Revisa si hay una coma extra al final de un objeto.");

    errors.push({ line: line, col: 0, type: "ERROR EN JSON", message: msg, severity: "error" });
  }

  return { errors: errors, warnings: warnings, analysis: [] };
}

// ═══════════════════════════════════════════════
// ANALIZADOR HTML
// ═══════════════════════════════════════════════
function analyzeHTML(filePath, source) {
  var errors = [];
  var warnings = [];
  var lines = source.split("\n");

  // Tags que no necesitan cerrarse
  var voidTags = { area: 1, base: 1, br: 1, col: 1, embed: 1, hr: 1, img: 1, input: 1, link: 1, meta: 1, param: 1, source: 1, track: 1, wbr: 1 };
  var openStack = [];

  // Regex para capturar tags HTML
  var tagRe = /<\/?([a-zA-Z][a-zA-Z0-9-]*)(\s[^>]*)?(\/?)>/g;
  var m;

  while ((m = tagRe.exec(source)) !== null) {
    var fullTag = m[0];
    var tagName = m[1].toLowerCase();   // <-- CORRECTO: m[1] es el nombre del tag
    var isClose = fullTag.charAt(1) === "/";
    var isSelfClose = m[3] === "/" || voidTags[tagName];
    var lineNum = source.substring(0, m.index).split("\n").length;

    if (!isClose && !isSelfClose) {
      openStack.push({ tag: tagName, line: lineNum });
    } else if (isClose) {
      if (openStack.length > 0 && openStack[openStack.length - 1].tag === tagName) {
        openStack.pop();
      } else if (openStack.length > 0) {
        var expected = openStack[openStack.length - 1].tag;
        errors.push({
          line: lineNum, col: 0,
          type: "TAG MAL CERRADO",
          message: "Se encontro </" + tagName + "> pero se esperaba </" + expected + ">. El orden de cierre de los tags HTML debe ser el inverso al de apertura.",
          severity: "error"
        });
      }
    }
  }

  // Tags que quedaron abiertos
  openStack.forEach(function (o) {
    errors.push({
      line: o.line, col: 0,
      type: "TAG SIN CERRAR",
      message: "El tag <" + o.tag + "> fue abierto en la linea " + o.line + " pero nunca se cerro. Agrega </" + o.tag + "> en el lugar correcto.",
      severity: "error"
    });
  });

  // Revisiones linea por linea
  lines.forEach(function (line, i) {
    var ln = i + 1;

    if (line.indexOf("<img") !== -1 && line.indexOf("alt=") === -1)
      warnings.push({ line: ln, col: 0, type: "ACCESIBILIDAD", message: "La imagen en esta linea no tiene el atributo 'alt'. Esto es importante para personas con discapacidad visual y para el SEO de tu sitio.", severity: "warn" });

    if (line.indexOf("<a ") !== -1 && line.indexOf("href") === -1)
      warnings.push({ line: ln, col: 0, type: "ENLACE SIN DESTINO", message: "El tag <a> en esta linea no tiene atributo 'href'. El enlace no llevara a ninguna parte cuando el usuario haga click.", severity: "warn" });

    if (line.match(/on(click|load|error|submit|change)=/))
      warnings.push({ line: ln, col: 0, type: "EVENTO INLINE", message: "Se detecta un evento JavaScript directamente en el HTML (onclick, onload, etc). Es mejor practica moverlo a un archivo .js separado para mantener el codigo organizado.", severity: "info" });

    if (line.match(/style\s*=\s*"/))
      warnings.push({ line: ln, col: 0, type: "ESTILO INLINE", message: "Hay estilos CSS escritos directamente en el elemento HTML. Es mejor moverlos a un archivo .css o usar clases para facilitar el mantenimiento.", severity: "info" });
  });

  if (!source.trim().toLowerCase().startsWith("<!doctype"))
    warnings.push({ line: 1, col: 0, type: "DOCTYPE FALTANTE", message: "El archivo HTML no comienza con <!DOCTYPE html>. Sin esto, el navegador puede interpretar la pagina en 'modo quirks', lo que puede causar problemas de visualizacion.", severity: "warn" });

  return { errors: errors, warnings: warnings, analysis: [] };
}

// ═══════════════════════════════════════════════
// ANALIZADOR CSS
// ═══════════════════════════════════════════════
function analyzeCSS(filePath, source) {
  var errors = [];
  var warnings = [];
  var lines = source.split("\n");
  var braces = 0;

  lines.forEach(function (line, i) {
    var ln = i + 1;
    braces += (line.match(/{/g) || []).length;
    braces -= (line.match(/}/g) || []).length;

    var emptyProp = line.match(/^\s*([\w-]+)\s*:\s*;/);
    if (emptyProp)
      errors.push({ line: ln, col: 0, type: "PROPIEDAD VACIA", message: "La propiedad CSS \"" + emptyProp[1] + "\" esta declarada pero sin ningun valor. Asignale un valor o elimina la declaracion.", severity: "error" });

    if (line.indexOf("!important") !== -1)
      warnings.push({ line: ln, col: 0, type: "USO DE !IMPORTANT", message: "El uso de !important en esta linea puede causar problemas al sobrescribir estilos mas adelante. Usalo solo cuando sea absolutamente necesario.", severity: "info" });
  });

  if (braces !== 0)
    errors.push({ line: lines.length, col: 0, type: "LLAVES DESBALANCEADAS", message: "Las llaves { } del archivo CSS no estan balanceadas. Hay " + Math.abs(braces) + " llave(s) " + (braces > 0 ? "que se abren pero nunca se cierran" : "de cierre que no tienen apertura correspondiente") + ".", severity: "error" });

  return { errors: errors, warnings: warnings, analysis: [] };
}

// ═══════════════════════════════════════════════
// ANALISIS GENERICO (para cualquier archivo)
// ═══════════════════════════════════════════════
function analyzeGeneric(source) {
  var warnings = [];
  source.split("\n").forEach(function (line, i) {
    var ln = i + 1;
    if (line.length > 200)
      warnings.push({ line: ln, col: 0, type: "LINEA MUY LARGA", message: "Esta linea tiene " + line.length + " caracteres. Las lineas muy largas dificultan la lectura. Se recomienda un maximo de 120 caracteres.", severity: "info" });
    if (line.indexOf("TODO") !== -1 || line.indexOf("FIXME") !== -1 || line.indexOf("HACK") !== -1) {
      var tipo = line.indexOf("FIXME") !== -1 ? "FIXME" : line.indexOf("HACK") !== -1 ? "HACK" : "TODO";
      warnings.push({ line: ln, col: 0, type: "TAREA PENDIENTE (" + tipo + ")", message: "Hay una tarea pendiente marcada como " + tipo + ": " + line.trim().substring(0, 100), severity: "warn" });
    }
  });
  return warnings;
}

// ═══════════════════════════════════════════════
// ANALIZAR UN ARCHIVO
// ═══════════════════════════════════════════════
function analyzeFile(filePath) {
  var ext = path.extname(filePath).toLowerCase();
  var source = "";

  try {
    source = fs.readFileSync(filePath, "utf8");
  } catch (e) {
    return {
      errors: [{ line: 1, col: 0, type: "ERROR DE LECTURA", message: "No se pudo leer el archivo: " + e.message, severity: "error" }],
      warnings: [],
      analysis: [],
      source: ""
    };
  }

  var result;
  if ([".js", ".mjs", ".cjs", ".ts"].indexOf(ext) !== -1)
    result = analyzeJS(filePath, source);
  else if (ext === ".json")
    result = analyzeJSON(filePath, source);
  else if ([".html", ".htm"].indexOf(ext) !== -1)
    result = analyzeHTML(filePath, source);
  else if ([".css", ".scss", ".less"].indexOf(ext) !== -1)
    result = analyzeCSS(filePath, source);
  else
    result = { errors: [], warnings: [], analysis: [] };

  // Analisis generico adicional
  var extra = analyzeGeneric(source);
  result.warnings = result.warnings.concat(extra);
  result.source = source;
  return result;
}

// ═══════════════════════════════════════════════
// ESCANEAR TODO EL PROYECTO
// ═══════════════════════════════════════════════
function scanProject() {
  var results = [];

  function walk(dir) {
    var entries;
    try { entries = fs.readdirSync(dir); } catch (e) { return; }

    for (var i = 0; i < entries.length; i++) {
      var name = entries[i];

      // Ignorar directorios y archivos especiales
      if (IGNORE_DIRS.indexOf(name) !== -1) continue;
      if (IGNORE_FILES.indexOf(name) !== -1) continue;

      var fullPath = path.join(dir, name);
      var stat;
      try { stat = fs.statSync(fullPath); } catch (e) { continue; }

      if (stat.isDirectory()) {
        walk(fullPath);
        continue;
      }

      var ext = path.extname(name).toLowerCase();
      if (SUPPORTED.indexOf(ext) === -1) continue;

      var rel = path.relative(".", fullPath);
      var r = analyzeFile(fullPath);

      results.push({
        name: rel,
        ext: ext,
        errors: r.errors,
        warnings: r.warnings,
        analysis: r.analysis,
        source: r.source,
        errorCount: r.errors.length,
        warningCount: r.warnings.length,
        status: r.errors.length > 0 ? "ERROR" : r.warnings.length > 0 ? "WARN" : "OK"
      });
    }
  }

  walk(".");
  return results;
}

// ═══════════════════════════════════════════════
// CICLO PRINCIPAL DE ANALISIS
// ═══════════════════════════════════════════════
var isProcessing = false;

function runAnalysis() {
  if (isProcessing) return;
  isProcessing = true;

  try {
    var files = scanProject();
    var totalErrors = 0;
    var totalWarnings = 0;
    var filesWithErr = [];

    files.forEach(function (f) {
      totalErrors += f.errorCount;
      totalWarnings += f.warningCount;
      if (f.status === "ERROR") filesWithErr.push(f);
    });

    // Encontrar el archivo activo en la lista
    var activeFile = null;
    for (var i = 0; i < files.length; i++) {
      if (files[i].name === FILE_TO_WATCH || files[i].name === "./" + FILE_TO_WATCH) {
        activeFile = files[i];
        break;
      }
    }

    var report = {
      project: path.basename(process.cwd()),
      author: "Juan Carlos Pavon Abrego (Faiiryz)",
      timestamp: new Date().toISOString(),
      status: totalErrors > 0 ? "ERROR" : totalWarnings > 0 ? "WARN" : "HEALTHY",
      summary: {
        total: files.length,
        withErrors: filesWithErr.length,
        totalErrors: totalErrors,
        totalWarnings: totalWarnings
      },
      files: files,
      activeFile: FILE_TO_WATCH,
      sourceCode: activeFile ? activeFile.source : "",
      analysis: activeFile ? activeFile.analysis : []
    };

    // Solo escribir si los datos cambiaron — evita parpadeo
    var newJson = JSON.stringify(report.summary) + report.summary.total;
    var oldJson = '';
    try {
      var oldData = JSON.parse(fs.readFileSync('analisis.json', 'utf8'));
      oldJson = JSON.stringify(oldData.summary) + oldData.summary.total;
    } catch (e) { }
    if (newJson === oldJson) {
      setTimeout(function () { isProcessing = false; }, 1500);
      return;
    }
    fs.writeFileSync('analisis.json', JSON.stringify(report, null, 2));

    var icon = totalErrors > 0 ? "🔴" : totalWarnings > 0 ? "🟡" : "✅";
    var tiempo = new Date().toLocaleTimeString("es-MX");
    console.log("[" + tiempo + "] " + icon + " " + files.length + " archivos | " + totalErrors + " errores | " + totalWarnings + " advertencias");

    if (filesWithErr.length > 0) {
      filesWithErr.forEach(function (f) {
        console.log("  ❌ " + f.name + " (" + f.errorCount + " error/es)");
        f.errors.forEach(function (e) {
          console.log("     Linea " + e.line + ": " + e.message.substring(0, 120));
        });
      });
    }

  } catch (e) {
    console.error("  [MOTOR ERROR] " + e.message);
  }

  // Liberar el lock despues de 1.5 segundos
  setTimeout(function () { isProcessing = false; }, 1500);
}

// Arrancar
var interval = MODE === "legacy" ? 10000 : 5000;
setInterval(runAnalysis, interval);
runAnalysis();