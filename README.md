# 👻 GHOTS-CODER v5.0
### **Predictive Static Analysis Engine & Real-Time Dashboard**

**GHOTS-CODER** es un motor de análisis estático de alto rendimiento diseñado para la inspección profunda de arquitecturas web. Proporciona diagnósticos inmediatos sobre la integridad del código, optimizando el ciclo de vida de desarrollo mediante una interfaz visual reactiva.

Este software ha sido desarrollado bajo un paradigma de **eficiencia de recursos**, garantizando estabilidad en hardware legacy (Sistemas de 2011 en adelante con 4GB de RAM).

---

## 🚀 Guía de Instalación y Uso

### 1. Requisito previo
* Tener instalado **Node.js** (Versión 14.x o superior).

### 2. Instalación de la Herramienta
Para instalar la herramienta globalmente desde el archivo de distribución, ejecuta:
```bash
npm install -g ./ghots-coder-3.0.0.tgz


3. Flujo de Trabajo (Paso a Paso)Entrar al proyecto: Abre tu terminal y navega a la carpeta que quieres analizar usando la ruta completa.Ejemplo: cd /Users/pamegarcia/Desktop/DESARROLLO/MiProyectoLanzar GHOTS: Escribe el comando ghots.Menú de Selección: Aparecerá un menú interactivo en la terminal. Selecciona cualquier archivo para iniciar el análisis.Uso del Dashboard: Se abrirá automáticamente el Dashboard en tu navegador.Tip de Experto: No necesitas regresar a la terminal para cambiar de archivo. En el Dashboard puedes hacer clic en cualquier archivo de la lista lateral para verlo al instante.Edición de Código: Si vas a realizar cambios importantes en tu código, cierra la terminal donde corre el motor. Esto evita que el sistema se sature o se "congele" mientras editas.Reiniciar: Una vez terminada la edición, abre una terminal nueva. Si tu IDE (como PyCharm) ya te sitúa en la carpeta del proyecto, solo escribe ghots de nuevo.🛠️ Capacidades del MotorEl motor realiza un escaneo multilingüe detectando fallos críticos:ExtensiónTipo de Análisis.js / .tsErrores de sintaxis, variables huérfanas y flujo lógico..htmlEtiquetas sin cerrar y atributos faltantes..jsonErrores de parseo y validación de estructura..cssLlaves desbalanceadas y selectores vacíos.📊 Especificaciones Técnicas y CompatibilidadSistemas Operativos: macOS (Intel/Silicon), Windows 10/11, Linux (Ubuntu/Debian/Arch).Hardware Legacy: Optimizado para procesadores de doble núcleo y 4GB de RAM (Sistemas de 2011 en adelante).Interfaz: Inspirada en la estética minimalista de Tesla/Apple.Dashboard Visual: Acceso local a través de http://127.0.0.1:8080/ghots.html.📁 Arquitectura del Sistemamotor.js: Núcleo de procesamiento lógico y detección de patrones.bin.js: Capa de abstracción para la interfaz de línea de comandos (CLI).ghots.html: Motor de visualización de datos de análisis (Dashboard).⚖️ Licencia y Propiedad IntelectualLicencia: MIT.Autoría: Lead Developer: Faiiryz (Juan Carlos Pavón Ábrego).Organización: Teocalli-PX7.Aviso Legal: Todo el código fuente, algoritmos de análisis y activos visuales contenidos en este repositorio son propiedad exclusiva de Faiiryz / Teocalli-PX7. Se prohíbe la reproducción, distribución o modificación no autorizada con fines comerciales sin consentimiento explícito.
