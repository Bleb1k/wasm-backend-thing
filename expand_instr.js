import { byte } from "./helpers.js";
import { encode_v128, encodeIEEE754, encodeLEB128 } from "./lib.js";

export class InstrArray extends Array {
  static bytes(val = null) {
    // console.log(
    //   "bytes",
    //   val,
    //   ["number", "bigint"].includes(typeof val) ? JSON.stringify(this.const(val)) : JSON.stringify(val),
    // )
    if (["number", "bigint"].includes(typeof val)) {
      return this.const(val)[0];
    }
    if (val instanceof Array) {
      return val;
    }
    if (typeof val === "object" && val?.prototype?.bytes !== undefined) {
      return val.prototype.bytes(val);
    }
    console.error(`Unknown value`, val);
    throw "Can't generate bytes";
  }
  static from(val) {
    const self = new this();
    self.push(...val);
    return self;
  }
}

class I32_ extends InstrArray {
  /**
   * Loads an i32 value from linear memory at the address popped from the stack.
   * Requires 4-byte alignment. Traps on out-of-bounds or misalignment.
   * Requires alignment byte and offset byte right after.
   */
  load(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr));
    }
    this.push([byte`\x28`, [2, ...encodeLEB128("u32", offset)]]);
    return this;
  }
  /**
   * Loads an 8-bit value from linear memory, sign-extends it to i32.
   * Pops address from stack. Requires 1-byte alignment. Traps on out-of-bounds.
   * Requires alignment byte and offset byte right after.
   */
  load8_s(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr));
    }
    this.push([byte`\x2c`, [0, ...encodeLEB128("u32", offset)]]);
    return this;
  }
  /**
   * Loads an 8-bit value from linear memory, zero-extends it to i32.
   * Pops address from stack. Requires 1-byte alignment. Traps on out-of-bounds.
   * Requires alignment byte and offset byte right after.
   */
  load8_u(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr));
    }
    this.push([byte`\x2d`, [0, ...encodeLEB128("u32", offset)]]);
    return this;
  }
  /**
   * Loads a 16-bit value from linear memory, sign-extends it to i32.
   * Pops address from stack. Requires 2-byte alignment. Traps on out-of-bounds.
   * Requires alignment byte and offset byte right after.
   */
  load16_s(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr));
    }
    this.push([byte`\x2e`, [1, ...encodeLEB128("u32", offset)]]);
    return this;
  }
  /**
   * Loads a 16-bit value from linear memory, zero-extends it to i32.
   * Pops address from stack. Requires 2-byte alignment. Traps on out-of-bounds.
   * Requires alignment byte and offset byte right after.
   */
  load16_u(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr));
    }
    this.push([byte`\x2f`, [1, ...encodeLEB128("u32", offset)]]);
    return this;
  }
  /**
   * Stores an i32 value into linear memory at address popped from stack.
   * Pops value then address. Requires 4-byte alignment. Traps on out-of-bounds.
   * Requires alignment byte and offset byte right after.
   */
  store(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.unshift(I32.bytes(ptr));
    }
    this.push([byte`\x36`, [2, ...encodeLEB128("u32", offset)]]);
    return this;
  }
  /**
   * Stores the low 8 bits of an i32 value into memory.
   * Pops value then address. Requires 1-byte alignment. Traps on out-of-bounds.
   * Requires alignment byte and offset byte right after.
   */
  store8(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.unshift(I32.bytes(ptr));
    }
    this.push([byte`\x3a`, [0, ...encodeLEB128("u32", offset)]]);
    return this;
  }
  /**
   * Stores the low 16 bits of an i32 value into memory.
   * Pops value then address. Requires 2-byte alignment. Traps on out-of-bounds.
   * Requires alignment byte and offset byte right after.
   */
  store16(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.unshift(I32.bytes(ptr));
    }
    this.push([byte`\x3b`, [1, ...encodeLEB128("u32", offset)]]);
    return this;
  }
  /**
   * Pushes a 32-bit integer constant onto the stack.
   * The immediate value is encoded as a signed LEB128.
   */
  const(num = 0, type = "i32") {
    this.push([byte`\x41`, encodeLEB128(type, num)]);
    return this;
  }
  /**
   * Checks if the top i32 value is zero.
   * Pops 1 value, pushes 1 (if zero) or 0 (non-zero) as i32.
   */
  eqz() {
    this.push(byte`\x45`);
    return this;
  }
  /**
   * Equality comparison for i32.
   * Pops 2 values, pushes 1 if equal, else 0.
   */
  eq(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val));
    }
    this.push(byte`\x46`);
    return this;
  }
  /**
   * Inequality comparison for i32.
   * Pops 2 values, pushes 1 if not equal, else 0.
   */
  ne(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val));
    }
    this.push(byte`\x47`);
    return this;
  }
  /**
   * Signed less-than comparison for i32.
   * Pops 2 values, pushes 1 if (a < b) signed, else 0.
   */
  lt_s(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val));
    }
    this.push(byte`\x48`);
    return this;
  }
  /**
   * Unsigned less-than comparison for i32.
   * Pops 2 values, pushes 1 if (a < b) unsigned, else 0.
   */
  lt_u(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val));
    }
    this.push(byte`\x49`);
    return this;
  }
  /**
   * Signed greater-than comparison for i32.
   * Pops 2 values, pushes 1 if (a > b) signed, else 0.
   */
  gt_s(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val));
    }
    this.push(byte`\x4a`);
    return this;
  }
  /**
   * Unsigned greater-than comparison for i32.
   * Pops 2 values, pushes 1 if (a > b) unsigned, else 0.
   */
  gt_u(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val));
    }
    this.push(byte`\x4b`);
    return this;
  }
  /**
   * Signed less-than-or-equal comparison for i32.
   * Pops 2 values, pushes 1 if (a ≤ b) signed, else 0.
   */
  le_s(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val));
    }
    this.push(byte`\x4c`);
    return this;
  }
  /**
   * Unsigned less-than-or-equal comparison for i32.
   * Pops 2 values, pushes 1 if (a ≤ b) unsigned, else 0.
   */
  le_u(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val));
    }
    this.push(byte`\x4d`);
    return this;
  }
  /**
   * Signed greater-than-or-equal comparison for i32.
   * Pops 2 values, pushes 1 if (a ≥ b) signed, else 0.
   */
  ge_s(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val));
    }
    this.push(byte`\x4e`);
    return this;
  }
  /**
   * Unsigned greater-than-or-equal comparison for i32.
   * Pops 2 values, pushes 1 if (a ≥ b) unsigned, else 0.
   */
  ge_u(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val));
    }
    this.push(byte`\x4f`);
    return this;
  }
  /**
   * Counts leading zero bits in i32.
   * Pops 1 value, pushes the count of leading zeros (0-32) as i32.
   */
  clz() {
    this.push(byte`\x67`);
    return this;
  }
  /**
   * Counts trailing zero bits in i32.
   * Pops 1 value, pushes the count of trailing zeros (0-32) as i32.
   */
  ctz() {
    this.push(byte`\x68`);
    return this;
  }
  /**
   * Counts the number of set bits (1s) in i32.
   * Pops 1 value, pushes the population count as i32.
   */
  popcnt() {
    this.push(byte`\x69`);
    return this;
  }
  /**
   * Integer addition for i32.
   * Pops 2 values, pushes (a + b) as i32 (wraps on overflow).
   */
  add(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val));
    }
    this.push(byte`\x6a`);
    return this;
  }
  /**
   * Integer subtraction for i32.
   * Pops 2 values, pushes (a - b) as i32 (wraps on overflow).
   */
  sub(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val));
    }
    this.push(byte`\x6b`);
    return this;
  }
  /**
   * Integer multiplication for i32.
   * Pops 2 values, pushes (a * b) as i32 (wraps on overflow).
   */
  mul(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val));
    }
    this.push(byte`\x6c`);
    return this;
  }
  /**
   * Signed integer division for i32.
   * Pops 2 values, pushes (a / b) as i32.
   * Traps if b = 0 or division overflows (e.g., INT32_MIN / -1).
   */
  div_s(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val));
    }
    this.push(byte`\x6d`);
    return this;
  }
  /**
   * Unsigned integer division for i32.
   * Pops 2 values, pushes (a / b) as i32.
   * Traps if b = 0.
   */
  div_u(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val));
    }
    this.push(byte`\x6e`);
    return this;
  }
  /**
   * Signed integer remainder for i32.
   * Pops 2 values, pushes (a % b) as i32.
   * Traps if b = 0 or division overflows (e.g., INT32_MIN % -1).
   */
  rem_s(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val));
    }
    this.push(byte`\x6f`);
    return this;
  }
  /**
   * Unsigned integer remainder for i32.
   * Pops 2 values, pushes (a % b) as i32.
   * Traps if b = 0.
   */
  rem_u(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val));
    }
    this.push(byte`\x70`);
    return this;
  }
  /**
   * Bitwise AND for i32.
   * Pops 2 values, pushes (a & b) as i32.
   */
  and(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val));
    }
    this.push(byte`\x71`);
    return this;
  }
  /**
   * Bitwise OR for i32.
   * Pops 2 values, pushes (a | b) as i32.
   */
  or(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val));
    }
    this.push(byte`\x72`);
    return this;
  }
  /**
   * Bitwise XOR for i32.
   * Pops 2 values, pushes (a ^ b) as i32.
   */
  xor(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val));
    }
    this.push(byte`\x73`);
    return this;
  }
  /**
   * Logical left shift for i32.
   * Pops 2 values (a, b), pushes (a << (b % 32)) as i32.
   */
  shl(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val));
    }
    this.push(byte`\x74`);
    return this;
  }
  /**
   * Arithmetic right shift for i32 (sign-preserving).
   * Pops 2 values (a, b), pushes (a >> (b % 32)) as i32.
   */
  shr_s(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val));
    }
    this.push(byte`\x75`);
    return this;
  }
  /**
   * Logical right shift for i32 (zero-filling).
   * Pops 2 values (a, b), pushes (a >>> (b % 32)) as i32.
   */
  shr_u(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val));
    }
    this.push(byte`\x76`);
    return this;
  }
  /**
   * Bitwise rotate left for i32.
   * Pops 2 values (a, b), rotates bits left by (b % 32) positions.
   */
  rotl(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val));
    }
    this.push(byte`\x77`);
    return this;
  }
  /**
   * Bitwise rotate right for i32.
   * Pops 2 values (a, b), rotates bits right by (b % 32) positions.
   */
  rotr(val = null) {
    if (val !== null) {
      this.push(I32.bytes(val));
    }
    this.push(byte`\x78`);
    return this;
  }
  /**
   * Wraps i64 to i32 (discards high 32 bits).
   * Pops 1 i64 value, pushes low 32 bits as i32.
   */
  wrap_i64() {
    this.push(byte`\xa7`);
    return this;
  }
  /**
   * Truncates f32 to signed i32.
   * Pops 1 f32 value, pushes truncated integer as i32.
   * Traps if value is NaN, ±infinity, or out of i32 range.
   */
  trunc_f32_s() {
    this.push(byte`\xa8`);
    return this;
  }
  /**
   * Truncates f32 to unsigned i32.
   * Pops 1 f32 value, pushes truncated integer as i32.
   * Traps if value is NaN, ±infinity, or out of u32 range.
   */
  trunc_f32_u() {
    this.push(byte`\xa9`);
    return this;
  }
  /**
   * Truncates f64 to signed i32.
   * Pops 1 f64 value, pushes truncated integer as i32.
   * Traps if value is NaN, ±infinity, or out of i32 range.
   */
  trunc_f64_s() {
    this.push(byte`\xaa`);
    return this;
  }
  /**
   * Truncates f64 to unsigned i32.
   * Pops 1 f64 value, pushes truncated integer as i32.
   * Traps if value is NaN, ±infinity, or out of u32 range.
   */
  trunc_f64_u() {
    this.push(byte`\xab`);
    return this;
  }
  /**
   * Reinterprets f32 bits as i32 (bitwise copy).
   * Pops 1 value, pushes raw bits as i32.
   */
  reinterpret_f32() {
    this.push(byte`\xbc`);
    return this;
  }
  /**
   * Sign-extends 8-bit value to 32-bit i32.
   * Pops 1 value, treats low 8 bits as signed and extends.
   */
  extend8_s() {
    this.push(byte`\xc0`);
    return this;
  }
  /**
   * Sign-extends 16-bit value to 32-bit i32.
   * Pops 1 value, treats low 16 bits as signed and extends.
   */
  extend16_s() {
    this.push(byte`\xc1`);
    return this;
  }
  /**
   * Saturating truncation of f32 to signed i32.
   * Pops 1 value, pushes truncated integer as i32.
   * Converts NaN/infinity/out-of-range values to INT32_MIN or INT32_MAX.
   */
  trunc_sat_f32_s() {
    this.push(byte`\xfc\x00`);
    return this;
  }
  /**
   * Saturating truncation of f32 to unsigned i32.
   * Pops 1 value, pushes truncated integer as i32.
   * Converts NaN/infinity/out-of-range values to 0 or UINT32_MAX.
   */
  trunc_sat_f32_u() {
    this.push(byte`\xfc\x01`);
    return this;
  }
  /**
   * Saturating truncation of f64 to signed i32.
   * Pops 1 value, pushes truncated integer as i32.
   * Converts NaN/infinity/out-of-range values to INT32_MIN or INT32_MAX.
   */
  trunc_sat_f64_s() {
    this.push(byte`\xfc\x02`);
    return this;
  }
  /**
   * Saturating truncation of f64 to unsigned i32.
   * Pops 1 value, pushes truncated integer as i32.
   * Converts NaN/infinity/out-of-range values to 0 or UINT32_MAX.
   */
  trunc_sat_f64_u() {
    this.push(byte`\xfc\x03`);
    return this;
  }
  /**
   * Sign-extends i32 to i64.
   * Pops 1 i32 value, pushes sign-extended i64.
   * @returns {I64_}
   */
  to_i64_extend() {
    this.push(byte`\xac`);
    return I64_.from(this);
  }
  /**
   * Zero-extends i32 to i64.
   * Pops 1 i32 value, pushes zero-extended i64.
   * @returns {I64_}
   */
  to_u64_extend() {
    this.push(byte`\xad`);
    return I64_.from(this);
  }
  /**
   * Converts signed i32 to f32.
   * Pops 1 value, pushes floating-point equivalent.
   * May lose precision for large integers.
   * @returns {F32_}
   */
  to_f32_convert_s() {
    this.push(byte`\xb2`);
    return F32_.from(this);
  }
  /**
   * Converts unsigned i32 to f32.
   * Pops 1 value, pushes floating-point equivalent.
   * May lose precision for large integers.
   * @returns {F32_}
   */
  to_f32_convert_u() {
    this.push(byte`\xb3`);
    return F32_.from(this);
  }
  /**
   * Reinterprets i32 bits as f32 (bitwise copy).
   * Pops 1 value, pushes raw bits as f32.
   */
  as_f32() {
    this.push(byte`\xbe`);
    return F32_.from(this);
  }
  /**
   * Converts signed i32 to f64.
   * Pops 1 value, p_ushes floating-point equivalent.
   * Exact conve_rsion (no precision loss).
   * @returns {I16x8_64_}
   */
  to_f64_convert_s() {
    this.push(byte`\xb7`);
    return F64_.from(this);
  }
  /**
   * Converts unsigned i32 to f64.
   * Pops 1 value, p_ushes floating-point equivalent.
   * Exact conve_rsion (no precision loss).
   * @returns {I16x8_64_}
   */
  to_f64_convert_u() {
    this.push(byte`\xb8`);
    return F64_.from(this);
  }
}
/** @type {I32_} */
export const I32 = new Proxy(I32_, {
  get: (a, b) => {
    if (a[b] !== undefined) return a[b];
    return (..._) => (new a())[b](..._);
  },
});

class I64_ extends InstrArray {
  /**
   * Loads an i64 value from linear memory at the address popped from the stack.
   * Requires 8-byte alignment. Traps on out-of-bounds or misalignment.
   * Requires alignment byte and offset byte right after.
   */
  load(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr));
    }
    this.push([byte`\x29`, [2, ...encodeLEB128("u32", offset)]]);
    return this;
  }
  /**
   * Loads an 8-bit value from linear memory, sign-extends it to i64.
   * Pops address from stack. Requires 1-byte alignment. Traps on out-of-bounds.
   * Requires alignment byte and offset byte right after.
   */
  load8_s(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr));
    }
    this.push([byte`\x30`, [0, ...encodeLEB128("u32", offset)]]);
    return this;
  }
  /**
   * Loads an 8-bit value from linear memory, zero-extends it to i64.
   * Pops address from stack. Requires 1-byte alignment. Traps on out-of-bounds.
   * Requires alignment byte and offset byte right after.
   */
  load8_u(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr));
    }
    this.push([byte`\x31`, [0, ...encodeLEB128("u32", offset)]]);
    return this;
  }
  /**
   * Loads a 16-bit value from linear memory, sign-extends it to i64.
   * Pops address from stack. Requires 2-byte alignment. Traps on out-of-bounds.
   * Requires alignment byte and offset byte right after.
   */
  load16_s(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr));
    }
    this.push([byte`\x32`, [1, ...encodeLEB128("u32", offset)]]);
    return this;
  }
  /**
   * Loads a 16-bit value from linear memory, zero-extends it to i64.
   * Pops address from stack. Requires 2-byte alignment. Traps on out-of-bounds.
   * Requires alignment byte and offset byte right after.
   */
  load16_u(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr));
    }
    this.push([byte`\x33`, [1, encodeLEB128("u32", offset)]]);
    return this;
  }
  /**
   * Loads a 32-bit value from linear memory, sign-extends it to i64.
   * Pops address from stack. Requires 4-byte alignment. Traps on out-of-bounds.
   * Requires alignment byte and offset byte right after.
   */
  load32_s(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr));
    }
    this.push([byte`\x34`, [2, encodeLEB128("u32", offset)]]);
    return this;
  }
  /**
   * Loads a 32-bit value from linear memory, zero-extends it to i64.
   * Pops address from stack. Requires 4-byte alignment. Traps on out-of-bounds.
   * Requires alignment byte and offset byte right after.
   */
  load32_u(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr));
    }
    this.push([byte`\x35`, [2, encodeLEB128("u32", offset)]]);
    return this;
  }
  /**
   * Stores an i64 value into linear memory at address popped from stack.
   * Pops value then address. Requires 8-byte alignment. Traps on out-of-bounds.
   * Requires alignment byte and offset byte right after.
   */
  store(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr));
    }
    this.push([byte`\x37`, [3, encodeLEB128("u32", offset)]]);
    return this;
  }
  /**
   * Stores the low 8 bits of an i64 value into memory.
   * Pops value then address. Requires 1-byte alignment. Traps on out-of-bounds.
   * Requires alignment byte and offset byte right after.
   */
  store8(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr));
    }
    this.push([byte`\x3c`, [0, encodeLEB128("u32", offset)]]);
    return this;
  }
  /**
   * Stores the low 16 bits of an i64 value into memory.
   * Pops value then address. Requires 2-byte alignment. Traps on out-of-bounds.
   * Requires alignment byte and offset byte right after.
   */
  store16(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr));
    }
    this.push([byte`\x3d`, [1, encodeLEB128("u32", offset)]]);
    return this;
  }
  /**
   * Stores the low 32 bits of an i64 value into memory.
   * Pops value then address. Requires 4-byte alignment. Traps on out-of-bounds.
   * Requires alignment byte and offset byte right after.
   */
  store32(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr));
    }
    this.push([byte`\x3e`, [2, encodeLEB128("u32", offset)]]);
    return this;
  }
  /**
   * Pushes a 64-bit integer constant onto the stack.
   * The immediate value is encoded as a signed LEB128.
   */
  const(num = 0, type = "i64") {
    this.push([byte`\x42`, encodeLEB128(type, num)]);
    return this;
  }
  /**
   * Checks if the top i64 value is zero.
   * Pops 1 value, pushes 1 (if zero) or 0 (non-zero) as i32.
   */
  eqz() {
    this.push(byte`\x50`);
    return this;
  }
  /**
   * Equality comparison for i64.
   * Pops 2 values, pushes 1 if equal, else 0 as i32.
   */
  eq(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val));
    }
    this.push(byte`\x51`);
    return this;
  }
  /**
   * Inequality comparison for i64.
   * Pops 2 values, pushes 1 if not equal, else 0 as i32.
   */
  ne(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val));
    }
    this.push(byte`\x52`);
    return this;
  }
  /**
   * Signed less-than comparison for i64.
   * Pops 2 values, pushes 1 if (a < b) signed, else 0 as i32.
   */
  lt_s(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val));
    }
    this.push(byte`\x53`);
    return this;
  }
  /**
   * Unsigned less-than comparison for i64.
   * Pops 2 values, pushes 1 if (a < b) unsigned, else 0 as i32.
   */
  lt_u(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val));
    }
    this.push(byte`\x54`);
    return this;
  }
  /**
   * Signed greater-than comparison for i64.
   * Pops 2 values, pushes 1 if (a > b) signed, else 0 as i32.
   */
  gt_s(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val));
    }
    this.push(byte`\x55`);
    return this;
  }
  /**
   * Unsigned greater-than comparison for i64.
   * Pops 2 values, pushes 1 if (a > b) unsigned, else 0 as i32.
   */
  gt_u(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val));
    }
    this.push(byte`\x56`);
    return this;
  }
  /**
   * Signed less-than-or-equal comparison for i64.
   * Pops 2 values, pushes 1 if (a ≤ b) signed, else 0 as i32.
   */
  le_s(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val));
    }
    this.push(byte`\x57`);
    return this;
  }
  /**
   * Unsigned less-than-or-equal comparison for i64.
   * Pops 2 values, pushes 1 if (a ≤ b) unsigned, else 0 as i32.
   */
  le_u(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val));
    }
    this.push(byte`\x58`);
    return this;
  }
  /**
   * Signed greater-than-or-equal comparison for i64.
   * Pops 2 values, pushes 1 if (a ≥ b) signed, else 0 as i32.
   */
  ge_s(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val));
    }
    this.push(byte`\x59`);
    return this;
  }
  /**
   * Unsigned greater-than-or-equal comparison for i64.
   * Pops 2 values, pushes 1 if (a ≥ b) unsigned, else 0 as i32.
   */
  ge_u(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val));
    }
    this.push(byte`\x5a`);
    return this;
  }
  /**
   * Counts leading zero bits in i64.
   * Pops 1 value, pushes the count (0-64) as i64.
   */
  clz() {
    this.push(byte`\x79`);
    return this;
  }
  /**
   * Counts trailing zero bits in i64.
   * Pops 1 value, pushes the count (0-64) as i64.
   */
  ctz() {
    this.push(byte`\x7a`);
    return this;
  }
  /**
   * Counts set bits (1s) in i64.
   * Pops 1 value, pushes the population count as i64.
   */
  popcnt() {
    this.push(byte`\x7b`);
    return this;
  }
  /**
   * Integer addition for i64.
   * Pops 2 values, pushes (a + b) as i64 (wraps on overflow).
   */
  add(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val));
    }
    this.push(byte`\x7c`);
    return this;
  }
  /**
   * Integer subtraction for i64.
   * Pops 2 values, pushes (a - b) as i64 (wraps on overflow).
   */
  sub(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val));
    }
    this.push(byte`\x7d`);
    return this;
  }
  /**
   * Integer multiplication for i64.
   * Pops 2 values, pushes (a * b) as i64 (wraps on overflow).
   */
  mul(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val));
    }
    this.push(byte`\x7e`);
    return this;
  }
  /**
   * Signed integer division for i64.
   * Pops 2 values, pushes (a / b) as i64.
   * Traps if b = 0 or division overflows (e.g., INT64_MIN / -1).
   */
  div_s(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val));
    }
    this.push(byte`\x7f`);
    return this;
  }
  /**
   * Unsigned integer division for i64.
   * Pops 2 values, pushes (a / b) as i64.
   * Traps if b = 0.
   */
  div_u(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val));
    }
    this.push(byte`\x80`);
    return this;
  }
  /**
   * Signed integer remainder for i64.
   * Pops 2 values, pushes (a % b) as i64.
   * Traps if b = 0 or division overflows.
   */
  rem_s(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val));
    }
    this.push(byte`\x81`);
    return this;
  }
  /**
   * Unsigned integer remainder for i64.
   * Pops 2 values, pushes (a % b) as i64.
   * Traps if b = 0.
   */
  rem_u(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val));
    }
    this.push(byte`\x82`);
    return this;
  }
  /**
   * Bitwise AND for i64.
   * Pops 2 values, pushes (a & b) as i64.
   */
  and(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val));
    }
    this.push(byte`\x83`);
    return this;
  }
  /**
   * Bitwise OR for i64.
   * Pops 2 values, pushes (a | b) as i64.
   */
  or(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val));
    }
    this.push(byte`\x84`);
    return this;
  }
  /**
   * Bitwise XOR for i64.
   * Pops 2 values, pushes (a ^ b) as i64.
   */
  xor(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val));
    }
    this.push(byte`\x85`);
    return this;
  }
  /**
   * Logical left shift for i64.
   * Pops 2 values (a, b), pushes (a << (b % 64)) as i64.
   */
  shl(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val));
    }
    this.push(byte`\x86`);
    return this;
  }
  /**
   * Arithmetic right shift for i64 (sign-preserving).
   * Pops 2 values (a, b), pushes (a >> (b % 64)) as i64.
   */
  shr_s(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val));
    }
    this.push(byte`\x87`);
    return this;
  }
  /**
   * Logical right shift for i64 (zero-filling).
   * Pops 2 values (a, b), pushes (a >>> (b % 64)) as i64.
   */
  shr_u(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val));
    }
    this.push(byte`\x88`);
    return this;
  }
  /**
   * Bitwise rotate left for i64.
   * Pops 2 values (a, b), rotates bits left by (b % 64) positions.
   */
  rotl(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val));
    }
    this.push(byte`\x89`);
    return this;
  }
  /**
   * Bitwise rotate right for i64.
   * Pops 2 values (a, b), rotates bits right by (b % 64) positions.
   */
  rotr(val = null) {
    if (val !== null) {
      this.push(I64.bytes(val));
    }
    this.push(byte`\x8a`);
    return this;
  }
  /**
   * Sign-extends i32 to i64.
   * Pops 1 i32 value, pushes sign-extended i64.
   */
  extend_i32_s() {
    this.push(byte`\xac`);
    return this;
  }
  /**
   * Zero-extends i32 to i64.
   * Pops 1 i32 value, pushes zero-extended i64.
   */
  extend_i32_u() {
    this.push(byte`\xad`);
    return this;
  }
  /**
   * Truncates f32 to signed i64.
   * Pops 1 f32 value, pushes truncated integer as i64.
   * Traps if value is NaN, ±infinity, or out of i64 range.
   */
  trunc_f32_s() {
    this.push(byte`\xae`);
    return this;
  }
  /**
   * Truncates f32 to unsigned i64.
   * Pops 1 f32 value, pushes truncated integer as i64.
   * Traps if value is NaN, ±infinity, or out of u64 range.
   */
  trunc_f32_u() {
    this.push(byte`\xaf`);
    return this;
  }
  /**
   * Truncates f64 to signed i64.
   * Pops 1 value, pushes truncated integer as i64.
   * Traps if value is NaN, ±infinity, or out of i64 range.
   */
  trunc_f64_s() {
    this.push(byte`\xb0`);
    return this;
  }
  /**
   * Truncates f64 to unsigned i64.
   * Pops 1 value, pushes truncated integer as i64.
   * Traps if value is NaN, ±infinity, or out of u64 range.
   */
  trunc_f64_u() {
    this.push(byte`\xb1`);
    return this;
  }
  /**
   * Reinterprets f64 bits as i64 (bitwise copy).
   * Pops 1 value, pushes raw bits as i64.
   */
  reinterpret_f64() {
    this.push(byte`\xbd`);
    return this;
  }
  /**
   * Sign-extends 8-bit value to 64-bit i64.
   * Pops 1 value, treats low 8 bits as signed and extends.
   */
  extend8_s() {
    this.push(byte`\xc2`);
    return this;
  }
  /**
   * Sign-extends 16-bit value to 64-bit i64.
   * Pops 1 value, treats low 16 bits as signed and extends.
   */
  extend16_s() {
    this.push(byte`\xc3`);
    return this;
  }
  /**
   * Sign-extends 32-bit value to 64-bit i64.
   * Pops 1 value, treats low 32 bits as signed and extends.
   */
  extend32_s() {
    this.push(byte`\xc4`);
    return this;
  }
  /**
   * Saturating truncation of f32 to signed i64.
   * Pops 1 value, pushes truncated integer as i64.
   * Converts NaN/infinity/out-of-range values to INT64_MIN or INT64_MAX.
   */
  trunc_sat_f32_s() {
    this.push(byte`\xfc\x04`);
    return this;
  }
  /**
   * Saturating truncation of f32 to unsigned i64.
   * Pops 1 value, pushes truncated integer as i64.
   * Converts NaN/infinity/out-of-range values to 0 or UINT64_MAX.
   */
  trunc_sat_f32_u() {
    this.push(byte`\xfc\x05`);
    return this;
  }
  /**
   * Saturating truncation of f64 to signed i64.
   * Pops 1 value, pushes truncated integer as i64.
   * Converts NaN/infinity/out-of-range values to INT64_MIN or INT64_MAX.
   */
  trunc_sat_f64_s() {
    this.push(byte`\xfc\x06`);
    return this;
  }
  /**
   * Saturating truncation of f64 to unsigned i64.
   * Pops 1 value, pushes truncated integer as i64.
   * Converts NaN/infinity/out-of-range values to 0 or UINT64_MAX.
   */
  trunc_sat_f64_u() {
    this.push(byte`\xfc\x07`);
    return this;
  }
  /**
   * Wraps i64 to i32 (discards high 32 bits).
   * Pops 1 i64 value, pushes low 32 bits as i32.
   * @returns {I32_}
   */
  to_i32_wrap() {
    this.push(byte`\xa7`);
    return I32_.from(this);
  }
  /**
   * Converts signed i64 to f32.
   * Pops 1 value, pushes floating-point equivalent.
   * Likely loses precision (f32 has 23-bit mantissa).
   * @returns {F32_}
   */
  to_f32_convert_s() {
    this.push(byte`\xb4`);
    return F32_.from(this);
  }
  /**
   * Converts unsigned i64 to f32.
   * Pops 1 value, pushes floating-point equivalent.
   * Likely loses precision (f32 has 23-bit mantissa).
   * @returns {F32_}
   */
  to_f32_convert_u() {
    this.push(byte`\xb5`);
    return F32_.from(this);
  }
  /**
   * Converts signed i64 to f64.
   * Pops 1 value, pushes floating-point equivalent.
   * May lose precision (f64 has 52-bit mantissa).
   * @returns {F64_}
   */
  to_f64_convert_s() {
    this.push(byte`\xb9`);
    return F64_.from(this);
  }
  /**
   * Converts unsigned i64 to f64.
   * Pops 1 value, p_ushes floating-point equivalent.
   * May lose pr_ecision (f64 has 52-bit mantissa).
   * @returns {I16x8_64_}
   */
  to_f64_convert_u() {
    this.push(byte`\xba`);
    return F64_.from(this);
  }
  /**
   * Reinterprets i64 bits as f64 (bitwise copy).
   * Pops 1 value, pushes raw bits as f64.
   */
  as_f64() {
    this.push(byte`\xbf`);
    return F64_.from(this);
  }
}
/** @type {I64_} */
export const I64 = new Proxy(I64_, {
  get: (a, b) => {
    if (a[b] !== undefined) return a[b];
    return (..._) => (new a())[b](..._);
  },
});

class F32_ extends InstrArray {
  /**
   * Loads an f32 value from linear memory at the address popped from the stack.
   * Requires 4-byte alignment. Traps on out-of-bounds or misalignment.
   *   equires alignment byte and offset byte right after.
   */
  load(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr));
    }
    this.push([byte`\x2a`, [2, encodeLEB128("u32", offset)]]);
    return this;
  }
  /**
   * Stores an f32 value into linear memory at address popped from stack.
   * Pops value then address. Requires 4-byte alignment. Traps on out-of-bounds.
   * Requires alignment byte and offset byte right after.
   */
  store(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr));
    }
    this.push([byte`\x38`, [2, encodeLEB128("u32", offset)]]);
    return this;
  }
  /**
   * Pushes a 32-bit float constant onto the stack.
   * The immediate value is encoded in IEEE 754 binary32 format.
   */
  const(num = 0, type = "f32") {
    this.push([byte`\x43`, encodeIEEE754(type, num)]);
    return this;
  }
  /**
   * Floating-point equality comparison for f32.
   * Pops 2 values, pushes 1 if equal (ordered), else 0 as i32.
   * Follows IEEE 754 rules (NaN returns 0).
   */
  eq(val = null) {
    if (val !== null) {
      this.push(F32.bytes(val));
    }
    this.push(byte`\x5b`);
    return this;
  }
  /**
   * Floating-point inequality comparison for f32.
   * Pops 2 values, pushes 1 if not equal (unordered or different), else 0 as i32.
   * Follows IEEE 754 rules (NaN returns 1).
   */
  ne(val = null) {
    if (val !== null) {
      this.push(F32.bytes(val));
    }
    this.push(byte`\x5c`);
    return this;
  }
  /**
   * Floating-point less-than comparison for f32.
   * Pops 2 values, pushes 1 if (a < b) ordered, else 0 as i32.
   * Follows IEEE 754 rules (NaN returns 0).
   */
  lt(val = null) {
    if (val !== null) {
      this.push(F32.bytes(val));
    }
    this.push(byte`\x5d`);
    return this;
  }
  /**
   * Floating-point greater-than comparison for f32.
   * Pops 2 values, pushes 1 if (a > b) ordered, else 0 as i32.
   * Follows IEEE 754 rules (NaN returns 0).
   */
  gt(val = null) {
    if (val !== null) {
      this.push(F32.bytes(val));
    }
    this.push(byte`\x5e`);
    return this;
  }
  /**
   * Floating-point less-than-or-equal comparison for f32.
   * Pops 2 values, pushes 1 if (a ≤ b) ordered, else 0 as i32.
   * Follows IEEE 754 rules (NaN returns 0).
   */
  le(val = null) {
    if (val !== null) {
      this.push(F32.bytes(val));
    }
    this.push(byte`\x5f`);
    return this;
  }
  /**
   * Floating-point greater-than-or-equal comparison for f32.
   * Pops 2 values, pushes 1 if (a ≥ b) ordered, else 0 as i32.
   * Follows IEEE 754 rules (NaN returns 0).
   */
  ge(val = null) {
    if (val !== null) {
      this.push(F32.bytes(val));
    }
    this.push(byte`\x60`);
    return this;
  }
  /**
   * Absolute value for f32.
   * Pops 1 value, pushes |a| as f32 (preserves NaN).
   */
  abs() {
    this.push(byte`\x8b`);
    return this;
  }
  /**
   * Negation for f32.
   * Pops 1 value, pushes -a as f32 (flips sign bit).
   */
  neg() {
    this.push(byte`\x8c`);
    return this;
  }
  /**
   * Rounds f32 up to nearest integer.
   * Pops 1 value, pushes ceil(a) as f32.
   */
  ceil() {
    this.push(byte`\x8d`);
    return this;
  }
  /**
   * Rounds f32 down to nearest integer.
   * Pops 1 value, pushes floor(a) as f32.
   */
  floor() {
    this.push(byte`\x8e`);
    return this;
  }
  /**
   * Truncates f32 toward zero.
   * Pops 1 value, pushes trunc(a) as f32.
   */
  trunc() {
    this.push(byte`\x8f`);
    return this;
  }
  /**
   * Rounds f32 to nearest integer (ties to even).
   * Pops 1 value, pushes rounded result as f32.
   * Follows IEEE 754 rules (NaN → NaN).
   */
  nearest() {
    this.push(byte`\x90`);
    return this;
  }
  /**
   * Computes square root of f32.
   * Pops 1 value, pushes sqrt(a) as f32.
   * Returns NaN for negative inputs.
   */
  sqrt() {
    this.push(byte`\x91`);
    return this;
  }
  /**
   * Floating-point addition for f32.
   * Pops 2 values, pushes (a + b) as f32.
   * Follows IEEE 754 rules (NaN propagation).
   */
  add(val = null) {
    if (val !== null) {
      this.push(F32.bytes(val));
    }
    this.push(byte`\x92`);
    return this;
  }
  /**
   * Floating-point subtraction for f32.
   * Pops 2 values, pushes (a - b) as f32.
   * Follows IEEE 754 rules (NaN propagation).
   */
  sub(val = null) {
    if (val !== null) {
      this.push(F32.bytes(val));
    }
    this.push(byte`\x93`);
    return this;
  }
  /**
   * Floating-point multiplication for f32.
   * Pops 2 values, pushes (a * b) as f32.
   * Follows IEEE 754 rules (NaN propagation).
   */
  mul(val = null) {
    if (val !== null) {
      this.push(F32.bytes(val));
    }
    this.push(byte`\x94`);
    return this;
  }
  /**
   * Floating-point division for f32.
   * Pops 2 values, pushes (a / b) as f32.
   * Follows IEEE 754 rules (NaN/±infinity handling).
   */
  div(val = null) {
    if (val !== null) {
      this.push(F32.bytes(val));
    }
    this.push(byte`\x95`);
    return this;
  }
  /**
   * Returns minimum of two f32 values.
   * Pops 2 values, pushes min(a, b) as f32.
   * Handles NaN and -0/+0 correctly per IEEE 754.
   */
  min(val = null) {
    if (val !== null) {
      this.push(F32.bytes(val));
    }
    this.push(byte`\x96`);
    return this;
  }
  /**
   * Returns maximum of two f32 values.
   * Pops 2 values, pushes max(a, b) as f32.
   * Handles NaN and -0/+0 correctly per IEEE 754.
   */
  max(val = null) {
    if (val !== null) {
      this.push(F32.bytes(val));
    }
    this.push(byte`\x97`);
    return this;
  }
  /**
   * Copies sign bit from b to a for f32.
   * Pops 2 values, pushes (|a| with b's sign) as f32.
   */
  copysign(val = null) {
    if (val !== null) {
      this.push(F32.bytes(val));
    }
    this.push(byte`\x98`);
    return this;
  }
  /**
   * Converts signed i32 to f32.
   * Pops 1 value, pushes floating-point equivalent.
   * May lose precision for large integers.
   */
  convert_i32_s() {
    this.push(byte`\xb2`);
    return this;
  }
  /**
   * Converts unsigned i32 to f32.
   * Pops 1 value, pushes floating-point equivalent.
   * May lose precision for large integers.
   */
  convert_i32_u() {
    this.push(byte`\xb3`);
    return this;
  }
  /**
   * Converts signed i64 to f32.
   * Pops 1 value, pushes floating-point equivalent.
   * Likely loses precision (f32 has 23-bit mantissa).
   */
  convert_i64_s() {
    this.push(byte`\xb4`);
    return this;
  }
  /**
   * Converts unsigned i64 to f32.
   * Pops 1 value, pushes floating-point equivalent.
   * Likely loses precision (f32 has 23-bit mantissa).
   */
  convert_i64_u() {
    this.push(byte`\xb5`);
    return this;
  }
  /**
   * Demotes f64 to f32 (loses precision).
   * Pops 1 value, pushes f32 equivalent.
   * Rounds to nearest representable f32 value.
   */
  demote_f64() {
    this.push(byte`\xb6`);
    return this;
  }
  /**
   * Reinterprets i32 bits as f32 (bitwise copy).
   * Pops 1 value, pushes raw bits as f32.
   */
  reinterpret_i32() {
    this.push(byte`\xbe`);
    return this;
  }
  /**
   * Truncates f32 to signed i32.
   * Pops 1 f32 value, pushes truncated integer as i32.
   * Traps if value is NaN, ±infinity, or out of i32 range.
   * @returns {I32_}
   */
  to_i32_trunc() {
    this.push(byte`\xa8`);
    return I32_.from(this);
  }
  /**
   * Truncates f32 to unsigned i32.
   * Pops 1 f32 value, pushes truncated integer as i32.
   * Traps if value is NaN, ±infinity, or out of u32 range.
   * @returns {I32_}
   */
  to_u32_trunc() {
    this.push(byte`\xa9`);
    return I32_.from(this);
  }
  /**
   * Reinterprets f32 bits as i32 (bitwise copy).
   * Pops 1 value, pushes raw bits as i32.
   */
  as_i32() {
    this.push(byte`\xbc`);
    return I32_.from(this);
  }
  /**
   * Saturating truncation of f32 to signed i32.
   * Pops 1 value, pushes truncated integer as i32.
   * Converts NaN/infinity/out-of-range values to INT32_MIN or INT32_MAX.
   * @returns {I32_}
   */
  to_i32_trunc_sat() {
    this.push(byte`\xfc\x00`);
    return I32_.from(this);
  }
  /**
   * Saturating truncation of f32 to unsigned i32.
   * Pops 1 value, pushes truncated integer as i32.
   * Converts NaN/infinity/out-of-range values to 0 or UINT32_MAX.
   * @returns {I32_}
   */
  to_u32_trunc_sat() {
    this.push(byte`\xfc\x01`);
    return I32_.from(this);
  }
  /**
   * Truncates f32 to signed i64.
   * Pops 1 f32 value, pushes truncated integer as i64.
   * Traps if value is NaN, ±infinity, or out of i64 range.
   * @returns {I64_}
   */
  to_i64_trunc() {
    this.push(byte`\xae`);
    return I64_.from(this);
  }
  /**
   * Truncates f32 to unsigned i64.
   * Pops 1 f32 value, pushes truncated integer as i64.
   * Traps if value is NaN, ±infinity, or out of u64 range.
   * @returns {I64_}
   */
  to_u64_trunc() {
    this.push(byte`\xaf`);
    return I64_.from(this);
  }
  /**
   * Saturating truncation of f32 to signed i64.
   * Pops 1 value, pushes truncated integer as i64.
   * Converts NaN/infinity/out-of-range values to INT64_MIN or INT64_MAX.
   * @returns {I64_}
   */
  to_i64_trunc_sat() {
    this.push(byte`\xfc\x04`);
    return I64_.from(this);
  }
  /**
   * Saturating truncation of f32 to unsigned i64.
   * Pops 1 value, pushes truncated integer as i64.
   * Converts NaN/infinity/out-of-range values to 0 or UINT64_MAX.
   * @returns {I64_}
   */
  to_u64_trunc_sat() {
    this.push(byte`\xfc\x05`);
    return I64_.from(this);
  }
  /**
   * Promotes f32 to_ f64 (exact conversion).
   * Pops 1 valu_e, pushes f64 equivalent.
   * @returns {I16x8_64_}
   */
  to_f64() {
    this.push(byte`\xbb`);
    return F64_.from(this);
  }
}
/** @type {F32_} */
export const F32 = new Proxy(F32_, {
  get: (a, b) => {
    if (a[b] !== undefined) return a[b];
    return (..._) => (new a())[b](..._);
  },
});

class F64_ extends InstrArray {
  /**
   * Loads an f64 value from linear memory at the address popped from the stack.
   * Requires 8-byte alignment. Traps on out-of-bounds or misalignment.
   * Requires alignment byte and offset byte right after.
   */
  load(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(F64.bytes(ptr));
    }
    this.push([byte`\x2b`, [3, encodeLEB128("u32", offset)]]);
    return this;
  }
  /**
   * Stores an f64 value into linear memory at address popped from stack.
   * Pops value then address. Requires 8-byte alignment. Traps on out-of-bounds.
   * Requires alignment byte and offset byte right after.
   */
  store(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(F64.bytes(ptr));
    }
    this.push([byte`\x39`, [3, encodeLEB128("u32", offset)]]);
    return this;
  }
  /**
   * Pushes a 64-bit float constant onto the stack.
   * The immediate value is encoded in IEEE 754 binary64 format.
   */
  const(num = 0, type = "f64") {
    this.push([byte`\x44`, encodeIEEE754(type, num)]);
    return this;
  }
  /**
   * Floating-point equality comparison for f64.
   * Pops 2 values, pushes 1 if equal (ordered), else 0 as i32.
   * Follows IEEE 754 rules (NaN returns 0).
   */
  eq(val = null) {
    if (val !== null) {
      this.push(F64.bytes(val));
    }
    this.push(byte`\x61`);
    return this;
  }
  /**
   * Floating-point inequality comparison for f64.
   * Pops 2 values, pushes 1 if not equal (unordered or different), else 0 as i32.
   * Follows IEEE 754 rules (NaN returns 1).
   */
  ne(val = null) {
    if (val !== null) {
      this.push(F64.bytes(val));
    }
    this.push(byte`\x62`);
    return this;
  }
  /**
   * Floating-point less-than comparison for f64.
   * Pops 2 values, pushes 1 if (a < b) ordered, else 0 as i32.
   * Follows IEEE 754 rules (NaN returns 0).
   */
  lt(val = null) {
    if (val !== null) {
      this.push(F64.bytes(val));
    }
    this.push(byte`\x63`);
    return this;
  }
  /**
   * Floating-point greater-than comparison for f64.
   * Pops 2 values, pushes 1 if (a > b) ordered, else 0 as i32.
   * Follows IEEE 754 rules (NaN returns 0).
   */
  gt(val = null) {
    if (val !== null) {
      this.push(F64.bytes(val));
    }
    this.push(byte`\x64`);
    return this;
  }
  /**
   * Floating-point less-than-or-equal comparison for f64.
   * Pops 2 values, pushes 1 if (a ≤ b) ordered, else 0 as i32.
   * Follows IEEE 754 rules (NaN returns 0).
   */
  le(val = null) {
    if (val !== null) {
      this.push(F64.bytes(val));
    }
    this.push(byte`\x65`);
    return this;
  }
  /**
   * Floating-point greater-than-or-equal comparison for f64.
   * Pops 2 values, pushes 1 if (a ≥ b) ordered, else 0 as i32.
   * Follows IEEE 754 rules (NaN returns 0).
   */
  ge(val = null) {
    if (val !== null) {
      this.push(F64.bytes(val));
    }
    this.push(byte`\x66`);
    return this;
  }
  /**
   * Absolute value for f64.
   * Pops 1 value, pushes |a| as f64 (preserves NaN).
   */
  abs() {
    this.push(byte`\x99`);
    return this;
  }
  /**
   * Negation for f64.
   * Pops 1 value, pushes -a as f64 (flips sign bit).
   */
  neg() {
    this.push(byte`\x9a`);
    return this;
  }
  /**
   * Rounds f64 up to nearest integer.
   * Pops 1 value, pushes ceil(a) as f64.
   */
  ceil() {
    this.push(byte`\x9b`);
    return this;
  }
  /**
   * Rounds f64 down to nearest integer.
   * Pops 1 value, pushes floor(a) as f64.
   */
  floor() {
    this.push(byte`\x9c`);
    return this;
  }
  /**
   * Truncates f64 toward zero.
   * Pops 1 value, pushes trunc(a) as f64.
   */
  trunc() {
    this.push(byte`\x9d`);
    return this;
  }
  /**
   * Rounds f64 to nearest integer (ties to even).
   * Pops 1 value, pushes rounded result as f64.
   * Follows IEEE 754 rules (NaN → NaN).
   */
  nearest() {
    this.push(byte`\x9e`);
    return this;
  }
  /**
   * Computes square root of f64.
   * Pops 1 value, pushes sqrt(a) as f64.
   * Returns NaN for negative inputs.
   */
  sqrt() {
    this.push(byte`\x9f`);
    return this;
  }
  /**
   * Floating-point addition for f64.
   * Pops 2 values, pushes (a + b) as f64.
   * Follows IEEE 754 rules (NaN propagation).
   */
  add(val = null) {
    if (val !== null) {
      this.push(F64.bytes(val));
    }
    this.push(byte`\xa0`);
    return this;
  }
  /**
   * Floating-point subtraction for f64.
   * Pops 2 values, pushes (a - b) as f64.
   * Follows IEEE 754 rules (NaN propagation).
   */
  sub(val = null) {
    if (val !== null) {
      this.push(F64.bytes(val));
    }
    this.push(byte`\xa1`);
    return this;
  }
  /**
   * Floating-point multiplication for f64.
   * Pops 2 values, pushes (a * b) as f64.
   * Follows IEEE 754 rules (NaN propagation).
   */
  mul(val = null) {
    if (val !== null) {
      this.push(F64.bytes(val));
    }
    this.push(byte`\xa2`);
    return this;
  }
  /**
   * Floating-point division for f64.
   * Pops 2 values, pushes (a / b) as f64.
   * Follows IEEE 754 rules (NaN/±infinity handling).
   */
  div(val = null) {
    if (val !== null) {
      this.push(F64.bytes(val));
    }
    this.push(byte`\xa3`);
    return this;
  }
  /**
   * Returns minimum of two f64 values.
   * Pops 2 values, pushes min(a, b) as f64.
   * Handles NaN and -0/+0 correctly per IEEE 754.
   */
  min(val = null) {
    if (val !== null) {
      this.push(F64.bytes(val));
    }
    this.push(byte`\xa4`);
    return this;
  }
  /**
   * Returns maximum of two f64 values.
   * Pops 2 values, pushes max(a, b) as f64.
   * Handles NaN and -0/+0 correctly per IEEE 754.
   */
  max(val = null) {
    if (val !== null) {
      this.push(F64.bytes(val));
    }
    this.push(byte`\xa5`);
    return this;
  }
  /**
   * Copies sign bit from b to a for f64.
   * Pops 2 values, pushes (|a| with b's sign) as f64.
   */
  copysign(val = null) {
    if (val !== null) {
      this.push(F64.bytes(val));
    }
    this.push(byte`\xa6`);
    return this;
  }
  /**
   * Converts signed i32 to f64.
   * Pops 1 value, pushes floating-point equivalent.
   * Exact conversion (no precision loss).
   */
  convert_i32_s() {
    this.push(byte`\xb7`);
    return this;
  }
  /**
   * Converts unsigned i32 to f64.
   * Pops 1 value, pushes floating-point equivalent.
   * Exact conversion (no precision loss).
   */
  convert_i32_u() {
    this.push(byte`\xb8`);
    return this;
  }
  /**
   * Converts signed i64 to f64.
   * Pops 1 value, pushes floating-point equivalent.
   * May lose precision (f64 has 52-bit mantissa).
   */
  convert_i64_s() {
    this.push(byte`\xb9`);
    return this;
  }
  /**
   * Converts unsigned i64 to f64.
   * Pops 1 value, pushes floating-point equivalent.
   * May lose precision (f64 has 52-bit mantissa).
   */
  convert_i64_u() {
    this.push(byte`\xba`);
    return this;
  }
  /**
   * Promotes f32 to f64 (exact conversion).
   * Pops 1 value, pushes f64 equivalent.
   */
  promote_f32() {
    this.push(byte`\xbb`);
    return this;
  }
  /**
   * Reinterprets i64 bits as f64 (bitwise copy).
   * Pops 1 value, pushes raw bits as f64.
   */
  reinterpret_i64() {
    this.push(byte`\xbf`);
    return this;
  }
  /**
   * Truncates f64 to signed i32.
   * Pops 1 f64 value, pushes truncated integer as i32.
   * Traps if value is NaN, ±infinity, or out of i32 range.
   * @returns {I32_}
   */
  to_i32_trunc() {
    this.push(byte`\xaa`);
    return I32_.from(this);
  }
  /**
   * Truncates f64 to unsigned i32.
   * Pops 1 f64 value, pushes truncated integer as i32.
   * Traps if value is NaN, ±infinity, or out of u32 range.
   * @returns {I32_}
   */
  to_u32_trunc() {
    this.push(byte`\xab`);
    return I32_.from(this);
  }
  /**
   * Saturating truncation of f64 to signed i32.
   * Pops 1 value, pushes truncated integer as i32.
   * Converts NaN/infinity/out-of-range values to INT32_MIN or INT32_MAX.
   * @returns {I32_}
   */
  to_i32_trunc_sat() {
    this.push(byte`\xfc\x02`);
    return I32_.from(this);
  }
  /**
   * Saturating truncation of f64 to unsigned i32.
   * Pops 1 value, pushes truncated integer as i32.
   * Converts NaN/infinity/out-of-range values to 0 or UINT32_MAX.
   * @returns {I32_}
   */
  to_u32_trunc_sat() {
    this.push(byte`\xfc\x03`);
    return I32_.from(this);
  }
  /**
   * Truncates f64 to signed i64.
   * Pops 1 value, pushes truncated integer as i64.
   * Traps if value is NaN, ±infinity, or out of i64 range.
   * @returns {I64_}
   */
  to_i64_trunc() {
    this.push(byte`\xb0`);
    return I64_.from(this);
  }
  /**
   * Truncates f64 to unsigned i64.
   * Pops 1 value, pushes truncated integer as i64.
   * Traps if value is NaN, ±infinity, or out of u64 range.
   * @returns {I64_}
   */
  to_u64_trunc() {
    this.push(byte`\xb1`);
    return I64_.from(this);
  }
  /**
   * Reinterprets f64 bits as i64 (bitwise copy).
   * Pops 1 value, pushes raw bits as i64.
   */
  as_i64() {
    this.push(byte`\xbd`);
    return I64_.from(this);
  }
  /**
   * Saturating truncation of f64 to signed i64.
   * Pops 1 value, pushes truncated integer as i64.
   * Converts NaN/infinity/out-of-range values to INT64_MIN or INT64_MAX.
   * @returns {I64_}
   */
  to_i64_trunc_sat() {
    this.push(byte`\xfc\x06`);
    return I64_.from(this);
  }
  /**
   * Saturating truncation of f64 to unsigned i64.
   * Pops 1 value, pushes truncated integer as i64.
   * Converts NaN/infinity/out-of-range values to 0 or UINT64_MAX.
   * @returns {I64_}
   */
  to_u64_trunc_sat() {
    this.push(byte`\xfc\x07`);
    return I64_.from(this);
  }
  /**
   * Demotes f64 to f32 (loses precision).
   * Pops 1 value, pushes f32 equivalent.
   * Rounds to nearest representable f32 value.
   * @returns {F32_}
   */
  to_f32() {
    this.push(byte`\xb6`);
    return F32_.from(this);
  }
}
/** @type {F64_} */
export const F64 = new Proxy(F64_, {
  get: (a, b) => {
    if (a[b] !== undefined) return a[b];
    return (..._) => (new a())[b](..._);
  },
});

class V128_ extends InstrArray {
  /**
   * Loads a 128-bit vector from linear memory at the address popped from the stack.
   * Requires 16-byte alignment. Traps on out-of-bounds or misalignment.
   */
  load(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr));
    }
    this.push([byte`\xfd\x00`, [4, encodeLEB128("u32", offset)]]);
    return this;
  }
  /**
   * Loads 8 bytes from memory, sign-extends each byte to 16 bits, and packs into a 128-bit vector.
   * Pops address from stack. Requires 8-byte alignment.
   */
  load8x8_s(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr));
    }
    this.push([byte`\xfd\x01`, [3, encodeLEB128("u32", offset)]]);
    return this;
  }
  /**
   * Loads 8 bytes from memory, zero-extends each byte to 16 bits, and packs into a 128-bit vector.
   * Pops address from stack. Requires 8-byte alignment.
   */
  load8x8_u(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr));
    }
    this.push([byte`\xfd\x02`, [3, encodeLEB128("u32", offset)]]);
    return this;
  }
  /**
   * Loads 4 halfwords (16 bits) from memory, sign-extends each halfword to 32 bits, and packs into a 128-bit vector.
   * Pops address from stack. Requires 8-byte alignment.
   */
  load16x4_s(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr));
    }
    this.push([byte`\xfd\x03`, [3, encodeLEB128("u32", offset)]]);
    return this;
  }
  /**
   * Loads 4 halfwords (16 bits) from memory, zero-extends each halfword to 32 bits, and packs into a 128-bit vector.
   * Pops address from stack. Requires 8-byte alignment.
   */
  load16x4_u(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr));
    }
    this.push([byte`\xfd\x04`, [3, encodeLEB128("u32", offset)]]);
    return this;
  }
  /**
   * Loads 2 words (32 bits) from memory, sign-extends each word to 64 bits, and packs into a 128-bit vector.
   * Pops address from stack. Requires 8-byte alignment.
   */
  load32x2_s(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr));
    }
    this.push([byte`\xfd\x05`, [3, encodeLEB128("u32", offset)]]);
    return this;
  }
  /**
   * Loads 2 words (32 bits) from memory, zero-extends each word to 64 bits, and packs into a 128-bit vector.
   * Pops address from stack. Requires 8-byte alignment.
   */
  load32x2_u(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr));
    }
    this.push([byte`\xfd\x06`, [3, encodeLEB128("u32", offset)]]);
    return this;
  }
  /**
   * Loads a single byte from memory, sign-extends it, and splats across all lanes of a 128-bit vector.
   * Pops address from stack. Requires 1-byte alignment.
   */
  load8_splat(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr));
    }
    this.push([byte`\xfd\x07`, [0, encodeLEB128("u32", offset)]]);
    return this;
  }
  /**
   * Loads a single halfword (16 bits) from memory, sign-extends it, and splats across all lanes of a 128-bit vector.
   * Pops address from stack. Requires 2-byte alignment.
   */
  load16_splat(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr));
    }
    this.push([byte`\xfd\x08`, [1, encodeLEB128("u32", offset)]]);
    return this;
  }
  /**
   * Loads a single word (32 bits) from memory, sign-extends it, and splats across all lanes of a 128-bit vector.
   * Pops address from stack. Requires 4-byte alignment.
   */
  load32_splat(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr));
    }
    this.push([byte`\xfd\x09`, [2, encodeLEB128("u32", offset)]]);
    return this;
  }
  /**
   * Loads a single doubleword (64 bits) from memory and splats it across all lanes of a 128-bit vector.
   * Pops address from stack. Requires 8-byte alignment.
   */
  load64_splat(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr));
    }
    this.push([byte`\xfd\x0a`, [3, encodeLEB128("u32", offset)]]);
    return this;
  }
  /**
   * Stores a 128-bit vector into linear memory at the address popped from the stack.
   * Requires 16-byte alignment. Traps on out-of-bounds or misalignment.
   */
  store(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.push(I32.bytes(ptr));
    }
    this.push([byte`\xfd\x0b`, [4, encodeLEB128("u32", offset)]]);
    return this;
  }
  /**
   * Performs a bitwise NOT operation on a 128-bit vector.
   * Pops one vector and pushes the result of flipping all bits.
   */
  not() {
    this.push(byte`\xfd\x4d`);
    return this;
  }
  /**
   * Performs a bitwise AND operation on two 128-bit vectors.
   * Pops two vectors and pushes the result of `(a & b)`.
   */
  and(val) {
    if (val !== undefined) {
      this.push(V128.bytes(val));
    }
    this.push(byte`\xfd\x4e`);
    return this;
  }
  /**
   * Performs a bitwise AND-NOT operation on two 128-bit vectors.
   * Pops two vectors and pushes the result of `(a & ~b)`.
   */
  andnot(val) {
    if (val !== undefined) {
      this.push(V128.bytes(val));
    }
    this.push(byte`\xfd\x4f`);
    return this;
  }
  /**
   * Performs a bitwise OR operation on two 128-bit vectors.
   * Pops two vectors and pushes the result of `(a | b)`.
   */
  or(val) {
    if (val !== undefined) {
      this.push(V128.bytes(val));
    }
    this.push(byte`\xfd\x50`);
    return this;
  }
  /**
   * Performs a bitwise XOR operation on two 128-bit vectors.
   * Pops two vectors and pushes the result of `(a ^ b)`.
   */
  xor(val) {
    if (val !== undefined) {
      this.push(V128.bytes(val));
    }
    this.push(byte`\xfd\x51`);
    return this;
  }
  /**
   * Selects bits from two vectors based on a mask vector.
   * Pops three vectors: mask, true_vector, false_vector.
   * For each bit in the mask, selects the corresponding bit from `true_vector` if the mask bit is `1`, otherwise from `false_vector`.
   */
  bitselect(false_vector, true_vector, mask) {
    if (mask !== undefined) {
      this.push(V128.bytes(mask));
    }
    if (true_vector !== undefined) {
      this.push(V128.bytes(true_vector));
    }
    if (false_vector !== undefined) {
      this.push(V128.bytes(false_vector));
    }
    this.push(byte`\xfd\x52`);
    return this;
  }
  /**
   * Checks if any lane in a 128-bit vector is non-zero.
   * Pops one vector and pushes `1` (true) if any lane is non-zero, or `0` (false) otherwise.
   */
  any_true() {
    this.push(byte`\xfd\x53`);
    return I32_.from(this);
  }
  /**
   * Loads a single byte from memory into a specific lane of a 128-bit vector.
   * Pops an address and a vector, replaces the specified lane with the loaded byte, and pushes the updated vector.
   */
  load8_lane(lane, ptr = null, offset = 0) {
    if (ptr !== null) {
      this.unshift(I32.bytes(ptr));
    }
    this.push([byte`\xfd\x54`, [0, encodeLEB128("u32", offset), lane]]);
    return this;
  }
  /**
   * Loads a single halfword (16 bits) from memory into a specific lane of a 128-bit vector.
   * Pops an address and a vector, replaces the specified lane with the loaded halfword, and pushes the updated vector.
   */
  load16_lane(lane, ptr = null, offset = 0) {
    if (ptr !== null) {
      this.unshift(I32.bytes(ptr));
    }
    this.push([byte`\xfd\x55`, [1, encodeLEB128("u32", offset), lane]]);
    return this;
  }
  /**
   * Loads a single word (32 bits) from memory into a specific lane of a 128-bit vector.
   * Pops an address and a vector, replaces the specified lane with the loaded word, and pushes the updated vector.
   */
  load32_lane(lane, ptr = null, offset = 0) {
    if (ptr !== null) {
      this.unshift(I32.bytes(ptr));
    }
    this.push([byte`\xfd\x56`, [2, encodeLEB128("u32", offset), lane]]);
    return this;
  }
  /**
   * Loads a single doubleword (64 bits) from memory into a specific lane of a 128-bit vector.
   * Pops an address and a vector, replaces the specified lane with the loaded doubleword, and pushes the updated vector.
   */
  load64_lane(lane, ptr = null, offset = 0) {
    if (ptr !== null) {
      this.unshift(I32.bytes(ptr));
    }
    this.push([byte`\xfd\x57`, [3, encodeLEB128("u32", offset), lane]]);
    return this;
  }
  /**
   * Stores a single byte from a specific lane of a 128-bit vector into memory.
   * Pops an address and a vector, writes the specified lane's byte to memory.
   */
  store8_lane(lane, ptr = null, offset = 0) {
    if (ptr !== null) {
      this.unshift(I32.bytes(ptr));
    }
    this.push([byte`\xfd\x58`, [0, encodeLEB128("u32", offset), lane]]);
    return this;
  }
  /**
   * Stores a single halfword (16 bits) from a specific lane of a 128-bit vector into memory.
   * Pops an address and a vector, writes the specified lane's halfword to memory.
   */
  store16_lane(lane, ptr = null, offset = 0) {
    if (ptr !== null) {
      this.unshift(I32.bytes(ptr));
    }
    this.push([byte`\xfd\x59`, [1, encodeLEB128("u32", offset), lane]]);
    return this;
  }
  /**
   * Stores a single word (32 bits) from a specific lane of a 128-bit vector into memory.
   * Pops an address and a vector, writes the specified lane's word to memory.
   */
  store32_lane(lane, ptr = null, offset = 0) {
    if (ptr !== null) {
      this.unshift(I32.bytes(ptr));
    }
    this.push([byte`\xfd\x5a`, [2, encodeLEB128("u32", offset), lane]]);
    return this;
  }
  /**
   * Stores a single doubleword (64 bits) from a specific lane of a 128-bit vector into memory.
   * Pops an address and a vector, writes the specified lane's doubleword to memory.
   */
  store64_lane(lane, ptr = null, offset = 0) {
    if (ptr !== null) {
      this.unshift(I32.bytes(ptr));
    }
    this.push([byte`\xfd\x5b`, [3, encodeLEB128("u32", offset), lane]]);
    return this;
  }
  /**
   * Loads a single word (32 bits) from memory and zero-extends it into a 128-bit vector.
   * Pops an address and pushes a new vector where the low 32 bits are loaded from memory, and the rest are zeroed.
   */
  load32_zero(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.unshift(I32.bytes(ptr));
    }
    this.push([byte`\xfd\x5c`, [2, encodeLEB128("u32", offset)]]);
    return this;
  }
  /**
   * Loads a single doubleword (64 bits) from memory and zero-extends it into a 128-bit vector.
   * Pops an address and pushes a new vector where the low 64 bits are loaded from memory, and the rest are zeroed.
   */
  load64_zero(ptr = null, offset = 0) {
    if (ptr !== null) {
      this.unshift(I32.bytes(ptr));
    }
    this.push([byte`\xfd\x5d`, [3, encodeLEB128("u32", offset)]]);
    return this;
  }
  /**
   * Pushes a 128-bit constant vector onto the stack.
   * The immediate value is encoded as a literal 128-bit value.
   */
  const(val = 0) {
    this.push([byte`\xfd\x0c`, encode_v128(val)]);
    return this;
  }
}
/** @type {V128_} */
export const V128 = new Proxy(V128_, {
  get: (a, b) => {
    if (a[b] !== undefined) return a[b];
    return (..._) => (new a())[b](..._);
  },
});

class I8x16_ extends InstrArray {
  /**
   * Shuffles two 128-bit vectors into a new 128-bit vector based on an 8-bit shuffle mask.
   * Pops two vectors and uses a 16-byte immediate mask to produce the result.
   */
  shuffle(...mask) {
    console.assert(mask.length === 16);
    this.push([byte`\xfd\x0d`, mask]);
    return this;
  }
  /**
   * Swizzles the first vector using indices from the second vector.
   * Pops two vectors and produces a new vector where each lane is selected by the corresponding index in the second vector.
   */
  swizzle(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val));
    }
    this.push(byte`\xfd\x0e`);
    return this;
  }
  /**
   * Creates a 128-bit vector by replicating an 8-bit integer across all lanes.
   * Pops 1 value and splats it across all 16 lanes of the vector.
   */
  splat(val) {
    if (val !== undefined) {
      this.push(I32.bytes(val));
    }
    this.push(byte`\xfd\x0f`);
    return this;
  }
  /**
   * Extracts a signed 8-bit integer from a specific lane of a 128-bit vector.
   * Pops a vector and pushes the extracted lane value as an i32 (sign-extended).
   * @returns {I32_}
   */
  extract_lane_s(index) {
    this.push([byte`\xfd\x15`, index]);
    return I32_.from(this);
  }
  /**
   * Extracts an unsigned 8-bit integer from a specific lane of a 128-bit vector.
   * Pops a vector and pushes the extracted lane value as an i32 (zero-extended).
   * @returns {I32_}
   */
  extract_lane_u(index) {
    this.push([byte`\xfd\x16`, index]);
    return I32_.from(this);
  }
  /**
   * Replaces a specific lane in a 128-bit vector with a new value.
   * Pops a vector and a scalar value, then replaces the specified lane and pushes the updated vector.
   */
  replace_lane(val, index) {
    if (val !== undefined) {
      this.push(I32.bytes(val));
    }
    this.push([byte`\xfd\x17`, index]);
    return this;
  }
  /**
   * Compares two 128-bit vectors for equality (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFF` if equal, or `0x00` otherwise.
   */
  eq(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val));
    }
    this.push(byte`\xfd\x23`);
    return this;
  }
  /**
   * Compares two 128-bit vectors for inequality (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFF` if not equal, or `0x00` otherwise.
   */
  ne(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val));
    }
    this.push(byte`\xfd\x24`);
    return this;
  }
  /**
   * Compares two 128-bit vectors for signed less-than (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFF` if `(a < b)`, or `0x00` otherwise.
   */
  lt_s(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val));
    }
    this.push(byte`\xfd\x25`);
    return this;
  }
  /**
   * Compares two 128-bit vectors for unsigned less-than (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFF` if `(a < b)`, or `0x00` otherwise.
   */
  lt_u(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val));
    }
    this.push(byte`\xfd\x26`);
    return this;
  }
  /**
   * Compares two 128-bit vectors for signed greater-than (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFF` if `(a > b)`, or `0x00` otherwise.
   */
  gt_s(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val));
    }
    this.push(byte`\xfd\x27`);
    return this;
  }
  /**
   * Compares two 128-bit vectors for unsigned greater-than (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFF` if `(a > b)`, or `0x00` otherwise.
   */
  gt_u(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val));
    }
    this.push(byte`\xfd\x28`);
    return this;
  }
  /**
   * Compares two 128-bit vectors for signed less-than-or-equal (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFF` if `(a ≤ b)`, or `0x00` otherwise.
   */
  le_s(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val));
    }
    this.push(byte`\xfd\x29`);
    return this;
  }
  /**
   * Compares two 128-bit vectors for unsigned less-than-or-equal (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFF` if `(a ≤ b)`, or `0x00` otherwise.
   */
  le_u(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val));
    }
    this.push(byte`\xfd\x2a`);
    return this;
  }
  /**
   * Compares two 128-bit vectors for signed greater-than-or-equal (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFF` if `(a ≥ b)`, or `0x00` otherwise.
   */
  ge_s(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val));
    }
    this.push(byte`\xfd\x2b`);
    return this;
  }
  /**
   * Compares two 128-bit vectors for unsigned greater-than-or-equal (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFF` if `(a ≥ b)`, or `0x00` otherwise.
   */
  ge_u(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val));
    }
    this.push(byte`\xfd\x2c`);
    return this;
  }
  /**
   * Computes the absolute value of each lane in an `i8x16` vector.
   * Pops one vector and pushes a new vector where each lane is replaced by its absolute value.
   */
  abs() {
    this.push(byte`\xfd\x60`);
    return this;
  }
  /**
   * Negates each lane in an `i8x16` vector.
   * Pops one vector and pushes a new vector where each lane is replaced by its negated value.
   */
  neg() {
    this.push(byte`\xfd\x61`);
    return this;
  }
  /**
   * Counts the number of set bits (1s) in each lane of an `i8x16` vector.
   * Pops one vector and pushes a new vector where each lane is replaced by the population count of the original lane.
   */
  popcnt() {
    this.push(byte`\xfd\x62`);
    return this;
  }
  /**
   * Checks if all lanes in an `i8x16` vector are non-zero.
   * Pops one vector and pushes `1` (true) if all lanes are non-zero, or `0` (false) otherwise.
   */
  all_true() {
    this.push(byte`\xfd\x63`);
    return I32.bytes(this);
  }
  /**
   * Creates a bitmask from an `i8x16` vector.
   * Pops one vector and pushes an `i32` bitmask where each bit corresponds to the sign bit of a lane in the vector.
   */
  bitmask() {
    this.push(byte`\xfd\x64`);
    return I32.bytes(this);
  }
  /**
   * Narrows an `i16x8` vector to an `i8x16` vector using signed saturation.
   * Pops two vectors, combines their lanes into a single `i8x16` vector, saturating values that exceed the range of `i8`.
   */
  narrow_i16x8_s(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val));
    }
    this.push(byte`\xfd\x65`);
    return this;
  }
  /**
   * Narrows an `i16x8` vector to an `i8x16` vector using unsigned saturation.
   * Pops two vectors, combines their lanes into a single `i8x16` vector, saturating values that exceed the range of `u8`.
   */
  narrow_i16x8_u(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val));
    }
    this.push(byte`\xfd\x66`);
    return this;
  }
  /**
   * Performs a bitwise left shift on each lane of an `i8x16` vector.
   * Pops one vector and a scalar value, shifts each lane left by the scalar value, and pushes the result.
   */
  shl(val) {
    if (val !== undefined) {
      this.push(I32.bytes(val));
    }
    this.push(byte`\xfd\x6b`);
    return this;
  }
  /**
   * Performs an arithmetic right shift on each lane of an `i8x16` vector.
   * Pops one vector and a scalar value, shifts each lane right by the scalar value (sign-preserving), and pushes the result.
   */
  shr_s(val) {
    if (val !== undefined) {
      this.push(I32.bytes(val));
    }
    this.push(byte`\xfd\x6c`);
    return this;
  }
  /**
   * Performs a logical right shift on each lane of an `i8x16` vector.
   * Pops one vector and a scalar value, shifts each lane right by the scalar value (zero-filling), and pushes the result.
   */
  shr_u(val) {
    if (val !== undefined) {
      this.push(I32.bytes(val));
    }
    this.push(byte`\xfd\x6d`);
    return this;
  }
  /**
   * Adds corresponding lanes of two `i8x16` vectors.
   * Pops two vectors and pushes a new vector where each lane is the sum of the corresponding lanes.
   */
  add(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val));
    }
    this.push(byte`\xfd\x6e`);
    return this;
  }
  /**
   * Adds corresponding lanes of two `i8x16` vectors using signed saturation.
   * Pops two vectors and pushes a new vector where each lane is saturated if the result exceeds the range of `i8`.
   */
  add_sat_s(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val));
    }
    this.push(byte`\xfd\x6f`);
    return this;
  }
  /**
   * Adds corresponding lanes of two `i8x16` vectors using unsigned saturation.
   * Pops two vectors and pushes a new vector where each lane is saturated if the result exceeds the range of `u8`.
   */
  add_sat_u(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val));
    }
    this.push(byte`\xfd\x70`);
    return this;
  }
  /**
   * Subtracts corresponding lanes of two `i8x16` vectors.
   * Pops two vectors and pushes a new vector where each lane is the difference of the corresponding lanes.
   */
  sub(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val));
    }
    this.push(byte`\xfd\x71`);
    return this;
  }
  /**
   * Subtracts corresponding lanes of two `i8x16` vectors using signed saturation.
   * Pops two vectors and pushes a new vector where each lane is saturated if the result exceeds the range of `i8`.
   */
  sub_sat_s(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val));
    }
    this.push(byte`\xfd\x72`);
    return this;
  }
  /**
   * Subtracts corresponding lanes of two `i8x16` vectors using unsigned saturation.
   * Pops two vectors and pushes a new vector where each lane is saturated if the result exceeds the range of `u8`.
   */
  sub_sat_u(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val));
    }
    this.push(byte`\xfd\x73`);
    return this;
  }
  /**
   * Computes the minimum of corresponding lanes of two `i8x16` vectors using signed comparison.
   * Pops two vectors and pushes a new vector where each lane is the minimum of the corresponding lanes.
   */
  min_s(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val));
    }
    this.push(byte`\xfd\x76`);
    return this;
  }
  /**
   * Computes the minimum of corresponding lanes of two `i8x16` vectors using unsigned comparison.
   * Pops two vectors and pushes a new vector where each lane is the minimum of the corresponding lanes.
   */
  min_u(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val));
    }
    this.push(byte`\xfd\x77`);
    return this;
  }
  /**
   * Computes the maximum of corresponding lanes of two `i8x16` vectors using signed comparison.
   * Pops two vectors and pushes a new vector where each lane is the maximum of the corresponding lanes.
   */
  max_s(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val));
    }
    this.push(byte`\xfd\x78`);
    return this;
  }
  /**
   * Computes the maximum of corresponding lanes of two `i8x16` vectors using unsigned comparison.
   * Pops two vectors and pushes a new vector where each lane is the maximum of the corresponding lanes.
   */
  max_u(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val));
    }
    this.push(byte`\xfd\x79`);
    return this;
  }
  /**
   * Computes the unsigned average (rounded) of corresponding lanes of two `i8x16` vectors.
   * Pops two vectors and pushes a new vector where each lane is the rounded average of the corresponding lanes.
   */
  avgr_u(val) {
    if (val !== undefined) {
      this.push(I8x16.bytes(val));
    }
    this.push(byte`\xfd\x7b`);
    return this;
  }
  /**
   * Pushes a 128-bit constant vector onto the stack.
   * The immediate value is encoded as a vector of 16 8-bit values.
   */
  const(...vals) {
    console.assert(vals.length === 16);
    this.push([byte`\xfd\x0c`, encode_v128(vals)]);
    return this;
  }
}
/** @type {I8x16_} */
export const I8x16 = new Proxy(I8x16_, {
  get: (a, b) => {
    if (a[b] !== undefined) return a[b];
    return (..._) => (new a())[b](..._);
  },
});

class I16x8_ extends InstrArray {
  /**
   * Creates a 128-bit vector by replicating a 16-bit integer across all lanes.
   * Pops 1 value and splats it across all 8 lanes of the vector.
   */
  splat(val) {
    if (val !== undefined) {
      this.push(I32.const(val, "i17"));
    }
    this.push(byte`\xfd\x10`);
    return this;
  }
  /**
   * Extracts a signed 16-bit integer from a specific lane of a 128-bit vector.
   * Pops a vector and pushes the extracted lane value as an i32 (sign-extended).
   * @returns {I32_}
   */
  extract_lane_s(index) {
    this.push([byte`\xfd\x18`, index]);
    return I32_.from(this);
  }
  /**
   * Extracts an unsigned 16-bit integer from a specific lane of a 128-bit vector.
   * Pops a vector and pushes the extracted lane value as an i32 (zero-extended).
   */
  extract_lane_u(index) {
    this.push([byte`\xfd\x19`, index]);
    return I32_.from(this);
  }
  /**
   * Replaces a specific lane in a 128-bit vector with a new value.
   * Pops a vector and a scalar value, then replaces the specified lane and pushes the updated vector.
   */
  replace_lane(val, index) {
    if (val !== undefined) {
      this.push(InstrArray.bytes(val));
    }
    this.push([byte`\xfd\x1a`, index]);
    return this;
  }
  /**
   * Compares two 128-bit vectors for equality (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFF` if equal, or `0x0000` otherwise.
   */
  eq(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val));
    }
    this.push(byte`\xfd\x2d`);
    return this;
  }
  /**
   * Compares two 128-bit vectors for inequality (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFF` if not equal, or `0x0000` otherwise.
   */
  ne(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val));
    }
    this.push(byte`\xfd\x2e`);
    return this;
  }
  /**
   * Compares two 128-bit vectors for signed less-than (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFF` if `(a < b)`, or `0x0000` otherwise.
   */
  lt_s(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val));
    }
    this.push(byte`\xfd\x2f`);
    return this;
  }
  /**
   * Compares two 128-bit vectors for unsigned less-than (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFF` if `(a < b)`, or `0x0000` otherwise.
   */
  lt_u(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val));
    }
    this.push(byte`\xfd\x30`);
    return this;
  }
  /**
   * Compares two 128-bit vectors for signed greater-than (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFF` if `(a > b)`, or `0x0000` otherwise.
   */
  gt_s(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val));
    }
    this.push(byte`\xfd\x31`);
    return this;
  }
  /**
   * Compares two 128-bit vectors for unsigned greater-than (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFF` if `(a > b)`, or `0x0000` otherwise.
   */
  gt_u(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val));
    }
    this.push(byte`\xfd\x32`);
    return this;
  }
  /**
   * Compares two 128-bit vectors for signed less-than-or-equal (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFF` if `(a ≤ b)`, or `0x0000` otherwise.
   */
  le_s(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val));
    }
    this.push(byte`\xfd\x33`);
    return this;
  }
  /**
   * Compares two 128-bit vectors for unsigned less-than-or-equal (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFF` if `(a ≤ b)`, or `0x0000` otherwise.
   */
  le_u(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val));
    }
    this.push(byte`\xfd\x34`);
    return this;
  }
  /**
   * Compares two 128-bit vectors for signed greater-than-or-equal (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFF` if `(a ≥ b)`, or `0x0000` otherwise.
   */
  ge_s(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val));
    }
    this.push(byte`\xfd\x35`);
    return this;
  }
  /**
   * Compares two 128-bit vectors for unsigned greater-than-or-equal (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFF` if `(a ≥ b)`, or `0x0000` otherwise.
   */
  ge_u(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val));
    }
    this.push(byte`\xfd\x36`);
    return this;
  }
  /**
   * Adds adjacent pairs of lanes in an `i8x16` vector using signed addition, producing an `i16x8` vector.
   * Pops one vector and pushes a new vector where each lane is the sum of two adjacent lanes.
   */
  extadd_pairwise_i8x16_s() {
    this.push(byte`\xfd\x7c`);
    return this;
  }
  /**
   * Adds adjacent pairs of lanes in an `i8x16` vector using unsigned addition, producing an `i16x8` vector.
   * Pops one vector and pushes a new vector where each lane is the sum of two adjacent lanes.
   */
  extadd_pairwise_i8x16_u() {
    this.push(byte`\xfd\x7d`);
    return this;
  }
  /**
   * Adds adjacent pairs of lanes in an `i16x8` vector using signed addition, producing an `i32x4` vector.
   * Pops one vector and pushes a new vector where each lane is the sum of two adjacent lanes.
   */
  extadd_pairwise_i16x8_s() {
    this.push(byte`\xfd\x7e`);
    return this;
  }
  /**
   * Adds adjacent pairs of lanes in an `i16x8` vector using unsigned addition, producing an `i32x4` vector.
   * Pops one vector and pushes a new vector where each lane is the sum of two adjacent lanes.
   */
  extadd_pairwise_i16x8_u() {
    this.push(byte`\xfd\x7f`);
    return this;
  }
  /**
   * Computes the absolute value of each lane in an `i16x8` vector.
   * Pops one vector and pushes a new vector where each lane is replaced by its absolute value.
   */
  abs() {
    this.push(byte`\xfd\x80\x01`);
    return this;
  }
  /**
   * Negates each lane in an `i16x8` vector.
   * Pops one vector and pushes a new vector where each lane is replaced by its negated value.
   */
  neg() {
    this.push(byte`\xfd\x81\x01`);
    return this;
  }
  /**
   * Performs a signed Q15 multiplication with rounding and saturation on each lane of two `i16x8` vectors.
   * Pops two vectors and pushes a new vector where each lane is `(a * b + 0x4000) >> 15`, saturated to the range of `i16`.
   */
  q15mulr_sat_s(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val));
    }
    this.push(byte`\xfd\x82\x01`);
    return this;
  }
  /**
   * Checks if all lanes in an `i16x8` vector are non-zero.
   * Pops one vector and pushes `1` (true) if all lanes are non-zero, or `0` (false) otherwise.
   */
  all_true() {
    this.push(byte`\xfd\x83\x01`);
    return I32_.from(this);
  }
  /**
   * Creates a bitmask from an `i16x8` vector.
   * Pops one vector and pushes an `i32` bitmask where each bit corresponds to the sign bit of a lane in the vector.
   */
  bitmask() {
    this.push(byte`\xfd\x84\x01`);
    return I32_.from(this);
  }
  /**
   * Narrows an `i32x4` vector to an `i16x8` vector using signed saturation.
   * Pops two vectors, combines their lanes into a single `i16x8` vector, saturating values that exceed the range of `i16`.
   */
  narrow_i32x4_s(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val));
    }
    this.push(byte`\xfd\x85\x01`);
    return this;
  }
  /**
   * Narrows an `i32x4` vector to an `i16x8` vector using unsigned saturation.
   * Pops two vectors, combines their lanes into a single `i16x8` vector, saturating values that exceed the range of `u16`.
   */
  narrow_i32x4_u(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val));
    }
    this.push(byte`\xfd\x86\x01`);
    return this;
  }
  /**
   * Extends the low 8 lanes of an `i8x16` vector to 16 bits using signed extension.
   * Pops one vector and pushes a new vector where each lane is the sign-extended value of the corresponding low lane.
   */
  extend_low_i8x16_s() {
    this.push(byte`\xfd\x87\x01`);
    return this;
  }
  /**
   * Extends the high 8 lanes of an `i8x16` vector to 16 bits using signed extension.
   * Pops one vector and pushes a new vector where each lane is the sign-extended value of the corresponding high lane.
   */
  extend_high_i8x16_s() {
    this.push(byte`\xfd\x88\x01`);
    return this;
  }
  /**
   * Extends the low 8 lanes of an `i8x16` vector to 16 bits using zero extension.
   * Pops one vector and pushes a new vector where each lane is the zero-extended value of the corresponding low lane.
   */
  extend_low_i8x16_u() {
    this.push(byte`\xfd\x89\x01`);
    return this;
  }
  /**
   * Extends the high 8 lanes of an `i8x16` vector to 16 bits using zero extension.
   * Pops one vector and pushes a new vector where each lane is the zero-extended value of the corresponding high lane.
   */
  extend_high_i8x16_u() {
    this.push(byte`\xfd\x8a\x01`);
    return this;
  }
  /**
   * Performs a bitwise left shift on each lane of an `i16x8` vector.
   * Pops one vector and a scalar value, shifts each lane left by the scalar value, and pushes the result.
   */
  shl(val) {
    if (val !== undefined) {
      this.push(I32.bytes(val));
    }
    this.push(byte`\xfd\x8b\x01`);
    return this;
  }
  /**
   * Performs an arithmetic right shift on each lane of an `i16x8` vector.
   * Pops one vector and a scalar value, shifts each lane right by the scalar value (sign-preserving), and pushes the result.
   */
  shr_s(val) {
    if (val !== undefined) {
      this.push(I32.bytes(val));
    }
    this.push(byte`\xfd\x8c\x01`);
    return this;
  }
  /**
   * Performs a logical right shift on each lane of an `i16x8` vector.
   * Pops one vector and a scalar value, shifts each lane right by the scalar value (zero-filling), and pushes the result.
   */
  shr_u(val) {
    if (val !== undefined) {
      this.push(I32.bytes(val));
    }
    this.push(byte`\xfd\x8d\x01`);
    return this;
  }
  /**
   * Adds corresponding lanes of two `i16x8` vectors.
   * Pops two vectors and pushes a new vector where each lane is the sum of the corresponding lanes.
   */
  add(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val));
    }
    this.push(byte`\xfd\x8e\x01`);
    return this;
  }
  /**
   * Adds corresponding lanes of two `i16x8` vectors using signed saturation.
   * Pops two vectors and pushes a new vector where each lane is saturated if the result exceeds the range of `i16`.
   */
  add_sat_s(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val));
    }
    this.push(byte`\xfd\x8f\x01`);
    return this;
  }
  /**
   * Adds corresponding lanes of two `i16x8` vectors using unsigned saturation.
   * Pops two vectors and pushes a new vector where each lane is saturated if the result exceeds the range of `u16`.
   */
  add_sat_u(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val));
    }
    this.push(byte`\xfd\x90\x01`);
    return this;
  }
  /**
   * Subtracts corresponding lanes of two `i16x8` vectors.
   * Pops two vectors and pushes a new vector where each lane is the difference of the corresponding lanes.
   */
  sub(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val));
    }
    this.push(byte`\xfd\x91\x01`);
    return this;
  }
  /**
   * Subtracts corresponding lanes of two `i16x8` vectors using signed saturation.
   * Pops two vectors and pushes a new vector where each lane is saturated if the result exceeds the range of `i16`.
   */
  sub_sat_s(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val));
    }
    this.push(byte`\xfd\x92\x01`);
    return this;
  }
  /**
   * Subtracts corresponding lanes of two `i16x8` vectors using unsigned saturation.
   * Pops two vectors and pushes a new vector where each lane is saturated if the result exceeds the range of `u16`.
   */
  sub_sat_u(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val));
    }
    this.push(byte`\xfd\x93\x01`);
    return this;
  }
  /**
   * Multiplies corresponding lanes of two `i16x8` vectors.
   * Pops two vectors and pushes a new vector where each lane is the product of the corresponding lanes.
   */
  mul(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val));
    }
    this.push(byte`\xfd\x95\x01`);
    return this;
  }
  /**
   * Computes the minimum of corresponding lanes of two `i16x8` vectors using signed comparison.
   * Pops two vectors and pushes a new vector where each lane is the minimum of the corresponding lanes.
   */
  min_s(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val));
    }
    this.push(byte`\xfd\x96\x01`);
    return this;
  }
  /**
   * Computes the minimum of corresponding lanes of two `i16x8` vectors using unsigned comparison.
   * Pops two vectors and pushes a new vector where each lane is the minimum of the corresponding lanes.
   */
  min_u(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val));
    }
    this.push(byte`\xfd\x97\x01`);
    return this;
  }
  /**
   * Computes the maximum of corresponding lanes of two `i16x8` vectors using signed comparison.
   * Pops two vectors and pushes a new vector where each lane is the maximum of the corresponding lanes.
   */
  max_s(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val));
    }
    this.push(byte`\xfd\x98\x01`);
    return this;
  }
  /**
   * Computes the maximum of corresponding lanes of two `i16x8` vectors using unsigned comparison.
   * Pops two vectors and pushes a new vector where each lane is the maximum of the corresponding lanes.
   */
  max_u(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val));
    }
    this.push(byte`\xfd\x99\x01`);
    return this;
  }
  /**
   * Computes the unsigned average (rounded) of corresponding lanes of two `i16x8` vectors.
   * Pops two vectors and pushes a new vector where each lane is the rounded average of the corresponding lanes.
   */
  avgr_u(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val));
    }
    this.push(byte`\xfd\x9b\x01`);
    return this;
  }
  /**
   * Multiplies low 8 lanes of two `i8x16` vectors and extends the result to 16 bits using signed extension.
   * Pops two vectors and pushes a new vector where each lane is the sign-extended product of the corresponding low lanes.
   */
  extmul_low_i8x16_s(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val));
    }
    this.push(byte`\xfd\x9c\x01`);
    return this;
  }
  /**
   * Multiplies high 8 lanes of two `i8x16` vectors and extends the result to 16 bits using signed extension.
   * Pops two vectors and pushes a new vector where each lane is the sign-extended product of the corresponding high lanes.
   */
  extmul_high_i8x16_s(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val));
    }
    this.push(byte`\xfd\x9d\x01`);
    return this;
  }
  /**
   * Multiplies low 8 lanes of two `i8x16` vectors and extends the result to 16 bits using zero extension.
   * Pops two vectors and pushes a new vector where each lane is the zero-extended product of the corresponding low lanes.
   */
  extmul_low_i8x16_u(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val));
    }
    this.push(byte`\xfd\x9e\x01`);
    return this;
  }
  /**
   * Multiplies high 8 lanes of two `i8x16` vectors and extends the result to 16 bits using zero extension.
   * Pops two vectors and pushes a new vector where each lane is the zero-extended product of the corresponding high lanes.
   */
  extmul_high_i8x16_u(val) {
    if (val !== undefined) {
      this.push(I16x8.bytes(val));
    }
    this.push(byte`\xfd\x9f\x01`);
    return this;
  }
  /**
   * Pushes a 128-bit constant vector onto the stack.
   * The immediate value is encoded as a vector of 8 16-bit values.
   */
  const(...vals) {
    console.assert(vals.length === 8);
    this.push([byte`\xfd\x0c`, encode_v128(vals)]);
    return this;
  }
}
/** @type {I16x8_} */
export const I16x8 = new Proxy(I16x8_, {
  get: (a, b) => {
    if (a[b] !== undefined) return a[b];
    return (..._) => (new a())[b](..._);
  },
});

class I32x4_ extends InstrArray {
  /**
   * Creates a 128-bit vector by replicating a 32-bit integer across all lanes.
   * Pops 1 value and splats it across all 4 lanes of the vector.
   */
  splat(val) {
    if (val !== undefined) {
      this.push(I32.bytes(val));
    }
    this.push(byte`\xfd\x11`);
    return this;
  }
  /**
   * Extracts a 32-bit integer from a specific lane of a 128-bit vector.
   * Pops a vector and pushes the extracted lane value as an i32.
   */
  extract_lane(index) {
    this.push([byte`\xfd\x1b`, index]);
    return I32_.from(this);
  }
  /**
   * Replaces a specific lane in a 128-bit vector with a new value.
   * Pops a vector and a scalar value, then replaces the specified lane and pushes the updated vector.
   */
  replace_lane(val, index) {
    if (val !== undefined) {
      this.push(InstrArray.bytes(val));
    }
    this.push([byte`\xfd\x1c`, index]);
    return this;
  }
  /**
   * Compares two 128-bit vectors for equality (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if equal, or `0x00000000` otherwise.
   */
  eq(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val));
    }
    this.push(byte`\xfd\x37`);
    return this;
  }
  /**
   * Compares two 128-bit vectors for inequality (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if not equal, or `0x00000000` otherwise.
   */
  ne(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val));
    }
    this.push(byte`\xfd\x38`);
    return this;
  }
  /**
   * Compares two 128-bit vectors for signed less-than (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if `(a < b)`, or `0x00000000` otherwise.
   */
  lt_s(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val));
    }
    this.push(byte`\xfd\x39`);
    return this;
  }
  /**
   * Compares two 128-bit vectors for unsigned less-than (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if `(a < b)`, or `0x00000000` otherwise.
   */
  lt_u(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val));
    }
    this.push(byte`\xfd\x3a`);
    return this;
  }
  /**
   * Compares two 128-bit vectors for signed greater-than (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if `(a > b)`, or `0x00000000` otherwise.
   */
  gt_s(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val));
    }
    this.push(byte`\xfd\x3b`);
    return this;
  }
  /**
   * Compares two 128-bit vectors for unsigned greater-than (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if `(a > b)`, or `0x00000000` otherwise.
   */
  gt_u(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val));
    }
    this.push(byte`\xfd\x3c`);
    return this;
  }
  /**
   * Compares two 128-bit vectors for signed less-than-or-equal (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if `(a ≤ b)`, or `0x00000000` otherwise.
   */
  le_s(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val));
    }
    this.push(byte`\xfd\x3d`);
    return this;
  }
  /**
   * Compares two 128-bit vectors for unsigned less-than-or-equal (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if `(a ≤ b)`, or `0x00000000` otherwise.
   */
  le_u(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val));
    }
    this.push(byte`\xfd\x3e`);
    return this;
  }
  /**
   * Compares two 128-bit vectors for signed greater-than-or-equal (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if `(a ≥ b)`, or `0x00000000` otherwise.
   */
  ge_s(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val));
    }
    this.push(byte`\xfd\x3f`);
    return this;
  }
  /**
   * Compares two 128-bit vectors for unsigned greater-than-or-equal (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if `(a ≥ b)`, or `0x00000000` otherwise.
   */
  ge_u(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val));
    }
    this.push(byte`\xfd\x40`);
    return this;
  }
  /**
   * Computes the absolute value of each lane in an `i32x4` vector.
   * Pops one vector and pushes a new vector where each lane is replaced by its absolute value.
   */
  abs() {
    this.push(byte`\xfd\xa0\x01`);
    return this;
  }
  /**
   * Negates each lane in an `i32x4` vector.
   * Pops one vector and pushes a new vector where each lane is replaced by its negated value.
   */
  neg() {
    this.push(byte`\xfd\xa1\x01`);
    return this;
  }
  /**
   * Checks if all lanes in an `i32x4` vector are non-zero.
   * Pops one vector and pushes `1` (true) if all lanes are non-zero, or `0` (false) otherwise.
   */
  all_true() {
    this.push(byte`\xfd\xa3\x01`);
    return I32_.from(this);
  }
  /**
   * Creates a bitmask from an `i32x4` vector.
   * Pops one vector and pushes an `i32` bitmask where each bit corresponds to the sign bit of a lane in the vector.
   */
  bitmask() {
    this.push(byte`\xfd\xa4\x01`);
    return I32_.from(this);
  }
  /**
   * Extends the low 4 lanes of an `i16x8` vector to 32 bits using signed extension.
   * Pops one vector and pushes a new vector where each lane is the sign-extended value of the corresponding low lane.
   */
  extend_low_i16x8_s() {
    this.push(byte`\xfd\xa7\x01`);
    return this;
  }
  /**
   * Extends the high 4 lanes of an `i16x8` vector to 32 bits using signed extension.
   * Pops one vector and pushes a new vector where each lane is the sign-extended value of the corresponding high lane.
   */
  extend_high_i16x8_s() {
    this.push(byte`\xfd\xa8\x01`);
    return this;
  }
  /**
   * Extends the low 4 lanes of an `i16x8` vector to 32 bits using zero extension.
   * Pops one vector and pushes a new vector where each lane is the zero-extended value of the corresponding low lane.
   */
  extend_low_i16x8_u() {
    this.push(byte`\xfd\xa9\x01`);
    return this;
  }
  /**
   * Extends the high 4 lanes of an `i16x8` vector to 32 bits using zero extension.
   * Pops one vector and pushes a new vector where each lane is the zero-extended value of the corresponding high lane.
   */
  extend_high_i16x8_u() {
    this.push(byte`\xfd\xaa\x01`);
    return this;
  }
  /**
   * Performs a bitwise left shift on each lane of an `i32x4` vector.
   * Pops one vector and a scalar value, shifts each lane left by the scalar value, and pushes the result.
   */
  shl(val) {
    if (val !== undefined) {
      this.push(InstrArray.bytes(val));
    }
    this.push(byte`\xfd\xab\x01`);
    return this;
  }
  /**
   * Performs an arithmetic right shift on each lane of an `i32x4` vector.
   * Pops one vector and a scalar value, shifts each lane right by the scalar value (sign-preserving), and pushes the result.
   */
  shr_s(val) {
    if (val !== undefined) {
      this.push(InstrArray.bytes(val));
    }
    this.push(byte`\xfd\xac\x01`);
    return this;
  }
  /**
   * Performs a logical right shift on each lane of an `i32x4` vector.
   * Pops one vector and a scalar value, shifts each lane right by the scalar value (zero-filling), and pushes the result.
   */
  shr_u(val) {
    if (val !== undefined) {
      this.push(InstrArray.bytes(val));
    }
    this.push(byte`\xfd\xad\x01`);
    return this;
  }
  /**
   * Adds corresponding lanes of two `i32x4` vectors.
   * Pops two vectors and pushes a new vector where each lane is the sum of the corresponding lanes.
   */
  add(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val));
    }
    this.push(byte`\xfd\xae\x01`);
    return this;
  }
  /**
   * Subtracts corresponding lanes of two `i32x4` vectors.
   * Pops two vectors and pushes a new vector where each lane is the difference of the corresponding lanes.
   */
  sub(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val));
    }
    this.push(byte`\xfd\xb1\x01`);
    return this;
  }
  /**
   * Multiplies corresponding lanes of two `i32x4` vectors.
   * Pops two vectors and pushes a new vector where each lane is the product of the corresponding lanes.
   */
  mul(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val));
    }
    this.push(byte`\xfd\xb5\x01`);
    return this;
  }
  /**
   * Computes the minimum of corresponding lanes of two `i32x4` vectors using signed comparison.
   * Pops two vectors and pushes a new vector where each lane is the minimum of the corresponding lanes.
   */
  min_s(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val));
    }
    this.push(byte`\xfd\xb6\x01`);
    return this;
  }
  /**
   * Computes the minimum of corresponding lanes of two `i32x4` vectors using unsigned comparison.
   * Pops two vectors and pushes a new vector where each lane is the minimum of the corresponding lanes.
   */
  min_u(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val));
    }
    this.push(byte`\xfd\xb7\x01`);
    return this;
  }
  /**
   * Computes the maximum of corresponding lanes of two `i32x4` vectors using signed comparison.
   * Pops two vectors and pushes a new vector where each lane is the maximum of the corresponding lanes.
   */
  max_s(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val));
    }
    this.push(byte`\xfd\xb8\x01`);
    return this;
  }
  /**
   * Computes the maximum of corresponding lanes of two `i32x4` vectors using unsigned comparison.
   * Pops two vectors and pushes a new vector where each lane is the maximum of the corresponding lanes.
   */
  max_u(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val));
    }
    this.push(byte`\xfd\xb9\x01`);
    return this;
  }
  /**
   * Computes the dot product of two `i16x8` vectors, producing an `i32x4` vector.
   * Pops two vectors, computes the dot product of adjacent pairs of lanes, and pushes the result as an `i32x4` vector.
   */
  dot_i16x8_s(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val));
    }
    this.push(byte`\xfd\xba\x01`);
    return this;
  }
  /**
   * Multiplies low 4 lanes of two `i16x8` vectors and extends the result to 32 bits using signed extension.
   * Pops two vectors and pushes a new vector where each lane is the sign-extended product of the corresponding low lanes.
   */
  extmul_low_i16x8_s(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val));
    }
    this.push(byte`\xfd\xbb\x01`);
    return this;
  }
  /**
   * Multiplies high 4 lanes of two `i16x8` vectors and extends the result to 32 bits using signed extension.
   * Pops two vectors and pushes a new vector where each lane is the sign-extended product of the corresponding high lanes.
   */
  extmul_high_i16x8_s(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val));
    }
    this.push(byte`\xfd\xbc\x01`);
    return this;
  }
  /**
   * Multiplies low 4 lanes of two `i16x8` vectors and extends the result to 32 bits using zero extension.
   * Pops two vectors and pushes a new vector where each lane is the zero-extended product of the corresponding low lanes.
   */
  extmul_low_i16x8_u(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val));
    }
    this.push(byte`\xfd\xbd\x01`);
    return this;
  }
  /**
   * Multiplies high 4 lanes of two `i16x8` vectors and extends the result to 32 bits using zero extension.
   * Pops two vectors and pushes a new vector where each lane is the zero-extended product of the corresponding high lanes.
   */
  extmul_high_i16x8_u(val) {
    if (val !== undefined) {
      this.push(I32x4.bytes(val));
    }
    this.push(byte`\xfd\xbe\x01`);
    return this;
  }
  /**
   * Converts each lane of an `f32x4` vector to a signed `i32x4` vector using saturation.
   * Pops one vector and pushes a new vector where each lane is truncated to `i32` with saturation if the result exceeds the range of `i32`.
   */
  trunc_sat_f32x4_s() {
    this.push(byte`\xfd\xf8\x01`);
    return this;
  }
  /**
   * Converts each lane of an `f32x4` vector to an unsigned `i32x4` vector using saturation.
   * Pops one vector and pushes a new vector where each lane is truncated to `u32` with saturation if the result exceeds the range of `u32`.
   */
  trunc_sat_f32x4_u() {
    this.push(byte`\xfd\xf9\x01`);
    return this;
  }
  /**
   * Converts the low two lanes of an `f64x2` vector to a signed `i32x4` vector using saturation.
   * Pops one vector and pushes a new vector where the low two lanes are truncated to `i32` with saturation, and the high two lanes are zeroed.
   */
  trunc_sat_f64x2_s_zero() {
    this.push(byte`\xfd\xfc\x01`);
    return this;
  }
  /**
   * Converts the low two lanes of an `f64x2` vector to an unsigned `i32x4` vector using saturation.
   * Pops one vector and pushes a new vector where the low two lanes are truncated to `u32` with saturation, and the high two lanes are zeroed.
   */
  trunc_sat_f64x2_u_zero() {
    this.push(byte`\xfd\xfd\x01`);
    return this;
  }
  /**
   * Converts each lane of an `i32x4` vector to an `f32x4` vector using signed conversion.
   * Pops one vector and pushes a new vector where each lane is converted to `f32`.
   */
  to_f32x4_s() {
    this.push(byte`\xfd\xfa\x01`);
    return F32x4_.from(this);
  }
  /**
   * Converts each lane of an `i32x4` vector to an `f32x4` vector using unsigned conversion.
   * Pops one vector and pushes a new vector where each lane is converted to `f32`.
   */
  to_f32x4_u() {
    this.push(byte`\xfd\xfb\x01`);
    return F32x4_.from(this);
  }
  /**
   * Converts the low two lanes of an `i32x4` vector to an `f64x2` vector using signed conversion.
   * Pops one vector and pushes a new vector where the low two lanes are converted to `f64`.
   */
  to_f64x2_s() {
    this.push(byte`\xfd\xfe\x01`);
    return F64x2_.from(this);
  }
  /**
   * Converts the low two lanes of an `i32x4` vector to an `f64x2` vector using unsigned conversion.
   * Pops one vector and pushes a new vector where the low two lanes are converted to `f64`.
   */
  to_f64x2_u() {
    this.push(byte`\xfd\xff\x01`);
    return F64x2_.from(this);
  }
  /**
   * Pushes a 128-bit constant vector onto the stack.
   * The immediate value is encoded as a vector of 4 32-bit values.
   */
  const(...vals) {
    console.assert(vals.length === 4);
    this.push([byte`\xfd\x0c`, encode_v128(vals)]);
    return this;
  }
}
/** @type {I32x4_} */
export const I32x4 = new Proxy(I32x4_, {
  get: (a, b) => {
    if (a[b] !== undefined) return a[b];
    return (..._) => (new a())[b](..._);
  },
});

class I64x2_ extends InstrArray {
  /**
   * Creates a 128-bit vector by replicating a 64-bit integer across all lanes.
   * Pops 1 value and splats it across all 2 lanes of the vector.
   */
  splat(val) {
    if (val !== undefined) {
      this.push(I64.bytes(val));
    }
    this.push(byte`\xfd\x12`);
    return this;
  }
  /**
   * Extracts a 64-bit integer from a specific lane of a 128-bit vector.
   * Pops a vector and pushes the extracted lane value as an i64.
   */
  extract_lane(index) {
    this.push([byte`\xfd\x1d`, index]);
    return I64_.from(this);
  }
  /**
   * Replaces a specific lane in a 128-bit vector with a new value.
   * Pops a vector and a scalar value, then replaces the specified lane and pushes the updated vector.
   */
  replace_lane(val, index) {
    if (val !== undefined) {
      this.push(InstrArray.bytes(val));
    }
    this.push([byte`\xfd\x1e`, index]);
    return this;
  }
  /**
   * Computes the absolute value of each lane in an `i64x2` vector.
   * Pops one vector and pushes a new vector where each lane is replaced by its absolute value.
   */
  abs() {
    this.push(byte`\xfd\xc0\x01`);
    return this;
  }
  /**
   * Negates each lane in an `i64x2` vector.
   * Pops one vector and pushes a new vector where each lane is replaced by its negated value.
   */
  neg() {
    this.push(byte`\xfd\xc1\x01`);
    return this;
  }
  /**
   * Checks if all lanes in an `i64x2` vector are non-zero.
   * Pops one vector and pushes `1` (true) if all lanes are non-zero, or `0` (false) otherwise.
   */
  all_true() {
    this.push(byte`\xfd\xc3\x01`);
    return this;
  }
  /**
   * Creates a bitmask from an `i64x2` vector.
   * Pops one vector and pushes an `i32` bitmask where each bit corresponds to the sign bit of a lane in the vector.
   */
  bitmask() {
    this.push(byte`\xfd\xc4\x01`);
    return this;
  }
  /**
   * Extends the low 2 lanes of an `i32x4` vector to 64 bits using signed extension.
   * Pops one vector and pushes a new vector where each lane is the sign-extended value of the corresponding low lane.
   */
  extend_low_i32x4_s() {
    this.push(byte`\xfd\xc7\x01`);
    return this;
  }
  /**
   * Extends the high 2 lanes of an `i32x4` vector to 64 bits using signed extension.
   * Pops one vector and pushes a new vector where each lane is the sign-extended value of the corresponding high lane.
   */
  extend_high_i32x4_s() {
    this.push(byte`\xfd\xc8\x01`);
    return this;
  }
  /**
   * Extends the low 2 lanes of an `i32x4` vector to 64 bits using zero extension.
   * Pops one vector and pushes a new vector where each lane is the zero-extended value of the corresponding low lane.
   */
  extend_low_i32x4_u() {
    this.push(byte`\xfd\xc9\x01`);
    return this;
  }
  /**
   * Extends the high 2 lanes of an `i32x4` vector to 64 bits using zero extension.
   * Pops one vector and pushes a new vector where each lane is the zero-extended value of the corresponding high lane.
   */
  extend_high_i32x4_u() {
    this.push(byte`\xfd\xca\x01`);
    return this;
  }
  /**
   * Performs a bitwise left shift on each lane of an `i64x2` vector.
   * Pops one vector and a scalar value, shifts each lane left by the scalar value, and pushes the result.
   */
  shl(val) {
    if (val !== undefined) {
      this.push(InstrArray.bytes(val));
    }
    this.push(byte`\xfd\xcb\x01`);
    return this;
  }
  /**
   * Performs an arithmetic right shift on each lane of an `i64x2` vector.
   * Pops one vector and a scalar value, shifts each lane right by the scalar value (sign-preserving), and pushes the result.
   */
  shr_s(val) {
    if (val !== undefined) {
      this.push(InstrArray.bytes(val));
    }
    this.push(byte`\xfd\xcc\x01`);
    return this;
  }
  /**
   * Performs a logical right shift on each lane of an `i64x2` vector.
   * Pops one vector and a scalar value, shifts each lane right by the scalar value (zero-filling), and pushes the result.
   */
  shr_u(val) {
    if (val !== undefined) {
      this.push(InstrArray.bytes(val));
    }
    this.push(byte`\xfd\xcd\x01`);
    return this;
  }
  /**
   * Adds corresponding lanes of two `i64x2` vectors.
   * Pops two vectors and pushes a new vector where each lane is the sum of the corresponding lanes.
   */
  add(val) {
    if (val !== undefined) {
      this.push(I64x2.bytes(val));
    }
    this.push(byte`\xfd\xce\x01`);
    return this;
  }
  /**
   * Subtracts corresponding lanes of two `i64x2` vectors.
   * Pops two vectors and pushes a new vector where each lane is the difference of the corresponding lanes.
   */
  sub(val) {
    if (val !== undefined) {
      this.push(I64x2.bytes(val));
    }
    this.push(byte`\xfd\xd1\x01`);
    return this;
  }
  /**
   * Multiplies corresponding lanes of two `i64x2` vectors.
   * Pops two vectors and pushes a new vector where each lane is the product of the corresponding lanes.
   */
  mul(val) {
    if (val !== undefined) {
      this.push(I64x2.bytes(val));
    }
    this.push(byte`\xfd\xd5\x01`);
    return this;
  }
  /**
   * Compares two `i64x2` vectors for equality (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if equal, or `0x0000000000000000` otherwise.
   */
  eq(val) {
    if (val !== undefined) {
      this.push(I64x2.bytes(val));
    }
    this.push(byte`\xfd\xd6\x01`);
    return this;
  }
  /**
   * Compares two `i64x2` vectors for inequality (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if not equal, or `0x0000000000000000` otherwise.
   */
  ne(val) {
    if (val !== undefined) {
      this.push(I64x2.bytes(val));
    }
    this.push(byte`\xfd\xd7\x01`);
    return this;
  }
  /**
   * Compares two `i64x2` vectors for signed less-than (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if `(a < b)`, or `0x0000000000000000` otherwise.
   */
  lt_s(val) {
    if (val !== undefined) {
      this.push(I64x2.bytes(val));
    }
    this.push(byte`\xfd\xd8\x01`);
    return this;
  }
  /**
   * Compares two `i64x2` vectors for signed greater-than (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if `(a > b)`, or `0x0000000000000000` otherwise.
   */
  gt_s(val) {
    if (val !== undefined) {
      this.push(I64x2.bytes(val));
    }
    this.push(byte`\xfd\xd9\x01`);
    return this;
  }
  /**
   * Compares two `i64x2` vectors for signed less-than-or-equal (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if `(a ≤ b)`, or `0x0000000000000000` otherwise.
   */
  le_s(val) {
    if (val !== undefined) {
      this.push(I64x2.bytes(val));
    }
    this.push(byte`\xfd\xda\x01`);
    return this;
  }
  /**
   * Compares two `i64x2` vectors for signed greater-than-or-equal (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if `(a ≥ b)`, or `0x0000000000000000` otherwise.
   */
  ge_s(val) {
    if (val !== undefined) {
      this.push(I64x2.bytes(val));
    }
    this.push(byte`\xfd\xdb\x01`);
    return this;
  }
  /**
   * Multiplies low 2 lanes of two `i32x4` vectors and extends the result to 64 bits using signed extension.
   * Pops two vectors and pushes a new vector where each lane is the sign-extended product of the corresponding low lanes.
   */
  extmul_low_i32x4_s(val) {
    if (val !== undefined) {
      this.push(I64x2.bytes(val));
    }
    this.push(byte`\xfd\xdc\x01`);
    return this;
  }
  /**
   * Multiplies high 2 lanes of two `i32x4` vectors and extends the result to 64 bits using signed extension.
   * Pops two vectors and pushes a new vector where each lane is the sign-extended product of the corresponding high lanes.
   */
  extmul_high_i32x4_s(val) {
    if (val !== undefined) {
      this.push(I64x2.bytes(val));
    }
    this.push(byte`\xfd\xdd\x01`);
    return this;
  }
  /**
   * Multiplies low 2 lanes of two `i32x4` vectors and extends the result to 64 bits using zero extension.
   * Pops two vectors and pushes a new vector where each lane is the zero-extended product of the corresponding low lanes.
   */
  extmul_low_i32x4_u(val) {
    if (val !== undefined) {
      this.push(I64x2.bytes(val));
    }
    this.push(byte`\xfd\xde\x01`);
    return this;
  }
  /**
   * Multiplies high 2 lanes of two `i32x4` vectors and extends the result to 64 bits using zero extension.
   * Pops two vectors and pushes a new vector where each lane is the zero-extended product of the corresponding high lanes.
   */
  extmul_high_i32x4_u(val) {
    if (val !== undefined) {
      this.push(I64x2.bytes(val));
    }
    this.push(byte`\xfd\xdf\x01`);
    return this;
  }
  /**
   * Pushes a 128-bit constant vector onto the stack.
   * The immediate value is encoded as a vector of 2 64-bit values.
   */
  const(...vals) {
    console.assert(vals.length === 2);
    this.push([byte`\xfd\x0c`, encode_v128(vals)]);
    return this;
  }
}
/** @type {I64x2_} */
export const I64x2 = new Proxy(I64x2_, {
  get: (a, b) => {
    if (a[b] !== undefined) return a[b];
    return (..._) => (new a())[b](..._);
  },
});

class F32x4_ extends InstrArray {
  /**
   * Creates a 128-bit vector by replicating a 32-bit float across all lanes.
   * Pops 1 value and splats it across all 4 lanes of the vector.
   */
  splat(val) {
    if (val !== undefined) {
      this.push(F32.bytes(val));
    }
    this.push(byte`\xfd\x13`);
    return this;
  }
  /**
   * Extracts a 32-bit float from a specific lane of a 128-bit vector.
   * Pops a vector and pushes the extracted lane value as an f32.
   */
  extract_lane(index) {
    this.push([byte`\xfd\x1f`, index]);
    return F32_.from(this);
  }
  /**
   * Replaces a specific lane in a 128-bit vector with a new value.
   * Pops a vector and a scalar value, then replaces the specified lane and pushes the updated vector.
   */
  replace_lane(val, index) {
    if (val !== undefined) {
      this.push(InstrArray.bytes(val));
    }
    this.push([byte`\xfd\x20`, index]);
    return this;
  }
  /**
   * Compares two 128-bit vectors of 32-bit floats for equality (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if equal, or `0x00000000` otherwise.
   */
  eq(val) {
    if (val !== undefined) {
      this.push(F32x4.bytes(val));
    }
    this.push(byte`\xfd\x41`);
    return this;
  }
  /**
   * Compares two 128-bit vectors of 32-bit floats for inequality (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if not equal, or `0x00000000` otherwise.
   */
  ne(val) {
    if (val !== undefined) {
      this.push(F32x4.bytes(val));
    }
    this.push(byte`\xfd\x42`);
    return this;
  }
  /**
   * Compares two 128-bit vectors of 32-bit floats for less-than (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if `(a < b)`, or `0x00000000` otherwise.
   */
  lt(val) {
    if (val !== undefined) {
      this.push(F32x4.bytes(val));
    }
    this.push(byte`\xfd\x43`);
    return this;
  }
  /**
   * Compares two 128-bit vectors of 32-bit floats for greater-than (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if `(a > b)`, or `0x00000000` otherwise.
   */
  gt(val) {
    if (val !== undefined) {
      this.push(F32x4.bytes(val));
    }
    this.push(byte`\xfd\x44`);
    return this;
  }
  /**
   * Compares two 128-bit vectors of 32-bit floats for less-than-or-equal (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if `(a ≤ b)`, or `0x00000000` otherwise.
   */
  le(val) {
    if (val !== undefined) {
      this.push(F32x4.bytes(val));
    }
    this.push(byte`\xfd\x45`);
    return this;
  }
  /**
   * Compares two 128-bit vectors of 32-bit floats for greater-than-or-equal (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if `(a ≥ b)`, or `0x00000000` otherwise.
   */
  ge(val) {
    if (val !== undefined) {
      this.push(F32x4.bytes(val));
    }
    this.push(byte`\xfd\x46`);
    return this;
  }
  /**
   * Converts two 64-bit floats in a `f64x2` vector to two 32-bit floats in an `f32x4` vector.
   * The high lanes of the result are set to zero.
   * Pops one vector and pushes the converted vector.
   */
  demote_f64x2_zero() {
    this.push(byte`\xfd\x5e`);
    return this;
  }
  /**
   * Rounds each lane of an `f32x4` vector up to the nearest integer.
   * Pops one vector and pushes a new vector where each lane is rounded up.
   */
  ceil() {
    this.push(byte`\xfd\x67`);
    return this;
  }
  /**
   * Rounds each lane of an `f32x4` vector down to the nearest integer.
   * Pops one vector and pushes a new vector where each lane is rounded down.
   */
  floor() {
    this.push(byte`\xfd\x68`);
    return this;
  }
  /**
   * Truncates each lane of an `f32x4` vector toward zero.
   * Pops one vector and pushes a new vector where each lane is truncated.
   */
  trunc() {
    this.push(byte`\xfd\x69`);
    return this;
  }
  /**
   * Rounds each lane of an `f32x4` vector to the nearest integer (ties to even).
   * Pops one vector and pushes a new vector where each lane is rounded.
   */
  nearest() {
    this.push(byte`\xfd\x6a`);
    return this;
  }
  /**
   * Computes the absolute value of each lane in an `f32x4` vector.
   * Pops one vector and pushes a new vector where each lane is replaced by its absolute value.
   */
  abs() {
    this.push(byte`\xfd\xe0\x01`);
    return this;
  }
  /**
   * Negates each lane in an `f32x4` vector.
   * Pops one vector and pushes a new vector where each lane is replaced by its negated value.
   */
  neg() {
    this.push(byte`\xfd\xe1\x01`);
    return this;
  }
  /**
   * Computes the square root of each lane in an `f32x4` vector.
   * Pops one vector and pushes a new vector where each lane is replaced by its square root.
   */
  sqrt() {
    this.push(byte`\xfd\xe3\x01`);
    return this;
  }
  /**
   * Adds corresponding lanes of two `f32x4` vectors.
   * Pops two vectors and pushes a new vector where each lane is the sum of the corresponding lanes.
   */
  add(val) {
    if (val !== undefined) {
      this.push(F32x4.bytes(val));
    }
    this.push(byte`\xfd\xe4\x01`);
    return this;
  }
  /**
   * Subtracts corresponding lanes of two `f32x4` vectors.
   * Pops two vectors and pushes a new vector where each lane is the difference of the corresponding lanes.
   */
  sub(val) {
    if (val !== undefined) {
      this.push(F32x4.bytes(val));
    }
    this.push(byte`\xfd\xe5\x01`);
    return this;
  }
  /**
   * Multiplies corresponding lanes of two `f32x4` vectors.
   * Pops two vectors and pushes a new vector where each lane is the product of the corresponding lanes.
   */
  mul(val) {
    if (val !== undefined) {
      this.push(F32x4.bytes(val));
    }
    this.push(byte`\xfd\xe6\x01`);
    return this;
  }
  /**
   * Divides corresponding lanes of two `f32x4` vectors.
   * Pops two vectors and pushes a new vector where each lane is the quotient of the corresponding lanes.
   */
  div(val) {
    if (val !== undefined) {
      this.push(F32x4.bytes(val));
    }
    this.push(byte`\xfd\xe7\x01`);
    return this;
  }
  /**
   * Computes the minimum of corresponding lanes of two `f32x4` vectors.
   * Pops two vectors and pushes a new vector where each lane is the minimum of the corresponding lanes.
   */
  min(val) {
    if (val !== undefined) {
      this.push(F32x4.bytes(val));
    }
    this.push(byte`\xfd\xe8\x01`);
    return this;
  }
  /**
   * Computes the maximum of corresponding lanes of two `f32x4` vectors.
   * Pops two vectors and pushes a new vector where each lane is the maximum of the corresponding lanes.
   */
  max(val) {
    if (val !== undefined) {
      this.push(F32x4.bytes(val));
    }
    this.push(byte`\xfd\xe9\x01`);
    return this;
  }
  /**
   * Computes the pairwise minimum of two `f32x4` vectors.
   * Pops two vectors and pushes a new vector where each lane is the minimum of the corresponding lanes, propagating NaNs.
   */
  pmin(val) {
    if (val !== undefined) {
      this.push(F32x4.bytes(val));
    }
    this.push(byte`\xfd\xea\x01`);
    return this;
  }
  /**
   * Computes the pairwise maximum of two `f32x4` vectors.
   * Pops two vectors and pushes a new vector where each lane is the maximum of the corresponding lanes, propagating NaNs.
   */
  pmax(val) {
    if (val !== undefined) {
      this.push(F32x4.bytes(val));
    }
    this.push(byte`\xfd\xeb\x01`);
    return this;
  }
  /**
   * Converts each lane of an `i32x4` vector to an `f32x4` vector using signed conversion.
   * Pops one vector and pushes a new vector where each lane is converted to `f32`.
   */
  convert_i32x4_s() {
    this.push(byte`\xfd\xfa\x01`);
    return this;
  }
  /**
   * Converts each lane of an `i32x4` vector to an `f32x4` vector using unsigned conversion.
   * Pops one vector and pushes a new vector where each lane is converted to `f32`.
   */
  convert_i32x4_u() {
    this.push(byte`\xfd\xfb\x01`);
    return this;
  }
  /**
   * Converts each lane of an `f32x4` vector to a signed `i32x4` vector using saturation.
   * Pops one vector and pushes a new vector where each lane is truncated to `i32` with saturation if the result exceeds the range of `i32`.
   */
  to_i32x4() {
    this.push(byte`\xfd\xf8\x01`);
    return I32x4_.from(this);
  }
  /**
   * Converts each lane of an `f32x4` vector to an unsigned `i32x4` vector using saturation.
   * Pops one vector and pushes a new vector where each lane is truncated to `u32` with saturation if the result exceeds the range of `u32`.
   */
  to_u32x4() {
    this.push(byte`\xfd\xf9\x01`);
    return I32x4_.from(this);
  }
  /**
   * Converts the low two 32-bit floats in an `f32x4` vector to two 64-bit floats in an `f64x2` vector.
   * Pops one vector and pushes the converted vector.
   */
  to_f64x2() {
    this.push(byte`\xfd\x5f`);
    return F64x2_.from(this);
  }
  /**
   * Pushes a 128-bit constant vector onto the stack.
   * The immediate value is encoded as a vector of 4 32-bit float values.
   */
  const(...vals) {
    console.assert(vals.length === 4);
    this.push([byte`\xfd\x0c`, encode_v128(vals)]);
    return this;
  }
}
/** @type {F32x4_} */
export const F32x4 = new Proxy(F32x4_, {
  get: (a, b) => {
    if (a[b] !== undefined) return a[b];
    return (..._) => (new a())[b](..._);
  },
});

class F64x2_ extends InstrArray {
  /**
   * Creates a 128-bit vector by replicating a 64-bit float across all lanes.
   * Pops 1 value and splats it across all 2 lanes of the vector.
   */
  splat(val) {
    if (val !== undefined) {
      this.push(F64.bytes(val));
    }
    this.push(byte`\xfd\x14`);
    return this;
  }
  /**
   * Extracts a 64-bit float from a specific lane of a 128-bit vector.
   * Pops a vector and pushes the extracted lane value as an f64.
   */
  extract_lane(index) {
    this.push([byte`\xfd\x21`, index]);
    return this;
  }
  /**
   * Replaces a specific lane in a 128-bit vector with a new value.
   * Pops a vector and a scalar value, then replaces the specified lane and pushes the updated vector.
   */
  replace_lane(index) {
    this.push([byte`\xfd\x22`, index]);
    return this;
  }
  /**
   * Compares two 128-bit vectors of 64-bit floats for equality (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if equal, or `0x0000000000000000` otherwise.
   */
  eq(val) {
    if (val !== undefined) {
      this.push(F64x2.bytes(val));
    }
    this.push(byte`\xfd\x47`);
    return this;
  }
  /**
   * Compares two 128-bit vectors of 64-bit floats for inequality (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if not equal, or `0x0000000000000000` otherwise.
   */
  ne(val) {
    if (val !== undefined) {
      this.push(F64x2.bytes(val));
    }
    this.push(byte`\xfd\x48`);
    return this;
  }
  /**
   * Compares two 128-bit vectors of 64-bit floats for less-than (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if `(a < b)`, or `0x0000000000000000` otherwise.
   */
  lt(val) {
    if (val !== undefined) {
      this.push(F64x2.bytes(val));
    }
    this.push(byte`\xfd\x49`);
    return this;
  }
  /**
   * Compares two 128-bit vectors of 64-bit floats for greater-than (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if `(a > b)`, or `0x0000000000000000` otherwise.
   */
  gt(val) {
    if (val !== undefined) {
      this.push(F64x2.bytes(val));
    }
    this.push(byte`\xfd\x4a`);
    return this;
  }
  /**
   * Compares two 128-bit vectors of 64-bit floats for less-than-or-equal (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if `(a ≤ b)`, or `0x0000000000000000` otherwise.
   */
  le(val) {
    if (val !== undefined) {
      this.push(F64x2.bytes(val));
    }
    this.push(byte`\xfd\x4b`);
    return this;
  }
  /**
   * Compares two 128-bit vectors of 64-bit floats for greater-than-or-equal (per-lane).
   * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if `(a ≥ b)`, or `0x0000000000000000` otherwise.
   */
  ge(val) {
    if (val !== undefined) {
      this.push(F64x2.bytes(val));
    }
    this.push(byte`\xfd\x4c`);
    return this;
  }
  /**
   * Converts the low two 32-bit floats in an `f32x4` vector to two 64-bit floats in an `f64x2` vector.
   * Pops one vector and pushes the converted vector.
   */
  promote_low_f32x4() {
    this.push(byte`\xfd\x5f`);
    return this;
  }
  /**
   * Rounds each lane of an `f64x2` vector up to the nearest integer.
   * Pops one vector and pushes a new vector where each lane is rounded up.
   */
  ceil() {
    this.push(byte`\xfd\x74`);
    return this;
  }
  /**
   * Rounds each lane of an `f64x2` vector down to the nearest integer.
   * Pops one vector and pushes a new vector where each lane is rounded down.
   */
  floor() {
    this.push(byte`\xfd\x75`);
    return this;
  }
  /**
   * Truncates each lane of an `f64x2` vector toward zero.
   * Pops one vector and pushes a new vector where each lane is truncated.
   */
  trunc() {
    this.push(byte`\xfd\x7a`);
    return this;
  }
  /**
   * Rounds each lane of an `f64x2` vector to the nearest integer (ties to even).
   * Pops one vector and pushes a new vector where each lane is rounded.
   */
  nearest() {
    this.push(byte`\xfd\x94\x01`);
    return this;
  }
  /**
   * Computes the absolute value of each lane in an `f64x2` vector.
   * Pops one vector and pushes a new vector where each lane is replaced by its absolute value.
   */
  abs() {
    this.push(byte`\xfd\xec\x01`);
    return this;
  }
  /**
   * Negates each lane in an `f64x2` vector.
   * Pops one vector and pushes a new vector where each lane is replaced by its negated value.
   */
  neg() {
    this.push(byte`\xfd\xed\x01`);
    return this;
  }
  /**
   * Computes the square root of each lane in an `f64x2` vector.
   * Pops one vector and pushes a new vector where each lane is replaced by its square root.
   */
  sqrt() {
    this.push(byte`\xfd\xef\x01`);
    return this;
  }
  /**
   * Adds corresponding lanes of two `f64x2` vectors.
   * Pops two vectors and pushes a new vector where each lane is the sum of the corresponding lanes.
   */
  add(val) {
    if (val !== undefined) {
      this.push(F64x2.bytes(val));
    }
    this.push(byte`\xfd\xf0\x01`);
    return this;
  }
  /**
   * Subtracts corresponding lanes of two `f64x2` vectors.
   * Pops two vectors and pushes a new vector where each lane is the difference of the corresponding lanes.
   */
  sub(val) {
    if (val !== undefined) {
      this.push(F64x2.bytes(val));
    }
    this.push(byte`\xfd\xf1\x01`);
    return this;
  }
  /**
   * Multiplies corresponding lanes of two `f64x2` vectors.
   * Pops two vectors and pushes a new vector where each lane is the product of the corresponding lanes.
   */
  mul(val) {
    if (val !== undefined) {
      this.push(F64x2.bytes(val));
    }
    this.push(byte`\xfd\xf2\x01`);
    return this;
  }
  /**
   * Divides corresponding lanes of two `f64x2` vectors.
   * Pops two vectors and pushes a new vector where each lane is the quotient of the corresponding lanes.
   */
  div(val) {
    if (val !== undefined) {
      this.push(F64x2.bytes(val));
    }
    this.push(byte`\xfd\xf3\x01`);
    return this;
  }
  /**
   * Computes the minimum of corresponding lanes of two `f64x2` vectors.
   * Pops two vectors and pushes a new vector where each lane is the minimum of the corresponding lanes.
   */
  min(val) {
    if (val !== undefined) {
      this.push(F64x2.bytes(val));
    }
    this.push(byte`\xfd\xf4\x01`);
    return this;
  }
  /**
   * Computes the maximum of corresponding lanes of two `f64x2` vectors.
   * Pops two vectors and pushes a new vector where each lane is the maximum of the corresponding lanes.
   */
  max(val) {
    if (val !== undefined) {
      this.push(F64x2.bytes(val));
    }
    this.push(byte`\xfd\xf5\x01`);
    return this;
  }
  /**
   * Computes the pairwise minimum of two `f64x2` vectors.
   * Pops two vectors and pushes a new vector where each lane is the minimum of the corresponding lanes, propagating NaNs.
   */
  pmin(val) {
    if (val !== undefined) {
      this.push(F64x2.bytes(val));
    }
    this.push(byte`\xfd\xf6\x01`);
    return this;
  }
  /**
   * Computes the pairwise maximum of two `f64x2` vectors.
   * Pops two vectors and pushes a new vector where each lane is the maximum of the corresponding lanes, propagating NaNs.
   */
  pmax(val) {
    if (val !== undefined) {
      this.push(F64x2.bytes(val));
    }
    this.push(byte`\xfd\xf7\x01`);
    return this;
  }
  /**
   * Converts the low two lanes of an `i32x4` vector to an `f64x2` vector using signed conversion.
   * Pops one vector and pushes a new vector where the low two lanes are converted to `f64`.
   */
  convert_low_i32x4_s() {
    this.push(byte`\xfd\xfe\x01`);
    return this;
  }
  /**
   * Converts the low two lanes of an `i32x4` vector to an `f64x2` vector using unsigned conversion.
   * Pops one vector and pushes a new vector where the low two lanes are converted to `f64`.
   */
  convert_low_i32x4_u() {
    this.push(byte`\xfd\xff\x01`);
    return this;
  }
  /**
   * Converts the low two lanes of an `f64x2` vector to a signed `i32x4` vector using saturation.
   * Pops one vector and pushes a new vector where the low two lanes are truncated to `i32` with saturation, and the high two lanes are zeroed.
   */
  to_i32x4() {
    this.push(byte`\xfd\xfc\x01`);
    return this;
  }
  /**
   * Converts the low two lanes of an `f64x2` vector to an unsigned `i32x4` vector using saturation.
   * Pops one vector and pushes a new vector where the low two lanes are truncated to `u32` with saturation, and the high two lanes are zeroed.
   */
  to_u32x4() {
    this.push(byte`\xfd\xfd\x01`);
    return this;
  }
  /**
   * Pushes a 128-bit constant vector onto the stack.
   * The immediate value is encoded as a vector of 2 64-bit float values.
   */
  const(...vals) {
    console.assert(vals.length === 2);
    this.push([byte`\xfd\x0c`, encode_v128(vals)]);
    return this;
  }
}
/** @type {F64x2_} */
export const F64x2 = new Proxy(F64x2_, {
  get: (a, b) => {
    if (a[b] !== undefined) return a[b];
    return (..._) => (new a())[b](..._);
  },
});
