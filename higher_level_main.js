import W from "./higher_level_lib.js"

const app = W.App.init()

// app.import`console.log`(console.log, W.Func.in(W.I32))
// app.import`console`({
//   error: [console.error, W.Func.in(W.I32)],
//   info: [console.info, W.Func.in(W.I32)],
//   clear: [console.clear, W.Func],
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
const add_100 = app.function((x = W.I32.param("x")) => {
  W.I32.const(50);
  return x.add(50).add();
}).export("add_100");

// console.log(add_100._(25)) // error, not compiled yet

app.compile(); // returns module, but can be omitted

console.log(add_100._(25)) // should print 125
