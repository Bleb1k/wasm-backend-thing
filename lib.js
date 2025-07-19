import { InstrArray } from "./expand_instr.js"
import { byte, guard, str } from "./helpers.js"
import W from "./instructions.js"
import raw_instr from "./instructions.js"

let IS_DEBUG = false
const DEBUG = (start, arr = [], what) =>
  IS_DEBUG
    ? console.log(`${what ? "- " + what + ":\n" : ""}${
      [...arr].map((v) => {
        let val = v instanceof Array && (v.length === 3 || v.length === 2) ? v[0] : v
        val = typeof val === "number" || typeof val === "bigint"
          ? val.toString(10).padEnd(4, " ") +
            (val > 9 ? ` (${val})` : "")
          : val
        // console.log(v, v.length)
        return v instanceof Array && v.length === 3 && typeof v[2] === "number"
          ? `${((start += v[2]) - v[2]).toString(10).padStart(3, "0")}: ${val}`
            .padEnd(45, " ") + v[1]
          : v instanceof Array && v.length === 2
          ? `${((start += 1) - 1).toString(10).padStart(3, "0")}: ${val}`
            .padEnd(45, " ") + v[1]
          : v instanceof Array && v.length === 0
          ? ""
          : `${((start += 1) - 1).toString(10).padStart(3, "0")}: ${val}`
      }).filter((v) => v).join("\n")
    }`)
    : void (start, arr, what)
const debug_byte = (byte_str) => IS_DEBUG ? debug_byte_arr(byte(byte_str)) : void byte_str
const debug_byte_arr = (arr) =>
  IS_DEBUG
    ? [arr].flat(10).map((n) => n.toString(16).padStart(2, 0)).reduce(
      (acc, v) => {
        const cur_str = acc.pop()
        if (cur_str.length < 4) {
          acc.push(cur_str + v)
        } else {
          acc.push(cur_str, v)
        }
        return acc
      },
      [""],
    ).join(" ")
    : void arr
const debug_str = (byte_arr) =>
  IS_DEBUG
    ? '"' + (typeof byte_arr === "string" ? byte_arr : byte_arr.map((v) => String.fromCodePoint(v)).join("")) +
      '"'
    : void byte_arr

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
}

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
}

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
  guard({ type, value })

  const match = type.match(/^([iu])(\d+)$/)
  if (!match) {
    throw new Error(
      `Invalid type format: ${type}. Expected format like "u32" or "i32".`,
    )
  }

  const [_, encodingType, bitWidthStr] = match
  const N = parseInt(bitWidthStr, 10)

  if (N <= 0) {
    throw new Error(
      `Invalid bit width: ${N}. Bit width must be greater than 0.`,
    )
  }

  const isSigned = encodingType === "i"
  const maxValue = isSigned ? BigInt(2 ** (N - 1)) - 1n : BigInt(2 ** N) - 1n
  const minValue = isSigned ? -BigInt(2 ** (N - 1)) : 0n

  if (typeof value !== "number" && typeof value !== "bigint") {
    throw new Error(`Invalid value: ${value}. Must be a number or bigint.`)
  }
  const bigValue = BigInt(value)
  if (bigValue < minValue || bigValue > maxValue) {
    throw new Error(
      `Value ${value} out of range for type ${type}. Range: [${minValue}, ${maxValue}].`,
    )
  }

  const maxBytes = Math.ceil(N / 7)
  const result = []
  let remaining = bigValue

  while (true) {
    if (result.length >= maxBytes) {
      throw new Error(
        `Encoding exceeds maximum allowed bytes (${maxBytes}) for type ${type}.`,
      )
    }

    const byte = Number(remaining & 0x7fn)
    if (isSigned) {
      remaining = remaining >> 7n
      const hasMore = !((remaining === 0n && (byte & 0x40) === 0) ||
        (remaining === -1n && (byte & 0x40) !== 0))
      if (hasMore) {
        result.push(byte | 0x80)
      } else {
        result.push(byte)
        break
      }
    } else {
      remaining = remaining >> 7n
      if (remaining !== 0n) {
        result.push(byte | 0x80)
      } else {
        result.push(byte)
        break
      }
    }
  }

  return result
}
const leb = encodeLEB128
function decodeLEB128(buffer, offset = 0, isSigned = false) {
  let result = 0
  let shift = 0
  let byte

  do {
    if (offset >= buffer.length) {
      console.error(new Error("Buffer underflow while decoding LEB128"))
      return { value: undefined, bytesRead: 0 }
    }

    byte = buffer[offset++]
    result |= (byte & 0x7F) << shift
    shift += 7
  } while ((byte & 0x80) !== 0)

  if (isSigned) {
    // Determine the sign bit position
    const signBitPosition = shift - 7
    // Check if the sign bit is set
    if ((result & (1 << signBitPosition)) !== 0) {
      // Sign extend the result
      result |= -(1 << shift)
    }
  }

  return { value: result, bytesRead: offset - (buffer.byteOffset || 0) }
}
const unleb = decodeLEB128

export function encodeIEEE754(type, value) {
  if (typeof value !== "number") {
    throw new Error(`Invalid value: ${value}. Must be a number.`)
  }

  let buffer
  let view

  switch (type) {
    case "f32":
      buffer = new ArrayBuffer(4)
      view = new DataView(buffer)
      view.setFloat32(0, value, true) // little-endian
      break
    case "f64":
      buffer = new ArrayBuffer(8)
      view = new DataView(buffer)
      view.setFloat64(0, value, true) // little-endian
      break
    default:
      throw new Error(
        `Invalid type format: ${type}. Expected format like "f32" or "f64".`,
      )
  }

  const result = []
  for (let i = 0; i < buffer.byteLength; i++) {
    result.push(view.getUint8(i))
  }

  return result
}

export function decodeIEEE754(buffer, type, offset = 0) {
  if (!Array.isArray(buffer)) {
    throw new Error(`Invalid buffer: ${buffer}. Must be an array of bytes.`)
  }

  if (offset < 0 || offset >= buffer.length) {
    throw new Error(
      `Invalid offset: ${offset}. Offset must be within the bounds of the buffer.`,
    )
  }

  let ab
  let view

  switch (type) {
    case "f32":
      if (offset + 4 > buffer.length) {
        throw new Error(
          `Invalid buffer length: ${buffer.length}. Expected at least 4 bytes starting from offset ${offset} for "f32".`,
        )
      }
      ab = new ArrayBuffer(4)
      view = new DataView(ab)
      for (let i = 0; i < 4; i++) {
        view.setUint8(i, buffer[offset + i])
      }
      return view.getFloat32(0, true) // little-endian
    case "f64":
      if (offset + 8 > buffer.length) {
        throw new Error(
          `Invalid buffer length: ${buffer.length}. Expected at least 8 bytes starting from offset ${offset} for "f64".`,
        )
      }
      ab = new ArrayBuffer(8)
      view = new DataView(ab)
      for (let i = 0; i < 8; i++) {
        view.setUint8(i, buffer[offset + i])
      }
      return view.getFloat64(0, true) // little-endian
    default:
      throw new Error(
        `Invalid type format: ${type}. Expected format like "f32" or "f64".`,
      )
  }
}

function isPowerOf2(val) {
  return val === 1 << (31 - Math.clz32(val))
}

export function encode_v128(value = 0n) {
  const result = []
  // console.log(value, typeof value)
  switch (typeof value) {
    case "object":
      if (!(value instanceof Array)) {
        throw new Error("Only arrays are supported")
      }
      if (!(isPowerOf2(value.length)) || value.length > 16) {
        throw new Error(
          "Only arrays with 2**n elements are supported: [64x2, 32x4, 16x8, 8x16]",
        )
      }
      if (!value.every(Number.isInteger)) {
        throw new Error("Only vectors of integers are supported for now")
      }
      for (let num of value) {
        for (let i = 0; i < (16 / value.length); i++) {
          result.push(num & 0xff)
          num >>>= 16
        }
      }
      break
    case "boolean":
    case "string":
      value = typeof value !== "string"
        ? Number(value)
        : Number.isInteger(Number(value))
        ? BigInt(value)
        : Number(value)
    case "bigint":
    case "number":
      for (let i = 0; i < 16; i++) {
        result.push(value & 0xff)
        value >>>= 16
      }
      break
    case "symbol":
    case "undefined":
    case "function":
      throw new Error("Unsupported type: " + Type[value])
  }
  return result
}

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
}

export const mutability = {
  no: 0,
  yes: 1,
}

export const import_kind = {
  /** @type {(args?: number[], rets?: number[]) => {code: number, type: number[]}} */
  Func: (args = [], rets = []) => ({
    code: 0,
    type: byte`\x60${args.length}${args}${rets.length}${rets}`,
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
}

export default class {
  static current_app = null
  start_fn_index = -1
  imports = []
  functions_count = 0
  funcs = []
  exports = []
  types = { count: 0 }
  globals = []

  #exe = []

  constructor() {}

  getFuncTypeIndex(type = Type.Func()) {
    if (this.types[type] === undefined) {
      this.types[type] = this.types.count
      this.types[this.types.count++] = type
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
    guard({ namespace, variables })
    const result = {}
    for (const v of variables) {
      const [name, kind] = v
      if (kind.code === import_kind.func) {
        result[name] = this.functions_count++
        kind.type = this.getFuncTypeIndex(kind.type)
      } else if (kind.code === import_kind.global) {
        result[name] = this.newGlobal(kind.type[0], undefined, kind.type[1])
      }
      this.imports.push({ namespace, name, kind })
    }
    return result
  }

  /**
   * @param {number} min in pages (1 page = 64kb)
   * @param {number} max
   * @param {boolean|string} _export If true or string name, exports the memory. If string name is provided, uses that name instead of "memory"
   */
  newMemory(min = 1, max = -1, _export = false) {
    if (this.memory !== undefined) {
      throw new Error("Already defined memory.")
    }
    if (this.imports.some((i) => i.type === import_kind.mem)) {
      throw new Error("Already importing memory.")
    }
    // both of these ^ restrictions may be lifted in future versions of wasm
    this.memory = limits(min, ((max ?? -1) === -1) ? undefined : max)

    if (_export) {
      this.exports.push([
        ...str([typeof _export === "string" ? _export : "memory"]),
        export_kind.mem,
        0, // memory index (always zero, until specs allow more mems)
      ])
    }
  }

  /**
   * @param {[args?: number[], rets?: number[]]} type
   * @param {Array<[type: number, count: number]>} locals
   * @param {Array<number>} code
   * @param {{export?: string, start?: bool}?} optional
   */
  newFunction(type, locals, code, optional) {
    guard({ type, locals, code })
    if (locals.some((v) => !(v instanceof Array && v.length === 2))) {
      throw new Error(
        "Local variables must be declared in form Array<[type, count]>",
      )
    }
    if (optional?.export !== undefined) {
      this.exports.push([
        ...str([optional.export]),
        export_kind.func,
        this.functions_count,
      ])
    }
    this.functions_count += 1
    if (optional?.start) {
      if (this.start_fn_index !== -1) {
        throw new Error("There can only be one start function!")
      }
      if (type.length !== 0) {
        throw new Error(
          `Start function should have type \`() => void\`, but got \`(${
            type?.[0]
              ?.flatMap((v) => Type[v] ?? "0x" + v.toString(16))
              .join(", ")
          }) => (${
            type?.[1]
              ?.flatMap((v) => Type[v] ?? "0x" + v.toString(16))
              .join(", ")
          })\``,
        )
      }
      this.start_fn_index = this.functions_count - 1
    }

    void this.getFuncTypeIndex(Type.Func(...type))

    const search_blocktype = (v) =>
      v.blocktype === undefined || typeof v.blocktype === "number"
        ? void v?.forEach?.(search_blocktype)
        : void this.getFuncTypeIndex(v.blocktype)
    search_blocktype(code)

    // const bt = val.blocktype
    // val = 'function ' + this.getFuncTypeIndex(bt) + ' "' + Type[bt[0]] + '('
    // const l = bt[1]
    // for (let i = 0; i < l; i++)
    //   val += Type[bt[2 + i]] + ', '
    // val += ') -> ('
    // for (let i = 0; i < bt[2 + l]; i++)
    //   val += Type[bt[3 + i]] + ', '
    // val += ')"'
    // break

    code.push(raw_instr.end)
    this.funcs.push({ type, locals, code })
    return this.funcs.length - 1
  }

  newGlobal(type, value, mutability = 0) {
    guard({ type })

    // let global_id = this.globals.findIndex(v =>
    //   v.type === type &&
    //   v.mutability === mutability &&
    //   (v.type === Type.funcref
    //     ? v.value === value
    //     : (v.value ?? 0) === (value ?? 0))
    // )
    // if (global_id >= 0) return global_id

    let global_id = this.globals.length
    switch (type) {
      case Type.i32:
        this.globals.push({
          type,
          value,
          val_bytes: [...W.I32.const(value).flat(), W.end],
          mutability,
        })
        break
      case Type.i64:
        this.globals.push({
          type,
          value,
          val_bytes: [...W.I64.const(value).flat(), W.end],
          mutability,
        })
        break
      case Type.v128:
        this.globals.push({
          type,
          value,
          val_bytes: [...W.V128.const(value).flat(), W.end],
          mutability,
        })
        break
      case Type.f32:
        this.globals.push({
          type,
          value,
          val_bytes: [...W.F32.const(value).flat(), W.end],
          mutability,
        })
        break
      case Type.f64:
        this.globals.push({
          type,
          value,
          val_bytes: [...W.F64.const(value).flat(), W.end],
          mutability,
        })
        break
      case Type.externref:
        this.globals.push({
          type,
          value,
          val_bytes: [...W.ref.null(Type.externref), W.end],
          mutability,
        })
        break
      case Type.funcref:
        this.globals.push({
          type,
          value,
          val_bytes: (value === undefined || value === null)
            ? [...W.ref.null(Type.funcref), W.end]
            : [...W.ref.func(value), W.end],
          mutability,
        })
        break
      default:
        throw new Error(`Unknown type ${type}(${Type[type]})`)
    }
    return global_id
  }

  assembleTypeSection() {
    if (this.types.count === 0) return
    // const types = this.types;
    let size_num = 1
    for (let i = 0; i < this.types.count; i++) {
      size_num += this.types[i].length
    }
    const size = leb("u32", size_num)

    DEBUG(this.#exe.length, [
      [section.type, "section_type"],
      [size, "section_size", size.length],
      [this.types.count, "count"],
    ], "Type section")

    this.#exe.push(section.type, ...size, this.types.count)

    for (let i = 0; i < this.types.count; i++) {
      const t = this.types[i]
      let c = 1, io = 0

      DEBUG(
        this.#exe.length,
        t.map((v) => c-- > 0 ? [v, Type[v]] : [c = v, io++ ? "output_count" : "input_count"]),
        `Type ${i}`,
      )

      this.#exe.push(...t)
    }
  }

  /*


0000000: 0061 736d                ; WASM_BINARY_MAGIC
0000004: 0100 0000                ; WASM_BINARY_VERSION
; section "Type" (1)
0000008: 01                       ; section code
0000009: 00                       ; section size (guess)
000000a: 01                       ; num types
; func type 0
000000b: 60                       ; func
000000c: 01                       ; num params
000000d: 7f                       ; i32
000000e: 00                       ; num results
0000009: 05                       ; FIXUP section size
; section "Import" (2)
000000f: 02                       ; section code
0000010: 00                       ; section size (guess)
0000011: 01                       ; num imports
; import header 0
0000012: 03                       ; string length
0000013: 666f 6f             foo  ; import module name
0000016: 03                       ; string length
0000017: 6261 72             bar  ; import field name
000001a: 00                       ; import kind
000001b: 00                       ; import signature index
0000010: 0b                       ; FIXUP section size
; section "Function" (3)
; only iterates over function bodies
000001c: 03                       ; section code
000001d: 00                       ; section size (guess)
000001e: 01                       ; num functions
000001f: 00                       ; function 0 signature index
000001d: 02                       ; FIXUP section size
; section "Export" (7)
; this one iterates over functions by index,
; so I need to keep track of how many functions get imported
0000020: 07                       ; section code
0000021: 00                       ; section size (guess)
0000022: 01                       ; num exports
0000023: 03                       ; string length
0000024: 6261 72                                  bar  ; export name
0000027: 00                       ; export kind
0000028: 01                       ; export func index
0000021: 07                       ; FIXUP section size
  */
  assembleImportSection() {
    // const buf = []
    const res = this.imports.flatMap((i) => [
      ...str([i.namespace]),
      ...str([i.name]),
      i.kind.code,
      i.kind.type,
    ]).flat(10)
    const count = this.imports.length
    const size = leb("u32", res.length + 1)

    DEBUG(this.#exe.length, [
      [section.import, "section_type"],
      [
        size.length > 1 ? debug_byte_arr(size) : size[0].toString(16),
        "section_size",
        size.length,
      ],
      [count, "count"],
      ...this.imports.flatMap((i, idx) => [
        [[], `Import ${idx}`, 0],
        [debug_str(i.namespace), "namespace", str([i.namespace]).length],
        [debug_str(i.name), "name", str([i.name]).length],
        [i.kind.code, "import_kind"],
        [i.kind.type, "import_signature_index"],
      ]),
    ], "Import section")

    this.#exe.push(
      section.import,
      ...size,
      count,
      ...res,
    )
  }

  assembleFunctionSection() {
    if (this.funcs.length === 0) return
    const size = leb("u32", this.funcs.length + 1)

    DEBUG(this.#exe.length, [
      [section.function, "section_type"],
      [
        size.length > 1 ? debug_byte_arr(size) : size[0].toString(16),
        "section_size",
        size.length,
      ],
      [this.funcs.length, "count"],
      [],
    ], "Function section")

    this.#exe.push(section.function, ...size, this.funcs.length)

    DEBUG(
      this.#exe.length,
      this.funcs.map((
        v,
        i,
      ) => [this.types[Type.Func(...v.type)], `Function ${i} type index`]),
      "Funcs",
    )

    this.#exe.push(
      ...this.funcs.map((fn) => this.types[Type.Func(...fn.type)]),
    )
  }

  assembleTableSection() {
    if (IS_DEBUG) console.log("TODO: table section")
  }

  assembleMemorySection() {
    if (!this.memory) return

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
      foo = unleb(this.memory, 1 + foo.bytesRead)
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
    if (this.globals.length === 0) return
    const size = this.globals.reduce(
      (acc, v) => acc + v.val_bytes.flat().length + 2,
      0,
    )

    DEBUG(this.#exe.length, [
      [section.global, "section_type"],
      [size + 1, "section_size"],
      [this.globals.length, "count"],
    ], "Global section")

    this.#exe.push(
      section.global,
      ...leb("u32", size + 1),
      this.globals.length,
    )

    this.globals.forEach((glob, i) => {
      // console.log(123, glob.val_bytes)
      DEBUG(this.#exe.length, [
        [glob.type, `type: ${Type[glob.type]}`],
        [glob.mutability, "mutability"],
        [
          debug_byte_arr(glob.val_bytes[0]),
          W[glob.val_bytes[0]],
          glob.val_bytes[0].length,
        ],
        [
          ![Type.funcref, Type.externref].includes(glob.type)
            ? debug_byte_arr(glob.val_bytes[1])
            : debug_byte_arr([glob.val_bytes[1]]),
          `${Type[glob.type]} literal`,
          [glob.val_bytes[1]].flat().length,
        ],
        [debug_byte_arr(glob.val_bytes[2]), W[glob.val_bytes[2]]],
      ], `Global ${i}`)

      this.#exe.push(
        glob.type,
        glob.mutability,
        ...glob.val_bytes.flat(),
      )
    })
  }

  assembleExportSection() {
    if (this.exports.length === 0) return
    const buf = this.exports.reduce((acc, v) => acc + v.length, 0)

    DEBUG(this.#exe.length, [
      [section.export, "section_type"],
      [buf + 1, "section_size"],
      [this.exports.length, "count"],
    ], "Export section")

    this.#exe.push(section.export, buf + 1, this.exports.length)

    if (IS_DEBUG) console.log("- Exports:")
    this.exports.forEach((v, i) => {
      DEBUG(this.#exe.length, [
        [v[0], "string length"],
        [debug_str(v.slice(1, unleb(v).value + 1)), "export name", v[0]],
        [v[v[0] + 1], `export kind (${export_kind[v[v[0] + 1]]})`],
        [v[v[0] + 2], "id"],
      ], `Export ${i}`)

      this.#exe.push(...v)
    })
  }

  assembleStartSection() {
    if (IS_DEBUG) console.log("TODO: start section")
  }

  assembleElementSection() {
    if (IS_DEBUG) console.log("TODO: element section")
  }

  assembleCodeSection() {
    if (this.funcs.length === 0) return
    const processObjectData = (obj) => {
      // console.log("hahaha", JSON.stringify(obj))
      switch (false) {
        case !obj?.blocktype:
          return obj.blocktype instanceof Array ? leb("i33", this.getFuncTypeIndex(obj.blocktype)) : obj.blocktype
        case !obj?.functype:
          return this.getFuncTypeIndex(obj.functype)
        case !obj?.accumulated:
          return obj.accumulated.flat(10)
        default:
          if (typeof obj === "object" && !(obj instanceof Array)) {
            console.log("Unknown object:", obj)
          }
          return obj
      }
    }
    function assembleFuncBody(func) {
      const fn_buf = [
        func.locals.length,
        ...func.locals.flatMap(([type, count]) => [count, type]),
        ...func.code.flat(10).flatMap((v) => processObjectData(v)),
      ]
      // console.log("fn_buf:", fn_buf)
      return [...leb("u32", fn_buf.length), ...fn_buf]
    }
    const funcs = this.funcs.map(assembleFuncBody)

    DEBUG(this.#exe.length, [
      [section.code, "section_type"],
      [
        funcs.reduce((acc, v) => acc + v[0], 0) +
        funcs.reduce((acc, v) => acc + unleb(v[0]).bytesRead, 0),
        "section_size",
      ],
      [funcs.length, "count"],
    ], "Code section")

    this.#exe.push(
      section.code,
      ...encodeLEB128("u32", funcs.flat().length + 1),
      this.funcs.length,
    )

    let acc_len = this.#exe.length
    this.funcs.forEach((func, i) => {
      const flatten = function (v, d = 0) {
        if (!(v instanceof Array)) return [v]
        if (v.length === 1) return v
        if (
          v.length === 2 && v[0] instanceof Array && !(v[0][0] instanceof Array)
        ) return [v]

        // v = v instanceof Array && v.length === 1 ? v[0] : v;
        // console.log("f"+d, v, v instanceof InstrArray)
        // if (v instanceof InstrArray) {
        //   console.log("ia"+d, v)
        //   return flatten([...v], d + 1)
        // } else if (v[0] instanceof Array && v.length > 2) {
        //   console.log("a"+d, v)
        //   return v.flatMap(ch => flatten(ch, d + 100))
        // }
        // console.log("aa"+d, v)
        return v.flatMap((ch) => flatten(ch, (d + 1) * 100))
      }
      DEBUG(acc_len, [
        [unleb(funcs[i]).value, `function len`, unleb(funcs[i]).bytesRead],
        [func.locals.length, "local declarations count"],
        ...func.locals.map((
          [type, count],
        ) => [
          debug_byte_arr([count, type]),
          `local: [${count}]${Type[type]}`,
          2,
        ]),
        ...func.code
          // .map(flatten)
          // .map(v => (console.log("v1:", v), v))
          // .flatMap(v => v instanceof InstrArray ? v : [v])
          // .map(v => (console.log("v2:", v), v))
          // .flatMap(v => (v[0] instanceof Array && v.length > 2)
          //   ? [v[0], ...v.slice(1, -1).flat(), v.at(-1)] : [v]
          // )
          .flatMap(flatten)
          // .map(v => (console.log("v3:", v), v))
          .map((v) => {
            // TODO: LEFT HERE
            // console.log(v)
            const first_is_instr = v[0] instanceof Array && v[0]
            // console.log({v, first_is_instr, leb: unleb([v[1]].flat()), ieee: decodeIEEE754([...[v[1]].flat(), 0,0,0], "f32")})
            if (!first_is_instr) return [debug_byte_arr(v), W[v]]
            const instr = W[v[0]]
            let val = v[1]
            switch (true) {
              case instr.startsWith("i32_store"):
              case instr.startsWith("i32_load"):
              case instr.startsWith("i64_store"):
              case instr.startsWith("i64_load"):
                val = `alignment: ${2 ** val[0]}, offset: ${unleb(val, 1).value}`
                break
              case instr.startsWith("i32_"):
              case instr.startsWith("i64_"):
                val = unleb(val).value
                break
              case instr.startsWith("f32"):
                val = decodeIEEE754(val, "f32")
                break
              case instr.startsWith("f64"):
                val = decodeIEEE754(val, "f64")
                break
              case instr.startsWith("block"):
              case instr.startsWith("loop"):
              case instr.startsWith("if"):
                if (!val.blocktype?.length) {
                  val = Type[val.blocktype]
                  break
                }
                const bt = val.blocktype
                val = "function " + this.getFuncTypeIndex(bt) + ' "' +
                  Type[bt[0]] + "("
                const l = bt[1]
                for (let i = 0; i < l; i++) {
                  val += Type[bt[2 + i]] + ", "
                }
                val += ") -> ("
                for (let i = 0; i < bt[2 + l]; i++) {
                  val += Type[bt[3 + i]] + ", "
                }
                val += ')"'
                break
              case instr.startsWith("local_"):
              case instr.startsWith("global_"):
              case instr.startsWith("br"):
              case instr.startsWith("memory_"):
              case instr === "call":
              case instr.startsWith("i16x8_extract_lane"):
              case instr.startsWith("i16x8_replace_lane"):
              case instr.startsWith("i8x16_extract_lane"):
              case instr.startsWith("i8x16_replace_lane"):
                // instr/val are not changed
                break
              case instr.startsWith("selectt"):
                console.error("Todo: proper select debug info")
                break
              default:
                throw new Error(
                  "unhandled: " + instr +
                    "  (use spread operator for now '...op')",
                )
            }
            let tmp = [debug_byte_arr(v), `${instr} ${val}`, v.flat(10).length]
            // console.log(tmp)
            return tmp
          }),
      ], `Function ${i}`)
      acc_len += funcs[i].length
    })

    this.#exe.push(...funcs.flat())
  }

  assembleDataSection() {
    if (IS_DEBUG) console.log("TODO: data section")
  }

  assembleDataCountSection() {
    if (IS_DEBUG) console.log("TODO: data count section")
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
    if (IS_DEBUG) console.log("TODO: name section")
  }

  assembleExecutable() {
    DEBUG(this.#exe.length, [
      [debug_byte`\x00asm`, "Magic", 4],
      [debug_byte`\x01\x00\x00\x00`, "Version"],
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

    // if (IS_DEBUG) this.#exe.forEach((v, i) => console.log(i.toString(10), debug_byte_arr([v])))

    return new Uint8Array(this.#exe)
  }

  /**
   * @param {WebAssembly.Imports} importObject
   * @returns {Promise<WebAssembly.WebAssemblyInstantiatedSource>}
   */
  compile(importObject = {}, options = {}) {
    IS_DEBUG = options.debug ?? false

    const exe = this.assembleExecutable()

    return WebAssembly.instantiate(exe, importObject)
  }
}
