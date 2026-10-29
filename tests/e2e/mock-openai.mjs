import { createServer } from "node:http";

const port = 4010;
const server = createServer((request, response) => {
  if (request.method === "GET" && request.url === "/health") {
    response.writeHead(200, { "content-type": "text/plain" }).end("ok");
    return;
  }

  if (request.method !== "POST" || request.url !== "/v1/responses") {
    response.writeHead(404).end();
    return;
  }

  request.resume();
  request.on("end", () => {
    response.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({
      id: "resp-playwright",
      object: "response",
      created_at: 1,
      model: "gpt-4o-mini",
      status: "completed",
      output: [{
        id: "msg-playwright",
        type: "message",
        role: "assistant",
        content: [{
          type: "output_text",
          text: JSON.stringify({
            actions: [{ action: "CREATE", entityType: "task", title: "E2E dentist appointment" }],
          }),
          annotations: [],
        }],
      }],
      usage: { input_tokens: 1, output_tokens: 1 },
    }));
  });
});

server.listen(port, "127.0.0.1");
