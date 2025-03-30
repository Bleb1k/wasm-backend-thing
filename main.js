/**
 * TODO: Add debug info support (names and labels)
 */

import app, { encodeLEB128, import_kind, mutability, Type } from "./lib.js";
import instr, { raw_instr } from "./instructions.js";

// app.newImport("env", [["sub2", import_kind.Func([Type.i32], [Type.i32])]]);
// app.newImport("env", [
//   []
//   ["some_func", import_kind.Func([Type.i32], [Type.i64])],
//   ["some_var", import_kind.Global(Type.f64, mutability.yes)],
// ]);
app.newImport("foo", [
  ["bar", import_kind.Func([Type.f32])],
  ["my_table", import_kind.Table(Type.funcref, 10)],
  ["memory", import_kind.Mem(1)],
  ["my_global", import_kind.Global(Type.i32)]
])
// const addTwo = app.newFunction(
//   [[Type.i32, Type.i32], [Type.i32]],
//   [],
//   [
//     [instruction.local_get, 0x00],
//     [instruction.local_get, 0x01],
//     instruction.i32_add,
//   ],
//   { export: "addTwo" },
// );
const hundred = app.newFunction(
  [[], [Type.i32]],
  [[Type.i32, 1]],
  [
    instr.i32(100n), // [raw_instr.i32_const, 3],
    // instr.loop(Type.Func([], [Type.i32]), [
    //   [raw_instr.i32_const, 3],
    //   [raw_instr.i32_mul],
    //   [raw_instr.local_tee, 0],
    //   [raw_instr.local_get, 0],
    //   [raw_instr.br_if, 0],
    // ]),
    raw_instr.return,
  ],
  { export: "true" }
)
// app.newFunction([[], [Type.i32]], [], [
//   instruction.i32_const, encodeLEB128("s32", 123),
//   instruction.i32_const, encodeLEB128("s32", 123),
//   instruction.call, addTwo
// ], { });

const { instance, module } = await app.compile({
  foo: {
    bar() { console.log(123) },
    my_table: new WebAssembly.Table({ element: "anyfunc", initial: 10 }),
    memory: new WebAssembly.Memory({ initial: 1 }),
    my_global: 1,
  }
});

console.log(instance.exports.true(), module);

// console.log(instance.exports.addTwo(1,-2))

/*
(module
  (import "foo" "bar" (func (param f32)))
  (memory (data "hi"))
  (type (func (param i32) (result i32)))
  (start 1)
  (table 0 1 funcref)
  (func)
  (func (type 1)
    i32.const 42
    drop)
  (export "e" (func 1))
  (func $add (export "addTwo") (param i32 i32) (result i32)
    local.get 0
    local.get 1
    i32.add)
  (func (result i32)
    i32.const 123
    i32.const 123
    call $add))
*/
