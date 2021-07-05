import { BufReader, BufWriter } from "https://deno.land/std@0.99.0/io/bufio.ts";
import { TextProtoReader } from "https://deno.land/std@0.99.0/textproto/mod.ts";

const socket: Deno.Listener = Deno.listen({ port: 8080 });
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const getFrame = async (r: BufReader): Promise<[Uint8Array, Uint8Array]> => {
  const frameHeader = new Uint8Array(9);
  await r.read(frameHeader);
  const tmp: string[] = [];
  for (let i = 0; i < 3; i++) {
    tmp.push(frameHeader[i].toString(2).padStart(8, "0"));
  }
  const len = parseInt(tmp.join(""), 2);
  const framePayload = new Uint8Array(len);
  await r.read(framePayload);
  return [frameHeader, framePayload];
};

for await (const conn of socket) {
  const r = new BufReader(conn);
  const w = new BufWriter(conn);
  // const tp = new TextProtoReader(r);

  // // HTTP/1.1 upgrade header
  // const firstHeader = await tp.readLine();
  // if (firstHeader?.split(' ')[2] === 'HTTP/1.1') {
  //   const headers = await tp.readMIMEHeader();
  //   console.log(headers?.get('upgrade'));
  //   if (headers?.get('upgrade')?.toLowerCase() === 'h2c') {
  //     await w.write(encoder.encode('HTTP/1.1 101 Switching Protocols\r\n'));
  //     await w.write(encoder.encode('Connection: Upgrade\r\n'));
  //     await w.write(encoder.encode('Upgrade: h2c\r\n'));
  //     await w.write(encoder.encode('\r\n'));
  //     await w.flush();
  //   }
  // }

  // magic packet
  console.log("magic packet");
  let req: Uint8Array = new Uint8Array(24);
  await r.read(req);
  let s = decoder.decode(req);
  s = s.replace(/\r/g, "r").replace(/\n/g, "n");
  console.log(s);

  for (let i = 0; i < 7; i++) {
    console.log(await getFrame(r));
  }

  let res: Uint8Array = new Uint8Array([
    0,
    0,
    0,
    4,
    0,
    0,
    0,
    0,
    0,
  ]);
  await w.write(res);
  await w.flush();

  await getFrame(r);

  res = new Uint8Array([
    0,
    0,
    0,
    4,
    1,
    0,
    0,
    0,
    0,
  ]);
  await w.write(res);
  await w.flush();

  const headersPayload = new Uint8Array([
    0x88,
  ]);
  res = new Uint8Array([
    0,
    0,
    1,
    1,
    4,
    0,
    0,
    0,
    13,
  ]);
  await w.write(res);
  await w.write(headersPayload);
  await w.flush();

  const body = encoder.encode('<img src="./img">\n');
  res = new Uint8Array([
    0,
    0,
    body.byteLength,
    0,
    0,
    0,
    0,
    0,
    13,
  ]);
  await w.write(res);
  await w.write(body);
  await w.flush();

  res = new Uint8Array([
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    13,
  ]);
  await w.write(res);
  await w.flush();

  console.log("close");
  conn.close();
}
