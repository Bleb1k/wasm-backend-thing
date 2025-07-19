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
 * The hard part is: how these manipulations (on global context) should be performed?
 * Should it store all manipulations in a tree like structure?
 * Should it simply dump all binary instructions, checking along the way?
 * Should it utilize something I don't know of??? this is hard..
 * And how should I design global context?
 * Sure for now I just put my app in current_app and that's it
 * But what should GlobalContext do exactly?
 * For that I should look into... compilation? comp.optimizations? ask owl? cindy? idfk..
 * I hit a wall..
 *
 * Lemme go back through my notes.. What did I exactly mean by "function builder"
 * I think what I was thinking of is a scope that keeps track of local variables and a stack
 * But also, unlike just "scope" it would allow to register sequences of instructions as ast expressions
 * so if I do something like this:
 * I32.const(50)
 * I32.const(5).add()
 * it (internally) would transform into
 * I32.const(5).add(I32.const(50))
 * since I32.const(50) would be popped from the stack as a default value (woah, progress!)
 * but how would I store something like
 * const a = I32.param("a")
 * I32.const(5).add(a)
 * I should have a differentiation of comptime known values from comptime unknown?
 * How would this help?
 * Maybe what I want is a limited interpreter that can't do anything for inputs?
 *   (params or imported functions that have outputs)
 * It would be pretty straightforwart to do so.. but what will it give me?
 * let's set up another example
 * const x = I32.param("x")
 * const a = I32.const(50)
 * const b = I32.const(25)
 * return I32.const(5).add(x._).sub(a)
 * it will only use what is returned, so, dead code elimination is natural,
 * and no stack is needed in global context (for const manipulation)
 *
 * i32{5} // x, a, b are already known
 * i32{"i32_add", 5, x} // so, 'l' + 'r'
 * i32{"i32_add", -45, x} // addition/subtraction can be performed in any order, so we sub from any known number.
 *
 * If I were to do it like that, the need for scope is almost mitigated
 *
 * let's create something harder (a square function that only uses adds)
 * const x = U32.param("x")
 * const y = U32.local("y").set(x._)
 * const z = U32.local("z")
 * W.while(() => y._.gt(0), () => {
 *   y._ = y._.sub(1)
 *   z._ = z._.add(x)
 * })
 * return z._
 *
 * what is '_' u ask? it's actually well hidden .set() and .load()
 * why use .set() and .load()?
 * because it's exactly like ref/deref in other low level languages
 * so you simply must have it
 *
 * step-by-step top-to-bottom, and then unrolling on return:
 * // this is cooler since we go into ssa (static single assignment) territory
 * 1.
 * local x: U32{?}
 * local y: U32{deref x}
 * local z:  U32{0}
 * 2.
 * block {
 *   loop {
 *     // loop label
 *     br_if y == 0 block
 *     local y: u32{deref x - 1}
 *     local z: u32{deref x + deref z}
 *     br loop
 *   }
 *  // block label
 * }
 * 3.
 * ret deref z
 *
 * I'm tired of this, let's just create simple direct translation compiler
 * meta-capabilities will be provided by allowing javascript
 */
const add_100 = app.function((x = W.I32.param("x")) => {
  W.I32.const(50)
  return x._.add(50).add()
}).export("add_100")

// this approach also allows caching! (TODO)
const factorial = app.function((n = W.I64.param("n")) => {
  const acc = W.I64.local("acc").set(1)

  W.block(() =>
    W.loop(() => {
      W.br_if(1, n._.eq(0))

      acc._ = acc._.mul(n._)
      n._ = n._.sub(1)
      W.br(0)
    })
  )

  return acc._
}).export("factorial")

app.compile()

console.log(factorial._(12)) // 479001600

// console.log(add_100._(25)) // error, not compiled yet

// app.compile(); // returns module, but can be omitted

console.log(add_100._(25)) // should print 125
