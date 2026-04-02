#!/usr/bin/env node
/**
 * GHOTS-CODER CLI v3.0 — By Faiiryz
 * Modo numerico en IDE, flechas en terminal nativa
 * Con menu principal para volver a elegir archivo
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

var SUPPORTED = [".js", ".mjs", ".cjs", ".ts", ".html", ".htm", ".json", ".css", ".scss", ".less"];
var IGNORE_DIRS = ["node_modules", ".git", "dist", "build", ".next", ".cache", "coverage"];
var IGNORE_FILES = ["analisis.json", "package-lock.json"];

// ── Utilidades ───────────────────────────────────────────
var C = {
  reset: "\x1b[0m", bright: "\x1b[1m", dim: "\x1b[2m",
  green: "\x1b[38;5;84m", red: "\x1b[38;5;196m",
  yellow: "\x1b[38;5;220m", cyan: "\x1b[38;5;51m",
  purple: "\x1b[38;5;141m", white: "\x1b[97m", gray: "\x1b[38;5;244m"
};

function clr(c, t) { return c + t + "\x1b[0m"; }
function bold(t) { return "\x1b[1m" + t + "\x1b[0m"; }
function dim(t) { return "\x1b[2m" + t + "\x1b[0m"; }

function scanFiles() {
  var results = [];
  function walk(d) {
    var entries;
    try { entries = fs.readdirSync(d); } catch (e) { return; }
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      if (IGNORE_DIRS.indexOf(e) !== -1) continue;
      var full = path.join(d, e);
      var stat;
      try { stat = fs.statSync(full); } catch (e2) { continue; }
      if (stat.isDirectory()) { walk(full); continue; }
      if (IGNORE_FILES.indexOf(e) !== -1) continue;
      if (SUPPORTED.indexOf(path.extname(e).toLowerCase()) !== -1)
        results.push(path.relative(".", full));
    }
  }
  walk(".");
  return results;
}

function extIcon(ext) {
  if ([".js", ".mjs", ".cjs"].indexOf(ext) !== -1) return clr("\x1b[38;5;220m", "JS  ");
  if (ext === ".ts") return clr("\x1b[38;5;51m", "TS  ");
  if ([".html", ".htm"].indexOf(ext) !== -1) return clr("\x1b[38;5;208m", "HTML");
  if ([".css", ".scss", ".less"].indexOf(ext) !== -1) return clr("\x1b[38;5;141m", "CSS ");
  if (ext === ".json") return clr("\x1b[38;5;84m", "JSON");
  return dim("FILE");
}

function printHeader() {
  console.log();
  console.log(clr("\x1b[38;5;141m", "  +====================================================+"));
  console.log(clr("\x1b[38;5;141m", "  |") + bold("      👻  GHOTS-CODER CLI v3.0  ·  By Faiiryz    ") + clr("\x1b[38;5;141m", "  |"));
  console.log(clr("\x1b[38;5;141m", "  |") + dim("        Motor de Analisis Estatico Predictivo     ") + clr("\x1b[38;5;141m", "  |"));
  console.log(clr("\x1b[38;5;141m", "  +====================================================+"));
  console.log("  MODO: " + (isLegacy ? clr("\x1b[38;5;220m", "LEGACY (<=4GB RAM)") : clr("\x1b[38;5;84m", "ULTRA")));
  console.log("  DIR:  " + clr("\x1b[97m", process.cwd()));
  console.log(clr("\x1b[38;5;141m", "  +====================================================+"));
  console.log();
}

var motorProcess = null;
var serverProcess = null;

function stopEngine() {
  if (motorProcess) { try { motorProcess.kill('SIGTERM'); } catch (e) { } motorProcess = null; }
  // No matamos el servidor si ya está corriendo para evitar lag en el dashboard
}

function launchEngine(fileToAnalyze, callback) {
  stopEngine();

  console.log();
  console.log(clr("\x1b[38;5;84m", "  ✅  Archivo: " + bold(fileToAnalyze)));
  console.log(clr("\x1b[38;5;51m", "  🔍  Analizando proyecto..."));
  console.log(clr("\x1b[38;5;141m", "  📡  Dashboard: http://127.0.0.1:8080/ghots.html"));
  console.log(dim("  Ctrl+C para detener · escribe 'menu' para volver\n"));

  var motorPath = path.join(__dirname, "motor.js");
  motorProcess = spawn("node", [motorPath, fileToAnalyze], {
    env: Object.assign({}, process.env, { GHOTS_MODE: isLegacy ? "legacy" : "ultra" }),
    shell: true
  });

  motorProcess.stdout.on("data", function (d) { process.stdout.write("  [👻] " + d); });
  motorProcess.stderr.on("data", function (d) { process.stderr.write("  [⚠] " + d); });

  // Levantar servidor HTTP solo si no existe
  if (!serverProcess) {
    serverProcess = exec("npx http-server . -p 8080 --cors -s --no-dotfiles");
  }

  setTimeout(function () {
    var url = "http://127.0.0.1:8080/ghots.html";
    var openCmd = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
    exec(openCmd + " " + url);
    console.log(clr("\x1b[38;5;84m", "  🌐  Dashboard abierto en el navegador"));
    console.log();
    if (callback) callback();
  }, 2000);
}

// ── Selector numérico (IDE) ───────────────────────────────
function showMenuNumeric(files, callback) {
  console.log(bold(clr("\x1b[97m", "  📂  ARCHIVOS DEL PROYECTO")));
  console.log(dim("  Escribe el NUMERO y presiona Enter · 0 = salir"));
  console.log(dim("  " + "-".repeat(52)));
  console.log();

  files.forEach(function (f, i) {
    var ext = path.extname(f).toLowerCase();
    var num = clr("\x1b[38;5;84m", bold(String(i + 1).padStart(2, " ")));
    console.log("  " + num + "  [" + extIcon(ext) + "]  " + clr("\x1b[97m", f));
  });

  console.log();
  console.log(dim("  " + "-".repeat(52)));
  process.stdout.write(clr("\x1b[38;5;51m", "\n  Numero del archivo: "));

  var rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });
  rl.once("line", function (line) {
    rl.close();
    var num = parseInt(line.trim(), 10);
    if (num === 0) { console.log("\n  👋  Hasta luego.\n"); process.exit(0); }
    if (isNaN(num) || num < 1 || num > files.length) {
      console.log(clr("\x1b[38;5;196m", "\n  ❌  Numero invalido. Rango: 1-" + files.length));
      setTimeout(function () { showMenuNumeric(files, callback); }, 800);
      return;
    }
    callback(files[num - 1]);
  });
}

// ── Selector con flechas (terminal nativa) ───────────────
function showMenuInteractive(files, callback) {
  var selected = 0;

  function render() {
    console.clear();
    printHeader();
    console.log(bold(clr("\x1b[97m", "  📂  ARCHIVOS DEL PROYECTO")));
    console.log(dim("  Flechas ↑↓ · ENTER seleccionar · Q salir"));
    console.log(dim("  " + "-".repeat(52)));
    console.log();
    files.forEach(function (f, i) {
      var ext = path.extname(f).toLowerCase();
      var isSel = i === selected;
      var prefix = isSel ? clr("\x1b[38;5;84m", " > ") + bold(clr("\x1b[97m", f)) : "    " + dim(f);
      console.log("  [" + extIcon(ext) + "] " + prefix);
    });
    console.log();
    console.log(dim("  " + "-".repeat(52)));
    console.log("  " + clr("\x1b[38;5;84m", "[ENTER]") + " Analizar   " + clr("\x1b[38;5;196m", "[Q]") + " Salir");
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

// ── Menú principal con opción de volver ──────────────────
function mainMenu() {
  console.clear();
  printHeader();
  var files = scanFiles();

  if (!files.length) {
    console.log(clr("\x1b[38;5;196m", "  ❌  No se encontraron archivos compatibles.\n"));
    process.exit(1);
  }

  function onSelected(file) {
    launchEngine(file, function () {
      var rl2 = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });
      process.stdout.write(clr("\x1b[38;5;51m", "\n  Escribe 'menu' para cambiar archivo o 'q' para salir: "));
      rl2.on("line", function (line) {
        rl2.close();
        var cmd = line.trim().toLowerCase();
        if (cmd === "menu" || cmd === "m") {
          stopEngine();
          mainMenu();
        } else if (cmd === "q" || cmd === "quit") {
          stopEngine();
          console.log("  👋  Hasta luego.\n");
          process.exit(0);
        }
      });
    });
  }

  if (isInteractive) showMenuInteractive(files, onSelected);
  else showMenuNumeric(files, onSelected);
}

// ── Arranque ─────────────────────────────────────────────
var argFile = process.argv;
if (argFile && fs.existsSync(argFile)) {
  printHeader();
  launchEngine(argFile, null);
} else {
  mainMenu();
}