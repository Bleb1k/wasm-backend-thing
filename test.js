import { I32, I32x4, I8x16, InstrArray } from "./expand_instr.js";

// console.log(I32.from.toString())
// console.log(I32.from.toString())
console.log(I32.from(I8x16.const(1,3,5,6,8,1,2,2,2,21,2,1,1,2,3,4).extract_lane_s(5)))
