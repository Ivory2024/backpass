import { State } from "../../src/state.js";

const stateDir = process.argv[2];
const state = new State(null, { stateDir, exclude: false });
state.ensure();
for (let i = 0; i < 50; i += 1) {
  state.writeScanCache({ version: 1, entries: { [`k${process.pid}-${i}`]: true } });
}
