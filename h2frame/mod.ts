export class Frame {
  // Frame Header property
  protected _header: Uint8Array;
  protected _length: number;
  protected _type: number;
  protected _typeString: string;
  protected _flag: number;
  protected _streamIdentifier: number;
  // Frame Payload
  protected _payload: Uint8Array;

  /**
   * Return frame type
   * @param {number} type
   * @returns {string}
   */
  private static GET_TYPE_STRING(type: number): string {
    switch (type) {
      case 0:
        return "DATA";
      case 1:
        return "HEADERS";
      case 2:
        return "PRIORITY";
      case 3:
        return "RST_STREAM";
      case 4:
        return "SETTINGS";
      case 5:
        return "PUSH_PROMISE";
      case 6:
        return "PING";
      case 7:
        return "GOAWAY";
      case 8:
        return "WINDOW_UPDATE";
      case 9:
        return "CONTINUATION";
      default:
        return "UNKNOWN";
    }
  }

  constructor(header: Uint8Array, payload?: Uint8Array) {
    if (header.length !== 9) throw new Error("Invalid Frame Header");
    this._header = header;
    let tmp = "";
    for (let i = 0; i < 3; i++) {
      tmp += header[i].toString(2).padStart(8, "0");
    }
    this._length = parseInt(tmp, 2);
    this._type = header[3];
    this._typeString = Frame.GET_TYPE_STRING(this._type);
    this._flag = header[4];
    tmp = "";
    for (let i = 5; i < 9; i++) {
      tmp += header[i].toString(2).padStart(8, "0");
    }
    this._streamIdentifier = parseInt(tmp, 2);

    this._payload = payload ?? new Uint8Array();

    if (this._length !== this._payload.byteLength) {
      throw new Error("Invalid Payload Length");
    }
  }

  /**
   * Update frame payload. Returns payload.byteLength.
   * @param {Uint8Array} payload
   * @returns {number}
   */
  public updatePayload(payload: Uint8Array): number {
    this._payload = payload;
    this._length = payload.byteLength;
    const tmp: string[] = [];
    this._length.toString(2).padStart(24, "0").match(/.{8}/g)?.forEach((
      v: string,
    ) => tmp.push(v));
    for (let i = 0; i < 3; i++) {
      this._header[i] = parseInt(tmp[i], 2);
    }
    return this._length;
  }

  /**
   * This protected method update frame header.
   * Child class use this to update.
   * @param {{type?: number, flag?: number, streamIdentifier: number}} header
   * @returns {boolean}
   */
  protected _updateHeader(header: {
    type?: number;
    flag?: number;
    streamIdentifier?: number;
  }): boolean {
    if (typeof header.type !== "undefined") {
      this._type = header.type;
      this._typeString = Frame.GET_TYPE_STRING(this._type);
      this._header[3] = this._type;
    }
    if (typeof header.flag !== "undefined") {
      this._flag = header.flag;
      this._header[4] = this._flag;
    }
    if (typeof header.streamIdentifier !== "undefined") {
      this._streamIdentifier = header.streamIdentifier;
      const tmp: string[] = [];
      this._streamIdentifier.toString(2).padStart(32, "0").match(/.{8}/g)
        ?.forEach((v: string) => tmp.push(v));
      for (let i = 5; i < 9; i++) {
        this._header[i] = parseInt(tmp[i - 5], 2);
      }
    }
    return true;
  }

  /**
   * Update frame Header.
   * @param {{type?: number, flag?: number, streamIdentifier: number}} header
   * @returns
   */
  public updateHeader(header: {
    type?: number;
    flag?: number;
    streamIdentifier?: number;
  }): boolean {
    return this._updateHeader(header);
  }
  get header() {
    return this._header;
  }
  get payload() {
    return this._payload;
  }
  get length() {
    return this._length;
  }
  get flag() {
    return this._flag;
  }
  get type() {
    return this._type;
  }
  get typeString() {
    return this._typeString;
  }
  get streamIdentifier() {
    return this._streamIdentifier;
  }
  get byteAll() {
    return new Uint8Array([...this._header, ...this._payload]);
  }
}

export class DataFrame extends Frame {
  // Frame Header Property
  private _flagString: string[] = [];

  /**
   * Return flag parameter.
   * @param {number} flag
   * @returns {string[]}
   */
  private static GET_FLAG_STRING(flag: number): string[] {
    const res: string[] = [];
    if (flag & 1) res.push("END_STREAM");
    if (flag & 8) res.push("PADDED");
    return res;
  }

  constructor(header: Uint8Array, payload?: Uint8Array) {
    if (header[3] !== 0) throw new Error("Invalid Frame Type");
    super(header, payload);
    this._flagString = DataFrame.GET_FLAG_STRING(this._flag);
  }

  /**
   * Create DataFrame from parameter.
   * @param {{flag?: number, streamIdentifier?: number, payload?: Uint8Array} | undefined} setting
   * @returns {DataFrame}
   */
  public static create(setting?: {
    flag?: number;
    streamIdentifier?: number;
    payload?: Uint8Array;
  }): DataFrame {
    const header = new Uint8Array(9);
    if (typeof setting === "undefined") return new DataFrame(header);

    const length = setting.payload?.byteLength ?? 0;
    let tmp: string[] = [];
    length.toString(2).padStart(24, "0").match(/.{8}/g)?.forEach((v: string) =>
      tmp.push(v)
    );
    for (let i = 0; i < 3; i++) {
      header[i] = parseInt(tmp[i], 2);
    }

    header[4] = setting.flag ?? 0;

    setting.streamIdentifier ??= 0;
    tmp = [];
    setting.streamIdentifier.toString(2).padStart(32, "0").match(/.{8}/g)
      ?.forEach((v: string) => tmp.push(v));
    for (let i = 5; i < 9; i++) {
      header[i] = parseInt(tmp[i - 5], 2);
    }

    return new DataFrame(header, setting.payload);
  }

  /**
   * Update Dataframe header.
   * @param {{flag?: number, streamIdentifier?: number}} header
   * @returns {boolean}
   */
  public updateHeader(header: {
    flag?: number;
    streamIdentifier?: number;
  }): boolean {
    this._updateHeader(header);
    if (typeof header.flag !== "undefined") {
      this._flagString = DataFrame.GET_FLAG_STRING(this._flag);
    }
    return true;
  }

  get flagString() {
    return this._flagString;
  }
}

export class HeadersFrame extends Frame {
  // Frame Header Property
  private _flagString: string[] = [];

  /**
   * Return flag parameter.
   * @param {number} flag
   * @returns {string[]}
   */
  private static GET_FLAG_STRING(flag: number): string[] {
    const res: string[] = [];
    if (flag & 1) res.push("END_STREAM");
    if (flag & 4) res.push("END_HEADERS");
    if (flag & 8) res.push("PADDED");
    if (flag & 20) res.push("PRIORITY");
    return res;
  }

  constructor(header: Uint8Array, payload?: Uint8Array) {
    if (header[3] !== 1) throw new Error("Invalid Frame Type");
    super(header, payload);
    this._flagString = HeadersFrame.GET_FLAG_STRING(this._flag);
  }

  /**
   * Create HeadersFrame from parameter.
   * @param {{flag?: number, streamIdentifier?: number, payload?: Uint8Array} | undefined} setting
   * @returns {HeadersFrame}
   */
  public static create(setting?: {
    flag?: number;
    streamIdentifier?: number;
    payload?: Uint8Array;
  }): HeadersFrame {
    const header = new Uint8Array(9);
    header[3] = 1;
    if (typeof setting === "undefined") return new HeadersFrame(header);

    const length = setting.payload?.byteLength ?? 0;
    let tmp: string[] = [];
    length.toString(2).padStart(24, "0").match(/.{8}/g)?.forEach((v: string) =>
      tmp.push(v)
    );
    for (let i = 0; i < 3; i++) {
      header[i] = parseInt(tmp[i], 2);
    }

    header[4] = setting.flag ?? 0;

    setting.streamIdentifier ??= 0;
    tmp = [];
    setting.streamIdentifier.toString(2).padStart(32, "0").match(/.{8}/g)
      ?.forEach((v: string) => tmp.push(v));
    for (let i = 5; i < 9; i++) {
      header[i] = parseInt(tmp[i - 5], 2);
    }

    return new HeadersFrame(header, setting.payload);
  }

  /**
   * Update HeadersFrame header.
   * @param {{flag?: number, streamIdentifier?: number}} header
   * @returns {boolean}
   */
  public updateHeader(
    header: { flag?: number; streamIdentifier?: number },
  ): boolean {
    super._updateHeader(header);
    if (typeof header.flag !== "undefined") {
      this._flagString = HeadersFrame.GET_FLAG_STRING(this._flag);
    }
    return true;
  }

  get flagString() {
    return this._flagString;
  }
}

export class SettingsFrame extends Frame {
  // Frame Header Property
  private _flagString: string[] = [];

  /**
   * Return flag parameter.
   * @param {number} flag
   * @returns {string[]}
   */
  private static GET_FLAG_STRING(flag: number): string[] {
    const res: string[] = [];
    if (flag & 1) res.push("ACK");
    return res;
  }

  constructor(header: Uint8Array, payload?: Uint8Array) {
    if (header[3] !== 4) throw new Error("Invalid Frame Type");
    super(header, payload);
    this._flagString = SettingsFrame.GET_FLAG_STRING(this._flag);
  }

  /**
   * Create SettingsDrame from parameter.
   * @param {{flag?: number, streamIdentifier?: number, payload?: Uint8Array} | undefined} setting
   * @returns {SettingsFrame}
   */
  public static create(setting?: {
    flag?: number;
    streamIdentifier?: number;
    payload?: Uint8Array;
  }): SettingsFrame {
    const header = new Uint8Array(9);
    header[3] = 4;
    if (typeof setting === "undefined") return new SettingsFrame(header);

    const length = setting.payload?.byteLength ?? 0;
    let tmp: string[] = [];
    length.toString(2).padStart(24, "0").match(/.{8}/g)?.forEach((v: string) =>
      tmp.push(v)
    );
    for (let i = 0; i < 3; i++) {
      header[i] = parseInt(tmp[i], 2);
    }

    header[4] = setting.flag ?? 0;

    setting.streamIdentifier ??= 0;
    tmp = [];
    setting.streamIdentifier.toString(2).padStart(32, "0").match(/.{8}/g)
      ?.forEach((v: string) => tmp.push(v));
    for (let i = 5; i < 9; i++) {
      header[i] = parseInt(tmp[i - 5], 2);
    }

    return new SettingsFrame(header, setting.payload);
  }

  /**
   * Update SettingsFrame header.
   * @param {{flag?: number, streamIdentifier?: number}} header
   * @returns {boolean}
   */
  public updateHeader(header: {
    flag?: number;
    streamIdentifier?: number;
  }): boolean {
    this._updateHeader(header);
    if (typeof header.flag !== "undefined") {
      this._flagString = SettingsFrame.GET_FLAG_STRING(this._flag);
    }
    return true;
  }

  /**
   * Set Settings frame payload parameter.
   * Returns payload.byteLength.
   * @param {
   *         | "SETTINGS_HEADER_TABLE_SIZE"
   *         | "SETTINGS_ENABLE_PUSH"
   *         | "SETTINGS_MAX_CONCURRENT_STREAMS"
   *         | "SETTINGS_INITIAL_WINDOW_SIZE"
   *         | "SETTINGS_MAX_FRAME_SIZE"
   *         | "SETTINGS_MAX_HEADER_LIST_SIZE"
   *        } identifier
   * @param {number} value
   * @returns
   */
  public setParameter(
    identifier:
      | "SETTINGS_HEADER_TABLE_SIZE"
      | "SETTINGS_ENABLE_PUSH"
      | "SETTINGS_MAX_CONCURRENT_STREAMS"
      | "SETTINGS_INITIAL_WINDOW_SIZE"
      | "SETTINGS_MAX_FRAME_SIZE"
      | "SETTINGS_MAX_HEADER_LIST_SIZE",
    value: number,
  ): number {
    const payload = new Uint8Array(6);
    switch (identifier) {
      case "SETTINGS_HEADER_TABLE_SIZE":
        payload[1] = 1;
        break;
      case "SETTINGS_ENABLE_PUSH":
        payload[1] = 2;
        break;
      case "SETTINGS_MAX_CONCURRENT_STREAMS":
        payload[1] = 3;
        break;
      case "SETTINGS_INITIAL_WINDOW_SIZE":
        payload[1] = 4;
        break;
      case "SETTINGS_MAX_FRAME_SIZE":
        payload[1] = 5;
        break;
      case "SETTINGS_MAX_HEADER_LIST_SIZE":
        payload[1] = 6;
        break;
      default:
        throw new Error("invalid identifier");
    }
    const tmp: string[] = [];
    value.toString(2).padStart(32, "0").match(/.{8}/g)?.forEach((v: string) =>
      tmp.push(v)
    );
    for (let i = 2; i < 6; i++) {
      payload[i] = parseInt(tmp[i - 2], 2);
    }
    return this.updatePayload(new Uint8Array([...this._payload, ...payload]));
  }

  /**
   * Return settings frame payload parameter array.
   * @returns {{ [identifier: string]: number }[]}
   */
  public readParaeter(): { [identifier: string]: number }[] {
    const params = [];
    for (let i = 0; i < this._payload.length; i += 6) {
      const segment = new Uint8Array(this._payload.slice(i, i + 6));
      let identifier;
      switch (segment[1]) {
        case 1:
          identifier = "SETTINGS_HEADER_TABLE_SIZE";
          break;
        case 2:
          identifier = "SETTINGS_ENABLE_PUSH";
          break;
        case 3:
          identifier = "SETTINGS_MAX_CONCURRENT_STREAMS";
          break;
        case 4:
          identifier = "SETTINGS_INITIAL_WINDOW_SIZE";
          break;
        case 5:
          identifier = "SETTINGS_MAX_FRAME_SIZE";
          break;
        case 6:
          identifier = "SETTINGS_MAX_HEADER_LIST_SIZE";
          break;
        default:
          continue;
      }
      const tmp: string[] = [];
      for (let i = 2; i < 6; i++) {
        tmp.push(segment[i].toString(2).padStart(8, "0"));
      }
      const value = parseInt(tmp.join(""), 2);
      params.push({ [identifier]: value });
    }
    return params;
  }

  get flagString() {
    return this._flagString;
  }
}
