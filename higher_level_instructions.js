import { GlobalContext } from "./higher_level_lib.js";
import { encodeLEB128 } from "./lib.js";

// export const Type = {
//   // Number type
//   i32: 0x7f,
//   i64: 0x7e,
//   f32: 0x7d,
//   f64: 0x7c,
//   // Vector type
//   v128: 0x7b,
//   // Reference type
//   funcref: 0x70,
//   externref: 0x6f,
//   // Function type
//   func: 0x60,
//   /** @type {(args?: number[], rets?: number[]) => number[]} */
//   Func: (args = [], rets = []) => byte`\x60${args.length}${args}${rets.length}${rets}`,
//   // Result type
//   result: 0x40,
//   // Table type
//   Table: (type, limits) => byte`${type}${limits}`,
//   // Memory type
//   // Global type

//   // Inverted
//   [0x7f]: "i32",
//   [0x7e]: "i64",
//   [0x7d]: "f32",
//   [0x7c]: "f64",
//   [0x7b]: "v128",
//   [0x70]: "funcref",
//   [0x6f]: "externref",
//   [0x60]: "func",
//   [0x40]: "result",
// };

export class Num {
  /** @type {"stack" | "local" | "global" | "memory"} */
  #storage = "stack";
  /** @type {number|I32|I64|U32|U64|F32|F64} a number or pointer */
  #value;
  /** @type {string} */
  #type;

  /**
   * @param {string} type
   * @param {number|bigint|I32|I64|U32|U64|F32|F64} value
   */
  constructor(type, value) {
    if (typeof value === "object") {
      this.#value = value;
      this.#type = type + "*";
      this.#storage = "local";
    } else {
      this.#value = value;
      this.#type = type;
      this.#storage = "stack";
    }
  }

  /**
   * @param {string} type
   * @param {number|bigint} value
   */
  static const(type, value) {
    console.log(this, new Error("Called base class Num"))
    return new Num(type, value);
  }

  // Private static symbol to bypass the private constructor check
  static #PRIVATE_CONSTRUCTOR_TOKEN = Symbol("PRIVATE_CONSTRUCTOR_TOKEN");

  static param(name) {
    console.log(this, new Error("Called base class Int"))
    console.log(`param("${name}")`, this, this.const({}))
    return this.const({})
  }

  /**
   * @param {string} type
   * @param {I32|I64} ptr
   */
  static load(type, ptr) {
    console.log(this, new Error("Called base class Num"))
    return new Num(type, ptr);
  }

  /**
   * @param {number?} num
   * @returns {Num}
   */
  add(num) {
    console.log(this.constructor, new Error("Called base class Num"))
    console.log(this, `.add(${num})`)
    return this;
  }
}

export class Int extends Num {

  /**
   * @param {string} type
   * @param {number|bigint|I32|I64|U32|U64} value
   */
  constructor(type, value) {
    super(type, value)
  }

  /**
   * @param {string} type
   * @param {number|bigint} value
   */
  static const(type, value) {
    return new Int(type, value);
  }

  /**
   * @param {string} type
   * @param {I32|I64} ptr
   */
  static load(type, ptr) {
    return new Int(type, ptr);
  }
}

export class I64 extends Int {
  /**
   * @param {number|bigint} value - The value to encode.
   * @param {symbol} bypass_token - A private token to bypass the constructor check.
   */
  constructor(value, bypass_token) {
    if (bypass_token !== I64.#PRIVATE_CONSTRUCTOR_TOKEN) {
      throw new Error("Private constructor. Use I64.const() to create an instance.");
    }
    super("i64", value); // Call parent constructor
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

export class I32 extends Int {
  /**
   * @param {number|bigint|I8|I16|I32|I64} value
   * @param {symbol} bypass_token
   */
  constructor(value, bypass_token, type = "i32") {
    if (bypass_token !== I32.#PRIVATE_CONSTRUCTOR_TOKEN) {
      throw new Error("Private constructor. Use I32.const() to create an instance.");
    }
    super(type, value);
  }

  /**
   * @param {number|bigint} value
   */
  static const(value) {
    const val = new I32(value, I32.#PRIVATE_CONSTRUCTOR_TOKEN);
    // console.log(GlobalContext.current_app)
    return val
  }

  // Private static symbol to bypass the private constructor check
  static #PRIVATE_CONSTRUCTOR_TOKEN = Symbol("PRIVATE_CONSTRUCTOR_TOKEN");

  /**
   * @param {I32|I64} ptr
   */
  static load(ptr) {
    return new I32(ptr, I32.#PRIVATE_CONSTRUCTOR_TOKEN)
  }
}

export class I16 extends I32 {
  /**
   * @param {number|bigint} value
   * @param {symbol} bypass_token
   */
  constructor(value, bypass_token) {
    if (bypass_token !== I16.#PRIVATE_CONSTRUCTOR_TOKEN) {
      throw new Error("Private constructor. Use I16.const() to create an instance.");
    }
    super("i16", value);
  }

  /**
   * @param {number|bigint} value
   */
  static const(value) {
    return new I16(value, I16.#PRIVATE_CONSTRUCTOR_TOKEN);
  }

  // Private static symbol to bypass the private constructor check
  static #PRIVATE_CONSTRUCTOR_TOKEN = Symbol("PRIVATE_CONSTRUCTOR_TOKEN");

  /**
   * @param {I32|I64} ptr
   */
  static load(ptr) {
    return new I16(ptr, I16.#PRIVATE_CONSTRUCTOR_TOKEN)
  }
}

export class I8 extends I32 {
  /**
   * @param {number|bigint} value
   * @param {symbol} bypass_token
   */
  constructor(value, bypass_token) {
    if (bypass_token !== I8.#PRIVATE_CONSTRUCTOR_TOKEN) {
      throw new Error("Private constructor. Use I8.const() to create an instance.");
    }
    super("i8", value);
  }

  /**
   * @param {number|bigint} value
   */
  static const(value) {
    return new I8(value, I8.#PRIVATE_CONSTRUCTOR_TOKEN);
  }

  // Private static symbol to bypass the private constructor check
  static #PRIVATE_CONSTRUCTOR_TOKEN = Symbol("PRIVATE_CONSTRUCTOR_TOKEN");

  /**
   * @param {I32|I64} ptr
   */
  static load(ptr) {
    return new I8(ptr, I8.#PRIVATE_CONSTRUCTOR_TOKEN)
  }
}

export class U64 extends Int {
  /**
   * @param {number|bigint} value - The value to encode.
   * @param {symbol} bypass_token - A private token to bypass the constructor check.
   */
  constructor(value, bypass_token) {
    if (bypass_token !== U64.#PRIVATE_CONSTRUCTOR_TOKEN) {
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

  /**
   * @param {I32|I64} ptr
   */
  static load(ptr) {
    return new U64(ptr, U64.#PRIVATE_CONSTRUCTOR_TOKEN)
  }
}

export class U32 extends Int {
  /**
   * @param {number|bigint} value - The value to encode.
   * @param {symbol} bypass_token - A private token to bypass the constructor check.
   */
  constructor(value, bypass_token) {
    if (bypass_token !== U32.#PRIVATE_CONSTRUCTOR_TOKEN) {
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

  /**
   * @param {I32|I64} ptr
   */
  static load(ptr) {
    return new U32(ptr, U32.#PRIVATE_CONSTRUCTOR_TOKEN)
  }
}

export class U16 extends I32 {
  /**
   * @param {number|bigint} value
   * @param {symbol} bypass_token
   */
  constructor(value, bypass_token) {
    if (bypass_token !== U16.#PRIVATE_CONSTRUCTOR_TOKEN) {
      throw new Error("Private constructor. Use U16.const() to create an instance.");
    }
    super("i16", value);
  }

  /**
   * @param {number|bigint} value
   */
  static const(value) {
    return new U16(value, U16.#PRIVATE_CONSTRUCTOR_TOKEN);
  }

  // Private static symbol to bypass the private constructor check
  static #PRIVATE_CONSTRUCTOR_TOKEN = Symbol("PRIVATE_CONSTRUCTOR_TOKEN");

  /**
   * @param {I32|I64} ptr
   */
  static load(ptr) {
    return new U16(ptr, U16.#PRIVATE_CONSTRUCTOR_TOKEN)
  }
}

export class U8 extends I32 {
  /**
   * @param {number|bigint} value
   * @param {symbol} bypass_token
   */
  constructor(value, bypass_token) {
    if (bypass_token !== U8.#PRIVATE_CONSTRUCTOR_TOKEN) {
      throw new Error("Private constructor. Use U8.const() to create an instance.");
    }
    super("i8", value);
  }

  /**
   * @param {number|bigint} value
   */
  static const(value) {
    return new U8(value, U8.#PRIVATE_CONSTRUCTOR_TOKEN);
  }

  // Private static symbol to bypass the private constructor check
  static #PRIVATE_CONSTRUCTOR_TOKEN = Symbol("PRIVATE_CONSTRUCTOR_TOKEN");

  /**
   * @param {I32|I64} ptr
   */
  static load(ptr) {
    return new U8(ptr, U8.#PRIVATE_CONSTRUCTOR_TOKEN)
  }
}

export class Float extends Num {

  /**
   * @param {string} type
   * @param {number|F32|F64} value
   * @param {symbol} bypass_token 
   */
  constructor(type, value, bypass_token) {
    if (bypass_token !== Float.#PRIVATE_CONSTRUCTOR_TOKEN) {
      throw new Error("Private constructor. Use Float.const() to create an instance.");
    }
    super(type, value)
  }

  /**
   * @param {string} type
   * @param {number|bigint} value
   */
  static const(type, value) {
    return new Float(type, value, Float.#PRIVATE_CONSTRUCTOR_TOKEN);
  }

  // Private static symbol to bypass the private constructor check
  static #PRIVATE_CONSTRUCTOR_TOKEN = Symbol("PRIVATE_CONSTRUCTOR_TOKEN");

  /**
   * @param {string} type
   * @param {I32|I64|U32|U64} ptr
   */
  static load(type, ptr) {
    return new Float(type, ptr, Float.#PRIVATE_CONSTRUCTOR_TOKEN);
  }
}

export class F64 extends Float {
  /**
   * @param {number|bigint} value - The value to encode.
   * @param {symbol} bypass_token - A private token to bypass the constructor check.
   */
  constructor(value, bypass_token) {
    if (bypass_token !== F64.#PRIVATE_CONSTRUCTOR_TOKEN) {
      throw new Error("Private constructor. Use F64.const() to create an instance.");
    }
    super("f64", value); // Call parent constructor
  }

  /**
   * @param {number|bigint} value - The value to encode.
   * @returns {F64}
   */
  static const(value) {
    return new F64(value, F64.#PRIVATE_CONSTRUCTOR_TOKEN);
  }

  // Private static symbol to bypass the private constructor check
  static #PRIVATE_CONSTRUCTOR_TOKEN = Symbol("PRIVATE_CONSTRUCTOR_TOKEN");
}

export class F32 extends Float {
  /**
   * @param {number|bigint|I8|I16|I32|I64} value
   * @param {symbol} bypass_token
   */
  constructor(value, bypass_token) {
    if (bypass_token !== F32.#PRIVATE_CONSTRUCTOR_TOKEN) {
      throw new Error("Private constructor. Use F32.const() to create an instance.");
    }
    super("f32", value);
  }

  /**
   * @param {number|bigint} value
   */
  static const(value) {
    return new F32(value, F32.#PRIVATE_CONSTRUCTOR_TOKEN);
  }

  // Private static symbol to bypass the private constructor check
  static #PRIVATE_CONSTRUCTOR_TOKEN = Symbol("PRIVATE_CONSTRUCTOR_TOKEN");

  /**
   * @param {I32|I64} ptr
   */
  static load(ptr) {
    return new F32(ptr, F32.#PRIVATE_CONSTRUCTOR_TOKEN)
  }
}

export default {
  I32, I64, U32, U64
}
