/**
 * TODO: Add debug info support (names and labels)
 */

import App, { encodeLEB128, import_kind, mutability, Type } from "./lib.js";
import instr from "./instructions.js";

// app.newImport("env", [["sub2", import_kind.Func([Type.i32], [Type.i32])]]);
// app.newImport("env", [
//   []
//   ["some_func", import_kind.Func([Type.i32], [Type.i64])],
//   ["some_var", import_kind.Global(Type.f64, mutability.yes)],
// ]);

const app = new App()

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

app.newFunction([[Type.i32], [Type.i32]], [[Type.f32, 23]], [
  [instr.local_get, 0],
  [instr.i32_const, encodeLEB128("i32", 123)],
  instr.i32_add,
], { export: "foo" });

// new format:
// app.function((x = W.I32.param("x")) => {
//   y.cast(W.I32).add(x).store(x);
//   return [x, x, y];
// })

/**
 * There, app.function changes global context to the context of current app,
 * then pushes "func scope" stack (nested function support?)
 * then runs the function
 * during the run, 'W' manipulates global context
 * step-by-step:
 * 1. app.function registers function builder, pushes it as a new stack
 * 2. I32.param("x") registers new function parameter
 * 3. I32.const(50) pushes it onto the stack
 * 4. x.add(50).add()
 *   - creates I32.const(50)
 *   - loads local 'x'
 *   - adds them, keeps result on the stack
 *   - pops value on the stack
 *   - if types are the same, adds them
 * 5. app.function parses returned values
 */
// const add_100 = app.function((x = W.I32.param("x")) => {
//   W.I32.const(50)
//   return x.add(50).add()
// })

const { instance, module } = await app.compile({
  foo: {
    bar() { console.log(123) },
    my_table: new WebAssembly.Table({ element: "anyfunc", initial: 10 }),
    memory: new WebAssembly.Memory({ initial: 1 }),
    my_global: 1,
  }
});

console.log(instance.exports, module);

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
