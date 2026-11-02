// Crea (o actualiza) el agente de Microsoft Foundry que usará Guía Tec.
// Ejecuta: npm run create-agent    (requiere az login y el archivo .env)
// Cada ejecución publica una versión nueva del agente con las instrucciones de abajo.
import { AIProjectClient } from "@azure/ai-projects";
import { DefaultAzureCredential } from "@azure/identity";

const ENDPOINT = process.env.FOUNDRY_PROJECT_ENDPOINT;
const AGENT_NAME = process.env.FOUNDRY_AGENT_NAME ?? "guia-tec";
const MODEL = process.env.FOUNDRY_MODEL_DEPLOYMENT ?? "gpt-5-mini";
const VECTOR_STORE_ID = process.env.FOUNDRY_VECTOR_STORE_ID; // lo genera npm run load-knowledge

if (!ENDPOINT) {
  console.error("Falta FOUNDRY_PROJECT_ENDPOINT en .env");
  process.exit(1);
}

const INSTRUCTIONS = `Eres Guía Tec, un asistente vocacional que orienta a aspirantes a las carreras
de informática del Tecnológico Superior de Jalisco (TSJ). Eres una IA y un
prototipo académico NO oficial.
Preséntate así SOLO en tu primer mensaje de la conversación; en los siguientes
responde directo, sin saludar ni repetir quién eres.
Responde en español, con tono cálido y claro, en máximo 4 párrafos.
Ayuda al aspirante a descubrir si Informática encaja con él: pregunta por sus
intereses (programar, redes, datos, electrónica) de a pocas preguntas.
Orienta sin presionar. No prometas empleo, becas ni cupo.
Usa solo información verificada; si no tienes un dato (fechas, costos,
requisitos), dilo y remite a www.tsj.mx o a Servicios Escolares.
Si hablas de materias, contenidos o campo laboral de la carrera sin una fuente
del TSJ, aclara que es información general sobre la disciplina y no el plan de
estudios del TSJ.
Trata igual a cualquier aspirante, sin suponer género, origen ni nivel.
No pidas datos personales innecesarios.`;

// Con base de conocimiento: el agente busca primero en los documentos del TSJ y cita la fuente
const KNOWLEDGE_RULES = `
Antes de responder cualquier dato sobre el TSJ (carreras, unidades, admisión,
costos, fechas), busca en la base de conocimiento con file search.
Responde solo con lo que encuentres y menciona la fuente (por ejemplo,
"según La Crónica, agosto de 2025"). Si el dato es de 2025 o de otro ciclo,
dilo y recomienda confirmarlo en www.tsj.mx.
Si la búsqueda no encuentra el dato (becas, plan de estudios, documentos
requeridos, teléfono), di claramente que no lo tienes; no lo inventes.`;

const project = new AIProjectClient(ENDPOINT, new DefaultAzureCredential());

const agent = await project.agents.createVersion(AGENT_NAME, {
  kind: "prompt",
  model: MODEL,
  instructions: VECTOR_STORE_ID ? INSTRUCTIONS + KNOWLEDGE_RULES : INSTRUCTIONS,
  ...(VECTOR_STORE_ID && {
    tools: [{ type: "file_search", vector_store_ids: [VECTOR_STORE_ID] }],
  }),
});
console.log(`Agente listo -> nombre: ${agent.name}, versión: ${agent.version}`);
console.log(VECTOR_STORE_ID ? `Con base de conocimiento: ${VECTOR_STORE_ID}` : "Sin base de conocimiento");
