#!/usr/bin/env node
/**
 * GHOTS-CODER CLI v5.0 — By Faiiryz
 * Analisis estatico predictivo — funciona en cualquier terminal
 */

var childProcess = require("child_process");
var exec = childProcess.exec;
var spawn = childProcess.spawn;
var fs = require("fs");
var path = require("path");
var os = require("os");
var readline = require("readline");

var isLegacy = os.totalmem() < 5000000000;
var isInteractive = process.stdin.isTTY;

// El directorio del proyecto es donde el usuario ejecuta 'ghots'
// Se captura ANTES de cualquier chdir
var PROJECT_DIR = process.cwd();

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
var MAG = function (t) { return "\x1b[35m" + t + R; };
var GRY = function (t) { return "\x1b[90m" + t + R; };

// ── Escanear archivos del proyecto ────────────────────────
function scanFiles() {
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
      if (SUPPORTED.indexOf(ext) !== -1)
        results.push(path.relative(PROJECT_DIR, full).replace(/\\/g, "/"));
    });
  }
  walk(PROJECT_DIR);
  return results;
}

function extLabel(ext) {
  var map = {
    ".js": "JS ", ".mjs": "JS ", ".cjs": "JS ", ".ts": "TS ",
    ".html": "HTML", ".htm": "HTML", ".css": "CSS ", ".scss": "CSS ",
    ".less": "CSS ", ".json": "JSON"
  };
  return map[ext] || "FILE";
}

function extColor(ext) {
  if ([".js", ".mjs", ".cjs"].indexOf(ext) !== -1) return YLW;
  if (ext === ".ts") return CYN;
  if ([".html", ".htm"].indexOf(ext) !== -1) return RED;
  if ([".css", ".scss", ".less"].indexOf(ext) !== -1) return MAG;
  if (ext === ".json") return GRN;
  return GRY;
}

function printHeader() {
  console.log();
  console.log(MAG("  +====================================================+"));
  console.log(MAG("  |") + BOLD("      👻  GHOTS-CODER  v5.0  ·  By Faiiryz        ") + MAG("|"));
  console.log(MAG("  |") + GRY("        Motor de Analisis Estatico Predictivo     ") + MAG("|"));
  console.log(MAG("  +====================================================+"));
  console.log("  MODO:  " + (isLegacy ? YLW("LEGACY (<=4GB RAM)") : GRN("ULTRA")));
  console.log("  DIR:   " + BOLD(PROJECT_DIR));
  console.log(MAG("  +====================================================+"));
  console.log();
}

var motorProcess = null;
var serverProcess = null;
var serverPort = 8080;

function stopEngine() {
  if (motorProcess) {
    try { motorProcess.kill("SIGTERM"); } catch (e) { }
    motorProcess = null;
  }
}

function killPort(port, cb) {
  exec("lsof -ti:" + port + " | xargs kill -9 2>/dev/null; true", function () { cb(); });
}

function launchEngine(fileToAnalyze, callback) {
  stopEngine();

  console.log();
  console.log(GRN("  ✔  Archivo: ") + BOLD(fileToAnalyze));
  console.log(CYN("  ⟳  Proyecto: ") + BOLD(PROJECT_DIR));
  console.log(CYN("  ◉  Dashboard: ") + BOLD("http://127.0.0.1:" + serverPort + "/ghots.html"));
  console.log(GRY("  Ctrl+C para detener  ·  escribe 'menu' para cambiar archivo\n"));

  var motorPath = path.join(__dirname, "motor.js");

  motorProcess = spawn("node", [motorPath, fileToAnalyze], {
    env: Object.assign({}, process.env, {
      GHOTS_MODE: isLegacy ? "legacy" : "ultra",
      GHOTS_PROJECT: PROJECT_DIR
    }),
    cwd: PROJECT_DIR,
    shell: false
  });

  motorProcess.stdout.on("data", function (d) { process.stdout.write(d.toString()); });
  motorProcess.stderr.on("data", function (d) { process.stderr.write(YLW("  [!] ") + d.toString()); });
  motorProcess.on("error", function (e) { console.error(RED("  [MOTOR ERROR] ") + e.message); });

  // Copiar ghots.html al proyecto del usuario (siempre la version mas nueva)
  var ghotsSource = path.join(__dirname, "ghots.html");
  var ghotsDest = path.join(PROJECT_DIR, "ghots.html");
  try {
    if (path.resolve(ghotsSource) !== path.resolve(ghotsDest)) {
      fs.writeFileSync(ghotsDest, fs.readFileSync(ghotsSource));
    }
  } catch (e) { }

  // Levantar servidor HTTP en el proyecto
  if (!serverProcess) {
    killPort(serverPort, function () {
      setTimeout(function () {
        serverProcess = exec(
          "npx http-server " + JSON.stringify(PROJECT_DIR) + " -p " + serverPort + " --cors -s --no-dotfiles",
          { env: process.env }
        );
        // abrir dashboard despues de que el servidor arranque
        setTimeout(function () {
          var url = "http://127.0.0.1:" + serverPort + "/ghots.html";
          var openCmd = process.platform === "darwin" ? "open"
            : process.platform === "win32" ? "start"
              : "xdg-open";
          exec(openCmd + " " + url);
          console.log(GRN("  ✔  Dashboard abierto"));
          console.log();
          if (callback) callback();
        }, 1500);
      }, 600);
    });
  } else {
    setTimeout(function () {
      if (callback) callback();
    }, 500);
  }
}

// ── Selector numerico (IDE / no-TTY) ─────────────────────
function showMenuNumeric(files, callback) {
  console.log(BOLD("  ARCHIVOS DEL PROYECTO"));
  console.log(GRY("  Escribe el NUMERO y presiona Enter  ·  0 = salir"));
  console.log(GRY("  " + "─".repeat(52)));
  console.log();
  files.forEach(function (f, i) {
    var ext = path.extname(f).toLowerCase();
    var col = extColor(ext);
    var num = GRN(BOLD(String(i + 1).padStart(2, " ")));
    console.log("  " + num + "  " + col("[" + extLabel(ext) + "]") + "  " + BOLD(f));
  });
  console.log();
  console.log(GRY("  " + "─".repeat(52)));
  process.stdout.write(CYN("\n  Numero del archivo: "));

  var rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });
  rl.once("line", function (line) {
    rl.close();
    var num = parseInt(line.trim(), 10);
    if (num === 0) { console.log("\n  👋  Hasta luego.\n"); process.exit(0); }
    if (isNaN(num) || num < 1 || num > files.length) {
      console.log(RED("\n  ✖  Numero invalido (1-" + files.length + ")"));
      setTimeout(function () { showMenuNumeric(files, callback); }, 600);
      return;
    }
    callback(files[num - 1]);
  });
}

// ── Selector con flechas (terminal interactiva) ──────────
function showMenuInteractive(files, callback) {
  var selected = 0;
  function render() {
    console.clear();
    printHeader();
    console.log(BOLD("  ARCHIVOS DEL PROYECTO"));
    console.log(GRY("  ↑↓ Navegar  ·  ENTER Seleccionar  ·  Q Salir"));
    console.log(GRY("  " + "─".repeat(52)));
    console.log();
    files.forEach(function (f, i) {
      var ext = path.extname(f).toLowerCase();
      var col = extColor(ext);
      var isSel = i === selected;
      var line = isSel ? GRN(" > ") + BOLD(f) : "    " + GRY(f);
      console.log("  " + col("[" + extLabel(ext) + "]") + " " + line);
    });
    console.log();
    console.log(GRY("  " + "─".repeat(52)));
    console.log("  " + GRN("[ENTER]") + " Analizar   " + RED("[Q]") + " Salir");
  }
  render();
  if (process.stdin.isTTY) {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
  }
  function handler(_, key) {
    if (!key) return;
    if (key.name === "up" && selected > 0) selected--;
    if (key.name === "down" && selected < files.length - 1) selected++;
    if (key.name === "return") {
      process.stdin.setRawMode(false);
      process.stdin.removeListener("keypress", handler);
      callback(files[selected]);
      return;
    }
    if (key.name === "q" || (key.ctrl && key.name === "c")) {
      process.stdin.setRawMode(false);
      console.log("\n  👋  Hasta luego.\n");
      process.exit(0);
    }
    render();
  }
  process.stdin.on("keypress", handler);
}

// ── Menu principal ────────────────────────────────────────
function mainMenu() {
  console.clear();
  printHeader();
  var files = scanFiles();

  if (!files.length) {
    console.log(RED("  ✖  No se encontraron archivos compatibles en:\n  " + PROJECT_DIR + "\n"));
    process.exit(1);
  }

  function onSelected(file) {
    launchEngine(file, function () {
      // Esperar comando del usuario
      var rl2 = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });
      process.stdout.write(CYN("\n  'menu' = cambiar archivo  ·  'q' = salir: "));
      rl2.on("line", function (line) {
        rl2.close();
        var cmd = line.trim().toLowerCase();
        if (cmd === "menu" || cmd === "m") {
          stopEngine();
          serverProcess = null;  // permitir que se reinicie el servidor con el nuevo proyecto
          mainMenu();
        } else if (cmd === "q" || cmd === "quit" || cmd === "exit") {
          stopEngine();
          console.log("  👋  Hasta luego.\n");
          process.exit(0);
        } else {
          // Ignorar otros inputs y volver a pedir
          process.stdout.write(CYN("  'menu' o 'q': "));
          rl2 = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });
          rl2.once("line", arguments.callee.bind(null));
        }
      });
    });
  }

  if (isInteractive) showMenuInteractive(files, onSelected);
  else showMenuNumeric(files, onSelected);
}

// ── Arranque ─────────────────────────────────────────────
var argFile = process.argv[2];
if (argFile && fs.existsSync(path.resolve(PROJECT_DIR, argFile))) {
  printHeader();
  launchEngine(argFile, null);
} else if (argFile && fs.existsSync(argFile)) {
  printHeader();
  launchEngine(path.relative(PROJECT_DIR, argFile), null);
} else {
  mainMenu();
}