import { encodeLEB128 } from "./lib";

class Integer {
  /** @type {"stack" | "local" | "global" | "memory"} */
  #storage = "stack";
  /** @type {number[]|I32|I64} a number or pointer */
  #value;
  /** @type {string} */
  #type;

  /**
   * @param {string} type
   * @param {number|bigint|I32|I64} value
   * @param {symbol} bypassToken 
   */
  constructor(type, value) {
    if (typeof value === "object") {
      this.#value = value;
      this.#type = type + "*";
      this.#storage = "local";
    } else {
      this.#value = encodeLEB128(type, value);
      this.#type = type;
      this.#storage = "stack";
    }
  }

  /**
   * @param {string} type
   * @param {number|bigint} value
   */
  static const(type, value) {
    return new Integer(type, value);
  }

  /**
   * @param {string} type
   * @param {I32|I64} ptr
   */
  static load(type, ptr) {
    return new Integer(type, ptr);
  }
}

export class I32 extends Integer {
  /**
   * @param {number|bigint|I32|I64} value
   * @param {symbol} bypassToken
   */
  constructor(value, bypassToken) {
    if (bypassToken !== I32.#PRIVATE_CONSTRUCTOR_TOKEN) {
      throw new Error("Private constructor. Use I32.const() to create an instance.");
    }
    super("s32", value);
  }

  /**
   * @param {number|bigint} value
   */
  static const(value) {
    return new I32(value, I32.#PRIVATE_CONSTRUCTOR_TOKEN);
  }

  /**
   * @param {I32|I64} ptr
   */
  static load(ptr) {
    return new I32(ptr, I32.#PRIVATE_CONSTRUCTOR_TOKEN)
  }

  // Private static symbol to bypass the private constructor check
  static #PRIVATE_CONSTRUCTOR_TOKEN = Symbol("PRIVATE_CONSTRUCTOR_TOKEN");
}

export class I64 extends Integer {
  /**
   * @param {number|bigint} value - The value to encode.
   * @param {symbol} bypassToken - A private token to bypass the constructor check.
   */
  constructor(value, bypassToken) {
    if (bypassToken !== I64.#PRIVATE_CONSTRUCTOR_TOKEN) {
      throw new Error("Private constructor. Use I64.const() to create an instance.");
    }
    super("s64", value); // Call parent constructor
  }

  /**
   * @param {number|bigint} value - The value to encode.
   * @returns {I64}
   */
  static const(value) {
    return new I64(value, I64.#PRIVATE_CONSTRUCTOR_TOKEN);
  }

  // Private static symbol to bypass the private constructor check
  static #PRIVATE_CONSTRUCTOR_TOKEN = Symbol("PRIVATE_CONSTRUCTOR_TOKEN");
}

export class U32 extends Integer {
  /**
   * @param {number|bigint} value - The value to encode.
   * @param {symbol} bypassToken - A private token to bypass the constructor check.
   */
  constructor(value, bypassToken) {
    if (bypassToken !== U32.#PRIVATE_CONSTRUCTOR_TOKEN) {
      throw new Error("Private constructor. Use U32.const() to create an instance.");
    }
    super("u32", value); // Call parent constructor
  }

  /**
   * @param {number|bigint} value - The value to encode.
   * @returns {U32}
   */
  static const(value) {
    return new U32(value, U32.#PRIVATE_CONSTRUCTOR_TOKEN);
  }

  // Private static symbol to bypass the private constructor check
  static #PRIVATE_CONSTRUCTOR_TOKEN = Symbol("PRIVATE_CONSTRUCTOR_TOKEN");
}

export class U64 extends Integer {
  /**
   * @param {number|bigint} value - The value to encode.
   * @param {symbol} bypassToken - A private token to bypass the constructor check.
   */
  constructor(value, bypassToken) {
    if (bypassToken !== U64.#PRIVATE_CONSTRUCTOR_TOKEN) {
      throw new Error("Private constructor. Use U64.const() to create an instance.");
    }
    super("u64", value); // Call parent constructor
  }

  /**
   * @param {number|bigint} value - The value to encode.
   * @returns {U64}
   */
  static const(value) {
    return new U64(value, U64.#PRIVATE_CONSTRUCTOR_TOKEN);
  }

  // Private static symbol to bypass the private constructor check
  static #PRIVATE_CONSTRUCTOR_TOKEN = Symbol("PRIVATE_CONSTRUCTOR_TOKEN");
}

/** @type {
  I32.const |
  I64.const |
  U32.const |
  U64.const}
 */
let a

export default W = {
  I32, I64, U32, U64
}
