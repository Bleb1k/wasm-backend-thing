import App, { Type } from "./lib.js"
import W from "./instructions.js"
import { I32, I64 } from "./expand_instr.js"

export function add_bump_allocator(/** @type {App} */ app) {
  const w_alloc_offset = app.newGlobal(Type.i32, 32, true)

  const w_alloc = app.newFunction(
    [[
      Type.i32, // 0: size
    ], [
      Type.i32, // return: mem address
    ]],
    [],
    [
      W.global.get(w_alloc_offset), // addr
      W.global.get(w_alloc_offset), // addr, addr

      I32.add(W.local.get(0)), // addr, new addr
      W.local.tee(0),
      W.local.get(0), // addr, new addr, new addr

      I32.const(65536).mul(W.memory.size()).sub(), // addr, new addr, offset in bytes from current memory border
      I32.div_s(65536).add(1), // addr, new addr, amount of pages required
      W.local.tee(0),

      I32.gt_s(0), // addr, new addr, bool
      W.if(
        Type.result,
        W.local.get(0),
        W.memory.grow(),
        I32.eq(-1),
        W.if(Type.result, I32.const(0x02), W.unreachable),
      ), // addr, new addr

      W.global.set(w_alloc_offset), // addr
    ],
    { export: "alloc" },
  )

  return { w_alloc_offset, w_alloc }
}

export function add_arena_allocator(/** @type {App} */ app) {
  const w_new_arena = app.newFunction(
    [[
      Type.i32, // 0: addr
      Type.i32, // 1: size
    ], [
      Type.i64, // returns: compound arena structure
    ]],
    [], // locals
    [
      W.local.get(1),
      I32.to_u64_extend().shl(32),
      W.local.get(0),
      I32.to_u64_extend().add(),
    ],
  )

  return { w_new_arena }
}
