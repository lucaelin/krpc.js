import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import copy from 'rollup-plugin-copy';
import { terser } from 'rollup-plugin-terser';
import sourcemaps from 'rollup-plugin-sourcemaps';
import json from 'rollup-plugin-json';
import globals from 'rollup-plugin-node-globals';
import builtins from 'rollup-plugin-node-builtins';
import virtual from 'rollup-plugin-virtual';

const resources = [];

export default [{
  input: './lib/KRPC.js',
  output: [
    {
      format: 'esm',
      file: 'browser/KRPC.js',
      sourcemap: true,
      name: 'KRPC',
    }
  ],
  plugins: [
    json(),
    globals(),
    builtins(),
    virtual({
        'ws': `export default WebSocket;`,
        'protobufjs': `export default protobuf;`,
    }),
    commonjs(),
    resolve({browser: true, preferBuiltins: false}),
    sourcemaps(),
    terser(),
    copy({
      targets: [...resources],
    }),
  ],

  watch: {
    clearScreen: false,
  },
}];
