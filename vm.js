import App, { import_kind, Type } from "./lib.js";
import W from "./instructions.js";

// https://gekkio.fi/files/gb-docs/gbctr.pdf
// https://gbdev.io/gb-opcodes/optables/
// https://itch.io/jam/gbcompo23

const app = new App();
app.newMemory(2, 2, true);

const wClk = app.newImport("_clock", [
  ["m", import_kind.Global(Type.i32, 1)],
  ["t", import_kind.Global(Type.i32, 1)],
]);
const wReF = function () {
  // 0:a 1:f 2:b 3:c 4:d 5:e 6:h 7:l 8,9:pc 10,11:sp 12,13:ir 14,15:ie
  const registers = app.newGlobal(Type.v128, 0, 1) + 2;
  // console.log({wClk, registers})
  const register_read = (lane, t = W.I8x16) => () => [
    W.global.get(registers),
    t.extract_lane_u(lane),
    W.nop, // hack so instead of `...wReF.a.get()` I can just do `wReF.a.get()`
  ];
  const register_write = (lane, t = W.I8x16) => (...val) => [
    W.global.get(registers),
    ...val,
    t.replace_lane(undefined, lane),
    W.global.set(registers),
  ];
  const register_setup = (lane, t = W.I8x16) => ({
    get: register_read(lane, t),
    set: register_write(lane, t),
  });
  const flag_read = (bit_n) => () => [
    W.global.get(registers),
    W.I8x16.extract_lane_u(1).shr_u(bit_n).and(1),
  ];
  const flag_write = (bit_n) => (...val) => [
    W.global.get(registers),
    ...val,
    W.I32.and(1).shl(bit_n),
    W.I8x16.replace_lane(1),
    W.global.set(registers),
  ];
  const wUpdFlag = app.newFunction([[Type.i32, Type.i32], [Type.i32]], [], [
    // local[0]: val
    // local[1]: bit
    register_write(1)(
      W.global.get(registers),
      W.I8x16.extract_lane_u(1),
      W.local.get(0),
      W.local.get(1),
      W.I32.shl().and(),
    ),
    W.local.get(0),
  ]);
  const flag_upd = (bit_n) => () => [
    W.I32.const(bit_n),
    W.call(wUpdFlag),
  ];
  const flag_setup = (bit_n) => ({
    get: flag_read(bit_n),
    set: flag_write(bit_n),
  });
  return {
    a: register_setup(0),
    f: register_setup(1),
    Z: flag_setup(7),
    N: flag_setup(6),
    H: flag_setup(5),
    C: flag_setup(4),
    b: register_setup(2),
    c: register_setup(3),
    bc: register_setup(1, W.I16x8),
    d: register_setup(4),
    e: register_setup(5),
    de: register_setup(2, W.I16x8),
    h: register_setup(6),
    l: register_setup(7),
    hl: register_setup(3, W.I16x8),
    pc: register_setup(4, W.I16x8),
    sp: register_setup(5, W.I16x8),
    ir: register_setup(6, W.I16x8),
    ie: register_setup(7, W.I16x8),
  };
}();

const wMMU = {
  advance_pc: (bytes = 1) => [
    ...wReF.pc.set(
      ...wReF.pc.get(),
      W.I32.add(bytes),
    ),
  ],
  /** @type {() => I32} */
  read_byte: () =>
    W.I32.from([
      ...wReF.pc.get(),
      W.I32.load8_u(),
    ]),
  /** @type {() => I32} */
  read_word: () =>
    W.I32.from([
      ...wReF.pc.get(),
      W.I32.load8_u().shl(8),
      ...wReF.pc.get(),
      W.I32.add(1),
      W.I32.load8_u().or(),
      ...wReF.pc.set(
        ...wReF.pc.get(),
        W.I32.add(2),
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
};

// throw wMMU.advance_pc

const cycle_advance = (v) => [
  W.I32.const(v),
  W.global.set(wClk.m),
  W.I32.const(v * 4),
  W.global.set(wClk.t),
];
const pc_advance = (v) =>
  wReF.pc.set(
    wReF.pc.get(),
    W.I32.add(v),
  );

// console.log("asht", wMMU.read_byte())
const wZ80_cpu = {
  0x00: "NOP",
  NOP: app.newFunction([], [], [W.nop]),
  0x10: "STOP",
  STOP: app.newFunction([], [], [W.unreachable]),
};

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
], { export: "dump_registers" });

app.newFunction([], [], [
  wMMU.advance_pc(1),
], { export: "foo" });

const { instance, module } = await app.compile({
  _clock: {
    m: new WebAssembly.Global({ value: "i32", mutable: true }),
    t: new WebAssembly.Global({ value: "i32", mutable: true }),
  },
}, { debug: true });

console.log(instance.exports.dump_registers());
console.log(instance.exports.foo());
console.log(instance.exports.dump_registers());
