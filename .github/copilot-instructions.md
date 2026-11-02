# Instrucciones del proyecto: Guía Tec (asistente vocacional del TSJ)

## Qué es este proyecto
Página web de una sola vista con un chatbot llamado **Guía Tec**: un asistente vocacional que orienta a aspirantes a las carreras de informática del Tecnológico Superior de Jalisco (TSJ). Es un **prototipo académico no oficial**. El frontend (HTML/CSS/JS sin frameworks) llama a un backend Node.js con Express, y el backend conversa con un agente de Microsoft Foundry. Se despliega en Azure App Service (Linux, Node 24 LTS).

## Entorno de desarrollo
- WSL (Linux) con bash. Todos los comandos de terminal que propongas deben ser de bash, no de PowerShell.
- Node.js 24 LTS (instalado con nvm) y npm. Nada de TypeScript ni bundlers.

## Stack y versiones
- Express 5, ES Modules (`"type": "module"`), `async/await`.
- SDK de Foundry: `@azure/ai-projects` 2.x (API "Foundry projects (new)"). No uses `@azure/ai-agents` ni la API 1.x.
- Autenticación: `DefaultAzureCredential` de `@azure/identity`.
- Variables de entorno en local con `node --env-file-if-exists=.env` (sin dotenv).

## Arquitectura (no la cambies sin preguntar)
- `server.js`: sirve `public/` en `/`, expone `POST /api/chat` y `GET /health`.
- El navegador NUNCA habla directo con Foundry. Solo el backend.
- Conversación multi-turno: `openai.conversations.create()` y `openai.responses.create({ conversation, input }, agentRef)`, donde `agentRef = { body: { agent_reference: { name, type: "agent_reference" } } }`. La clave `agent` está obsoleta y Foundry la rechaza con un 400. El `conversation_id` viaja entre frontend y backend en el JSON.
- El servidor escucha en `process.env.PORT` (App Service lo define).
- La base de conocimiento del agente está en `conocimiento/` y se carga a Foundry como archivos para búsqueda (file search).

## Seguridad
- Nunca escribas llaves, tokens ni endpoints reales en el código. Todo sale de variables de entorno: `FOUNDRY_PROJECT_ENDPOINT`, `FOUNDRY_AGENT_NAME`.
- En Azure se usa identidad administrada (managed identity), no API keys.
- Valida la entrada (1 a 2000 caracteres) y responde 422 si no cumple.
- Si Foundry falla, responde 502 con un mensaje genérico; no filtres trazas.

## IA responsable (reglas del asistente)
- **Transparencia:** el asistente avisa que es una IA y que es un prototipo no oficial del TSJ, y cita el documento de donde sale cada dato.
- **Confiabilidad:** si el dato no está en la base de conocimiento, dice que no lo sabe y remite al sitio oficial (www.tsj.mx) o a Servicios Escolares. No inventa requisitos, fechas, costos ni becas.
- **Honestidad al orientar:** orienta y despierta interés sin presionar; no promete empleo, becas ni cupo.
- **Equidad:** trata igual a cualquier aspirante, sin suponer perfil, género ni origen.
- **Privacidad:** no pide datos personales innecesarios; solo guarda un contacto con consentimiento explícito.
- **Rendición de cuentas:** una persona del plantel da seguimiento a los prospectos; la IA solo orienta.
- **Inclusión:** la interfaz debe usarse bien en celular y admitir entrada por voz.

## Estilo de código
- Comentarios en español neutro; nombres de variables en inglés.
- Cambios mínimos y enfocados: no reescribas archivos completos si basta editar.

## Cómo validar
- Local: `npm run dev` y abrir http://localhost:3000
- Salud: `curl http://localhost:3000/health` debe devolver `{"status":"ok"}`
- Antes de desplegar, confirma que `package.json` incluye todo lo que se importa y que el script `start` es `node server.js`.
