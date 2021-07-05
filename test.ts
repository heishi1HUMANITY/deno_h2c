import { DataFrame, Frame, SettingsFrame } from "./h2frame/mod.ts";
import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.100.0/testing/asserts.ts";

Deno.test({
  name: "Frame Create Test",
  fn: () => {
    const header = new Uint8Array(9);
    const payload = new TextEncoder().encode("hello");
    const length = payload.byteLength;
    const tmp: string[] = [];
    length.toString(2).padStart(24, "0").match(/.{8}/g)?.forEach((v) =>
      tmp.push(v)
    );
    for (let i = 0; i < 3; i++) {
      header[i] = parseInt(tmp[i], 2);
    }
    const frame = new Frame(header, payload);
    assertEquals(frame.header, header);
    assertEquals(frame.payload, payload);
    assertEquals(frame.length, length);
    assertEquals(frame.flag, 0);
    assertEquals(frame.type, 0);
    assertEquals(frame.typeString, "DATA");
    assertEquals(frame.streamIdentifier, 0);
  },
});

Deno.test({
  name: "Frame typeString Test",
  fn: () => {
    const header = new Uint8Array(9);
    for (let i = 0; i < 10; i++) {
      header[3] = i;
      const frame = new Frame(header);
      let type = "";
      switch (i) {
        case 0:
          type = "DATA";
          break;
        case 1:
          type = "HEADERS";
          break;
        case 2:
          type = "PRIORITY";
          break;
        case 3:
          type = "RST_STREAM";
          break;
        case 4:
          type = "SETTINGS";
          break;
        case 5:
          type = "PUSH_PROMISE";
          break;
        case 6:
          type = "PING";
          break;
        case 7:
          type = "GOAWAY";
          break;
        case 8:
          type = "WINDOW_UPDATE";
          break;
        case 9:
          type = "CONTINUATION";
          break;
      }
      assertEquals(frame.typeString, type);
    }
  },
});

Deno.test({
  name: "Frame Payload Update Test",
  fn: () => {
    const frame = new Frame(new Uint8Array(9));
    const payload = new TextEncoder().encode("test");
    frame.updatePayload(payload);
    assertEquals(frame.payload, payload);
    assertEquals(frame.length, payload.byteLength);
    assertEquals(frame.header[2], payload.byteLength);
  },
});

Deno.test({
  name: "Frame Header Update Test",
  fn: () => {
    const frame = new Frame(new Uint8Array(9));
    frame.updateHeader({
      type: 1,
      flag: 1,
      streamIdentifier: 1,
    });
    assertEquals(frame.type, 1);
    assertEquals(frame.header[3], 1);
    assertEquals(frame.typeString, "HEADERS");
    assertEquals(frame.flag, 1);
    assertEquals(frame.header[4], 1);
    assertEquals(frame.streamIdentifier, 1);
    assertEquals(frame.header[8], 1);
  },
});

Deno.test({
  name: "Frame Error Test",
  fn: () => {
    let header = new Uint8Array(10);
    assertThrows(() => new Frame(header), Error, "Invalid Frame Header");
    header = new Uint8Array([0, 0, 1, 0, 0, 0, 0, 0, 0]);
    assertThrows(() => new Frame(header), Error, "Invalid Payload Length");
  },
});

Deno.test({
  name: "DataFrame Create Test",
  fn: () => {
    const header = new Uint8Array(9);
    let frame = new DataFrame(header);
    assertEquals(frame.header, header);
    assertEquals(frame.length, 0);
    assertEquals(frame.flag, 0);
    assertEquals(frame.type, 0);
    assertEquals(frame.typeString, "DATA");
    assertEquals(frame.streamIdentifier, 0);
    assertEquals(frame.flagString, []);
    header[4] = 1;
    frame = new DataFrame(header);
    assertEquals(frame.flagString, ["END_STREAM"]);
    header[4] = 8;
    frame = new DataFrame(header);
    assertEquals(frame.flagString, ["PADDED"]);
    header[4] = 9;
    frame = new DataFrame(header);
    assertEquals(frame.flagString, ["END_STREAM", "PADDED"]);

    frame = DataFrame.create();
    assertEquals(frame.length, 0);
    assertEquals(frame.flag, 0);
    assertEquals(frame.type, 0);
    assertEquals(frame.typeString, "DATA");
    assertEquals(frame.streamIdentifier, 0);
    assertEquals(frame.flagString, []);
    frame = DataFrame.create({
      flag: 1,
    });
    assertEquals(frame.flagString, ["END_STREAM"]);
    frame = DataFrame.create({
      flag: 8,
    });
    assertEquals(frame.flagString, ["PADDED"]);
    frame = DataFrame.create({
      flag: 9,
    });
    assertEquals(frame.flagString, ["END_STREAM", "PADDED"]);
    const payload = new TextEncoder().encode("test");
    frame = DataFrame.create({
      payload,
    });
    assertEquals(frame.payload, payload);
    assertEquals(frame.length, payload.byteLength);
    assertEquals(frame.header[2], payload.byteLength);
  },
});

Deno.test({
  name: "DataFrame Header update Test",
  fn: () => {
    const frame = DataFrame.create();
    frame.updateHeader({
      flag: 1,
      streamIdentifier: 1,
    });
    assertEquals(frame.flag, 1);
    assertEquals(frame.flagString, ["END_STREAM"]);
    assertEquals(frame.streamIdentifier, 1);
    frame.updateHeader({
      flag: 8,
    });
    assertEquals(frame.flag, 8);
    assertEquals(frame.flagString, ["PADDED"]);
    assertEquals(frame.streamIdentifier, 1);
    frame.updateHeader({
      flag: 9,
    });
    assertEquals(frame.flag, 9);
    assertEquals(frame.flagString, ["END_STREAM", "PADDED"]);
    assertEquals(frame.streamIdentifier, 1);
  },
});

Deno.test({
  name: "DataFrame Error Test",
  fn: () => {
    const header = new Uint8Array([0, 0, 0, 1, 0, 0, 0, 0, 0]);
    assertThrows(() => new DataFrame(header), Error, "Invalid Frame Type");
  },
});

Deno.test({
  name: "SettingsFrame Create Test",
  fn: () => {
    const header = new Uint8Array(9);
    header[3] = 4;
    let frame = new SettingsFrame(header);
    assertEquals(frame.header, header);
    assertEquals(frame.length, 0);
    assertEquals(frame.flag, 0);
    assertEquals(frame.type, 4);
    assertEquals(frame.typeString, "SETTINGS");
    assertEquals(frame.streamIdentifier, 0);
    assertEquals(frame.flagString, []);
    header[4] = 1;
    frame = new SettingsFrame(header);
    assertEquals(frame.flagString, ["ACK"]);

    frame = SettingsFrame.create();
    assertEquals(frame.length, 0);
    assertEquals(frame.flag, 0);
    assertEquals(frame.type, 4);
    assertEquals(frame.typeString, "SETTINGS");
    assertEquals(frame.streamIdentifier, 0);
    assertEquals(frame.flagString, []);
    frame = SettingsFrame.create({
      flag: 1,
      payload: new Uint8Array(6),
    });
    assertEquals(frame.flagString, ["ACK"]);
    assertEquals(frame.length, 6);
  },
});

Deno.test({
  name: "SettingsFrame Header Update Test",
  fn: () => {
    const frame = SettingsFrame.create();
    frame.updateHeader({
      flag: 1,
    });
    assertEquals(frame.flag, 1);
    assertEquals(frame.flagString, ["ACK"]);
    assertEquals(frame.streamIdentifier, 0);

    frame.updateHeader({
      flag: 0,
      streamIdentifier: 1,
    });
    assertEquals(frame.flag, 0);
    assertEquals(frame.flagString, []);
    assertEquals(frame.streamIdentifier, 1);
  },
});

Deno.test({
  name: "SettingsFrame Set Parameter Test",
  fn: () => {
    const frame = SettingsFrame.create();
    frame.setParameter("SETTINGS_HEADER_TABLE_SIZE", 4096);
    assertEquals(frame.length, 6);
    assertEquals(frame.payload[1], 1);
    assertEquals(frame.payload[4], 16);
    frame.setParameter("SETTINGS_ENABLE_PUSH", 0);
    assertEquals(frame.length, 12);
    assertEquals(frame.payload[7], 2);
    assertEquals(frame.payload[11], 0);
  },
});

Deno.test({
  name: "SettingsFrame Read Parameter Test",
  fn: () => {
    const frame = SettingsFrame.create();
    let params = frame.readParaeter();
    assertEquals(params.length, 0);
    frame.setParameter("SETTINGS_HEADER_TABLE_SIZE", 4096);
    params = frame.readParaeter();
    assertEquals(params[0], { "SETTINGS_HEADER_TABLE_SIZE": 4096 });
    frame.setParameter("SETTINGS_ENABLE_PUSH", 0);
    params = frame.readParaeter();
    assertEquals(params.length, 2);
    assertEquals(params[1], { "SETTINGS_ENABLE_PUSH": 0 });
  },
});

Deno.test({
  name: "SettingsFrame Error Test",
  fn: () => {
    assertThrows(
      () => new SettingsFrame(new Uint8Array()),
      Error,
      "Invalid Frame Type",
    );
  },
});
