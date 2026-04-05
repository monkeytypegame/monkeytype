// @ts-nocheck
/*
 * Vendored from 0hq/WebGPT (https://github.com/0hq/WebGPT)
 * Copyright (c) 2023 Will DePue — IFCOOLTELLME License (MIT-like)
 * Full license text: packages/webgpt-runtime/LICENSE.webgpt
 *
 * Source files merged into this module:
 *   tokenizer.js, instructions.js, model.js, globals.js
 *
 * Modifications from the original:
 *   - Merged four separate script files into a single ES module
 *   - Converted browser globals to named exports
 *   - Replaced hardcoded fetch URLs with relative paths (intercepted by the
 *     runtime wrapper to support configurable asset hosting)
 *   - Added GPUBufferUsage / GPUShaderStage fallback constants for non-WebGPU
 *     environments (test / SSR)
 *   - Removed unused UI / visualization code (visuals.js)
 *   - No changes to model architecture, shader code, or numerical behavior
 */

const GPUBufferUsage = globalThis.GPUBufferUsage ?? {
  COPY_SRC: 1,
  COPY_DST: 2,
  STORAGE: 4,
  UNIFORM: 8,
  MAP_READ: 16,
};
const GPUShaderStage = globalThis.GPUShaderStage ?? {
  COMPUTE: 1,
};
const GPUMapMode = globalThis.GPUMapMode ?? {
  READ: 1,
};

// ---- tokenizer.js ----
class Tokenizer {
  constructor() {
    this.encoder = undefined;
    this.decoder = undefined;
    this.vocab_size = undefined;
  }

  async load() {
    throw new Error("Not implemented.");
  }

  getVocabSize() {
    return this.vocab_size;
  }

  encode(str) {
    throw new Error("Not implemented.");
  }

  decode(arr) {
    throw new Error("Not implemented.");
  }
}

class SimpleTokenizer extends Tokenizer {
  constructor() {
    super();
  }

  async load() {
    console.log("Loading simple tokenizer...");
    this.encoder = await (
      await fetch("weights/tokenization/simple_tokens.json")
    ).json();
    this.decoder = Object.keys(this.encoder).reduce(
      (acc, x) => ({ ...acc, [this.encoder[x]]: x }),
      {},
    );
    this.vocab_size = Object.keys(this.encoder).length;
  }

  encode(str) {
    return str.split("").map((x) => this.encoder[x]);
  }

  decode(arr) {
    return arr.map((x) => this.decoder[x]).join("");
  }
}

// ------------------ GPT Tokenizer ------------------
// Credit to https://github.com/latitudegames/GPT-3-Encoder

class GPT2Tokenizer extends Tokenizer {
  constructor() {
    super();
    this.pat =
      /'s|'t|'re|'ve|'m|'ll|'d| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+/gu;
    this.textEncoder = new TextEncoder(); // always utf-8 by spec
    this.textDecoder = new TextDecoder("utf-8");
  }

  async load() {
    console.log("Loading GPT2 tokenizer...");

    const bpe_file = await (
      await fetch("weights/tokenization/vocab.bpe")
    ).text();
    const encoder = await (
      await fetch("weights/tokenization/gpt_tokens.json")
    ).json();
    this.encoder = encoder;

    console.log("Building decoder...");
    const decoder = {};
    Object.keys(encoder).map((x) => {
      decoder[encoder[x]] = x;
    });
    this.decoder = decoder;

    const lines = bpe_file.split("\n");
    const bpe_merges = lines.slice(1, lines.length - 1).map((x) => {
      return x.split(/(\s+)/).filter(function (e) {
        return e.trim().length > 0;
      });
    });

    const byte_encoder = bytes_to_unicode();
    const byte_decoder = {};
    Object.keys(byte_encoder).map((x) => {
      byte_decoder[byte_encoder[x]] = x;
    });
    this.byte_encoder = byte_encoder;
    this.byte_decoder = byte_decoder;

    this.bpe_ranks = dictZip(bpe_merges, range(0, bpe_merges.length));
    this.cache = new Map();
    this.vocab_size = Object.keys(encoder).length;
  }

  encode(text) {
    if (!this.byte_encoder) throw new Error("Tokenizer not loaded.");
    let bpe_tokens = [];
    const matches = Array.from(text.matchAll(this.pat)).map((x) => x[0]);
    for (let token of matches) {
      const encoded_bytes = this.textEncoder.encode(token);
      let bytes = [];
      for (let i = 0; i < encoded_bytes.length; i++) {
        bytes.push(this.byte_encoder[encoded_bytes[i].toString()]);
      }
      token = bytes.join("");

      const new_tokens = this.bpe(token)
        .split(" ")
        .map((x) => this.encoder[x]);
      bpe_tokens = bpe_tokens.concat(new_tokens);
    }
    return bpe_tokens;
  }

  decode(tokens) {
    if (!this.byte_decoder) throw new Error("Tokenizer not loaded.");
    let text = tokens.map((x) => this.decoder[x]).join("");
    text = this.textDecoder.decode(
      new Uint8Array(text.split("").map((x) => this.byte_decoder[x])),
    );
    return text;
  }

  bpe(token) {
    if (this.cache.has(token)) return this.cache.get(token);
    let word = token.split("");
    let pairs = get_pairs(word);
    if (!pairs) return token;
    while (true) {
      const minPairs = {};
      pairs.forEach((pair) => {
        const rank = this.bpe_ranks[pair];
        minPairs[isNaN(rank) ? 10e10 : rank] = pair;
      });
      const keys = Object.keys(minPairs).map((x) => parseInt(x));
      const bigram = minPairs[Math.min(...keys)];
      if (!Object.hasOwn(this.bpe_ranks, bigram)) break;
      const first = bigram[0];
      const second = bigram[1];
      let new_word = [];
      let i = 0;
      while (i < word.length) {
        const j = word.indexOf(first, i);
        if (j === -1) {
          new_word = new_word.concat(word.slice(i));
          break;
        }
        new_word = new_word.concat(word.slice(i, j));
        i = j;
        if (
          word[i] === first &&
          i < word.length - 1 &&
          word[i + 1] === second
        ) {
          new_word.push(first + second);
          i = i + 2;
        } else {
          new_word.push(word[i]);
          i = i + 1;
        }
      }
      word = new_word;
      if (word.length === 1) break;
      else pairs = get_pairs(word);
    }
    word = word.join(" ");
    this.cache.set(token, word);
    return word;
  }
}

const range = (x, y) => {
  const res = [];
  for (let i = x; i < y; i++) {
    res.push(i);
  }
  return res;
};

const ord = (x) => {
  return x.charCodeAt(0);
};

const dictZip = (x, y) => {
  const result = {};
  x.map((_, i) => {
    result[x[i]] = y[i];
  });
  return result;
};

const bytes_to_unicode = () => {
  const bs = range(ord("!"), ord("~") + 1).concat(
    range(ord("¡"), ord("¬") + 1),
    range(ord("®"), ord("ÿ") + 1),
  );
  let cs = bs.slice();
  let n = 0;
  for (let b = 0; b < 2 ** 8; b++) {
    if (!bs.includes(b)) {
      bs.push(b);
      cs.push(2 ** 8 + n);
      n = n + 1;
    }
  }
  cs = cs.map((x) => String.fromCharCode(x));
  const result = {};
  bs.map((_, i) => {
    result[bs[i]] = cs[i];
  });
  return result;
};

const get_pairs = (word) => {
  const pairs = new Set();
  let prev_char = word[0];
  for (let i = 1; i < word.length; i++) {
    const char = word[i];
    pairs.add([prev_char, char]);
    prev_char = char;
  }
  return pairs;
};

// ---- instructions.js ----
// --------------------- Instructions --------------------- //

// All have been vectorized, but not all have been optimized with shared memory.
// Soon: quantize to int8, possible int4.
// Tuning needed and more detailed benchmarking, but decent for now.

class Block {
  constructor() {
    this.name = "";
  }

  initialize(device) {
    this.device = device;
    this.initBindGroups();
    this.pipelineCache = new Map();
    this.boundBufferCache = new Map();
    this.unboundBufferCache = new Map();
  }

  initBindGroup(layout, buffers, label = "") {
    return this.device.createBindGroup({
      layout,
      entries: buffers.map((buffer, i) => ({
        binding: i,
        resource: { buffer },
      })),
      label,
    });
  }

  initUniform(size, values) {
    const key = `uniform_${values.map((v) => v[1].toString()).join(",")}`;
    if (this.unboundBufferCache.has(key)) {
      const buffer = this.unboundBufferCache.get(key).pop();
      if (this.unboundBufferCache.get(key).length === 0)
        this.unboundBufferCache.delete(key);
      return buffer;
    }
    const buffer = this.device.createBuffer({
      size: size * 4,
      usage: bufferUsageDict["uniform"],
      mappedAtCreation: true,
    });
    const mappedRange = buffer.getMappedRange();
    for (const value of values) {
      if (value[1].constructor.name === "Float32Array") {
        new Float32Array(mappedRange, value[0]).set(value[1]);
      } else if (value[1].constructor.name === "Uint32Array") {
        new Uint32Array(mappedRange, value[0]).set(value[1]);
      }
    }
    buffer.unmap();
    if (!this.boundBufferCache.has(key)) this.boundBufferCache.set(key, []);
    this.boundBufferCache.get(key).push(buffer);
    return buffer;
  }

  initResultBuffer(dims) {
    const key = `result_${dims.join(",")}`;
    if (this.unboundBufferCache.has(key)) {
      const buffer = this.unboundBufferCache.get(key).pop();
      if (this.unboundBufferCache.get(key).length === 0)
        this.unboundBufferCache.delete(key);
      return buffer;
    }
    return this.initBuffer(["storage", "copy_from"], dims, key);
  }

  initBuffer(ops, dims, key = "") {
    const buffer = this.device.createBuffer({
      size: this.bufferSize(dims[0], dims[1] || 1, dims[2] || 1),
      usage: ops.map((u) => bufferUsageDict[u]).reduce((a, b) => a | b),
    });
    if (!this.boundBufferCache.has(key)) this.boundBufferCache.set(key, []);
    this.boundBufferCache.get(key).push(buffer);
    return buffer;
  }

  bufferSize(dimA, dimB = 1) {
    const size =
      Math.ceil((dimA * dimB * Float32Array.BYTES_PER_ELEMENT) / 1) * 1;
    if (size > this.device.limits.maxStorageBufferBindingSize)
      throw new Error("Buffer size exceeds GPU limit.");
    return size;
  }

  // Could be removed with auto bind groups, currently initializing everytime so probably slowing things down.
  initBindGroups() {
    const bg = (types) =>
      this.device.createBindGroupLayout({
        entries: types.map((entry, i) => ({
          binding: i,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: entry },
        })),
      });

    this.r_r_r_r_Layout = bg([
      "read-only-storage",
      "read-only-storage",
      "read-only-storage",
      "read-only-storage",
    ]);
    this.r_r_r_Layout = bg([
      "read-only-storage",
      "read-only-storage",
      "read-only-storage",
    ]);
    this.r_r_Layout = bg(["read-only-storage", "read-only-storage"]);
    this.r_Layout = bg(["read-only-storage"]);
    this.u_s_Layout = bg(["uniform", "storage"]);
    this.u_s_s_s_Layout = bg(["uniform", "storage", "storage", "storage"]);
  }

  initPipeline(code, bindGroupLayouts, label = "", constants = {}) {
    return this.device.createComputePipeline({
      layout: this.device.createPipelineLayout({ bindGroupLayouts }),
      compute: {
        module: this.device.createShaderModule({ code }),
        entryPoint: "main",
        constants,
      },
      label,
    });
  }

  destroy() {
    this.destroyPipelineCache();
    this.destroyBuffers();
  }

  destroyPipelineCache() {
    this.pipelineCache = null;
  }

  clearBufferCache() {
    // delete all unbound buffers
    this.unboundBufferCache.forEach((buffers) =>
      buffers.map((buffer) => buffer.destroy()),
    );
    // set unbound buffers to bound buffers
    this.unboundBufferCache = this.boundBufferCache;
    // clear bound buffers
    this.boundBufferCache = new Map();
  }

  destroyBuffers() {
    this.unboundBufferCache.forEach((buffers) =>
      buffers.map((buffer) => buffer.destroy()),
    );
    this.unboundBufferCache = new Map();

    this.boundBufferCache.forEach((buffers) =>
      buffers.map((buffer) => buffer.destroy()),
    );
    this.boundBufferCache = new Map();
  }
}

class FastMatMulBlockClass extends Block {
  constructor() {
    super();
    this.name = "fastMatMul";
  }

  getPipeline(rows) {
    const settings = rows % 4 !== 0 ? "withCheck" : "noCheck";
    const pipelineCacheKey = `${this.name}_${settings}}`;
    if (this.pipelineCache.has(pipelineCacheKey))
      return this.pipelineCache.get(pipelineCacheKey);
    const kernel = this.fastMatMul(settings);
    const pipeline = this.initPipeline(
      kernel,
      [this.u_s_Layout, this.r_r_r_Layout],
      `${this.name}_Pipeline_${pipelineCacheKey}`,
    );
    this.pipelineCache.set(pipelineCacheKey, pipeline);
    return pipeline;
  }

  newInstance(rows, cols, shared, inputBuffer, weightsBuffer, biasBuffer) {
    if (cols % 8 !== 0) throw new Error("Cols must be divisible by 16."); // Is this not 8? Or is it 16?
    const pipeline = this.getPipeline(rows);
    const uniformBuffer = this.initUniform(4, [
      [
        0,
        new Uint32Array([
          rows,
          cols,
          Math.ceil(cols / 4),
          Math.ceil(shared / 4),
        ]),
      ],
    ]);
    const resultBuffer = this.initResultBuffer([rows, cols]);
    const opBindGroup = this.initBindGroup(
      this.u_s_Layout,
      [uniformBuffer, resultBuffer],
      `${this.name}_OpG`,
    );
    const inputBindGroup = this.initBindGroup(
      this.r_r_r_Layout,
      [inputBuffer, weightsBuffer, biasBuffer],
      `${this.name}_InputG`,
    );
    const workgroups = { x: wgSize(cols, 8 * 8), y: wgSize(rows, 4 * 8) };

    return {
      resultBuffer,
      passes: [
        {
          flag: "compute",
          pipeline,
          groups: [opBindGroup, inputBindGroup],
          workgroups,
        },
      ],
    };
  }

  fastMatMul(flag) {
    const outputCode = {
      withCheck: `
      if (y * 4u + 0u < M) {
        array_c[x * 2u + 0u + (y * 4u + 0u) * ND4] = sum00;
        array_c[x * 2u + 1u + (y * 4u + 0u) * ND4] = sum10;
      }
      if (y * 4u + 1u < M) {
        array_c[x * 2u + 0u + (y * 4u + 1u) * ND4] = sum01;
        array_c[x * 2u + 1u + (y * 4u + 1u) * ND4] = sum11;
      }
      if (y * 4u + 2u < M) {
        array_c[x * 2u + 0u + (y * 4u + 2u) * ND4] = sum02;
        array_c[x * 2u + 1u + (y * 4u + 2u) * ND4] = sum12;
      }
      if (y * 4u + 3u < M) {
        array_c[x * 2u + 0u + (y * 4u + 3u) * ND4] = sum03;
        array_c[x * 2u + 1u + (y * 4u + 3u) * ND4] = sum13;
      }
    `,
      noCheck: `
      array_c[x * 2u + 0u + (y * 4u + 0u) * ND4] = sum00;
      array_c[x * 2u + 1u + (y * 4u + 0u) * ND4] = sum10;
      array_c[x * 2u + 0u + (y * 4u + 1u) * ND4] = sum01;
      array_c[x * 2u + 1u + (y * 4u + 1u) * ND4] = sum11;
      array_c[x * 2u + 0u + (y * 4u + 2u) * ND4] = sum02;
      array_c[x * 2u + 1u + (y * 4u + 2u) * ND4] = sum12;
      array_c[x * 2u + 0u + (y * 4u + 3u) * ND4] = sum03;
      array_c[x * 2u + 1u + (y * 4u + 3u) * ND4] = sum13;
    `,
    };

    return `
    struct Meta {
      M: u32,
      N: u32,
      ND4: u32,
      KD4: u32,
    }

    @group(1) @binding(0) var<storage,read> array_a: array<vec4<f32>>;
    @group(1) @binding(1) var<storage,read> array_b: array<vec4<f32>>;
    @group(1) @binding(2) var<storage,read> array_bias: array<vec4<f32>>;

    @group(0) @binding(0) var<uniform> uniforms: Meta;
    @group(0) @binding(1) var<storage,read_write> array_c: array<vec4<f32>>;

    @compute @workgroup_size(8, 8)
    fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
      var M: u32 = uniforms.M;
      var N: u32 = uniforms.N;
      var ND4: u32 = uniforms.ND4;
      var KD4: u32 = uniforms.KD4;
      var x: u32 = global_id.x;
      var y: u32 = global_id.y;

      if (x * 8 >= N || y * 4 >= M) {
        return;
      }

      var sum00: vec4<f32> = vec4<f32>();
      var sum01: vec4<f32> = vec4<f32>();
      var sum02: vec4<f32> = vec4<f32>();
      var sum03: vec4<f32> = vec4<f32>();
      var sum10: vec4<f32> = vec4<f32>();
      var sum11: vec4<f32> = vec4<f32>();
      var sum12: vec4<f32> = vec4<f32>();
      var sum13: vec4<f32> = vec4<f32>();

      for(var k: u32 = 0u; k < KD4; k = k + 1u) {
        var arow0: vec4<f32> = array_a[(y * 4u + 0u) * KD4 + k];
        var arow1: vec4<f32> = array_a[(y * 4u + 1u) * KD4 + k];
        var arow2: vec4<f32> = array_a[(y * 4u + 2u) * KD4 + k];
        var arow3: vec4<f32> = array_a[(y * 4u + 3u) * KD4 + k];
        var brow: vec4<f32>;

        brow = array_b[(k * 4u + 0u) * ND4 + x * 2u + 0u];
        sum00 = vec4<f32>(arow0.x) * brow + sum00;
        sum01 = vec4<f32>(arow1.x) * brow + sum01;
        sum02 = vec4<f32>(arow2.x) * brow + sum02;
        sum03 = vec4<f32>(arow3.x) * brow + sum03;

        brow = array_b[(k * 4u + 0u) * ND4 + x * 2u + 1u];
        sum10 = vec4<f32>(arow0.x) * brow + sum10;
        sum11 = vec4<f32>(arow1.x) * brow + sum11;
        sum12 = vec4<f32>(arow2.x) * brow + sum12;
        sum13 = vec4<f32>(arow3.x) * brow + sum13;

        brow = array_b[(k * 4u + 1u) * ND4 + x * 2u + 0u];
        sum00 = vec4<f32>(arow0.y) * brow + sum00;
        sum01 = vec4<f32>(arow1.y) * brow + sum01;
        sum02 = vec4<f32>(arow2.y) * brow + sum02;
        sum03 = vec4<f32>(arow3.y) * brow + sum03;

        brow = array_b[(k * 4u + 1u) * ND4 + x * 2u + 1u];
        sum10 = vec4<f32>(arow0.y) * brow + sum10;
        sum11 = vec4<f32>(arow1.y) * brow + sum11;
        sum12 = vec4<f32>(arow2.y) * brow + sum12;
        sum13 = vec4<f32>(arow3.y) * brow + sum13;

        brow = array_b[(k * 4u + 2u) * ND4 + x * 2u + 0u];
        sum00 = vec4<f32>(arow0.z) * brow + sum00;
        sum01 = vec4<f32>(arow1.z) * brow + sum01;
        sum02 = vec4<f32>(arow2.z) * brow + sum02;
        sum03 = vec4<f32>(arow3.z) * brow + sum03;

        brow = array_b[(k * 4u + 2u) * ND4 + x * 2u + 1u];
        sum10 = vec4<f32>(arow0.z) * brow + sum10;
        sum11 = vec4<f32>(arow1.z) * brow + sum11;
        sum12 = vec4<f32>(arow2.z) * brow + sum12;
        sum13 = vec4<f32>(arow3.z) * brow + sum13;

        brow = array_b[(k * 4u + 3u) * ND4 + x * 2u + 0u];
        sum00 = vec4<f32>(arow0.w) * brow + sum00;
        sum01 = vec4<f32>(arow1.w) * brow + sum01;
        sum02 = vec4<f32>(arow2.w) * brow + sum02;
        sum03 = vec4<f32>(arow3.w) * brow + sum03;

        brow = array_b[(k * 4u + 3u) * ND4 + x * 2u + 1u];
        sum10 = vec4<f32>(arow0.w) * brow + sum10;
        sum11 = vec4<f32>(arow1.w) * brow + sum11;
        sum12 = vec4<f32>(arow2.w) * brow + sum12;
        sum13 = vec4<f32>(arow3.w) * brow + sum13;
      }

      var array_bias_1: vec4<f32> = array_bias[x * 2u + 0u];
      sum00 = sum00 + array_bias_1;
      sum01 = sum01 + array_bias_1;
      sum02 = sum02 + array_bias_1;
      sum03 = sum03 + array_bias_1;

      var array_bias_2: vec4<f32> = array_bias[x * 2u + 1u];
      sum10 = sum10 + array_bias_2;
      sum11 = sum11 + array_bias_2;
      sum12 = sum12 + array_bias_2;
      sum13 = sum13 + array_bias_2;

      ${outputCode[flag]}
    }
  `;
  }
}

class ResidualBlockClass extends Block {
  constructor() {
    super();
    this.name = "residual";
  }

  getPipeline() {
    const pipelineCacheKey = this.name; // No param optimization.
    if (this.pipelineCache.has(pipelineCacheKey))
      return this.pipelineCache.get(pipelineCacheKey);
    const pipeline = this.initPipeline(
      this.elementWiseAdditionShader,
      [this.u_s_Layout, this.r_r_Layout],
      `${this.name}_Pipeline`,
    );
    this.pipelineCache.set(pipelineCacheKey, pipeline);
    return pipeline;
  }

  newInstance(rows, cols, outputBuf, residualBuf) {
    if (cols % 4 !== 0) throw new Error("Cols must be divisible by 4.");
    const pipeline = this.getPipeline();
    const uniformBuffer = this.initUniform(4, [
      [0, new Uint32Array([rows, Math.ceil(cols / 4)])],
    ]);
    const resultBuffer = this.initResultBuffer([rows, cols]);
    const opBindGroup = this.initBindGroup(
      this.u_s_Layout,
      [uniformBuffer, resultBuffer],
      `${this.name}_OpG`,
    );
    const inputBindGroup = this.initBindGroup(
      this.r_r_Layout,
      [outputBuf, residualBuf],
      `${this.name}_InputG`,
    );
    const workgroups = { x: wgSize(cols, 32), y: wgSize(rows, 8), z: 1 };

    return {
      resultBuffer,
      passes: [
        {
          flag: "compute",
          pipeline,
          groups: [opBindGroup, inputBindGroup],
          workgroups,
        },
      ],
    };
  }

  elementWiseAdditionShader = `
    struct Meta {
      M: u32,
      ND4: u32,
    }

    @group(1) @binding(0) var<storage, read> layer_out_array: array<vec4<f32>>;
    @group(1) @binding(1) var<storage, read> residual_array: array<vec4<f32>>;

    @group(0) @binding(0) var<uniform> uniforms: Meta;
    @group(0) @binding(1) var<storage, read_write> result_array: array<vec4<f32>>;

    @compute @workgroup_size(8, 8)
    fn main (@builtin(global_invocation_id) global_id: vec3<u32>) {
      var col: u32 = global_id.x;
      var row: u32 = global_id.y;
      var ND4: u32 = uniforms.ND4;
      var M: u32 = uniforms.M;

      if (row >= M || col >= ND4) {
        return;
      }
      
      let index = row * ND4 + col;
      result_array[index] =  layer_out_array[index] + residual_array[index];
    }
  `;
}

class LayerNormBlockClass extends Block {
  constructor() {
    super();
    this.name = "layerNorm";
  }

  getStatsPipeline(workgroups) {
    const pipelineCacheKey = `${this.name}_stats_${workgroups}`;
    if (this.pipelineCache.has(pipelineCacheKey))
      return this.pipelineCache.get(pipelineCacheKey);
    const pipeline = this.initPipeline(
      this.normStatsShader(workgroups),
      [this.u_s_Layout, this.r_Layout],
      `${this.name}_Pipeline_Stats`,
    );
    this.pipelineCache.set(pipelineCacheKey, pipeline);
    return pipeline;
  }

  getNormPipeline() {
    const pipelineCacheKey = `${this.name}_norm`; // No param optimization.
    if (this.pipelineCache.has(pipelineCacheKey))
      return this.pipelineCache.get(pipelineCacheKey);
    const pipeline = this.initPipeline(
      this.normShader,
      [this.u_s_Layout, this.r_r_r_r_Layout],
      `${this.name}_Pipeline_Norm`,
    );
    this.pipelineCache.set(pipelineCacheKey, pipeline);
    return pipeline;
  }

  newInstance(rows, cols, inputBuffer, gammaBuffer, betaBuffer) {
    if (cols % 4 !== 0) throw new Error("Cols must be divisible by 4.");

    const workgroupsX = cols > 4096 ? 256 : 64;
    const statsPipeline = this.getStatsPipeline(workgroupsX);
    const statsUniformBuffer = this.initUniform(4, [
      [0, new Uint32Array([cols])],
    ]);
    const statsResultBuffer = this.initResultBuffer([rows, 2]);
    const statsBindGroup = this.initBindGroup(
      this.u_s_Layout,
      [statsUniformBuffer, statsResultBuffer],
      `${this.name}_BindGroup_stats`,
    );
    const statsInputBindGroup = this.initBindGroup(
      this.r_Layout,
      [inputBuffer],
      `${this.name}_InputG`,
    );
    const statsWorkgroups = { x: 1, y: wgSize(rows, 1), z: 1 };

    const normPipeline = this.getNormPipeline();
    const normUniformBuffer = this.initUniform(4, [
      [0, new Uint32Array([rows, Math.ceil(cols / 4)])],
    ]);
    const normResultBuffer = this.initResultBuffer([rows, cols]);
    const normBindGroup = this.initBindGroup(
      this.u_s_Layout,
      [normUniformBuffer, normResultBuffer],
      `${this.name}_BindGroup_norm`,
    );
    const normInputBindGroup = this.initBindGroup(
      this.r_r_r_r_Layout,
      [inputBuffer, gammaBuffer, betaBuffer, statsResultBuffer],
      `${this.name}_InputBindGroup_norm`,
    );
    const normWorkgroups = { x: wgSize(cols, 32), y: wgSize(rows, 8), z: 1 };

    return {
      resultBuffer: normResultBuffer,
      passes: [
        {
          flag: "compute",
          pipeline: statsPipeline,
          groups: [statsBindGroup, statsInputBindGroup],
          workgroups: statsWorkgroups,
        },
        {
          flag: "compute",
          pipeline: normPipeline,
          groups: [normBindGroup, normInputBindGroup],
          workgroups: normWorkgroups,
        },
      ],
    };
  }

  // I'm pretty sure this breaks for col < workgroupSize? Needs testing.
  normStatsShader = (wg_size) => `
    struct Meta {
      N: u32, 
    };

    const wg_size: u32 = ${wg_size};

    @group(1) @binding(0) var<storage, read> input_array: array<f32>;

    @group(0) @binding(0) var<uniform> uniforms: Meta;
    @group(0) @binding(1) var<storage, read_write> result_array: array<f32>;

    var<workgroup> row_mean: f32;
    var<workgroup> op_buffer: array<f32, ${wg_size}>;

    @compute @workgroup_size(${wg_size})
    fn main (@builtin(global_invocation_id) global_id: vec3<u32>) {
      let col: u32 = global_id.x;
      let row: u32 = global_id.y;
      let N: u32 = uniforms.N;

      // Condense.
      var threadSum: f32 = 0.0;
      for (var i: u32 = col; i < N; i = i + wg_size) {
        threadSum = threadSum + input_array[row * N + i];
      }
      op_buffer[col] = threadSum;
      workgroupBarrier();
      
      // Reduce to one value sum. Optimize with bit shifts.
      for (var i: u32 = wg_size >> 1; i > 0; i = i >> 1) {
        if (col < i) {
          op_buffer[col] = op_buffer[col] + op_buffer[col + i];
        }
        workgroupBarrier();
      }
      
      if (col == 0) {
        row_mean = op_buffer[0] / f32(N);
      }
      workgroupBarrier();

      // Condense.
      var threadVariance: f32 = 0.0;
      for (var i: u32 = col; i < N; i = i + wg_size) {
        threadVariance = threadVariance + pow(input_array[row * N + i] - row_mean, 2);
      }
      op_buffer[col] = threadVariance / f32(N);
      workgroupBarrier();
      
      for (var i: u32 = wg_size >> 1; i > 0; i = i >> 1) {
        if (col < i) {
          op_buffer[col] = op_buffer[col] + op_buffer[col + i];
        }
        workgroupBarrier();
      }
      
      var stdev: f32 = sqrt(op_buffer[0] + 1e-5);

      if (col == 0) {
        result_array[row * 2] = row_mean;
        result_array[row * 2 + 1] = stdev;
      }
    }
  `;

  normShader = `
    struct Meta {
      M: u32,
      ND4: u32,
    }

    @group(0) @binding(0) var<uniform> uniforms: Meta;
    @group(0) @binding(1) var<storage, read_write> result_array: array<vec4<f32>>;

    @group(1) @binding(0) var<storage, read> input_array: array<vec4<f32>>;
    @group(1) @binding(1) var<storage, read> gamma_param: array<vec4<f32>>;
    @group(1) @binding(2) var<storage, read> beta_param: array<vec4<f32>>;
    @group(1) @binding(3) var<storage, read> stats_param: array<f32>;

    @compute @workgroup_size(8, 8)
    fn main (@builtin(global_invocation_id) global_id: vec3<u32>) {
      var col: u32 = global_id.x;
      var row: u32 = global_id.y;
      var ND4: u32 = uniforms.ND4;
      var M: u32 = uniforms.M;

      if (row >= M || col >= ND4) {
        return;
      }

      let mean = stats_param[row * 2];
      let stdev = stats_param[row * 2 + 1];
      let output = (input_array[row * ND4 + col] - mean) / stdev;
      let gamma = gamma_param[col];
      let beta = beta_param[col];
      let shift = gamma * output + beta;
      result_array[row * ND4 + col] = shift;
    }
  `;
}

class SoftmaxBlockClass extends Block {
  constructor() {
    super();
    this.name = "softmax";
  }

  getFusedPipeline(workgroups, transpose) {
    const pipelineCacheKey = `${this.name}_fused_${workgroups}_${transpose}`;
    if (this.pipelineCache.has(pipelineCacheKey))
      return this.pipelineCache.get(pipelineCacheKey);
    const pipeline = this.initPipeline(
      this.fusedShader(workgroups, transpose),
      [this.u_s_Layout, this.r_Layout],
      `${this.name}_Pipeline_Div`,
    );
    this.pipelineCache.set(pipelineCacheKey, pipeline);
    return pipeline;
  }

  newInstance(rows, cols, inputBuffer, transpose = false) {
    const workgroupsX = cols > 4096 ? 256 : 64;
    const fusedPipeline = this.getFusedPipeline(workgroupsX, transpose);

    const uniformBuffer = this.initUniform(4, [
      [0, new Uint32Array([rows, cols])],
    ]);
    const resultBuffer = this.initResultBuffer(
      [rows, cols],
      `${this.name}_ResultBuffer_`,
    );
    const bindGroup = this.initBindGroup(
      this.u_s_Layout,
      [uniformBuffer, resultBuffer],
      `${this.name}_BindGroup_`,
    );
    const inputBindGroup = this.initBindGroup(
      this.r_Layout,
      [inputBuffer],
      `${this.name}_BindGroup__Input`,
    );
    const workgroups = { x: 1, y: wgSize(rows, 1), z: 1 };

    return {
      resultBuffer: resultBuffer,
      passes: [
        {
          flag: "compute",
          pipeline: fusedPipeline,
          groups: [bindGroup, inputBindGroup],
          workgroups: workgroups,
        },
      ],
    };
  }

  /*
    Possible improvements: Vectorization? Modify input buffer to coalesce better?
  */
  fusedShader(wg_size, transpose) {
    const outputIndex = transpose ? "i * uniforms.M + row" : "row * N + i";
    return `
    struct Meta {
      M: u32,
      N: u32, 
    };

    const minFloat: f32 = -3.402823e+38f;
    const wg_size: u32 = ${wg_size};

    @group(0) @binding(0) var<uniform> uniforms: Meta;
    @group(0) @binding(1) var<storage, read_write> result_array: array<f32>;
    @group(1) @binding(0) var<storage, read> input_array: array<f32>;

    var<workgroup> max_row: f32;
    var<workgroup> sum_row: f32;
    var<workgroup> op_buffer: array<f32, ${wg_size}>;

    @compute @workgroup_size(${wg_size})
    fn main (@builtin(global_invocation_id) global_id: vec3<u32>) {
      let col: u32 = global_id.x;
      let row: u32 = global_id.y;
      let N: u32 = uniforms.N;

      // Condense into 256 col max.
      var thread_max = minFloat;
      for (var i: u32 = col; i < N; i = i + wg_size) {
        thread_max = max(thread_max, input_array[row * N + i]);
      }
      if (col < N) {
        op_buffer[col] = thread_max;
      }
      workgroupBarrier();
      
      // Reduce to one value max. Optimize with bit shifts.
      var reductionSize: u32 = min(N, wg_size);
      for (var i: u32 = reductionSize >> 1; i > 0; i = reductionSize >> 1) {
        reductionSize = i + (reductionSize & 1); // Ensure odd numbers are rounded up.
        if (col < i) {
          op_buffer[col] = max(op_buffer[col], op_buffer[col + reductionSize]);
        }
        workgroupBarrier();
      }
      if (col == 0) {
        max_row = op_buffer[0];
      }
      workgroupBarrier();

      var threadSum: f32 = 0.0;
      for (var i: u32 = col; i < N; i = i + wg_size) {
        threadSum = threadSum + exp(input_array[row * N + i] - max_row);
      }
      op_buffer[col] = threadSum;
      workgroupBarrier();
      
      for (var i: u32 = wg_size >> 1; i > 0; i = i >> 1) {
        if (col < i) {
          op_buffer[col] = op_buffer[col] + op_buffer[col + i];
        }
        workgroupBarrier();
      }
      
      if (col == 0) {
        sum_row = op_buffer[0];
      }
      workgroupBarrier();

      for (var i: u32 = col; i < N; i = i + wg_size) {
        result_array[${outputIndex}] = exp(input_array[row * N + i] - max_row) / sum_row;
      }
    }
  `;
  }
}

class GeluBlockClass extends Block {
  constructor() {
    super();
    this.name = "gelu";
  }

  getPipeline() {
    const pipelineCacheKey = this.name; // No param optimization.
    if (this.pipelineCache.has(pipelineCacheKey))
      return this.pipelineCache.get(pipelineCacheKey);
    const pipeline = this.initPipeline(
      this.GELUShader,
      [this.u_s_Layout, this.r_Layout],
      `${this.name}_Pipeline`,
    );
    this.pipelineCache.set(pipelineCacheKey, pipeline);
    return pipeline;
  }

  newInstance(rows, cols, inputBuf) {
    if (cols % 4 !== 0) throw new Error("Cols must be divisible by 4.");
    const pipeline = this.getPipeline();
    const uniformBuffer = this.initUniform(4, [
      [0, new Uint32Array([rows, Math.ceil(cols / 4)])],
    ]);
    const resultBuffer = this.initResultBuffer([rows, cols]);
    const opBindGroup = this.initBindGroup(
      this.u_s_Layout,
      [uniformBuffer, resultBuffer],
      `${this.name}_OpG`,
    );
    const inputBindGroup = this.initBindGroup(
      this.r_Layout,
      [inputBuf],
      `${this.name}_InputG`,
    );
    const workgroups = { x: wgSize(cols, 32), y: wgSize(rows, 8), z: 1 };

    return {
      resultBuffer,
      passes: [
        {
          flag: "compute",
          pipeline,
          groups: [opBindGroup, inputBindGroup],
          workgroups,
        },
      ],
    };
  }

  GELUShader = `
    struct Meta {
      M: u32,
      ND4: u32,
    }

    const LOW_THRESHOLD: vec4<f32> = vec4<f32>(-10.0);
    const HIGH_THRESHOLD: vec4<f32> = vec4<f32>(10.0);
    const ZERO: vec4<f32> = vec4<f32>(0.0);
    const HALF: vec4<f32> = vec4<f32>(0.5);
    const SQRPI: vec4<f32> = vec4<f32>(0.7978845608);
    const COEFF: vec4<f32> = vec4<f32>(0.044715);
    
    fn gelu_vec4(x: vec4<f32>) -> vec4<f32> {
      let x_cubed: vec4<f32> = pow(x, vec4<f32>(3.0));
      let cdf_approx: vec4<f32> = HALF * (vec4<f32>(1.0) + tanh(SQRPI * (x + COEFF * x_cubed)));
  
      let result: vec4<f32> = x * cdf_approx;
  
      let lt_mask: vec4<bool> = x < LOW_THRESHOLD;
      let gt_mask: vec4<bool> = x > HIGH_THRESHOLD;
  
      return select(select(result, ZERO, lt_mask), x, gt_mask);
    }

    @group(1) @binding(0) var<storage,read> array_matrix: array<vec4<f32>>;

    @group(0) @binding(0) var<uniform> uniforms: Meta;
    @group(0) @binding(1) var<storage,read_write> array_output: array<vec4<f32>>;

    @compute @workgroup_size(8, 8)
    fn main (@builtin(global_invocation_id) global_id: vec3<u32>) {
      var col: u32 = global_id.x;
      var row: u32 = global_id.y;
      var ND4: u32 = uniforms.ND4;
      var M: u32 = uniforms.M;
      
      if (row >= M || col >= ND4) {
        return;
      }

      array_output[row * ND4 + col] = gelu_vec4(array_matrix[row * ND4 + col]);
    }
  `;
}

class EmbedBlockClass extends Block {
  constructor() {
    super();
    this.name = "embed";
  }

  staticLoad(
    embdOutputBuffer,
    posEmbdOutputBuffer,
    embdBuffers,
    posEmbdBuffer,
    idx,
    seq_length,
    n_embd,
    vocab_chunk_size,
  ) {
    // Can build a cache later.
    const embdCopyCommands = Array(seq_length)
      .fill()
      .map((_, i) => {
        const chunkOffset = Math.floor(idx[i] / vocab_chunk_size);
        const chunkIdx = idx[i] % vocab_chunk_size;

        return {
          flag: "copy",
          src: embdBuffers[chunkOffset],
          srcOffset: this.bufferSize(n_embd) * chunkIdx,
          dst: embdOutputBuffer,
          dstOffset: this.bufferSize(n_embd) * i,
          size: this.bufferSize(n_embd),
        };
      });

    // Also can be cached.
    const posCopyCommand = {
      flag: "copy",
      src: posEmbdBuffer,
      srcOffset: 0,
      dst: posEmbdOutputBuffer,
      dstOffset: 0,
      size: this.bufferSize(seq_length, n_embd),
    };

    return {
      passes: [...embdCopyCommands, posCopyCommand],
    };
  }

  newInstance(
    idx,
    seq_length,
    n_embd,
    vocab_chunk_size,
    embdBuffers,
    posEmbdBuffer,
    ResidualBlock,
  ) {
    const embdOutputBuffer = this.initBuffer(
      ["storage", "copy_to"],
      [seq_length, n_embd],
    );
    const posEmbdOutputBuffer = this.initBuffer(
      ["storage", "copy_to"],
      [seq_length, n_embd],
    );

    // Can build a cache later.
    const embdCopyCommands = Array(seq_length)
      .fill()
      .map((_, i) => {
        const chunkOffset = Math.floor(idx[i] / vocab_chunk_size);
        const chunkIdx = idx[i] % vocab_chunk_size;

        return {
          flag: "copy",
          src: embdBuffers[chunkOffset],
          srcOffset: this.bufferSize(n_embd) * chunkIdx,
          dst: embdOutputBuffer,
          dstOffset: this.bufferSize(n_embd) * i,
          size: this.bufferSize(n_embd),
        };
      });

    // Also can be cached.
    const posCopyCommand = {
      flag: "copy",
      src: posEmbdBuffer,
      srcOffset: 0,
      dst: posEmbdOutputBuffer,
      dstOffset: 0,
      size: this.bufferSize(seq_length, n_embd),
    };

    const { resultBuffer: residualResult, passes: residualPasses } =
      ResidualBlock.newInstance(
        seq_length,
        n_embd,
        embdOutputBuffer,
        posEmbdOutputBuffer,
      );

    return {
      resultBuffer: residualResult,
      passes: [...embdCopyCommands, posCopyCommand, ...residualPasses],
    };
  }
}

class DeEmbedBlockClass extends Block {
  constructor() {
    super();
    this.name = "deembed";
  }

  getPipeline() {
    const pipelineCacheKey = this.name; // No param optimization.
    if (this.pipelineCache.has(pipelineCacheKey))
      return this.pipelineCache.get(pipelineCacheKey);
    const pipeline = this.initPipeline(
      this.deEmbedShader,
      [this.u_s_Layout, this.r_r_Layout],
      `${this.name}_Pipeline`,
    );
    this.pipelineCache.set(pipelineCacheKey, pipeline);
    return pipeline;
  }

  newInstance(
    n_embd,
    vocab_size,
    padded_vocab_size,
    seq_length,
    vocab_chunk_size,
    embedBuffer,
    deEmbeddingsBuffers,
  ) {
    const deEmbedPipeline = this.getPipeline();
    const slicedEmbedOutputBuffer = this.initBuffer(
      ["storage", "copy_to"],
      [n_embd],
    );
    const deEmbedOutputBuffer = this.initBuffer(
      ["map_read", "copy_to"],
      [vocab_size],
    );

    const sliceEmbedCopyCommand = {
      flag: "copy",
      src: embedBuffer,
      srcOffset: this.bufferSize(seq_length - 1, n_embd),
      dst: slicedEmbedOutputBuffer,
      dstOffset: 0,
      size: this.bufferSize(1, n_embd),
    };

    const deEmbedPasses = deEmbeddingsBuffers.flatMap((embdBuffer, i) => {
      // Some future optimizations where we can assume that vocab_size is consistent.
      const uniformBuffer = this.initUniform(4, [
        [
          0,
          new Uint32Array([
            vocab_chunk_size,
            Math.ceil(vocab_chunk_size / 4),
            Math.ceil(n_embd / 4),
          ]),
        ],
      ]);
      const resultBuffer = this.initResultBuffer([vocab_chunk_size]);
      const opBindGroup = this.initBindGroup(
        this.u_s_Layout,
        [uniformBuffer, resultBuffer],
        `${this.name}_OpG`,
      );
      const inputBindGroup = this.initBindGroup(
        this.r_r_Layout,
        [slicedEmbedOutputBuffer, embdBuffer],
        `${this.name}_InputG`,
      );
      const workgroups = { x: wgSize(vocab_chunk_size, 32), y: 1, z: 1 };

      return [
        {
          flag: "compute",
          pipeline: deEmbedPipeline,
          groups: [opBindGroup, inputBindGroup],
          workgroups,
        },
        {
          flag: "copy",
          src: resultBuffer,
          srcOffset: 0,
          dst: deEmbedOutputBuffer,
          dstOffset: i * this.bufferSize(vocab_chunk_size),
          size:
            i == deEmbeddingsBuffers.length - 1
              ? this.bufferSize(
                  vocab_chunk_size - (padded_vocab_size - vocab_size),
                )
              : this.bufferSize(vocab_chunk_size),
        },
      ];
    });

    return {
      resultBuffer: deEmbedOutputBuffer,
      passes: [sliceEmbedCopyCommand, ...deEmbedPasses],
    };
  }

  deEmbedShader = `
    struct Meta {
      N: u32,
      ND4: u32,
      KD4: u32,
    }

    @group(1) @binding(0) var<storage,read> embed_vector: array<vec4<f32>>;
    @group(1) @binding(1) var<storage,read> deembed_matrix: array<vec4<f32>>;
    @group(0) @binding(0) var<uniform> uniforms: Meta;
    @group(0) @binding(1) var<storage,read_write> array_output: array<vec4<f32>>;

    @compute @workgroup_size(4)
    fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
      var N: u32 = uniforms.N;
      var ND4: u32 = uniforms.ND4;
      var KD4: u32 = uniforms.KD4;
      var colD8: u32 = global_id.x;

      if (colD8 * 8 >= N) {
        return;
      }

      var sum00: vec4<f32> = vec4<f32>();
      var sum10: vec4<f32> = vec4<f32>();

      for(var k: u32 = 0u; k < KD4; k = k + 1u) {
        var arow0: vec4<f32> = embed_vector[k];
        var brow: vec4<f32>;

        brow = deembed_matrix[(k * 4u + 0u) * ND4 + colD8 * 2u + 0u];
        sum00 = vec4<f32>(arow0.x) * brow + sum00;

        brow = deembed_matrix[(k * 4u + 0u) * ND4 + colD8 * 2u + 1u];
        sum10 = vec4<f32>(arow0.x) * brow + sum10;
       
        brow = deembed_matrix[(k * 4u + 1u) * ND4 + colD8 * 2u + 0u];
        sum00 = vec4<f32>(arow0.y) * brow + sum00;
       
        brow = deembed_matrix[(k * 4u + 1u) * ND4 + colD8 * 2u + 1u];
        sum10 = vec4<f32>(arow0.y) * brow + sum10;
       
        brow = deembed_matrix[(k * 4u + 2u) * ND4 + colD8 * 2u + 0u];
        sum00 = vec4<f32>(arow0.z) * brow + sum00;
        
        brow = deembed_matrix[(k * 4u + 2u) * ND4 + colD8 * 2u + 1u];
        sum10 = vec4<f32>(arow0.z) * brow + sum10;
       
        brow = deembed_matrix[(k * 4u + 3u) * ND4 + colD8 * 2u + 0u];
        sum00 = vec4<f32>(arow0.w) * brow + sum00;

        brow = deembed_matrix[(k * 4u + 3u) * ND4 + colD8 * 2u + 1u];
        sum10 = vec4<f32>(arow0.w) * brow + sum10;
      }

      if (colD8 * 8u + 0u < N) {
        array_output[colD8 * 2u + 0u] = sum00;
      }
      if (colD8 * 8u + 4u < N) {
        array_output[colD8 * 2u + 1u] = sum10;
      }
    }
  `;
}

class AttentionBlockClass extends Block {
  constructor() {
    super();
    this.name = "attention";
  }

  getNewAttentionWeightsPipeline() {
    const pipelineCacheKey = `${this.name}_weights_fused`; // No param optimization.
    if (this.pipelineCache.has(pipelineCacheKey))
      return this.pipelineCache.get(pipelineCacheKey);
    const pipeline = this.initPipeline(
      this.fusedWeightsShader,
      [this.u_s_Layout, this.r_r_Layout],
      `${this.name}_Pipeline_AttWeights`,
    );
    this.pipelineCache.set(pipelineCacheKey, pipeline);
    return pipeline;
  }

  getNewAttentionValuesPipeline() {
    const pipelineCacheKey = `${this.name}_values_fused`; // No param optimization.
    if (this.pipelineCache.has(pipelineCacheKey))
      return this.pipelineCache.get(pipelineCacheKey);
    const pipeline = this.initPipeline(
      this.newAttentionValuesShader,
      [this.u_s_Layout, this.r_r_Layout],
      `${this.name}_Pipeline_AttValues`,
    );
    this.pipelineCache.set(pipelineCacheKey, pipeline);
    return pipeline;
  }

  getFormatQPipeline() {
    const pipelineCacheKey = `${this.name}_format_q`; // No param optimization.
    if (this.pipelineCache.has(pipelineCacheKey))
      return this.pipelineCache.get(pipelineCacheKey);
    const pipeline = this.initPipeline(
      this.formatQShader,
      [this.u_s_Layout, this.r_Layout],
      `${this.name}_Pipeline_formatQ`,
    );
    this.pipelineCache.set(pipelineCacheKey, pipeline);
    return pipeline;
  }

  newFusedInstance(
    seq_length,
    n_embd,
    attentionDotProductScale,
    n_head,
    head_size,
    inputBuffer,
    qWeightsBuffer,
    qBiasBuffer,
    kWeightsBuffer,
    kBiasBuffer,
    vWeightsBuffer,
    vBiasBuffer,
    linearWeightsBuffer,
    linearBiasBuffer,
    FastMatMulBlock,
    SoftmaxBlock,
  ) {
    const { resultBuffer: QResultBuffer, passes: QMLPPasses } =
      FastMatMulBlock.newInstance(
        seq_length,
        n_embd,
        n_embd,
        inputBuffer,
        qWeightsBuffer,
        qBiasBuffer,
      );
    const { resultBuffer: KResultBuffer, passes: KMLPPasses } =
      FastMatMulBlock.newInstance(
        seq_length,
        n_embd,
        n_embd,
        inputBuffer,
        kWeightsBuffer,
        kBiasBuffer,
      );
    const { resultBuffer: VResultBuffer, passes: VMLPPasses } =
      FastMatMulBlock.newInstance(
        seq_length,
        n_embd,
        n_embd,
        inputBuffer,
        vWeightsBuffer,
        vBiasBuffer,
      );

    const formatQPipeline = this.getFormatQPipeline();
    const formatQUniformBuffer = this.initUniform(4, [
      [0, new Uint32Array([seq_length, n_embd, head_size])],
    ]);
    const formatQResultBuffer = this.initResultBuffer([
      seq_length * n_head,
      head_size,
    ]);
    const formatQBindGroup = this.initBindGroup(this.u_s_Layout, [
      formatQUniformBuffer,
      formatQResultBuffer,
    ]);
    const formatQInputBindGroup = this.initBindGroup(
      this.r_Layout,
      [QResultBuffer],
      `${this.name}_formatQInputG`,
    );
    const formatQWorkgroups = {
      x: wgSize(n_embd, 8),
      y: wgSize(seq_length, 8),
      z: 1,
    };

    const attentionWeightsPipeline = this.getNewAttentionWeightsPipeline();
    const attentionWeightsUniformBuffer = this.initUniform(8, [
      [
        0,
        new Uint32Array([
          seq_length * n_head,
          seq_length,
          n_embd / 4,
          head_size / 4,
        ]),
      ],
      [16, new Float32Array([attentionDotProductScale])],
    ]);
    const attentionWeightsResultBuffer = this.initResultBuffer([
      seq_length * n_head,
      seq_length,
    ]);
    const attentionWeightsBindGroup = this.initBindGroup(
      this.u_s_Layout,
      [attentionWeightsUniformBuffer, attentionWeightsResultBuffer],
      `${this.name}_AttentionWeightsG`,
    );
    const attentionWeightsInputBindGroup = this.initBindGroup(
      this.r_r_Layout,
      [formatQResultBuffer, KResultBuffer],
      `${this.name}_AttentionWeightsInputG`,
    );
    const attentionWeightsWorkgroups = {
      x: wgSize(seq_length, 8),
      y: wgSize(seq_length * n_head, 8),
      z: 1,
    };

    const { resultBuffer: softmaxOutputBuffer, passes: softmaxPasses } =
      SoftmaxBlock.newInstance(
        seq_length * n_head,
        seq_length,
        attentionWeightsResultBuffer,
      );

    const attentionValuesPipeline = this.getNewAttentionValuesPipeline();
    const attentionValuesUniformBuffer = this.initUniform(4, [
      [0, new Uint32Array([seq_length, n_embd / 4, head_size / 4])],
    ]);
    const attentionValuesResultBuffer = this.initResultBuffer([
      seq_length,
      n_embd,
    ]);
    const attentionValuesBindGroup = this.initBindGroup(this.u_s_Layout, [
      attentionValuesUniformBuffer,
      attentionValuesResultBuffer,
    ]);
    const attentionValuesInputBindGroup = this.initBindGroup(
      this.r_r_Layout,
      [softmaxOutputBuffer, VResultBuffer],
      `${this.name}_AttentionValuesInputG`,
    );
    const attentionValuesWorkgroups = {
      x: wgSize(n_embd, 32),
      y: wgSize(seq_length, 8),
      z: 1,
    };

    const { resultBuffer: linearMLPResult, passes: linearMLPPasses } =
      FastMatMulBlock.newInstance(
        seq_length,
        n_embd,
        n_embd,
        attentionValuesResultBuffer,
        linearWeightsBuffer,
        linearBiasBuffer,
      );

    return {
      resultBuffer: linearMLPResult,
      passes: [
        ...QMLPPasses,
        ...KMLPPasses,
        ...VMLPPasses,
        {
          flag: "compute",
          pipeline: formatQPipeline,
          groups: [formatQBindGroup, formatQInputBindGroup],
          workgroups: formatQWorkgroups,
        },
        {
          flag: "compute",
          pipeline: attentionWeightsPipeline,
          groups: [attentionWeightsBindGroup, attentionWeightsInputBindGroup],
          workgroups: attentionWeightsWorkgroups,
        },
        ...softmaxPasses,
        {
          flag: "compute",
          pipeline: attentionValuesPipeline,
          groups: [attentionValuesBindGroup, attentionValuesInputBindGroup],
          workgroups: attentionValuesWorkgroups,
        },
        ...linearMLPPasses,
      ],
    };
  }

  formatQShader = `
    struct Meta {
      M: u32,
      N: u32,
      HSize: u32,
    }

    @group(1) @binding(0) var<storage, read> input_array: array<f32>;

    @group(0) @binding(0) var<uniform> uniforms: Meta;
    @group(0) @binding(1) var<storage, read_write> result_array: array<f32>;

    var<workgroup> tile: array<array<f32, 8>, 8>;

    @compute @workgroup_size(8, 8)
    fn main (@builtin(local_invocation_id) local_id: vec3<u32>, @builtin(workgroup_id) workgroup_id: vec3<u32>) {
      let col: u32 = workgroup_id.x * 8 + local_id.x;
      let row: u32 = workgroup_id.y * 8 + local_id.y;
      let N: u32 = uniforms.N;
      let M: u32 = uniforms.M;

      // Load a tile from input_array to shared memory tile
      if (row < M && col < N) {
          tile[local_id.y][local_id.x] = input_array[row * N + col];
      }

      workgroupBarrier(); // Ensure all threads have finished writing to the shared memory before proceeding

      let HSize: u32 = uniforms.HSize;
      let xOffset: u32 = col % HSize;
      let yOffset: u32 = row * HSize + (col / HSize) * HSize * M;

      // Write the tile to result_array
      if (row < M && col < N) {
          result_array[yOffset + xOffset] = tile[local_id.y][local_id.x];
      }
    } 
  `;

  // Sequence length invariant, no padding needed.
  fusedWeightsShader = `
    struct Meta {
      M: u32, // seq_length * n_heads
      N: u32, // seq_length
      ED4: u32, // hsize * n_heads
      HD4: u32,
      attentionScale: f32,
    };

    @group(1) @binding(0) var<storage, read> query_array: array<vec4<f32>>;
    @group(1) @binding(1) var<storage, read> key_array: array<vec4<f32>>;

    @group(0) @binding(0) var<uniform> uniforms: Meta;
    @group(0) @binding(1) var<storage, read_write> result_array: array<f32>;

    @compute @workgroup_size(8, 8)
    fn main (@builtin(global_invocation_id) global_id: vec3<u32>) {
      let col: u32 = global_id.x;
      let row: u32 = global_id.y;
      let N: u32 = uniforms.N;
      let HD4: u32 = uniforms.HD4;

      if (row >= uniforms.M || col >= N) {
        return;
      }

      let head: u32 = row / N;
      var sum: f32 = 0.0;
      for (var i: u32 = 0; i < HD4; i = i + 1) {
        sum = sum + dot(query_array[row * HD4 + i], key_array[col * uniforms.ED4 + i + head * HD4]);
      }

      // Causal attention step.
      let rowMask: u32 = row % N;
      let causalMask: bool = (col <= rowMask);
      result_array[row * N + col] = select(-1e9, sum * uniforms.attentionScale, causalMask);
    }
  `;

  newAttentionValuesShader = `
    struct Meta {
      M: u32,
      ND4: u32,
      HD4: u32,
    }

    @group(0) @binding(0) var<uniform> uniforms: Meta;
    @group(0) @binding(1) var<storage, read_write> result_array: array<vec4<f32>>;

    @group(1) @binding(0) var<storage, read> weights_array: array<f32>;
    @group(1) @binding(1) var<storage, read> values_array: array<vec4<f32>>;

    @compute @workgroup_size(8, 8)
    fn main (@builtin(global_invocation_id) global_id: vec3<u32>) {
      var col: u32 = global_id.x;
      var row: u32 = global_id.y;
      var M: u32 = uniforms.M;
      var ND4: u32 = uniforms.ND4;
      var HD4: u32 = uniforms.HD4;

      if (row >= M || col >= ND4) {
        return;
      }

      let head: u32 = col / HD4;
      var sum: vec4<f32> = vec4<f32>(0.0);
      for (var i: u32 = 0; i < M; i = i + 1) {
        var weight = weights_array[row * M + i + head * M * M]; // weights is M * M
        sum = sum + values_array[i * ND4 + col] * weight;
      }

      result_array[row * ND4 + col] = sum;
    }
  `;
}

// ---- model.js ----
class GPT {
  constructor(folder, type) {
    this.folder = folder;
    this.tokenizerType = type;
    this.initialized = false;

    this.device;
    this.model;
    this.tokenizer;
    this.params;
    this.minBufferOffset = 1;

    this.defaultPrompt;
    this.defaultTopK;
    this.defaultTemperature;
    this.defaultTokens;

    this.externalBuffer;

    this.unloadDeletionStack = [];
  }

  async initialize() {
    if (this.initialized) return console.error("Model already initialized");
    if (!navigator.gpu) throw new Error("WebGPU is not supported");

    const adapter = await navigator.gpu.requestAdapter();
    this.device = await adapter.requestDevice();

    initializeOperations(this.device);

    [this.model, this.params] = await this.loadModel(this.folder);
    this.tokenizer =
      this.tokenizerType == "bpe" ? new GPT2Tokenizer() : new SimpleTokenizer();
    await this.tokenizer.load();

    if (this.tokenizerType == "bpe") {
      this.defaultPrompt = `What is the answer to life, the universe, and everything?\n`;
      this.defaultTopK = 3;
      this.defaultTemperature = 1;
      this.defaultTokens = 30;
    } else {
      this.defaultPrompt = `WILL:\nAh, how dare you challenge me?\nHave you forgotten I built WebGPT?\n`;
      this.defaultTopK = 2;
      this.defaultTemperature = 1;
      this.defaultTokens = 80;
    }

    this.initialized = true;

    console.log("Model initialized");
  }

  async *generate(prompt, max_new_tokens, top_k, temperature) {
    if (!this.initialized) {
      console.error("Model not loaded yet");
      return;
    }

    // Buffer size (321644800) exceeds the max buffer size limit (268435456).
    //  - While calling [Device].CreateBuffer([BufferDescriptor]).

    let history = this.tokenizer.encode(prompt);
    console.log(`Prompt (${history.length} tokens):\n${prompt}`);

    const warmupRuns = 3;
    let totalTime = 0;

    for (let i = 0; i < max_new_tokens; i++) {
      const idx_cond = history.slice(-this.params.n_ctx);
      const useAttCache = i !== 0 && history.length <= this.params.n_ctx;

      const startTime = performance.now();
      const logits = await this.run(idx_cond, useAttCache);
      const endTime = performance.now();

      // console.log(`\nIteration ${i + 1} of ${max_new_tokens}`);
      const lapsedTime = endTime - startTime;
      console.log(`Kernel execution time: ${lapsedTime} ms`);
      i >= warmupRuns && (totalTime += lapsedTime);

      const { topKIndices, topKProbs } = selectTopK(logits, top_k);
      const probs = cpuSoftmax(topKProbs, temperature);
      const idx_next = topKIndices[sampleFromDistribution(probs)];

      history = history.concat(idx_next);

      // console.log(`Output:\n${this.tokenizer.decode(history)}`);

      // const totalProbs = cpuSoftmax(logits, temperature);
      // const tokenProbsString = Array.from(totalProbs)
      //   .map((value, index) => ({ value, index }))
      //   .sort((a, b) => b.value - a.value)
      //   .slice(0, 8)
      //   .map((prob) => `{ ${this.tokenizer.decode([prob.index]).replace(/(\r\n|\n|\r)/gm, "newline")} } : ${prob.value.toPrecision(3)}`)
      //   .join(" | ");
      // console.log("Top 8 token probs:", tokenProbsString);

      yield this.tokenizer.decode([idx_next]);
    }

    console.log(
      `Average kernel execution time: ${totalTime / (max_new_tokens - warmupRuns)} ms`,
    );
  }

  async run(idx) {
    const {
      posEmbdBuffer,
      layer_buffers,
      normGammaBuffer,
      normBetaBuffer,
      embeddingsBuffers,
      deEmbeddingsBuffers,
    } = this.model;
    const {
      attention_scale,
      n_embd,
      n_head,
      head_size,
      n_layer,
      vocab_size,
      hidden_size,
      vocab_chunk_size,
      vocab_chunk_instances,
    } = this.params;
    const seq_length = idx.length;

    // ---------------- Create Passes ---------------- //
    // Note: These are re-initialized because everytime seq_length changes buffers are different sizes.

    // Pipeline creation is major bottleneck to spin up speed! Also buffer re-use.

    this.computePasses = [];
    let intermediateBuffer;
    let residualBuffer;
    {
      const { passes, resultBuffer } = EmbedBlock.newInstance(
        idx,
        seq_length,
        n_embd,
        vocab_chunk_size,
        embeddingsBuffers,
        posEmbdBuffer,
        ResidualBlock,
      );
      intermediateBuffer = resultBuffer;
      residualBuffer = resultBuffer;
      this.computePasses.push(...passes);
    }
    for (let i = 0; i < n_layer; i++) {
      const buffers = layer_buffers[i];
      {
        const { passes, resultBuffer } = LayerNormBlock.newInstance(
          seq_length,
          n_embd,
          intermediateBuffer,
          buffers.normAttentionGammaBuffer,
          buffers.normAttentionBetaBuffer,
        );
        intermediateBuffer = resultBuffer;
        this.computePasses.push(...passes);
      }
      {
        const { passes, resultBuffer } = AttentionBlock.newFusedInstance(
          seq_length,
          n_embd,
          attention_scale,
          n_head,
          head_size,
          intermediateBuffer,
          buffers.qkvWeightArray[0],
          buffers.qkvBiasArray[0],
          buffers.qkvWeightArray[1],
          buffers.qkvBiasArray[1],
          buffers.qkvWeightArray[2],
          buffers.qkvBiasArray[2],
          buffers.linearWeightsBuffer,
          buffers.linearBiasBuffer,
          FastMatMulBlock,
          SoftmaxBlock,
        );
        intermediateBuffer = resultBuffer;
        this.computePasses.push(...passes);
      }
      {
        const { passes, resultBuffer } = ResidualBlock.newInstance(
          seq_length,
          n_embd,
          intermediateBuffer,
          residualBuffer,
        );
        intermediateBuffer = resultBuffer;
        residualBuffer = resultBuffer;
        this.computePasses.push(...passes);
      }
      {
        const { passes, resultBuffer } = LayerNormBlock.newInstance(
          seq_length,
          n_embd,
          intermediateBuffer,
          buffers.normLinearGammaBuffer,
          buffers.normLinearBetaBuffer,
        );
        intermediateBuffer = resultBuffer;
        this.computePasses.push(...passes);
      }
      {
        const { resultBuffer, passes } = FastMatMulBlock.newInstance(
          seq_length,
          hidden_size,
          n_embd,
          intermediateBuffer,
          buffers.firstLayerWeightsBuffer,
          buffers.firstLayerBiasBuffer,
        );
        intermediateBuffer = resultBuffer;
        this.computePasses.push(...passes);
      }
      {
        const { resultBuffer, passes } = GeluBlock.newInstance(
          seq_length,
          hidden_size,
          intermediateBuffer,
        );
        intermediateBuffer = resultBuffer;
        this.computePasses.push(...passes);
      }
      {
        const { resultBuffer, passes } = FastMatMulBlock.newInstance(
          seq_length,
          n_embd,
          hidden_size,
          intermediateBuffer,
          buffers.secondLayerWeightsBuffer,
          buffers.secondLayerBiasBuffer,
        );
        intermediateBuffer = resultBuffer;
        this.computePasses.push(...passes);
      }
      {
        const { passes, resultBuffer } = ResidualBlock.newInstance(
          seq_length,
          n_embd,
          intermediateBuffer,
          residualBuffer,
        );
        intermediateBuffer = resultBuffer;
        residualBuffer = resultBuffer;
        this.computePasses.push(...passes);
      }
    }
    {
      if (this.externalBuffer) {
        this.computePasses.push({
          flag: "copy",
          src: intermediateBuffer,
          srcOffset: 0,
          dst: this.externalBuffer,
          dstOffset: 0,
          size: this.bufferSize(seq_length, n_embd),
        });
      }
    }
    {
      const { passes, resultBuffer } = LayerNormBlock.newInstance(
        seq_length,
        n_embd,
        intermediateBuffer,
        normGammaBuffer,
        normBetaBuffer,
      );
      intermediateBuffer = resultBuffer;
      this.computePasses.push(...passes);
    }
    {
      const { passes, resultBuffer } = DeEmbedBlock.newInstance(
        n_embd,
        vocab_size,
        vocab_chunk_size * vocab_chunk_instances,
        seq_length,
        vocab_chunk_size,
        intermediateBuffer,
        deEmbeddingsBuffers,
      );
      intermediateBuffer = resultBuffer;
      this.computePasses.push(...passes);
    }
    const resultBuffer = intermediateBuffer;

    // ---------------- Compute Passes ----------------

    const commandEncoder = this.device.createCommandEncoder();
    for (const pass of this.computePasses) {
      if (pass.flag === "compute") {
        const passEncoder = commandEncoder.beginComputePass();
        passEncoder.setPipeline(pass.pipeline);
        for (let i = 0; i < pass.groups.length; i++)
          passEncoder.setBindGroup(i, pass.groups[i]);
        passEncoder.dispatchWorkgroups(pass.workgroups.x, pass.workgroups.y);
        passEncoder.end();
      } else if (pass.flag === "copy") {
        commandEncoder.copyBufferToBuffer(
          pass.src,
          pass.srcOffset,
          pass.dst,
          pass.dstOffset,
          pass.size,
        );
      }
    }
    this.device.queue.submit([commandEncoder.finish()]);

    // ---------------- Read Results ----------------

    await resultBuffer.mapAsync(GPUMapMode.READ);
    const output = resultBuffer.getMappedRange();
    const outputArray = new Float32Array(output).slice(0); // Copy the array, otherwise it'll be destroyed.

    clearOperationCache();

    return outputArray;
  }

  async loadModel(folder) {
    if (this.initialized) return console.error("Model already loaded");

    console.log("Loading model from folder:", folder);
    const weightsFolder = `weights/${folder}/`;

    const params = await this.loadParameters(weightsFolder);
    const { embeddingsBuffers, deEmbeddingsBuffers } =
      await this.loadEmbeddings(params, weightsFolder);
    const { posEmbdBuffer } = await this.loadPositionalEmbeddings(
      params,
      weightsFolder,
    );
    const layer_buffers = await this.loadLayers(params, weightsFolder);

    console.log("Loading final layer norm...");
    const { normGammaBuffer, normBetaBuffer } = await this.loadFinalLayerNorm(
      params,
      weightsFolder,
    );

    const output = {
      layer_buffers,
      embeddingsBuffers,
      deEmbeddingsBuffers,
      posEmbdBuffer,
      normGammaBuffer,
      normBetaBuffer,
    };
    console.log("Finished loading model.", output, params);
    return [output, params];
  }

  async loadParameters(weightsFolder) {
    console.log("Loading params...");
    const params = await (
      await fetch(`${weightsFolder}/params_gpt.json`)
    ).json();

    // Did you enable GitHub LFS? Won't work without it.
    if (params.n_embd % 4 !== 0)
      throw new Error("Model load failed: n_embd must be divisible by 4.");
    if (params.n_embd % params.n_head !== 0)
      throw new Error("Model load failed: n_embd must be divisible by n_head.");
    // I'm unsure if this is a reasonable requirement here. At worst, I can figure out some padding method.
    if ((params.n_embd / params.n_head) % 4 !== 0)
      throw new Error(
        "Model load failed: n_embd / n_head must be divisible by 4.",
      );
    const tokenParam = this.bufferSize(params.vocab_size, params.n_embd);
    let minSplits = Math.ceil(
      tokenParam / this.device.limits.maxStorageBufferBindingSize,
    );
    function vocabChunkSizeCalc(
      vocab_size,
      n_embd,
      splits,
      maxStorageBufferBindingSize,
    ) {
      // Possibly could be better? Needs actual benchmarking to know what approach is best.
      const optimisticSize = Math.ceil(vocab_size / splits / 4) * 4 * n_embd;
      const pessimiticSize = Math.floor(vocab_size / splits / 4) * 4 * n_embd;
      let vocab_chunk_size = optimisticSize;
      if (optimisticSize > maxStorageBufferBindingSize) {
        vocab_chunk_size = pessimiticSize;
        if (pessimiticSize * splits < tokenParam) {
          return vocabChunkSizeCalc(
            vocab_size,
            n_embd,
            splits + 1,
            maxStorageBufferBindingSize,
          );
        }
      }
      return { vocab_chunk_size: vocab_chunk_size / n_embd, splits };
    }
    const { vocab_chunk_size, splits } = vocabChunkSizeCalc(
      params.vocab_size,
      params.n_embd,
      minSplits,
      this.device.limits.maxStorageBufferBindingSize,
    );
    if (splits > minSplits)
      console.warn(
        `Non-optimal number of vocab splits. Optimal: ${minSplits}, Selected: ${splits}`,
      );

    // Set derived parameters
    params.vocab_chunk_size = vocab_chunk_size;
    params.vocab_chunk_instances = splits;
    params.head_size = params.n_embd / params.n_head;
    params.hidden_size = params.n_embd * 4;
    params.attention_scale = 1 / Math.sqrt(params.n_embd / params.n_head);
    params.bias = params.bias == undefined ? true : params.bias;

    // Check for overflow in buffers larger than maxStorageBufferBindingSize
    const maxBufferSize = this.device.limits.maxStorageBufferBindingSize / 4;
    if (params.n_embd * params.n_ctx > maxBufferSize)
      console.warn(
        "Model load failed: n_embd * n_ctx must be less than maxStorageBufferBindingSize.",
      );
    if (params.n_embd * params.hidden_size > maxBufferSize)
      console.warn(
        "Model load failed: n_embd * hidden_size must be less than maxStorageBufferBindingSize.",
      );
    if (params.n_ctx * params.n_ctx * params.n_head > maxBufferSize)
      console.warn(
        "Model load failed: n_ctx * n_ctx must be less than maxStorageBufferBindingSize.",
      );
    if (params.n_embd * params.n_embd * 3 > maxBufferSize)
      console.warn(
        "Model load failed: n_embd * n_embd * 3 must be less than maxStorageBufferBindingSize.",
      );

    console.log("Params:", params);

    return params;
  }

  async loadEmbeddings(params, weightsFolder) {
    console.log("Loading token embeddings...");
    const embeddingWeights = await fetchBin(
      `${weightsFolder}/transformer.wte.weight_gpt.bin`,
    );

    // Chunks are stored in row-major order and are of dimensions n_embd x vocab_chunk_size.
    // Embedding weights are imported in column-major order and are of dimensions vocab_size x n_embd.
    // We pre-transpose the chunk for the deEmbedding process for the matmul. Could do this on GPU later.
    const embeddingsBuffers = [];
    const deEmbeddingsBuffers = [];
    for (let i = 0; i < params.vocab_chunk_instances; i++) {
      console.log(
        `Loading deEmbedding chunk ${i + 1}/${params.vocab_chunk_instances}...`,
      );
      const offset = i * params.vocab_chunk_size;
      let size = params.vocab_chunk_size;

      const paddedArray = new Float32Array(
        params.vocab_chunk_size * params.n_embd,
      );
      if (i === params.vocab_chunk_instances - 1) {
        size = params.vocab_size - offset;
        paddedArray.set(
          size * params.n_embd,
          zeros(
            (params.vocab_chunk_size * params.vocab_chunk_instances -
              params.vocab_size) *
              params.n_embd,
          ),
        );
      }
      paddedArray.set(
        embeddingWeights.subarray(
          offset * params.n_embd,
          offset * params.n_embd + size * params.n_embd,
        ),
      );

      embeddingsBuffers.push(
        this.initTensor(
          paddedArray,
          [params.vocab_chunk_size, params.n_embd],
          ["copy_from"],
        ),
      );

      const chunk = transpose(
        paddedArray,
        params.vocab_chunk_size,
        params.n_embd,
      ); // Use GPU perhaps?
      deEmbeddingsBuffers.push(
        this.initTensor(
          chunk,
          [params.n_embd, params.vocab_chunk_size],
          ["storage"],
        ),
      );
    }

    return { embeddingsBuffers, deEmbeddingsBuffers };
  }

  async loadPositionalEmbeddings(params, weightsFolder) {
    console.log("Loading positional embeddings...");
    const posEmbeddings = await fetchBin(
      `${weightsFolder}/transformer.wpe.weight_gpt.bin`,
    );
    const posEmbdBuffer = this.initTensor(
      posEmbeddings,
      [params.n_ctx, params.n_embd],
      ["copy_from"],
    );

    return { posEmbdBuffer };
  }

  async loadFinalLayerNorm(params, weightsFolder) {
    console.log("Loading final norm...");
    const prefix = `${weightsFolder}/transformer.ln_f.`;

    const tensorPromises = [
      this.fetchAndInitTensor(
        `${prefix}weight_gpt.bin`,
        [params.n_embd],
        ["storage"],
      ),
      this.fetchAndInitTensor(
        `${prefix}bias_gpt.bin`,
        [params.n_embd],
        ["storage"],
      ),
    ];

    const [normGammaBuffer, normBetaBuffer] = await Promise.all(tensorPromises);

    return { normGammaBuffer, normBetaBuffer };
  }

  async loadLayers(params, weightsFolder) {
    console.log("Loading layers...");
    const layerPromises = [];

    for (let i = 0; i < params.n_layer; i++) {
      layerPromises.push(this.loadLayer(params, weightsFolder, i));
    }

    const layer_buffers = await Promise.all(layerPromises);
    return layer_buffers;
  }

  async loadLayer(params, weightsFolder, layerIndex) {
    console.log("Starting to load layer...", layerIndex);
    const prefix = `${weightsFolder}transformer.h.${layerIndex}.`;

    // Create an array of promises for fetching and initializing the tensors
    const tensorPromises = [
      this.fetchAndInitTensor(
        `${prefix}ln_1.weight_gpt.bin`,
        [params.n_embd],
        ["storage"],
      ),
      this.fetchAndInitTensor(
        `${prefix}ln_1.bias_gpt.bin`,
        [params.n_embd],
        ["storage"],
      ),
      this.fetchAndSplitQKVWeightTensors(
        `${prefix}attn.c_attn.weight_gpt.bin`,
        [params.n_embd, 3 * params.n_embd],
        ["storage"],
      ),
      this.fetchAndSplitQKVBiasTensors(
        `${prefix}attn.c_attn.bias_gpt.bin`,
        [params.n_embd],
        ["storage"],
      ),
      this.fetchAndInitTensor(
        `${prefix}attn.c_proj.weight_gpt.bin`,
        [params.n_embd, params.n_embd],
        ["storage"],
      ),
      this.fetchAndInitTensor(
        `${prefix}attn.c_proj.bias_gpt.bin`,
        [params.n_embd],
        ["storage"],
      ),
      this.fetchAndInitTensor(
        `${prefix}ln_2.weight_gpt.bin`,
        [params.n_embd],
        ["storage"],
      ),
      this.fetchAndInitTensor(
        `${prefix}ln_2.bias_gpt.bin`,
        [params.n_embd],
        ["storage"],
      ),
      this.fetchAndInitTensor(
        `${prefix}mlp.c_fc.weight_gpt.bin`,
        [params.n_embd, params.hidden_size],
        ["storage"],
      ),
      this.fetchAndInitTensor(
        `${prefix}mlp.c_fc.bias_gpt.bin`,
        [params.hidden_size],
        ["storage"],
      ),
      this.fetchAndInitTensor(
        `${prefix}mlp.c_proj.weight_gpt.bin`,
        [params.hidden_size, params.n_embd],
        ["storage"],
      ),
      this.fetchAndInitTensor(
        `${prefix}mlp.c_proj.bias_gpt.bin`,
        [params.n_embd],
        ["storage"],
      ),
    ];

    // Wait for all tensors to be fetched and initialized
    const [
      normAttentionGammaBuffer,
      normAttentionBetaBuffer,
      qkvWeightArray,
      qkvBiasArray,
      linearWeightsBuffer,
      linearBiasBuffer,
      normLinearGammaBuffer,
      normLinearBetaBuffer,
      firstLayerWeightsBuffer,
      firstLayerBiasBuffer,
      secondLayerWeightsBuffer,
      secondLayerBiasBuffer,
    ] = await Promise.all(tensorPromises);

    // Process the fetched data and return the layer buffers
    return {
      normAttentionGammaBuffer,
      normAttentionBetaBuffer,
      qkvWeightArray,
      qkvBiasArray,
      linearWeightsBuffer,
      linearBiasBuffer,
      normLinearGammaBuffer,
      normLinearBetaBuffer,
      firstLayerWeightsBuffer,
      firstLayerBiasBuffer,
      secondLayerWeightsBuffer,
      secondLayerBiasBuffer,
    };
  }

  async fetchAndSplitQKVWeightTensors(url, dims, ops) {
    const data = transpose(await fetchBin(url), dims[0], dims[1]);

    const qWeights = transpose(
      data.subarray(0, dims[0] * dims[0]),
      dims[0],
      dims[0],
    );
    const kWeights = transpose(
      data.subarray(dims[0] * dims[0], dims[0] * dims[0] * 2),
      dims[0],
      dims[0],
    );
    const vWeights = transpose(
      data.subarray(dims[0] * dims[0] * 2, dims[0] * dims[0] * 3),
      dims[0],
      dims[0],
    );

    const qWeightsBuffer = this.initTensor(qWeights, [dims[0], dims[0]], ops);
    const kWeightsBuffer = this.initTensor(kWeights, [dims[0], dims[0]], ops);
    const vWeightsBuffer = this.initTensor(vWeights, [dims[0], dims[0]], ops);

    return [qWeightsBuffer, kWeightsBuffer, vWeightsBuffer];
  }

  async fetchAndSplitQKVBiasTensors(url, dims, ops) {
    const data = await fetchBin(url);

    const qBias = data.subarray(0, dims[0]);
    const kBias = data.subarray(dims[0], dims[0] * 2);
    const vBias = data.subarray(dims[0] * 2, dims[0] * 3);

    const qBiasBuffer = this.initTensor(qBias, [dims[0]], ops);
    const kBiasBuffer = this.initTensor(kBias, [dims[0]], ops);
    const vBiasBuffer = this.initTensor(vBias, [dims[0]], ops);

    return [qBiasBuffer, kBiasBuffer, vBiasBuffer];
  }

  async fetchAndInitTensor(url, dims, ops) {
    console.log("Fetching and initializing tensor...", url);
    const data = await fetchBin(url);
    return this.initTensor(data, dims, ops);
  }

  initTensor(data, dims, ops) {
    const buffer = this.device.createBuffer({
      size: this.bufferSize(dims[0], dims[1] || 1, dims[2] || 1),
      usage: ops.map((u) => bufferUsageDict[u]).reduce((a, b) => a | b),
      mappedAtCreation: true,
    });
    new Float32Array(buffer.getMappedRange()).set(data);
    buffer.unmap();
    this.unloadDeletionStack.push(buffer);
    return buffer;
  }

  unloadBuffers() {
    this.unloadDeletionStack.map((buffer) => buffer.destroy());
    this.unloadDeletionStack = [];
  }

  bufferSize(dimX, dimY = 1, dimZ = 1) {
    const size =
      Math.ceil(
        (dimX * dimY * dimZ * Float32Array.BYTES_PER_ELEMENT) /
          this.minBufferOffset,
      ) * this.minBufferOffset;
    if (size > this.device.limits.maxStorageBufferBindingSize)
      console.warn(
        "Warning: Buffer size calc result exceeds GPU limit, are you using this value for a tensor size?",
        dimX,
        dimY,
        dimZ,
        size,
      );
    return size;
  }
}

// ---- globals.js ----
const FastMatMulBlock = new FastMatMulBlockClass();
const AttentionBlock = new AttentionBlockClass();
const ResidualBlock = new ResidualBlockClass();
const EmbedBlock = new EmbedBlockClass();
const DeEmbedBlock = new DeEmbedBlockClass();
const GeluBlock = new GeluBlockClass();
const LayerNormBlock = new LayerNormBlockClass();
const SoftmaxBlock = new SoftmaxBlockClass();

// Needed for deletion.
let operations = [
  FastMatMulBlock,
  AttentionBlock,
  ResidualBlock,
  EmbedBlock,
  DeEmbedBlock,
  GeluBlock,
  LayerNormBlock,
  SoftmaxBlock,
];

function initializeOperations(device) {
  for (const operation of operations) operation.initialize(device);
}

function destroyOperationBuffers() {
  for (const operation of operations) operation.destroyBuffers();
}

function clearOperationCache() {
  for (const operation of operations) operation.clearBufferCache();
}

function destroyOperations() {
  for (const operation of operations) operation.destroy();
}

const bufferUsageDict = {
  copy_from: GPUBufferUsage.COPY_SRC,
  copy_to: GPUBufferUsage.COPY_DST,
  storage: GPUBufferUsage.STORAGE,
  uniform: GPUBufferUsage.UNIFORM,
  map_read: GPUBufferUsage.MAP_READ,
};

// ---------------- Helper Functions ----------------

async function fetchBin(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return new Float32Array(buffer);
}

const wgSize = (dim, size) => Math.min(Math.ceil(dim / size), Infinity);

function sampleFromDistribution(probs) {
  const rand = Math.random();
  let cumulativeProb = 0;
  for (let i = 0; i < probs.length; i++) {
    cumulativeProb += probs[i];
    if (rand < cumulativeProb) {
      return i;
    }
  }
  return probs.length - 1;
}

function cpuSoftmax(logits, temperature = 1.0) {
  const maxLogit = Math.max(...logits);
  const expLogits = logits.map((logit) =>
    Math.exp((logit - maxLogit) / temperature),
  );
  const sumExpLogits = expLogits.reduce((a, b) => a + b, 0);
  return expLogits.map((expLogit) => expLogit / sumExpLogits);
}

function selectTopK(probs, top_k) {
  const sortedIndices = Array.from(probs)
    .map((value, index) => ({ value, index }))
    .sort((a, b) => b.value - a.value)
    .map(({ index }) => index);
  const topKIndices = sortedIndices.slice(0, top_k);
  const topKProbs = topKIndices.map((index) => probs[index]);
  return { topKIndices, topKProbs };
}

// ----------------------- Matrix Operations -----------------------

const zeros = (dim) => new Float32Array(dim).fill(0);

function transpose(array, input_rows, input_cols) {
  if (array.length !== input_rows * input_cols) {
    console.log(array.length, input_rows, input_cols);
    throw new Error("Transpose dims failed");
  }

  const transpose = [];
  for (let col = 0; col < input_cols; col++) {
    for (let row = 0; row < input_rows; row++) {
      transpose.push(array[row * input_cols + col]);
    }
  }

  return new Float32Array(transpose);
}

function leastPrimeFactor(n, start = 2) {
  for (let i = start; i <= Math.sqrt(n); i++) {
    if (n % i === 0) return i;
  }
  return n;
}

function formatAsMatrix(floatArray, dimA, dimB) {
  const resultMatrix = [];
  for (let i = 0; i < dimA; i++) {
    resultMatrix.push(floatArray.slice(i * dimB, (i + 1) * dimB));
  }
  return resultMatrix;
}

export {
  GPT,
  GPT2Tokenizer,
  destroyOperations,
  selectTopK,
  cpuSoftmax,
  sampleFromDistribution,
};
