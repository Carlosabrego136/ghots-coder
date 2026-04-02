<<<<<<< HEAD
# 👻 ghots-coder v3.0
### Motor de Análisis Estático Predictivo & Dashboard Visual

**ghots-coder** es una herramienta de ingeniería de software diseñada para el análisis profundo de proyectos web. Escanea el código base, mapea el flujo lógico y despliega un diagnóstico en tiempo real directamente en el navegador.

> **Optimización de Hardware:** Diseñado específicamente para ejecutarse en entornos de recursos limitados (4GB RAM / Hardware 2011+) sin comprometer la profundidad del análisis.

---

## 🛠️ Capacidades del Motor
El motor realiza un escaneo multilingüe detectando fallos críticos:

| Extensión | Tipo de Análisis |
| :--- | :--- |
| **.js / .ts** | Errores de sintaxis, variables huérfanas y flujo lógico. |
| **.html** | Etiquetas sin cerrar y atributos faltantes. |
| **.json** | Errores de parseo y validación de estructura. |
| **.css** | Llaves desbalanceadas y selectores vacíos. |

---

## 🚀 Instalación y Uso

### Opción 1: Instalación Rápida (Recomendado)
Para usar el comando `ghots` globalmente:
```bash
npm link
Opción 2: Ejecución Directa
Bash

ghots
El sistema desplegará un menú interactivo, iniciará el servidor automáticamente y abrirá el dashboard.

📊 Dashboard Visual
Accede a https://www.google.com/search?q=http://127.0.0.1:8080/ghots.html para visualizar:

Navegación: Archivos ordenados por severidad.

Visor: Código anotado (Rojo: Error | Amarillo: Warning).

Feedback: Icono reactivo al estado de salud del código.

🧠 Gestión de Rendimiento
Modo Legacy (< 5GB RAM): Escaneo cada 10 segundos.

Modo Ultra (≥ 5GB RAM): Escaneo cada 5 segundos.

📁 Estructura
bin.js: Interfaz CLI.

motor.js: Núcleo de análisis.

ghots.html: Dashboard Web.

⚖️ Licencia y Autoría
Licencia: MIT

Desarrollador: Juan Carlos Pavón Ábrego (Faiiryz)

Organización: Teocalli-PX7
=======
👻 ghots-coder v3.0Motor de Análisis Estático Predictivo & Dashboard Visualghots-coder es una herramienta de ingeniería de software diseñada para el análisis profundo de proyectos web. Escanea el código base, mapea el flujo lógico y despliega un diagnóstico en tiempo real directamente en el navegador.Optimización de Hardware: Diseñado específicamente para ejecutarse en entornos de recursos limitados (4GB RAM / Hardware 2011+) sin comprometer la profundidad del análisis.🛠️ Capacidades del MotorEl motor realiza un escaneo multilingüe detectando fallos críticos y lógica de negocio:ExtensiónTipo de Análisis.js / .tsErrores de sintaxis, variables huérfanas, flujo lógico (if, return, try/catch)..htmlEtiquetas sin cerrar, atributos alt/href faltantes y eventos en línea..jsonErrores de parseo y validación de campos en package.json..cssLlaves desbalanceadas, propiedades vacías y uso de !important.🚀 InstalaciónOpción 1: Desarrollo LocalBashgit clone https://github.com/Carlosabrego136/ghots-coder.git
cd ghots-coder
npm install
Opción 2: Herramienta CLI GlobalPara ejecutar ghots desde cualquier directorio de tu sistema:Bashnpm link
Si encuentras errores de permisos en macOS:Bashsudo npm link
💻 Modos de UsoInterfaz de Línea de Comandos (CLI)Una vez instalado globalmente, navega a cualquier proyecto y ejecuta:Bashghots
El sistema desplegará un menú interactivo para seleccionar el archivo raíz, iniciará el servidor automáticamente y abrirá el dashboard en tu navegador.Ejecución Manual (Modo Dual)Si prefieres control total mediante terminales separadas:Motor: node motor.js index.jsServidor: npx http-server . -p 8080 --cors -s📊 Dashboard VisualAccede a http://127.0.0.1:8080/ghots.html para visualizar:Panel de Navegación: Archivos ordenados por severidad de errores.Visor de Código: Líneas anotadas con resaltado dinámico (Rojo: Error | Amarillo: Advertencia).Diagnóstico Técnico: Explicación detallada con posición exacta de línea y columna.Feedback Visual: Icono reactivo que refleja el estado de salud actual del código.🧠 Gestión de Rendimiento (Smart Engine)El motor detecta la memoria disponible y ajusta la frecuencia de escaneo para proteger el hardware:Modo Legacy (< 5GB RAM): Escaneo cada 10 segundos (Optimizado para Mac 2011).Modo Ultra (≥ 5GB RAM): Escaneo cada 5 segundos para respuesta inmediata.📁 Estructura del ProyectoPlaintextghots-coder/
├── bin.js         # Punto de entrada de la interfaz CLI
├── motor.js       # Núcleo del motor de análisis
├── ghots.html     # Interfaz del Dashboard Web
├── package.json   # Configuración y dependencias
└── README.md      # Documentación técnica
⚖️ Licencia y AutoríaLicencia: MITDesarrollador: Juan Carlos Pavón Ábrego (Faiiryz)
>>>>>>> style: clean repository and update professional README
