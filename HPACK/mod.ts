export class Hpack {
  public static readonly STATIC_TABLE: { [name: string]: string }[] = [
    { ":authority": "" },
    { ":method": "GET" },
    { ":method": "POST" },
    { ":path": "/" },
    { ":path": "/index.html" },
    { ":scheme": "http" },
    { ":scheme": "https" },
    { ":status": "200" },
    { ":status": "204" },
    { ":status": "206" },
    { ":status": "304" },
    { ":status": "400" },
    { ":stauts": "404" },
    { ":status": "500" },
    { "accept-charset": "" },
    { "accept-encoding": "gzip, deflate" },
    { "accept-language": "" },
    { "accept-ranges": "" },
    { "accept": "" },
    { "access-control-allow-origin": "" },
    { "age": "" },
    { "allow": "" },
    { "authorization": "" },
    { "cache-control": "" },
    { "content-disposition": "" },
    { "content-encoding": "" },
    { "content-language": "" },
    { "content-length": "" },
    { "content-location": "" },
    { "content-range": "" },
    { "content-type": "" },
    { "cookie": "" },
    { "date": "" },
    { "etag": "" },
    { "expect": "" },
    { "expires": "" },
    { "from": "" },
    { "host": "" },
    { "if-match": "" },
    { "if-modified-since": "" },
    { "if-none-match": "" },
    { "if-range": "" },
    { "if-unmodified-since": "" },
    { "last-modified": "" },
    { "link": "" },
    { "location": "" },
    { "max-forwards": "" },
    { "proxy-authenticate": "" },
    { "proxy-authorization": "" },
    { "range": "" },
    { "referer": "" },
    { "refresh": "" },
    { "retry-after": "" },
    { "server": "" },
    { "set-cookie": "" },
    { "strict-transport-security": "" },
    { "transfer-encoding": "" },
    { "user-agent": "" },
    { "vary": "" },
    { "via": "" },
    { "www-authenticate": "" },
  ];
  public readonly dynamic_table: { [name: string]: string }[] = [];
  private static encodeString(s: string): Uint8Array {
    const textEncoder: TextEncoder = new TextEncoder();
    const encodedString: Uint8Array = textEncoder.encode(s);
    const length: number = encodedString.byteLength;
    return new Uint8Array([length, ...encodedString]);
  }
  private static decodeString(b: Uint8Array): string {
    const body: Uint8Array = b.slice(1, b.length);
    const textDecoder: TextDecoder = new TextDecoder();
    if (b[0].toString(2).padStart(8, '0')[0] !== '1') {
      return textDecoder.decode(body);
    }
    
  }
}
