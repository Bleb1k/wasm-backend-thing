/**
 * TODO: Add debug info support (names and labels)
 */

import App, { decodeIEEE754, encodeLEB128, import_kind, mutability, Type } from "./lib.js"
import W from "./instructions.js"
import { I32 } from "./expand_instr.js"
import { add_arena_allocator, add_bump_allocator } from "./alloc.js"

// app.newImport("env", [["sub2", import_kind.Func([Type.i32], [Type.i32])]]);
// app.newImport("env", [
//   []
//   ["some_func", import_kind.Func([Type.i32], [Type.i64])],
//   ["some_var", import_kind.Global(Type.f64, mutability.yes)],
// ]);

const app = new App()

// app.newImport("foo", [
//   ["bar", import_kind.Func([Type.f32])],
//   ["my_table", import_kind.Table(Type.funcref, 10)],
//   ["memory", import_kind.Mem(1)],
//   ["my_global", import_kind.Global(Type.i32)]
// ])

app.newGlobal(Type.i32)
app.newGlobal(Type.i32, 0, 1)
app.newGlobal(Type.i32, 0, 0)
app.newGlobal(Type.i64)
app.newGlobal(Type.i64, 100, 1)
app.newGlobal(Type.f32)
app.newGlobal(Type.f32, 10, 1)
app.newGlobal(Type.f64)
app.newGlobal(Type.f64, 100, 1)
app.newGlobal(Type.externref)
app.newGlobal(Type.externref, 0, 1)
app.newGlobal(Type.funcref)
app.newGlobal(Type.funcref, null, 1)
app.newGlobal(Type.v128)
app.newGlobal(Type.v128, [10, 20, 30, 48], 1)

// const addTwo_wasm = app.newFunction(
//   [[Type.i32, Type.i32], [Type.i32]],
//   [],
//   [
//     [instr.local_get, 0x00],
//     [instr.local_get, 0x01],
//     instr.i32_add,
//   ],
//   { export: "addTwo" },
// );

// app.newFunction([[Type.i32], [Type.i32]], [[Type.f32, 23]], [
//   [instr.local_get, 0],
//   [instr.i32_const, encodeLEB128("i32", 123)],
//   [instr.call, addTwo_wasm],
// ], { export: "foo" });

app.newMemory(1, undefined, "memory")

const { w_alloc: w_bump_alloc } = add_bump_allocator(app)
const { w_new_arena } = add_arena_allocator(app)

app.newFunction([
  [Type.i64], // args
  [Type.i64], // rets
], [
  [Type.i64, 1], // params
], [
  W.I64.const(1), // push i64{0} to stack
  W.local.set(1), // store 0 in local variable (acc)

  W.block(
    Type.result, // start of block
    W.loop(
      Type.result, // start of loop
      W.local.get(0),
      W.I64.eqz(),
      W.br_if(1), // if param == 0 jump to block (to block end)
      W.local.get(0),
      W.local.get(1),
      W.I64.mul(),
      W.local.set(1), // acc *= param
      W.local.get(0),
      W.I64.const(1).sub(),
      W.local.set(0), // param -= 1
      W.br(0), // jump to loop (to loop start)
    ),
  ),

  W.local.get(1), // push acc to stack, autoreturns
], { export: "factorial" })

app.newFunction([[], [Type.i32]], [], [
  W.memory.size(),
], { export: "pages_allocated" })

app.newFunction([[Type.i32], [Type.i32]], [], [
  W.local.get(0),
  W.memory.grow(),
], { export: "allocate_pages" })

app.newFunction([[Type.i32, Type.i32, Type.i32], [Type.i32]], [], [
  W.local.get(0),
  W.local.get(1),
  W.local.get(2),
  W.select(),
], { export: "check_select" })

app.newFunction([[Type.externref, Type.externref, Type.i32], [Type.externref]], [], [
  W.local.get(0),
  W.local.get(1),
  W.local.get(2),
  W.select(Type.externref),
], { export: "check_selectt" })

app.newFunction([[], [Type.i64]], [], [
  I32.const(34).const(35),
  W.call(w_new_arena),
], { export: "testt" })

app.newFunction([[], [Type.i32]], [], [
  I32.const(1).store(0),
  I32.const(-1).store(4),
  I32.load8_u(0).load8_u(4).add(),
], { export: "u8bits" })

// TODO: test V128.bitselect

const { instance, module } = await app.compile({}, { debug: false })

console.log(instance.exports)
console.log("a factorial of 16 is", instance.exports.factorial(16n)) // 20922789888000n
console.log("allocated initially ", instance.exports.pages_allocated())
console.log("previously allocated", instance.exports.allocate_pages(2))
console.log("after new allocation", instance.exports.pages_allocated())
// ;[[0, 1, 2]].forEach(([a, b, c]) => {
//   console.log(instance.exports.check_select(a, b, c)) // returns a (third is 2)
//   console.log(instance.exports.check_select(b, c, a)) // returns c (third is 0)
//   console.log(instance.exports.check_select(c, a, b)) // returns c (third is 1)
// })
instance.exports.check_selectt(() => console.log("true"), () => console.log("false"), 0)()
instance.exports.check_selectt(() => console.log("true"), () => console.log("false"), 1)()
// new format:
// app.function((x = W.I32.param("x")) => {
//   y.cast(W.I32).add(x).store(x);
//   return [x, x, y];
// })

console.log("0b" + instance.exports.u8bits().toString(2))

console.log(instance.exports.alloc(101))
console.log(instance.exports.alloc(123))
console.log(instance.exports.alloc(10000))
console.log(instance.exports.alloc(50000))
console.log(instance.exports.alloc(150000))
console.log(instance.exports.alloc(500000))

console.log("0x" + instance.exports.testt().toString(16).padStart(16, "0"))

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

// const { instance, module } = await app.compile({
//   foo: {
//     bar() { console.log(123) },
//     my_table: new WebAssembly.Table({ element: "anyfunc", initial: 10 }),
//     memory: new WebAssembly.Memory({ initial: 1 }),
//     my_global: 1,
//   }
// });

// console.log(instance.exports, module);

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
