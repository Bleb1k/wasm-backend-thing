import { byte, str } from "./helpers.js";
import instructions from "./instructions.js";

export const Type = {
  // Number type
  i32: 0x7f,
  i64: 0x7e,
  f32: 0x7d,
  f64: 0x7c,
  // Vector type
  v128: 0x7b,
  // Reference type
  funcref: 0x70,
  externref: 0x6f,
  // Function type
  func: 0x60,
  Func: (args = [], rets = []) => byte`\x60${args.length}${args}${rets.length}${rets}`,
  // Result type
  result: 0x40,
  // Table type
  Table: (type, limits) => byte`${type}${limits}`,
  // Memory type
  // Global type

  // Inverted
  [0x7f]: "i32",
  [0x7e]: "i64",
  [0x7d]: "f32",
  [0x7c]: "f64",
  [0x7b]: "v128",
  [0x70]: "funcref",
  [0x6f]: "externref",
  [0x60]: "func",
  [0x40]: "result",
};

const section = {
  custom: 0,
  type: 1,
  import: 2,
  function: 3,
  table: 4,
  memory: 5,
  global: 6,
  export: 7,
  start: 8,
  element: 9,
  code: 10,
  data: 11,
  dataCount: 12,
};

// AI generated because I can't bother
/**
 * Encodes a value into LEB128 format.
 *
 * @param {string} type - The type of the value, e.g., "u32" for unsigned 32-bit or "s32" for signed 32-bit.
 * @param {number|bigint} value - The value to encode. Can be a number or a bigint.
 * @returns {Uint8Array} - The LEB128-encoded value as a Uint8Array.
 *
 * @example
 * // Encode a small unsigned 32-bit integer
 * encodeLEB128("u32", 624485); // Uint8Array [ 229, 142, 38 ]
 *
 * @example
 * // Encode the largest unsigned 32-bit integer
 * encodeLEB128("u32", 4294967295); // Uint8Array [ 255, 255, 255, 255, 15 ]
 *
 * @example
 * // Encode a large unsigned 64-bit integer
 * encodeLEB128("u64", 42949672960010n); // Uint8Array [ 10, 128, 128, 128, 128, 128, 128, 128, 128, 1 ]
 *
 * @example
 * // Encode a signed 32-bit integer
 * encodeLEB128("s32", -1); // Uint8Array [ 127 ]
 */
export function encodeLEB128(type, value) {
    const match = type.match(/^([su])(\d+)$/);
    if (!match) {
        throw new Error(`Invalid type format: ${type}. Expected format like "u32" or "s32".`);
    }

    const [_, encodingType, bitWidthStr] = match;
    const N = parseInt(bitWidthStr, 10);

    if (N <= 0) {
        throw new Error(`Invalid bit width: ${N}. Bit width must be greater than 0.`);
    }

    const isSigned = encodingType === 's';
    const maxValue = isSigned ? BigInt(2 ** (N - 1)) - 1n : BigInt(2 ** N) - 1n;
    const minValue = isSigned ? -BigInt(2 ** (N - 1)) : 0n;

    if (typeof value !== 'number' && typeof value !== 'bigint') {
        throw new Error(`Invalid value: ${value}. Must be a number or bigint.`);
    }
    const bigValue = BigInt(value);
    if (bigValue < minValue || bigValue > maxValue) {
        throw new Error(`Value ${value} out of range for type ${type}. Range: [${minValue}, ${maxValue}].`);
    }

    const maxBytes = Math.ceil(N / 7);
    const result = [];
    let remaining = bigValue;

    while (true) {
        if (result.length >= maxBytes) {
            throw new Error(`Encoding exceeds maximum allowed bytes (${maxBytes}) for type ${type}.`);
        }

        const byte = Number(remaining & 0x7fn);
        if (isSigned) {
            remaining = remaining >> 7n;
            const hasMore = !((remaining === 0n && (byte & 0x40) === 0) || (remaining === -1n && (byte & 0x40) !== 0));
            if (hasMore) {
                result.push(byte | 0x80);
            } else {
                result.push(byte);
                break;
            }
        } else {
            remaining = remaining >> 7n;
            if (remaining !== 0n) {
                result.push(byte | 0x80);
            } else {
                result.push(byte);
                break;
            }
        }
    }
    return result;
}
const leb = encodeLEB128

function limits(min, max) {
  if (max === undefined) {
    return [0, ...leb("u32", min)]
  }
  return [1, ...leb("u32", min), ...leb("u32", max)]
}

export const export_kind = {
  func: 0,
  table: 1,
  mem: 2,
  global: 3,
};

export const mutability = {
  no: 0,
  yes: 1,
};

export const import_kind = {
  /** @type {(args: number[], rets: number[]) => {code: number, type: number[]}} */
  Func: (args = [], rets = []) => ({
    code: 0,
    type: byte`\x60${args.length}${args}${rets.length}${rets}`,
    func_type: [args, rets],
  }),
  func: 0,

  /** @type {(type: number, min: number, max: number) => {code: number, type: number[]}} */
  Table: (type, min, max) => ({ code: 1, type: [type, ...limits(min, max)] }),
  table: 1,
  
  /** @type {(type: number, min: number, max: number) => {code: number, type: number[]}} */
  Mem: (min, max) => ({ code: 2, type: [...limits(min, max)] }),
  mem: 2,
  
  /** @type {(type: number, mutability: number) => {code: number, type: number}} */
  Global: (type, mutability = 0) => ({ code: 3, type: [type, mutability] }),
  global: 3,
};

export default {
  start_fn_index: -1,
  imports: [],
  funcs: [],
  exports: [],
  types: { count: 0 },

  /**
   * @param {[args: number[], rets: number[]]} type
   * @param {Array<[type: number, count: number]>} locals
   * @param {Array<number>} code
   * @param {{export: string, start: bool}?} optional
   */
  newFunction(type, locals, code, optional) {
    if (optional?.export !== undefined) {
      this.exports.push([
        ...str([optional.export]),
        export_kind.func,
        this.funcs.length,
      ]);
    }
    if (optional?.start) {
      if (this.start_fn_index !== -1) {
        throw new Error("ERROR: There can only be one start function!");
      }
      if (type.length !== 0) {
        throw new Error(
          `ERROR: Start function should have type \`() => void\`, but got \`(${type?.[0]
            ?.flatMap((v) => Type[v] ?? "0x" + v.toString(16))
            .join(", ")
          }) => (${type?.[1]
            ?.flatMap((v) => Type[v] ?? "0x" + v.toString(16))
            .join(", ")
          })\``,
        );
      }
      this.start_fn_index = this.funcs.length;
    }

    
    const t = Type.Func(...type)
    if (this.types[t] === undefined) {
      this.types[t] = this.types.count
      this.types[this.types.count++] = t
    }

    code.push(instructions.end)
    return this.funcs.push({ type, locals, code }) - 1;
  },

  /**
   * @param {Array<[name: string, import_kind: import_kind[keyof import_kind]]>} variables
   * @example this.newImport("env", [
   *   ["some_func", import_kind.Func([type.i32], [type.i64])],
   *   ["some_var", import_kind.Global(type.f64, mutability.yes)]
   * ])
   */
  newImport(namespace, variables) {
    for (const v of variables) {
      const [name, kind] = v;
      // console.log(kind)
      this.imports.push({ namespace, name, kind });
      if (kind.code === import_kind.func) {
        const t = Type.Func(...kind.func_type)
        if (this.types[t] === undefined) {
          this.types[t] = this.types.count
          this.types[this.types.count++] = t
        }
      }
    }
  },

  assembleTypeSection() {
    // const types = this.types;
    const buf = [];
    let size = 1;
    for (let i = 0; i < this.types.count; i++) {
      buf.push(this.types[i]);
      size += this.types[i].length
    }
    // for (const func of this.funcs) {
    //   const t = Type.Func(...func.type);
    //   // if (types[t] !== undefined) continue;
    //   // types[t] = buf.push(t) - 1
    //   buf.push(t);
    //   size += t.length;
    // }
    return [section.type, size, this.types.count, buf].flat(10);
  },

  assembleImportSection() {
    const buf = []
    // console.log("TODO: import section");
    for (const imprt of this.imports) {
      const res = [...str([imprt.namespace]), ...str([imprt.name]), imprt.kind.code]
      switch (imprt.kind.code) {
        case import_kind.func:
          // console.log("yay", imprt, imprt.kind.type, Type.Func(...imprt.kind.func_type), this.types[Type.Func(...imprt.kind.func_type)])
          res.push(this.types[Type.Func(...imprt.kind.func_type)])
          break;
        default:
          res.push(imprt.kind.type)
          // console.log(imprt.kind.type)
          // console.warn(`skipping assembling '${imprt.namespace}.${imprt.name}' because it is unhandled :(`)
          // console.log("---------------")
      }
      // console.log("res:", res)
      buf.push(res)
    }
    // console.log(buf)
    let count = buf.length
    let res = buf.flat(10);
    let size = res.length + 1
    // console.log(res)
    // console.log("res:", [section.import, size, count, ...res].map(n => n.toString(16).padStart(2,0)).join())
    return [section.import, size, count, ...res];
  },

  assembleFunctionSection() {
    return this.funcs.length ? [
      section.function,
      this.funcs.length + 1, // section length
      this.funcs.length, // function count
      this.funcs.map((fn) => this.types[Type.Func(fn.type)]),
    ].flat(2) : [];
  },

  assembleTableSection() {
    console.log("TODO: table section");
    return [];
  },

  assembleMemorySection() {
    console.log("TODO: memory section");
    return [];
  },

  assembleGlobalSection() {
    console.log("TODO: global section");
    return [];
  },

  assembleExportSection() {
    const buf = this.exports.reduce((a, b) => [...a, b], []).flat(2);
    return [section.export, buf.length + 1, this.exports.length, ...buf];
  },

  assembleStartSection() {
    console.log("TODO: start section");
    return [];
  },

  assembleElementSection() {
    console.log("TODO: element section");
    return [];
  },

  assembleCodeSection() {
    function assembleFuncBody(func) {
      const fn_buf = [
        func.locals.length,
        ...func.locals.flatMap(([type, count]) => [count, type]),
        ...func.code.flat(2),
      ];
      // console.log("foo", func, fn_buf)
      return [fn_buf.length, ...fn_buf];
    }
    const funcs = this.funcs.flatMap(assembleFuncBody);
    return this.funcs.length ? [section.code, funcs.length + 1, this.funcs.length, ...funcs] : [];
  },

  assembleDataSection() {
    console.log("TODO: data section");
    return [];
  },

  assembleDataCountSection() {
    console.log("TODO: data count section");
    return [];
  },
  /**
   * TODO: labels and debug info
   *
   * section.custom,
   * 0x0a,
   * str`name`, // section, size, name,
   * 0x02, // local name type
   * 0x03, // subsection size
   * 0x01, // functions count
   * 0x00, // function index
   * 0x00, // num locals
   */
  assembleNameSection() {
    console.log("TODO: name section");
    return [];
  },

  assembleExecutable() {
    // console.log(this.types, 12345)
    return new Uint8Array(
      [
        byte`\x00asm\x01\x00\x00\x00`, // magic + version
        // section 0: custom // this can be inserted between any other section going forward
        this.assembleTypeSection(),
        this.assembleImportSection(),
        this.assembleFunctionSection(),
        this.assembleTableSection(),
        this.assembleMemorySection(),
        this.assembleGlobalSection(),
        this.assembleExportSection(),
        this.assembleStartSection(),
        this.assembleElementSection(),
        this.assembleCodeSection(),
        this.assembleDataSection(),
        this.assembleDataCountSection(),
        this.assembleNameSection(),
      ].flat(),
    );
  },

  /**
   * @param {WebAssembly.Imports?} importObject
   * @returns {Promise<>}
   */
  compile(importObject = {}) {
    const exe = this.assembleExecutable()
    console.log(`exe: [${Array.from(exe).map(n=>n.toString(16).padStart(2,"0"))}]`)
    console.log("base64:", btoa(exe))
    
    return WebAssembly.instantiate(exe, importObject);
  },
};
