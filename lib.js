import { byte, str } from "./helpers.js";
import instructions from "./instructions.js";
import raw_instr from "./instructions.js";

const IS_DEBUG = true
const DEBUG = IS_DEBUG
  ? (start, arr = [], what) => console.log(`${what ? "- " + what + ":\n" : ""}${[...arr].map(v => {
    let val = v instanceof Array && (v.length === 3 || v.length === 2) ? v[0] : v
    val = typeof val === "number" || typeof val === "bigint" ? val.toString(16).padEnd(4, " ")
      + (val > 9 ? ` (${val})` : "") : val
    return v instanceof Array && v.length === 3 && typeof v[2] === "number"
      ? `${(start += v[2]) - v[2]}: ${val}`.padEnd(30, " ") + v[1]
      : v instanceof Array && v.length === 2
        ? `${(start += 1) - 1}: ${val}`.padEnd(30, " ") + v[1]
        : v instanceof Array && v.length === 0
          ? ""
          : `${(start += 1) - 1}: ${val}`
  }
  ).filter(v => v).join("\n")
    }`)
  : (..._) => void _
const debug_byte = (byte_str) => debug_byte_arr(byte(byte_str))
const debug_byte_arr = (arr) => arr.flat(10).map(n => n.toString(16).padStart(2, 0)).reduce((acc, v) => {
  const cur_str = acc.pop()
  if (cur_str.length < 4)
    acc.push(cur_str + v)
  else
    acc.push(cur_str, v)
  return acc
}, [""]).join(" ")
const debug_str = (byte_arr) => '"' + byte_arr.map(v => String.fromCodePoint(v)).join("") + '"'

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
  /** @type {(args?: number[], rets?: number[]) => number[]} */
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
  // Inverted
  0: "custom",
  1: "type",
  2: "import",
  3: "function",
  4: "table",
  5: "memory",
  6: "global",
  7: "export",
  8: "start",
  9: "element",
  10: "code",
  11: "data",
  12: "dataCount",
};

// AI generated because I can't bother
/**
 * Encodes a value into LEB128 format.
 *
 * @param {string} type - The type of the value, e.g., "u32" for unsigned 32-bit or "i32" for signed 32-bit.
 * @param {number|bigint} value - The value to encode. Can be a number or a bigint.
 * @returns {number[]} - The LEB128-encoded value.
 *
 * @example
 * // Encode a small unsigned 32-bit integer
 * encodeLEB128("u32", 624485); // [ 229, 142, 38 ]
 *
 * @example
 * // Encode the largest unsigned 32-bit integer
 * encodeLEB128("u32", 4294967295); // [ 255, 255, 255, 255, 15 ]
 *
 * @example
 * // Encode a large unsigned 64-bit integer
 * encodeLEB128("u64", 42949672960010n); // [ 10, 128, 128, 128, 128, 128, 128, 128, 128, 1 ]
 *
 * @example
 * // Encode a signed 32-bit integer
 * encodeLEB128("i32", -1); // [ 127 ]
 */
export function encodeLEB128(type, value) {
  const match = type.match(/^([iu])(\d+)$/);
  if (!match) {
    throw new Error(`Invalid type format: ${type}. Expected format like "u32" or "i32".`);
  }

  const [_, encodingType, bitWidthStr] = match;
  const N = parseInt(bitWidthStr, 10);

  if (N <= 0) {
    throw new Error(`Invalid bit width: ${N}. Bit width must be greater than 0.`);
  }

  const isSigned = encodingType === 'i';
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
function decodeLEB128(buffer, offset = 0, isSigned = false) {
    let result = 0;
    let shift = 0;
    let byte;

    do {
        if (offset >= buffer.length) {
            console.error(new Error("Buffer underflow while decoding LEB128"));
            return {value: undefined, bytesRead: 0}
        }

        byte = buffer[offset++];
        result |= (byte & 0x7F) << shift;
        shift += 7;
    } while ((byte & 0x80) !== 0);

    if (isSigned) {
        // Determine the sign bit position
        const signBitPosition = shift - 7;
        // Check if the sign bit is set
        if ((result & (1 << signBitPosition)) !== 0) {
            // Sign extend the result
            result |= -(1 << shift);
        }
    }

    return { value: result, bytesRead: offset - (buffer.byteOffset || 0) };
}
const unleb = decodeLEB128

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
  0: "func",
  1: "table",
  2: "mem",
  3: "global",
};

export const mutability = {
  no: 0,
  yes: 1,
};

export const import_kind = {
  /** @type {(args?: number[], rets?: number[]) => {code: number, type: number[]}} */
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

export default class {
  start_fn_index = -1
  imports = []
  functions_count = 0
  funcs = []
  exports = []
  types = { count: 0 }

  #exe = []

  constructor() { }

  getFuncTypeIndex(args = [], rets = []) {
    const type = Type.Func(args, rets)
    if (this.types[type] === undefined) {
      this.types[type] = this.types.count;
      this.types[this.types.count++] = type;
    }
    return this.types[type]
  }

  /**
   * @param {string} namespace
   * @param {Array<[name: string, import_kind: {code: number, type: number[]}]>} variables
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
        this.functions_count += 1;
        const t = Type.Func(...kind.func_type)
        if (this.types[t] === undefined) {
          this.types[t] = this.types.count
          this.types[this.types.count++] = t
        }
      }
    }
  }

  /**
     * @param {number} min in pages (1 page = 64kb)
     * @param {number} max
     * @param {boolean|string} _export If true or string name, exports the memory. If string name is provided, uses that name instead of "memory"
     */
  newMemory(min = 1, max = -1, _export = false) {
    if (this.memory !== undefined)
      throw new Error("ERROR: Already defined memory.")
    if (this.imports.some(i => i.type === import_kind.mem))
      throw new Error("ERROR: Already importing memory.")
    // both of these ^ restrictions may be lifted in future versions of wasm
    this.memory = limits(min, ((max ?? -1) === -1) ? undefined : max)

    if (_export) {
      this.exports.push([
        ...str([typeof _export === "string" ? _export : "memory"]),
        export_kind.mem,
        0, // memory index (always zero, until specs allow more mems)
      ]);
    }
  }

  /**
  * @param {[args?: number[], rets?: number[]]} type
  * @param {Array<[type: number, count: number]>} locals
  * @param {Array<number>} code
  * @param {{export?: string, start?: bool}?} optional
  */
  newFunction(type, locals, code, optional) {
    this.functions_count += 1
    if (optional?.export !== undefined) {
      this.exports.push([
        ...str([optional.export]),
        export_kind.func,
        this.functions_count - 1,
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
      this.start_fn_index = this.functions_count - 1;
    }


    const t = Type.Func(...type)
    if (this.types[t] === undefined) {
      this.types[t] = this.types.count
      this.types[this.types.count++] = t
    }

    code.push(raw_instr.end)
    this.funcs.push({ type, locals, code });
    return this.functions_count - 1
  }

  assembleTypeSection() {
    // const types = this.types;
    let size_num = 1;
    for (let i = 0; i < this.types.count; i++)
      size_num += this.types[i].length
    const size = leb("u32", size_num)

    DEBUG(this.#exe.length, [
      [section.type, "section_type"],
      [size, "section_size", size.length],
      [this.types.count, "count"],
    ], "Type section")
    
    this.#exe.push(section.type, ...size, this.types.count)

    for (let i = 0; i < this.types.count; i++) {
      const t = this.types[i];
      let c = 1, io = 0

      DEBUG(this.#exe.length, t.map(v =>
        c-- > 0 ? [v, Type[v]] : [c = v, io++ ? "output_count" : "input_count"]
      ), `Type ${i}`)

      this.#exe.push(...t)
    }
  }

  assembleImportSection() {
    // const buf = []
    console.log("TODO: import section");
    // for (const imprt of this.imports) {
    //   const res = [...str([imprt.namespace]), ...str([imprt.name]), imprt.kind.code]
    //   switch (imprt.kind.code) {
    //     case import_kind.func:
    //       // console.log("yay", imprt, imprt.kind.type, Type.Func(...imprt.kind.func_type), this.types[Type.Func(...imprt.kind.func_type)])
    //       res.push(this.types[Type.Func(...imprt.kind.func_type)])
    //       break;
    //     default:
    //       res.push(imprt.kind.type)
    //     // console.log(imprt.kind.type)
    //     // console.warn(`skipping assembling '${imprt.namespace}.${imprt.name}' because it is unhandled :(`)
    //     // console.log("---------------")
    //   }
    //   // console.log("res:", res)
    //   buf.push(res)
    // }
    // // console.log(buf)
    // const count = buf.length
    // const res = buf.flat(10);
    // const size = res.length + 1
    // // console.log(res)
    // // console.log("res:", [section.import, size, count, ...res].map(n => n.toString(16).padStart(2,0)).join())
    // return [section.import, size, count, ...res];
  }

  assembleFunctionSection() {
    const size = leb("u32", this.funcs.length + 1)

    DEBUG(this.#exe.length, [
      [section.function, "section_type"],
      [size.length > 1 ? debug_byte_arr(size) : size[0].toString(16), "section_size", size.length],
      [this.funcs.length, "count"],
      []
    ], "Function section")

    this.#exe.push(section.function, ...size, this.funcs.length)

    DEBUG(this.#exe.length, this.funcs.map((v, i) =>
      [this.types[Type.Func(...v.type)], `Function ${i} type index`, ]
    ), "Funcs")

    this.#exe.push(...this.funcs.map((fn) => this.types[Type.Func(...fn.type)]))
  }

  assembleTableSection() {
    console.log("TODO: table section");
  }

  assembleMemorySection() {
    if (!this.memory) return;
    
    DEBUG(this.#exe.length, [
      [section.memory, "section_type"],
      [(this.memory.length ?? 0) + 1, "section_size"],
      [1, "count"],
    ], "Memory section")

    this.#exe.push(section.memory, this.memory.length + 1, 1)

    let val, val2

    if (IS_DEBUG) {
      let foo = unleb(this.memory, 1)
      val = foo.value
      foo = unleb(this.memory, 1+foo.bytesRead)
      val2 = foo.value
    }

    DEBUG(this.#exe.length, [
      [this.memory[0], "limit_type"],
      [val, "min"],
      val2 ? [val2, "max"] : [],
    ], "memory_limits")

    this.#exe.push(...this.memory)
  }

  assembleGlobalSection() {
    console.log("TODO: global section");
  }

  assembleExportSection() {
    const buf = this.exports.reduce((acc, v) => acc + v.length, 0);
    
    DEBUG(this.#exe.length, [
      [section.export, "section_type"],
      [buf + 1, "section_size"],
      [this.exports.length, "count"],
    ], "Export section")

    this.#exe.push(section.export, buf + 1, this.exports.length)

    console.log("- Exports:")
    this.exports.forEach((v, i) => {
      DEBUG(this.#exe.length, [
        [v[0], "string length"],
        [debug_str(v.slice(1, unleb(v).value+1)), "export name", v[0]],
        [v[v[0] + 1], `export kind (${export_kind[v[v[0] + 1]]})`],
        [v[v[0] + 2], "id"],
      ], `Export ${i}`)
      
      this.#exe.push(...v)
    })
  }

  assembleStartSection() {
    console.log("TODO: start section");
    return [];
  }

  assembleElementSection() {
    console.log("TODO: element section");
    return [];
  }

  assembleCodeSection() {
    function assembleFuncBody(func) {
      const fn_buf = [
        func.locals.length,
        ...func.locals.flatMap(([type, count]) => [count, type]),
        ...func.code.flat(10),
      ];
      return [fn_buf.length, ...fn_buf];
    }
    const funcs = this.funcs.map(assembleFuncBody);
    
    DEBUG(this.#exe.length, [
      [section.code, "section_type"],
      [
        funcs.reduce((acc, v) => acc + v[0], 0) +
          funcs.reduce((acc, v, i) => acc + (funcs[i] = leb("u32", v[0])).length, 0),
        "section_size"
      ],
      [funcs.length, "count"]
    ], "Code section")

    this.#exe.push(
      section.code,
      ...encodeLEB128("u32", funcs.length + 1),
      this.funcs.length,      
    )

    this.funcs.forEach((func, i) => {
      DEBUG(this.#exe.length, [
        [func.locals.length, "local declarations count"],
        ...func.locals.map(([type, count]) => [debug_byte_arr([count, type]), `local: [${count}]${Type[type]}`, 2]),
        ...func.code.map(v => {
          const first_is_instr = v[0] instanceof Array
          if (first_is_instr)
            return [debug_byte_arr(v), `${instructions[v[0]]} ${unleb(v[1]).value}`, v.flat(10).length]
          return [debug_byte_arr(v), instructions[v]]
        })
      ],`Function ${i}`)
    })

    this.#exe.push(...(this.funcs.length ? [
      section.code,
      ...encodeLEB128("u32", funcs.length + 1),
      this.funcs.length,
      ...funcs,
    ] : []));
  }

  assembleDataSection() {
    console.log("TODO: data section");
  }

  assembleDataCountSection() {
    console.log("TODO: data count section");
  }
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
  }

  assembleExecutable() {
    // console.log(this.types, 12345)
    DEBUG(this.#exe.length, [
      [debug_byte`\x00asm`, "Magic", 4],
      [debug_byte`\x01\x00\x00\x00`, "Version"]
    ], "Program start")
    this.#exe.push(...byte`\x00asm\x01\x00\x00\x00`)

    this.assembleTypeSection()
    this.assembleImportSection()
    this.assembleFunctionSection()
    this.assembleTableSection()
    this.assembleMemorySection()
    this.assembleGlobalSection()
    this.assembleExportSection()
    this.assembleStartSection()
    this.assembleElementSection()
    this.assembleCodeSection()
    this.assembleDataSection()
    this.assembleDataCountSection()
    this.assembleNameSection()

    console.log(this.#exe.map((v,i) => [i,v]))

    return new Uint8Array(this.#exe)
    // return new Uint8Array(
    //   [
    //     byte`\x00asm\x01\x00\x00\x00`, // magic + version
    //     // section 0: custom // this can be inserted between any other section going forward
    //     this.assembleTypeSection(),
    //     this.assembleImportSection(),
    //     this.assembleFunctionSection(),
    //     this.assembleTableSection(),
    //     this.assembleMemorySection(),
    //     this.assembleGlobalSection(),
    //     this.assembleExportSection(),
    //     this.assembleStartSection(),
    //     this.assembleElementSection(),
    //     this.assembleCodeSection(),
    //     this.assembleDataSection(),
    //     this.assembleDataCountSection(),
    //     this.assembleNameSection(),
    //   ].flat(),
    // );
  }

  /**
   * @param {WebAssembly.Imports?} importObject
   * @returns {Promise<WebAssembly.WebAssemblyInstantiatedSource>}
   */
  compile(importObject = {}) {
    const exe = this.assembleExecutable()
    // console.log(`exe:\n${Array.from(exe).map((n, i) =>
    //   i.toString().padStart(4, '0') + ": " + n.toString(16).padStart(2, "0") + ` (${raw_instr[n]})`
    // ).join("\n")}`
    // )
    // console.log("base64:", btoa(exe))
    console.log(`Binary size: ${exe.byteLength}`)

    return WebAssembly.instantiate(exe, importObject);
  }
};
