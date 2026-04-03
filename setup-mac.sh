👻 ghots-coder v3.0
Predictive Static Analysis Engine & Real-Time Dashboard
ghots-coder es un motor de análisis estático de alto rendimiento diseñado para la inspección profunda de arquitecturas web. Proporciona diagnósticos inmediatos sobre la integridad del código, optimizando el ciclo de vida de desarrollo mediante una interfaz visual reactiva.

🛠️ Especificaciones Técnicas y Compatibilidad
El motor ha sido desarrollado bajo un paradigma de eficiencia de recursos, garantizando estabilidad en hardware diverso:

Sistemas Operativos: macOS (Intel/Silicon), Windows 10/11, Linux (Ubuntu/Debian/Arch).
Hardware Legacy: Optimizado para procesadores de doble núcleo y 4GB de RAM (Sistemas de 2011 en adelante).
Sistemas Recientes: Modo de alta frecuencia para arquitecturas multinúcleo.
🚀 Guía de Instalación Universal
Requisito Previo
Tener instalado Node.js (Versión 14.x o superior).

🍎 macOS / 🐧 Linux
Clone el repositorio:
git clone [https://github.com/Carlosabrego136/ghots-coder.git](https://github.com/Carlosabrego136/ghots-coder.git)
cd ghots-coder
Instale dependencias y vincule el binario:

Bash

npm install sudo npm link 🪟 Windows Descargue el repositorio o use Git Bash:

Bash

git clone https://github.com/Carlosabrego136/ghots-coder.git cd ghots-coder Ejecute con privilegios de Administrador:

Bash

npm install npm link 💻 Ejecución y Despliegue Una vez vinculado globalmente, el comando ghots está disponible en cualquier terminal del sistema:

Inicie el motor en la raíz de su proyecto:

Bash

ghots Acceda al dashboard generado en: http://127.0.0.1:8080/ghots.html

⚖️ Términos, Condiciones y Aviso Legal El uso de ghots-coder implica la aceptación de los siguientes términos de propiedad intelectual y responsabilidad:

Propiedad Intelectual Todo el código fuente, algoritmos de análisis y activos visuales contenidos en este repositorio son propiedad exclusiva de Faiiryz / Teocalli-PX7. Se prohíbe la reproducción, distribución o modificación no autorizada con fines comerciales sin consentimiento explícito.

Acciones Legales y Jurisdicción Cualquier intento de ingeniería inversa, plagio o uso indebido de la marca ghots-coder para fines malintencionados será sujeto a las acciones legales pertinentes bajo las leyes de propiedad intelectual internacionales y las normativas vigentes en el Estado de México, México.

Limitación de Responsabilidad El software se proporciona "tal cual", sin garantías de ningún tipo. Faiiryz no se hace responsable de daños derivados del uso del software, incluyendo pero no limitado a la pérdida de datos o interrupciones de negocio.

📁 Arquitectura del Sistema motor.js: Núcleo de procesamiento lógico y detección de patrones.

bin.js: Capa de abstracción para la interfaz de línea de comandos.

ghots.html: Motor de visualización de datos de análisis.

👨‍💻 Autoría Lead Developer: Faiiryz

Organización: Teocalli-PX7

Licencia: Propietaria con fines de exhibición técnica (Ver LICENSE para detalles).