// Sube los documentos de conocimiento/ a un vector store de Foundry para file search.
// Ejecuta: npm run load-knowledge    (requiere az login y el archivo .env)
// Guarda el id del vector store en .env (FOUNDRY_VECTOR_STORE_ID). Si ya existía uno, lo reemplaza.
import fs from "node:fs";
import path from "node:path";
import { AIProjectClient } from "@azure/ai-projects";
import { DefaultAzureCredential } from "@azure/identity";

const ENDPOINT = process.env.FOUNDRY_PROJECT_ENDPOINT;
const OLD_STORE_ID = process.env.FOUNDRY_VECTOR_STORE_ID;
const KNOWLEDGE_DIR = path.join(import.meta.dirname, "..", "conocimiento");
const ENV_PATH = path.join(import.meta.dirname, "..", ".env");

if (!ENDPOINT) {
  console.error("Falta FOUNDRY_PROJECT_ENDPOINT en .env");
  process.exit(1);
}

const files = fs.readdirSync(KNOWLEDGE_DIR).filter((name) => name.endsWith(".md"));
if (files.length === 0) {
  console.error(`No hay archivos .md en ${KNOWLEDGE_DIR}`);
  process.exit(1);
}

const project = new AIProjectClient(ENDPOINT, new DefaultAzureCredential());
const openai = project.getOpenAIClient();

const store = await openai.vectorStores.create({ name: "guia-tec-conocimiento" });
console.log(`Vector store creado: ${store.id}`);

for (const name of files) {
  const stream = fs.createReadStream(path.join(KNOWLEDGE_DIR, name));
  const uploaded = await openai.vectorStores.files.uploadAndPoll(store.id, stream);
  console.log(`Subido e indexado: ${name} (id: ${uploaded.id}, estado: ${uploaded.status})`);
}

// Reemplaza (o agrega) la variable en .env sin tocar las demás líneas
const env = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, "utf8") : "";
const line = `FOUNDRY_VECTOR_STORE_ID=${store.id}`;
const updated = /^FOUNDRY_VECTOR_STORE_ID=.*$/m.test(env)
  ? env.replace(/^FOUNDRY_VECTOR_STORE_ID=.*$/m, line)
  : `${env.replace(/\n*$/, "\n")}${line}\n`;
fs.writeFileSync(ENV_PATH, updated);
console.log("FOUNDRY_VECTOR_STORE_ID guardado en .env");

// Elimina el vector store anterior para no dejar recursos huérfanos
if (OLD_STORE_ID && OLD_STORE_ID !== store.id) {
  try {
    await openai.vectorStores.delete(OLD_STORE_ID);
    console.log(`Vector store anterior eliminado: ${OLD_STORE_ID}`);
  } catch (err) {
    console.warn(`No se pudo eliminar el anterior (${OLD_STORE_ID}): ${err.message}`);
  }
}
