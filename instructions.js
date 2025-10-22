import { byte } from "./helpers.js";
import { encode_v128, encodeIEEE754, encodeLEB128, Type } from "./lib.js";
import {
  F32,
  F32x4,
  F64,
  F64x2,
  I16x8,
  I32,
  I32x4,
  I64,
  I64x2,
  I8x16,
  V128,
} from "./expand_instr.js";

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
  block: (
    type,
    ...ops
  ) => [[byte`\x02`, { blocktype: type }], ...ops, byte`\x0b`],
  /**
   * Begins a loop construct. Must have function type index or 0x40 (void) right after.
   * Similar to `block`, but allows backward branches (loops).
   */
  loop: (
    type,
    ...ops
  ) => [[byte`\x03`, { blocktype: type }], ...ops, byte`\x0b`],
  /**
   * Pops value from the stack. Begins an if construct.
   * Executes one branch if the condition is true, and optionally another branch if false.1
   */
  if: (type, ...ops) => {
    let result = [[byte`\x04`, { blocktype: type }], ...ops];
    let tmp = result.slice();
    result.else = (
      ...else_ops
    ) => [...tmp, byte`\x05`, ...else_ops, byte`\x0b`];
    result.push(byte`\x0b`);
    return result;
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
   * Tail-optimized return.
   * Pops values from the stack and returns them as the function's result(s).
   */
  return_call: byte`\x12`,
  /**
   * Calls a function by its index.
   * Pushes arguments onto the stack, invokes the function, and pushes its results back onto the stack.
   */
  call: (index) => [byte`\x10`, index],
  /**
   * Calls a function indirectly through a table.
   * Uses a function index from the table and verifies its type matches the expected signature.
   */
  call_indirect: (
    table_index,
    functype = Type.Func(),
  ) => [byte`\x11`, { functype }, encodeLEB128("u32", table_index)],
  /**
   * Drops the top value from the stack.
   * Removes the top element without using it.
   */
  drop: byte`\x1a`,
  /**
   * Selects one of two values based on a condition.
   * Pops two values and a condition from the stack; pushes the first value if condition is true, otherwise the second.
   */
  select: (type = Type.result) =>
    type === Type.result ? byte`\x1b` : [byte`\x1c`, 1, type],
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
    init: (
      data_index = 0,
      mem_index = 0,
    ) => [byte`\xfc\x08`, data_index, mem_index],
    /**
     * Copies data within linear memory.
     * Pops: dest (i32), src (i32), len (i32).
     * Copies `len` bytes from memory at `src` to memory at `dest`.
     */
    copy: (
      dst_mem_index = 0,
      src_mem_index = 0,
    ) => [byte`\xfc\x0a`, src_mem_index, dst_mem_index],
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
  I32,
  I64,
  F32,
  F64,
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
  V128,
  I8x16,
  I16x8,
  I32x4,
  I64x2,
  F32x4,
  F64x2,
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
