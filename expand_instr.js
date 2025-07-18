import { byte } from "./helpers.js"
import { encode_v128, encodeIEEE754, encodeLEB128 } from "./lib.js"

export class InstrArray extends Array {
  static bytes(val = null) {
    // console.log(
    //   "bytes",
    //   val,
    //   ["number", "bigint"].includes(typeof val) ? JSON.stringify(this.const(val)) : JSON.stringify(val),
    // )
    if (["number", "bigint"].includes(typeof val)) {
      return this.const(val)[0]
    }
    if (val instanceof Array) {
      return val
    }
    if (typeof val === "object" && val?.prototype?.bytes !== undefined) {
      return val.prototype.bytes(val)
    }
    console.error(`Unknown value`, val)
    throw "Can't generate bytes"
  }
  static from(val) {
    const self = new this()
    self.push(...val)
    return self
  }
}

/** @type {I32_} */ class I32_ extends InstrArray {
  /**
   * Loads an i32 value from linear memory at the address popped from the stack.
   * Requires 4-byte alignment. Traps on out-of-bounds or misalignment.
   * Requires alignment byte and offset byte right after.
   */
  load(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr))
    }
    this.push([byte`\x28`, [2, ...encodeLEB128("u32", offset)]])
    return this
  }
  /**
   * Loads an 8-bit value from linear memory, sign-extends it to i32.
   * Pops address from stack. Requires 1-byte alignment. Traps on out-of-bounds.
   * Requires alignment byte and offset byte right after.
   */
  load8_s(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr))
    }
    this.push([byte`\x2c`, [0, ...encodeLEB128("u32", offset)]])
    return this
  }
  /**
   * Loads an 8-bit value from linear memory, zero-extends it to i32.
   * Pops address from stack. Requires 1-byte alignment. Traps on out-of-bounds.
   * Requires alignment byte and offset byte right after.
   */
  load8_u(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr))
    }
    this.push([byte`\x2d`, [0, ...encodeLEB128("u32", offset)]])
    return this
  }
  /**
   * Loads a 16-bit value from linear memory, sign-extends it to i32.
   * Pops address from stack. Requires 2-byte alignment. Traps on out-of-bounds.
   * Requires alignment byte and offset byte right after.
   */
  load16_s(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr))
    }
    this.push([byte`\x2e`, [1, ...encodeLEB128("u32", offset)]])
    return this
  }
  /**
   * Loads a 16-bit value from linear memory, zero-extends it to i32.
   * Pops address from stack. Requires 2-byte alignment. Traps on out-of-bounds.
   * Requires alignment byte and offset byte right after.
   */
  load16_u(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr))
    }
    this.push([byte`\x2f`, [1, ...encodeLEB128("u32", offset)]])
    return this
  }
  /**
   * Stores an i32 value into linear memory at address popped from stack.
   * Pops value then address. Requires 4-byte alignment. Traps on out-of-bounds.
   * Requires alignment byte and offset byte right after.
   */
  store(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.unshift(I32.bytes(ptr))
    }
    this.push([byte`\x36`, [2, ...encodeLEB128("u32", offset)]])
    return this
  }
  /**
   * Stores the low 8 bits of an i32 value into memory.
   * Pops value then address. Requires 1-byte alignment. Traps on out-of-bounds.
   * Requires alignment byte and offset byte right after.
   */
  store8(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.unshift(I32.bytes(ptr))
    }
    this.push([byte`\x3a`, [0, ...encodeLEB128("u32", offset)]])
    return this
  }
  /**
   * Stores the low 16 bits of an i32 value into memory.
   * Pops value then address. Requires 2-byte alignment. Traps on out-of-bounds.
   * Requires alignment byte and offset byte right after.
   */
  store16(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.unshift(I32.bytes(ptr))
    }
    this.push([byte`\x3b`, [1, ...encodeLEB128("u32", offset)]])
    return this
  }
  /**
   * Pushes a 32-bit integer constant onto the stack.
   * The immediate value is encoded as a signed LEB128.
   */
  const(num = 0, type = "i32") {
    this.push([byte`\x41`, encodeLEB128(type, num)])
    return this
  }
  /**
   * Checks if the top i32 value is zero.
   * Pops 1 value, pushes 1 (if zero) or 0 (non-zero) as i32.
   */
  eqz() {
    this.push(byte`\x45`)
    return this
  }
  /**
   * Equality comparison for i32.
   * Pops 2 values, pushes 1 if equal, else 0.
   */
  eq(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val))
    }
    this.push(byte`\x46`)
    return this
  }
  /**
   * Inequality comparison for i32.
   * Pops 2 values, pushes 1 if not equal, else 0.
   */
  ne(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val))
    }
    this.push(byte`\x47`)
    return this
  }
  /**
   * Signed less-than comparison for i32.
   * Pops 2 values, pushes 1 if (a < b) signed, else 0.
   */
  lt_s(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val))
    }
    this.push(byte`\x48`)
    return this
  }
  /**
   * Unsigned less-than comparison for i32.
   * Pops 2 values, pushes 1 if (a < b) unsigned, else 0.
   */
  lt_u(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val))
    }
    this.push(byte`\x49`)
    return this
  }
  /**
   * Signed greater-than comparison for i32.
   * Pops 2 values, pushes 1 if (a > b) signed, else 0.
   */
  gt_s(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val))
    }
    this.push(byte`\x4a`)
    return this
  }
  /**
   * Unsigned greater-than comparison for i32.
   * Pops 2 values, pushes 1 if (a > b) unsigned, else 0.
   */
  gt_u(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val))
    }
    this.push(byte`\x4b`)
    return this
  }
  /**
   * Signed less-than-or-equal comparison for i32.
   * Pops 2 values, pushes 1 if (a ≤ b) signed, else 0.
   */
  le_s(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val))
    }
    this.push(byte`\x4c`)
    return this
  }
  /**
   * Unsigned less-than-or-equal comparison for i32.
   * Pops 2 values, pushes 1 if (a ≤ b) unsigned, else 0.
   */
  le_u(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val))
    }
    this.push(byte`\x4d`)
    return this
  }
  /**
   * Signed greater-than-or-equal comparison for i32.
   * Pops 2 values, pushes 1 if (a ≥ b) signed, else 0.
   */
  ge_s(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val))
    }
    this.push(byte`\x4e`)
    return this
  }
  /**
   * Unsigned greater-than-or-equal comparison for i32.
   * Pops 2 values, pushes 1 if (a ≥ b) unsigned, else 0.
   */
  ge_u(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val))
    }
    this.push(byte`\x4f`)
    return this
  }
  /**
   * Counts leading zero bits in i32.
   * Pops 1 value, pushes the count of leading zeros (0-32) as i32.
   */
  clz() {
    this.push(byte`\x67`)
    return this
  }
  /**
   * Counts trailing zero bits in i32.
   * Pops 1 value, pushes the count of trailing zeros (0-32) as i32.
   */
  ctz() {
    this.push(byte`\x68`)
    return this
  }
  /**
   * Counts the number of set bits (1s) in i32.
   * Pops 1 value, pushes the population count as i32.
   */
  popcnt() {
    this.push(byte`\x69`)
    return this
  }
  /**
   * Integer addition for i32.
   * Pops 2 values, pushes (a + b) as i32 (wraps on overflow).
   */
  add(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val))
    }
    this.push(byte`\x6a`)
    return this
  }
  /**
   * Integer subtraction for i32.
   * Pops 2 values, pushes (a - b) as i32 (wraps on overflow).
   */
  sub(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val))
    }
    this.push(byte`\x6b`)
    return this
  }
  /**
   * Integer multiplication for i32.
   * Pops 2 values, pushes (a * b) as i32 (wraps on overflow).
   */
  mul(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val))
    }
    this.push(byte`\x6c`)
    return this
  }
  /**
   * Signed integer division for i32.
   * Pops 2 values, pushes (a / b) as i32.
   * Traps if b = 0 or division overflows (e.g., INT32_MIN / -1).
   */
  div_s(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val))
    }
    this.push(byte`\x6d`)
    return this
  }
  /**
   * Unsigned integer division for i32.
   * Pops 2 values, pushes (a / b) as i32.
   * Traps if b = 0.
   */
  div_u(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val))
    }
    this.push(byte`\x6e`)
    return this
  }
  /**
   * Signed integer remainder for i32.
   * Pops 2 values, pushes (a % b) as i32.
   * Traps if b = 0 or division overflows (e.g., INT32_MIN % -1).
   */
  rem_s(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val))
    }
    this.push(byte`\x6f`)
    return this
  }
  /**
   * Unsigned integer remainder for i32.
   * Pops 2 values, pushes (a % b) as i32.
   * Traps if b = 0.
   */
  rem_u(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val))
    }
    this.push(byte`\x70`)
    return this
  }
  /**
   * Bitwise AND for i32.
   * Pops 2 values, pushes (a & b) as i32.
   */
  and(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val))
    }
    this.push(byte`\x71`)
    return this
  }
  /**
   * Bitwise OR for i32.
   * Pops 2 values, pushes (a | b) as i32.
   */
  or(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val))
    }
    this.push(byte`\x72`)
    return this
  }
  /**
   * Bitwise XOR for i32.
   * Pops 2 values, pushes (a ^ b) as i32.
   */
  xor(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val))
    }
    this.push(byte`\x73`)
    return this
  }
  /**
   * Logical left shift for i32.
   * Pops 2 values (a, b), pushes (a << (b % 32)) as i32.
   */
  shl(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val))
    }
    this.push(byte`\x74`)
    return this
  }
  /**
   * Arithmetic right shift for i32 (sign-preserving).
   * Pops 2 values (a, b), pushes (a >> (b % 32)) as i32.
   */
  shr_s(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val))
    }
    this.push(byte`\x75`)
    return this
  }
  /**
   * Logical right shift for i32 (zero-filling).
   * Pops 2 values (a, b), pushes (a >>> (b % 32)) as i32.
   */
  shr_u(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val))
    }
    this.push(byte`\x76`)
    return this
  }
  /**
   * Bitwise rotate left for i32.
   * Pops 2 values (a, b), rotates bits left by (b % 32) positions.
   */
  rotl(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val))
    }
    this.push(byte`\x77`)
    return this
  }
  /**
   * Bitwise rotate right for i32.
   * Pops 2 values (a, b), rotates bits right by (b % 32) positions.
   */
  rotr(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val))
    }
    this.push(byte`\x78`)
    return this
  }
  /**
   * Wraps i64 to i32 (discards high 32 bits).
   * Pops 1 i64 value, pushes low 32 bits as i32.
   */
  wrap_i64() {
    this.push(byte`\xa7`)
    return this
  }
  /**
   * Truncates f32 to signed i32.
   * Pops 1 f32 value, pushes truncated integer as i32.
   * Traps if value is NaN, ±infinity, or out of i32 range.
   */
  trunc_f32_s() {
    this.push(byte`\xa8`)
    return this
  }
  /**
   * Truncates f32 to unsigned i32.
   * Pops 1 f32 value, pushes truncated integer as i32.
   * Traps if value is NaN, ±infinity, or out of u32 range.
   */
  trunc_f32_u() {
    this.push(byte`\xa9`)
    return this
  }
  /**
   * Truncates f64 to signed i32.
   * Pops 1 f64 value, pushes truncated integer as i32.
   * Traps if value is NaN, ±infinity, or out of i32 range.
   */
  trunc_f64_s() {
    this.push(byte`\xaa`)
    return this
  }
  /**
   * Truncates f64 to unsigned i32.
   * Pops 1 f64 value, pushes truncated integer as i32.
   * Traps if value is NaN, ±infinity, or out of u32 range.
   */
  trunc_f64_u() {
    this.push(byte`\xab`)
    return this
  }
  /**
   * Reinterprets f32 bits as i32 (bitwise copy).
   * Pops 1 value, pushes raw bits as i32.
   */
  reinterpret_f32() {
    this.push(byte`\xbc`)
    return this
  }
  /**
   * Sign-extends 8-bit value to 32-bit i32.
   * Pops 1 value, treats low 8 bits as signed and extends.
   */
  extend8_s() {
    this.push(byte`\xc0`)
    return this
  }
  /**
   * Sign-extends 16-bit value to 32-bit i32.
   * Pops 1 value, treats low 16 bits as signed and extends.
   */
  extend16_s() {
    this.push(byte`\xc1`)
    return this
  }
  /**
   * Saturating truncation of f32 to signed i32.
   * Pops 1 value, pushes truncated integer as i32.
   * Converts NaN/infinity/out-of-range values to INT32_MIN or INT32_MAX.
   */
  trunc_sat_f32_s() {
    this.push(byte`\xfc\x00`)
    return this
  }
  /**
   * Saturating truncation of f32 to unsigned i32.
   * Pops 1 value, pushes truncated integer as i32.
   * Converts NaN/infinity/out-of-range values to 0 or UINT32_MAX.
   */
  trunc_sat_f32_u() {
    this.push(byte`\xfc\x01`)
    return this
  }
  /**
   * Saturating truncation of f64 to signed i32.
   * Pops 1 value, pushes truncated integer as i32.
   * Converts NaN/infinity/out-of-range values to INT32_MIN or INT32_MAX.
   */
  trunc_sat_f64_s() {
    this.push(byte`\xfc\x02`)
    return this
  }
  /**
   * Saturating truncation of f64 to unsigned i32.
   * Pops 1 value, pushes truncated integer as i32.
   * Converts NaN/infinity/out-of-range values to 0 or UINT32_MAX.
   */
  trunc_sat_f64_u() {
    this.push(byte`\xfc\x03`)
    return this
  }
  /**
   * Sign-extends i32 to i64.
   * Pops 1 i32 value, pushes sign-extended i64.
   * @returns {I64_}
   */
  to_i64_extend() {
    this.push(byte`\xac`)
    return I64_.from(this)
  }
  /**
   * Zero-extends i32 to i64.
   * Pops 1 i32 value, pushes zero-extended i64.
   * @returns {I64_}
   */
  to_u64_extend() {
    this.push(byte`\xad`)
    return I64_.from(this)
  }
  /**
   * Converts signed i32 to f32.
   * Pops 1 value, pushes floating-point equivalent.
   * May lose precision for large integers.
   * @returns {F32_}
   */
  to_f32_convert_s() {
    this.push(byte`\xb2`)
    return F32_.from(this)
  }
  /**
   * Converts unsigned i32 to f32.
   * Pops 1 value, pushes floating-point equivalent.
   * May lose precision for large integers.
   * @returns {F32_}
   */
  to_f32_convert_u() {
    this.push(byte`\xb3`)
    return F32_.from(this)
  }
  /**
   * Reinterprets i32 bits as f32 (bitwise copy).
   * Pops 1 value, pushes raw bits as f32.
   */
  as_f32() {
    this.push(byte`\xbe`)
    return F32_.from(this)
  }
  /**
   * Converts signed i32 to f64.
   * Pops 1 value, p_ushes floating-point equivalent.
   * Exact conve_rsion (no precision loss).
   * @returns {I16x8_64_}
   */
  to_f64_convert_s() {
    this.push(byte`\xb7`)
    return F64_.from(this)
  }
  /**
   * Converts unsigned i32 to f64.
   * Pops 1 value, p_ushes floating-point equivalent.
   * Exact conve_rsion (no precision loss).
   * @returns {I16x8_64_}
   */
  to_f64_convert_u() {
    this.push(byte`\xb8`)
    return F64_.from(this)
  }
}
/** @type {I32_} */
export const I32 = new Proxy(I32_, {
  get: (a, b) => {
    if (typeof a[b] === "function") return a[b]
    return (..._) => (new a())[b](..._)
  },
})

class I64_ extends InstrArray {
  /**
   * Loads an i64 value from linear memory at the address popped from the stack.
   * Requires 8-byte alignment. Traps on out-of-bounds or misalignment.
   * Requires alignment byte and offset byte right after.
   */
  load(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr))
    }
    this.push([byte`\x29`, [2, ...encodeLEB128("u32", offset)]])
    return this
  }
  /**
   * Loads an 8-bit value from linear memory, sign-extends it to i64.
   * Pops address from stack. Requires 1-byte alignment. Traps on out-of-bounds.
   * Requires alignment byte and offset byte right after.
   */
  load8_s(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr))
    }
    this.push([byte`\x30`, [0, ...encodeLEB128("u32", offset)]])
    return this
  }
  /**
   * Loads an 8-bit value from linear memory, zero-extends it to i64.
   * Pops address from stack. Requires 1-byte alignment. Traps on out-of-bounds.
   * Requires alignment byte and offset byte right after.
   */
  load8_u(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr))
    }
    this.push([byte`\x31`, [0, ...encodeLEB128("u32", offset)]])
    return this
  }
  /**
   * Loads a 16-bit value from linear memory, sign-extends it to i64.
   * Pops address from stack. Requires 2-byte alignment. Traps on out-of-bounds.
   * Requires alignment byte and offset byte right after.
   */
  load16_u(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr))
    }
    this.push([byte`\x32`, [1, ...encodeLEB128("u32", offset)]])
    return this
  }
  /**
   * Loads a 16-bit value from linear memory, zero-extends it to i64.
   * Pops address from stack. Requires 2-byte alignment. Traps on out-of-bounds.
   * Requires alignment byte and offset byte right after.
   */
  load16_u(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr))
    }
    this.push([byte`\x33`, [1, encodeLEB128("u32", offset)]])
    return this
  }
  /**
   * Loads a 32-bit value from linear memory, sign-extends it to i64.
   * Pops address from stack. Requires 4-byte alignment. Traps on out-of-bounds.
   * Requires alignment byte and offset byte right after.
   */
  load32_s(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr))
    }
    this.push([byte`\x34`, [2, encodeLEB128("u32", offset)]])
    return this
  }
  /**
   * Loads a 32-bit value from linear memory, zero-extends it to i64.
   * Pops address from stack. Requires 4-byte alignment. Traps on out-of-bounds.
   * Requires alignment byte and offset byte right after.
   */
  load32_u(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr))
    }
    this.push([byte`\x35`, [2, encodeLEB128("u32", offset)]])
    return this
  }
  /**
   * Stores an i64 value into linear memory at address popped from stack.
   * Pops value then address. Requires 8-byte alignment. Traps on out-of-bounds.
   * Requires alignment byte and offset byte right after.
   */
  store(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr))
    }
    this.push([byte`\x37`, [3, encodeLEB128("u32", offset)]])
    return this
  }
  /**
   * Stores the low 8 bits of an i64 value into memory.
   * Pops value then address. Requires 1-byte alignment. Traps on out-of-bounds.
   * Requires alignment byte and offset byte right after.
   */
  store8(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr))
    }
    this.push([byte`\x3c`, [0, encodeLEB128("u32", offset)]])
    return this
  }
  /**
   * Stores the low 16 bits of an i64 value into memory.
   * Pops value then address. Requires 2-byte alignment. Traps on out-of-bounds.
   * Requires alignment byte and offset byte right after.
   */
  store16(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr))
    }
    this.push([byte`\x3d`, [1, encodeLEB128("u32", offset)]])
    return this
  }
  /**
   * Stores the low 32 bits of an i64 value into memory.
   * Pops value then address. Requires 4-byte alignment. Traps on out-of-bounds.
   * Requires alignment byte and offset byte right after.
   */
  store32(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr))
    }
    this.push([byte`\x3e`, [2, encodeLEB128("u32", offset)]])
    return this
  }
  /**
   * Pushes a 64-bit integer constant onto the stack.
   * The immediate value is encoded as a signed LEB128.
   */
  const(num = 0, type = "i64") {
    this.push([byte`\x42`, encodeLEB128(type, num)])
    return this
  }
  /**
   * Checks if the top i64 value is zero.
   * Pops 1 value, pushes 1 (if zero) or 0 (non-zero) as i32.
   */
  eqz() {
    this.push(byte`\x50`)
    return this
  }
  /**
   * Equality comparison for i64.
   * Pops 2 values, pushes 1 if equal, else 0 as i32.
   */
  eq(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val))
    }
    this.push(byte`\x51`)
    return this
  }
  /**
   * Inequality comparison for i64.
   * Pops 2 values, pushes 1 if not equal, else 0 as i32.
   */
  ne(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val))
    }
    this.push(byte`\x52`)
    return this
  }
  /**
   * Signed less-than comparison for i64.
   * Pops 2 values, pushes 1 if (a < b) signed, else 0 as i32.
   */
  lt_s(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val))
    }
    this.push(byte`\x53`)
    return this
  }
  /**
   * Unsigned less-than comparison for i64.
   * Pops 2 values, pushes 1 if (a < b) unsigned, else 0 as i32.
   */
  lt_u(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val))
    }
    this.push(byte`\x54`)
    return this
  }
  /**
   * Signed greater-than comparison for i64.
   * Pops 2 values, pushes 1 if (a > b) signed, else 0 as i32.
   */
  gt_s(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val))
    }
    this.push(byte`\x55`)
    return this
  }
  /**
   * Unsigned greater-than comparison for i64.
   * Pops 2 values, pushes 1 if (a > b) unsigned, else 0 as i32.
   */
  gt_u(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val))
    }
    this.push(byte`\x56`)
    return this
  }
  /**
   * Signed less-than-or-equal comparison for i64.
   * Pops 2 values, pushes 1 if (a ≤ b) signed, else 0 as i32.
   */
  le_s(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val))
    }
    this.push(byte`\x57`)
    return this
  }
  /**
   * Unsigned less-than-or-equal comparison for i64.
   * Pops 2 values, pushes 1 if (a ≤ b) unsigned, else 0 as i32.
   */
  le_u(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val))
    }
    this.push(byte`\x58`)
    return this
  }
  /**
   * Signed greater-than-or-equal comparison for i64.
   * Pops 2 values, pushes 1 if (a ≥ b) signed, else 0 as i32.
   */
  ge_s(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val))
    }
    this.push(byte`\x59`)
    return this
  }
  /**
   * Unsigned greater-than-or-equal comparison for i64.
   * Pops 2 values, pushes 1 if (a ≥ b) unsigned, else 0 as i32.
   */
  ge_u(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val))
    }
    this.push(byte`\x5a`)
    return this
  }
  /**
   * Counts leading zero bits in i64.
   * Pops 1 value, pushes the count (0-64) as i64.
   */
  clz() {
    this.push(byte`\x79`)
    return this
  }
  /**
   * Counts trailing zero bits in i64.
   * Pops 1 value, pushes the count (0-64) as i64.
   */
  ctz() {
    this.push(byte`\x7a`)
    return this
  }
  /**
   * Counts set bits (1s) in i64.
   * Pops 1 value, pushes the population count as i64.
   */
  popcnt() {
    this.push(byte`\x7b`)
    return this
  }
  /**
   * Integer addition for i64.
   * Pops 2 values, pushes (a + b) as i64 (wraps on overflow).
   */
  add(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val))
    }
    this.push(byte`\x7c`)
    return this
  }
  /**
   * Integer subtraction for i64.
   * Pops 2 values, pushes (a - b) as i64 (wraps on overflow).
   */
  sub(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val))
    }
    this.push(byte`\x7d`)
    return this
  }
  /**
   * Integer multiplication for i64.
   * Pops 2 values, pushes (a * b) as i64 (wraps on overflow).
   */
  mul(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val))
    }
    this.push(byte`\x7e`)
    return this
  }
  /**
   * Signed integer division for i64.
   * Pops 2 values, pushes (a / b) as i64.
   * Traps if b = 0 or division overflows (e.g., INT64_MIN / -1).
   */
  div_s(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val))
    }
    this.push(byte`\x7f`)
    return this
  }
  /**
   * Unsigned integer division for i64.
   * Pops 2 values, pushes (a / b) as i64.
   * Traps if b = 0.
   */
  div_u(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val))
    }
    this.push(byte`\x80`)
    return this
  }
  /**
   * Signed integer remainder for i64.
   * Pops 2 values, pushes (a % b) as i64.
   * Traps if b = 0 or division overflows.
   */
  rem_s(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val))
    }
    this.push(byte`\x81`)
    return this
  }
  /**
   * Unsigned integer remainder for i64.
   * Pops 2 values, pushes (a % b) as i64.
   * Traps if b = 0.
   */
  rem_u(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val))
    }
    this.push(byte`\x82`)
    return this
  }
  /**
   * Bitwise AND for i64.
   * Pops 2 values, pushes (a & b) as i64.
   */
  and(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val))
    }
    this.push(byte`\x83`)
    return this
  }
  /**
   * Bitwise OR for i64.
   * Pops 2 values, pushes (a | b) as i64.
   */
  or(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val))
    }
    this.push(byte`\x84`)
    return this
  }
  /**
   * Bitwise XOR for i64.
   * Pops 2 values, pushes (a ^ b) as i64.
   */
  xor(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val))
    }
    this.push(byte`\x85`)
    return this
  }
  /**
   * Logical left shift for i64.
   * Pops 2 values (a, b), pushes (a << (b % 64)) as i64.
   */
  shl(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val))
    }
    this.push(byte`\x86`)
    return this
  }
  /**
   * Arithmetic right shift for i64 (sign-preserving).
   * Pops 2 values (a, b), pushes (a >> (b % 64)) as i64.
   */
  shr_s(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val))
    }
    this.push(byte`\x87`)
    return this
  }
  /**
   * Logical right shift for i64 (zero-filling).
   * Pops 2 values (a, b), pushes (a >>> (b % 64)) as i64.
   */
  shr_u(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val))
    }
    this.push(byte`\x88`)
    return this
  }
  /**
   * Bitwise rotate left for i64.
   * Pops 2 values (a, b), rotates bits left by (b % 64) positions.
   */
  rotl(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val))
    }
    this.push(byte`\x89`)
    return this
  }
  /**
   * Bitwise rotate right for i64.
   * Pops 2 values (a, b), rotates bits right by (b % 64) positions.
   */
  rotr(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val))
    }
    this.push(byte`\x8a`)
    return this
  }
  /**
   * Sign-extends i32 to i64.
   * Pops 1 i32 value, pushes sign-extended i64.
   */
  extend_i32_s() {
    this.push(byte`\xac`)
    return this
  }
  /**
   * Zero-extends i32 to i64.
   * Pops 1 i32 value, pushes zero-extended i64.
   */
  extend_i32_u() {
    this.push(byte`\xad`)
    return this
  }
  /**
   * Truncates f32 to signed i64.
   * Pops 1 f32 value, pushes truncated integer as i64.
   * Traps if value is NaN, ±infinity, or out of i64 range.
   */
  trunc_f32_s() {
    this.push(byte`\xae`)
    return this
  }
  /**
   * Truncates f32 to unsigned i64.
   * Pops 1 f32 value, pushes truncated integer as i64.
   * Traps if value is NaN, ±infinity, or out of u64 range.
   */
  trunc_f32_u() {
    this.push(byte`\xaf`)
    return this
  }
  /**
   * Truncates f64 to signed i64.
   * Pops 1 value, pushes truncated integer as i64.
   * Traps if value is NaN, ±infinity, or out of i64 range.
   */
  trunc_f64_s() {
    this.push(byte`\xb0`)
    return this
  }
  /**
   * Truncates f64 to unsigned i64.
   * Pops 1 value, pushes truncated integer as i64.
   * Traps if value is NaN, ±infinity, or out of u64 range.
   */
  trunc_f64_u() {
    this.push(byte`\xb1`)
    return this
  }
  /**
   * Reinterprets f64 bits as i64 (bitwise copy).
   * Pops 1 value, pushes raw bits as i64.
   */
  reinterpret_f64() {
    this.push(byte`\xbd`)
    return this
  }
  /**
   * Sign-extends 8-bit value to 64-bit i64.
   * Pops 1 value, treats low 8 bits as signed and extends.
   */
  extend8_s() {
    this.push(byte`\xc2`)
    return this
  }
  /**
   * Sign-extends 16-bit value to 64-bit i64.
   * Pops 1 value, treats low 16 bits as signed and extends.
   */
  extend16_s() {
    this.push(byte`\xc3`)
    return this
  }
  /**
   * Sign-extends 32-bit value to 64-bit i64.
   * Pops 1 value, treats low 32 bits as signed and extends.
   */
  extend32_s() {
    this.push(byte`\xc4`)
    return this
  }
  /**
   * Saturating truncation of f32 to signed i64.
   * Pops 1 value, pushes truncated integer as i64.
   * Converts NaN/infinity/out-of-range values to INT64_MIN or INT64_MAX.
   */
  trunc_sat_f32_s() {
    this.push(byte`\xfc\x04`)
    return this
  }
  /**
   * Saturating truncation of f32 to unsigned i64.
   * Pops 1 value, pushes truncated integer as i64.
   * Converts NaN/infinity/out-of-range values to 0 or UINT64_MAX.
   */
  trunc_sat_f32_u() {
    this.push(byte`\xfc\x05`)
    return this
  }
  /**
   * Saturating truncation of f64 to signed i64.
   * Pops 1 value, pushes truncated integer as i64.
   * Converts NaN/infinity/out-of-range values to INT64_MIN or INT64_MAX.
   */
  trunc_sat_f64_s() {
    this.push(byte`\xfc\x06`)
    return this
  }
  /**
   * Saturating truncation of f64 to unsigned i64.
   * Pops 1 value, pushes truncated integer as i64.
   * Converts NaN/infinity/out-of-range values to 0 or UINT64_MAX.
   */
  trunc_sat_f64_u() {
    this.push(byte`\xfc\x07`)
    return this
  }
  /**
   * Wraps i64 to i32 (discards high 32 bits).
   * Pops 1 i64 value, pushes low 32 bits as i32.
   * @returns {I32_}
   */
  to_i32_wrap() {
    this.push(byte`\xa7`)
    return I32_.from(this)
  }
  /**
   * Converts signed i64 to f32.
   * Pops 1 value, pushes floating-point equivalent.
   * Likely loses precision (f32 has 23-bit mantissa).
   * @returns {F32_}
   */
  to_f32_convert_s() {
    this.push(byte`\xb4`)
    return F32_.from(this)
  }
  /**
   * Converts unsigned i64 to f32.
   * Pops 1 value, pushes floating-point equivalent.
   * Likely loses precision (f32 has 23-bit mantissa).
   * @returns {F32_}
   */
  to_f32_convert_u() {
    this.push(byte`\xb5`)
    return F32_.from(this)
  }
  /**
   * Converts signed i64 to f64.
   * Pops 1 value, pushes floating-point equivalent.
   * May lose precision (f64 has 52-bit mantissa).
   * @returns {F64_}
   */
  to_f64_convert_s() {
    this.push(byte`\xb9`)
    return F64_.from(this)
  }
  /**
   * Reinterprets i64 bits as f64 (bitwise copy).
   * Pops 1 value, pushes raw bits as f64.
   */
  as_f64() {
    this.push(byte`\xbf`)
    return F64_.from(this)
  }
  /**
   * Converts unsigned i64 to f64.
   * Pops 1 value, p_ushes floating-point equivalent.
   * May lose pr_ecision (f64 has 52-bit mantissa).
   * @returns {I16x8_64_}
   */
  to_f64_convert_u() {
    this.push(byte`\xba`)
    return F64_.from(this)
  }
  /**
   * Reinterprets i64 bits as f64 (bitwise copy).
   * Pops 1 value, pushes raw bits as f64.
   */
  as_f64() {
    this.push(byte`\xbf`)
    return F64_.from(this)
  }
}
/** @type {I64_} */
export const I64 = new Proxy(I64_, {
  get: (a, b) => {
    if (typeof a[b] === "function") return a[b]
    return (..._) => (new a())[b](..._)
  },
})

class F32_ extends InstrArray {
  /**
   * Loads an f32 value from linear memory at the address popped from the stack.
   * Requires 4-byte alignment. Traps on out-of-bounds or misalignment.
   *   equires alignment byte and offset byte right after.
   */
  load(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr))
    }
    this.push([byte`\x2a`, [2, encodeLEB128("u32", offset)]])
    return this
  }
  /**
   * Stores an f32 value into linear memory at address popped from stack.
   * Pops value then address. Requires 4-byte alignment. Traps on out-of-bounds.
   * Requires alignment byte and offset byte right after.
   */
  store(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr))
    }
    this.push([byte`\x38`, [2, encodeLEB128("u32", offset)]])
    return this
  }
  /**
   * Pushes a 32-bit float constant onto the stack.
   * The immediate value is encoded in IEEE 754 binary32 format.
   */
  const(num = 0, type = "f32") {
    this.push([byte`\x43`, encodeIEEE754(type, num)])
    return this
  }
  /**
   * Floating-point equality comparison for f32.
   * Pops 2 values, pushes 1 if equal (ordered), else 0 as i32.
   * Follows IEEE 754 rules (NaN returns 0).
   */
  eq(val = null) {
    if (val !== null) {
      this.push(F32.bytes(val))
    }
    this.push(byte`\x5b`)
    return this
  }
  /**
   * Floating-point inequality comparison for f32.
   * Pops 2 values, pushes 1 if not equal (unordered or different), else 0 as i32.
   * Follows IEEE 754 rules (NaN returns 1).
   */
  ne(val = null) {
    if (val !== null) {
      this.push(F32.bytes(val))
    }
    this.push(byte`\x5c`)
    return this
  }
  /**
   * Floating-point less-than comparison for f32.
   * Pops 2 values, pushes 1 if (a < b) ordered, else 0 as i32.
   * Follows IEEE 754 rules (NaN returns 0).
   */
  lt(val = null) {
    if (val !== null) {
      this.push(F32.bytes(val))
    }
    this.push(byte`\x5d`)
    return this
  }
  /**
   * Floating-point greater-than comparison for f32.
   * Pops 2 values, pushes 1 if (a > b) ordered, else 0 as i32.
   * Follows IEEE 754 rules (NaN returns 0).
   */
  gt(val = null) {
    if (val !== null) {
      this.push(F32.bytes(val))
    }
    this.push(byte`\x5e`)
    return this
  }
  /**
   * Floating-point less-than-or-equal comparison for f32.
   * Pops 2 values, pushes 1 if (a ≤ b) ordered, else 0 as i32.
   * Follows IEEE 754 rules (NaN returns 0).
   */
  le(val = null) {
    if (val !== null) {
      this.push(F32.bytes(val))
    }
    this.push(byte`\x5f`)
    return this
  }
  /**
   * Floating-point greater-than-or-equal comparison for f32.
   * Pops 2 values, pushes 1 if (a ≥ b) ordered, else 0 as i32.
   * Follows IEEE 754 rules (NaN returns 0).
   */
  ge(val = null) {
    if (val !== null) {
      this.push(F32.bytes(val))
    }
    this.push(byte`\x60`)
    return this
  }
  /**
   * Absolute value for f32.
   * Pops 1 value, pushes |a| as f32 (preserves NaN).
   */
  abs() {
    this.push(byte`\x8b`)
    return this
  }
  /**
   * Negation for f32.
   * Pops 1 value, pushes -a as f32 (flips sign bit).
   */
  neg() {
    this.push(byte`\x8c`)
    return this
  }
  /**
   * Rounds f32 up to nearest integer.
   * Pops 1 value, pushes ceil(a) as f32.
   */
  ceil() {
    this.push(byte`\x8d`)
    return this
  }
  /**
   * Rounds f32 down to nearest integer.
   * Pops 1 value, pushes floor(a) as f32.
   */
  floor() {
    this.push(byte`\x8e`)
    return this
  }
  /**
   * Truncates f32 toward zero.
   * Pops 1 value, pushes trunc(a) as f32.
   */
  trunc() {
    this.push(byte`\x8f`)
    return this
  }
  /**
   * Rounds f32 to nearest integer (ties to even).
   * Pops 1 value, pushes rounded result as f32.
   * Follows IEEE 754 rules (NaN → NaN).
   */
  nearest() {
    this.push(byte`\x90`)
    return this
  }
  /**
   * Computes square root of f32.
   * Pops 1 value, pushes sqrt(a) as f32.
   * Returns NaN for negative inputs.
   */
  sqrt() {
    this.push(byte`\x91`)
    return this
  }
  /**
   * Floating-point addition for f32.
   * Pops 2 values, pushes (a + b) as f32.
   * Follows IEEE 754 rules (NaN propagation).
   */
  add(val = null) {
    if (val !== null) {
      this.push(F32.bytes(val))
    }
    this.push(byte`\x92`)
    return this
  }
  /**
   * Floating-point subtraction for f32.
   * Pops 2 values, pushes (a - b) as f32.
   * Follows IEEE 754 rules (NaN propagation).
   */
  sub(val = null) {
    if (val !== null) {
      this.push(F32.bytes(val))
    }
    this.push(byte`\x93`)
    return this
  }
  /**
   * Floating-point multiplication for f32.
   * Pops 2 values, pushes (a * b) as f32.
   * Follows IEEE 754 rules (NaN propagation).
   */
  mul(val = null) {
    if (val !== null) {
      this.push(F32.bytes(val))
    }
    this.push(byte`\x94`)
    return this
  }
  /**
   * Floating-point division for f32.
   * Pops 2 values, pushes (a / b) as f32.
   * Follows IEEE 754 rules (NaN/±infinity handling).
   */
  div(val = null) {
    if (val !== null) {
      this.push(F32.bytes(val))
    }
    this.push(byte`\x95`)
    return this
  }
  /**
   * Returns minimum of two f32 values.
   * Pops 2 values, pushes min(a, b) as f32.
   * Handles NaN and -0/+0 correctly per IEEE 754.
   */
  min(val = null) {
    if (val !== null) {
      this.push(F32.bytes(val))
    }
    this.push(byte`\x96`)
    return this
  }
  /**
   * Returns maximum of two f32 values.
   * Pops 2 values, pushes max(a, b) as f32.
   * Handles NaN and -0/+0 correctly per IEEE 754.
   */
  max(val = null) {
    if (val !== null) {
      this.push(F32.bytes(val))
    }
    this.push(byte`\x97`)
    return this
  }
  /**
   * Copies sign bit from b to a for f32.
   * Pops 2 values, pushes (|a| with b's sign) as f32.
   */
  copysign(val = null) {
    if (val !== null) {
      this.push(F32.bytes(val))
    }
    this.push(byte`\x98`)
    return this
  }
  /**
   * Converts signed i32 to f32.
   * Pops 1 value, pushes floating-point equivalent.
   * May lose precision for large integers.
   */
  convert_i32_s() {
    this.push(byte`\xb2`)
    return this
  }
  /**
   * Converts unsigned i32 to f32.
   * Pops 1 value, pushes floating-point equivalent.
   * May lose precision for large integers.
   */
  convert_i32_u() {
    this.push(byte`\xb3`)
    return this
  }
  /**
   * Converts signed i64 to f32.
   * Pops 1 value, pushes floating-point equivalent.
   * Likely loses precision (f32 has 23-bit mantissa).
   */
  convert_i64_s() {
    this.push(byte`\xb4`)
    return this
  }
  /**
   * Converts unsigned i64 to f32.
   * Pops 1 value, pushes floating-point equivalent.
   * Likely loses precision (f32 has 23-bit mantissa).
   */
  convert_i64_u() {
    this.push(byte`\xb5`)
    return this
  }
  /**
   * Demotes f64 to f32 (loses precision).
   * Pops 1 value, pushes f32 equivalent.
   * Rounds to nearest representable f32 value.
   */
  demote_f64() {
    this.push(byte`\xb6`)
    return this
  }
  /**
   * Reinterprets i32 bits as f32 (bitwise copy).
   * Pops 1 value, pushes raw bits as f32.
   */
  reinterpret_i32() {
    this.push(byte`\xbe`)
    return this
  }
  /**
   * Truncates f32 to signed i32.
   * Pops 1 f32 value, pushes truncated integer as i32.
   * Traps if value is NaN, ±infinity, or out of i32 range.
   * @returns {I32_}
   */
  to_i32_trunc() {
    this.push(byte`\xa8`)
    return I32_.from(this)
  }
  /**
   * Truncates f32 to unsigned i32.
   * Pops 1 f32 value, pushes truncated integer as i32.
   * Traps if value is NaN, ±infinity, or out of u32 range.
   * @returns {I32_}
   */
  to_u32_trunc() {
    this.push(byte`\xa9`)
    return I32_.from(this)
  }
  /**
   * Reinterprets f32 bits as i32 (bitwise copy).
   * Pops 1 value, pushes raw bits as i32.
   */
  as_i32() {
    this.push(byte`\xbc`)
    return I32_.from(this)
  }
  /**
   * Saturating truncation of f32 to signed i32.
   * Pops 1 value, pushes truncated integer as i32.
   * Converts NaN/infinity/out-of-range values to INT32_MIN or INT32_MAX.
   * @returns {I32_}
   */
  to_i32_trunc_sat() {
    this.push(byte`\xfc\x00`)
    return I32_.from(this)
  }
  /**
   * Saturating truncation of f32 to unsigned i32.
   * Pops 1 value, pushes truncated integer as i32.
   * Converts NaN/infinity/out-of-range values to 0 or UINT32_MAX.
   * @returns {I32_}
   */
  to_u32_trunc_sat() {
    this.push(byte`\xfc\x01`)
    return I32_.from(this)
  }
  /**
   * Truncates f32 to signed i64.
   * Pops 1 f32 value, pushes truncated integer as i64.
   * Traps if value is NaN, ±infinity, or out of i64 range.
   * @returns {I64_}
   */
  to_i64_trunc() {
    this.push(byte`\xae`)
    return I64_.from(this)
  }
  /**
   * Truncates f32 to unsigned i64.
   * Pops 1 f32 value, pushes truncated integer as i64.
   * Traps if value is NaN, ±infinity, or out of u64 range.
   * @returns {I64_}
   */
  to_u64_trunc() {
    this.push(byte`\xaf`)
    return I64_.from(this)
  }
  /**
   * Saturating truncation of f32 to signed i64.
   * Pops 1 value, pushes truncated integer as i64.
   * Converts NaN/infinity/out-of-range values to INT64_MIN or INT64_MAX.
   * @returns {I64_}
   */
  to_i64_trunc_sat() {
    this.push(byte`\xfc\x04`)
    return I64_.from(this)
  }
  /**
   * Saturating truncation of f32 to unsigned i64.
   * Pops 1 value, pushes truncated integer as i64.
   * Converts NaN/infinity/out-of-range values to 0 or UINT64_MAX.
   * @returns {I64_}
   */
  to_u64_trunc_sat() {
    this.push(byte`\xfc\x05`)
    return I64_.from(this)
  }
  /**
   * Promotes f32 to_ f64 (exact conversion).
   * Pops 1 valu_e, pushes f64 equivalent.
   * @returns {I16x8_64_}
   */
  to_f64() {
    this.push(byte`\xbb`)
    return F64_.from(this)
  }
}
/** @type {F32_} */
export const F32 = new Proxy(F32_, {
  get: (a, b) => {
    if (typeof a[b] === "function") return a[b]
    return (..._) => (new a())[b](..._)
  },
})

class F64_ extends InstrArray {
  /**
   * Loads an f64 value from linear memory at the address popped from the stack.
   * Requires 8-byte alignment. Traps on out-of-bounds or misalignment.
   * Requires alignment byte and offset byte right after.
   */
  load(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(F64.bytes(ptr))
    }
    this.push([byte`\x2b`, [3, encodeLEB128("u32", offset)]])
    return this
  }
  /**
   * Stores an f64 value into linear memory at address popped from stack.
   * Pops value then address. Requires 8-byte alignment. Traps on out-of-bounds.
   * Requires alignment byte and offset byte right after.
   */
  store(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(F64.bytes(ptr))
    }
    this.push([byte`\x39`, [3, encodeLEB128("u32", offset)]])
    return this
  }
  /**
   * Pushes a 64-bit float constant onto the stack.
   * The immediate value is encoded in IEEE 754 binary64 format.
   */
  const(num = 0, type = "f64") {
    this.push([byte`\x44`, encodeIEEE754(type, num)])
    return this
  }
  /**
   * Floating-point equality comparison for f64.
   * Pops 2 values, pushes 1 if equal (ordered), else 0 as i32.
   * Follows IEEE 754 rules (NaN returns 0).
   */
  eq(val = null) {
    if (val !== null) {
      this.push(F64.bytes(val))
    }
    this.push(byte`\x61`)
    return this
  }
  /**
   * Floating-point inequality comparison for f64.
   * Pops 2 values, pushes 1 if not equal (unordered or different), else 0 as i32.
   * Follows IEEE 754 rules (NaN returns 1).
   */
  ne(val = null) {
    if (val !== null) {
      this.push(F64.bytes(val))
    }
    this.push(byte`\x62`)
    return this
  }
  /**
   * Floating-point less-than comparison for f64.
   * Pops 2 values, pushes 1 if (a < b) ordered, else 0 as i32.
   * Follows IEEE 754 rules (NaN returns 0).
   */
  lt(val = null) {
    if (val !== null) {
      this.push(F64.bytes(val))
    }
    this.push(byte`\x63`)
    return this
  }
  /**
   * Floating-point greater-than comparison for f64.
   * Pops 2 values, pushes 1 if (a > b) ordered, else 0 as i32.
   * Follows IEEE 754 rules (NaN returns 0).
   */
  gt(val = null) {
    if (val !== null) {
      this.push(F64.bytes(val))
    }
    this.push(byte`\x64`)
    return this
  }
  /**
   * Floating-point less-than-or-equal comparison for f64.
   * Pops 2 values, pushes 1 if (a ≤ b) ordered, else 0 as i32.
   * Follows IEEE 754 rules (NaN returns 0).
   */
  le(val = null) {
    if (val !== null) {
      this.push(F64.bytes(val))
    }
    this.push(byte`\x65`)
    return this
  }
  /**
   * Floating-point greater-than-or-equal comparison for f64.
   * Pops 2 values, pushes 1 if (a ≥ b) ordered, else 0 as i32.
   * Follows IEEE 754 rules (NaN returns 0).
   */
  ge(val = null) {
    if (val !== null) {
      this.push(F64.bytes(val))
    }
    this.push(byte`\x66`)
    return this
  }
  /**
   * Absolute value for f64.
   * Pops 1 value, pushes |a| as f64 (preserves NaN).
   */
  abs() {
    this.push(byte`\x99`)
    return this
  }
  /**
   * Negation for f64.
   * Pops 1 value, pushes -a as f64 (flips sign bit).
   */
  neg() {
    this.push(byte`\x9a`)
    return this
  }
  /**
   * Rounds f64 up to nearest integer.
   * Pops 1 value, pushes ceil(a) as f64.
   */
  ceil() {
    this.push(byte`\x9b`)
    return this
  }
  /**
   * Rounds f64 down to nearest integer.
   * Pops 1 value, pushes floor(a) as f64.
   */
  floor() {
    this.push(byte`\x9c`)
    return this
  }
  /**
   * Truncates f64 toward zero.
   * Pops 1 value, pushes trunc(a) as f64.
   */
  trunc() {
    this.push(byte`\x9d`)
    return this
  }
  /**
   * Rounds f64 to nearest integer (ties to even).
   * Pops 1 value, pushes rounded result as f64.
   * Follows IEEE 754 rules (NaN → NaN).
   */
  nearest() {
    this.push(byte`\x9e`)
    return this
  }
  /**
   * Computes square root of f64.
   * Pops 1 value, pushes sqrt(a) as f64.
   * Returns NaN for negative inputs.
   */
  sqrt() {
    this.push(byte`\x9f`)
    return this
  }
  /**
   * Floating-point addition for f64.
   * Pops 2 values, pushes (a + b) as f64.
   * Follows IEEE 754 rules (NaN propagation).
   */
  add(val = null) {
    if (val !== null) {
      this.push(F64.bytes(val))
    }
    this.push(byte`\xa0`)
    return this
  }
  /**
   * Floating-point subtraction for f64.
   * Pops 2 values, pushes (a - b) as f64.
   * Follows IEEE 754 rules (NaN propagation).
   */
  sub(val = null) {
    if (val !== null) {
      this.push(F64.bytes(val))
    }
    this.push(byte`\xa1`)
    return this
  }
  /**
   * Floating-point multiplication for f64.
   * Pops 2 values, pushes (a * b) as f64.
   * Follows IEEE 754 rules (NaN propagation).
   */
  mul(val = null) {
    if (val !== null) {
      this.push(F64.bytes(val))
    }
    this.push(byte`\xa2`)
    return this
  }
  /**
   * Floating-point division for f64.
   * Pops 2 values, pushes (a / b) as f64.
   * Follows IEEE 754 rules (NaN/±infinity handling).
   */
  div(val = null) {
    if (val !== null) {
      this.push(F64.bytes(val))
    }
    this.push(byte`\xa3`)
    return this
  }
  /**
   * Returns minimum of two f64 values.
   * Pops 2 values, pushes min(a, b) as f64.
   * Handles NaN and -0/+0 correctly per IEEE 754.
   */
  min(val = null) {
    if (val !== null) {
      this.push(F64.bytes(val))
    }
    this.push(byte`\xa4`)
    return this
  }
  /**
   * Returns maximum of two f64 values.
   * Pops 2 values, pushes max(a, b) as f64.
   * Handles NaN and -0/+0 correctly per IEEE 754.
   */
  max(val = null) {
    if (val !== null) {
      this.push(F64.bytes(val))
    }
    this.push(byte`\xa5`)
    return this
  }
  /**
   * Copies sign bit from b to a for f64.
   * Pops 2 values, pushes (|a| with b's sign) as f64.
   */
  copysign(val = null) {
    if (val !== null) {
      this.push(F64.bytes(val))
    }
    this.push(byte`\xa6`)
    return this
  }
  /**
   * Converts signed i32 to f64.
   * Pops 1 value, pushes floating-point equivalent.
   * Exact conversion (no precision loss).
   */
  convert_i32_s() {
    this.push(byte`\xb7`)
    return this
  }
  /**
   * Converts unsigned i32 to f64.
   * Pops 1 value, pushes floating-point equivalent.
   * Exact conversion (no precision loss).
   */
  convert_i32_u() {
    this.push(byte`\xb8`)
    return this
  }
  /**
   * Converts signed i64 to f64.
   * Pops 1 value, pushes floating-point equivalent.
   * May lose precision (f64 has 52-bit mantissa).
   */
  convert_i64_s() {
    this.push(byte`\xb9`)
    return this
  }
  /**
   * Converts unsigned i64 to f64.
   * Pops 1 value, pushes floating-point equivalent.
   * May lose precision (f64 has 52-bit mantissa).
   */
  convert_i64_u() {
    this.push(byte`\xba`)
    return this
  }
  /**
   * Promotes f32 to f64 (exact conversion).
   * Pops 1 value, pushes f64 equivalent.
   */
  promote_f32() {
    this.push(byte`\xbb`)
    return this
  }
  /**
   * Reinterprets i64 bits as f64 (bitwise copy).
   * Pops 1 value, pushes raw bits as f64.
   */
  reinterpret_i64() {
    this.push(byte`\xbf`)
    return this
  }
  /**
   * Truncates f64 to signed i32.
   * Pops 1 f64 value, pushes truncated integer as i32.
   * Traps if value is NaN, ±infinity, or out of i32 range.
   * @returns {I32_}
   */
  to_i32_trunc() {
    this.push(byte`\xaa`)
    return I32_.from(this)
  }
  /**
   * Truncates f64 to unsigned i32.
   * Pops 1 f64 value, pushes truncated integer as i32.
   * Traps if value is NaN, ±infinity, or out of u32 range.
   * @returns {I32_}
   */
  to_u32_trunc() {
    this.push(byte`\xab`)
    return I32_.from(this)
  }
  /**
   * Saturating truncation of f64 to signed i32.
   * Pops 1 value, pushes truncated integer as i32.
   * Converts NaN/infinity/out-of-range values to INT32_MIN or INT32_MAX.
   * @returns {I32_}
   */
  to_i32_trunc_sat() {
    this.push(byte`\xfc\x02`)
    return I32_.from(this)
  }
  /**
   * Saturating truncation of f64 to unsigned i32.
   * Pops 1 value, pushes truncated integer as i32.
   * Converts NaN/infinity/out-of-range values to 0 or UINT32_MAX.
   * @returns {I32_}
   */
  to_u32_trunc_sat() {
    this.push(byte`\xfc\x03`)
    return I32_.from(this)
  }
  /**
   * Truncates f64 to signed i64.
   * Pops 1 value, pushes truncated integer as i64.
   * Traps if value is NaN, ±infinity, or out of i64 range.
   * @returns {I64_}
   */
  to_i64_trunc() {
    this.push(byte`\xb0`)
    return I64_.from(this)
  }
  /**
   * Truncates f64 to unsigned i64.
   * Pops 1 value, pushes truncated integer as i64.
   * Traps if value is NaN, ±infinity, or out of u64 range.
   * @returns {I64_}
   */
  to_u64_trunc() {
    this.push(byte`\xb1`)
    return I64_.from(this)
  }
  /**
   * Reinterprets f64 bits as i64 (bitwise copy).
   * Pops 1 value, pushes raw bits as i64.
   */
  as_i64() {
    this.push(byte`\xbd`)
    return I64_.from(this)
  }
  /**
   * Saturating truncation of f64 to signed i64.
   * Pops 1 value, pushes truncated integer as i64.
   * Converts NaN/infinity/out-of-range values to INT64_MIN or INT64_MAX.
   * @returns {I64_}
   */
  to_i64_trunc_sat() {
    this.push(byte`\xfc\x06`)
    return I64_.from(this)
  }
  /**
   * Saturating truncation of f64 to unsigned i64.
   * Pops 1 value, pushes truncated integer as i64.
   * Converts NaN/infinity/out-of-range values to 0 or UINT64_MAX.
   * @returns {I64_}
   */
  to_u64_trunc_sat() {
    this.push(byte`\xfc\x07`)
    return I64_.from(this)
  }
  /**
   * Demotes f64 to f32 (loses precision).
   * Pops 1 value, pushes f32 equivalent.
   * Rounds to nearest representable f32 value.
   * @returns {F32_}
   */
  to_f32() {
    this.push(byte`\xb6`)
    return F32_.from(this)
  }
}
/** @type {F64_} */
export const F64 = new Proxy(F64_, {
  get: (a, b) => {
    if (typeof a[b] === "function") return a[b]
    return (..._) => (new a())[b](..._)
  },
})

class V128_ extends InstrArray {
  /**
   * Loads a 128-bit vector from linear memory at the address popped from the stack.
   * Requires 16-byte alignment. Traps on out-of-bounds or misalignment.
   */
  load(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr))
    }
    this.push([byte`\xfd\x00`, [4, encodeLEB128("u32", offset)]])
    return this
  }
  /**
   * Loads 8 bytes from memory, sign-extends each byte to 16 bits, and packs into a 128-bit vector.
   * Pops address from stack. Requires 8-byte alignment.
   */
  load8x8_s(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr))
    }
    this.push([byte`\xfd\x01`, [3, encodeLEB128("u32", offset)]])
    return this
  }
  /**
   * Loads 8 bytes from memory, zero-extends each byte to 16 bits, and packs into a 128-bit vector.
   * Pops address from stack. Requires 8-byte alignment.
   */
  load8x8_u(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr))
    }
    this.push([byte`\xfd\x02`, [3, encodeLEB128("u32", offset)]])
    return this
  }
  /**
   * Loads 4 halfwords (16 bits) from memory, sign-extends each halfword to 32 bits, and packs into a 128-bit vector.
   * Pops address from stack. Requires 8-byte alignment.
   */
  load16x4_s(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr))
    }
    this.push([byte`\xfd\x03`, [3, encodeLEB128("u32", offset)]])
    return this
  }
  /**
   * Loads 4 halfwords (16 bits) from memory, zero-extends each halfword to 32 bits, and packs into a 128-bit vector.
   * Pops address from stack. Requires 8-byte alignment.
   */
  load16x4_u(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr))
    }
    this.push([byte`\xfd\x04`, [3, encodeLEB128("u32", offset)]])
    return this
  }
  /**
   * Loads 2 words (32 bits) from memory, sign-extends each word to 64 bits, and packs into a 128-bit vector.
   * Pops address from stack. Requires 8-byte alignment.
   */
  load32x2_s(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr))
    }
    this.push([byte`\xfd\x05`, [3, encodeLEB128("u32", offset)]])
    return this
  }
  /**
   * Loads 2 words (32 bits) from memory, zero-extends each word to 64 bits, and packs into a 128-bit vector.
   * Pops address from stack. Requires 8-byte alignment.
   */
  load32x2_u(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr))
    }
    this.push([byte`\xfd\x06`, [3, encodeLEB128("u32", offset)]])
    return this
  }
  /**
   * Loads a single byte from memory, sign-extends it, and splats across all lanes of a 128-bit vector.
   * Pops address from stack. Requires 1-byte alignment.
   */
  load8_splat(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr))
    }
    this.push([byte`\xfd\x07`, [0, encodeLEB128("u32", offset)]])
    return this
  }
  /**
   * Loads a single halfword (16 bits) from memory, sign-extends it, and splats across all lanes of a 128-bit vector.
   * Pops address from stack. Requires 2-byte alignment.
   */
  load16_splat(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr))
    }
    this.push([byte`\xfd\x08`, [1, encodeLEB128("u32", offset)]])
    return this
  }
  /**
   * Loads a single word (32 bits) from memory, sign-extends it, and splats across all lanes of a 128-bit vector.
   * Pops address from stack. Requires 4-byte alignment.
   */
  load32_splat(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr))
    }
    this.push([byte`\xfd\x09`, [2, encodeLEB128("u32", offset)]])
    return this
  }
  /**
   * Loads a single doubleword (64 bits) from memory and splats it across all lanes of a 128-bit vector.
   * Pops address from stack. Requires 8-byte alignment.
   */
  load64_splat(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr))
    }
    this.push([byte`\xfd\x0a`, [3, encodeLEB128("u32", offset)]])
    return this
  }
  /**
   * Stores a 128-bit vector into linear memory at the address popped from the stack.
   * Requires 16-byte alignment. Traps on out-of-bounds or misalignment.
   */
  store(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr))
    }
    this.push([byte`\xfd\x0b`, [4, encodeLEB128("u32", offset)]])
    return this
  }
  /**
   * Performs a bitwise NOT operation on a 128-bit vector.
   * Pops one vector and pushes the result of flipping all bits.
   */
  not() {
    this.push(byte`\xfd\x4d`)
    return this
  }
  /**
   * Performs a bitwise AND operation on two 128-bit vectors.
   * Pops two vectors and pushes the result of `(a & b)`.
   */
  and(val) {
    if (val !== undefined) {
      this.push(V128.bytes(val))
    }
    this.push(byte`\xfd\x4e`)
    return this
  }
  /**
   * Performs a bitwise AND-NOT operation on two 128-bit vectors.
   * Pops two vectors and pushes the result of `(a & ~b)`.
   */
  andnot(val) {
    if (val !== undefined) {
      this.push(V128.bytes(val))
    }
    this.push(byte`\xfd\x4f`)
    return this
  }
  /**
   * Performs a bitwise OR operation on two 128-bit vectors.
   * Pops two vectors and pushes the result of `(a | b)`.
   */
  or(val) {
    if (val !== undefined) {
      this.push(V128.bytes(val))
    }
    this.push(byte`\xfd\x50`)
    return this
  }
  /**
   * Performs a bitwise XOR operation on two 128-bit vectors.
   * Pops two vectors and pushes the result of `(a ^ b)`.
   */
  xor(val) {
    if (val !== undefined) {
      this.push(V128.bytes(val))
    }
    this.push(byte`\xfd\x51`)
    return this
  }
  /**
   * Selects bits from two vectors based on a mask vector.
   * Pops three vectors: mask, true_vector, false_vector.
   * For each bit in the mask, selects the corresponding bit from `true_vector` if the mask bit is `1`, otherwise from `false_vector`.
   */
  bitselect(false_vector, true_vector, mask) {
    if (mask !== undefined) {
      this.push(V128.bytes(mask))
    }
    if (true_vector !== undefined) {
      this.push(V128.bytes(true_vector))
    }
    if (false_vector !== undefined) {
      this.push(V128.bytes(false_vector))
    }
    this.push(byte`\xfd\x52`)
    return this
  }
  /**
   * Checks if any lane in a 128-bit vector is non-zero.
   * Pops one vector and pushes `1` (true) if any lane is non-zero, or `0` (false) otherwise.
   */
  any_true() {
    this.push(byte`\xfd\x53`)
    return I32_.from(this)
  }
  /**
   * Loads a single byte from memory into a specific lane of a 128-bit vector.
   * Pops an address and a vector, replaces the specified lane with the loaded byte, and pushes the updated vector.
   */
  load8_lane(lane, ptr = null, offset = 0) {
    if (ptr !== null) {
      this.unshift(I32.bytes(ptr))
    }
    this.push([byte`\xfd\x54`, [0, encodeLEB128("u32", offset), lane]])
    return this
  }
  /**
   * Loads a single halfword (16 bits) from memory into a specific lane of a 128-bit vector.
   * Pops an address and a vector, replaces the specified lane with the loaded halfword, and pushes the updated vector.
   */
  load16_lane(lane, ptr = null, offset = 0) {
    if (ptr !== null) {
      this.unshift(I32.bytes(ptr))
    }
    this.push([byte`\xfd\x55`, [1, encodeLEB128("u32", offset), lane]])
    return this
  }
  /**
   * Loads a single word (32 bits) from memory into a specific lane of a 128-bit vector.
   * Pops an address and a vector, replaces the specified lane with the loaded word, and pushes the updated vector.
   */
  load32_lane(lane, ptr = null, offset = 0) {
    if (ptr !== null) {
      this.unshift(I32.bytes(ptr))
    }
    this.push([byte`\xfd\x56`, [2, encodeLEB128("u32", offset), lane]])
    return this
  }
  /**
   * Loads a single doubleword (64 bits) from memory into a specific lane of a 128-bit vector.
   * Pops an address and a vector, replaces the specified lane with the loaded doubleword, and pushes the updated vector.
   */
  load64_lane(lane, ptr = null, offset = 0) {
    if (ptr !== null) {
      this.unshift(I32.bytes(ptr))
    }
    this.push([byte`\xfd\x57`, [3, encodeLEB128("u32", offset), lane]])
    return this
  }
  /**
   * Stores a single byte from a specific lane of a 128-bit vector into memory.
   * Pops an address and a vector, writes the specified lane's byte to memory.
   */
  store8_lane(lane, ptr = null, offset = 0) {
    if (ptr !== null) {
      this.unshift(I32.bytes(ptr))
    }
    this.push([byte`\xfd\x58`, [0, encodeLEB128("u32", offset), lane]])
    return this
  }
  /**
   * Stores a single halfword (16 bits) from a specific lane of a 128-bit vector into memory.
   * Pops an address and a vector, writes the specified lane's halfword to memory.
   */
  store16_lane(lane, ptr = null, offset = 0) {
    if (ptr !== null) {
      this.unshift(I32.bytes(ptr))
    }
    this.push([byte`\xfd\x59`, [1, encodeLEB128("u32", offset), lane]])
    return this
  }
  /**
   * Stores a single word (32 bits) from a specific lane of a 128-bit vector into memory.
   * Pops an address and a vector, writes the specified lane's word to memory.
   */
  store32_lane(lane, ptr = null, offset = 0) {
    if (ptr !== null) {
      this.unshift(I32.bytes(ptr))
    }
    this.push([byte`\xfd\x5a`, [2, encodeLEB128("u32", offset), lane]])
    return this
  }
  /**
   * Stores a single doubleword (64 bits) from a specific lane of a 128-bit vector into memory.
   * Pops an address and a vector, writes the specified lane's doubleword to memory.
   */
  store64_lane(lane, ptr = null, offset = 0) {
    if (ptr !== null) {
      this.unshift(I32.bytes(ptr))
    }
    this.push([byte`\xfd\x5b`, [3, encodeLEB128("u32", offset), lane]])
    return this
  }
  /**
   * Loads a single word (32 bits) from memory and zero-extends it into a 128-bit vector.
   * Pops an address and pushes a new vector where the low 32 bits are loaded from memory, and the rest are zeroed.
   */
  load32_zero(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.unshift(I32.bytes(ptr))
    }
    this.push([byte`\xfd\x5c`, [2, encodeLEB128("u32", offset)]])
    return this
  }
  /**
   * Loads a single doubleword (64 bits) from memory and zero-extends it into a 128-bit vector.
   * Pops an address and pushes a new vector where the low 64 bits are loaded from memory, and the rest are zeroed.
   */
  load64_zero(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.unshift(I32.bytes(ptr))
    }
    this.push([byte`\xfd\x5d`, [3, encodeLEB128("u32", offset)]])
    return this
  }
  /**
   * Pushes a 128-bit constant vector onto the stack.
   * The immediate value is encoded as a literal 128-bit value.
   */
  const(val = 0) {
    this.push([byte`\xfd\x0c`, encode_v128(val)])
    return this
  }
}
/** @type {V128_} */
export const V128 = new Proxy(V128_, {
  get: (a, b) => {
    if (typeof a[b] === "function") return a[b]
    return (..._) => (new a())[b](..._)
  },
})

class I8x16_ extends InstrArray {
  /**
   * Shuffles two 128-bit vectors into a new 128-bit vector based on an 8-bit shuffle mask.
   * Pops two vectors and uses a 16-byte immediate mask to produce the result.
   */
  shuffle(...mask) {
    console.assert(mask.length === 16)
    this.push([byte`\xfd\x0d`, mask])
    return this
  }
  /**
   * Swizzles the first vector using indices from the second vector.
   * Pops two vectors and produces a new vector where each lane is selected by the corresponding index in the second vector.
   */
  swizzle(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val))
    }
    this.push(byte`\xfd\x0e`)
    return this
  }
  /**
   * Creates a 128-bit vector by replicating an 8-bit integer across all lanes.
   * Pops 1 value and splats it across all 16 lanes of the vector.
   */
  splat(val) {
    if (val !== undefined) {
      this.push(I32.bytes(val))
    }
    this.push(byte`\xfd\x0f`)
    return this
  }
  /**
   * Extracts a signed 8-bit integer from a specific lane of a 128-bit vector.
   * Pops a vector and pushes the extracted lane value as an i32 (sign-extended).
   * @returns {I32_}
   */
  extract_lane_s(index) {
    this.push([byte`\xfd\x15`, index])
    return I32_.from(this)
  }
  /**
   * Extracts an unsigned 8-bit integer from a specific lane of a 128-bit vector.
   * Pops a vector and pushes the extracted lane value as an i32 (zero-extended).
   * @returns {I32_}
   */
  extract_lane_u(index) {
    this.push([byte`\xfd\x16`, index])
    return I32_.from(this)
  }
  /**
   * Replaces a specific lane in a 128-bit vector with a new value.
   * Pops a vector and a scalar value, then replaces the specified lane and pushes the updated vector.
   */
  replace_lane(val, index) {
    if (val !== undefined) {
      this.push(I32.bytes(val))
    }
    this.push([byte`\xfd\x17`, index])
    return this
  }
  /**
   * Compares two 128-bit vectors for equality (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFF` if equal, or `0x00` otherwise.
   */
  eq(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val))
    }
    this.push(byte`\xfd\x23`)
    return this
  }
  /**
   * Compares two 128-bit vectors for inequality (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFF` if not equal, or `0x00` otherwise.
   */
  ne(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val))
    }
    this.push(byte`\xfd\x24`)
    return this
  }
  /**
   * Compares two 128-bit vectors for signed less-than (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFF` if `(a < b)`, or `0x00` otherwise.
   */
  lt_s(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val))
    }
    this.push(byte`\xfd\x25`)
    return this
  }
  /**
   * Compares two 128-bit vectors for unsigned less-than (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFF` if `(a < b)`, or `0x00` otherwise.
   */
  lt_u(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val))
    }
    this.push(byte`\xfd\x26`)
    return this
  }
  /**
   * Compares two 128-bit vectors for signed greater-than (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFF` if `(a > b)`, or `0x00` otherwise.
   */
  gt_s(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val))
    }
    this.push(byte`\xfd\x27`)
    return this
  }
  /**
   * Compares two 128-bit vectors for unsigned greater-than (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFF` if `(a > b)`, or `0x00` otherwise.
   */
  gt_u(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val))
    }
    this.push(byte`\xfd\x28`)
    return this
  }
  /**
   * Compares two 128-bit vectors for signed less-than-or-equal (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFF` if `(a ≤ b)`, or `0x00` otherwise.
   */
  le_s(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val))
    }
    this.push(byte`\xfd\x29`)
    return this
  }
  /**
   * Compares two 128-bit vectors for unsigned less-than-or-equal (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFF` if `(a ≤ b)`, or `0x00` otherwise.
   */
  le_u(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val))
    }
    this.push(byte`\xfd\x2a`)
    return this
  }
  /**
   * Compares two 128-bit vectors for signed greater-than-or-equal (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFF` if `(a ≥ b)`, or `0x00` otherwise.
   */
  ge_s(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val))
    }
    this.push(byte`\xfd\x2b`)
    return this
  }
  /**
   * Compares two 128-bit vectors for unsigned greater-than-or-equal (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFF` if `(a ≥ b)`, or `0x00` otherwise.
   */
  ge_u(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val))
    }
    this.push(byte`\xfd\x2c`)
    return this
  }
  /**
   * Computes the absolute value of each lane in an `i8x16` vector.
   * Pops one vector and pushes a new vector where each lane is replaced by its absolute value.
   */
  abs() {
    this.push(byte`\xfd\x60`)
    return this
  }
  /**
   * Negates each lane in an `i8x16` vector.
   * Pops one vector and pushes a new vector where each lane is replaced by its negated value.
   */
  neg() {
    this.push(byte`\xfd\x61`)
    return this
  }
  /**
   * Counts the number of set bits (1s) in each lane of an `i8x16` vector.
   * Pops one vector and pushes a new vector where each lane is replaced by the population count of the original lane.
   */
  popcnt() {
    this.push(byte`\xfd\x62`)
    return this
  }
  /**
   * Checks if all lanes in an `i8x16` vector are non-zero.
   * Pops one vector and pushes `1` (true) if all lanes are non-zero, or `0` (false) otherwise.
   */
  all_true() {
    this.push(byte`\xfd\x63`)
    return I32.bytes(this)
  }
  /**
   * Creates a bitmask from an `i8x16` vector.
   * Pops one vector and pushes an `i32` bitmask where each bit corresponds to the sign bit of a lane in the vector.
   */
  bitmask() {
    this.push(byte`\xfd\x64`)
    return I32.bytes(this)
  }
  /**
   * Narrows an `i16x8` vector to an `i8x16` vector using signed saturation.
   * Pops two vectors, combines their lanes into a single `i8x16` vector, saturating values that exceed the range of `i8`.
   */
  narrow_i16x8_s(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val))
    }
    this.push(byte`\xfd\x65`)
    return this
  }
  /**
   * Narrows an `i16x8` vector to an `i8x16` vector using unsigned saturation.
   * Pops two vectors, combines their lanes into a single `i8x16` vector, saturating values that exceed the range of `u8`.
   */
  narrow_i16x8_u(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val))
    }
    this.push(byte`\xfd\x66`)
    return this
  }
  /**
   * Performs a bitwise left shift on each lane of an `i8x16` vector.
   * Pops one vector and a scalar value, shifts each lane left by the scalar value, and pushes the result.
   */
  shl(val) {
    if (val !== undefined) {
      this.push(I32.bytes(val))
    }
    this.push(byte`\xfd\x6b`)
    return this
  }
  /**
   * Performs an arithmetic right shift on each lane of an `i8x16` vector.
   * Pops one vector and a scalar value, shifts each lane right by the scalar value (sign-preserving), and pushes the result.
   */
  shr_s(val) {
    if (val !== undefined) {
      this.push(I32.bytes(val))
    }
    this.push(byte`\xfd\x6c`)
    return this
  }
  /**
   * Performs a logical right shift on each lane of an `i8x16` vector.
   * Pops one vector and a scalar value, shifts each lane right by the scalar value (zero-filling), and pushes the result.
   */
  shr_u(val) {
    if (val !== undefined) {
      this.push(I32.bytes(val))
    }
    this.push(byte`\xfd\x6d`)
    return this
  }
  /**
   * Adds corresponding lanes of two `i8x16` vectors.
   * Pops two vectors and pushes a new vector where each lane is the sum of the corresponding lanes.
   */
  add(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val))
    }
    this.push(byte`\xfd\x6e`)
    return this
  }
  /**
   * Adds corresponding lanes of two `i8x16` vectors using signed saturation.
   * Pops two vectors and pushes a new vector where each lane is saturated if the result exceeds the range of `i8`.
   */
  add_sat_s(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val))
    }
    this.push(byte`\xfd\x6f`)
    return this
  }
  /**
   * Adds corresponding lanes of two `i8x16` vectors using unsigned saturation.
   * Pops two vectors and pushes a new vector where each lane is saturated if the result exceeds the range of `u8`.
   */
  add_sat_u(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val))
    }
    this.push(byte`\xfd\x70`)
    return this
  }
  /**
   * Subtracts corresponding lanes of two `i8x16` vectors.
   * Pops two vectors and pushes a new vector where each lane is the difference of the corresponding lanes.
   */
  sub(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val))
    }
    this.push(byte`\xfd\x71`)
    return this
  }
  /**
   * Subtracts corresponding lanes of two `i8x16` vectors using signed saturation.
   * Pops two vectors and pushes a new vector where each lane is saturated if the result exceeds the range of `i8`.
   */
  sub_sat_s(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val))
    }
    this.push(byte`\xfd\x72`)
    return this
  }
  /**
   * Subtracts corresponding lanes of two `i8x16` vectors using unsigned saturation.
   * Pops two vectors and pushes a new vector where each lane is saturated if the result exceeds the range of `u8`.
   */
  sub_sat_u(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val))
    }
    this.push(byte`\xfd\x73`)
    return this
  }
  /**
   * Computes the minimum of corresponding lanes of two `i8x16` vectors using signed comparison.
   * Pops two vectors and pushes a new vector where each lane is the minimum of the corresponding lanes.
   */
  min_s(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val))
    }
    this.push(byte`\xfd\x76`)
    return this
  }
  /**
   * Computes the minimum of corresponding lanes of two `i8x16` vectors using unsigned comparison.
   * Pops two vectors and pushes a new vector where each lane is the minimum of the corresponding lanes.
   */
  min_u(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val))
    }
    this.push(byte`\xfd\x77`)
    return this
  }
  /**
   * Computes the maximum of corresponding lanes of two `i8x16` vectors using signed comparison.
   * Pops two vectors and pushes a new vector where each lane is the maximum of the corresponding lanes.
   */
  max_s(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val))
    }
    this.push(byte`\xfd\x78`)
    return this
  }
  /**
   * Computes the maximum of corresponding lanes of two `i8x16` vectors using unsigned comparison.
   * Pops two vectors and pushes a new vector where each lane is the maximum of the corresponding lanes.
   */
  max_u(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val))
    }
    this.push(byte`\xfd\x79`)
    return this
  }
  /**
   * Computes the unsigned average (rounded) of corresponding lanes of two `i8x16` vectors.
   * Pops two vectors and pushes a new vector where each lane is the rounded average of the corresponding lanes.
   */
  avgr_u(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val))
    }
    this.push(byte`\xfd\x7b`)
    return this
  }
  /**
   * Pushes a 128-bit constant vector onto the stack.
   * The immediate value is encoded as a vector of 16 8-bit values.
   */
  const(...vals) {
    console.assert(vals.length === 16)
    this.push([byte`\xfd\x0c`, encode_v128(vals)])
    return this
  }
}
/** @type {I8x16_} */
export const I8x16 = new Proxy(I8x16_, {
  get: (a, b) => {
    if (typeof a[b] === "function") return a[b]
    const tmp = new a()
    return (..._) => (tmp[b](..._), tmp)
  },
})

class I16x8_ extends InstrArray {
  /**
   * Creates a 128-bit vector by replicating a 16-bit integer across all lanes.
   * Pops 1 value and splats it across all 8 lanes of the vector.
   */
  splat(val) {
    if (val !== undefined) {
      this.push(I32.const(val, "i17"))
    }
    this.push(byte`\xfd\x10`)
    return this
  }
  /**
   * Extracts a signed 16-bit integer from a specific lane of a 128-bit vector.
   * Pops a vector and pushes the extracted lane value as an i32 (sign-extended).
   * @returns {I32_}
   */
  extract_lane_s(index) {
    this.push([byte`\xfd\x18`, index])
    return I32_.from(this)
  }
  /**
   * Extracts an unsigned 16-bit integer from a specific lane of a 128-bit vector.
   * Pops a vector and pushes the extracted lane value as an i32 (zero-extended).
   */
  extract_lane_u(index) {
    this.push([byte`\xfd\x19`, index])
    return I32_.from(this)
  }
  /**
   * Replaces a specific lane in a 128-bit vector with a new value.
   * Pops a vector and a scalar value, then replaces the specified lane and pushes the updated vector.
   */
  replace_lane(val, index) {
    if (val !== undefined) {
      this.push(InstrArray.bytes(val))
    }
    this.push([byte`\xfd\x1a`, index])
    return this
  }
  /**
   * Compares two 128-bit vectors for equality (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFF` if equal, or `0x0000` otherwise.
   */
  eq(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val))
    }
    this.push(byte`\xfd\x2d`)
    return this
  }
  /**
   * Compares two 128-bit vectors for inequality (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFF` if not equal, or `0x0000` otherwise.
   */
  ne(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val))
    }
    this.push(byte`\xfd\x2e`)
    return this
  }
  /**
   * Compares two 128-bit vectors for signed less-than (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFF` if `(a < b)`, or `0x0000` otherwise.
   */
  lt_s(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val))
    }
    this.push(byte`\xfd\x2f`)
    return this
  }
  /**
   * Compares two 128-bit vectors for unsigned less-than (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFF` if `(a < b)`, or `0x0000` otherwise.
   */
  lt_u(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val))
    }
    this.push(byte`\xfd\x30`)
    return this
  }
  /**
   * Compares two 128-bit vectors for signed greater-than (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFF` if `(a > b)`, or `0x0000` otherwise.
   */
  gt_s(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val))
    }
    this.push(byte`\xfd\x31`)
    return this
  }
  /**
   * Compares two 128-bit vectors for unsigned greater-than (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFF` if `(a > b)`, or `0x0000` otherwise.
   */
  gt_u(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val))
    }
    this.push(byte`\xfd\x32`)
    return this
  }
  /**
   * Compares two 128-bit vectors for signed less-than-or-equal (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFF` if `(a ≤ b)`, or `0x0000` otherwise.
   */
  le_s(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val))
    }
    this.push(byte`\xfd\x33`)
    return this
  }
  /**
   * Compares two 128-bit vectors for unsigned less-than-or-equal (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFF` if `(a ≤ b)`, or `0x0000` otherwise.
   */
  le_u(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val))
    }
    this.push(byte`\xfd\x34`)
    return this
  }
  /**
   * Compares two 128-bit vectors for signed greater-than-or-equal (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFF` if `(a ≥ b)`, or `0x0000` otherwise.
   */
  ge_s(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val))
    }
    this.push(byte`\xfd\x35`)
    return this
  }
  /**
   * Compares two 128-bit vectors for unsigned greater-than-or-equal (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFF` if `(a ≥ b)`, or `0x0000` otherwise.
   */
  ge_u(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val))
    }
    this.push(byte`\xfd\x36`)
    return this
  }
  /**
   * Adds adjacent pairs of lanes in an `i8x16` vector using signed addition, producing an `i16x8` vector.
   * Pops one vector and pushes a new vector where each lane is the sum of two adjacent lanes.
   */
  extadd_pairwise_i8x16_s() {
    this.push(byte`\xfd\x7c`)
    return this
  }
  /**
   * Adds adjacent pairs of lanes in an `i8x16` vector using unsigned addition, producing an `i16x8` vector.
   * Pops one vector and pushes a new vector where each lane is the sum of two adjacent lanes.
   */
  extadd_pairwise_i8x16_u() {
    this.push(byte`\xfd\x7d`)
    return this
  }
  /**
   * Adds adjacent pairs of lanes in an `i16x8` vector using signed addition, producing an `i32x4` vector.
   * Pops one vector and pushes a new vector where each lane is the sum of two adjacent lanes.
   */
  extadd_pairwise_i16x8_s() {
    this.push(byte`\xfd\x7e`)
    return this
  }
  /**
   * Adds adjacent pairs of lanes in an `i16x8` vector using unsigned addition, producing an `i32x4` vector.
   * Pops one vector and pushes a new vector where each lane is the sum of two adjacent lanes.
   */
  extadd_pairwise_i16x8_u() {
    this.push(byte`\xfd\x7f`)
    return this
  }
  /**
   * Computes the absolute value of each lane in an `i16x8` vector.
   * Pops one vector and pushes a new vector where each lane is replaced by its absolute value.
   */
  abs() {
    this.push(byte`\xfd\x80\x01`)
    return this
  }
  /**
   * Negates each lane in an `i16x8` vector.
   * Pops one vector and pushes a new vector where each lane is replaced by its negated value.
   */
  neg() {
    this.push(byte`\xfd\x81\x01`)
    return this
  }
  /**
   * Performs a signed Q15 multiplication with rounding and saturation on each lane of two `i16x8` vectors.
   * Pops two vectors and pushes a new vector where each lane is `(a * b + 0x4000) >> 15`, saturated to the range of `i16`.
   */
  q15mulr_sat_s(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val))
    }
    this.push(byte`\xfd\x82\x01`)
    return this
  }
  /**
   * Checks if all lanes in an `i16x8` vector are non-zero.
   * Pops one vector and pushes `1` (true) if all lanes are non-zero, or `0` (false) otherwise.
   */
  all_true() {
    this.push(byte`\xfd\x83\x01`)
    return I32_.from(this)
  }
  /**
   * Creates a bitmask from an `i16x8` vector.
   * Pops one vector and pushes an `i32` bitmask where each bit corresponds to the sign bit of a lane in the vector.
   */
  bitmask() {
    this.push(byte`\xfd\x84\x01`)
    return I32_.from(this)
  }
  /**
   * Narrows an `i32x4` vector to an `i16x8` vector using signed saturation.
   * Pops two vectors, combines their lanes into a single `i16x8` vector, saturating values that exceed the range of `i16`.
   */
  narrow_i32x4_s(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val))
    }
    this.push(byte`\xfd\x85\x01`)
    return this
  }
  /**
   * Narrows an `i32x4` vector to an `i16x8` vector using unsigned saturation.
   * Pops two vectors, combines their lanes into a single `i16x8` vector, saturating values that exceed the range of `u16`.
   */
  narrow_i32x4_u(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val))
    }
    this.push(byte`\xfd\x86\x01`)
    return this
  }
  /**
   * Extends the low 8 lanes of an `i8x16` vector to 16 bits using signed extension.
   * Pops one vector and pushes a new vector where each lane is the sign-extended value of the corresponding low lane.
   */
  extend_low_i8x16_s() {
    this.push(byte`\xfd\x87\x01`)
    return this
  }
  /**
   * Extends the high 8 lanes of an `i8x16` vector to 16 bits using signed extension.
   * Pops one vector and pushes a new vector where each lane is the sign-extended value of the corresponding high lane.
   */
  extend_high_i8x16_s() {
    this.push(byte`\xfd\x88\x01`)
    return this
  }
  /**
   * Extends the low 8 lanes of an `i8x16` vector to 16 bits using zero extension.
   * Pops one vector and pushes a new vector where each lane is the zero-extended value of the corresponding low lane.
   */
  extend_low_i8x16_u() {
    this.push(byte`\xfd\x89\x01`)
    return this
  }
  /**
   * Extends the high 8 lanes of an `i8x16` vector to 16 bits using zero extension.
   * Pops one vector and pushes a new vector where each lane is the zero-extended value of the corresponding high lane.
   */
  extend_high_i8x16_u() {
    this.push(byte`\xfd\x8a\x01`)
    return this
  }
  /**
   * Performs a bitwise left shift on each lane of an `i16x8` vector.
   * Pops one vector and a scalar value, shifts each lane left by the scalar value, and pushes the result.
   */
  shl(val) {
    if (val !== undefined) {
      this.push(I32.bytes(val))
    }
    this.push(byte`\xfd\x8b\x01`)
    return this
  }
  /**
   * Performs an arithmetic right shift on each lane of an `i16x8` vector.
   * Pops one vector and a scalar value, shifts each lane right by the scalar value (sign-preserving), and pushes the result.
   */
  shr_s(val) {
    if (val !== undefined) {
      this.push(I32.bytes(val))
    }
    this.push(byte`\xfd\x8c\x01`)
    return this
  }
  /**
   * Performs a logical right shift on each lane of an `i16x8` vector.
   * Pops one vector and a scalar value, shifts each lane right by the scalar value (zero-filling), and pushes the result.
   */
  shr_u(val) {
    if (val !== undefined) {
      this.push(I32.bytes(val))
    }
    this.push(byte`\xfd\x8d\x01`)
    return this
  }
  /**
   * Adds corresponding lanes of two `i16x8` vectors.
   * Pops two vectors and pushes a new vector where each lane is the sum of the corresponding lanes.
   */
  add(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val))
    }
    this.push(byte`\xfd\x8e\x01`)
    return this
  }
  /**
   * Adds corresponding lanes of two `i16x8` vectors using signed saturation.
   * Pops two vectors and pushes a new vector where each lane is saturated if the result exceeds the range of `i16`.
   */
  add_sat_s(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val))
    }
    this.push(byte`\xfd\x8f\x01`)
    return this
  }
  /**
   * Adds corresponding lanes of two `i16x8` vectors using unsigned saturation.
   * Pops two vectors and pushes a new vector where each lane is saturated if the result exceeds the range of `u16`.
   */
  add_sat_u(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val))
    }
    this.push(byte`\xfd\x90\x01`)
    return this
  }
  /**
   * Subtracts corresponding lanes of two `i16x8` vectors.
   * Pops two vectors and pushes a new vector where each lane is the difference of the corresponding lanes.
   */
  sub(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val))
    }
    this.push(byte`\xfd\x91\x01`)
    return this
  }
  /**
   * Subtracts corresponding lanes of two `i16x8` vectors using signed saturation.
   * Pops two vectors and pushes a new vector where each lane is saturated if the result exceeds the range of `i16`.
   */
  sub_sat_s(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val))
    }
    this.push(byte`\xfd\x92\x01`)
    return this
  }
  /**
   * Subtracts corresponding lanes of two `i16x8` vectors using unsigned saturation.
   * Pops two vectors and pushes a new vector where each lane is saturated if the result exceeds the range of `u16`.
   */
  sub_sat_u(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val))
    }
    this.push(byte`\xfd\x93\x01`)
    return this
  }
  /**
   * Multiplies corresponding lanes of two `i16x8` vectors.
   * Pops two vectors and pushes a new vector where each lane is the product of the corresponding lanes.
   */
  mul(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val))
    }
    this.push(byte`\xfd\x95\x01`)
    return this
  }
  /**
   * Computes the minimum of corresponding lanes of two `i16x8` vectors using signed comparison.
   * Pops two vectors and pushes a new vector where each lane is the minimum of the corresponding lanes.
   */
  min_s(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val))
    }
    this.push(byte`\xfd\x96\x01`)
    return this
  }
  /**
   * Computes the minimum of corresponding lanes of two `i16x8` vectors using unsigned comparison.
   * Pops two vectors and pushes a new vector where each lane is the minimum of the corresponding lanes.
   */
  min_u(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val))
    }
    this.push(byte`\xfd\x97\x01`)
    return this
  }
  /**
   * Computes the maximum of corresponding lanes of two `i16x8` vectors using signed comparison.
   * Pops two vectors and pushes a new vector where each lane is the maximum of the corresponding lanes.
   */
  max_s(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val))
    }
    this.push(byte`\xfd\x98\x01`)
    return this
  }
  /**
   * Computes the maximum of corresponding lanes of two `i16x8` vectors using unsigned comparison.
   * Pops two vectors and pushes a new vector where each lane is the maximum of the corresponding lanes.
   */
  max_u(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val))
    }
    this.push(byte`\xfd\x99\x01`)
    return this
  }
  /**
   * Computes the unsigned average (rounded) of corresponding lanes of two `i16x8` vectors.
   * Pops two vectors and pushes a new vector where each lane is the rounded average of the corresponding lanes.
   */
  avgr_u(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val))
    }
    this.push(byte`\xfd\x9b\x01`)
    return this
  }
  /**
   * Multiplies low 8 lanes of two `i8x16` vectors and extends the result to 16 bits using signed extension.
   * Pops two vectors and pushes a new vector where each lane is the sign-extended product of the corresponding low lanes.
   */
  extmul_low_i8x16_s(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val))
    }
    this.push(byte`\xfd\x9c\x01`)
    return this
  }
  /**
   * Multiplies high 8 lanes of two `i8x16` vectors and extends the result to 16 bits using signed extension.
   * Pops two vectors and pushes a new vector where each lane is the sign-extended product of the corresponding high lanes.
   */
  extmul_high_i8x16_s(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val))
    }
    this.push(byte`\xfd\x9d\x01`)
    return this
  }
  /**
   * Multiplies low 8 lanes of two `i8x16` vectors and extends the result to 16 bits using zero extension.
   * Pops two vectors and pushes a new vector where each lane is the zero-extended product of the corresponding low lanes.
   */
  extmul_low_i8x16_u(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val))
    }
    this.push(byte`\xfd\x9e\x01`)
    return this
  }
  /**
   * Multiplies high 8 lanes of two `i8x16` vectors and extends the result to 16 bits using zero extension.
   * Pops two vectors and pushes a new vector where each lane is the zero-extended product of the corresponding high lanes.
   */
  extmul_high_i8x16_u(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val))
    }
    this.push(byte`\xfd\x9f\x01`)
    return this
  }
  /**
   * Pushes a 128-bit constant vector onto the stack.
   * The immediate value is encoded as a vector of 8 16-bit values.
   */
  const(...vals) {
    console.assert(vals.length === 8)
    this.push([byte`\xfd\x0c`, encode_v128(vals)])
    return this
  }
}
/** @type {I16x8_} */
export const I16x8 = new Proxy(I16x8_, {
  get: (a, b) => {
    if (typeof a[b] === "function") return a[b]
    const tmp = new a()
    return (..._) => (tmp[b](..._), tmp)
  },
})

class I32x4_ extends InstrArray {
  /**
   * Creates a 128-bit vector by replicating a 32-bit integer across all lanes.
   * Pops 1 value and splats it across all 4 lanes of the vector.
   */
  splat(val) {
    if (val !== undefined) {
      this.push(I32.bytes(val))
    }
    this.push(byte`\xfd\x11`)
    return this
  }
  /**
   * Extracts a 32-bit integer from a specific lane of a 128-bit vector.
   * Pops a vector and pushes the extracted lane value as an i32.
   */
  extract_lane(index) {
    this.push([byte`\xfd\x1b`, index])
    return I32_.from(this)
  }
  /**
   * Replaces a specific lane in a 128-bit vector with a new value.
   * Pops a vector and a scalar value, then replaces the specified lane and pushes the updated vector.
   */
  replace_lane(val, index) {
    if (val !== undefined) {
      this.push(InstrArray.bytes(val))
    }
    this.push([byte`\xfd\x1c`, index])
    return this
  }
  /**
   * Compares two 128-bit vectors for equality (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if equal, or `0x00000000` otherwise.
   */
  eq(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val))
    }
    this.push(byte`\xfd\x37`)
    return this
  }
  /**
   * Compares two 128-bit vectors for inequality (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if not equal, or `0x00000000` otherwise.
   */
  ne(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val))
    }
    this.push(byte`\xfd\x38`)
    return this
  }
  /**
   * Compares two 128-bit vectors for signed less-than (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if `(a < b)`, or `0x00000000` otherwise.
   */
  lt_s(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val))
    }
    this.push(byte`\xfd\x39`)
    return this
  }
  /**
   * Compares two 128-bit vectors for unsigned less-than (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if `(a < b)`, or `0x00000000` otherwise.
   */
  lt_u(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val))
    }
    this.push(byte`\xfd\x3a`)
    return this
  }
  /**
   * Compares two 128-bit vectors for signed greater-than (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if `(a > b)`, or `0x00000000` otherwise.
   */
  gt_s(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val))
    }
    this.push(byte`\xfd\x3b`)
    return this
  }
  /**
   * Compares two 128-bit vectors for unsigned greater-than (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if `(a > b)`, or `0x00000000` otherwise.
   */
  gt_u(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val))
    }
    this.push(byte`\xfd\x3c`)
    return this
  }
  /**
   * Compares two 128-bit vectors for signed less-than-or-equal (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if `(a ≤ b)`, or `0x00000000` otherwise.
   */
  le_s(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val))
    }
    this.push(byte`\xfd\x3d`)
    return this
  }
  /**
   * Compares two 128-bit vectors for unsigned less-than-or-equal (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if `(a ≤ b)`, or `0x00000000` otherwise.
   */
  le_u(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val))
    }
    this.push(byte`\xfd\x3e`)
    return this
  }
  /**
   * Compares two 128-bit vectors for signed greater-than-or-equal (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if `(a ≥ b)`, or `0x00000000` otherwise.
   */
  ge_s(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val))
    }
    this.push(byte`\xfd\x3f`)
    return this
  }
  /**
   * Compares two 128-bit vectors for unsigned greater-than-or-equal (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if `(a ≥ b)`, or `0x00000000` otherwise.
   */
  ge_u(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val))
    }
    this.push(byte`\xfd\x40`)
    return this
  }
  /**
   * Computes the absolute value of each lane in an `i32x4` vector.
   * Pops one vector and pushes a new vector where each lane is replaced by its absolute value.
   */
  abs() {
    this.push(byte`\xfd\xa0\x01`)
    return this
  }
  /**
   * Negates each lane in an `i32x4` vector.
   * Pops one vector and pushes a new vector where each lane is replaced by its negated value.
   */
  neg() {
    this.push(byte`\xfd\xa1\x01`)
    return this
  }
  /**
   * Checks if all lanes in an `i32x4` vector are non-zero.
   * Pops one vector and pushes `1` (true) if all lanes are non-zero, or `0` (false) otherwise.
   */
  all_true() {
    this.push(byte`\xfd\xa3\x01`)
    return I32_.from(this)
  }
  /**
   * Creates a bitmask from an `i32x4` vector.
   * Pops one vector and pushes an `i32` bitmask where each bit corresponds to the sign bit of a lane in the vector.
   */
  bitmask() {
    this.push(byte`\xfd\xa4\x01`)
    return I32_.from(this)
  }
  /**
   * Extends the low 4 lanes of an `i16x8` vector to 32 bits using signed extension.
   * Pops one vector and pushes a new vector where each lane is the sign-extended value of the corresponding low lane.
   */
  extend_low_i16x8_s() {
    this.push(byte`\xfd\xa7\x01`)
    return this
  }
  /**
   * Extends the high 4 lanes of an `i16x8` vector to 32 bits using signed extension.
   * Pops one vector and pushes a new vector where each lane is the sign-extended value of the corresponding high lane.
   */
  extend_high_i16x8_s() {
    this.push(byte`\xfd\xa8\x01`)
    return this
  }
  /**
   * Extends the low 4 lanes of an `i16x8` vector to 32 bits using zero extension.
   * Pops one vector and pushes a new vector where each lane is the zero-extended value of the corresponding low lane.
   */
  extend_low_i16x8_u() {
    this.push(byte`\xfd\xa9\x01`)
    return this
  }
  /**
   * Extends the high 4 lanes of an `i16x8` vector to 32 bits using zero extension.
   * Pops one vector and pushes a new vector where each lane is the zero-extended value of the corresponding high lane.
   */
  extend_high_i16x8_u() {
    this.push(byte`\xfd\xaa\x01`)
    return this
  }
  /**
   * Performs a bitwise left shift on each lane of an `i32x4` vector.
   * Pops one vector and a scalar value, shifts each lane left by the scalar value, and pushes the result.
   */
  shl(val) {
    if (val !== undefined) {
      this.push(InstrArray.bytes(val))
    }
    this.push(byte`\xfd\xab\x01`)
    return this
  }
  /**
   * Performs an arithmetic right shift on each lane of an `i32x4` vector.
   * Pops one vector and a scalar value, shifts each lane right by the scalar value (sign-preserving), and pushes the result.
   */
  shr_s(val) {
    if (val !== undefined) {
      this.push(InstrArray.bytes(val))
    }
    this.push(byte`\xfd\xac\x01`)
    return this
  }
  /**
   * Performs a logical right shift on each lane of an `i32x4` vector.
   * Pops one vector and a scalar value, shifts each lane right by the scalar value (zero-filling), and pushes the result.
   */
  shr_u(val) {
    if (val !== undefined) {
      this.push(InstrArray.bytes(val))
    }
    this.push(byte`\xfd\xad\x01`)
    return this
  }
  /**
   * Adds corresponding lanes of two `i32x4` vectors.
   * Pops two vectors and pushes a new vector where each lane is the sum of the corresponding lanes.
   */
  add(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val))
    }
    this.push(byte`\xfd\xae\x01`)
    return this
  }
  /**
   * Subtracts corresponding lanes of two `i32x4` vectors.
   * Pops two vectors and pushes a new vector where each lane is the difference of the corresponding lanes.
   */
  sub(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val))
    }
    this.push(byte`\xfd\xb1\x01`)
    return this
  }
  /**
   * Multiplies corresponding lanes of two `i32x4` vectors.
   * Pops two vectors and pushes a new vector where each lane is the product of the corresponding lanes.
   */
  mul(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val))
    }
    this.push(byte`\xfd\xb5\x01`)
    return this
  }
  /**
   * Computes the minimum of corresponding lanes of two `i32x4` vectors using signed comparison.
   * Pops two vectors and pushes a new vector where each lane is the minimum of the corresponding lanes.
   */
  min_s(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val))
    }
    this.push(byte`\xfd\xb6\x01`)
    return this
  }
  /**
   * Computes the minimum of corresponding lanes of two `i32x4` vectors using unsigned comparison.
   * Pops two vectors and pushes a new vector where each lane is the minimum of the corresponding lanes.
   */
  min_u(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val))
    }
    this.push(byte`\xfd\xb7\x01`)
    return this
  }
  /**
   * Computes the maximum of corresponding lanes of two `i32x4` vectors using signed comparison.
   * Pops two vectors and pushes a new vector where each lane is the maximum of the corresponding lanes.
   */
  max_s(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val))
    }
    this.push(byte`\xfd\xb8\x01`)
    return this
  }
  /**
   * Computes the maximum of corresponding lanes of two `i32x4` vectors using unsigned comparison.
   * Pops two vectors and pushes a new vector where each lane is the maximum of the corresponding lanes.
   */
  max_u(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val))
    }
    this.push(byte`\xfd\xb9\x01`)
    return this
  }
  /**
   * Computes the dot product of two `i16x8` vectors, producing an `i32x4` vector.
   * Pops two vectors, computes the dot product of adjacent pairs of lanes, and pushes the result as an `i32x4` vector.
   */
  dot_i16x8_s(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val))
    }
    this.push(byte`\xfd\xba\x01`)
    return this
  }
  /**
   * Multiplies low 4 lanes of two `i16x8` vectors and extends the result to 32 bits using signed extension.
   * Pops two vectors and pushes a new vector where each lane is the sign-extended product of the corresponding low lanes.
   */
  extmul_low_i16x8_s(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val))
    }
    this.push(byte`\xfd\xbb\x01`)
    return this
  }
  /**
   * Multiplies high 4 lanes of two `i16x8` vectors and extends the result to 32 bits using signed extension.
   * Pops two vectors and pushes a new vector where each lane is the sign-extended product of the corresponding high lanes.
   */
  extmul_high_i16x8_s(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val))
    }
    this.push(byte`\xfd\xbc\x01`)
    return this
  }
  /**
   * Multiplies low 4 lanes of two `i16x8` vectors and extends the result to 32 bits using zero extension.
   * Pops two vectors and pushes a new vector where each lane is the zero-extended product of the corresponding low lanes.
   */
  extmul_low_i16x8_u(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val))
    }
    this.push(byte`\xfd\xbd\x01`)
    return this
  }
  /**
   * Multiplies high 4 lanes of two `i16x8` vectors and extends the result to 32 bits using zero extension.
   * Pops two vectors and pushes a new vector where each lane is the zero-extended product of the corresponding high lanes.
   */
  extmul_high_i16x8_u(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val))
    }
    this.push(byte`\xfd\xbe\x01`)
    return this
  }
  /**
   * Converts each lane of an `f32x4` vector to a signed `i32x4` vector using saturation.
   * Pops one vector and pushes a new vector where each lane is truncated to `i32` with saturation if the result exceeds the range of `i32`.
   */
  trunc_sat_f32x4_s() {
    this.push(byte`\xfd\xf8\x01`)
    return this
  }
  /**
   * Converts each lane of an `f32x4` vector to an unsigned `i32x4` vector using saturation.
   * Pops one vector and pushes a new vector where each lane is truncated to `u32` with saturation if the result exceeds the range of `u32`.
   */
  trunc_sat_f32x4_u() {
    this.push(byte`\xfd\xf9\x01`)
    return this
  }
  /**
   * Converts the low two lanes of an `f64x2` vector to a signed `i32x4` vector using saturation.
   * Pops one vector and pushes a new vector where the low two lanes are truncated to `i32` with saturation, and the high two lanes are zeroed.
   */
  trunc_sat_f64x2_s_zero() {
    this.push(byte`\xfd\xfc\x01`)
    return this
  }
  /**
   * Converts the low two lanes of an `f64x2` vector to an unsigned `i32x4` vector using saturation.
   * Pops one vector and pushes a new vector where the low two lanes are truncated to `u32` with saturation, and the high two lanes are zeroed.
   */
  trunc_sat_f64x2_u_zero() {
    this.push(byte`\xfd\xfd\x01`)
    return this
  }
  /**
   * Pushes a 128-bit constant vector onto the stack.
   * The immediate value is encoded as a vector of 4 32-bit values.
   */
  const(...vals) {
    console.assert(vals.length === 4)
    this.push([byte`\xfd\x0c`, encode_v128(vals)])
    return this
  }
}
/** @type {I32x4_} */
export const I32x4 = new Proxy(I32x4_, {
  get: (a, b) => {
    if (typeof a[b] === "function") return a[b]
    const tmp = new a()
    return (..._) => (tmp[b](..._), tmp)
  },
})

class I64x2_ extends InstrArray {
  /**
   * Creates a 128-bit vector by replicating a 64-bit integer across all lanes.
   * Pops 1 value and splats it across all 2 lanes of the vector.
   */
  splat() {
    if (val !== undefined) {
      this.push(I64.bytes(val))
    }
    this.push(byte`\xfd\x12`)
    return this
  }
  /**
   * Extracts a 64-bit integer from a specific lane of a 128-bit vector.
   * Pops a vector and pushes the extracted lane value as an i64.
   */
  extract_lane(index) {
    this.push([byte`\xfd\x1d`, index])
    return I64_.from(this)
  }
  /**
   * Replaces a specific lane in a 128-bit vector with a new value.
   * Pops a vector and a scalar value, then replaces the specified lane and pushes the updated vector.
   */
  replace_lane(val, index) {
    if (val !== undefined) {
      this.push(InstrArray.bytes(val))
    }
    this.push([byte`\xfd\x1e`, index])
    return this
  }
  /**
   * Computes the absolute value of each lane in an `i64x2` vector.
   * Pops one vector and pushes a new vector where each lane is replaced by its absolute value.
   */
  abs() {
    this.push(byte`\xfd\xc0\x01`)
    return this
  }
  /**
   * Negates each lane in an `i64x2` vector.
   * Pops one vector and pushes a new vector where each lane is replaced by its negated value.
   */
  neg() {
    this.push(byte`\xfd\xc1\x01`)
    return this
  }
  /**
   * Checks if all lanes in an `i64x2` vector are non-zero.
   * Pops one vector and pushes `1` (true) if all lanes are non-zero, or `0` (false) otherwise.
   */
  all_true() {
    this.push(byte`\xfd\xc3\x01`)
    return this
  }
  /**
   * Creates a bitmask from an `i64x2` vector.
   * Pops one vector and pushes an `i32` bitmask where each bit corresponds to the sign bit of a lane in the vector.
   */
  bitmask() {
    this.push(byte`\xfd\xc4\x01`)
    return this
  }
  /**
   * Extends the low 2 lanes of an `i32x4` vector to 64 bits using signed extension.
   * Pops one vector and pushes a new vector where each lane is the sign-extended value of the corresponding low lane.
   */
  extend_low_i32x4_s() {
    this.push(byte`\xfd\xc7\x01`)
    return this
  }
  /**
   * Extends the high 2 lanes of an `i32x4` vector to 64 bits using signed extension.
   * Pops one vector and pushes a new vector where each lane is the sign-extended value of the corresponding high lane.
   */
  extend_high_i32x4_s() {
    this.push(byte`\xfd\xc8\x01`)
    return this
  }
  /**
   * Extends the low 2 lanes of an `i32x4` vector to 64 bits using zero extension.
   * Pops one vector and pushes a new vector where each lane is the zero-extended value of the corresponding low lane.
   */
  extend_low_i32x4_u() {
    this.push(byte`\xfd\xc9\x01`)
    return this
  }
  /**
   * Extends the high 2 lanes of an `i32x4` vector to 64 bits using zero extension.
   * Pops one vector and pushes a new vector where each lane is the zero-extended value of the corresponding high lane.
   */
  extend_high_i32x4_u() {
    this.push(byte`\xfd\xca\x01`)
    return this
  }
  /**
   * Performs a bitwise left shift on each lane of an `i64x2` vector.
   * Pops one vector and a scalar value, shifts each lane left by the scalar value, and pushes the result.
   */
  shl(val) {
    if (val !== undefined) {
      this.push(InstrArray.bytes(val))
    }
    this.push(byte`\xfd\xcb\x01`)
    return this
  }
  /**
   * Performs an arithmetic right shift on each lane of an `i64x2` vector.
   * Pops one vector and a scalar value, shifts each lane right by the scalar value (sign-preserving), and pushes the result.
   */
  shr_s(val) {
    if (val !== undefined) {
      this.push(InstrArray.bytes(val))
    }
    this.push(byte`\xfd\xcc\x01`)
    return this
  }
  /**
   * Performs a logical right shift on each lane of an `i64x2` vector.
   * Pops one vector and a scalar value, shifts each lane right by the scalar value (zero-filling), and pushes the result.
   */
  shr_u(val) {
    if (val !== undefined) {
      this.push(InstrArray.bytes(val))
    }
    this.push(byte`\xfd\xcd\x01`)
    return this
  }
  /**
   * Adds corresponding lanes of two `i64x2` vectors.
   * Pops two vectors and pushes a new vector where each lane is the sum of the corresponding lanes.
   */
  add(val) {
    if (val !== undefined) {
      this.push(I64x2.bytes(val))
    }
    this.push(byte`\xfd\xce\x01`)
    return this
  }
  /**
   * Subtracts corresponding lanes of two `i64x2` vectors.
   * Pops two vectors and pushes a new vector where each lane is the difference of the corresponding lanes.
   */
  sub(val) {
    if (val !== undefined) {
      this.push(I64x2.bytes(val))
    }
    this.push(byte`\xfd\xd1\x01`)
    return this
  }
  /**
   * Multiplies corresponding lanes of two `i64x2` vectors.
   * Pops two vectors and pushes a new vector where each lane is the product of the corresponding lanes.
   */
  mul(val) {
    if (val !== undefined) {
      this.push(I64x2.bytes(val))
    }
    this.push(byte`\xfd\xd5\x01`)
    return this
  }
  /**
   * Compares two `i64x2` vectors for equality (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if equal, or `0x0000000000000000` otherwise.
   */
  eq(val) {
    if (val !== undefined) {
      this.push(I64x2.bytes(val))
    }
    this.push(byte`\xfd\xd6\x01`)
    return this
  }
  /**
   * Compares two `i64x2` vectors for inequality (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if not equal, or `0x0000000000000000` otherwise.
   */
  ne(val) {
    if (val !== undefined) {
      this.push(I64x2.bytes(val))
    }
    this.push(byte`\xfd\xd7\x01`)
    return this
  }
  /**
   * Compares two `i64x2` vectors for signed less-than (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if `(a < b)`, or `0x0000000000000000` otherwise.
   */
  lt_s(val) {
    if (val !== undefined) {
      this.push(I64x2.bytes(val))
    }
    this.push(byte`\xfd\xd8\x01`)
    return this
  }
  /**
   * Compares two `i64x2` vectors for signed greater-than (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if `(a > b)`, or `0x0000000000000000` otherwise.
   */
  gt_s(val) {
    if (val !== undefined) {
      this.push(I64x2.bytes(val))
    }
    this.push(byte`\xfd\xd9\x01`)
    return this
  }
  /**
   * Compares two `i64x2` vectors for signed less-than-or-equal (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if `(a ≤ b)`, or `0x0000000000000000` otherwise.
   */
  le_s(val) {
    if (val !== undefined) {
      this.push(I64x2.bytes(val))
    }
    this.push(byte`\xfd\xda\x01`)
    return this
  }
  /**
   * Compares two `i64x2` vectors for signed greater-than-or-equal (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if `(a ≥ b)`, or `0x0000000000000000` otherwise.
   */
  ge_s(val) {
    if (val !== undefined) {
      this.push(I64x2.bytes(val))
    }
    this.push(byte`\xfd\xdb\x01`)
    return this
  }
  /**
   * Multiplies low 2 lanes of two `i32x4` vectors and extends the result to 64 bits using signed extension.
   * Pops two vectors and pushes a new vector where each lane is the sign-extended product of the corresponding low lanes.
   */
  extmul_low_i32x4_s(val) {
    if (val !== undefined) {
      this.push(I64x2.bytes(val))
    }
    this.push(byte`\xfd\xdc\x01`)
    return this
  }
  /**
   * Multiplies high 2 lanes of two `i32x4` vectors and extends the result to 64 bits using signed extension.
   * Pops two vectors and pushes a new vector where each lane is the sign-extended product of the corresponding high lanes.
   */
  extmul_high_i32x4_s(val) {
    if (val !== undefined) {
      this.push(I64x2.bytes(val))
    }
    this.push(byte`\xfd\xdd\x01`)
    return this
  }
  /**
   * Multiplies low 2 lanes of two `i32x4` vectors and extends the result to 64 bits using zero extension.
   * Pops two vectors and pushes a new vector where each lane is the zero-extended product of the corresponding low lanes.
   */
  extmul_low_i32x4_u(val) {
    if (val !== undefined) {
      this.push(I64x2.bytes(val))
    }
    this.push(byte`\xfd\xde\x01`)
    return this
  }
  /**
   * Multiplies high 2 lanes of two `i32x4` vectors and extends the result to 64 bits using zero extension.
   * Pops two vectors and pushes a new vector where each lane is the zero-extended product of the corresponding high lanes.
   */
  extmul_high_i32x4_u(val) {
    if (val !== undefined) {
      this.push(I64x2.bytes(val))
    }
    this.push(byte`\xfd\xdf\x01`)
    return this
  }
  /**
   * Pushes a 128-bit constant vector onto the stack.
   * The immediate value is encoded as a vector of 2 64-bit values.
   */
  const(...vals) {
    console.assert(vals.length === 2)
    this.push([byte`\xfd\x0c`, encode_v128(vals)])
    return this
  }
}
/** @type {I64x2_} */
export const I64x2 = new Proxy(I64x2_, {
  get: (a, b) => {
    if (typeof a[b] === "function") return a[b]
    const tmp = new a()
    return (..._) => (tmp[b](..._), tmp)
  },
})

// let W = {}
// /**
//  * Manually transcribed 436 wasm instructions!
//  * And each commented by an AI!
//  *
//  * TODO: make each function into it's own function with checks and whatnot
//  */
// class W {
//   /**
//    * Unreachable opcode: Indicates an invalid or undefined state.
//    * Traps the program when executed.
//    */
//   unreachable: byte`\x00`,
//   /**
//    * No-operation opcode: Does nothing.
//    * Used as a placeholder or for alignment purposes.
//    */
//   nop: byte`\x01`,
//   /**
//    * Begins a block construct.
//    * Defines a nested scope with a label for control flow (e.g., branching).
//    */
//   block: (type, ...ops) => [[byte`\x02`, { blocktype: type }], ...ops, byte`\x0b`],
//   /**
//    * Begins a loop construct. Must have function type index or 0x40 (void) right after.
//    * Similar to `block`, but allows backward branches (loops).
//    */
//   loop: (type, ...ops) => [[byte`\x03`, { blocktype: type }], ...ops, byte`\x0b`],
//   /**
//    * Pops value from the stack. Begins an if construct.
//    * Executes one branch if the condition is true, and optionally another branch if false.1
//    */
//   if: (type, ...ops) => {
//     let result = [[byte`\x04`, { blocktype: type }], ...ops]
//     result.else = (...else_ops) => [...result, byte`\x05`, ...else_ops]
//     return result
//   },
//   /**
//    * Marks the beginning of the "else" branch in an if-else construct.
//    * Used to define the alternative branch when the condition is false.
//    * @deprecated Use `if(type, ...ops).else(...ops)`
//    */
//   else: byte`\x05`,
//   /**
//    * Ends a block, loop, or if construct.
//    * Closes the current scope and exits the construct.
//    * @deprecated End is automatically inserted where it needs to be.
//    */
//   end: byte`\x0b`,
//   /**
//    * Branches to a labeled block, loop, or if construct.
//    * For block, it jumps to the end; for loops, it jumps to first instruction.
//    */
//   br: (level) => [byte`\x0c`, level],
//   /**
//    * Conditionally branches to a labeled construct.
//    * Pops a value from the stack; if the value is non-zero, branches to the target.
//    */
//   br_if: (level) => [byte`\x0d`, level],
//   /**
//    * Implements a multi-way branch.
//    * Pops an index from the stack and branches to the corresponding label in a table of targets.
//    */
//   br_table: (...levels) => [byte`\x0e`, [levels.length, ...levels, 0]],
//   /**
//    * Returns from the current function.
//    * Pops values from the stack and returns them as the function's result(s).
//    */
//   return: byte`\x0f`,
//   /**
//    * Calls a function by its index.
//    * Pushes arguments onto the stack, invokes the function, and pushes its results back onto the stack.
//    */
//   call: (index) => [byte`\x10`, index],
//   /**
//    * Calls a function indirectly through a table.
//    * Uses a function index from the table and verifies its type matches the expected signature.
//    */
//   call_indirect: (table_index, functype = Type.Func()) =>
//     [byte`\x11`, { functype }, encodeLEB128("u32", table_index)],
//   /**
//    * Drops the top value from the stack.
//    * Removes the top element without using it.
//    */
//   drop: byte`\x1a`,
//   /**
//    * Selects one of two values based on a condition.
//    * Pops two values and a condition from the stack; pushes the first value if condition is true, otherwise the second.
//    */
//   select: (type = Type.result) => type === Type.result ? byte`\x1b` : [byte`\x1c`, 1, type],
//   /**
//    * Typed version of `select`.
//    * Similar to `select`, but explicitly specifies the type of the values being selected.
//    * @deprecated use select(Type.\<valtype>)
//    */
//   selectt: byte`\x1c`,
//   local: {
//     /**
//      * Reads a value from a local variable.
//      * Pushes the value of the specified local variable onto the stack.
//      */
//     get: (index) => [byte`\x20`, index],
//     /**
//      * Writes a value to a local variable.
//      * Pops a value from the stack and stores it in the specified local variable.
//      */
//     set: (index) => [byte`\x21`, index],
//     /**
//      * Writes a value to a local variable and leaves it on the stack.
//      * Pops a value from the stack, stores it in the specified local variable, and pushes the same value back onto the stack.
//      */
//     tee: (index) => [byte`\x22`, index],
//   },
//   global: {
//     /**
//      * Reads a value from a global variable.
//      * Pushes the value of the specified global variable onto the stack.
//      */
//     get: (index) => [byte`\x23`, index],
//     /**
//      * Writes a value to a global variable.
//      * Pops a value from the stack and stores it in the specified global variable.
//      */
//     set: (index) => [byte`\x24`, index],
//   },
//   table: {
//     /**
//      * Reads a value from a table.
//      * Pushes the value at the specified index in the table onto the stack.
//      */
//     get: (index) => [byte`\x25`, encodeLEB128("u32", index)],
//     /**
//      * Writes a value to a table.
//      * Pops a value and an index from the stack, and stores the value at the specified index in the table.
//      */
//     set: (index) => [byte`\x26`, encodeLEB128("u32", index)],
//     /**
//      * Initializes a table with elements from a passive element segment.
//      * Pops: dest (i32), src (i32), len (i32).
//      * Copies `len` elements from the passive element segment to the table at `dest`.
//      */
//     init: (passive_element_index, data_index) => [
//       byte`\xfc\x0c`,
//       encodeLEB128("u32", passive_element_index),
//       encodeLEB128("u32", data_index),
//     ],
//     /**
//      * Copies elements within a table or between two tables.
//      * Pops: dest (i32), src (i32), len (i32).
//      * Copies `len` elements from the table at `src` to the table at `dest`.
//      */
//     copy: (dst_index, src_index) => [
//       byte`\xfc\x0e`,
//       encodeLEB128("u32", src_index ?? dst_index),
//       encodeLEB128("u32", dst_index),
//     ],
//     /**
//      * Grows a table by a given number of elements.
//      * Pops: n (i32), init_value (ref).
//      * Pushes the previous size of the table as i32.
//      * Adds `n` copies of `init_value` to the end of the table.
//      */
//     grow: (index) => [byte`\xfc\x0f`, encodeLEB128("u32", index)],
//     /**
//      * Gets the current size of a table.
//      * Pushes the number of elements in the table as i32.
//      */
//     size: (index) => [byte`\xfc\x10`, encodeLEB128("u32", index)],
//     /**
//      * Fills a region of a table with a repeated reference value.
//      * Pops: dest (i32), value (ref), len (i32).
//      * Writes `len` copies of `value` to the table starting at `dest`.
//      */
//     fill: (index) => [byte`\xfc\x11`, encodeLEB128("u32", index)],
//   },
//   /**
//    * Drops a passive element segment, making it inaccessible.
//    * Passive element segments can no longer be used after this operation.
//    */
//   elem_drop: (index) => [byte`\xfc\x0d`, encodeLEB128("u32", index)],
//   memory: {
//     /**
//      * Pushes the current size of the default linear memory (in 64KB pages) as an i32.
//      * Example: (memory_size) → pushes the number of pages allocated.
//      */
//     size: (index = 0) => [byte`\x3f`, index],
//     /**
//      * Grows the default linear memory by N 64KB pages (popped as i32).
//      * Pushes the previous memory size (in pages) as i32, or -1 if growth failed.
//      * Traps if the input value is invalid (e.g., exceeds max memory limits).
//      */
//     grow: (index = 0) => [byte`\x40`, index],
//     /**
//      * Initializes a region of linear memory with data from a passive data segment.
//      * Pops: dest (i32), src (i32), len (i32).
//      * Copies `len` bytes from the passive data segment to memory at `dest`.
//      */
//     init: (data_index = 0, mem_index = 0) => [byte`\xfc\x08`, data_index, mem_index],
//     /**
//      * Copies data within linear memory.
//      * Pops: dest (i32), src (i32), len (i32).
//      * Copies `len` bytes from memory at `src` to memory at `dest`.
//      */
//     copy: (dst_mem_index = 0, src_mem_index = 0) =>
//       [byte`\xfc\x0a`, src_mem_index, dst_mem_index],
//     /**
//      * Fills a region of linear memory with a repeated byte value.
//      * Pops: dest (i32), value (i32), len (i32).
//      * Writes `len` copies of `value & 0xFF` to memory starting at `dest`.
//      */
//     fill: (index = 0) => [byte`\xfc\x0b`, index],
//   },
//   /**
//    * Drops a passive data segment, making it inaccessible.
//    * Passive data segments can no longer be used after this operation.
//    */
//   data_drop: (index) => [byte`\xfc\x09`, index],
//   ref: {
//     /**
//      * Pushes a null reference onto the stack.
//      * The type of the null reference is determined by the context (e.g., funcref or externref).
//      */
//     null: (type) => [byte`\xd0`, type],
//     /**
//      * Checks if the top reference on the stack is null.
//      * Pops 1 reference, pushes 1 (if null) or 0 (if non-null) as i32.
//      */
//     is_null: byte`\xd1`,
//     /**
//      * Creates a reference to a function by index.
//      * Pushes a funcref referencing the function at the given index in the module's function table.
//      */
//     func: (type) => [byte`\xd2`, type],
//   },
//   I64x2: {
//     /**
//      * Creates a 128-bit vector by replicating a 64-bit integer across all lanes.
//      * Pops 1 value and splats it across all 2 lanes of the vector.
//      */
//     splat: byte`\xfd\x12`,
//     /**
//      * Extracts a 64-bit integer from a specific lane of a 128-bit vector.
//      * Pops a vector and pushes the extracted lane value as an i64.
//      */
//     extract_lane: (index) => [byte`\xfd\x1d`, index],
//     /**
//      * Replaces a specific lane in a 128-bit vector with a new value.
//      * Pops a vector and a scalar value, then replaces the specified lane and pushes the updated vector.
//      */
//     replace_lane: (index) => [byte`\xfd\x1e`, index],
//     /**
//      * Computes the absolute value of each lane in an `i64x2` vector.
//      * Pops one vector and pushes a new vector where each lane is replaced by its absolute value.
//      */
//     abs: byte`\xfd\xc0\x01`,
//     /**
//      * Negates each lane in an `i64x2` vector.
//      * Pops one vector and pushes a new vector where each lane is replaced by its negated value.
//      */
//     neg: byte`\xfd\xc1\x01`,
//     /**
//      * Checks if all lanes in an `i64x2` vector are non-zero.
//      * Pops one vector and pushes `1` (true) if all lanes are non-zero, or `0` (false) otherwise.
//      */
//     all_true: byte`\xfd\xc3\x01`,
//     /**
//      * Creates a bitmask from an `i64x2` vector.
//      * Pops one vector and pushes an `i32` bitmask where each bit corresponds to the sign bit of a lane in the vector.
//      */
//     bitmask: byte`\xfd\xc4\x01`,
//     /**
//      * Extends the low 2 lanes of an `i32x4` vector to 64 bits using signed extension.
//      * Pops one vector and pushes a new vector where each lane is the sign-extended value of the corresponding low lane.
//      */
//     extend_low_i32x4_s: byte`\xfd\xc7\x01`,
//     /**
//      * Extends the high 2 lanes of an `i32x4` vector to 64 bits using signed extension.
//      * Pops one vector and pushes a new vector where each lane is the sign-extended value of the corresponding high lane.
//      */
//     extend_high_i32x4_s: byte`\xfd\xc8\x01`,
//     /**
//      * Extends the low 2 lanes of an `i32x4` vector to 64 bits using zero extension.
//      * Pops one vector and pushes a new vector where each lane is the zero-extended value of the corresponding low lane.
//      */
//     extend_low_i32x4_u: byte`\xfd\xc9\x01`,
//     /**
//      * Extends the high 2 lanes of an `i32x4` vector to 64 bits using zero extension.
//      * Pops one vector and pushes a new vector where each lane is the zero-extended value of the corresponding high lane.
//      */
//     extend_high_i32x4_u: byte`\xfd\xca\x01`,
//     /**
//      * Performs a bitwise left shift on each lane of an `i64x2` vector.
//      * Pops one vector and a scalar value, shifts each lane left by the scalar value, and pushes the result.
//      */
//     shl: byte`\xfd\xcb\x01`,
//     /**
//      * Performs an arithmetic right shift on each lane of an `i64x2` vector.
//      * Pops one vector and a scalar value, shifts each lane right by the scalar value (sign-preserving), and pushes the result.
//      */
//     shr_s: byte`\xfd\xcc\x01`,
//     /**
//      * Performs a logical right shift on each lane of an `i64x2` vector.
//      * Pops one vector and a scalar value, shifts each lane right by the scalar value (zero-filling), and pushes the result.
//      */
//     shr_u: byte`\xfd\xcd\x01`,
//     /**
//      * Adds corresponding lanes of two `i64x2` vectors.
//      * Pops two vectors and pushes a new vector where each lane is the sum of the corresponding lanes.
//      */
//     add: byte`\xfd\xce\x01`,
//     /**
//      * Subtracts corresponding lanes of two `i64x2` vectors.
//      * Pops two vectors and pushes a new vector where each lane is the difference of the corresponding lanes.
//      */
//     sub: byte`\xfd\xd1\x01`,
//     /**
//      * Multiplies corresponding lanes of two `i64x2` vectors.
//      * Pops two vectors and pushes a new vector where each lane is the product of the corresponding lanes.
//      */
//     mul: byte`\xfd\xd5\x01`,
//     /**
//      * Compares two `i64x2` vectors for equality (per-lane).
//      * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if equal, or `0x0000000000000000` otherwise.
//      */
//     eq: byte`\xfd\xd6\x01`,
//     /**
//      * Compares two `i64x2` vectors for inequality (per-lane).
//      * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if not equal, or `0x0000000000000000` otherwise.
//      */
//     ne: byte`\xfd\xd7\x01`,
//     /**
//      * Compares two `i64x2` vectors for signed less-than (per-lane).
//      * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if `(a < b)`, or `0x0000000000000000` otherwise.
//      */
//     lt_s: byte`\xfd\xd8\x01`,
//     /**
//      * Compares two `i64x2` vectors for signed greater-than (per-lane).
//      * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if `(a > b)`, or `0x0000000000000000` otherwise.
//      */
//     gt_s: byte`\xfd\xd9\x01`,
//     /**
//      * Compares two `i64x2` vectors for signed less-than-or-equal (per-lane).
//      * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if `(a ≤ b)`, or `0x0000000000000000` otherwise.
//      */
//     le_s: byte`\xfd\xda\x01`,
//     /**
//      * Compares two `i64x2` vectors for signed greater-than-or-equal (per-lane).
//      * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if `(a ≥ b)`, or `0x0000000000000000` otherwise.
//      */
//     ge_s: byte`\xfd\xdb\x01`,
//     /**
//      * Multiplies low 2 lanes of two `i32x4` vectors and extends the result to 64 bits using signed extension.
//      * Pops two vectors and pushes a new vector where each lane is the sign-extended product of the corresponding low lanes.
//      */
//     extmul_low_i32x4_s: byte`\xfd\xdc\x01`,
//     /**
//      * Multiplies high 2 lanes of two `i32x4` vectors and extends the result to 64 bits using signed extension.
//      * Pops two vectors and pushes a new vector where each lane is the sign-extended product of the corresponding high lanes.
//      */
//     extmul_high_i32x4_s: byte`\xfd\xdd\x01`,
//     /**
//      * Multiplies low 2 lanes of two `i32x4` vectors and extends the result to 64 bits using zero extension.
//      * Pops two vectors and pushes a new vector where each lane is the zero-extended product of the corresponding low lanes.
//      */
//     extmul_low_i32x4_u: byte`\xfd\xde\x01`,
//     /**
//      * Multiplies high 2 lanes of two `i32x4` vectors and extends the result to 64 bits using zero extension.
//      * Pops two vectors and pushes a new vector where each lane is the zero-extended product of the corresponding high lanes.
//      */
//     extmul_high_i32x4_u: byte`\xfd\xdf\x01`,
//     /**
//      * Pushes a 128-bit constant vector onto the stack.
//      * The immediate value is encoded as a vector of 2 64-bit values.
//      */
//     const: (...vals) => (console.assert(vals.length === 2), [byte`\xfd\x0c`, encode_v128(vals)]),
//   },
//   F32x4: {
//     /**
//      * Creates a 128-bit vector by replicating a 32-bit float across all lanes.
//      * Pops 1 value and splats it across all 4 lanes of the vector.
//      */
//     splat: byte`\xfd\x13`,
//     /**
//      * Extracts a 32-bit float from a specific lane of a 128-bit vector.
//      * Pops a vector and pushes the extracted lane value as an f32.
//      */
//     extract_lane: (index) => [byte`\xfd\x1f`, index],
//     /**
//      * Replaces a specific lane in a 128-bit vector with a new value.
//      * Pops a vector and a scalar value, then replaces the specified lane and pushes the updated vector.
//      */
//     replace_lane: (index) => [byte`\xfd\x20`, index],
//     /**
//      * Compares two 128-bit vectors of 32-bit floats for equality (per-lane).
//      * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if equal, or `0x00000000` otherwise.
//      */
//     eq: byte`\xfd\x41`,
//     /**
//      * Compares two 128-bit vectors of 32-bit floats for inequality (per-lane).
//      * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if not equal, or `0x00000000` otherwise.
//      */
//     ne: byte`\xfd\x42`,
//     /**
//      * Compares two 128-bit vectors of 32-bit floats for less-than (per-lane).
//      * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if `(a < b)`, or `0x00000000` otherwise.
//      */
//     lt: byte`\xfd\x43`,
//     /**
//      * Compares two 128-bit vectors of 32-bit floats for greater-than (per-lane).
//      * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if `(a > b)`, or `0x00000000` otherwise.
//      */
//     gt: byte`\xfd\x44`,
//     /**
//      * Compares two 128-bit vectors of 32-bit floats for less-than-or-equal (per-lane).
//      * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if `(a ≤ b)`, or `0x00000000` otherwise.
//      */
//     le: byte`\xfd\x45`,
//     /**
//      * Compares two 128-bit vectors of 32-bit floats for greater-than-or-equal (per-lane).
//      * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if `(a ≥ b)`, or `0x00000000` otherwise.
//      */
//     ge: byte`\xfd\x46`,
//     /**
//      * Converts two 64-bit floats in a `f64x2` vector to two 32-bit floats in an `f32x4` vector.
//      * The high lanes of the result are set to zero.
//      * Pops one vector and pushes the converted vector.
//      */
//     demote_f64x2_zero: byte`\xfd\x5e`,
//     /**
//      * Rounds each lane of an `f32x4` vector up to the nearest integer.
//      * Pops one vector and pushes a new vector where each lane is rounded up.
//      */
//     ceil: byte`\xfd\x67`,
//     /**
//      * Rounds each lane of an `f32x4` vector down to the nearest integer.
//      * Pops one vector and pushes a new vector where each lane is rounded down.
//      */
//     floor: byte`\xfd\x68`,
//     /**
//      * Truncates each lane of an `f32x4` vector toward zero.
//      * Pops one vector and pushes a new vector where each lane is truncated.
//      */
//     trunc: byte`\xfd\x69`,
//     /**
//      * Rounds each lane of an `f32x4` vector to the nearest integer (ties to even).
//      * Pops one vector and pushes a new vector where each lane is rounded.
//      */
//     nearest: byte`\xfd\x6a`,
//     /**
//      * Computes the absolute value of each lane in an `f32x4` vector.
//      * Pops one vector and pushes a new vector where each lane is replaced by its absolute value.
//      */
//     abs: byte`\xfd\xe0\x01`,
//     /**
//      * Negates each lane in an `f32x4` vector.
//      * Pops one vector and pushes a new vector where each lane is replaced by its negated value.
//      */
//     neg: byte`\xfd\xe1\x01`,
//     /**
//      * Computes the square root of each lane in an `f32x4` vector.
//      * Pops one vector and pushes a new vector where each lane is replaced by its square root.
//      */
//     sqrt: byte`\xfd\xe3\x01`,
//     /**
//      * Adds corresponding lanes of two `f32x4` vectors.
//      * Pops two vectors and pushes a new vector where each lane is the sum of the corresponding lanes.
//      */
//     add: byte`\xfd\xe4\x01`,
//     /**
//      * Subtracts corresponding lanes of two `f32x4` vectors.
//      * Pops two vectors and pushes a new vector where each lane is the difference of the corresponding lanes.
//      */
//     sub: byte`\xfd\xe5\x01`,
//     /**
//      * Multiplies corresponding lanes of two `f32x4` vectors.
//      * Pops two vectors and pushes a new vector where each lane is the product of the corresponding lanes.
//      */
//     mul: byte`\xfd\xe6\x01`,
//     /**
//      * Divides corresponding lanes of two `f32x4` vectors.
//      * Pops two vectors and pushes a new vector where each lane is the quotient of the corresponding lanes.
//      */
//     div: byte`\xfd\xe7\x01`,
//     /**
//      * Computes the minimum of corresponding lanes of two `f32x4` vectors.
//      * Pops two vectors and pushes a new vector where each lane is the minimum of the corresponding lanes.
//      */
//     min: byte`\xfd\xe8\x01`,
//     /**
//      * Computes the maximum of corresponding lanes of two `f32x4` vectors.
//      * Pops two vectors and pushes a new vector where each lane is the maximum of the corresponding lanes.
//      */
//     max: byte`\xfd\xe9\x01`,
//     /**
//      * Computes the pairwise minimum of two `f32x4` vectors.
//      * Pops two vectors and pushes a new vector where each lane is the minimum of the corresponding lanes, propagating NaNs.
//      */
//     pmin: byte`\xfd\xea\x01`,
//     /**
//      * Computes the pairwise maximum of two `f32x4` vectors.
//      * Pops two vectors and pushes a new vector where each lane is the maximum of the corresponding lanes, propagating NaNs.
//      */
//     pmax: byte`\xfd\xeb\x01`,
//     /**
//      * Converts each lane of an `i32x4` vector to an `f32x4` vector using signed conversion.
//      * Pops one vector and pushes a new vector where each lane is converted to `f32`.
//      */
//     convert_i32x4_s: byte`\xfd\xfa\x01`,
//     /**
//      * Converts each lane of an `i32x4` vector to an `f32x4` vector using unsigned conversion.
//      * Pops one vector and pushes a new vector where each lane is converted to `f32`.
//      */
//     convert_i32x4_u: byte`\xfd\xfb\x01`,
//     /**
//      * Pushes a 128-bit constant vector onto the stack.
//      * The immediate value is encoded as a vector of 4 32-bit float values.
//      */
//     const: (...vals) => (console.assert(vals.length === 4), [byte`\xfd\x0c`, encode_v128(vals)]),
//   },
//   F64x2: {
//     /**
//      * Creates a 128-bit vector by replicating a 64-bit float across all lanes.
//      * Pops 1 value and splats it across all 2 lanes of the vector.
//      */
//     splat: byte`\xfd\x14`,
//     /**
//      * Extracts a 64-bit float from a specific lane of a 128-bit vector.
//      * Pops a vector and pushes the extracted lane value as an f64.
//      */
//     extract_lane: (index) => [byte`\xfd\x21`, index],
//     /**
//      * Replaces a specific lane in a 128-bit vector with a new value.
//      * Pops a vector and a scalar value, then replaces the specified lane and pushes the updated vector.
//      */
//     replace_lane: (index) => [byte`\xfd\x22`, index],
//     /**
//      * Compares two 128-bit vectors of 64-bit floats for equality (per-lane).
//      * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if equal, or `0x0000000000000000` otherwise.
//      */
//     eq: byte`\xfd\x47`,
//     /**
//      * Compares two 128-bit vectors of 64-bit floats for inequality (per-lane).
//      * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if not equal, or `0x0000000000000000` otherwise.
//      */
//     ne: byte`\xfd\x48`,
//     /**
//      * Compares two 128-bit vectors of 64-bit floats for less-than (per-lane).
//      * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if `(a < b)`, or `0x0000000000000000` otherwise.
//      */
//     lt: byte`\xfd\x49`,
//     /**
//      * Compares two 128-bit vectors of 64-bit floats for greater-than (per-lane).
//      * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if `(a > b)`, or `0x0000000000000000` otherwise.
//      */
//     gt: byte`\xfd\x4a`,
//     /**
//      * Compares two 128-bit vectors of 64-bit floats for less-than-or-equal (per-lane).
//      * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if `(a ≤ b)`, or `0x0000000000000000` otherwise.
//      */
//     le: byte`\xfd\x4b`,
//     /**
//      * Compares two 128-bit vectors of 64-bit floats for greater-than-or-equal (per-lane).
//      * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if `(a ≥ b)`, or `0x0000000000000000` otherwise.
//      */
//     ge: byte`\xfd\x4c`,
//     /**
//      * Converts the low two 32-bit floats in an `f32x4` vector to two 64-bit floats in an `f64x2` vector.
//      * Pops one vector and pushes the converted vector.
//      */
//     promote_low_f32x4: byte`\xfd\x5f`,
//     /**
//      * Rounds each lane of an `f64x2` vector up to the nearest integer.
//      * Pops one vector and pushes a new vector where each lane is rounded up.
//      */
//     ceil: byte`\xfd\x74`,
//     /**
//      * Rounds each lane of an `f64x2` vector down to the nearest integer.
//      * Pops one vector and pushes a new vector where each lane is rounded down.
//      */
//     floor: byte`\xfd\x75`,
//     /**
//      * Truncates each lane of an `f64x2` vector toward zero.
//      * Pops one vector and pushes a new vector where each lane is truncated.
//      */
//     trunc: byte`\xfd\x7a`,
//     /**
//      * Rounds each lane of an `f64x2` vector to the nearest integer (ties to even).
//      * Pops one vector and pushes a new vector where each lane is rounded.
//      */
//     nearest: byte`\xfd\x94\x01`,
//     /**
//      * Computes the absolute value of each lane in an `f64x2` vector.
//      * Pops one vector and pushes a new vector where each lane is replaced by its absolute value.
//      */
//     abs: byte`\xfd\xec\x01`,
//     /**
//      * Negates each lane in an `f64x2` vector.
//      * Pops one vector and pushes a new vector where each lane is replaced by its negated value.
//      */
//     neg: byte`\xfd\xed\x01`,
//     /**
//      * Computes the square root of each lane in an `f64x2` vector.
//      * Pops one vector and pushes a new vector where each lane is replaced by its square root.
//      */
//     sqrt: byte`\xfd\xef\x01`,
//     /**
//      * Adds corresponding lanes of two `f64x2` vectors.
//      * Pops two vectors and pushes a new vector where each lane is the sum of the corresponding lanes.
//      */
//     add: byte`\xfd\xf0\x01`,
//     /**
//      * Subtracts corresponding lanes of two `f64x2` vectors.
//      * Pops two vectors and pushes a new vector where each lane is the difference of the corresponding lanes.
//      */
//     sub: byte`\xfd\xf1\x01`,
//     /**
//      * Multiplies corresponding lanes of two `f64x2` vectors.
//      * Pops two vectors and pushes a new vector where each lane is the product of the corresponding lanes.
//      */
//     mul: byte`\xfd\xf2\x01`,
//     /**
//      * Divides corresponding lanes of two `f64x2` vectors.
//      * Pops two vectors and pushes a new vector where each lane is the quotient of the corresponding lanes.
//      */
//     div: byte`\xfd\xf3\x01`,
//     /**
//      * Computes the minimum of corresponding lanes of two `f64x2` vectors.
//      * Pops two vectors and pushes a new vector where each lane is the minimum of the corresponding lanes.
//      */
//     min: byte`\xfd\xf4\x01`,
//     /**
//      * Computes the maximum of corresponding lanes of two `f64x2` vectors.
//      * Pops two vectors and pushes a new vector where each lane is the maximum of the corresponding lanes.
//      */
//     max: byte`\xfd\xf5\x01`,
//     /**
//      * Computes the pairwise minimum of two `f64x2` vectors.
//      * Pops two vectors and pushes a new vector where each lane is the minimum of the corresponding lanes, propagating NaNs.
//      */
//     pmin: byte`\xfd\xf6\x01`,
//     /**
//      * Computes the pairwise maximum of two `f64x2` vectors.
//      * Pops two vectors and pushes a new vector where each lane is the maximum of the corresponding lanes, propagating NaNs.
//      */
//     pmax: byte`\xfd\xf7\x01`,
//     /**
//      * Converts the low two lanes of an `i32x4` vector to an `f64x2` vector using signed conversion.
//      * Pops one vector and pushes a new vector where the low two lanes are converted to `f64`.
//      */
//     convert_low_i32x4_s: byte`\xfd\xfe\x01`,
//     /**
//      * Converts the low two lanes of an `i32x4` vector to an `f64x2` vector using unsigned conversion.
//      * Pops one vector and pushes a new vector where the low two lanes are converted to `f64`.
//      */
//     convert_low_i32x4_u: byte`\xfd\xff\x01`,
//     /**
//      * Pushes a 128-bit constant vector onto the stack.
//      * The immediate value is encoded as a vector of 2 64-bit float values.
//      */
//     const: (...vals) => (console.assert(vals.length === 2), [byte`\xfd\x0c`, encode_v128(vals)]),
//   },
//   // reflected part
//   [byte`\x00`]: `unreachable`,
//   [byte`\x01`]: `nop`,
//   [byte`\x02`]: `block`,
//   [byte`\x03`]: `loop`,
//   [byte`\x04`]: `if`,
//   [byte`\x05`]: `else`,
//   [byte`\x0b`]: `end`,
//   [byte`\x0c`]: `br`,
//   [byte`\x0d`]: `br_if`,
//   [byte`\x0e`]: `br_table`,
//   [byte`\x0f`]: `return`,
//   [byte`\x10`]: `call`,
//   [byte`\x11`]: `call_indirect`,
//   [byte`\x1a`]: `drop`,
//   [byte`\x1b`]: `select`,
//   [byte`\x1c`]: `selectt`,
//   [byte`\x20`]: `local_get`,
//   [byte`\x21`]: `local_set`,
//   [byte`\x22`]: `local_tee`,
//   [byte`\x23`]: `global_get`,
//   [byte`\x24`]: `global_set`,
//   [byte`\x25`]: `table_get`,
//   [byte`\x26`]: `table_set`,
//   [byte`\x28`]: `i32_load`,
//   [byte`\x29`]: `i64_load`,
//   [byte`\x2a`]: `f32_load`,
//   [byte`\x2b`]: `f64_load`,
//   [byte`\x2c`]: `i32_load8_s`,
//   [byte`\x2d`]: `i32_load8_u`,
//   [byte`\x2e`]: `i32_load16_s`,
//   [byte`\x2f`]: `i32_load16_u`,
//   [byte`\x30`]: `i64_load8_s`,
//   [byte`\x31`]: `i64_load8_u`,
//   [byte`\x32`]: `i64_load16_s`,
//   [byte`\x33`]: `i64_load16_u`,
//   [byte`\x34`]: `i64_load32_s`,
//   [byte`\x35`]: `i64_load32_u`,
//   [byte`\x36`]: `i32_store`,
//   [byte`\x37`]: `i64_store`,
//   [byte`\x38`]: `f32_store`,
//   [byte`\x39`]: `f64_store`,
//   [byte`\x3a`]: `i32_store8`,
//   [byte`\x3b`]: `i32_store16`,
//   [byte`\x3c`]: `i64_store8`,
//   [byte`\x3d`]: `i64_store16`,
//   [byte`\x3e`]: `i64_store32`,
//   [byte`\x3f`]: `memory_size`,
//   [byte`\x40`]: `memory_grow`,
//   [byte`\x41`]: `i32_const`,
//   [byte`\x42`]: `i64_const`,
//   [byte`\x43`]: `f32_const`,
//   [byte`\x44`]: `f64_const`,
//   [byte`\x45`]: `i32_eqz`,
//   [byte`\x46`]: `i32_eq`,
//   [byte`\x47`]: `i32_ne`,
//   [byte`\x48`]: `i32_lt_s`,
//   [byte`\x49`]: `i32_lt_u`,
//   [byte`\x4a`]: `i32_gt_s`,
//   [byte`\x4b`]: `i32_gt_u`,
//   [byte`\x4c`]: `i32_le_s`,
//   [byte`\x4d`]: `i32_le_u`,
//   [byte`\x4e`]: `i32_ge_s`,
//   [byte`\x4f`]: `i32_ge_u`,
//   [byte`\x50`]: `i64_eqz`,
//   [byte`\x51`]: `i64_eq`,
//   [byte`\x52`]: `i64_ne`,
//   [byte`\x53`]: `i64_lt_s`,
//   [byte`\x54`]: `i64_lt_u`,
//   [byte`\x55`]: `i64_gt_s`,
//   [byte`\x56`]: `i64_gt_u`,
//   [byte`\x57`]: `i64_le_s`,
//   [byte`\x58`]: `i64_le_u`,
//   [byte`\x59`]: `i64_ge_s`,
//   [byte`\x5a`]: `i64_ge_u`,
//   [byte`\x5b`]: `f32_eq`,
//   [byte`\x5c`]: `f32_ne`,
//   [byte`\x5d`]: `f32_lt`,
//   [byte`\x5e`]: `f32_gt`,
//   [byte`\x5f`]: `f32_le`,
//   [byte`\x60`]: `f32_ge`,
//   [byte`\x61`]: `f64_eq`,
//   [byte`\x62`]: `f64_ne`,
//   [byte`\x63`]: `f64_lt`,
//   [byte`\x64`]: `f64_gt`,
//   [byte`\x65`]: `f64_le`,
//   [byte`\x66`]: `f64_ge`,
//   [byte`\x67`]: `i32_clz`,
//   [byte`\x68`]: `i32_ctz`,
//   [byte`\x69`]: `i32_popcnt`,
//   [byte`\x6a`]: `i32_add`,
//   [byte`\x6b`]: `i32_sub`,
//   [byte`\x6c`]: `i32_mul`,
//   [byte`\x6d`]: `i32_div_s`,
//   [byte`\x6e`]: `i32_div_u`,
//   [byte`\x6f`]: `i32_rem_s`,
//   [byte`\x70`]: `i32_rem_u`,
//   [byte`\x71`]: `i32_and`,
//   [byte`\x72`]: `i32_or`,
//   [byte`\x73`]: `i32_xor`,
//   [byte`\x74`]: `i32_shl`,
//   [byte`\x75`]: `i32_shr_s`,
//   [byte`\x76`]: `i32_shr_u`,
//   [byte`\x77`]: `i32_rotl`,
//   [byte`\x78`]: `i32_rotr`,
//   [byte`\x79`]: `i64_clz`,
//   [byte`\x7a`]: `i64_ctz`,
//   [byte`\x7b`]: `i64_popcnt`,
//   [byte`\x7c`]: `i64_add`,
//   [byte`\x7d`]: `i64_sub`,
//   [byte`\x7e`]: `i64_mul`,
//   [byte`\x7f`]: `i64_div_s`,
//   [byte`\x80`]: `i64_div_u`,
//   [byte`\x81`]: `i64_rem_s`,
//   [byte`\x82`]: `i64_rem_u`,
//   [byte`\x83`]: `i64_and`,
//   [byte`\x84`]: `i64_or`,
//   [byte`\x85`]: `i64_xor`,
//   [byte`\x86`]: `i64_shl`,
//   [byte`\x87`]: `i64_shr_s`,
//   [byte`\x88`]: `i64_shr_u`,
//   [byte`\x89`]: `i64_rotl`,
//   [byte`\x8a`]: `i64_rotr`,
//   [byte`\x8b`]: `f32_abs`,
//   [byte`\x8c`]: `f32_neg`,
//   [byte`\x8d`]: `f32_ceil`,
//   [byte`\x8e`]: `f32_floor`,
//   [byte`\x8f`]: `f32_trunc`,
//   [byte`\x90`]: `f32_nearest`,
//   [byte`\x91`]: `f32_sqrt`,
//   [byte`\x92`]: `f32_add`,
//   [byte`\x93`]: `f32_sub`,
//   [byte`\x94`]: `f32_mul`,
//   [byte`\x95`]: `f32_div`,
//   [byte`\x96`]: `f32_min`,
//   [byte`\x97`]: `f32_max`,
//   [byte`\x98`]: `f32_copysign`,
//   [byte`\x99`]: `f64_abs`,
//   [byte`\x9a`]: `f64_neg`,
//   [byte`\x9b`]: `f64_ceil`,
//   [byte`\x9c`]: `f64_floor`,
//   [byte`\x9d`]: `f64_trunc`,
//   [byte`\x9e`]: `f64_nearest`,
//   [byte`\x9f`]: `f64_sqrt`,
//   [byte`\xa0`]: `f64_add`,
//   [byte`\xa1`]: `f64_sub`,
//   [byte`\xa2`]: `f64_mul`,
//   [byte`\xa3`]: `f64_div`,
//   [byte`\xa4`]: `f64_min`,
//   [byte`\xa5`]: `f64_max`,
//   [byte`\xa6`]: `f64_copysign`,
//   [byte`\xa7`]: `i32_wrap_i64`,
//   [byte`\xa8`]: `i32_trunc_f32_s`,
//   [byte`\xa9`]: `i32_trunc_f32_u`,
//   [byte`\xaa`]: `i32_trunc_f64_s`,
//   [byte`\xab`]: `i32_trunc_f64_u`,
//   [byte`\xac`]: `i64_extend_i32_s`,
//   [byte`\xad`]: `i64_extend_i32_u`,
//   [byte`\xae`]: `i64_trunc_f32_s`,
//   [byte`\xaf`]: `i64_trunc_f32_u`,
//   [byte`\xb0`]: `i64_trunc_f64_s`,
//   [byte`\xb1`]: `i64_trunc_f64_u`,
//   [byte`\xb2`]: `f32_convert_i32_s`,
//   [byte`\xb3`]: `f32_convert_i32_u`,
//   [byte`\xb4`]: `f32_convert_i64_s`,
//   [byte`\xb5`]: `f32_convert_i64_u`,
//   [byte`\xb6`]: `f32_demote_f64`,
//   [byte`\xb7`]: `f64_convert_i32_s`,
//   [byte`\xb8`]: `f64_convert_i32_u`,
//   [byte`\xb9`]: `f64_convert_i64_s`,
//   [byte`\xba`]: `f64_convert_i64_u`,
//   [byte`\xbb`]: `f64_promote_f32`,
//   [byte`\xbc`]: `i32_reinterpret_f32`,
//   [byte`\xbd`]: `i64_reinterpret_f64`,
//   [byte`\xbe`]: `f32_reinterpret_i32`,
//   [byte`\xbf`]: `f64_reinterpret_f64`,
//   [byte`\xc0`]: `i32_extend8_s`,
//   [byte`\xc1`]: `i32_extend16_s`,
//   [byte`\xc2`]: `i64_extend8_s`,
//   [byte`\xc3`]: `i64_extend16_s`,
//   [byte`\xc4`]: `i64_extend_32_s`,
//   [byte`\xd0`]: `ref_null`,
//   [byte`\xd1`]: `ref_is_null`,
//   [byte`\xd2`]: `ref_func`,
//   [byte`\xfc\x00`]: `i32_trunc_sat_f32_s`,
//   [byte`\xfc\x01`]: `i32_trunc_sat_f32_u`,
//   [byte`\xfc\x02`]: `i32_trunc_sat_f64_s`,
//   [byte`\xfc\x03`]: `i32_trunc_sat_f64_u`,
//   [byte`\xfc\x04`]: `i64_trunc_sat_f32_s`,
//   [byte`\xfc\x05`]: `i64_trunc_sat_f32_u`,
//   [byte`\xfc\x06`]: `i64_trunc_sat_f64_s`,
//   [byte`\xfc\x07`]: `i64_trunc_sat_f64_u`,
//   [byte`\xfc\x08`]: `memory_init`,
//   [byte`\xfc\x09`]: `data_drop`,
//   [byte`\xfc\x0a`]: `memory_copy`,
//   [byte`\xfc\x0b`]: `memory_fill`,
//   [byte`\xfc\x0c`]: `table_init`,
//   [byte`\xfc\x0d`]: `elem_drop`,
//   [byte`\xfc\x0e`]: `table_copy`,
//   [byte`\xfc\x0f`]: `table_grow`,
//   [byte`\xfc\x10`]: `table_size`,
//   [byte`\xfc\x11`]: `table_fill`,
//   [byte`\xfd\x00`]: `v128_load`,
//   [byte`\xfd\x01`]: `v128_load8x8_s`,
//   [byte`\xfd\x02`]: `v128_load8x8_u`,
//   [byte`\xfd\x03`]: `v128_load16x4_s`,
//   [byte`\xfd\x04`]: `v128_load16x4_u`,
//   [byte`\xfd\x05`]: `v128_load32x2_s`,
//   [byte`\xfd\x06`]: `v128_load32x2_u`,
//   [byte`\xfd\x07`]: `v128_load8_splat`,
//   [byte`\xfd\x08`]: `v128_load16_splat`,
//   [byte`\xfd\x09`]: `v128_load32_splat`,
//   [byte`\xfd\x0a`]: `v128_load64_splat`,
//   [byte`\xfd\x0b`]: `v128_store`,
//   [byte`\xfd\x0c`]: `v128_const`,
//   [byte`\xfd\x0d`]: `i8x16_shuffle`,
//   [byte`\xfd\x0e`]: `i8x16_swizzle`,
//   [byte`\xfd\x0f`]: `i8x16_splat`,
//   [byte`\xfd\x10`]: `i16x8_splat`,
//   [byte`\xfd\x11`]: `i32x4_splat`,
//   [byte`\xfd\x12`]: `i64x2_splat`,
//   [byte`\xfd\x13`]: `f32x4_splat`,
//   [byte`\xfd\x14`]: `f64x2_splat`,
//   [byte`\xfd\x15`]: `i8x16_extract_lane_s`,
//   [byte`\xfd\x16`]: `i8x16_extract_lane_u`,
//   [byte`\xfd\x17`]: `i8x16_replace_lane`,
//   [byte`\xfd\x18`]: `i16x8_extract_lane_s`,
//   [byte`\xfd\x19`]: `i16x8_extract_lane_u`,
//   [byte`\xfd\x1a`]: `i16x8_replace_lane`,
//   [byte`\xfd\x1b`]: `i32x4_extract_lane`,
//   [byte`\xfd\x1c`]: `i32x4_replace_lane`,
//   [byte`\xfd\x1d`]: `i64x2_extract_lane`,
//   [byte`\xfd\x1e`]: `i64x2_replace_lane`,
//   [byte`\xfd\x1f`]: `f32x4_extract_lane`,
//   [byte`\xfd\x20`]: `f32x4_replace_lane`,
//   [byte`\xfd\x21`]: `f64x2_extract_lane`,
//   [byte`\xfd\x22`]: `f64x2_replace_lane`,
//   [byte`\xfd\x23`]: `i8x16_eq`,
//   [byte`\xfd\x24`]: `i8x16_ne`,
//   [byte`\xfd\x25`]: `i8x16_lt_s`,
//   [byte`\xfd\x26`]: `i8x16_lt_u`,
//   [byte`\xfd\x27`]: `i8x16_gt_s`,
//   [byte`\xfd\x28`]: `i8x16_gt_u`,
//   [byte`\xfd\x29`]: `i8x16_le_s`,
//   [byte`\xfd\x2a`]: `i8x16_le_u`,
//   [byte`\xfd\x2b`]: `i8x16_ge_s`,
//   [byte`\xfd\x2c`]: `i8x16_ge_u`,
//   [byte`\xfd\x2d`]: `i16x8_eq`,
//   [byte`\xfd\x2e`]: `i16x8_ne`,
//   [byte`\xfd\x2f`]: `i16x8_lt_s`,
//   [byte`\xfd\x30`]: `i16x8_lt_u`,
//   [byte`\xfd\x31`]: `i16x8_gt_s`,
//   [byte`\xfd\x32`]: `i16x8_gt_u`,
//   [byte`\xfd\x33`]: `i16x8_le_s`,
//   [byte`\xfd\x34`]: `i16x8_le_u`,
//   [byte`\xfd\x35`]: `i16x8_ge_s`,
//   [byte`\xfd\x36`]: `i16x8_ge_u`,
//   [byte`\xfd\x37`]: `i32x4_eq`,
//   [byte`\xfd\x38`]: `i32x4_ne`,
//   [byte`\xfd\x39`]: `i32x4_lt_s`,
//   [byte`\xfd\x3a`]: `i32x4_lt_u`,
//   [byte`\xfd\x3b`]: `i32x4_gt_s`,
//   [byte`\xfd\x3c`]: `i32x4_gt_u`,
//   [byte`\xfd\x3d`]: `i32x4_le_s`,
//   [byte`\xfd\x3e`]: `i32x4_le_u`,
//   [byte`\xfd\x3f`]: `i32x4_ge_s`,
//   [byte`\xfd\x40`]: `i32x4_ge_u`,
//   [byte`\xfd\x41`]: `f32x4_eq`,
//   [byte`\xfd\x42`]: `f32x4_ne`,
//   [byte`\xfd\x43`]: `f32x4_lt`,
//   [byte`\xfd\x44`]: `f32x4_gt`,
//   [byte`\xfd\x45`]: `f32x4_le`,
//   [byte`\xfd\x46`]: `f32x4_ge`,
//   [byte`\xfd\x47`]: `f64x2_eq`,
//   [byte`\xfd\x48`]: `f64x2_ne`,
//   [byte`\xfd\x49`]: `f64x2_lt`,
//   [byte`\xfd\x4a`]: `f64x2_gt`,
//   [byte`\xfd\x4b`]: `f64x2_le`,
//   [byte`\xfd\x4c`]: `f64x2_ge`,
//   [byte`\xfd\x4d`]: `v128_not`,
//   [byte`\xfd\x4e`]: `v128_and`,
//   [byte`\xfd\x4f`]: `v128_andnot`,
//   [byte`\xfd\x50`]: `v128_or`,
//   [byte`\xfd\x51`]: `v128_xor`,
//   [byte`\xfd\x52`]: `v128_bitselect`,
//   [byte`\xfd\x53`]: `v128_any_true`,
//   [byte`\xfd\x54`]: `v128_load8_lane`,
//   [byte`\xfd\x55`]: `v128_load16_lane`,
//   [byte`\xfd\x56`]: `v128_load32_lane`,
//   [byte`\xfd\x57`]: `v128_load64_lane`,
//   [byte`\xfd\x58`]: `v128_store8_lane`,
//   [byte`\xfd\x59`]: `v128_store16_lane`,
//   [byte`\xfd\x5a`]: `v128_store32_lane`,
//   [byte`\xfd\x5b`]: `v128_store64_lane`,
//   [byte`\xfd\x5c`]: `v128_load32_zero`,
//   [byte`\xfd\x5d`]: `v128_load64_zero`,
//   [byte`\xfd\x5e`]: `f32x4_demote_f64x2_zero`,
//   [byte`\xfd\x5f`]: `f64x2_promote_low_f32x4`,
//   [byte`\xfd\x60`]: `i8x16_abs`,
//   [byte`\xfd\x61`]: `i8x16_neg`,
//   [byte`\xfd\x62`]: `i8x16_popcnt`,
//   [byte`\xfd\x63`]: `i8x16_all_true`,
//   [byte`\xfd\x64`]: `i8x16_bitmask`,
//   [byte`\xfd\x65`]: `i8x16_narrow_i16x8_s`,
//   [byte`\xfd\x66`]: `i8x16_narrow_i16x8_u`,
//   [byte`\xfd\x67`]: `f32x4_ceil`,
//   [byte`\xfd\x68`]: `f32x4_floor`,
//   [byte`\xfd\x69`]: `f32x4_trunc`,
//   [byte`\xfd\x6a`]: `f32x4_nearest`,
//   [byte`\xfd\x6b`]: `i8x16_shl`,
//   [byte`\xfd\x6c`]: `i8x16_shr_s`,
//   [byte`\xfd\x6d`]: `i8x16_shr_u`,
//   [byte`\xfd\x6e`]: `i8x16_add`,
//   [byte`\xfd\x6f`]: `i8x16_add_sat_s`,
//   [byte`\xfd\x70`]: `i8x16_add_sat_u`,
//   [byte`\xfd\x71`]: `i8x16_sub`,
//   [byte`\xfd\x72`]: `i8x16_sub_sat_s`,
//   [byte`\xfd\x73`]: `i8x16_sub_sat_u`,
//   [byte`\xfd\x74`]: `f64x2_ceil`,
//   [byte`\xfd\x75`]: `f64x2_floor`,
//   [byte`\xfd\x76`]: `i8x16_min_s`,
//   [byte`\xfd\x77`]: `i8x16_min_u`,
//   [byte`\xfd\x78`]: `i8x16_max_s`,
//   [byte`\xfd\x79`]: `i8x16_max_u`,
//   [byte`\xfd\x7a`]: `f64x2_trunc`,
//   [byte`\xfd\x7b`]: `i8x16_avgr_u`,
//   [byte`\xfd\x7c`]: `i16x8_extadd_pairwise_i8x16_s`,
//   [byte`\xfd\x7d`]: `i16x8_extadd_pairwise_i8x16_u`,
//   [byte`\xfd\x7e`]: `i16x8_extadd_pairwise_i16x8_s`,
//   [byte`\xfd\x7f`]: `i16x8_extadd_pairwise_i16x8_u`,
//   [byte`\xfd\x80\x01`]: `i16x8_abs`,
//   [byte`\xfd\x81\x01`]: `i16x8_neg`,
//   [byte`\xfd\x82\x01`]: `i16x8_q15mulr_sat_s`,
//   [byte`\xfd\x83\x01`]: `i16x8_all_true`,
//   [byte`\xfd\x84\x01`]: `i16x8_bitmask`,
//   [byte`\xfd\x85\x01`]: `i16x8_narrow_i32x4_s`,
//   [byte`\xfd\x86\x01`]: `i16x8_narrow_i32x4_u`,
//   [byte`\xfd\x87\x01`]: `i16x8_extend_low_i8x16_s`,
//   [byte`\xfd\x88\x01`]: `i16x8_extend_high_i8x16_s`,
//   [byte`\xfd\x89\x01`]: `i16x8_extend_low_i8x16_u`,
//   [byte`\xfd\x8a\x01`]: `i16x8_extend_high_i8x16_u`,
//   [byte`\xfd\x8b\x01`]: `i16x8_shl`,
//   [byte`\xfd\x8c\x01`]: `i16x8_shr_s`,
//   [byte`\xfd\x8d\x01`]: `i16x8_shr_u`,
//   [byte`\xfd\x8e\x01`]: `i16x8_add`,
//   [byte`\xfd\x8f\x01`]: `i16x8_add_sat_s`,
//   [byte`\xfd\x90\x01`]: `i16x8_add_sat_u`,
//   [byte`\xfd\x91\x01`]: `i16x8_sub`,
//   [byte`\xfd\x92\x01`]: `i16x8_sub_sat_s`,
//   [byte`\xfd\x93\x01`]: `i16x8_sub_sat_u`,
//   [byte`\xfd\x94\x01`]: `f64x2_nearest`,
//   [byte`\xfd\x95\x01`]: `i16x8_mul`,
//   [byte`\xfd\x96\x01`]: `i16x8_min_s`,
//   [byte`\xfd\x97\x01`]: `i16x8_min_u`,
//   [byte`\xfd\x98\x01`]: `i16x8_max_s`,
//   [byte`\xfd\x99\x01`]: `i16x8_max_u`,
//   [byte`\xfd\x9b\x01`]: `i16x8_avgr_u`,
//   [byte`\xfd\x9c\x01`]: `i16x8_extmul_low_i8x16_s`,
//   [byte`\xfd\x9d\x01`]: `i16x8_extmul_high_i8x16_s`,
//   [byte`\xfd\x9e\x01`]: `i16x8_extmul_low_i8x16_u`,
//   [byte`\xfd\x9f\x01`]: `i16x8_extmul_high_i8x16_u`,
//   [byte`\xfd\xa0\x01`]: `i32x4_abs`,
//   [byte`\xfd\xa1\x01`]: `i32x4_neg`,
//   [byte`\xfd\xa3\x01`]: `i32x4_all_true`,
//   [byte`\xfd\xa4\x01`]: `i32x4_bitmask`,
//   [byte`\xfd\xa7\x01`]: `i32x4_extend_low_i16x8_s`,
//   [byte`\xfd\xa8\x01`]: `i32x4_extend_high_i16x8_s`,
//   [byte`\xfd\xa9\x01`]: `i32x4_extend_low_i16x8_u`,
//   [byte`\xfd\xaa\x01`]: `i32x4_extend_high_i16x8_u`,
//   [byte`\xfd\xab\x01`]: `i32x4_shl`,
//   [byte`\xfd\xac\x01`]: `i32x4_shr_s`,
//   [byte`\xfd\xad\x01`]: `i32x4_shr_u`,
//   [byte`\xfd\xae\x01`]: `i32x4_add`,
//   [byte`\xfd\xb1\x01`]: `i32x4_sub`,
//   [byte`\xfd\xb5\x01`]: `i32x4_mul`,
//   [byte`\xfd\xb6\x01`]: `i32x4_min_s`,
//   [byte`\xfd\xb7\x01`]: `i32x4_min_u`,
//   [byte`\xfd\xb8\x01`]: `i32x4_max_s`,
//   [byte`\xfd\xb9\x01`]: `i32x4_max_u`,
//   [byte`\xfd\xba\x01`]: `i32x4_dot_i16x8_s`,
//   [byte`\xfd\xbb\x01`]: `i32x4_extmul_low_i16x8_s`,
//   [byte`\xfd\xbc\x01`]: `i32x4_extmul_high_i16x8_s`,
//   [byte`\xfd\xbd\x01`]: `i32x4_extmul_low_i16x8_u`,
//   [byte`\xfd\xbe\x01`]: `i32x4_extmul_high_i16x8_u`,
//   [byte`\xfd\xc0\x01`]: `i64x2_abs`,
//   [byte`\xfd\xc1\x01`]: `i64x2_neg`,
//   [byte`\xfd\xc3\x01`]: `i64x2_all_true`,
//   [byte`\xfd\xc4\x01`]: `i64x2_bitmask`,
//   [byte`\xfd\xc7\x01`]: `i64x2_extend_low_i32x4_s`,
//   [byte`\xfd\xc8\x01`]: `i64x2_extend_high_i32x4_s`,
//   [byte`\xfd\xc9\x01`]: `i64x2_extend_low_i32x4_u`,
//   [byte`\xfd\xca\x01`]: `i64x2_extend_high_i32x4_u`,
//   [byte`\xfd\xcb\x01`]: `i64x2_shl`,
//   [byte`\xfd\xcc\x01`]: `i64x2_shr_s`,
//   [byte`\xfd\xcd\x01`]: `i64x2_shr_u`,
//   [byte`\xfd\xce\x01`]: `i64x2_add`,
//   [byte`\xfd\xd1\x01`]: `i64x2_sub`,
//   [byte`\xfd\xd5\x01`]: `i64x2_mul`,
//   [byte`\xfd\xd6\x01`]: `i64x2_eq`,
//   [byte`\xfd\xd7\x01`]: `i64x2_ne`,
//   [byte`\xfd\xd8\x01`]: `i64x2_lt_s`,
//   [byte`\xfd\xd9\x01`]: `i64x2_gt_s`,
//   [byte`\xfd\xda\x01`]: `i64x2_le_s`,
//   [byte`\xfd\xdb\x01`]: `i64x2_ge_s`,
//   [byte`\xfd\xdc\x01`]: `i64x2_extmul_low_i32x4_s`,
//   [byte`\xfd\xdd\x01`]: `i64x2_extmul_high_i32x4_s`,
//   [byte`\xfd\xde\x01`]: `i64x2_extmul_low_i32x4_u`,
//   [byte`\xfd\xdf\x01`]: `i64x2_extmul_high_i32x4_u`,
//   [byte`\xfd\xe0\x01`]: `f32x4_abs`,
//   [byte`\xfd\xe1\x01`]: `f32x4_neg`,
//   [byte`\xfd\xe3\x01`]: `f32x4_sqrt`,
//   [byte`\xfd\xe4\x01`]: `f32x4_add`,
//   [byte`\xfd\xe5\x01`]: `f32x4_sub`,
//   [byte`\xfd\xe6\x01`]: `f32x4_mul`,
//   [byte`\xfd\xe7\x01`]: `f32x4_div`,
//   [byte`\xfd\xe8\x01`]: `f32x4_min`,
//   [byte`\xfd\xe9\x01`]: `f32x4_max`,
//   [byte`\xfd\xea\x01`]: `f32x4_pmin`,
//   [byte`\xfd\xeb\x01`]: `f32x4_pmax`,
//   [byte`\xfd\xec\x01`]: `f64x2_abs`,
//   [byte`\xfd\xed\x01`]: `f64x2_neg`,
//   [byte`\xfd\xef\x01`]: `f64x2_sqrt`,
//   [byte`\xfd\xf0\x01`]: `f64x2_add`,
//   [byte`\xfd\xf1\x01`]: `f64x2_sub`,
//   [byte`\xfd\xf2\x01`]: `f64x2_mul`,
//   [byte`\xfd\xf3\x01`]: `f64x2_div`,
//   [byte`\xfd\xf4\x01`]: `f64x2_min`,
//   [byte`\xfd\xf5\x01`]: `f64x2_max`,
//   [byte`\xfd\xf6\x01`]: `f64x2_pmin`,
//   [byte`\xfd\xf7\x01`]: `f64x2_pmax`,
//   [byte`\xfd\xf8\x01`]: `i32x4_trunc_sat_f32x4_s`,
//   [byte`\xfd\xf9\x01`]: `i32x4_trunc_sat_f32x4_u`,
//   [byte`\xfd\xfa\x01`]: `f32x4_convert_i32x4_s`,
//   [byte`\xfd\xfb\x01`]: `f32x4_convert_i32x4_u`,
//   [byte`\xfd\xfc\x01`]: `i32x4_trunc_sat_f64x2_s_zero`,
//   [byte`\xfd\xfd\x01`]: `i32x4_trunc_sat_f64x2_u_zero`,
//   [byte`\xfd\xfe\x01`]: `f64x2_convert_low_i32x4_s`,
//   [byte`\xfd\xff\x01`]: `f64x2_convert_low_i32x4_u`,
// };
