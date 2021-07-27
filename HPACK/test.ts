import {
  serve,
  Server,
  ServerRequest,
} from "https://deno.land/std@0.100.0/http/server.ts";
const server: Server = serve({ port: 8080 });
for await (const req: ServerRequest of server) {
  req.respond({ body: "Hello World\n" });
}
