// GHOTS-CODER MOTOR v5.0 — By Faiiryz
// Analisis estatico predictivo — funciona en cualquier terminal

var acorn = require("acorn");
var estraverse = require("estraverse");
var fs = require("fs");
var path = require("path");

// ── Configuracion ─────────────────────────────────────────
var args = process.argv.slice(2);
var PROJECT_DIR = process.env.GHOTS_PROJECT
  ? path.resolve(process.env.GHOTS_PROJECT)
  : path.resolve(process.cwd());
var FILE_TO_WATCH = (args[args.length - 1] || "index.js").trim();
var MODE = process.env.GHOTS_MODE || "ultra";

try { process.chdir(PROJECT_DIR); } catch (e) { }

var SUPPORTED = [".js", ".mjs", ".cjs", ".ts", ".html", ".htm", ".json", ".css", ".scss", ".less"];
var IGNORE_DIRS = ["node_modules", ".git", "dist", "build", ".next", ".cache", "coverage",
  "__pycache__", ".dart_tool", "android", "ios", ".gradle", "Pods"];
var IGNORE_FILES = ["analisis.json", "package-lock.json", "yarn.lock", "pubspec.lock"];

// ── Colores ANSI estandar ─────────────────────────────────
var R = "\x1b[0m";
var BOLD = function (t) { return "\x1b[1m" + t + R; };
var RED = function (t) { return "\x1b[31m" + t + R; };
var GRN = function (t) { return "\x1b[32m" + t + R; };
var YLW = function (t) { return "\x1b[33m" + t + R; };
var CYN = function (t) { return "\x1b[36m" + t + R; };
var GRY = function (t) { return "\x1b[90m" + t + R; };
var SEP = GRY("  " + "─".repeat(62));

// ═══════════════════════════════════════════════════════════
// ANALIZADORES
// ═══════════════════════════════════════════════════════════
function analyzeJS(filePath, source) {
  var errors = [], warnings = [], analysis = [];
  try {
    var clean = source.replace(/^#!.*\n/, "// shebang\n");
    var ast = acorn.parse(clean, { ecmaVersion: 2020, locations: true, sourceType: "module" });
    estraverse.traverse(ast, {
      enter: function (node) {
        if (node.type === "IfStatement")
          analysis.push({ line: node.loc.start.line, label: "DECISION / IF", style: "neon-green" });
        if (node.type === "ReturnStatement")
          analysis.push({ line: node.loc.start.line, label: "RETORNO", style: "neon-red" });
        if (node.type === "ThrowStatement")
          analysis.push({ line: node.loc.start.line, label: "LANZA ERROR", style: "neon-orange" });
        if (node.type === "TryStatement")
          analysis.push({ line: node.loc.start.line, label: "TRY/CATCH", style: "neon-blue" });
        if (node.type === "VariableDeclarator" && node.id && node.id.name) {
          var vn = node.id.name;
          var cnt = (source.match(new RegExp("\\b" + vn + "\\b", "g")) || []).length;
          if (cnt === 1)
            warnings.push({
              line: node.loc.start.line, col: node.loc.start.column,
              type: "VARIABLE NO USADA",
              message: 'La variable "' + vn + '" se declara pero nunca se usa.',
              severity: "warn"
            });
        }
        if (node.type === "CallExpression" &&
          node.callee && node.callee.type === "MemberExpression" &&
          node.callee.object && node.callee.object.name === "console") {
          var method = (node.callee.property && node.callee.property.name) || "log";
          warnings.push({
            line: node.loc.start.line, col: node.loc.start.column,
            type: "CONSOLE EN PRODUCCION",
            message: "console." + method + "() debe eliminarse antes de subir a produccion.",
            severity: "info"
          });
        }
      }
    });
  } catch (e) {
    var raw = e.message || "Error de sintaxis";
    var mm = raw.match(/\((\d+):(\d+)\)/);
    var line = mm ? parseInt(mm[1], 10) : 1;
    var col = mm ? parseInt(mm[2], 10) : 0;
    var msg = raw.replace(/\(\d+:\d+\)/, "").trim();
    if (msg.indexOf("Unexpected token") !== -1)
      msg = "Token inesperado. Revisa comas, parentesis o llaves cerca de esta linea.";
    else if (msg.indexOf("Unexpected end") !== -1)
      msg = "El archivo termina inesperadamente. Falta cerrar una llave, parentesis o corchete.";
    errors.push({ line: line, col: col, type: "ERROR DE SINTAXIS", message: msg, severity: "error" });
  }
  return { errors: errors, warnings: warnings, analysis: analysis };
}

function analyzeJSON(filePath, source) {
  var errors = [], warnings = [];
  try {
    var parsed = JSON.parse(source);
    if (path.basename(filePath) === "package.json") {
      if (!parsed.name) warnings.push({ line: 1, col: 0, type: "CAMPO FALTANTE", message: 'Falta "name" en package.json.', severity: "warn" });
      if (!parsed.version) warnings.push({ line: 1, col: 0, type: "CAMPO FALTANTE", message: 'Falta "version" en package.json.', severity: "warn" });
    }
  } catch (e) {
    var posM = (e.message || "").match(/position (\d+)/);
    var line = 1;
    if (posM) line = source.substring(0, parseInt(posM[1], 10)).split("\n").length;
    errors.push({
      line: line, col: 0, type: "ERROR EN JSON",
      message: (e.message || "JSON invalido").substring(0, 200), severity: "error"
    });
  }
  return { errors: errors, warnings: warnings, analysis: [] };
}

function analyzeHTML(filePath, source) {
  var errors = [], warnings = [];
  var voidTags = { area: 1, base: 1, br: 1, col: 1, embed: 1, hr: 1, img: 1, input: 1, link: 1, meta: 1, param: 1, source: 1, track: 1, wbr: 1 };
  var openStack = [];
  var tagRe = /<\/?([a-zA-Z][a-zA-Z0-9-]*)(\s[^>]*)?(\/?)>/g;
  var m;
  while ((m = tagRe.exec(source)) !== null) {
    var full = m[0];
    var tag = m[1].toLowerCase();
    var isClose = full.charAt(1) === "/";
    var isSelf = m[3] === "/" || voidTags[tag];
    var ln = source.substring(0, m.index).split("\n").length;
    if (!isClose && !isSelf) {
      openStack.push({ tag: tag, line: ln });
    } else if (isClose && openStack.length > 0) {
      if (openStack[openStack.length - 1].tag === tag) {
        openStack.pop();
      } else {
        errors.push({
          line: ln, col: 0, type: "TAG MAL CERRADO",
          message: "Se encontro </" + tag + "> pero se esperaba </" + openStack[openStack.length - 1].tag + ">.",
          severity: "error"
        });
      }
    }
  }
  openStack.forEach(function (o) {
    errors.push({
      line: o.line, col: 0, type: "TAG SIN CERRAR",
      message: "El tag <" + o.tag + "> abierto en linea " + o.line + " nunca se cerro.",
      severity: "error"
    });
  });
  source.split("\n").forEach(function (line, i) {
    var ln = i + 1;
    if (line.indexOf("<img") !== -1 && line.indexOf("alt=") === -1)
      warnings.push({ line: ln, col: 0, type: "ACCESIBILIDAD", message: "Imagen sin atributo alt.", severity: "warn" });
    if (line.indexOf("style=") !== -1)
      warnings.push({ line: ln, col: 0, type: "ESTILO INLINE", message: "Evita estilos inline. Usa clases CSS.", severity: "info" });
  });
  return { errors: errors, warnings: warnings, analysis: [] };
}

function analyzeCSS(filePath, source) {
  var errors = [], warnings = [];
  var braces = 0;
  source.split("\n").forEach(function (line, i) {
    var ln = i + 1;
    braces += (line.match(/\{/g) || []).length;
    braces -= (line.match(/\}/g) || []).length;
    var ep = line.match(/^\s*([\w-]+)\s*:\s*;/);
    if (ep) errors.push({
      line: ln, col: 0, type: "PROPIEDAD VACIA",
      message: 'La propiedad "' + ep[1] + '" no tiene valor.', severity: "error"
    });
    if (line.indexOf("!important") !== -1)
      warnings.push({
        line: ln, col: 0, type: "USO DE !IMPORTANT",
        message: "Evita !important cuando sea posible.", severity: "info"
      });
  });
  if (braces !== 0)
    errors.push({
      line: source.split("\n").length, col: 0, type: "LLAVES DESBALANCEADAS",
      message: "Hay " + Math.abs(braces) + " llave(s) " + (braces > 0 ? "sin cerrar" : "sobrantes") + ".",
      severity: "error"
    });
  return { errors: errors, warnings: warnings, analysis: [] };
}

function analyzeGeneric(source) {
  var warnings = [];
  source.split("\n").forEach(function (line, i) {
    var ln = i + 1;
    if (line.length > 200)
      warnings.push({
        line: ln, col: 0, type: "LINEA MUY LARGA",
        message: "Linea de " + line.length + " chars. Maximo: 120.", severity: "info"
      });
    var tipo = line.indexOf("FIXME") !== -1 ? "FIXME"
      : line.indexOf("HACK") !== -1 ? "HACK"
        : line.indexOf("TODO") !== -1 ? "TODO" : null;
    if (tipo) warnings.push({
      line: ln, col: 0, type: "PENDIENTE (" + tipo + ")",
      message: line.trim().substring(0, 100), severity: "warn"
    });
  });
  return warnings;
}

function analyzeFile(filePath) {
  var ext = path.extname(filePath).toLowerCase();
  var source = "";
  try { source = fs.readFileSync(filePath, "utf8"); }
  catch (e) {
    return {
      errors: [{
        line: 1, col: 0, type: "ERROR DE LECTURA",
        message: "No se pudo leer: " + e.message, severity: "error"
      }],
      warnings: [], analysis: [], source: ""
    };
  }
  var result;
  if ([".js", ".mjs", ".cjs", ".ts"].indexOf(ext) !== -1) result = analyzeJS(filePath, source);
  else if (ext === ".json") result = analyzeJSON(filePath, source);
  else if ([".html", ".htm"].indexOf(ext) !== -1) result = analyzeHTML(filePath, source);
  else if ([".css", ".scss", ".less"].indexOf(ext) !== -1) result = analyzeCSS(filePath, source);
  else result = { errors: [], warnings: [], analysis: [] };
  result.warnings = result.warnings.concat(analyzeGeneric(source));
  result.source = source;
  return result;
}

// ═══════════════════════════════════════════════════════════
// ESCANEAR PROYECTO
// ═══════════════════════════════════════════════════════════
function scanProject() {
  var results = [];
  function walk(dir) {
    var entries;
    try { entries = fs.readdirSync(dir); } catch (e) { return; }
    entries.forEach(function (name) {
      if (IGNORE_DIRS.indexOf(name) !== -1) return;
      if (IGNORE_FILES.indexOf(name) !== -1) return;
      var full = path.join(dir, name);
      var stat;
      try { stat = fs.statSync(full); } catch (e) { return; }
      if (stat.isDirectory()) { walk(full); return; }
      var ext = path.extname(name).toLowerCase();
      if (SUPPORTED.indexOf(ext) === -1) return;
      // Ruta relativa al proyecto, con separadores Unix
      var rel = path.relative(PROJECT_DIR, full).replace(/\\/g, "/");
      var r = analyzeFile(full);
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
    });
  }
  walk(PROJECT_DIR);
  return results;
}

// ═══════════════════════════════════════════════════════════
// BUSCAR ARCHIVO ACTIVO (tolerante a rutas relativas)
// ═══════════════════════════════════════════════════════════
function findActiveFile(files) {
  var watch = FILE_TO_WATCH.replace(/\\/g, "/").replace(/^\.\//, "");
  for (var i = 0; i < files.length; i++) {
    var n = files[i].name.replace(/\\/g, "/").replace(/^\.\//, "");
    if (n === watch || path.basename(n) === path.basename(watch)) return files[i];
  }
  return null;
}

function isSameFile(a, b) {
  a = (a || "").replace(/\\/g, "/").replace(/^\.\//, "");
  b = (b || "").replace(/\\/g, "/").replace(/^\.\//, "");
  return a === b || path.basename(a) === path.basename(b);
}

// ═══════════════════════════════════════════════════════════
// REPORTE EN TERMINAL — limpio, sin spam
// ═══════════════════════════════════════════════════════════
function printReport(files, totalErrors, totalWarnings) {
  var t = new Date().toLocaleTimeString("es-MX");
  var status = totalErrors > 0 ? RED("✖ ERRORES") : totalWarnings > 0 ? YLW("⚠ AVISOS") : GRN("✔ LIMPIO");

  console.log(SEP);
  console.log("  " + BOLD("[" + t + "]") + "  " + status +
    "  " + GRY("archivos:") + " " + BOLD(String(files.length)) +
    "  " + GRY("errores:") + " " + (totalErrors > 0 ? RED(BOLD(String(totalErrors))) : GRN("0")) +
    "  " + GRY("avisos:") + " " + (totalWarnings > 0 ? YLW(String(totalWarnings)) : GRN("0")));

  var active = findActiveFile(files);
  console.log("  " + CYN("► ") + BOLD(FILE_TO_WATCH));

  if (!active) {
    console.log("  " + YLW("  Archivo no encontrado en el proyecto"));
    if (files.length > 0) {
      console.log("  " + GRY("  Archivos disponibles: ") +
        files.slice(0, 5).map(function (f) { return f.name; }).join(", ") +
        (files.length > 5 ? " ..." : ""));
    }
  } else {
    var errs = active.errors || [];
    var warns = (active.warnings || []).filter(function (w) { return w.severity === "warn"; });
    var infos = (active.warnings || []).filter(function (w) { return w.severity !== "warn"; });

    if (errs.length === 0 && warns.length === 0 && infos.length === 0) {
      console.log("  " + GRN("  ✔ Sin problemas"));
    } else {
      errs.forEach(function (e) {
        console.log("  " + RED("  ✖ " + (e.type || "ERROR")) + GRY("  L" + e.line));
        console.log("     " + e.message.substring(0, 120));
      });
      warns.forEach(function (w) {
        console.log("  " + YLW("  ⚠ " + (w.type || "AVISO")) + GRY("  L" + w.line));
        console.log("     " + w.message.substring(0, 120));
      });
      if (infos.length > 0) {
        var grupos = {};
        infos.forEach(function (w) { var k = w.type || "INFO"; grupos[k] = (grupos[k] || 0) + 1; });
        Object.keys(grupos).forEach(function (k) {
          console.log("  " + CYN("  ℹ " + k) + GRY(" ×" + grupos[k]));
        });
      }
    }
  }

  var otros = files.filter(function (f) {
    return f.status === "ERROR" && !isSameFile(f.name, FILE_TO_WATCH);
  });
  if (otros.length > 0) {
    console.log("  " + YLW("  Otros con errores: ") +
      otros.map(function (f) { return RED(f.name) + " " + GRY("(" + f.errorCount + ")"); }).join("  "));
  }
  console.log(SEP);
}

// ═══════════════════════════════════════════════════════════
// CICLO PRINCIPAL
// ═══════════════════════════════════════════════════════════
var isProcessing = false;
var runCount = 0;
var lastHash = "";

function runAnalysis() {
  if (isProcessing) return;
  isProcessing = true;
  runCount++;

  try {
    var files = scanProject();
    var totalErrors = 0;
    var totalWarnings = 0;
    files.forEach(function (f) { totalErrors += f.errorCount; totalWarnings += f.warningCount; });

    var active = findActiveFile(files);
    var hash = files.length + ":" + totalErrors + ":" + totalWarnings + ":" +
      (active ? active.errorCount + ":" + active.warningCount + ":" + (active.source || "").length : "x");

    var report = {
      project: path.basename(PROJECT_DIR),
      projectPath: PROJECT_DIR,
      timestamp: new Date().toISOString(),
      status: totalErrors > 0 ? "ERROR" : totalWarnings > 0 ? "WARN" : "HEALTHY",
      summary: {
        total: files.length,
        withErrors: files.filter(function (f) { return f.status === "ERROR"; }).length,
        totalErrors: totalErrors,
        totalWarnings: totalWarnings
      },
      files: files,
      activeFile: FILE_TO_WATCH
    };

    if (runCount === 1 || hash !== lastHash) {
      lastHash = hash;
      fs.writeFileSync(path.join(PROJECT_DIR, "analisis.json"), JSON.stringify(report, null, 2));
      printReport(files, totalErrors, totalWarnings);
    }

  } catch (e) {
    console.error(RED("  [ERROR MOTOR] ") + e.message + "\n" + e.stack);
  }

  setTimeout(function () { isProcessing = false; }, 1500);
}

var interval = MODE === "legacy" ? 8000 : 4000;
setInterval(runAnalysis, interval);
runAnalysis();