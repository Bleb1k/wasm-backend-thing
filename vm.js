import App, { import_kind, Type } from "./lib.js"
import W from "./instructions.js"
import { F32, F64, I16x8, I32, I64, I8x16, V128 } from "./expand_instr.js"

// https://gekkio.fi/files/gb-docs/gbctr.pdf
// https://gbdev.io/gb-opcodes/optables/
// https://itch.io/jam/gbcompo23

const app = new App()
app.newMemory(2, 2, true)

const wClk = app.newImport("_clock", [
  ["m", import_kind.Global(Type.i32, 1)],
  ["t", import_kind.Global(Type.i32, 1)],
])
const wReF = function () {
  // 0:a 1:f 2:b 3:c 4:d 5:e 6:h 7:l 8,9:pc 10,11:sp 12,13:ir 14,15:ie
  const registers = app.newGlobal(Type.v128, 0, 1) + 2
  // console.log({wClk, registers})
  const register_read = (lane, t = I8x16) => () => [
    W.global.get(registers),
    t.extract_lane_u(lane),
    W.nop, // hack so instead of `...wReF.a.get()` I can just do `wReF.a.get()`
  ]
  const register_write = (lane, t = I8x16) => (...val) => [
    W.global.get(registers),
    ...val,
    t.replace_lane(undefined, lane),
    W.global.set(registers),
  ]
  const register_setup = (lane, t = I8x16) => ({
    get: register_read(lane, t),
    set: register_write(lane, t),
  })
  const flag_read = (bit_n) => () => [
    W.global.get(registers),
    I8x16.extract_lane_u(1).shr_u(bit_n).and(1),
  ]
  const flag_write = (bit_n) => (...val) => [
    W.global.get(registers),
    ...val,
    I32.and(1).shl(bit_n),
    I8x16.replace_lane(1),
    W.global.set(registers),
  ]
  const wUpdFlag = app.newFunction([[Type.i32, Type.i32], [Type.i32]], [], [
    // local[0]: val
    // local[1]: bit
    register_write(1)(
      W.global.get(registers),
      I8x16.extract_lane_u(1),
      W.local.get(0),
      W.local.get(1),
      I32.shl().and(),
    ),
    W.local.get(0),
  ])
  const flag_upd = (bit_n) => () => [
    I32.const(bit_n),
    W.call(wUpdFlag),
  ]
  const flag_setup = (bit_n) => ({
    get: flag_read(bit_n),
    set: flag_write(bit_n),
  })
  return {
    a: register_setup(0),
    f: register_setup(1),
    Z: flag_setup(7),
    N: flag_setup(6),
    H: flag_setup(5),
    C: flag_setup(4),
    b: register_setup(2),
    c: register_setup(3),
    bc: register_setup(1, I16x8),
    d: register_setup(4),
    e: register_setup(5),
    de: register_setup(2, I16x8),
    h: register_setup(6),
    l: register_setup(7),
    hl: register_setup(3, I16x8),
    pc: register_setup(4, I16x8),
    sp: register_setup(5, I16x8),
    ir: register_setup(6, I16x8),
    ie: register_setup(7, I16x8),
  }
}()

const wMMU = {
  advance_pc: (bytes = 1) => [
    ...wReF.pc.set(
      ...wReF.pc.get(),
      I32.add(bytes),
    ),
  ],
  /** @type {() => I32} */
  read_byte: () =>
    I32.from([
      ...wReF.pc.get(),
      I32.load8_u(),
    ]),
  /** @type {() => I32} */
  read_word: () =>
    I32.from([
      ...wReF.pc.get(),
      I32.load8_u().shl(8),
      ...wReF.pc.get(),
      I32.add(1),
      I32.load8_u().or(),
      ...wReF.pc.set(
        ...wReF.pc.get(),
        I32.add(2),
      ),
    ]),
  // rb: app.newFunction([[Type.i32], [Type.i32]], [], [
  //   W.local.get(0), I32.load8_s(), // should it be signed or unsigned?
  // ]),
  // rw: app.newFunction([[Type.i32], [Type.i32]], [], [
  //   I32.load16_s(W.local.get(0)), // should it be signed or unsigned?
  // ]),
  // wb: app.newFunction([[Type.i32, Type.i32]], [], [
  //   W.local.get(0),
  //   I32.store8(W.local.get(1)),
  // ]),
  // ww: app.newFunction([[Type.i32, Type.i32]], [], [
  //   W.local.get(0),
  //   I32.store16(W.local.get(1)),
  // ]),
}

// throw wMMU.advance_pc

const cycle_advance = (v) => [
  I32.const(v),
  W.global.set(wClk.m),
  I32.const(v * 4),
  W.global.set(wClk.t),
]
const ldr_r = (a, b) => [
  a.set(b.get()),
  cycle_advance(1),
]
const ldr_ptr = (a, b) => [
  wReF.a.get(),
  wReF.hl.get(),
  I32.add(0xff00).store16(),
  cycle_advance(2),
]
const ldptr_r = (a, b) => [
  a.set(b.get()),
  cycle_advance(2),
]

// console.log("asht", wMMU.read_byte())
const wZ80 = {
  0x00: "NOP",
  NOP: app.newFunction([], [], [
    cycle_advance(1),
  ]),
  0x10: "STOP",
  STOP: app.newFunction([], [], [
    W.unreachable,
  ]),
  0x20: "JRnz_e",
  JRnz_e: app.newFunction([], [], [
    wReF.Z.get(),
    I32.eqz(),
    W.if(
      Type.result,
      wReF.pc.set(
        wReF.pc.get(),
        wMMU.read_byte().add(),
      ),
      cycle_advance(3),
    ).else(
      cycle_advance(2),
    ),
  ]),
  0x30: "JRnc_e",
  JRnc_e: app.newFunction([], [], []),
  0x01: "LDbc_nn",
  LDbc_nn: app.newFunction([], [], [
    wReF.bc.set(wMMU.read_word()),
    wMMU.advance_pc(2),
    cycle_advance(3),
  ]),
  0x11: "LDde_nn",
  LDde_nn: app.newFunction([], [], [
    wReF.de.set(wMMU.read_word()),
    wMMU.advance_pc(2),
    cycle_advance(3),
  ]),
  0x21: "LDhl_nn",
  LDhl_nn: app.newFunction([], [], [
    wReF.hl.set(wMMU.read_word()),
    wMMU.advance_pc(2),
    cycle_advance(3),
  ]),
  0x31: "LDsp_nn",
  LDsp_nn: app.newFunction([], [], [
    wReF.sp.set(wMMU.read_word()),
    wMMU.advance_pc(2),
    cycle_advance(3),
  ]),
  0x02: "LDbc_a",
  LDbc_a: app.newFunction([], [], ldptr_r(wReF.bc, wReF.a)),
  0x12: "LDde_a",
  LDde_a: app.newFunction([], [], [
    wReF.a.get(),
    wReF.de.get(),
    I32.add(0xff00).store16(),
    cycle_advance(2),
  ]),
  0x22: "LDhl_a",
  LDhl_a: app.newFunction([], [], [
    wReF.a.get(),
    wReF.hl.get(),
    I32.add(0xff00).store16(),
    wReF.hl.set(wReF.hl.get(), I32.add(1)),
    cycle_advance(2),
  ]),
  0x32: "LD_hl_a",
  LD_hl_a: app.newFunction([], [], [
    wReF.a.get(),
    wReF.hl.get(),
    I32.add(0xff00).store16(),
    wReF.hl.set(wReF.hl.get(), I32.sub(1)),
    cycle_advance(2),
  ]),
  0x03: "INCbc",
  INCbc: app.newFunction([], [], [
    wReF.bc.set(wReF.bc.get(), I32.add(1)),
    cycle_advance(2),
  ]),
  0x13: "INCde",
  INCde: app.newFunction([], [], [
    wReF.de.set(wReF.de.get(), I32.add(1)),
    cycle_advance(2),
  ]),
  0x23: "INChl",
  INChl: app.newFunction([], [], [
    wReF.hl.set(wReF.hl.get(), I32.add(1)),
    cycle_advance(2),
  ]),
  0x33: "INCsp",
  INCsp: app.newFunction([], [], [
    wReF.sp.set(wReF.sp.get(), I32.add(1)),
    cycle_advance(2),
  ]),
  0x40: "LDb_b",
  LDb_b: app.newFunction([], [], ldr_r(wReF.b, wReF.b)),
  0x41: "LDb_c",
  LDb_c: app.newFunction([], [], ldr_r(wReF.b, wReF.c)),
  0x42: "LDb_d",
  LDb_d: app.newFunction([], [], ldr_r(wReF.b, wReF.d)),
  0x43: "LDb_e",
  LDb_e: app.newFunction([], [], ldr_r(wReF.b, wReF.e)),
  0x44: "LDb_h",
  LDb_h: app.newFunction([], [], ldr_r(wReF.b, wReF.h)),
  0x45: "LDb_l",
  LDb_l: app.newFunction([], [], ldr_r(wReF.b, wReF.l)),
  0x46: "LDb_hl",
  LDb_l: app.newFunction([], [], ldr_r(wReF.b, wReF.l)),
  0x50: "LDd_b",
  LDd_b: app.newFunction([], [], ldr_r(wReF.d, wReF.b)),
  0x51: "LDd_c",
  LDd_c: app.newFunction([], [], ldr_r(wReF.d, wReF.c)),
  0x52: "LDd_d",
  LDd_d: app.newFunction([], [], ldr_r(wReF.d, wReF.d)),
  0x53: "LDd_e",
  LDd_e: app.newFunction([], [], ldr_r(wReF.d, wReF.e)),
  0x54: "LDd_h",
  LDd_h: app.newFunction([], [], ldr_r(wReF.d, wReF.h)),
  0x55: "LDd_l",
  LDd_l: app.newFunction([], [], ldr_r(wReF.d, wReF.l)),
  0x60: "LDh_b",
  LDh_b: app.newFunction([], [], ldr_r(wReF.h, wReF.b)),
  0x61: "LDh_c",
  LDh_c: app.newFunction([], [], ldr_r(wReF.h, wReF.c)),
  0x62: "LDh_d",
  LDh_d: app.newFunction([], [], ldr_r(wReF.h, wReF.d)),
  0x63: "LDh_e",
  LDh_e: app.newFunction([], [], ldr_r(wReF.h, wReF.e)),
  0x64: "LDh_h",
  LDh_h: app.newFunction([], [], ldr_r(wReF.h, wReF.h)),
  0x65: "LDh_l",
  LDh_l: app.newFunction([], [], ldr_r(wReF.h, wReF.l)),
}

app.newFunction([[], new Array(15).fill(Type.i32)], [], [
  wReF.a.get(),
  wReF.f.get(),
  wReF.b.get(),
  wReF.c.get(),
  wReF.bc.get(),
  wReF.d.get(),
  wReF.e.get(),
  wReF.de.get(),
  wReF.h.get(),
  wReF.l.get(),
  wReF.hl.get(),
  wReF.pc.get(),
  wReF.sp.get(),
  wReF.ir.get(),
  wReF.ie.get(),
], { export: "dump_registers" })

app.newFunction([], [], [
  wMMU.advance_pc(1),
], { export: "foo" })

const { instance, module } = await app.compile({
  _clock: {
    m: new WebAssembly.Global({ value: "i32", mutable: true }),
    t: new WebAssembly.Global({ value: "i32", mutable: true }),
  },
}, { debug: true })

console.log(instance.exports.dump_registers())
console.log(instance.exports.foo())
console.log(instance.exports.dump_registers())
