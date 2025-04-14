import { Num, Int, I64, I32, I16, I8, U64, U32, U16, U8, Float, F32, F64 } from "./higher_level_instructions.js"

export class GlobalContext {
  /** @type {App?} */
  static current_app = undefined

  /** @param {App} app */
  static set current_app(app) {
    if (this.current_app != app)
      throw new Error("You can't mish-mash apps.")
    this.current_app = app
  }

  static get current_app() {
    if (!this.current_app)
      throw new Error("No app currently stored.")
    return this.current_app
  }
  
  // /** @param {Num} val */
  // static stack_push(val) {
  //   this.current_app?.scope.at(-1)
  // }

  /** @param {"block" | "function"} type  */
  static blockStart(type = "block") {
    if (!this.current_app)
      throw new Error("Can't create new scope, no app is provided.")
    const scope = new Scope()
    if (type === "block") {
      if (this.current_app.scope.length === 0)
        throw new Error("Can't create block scope outside of function scope.")
      scope.local = this.current_app.scope.at(-1).local
    }
    this.current_app.scope.push(scope)
  }
  
  static blockEnd() {
    if (!this.current_app)
      throw new Error("Can't pop the scope, no app is provided.")
    const scope = this.current_app.scope.pop()
    if (scope.stack.length > 0) console.error(new Error("Stack of popped block is not empty."))
  }

  static newParam() {
    
  }
}

class Scope {
  constructor() {
    this.stack = []
    this.local = []
  }
}

export class App {
  /** @type {Scope[]} */
  scope = []

  /**
   * @param {number|bigint} value
   * @param {symbol} bypass_token
   */
  constructor(bypass_token) {
    if (bypass_token !== App.#PRIVATE_CONSTRUCTOR_TOKEN) {
      throw new Error("Private constructor. Use App.init() to create an instance.");
    }
  }
  
  static init() {
    return new App(App.#PRIVATE_CONSTRUCTOR_TOKEN)
  }
  
  static #PRIVATE_CONSTRUCTOR_TOKEN = Symbol("PRIVATE_CONSTRUCTOR_TOKEN");

  import(a, ...b) {
    return (c, ...d) => {
      console.log(`a: `, a, `\nb: `, b, `\nc: `, c, `\nd: `, d)
    }
  }

  /** @param {() => any|any[]} fn*/
  function(fn) {
    GlobalContext.current_app = this
    GlobalContext.blockStart("function")
    
    const returns = [fn()].flat()
    console.log("During creation, function returned:", returns)
    
    GlobalContext.blockEnd()
    if (!(this.scope.length == 0))
      throw new Error("Not all blocks were closed properly.")
    delete GlobalContext.current_app
    return {
      export: (str) => (console.log("Exporting function " + str), {_:() => "what?"})
    }
  }

  compile() {
    console.log("NO, THIS IS NOT COMPILED YET....")
  }
}

class BlockCtx {
  static args = []
  static rets = []
}

const Block = function(fn) {
  
}

const Func = {
  in: (...a) => (console.log(`Func.in(`, a, `)`), Func),
  out: (...a) => (console.log(`Func.out(`, a, `)`), Func)
} // fake it till you make it :D

export default {
  App, I64, I32, I16, I8, U64, U32, U16, U8, F32, F64,
  Func, Block,
}
