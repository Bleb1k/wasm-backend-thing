import { byte } from "./helpers.js";
import { encode_v128, encodeIEEE754, encodeLEB128, Type } from "./lib.js";

/**
 * Manually transcribed 436 wasm instructions!
 * And each commented by an AI!
 *
 * TODO: make each function into it's own function with checks and whatnot
 */
export default {
  /**
   * Unreachable opcode: Indicates an invalid or undefined state.
   * Traps the program when executed.
   */
  unreachable: byte`\x00`,
  /**
   * No-operation opcode: Does nothing.
   * Used as a placeholder or for alignment purposes.
   */
  nop: byte`\x01`,
  /**
   * Begins a block construct.
   * Defines a nested scope with a label for control flow (e.g., branching).
   */
  block: (type, ...ops) => [[byte`\x02`, { blocktype: type }], ...ops, byte`\x0b`],
  /**
   * Begins a loop construct. Must have function type index or 0x40 (void) right after.
   * Similar to `block`, but allows backward branches (loops).
   */
  loop: (type, ...ops) => [[byte`\x03`, { blocktype: type }], ...ops, byte`\x0b`],
  /**
   * Pops value from the stack. Begins an if construct.
   * Executes one branch if the condition is true, and optionally another branch if false.1
   */
  if: (type, ...ops) => {
    let result = [[byte`\x04`, { blocktype: type }], ...ops]
    result.else = (...else_ops) => [...result, byte`\x05`, ...else_ops]
    return result
  },
  /**
   * Marks the beginning of the "else" branch in an if-else construct.
   * Used to define the alternative branch when the condition is false.
   * @deprecated Use `if(type, ...ops).else(...ops)`
   */
  else: byte`\x05`,
  /**
   * Ends a block, loop, or if construct.
   * Closes the current scope and exits the construct.
   * @deprecated End is automatically inserted where it needs to be.
   */
  end: byte`\x0b`,
  /**
   * Branches to a labeled block, loop, or if construct.
   * For block, it jumps to the end; for loops, it jumps to first instruction.
   */
  br: (level) => [byte`\x0c`, level],
  /**
   * Conditionally branches to a labeled construct.
   * Pops a value from the stack; if the value is non-zero, branches to the target.
   */
  br_if: (level) => [byte`\x0d`, level],
  /**
   * Implements a multi-way branch.
   * Pops an index from the stack and branches to the corresponding label in a table of targets.
   */
  br_table: (...levels) => [byte`\x0e`, [levels.length, ...levels, 0]],
  /**
   * Returns from the current function.
   * Pops values from the stack and returns them as the function's result(s).
   */
  return: byte`\x0f`,
  /**
   * Calls a function by its index.
   * Pushes arguments onto the stack, invokes the function, and pushes its results back onto the stack.
   */
  call: (index) => [byte`\x10`, index],
  /**
   * Calls a function indirectly through a table.
   * Uses a function index from the table and verifies its type matches the expected signature.
   */
  call_indirect: (table_index, functype = Type.Func()) =>
    [byte`\x11`, { functype }, encodeLEB128("u32", table_index)],
  /**
   * Drops the top value from the stack.
   * Removes the top element without using it.
   */
  drop: byte`\x1a`,
  /**
   * Selects one of two values based on a condition.
   * Pops two values and a condition from the stack; pushes the first value if condition is true, otherwise the second.
   */
  select: (type = Type.result) => type === Type.result ? byte`\x1b` : [byte`\x1c`, 1, type],
  /**
   * Typed version of `select`.
   * Similar to `select`, but explicitly specifies the type of the values being selected.
   * @deprecated use select(Type.\<valtype>)
   */
  selectt: byte`\x1c`,
  local: {
    /**
     * Reads a value from a local variable.
     * Pushes the value of the specified local variable onto the stack.
     */
    get: (index) => [byte`\x20`, index],
    /**
     * Writes a value to a local variable.
     * Pops a value from the stack and stores it in the specified local variable.
     */
    set: (index) => [byte`\x21`, index],
    /**
     * Writes a value to a local variable and leaves it on the stack.
     * Pops a value from the stack, stores it in the specified local variable, and pushes the same value back onto the stack.
     */
    tee: (index) => [byte`\x22`, index],
  },
  global: {
    /**
     * Reads a value from a global variable.
     * Pushes the value of the specified global variable onto the stack.
     */
    get: (index) => [byte`\x23`, index],
    /**
     * Writes a value to a global variable.
     * Pops a value from the stack and stores it in the specified global variable.
     */
    set: (index) => [byte`\x24`, index],
  },
  table: {
    /**
     * Reads a value from a table.
     * Pushes the value at the specified index in the table onto the stack.
     */
    get: (index) => [byte`\x25`, encodeLEB128("u32", index)],
    /**
     * Writes a value to a table.
     * Pops a value and an index from the stack, and stores the value at the specified index in the table.
     */
    set: (index) => [byte`\x26`, encodeLEB128("u32", index)],
    /**
     * Initializes a table with elements from a passive element segment.
     * Pops: dest (i32), src (i32), len (i32).
     * Copies `len` elements from the passive element segment to the table at `dest`.
     */
    init: (passive_element_index, data_index) => [
      byte`\xfc\x0c`,
      encodeLEB128("u32", passive_element_index),
      encodeLEB128("u32", data_index),
    ],
    /**
     * Copies elements within a table or between two tables.
     * Pops: dest (i32), src (i32), len (i32).
     * Copies `len` elements from the table at `src` to the table at `dest`.
     */
    copy: (dst_index, src_index) => [
      byte`\xfc\x0e`,
      encodeLEB128("u32", src_index ?? dst_index),
      encodeLEB128("u32", dst_index),
    ],
    /**
     * Grows a table by a given number of elements.
     * Pops: n (i32), init_value (ref).
     * Pushes the previous size of the table as i32.
     * Adds `n` copies of `init_value` to the end of the table.
     */
    grow: (index) => [byte`\xfc\x0f`, encodeLEB128("u32", index)],
    /**
     * Gets the current size of a table.
     * Pushes the number of elements in the table as i32.
     */
    size: (index) => [byte`\xfc\x10`, encodeLEB128("u32", index)],
    /**
     * Fills a region of a table with a repeated reference value.
     * Pops: dest (i32), value (ref), len (i32).
     * Writes `len` copies of `value` to the table starting at `dest`.
     */
    fill: (index) => [byte`\xfc\x11`, encodeLEB128("u32", index)],
  },
  /**
   * Drops a passive element segment, making it inaccessible.
   * Passive element segments can no longer be used after this operation.
   */
  elem_drop: (index) => [byte`\xfc\x0d`, encodeLEB128("u32", index)],
  memory: {
    /**
     * Pushes the current size of the default linear memory (in 64KB pages) as an i32.
     * Example: (memory_size) → pushes the number of pages allocated.
     */
    size: (index = 0) => [byte`\x3f`, index],
    /**
     * Grows the default linear memory by N 64KB pages (popped as i32).
     * Pushes the previous memory size (in pages) as i32, or -1 if growth failed.
     * Traps if the input value is invalid (e.g., exceeds max memory limits).
     */
    grow: (index = 0) => [byte`\x40`, index],
    /**
     * Initializes a region of linear memory with data from a passive data segment.
     * Pops: dest (i32), src (i32), len (i32).
     * Copies `len` bytes from the passive data segment to memory at `dest`.
     */
    init: (data_index = 0, mem_index = 0) => [byte`\xfc\x08`, data_index, mem_index],
    /**
     * Copies data within linear memory.
     * Pops: dest (i32), src (i32), len (i32).
     * Copies `len` bytes from memory at `src` to memory at `dest`.
     */
    copy: (dst_mem_index = 0, src_mem_index = 0) =>
      [byte`\xfc\x0a`, src_mem_index, dst_mem_index],
    /**
     * Fills a region of linear memory with a repeated byte value.
     * Pops: dest (i32), value (i32), len (i32).
     * Writes `len` copies of `value & 0xFF` to memory starting at `dest`.
     */
    fill: (index = 0) => [byte`\xfc\x0b`, index],
  },
  /**
   * Drops a passive data segment, making it inaccessible.
   * Passive data segments can no longer be used after this operation.
   */
  data_drop: (index) => [byte`\xfc\x09`, index],
  I32: {
    /**
     * Loads an i32 value from linear memory at the address popped from the stack.
     * Requires 4-byte alignment. Traps on out-of-bounds or misalignment.
     * Requires alignment byte and offset byte right after.
     */
    load: (offset = 0) => [byte`\x28`, 4, encodeLEB128("u32", offset)],
    /**
     * Loads an 8-bit value from linear memory, sign-extends it to i32.
     * Pops address from stack. Requires 1-byte alignment. Traps on out-of-bounds.
     * Requires alignment byte and offset byte right after.
     */
    load8_s: (offset = 0) => [byte`\x2c`, 1, encodeLEB128("u32", offset)],
    /**
     * Loads an 8-bit value from linear memory, zero-extends it to i32.
     * Pops address from stack. Requires 1-byte alignment. Traps on out-of-bounds.
     * Requires alignment byte and offset byte right after.
     */
    load8_u: (offset = 0) => [byte`\x2d`, 1, encodeLEB128("u32", offset)],
    /**
     * Loads a 16-bit value from linear memory, sign-extends it to i32.
     * Pops address from stack. Requires 2-byte alignment. Traps on out-of-bounds.
     * Requires alignment byte and offset byte right after.
     */
    load16_s: (offset = 0) => [byte`\x2e`, 2, encodeLEB128("u32", offset)],
    /**
     * Loads a 16-bit value from linear memory, zero-extends it to i32.
     * Pops address from stack. Requires 2-byte alignment. Traps on out-of-bounds.
     * Requires alignment byte and offset byte right after.
     */
    load16_u: (offset = 0) => [byte`\x2f`, 2, encodeLEB128("u32", offset)],
    /**
     * Stores an i32 value into linear memory at address popped from stack.
     * Pops value then address. Requires 4-byte alignment. Traps on out-of-bounds.
     * Requires alignment byte and offset byte right after.
     */
    store: (offset = 0) => [byte`\x36`, 4, encodeLEB128("u32", offset)],
    /**
     * Stores the low 8 bits of an i32 value into memory.
     * Pops value then address. Requires 1-byte alignment. Traps on out-of-bounds.
     * Requires alignment byte and offset byte right after.
     */
    store8: (offset = 0) => [byte`\x3a`, 1, encodeLEB128("u32", offset)],
    /**
     * Stores the low 16 bits of an i32 value into memory.
     * Pops value then address. Requires 2-byte alignment. Traps on out-of-bounds.
     * Requires alignment byte and offset byte right after.
     */
    store16: (offset = 0) => [byte`\x3b`, 2, encodeLEB128("u32", offset)],
    /**
     * Pushes a 32-bit integer constant onto the stack.
     * The immediate value is encoded as a signed LEB128.
     */
    const: (num = 0, type = "i32") => [byte`\x41`, encodeLEB128(type, num)],
    /**
     * Checks if the top i32 value is zero.
     * Pops 1 value, pushes 1 (if zero) or 0 (non-zero) as i32.
     */
    eqz: byte`\x45`,
    /**
     * Equality comparison for i32.
     * Pops 2 values, pushes 1 if equal, else 0.
     */
    eq: byte`\x46`,
    /**
     * Inequality comparison for i32.
     * Pops 2 values, pushes 1 if not equal, else 0.
     */
    ne: byte`\x47`,
    /**
     * Signed less-than comparison for i32.
     * Pops 2 values, pushes 1 if (a < b) signed, else 0.
     */
    lt_s: byte`\x48`,
    /**
     * Unsigned less-than comparison for i32.
     * Pops 2 values, pushes 1 if (a < b) unsigned, else 0.
     */
    lt_u: byte`\x49`,
    /**
     * Signed greater-than comparison for i32.
     * Pops 2 values, pushes 1 if (a > b) signed, else 0.
     */
    gt_s: byte`\x4a`,
    /**
     * Unsigned greater-than comparison for i32.
     * Pops 2 values, pushes 1 if (a > b) unsigned, else 0.
     */
    gt_u: byte`\x4b`,
    /**
     * Signed less-than-or-equal comparison for i32.
     * Pops 2 values, pushes 1 if (a ≤ b) signed, else 0.
     */
    le_s: byte`\x4c`,
    /**
     * Unsigned less-than-or-equal comparison for i32.
     * Pops 2 values, pushes 1 if (a ≤ b) unsigned, else 0.
     */
    le_u: byte`\x4d`,
    /**
     * Signed greater-than-or-equal comparison for i32.
     * Pops 2 values, pushes 1 if (a ≥ b) signed, else 0.
     */
    ge_s: byte`\x4e`,
    /**
     * Unsigned greater-than-or-equal comparison for i32.
     * Pops 2 values, pushes 1 if (a ≥ b) unsigned, else 0.
     */
    ge_u: byte`\x4f`,
    /**
     * Counts leading zero bits in i32.
     * Pops 1 value, pushes the count of leading zeros (0-32) as i32.
     */
    clz: byte`\x67`,
    /**
     * Counts trailing zero bits in i32.
     * Pops 1 value, pushes the count of trailing zeros (0-32) as i32.
     */
    ctz: byte`\x68`,
    /**
     * Counts the number of set bits (1s) in i32.
     * Pops 1 value, pushes the population count as i32.
     */
    popcnt: byte`\x69`,
    /**
     * Integer addition for i32.
     * Pops 2 values, pushes (a + b) as i32 (wraps on overflow).
     */
    add: byte`\x6a`,
    /**
     * Integer subtraction for i32.
     * Pops 2 values, pushes (a - b) as i32 (wraps on overflow).
     */
    sub: byte`\x6b`,
    /**
     * Integer multiplication for i32.
     * Pops 2 values, pushes (a * b) as i32 (wraps on overflow).
     */
    mul: byte`\x6c`,
    /**
     * Signed integer division for i32.
     * Pops 2 values, pushes (a / b) as i32.
     * Traps if b = 0 or division overflows (e.g., INT32_MIN / -1).
     */
    div_s: byte`\x6d`,
    /**
     * Unsigned integer division for i32.
     * Pops 2 values, pushes (a / b) as i32.
     * Traps if b = 0.
     */
    div_u: byte`\x6e`,
    /**
     * Signed integer remainder for i32.
     * Pops 2 values, pushes (a % b) as i32.
     * Traps if b = 0 or division overflows (e.g., INT32_MIN % -1).
     */
    rem_s: byte`\x6f`,
    /**
     * Unsigned integer remainder for i32.
     * Pops 2 values, pushes (a % b) as i32.
     * Traps if b = 0.
     */
    rem_u: byte`\x70`,
    /**
     * Bitwise AND for i32.
     * Pops 2 values, pushes (a & b) as i32.
     */
    and: byte`\x71`,
    /**
     * Bitwise OR for i32.
     * Pops 2 values, pushes (a | b) as i32.
     */
    or: byte`\x72`,
    /**
     * Bitwise XOR for i32.
     * Pops 2 values, pushes (a ^ b) as i32.
     */
    xor: byte`\x73`,
    /**
     * Logical left shift for i32.
     * Pops 2 values (a, b), pushes (a << (b % 32)) as i32.
     */
    shl: byte`\x74`,
    /**
     * Arithmetic right shift for i32 (sign-preserving).
     * Pops 2 values (a, b), pushes (a >> (b % 32)) as i32.
     */
    shr_s: byte`\x75`,
    /**
     * Logical right shift for i32 (zero-filling).
     * Pops 2 values (a, b), pushes (a >>> (b % 32)) as i32.
     */
    shr_u: byte`\x76`,
    /**
     * Bitwise rotate left for i32.
     * Pops 2 values (a, b), rotates bits left by (b % 32) positions.
     */
    rotl: byte`\x77`,
    /**
     * Bitwise rotate right for i32.
     * Pops 2 values (a, b), rotates bits right by (b % 32) positions.
     */
    rotr: byte`\x78`,
    /**
     * Wraps i64 to i32 (discards high 32 bits).
     * Pops 1 i64 value, pushes low 32 bits as i32.
     */
    wrap_i64: byte`\xa7`,
    /**
     * Truncates f32 to signed i32.
     * Pops 1 f32 value, pushes truncated integer as i32.
     * Traps if value is NaN, ±infinity, or out of i32 range.
     */
    trunc_f32_s: byte`\xa8`,
    /**
     * Truncates f32 to unsigned i32.
     * Pops 1 f32 value, pushes truncated integer as i32.
     * Traps if value is NaN, ±infinity, or out of u32 range.
     */
    trunc_f32_u: byte`\xa9`,
    /**
     * Truncates f64 to signed i32.
     * Pops 1 f64 value, pushes truncated integer as i32.
     * Traps if value is NaN, ±infinity, or out of i32 range.
     */
    trunc_f64_s: byte`\xaa`,
    /**
     * Truncates f64 to unsigned i32.
     * Pops 1 f64 value, pushes truncated integer as i32.
     * Traps if value is NaN, ±infinity, or out of u32 range.
     */
    trunc_f64_u: byte`\xab`,
    /**
     * Reinterprets f32 bits as i32 (bitwise copy).
     * Pops 1 value, pushes raw bits as i32.
     */
    reinterpret_f32: byte`\xbc`,
    /**
     * Sign-extends 8-bit value to 32-bit i32.
     * Pops 1 value, treats low 8 bits as signed and extends.
     */
    extend8_s: byte`\xc0`,
    /**
     * Sign-extends 16-bit value to 32-bit i32.
     * Pops 1 value, treats low 16 bits as signed and extends.
     */
    extend16_s: byte`\xc1`,
    /**
     * Saturating truncation of f32 to signed i32.
     * Pops 1 value, pushes truncated integer as i32.
     * Converts NaN/infinity/out-of-range values to INT32_MIN or INT32_MAX.
     */
    trunc_sat_f32_s: byte`\xfc\x00`,
    /**
     * Saturating truncation of f32 to unsigned i32.
     * Pops 1 value, pushes truncated integer as i32.
     * Converts NaN/infinity/out-of-range values to 0 or UINT32_MAX.
     */
    trunc_sat_f32_u: byte`\xfc\x01`,
    /**
     * Saturating truncation of f64 to signed i32.
     * Pops 1 value, pushes truncated integer as i32.
     * Converts NaN/infinity/out-of-range values to INT32_MIN or INT32_MAX.
     */
    trunc_sat_f64_s: byte`\xfc\x02`,
    /**
     * Saturating truncation of f64 to unsigned i32.
     * Pops 1 value, pushes truncated integer as i32.
     * Converts NaN/infinity/out-of-range values to 0 or UINT32_MAX.
     */
    trunc_sat_f64_u: byte`\xfc\x03`,
  },
  I64: {
    /**
     * Loads an i64 value from linear memory at the address popped from the stack.
     * Requires 8-byte alignment. Traps on out-of-bounds or misalignment.
     * Requires alignment byte and offset byte right after.
     */
    load: (offset = 0) => [byte`\x29`, 8, encodeLEB128("u32", offset)],
    /**
     * Loads an 8-bit value from linear memory, sign-extends it to i64.
     * Pops address from stack. Requires 1-byte alignment. Traps on out-of-bounds.
     * Requires alignment byte and offset byte right after.
     */
    load8_s: (offset = 0) => [byte`\x30`, 1, encodeLEB128("u32", offset)],
    /**
     * Loads an 8-bit value from linear memory, zero-extends it to i64.
     * Pops address from stack. Requires 1-byte alignment. Traps on out-of-bounds.
     * Requires alignment byte and offset byte right after.
     */
    load8_u: (offset = 0) => [byte`\x31`, 1, encodeLEB128("u32", offset)],
    /**
     * Loads a 16-bit value from linear memory, sign-extends it to i64.
     * Pops address from stack. Requires 2-byte alignment. Traps on out-of-bounds.
     * Requires alignment byte and offset byte right after.
     */
    load16_s: (offset = 0) => [byte`\x32`, 2, encodeLEB128("u32", offset)],
    /**
     * Loads a 16-bit value from linear memory, zero-extends it to i64.
     * Pops address from stack. Requires 2-byte alignment. Traps on out-of-bounds.
     * Requires alignment byte and offset byte right after.
     */
    load16_u: (offset = 0) => [byte`\x33`, 2, encodeLEB128("u32", offset)],
    /**
     * Loads a 32-bit value from linear memory, sign-extends it to i64.
     * Pops address from stack. Requires 4-byte alignment. Traps on out-of-bounds.
     * Requires alignment byte and offset byte right after.
     */
    load32_s: (offset = 0) => [byte`\x34`, 4, encodeLEB128("u32", offset)],
    /**
     * Loads a 32-bit value from linear memory, zero-extends it to i64.
     * Pops address from stack. Requires 4-byte alignment. Traps on out-of-bounds.
     * Requires alignment byte and offset byte right after.
     */
    load32_u: (offset = 0) => [byte`\x35`, 4, encodeLEB128("u32", offset)],
    /**
     * Stores an i64 value into linear memory at address popped from stack.
     * Pops value then address. Requires 8-byte alignment. Traps on out-of-bounds.
     * Requires alignment byte and offset byte right after.
     */
    store: (offset = 0) => [byte`\x37`, 8, encodeLEB128("u32", offset)],
    /**
     * Stores the low 8 bits of an i64 value into memory.
     * Pops value then address. Requires 1-byte alignment. Traps on out-of-bounds.
     * Requires alignment byte and offset byte right after.
     */
    store8: (offset = 0) => [byte`\x3c`, 1, encodeLEB128("u32", offset)],
    /**
     * Stores the low 16 bits of an i64 value into memory.
     * Pops value then address. Requires 2-byte alignment. Traps on out-of-bounds.
     * Requires alignment byte and offset byte right after.
     */
    store16: (offset = 0) => [byte`\x3d`, 2, encodeLEB128("u32", offset)],
    /**
     * Stores the low 32 bits of an i64 value into memory.
     * Pops value then address. Requires 4-byte alignment. Traps on out-of-bounds.
     * Requires alignment byte and offset byte right after.
     */
    store32: (offset = 0) => [byte`\x3e`, 4, encodeLEB128("u32", offset)],
    /**
     * Pushes a 64-bit integer constant onto the stack.
     * The immediate value is encoded as a signed LEB128.
     */
    const: (num = 0, type = "i64") => [byte`\x42`, encodeLEB128(type, num)],
    /**
     * Checks if the top i64 value is zero.
     * Pops 1 value, pushes 1 (if zero) or 0 (non-zero) as i32.
     */
    eqz: byte`\x50`,
    /**
     * Equality comparison for i64.
     * Pops 2 values, pushes 1 if equal, else 0 as i32.
     */
    eq: byte`\x51`,
    /**
     * Inequality comparison for i64.
     * Pops 2 values, pushes 1 if not equal, else 0 as i32.
     */
    ne: byte`\x52`,
    /**
     * Signed less-than comparison for i64.
     * Pops 2 values, pushes 1 if (a < b) signed, else 0 as i32.
     */
    lt_s: byte`\x53`,
    /**
     * Unsigned less-than comparison for i64.
     * Pops 2 values, pushes 1 if (a < b) unsigned, else 0 as i32.
     */
    lt_u: byte`\x54`,
    /**
     * Signed greater-than comparison for i64.
     * Pops 2 values, pushes 1 if (a > b) signed, else 0 as i32.
     */
    gt_s: byte`\x55`,
    /**
     * Unsigned greater-than comparison for i64.
     * Pops 2 values, pushes 1 if (a > b) unsigned, else 0 as i32.
     */
    gt_u: byte`\x56`,
    /**
     * Signed less-than-or-equal comparison for i64.
     * Pops 2 values, pushes 1 if (a ≤ b) signed, else 0 as i32.
     */
    le_s: byte`\x57`,
    /**
     * Unsigned less-than-or-equal comparison for i64.
     * Pops 2 values, pushes 1 if (a ≤ b) unsigned, else 0 as i32.
     */
    le_u: byte`\x58`,
    /**
     * Signed greater-than-or-equal comparison for i64.
     * Pops 2 values, pushes 1 if (a ≥ b) signed, else 0 as i32.
     */
    ge_s: byte`\x59`,
    /**
     * Unsigned greater-than-or-equal comparison for i64.
     * Pops 2 values, pushes 1 if (a ≥ b) unsigned, else 0 as i32.
     */
    ge_u: byte`\x5a`,
    /**
     * Counts leading zero bits in i64.
     * Pops 1 value, pushes the count (0-64) as i64.
     */
    clz: byte`\x79`,
    /**
     * Counts trailing zero bits in i64.
     * Pops 1 value, pushes the count (0-64) as i64.
     */
    ctz: byte`\x7a`,
    /**
     * Counts set bits (1s) in i64.
     * Pops 1 value, pushes the population count as i64.
     */
    popcnt: byte`\x7b`,
    /**
     * Integer addition for i64.
     * Pops 2 values, pushes (a + b) as i64 (wraps on overflow).
     */
    add: byte`\x7c`,
    /**
     * Integer subtraction for i64.
     * Pops 2 values, pushes (a - b) as i64 (wraps on overflow).
     */
    sub: byte`\x7d`,
    /**
     * Integer multiplication for i64.
     * Pops 2 values, pushes (a * b) as i64 (wraps on overflow).
     */
    mul: byte`\x7e`,
    /**
     * Signed integer division for i64.
     * Pops 2 values, pushes (a / b) as i64.
     * Traps if b = 0 or division overflows (e.g., INT64_MIN / -1).
     */
    div_s: byte`\x7f`,
    /**
     * Unsigned integer division for i64.
     * Pops 2 values, pushes (a / b) as i64.
     * Traps if b = 0.
     */
    div_u: byte`\x80`,
    /**
     * Signed integer remainder for i64.
     * Pops 2 values, pushes (a % b) as i64.
     * Traps if b = 0 or division overflows.
     */
    rem_s: byte`\x81`,
    /**
     * Unsigned integer remainder for i64.
     * Pops 2 values, pushes (a % b) as i64.
     * Traps if b = 0.
     */
    rem_u: byte`\x82`,
    /**
     * Bitwise AND for i64.
     * Pops 2 values, pushes (a & b) as i64.
     */
    and: byte`\x83`,
    /**
     * Bitwise OR for i64.
     * Pops 2 values, pushes (a | b) as i64.
     */
    or: byte`\x84`,
    /**
     * Bitwise XOR for i64.
     * Pops 2 values, pushes (a ^ b) as i64.
     */
    xor: byte`\x85`,
    /**
     * Logical left shift for i64.
     * Pops 2 values (a, b), pushes (a << (b % 64)) as i64.
     */
    shl: byte`\x86`,
    /**
     * Arithmetic right shift for i64 (sign-preserving).
     * Pops 2 values (a, b), pushes (a >> (b % 64)) as i64.
     */
    shr_s: byte`\x87`,
    /**
     * Logical right shift for i64 (zero-filling).
     * Pops 2 values (a, b), pushes (a >>> (b % 64)) as i64.
     */
    shr_u: byte`\x88`,
    /**
     * Bitwise rotate left for i64.
     * Pops 2 values (a, b), rotates bits left by (b % 64) positions.
     */
    rotl: byte`\x89`,
    /**
     * Bitwise rotate right for i64.
     * Pops 2 values (a, b), rotates bits right by (b % 64) positions.
     */
    rotr: byte`\x8a`,
    /**
     * Sign-extends i32 to i64.
     * Pops 1 i32 value, pushes sign-extended i64.
     */
    extend_i32_s: byte`\xac`,
    /**
     * Zero-extends i32 to i64.
     * Pops 1 i32 value, pushes zero-extended i64.
     */
    extend_i32_u: byte`\xad`,
    /**
     * Truncates f32 to signed i64.
     * Pops 1 f32 value, pushes truncated integer as i64.
     * Traps if value is NaN, ±infinity, or out of i64 range.
     */
    trunc_f32_s: byte`\xae`,
    /**
     * Truncates f32 to unsigned i64.
     * Pops 1 f32 value, pushes truncated integer as i64.
     * Traps if value is NaN, ±infinity, or out of u64 range.
     */
    trunc_f32_u: byte`\xaf`,
    /**
     * Truncates f64 to signed i64.
     * Pops 1 value, pushes truncated integer as i64.
     * Traps if value is NaN, ±infinity, or out of i64 range.
     */
    trunc_f64_s: byte`\xb0`,
    /**
     * Truncates f64 to unsigned i64.
     * Pops 1 value, pushes truncated integer as i64.
     * Traps if value is NaN, ±infinity, or out of u64 range.
     */
    trunc_f64_u: byte`\xb1`,
    /**
     * Reinterprets f64 bits as i64 (bitwise copy).
     * Pops 1 value, pushes raw bits as i64.
     */
    reinterpret_f64: byte`\xbd`,
    /**
     * Sign-extends 8-bit value to 64-bit i64.
     * Pops 1 value, treats low 8 bits as signed and extends.
     */
    extend8_s: byte`\xc2`,
    /**
     * Sign-extends 16-bit value to 64-bit i64.
     * Pops 1 value, treats low 16 bits as signed and extends.
     */
    extend16_s: byte`\xc3`,
    /**
     * Sign-extends 32-bit value to 64-bit i64.
     * Pops 1 value, treats low 32 bits as signed and extends.
     */
    extend32_s: byte`\xc4`,
    /**
     * Saturating truncation of f32 to signed i64.
     * Pops 1 value, pushes truncated integer as i64.
     * Converts NaN/infinity/out-of-range values to INT64_MIN or INT64_MAX.
     */
    trunc_sat_f32_s: byte`\xfc\x04`,
    /**
     * Saturating truncation of f32 to unsigned i64.
     * Pops 1 value, pushes truncated integer as i64.
     * Converts NaN/infinity/out-of-range values to 0 or UINT64_MAX.
     */
    trunc_sat_f32_u: byte`\xfc\x05`,
    /**
     * Saturating truncation of f64 to signed i64.
     * Pops 1 value, pushes truncated integer as i64.
     * Converts NaN/infinity/out-of-range values to INT64_MIN or INT64_MAX.
     */
    trunc_sat_f64_s: byte`\xfc\x06`,
    /**
     * Saturating truncation of f64 to unsigned i64.
     * Pops 1 value, pushes truncated integer as i64.
     * Converts NaN/infinity/out-of-range values to 0 or UINT64_MAX.
     */
    trunc_sat_f64_u: byte`\xfc\x07`,
  },
  F32: {
    /**
     * Loads an f32 value from linear memory at the address popped from the stack.
     * Requires 4-byte alignment. Traps on out-of-bounds or misalignment.
     *   equires alignment byte and offset byte right after.
     */
    load: (offset = 0) => [byte`\x2a`, 4, encodeLEB128("u32", offset)],
    /**
     * Stores an f32 value into linear memory at address popped from stack.
     * Pops value then address. Requires 4-byte alignment. Traps on out-of-bounds.
     * Requires alignment byte and offset byte right after.
     */
    store: (offset = 0) => [byte`\x38`, 4, encodeLEB128("u32", offset)],
    /**
     * Pushes a 32-bit float constant onto the stack.
     * The immediate value is encoded in IEEE 754 binary32 format.
     */
    const: (num = 0, type = "f32") => [byte`\x43`, encodeIEEE754(type, num)],
    /**
     * Floating-point equality comparison for f32.
     * Pops 2 values, pushes 1 if equal (ordered), else 0 as i32.
     * Follows IEEE 754 rules (NaN returns 0).
     */
    eq: byte`\x5b`,
    /**
     * Floating-point inequality comparison for f32.
     * Pops 2 values, pushes 1 if not equal (unordered or different), else 0 as i32.
     * Follows IEEE 754 rules (NaN returns 1).
     */
    ne: byte`\x5c`,
    /**
     * Floating-point less-than comparison for f32.
     * Pops 2 values, pushes 1 if (a < b) ordered, else 0 as i32.
     * Follows IEEE 754 rules (NaN returns 0).
     */
    lt: byte`\x5d`,
    /**
     * Floating-point greater-than comparison for f32.
     * Pops 2 values, pushes 1 if (a > b) ordered, else 0 as i32.
     * Follows IEEE 754 rules (NaN returns 0).
     */
    gt: byte`\x5e`,
    /**
     * Floating-point less-than-or-equal comparison for f32.
     * Pops 2 values, pushes 1 if (a ≤ b) ordered, else 0 as i32.
     * Follows IEEE 754 rules (NaN returns 0).
     */
    le: byte`\x5f`,
    /**
     * Floating-point greater-than-or-equal comparison for f32.
     * Pops 2 values, pushes 1 if (a ≥ b) ordered, else 0 as i32.
     * Follows IEEE 754 rules (NaN returns 0).
     */
    ge: byte`\x60`,
    /**
     * Absolute value for f32.
     * Pops 1 value, pushes |a| as f32 (preserves NaN).
     */
    abs: byte`\x8b`,
    /**
     * Negation for f32.
     * Pops 1 value, pushes -a as f32 (flips sign bit).
     */
    neg: byte`\x8c`,
    /**
     * Rounds f32 up to nearest integer.
     * Pops 1 value, pushes ceil(a) as f32.
     */
    ceil: byte`\x8d`,
    /**
     * Rounds f32 down to nearest integer.
     * Pops 1 value, pushes floor(a) as f32.
     */
    floor: byte`\x8e`,
    /**
     * Truncates f32 toward zero.
     * Pops 1 value, pushes trunc(a) as f32.
     */
    trunc: byte`\x8f`,
    /**
     * Rounds f32 to nearest integer (ties to even).
     * Pops 1 value, pushes rounded result as f32.
     * Follows IEEE 754 rules (NaN → NaN).
     */
    nearest: byte`\x90`,
    /**
     * Computes square root of f32.
     * Pops 1 value, pushes sqrt(a) as f32.
     * Returns NaN for negative inputs.
     */
    sqrt: byte`\x91`,
    /**
     * Floating-point addition for f32.
     * Pops 2 values, pushes (a + b) as f32.
     * Follows IEEE 754 rules (NaN propagation).
     */
    add: byte`\x92`,
    /**
     * Floating-point subtraction for f32.
     * Pops 2 values, pushes (a - b) as f32.
     * Follows IEEE 754 rules (NaN propagation).
     */
    sub: byte`\x93`,
    /**
     * Floating-point multiplication for f32.
     * Pops 2 values, pushes (a * b) as f32.
     * Follows IEEE 754 rules (NaN propagation).
     */
    mul: byte`\x94`,
    /**
     * Floating-point division for f32.
     * Pops 2 values, pushes (a / b) as f32.
     * Follows IEEE 754 rules (NaN/±infinity handling).
     */
    div: byte`\x95`,
    /**
     * Returns minimum of two f32 values.
     * Pops 2 values, pushes min(a, b) as f32.
     * Handles NaN and -0/+0 correctly per IEEE 754.
     */
    min: byte`\x96`,
    /**
     * Returns maximum of two f32 values.
     * Pops 2 values, pushes max(a, b) as f32.
     * Handles NaN and -0/+0 correctly per IEEE 754.
     */
    max: byte`\x97`,
    /**
     * Copies sign bit from b to a for f32.
     * Pops 2 values, pushes (|a| with b's sign) as f32.
     */
    copysign: byte`\x98`,
    /**
     * Converts signed i32 to f32.
     * Pops 1 value, pushes floating-point equivalent.
     * May lose precision for large integers.
     */
    convert_i32_s: byte`\xb2`,
    /**
     * Converts unsigned i32 to f32.
     * Pops 1 value, pushes floating-point equivalent.
     * May lose precision for large integers.
     */
    convert_i32_u: byte`\xb3`,
    /**
     * Converts signed i64 to f32.
     * Pops 1 value, pushes floating-point equivalent.
     * Likely loses precision (f32 has 23-bit mantissa).
     */
    convert_i64_s: byte`\xb4`,
    /**
     * Converts unsigned i64 to f32.
     * Pops 1 value, pushes floating-point equivalent.
     * Likely loses precision (f32 has 23-bit mantissa).
     */
    convert_i64_u: byte`\xb5`,
    /**
     * Demotes f64 to f32 (loses precision).
     * Pops 1 value, pushes f32 equivalent.
     * Rounds to nearest representable f32 value.
     */
    demote_f64: byte`\xb6`,
    /**
     * Reinterprets i32 bits as f32 (bitwise copy).
     * Pops 1 value, pushes raw bits as f32.
     */
    reinterpret_i32: byte`\xbe`,
  },
  F64: {
    /**
     * Loads an f64 value from linear memory at the address popped from the stack.
     * Requires 8-byte alignment. Traps on out-of-bounds or misalignment.
     * Requires alignment byte and offset byte right after.
     */
    load: (offset = 0) => [byte`\x2b`, 8, encodeLEB128("u32", offset)],
    /**
     * Stores an f64 value into linear memory at address popped from stack.
     * Pops value then address. Requires 8-byte alignment. Traps on out-of-bounds.
     * Requires alignment byte and offset byte right after.
     */
    store: (offset = 0) => [byte`\x39`, 8, encodeLEB128("u32", offset)],
    /**
     * Pushes a 64-bit float constant onto the stack.
     * The immediate value is encoded in IEEE 754 binary64 format.
     */
    const: (num = 0, type = "f64") => [byte`\x44`, encodeIEEE754(type, num)],
    /**
     * Floating-point equality comparison for f64.
     * Pops 2 values, pushes 1 if equal (ordered), else 0 as i32.
     * Follows IEEE 754 rules (NaN returns 0).
     */
    eq: byte`\x61`,
    /**
     * Floating-point inequality comparison for f64.
     * Pops 2 values, pushes 1 if not equal (unordered or different), else 0 as i32.
     * Follows IEEE 754 rules (NaN returns 1).
     */
    ne: byte`\x62`,
    /**
     * Floating-point less-than comparison for f64.
     * Pops 2 values, pushes 1 if (a < b) ordered, else 0 as i32.
     * Follows IEEE 754 rules (NaN returns 0).
     */
    lt: byte`\x63`,
    /**
     * Floating-point greater-than comparison for f64.
     * Pops 2 values, pushes 1 if (a > b) ordered, else 0 as i32.
     * Follows IEEE 754 rules (NaN returns 0).
     */
    gt: byte`\x64`,
    /**
     * Floating-point less-than-or-equal comparison for f64.
     * Pops 2 values, pushes 1 if (a ≤ b) ordered, else 0 as i32.
     * Follows IEEE 754 rules (NaN returns 0).
     */
    le: byte`\x65`,
    /**
     * Floating-point greater-than-or-equal comparison for f64.
     * Pops 2 values, pushes 1 if (a ≥ b) ordered, else 0 as i32.
     * Follows IEEE 754 rules (NaN returns 0).
     */
    ge: byte`\x66`,
    /**
     * Absolute value for f64.
     * Pops 1 value, pushes |a| as f64 (preserves NaN).
     */
    abs: byte`\x99`,
    /**
     * Negation for f64.
     * Pops 1 value, pushes -a as f64 (flips sign bit).
     */
    neg: byte`\x9a`,
    /**
     * Rounds f64 up to nearest integer.
     * Pops 1 value, pushes ceil(a) as f64.
     */
    ceil: byte`\x9b`,
    /**
     * Rounds f64 down to nearest integer.
     * Pops 1 value, pushes floor(a) as f64.
     */
    floor: byte`\x9c`,
    /**
     * Truncates f64 toward zero.
     * Pops 1 value, pushes trunc(a) as f64.
     */
    trunc: byte`\x9d`,
    /**
     * Rounds f64 to nearest integer (ties to even).
     * Pops 1 value, pushes rounded result as f64.
     * Follows IEEE 754 rules (NaN → NaN).
     */
    nearest: byte`\x9e`,
    /**
     * Computes square root of f64.
     * Pops 1 value, pushes sqrt(a) as f64.
     * Returns NaN for negative inputs.
     */
    sqrt: byte`\x9f`,
    /**
     * Floating-point addition for f64.
     * Pops 2 values, pushes (a + b) as f64.
     * Follows IEEE 754 rules (NaN propagation).
     */
    add: byte`\xa0`,
    /**
     * Floating-point subtraction for f64.
     * Pops 2 values, pushes (a - b) as f64.
     * Follows IEEE 754 rules (NaN propagation).
     */
    sub: byte`\xa1`,
    /**
     * Floating-point multiplication for f64.
     * Pops 2 values, pushes (a * b) as f64.
     * Follows IEEE 754 rules (NaN propagation).
     */
    mul: byte`\xa2`,
    /**
     * Floating-point division for f64.
     * Pops 2 values, pushes (a / b) as f64.
     * Follows IEEE 754 rules (NaN/±infinity handling).
     */
    div: byte`\xa3`,
    /**
     * Returns minimum of two f64 values.
     * Pops 2 values, pushes min(a, b) as f64.
     * Handles NaN and -0/+0 correctly per IEEE 754.
     */
    min: byte`\xa4`,
    /**
     * Returns maximum of two f64 values.
     * Pops 2 values, pushes max(a, b) as f64.
     * Handles NaN and -0/+0 correctly per IEEE 754.
     */
    max: byte`\xa5`,
    /**
     * Copies sign bit from b to a for f64.
     * Pops 2 values, pushes (|a| with b's sign) as f64.
     */
    copysign: byte`\xa6`,
    /**
     * Converts signed i32 to f64.
     * Pops 1 value, pushes floating-point equivalent.
     * Exact conversion (no precision loss).
     */
    convert_i32_s: byte`\xb7`,
    /**
     * Converts unsigned i32 to f64.
     * Pops 1 value, pushes floating-point equivalent.
     * Exact conversion (no precision loss).
     */
    convert_i32_u: byte`\xb8`,
    /**
     * Converts signed i64 to f64.
     * Pops 1 value, pushes floating-point equivalent.
     * May lose precision (f64 has 52-bit mantissa).
     */
    convert_i64_s: byte`\xb9`,
    /**
     * Converts unsigned i64 to f64.
     * Pops 1 value, pushes floating-point equivalent.
     * May lose precision (f64 has 52-bit mantissa).
     */
    convert_i64_u: byte`\xba`,
    /**
     * Promotes f32 to f64 (exact conversion).
     * Pops 1 value, pushes f64 equivalent.
     */
    promote_f32: byte`\xbb`,
    /**
     * Reinterprets i64 bits as f64 (bitwise copy).
     * Pops 1 value, pushes raw bits as f64.
     */
    reinterpret_i64: byte`\xbf`,
  },
  ref: {
    /**
     * Pushes a null reference onto the stack.
     * The type of the null reference is determined by the context (e.g., funcref or externref).
     */
    null: (type) => [byte`\xd0`, type],
    /**
     * Checks if the top reference on the stack is null.
     * Pops 1 reference, pushes 1 (if null) or 0 (if non-null) as i32.
     */
    is_null: byte`\xd1`,
    /**
     * Creates a reference to a function by index.
     * Pushes a funcref referencing the function at the given index in the module's function table.
     */
    func: (type) => [byte`\xd2`, type],
  },
  V128: {
    /**
     * Loads a 128-bit vector from linear memory at the address popped from the stack.
     * Requires 16-byte alignment. Traps on out-of-bounds or misalignment.
     */
    load: (offset = 0) => [byte`\xfd\x00`, 16, encodeLEB128("u32", offset)],
    /**
     * Loads 8 bytes from memory, sign-extends each byte to 16 bits, and packs into a 128-bit vector.
     * Pops address from stack. Requires 8-byte alignment.
     */
    load8x8_s: (offset = 0) => [byte`\xfd\x01`, 8, encodeLEB128("u32", offset)],
    /**
     * Loads 8 bytes from memory, zero-extends each byte to 16 bits, and packs into a 128-bit vector.
     * Pops address from stack. Requires 8-byte alignment.
     */
    load8x8_u: (offset = 0) => [byte`\xfd\x02`, 8, encodeLEB128("u32", offset)],
    /**
     * Loads 4 halfwords (16 bits) from memory, sign-extends each halfword to 32 bits, and packs into a 128-bit vector.
     * Pops address from stack. Requires 8-byte alignment.
     */
    load16x4_s: (offset = 0) => [byte`\xfd\x03`, 8, encodeLEB128("u32", offset)],
    /**
     * Loads 4 halfwords (16 bits) from memory, zero-extends each halfword to 32 bits, and packs into a 128-bit vector.
     * Pops address from stack. Requires 8-byte alignment.
     */
    load16x4_u: (offset = 0) => [byte`\xfd\x04`, 8, encodeLEB128("u32", offset)],
    /**
     * Loads 2 words (32 bits) from memory, sign-extends each word to 64 bits, and packs into a 128-bit vector.
     * Pops address from stack. Requires 8-byte alignment.
     */
    load32x2_s: (offset = 0) => [byte`\xfd\x05`, 8, encodeLEB128("u32", offset)],
    /**
     * Loads 2 words (32 bits) from memory, zero-extends each word to 64 bits, and packs into a 128-bit vector.
     * Pops address from stack. Requires 8-byte alignment.
     */
    load32x2_u: (offset = 0) => [byte`\xfd\x06`, 8, encodeLEB128("u32", offset)],
    /**
     * Loads a single byte from memory, sign-extends it, and splats across all lanes of a 128-bit vector.
     * Pops address from stack. Requires 1-byte alignment.
     */
    load8_splat: (offset = 0) => [byte`\xfd\x07`, 1, encodeLEB128("u32", offset)],
    /**
     * Loads a single halfword (16 bits) from memory, sign-extends it, and splats across all lanes of a 128-bit vector.
     * Pops address from stack. Requires 2-byte alignment.
     */
    load16_splat: (offset = 0) => [byte`\xfd\x08`, 2, encodeLEB128("u32", offset)],
    /**
     * Loads a single word (32 bits) from memory, sign-extends it, and splats across all lanes of a 128-bit vector.
     * Pops address from stack. Requires 4-byte alignment.
     */
    load32_splat: (offset = 0) => [byte`\xfd\x09`, 4, encodeLEB128("u32", offset)],
    /**
     * Loads a single doubleword (64 bits) from memory and splats it across all lanes of a 128-bit vector.
     * Pops address from stack. Requires 8-byte alignment.
     */
    load64_splat: (offset = 0) => [byte`\xfd\x0a`, 8, encodeLEB128("u32", offset)],
    /**
     * Stores a 128-bit vector into linear memory at the address popped from the stack.
     * Requires 16-byte alignment. Traps on out-of-bounds or misalignment.
     */
    store: (offset = 0) => [byte`\xfd\x0b`, 16, encodeLEB128("u32", offset)],
    /**
     * Performs a bitwise NOT operation on a 128-bit vector.
     * Pops one vector and pushes the result of flipping all bits.
     */
    not: byte`\xfd\x4d`,
    /**
     * Performs a bitwise AND operation on two 128-bit vectors.
     * Pops two vectors and pushes the result of `(a & b)`.
     */
    and: byte`\xfd\x4e`,
    /**
     * Performs a bitwise AND-NOT operation on two 128-bit vectors.
     * Pops two vectors and pushes the result of `(a & ~b)`.
     */
    andnot: byte`\xfd\x4f`,
    /**
     * Performs a bitwise OR operation on two 128-bit vectors.
     * Pops two vectors and pushes the result of `(a | b)`.
     */
    or: byte`\xfd\x50`,
    /**
     * Performs a bitwise XOR operation on two 128-bit vectors.
     * Pops two vectors and pushes the result of `(a ^ b)`.
     */
    xor: byte`\xfd\x51`,
    /**
     * Selects bits from two vectors based on a mask vector.
     * Pops three vectors: mask, true_vector, false_vector.
     * For each bit in the mask, selects the corresponding bit from `true_vector` if the mask bit is `1`, otherwise from `false_vector`.
     */
    bitselect: byte`\xfd\x52`,
    /**
     * Checks if any lane in a 128-bit vector is non-zero.
     * Pops one vector and pushes `1` (true) if any lane is non-zero, or `0` (false) otherwise.
     */
    any_true: byte`\xfd\x53`,
    /**
     * Loads a single byte from memory into a specific lane of a 128-bit vector.
     * Pops an address and a vector, replaces the specified lane with the loaded byte, and pushes the updated vector.
     */
    load8_lane: (lane, offset = 0) => [byte`\xfd\x54`, 1, encodeLEB128("u32", offset), lane],
    /**
     * Loads a single halfword (16 bits) from memory into a specific lane of a 128-bit vector.
     * Pops an address and a vector, replaces the specified lane with the loaded halfword, and pushes the updated vector.
     */
    load16_lane: (lane, offset = 0) => [byte`\xfd\x55`, 2, encodeLEB128("u32", offset), lane],
    /**
     * Loads a single word (32 bits) from memory into a specific lane of a 128-bit vector.
     * Pops an address and a vector, replaces the specified lane with the loaded word, and pushes the updated vector.
     */
    load32_lane: (lane, offset = 0) => [byte`\xfd\x56`, 4, encodeLEB128("u32", offset), lane],
    /**
     * Loads a single doubleword (64 bits) from memory into a specific lane of a 128-bit vector.
     * Pops an address and a vector, replaces the specified lane with the loaded doubleword, and pushes the updated vector.
     */
    load64_lane: (lane, offset = 0) => [byte`\xfd\x57`, 8, encodeLEB128("u32", offset), lane],
    /**
     * Stores a single byte from a specific lane of a 128-bit vector into memory.
     * Pops an address and a vector, writes the specified lane's byte to memory.
     */
    store8_lane: (lane, offset = 0) => [byte`\xfd\x58`, 1 , encodeLEB128("u32", offset), lane],
    /**
     * Stores a single halfword (16 bits) from a specific lane of a 128-bit vector into memory.
     * Pops an address and a vector, writes the specified lane's halfword to memory.
     */
    store16_lane: (lane, offset = 0) => [byte`\xfd\x59`, 2 , encodeLEB128("u32", offset), lane],
    /**
     * Stores a single word (32 bits) from a specific lane of a 128-bit vector into memory.
     * Pops an address and a vector, writes the specified lane's word to memory.
     */
    store32_lane: (lane, offset = 0) => [byte`\xfd\x5a`, 4 , encodeLEB128("u32", offset), lane],
    /**
     * Stores a single doubleword (64 bits) from a specific lane of a 128-bit vector into memory.
     * Pops an address and a vector, writes the specified lane's doubleword to memory.
     */
    store64_lane: (lane, offset = 0) => [byte`\xfd\x5b`, 8, encodeLEB128("u32", offset), lane],
    /**
     * Loads a single word (32 bits) from memory and zero-extends it into a 128-bit vector.
     * Pops an address and pushes a new vector where the low 32 bits are loaded from memory, and the rest are zeroed.
     */
    load32_zero: (offset = 0) => [byte`\xfd\x5c`, 4, encodeLEB128("u32", offset)],
    /**
     * Loads a single doubleword (64 bits) from memory and zero-extends it into a 128-bit vector.
     * Pops an address and pushes a new vector where the low 64 bits are loaded from memory, and the rest are zeroed.
     */
    load64_zero: (offset = 0) => [byte`\xfd\x5d`, 8, encodeLEB128("u32", offset)],
    /**
     * Pushes a 128-bit constant vector onto the stack.
     * The immediate value is encoded as a literal 128-bit value.
     */
    const: (val = 0) => [byte`\xfd\x0c`, encode_v128(val)],
  },
  I8x16: {
    /**
     * Shuffles two 128-bit vectors into a new 128-bit vector based on an 8-bit shuffle mask.
     * Pops two vectors and uses a 16-byte immediate mask to produce the result.
     */
    shuffle: (...vals) => (console.assert(vals.length === 16), [byte`\xfd\x0d` vals]),
    /**
     * Swizzles the first vector using indices from the second vector.
     * Pops two vectors and produces a new vector where each lane is selected by the corresponding index in the second vector.
     */
    swizzle: byte`\xfd\x0e`,
    /**
     * Creates a 128-bit vector by replicating an 8-bit integer across all lanes.
     * Pops 1 value and splats it across all 16 lanes of the vector.
     */
    splat: byte`\xfd\x0f`,
    /**
     * Extracts a signed 8-bit integer from a specific lane of a 128-bit vector.
     * Pops a vector and pushes the extracted lane value as an i32 (sign-extended).
     */
    extract_lane_s: (index) => [byte`\xfd\x15`, index],
    /**
     * Extracts an unsigned 8-bit integer from a specific lane of a 128-bit vector.
     * Pops a vector and pushes the extracted lane value as an i32 (zero-extended).
     */
    extract_lane_u: (index) => [byte`\xfd\x16`, index],
    /**
     * Replaces a specific lane in a 128-bit vector with a new value.
     * Pops a vector and a scalar value, then replaces the specified lane and pushes the updated vector.
     */
    replace_lane: (index) => [byte`\xfd\x17`, index],
    /**
     * Compares two 128-bit vectors for equality (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFF` if equal, or `0x00` otherwise.
     */
    eq: byte`\xfd\x23`,
    /**
     * Compares two 128-bit vectors for inequality (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFF` if not equal, or `0x00` otherwise.
     */
    ne: byte`\xfd\x24`,
    /**
     * Compares two 128-bit vectors for signed less-than (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFF` if `(a < b)`, or `0x00` otherwise.
     */
    lt_s: byte`\xfd\x25`,
    /**
     * Compares two 128-bit vectors for unsigned less-than (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFF` if `(a < b)`, or `0x00` otherwise.
     */
    lt_u: byte`\xfd\x26`,
    /**
     * Compares two 128-bit vectors for signed greater-than (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFF` if `(a > b)`, or `0x00` otherwise.
     */
    gt_s: byte`\xfd\x27`,
    /**
     * Compares two 128-bit vectors for unsigned greater-than (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFF` if `(a > b)`, or `0x00` otherwise.
     */
    gt_u: byte`\xfd\x28`,
    /**
     * Compares two 128-bit vectors for signed less-than-or-equal (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFF` if `(a ≤ b)`, or `0x00` otherwise.
     */
    le_s: byte`\xfd\x29`,
    /**
     * Compares two 128-bit vectors for unsigned less-than-or-equal (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFF` if `(a ≤ b)`, or `0x00` otherwise.
     */
    le_u: byte`\xfd\x2a`,
    /**
     * Compares two 128-bit vectors for signed greater-than-or-equal (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFF` if `(a ≥ b)`, or `0x00` otherwise.
     */
    ge_s: byte`\xfd\x2b`,
    /**
     * Compares two 128-bit vectors for unsigned greater-than-or-equal (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFF` if `(a ≥ b)`, or `0x00` otherwise.
     */
    ge_u: byte`\xfd\x2c`,
    /**
     * Computes the absolute value of each lane in an `i8x16` vector.
     * Pops one vector and pushes a new vector where each lane is replaced by its absolute value.
     */
    abs: byte`\xfd\x60`,
    /**
     * Negates each lane in an `i8x16` vector.
     * Pops one vector and pushes a new vector where each lane is replaced by its negated value.
     */
    neg: byte`\xfd\x61`,
    /**
     * Counts the number of set bits (1s) in each lane of an `i8x16` vector.
     * Pops one vector and pushes a new vector where each lane is replaced by the population count of the original lane.
     */
    popcnt: byte`\xfd\x62`,
    /**
     * Checks if all lanes in an `i8x16` vector are non-zero.
     * Pops one vector and pushes `1` (true) if all lanes are non-zero, or `0` (false) otherwise.
     */
    all_true: byte`\xfd\x63`,
    /**
     * Creates a bitmask from an `i8x16` vector.
     * Pops one vector and pushes an `i32` bitmask where each bit corresponds to the sign bit of a lane in the vector.
     */
    bitmask: byte`\xfd\x64`,
    /**
     * Narrows an `i16x8` vector to an `i8x16` vector using signed saturation.
     * Pops two vectors, combines their lanes into a single `i8x16` vector, saturating values that exceed the range of `i8`.
     */
    narrow_i16x8_s: byte`\xfd\x65`,
    /**
     * Narrows an `i16x8` vector to an `i8x16` vector using unsigned saturation.
     * Pops two vectors, combines their lanes into a single `i8x16` vector, saturating values that exceed the range of `u8`.
     */
    narrow_i16x8_u: byte`\xfd\x66`,
    /**
     * Performs a bitwise left shift on each lane of an `i8x16` vector.
     * Pops one vector and a scalar value, shifts each lane left by the scalar value, and pushes the result.
     */
    shl: byte`\xfd\x6b`,
    /**
     * Performs an arithmetic right shift on each lane of an `i8x16` vector.
     * Pops one vector and a scalar value, shifts each lane right by the scalar value (sign-preserving), and pushes the result.
     */
    shr_s: byte`\xfd\x6c`,
    /**
     * Performs a logical right shift on each lane of an `i8x16` vector.
     * Pops one vector and a scalar value, shifts each lane right by the scalar value (zero-filling), and pushes the result.
     */
    shr_u: byte`\xfd\x6d`,
    /**
     * Adds corresponding lanes of two `i8x16` vectors.
     * Pops two vectors and pushes a new vector where each lane is the sum of the corresponding lanes.
     */
    add: byte`\xfd\x6e`,
    /**
     * Adds corresponding lanes of two `i8x16` vectors using signed saturation.
     * Pops two vectors and pushes a new vector where each lane is saturated if the result exceeds the range of `i8`.
     */
    add_sat_s: byte`\xfd\x6f`,
    /**
     * Adds corresponding lanes of two `i8x16` vectors using unsigned saturation.
     * Pops two vectors and pushes a new vector where each lane is saturated if the result exceeds the range of `u8`.
     */
    add_sat_u: byte`\xfd\x70`,
    /**
     * Subtracts corresponding lanes of two `i8x16` vectors.
     * Pops two vectors and pushes a new vector where each lane is the difference of the corresponding lanes.
     */
    sub: byte`\xfd\x71`,
    /**
     * Subtracts corresponding lanes of two `i8x16` vectors using signed saturation.
     * Pops two vectors and pushes a new vector where each lane is saturated if the result exceeds the range of `i8`.
     */
    sub_sat_s: byte`\xfd\x72`,
    /**
     * Subtracts corresponding lanes of two `i8x16` vectors using unsigned saturation.
     * Pops two vectors and pushes a new vector where each lane is saturated if the result exceeds the range of `u8`.
     */
    sub_sat_u: byte`\xfd\x73`,
    /**
     * Computes the minimum of corresponding lanes of two `i8x16` vectors using signed comparison.
     * Pops two vectors and pushes a new vector where each lane is the minimum of the corresponding lanes.
     */
    min_s: byte`\xfd\x76`,
    /**
     * Computes the minimum of corresponding lanes of two `i8x16` vectors using unsigned comparison.
     * Pops two vectors and pushes a new vector where each lane is the minimum of the corresponding lanes.
     */
    min_u: byte`\xfd\x77`,
    /**
     * Computes the maximum of corresponding lanes of two `i8x16` vectors using signed comparison.
     * Pops two vectors and pushes a new vector where each lane is the maximum of the corresponding lanes.
     */
    max_s: byte`\xfd\x78`,
    /**
     * Computes the maximum of corresponding lanes of two `i8x16` vectors using unsigned comparison.
     * Pops two vectors and pushes a new vector where each lane is the maximum of the corresponding lanes.
     */
    max_u: byte`\xfd\x79`,
    /**
     * Computes the unsigned average (rounded) of corresponding lanes of two `i8x16` vectors.
     * Pops two vectors and pushes a new vector where each lane is the rounded average of the corresponding lanes.
     */
    avgr_u: byte`\xfd\x7b`,
    /**
     * Pushes a 128-bit constant vector onto the stack.
     * The immediate value is encoded as a vector of 16 8-bit values.
     */
    const: (...vals) => (console.assert(vals.length === 16), [byte`\xfd\x0c`, encode_v128(vals)]),
  },
  I16x8: {
    /**
     * Creates a 128-bit vector by replicating a 16-bit integer across all lanes.
     * Pops 1 value and splats it across all 8 lanes of the vector.
     */
    splat: byte`\xfd\x10`,
    /**
     * Extracts a signed 16-bit integer from a specific lane of a 128-bit vector.
     * Pops a vector and pushes the extracted lane value as an i32 (sign-extended).
     */
    extract_lane_s: (index) => [byte`\xfd\x18`, index],
    /**
     * Extracts an unsigned 16-bit integer from a specific lane of a 128-bit vector.
     * Pops a vector and pushes the extracted lane value as an i32 (zero-extended).
     */
    extract_lane_u: (index) => [byte`\xfd\x19`, index],
    /**
     * Replaces a specific lane in a 128-bit vector with a new value.
     * Pops a vector and a scalar value, then replaces the specified lane and pushes the updated vector.
     */
    replace_lane: (index) => [byte`\xfd\x1a`, index],
    /**
     * Compares two 128-bit vectors for equality (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFFFF` if equal, or `0x0000` otherwise.
     */
    eq: byte`\xfd\x2d`,
    /**
     * Compares two 128-bit vectors for inequality (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFFFF` if not equal, or `0x0000` otherwise.
     */
    ne: byte`\xfd\x2e`,
    /**
     * Compares two 128-bit vectors for signed less-than (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFFFF` if `(a < b)`, or `0x0000` otherwise.
     */
    lt_s: byte`\xfd\x2f`,
    /**
     * Compares two 128-bit vectors for unsigned less-than (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFFFF` if `(a < b)`, or `0x0000` otherwise.
     */
    lt_u: byte`\xfd\x30`,
    /**
     * Compares two 128-bit vectors for signed greater-than (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFFFF` if `(a > b)`, or `0x0000` otherwise.
     */
    gt_s: byte`\xfd\x31`,
    /**
     * Compares two 128-bit vectors for unsigned greater-than (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFFFF` if `(a > b)`, or `0x0000` otherwise.
     */
    gt_u: byte`\xfd\x32`,
    /**
     * Compares two 128-bit vectors for signed less-than-or-equal (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFFFF` if `(a ≤ b)`, or `0x0000` otherwise.
     */
    le_s: byte`\xfd\x33`,
    /**
     * Compares two 128-bit vectors for unsigned less-than-or-equal (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFFFF` if `(a ≤ b)`, or `0x0000` otherwise.
     */
    le_u: byte`\xfd\x34`,
    /**
     * Compares two 128-bit vectors for signed greater-than-or-equal (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFFFF` if `(a ≥ b)`, or `0x0000` otherwise.
     */
    ge_s: byte`\xfd\x35`,
    /**
     * Compares two 128-bit vectors for unsigned greater-than-or-equal (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFFFF` if `(a ≥ b)`, or `0x0000` otherwise.
     */
    ge_u: byte`\xfd\x36`,
    /**
     * Adds adjacent pairs of lanes in an `i8x16` vector using signed addition, producing an `i16x8` vector.
     * Pops one vector and pushes a new vector where each lane is the sum of two adjacent lanes.
     */
    extadd_pairwise_i8x16_s: byte`\xfd\x7c`,
    /**
     * Adds adjacent pairs of lanes in an `i8x16` vector using unsigned addition, producing an `i16x8` vector.
     * Pops one vector and pushes a new vector where each lane is the sum of two adjacent lanes.
     */
    extadd_pairwise_i8x16_u: byte`\xfd\x7d`,
    /**
     * Adds adjacent pairs of lanes in an `i16x8` vector using signed addition, producing an `i32x4` vector.
     * Pops one vector and pushes a new vector where each lane is the sum of two adjacent lanes.
     */
    extadd_pairwise_i16x8_s: byte`\xfd\x7e`,
    /**
     * Adds adjacent pairs of lanes in an `i16x8` vector using unsigned addition, producing an `i32x4` vector.
     * Pops one vector and pushes a new vector where each lane is the sum of two adjacent lanes.
     */
    extadd_pairwise_i16x8_u: byte`\xfd\x7f`,
    /**
     * Computes the absolute value of each lane in an `i16x8` vector.
     * Pops one vector and pushes a new vector where each lane is replaced by its absolute value.
     */
    abs: byte`\xfd\x80\x01`,
    /**
     * Negates each lane in an `i16x8` vector.
     * Pops one vector and pushes a new vector where each lane is replaced by its negated value.
     */
    neg: byte`\xfd\x81\x01`,
    /**
     * Performs a signed Q15 multiplication with rounding and saturation on each lane of two `i16x8` vectors.
     * Pops two vectors and pushes a new vector where each lane is `(a * b + 0x4000) >> 15`, saturated to the range of `i16`.
     */
    q15mulr_sat_s: byte`\xfd\x82\x01`,
    /**
     * Checks if all lanes in an `i16x8` vector are non-zero.
     * Pops one vector and pushes `1` (true) if all lanes are non-zero, or `0` (false) otherwise.
     */
    all_true: byte`\xfd\x83\x01`,
    /**
     * Creates a bitmask from an `i16x8` vector.
     * Pops one vector and pushes an `i32` bitmask where each bit corresponds to the sign bit of a lane in the vector.
     */
    bitmask: byte`\xfd\x84\x01`,
    /**
     * Narrows an `i32x4` vector to an `i16x8` vector using signed saturation.
     * Pops two vectors, combines their lanes into a single `i16x8` vector, saturating values that exceed the range of `i16`.
     */
    narrow_i32x4_s: byte`\xfd\x85\x01`,
    /**
     * Narrows an `i32x4` vector to an `i16x8` vector using unsigned saturation.
     * Pops two vectors, combines their lanes into a single `i16x8` vector, saturating values that exceed the range of `u16`.
     */
    narrow_i32x4_u: byte`\xfd\x86\x01`,
    /**
     * Extends the low 8 lanes of an `i8x16` vector to 16 bits using signed extension.
     * Pops one vector and pushes a new vector where each lane is the sign-extended value of the corresponding low lane.
     */
    extend_low_i8x16_s: byte`\xfd\x87\x01`,
    /**
     * Extends the high 8 lanes of an `i8x16` vector to 16 bits using signed extension.
     * Pops one vector and pushes a new vector where each lane is the sign-extended value of the corresponding high lane.
     */
    extend_high_i8x16_s: byte`\xfd\x88\x01`,
    /**
     * Extends the low 8 lanes of an `i8x16` vector to 16 bits using zero extension.
     * Pops one vector and pushes a new vector where each lane is the zero-extended value of the corresponding low lane.
     */
    extend_low_i8x16_u: byte`\xfd\x89\x01`,
    /**
     * Extends the high 8 lanes of an `i8x16` vector to 16 bits using zero extension.
     * Pops one vector and pushes a new vector where each lane is the zero-extended value of the corresponding high lane.
     */
    extend_high_i8x16_u: byte`\xfd\x8a\x01`,
    /**
     * Performs a bitwise left shift on each lane of an `i16x8` vector.
     * Pops one vector and a scalar value, shifts each lane left by the scalar value, and pushes the result.
     */
    shl: byte`\xfd\x8b\x01`,
    /**
     * Performs an arithmetic right shift on each lane of an `i16x8` vector.
     * Pops one vector and a scalar value, shifts each lane right by the scalar value (sign-preserving), and pushes the result.
     */
    shr_s: byte`\xfd\x8c\x01`,
    /**
     * Performs a logical right shift on each lane of an `i16x8` vector.
     * Pops one vector and a scalar value, shifts each lane right by the scalar value (zero-filling), and pushes the result.
     */
    shr_u: byte`\xfd\x8d\x01`,
    /**
     * Adds corresponding lanes of two `i16x8` vectors.
     * Pops two vectors and pushes a new vector where each lane is the sum of the corresponding lanes.
     */
    add: byte`\xfd\x8e\x01`,
    /**
     * Adds corresponding lanes of two `i16x8` vectors using signed saturation.
     * Pops two vectors and pushes a new vector where each lane is saturated if the result exceeds the range of `i16`.
     */
    add_sat_s: byte`\xfd\x8f\x01`,
    /**
     * Adds corresponding lanes of two `i16x8` vectors using unsigned saturation.
     * Pops two vectors and pushes a new vector where each lane is saturated if the result exceeds the range of `u16`.
     */
    add_sat_u: byte`\xfd\x90\x01`,
    /**
     * Subtracts corresponding lanes of two `i16x8` vectors.
     * Pops two vectors and pushes a new vector where each lane is the difference of the corresponding lanes.
     */
    sub: byte`\xfd\x91\x01`,
    /**
     * Subtracts corresponding lanes of two `i16x8` vectors using signed saturation.
     * Pops two vectors and pushes a new vector where each lane is saturated if the result exceeds the range of `i16`.
     */
    sub_sat_s: byte`\xfd\x92\x01`,
    /**
     * Subtracts corresponding lanes of two `i16x8` vectors using unsigned saturation.
     * Pops two vectors and pushes a new vector where each lane is saturated if the result exceeds the range of `u16`.
     */
    sub_sat_u: byte`\xfd\x93\x01`,
    /**
     * Multiplies corresponding lanes of two `i16x8` vectors.
     * Pops two vectors and pushes a new vector where each lane is the product of the corresponding lanes.
     */
    mul: byte`\xfd\x95\x01`,
    /**
     * Computes the minimum of corresponding lanes of two `i16x8` vectors using signed comparison.
     * Pops two vectors and pushes a new vector where each lane is the minimum of the corresponding lanes.
     */
    min_s: byte`\xfd\x96\x01`,
    /**
     * Computes the minimum of corresponding lanes of two `i16x8` vectors using unsigned comparison.
     * Pops two vectors and pushes a new vector where each lane is the minimum of the corresponding lanes.
     */
    min_u: byte`\xfd\x97\x01`,
    /**
     * Computes the maximum of corresponding lanes of two `i16x8` vectors using signed comparison.
     * Pops two vectors and pushes a new vector where each lane is the maximum of the corresponding lanes.
     */
    max_s: byte`\xfd\x98\x01`,
    /**
     * Computes the maximum of corresponding lanes of two `i16x8` vectors using unsigned comparison.
     * Pops two vectors and pushes a new vector where each lane is the maximum of the corresponding lanes.
     */
    max_u: byte`\xfd\x99\x01`,
    /**
     * Computes the unsigned average (rounded) of corresponding lanes of two `i16x8` vectors.
     * Pops two vectors and pushes a new vector where each lane is the rounded average of the corresponding lanes.
     */
    avgr_u: byte`\xfd\x9b\x01`,
    /**
     * Multiplies low 8 lanes of two `i8x16` vectors and extends the result to 16 bits using signed extension.
     * Pops two vectors and pushes a new vector where each lane is the sign-extended product of the corresponding low lanes.
     */
    extmul_low_i8x16_s: byte`\xfd\x9c\x01`,
    /**
     * Multiplies high 8 lanes of two `i8x16` vectors and extends the result to 16 bits using signed extension.
     * Pops two vectors and pushes a new vector where each lane is the sign-extended product of the corresponding high lanes.
     */
    extmul_high_i8x16_s: byte`\xfd\x9d\x01`,
    /**
     * Multiplies low 8 lanes of two `i8x16` vectors and extends the result to 16 bits using zero extension.
     * Pops two vectors and pushes a new vector where each lane is the zero-extended product of the corresponding low lanes.
     */
    extmul_low_i8x16_u: byte`\xfd\x9e\x01`,
    /**
     * Multiplies high 8 lanes of two `i8x16` vectors and extends the result to 16 bits using zero extension.
     * Pops two vectors and pushes a new vector where each lane is the zero-extended product of the corresponding high lanes.
     */
    extmul_high_i8x16_u: byte`\xfd\x9f\x01`,
    /**
     * Pushes a 128-bit constant vector onto the stack.
     * The immediate value is encoded as a vector of 8 16-bit values.
     */
    const: (...vals) => (console.assert(vals.length === 8), [byte`\xfd\x0c`, encode_v128(vals)]),
  },
  I32x4: {
    /**
     * Creates a 128-bit vector by replicating a 32-bit integer across all lanes.
     * Pops 1 value and splats it across all 4 lanes of the vector.
     */
    splat: byte`\xfd\x11`,
    /**
     * Extracts a 32-bit integer from a specific lane of a 128-bit vector.
     * Pops a vector and pushes the extracted lane value as an i32.
     */
    extract_lane: (index) => [byte`\xfd\x1b`, index],
    /**
     * Replaces a specific lane in a 128-bit vector with a new value.
     * Pops a vector and a scalar value, then replaces the specified lane and pushes the updated vector.
     */
    replace_lane: (index) => [byte`\xfd\x1c`, index],
    /**
     * Compares two 128-bit vectors for equality (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if equal, or `0x00000000` otherwise.
     */
    eq: byte`\xfd\x37`,
    /**
     * Compares two 128-bit vectors for inequality (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if not equal, or `0x00000000` otherwise.
     */
    ne: byte`\xfd\x38`,
    /**
     * Compares two 128-bit vectors for signed less-than (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if `(a < b)`, or `0x00000000` otherwise.
     */
    lt_s: byte`\xfd\x39`,
    /**
     * Compares two 128-bit vectors for unsigned less-than (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if `(a < b)`, or `0x00000000` otherwise.
     */
    lt_u: byte`\xfd\x3a`,
    /**
     * Compares two 128-bit vectors for signed greater-than (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if `(a > b)`, or `0x00000000` otherwise.
     */
    gt_s: byte`\xfd\x3b`,
    /**
     * Compares two 128-bit vectors for unsigned greater-than (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if `(a > b)`, or `0x00000000` otherwise.
     */
    gt_u: byte`\xfd\x3c`,
    /**
     * Compares two 128-bit vectors for signed less-than-or-equal (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if `(a ≤ b)`, or `0x00000000` otherwise.
     */
    le_s: byte`\xfd\x3d`,
    /**
     * Compares two 128-bit vectors for unsigned less-than-or-equal (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if `(a ≤ b)`, or `0x00000000` otherwise.
     */
    le_u: byte`\xfd\x3e`,
    /**
     * Compares two 128-bit vectors for signed greater-than-or-equal (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if `(a ≥ b)`, or `0x00000000` otherwise.
     */
    ge_s: byte`\xfd\x3f`,
    /**
     * Compares two 128-bit vectors for unsigned greater-than-or-equal (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if `(a ≥ b)`, or `0x00000000` otherwise.
     */
    ge_u: byte`\xfd\x40`,
    /**
     * Computes the absolute value of each lane in an `i32x4` vector.
     * Pops one vector and pushes a new vector where each lane is replaced by its absolute value.
     */
    abs: byte`\xfd\xa0\x01`,
    /**
     * Negates each lane in an `i32x4` vector.
     * Pops one vector and pushes a new vector where each lane is replaced by its negated value.
     */
    neg: byte`\xfd\xa1\x01`,
    /**
     * Checks if all lanes in an `i32x4` vector are non-zero.
     * Pops one vector and pushes `1` (true) if all lanes are non-zero, or `0` (false) otherwise.
     */
    all_true: byte`\xfd\xa3\x01`,
    /**
     * Creates a bitmask from an `i32x4` vector.
     * Pops one vector and pushes an `i32` bitmask where each bit corresponds to the sign bit of a lane in the vector.
     */
    bitmask: byte`\xfd\xa4\x01`,
    /**
     * Extends the low 4 lanes of an `i16x8` vector to 32 bits using signed extension.
     * Pops one vector and pushes a new vector where each lane is the sign-extended value of the corresponding low lane.
     */
    extend_low_i16x8_s: byte`\xfd\xa7\x01`,
    /**
     * Extends the high 4 lanes of an `i16x8` vector to 32 bits using signed extension.
     * Pops one vector and pushes a new vector where each lane is the sign-extended value of the corresponding high lane.
     */
    extend_high_i16x8_s: byte`\xfd\xa8\x01`,
    /**
     * Extends the low 4 lanes of an `i16x8` vector to 32 bits using zero extension.
     * Pops one vector and pushes a new vector where each lane is the zero-extended value of the corresponding low lane.
     */
    extend_low_i16x8_u: byte`\xfd\xa9\x01`,
    /**
     * Extends the high 4 lanes of an `i16x8` vector to 32 bits using zero extension.
     * Pops one vector and pushes a new vector where each lane is the zero-extended value of the corresponding high lane.
     */
    extend_high_i16x8_u: byte`\xfd\xaa\x01`,
    /**
     * Performs a bitwise left shift on each lane of an `i32x4` vector.
     * Pops one vector and a scalar value, shifts each lane left by the scalar value, and pushes the result.
     */
    shl: byte`\xfd\xab\x01`,
    /**
     * Performs an arithmetic right shift on each lane of an `i32x4` vector.
     * Pops one vector and a scalar value, shifts each lane right by the scalar value (sign-preserving), and pushes the result.
     */
    shr_s: byte`\xfd\xac\x01`,
    /**
     * Performs a logical right shift on each lane of an `i32x4` vector.
     * Pops one vector and a scalar value, shifts each lane right by the scalar value (zero-filling), and pushes the result.
     */
    shr_u: byte`\xfd\xad\x01`,
    /**
     * Adds corresponding lanes of two `i32x4` vectors.
     * Pops two vectors and pushes a new vector where each lane is the sum of the corresponding lanes.
     */
    add: byte`\xfd\xae\x01`,
    /**
     * Subtracts corresponding lanes of two `i32x4` vectors.
     * Pops two vectors and pushes a new vector where each lane is the difference of the corresponding lanes.
     */
    sub: byte`\xfd\xb1\x01`,
    /**
     * Multiplies corresponding lanes of two `i32x4` vectors.
     * Pops two vectors and pushes a new vector where each lane is the product of the corresponding lanes.
     */
    mul: byte`\xfd\xb5\x01`,
    /**
     * Computes the minimum of corresponding lanes of two `i32x4` vectors using signed comparison.
     * Pops two vectors and pushes a new vector where each lane is the minimum of the corresponding lanes.
     */
    min_s: byte`\xfd\xb6\x01`,
    /**
     * Computes the minimum of corresponding lanes of two `i32x4` vectors using unsigned comparison.
     * Pops two vectors and pushes a new vector where each lane is the minimum of the corresponding lanes.
     */
    min_u: byte`\xfd\xb7\x01`,
    /**
     * Computes the maximum of corresponding lanes of two `i32x4` vectors using signed comparison.
     * Pops two vectors and pushes a new vector where each lane is the maximum of the corresponding lanes.
     */
    max_s: byte`\xfd\xb8\x01`,
    /**
     * Computes the maximum of corresponding lanes of two `i32x4` vectors using unsigned comparison.
     * Pops two vectors and pushes a new vector where each lane is the maximum of the corresponding lanes.
     */
    max_u: byte`\xfd\xb9\x01`,
    /**
     * Computes the dot product of two `i16x8` vectors, producing an `i32x4` vector.
     * Pops two vectors, computes the dot product of adjacent pairs of lanes, and pushes the result as an `i32x4` vector.
     */
    dot_i16x8_s: byte`\xfd\xba\x01`,
    /**
     * Multiplies low 4 lanes of two `i16x8` vectors and extends the result to 32 bits using signed extension.
     * Pops two vectors and pushes a new vector where each lane is the sign-extended product of the corresponding low lanes.
     */
    extmul_low_i16x8_s: byte`\xfd\xbb\x01`,
    /**
     * Multiplies high 4 lanes of two `i16x8` vectors and extends the result to 32 bits using signed extension.
     * Pops two vectors and pushes a new vector where each lane is the sign-extended product of the corresponding high lanes.
     */
    extmul_high_i16x8_s: byte`\xfd\xbc\x01`,
    /**
     * Multiplies low 4 lanes of two `i16x8` vectors and extends the result to 32 bits using zero extension.
     * Pops two vectors and pushes a new vector where each lane is the zero-extended product of the corresponding low lanes.
     */
    extmul_low_i16x8_u: byte`\xfd\xbd\x01`,
    /**
     * Multiplies high 4 lanes of two `i16x8` vectors and extends the result to 32 bits using zero extension.
     * Pops two vectors and pushes a new vector where each lane is the zero-extended product of the corresponding high lanes.
     */
    extmul_high_i16x8_u: byte`\xfd\xbe\x01`,
    /**
     * Converts each lane of an `f32x4` vector to a signed `i32x4` vector using saturation.
     * Pops one vector and pushes a new vector where each lane is truncated to `i32` with saturation if the result exceeds the range of `i32`.
     */
    trunc_sat_f32x4_s: byte`\xfd\xf8\x01`,
    /**
     * Converts each lane of an `f32x4` vector to an unsigned `i32x4` vector using saturation.
     * Pops one vector and pushes a new vector where each lane is truncated to `u32` with saturation if the result exceeds the range of `u32`.
     */
    trunc_sat_f32x4_u: byte`\xfd\xf9\x01`,
    /**
     * Converts the low two lanes of an `f64x2` vector to a signed `i32x4` vector using saturation.
     * Pops one vector and pushes a new vector where the low two lanes are truncated to `i32` with saturation, and the high two lanes are zeroed.
     */
    trunc_sat_f64x2_s_zero: byte`\xfd\xfc\x01`,
    /**
     * Converts the low two lanes of an `f64x2` vector to an unsigned `i32x4` vector using saturation.
     * Pops one vector and pushes a new vector where the low two lanes are truncated to `u32` with saturation, and the high two lanes are zeroed.
     */
    trunc_sat_f64x2_u_zero: byte`\xfd\xfd\x01`,
    /**
     * Pushes a 128-bit constant vector onto the stack.
     * The immediate value is encoded as a vector of 4 32-bit values.
     */
    const: (...vals) => (console.assert(vals.length === 4), [byte`\xfd\x0c`, encode_v128(vals)]),
  },
  I64x2: {
    /**
     * Creates a 128-bit vector by replicating a 64-bit integer across all lanes.
     * Pops 1 value and splats it across all 2 lanes of the vector.
     */
    splat: byte`\xfd\x12`,
    /**
     * Extracts a 64-bit integer from a specific lane of a 128-bit vector.
     * Pops a vector and pushes the extracted lane value as an i64.
     */
    extract_lane: (index) => [byte`\xfd\x1d`, index],
    /**
     * Replaces a specific lane in a 128-bit vector with a new value.
     * Pops a vector and a scalar value, then replaces the specified lane and pushes the updated vector.
     */
    replace_lane: (index) => [byte`\xfd\x1e`, index],
    /**
     * Computes the absolute value of each lane in an `i64x2` vector.
     * Pops one vector and pushes a new vector where each lane is replaced by its absolute value.
     */
    abs: byte`\xfd\xc0\x01`,
    /**
     * Negates each lane in an `i64x2` vector.
     * Pops one vector and pushes a new vector where each lane is replaced by its negated value.
     */
    neg: byte`\xfd\xc1\x01`,
    /**
     * Checks if all lanes in an `i64x2` vector are non-zero.
     * Pops one vector and pushes `1` (true) if all lanes are non-zero, or `0` (false) otherwise.
     */
    all_true: byte`\xfd\xc3\x01`,
    /**
     * Creates a bitmask from an `i64x2` vector.
     * Pops one vector and pushes an `i32` bitmask where each bit corresponds to the sign bit of a lane in the vector.
     */
    bitmask: byte`\xfd\xc4\x01`,
    /**
     * Extends the low 2 lanes of an `i32x4` vector to 64 bits using signed extension.
     * Pops one vector and pushes a new vector where each lane is the sign-extended value of the corresponding low lane.
     */
    extend_low_i32x4_s: byte`\xfd\xc7\x01`,
    /**
     * Extends the high 2 lanes of an `i32x4` vector to 64 bits using signed extension.
     * Pops one vector and pushes a new vector where each lane is the sign-extended value of the corresponding high lane.
     */
    extend_high_i32x4_s: byte`\xfd\xc8\x01`,
    /**
     * Extends the low 2 lanes of an `i32x4` vector to 64 bits using zero extension.
     * Pops one vector and pushes a new vector where each lane is the zero-extended value of the corresponding low lane.
     */
    extend_low_i32x4_u: byte`\xfd\xc9\x01`,
    /**
     * Extends the high 2 lanes of an `i32x4` vector to 64 bits using zero extension.
     * Pops one vector and pushes a new vector where each lane is the zero-extended value of the corresponding high lane.
     */
    extend_high_i32x4_u: byte`\xfd\xca\x01`,
    /**
     * Performs a bitwise left shift on each lane of an `i64x2` vector.
     * Pops one vector and a scalar value, shifts each lane left by the scalar value, and pushes the result.
     */
    shl: byte`\xfd\xcb\x01`,
    /**
     * Performs an arithmetic right shift on each lane of an `i64x2` vector.
     * Pops one vector and a scalar value, shifts each lane right by the scalar value (sign-preserving), and pushes the result.
     */
    shr_s: byte`\xfd\xcc\x01`,
    /**
     * Performs a logical right shift on each lane of an `i64x2` vector.
     * Pops one vector and a scalar value, shifts each lane right by the scalar value (zero-filling), and pushes the result.
     */
    shr_u: byte`\xfd\xcd\x01`,
    /**
     * Adds corresponding lanes of two `i64x2` vectors.
     * Pops two vectors and pushes a new vector where each lane is the sum of the corresponding lanes.
     */
    add: byte`\xfd\xce\x01`,
    /**
     * Subtracts corresponding lanes of two `i64x2` vectors.
     * Pops two vectors and pushes a new vector where each lane is the difference of the corresponding lanes.
     */
    sub: byte`\xfd\xd1\x01`,
    /**
     * Multiplies corresponding lanes of two `i64x2` vectors.
     * Pops two vectors and pushes a new vector where each lane is the product of the corresponding lanes.
     */
    mul: byte`\xfd\xd5\x01`,
    /**
     * Compares two `i64x2` vectors for equality (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if equal, or `0x0000000000000000` otherwise.
     */
    eq: byte`\xfd\xd6\x01`,
    /**
     * Compares two `i64x2` vectors for inequality (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if not equal, or `0x0000000000000000` otherwise.
     */
    ne: byte`\xfd\xd7\x01`,
    /**
     * Compares two `i64x2` vectors for signed less-than (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if `(a < b)`, or `0x0000000000000000` otherwise.
     */
    lt_s: byte`\xfd\xd8\x01`,
    /**
     * Compares two `i64x2` vectors for signed greater-than (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if `(a > b)`, or `0x0000000000000000` otherwise.
     */
    gt_s: byte`\xfd\xd9\x01`,
    /**
     * Compares two `i64x2` vectors for signed less-than-or-equal (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if `(a ≤ b)`, or `0x0000000000000000` otherwise.
     */
    le_s: byte`\xfd\xda\x01`,
    /**
     * Compares two `i64x2` vectors for signed greater-than-or-equal (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if `(a ≥ b)`, or `0x0000000000000000` otherwise.
     */
    ge_s: byte`\xfd\xdb\x01`,
    /**
     * Multiplies low 2 lanes of two `i32x4` vectors and extends the result to 64 bits using signed extension.
     * Pops two vectors and pushes a new vector where each lane is the sign-extended product of the corresponding low lanes.
     */
    extmul_low_i32x4_s: byte`\xfd\xdc\x01`,
    /**
     * Multiplies high 2 lanes of two `i32x4` vectors and extends the result to 64 bits using signed extension.
     * Pops two vectors and pushes a new vector where each lane is the sign-extended product of the corresponding high lanes.
     */
    extmul_high_i32x4_s: byte`\xfd\xdd\x01`,
    /**
     * Multiplies low 2 lanes of two `i32x4` vectors and extends the result to 64 bits using zero extension.
     * Pops two vectors and pushes a new vector where each lane is the zero-extended product of the corresponding low lanes.
     */
    extmul_low_i32x4_u: byte`\xfd\xde\x01`,
    /**
     * Multiplies high 2 lanes of two `i32x4` vectors and extends the result to 64 bits using zero extension.
     * Pops two vectors and pushes a new vector where each lane is the zero-extended product of the corresponding high lanes.
     */
    extmul_high_i32x4_u: byte`\xfd\xdf\x01`,
    /**
     * Pushes a 128-bit constant vector onto the stack.
     * The immediate value is encoded as a vector of 2 64-bit values.
     */
    const: (...vals) => (console.assert(vals.length === 2), [byte`\xfd\x0c`, encode_v128(vals)]),
  },
  F32x4: {
    /**
     * Creates a 128-bit vector by replicating a 32-bit float across all lanes.
     * Pops 1 value and splats it across all 4 lanes of the vector.
     */
    splat: byte`\xfd\x13`,
    /**
     * Extracts a 32-bit float from a specific lane of a 128-bit vector.
     * Pops a vector and pushes the extracted lane value as an f32.
     */
    extract_lane: (index) => [byte`\xfd\x1f`, index],
    /**
     * Replaces a specific lane in a 128-bit vector with a new value.
     * Pops a vector and a scalar value, then replaces the specified lane and pushes the updated vector.
     */
    replace_lane: (index) => [byte`\xfd\x20`, index],
    /**
     * Compares two 128-bit vectors of 32-bit floats for equality (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if equal, or `0x00000000` otherwise.
     */
    eq: byte`\xfd\x41`,
    /**
     * Compares two 128-bit vectors of 32-bit floats for inequality (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if not equal, or `0x00000000` otherwise.
     */
    ne: byte`\xfd\x42`,
    /**
     * Compares two 128-bit vectors of 32-bit floats for less-than (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if `(a < b)`, or `0x00000000` otherwise.
     */
    lt: byte`\xfd\x43`,
    /**
     * Compares two 128-bit vectors of 32-bit floats for greater-than (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if `(a > b)`, or `0x00000000` otherwise.
     */
    gt: byte`\xfd\x44`,
    /**
     * Compares two 128-bit vectors of 32-bit floats for less-than-or-equal (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if `(a ≤ b)`, or `0x00000000` otherwise.
     */
    le: byte`\xfd\x45`,
    /**
     * Compares two 128-bit vectors of 32-bit floats for greater-than-or-equal (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFF` if `(a ≥ b)`, or `0x00000000` otherwise.
     */
    ge: byte`\xfd\x46`,
    /**
     * Converts two 64-bit floats in a `f64x2` vector to two 32-bit floats in an `f32x4` vector.
     * The high lanes of the result are set to zero.
     * Pops one vector and pushes the converted vector.
     */
    demote_f64x2_zero: byte`\xfd\x5e`,
    /**
     * Rounds each lane of an `f32x4` vector up to the nearest integer.
     * Pops one vector and pushes a new vector where each lane is rounded up.
     */
    ceil: byte`\xfd\x67`,
    /**
     * Rounds each lane of an `f32x4` vector down to the nearest integer.
     * Pops one vector and pushes a new vector where each lane is rounded down.
     */
    floor: byte`\xfd\x68`,
    /**
     * Truncates each lane of an `f32x4` vector toward zero.
     * Pops one vector and pushes a new vector where each lane is truncated.
     */
    trunc: byte`\xfd\x69`,
    /**
     * Rounds each lane of an `f32x4` vector to the nearest integer (ties to even).
     * Pops one vector and pushes a new vector where each lane is rounded.
     */
    nearest: byte`\xfd\x6a`,
    /**
     * Computes the absolute value of each lane in an `f32x4` vector.
     * Pops one vector and pushes a new vector where each lane is replaced by its absolute value.
     */
    abs: byte`\xfd\xe0\x01`,
    /**
     * Negates each lane in an `f32x4` vector.
     * Pops one vector and pushes a new vector where each lane is replaced by its negated value.
     */
    neg: byte`\xfd\xe1\x01`,
    /**
     * Computes the square root of each lane in an `f32x4` vector.
     * Pops one vector and pushes a new vector where each lane is replaced by its square root.
     */
    sqrt: byte`\xfd\xe3\x01`,
    /**
     * Adds corresponding lanes of two `f32x4` vectors.
     * Pops two vectors and pushes a new vector where each lane is the sum of the corresponding lanes.
     */
    add: byte`\xfd\xe4\x01`,
    /**
     * Subtracts corresponding lanes of two `f32x4` vectors.
     * Pops two vectors and pushes a new vector where each lane is the difference of the corresponding lanes.
     */
    sub: byte`\xfd\xe5\x01`,
    /**
     * Multiplies corresponding lanes of two `f32x4` vectors.
     * Pops two vectors and pushes a new vector where each lane is the product of the corresponding lanes.
     */
    mul: byte`\xfd\xe6\x01`,
    /**
     * Divides corresponding lanes of two `f32x4` vectors.
     * Pops two vectors and pushes a new vector where each lane is the quotient of the corresponding lanes.
     */
    div: byte`\xfd\xe7\x01`,
    /**
     * Computes the minimum of corresponding lanes of two `f32x4` vectors.
     * Pops two vectors and pushes a new vector where each lane is the minimum of the corresponding lanes.
     */
    min: byte`\xfd\xe8\x01`,
    /**
     * Computes the maximum of corresponding lanes of two `f32x4` vectors.
     * Pops two vectors and pushes a new vector where each lane is the maximum of the corresponding lanes.
     */
    max: byte`\xfd\xe9\x01`,
    /**
     * Computes the pairwise minimum of two `f32x4` vectors.
     * Pops two vectors and pushes a new vector where each lane is the minimum of the corresponding lanes, propagating NaNs.
     */
    pmin: byte`\xfd\xea\x01`,
    /**
     * Computes the pairwise maximum of two `f32x4` vectors.
     * Pops two vectors and pushes a new vector where each lane is the maximum of the corresponding lanes, propagating NaNs.
     */
    pmax: byte`\xfd\xeb\x01`,
    /**
     * Converts each lane of an `i32x4` vector to an `f32x4` vector using signed conversion.
     * Pops one vector and pushes a new vector where each lane is converted to `f32`.
     */
    convert_i32x4_s: byte`\xfd\xfa\x01`,
    /**
     * Converts each lane of an `i32x4` vector to an `f32x4` vector using unsigned conversion.
     * Pops one vector and pushes a new vector where each lane is converted to `f32`.
     */
    convert_i32x4_u: byte`\xfd\xfb\x01`,
    /**
     * Pushes a 128-bit constant vector onto the stack.
     * The immediate value is encoded as a vector of 4 32-bit float values.
     */
    const: (...vals) => (console.assert(vals.length === 4), [byte`\xfd\x0c`, encode_v128(vals)]),
  },
  F64x2: {
    /**
     * Creates a 128-bit vector by replicating a 64-bit float across all lanes.
     * Pops 1 value and splats it across all 2 lanes of the vector.
     */
    splat: byte`\xfd\x14`,
    /**
     * Extracts a 64-bit float from a specific lane of a 128-bit vector.
     * Pops a vector and pushes the extracted lane value as an f64.
     */
    extract_lane: (index) => [byte`\xfd\x21`, index],
    /**
     * Replaces a specific lane in a 128-bit vector with a new value.
     * Pops a vector and a scalar value, then replaces the specified lane and pushes the updated vector.
     */
    replace_lane: (index) => [byte`\xfd\x22`, index],
    /**
     * Compares two 128-bit vectors of 64-bit floats for equality (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if equal, or `0x0000000000000000` otherwise.
     */
    eq: byte`\xfd\x47`,
    /**
     * Compares two 128-bit vectors of 64-bit floats for inequality (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if not equal, or `0x0000000000000000` otherwise.
     */
    ne: byte`\xfd\x48`,
    /**
     * Compares two 128-bit vectors of 64-bit floats for less-than (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if `(a < b)`, or `0x0000000000000000` otherwise.
     */
    lt: byte`\xfd\x49`,
    /**
     * Compares two 128-bit vectors of 64-bit floats for greater-than (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if `(a > b)`, or `0x0000000000000000` otherwise.
     */
    gt: byte`\xfd\x4a`,
    /**
     * Compares two 128-bit vectors of 64-bit floats for less-than-or-equal (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if `(a ≤ b)`, or `0x0000000000000000` otherwise.
     */
    le: byte`\xfd\x4b`,
    /**
     * Compares two 128-bit vectors of 64-bit floats for greater-than-or-equal (per-lane).
     * Pops two vectors and pushes a new vector where each lane is `0xFFFFFFFFFFFFFFFF` if `(a ≥ b)`, or `0x0000000000000000` otherwise.
     */
    ge: byte`\xfd\x4c`,
    /**
     * Converts the low two 32-bit floats in an `f32x4` vector to two 64-bit floats in an `f64x2` vector.
     * Pops one vector and pushes the converted vector.
     */
    promote_low_f32x4: byte`\xfd\x5f`,
    /**
     * Rounds each lane of an `f64x2` vector up to the nearest integer.
     * Pops one vector and pushes a new vector where each lane is rounded up.
     */
    ceil: byte`\xfd\x74`,
    /**
     * Rounds each lane of an `f64x2` vector down to the nearest integer.
     * Pops one vector and pushes a new vector where each lane is rounded down.
     */
    floor: byte`\xfd\x75`,
    /**
     * Truncates each lane of an `f64x2` vector toward zero.
     * Pops one vector and pushes a new vector where each lane is truncated.
     */
    trunc: byte`\xfd\x7a`,
    /**
     * Rounds each lane of an `f64x2` vector to the nearest integer (ties to even).
     * Pops one vector and pushes a new vector where each lane is rounded.
     */
    nearest: byte`\xfd\x94\x01`,
    /**
     * Computes the absolute value of each lane in an `f64x2` vector.
     * Pops one vector and pushes a new vector where each lane is replaced by its absolute value.
     */
    abs: byte`\xfd\xec\x01`,
    /**
     * Negates each lane in an `f64x2` vector.
     * Pops one vector and pushes a new vector where each lane is replaced by its negated value.
     */
    neg: byte`\xfd\xed\x01`,
    /**
     * Computes the square root of each lane in an `f64x2` vector.
     * Pops one vector and pushes a new vector where each lane is replaced by its square root.
     */
    sqrt: byte`\xfd\xef\x01`,
    /**
     * Adds corresponding lanes of two `f64x2` vectors.
     * Pops two vectors and pushes a new vector where each lane is the sum of the corresponding lanes.
     */
    add: byte`\xfd\xf0\x01`,
    /**
     * Subtracts corresponding lanes of two `f64x2` vectors.
     * Pops two vectors and pushes a new vector where each lane is the difference of the corresponding lanes.
     */
    sub: byte`\xfd\xf1\x01`,
    /**
     * Multiplies corresponding lanes of two `f64x2` vectors.
     * Pops two vectors and pushes a new vector where each lane is the product of the corresponding lanes.
     */
    mul: byte`\xfd\xf2\x01`,
    /**
     * Divides corresponding lanes of two `f64x2` vectors.
     * Pops two vectors and pushes a new vector where each lane is the quotient of the corresponding lanes.
     */
    div: byte`\xfd\xf3\x01`,
    /**
     * Computes the minimum of corresponding lanes of two `f64x2` vectors.
     * Pops two vectors and pushes a new vector where each lane is the minimum of the corresponding lanes.
     */
    min: byte`\xfd\xf4\x01`,
    /**
     * Computes the maximum of corresponding lanes of two `f64x2` vectors.
     * Pops two vectors and pushes a new vector where each lane is the maximum of the corresponding lanes.
     */
    max: byte`\xfd\xf5\x01`,
    /**
     * Computes the pairwise minimum of two `f64x2` vectors.
     * Pops two vectors and pushes a new vector where each lane is the minimum of the corresponding lanes, propagating NaNs.
     */
    pmin: byte`\xfd\xf6\x01`,
    /**
     * Computes the pairwise maximum of two `f64x2` vectors.
     * Pops two vectors and pushes a new vector where each lane is the maximum of the corresponding lanes, propagating NaNs.
     */
    pmax: byte`\xfd\xf7\x01`,
    /**
     * Converts the low two lanes of an `i32x4` vector to an `f64x2` vector using signed conversion.
     * Pops one vector and pushes a new vector where the low two lanes are converted to `f64`.
     */
    convert_low_i32x4_s: byte`\xfd\xfe\x01`,
    /**
     * Converts the low two lanes of an `i32x4` vector to an `f64x2` vector using unsigned conversion.
     * Pops one vector and pushes a new vector where the low two lanes are converted to `f64`.
     */
    convert_low_i32x4_u: byte`\xfd\xff\x01`,
    /**
     * Pushes a 128-bit constant vector onto the stack.
     * The immediate value is encoded as a vector of 2 64-bit float values.
     */
    const: (...vals) => (console.assert(vals.length === 2), [byte`\xfd\x0c`, encode_v128(vals)]),
  },
  // reflected part
  [byte`\x00`]: `unreachable`,
  [byte`\x01`]: `nop`,
  [byte`\x02`]: `block`,
  [byte`\x03`]: `loop`,
  [byte`\x04`]: `if`,
  [byte`\x05`]: `else`,
  [byte`\x0b`]: `end`,
  [byte`\x0c`]: `br`,
  [byte`\x0d`]: `br_if`,
  [byte`\x0e`]: `br_table`,
  [byte`\x0f`]: `return`,
  [byte`\x10`]: `call`,
  [byte`\x11`]: `call_indirect`,
  [byte`\x1a`]: `drop`,
  [byte`\x1b`]: `select`,
  [byte`\x1c`]: `selectt`,
  [byte`\x20`]: `local_get`,
  [byte`\x21`]: `local_set`,
  [byte`\x22`]: `local_tee`,
  [byte`\x23`]: `global_get`,
  [byte`\x24`]: `global_set`,
  [byte`\x25`]: `table_get`,
  [byte`\x26`]: `table_set`,
  [byte`\x28`]: `i32_load`,
  [byte`\x29`]: `i64_load`,
  [byte`\x2a`]: `f32_load`,
  [byte`\x2b`]: `f64_load`,
  [byte`\x2c`]: `i32_load8_s`,
  [byte`\x2d`]: `i32_load8_u`,
  [byte`\x2e`]: `i32_load16_s`,
  [byte`\x2f`]: `i32_load16_u`,
  [byte`\x30`]: `i64_load8_s`,
  [byte`\x31`]: `i64_load8_u`,
  [byte`\x32`]: `i64_load16_s`,
  [byte`\x33`]: `i64_load16_u`,
  [byte`\x34`]: `i64_load32_s`,
  [byte`\x35`]: `i64_load32_u`,
  [byte`\x36`]: `i32_store`,
  [byte`\x37`]: `i64_store`,
  [byte`\x38`]: `f32_store`,
  [byte`\x39`]: `f64_store`,
  [byte`\x3a`]: `i32_store8`,
  [byte`\x3b`]: `i32_store16`,
  [byte`\x3c`]: `i64_store8`,
  [byte`\x3d`]: `i64_store16`,
  [byte`\x3e`]: `i64_store32`,
  [byte`\x3f`]: `memory_size`,
  [byte`\x40`]: `memory_grow`,
  [byte`\x41`]: `i32_const`,
  [byte`\x42`]: `i64_const`,
  [byte`\x43`]: `f32_const`,
  [byte`\x44`]: `f64_const`,
  [byte`\x45`]: `i32_eqz`,
  [byte`\x46`]: `i32_eq`,
  [byte`\x47`]: `i32_ne`,
  [byte`\x48`]: `i32_lt_s`,
  [byte`\x49`]: `i32_lt_u`,
  [byte`\x4a`]: `i32_gt_s`,
  [byte`\x4b`]: `i32_gt_u`,
  [byte`\x4c`]: `i32_le_s`,
  [byte`\x4d`]: `i32_le_u`,
  [byte`\x4e`]: `i32_ge_s`,
  [byte`\x4f`]: `i32_ge_u`,
  [byte`\x50`]: `i64_eqz`,
  [byte`\x51`]: `i64_eq`,
  [byte`\x52`]: `i64_ne`,
  [byte`\x53`]: `i64_lt_s`,
  [byte`\x54`]: `i64_lt_u`,
  [byte`\x55`]: `i64_gt_s`,
  [byte`\x56`]: `i64_gt_u`,
  [byte`\x57`]: `i64_le_s`,
  [byte`\x58`]: `i64_le_u`,
  [byte`\x59`]: `i64_ge_s`,
  [byte`\x5a`]: `i64_ge_u`,
  [byte`\x5b`]: `f32_eq`,
  [byte`\x5c`]: `f32_ne`,
  [byte`\x5d`]: `f32_lt`,
  [byte`\x5e`]: `f32_gt`,
  [byte`\x5f`]: `f32_le`,
  [byte`\x60`]: `f32_ge`,
  [byte`\x61`]: `f64_eq`,
  [byte`\x62`]: `f64_ne`,
  [byte`\x63`]: `f64_lt`,
  [byte`\x64`]: `f64_gt`,
  [byte`\x65`]: `f64_le`,
  [byte`\x66`]: `f64_ge`,
  [byte`\x67`]: `i32_clz`,
  [byte`\x68`]: `i32_ctz`,
  [byte`\x69`]: `i32_popcnt`,
  [byte`\x6a`]: `i32_add`,
  [byte`\x6b`]: `i32_sub`,
  [byte`\x6c`]: `i32_mul`,
  [byte`\x6d`]: `i32_div_s`,
  [byte`\x6e`]: `i32_div_u`,
  [byte`\x6f`]: `i32_rem_s`,
  [byte`\x70`]: `i32_rem_u`,
  [byte`\x71`]: `i32_and`,
  [byte`\x72`]: `i32_or`,
  [byte`\x73`]: `i32_xor`,
  [byte`\x74`]: `i32_shl`,
  [byte`\x75`]: `i32_shr_s`,
  [byte`\x76`]: `i32_shr_u`,
  [byte`\x77`]: `i32_rotl`,
  [byte`\x78`]: `i32_rotr`,
  [byte`\x79`]: `i64_clz`,
  [byte`\x7a`]: `i64_ctz`,
  [byte`\x7b`]: `i64_popcnt`,
  [byte`\x7c`]: `i64_add`,
  [byte`\x7d`]: `i64_sub`,
  [byte`\x7e`]: `i64_mul`,
  [byte`\x7f`]: `i64_div_s`,
  [byte`\x80`]: `i64_div_u`,
  [byte`\x81`]: `i64_rem_s`,
  [byte`\x82`]: `i64_rem_u`,
  [byte`\x83`]: `i64_and`,
  [byte`\x84`]: `i64_or`,
  [byte`\x85`]: `i64_xor`,
  [byte`\x86`]: `i64_shl`,
  [byte`\x87`]: `i64_shr_s`,
  [byte`\x88`]: `i64_shr_u`,
  [byte`\x89`]: `i64_rotl`,
  [byte`\x8a`]: `i64_rotr`,
  [byte`\x8b`]: `f32_abs`,
  [byte`\x8c`]: `f32_neg`,
  [byte`\x8d`]: `f32_ceil`,
  [byte`\x8e`]: `f32_floor`,
  [byte`\x8f`]: `f32_trunc`,
  [byte`\x90`]: `f32_nearest`,
  [byte`\x91`]: `f32_sqrt`,
  [byte`\x92`]: `f32_add`,
  [byte`\x93`]: `f32_sub`,
  [byte`\x94`]: `f32_mul`,
  [byte`\x95`]: `f32_div`,
  [byte`\x96`]: `f32_min`,
  [byte`\x97`]: `f32_max`,
  [byte`\x98`]: `f32_copysign`,
  [byte`\x99`]: `f64_abs`,
  [byte`\x9a`]: `f64_neg`,
  [byte`\x9b`]: `f64_ceil`,
  [byte`\x9c`]: `f64_floor`,
  [byte`\x9d`]: `f64_trunc`,
  [byte`\x9e`]: `f64_nearest`,
  [byte`\x9f`]: `f64_sqrt`,
  [byte`\xa0`]: `f64_add`,
  [byte`\xa1`]: `f64_sub`,
  [byte`\xa2`]: `f64_mul`,
  [byte`\xa3`]: `f64_div`,
  [byte`\xa4`]: `f64_min`,
  [byte`\xa5`]: `f64_max`,
  [byte`\xa6`]: `f64_copysign`,
  [byte`\xa7`]: `i32_wrap_i64`,
  [byte`\xa8`]: `i32_trunc_f32_s`,
  [byte`\xa9`]: `i32_trunc_f32_u`,
  [byte`\xaa`]: `i32_trunc_f64_s`,
  [byte`\xab`]: `i32_trunc_f64_u`,
  [byte`\xac`]: `i64_extend_i32_s`,
  [byte`\xad`]: `i64_extend_i32_u`,
  [byte`\xae`]: `i64_trunc_f32_s`,
  [byte`\xaf`]: `i64_trunc_f32_u`,
  [byte`\xb0`]: `i64_trunc_f64_s`,
  [byte`\xb1`]: `i64_trunc_f64_u`,
  [byte`\xb2`]: `f32_convert_i32_s`,
  [byte`\xb3`]: `f32_convert_i32_u`,
  [byte`\xb4`]: `f32_convert_i64_s`,
  [byte`\xb5`]: `f32_convert_i64_u`,
  [byte`\xb6`]: `f32_demote_f64`,
  [byte`\xb7`]: `f64_convert_i32_s`,
  [byte`\xb8`]: `f64_convert_i32_u`,
  [byte`\xb9`]: `f64_convert_i64_s`,
  [byte`\xba`]: `f64_convert_i64_u`,
  [byte`\xbb`]: `f64_promote_f32`,
  [byte`\xbc`]: `i32_reinterpret_f32`,
  [byte`\xbd`]: `i64_reinterpret_f64`,
  [byte`\xbe`]: `f32_reinterpret_i32`,
  [byte`\xbf`]: `f64_reinterpret_f64`,
  [byte`\xc0`]: `i32_extend8_s`,
  [byte`\xc1`]: `i32_extend16_s`,
  [byte`\xc2`]: `i64_extend8_s`,
  [byte`\xc3`]: `i64_extend16_s`,
  [byte`\xc4`]: `i64_extend_32_s`,
  [byte`\xd0`]: `ref_null`,
  [byte`\xd1`]: `ref_is_null`,
  [byte`\xd2`]: `ref_func`,
  [byte`\xfc\x00`]: `i32_trunc_sat_f32_s`,
  [byte`\xfc\x01`]: `i32_trunc_sat_f32_u`,
  [byte`\xfc\x02`]: `i32_trunc_sat_f64_s`,
  [byte`\xfc\x03`]: `i32_trunc_sat_f64_u`,
  [byte`\xfc\x04`]: `i64_trunc_sat_f32_s`,
  [byte`\xfc\x05`]: `i64_trunc_sat_f32_u`,
  [byte`\xfc\x06`]: `i64_trunc_sat_f64_s`,
  [byte`\xfc\x07`]: `i64_trunc_sat_f64_u`,
  [byte`\xfc\x08`]: `memory_init`,
  [byte`\xfc\x09`]: `data_drop`,
  [byte`\xfc\x0a`]: `memory_copy`,
  [byte`\xfc\x0b`]: `memory_fill`,
  [byte`\xfc\x0c`]: `table_init`,
  [byte`\xfc\x0d`]: `elem_drop`,
  [byte`\xfc\x0e`]: `table_copy`,
  [byte`\xfc\x0f`]: `table_grow`,
  [byte`\xfc\x10`]: `table_size`,
  [byte`\xfc\x11`]: `table_fill`,
  [byte`\xfd\x00`]: `v128_load`,
  [byte`\xfd\x01`]: `v128_load8x8_s`,
  [byte`\xfd\x02`]: `v128_load8x8_u`,
  [byte`\xfd\x03`]: `v128_load16x4_s`,
  [byte`\xfd\x04`]: `v128_load16x4_u`,
  [byte`\xfd\x05`]: `v128_load32x2_s`,
  [byte`\xfd\x06`]: `v128_load32x2_u`,
  [byte`\xfd\x07`]: `v128_load8_splat`,
  [byte`\xfd\x08`]: `v128_load16_splat`,
  [byte`\xfd\x09`]: `v128_load32_splat`,
  [byte`\xfd\x0a`]: `v128_load64_splat`,
  [byte`\xfd\x0b`]: `v128_store`,
  [byte`\xfd\x0c`]: `v128_const`,
  [byte`\xfd\x0d`]: `i8x16_shuffle`,
  [byte`\xfd\x0e`]: `i8x16_swizzle`,
  [byte`\xfd\x0f`]: `i8x16_splat`,
  [byte`\xfd\x10`]: `i16x8_splat`,
  [byte`\xfd\x11`]: `i32x4_splat`,
  [byte`\xfd\x12`]: `i64x2_splat`,
  [byte`\xfd\x13`]: `f32x4_splat`,
  [byte`\xfd\x14`]: `f64x2_splat`,
  [byte`\xfd\x15`]: `i8x16_extract_lane_s`,
  [byte`\xfd\x16`]: `i8x16_extract_lane_u`,
  [byte`\xfd\x17`]: `i8x16_replace_lane`,
  [byte`\xfd\x18`]: `i16x8_extract_lane_s`,
  [byte`\xfd\x19`]: `i16x8_extract_lane_u`,
  [byte`\xfd\x1a`]: `i16x8_replace_lane`,
  [byte`\xfd\x1b`]: `i32x4_extract_lane`,
  [byte`\xfd\x1c`]: `i32x4_replace_lane`,
  [byte`\xfd\x1d`]: `i64x2_extract_lane`,
  [byte`\xfd\x1e`]: `i64x2_replace_lane`,
  [byte`\xfd\x1f`]: `f32x4_extract_lane`,
  [byte`\xfd\x20`]: `f32x4_replace_lane`,
  [byte`\xfd\x21`]: `f64x2_extract_lane`,
  [byte`\xfd\x22`]: `f64x2_replace_lane`,
  [byte`\xfd\x23`]: `i8x16_eq`,
  [byte`\xfd\x24`]: `i8x16_ne`,
  [byte`\xfd\x25`]: `i8x16_lt_s`,
  [byte`\xfd\x26`]: `i8x16_lt_u`,
  [byte`\xfd\x27`]: `i8x16_gt_s`,
  [byte`\xfd\x28`]: `i8x16_gt_u`,
  [byte`\xfd\x29`]: `i8x16_le_s`,
  [byte`\xfd\x2a`]: `i8x16_le_u`,
  [byte`\xfd\x2b`]: `i8x16_ge_s`,
  [byte`\xfd\x2c`]: `i8x16_ge_u`,
  [byte`\xfd\x2d`]: `i16x8_eq`,
  [byte`\xfd\x2e`]: `i16x8_ne`,
  [byte`\xfd\x2f`]: `i16x8_lt_s`,
  [byte`\xfd\x30`]: `i16x8_lt_u`,
  [byte`\xfd\x31`]: `i16x8_gt_s`,
  [byte`\xfd\x32`]: `i16x8_gt_u`,
  [byte`\xfd\x33`]: `i16x8_le_s`,
  [byte`\xfd\x34`]: `i16x8_le_u`,
  [byte`\xfd\x35`]: `i16x8_ge_s`,
  [byte`\xfd\x36`]: `i16x8_ge_u`,
  [byte`\xfd\x37`]: `i32x4_eq`,
  [byte`\xfd\x38`]: `i32x4_ne`,
  [byte`\xfd\x39`]: `i32x4_lt_s`,
  [byte`\xfd\x3a`]: `i32x4_lt_u`,
  [byte`\xfd\x3b`]: `i32x4_gt_s`,
  [byte`\xfd\x3c`]: `i32x4_gt_u`,
  [byte`\xfd\x3d`]: `i32x4_le_s`,
  [byte`\xfd\x3e`]: `i32x4_le_u`,
  [byte`\xfd\x3f`]: `i32x4_ge_s`,
  [byte`\xfd\x40`]: `i32x4_ge_u`,
  [byte`\xfd\x41`]: `f32x4_eq`,
  [byte`\xfd\x42`]: `f32x4_ne`,
  [byte`\xfd\x43`]: `f32x4_lt`,
  [byte`\xfd\x44`]: `f32x4_gt`,
  [byte`\xfd\x45`]: `f32x4_le`,
  [byte`\xfd\x46`]: `f32x4_ge`,
  [byte`\xfd\x47`]: `f64x2_eq`,
  [byte`\xfd\x48`]: `f64x2_ne`,
  [byte`\xfd\x49`]: `f64x2_lt`,
  [byte`\xfd\x4a`]: `f64x2_gt`,
  [byte`\xfd\x4b`]: `f64x2_le`,
  [byte`\xfd\x4c`]: `f64x2_ge`,
  [byte`\xfd\x4d`]: `v128_not`,
  [byte`\xfd\x4e`]: `v128_and`,
  [byte`\xfd\x4f`]: `v128_andnot`,
  [byte`\xfd\x50`]: `v128_or`,
  [byte`\xfd\x51`]: `v128_xor`,
  [byte`\xfd\x52`]: `v128_bitselect`,
  [byte`\xfd\x53`]: `v128_any_true`,
  [byte`\xfd\x54`]: `v128_load8_lane`,
  [byte`\xfd\x55`]: `v128_load16_lane`,
  [byte`\xfd\x56`]: `v128_load32_lane`,
  [byte`\xfd\x57`]: `v128_load64_lane`,
  [byte`\xfd\x58`]: `v128_store8_lane`,
  [byte`\xfd\x59`]: `v128_store16_lane`,
  [byte`\xfd\x5a`]: `v128_store32_lane`,
  [byte`\xfd\x5b`]: `v128_store64_lane`,
  [byte`\xfd\x5c`]: `v128_load32_zero`,
  [byte`\xfd\x5d`]: `v128_load64_zero`,
  [byte`\xfd\x5e`]: `f32x4_demote_f64x2_zero`,
  [byte`\xfd\x5f`]: `f64x2_promote_low_f32x4`,
  [byte`\xfd\x60`]: `i8x16_abs`,
  [byte`\xfd\x61`]: `i8x16_neg`,
  [byte`\xfd\x62`]: `i8x16_popcnt`,
  [byte`\xfd\x63`]: `i8x16_all_true`,
  [byte`\xfd\x64`]: `i8x16_bitmask`,
  [byte`\xfd\x65`]: `i8x16_narrow_i16x8_s`,
  [byte`\xfd\x66`]: `i8x16_narrow_i16x8_u`,
  [byte`\xfd\x67`]: `f32x4_ceil`,
  [byte`\xfd\x68`]: `f32x4_floor`,
  [byte`\xfd\x69`]: `f32x4_trunc`,
  [byte`\xfd\x6a`]: `f32x4_nearest`,
  [byte`\xfd\x6b`]: `i8x16_shl`,
  [byte`\xfd\x6c`]: `i8x16_shr_s`,
  [byte`\xfd\x6d`]: `i8x16_shr_u`,
  [byte`\xfd\x6e`]: `i8x16_add`,
  [byte`\xfd\x6f`]: `i8x16_add_sat_s`,
  [byte`\xfd\x70`]: `i8x16_add_sat_u`,
  [byte`\xfd\x71`]: `i8x16_sub`,
  [byte`\xfd\x72`]: `i8x16_sub_sat_s`,
  [byte`\xfd\x73`]: `i8x16_sub_sat_u`,
  [byte`\xfd\x74`]: `f64x2_ceil`,
  [byte`\xfd\x75`]: `f64x2_floor`,
  [byte`\xfd\x76`]: `i8x16_min_s`,
  [byte`\xfd\x77`]: `i8x16_min_u`,
  [byte`\xfd\x78`]: `i8x16_max_s`,
  [byte`\xfd\x79`]: `i8x16_max_u`,
  [byte`\xfd\x7a`]: `f64x2_trunc`,
  [byte`\xfd\x7b`]: `i8x16_avgr_u`,
  [byte`\xfd\x7c`]: `i16x8_extadd_pairwise_i8x16_s`,
  [byte`\xfd\x7d`]: `i16x8_extadd_pairwise_i8x16_u`,
  [byte`\xfd\x7e`]: `i16x8_extadd_pairwise_i16x8_s`,
  [byte`\xfd\x7f`]: `i16x8_extadd_pairwise_i16x8_u`,
  [byte`\xfd\x80\x01`]: `i16x8_abs`,
  [byte`\xfd\x81\x01`]: `i16x8_neg`,
  [byte`\xfd\x82\x01`]: `i16x8_q15mulr_sat_s`,
  [byte`\xfd\x83\x01`]: `i16x8_all_true`,
  [byte`\xfd\x84\x01`]: `i16x8_bitmask`,
  [byte`\xfd\x85\x01`]: `i16x8_narrow_i32x4_s`,
  [byte`\xfd\x86\x01`]: `i16x8_narrow_i32x4_u`,
  [byte`\xfd\x87\x01`]: `i16x8_extend_low_i8x16_s`,
  [byte`\xfd\x88\x01`]: `i16x8_extend_high_i8x16_s`,
  [byte`\xfd\x89\x01`]: `i16x8_extend_low_i8x16_u`,
  [byte`\xfd\x8a\x01`]: `i16x8_extend_high_i8x16_u`,
  [byte`\xfd\x8b\x01`]: `i16x8_shl`,
  [byte`\xfd\x8c\x01`]: `i16x8_shr_s`,
  [byte`\xfd\x8d\x01`]: `i16x8_shr_u`,
  [byte`\xfd\x8e\x01`]: `i16x8_add`,
  [byte`\xfd\x8f\x01`]: `i16x8_add_sat_s`,
  [byte`\xfd\x90\x01`]: `i16x8_add_sat_u`,
  [byte`\xfd\x91\x01`]: `i16x8_sub`,
  [byte`\xfd\x92\x01`]: `i16x8_sub_sat_s`,
  [byte`\xfd\x93\x01`]: `i16x8_sub_sat_u`,
  [byte`\xfd\x94\x01`]: `f64x2_nearest`,
  [byte`\xfd\x95\x01`]: `i16x8_mul`,
  [byte`\xfd\x96\x01`]: `i16x8_min_s`,
  [byte`\xfd\x97\x01`]: `i16x8_min_u`,
  [byte`\xfd\x98\x01`]: `i16x8_max_s`,
  [byte`\xfd\x99\x01`]: `i16x8_max_u`,
  [byte`\xfd\x9b\x01`]: `i16x8_avgr_u`,
  [byte`\xfd\x9c\x01`]: `i16x8_extmul_low_i8x16_s`,
  [byte`\xfd\x9d\x01`]: `i16x8_extmul_high_i8x16_s`,
  [byte`\xfd\x9e\x01`]: `i16x8_extmul_low_i8x16_u`,
  [byte`\xfd\x9f\x01`]: `i16x8_extmul_high_i8x16_u`,
  [byte`\xfd\xa0\x01`]: `i32x4_abs`,
  [byte`\xfd\xa1\x01`]: `i32x4_neg`,
  [byte`\xfd\xa3\x01`]: `i32x4_all_true`,
  [byte`\xfd\xa4\x01`]: `i32x4_bitmask`,
  [byte`\xfd\xa7\x01`]: `i32x4_extend_low_i16x8_s`,
  [byte`\xfd\xa8\x01`]: `i32x4_extend_high_i16x8_s`,
  [byte`\xfd\xa9\x01`]: `i32x4_extend_low_i16x8_u`,
  [byte`\xfd\xaa\x01`]: `i32x4_extend_high_i16x8_u`,
  [byte`\xfd\xab\x01`]: `i32x4_shl`,
  [byte`\xfd\xac\x01`]: `i32x4_shr_s`,
  [byte`\xfd\xad\x01`]: `i32x4_shr_u`,
  [byte`\xfd\xae\x01`]: `i32x4_add`,
  [byte`\xfd\xb1\x01`]: `i32x4_sub`,
  [byte`\xfd\xb5\x01`]: `i32x4_mul`,
  [byte`\xfd\xb6\x01`]: `i32x4_min_s`,
  [byte`\xfd\xb7\x01`]: `i32x4_min_u`,
  [byte`\xfd\xb8\x01`]: `i32x4_max_s`,
  [byte`\xfd\xb9\x01`]: `i32x4_max_u`,
  [byte`\xfd\xba\x01`]: `i32x4_dot_i16x8_s`,
  [byte`\xfd\xbb\x01`]: `i32x4_extmul_low_i16x8_s`,
  [byte`\xfd\xbc\x01`]: `i32x4_extmul_high_i16x8_s`,
  [byte`\xfd\xbd\x01`]: `i32x4_extmul_low_i16x8_u`,
  [byte`\xfd\xbe\x01`]: `i32x4_extmul_high_i16x8_u`,
  [byte`\xfd\xc0\x01`]: `i64x2_abs`,
  [byte`\xfd\xc1\x01`]: `i64x2_neg`,
  [byte`\xfd\xc3\x01`]: `i64x2_all_true`,
  [byte`\xfd\xc4\x01`]: `i64x2_bitmask`,
  [byte`\xfd\xc7\x01`]: `i64x2_extend_low_i32x4_s`,
  [byte`\xfd\xc8\x01`]: `i64x2_extend_high_i32x4_s`,
  [byte`\xfd\xc9\x01`]: `i64x2_extend_low_i32x4_u`,
  [byte`\xfd\xca\x01`]: `i64x2_extend_high_i32x4_u`,
  [byte`\xfd\xcb\x01`]: `i64x2_shl`,
  [byte`\xfd\xcc\x01`]: `i64x2_shr_s`,
  [byte`\xfd\xcd\x01`]: `i64x2_shr_u`,
  [byte`\xfd\xce\x01`]: `i64x2_add`,
  [byte`\xfd\xd1\x01`]: `i64x2_sub`,
  [byte`\xfd\xd5\x01`]: `i64x2_mul`,
  [byte`\xfd\xd6\x01`]: `i64x2_eq`,
  [byte`\xfd\xd7\x01`]: `i64x2_ne`,
  [byte`\xfd\xd8\x01`]: `i64x2_lt_s`,
  [byte`\xfd\xd9\x01`]: `i64x2_gt_s`,
  [byte`\xfd\xda\x01`]: `i64x2_le_s`,
  [byte`\xfd\xdb\x01`]: `i64x2_ge_s`,
  [byte`\xfd\xdc\x01`]: `i64x2_extmul_low_i32x4_s`,
  [byte`\xfd\xdd\x01`]: `i64x2_extmul_high_i32x4_s`,
  [byte`\xfd\xde\x01`]: `i64x2_extmul_low_i32x4_u`,
  [byte`\xfd\xdf\x01`]: `i64x2_extmul_high_i32x4_u`,
  [byte`\xfd\xe0\x01`]: `f32x4_abs`,
  [byte`\xfd\xe1\x01`]: `f32x4_neg`,
  [byte`\xfd\xe3\x01`]: `f32x4_sqrt`,
  [byte`\xfd\xe4\x01`]: `f32x4_add`,
  [byte`\xfd\xe5\x01`]: `f32x4_sub`,
  [byte`\xfd\xe6\x01`]: `f32x4_mul`,
  [byte`\xfd\xe7\x01`]: `f32x4_div`,
  [byte`\xfd\xe8\x01`]: `f32x4_min`,
  [byte`\xfd\xe9\x01`]: `f32x4_max`,
  [byte`\xfd\xea\x01`]: `f32x4_pmin`,
  [byte`\xfd\xeb\x01`]: `f32x4_pmax`,
  [byte`\xfd\xec\x01`]: `f64x2_abs`,
  [byte`\xfd\xed\x01`]: `f64x2_neg`,
  [byte`\xfd\xef\x01`]: `f64x2_sqrt`,
  [byte`\xfd\xf0\x01`]: `f64x2_add`,
  [byte`\xfd\xf1\x01`]: `f64x2_sub`,
  [byte`\xfd\xf2\x01`]: `f64x2_mul`,
  [byte`\xfd\xf3\x01`]: `f64x2_div`,
  [byte`\xfd\xf4\x01`]: `f64x2_min`,
  [byte`\xfd\xf5\x01`]: `f64x2_max`,
  [byte`\xfd\xf6\x01`]: `f64x2_pmin`,
  [byte`\xfd\xf7\x01`]: `f64x2_pmax`,
  [byte`\xfd\xf8\x01`]: `i32x4_trunc_sat_f32x4_s`,
  [byte`\xfd\xf9\x01`]: `i32x4_trunc_sat_f32x4_u`,
  [byte`\xfd\xfa\x01`]: `f32x4_convert_i32x4_s`,
  [byte`\xfd\xfb\x01`]: `f32x4_convert_i32x4_u`,
  [byte`\xfd\xfc\x01`]: `i32x4_trunc_sat_f64x2_s_zero`,
  [byte`\xfd\xfd\x01`]: `i32x4_trunc_sat_f64x2_u_zero`,
  [byte`\xfd\xfe\x01`]: `f64x2_convert_low_i32x4_s`,
  [byte`\xfd\xff\x01`]: `f64x2_convert_low_i32x4_u`,
};
