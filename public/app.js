const form = document.getElementById("chat-form");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send");
const messages = document.getElementById("messages");

let conversationId = null; // se reinicia al recargar la página

function addMessage(text, who) {
  const div = document.createElement("div");
  div.className = `msg ${who}`;
  div.textContent = text; // textContent evita inyectar HTML (XSS)
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
  return div;
}

// Respuesta del bot con las fuentes que usó (transparencia)
function addBotReply(text, sources) {
  const div = addMessage(text, "bot");
  if (sources?.length) {
    const note = document.createElement("div");
    note.className = "sources";
    note.textContent = `Fuente: ${sources.join(" · ")}`; // textContent, nunca innerHTML
    div.appendChild(note);
    messages.scrollTop = messages.scrollHeight;
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";
  sendBtn.disabled = true;
  const typing = addMessage("Escribiendo…", "bot typing");

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, conversation_id: conversationId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Error del servidor");
    conversationId = data.conversation_id;
    typing.remove();
    addBotReply(data.reply, data.sources);
  } catch (err) {
    typing.remove();
    addMessage(`Ups: ${err.message}`, "bot error");
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
});
