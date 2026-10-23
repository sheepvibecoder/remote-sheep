#!/usr/bin/env node
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod2) => function __require2() {
  try {
    return mod2 || (0, cb[__getOwnPropNames(cb)[0]])((mod2 = { exports: {} }).exports, mod2), mod2.exports;
  } catch (e) {
    throw mod2 = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key2 of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key2) && key2 !== except)
        __defProp(to, key2, { get: () => from[key2], enumerable: !(desc = __getOwnPropDesc(from, key2)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod2, isNodeMode, target) => (target = mod2 != null ? __create(__getProtoOf(mod2)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod2 || !mod2.__esModule ? __defProp(target, "default", { value: mod2, enumerable: true }) : target,
  mod2
));

// ../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/can-promise.js
var require_can_promise = __commonJS({
  "../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/can-promise.js"(exports, module) {
    module.exports = function() {
      return typeof Promise === "function" && Promise.prototype && Promise.prototype.then;
    };
  }
});

// ../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/utils.js
var require_utils = __commonJS({
  "../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/utils.js"(exports) {
    var toSJISFunction;
    var CODEWORDS_COUNT = [
      0,
      // Not used
      26,
      44,
      70,
      100,
      134,
      172,
      196,
      242,
      292,
      346,
      404,
      466,
      532,
      581,
      655,
      733,
      815,
      901,
      991,
      1085,
      1156,
      1258,
      1364,
      1474,
      1588,
      1706,
      1828,
      1921,
      2051,
      2185,
      2323,
      2465,
      2611,
      2761,
      2876,
      3034,
      3196,
      3362,
      3532,
      3706
    ];
    exports.getSymbolSize = function getSymbolSize(version) {
      if (!version) throw new Error('"version" cannot be null or undefined');
      if (version < 1 || version > 40) throw new Error('"version" should be in range from 1 to 40');
      return version * 4 + 17;
    };
    exports.getSymbolTotalCodewords = function getSymbolTotalCodewords(version) {
      return CODEWORDS_COUNT[version];
    };
    exports.getBCHDigit = function(data) {
      let digit = 0;
      while (data !== 0) {
        digit++;
        data >>>= 1;
      }
      return digit;
    };
    exports.setToSJISFunction = function setToSJISFunction(f) {
      if (typeof f !== "function") {
        throw new Error('"toSJISFunc" is not a valid function.');
      }
      toSJISFunction = f;
    };
    exports.isKanjiModeEnabled = function() {
      return typeof toSJISFunction !== "undefined";
    };
    exports.toSJIS = function toSJIS(kanji) {
      return toSJISFunction(kanji);
    };
  }
});

// ../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/error-correction-level.js
var require_error_correction_level = __commonJS({
  "../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/error-correction-level.js"(exports) {
    exports.L = { bit: 1 };
    exports.M = { bit: 0 };
    exports.Q = { bit: 3 };
    exports.H = { bit: 2 };
    function fromString(string) {
      if (typeof string !== "string") {
        throw new Error("Param is not a string");
      }
      const lcStr = string.toLowerCase();
      switch (lcStr) {
        case "l":
        case "low":
          return exports.L;
        case "m":
        case "medium":
          return exports.M;
        case "q":
        case "quartile":
          return exports.Q;
        case "h":
        case "high":
          return exports.H;
        default:
          throw new Error("Unknown EC Level: " + string);
      }
    }
    exports.isValid = function isValid(level) {
      return level && typeof level.bit !== "undefined" && level.bit >= 0 && level.bit < 4;
    };
    exports.from = function from(value, defaultValue) {
      if (exports.isValid(value)) {
        return value;
      }
      try {
        return fromString(value);
      } catch (e) {
        return defaultValue;
      }
    };
  }
});

// ../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/bit-buffer.js
var require_bit_buffer = __commonJS({
  "../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/bit-buffer.js"(exports, module) {
    function BitBuffer() {
      this.buffer = [];
      this.length = 0;
    }
    BitBuffer.prototype = {
      get: function(index) {
        const bufIndex = Math.floor(index / 8);
        return (this.buffer[bufIndex] >>> 7 - index % 8 & 1) === 1;
      },
      put: function(num, length) {
        for (let i = 0; i < length; i++) {
          this.putBit((num >>> length - i - 1 & 1) === 1);
        }
      },
      getLengthInBits: function() {
        return this.length;
      },
      putBit: function(bit) {
        const bufIndex = Math.floor(this.length / 8);
        if (this.buffer.length <= bufIndex) {
          this.buffer.push(0);
        }
        if (bit) {
          this.buffer[bufIndex] |= 128 >>> this.length % 8;
        }
        this.length++;
      }
    };
    module.exports = BitBuffer;
  }
});

// ../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/bit-matrix.js
var require_bit_matrix = __commonJS({
  "../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/bit-matrix.js"(exports, module) {
    function BitMatrix(size) {
      if (!size || size < 1) {
        throw new Error("BitMatrix size must be defined and greater than 0");
      }
      this.size = size;
      this.data = new Uint8Array(size * size);
      this.reservedBit = new Uint8Array(size * size);
    }
    BitMatrix.prototype.set = function(row, col, value, reserved) {
      const index = row * this.size + col;
      this.data[index] = value;
      if (reserved) this.reservedBit[index] = true;
    };
    BitMatrix.prototype.get = function(row, col) {
      return this.data[row * this.size + col];
    };
    BitMatrix.prototype.xor = function(row, col, value) {
      this.data[row * this.size + col] ^= value;
    };
    BitMatrix.prototype.isReserved = function(row, col) {
      return this.reservedBit[row * this.size + col];
    };
    module.exports = BitMatrix;
  }
});

// ../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/alignment-pattern.js
var require_alignment_pattern = __commonJS({
  "../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/alignment-pattern.js"(exports) {
    var getSymbolSize = require_utils().getSymbolSize;
    exports.getRowColCoords = function getRowColCoords(version) {
      if (version === 1) return [];
      const posCount = Math.floor(version / 7) + 2;
      const size = getSymbolSize(version);
      const intervals = size === 145 ? 26 : Math.ceil((size - 13) / (2 * posCount - 2)) * 2;
      const positions = [size - 7];
      for (let i = 1; i < posCount - 1; i++) {
        positions[i] = positions[i - 1] - intervals;
      }
      positions.push(6);
      return positions.reverse();
    };
    exports.getPositions = function getPositions(version) {
      const coords = [];
      const pos = exports.getRowColCoords(version);
      const posLength = pos.length;
      for (let i = 0; i < posLength; i++) {
        for (let j = 0; j < posLength; j++) {
          if (i === 0 && j === 0 || // top-left
          i === 0 && j === posLength - 1 || // bottom-left
          i === posLength - 1 && j === 0) {
            continue;
          }
          coords.push([pos[i], pos[j]]);
        }
      }
      return coords;
    };
  }
});

// ../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/finder-pattern.js
var require_finder_pattern = __commonJS({
  "../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/finder-pattern.js"(exports) {
    var getSymbolSize = require_utils().getSymbolSize;
    var FINDER_PATTERN_SIZE = 7;
    exports.getPositions = function getPositions(version) {
      const size = getSymbolSize(version);
      return [
        // top-left
        [0, 0],
        // top-right
        [size - FINDER_PATTERN_SIZE, 0],
        // bottom-left
        [0, size - FINDER_PATTERN_SIZE]
      ];
    };
  }
});

// ../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/mask-pattern.js
var require_mask_pattern = __commonJS({
  "../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/mask-pattern.js"(exports) {
    exports.Patterns = {
      PATTERN000: 0,
      PATTERN001: 1,
      PATTERN010: 2,
      PATTERN011: 3,
      PATTERN100: 4,
      PATTERN101: 5,
      PATTERN110: 6,
      PATTERN111: 7
    };
    var PenaltyScores = {
      N1: 3,
      N2: 3,
      N3: 40,
      N4: 10
    };
    exports.isValid = function isValid(mask) {
      return mask != null && mask !== "" && !isNaN(mask) && mask >= 0 && mask <= 7;
    };
    exports.from = function from(value) {
      return exports.isValid(value) ? parseInt(value, 10) : void 0;
    };
    exports.getPenaltyN1 = function getPenaltyN1(data) {
      const size = data.size;
      let points = 0;
      let sameCountCol = 0;
      let sameCountRow = 0;
      let lastCol = null;
      let lastRow = null;
      for (let row = 0; row < size; row++) {
        sameCountCol = sameCountRow = 0;
        lastCol = lastRow = null;
        for (let col = 0; col < size; col++) {
          let module2 = data.get(row, col);
          if (module2 === lastCol) {
            sameCountCol++;
          } else {
            if (sameCountCol >= 5) points += PenaltyScores.N1 + (sameCountCol - 5);
            lastCol = module2;
            sameCountCol = 1;
          }
          module2 = data.get(col, row);
          if (module2 === lastRow) {
            sameCountRow++;
          } else {
            if (sameCountRow >= 5) points += PenaltyScores.N1 + (sameCountRow - 5);
            lastRow = module2;
            sameCountRow = 1;
          }
        }
        if (sameCountCol >= 5) points += PenaltyScores.N1 + (sameCountCol - 5);
        if (sameCountRow >= 5) points += PenaltyScores.N1 + (sameCountRow - 5);
      }
      return points;
    };
    exports.getPenaltyN2 = function getPenaltyN2(data) {
      const size = data.size;
      let points = 0;
      for (let row = 0; row < size - 1; row++) {
        for (let col = 0; col < size - 1; col++) {
          const last = data.get(row, col) + data.get(row, col + 1) + data.get(row + 1, col) + data.get(row + 1, col + 1);
          if (last === 4 || last === 0) points++;
        }
      }
      return points * PenaltyScores.N2;
    };
    exports.getPenaltyN3 = function getPenaltyN3(data) {
      const size = data.size;
      let points = 0;
      let bitsCol = 0;
      let bitsRow = 0;
      for (let row = 0; row < size; row++) {
        bitsCol = bitsRow = 0;
        for (let col = 0; col < size; col++) {
          bitsCol = bitsCol << 1 & 2047 | data.get(row, col);
          if (col >= 10 && (bitsCol === 1488 || bitsCol === 93)) points++;
          bitsRow = bitsRow << 1 & 2047 | data.get(col, row);
          if (col >= 10 && (bitsRow === 1488 || bitsRow === 93)) points++;
        }
      }
      return points * PenaltyScores.N3;
    };
    exports.getPenaltyN4 = function getPenaltyN4(data) {
      let darkCount = 0;
      const modulesCount = data.data.length;
      for (let i = 0; i < modulesCount; i++) darkCount += data.data[i];
      const k = Math.abs(Math.ceil(darkCount * 100 / modulesCount / 5) - 10);
      return k * PenaltyScores.N4;
    };
    function getMaskAt(maskPattern, i, j) {
      switch (maskPattern) {
        case exports.Patterns.PATTERN000:
          return (i + j) % 2 === 0;
        case exports.Patterns.PATTERN001:
          return i % 2 === 0;
        case exports.Patterns.PATTERN010:
          return j % 3 === 0;
        case exports.Patterns.PATTERN011:
          return (i + j) % 3 === 0;
        case exports.Patterns.PATTERN100:
          return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
        case exports.Patterns.PATTERN101:
          return i * j % 2 + i * j % 3 === 0;
        case exports.Patterns.PATTERN110:
          return (i * j % 2 + i * j % 3) % 2 === 0;
        case exports.Patterns.PATTERN111:
          return (i * j % 3 + (i + j) % 2) % 2 === 0;
        default:
          throw new Error("bad maskPattern:" + maskPattern);
      }
    }
    exports.applyMask = function applyMask(pattern, data) {
      const size = data.size;
      for (let col = 0; col < size; col++) {
        for (let row = 0; row < size; row++) {
          if (data.isReserved(row, col)) continue;
          data.xor(row, col, getMaskAt(pattern, row, col));
        }
      }
    };
    exports.getBestMask = function getBestMask(data, setupFormatFunc) {
      const numPatterns = Object.keys(exports.Patterns).length;
      let bestPattern = 0;
      let lowerPenalty = Infinity;
      for (let p = 0; p < numPatterns; p++) {
        setupFormatFunc(p);
        exports.applyMask(p, data);
        const penalty = exports.getPenaltyN1(data) + exports.getPenaltyN2(data) + exports.getPenaltyN3(data) + exports.getPenaltyN4(data);
        exports.applyMask(p, data);
        if (penalty < lowerPenalty) {
          lowerPenalty = penalty;
          bestPattern = p;
        }
      }
      return bestPattern;
    };
  }
});

// ../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/error-correction-code.js
var require_error_correction_code = __commonJS({
  "../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/error-correction-code.js"(exports) {
    var ECLevel = require_error_correction_level();
    var EC_BLOCKS_TABLE = [
      // L  M  Q  H
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      2,
      2,
      1,
      2,
      2,
      4,
      1,
      2,
      4,
      4,
      2,
      4,
      4,
      4,
      2,
      4,
      6,
      5,
      2,
      4,
      6,
      6,
      2,
      5,
      8,
      8,
      4,
      5,
      8,
      8,
      4,
      5,
      8,
      11,
      4,
      8,
      10,
      11,
      4,
      9,
      12,
      16,
      4,
      9,
      16,
      16,
      6,
      10,
      12,
      18,
      6,
      10,
      17,
      16,
      6,
      11,
      16,
      19,
      6,
      13,
      18,
      21,
      7,
      14,
      21,
      25,
      8,
      16,
      20,
      25,
      8,
      17,
      23,
      25,
      9,
      17,
      23,
      34,
      9,
      18,
      25,
      30,
      10,
      20,
      27,
      32,
      12,
      21,
      29,
      35,
      12,
      23,
      34,
      37,
      12,
      25,
      34,
      40,
      13,
      26,
      35,
      42,
      14,
      28,
      38,
      45,
      15,
      29,
      40,
      48,
      16,
      31,
      43,
      51,
      17,
      33,
      45,
      54,
      18,
      35,
      48,
      57,
      19,
      37,
      51,
      60,
      19,
      38,
      53,
      63,
      20,
      40,
      56,
      66,
      21,
      43,
      59,
      70,
      22,
      45,
      62,
      74,
      24,
      47,
      65,
      77,
      25,
      49,
      68,
      81
    ];
    var EC_CODEWORDS_TABLE = [
      // L  M  Q  H
      7,
      10,
      13,
      17,
      10,
      16,
      22,
      28,
      15,
      26,
      36,
      44,
      20,
      36,
      52,
      64,
      26,
      48,
      72,
      88,
      36,
      64,
      96,
      112,
      40,
      72,
      108,
      130,
      48,
      88,
      132,
      156,
      60,
      110,
      160,
      192,
      72,
      130,
      192,
      224,
      80,
      150,
      224,
      264,
      96,
      176,
      260,
      308,
      104,
      198,
      288,
      352,
      120,
      216,
      320,
      384,
      132,
      240,
      360,
      432,
      144,
      280,
      408,
      480,
      168,
      308,
      448,
      532,
      180,
      338,
      504,
      588,
      196,
      364,
      546,
      650,
      224,
      416,
      600,
      700,
      224,
      442,
      644,
      750,
      252,
      476,
      690,
      816,
      270,
      504,
      750,
      900,
      300,
      560,
      810,
      960,
      312,
      588,
      870,
      1050,
      336,
      644,
      952,
      1110,
      360,
      700,
      1020,
      1200,
      390,
      728,
      1050,
      1260,
      420,
      784,
      1140,
      1350,
      450,
      812,
      1200,
      1440,
      480,
      868,
      1290,
      1530,
      510,
      924,
      1350,
      1620,
      540,
      980,
      1440,
      1710,
      570,
      1036,
      1530,
      1800,
      570,
      1064,
      1590,
      1890,
      600,
      1120,
      1680,
      1980,
      630,
      1204,
      1770,
      2100,
      660,
      1260,
      1860,
      2220,
      720,
      1316,
      1950,
      2310,
      750,
      1372,
      2040,
      2430
    ];
    exports.getBlocksCount = function getBlocksCount(version, errorCorrectionLevel) {
      switch (errorCorrectionLevel) {
        case ECLevel.L:
          return EC_BLOCKS_TABLE[(version - 1) * 4 + 0];
        case ECLevel.M:
          return EC_BLOCKS_TABLE[(version - 1) * 4 + 1];
        case ECLevel.Q:
          return EC_BLOCKS_TABLE[(version - 1) * 4 + 2];
        case ECLevel.H:
          return EC_BLOCKS_TABLE[(version - 1) * 4 + 3];
        default:
          return void 0;
      }
    };
    exports.getTotalCodewordsCount = function getTotalCodewordsCount(version, errorCorrectionLevel) {
      switch (errorCorrectionLevel) {
        case ECLevel.L:
          return EC_CODEWORDS_TABLE[(version - 1) * 4 + 0];
        case ECLevel.M:
          return EC_CODEWORDS_TABLE[(version - 1) * 4 + 1];
        case ECLevel.Q:
          return EC_CODEWORDS_TABLE[(version - 1) * 4 + 2];
        case ECLevel.H:
          return EC_CODEWORDS_TABLE[(version - 1) * 4 + 3];
        default:
          return void 0;
      }
    };
  }
});

// ../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/galois-field.js
var require_galois_field = __commonJS({
  "../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/galois-field.js"(exports) {
    var EXP_TABLE = new Uint8Array(512);
    var LOG_TABLE = new Uint8Array(256);
    (function initTables() {
      let x = 1;
      for (let i = 0; i < 255; i++) {
        EXP_TABLE[i] = x;
        LOG_TABLE[x] = i;
        x <<= 1;
        if (x & 256) {
          x ^= 285;
        }
      }
      for (let i = 255; i < 512; i++) {
        EXP_TABLE[i] = EXP_TABLE[i - 255];
      }
    })();
    exports.log = function log(n) {
      if (n < 1) throw new Error("log(" + n + ")");
      return LOG_TABLE[n];
    };
    exports.exp = function exp(n) {
      return EXP_TABLE[n];
    };
    exports.mul = function mul(x, y) {
      if (x === 0 || y === 0) return 0;
      return EXP_TABLE[LOG_TABLE[x] + LOG_TABLE[y]];
    };
  }
});

// ../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/polynomial.js
var require_polynomial = __commonJS({
  "../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/polynomial.js"(exports) {
    var GF = require_galois_field();
    exports.mul = function mul(p1, p2) {
      const coeff = new Uint8Array(p1.length + p2.length - 1);
      for (let i = 0; i < p1.length; i++) {
        for (let j = 0; j < p2.length; j++) {
          coeff[i + j] ^= GF.mul(p1[i], p2[j]);
        }
      }
      return coeff;
    };
    exports.mod = function mod2(divident, divisor) {
      let result = new Uint8Array(divident);
      while (result.length - divisor.length >= 0) {
        const coeff = result[0];
        for (let i = 0; i < divisor.length; i++) {
          result[i] ^= GF.mul(divisor[i], coeff);
        }
        let offset = 0;
        while (offset < result.length && result[offset] === 0) offset++;
        result = result.slice(offset);
      }
      return result;
    };
    exports.generateECPolynomial = function generateECPolynomial(degree) {
      let poly = new Uint8Array([1]);
      for (let i = 0; i < degree; i++) {
        poly = exports.mul(poly, new Uint8Array([1, GF.exp(i)]));
      }
      return poly;
    };
  }
});

// ../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/reed-solomon-encoder.js
var require_reed_solomon_encoder = __commonJS({
  "../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/reed-solomon-encoder.js"(exports, module) {
    var Polynomial = require_polynomial();
    function ReedSolomonEncoder(degree) {
      this.genPoly = void 0;
      this.degree = degree;
      if (this.degree) this.initialize(this.degree);
    }
    ReedSolomonEncoder.prototype.initialize = function initialize(degree) {
      this.degree = degree;
      this.genPoly = Polynomial.generateECPolynomial(this.degree);
    };
    ReedSolomonEncoder.prototype.encode = function encode(data) {
      if (!this.genPoly) {
        throw new Error("Encoder not initialized");
      }
      const paddedData = new Uint8Array(data.length + this.degree);
      paddedData.set(data);
      const remainder = Polynomial.mod(paddedData, this.genPoly);
      const start = this.degree - remainder.length;
      if (start > 0) {
        const buff = new Uint8Array(this.degree);
        buff.set(remainder, start);
        return buff;
      }
      return remainder;
    };
    module.exports = ReedSolomonEncoder;
  }
});

// ../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/version-check.js
var require_version_check = __commonJS({
  "../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/version-check.js"(exports) {
    exports.isValid = function isValid(version) {
      return !isNaN(version) && version >= 1 && version <= 40;
    };
  }
});

// ../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/regex.js
var require_regex = __commonJS({
  "../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/regex.js"(exports) {
    var numeric = "[0-9]+";
    var alphanumeric = "[A-Z $%*+\\-./:]+";
    var kanji = "(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+";
    kanji = kanji.replace(/u/g, "\\u");
    var byte = "(?:(?![A-Z0-9 $%*+\\-./:]|" + kanji + ")(?:.|[\r\n]))+";
    exports.KANJI = new RegExp(kanji, "g");
    exports.BYTE_KANJI = new RegExp("[^A-Z0-9 $%*+\\-./:]+", "g");
    exports.BYTE = new RegExp(byte, "g");
    exports.NUMERIC = new RegExp(numeric, "g");
    exports.ALPHANUMERIC = new RegExp(alphanumeric, "g");
    var TEST_KANJI = new RegExp("^" + kanji + "$");
    var TEST_NUMERIC = new RegExp("^" + numeric + "$");
    var TEST_ALPHANUMERIC = new RegExp("^[A-Z0-9 $%*+\\-./:]+$");
    exports.testKanji = function testKanji(str) {
      return TEST_KANJI.test(str);
    };
    exports.testNumeric = function testNumeric(str) {
      return TEST_NUMERIC.test(str);
    };
    exports.testAlphanumeric = function testAlphanumeric(str) {
      return TEST_ALPHANUMERIC.test(str);
    };
  }
});

// ../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/mode.js
var require_mode = __commonJS({
  "../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/mode.js"(exports) {
    var VersionCheck = require_version_check();
    var Regex = require_regex();
    exports.NUMERIC = {
      id: "Numeric",
      bit: 1 << 0,
      ccBits: [10, 12, 14]
    };
    exports.ALPHANUMERIC = {
      id: "Alphanumeric",
      bit: 1 << 1,
      ccBits: [9, 11, 13]
    };
    exports.BYTE = {
      id: "Byte",
      bit: 1 << 2,
      ccBits: [8, 16, 16]
    };
    exports.KANJI = {
      id: "Kanji",
      bit: 1 << 3,
      ccBits: [8, 10, 12]
    };
    exports.MIXED = {
      bit: -1
    };
    exports.getCharCountIndicator = function getCharCountIndicator(mode, version) {
      if (!mode.ccBits) throw new Error("Invalid mode: " + mode);
      if (!VersionCheck.isValid(version)) {
        throw new Error("Invalid version: " + version);
      }
      if (version >= 1 && version < 10) return mode.ccBits[0];
      else if (version < 27) return mode.ccBits[1];
      return mode.ccBits[2];
    };
    exports.getBestModeForData = function getBestModeForData(dataStr) {
      if (Regex.testNumeric(dataStr)) return exports.NUMERIC;
      else if (Regex.testAlphanumeric(dataStr)) return exports.ALPHANUMERIC;
      else if (Regex.testKanji(dataStr)) return exports.KANJI;
      else return exports.BYTE;
    };
    exports.toString = function toString(mode) {
      if (mode && mode.id) return mode.id;
      throw new Error("Invalid mode");
    };
    exports.isValid = function isValid(mode) {
      return mode && mode.bit && mode.ccBits;
    };
    function fromString(string) {
      if (typeof string !== "string") {
        throw new Error("Param is not a string");
      }
      const lcStr = string.toLowerCase();
      switch (lcStr) {
        case "numeric":
          return exports.NUMERIC;
        case "alphanumeric":
          return exports.ALPHANUMERIC;
        case "kanji":
          return exports.KANJI;
        case "byte":
          return exports.BYTE;
        default:
          throw new Error("Unknown mode: " + string);
      }
    }
    exports.from = function from(value, defaultValue) {
      if (exports.isValid(value)) {
        return value;
      }
      try {
        return fromString(value);
      } catch (e) {
        return defaultValue;
      }
    };
  }
});

// ../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/version.js
var require_version = __commonJS({
  "../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/version.js"(exports) {
    var Utils = require_utils();
    var ECCode = require_error_correction_code();
    var ECLevel = require_error_correction_level();
    var Mode = require_mode();
    var VersionCheck = require_version_check();
    var G18 = 1 << 12 | 1 << 11 | 1 << 10 | 1 << 9 | 1 << 8 | 1 << 5 | 1 << 2 | 1 << 0;
    var G18_BCH = Utils.getBCHDigit(G18);
    function getBestVersionForDataLength(mode, length, errorCorrectionLevel) {
      for (let currentVersion = 1; currentVersion <= 40; currentVersion++) {
        if (length <= exports.getCapacity(currentVersion, errorCorrectionLevel, mode)) {
          return currentVersion;
        }
      }
      return void 0;
    }
    function getReservedBitsCount(mode, version) {
      return Mode.getCharCountIndicator(mode, version) + 4;
    }
    function getTotalBitsFromDataArray(segments, version) {
      let totalBits = 0;
      segments.forEach(function(data) {
        const reservedBits = getReservedBitsCount(data.mode, version);
        totalBits += reservedBits + data.getBitsLength();
      });
      return totalBits;
    }
    function getBestVersionForMixedData(segments, errorCorrectionLevel) {
      for (let currentVersion = 1; currentVersion <= 40; currentVersion++) {
        const length = getTotalBitsFromDataArray(segments, currentVersion);
        if (length <= exports.getCapacity(currentVersion, errorCorrectionLevel, Mode.MIXED)) {
          return currentVersion;
        }
      }
      return void 0;
    }
    exports.from = function from(value, defaultValue) {
      if (VersionCheck.isValid(value)) {
        return parseInt(value, 10);
      }
      return defaultValue;
    };
    exports.getCapacity = function getCapacity(version, errorCorrectionLevel, mode) {
      if (!VersionCheck.isValid(version)) {
        throw new Error("Invalid QR Code version");
      }
      if (typeof mode === "undefined") mode = Mode.BYTE;
      const totalCodewords = Utils.getSymbolTotalCodewords(version);
      const ecTotalCodewords = ECCode.getTotalCodewordsCount(version, errorCorrectionLevel);
      const dataTotalCodewordsBits = (totalCodewords - ecTotalCodewords) * 8;
      if (mode === Mode.MIXED) return dataTotalCodewordsBits;
      const usableBits = dataTotalCodewordsBits - getReservedBitsCount(mode, version);
      switch (mode) {
        case Mode.NUMERIC:
          return Math.floor(usableBits / 10 * 3);
        case Mode.ALPHANUMERIC:
          return Math.floor(usableBits / 11 * 2);
        case Mode.KANJI:
          return Math.floor(usableBits / 13);
        case Mode.BYTE:
        default:
          return Math.floor(usableBits / 8);
      }
    };
    exports.getBestVersionForData = function getBestVersionForData(data, errorCorrectionLevel) {
      let seg;
      const ecl = ECLevel.from(errorCorrectionLevel, ECLevel.M);
      if (Array.isArray(data)) {
        if (data.length > 1) {
          return getBestVersionForMixedData(data, ecl);
        }
        if (data.length === 0) {
          return 1;
        }
        seg = data[0];
      } else {
        seg = data;
      }
      return getBestVersionForDataLength(seg.mode, seg.getLength(), ecl);
    };
    exports.getEncodedBits = function getEncodedBits(version) {
      if (!VersionCheck.isValid(version) || version < 7) {
        throw new Error("Invalid QR Code version");
      }
      let d = version << 12;
      while (Utils.getBCHDigit(d) - G18_BCH >= 0) {
        d ^= G18 << Utils.getBCHDigit(d) - G18_BCH;
      }
      return version << 12 | d;
    };
  }
});

// ../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/format-info.js
var require_format_info = __commonJS({
  "../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/format-info.js"(exports) {
    var Utils = require_utils();
    var G15 = 1 << 10 | 1 << 8 | 1 << 5 | 1 << 4 | 1 << 2 | 1 << 1 | 1 << 0;
    var G15_MASK = 1 << 14 | 1 << 12 | 1 << 10 | 1 << 4 | 1 << 1;
    var G15_BCH = Utils.getBCHDigit(G15);
    exports.getEncodedBits = function getEncodedBits(errorCorrectionLevel, mask) {
      const data = errorCorrectionLevel.bit << 3 | mask;
      let d = data << 10;
      while (Utils.getBCHDigit(d) - G15_BCH >= 0) {
        d ^= G15 << Utils.getBCHDigit(d) - G15_BCH;
      }
      return (data << 10 | d) ^ G15_MASK;
    };
  }
});

// ../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/numeric-data.js
var require_numeric_data = __commonJS({
  "../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/numeric-data.js"(exports, module) {
    var Mode = require_mode();
    function NumericData(data) {
      this.mode = Mode.NUMERIC;
      this.data = data.toString();
    }
    NumericData.getBitsLength = function getBitsLength(length) {
      return 10 * Math.floor(length / 3) + (length % 3 ? length % 3 * 3 + 1 : 0);
    };
    NumericData.prototype.getLength = function getLength() {
      return this.data.length;
    };
    NumericData.prototype.getBitsLength = function getBitsLength() {
      return NumericData.getBitsLength(this.data.length);
    };
    NumericData.prototype.write = function write(bitBuffer) {
      let i, group, value;
      for (i = 0; i + 3 <= this.data.length; i += 3) {
        group = this.data.substr(i, 3);
        value = parseInt(group, 10);
        bitBuffer.put(value, 10);
      }
      const remainingNum = this.data.length - i;
      if (remainingNum > 0) {
        group = this.data.substr(i);
        value = parseInt(group, 10);
        bitBuffer.put(value, remainingNum * 3 + 1);
      }
    };
    module.exports = NumericData;
  }
});

// ../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/alphanumeric-data.js
var require_alphanumeric_data = __commonJS({
  "../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/alphanumeric-data.js"(exports, module) {
    var Mode = require_mode();
    var ALPHA_NUM_CHARS = [
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
      "N",
      "O",
      "P",
      "Q",
      "R",
      "S",
      "T",
      "U",
      "V",
      "W",
      "X",
      "Y",
      "Z",
      " ",
      "$",
      "%",
      "*",
      "+",
      "-",
      ".",
      "/",
      ":"
    ];
    function AlphanumericData(data) {
      this.mode = Mode.ALPHANUMERIC;
      this.data = data;
    }
    AlphanumericData.getBitsLength = function getBitsLength(length) {
      return 11 * Math.floor(length / 2) + 6 * (length % 2);
    };
    AlphanumericData.prototype.getLength = function getLength() {
      return this.data.length;
    };
    AlphanumericData.prototype.getBitsLength = function getBitsLength() {
      return AlphanumericData.getBitsLength(this.data.length);
    };
    AlphanumericData.prototype.write = function write(bitBuffer) {
      let i;
      for (i = 0; i + 2 <= this.data.length; i += 2) {
        let value = ALPHA_NUM_CHARS.indexOf(this.data[i]) * 45;
        value += ALPHA_NUM_CHARS.indexOf(this.data[i + 1]);
        bitBuffer.put(value, 11);
      }
      if (this.data.length % 2) {
        bitBuffer.put(ALPHA_NUM_CHARS.indexOf(this.data[i]), 6);
      }
    };
    module.exports = AlphanumericData;
  }
});

// ../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/byte-data.js
var require_byte_data = __commonJS({
  "../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/byte-data.js"(exports, module) {
    var Mode = require_mode();
    function ByteData(data) {
      this.mode = Mode.BYTE;
      if (typeof data === "string") {
        this.data = new TextEncoder().encode(data);
      } else {
        this.data = new Uint8Array(data);
      }
    }
    ByteData.getBitsLength = function getBitsLength(length) {
      return length * 8;
    };
    ByteData.prototype.getLength = function getLength() {
      return this.data.length;
    };
    ByteData.prototype.getBitsLength = function getBitsLength() {
      return ByteData.getBitsLength(this.data.length);
    };
    ByteData.prototype.write = function(bitBuffer) {
      for (let i = 0, l = this.data.length; i < l; i++) {
        bitBuffer.put(this.data[i], 8);
      }
    };
    module.exports = ByteData;
  }
});

// ../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/kanji-data.js
var require_kanji_data = __commonJS({
  "../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/kanji-data.js"(exports, module) {
    var Mode = require_mode();
    var Utils = require_utils();
    function KanjiData(data) {
      this.mode = Mode.KANJI;
      this.data = data;
    }
    KanjiData.getBitsLength = function getBitsLength(length) {
      return length * 13;
    };
    KanjiData.prototype.getLength = function getLength() {
      return this.data.length;
    };
    KanjiData.prototype.getBitsLength = function getBitsLength() {
      return KanjiData.getBitsLength(this.data.length);
    };
    KanjiData.prototype.write = function(bitBuffer) {
      let i;
      for (i = 0; i < this.data.length; i++) {
        let value = Utils.toSJIS(this.data[i]);
        if (value >= 33088 && value <= 40956) {
          value -= 33088;
        } else if (value >= 57408 && value <= 60351) {
          value -= 49472;
        } else {
          throw new Error(
            "Invalid SJIS character: " + this.data[i] + "\nMake sure your charset is UTF-8"
          );
        }
        value = (value >>> 8 & 255) * 192 + (value & 255);
        bitBuffer.put(value, 13);
      }
    };
    module.exports = KanjiData;
  }
});

// ../../node_modules/.pnpm/dijkstrajs@1.0.3/node_modules/dijkstrajs/dijkstra.js
var require_dijkstra = __commonJS({
  "../../node_modules/.pnpm/dijkstrajs@1.0.3/node_modules/dijkstrajs/dijkstra.js"(exports, module) {
    "use strict";
    var dijkstra = {
      single_source_shortest_paths: function(graph, s, d) {
        var predecessors = {};
        var costs = {};
        costs[s] = 0;
        var open2 = dijkstra.PriorityQueue.make();
        open2.push(s, 0);
        var closest, u, v, cost_of_s_to_u, adjacent_nodes, cost_of_e, cost_of_s_to_u_plus_cost_of_e, cost_of_s_to_v, first_visit;
        while (!open2.empty()) {
          closest = open2.pop();
          u = closest.value;
          cost_of_s_to_u = closest.cost;
          adjacent_nodes = graph[u] || {};
          for (v in adjacent_nodes) {
            if (adjacent_nodes.hasOwnProperty(v)) {
              cost_of_e = adjacent_nodes[v];
              cost_of_s_to_u_plus_cost_of_e = cost_of_s_to_u + cost_of_e;
              cost_of_s_to_v = costs[v];
              first_visit = typeof costs[v] === "undefined";
              if (first_visit || cost_of_s_to_v > cost_of_s_to_u_plus_cost_of_e) {
                costs[v] = cost_of_s_to_u_plus_cost_of_e;
                open2.push(v, cost_of_s_to_u_plus_cost_of_e);
                predecessors[v] = u;
              }
            }
          }
        }
        if (typeof d !== "undefined" && typeof costs[d] === "undefined") {
          var msg = ["Could not find a path from ", s, " to ", d, "."].join("");
          throw new Error(msg);
        }
        return predecessors;
      },
      extract_shortest_path_from_predecessor_list: function(predecessors, d) {
        var nodes = [];
        var u = d;
        var predecessor;
        while (u) {
          nodes.push(u);
          predecessor = predecessors[u];
          u = predecessors[u];
        }
        nodes.reverse();
        return nodes;
      },
      find_path: function(graph, s, d) {
        var predecessors = dijkstra.single_source_shortest_paths(graph, s, d);
        return dijkstra.extract_shortest_path_from_predecessor_list(
          predecessors,
          d
        );
      },
      /**
       * A very naive priority queue implementation.
       */
      PriorityQueue: {
        make: function(opts) {
          var T = dijkstra.PriorityQueue, t = {}, key2;
          opts = opts || {};
          for (key2 in T) {
            if (T.hasOwnProperty(key2)) {
              t[key2] = T[key2];
            }
          }
          t.queue = [];
          t.sorter = opts.sorter || T.default_sorter;
          return t;
        },
        default_sorter: function(a, b) {
          return a.cost - b.cost;
        },
        /**
         * Add a new item to the queue and ensure the highest priority element
         * is at the front of the queue.
         */
        push: function(value, cost) {
          var item = { value, cost };
          this.queue.push(item);
          this.queue.sort(this.sorter);
        },
        /**
         * Return the highest priority element in the queue.
         */
        pop: function() {
          return this.queue.shift();
        },
        empty: function() {
          return this.queue.length === 0;
        }
      }
    };
    if (typeof module !== "undefined") {
      module.exports = dijkstra;
    }
  }
});

// ../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/segments.js
var require_segments = __commonJS({
  "../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/segments.js"(exports) {
    var Mode = require_mode();
    var NumericData = require_numeric_data();
    var AlphanumericData = require_alphanumeric_data();
    var ByteData = require_byte_data();
    var KanjiData = require_kanji_data();
    var Regex = require_regex();
    var Utils = require_utils();
    var dijkstra = require_dijkstra();
    function getStringByteLength(str) {
      return unescape(encodeURIComponent(str)).length;
    }
    function getSegments(regex, mode, str) {
      const segments = [];
      let result;
      while ((result = regex.exec(str)) !== null) {
        segments.push({
          data: result[0],
          index: result.index,
          mode,
          length: result[0].length
        });
      }
      return segments;
    }
    function getSegmentsFromString(dataStr) {
      const numSegs = getSegments(Regex.NUMERIC, Mode.NUMERIC, dataStr);
      const alphaNumSegs = getSegments(Regex.ALPHANUMERIC, Mode.ALPHANUMERIC, dataStr);
      let byteSegs;
      let kanjiSegs;
      if (Utils.isKanjiModeEnabled()) {
        byteSegs = getSegments(Regex.BYTE, Mode.BYTE, dataStr);
        kanjiSegs = getSegments(Regex.KANJI, Mode.KANJI, dataStr);
      } else {
        byteSegs = getSegments(Regex.BYTE_KANJI, Mode.BYTE, dataStr);
        kanjiSegs = [];
      }
      const segs = numSegs.concat(alphaNumSegs, byteSegs, kanjiSegs);
      return segs.sort(function(s1, s2) {
        return s1.index - s2.index;
      }).map(function(obj) {
        return {
          data: obj.data,
          mode: obj.mode,
          length: obj.length
        };
      });
    }
    function getSegmentBitsLength(length, mode) {
      switch (mode) {
        case Mode.NUMERIC:
          return NumericData.getBitsLength(length);
        case Mode.ALPHANUMERIC:
          return AlphanumericData.getBitsLength(length);
        case Mode.KANJI:
          return KanjiData.getBitsLength(length);
        case Mode.BYTE:
          return ByteData.getBitsLength(length);
      }
    }
    function mergeSegments(segs) {
      return segs.reduce(function(acc, curr) {
        const prevSeg = acc.length - 1 >= 0 ? acc[acc.length - 1] : null;
        if (prevSeg && prevSeg.mode === curr.mode) {
          acc[acc.length - 1].data += curr.data;
          return acc;
        }
        acc.push(curr);
        return acc;
      }, []);
    }
    function buildNodes(segs) {
      const nodes = [];
      for (let i = 0; i < segs.length; i++) {
        const seg = segs[i];
        switch (seg.mode) {
          case Mode.NUMERIC:
            nodes.push([
              seg,
              { data: seg.data, mode: Mode.ALPHANUMERIC, length: seg.length },
              { data: seg.data, mode: Mode.BYTE, length: seg.length }
            ]);
            break;
          case Mode.ALPHANUMERIC:
            nodes.push([
              seg,
              { data: seg.data, mode: Mode.BYTE, length: seg.length }
            ]);
            break;
          case Mode.KANJI:
            nodes.push([
              seg,
              { data: seg.data, mode: Mode.BYTE, length: getStringByteLength(seg.data) }
            ]);
            break;
          case Mode.BYTE:
            nodes.push([
              { data: seg.data, mode: Mode.BYTE, length: getStringByteLength(seg.data) }
            ]);
        }
      }
      return nodes;
    }
    function buildGraph(nodes, version) {
      const table = {};
      const graph = { start: {} };
      let prevNodeIds = ["start"];
      for (let i = 0; i < nodes.length; i++) {
        const nodeGroup = nodes[i];
        const currentNodeIds = [];
        for (let j = 0; j < nodeGroup.length; j++) {
          const node = nodeGroup[j];
          const key2 = "" + i + j;
          currentNodeIds.push(key2);
          table[key2] = { node, lastCount: 0 };
          graph[key2] = {};
          for (let n = 0; n < prevNodeIds.length; n++) {
            const prevNodeId = prevNodeIds[n];
            if (table[prevNodeId] && table[prevNodeId].node.mode === node.mode) {
              graph[prevNodeId][key2] = getSegmentBitsLength(table[prevNodeId].lastCount + node.length, node.mode) - getSegmentBitsLength(table[prevNodeId].lastCount, node.mode);
              table[prevNodeId].lastCount += node.length;
            } else {
              if (table[prevNodeId]) table[prevNodeId].lastCount = node.length;
              graph[prevNodeId][key2] = getSegmentBitsLength(node.length, node.mode) + 4 + Mode.getCharCountIndicator(node.mode, version);
            }
          }
        }
        prevNodeIds = currentNodeIds;
      }
      for (let n = 0; n < prevNodeIds.length; n++) {
        graph[prevNodeIds[n]].end = 0;
      }
      return { map: graph, table };
    }
    function buildSingleSegment(data, modesHint) {
      let mode;
      const bestMode = Mode.getBestModeForData(data);
      mode = Mode.from(modesHint, bestMode);
      if (mode !== Mode.BYTE && mode.bit < bestMode.bit) {
        throw new Error('"' + data + '" cannot be encoded with mode ' + Mode.toString(mode) + ".\n Suggested mode is: " + Mode.toString(bestMode));
      }
      if (mode === Mode.KANJI && !Utils.isKanjiModeEnabled()) {
        mode = Mode.BYTE;
      }
      switch (mode) {
        case Mode.NUMERIC:
          return new NumericData(data);
        case Mode.ALPHANUMERIC:
          return new AlphanumericData(data);
        case Mode.KANJI:
          return new KanjiData(data);
        case Mode.BYTE:
          return new ByteData(data);
      }
    }
    exports.fromArray = function fromArray(array) {
      return array.reduce(function(acc, seg) {
        if (typeof seg === "string") {
          acc.push(buildSingleSegment(seg, null));
        } else if (seg.data) {
          acc.push(buildSingleSegment(seg.data, seg.mode));
        }
        return acc;
      }, []);
    };
    exports.fromString = function fromString(data, version) {
      const segs = getSegmentsFromString(data, Utils.isKanjiModeEnabled());
      const nodes = buildNodes(segs);
      const graph = buildGraph(nodes, version);
      const path = dijkstra.find_path(graph.map, "start", "end");
      const optimizedSegs = [];
      for (let i = 1; i < path.length - 1; i++) {
        optimizedSegs.push(graph.table[path[i]].node);
      }
      return exports.fromArray(mergeSegments(optimizedSegs));
    };
    exports.rawSplit = function rawSplit(data) {
      return exports.fromArray(
        getSegmentsFromString(data, Utils.isKanjiModeEnabled())
      );
    };
  }
});

// ../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/qrcode.js
var require_qrcode = __commonJS({
  "../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/core/qrcode.js"(exports) {
    var Utils = require_utils();
    var ECLevel = require_error_correction_level();
    var BitBuffer = require_bit_buffer();
    var BitMatrix = require_bit_matrix();
    var AlignmentPattern = require_alignment_pattern();
    var FinderPattern = require_finder_pattern();
    var MaskPattern = require_mask_pattern();
    var ECCode = require_error_correction_code();
    var ReedSolomonEncoder = require_reed_solomon_encoder();
    var Version = require_version();
    var FormatInfo = require_format_info();
    var Mode = require_mode();
    var Segments = require_segments();
    function setupFinderPattern(matrix, version) {
      const size = matrix.size;
      const pos = FinderPattern.getPositions(version);
      for (let i = 0; i < pos.length; i++) {
        const row = pos[i][0];
        const col = pos[i][1];
        for (let r = -1; r <= 7; r++) {
          if (row + r <= -1 || size <= row + r) continue;
          for (let c = -1; c <= 7; c++) {
            if (col + c <= -1 || size <= col + c) continue;
            if (r >= 0 && r <= 6 && (c === 0 || c === 6) || c >= 0 && c <= 6 && (r === 0 || r === 6) || r >= 2 && r <= 4 && c >= 2 && c <= 4) {
              matrix.set(row + r, col + c, true, true);
            } else {
              matrix.set(row + r, col + c, false, true);
            }
          }
        }
      }
    }
    function setupTimingPattern(matrix) {
      const size = matrix.size;
      for (let r = 8; r < size - 8; r++) {
        const value = r % 2 === 0;
        matrix.set(r, 6, value, true);
        matrix.set(6, r, value, true);
      }
    }
    function setupAlignmentPattern(matrix, version) {
      const pos = AlignmentPattern.getPositions(version);
      for (let i = 0; i < pos.length; i++) {
        const row = pos[i][0];
        const col = pos[i][1];
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            if (r === -2 || r === 2 || c === -2 || c === 2 || r === 0 && c === 0) {
              matrix.set(row + r, col + c, true, true);
            } else {
              matrix.set(row + r, col + c, false, true);
            }
          }
        }
      }
    }
    function setupVersionInfo(matrix, version) {
      const size = matrix.size;
      const bits = Version.getEncodedBits(version);
      let row, col, mod2;
      for (let i = 0; i < 18; i++) {
        row = Math.floor(i / 3);
        col = i % 3 + size - 8 - 3;
        mod2 = (bits >> i & 1) === 1;
        matrix.set(row, col, mod2, true);
        matrix.set(col, row, mod2, true);
      }
    }
    function setupFormatInfo(matrix, errorCorrectionLevel, maskPattern) {
      const size = matrix.size;
      const bits = FormatInfo.getEncodedBits(errorCorrectionLevel, maskPattern);
      let i, mod2;
      for (i = 0; i < 15; i++) {
        mod2 = (bits >> i & 1) === 1;
        if (i < 6) {
          matrix.set(i, 8, mod2, true);
        } else if (i < 8) {
          matrix.set(i + 1, 8, mod2, true);
        } else {
          matrix.set(size - 15 + i, 8, mod2, true);
        }
        if (i < 8) {
          matrix.set(8, size - i - 1, mod2, true);
        } else if (i < 9) {
          matrix.set(8, 15 - i - 1 + 1, mod2, true);
        } else {
          matrix.set(8, 15 - i - 1, mod2, true);
        }
      }
      matrix.set(size - 8, 8, 1, true);
    }
    function setupData(matrix, data) {
      const size = matrix.size;
      let inc = -1;
      let row = size - 1;
      let bitIndex = 7;
      let byteIndex = 0;
      for (let col = size - 1; col > 0; col -= 2) {
        if (col === 6) col--;
        while (true) {
          for (let c = 0; c < 2; c++) {
            if (!matrix.isReserved(row, col - c)) {
              let dark = false;
              if (byteIndex < data.length) {
                dark = (data[byteIndex] >>> bitIndex & 1) === 1;
              }
              matrix.set(row, col - c, dark);
              bitIndex--;
              if (bitIndex === -1) {
                byteIndex++;
                bitIndex = 7;
              }
            }
          }
          row += inc;
          if (row < 0 || size <= row) {
            row -= inc;
            inc = -inc;
            break;
          }
        }
      }
    }
    function createData(version, errorCorrectionLevel, segments) {
      const buffer = new BitBuffer();
      segments.forEach(function(data) {
        buffer.put(data.mode.bit, 4);
        buffer.put(data.getLength(), Mode.getCharCountIndicator(data.mode, version));
        data.write(buffer);
      });
      const totalCodewords = Utils.getSymbolTotalCodewords(version);
      const ecTotalCodewords = ECCode.getTotalCodewordsCount(version, errorCorrectionLevel);
      const dataTotalCodewordsBits = (totalCodewords - ecTotalCodewords) * 8;
      if (buffer.getLengthInBits() + 4 <= dataTotalCodewordsBits) {
        buffer.put(0, 4);
      }
      while (buffer.getLengthInBits() % 8 !== 0) {
        buffer.putBit(0);
      }
      const remainingByte = (dataTotalCodewordsBits - buffer.getLengthInBits()) / 8;
      for (let i = 0; i < remainingByte; i++) {
        buffer.put(i % 2 ? 17 : 236, 8);
      }
      return createCodewords(buffer, version, errorCorrectionLevel);
    }
    function createCodewords(bitBuffer, version, errorCorrectionLevel) {
      const totalCodewords = Utils.getSymbolTotalCodewords(version);
      const ecTotalCodewords = ECCode.getTotalCodewordsCount(version, errorCorrectionLevel);
      const dataTotalCodewords = totalCodewords - ecTotalCodewords;
      const ecTotalBlocks = ECCode.getBlocksCount(version, errorCorrectionLevel);
      const blocksInGroup2 = totalCodewords % ecTotalBlocks;
      const blocksInGroup1 = ecTotalBlocks - blocksInGroup2;
      const totalCodewordsInGroup1 = Math.floor(totalCodewords / ecTotalBlocks);
      const dataCodewordsInGroup1 = Math.floor(dataTotalCodewords / ecTotalBlocks);
      const dataCodewordsInGroup2 = dataCodewordsInGroup1 + 1;
      const ecCount = totalCodewordsInGroup1 - dataCodewordsInGroup1;
      const rs = new ReedSolomonEncoder(ecCount);
      let offset = 0;
      const dcData = new Array(ecTotalBlocks);
      const ecData = new Array(ecTotalBlocks);
      let maxDataSize = 0;
      const buffer = new Uint8Array(bitBuffer.buffer);
      for (let b = 0; b < ecTotalBlocks; b++) {
        const dataSize = b < blocksInGroup1 ? dataCodewordsInGroup1 : dataCodewordsInGroup2;
        dcData[b] = buffer.slice(offset, offset + dataSize);
        ecData[b] = rs.encode(dcData[b]);
        offset += dataSize;
        maxDataSize = Math.max(maxDataSize, dataSize);
      }
      const data = new Uint8Array(totalCodewords);
      let index = 0;
      let i, r;
      for (i = 0; i < maxDataSize; i++) {
        for (r = 0; r < ecTotalBlocks; r++) {
          if (i < dcData[r].length) {
            data[index++] = dcData[r][i];
          }
        }
      }
      for (i = 0; i < ecCount; i++) {
        for (r = 0; r < ecTotalBlocks; r++) {
          data[index++] = ecData[r][i];
        }
      }
      return data;
    }
    function createSymbol(data, version, errorCorrectionLevel, maskPattern) {
      let segments;
      if (Array.isArray(data)) {
        segments = Segments.fromArray(data);
      } else if (typeof data === "string") {
        let estimatedVersion = version;
        if (!estimatedVersion) {
          const rawSegments = Segments.rawSplit(data);
          estimatedVersion = Version.getBestVersionForData(rawSegments, errorCorrectionLevel);
        }
        segments = Segments.fromString(data, estimatedVersion || 40);
      } else {
        throw new Error("Invalid data");
      }
      const bestVersion = Version.getBestVersionForData(segments, errorCorrectionLevel);
      if (!bestVersion) {
        throw new Error("The amount of data is too big to be stored in a QR Code");
      }
      if (!version) {
        version = bestVersion;
      } else if (version < bestVersion) {
        throw new Error(
          "\nThe chosen QR Code version cannot contain this amount of data.\nMinimum version required to store current data is: " + bestVersion + ".\n"
        );
      }
      const dataBits = createData(version, errorCorrectionLevel, segments);
      const moduleCount = Utils.getSymbolSize(version);
      const modules = new BitMatrix(moduleCount);
      setupFinderPattern(modules, version);
      setupTimingPattern(modules);
      setupAlignmentPattern(modules, version);
      setupFormatInfo(modules, errorCorrectionLevel, 0);
      if (version >= 7) {
        setupVersionInfo(modules, version);
      }
      setupData(modules, dataBits);
      if (isNaN(maskPattern)) {
        maskPattern = MaskPattern.getBestMask(
          modules,
          setupFormatInfo.bind(null, modules, errorCorrectionLevel)
        );
      }
      MaskPattern.applyMask(maskPattern, modules);
      setupFormatInfo(modules, errorCorrectionLevel, maskPattern);
      return {
        modules,
        version,
        errorCorrectionLevel,
        maskPattern,
        segments
      };
    }
    exports.create = function create(data, options) {
      if (typeof data === "undefined" || data === "") {
        throw new Error("No input text");
      }
      let errorCorrectionLevel = ECLevel.M;
      let version;
      let mask;
      if (typeof options !== "undefined") {
        errorCorrectionLevel = ECLevel.from(options.errorCorrectionLevel, ECLevel.M);
        version = Version.from(options.version);
        mask = MaskPattern.from(options.maskPattern);
        if (options.toSJISFunc) {
          Utils.setToSJISFunction(options.toSJISFunc);
        }
      }
      return createSymbol(data, version, errorCorrectionLevel, mask);
    };
  }
});

// ../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/chunkstream.js
var require_chunkstream = __commonJS({
  "../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/chunkstream.js"(exports, module) {
    "use strict";
    var util = __require("util");
    var Stream = __require("stream");
    var ChunkStream = module.exports = function() {
      Stream.call(this);
      this._buffers = [];
      this._buffered = 0;
      this._reads = [];
      this._paused = false;
      this._encoding = "utf8";
      this.writable = true;
    };
    util.inherits(ChunkStream, Stream);
    ChunkStream.prototype.read = function(length, callback) {
      this._reads.push({
        length: Math.abs(length),
        // if length < 0 then at most this length
        allowLess: length < 0,
        func: callback
      });
      process.nextTick(
        function() {
          this._process();
          if (this._paused && this._reads && this._reads.length > 0) {
            this._paused = false;
            this.emit("drain");
          }
        }.bind(this)
      );
    };
    ChunkStream.prototype.write = function(data, encoding) {
      if (!this.writable) {
        this.emit("error", new Error("Stream not writable"));
        return false;
      }
      let dataBuffer;
      if (Buffer.isBuffer(data)) {
        dataBuffer = data;
      } else {
        dataBuffer = Buffer.from(data, encoding || this._encoding);
      }
      this._buffers.push(dataBuffer);
      this._buffered += dataBuffer.length;
      this._process();
      if (this._reads && this._reads.length === 0) {
        this._paused = true;
      }
      return this.writable && !this._paused;
    };
    ChunkStream.prototype.end = function(data, encoding) {
      if (data) {
        this.write(data, encoding);
      }
      this.writable = false;
      if (!this._buffers) {
        return;
      }
      if (this._buffers.length === 0) {
        this._end();
      } else {
        this._buffers.push(null);
        this._process();
      }
    };
    ChunkStream.prototype.destroySoon = ChunkStream.prototype.end;
    ChunkStream.prototype._end = function() {
      if (this._reads.length > 0) {
        this.emit("error", new Error("Unexpected end of input"));
      }
      this.destroy();
    };
    ChunkStream.prototype.destroy = function() {
      if (!this._buffers) {
        return;
      }
      this.writable = false;
      this._reads = null;
      this._buffers = null;
      this.emit("close");
    };
    ChunkStream.prototype._processReadAllowingLess = function(read) {
      this._reads.shift();
      let smallerBuf = this._buffers[0];
      if (smallerBuf.length > read.length) {
        this._buffered -= read.length;
        this._buffers[0] = smallerBuf.slice(read.length);
        read.func.call(this, smallerBuf.slice(0, read.length));
      } else {
        this._buffered -= smallerBuf.length;
        this._buffers.shift();
        read.func.call(this, smallerBuf);
      }
    };
    ChunkStream.prototype._processRead = function(read) {
      this._reads.shift();
      let pos = 0;
      let count = 0;
      let data = Buffer.alloc(read.length);
      while (pos < read.length) {
        let buf = this._buffers[count++];
        let len = Math.min(buf.length, read.length - pos);
        buf.copy(data, pos, 0, len);
        pos += len;
        if (len !== buf.length) {
          this._buffers[--count] = buf.slice(len);
        }
      }
      if (count > 0) {
        this._buffers.splice(0, count);
      }
      this._buffered -= read.length;
      read.func.call(this, data);
    };
    ChunkStream.prototype._process = function() {
      try {
        while (this._buffered > 0 && this._reads && this._reads.length > 0) {
          let read = this._reads[0];
          if (read.allowLess) {
            this._processReadAllowingLess(read);
          } else if (this._buffered >= read.length) {
            this._processRead(read);
          } else {
            break;
          }
        }
        if (this._buffers && !this.writable) {
          this._end();
        }
      } catch (ex) {
        this.emit("error", ex);
      }
    };
  }
});

// ../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/interlace.js
var require_interlace = __commonJS({
  "../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/interlace.js"(exports) {
    "use strict";
    var imagePasses = [
      {
        // pass 1 - 1px
        x: [0],
        y: [0]
      },
      {
        // pass 2 - 1px
        x: [4],
        y: [0]
      },
      {
        // pass 3 - 2px
        x: [0, 4],
        y: [4]
      },
      {
        // pass 4 - 4px
        x: [2, 6],
        y: [0, 4]
      },
      {
        // pass 5 - 8px
        x: [0, 2, 4, 6],
        y: [2, 6]
      },
      {
        // pass 6 - 16px
        x: [1, 3, 5, 7],
        y: [0, 2, 4, 6]
      },
      {
        // pass 7 - 32px
        x: [0, 1, 2, 3, 4, 5, 6, 7],
        y: [1, 3, 5, 7]
      }
    ];
    exports.getImagePasses = function(width, height) {
      let images = [];
      let xLeftOver = width % 8;
      let yLeftOver = height % 8;
      let xRepeats = (width - xLeftOver) / 8;
      let yRepeats = (height - yLeftOver) / 8;
      for (let i = 0; i < imagePasses.length; i++) {
        let pass = imagePasses[i];
        let passWidth = xRepeats * pass.x.length;
        let passHeight = yRepeats * pass.y.length;
        for (let j = 0; j < pass.x.length; j++) {
          if (pass.x[j] < xLeftOver) {
            passWidth++;
          } else {
            break;
          }
        }
        for (let j = 0; j < pass.y.length; j++) {
          if (pass.y[j] < yLeftOver) {
            passHeight++;
          } else {
            break;
          }
        }
        if (passWidth > 0 && passHeight > 0) {
          images.push({ width: passWidth, height: passHeight, index: i });
        }
      }
      return images;
    };
    exports.getInterlaceIterator = function(width) {
      return function(x, y, pass) {
        let outerXLeftOver = x % imagePasses[pass].x.length;
        let outerX = (x - outerXLeftOver) / imagePasses[pass].x.length * 8 + imagePasses[pass].x[outerXLeftOver];
        let outerYLeftOver = y % imagePasses[pass].y.length;
        let outerY = (y - outerYLeftOver) / imagePasses[pass].y.length * 8 + imagePasses[pass].y[outerYLeftOver];
        return outerX * 4 + outerY * width * 4;
      };
    };
  }
});

// ../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/paeth-predictor.js
var require_paeth_predictor = __commonJS({
  "../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/paeth-predictor.js"(exports, module) {
    "use strict";
    module.exports = function paethPredictor(left, above, upLeft) {
      let paeth = left + above - upLeft;
      let pLeft = Math.abs(paeth - left);
      let pAbove = Math.abs(paeth - above);
      let pUpLeft = Math.abs(paeth - upLeft);
      if (pLeft <= pAbove && pLeft <= pUpLeft) {
        return left;
      }
      if (pAbove <= pUpLeft) {
        return above;
      }
      return upLeft;
    };
  }
});

// ../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/filter-parse.js
var require_filter_parse = __commonJS({
  "../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/filter-parse.js"(exports, module) {
    "use strict";
    var interlaceUtils = require_interlace();
    var paethPredictor = require_paeth_predictor();
    function getByteWidth(width, bpp, depth) {
      let byteWidth = width * bpp;
      if (depth !== 8) {
        byteWidth = Math.ceil(byteWidth / (8 / depth));
      }
      return byteWidth;
    }
    var Filter = module.exports = function(bitmapInfo, dependencies) {
      let width = bitmapInfo.width;
      let height = bitmapInfo.height;
      let interlace = bitmapInfo.interlace;
      let bpp = bitmapInfo.bpp;
      let depth = bitmapInfo.depth;
      this.read = dependencies.read;
      this.write = dependencies.write;
      this.complete = dependencies.complete;
      this._imageIndex = 0;
      this._images = [];
      if (interlace) {
        let passes = interlaceUtils.getImagePasses(width, height);
        for (let i = 0; i < passes.length; i++) {
          this._images.push({
            byteWidth: getByteWidth(passes[i].width, bpp, depth),
            height: passes[i].height,
            lineIndex: 0
          });
        }
      } else {
        this._images.push({
          byteWidth: getByteWidth(width, bpp, depth),
          height,
          lineIndex: 0
        });
      }
      if (depth === 8) {
        this._xComparison = bpp;
      } else if (depth === 16) {
        this._xComparison = bpp * 2;
      } else {
        this._xComparison = 1;
      }
    };
    Filter.prototype.start = function() {
      this.read(
        this._images[this._imageIndex].byteWidth + 1,
        this._reverseFilterLine.bind(this)
      );
    };
    Filter.prototype._unFilterType1 = function(rawData, unfilteredLine, byteWidth) {
      let xComparison = this._xComparison;
      let xBiggerThan = xComparison - 1;
      for (let x = 0; x < byteWidth; x++) {
        let rawByte = rawData[1 + x];
        let f1Left = x > xBiggerThan ? unfilteredLine[x - xComparison] : 0;
        unfilteredLine[x] = rawByte + f1Left;
      }
    };
    Filter.prototype._unFilterType2 = function(rawData, unfilteredLine, byteWidth) {
      let lastLine2 = this._lastLine;
      for (let x = 0; x < byteWidth; x++) {
        let rawByte = rawData[1 + x];
        let f2Up = lastLine2 ? lastLine2[x] : 0;
        unfilteredLine[x] = rawByte + f2Up;
      }
    };
    Filter.prototype._unFilterType3 = function(rawData, unfilteredLine, byteWidth) {
      let xComparison = this._xComparison;
      let xBiggerThan = xComparison - 1;
      let lastLine2 = this._lastLine;
      for (let x = 0; x < byteWidth; x++) {
        let rawByte = rawData[1 + x];
        let f3Up = lastLine2 ? lastLine2[x] : 0;
        let f3Left = x > xBiggerThan ? unfilteredLine[x - xComparison] : 0;
        let f3Add = Math.floor((f3Left + f3Up) / 2);
        unfilteredLine[x] = rawByte + f3Add;
      }
    };
    Filter.prototype._unFilterType4 = function(rawData, unfilteredLine, byteWidth) {
      let xComparison = this._xComparison;
      let xBiggerThan = xComparison - 1;
      let lastLine2 = this._lastLine;
      for (let x = 0; x < byteWidth; x++) {
        let rawByte = rawData[1 + x];
        let f4Up = lastLine2 ? lastLine2[x] : 0;
        let f4Left = x > xBiggerThan ? unfilteredLine[x - xComparison] : 0;
        let f4UpLeft = x > xBiggerThan && lastLine2 ? lastLine2[x - xComparison] : 0;
        let f4Add = paethPredictor(f4Left, f4Up, f4UpLeft);
        unfilteredLine[x] = rawByte + f4Add;
      }
    };
    Filter.prototype._reverseFilterLine = function(rawData) {
      let filter = rawData[0];
      let unfilteredLine;
      let currentImage = this._images[this._imageIndex];
      let byteWidth = currentImage.byteWidth;
      if (filter === 0) {
        unfilteredLine = rawData.slice(1, byteWidth + 1);
      } else {
        unfilteredLine = Buffer.alloc(byteWidth);
        switch (filter) {
          case 1:
            this._unFilterType1(rawData, unfilteredLine, byteWidth);
            break;
          case 2:
            this._unFilterType2(rawData, unfilteredLine, byteWidth);
            break;
          case 3:
            this._unFilterType3(rawData, unfilteredLine, byteWidth);
            break;
          case 4:
            this._unFilterType4(rawData, unfilteredLine, byteWidth);
            break;
          default:
            throw new Error("Unrecognised filter type - " + filter);
        }
      }
      this.write(unfilteredLine);
      currentImage.lineIndex++;
      if (currentImage.lineIndex >= currentImage.height) {
        this._lastLine = null;
        this._imageIndex++;
        currentImage = this._images[this._imageIndex];
      } else {
        this._lastLine = unfilteredLine;
      }
      if (currentImage) {
        this.read(currentImage.byteWidth + 1, this._reverseFilterLine.bind(this));
      } else {
        this._lastLine = null;
        this.complete();
      }
    };
  }
});

// ../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/filter-parse-async.js
var require_filter_parse_async = __commonJS({
  "../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/filter-parse-async.js"(exports, module) {
    "use strict";
    var util = __require("util");
    var ChunkStream = require_chunkstream();
    var Filter = require_filter_parse();
    var FilterAsync = module.exports = function(bitmapInfo) {
      ChunkStream.call(this);
      let buffers = [];
      let that = this;
      this._filter = new Filter(bitmapInfo, {
        read: this.read.bind(this),
        write: function(buffer) {
          buffers.push(buffer);
        },
        complete: function() {
          that.emit("complete", Buffer.concat(buffers));
        }
      });
      this._filter.start();
    };
    util.inherits(FilterAsync, ChunkStream);
  }
});

// ../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/constants.js
var require_constants = __commonJS({
  "../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/constants.js"(exports, module) {
    "use strict";
    module.exports = {
      PNG_SIGNATURE: [137, 80, 78, 71, 13, 10, 26, 10],
      TYPE_IHDR: 1229472850,
      TYPE_IEND: 1229278788,
      TYPE_IDAT: 1229209940,
      TYPE_PLTE: 1347179589,
      TYPE_tRNS: 1951551059,
      // eslint-disable-line camelcase
      TYPE_gAMA: 1732332865,
      // eslint-disable-line camelcase
      // color-type bits
      COLORTYPE_GRAYSCALE: 0,
      COLORTYPE_PALETTE: 1,
      COLORTYPE_COLOR: 2,
      COLORTYPE_ALPHA: 4,
      // e.g. grayscale and alpha
      // color-type combinations
      COLORTYPE_PALETTE_COLOR: 3,
      COLORTYPE_COLOR_ALPHA: 6,
      COLORTYPE_TO_BPP_MAP: {
        0: 1,
        2: 3,
        3: 1,
        4: 2,
        6: 4
      },
      GAMMA_DIVISION: 1e5
    };
  }
});

// ../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/crc.js
var require_crc = __commonJS({
  "../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/crc.js"(exports, module) {
    "use strict";
    var crcTable = [];
    (function() {
      for (let i = 0; i < 256; i++) {
        let currentCrc = i;
        for (let j = 0; j < 8; j++) {
          if (currentCrc & 1) {
            currentCrc = 3988292384 ^ currentCrc >>> 1;
          } else {
            currentCrc = currentCrc >>> 1;
          }
        }
        crcTable[i] = currentCrc;
      }
    })();
    var CrcCalculator = module.exports = function() {
      this._crc = -1;
    };
    CrcCalculator.prototype.write = function(data) {
      for (let i = 0; i < data.length; i++) {
        this._crc = crcTable[(this._crc ^ data[i]) & 255] ^ this._crc >>> 8;
      }
      return true;
    };
    CrcCalculator.prototype.crc32 = function() {
      return this._crc ^ -1;
    };
    CrcCalculator.crc32 = function(buf) {
      let crc = -1;
      for (let i = 0; i < buf.length; i++) {
        crc = crcTable[(crc ^ buf[i]) & 255] ^ crc >>> 8;
      }
      return crc ^ -1;
    };
  }
});

// ../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/parser.js
var require_parser = __commonJS({
  "../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/parser.js"(exports, module) {
    "use strict";
    var constants = require_constants();
    var CrcCalculator = require_crc();
    var Parser = module.exports = function(options, dependencies) {
      this._options = options;
      options.checkCRC = options.checkCRC !== false;
      this._hasIHDR = false;
      this._hasIEND = false;
      this._emittedHeadersFinished = false;
      this._palette = [];
      this._colorType = 0;
      this._chunks = {};
      this._chunks[constants.TYPE_IHDR] = this._handleIHDR.bind(this);
      this._chunks[constants.TYPE_IEND] = this._handleIEND.bind(this);
      this._chunks[constants.TYPE_IDAT] = this._handleIDAT.bind(this);
      this._chunks[constants.TYPE_PLTE] = this._handlePLTE.bind(this);
      this._chunks[constants.TYPE_tRNS] = this._handleTRNS.bind(this);
      this._chunks[constants.TYPE_gAMA] = this._handleGAMA.bind(this);
      this.read = dependencies.read;
      this.error = dependencies.error;
      this.metadata = dependencies.metadata;
      this.gamma = dependencies.gamma;
      this.transColor = dependencies.transColor;
      this.palette = dependencies.palette;
      this.parsed = dependencies.parsed;
      this.inflateData = dependencies.inflateData;
      this.finished = dependencies.finished;
      this.simpleTransparency = dependencies.simpleTransparency;
      this.headersFinished = dependencies.headersFinished || function() {
      };
    };
    Parser.prototype.start = function() {
      this.read(constants.PNG_SIGNATURE.length, this._parseSignature.bind(this));
    };
    Parser.prototype._parseSignature = function(data) {
      let signature = constants.PNG_SIGNATURE;
      for (let i = 0; i < signature.length; i++) {
        if (data[i] !== signature[i]) {
          this.error(new Error("Invalid file signature"));
          return;
        }
      }
      this.read(8, this._parseChunkBegin.bind(this));
    };
    Parser.prototype._parseChunkBegin = function(data) {
      let length = data.readUInt32BE(0);
      let type = data.readUInt32BE(4);
      let name = "";
      for (let i = 4; i < 8; i++) {
        name += String.fromCharCode(data[i]);
      }
      let ancillary = Boolean(data[4] & 32);
      if (!this._hasIHDR && type !== constants.TYPE_IHDR) {
        this.error(new Error("Expected IHDR on beggining"));
        return;
      }
      this._crc = new CrcCalculator();
      this._crc.write(Buffer.from(name));
      if (this._chunks[type]) {
        return this._chunks[type](length);
      }
      if (!ancillary) {
        this.error(new Error("Unsupported critical chunk type " + name));
        return;
      }
      this.read(length + 4, this._skipChunk.bind(this));
    };
    Parser.prototype._skipChunk = function() {
      this.read(8, this._parseChunkBegin.bind(this));
    };
    Parser.prototype._handleChunkEnd = function() {
      this.read(4, this._parseChunkEnd.bind(this));
    };
    Parser.prototype._parseChunkEnd = function(data) {
      let fileCrc = data.readInt32BE(0);
      let calcCrc = this._crc.crc32();
      if (this._options.checkCRC && calcCrc !== fileCrc) {
        this.error(new Error("Crc error - " + fileCrc + " - " + calcCrc));
        return;
      }
      if (!this._hasIEND) {
        this.read(8, this._parseChunkBegin.bind(this));
      }
    };
    Parser.prototype._handleIHDR = function(length) {
      this.read(length, this._parseIHDR.bind(this));
    };
    Parser.prototype._parseIHDR = function(data) {
      this._crc.write(data);
      let width = data.readUInt32BE(0);
      let height = data.readUInt32BE(4);
      let depth = data[8];
      let colorType = data[9];
      let compr = data[10];
      let filter = data[11];
      let interlace = data[12];
      if (depth !== 8 && depth !== 4 && depth !== 2 && depth !== 1 && depth !== 16) {
        this.error(new Error("Unsupported bit depth " + depth));
        return;
      }
      if (!(colorType in constants.COLORTYPE_TO_BPP_MAP)) {
        this.error(new Error("Unsupported color type"));
        return;
      }
      if (compr !== 0) {
        this.error(new Error("Unsupported compression method"));
        return;
      }
      if (filter !== 0) {
        this.error(new Error("Unsupported filter method"));
        return;
      }
      if (interlace !== 0 && interlace !== 1) {
        this.error(new Error("Unsupported interlace method"));
        return;
      }
      this._colorType = colorType;
      let bpp = constants.COLORTYPE_TO_BPP_MAP[this._colorType];
      this._hasIHDR = true;
      this.metadata({
        width,
        height,
        depth,
        interlace: Boolean(interlace),
        palette: Boolean(colorType & constants.COLORTYPE_PALETTE),
        color: Boolean(colorType & constants.COLORTYPE_COLOR),
        alpha: Boolean(colorType & constants.COLORTYPE_ALPHA),
        bpp,
        colorType
      });
      this._handleChunkEnd();
    };
    Parser.prototype._handlePLTE = function(length) {
      this.read(length, this._parsePLTE.bind(this));
    };
    Parser.prototype._parsePLTE = function(data) {
      this._crc.write(data);
      let entries = Math.floor(data.length / 3);
      for (let i = 0; i < entries; i++) {
        this._palette.push([data[i * 3], data[i * 3 + 1], data[i * 3 + 2], 255]);
      }
      this.palette(this._palette);
      this._handleChunkEnd();
    };
    Parser.prototype._handleTRNS = function(length) {
      this.simpleTransparency();
      this.read(length, this._parseTRNS.bind(this));
    };
    Parser.prototype._parseTRNS = function(data) {
      this._crc.write(data);
      if (this._colorType === constants.COLORTYPE_PALETTE_COLOR) {
        if (this._palette.length === 0) {
          this.error(new Error("Transparency chunk must be after palette"));
          return;
        }
        if (data.length > this._palette.length) {
          this.error(new Error("More transparent colors than palette size"));
          return;
        }
        for (let i = 0; i < data.length; i++) {
          this._palette[i][3] = data[i];
        }
        this.palette(this._palette);
      }
      if (this._colorType === constants.COLORTYPE_GRAYSCALE) {
        this.transColor([data.readUInt16BE(0)]);
      }
      if (this._colorType === constants.COLORTYPE_COLOR) {
        this.transColor([
          data.readUInt16BE(0),
          data.readUInt16BE(2),
          data.readUInt16BE(4)
        ]);
      }
      this._handleChunkEnd();
    };
    Parser.prototype._handleGAMA = function(length) {
      this.read(length, this._parseGAMA.bind(this));
    };
    Parser.prototype._parseGAMA = function(data) {
      this._crc.write(data);
      this.gamma(data.readUInt32BE(0) / constants.GAMMA_DIVISION);
      this._handleChunkEnd();
    };
    Parser.prototype._handleIDAT = function(length) {
      if (!this._emittedHeadersFinished) {
        this._emittedHeadersFinished = true;
        this.headersFinished();
      }
      this.read(-length, this._parseIDAT.bind(this, length));
    };
    Parser.prototype._parseIDAT = function(length, data) {
      this._crc.write(data);
      if (this._colorType === constants.COLORTYPE_PALETTE_COLOR && this._palette.length === 0) {
        throw new Error("Expected palette not found");
      }
      this.inflateData(data);
      let leftOverLength = length - data.length;
      if (leftOverLength > 0) {
        this._handleIDAT(leftOverLength);
      } else {
        this._handleChunkEnd();
      }
    };
    Parser.prototype._handleIEND = function(length) {
      this.read(length, this._parseIEND.bind(this));
    };
    Parser.prototype._parseIEND = function(data) {
      this._crc.write(data);
      this._hasIEND = true;
      this._handleChunkEnd();
      if (this.finished) {
        this.finished();
      }
    };
  }
});

// ../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/bitmapper.js
var require_bitmapper = __commonJS({
  "../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/bitmapper.js"(exports) {
    "use strict";
    var interlaceUtils = require_interlace();
    var pixelBppMapper = [
      // 0 - dummy entry
      function() {
      },
      // 1 - L
      // 0: 0, 1: 0, 2: 0, 3: 0xff
      function(pxData, data, pxPos, rawPos) {
        if (rawPos === data.length) {
          throw new Error("Ran out of data");
        }
        let pixel = data[rawPos];
        pxData[pxPos] = pixel;
        pxData[pxPos + 1] = pixel;
        pxData[pxPos + 2] = pixel;
        pxData[pxPos + 3] = 255;
      },
      // 2 - LA
      // 0: 0, 1: 0, 2: 0, 3: 1
      function(pxData, data, pxPos, rawPos) {
        if (rawPos + 1 >= data.length) {
          throw new Error("Ran out of data");
        }
        let pixel = data[rawPos];
        pxData[pxPos] = pixel;
        pxData[pxPos + 1] = pixel;
        pxData[pxPos + 2] = pixel;
        pxData[pxPos + 3] = data[rawPos + 1];
      },
      // 3 - RGB
      // 0: 0, 1: 1, 2: 2, 3: 0xff
      function(pxData, data, pxPos, rawPos) {
        if (rawPos + 2 >= data.length) {
          throw new Error("Ran out of data");
        }
        pxData[pxPos] = data[rawPos];
        pxData[pxPos + 1] = data[rawPos + 1];
        pxData[pxPos + 2] = data[rawPos + 2];
        pxData[pxPos + 3] = 255;
      },
      // 4 - RGBA
      // 0: 0, 1: 1, 2: 2, 3: 3
      function(pxData, data, pxPos, rawPos) {
        if (rawPos + 3 >= data.length) {
          throw new Error("Ran out of data");
        }
        pxData[pxPos] = data[rawPos];
        pxData[pxPos + 1] = data[rawPos + 1];
        pxData[pxPos + 2] = data[rawPos + 2];
        pxData[pxPos + 3] = data[rawPos + 3];
      }
    ];
    var pixelBppCustomMapper = [
      // 0 - dummy entry
      function() {
      },
      // 1 - L
      // 0: 0, 1: 0, 2: 0, 3: 0xff
      function(pxData, pixelData, pxPos, maxBit) {
        let pixel = pixelData[0];
        pxData[pxPos] = pixel;
        pxData[pxPos + 1] = pixel;
        pxData[pxPos + 2] = pixel;
        pxData[pxPos + 3] = maxBit;
      },
      // 2 - LA
      // 0: 0, 1: 0, 2: 0, 3: 1
      function(pxData, pixelData, pxPos) {
        let pixel = pixelData[0];
        pxData[pxPos] = pixel;
        pxData[pxPos + 1] = pixel;
        pxData[pxPos + 2] = pixel;
        pxData[pxPos + 3] = pixelData[1];
      },
      // 3 - RGB
      // 0: 0, 1: 1, 2: 2, 3: 0xff
      function(pxData, pixelData, pxPos, maxBit) {
        pxData[pxPos] = pixelData[0];
        pxData[pxPos + 1] = pixelData[1];
        pxData[pxPos + 2] = pixelData[2];
        pxData[pxPos + 3] = maxBit;
      },
      // 4 - RGBA
      // 0: 0, 1: 1, 2: 2, 3: 3
      function(pxData, pixelData, pxPos) {
        pxData[pxPos] = pixelData[0];
        pxData[pxPos + 1] = pixelData[1];
        pxData[pxPos + 2] = pixelData[2];
        pxData[pxPos + 3] = pixelData[3];
      }
    ];
    function bitRetriever(data, depth) {
      let leftOver = [];
      let i = 0;
      function split() {
        if (i === data.length) {
          throw new Error("Ran out of data");
        }
        let byte = data[i];
        i++;
        let byte8, byte7, byte6, byte5, byte4, byte3, byte2, byte1;
        switch (depth) {
          default:
            throw new Error("unrecognised depth");
          case 16:
            byte2 = data[i];
            i++;
            leftOver.push((byte << 8) + byte2);
            break;
          case 4:
            byte2 = byte & 15;
            byte1 = byte >> 4;
            leftOver.push(byte1, byte2);
            break;
          case 2:
            byte4 = byte & 3;
            byte3 = byte >> 2 & 3;
            byte2 = byte >> 4 & 3;
            byte1 = byte >> 6 & 3;
            leftOver.push(byte1, byte2, byte3, byte4);
            break;
          case 1:
            byte8 = byte & 1;
            byte7 = byte >> 1 & 1;
            byte6 = byte >> 2 & 1;
            byte5 = byte >> 3 & 1;
            byte4 = byte >> 4 & 1;
            byte3 = byte >> 5 & 1;
            byte2 = byte >> 6 & 1;
            byte1 = byte >> 7 & 1;
            leftOver.push(byte1, byte2, byte3, byte4, byte5, byte6, byte7, byte8);
            break;
        }
      }
      return {
        get: function(count) {
          while (leftOver.length < count) {
            split();
          }
          let returner = leftOver.slice(0, count);
          leftOver = leftOver.slice(count);
          return returner;
        },
        resetAfterLine: function() {
          leftOver.length = 0;
        },
        end: function() {
          if (i !== data.length) {
            throw new Error("extra data found");
          }
        }
      };
    }
    function mapImage8Bit(image, pxData, getPxPos, bpp, data, rawPos) {
      let imageWidth = image.width;
      let imageHeight = image.height;
      let imagePass = image.index;
      for (let y = 0; y < imageHeight; y++) {
        for (let x = 0; x < imageWidth; x++) {
          let pxPos = getPxPos(x, y, imagePass);
          pixelBppMapper[bpp](pxData, data, pxPos, rawPos);
          rawPos += bpp;
        }
      }
      return rawPos;
    }
    function mapImageCustomBit(image, pxData, getPxPos, bpp, bits, maxBit) {
      let imageWidth = image.width;
      let imageHeight = image.height;
      let imagePass = image.index;
      for (let y = 0; y < imageHeight; y++) {
        for (let x = 0; x < imageWidth; x++) {
          let pixelData = bits.get(bpp);
          let pxPos = getPxPos(x, y, imagePass);
          pixelBppCustomMapper[bpp](pxData, pixelData, pxPos, maxBit);
        }
        bits.resetAfterLine();
      }
    }
    exports.dataToBitMap = function(data, bitmapInfo) {
      let width = bitmapInfo.width;
      let height = bitmapInfo.height;
      let depth = bitmapInfo.depth;
      let bpp = bitmapInfo.bpp;
      let interlace = bitmapInfo.interlace;
      let bits;
      if (depth !== 8) {
        bits = bitRetriever(data, depth);
      }
      let pxData;
      if (depth <= 8) {
        pxData = Buffer.alloc(width * height * 4);
      } else {
        pxData = new Uint16Array(width * height * 4);
      }
      let maxBit = Math.pow(2, depth) - 1;
      let rawPos = 0;
      let images;
      let getPxPos;
      if (interlace) {
        images = interlaceUtils.getImagePasses(width, height);
        getPxPos = interlaceUtils.getInterlaceIterator(width, height);
      } else {
        let nonInterlacedPxPos = 0;
        getPxPos = function() {
          let returner = nonInterlacedPxPos;
          nonInterlacedPxPos += 4;
          return returner;
        };
        images = [{ width, height }];
      }
      for (let imageIndex = 0; imageIndex < images.length; imageIndex++) {
        if (depth === 8) {
          rawPos = mapImage8Bit(
            images[imageIndex],
            pxData,
            getPxPos,
            bpp,
            data,
            rawPos
          );
        } else {
          mapImageCustomBit(
            images[imageIndex],
            pxData,
            getPxPos,
            bpp,
            bits,
            maxBit
          );
        }
      }
      if (depth === 8) {
        if (rawPos !== data.length) {
          throw new Error("extra data found");
        }
      } else {
        bits.end();
      }
      return pxData;
    };
  }
});

// ../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/format-normaliser.js
var require_format_normaliser = __commonJS({
  "../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/format-normaliser.js"(exports, module) {
    "use strict";
    function dePalette(indata, outdata, width, height, palette) {
      let pxPos = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let color = palette[indata[pxPos]];
          if (!color) {
            throw new Error("index " + indata[pxPos] + " not in palette");
          }
          for (let i = 0; i < 4; i++) {
            outdata[pxPos + i] = color[i];
          }
          pxPos += 4;
        }
      }
    }
    function replaceTransparentColor(indata, outdata, width, height, transColor) {
      let pxPos = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let makeTrans = false;
          if (transColor.length === 1) {
            if (transColor[0] === indata[pxPos]) {
              makeTrans = true;
            }
          } else if (transColor[0] === indata[pxPos] && transColor[1] === indata[pxPos + 1] && transColor[2] === indata[pxPos + 2]) {
            makeTrans = true;
          }
          if (makeTrans) {
            for (let i = 0; i < 4; i++) {
              outdata[pxPos + i] = 0;
            }
          }
          pxPos += 4;
        }
      }
    }
    function scaleDepth(indata, outdata, width, height, depth) {
      let maxOutSample = 255;
      let maxInSample = Math.pow(2, depth) - 1;
      let pxPos = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          for (let i = 0; i < 4; i++) {
            outdata[pxPos + i] = Math.floor(
              indata[pxPos + i] * maxOutSample / maxInSample + 0.5
            );
          }
          pxPos += 4;
        }
      }
    }
    module.exports = function(indata, imageData) {
      let depth = imageData.depth;
      let width = imageData.width;
      let height = imageData.height;
      let colorType = imageData.colorType;
      let transColor = imageData.transColor;
      let palette = imageData.palette;
      let outdata = indata;
      if (colorType === 3) {
        dePalette(indata, outdata, width, height, palette);
      } else {
        if (transColor) {
          replaceTransparentColor(indata, outdata, width, height, transColor);
        }
        if (depth !== 8) {
          if (depth === 16) {
            outdata = Buffer.alloc(width * height * 4);
          }
          scaleDepth(indata, outdata, width, height, depth);
        }
      }
      return outdata;
    };
  }
});

// ../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/parser-async.js
var require_parser_async = __commonJS({
  "../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/parser-async.js"(exports, module) {
    "use strict";
    var util = __require("util");
    var zlib = __require("zlib");
    var ChunkStream = require_chunkstream();
    var FilterAsync = require_filter_parse_async();
    var Parser = require_parser();
    var bitmapper = require_bitmapper();
    var formatNormaliser = require_format_normaliser();
    var ParserAsync = module.exports = function(options) {
      ChunkStream.call(this);
      this._parser = new Parser(options, {
        read: this.read.bind(this),
        error: this._handleError.bind(this),
        metadata: this._handleMetaData.bind(this),
        gamma: this.emit.bind(this, "gamma"),
        palette: this._handlePalette.bind(this),
        transColor: this._handleTransColor.bind(this),
        finished: this._finished.bind(this),
        inflateData: this._inflateData.bind(this),
        simpleTransparency: this._simpleTransparency.bind(this),
        headersFinished: this._headersFinished.bind(this)
      });
      this._options = options;
      this.writable = true;
      this._parser.start();
    };
    util.inherits(ParserAsync, ChunkStream);
    ParserAsync.prototype._handleError = function(err) {
      this.emit("error", err);
      this.writable = false;
      this.destroy();
      if (this._inflate && this._inflate.destroy) {
        this._inflate.destroy();
      }
      if (this._filter) {
        this._filter.destroy();
        this._filter.on("error", function() {
        });
      }
      this.errord = true;
    };
    ParserAsync.prototype._inflateData = function(data) {
      if (!this._inflate) {
        if (this._bitmapInfo.interlace) {
          this._inflate = zlib.createInflate();
          this._inflate.on("error", this.emit.bind(this, "error"));
          this._filter.on("complete", this._complete.bind(this));
          this._inflate.pipe(this._filter);
        } else {
          let rowSize = (this._bitmapInfo.width * this._bitmapInfo.bpp * this._bitmapInfo.depth + 7 >> 3) + 1;
          let imageSize = rowSize * this._bitmapInfo.height;
          let chunkSize = Math.max(imageSize, zlib.Z_MIN_CHUNK);
          this._inflate = zlib.createInflate({ chunkSize });
          let leftToInflate = imageSize;
          let emitError = this.emit.bind(this, "error");
          this._inflate.on("error", function(err) {
            if (!leftToInflate) {
              return;
            }
            emitError(err);
          });
          this._filter.on("complete", this._complete.bind(this));
          let filterWrite = this._filter.write.bind(this._filter);
          this._inflate.on("data", function(chunk) {
            if (!leftToInflate) {
              return;
            }
            if (chunk.length > leftToInflate) {
              chunk = chunk.slice(0, leftToInflate);
            }
            leftToInflate -= chunk.length;
            filterWrite(chunk);
          });
          this._inflate.on("end", this._filter.end.bind(this._filter));
        }
      }
      this._inflate.write(data);
    };
    ParserAsync.prototype._handleMetaData = function(metaData) {
      this._metaData = metaData;
      this._bitmapInfo = Object.create(metaData);
      this._filter = new FilterAsync(this._bitmapInfo);
    };
    ParserAsync.prototype._handleTransColor = function(transColor) {
      this._bitmapInfo.transColor = transColor;
    };
    ParserAsync.prototype._handlePalette = function(palette) {
      this._bitmapInfo.palette = palette;
    };
    ParserAsync.prototype._simpleTransparency = function() {
      this._metaData.alpha = true;
    };
    ParserAsync.prototype._headersFinished = function() {
      this.emit("metadata", this._metaData);
    };
    ParserAsync.prototype._finished = function() {
      if (this.errord) {
        return;
      }
      if (!this._inflate) {
        this.emit("error", "No Inflate block");
      } else {
        this._inflate.end();
      }
    };
    ParserAsync.prototype._complete = function(filteredData) {
      if (this.errord) {
        return;
      }
      let normalisedBitmapData;
      try {
        let bitmapData = bitmapper.dataToBitMap(filteredData, this._bitmapInfo);
        normalisedBitmapData = formatNormaliser(bitmapData, this._bitmapInfo);
        bitmapData = null;
      } catch (ex) {
        this._handleError(ex);
        return;
      }
      this.emit("parsed", normalisedBitmapData);
    };
  }
});

// ../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/bitpacker.js
var require_bitpacker = __commonJS({
  "../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/bitpacker.js"(exports, module) {
    "use strict";
    var constants = require_constants();
    module.exports = function(dataIn, width, height, options) {
      let outHasAlpha = [constants.COLORTYPE_COLOR_ALPHA, constants.COLORTYPE_ALPHA].indexOf(
        options.colorType
      ) !== -1;
      if (options.colorType === options.inputColorType) {
        let bigEndian = (function() {
          let buffer = new ArrayBuffer(2);
          new DataView(buffer).setInt16(
            0,
            256,
            true
            /* littleEndian */
          );
          return new Int16Array(buffer)[0] !== 256;
        })();
        if (options.bitDepth === 8 || options.bitDepth === 16 && bigEndian) {
          return dataIn;
        }
      }
      let data = options.bitDepth !== 16 ? dataIn : new Uint16Array(dataIn.buffer);
      let maxValue = 255;
      let inBpp = constants.COLORTYPE_TO_BPP_MAP[options.inputColorType];
      if (inBpp === 4 && !options.inputHasAlpha) {
        inBpp = 3;
      }
      let outBpp = constants.COLORTYPE_TO_BPP_MAP[options.colorType];
      if (options.bitDepth === 16) {
        maxValue = 65535;
        outBpp *= 2;
      }
      let outData = Buffer.alloc(width * height * outBpp);
      let inIndex = 0;
      let outIndex = 0;
      let bgColor = options.bgColor || {};
      if (bgColor.red === void 0) {
        bgColor.red = maxValue;
      }
      if (bgColor.green === void 0) {
        bgColor.green = maxValue;
      }
      if (bgColor.blue === void 0) {
        bgColor.blue = maxValue;
      }
      function getRGBA() {
        let red;
        let green;
        let blue;
        let alpha = maxValue;
        switch (options.inputColorType) {
          case constants.COLORTYPE_COLOR_ALPHA:
            alpha = data[inIndex + 3];
            red = data[inIndex];
            green = data[inIndex + 1];
            blue = data[inIndex + 2];
            break;
          case constants.COLORTYPE_COLOR:
            red = data[inIndex];
            green = data[inIndex + 1];
            blue = data[inIndex + 2];
            break;
          case constants.COLORTYPE_ALPHA:
            alpha = data[inIndex + 1];
            red = data[inIndex];
            green = red;
            blue = red;
            break;
          case constants.COLORTYPE_GRAYSCALE:
            red = data[inIndex];
            green = red;
            blue = red;
            break;
          default:
            throw new Error(
              "input color type:" + options.inputColorType + " is not supported at present"
            );
        }
        if (options.inputHasAlpha) {
          if (!outHasAlpha) {
            alpha /= maxValue;
            red = Math.min(
              Math.max(Math.round((1 - alpha) * bgColor.red + alpha * red), 0),
              maxValue
            );
            green = Math.min(
              Math.max(Math.round((1 - alpha) * bgColor.green + alpha * green), 0),
              maxValue
            );
            blue = Math.min(
              Math.max(Math.round((1 - alpha) * bgColor.blue + alpha * blue), 0),
              maxValue
            );
          }
        }
        return { red, green, blue, alpha };
      }
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let rgba = getRGBA(data, inIndex);
          switch (options.colorType) {
            case constants.COLORTYPE_COLOR_ALPHA:
            case constants.COLORTYPE_COLOR:
              if (options.bitDepth === 8) {
                outData[outIndex] = rgba.red;
                outData[outIndex + 1] = rgba.green;
                outData[outIndex + 2] = rgba.blue;
                if (outHasAlpha) {
                  outData[outIndex + 3] = rgba.alpha;
                }
              } else {
                outData.writeUInt16BE(rgba.red, outIndex);
                outData.writeUInt16BE(rgba.green, outIndex + 2);
                outData.writeUInt16BE(rgba.blue, outIndex + 4);
                if (outHasAlpha) {
                  outData.writeUInt16BE(rgba.alpha, outIndex + 6);
                }
              }
              break;
            case constants.COLORTYPE_ALPHA:
            case constants.COLORTYPE_GRAYSCALE: {
              let grayscale = (rgba.red + rgba.green + rgba.blue) / 3;
              if (options.bitDepth === 8) {
                outData[outIndex] = grayscale;
                if (outHasAlpha) {
                  outData[outIndex + 1] = rgba.alpha;
                }
              } else {
                outData.writeUInt16BE(grayscale, outIndex);
                if (outHasAlpha) {
                  outData.writeUInt16BE(rgba.alpha, outIndex + 2);
                }
              }
              break;
            }
            default:
              throw new Error("unrecognised color Type " + options.colorType);
          }
          inIndex += inBpp;
          outIndex += outBpp;
        }
      }
      return outData;
    };
  }
});

// ../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/filter-pack.js
var require_filter_pack = __commonJS({
  "../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/filter-pack.js"(exports, module) {
    "use strict";
    var paethPredictor = require_paeth_predictor();
    function filterNone(pxData, pxPos, byteWidth, rawData, rawPos) {
      for (let x = 0; x < byteWidth; x++) {
        rawData[rawPos + x] = pxData[pxPos + x];
      }
    }
    function filterSumNone(pxData, pxPos, byteWidth) {
      let sum = 0;
      let length = pxPos + byteWidth;
      for (let i = pxPos; i < length; i++) {
        sum += Math.abs(pxData[i]);
      }
      return sum;
    }
    function filterSub(pxData, pxPos, byteWidth, rawData, rawPos, bpp) {
      for (let x = 0; x < byteWidth; x++) {
        let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
        let val = pxData[pxPos + x] - left;
        rawData[rawPos + x] = val;
      }
    }
    function filterSumSub(pxData, pxPos, byteWidth, bpp) {
      let sum = 0;
      for (let x = 0; x < byteWidth; x++) {
        let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
        let val = pxData[pxPos + x] - left;
        sum += Math.abs(val);
      }
      return sum;
    }
    function filterUp(pxData, pxPos, byteWidth, rawData, rawPos) {
      for (let x = 0; x < byteWidth; x++) {
        let up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
        let val = pxData[pxPos + x] - up;
        rawData[rawPos + x] = val;
      }
    }
    function filterSumUp(pxData, pxPos, byteWidth) {
      let sum = 0;
      let length = pxPos + byteWidth;
      for (let x = pxPos; x < length; x++) {
        let up = pxPos > 0 ? pxData[x - byteWidth] : 0;
        let val = pxData[x] - up;
        sum += Math.abs(val);
      }
      return sum;
    }
    function filterAvg(pxData, pxPos, byteWidth, rawData, rawPos, bpp) {
      for (let x = 0; x < byteWidth; x++) {
        let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
        let up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
        let val = pxData[pxPos + x] - (left + up >> 1);
        rawData[rawPos + x] = val;
      }
    }
    function filterSumAvg(pxData, pxPos, byteWidth, bpp) {
      let sum = 0;
      for (let x = 0; x < byteWidth; x++) {
        let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
        let up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
        let val = pxData[pxPos + x] - (left + up >> 1);
        sum += Math.abs(val);
      }
      return sum;
    }
    function filterPaeth(pxData, pxPos, byteWidth, rawData, rawPos, bpp) {
      for (let x = 0; x < byteWidth; x++) {
        let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
        let up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
        let upleft = pxPos > 0 && x >= bpp ? pxData[pxPos + x - (byteWidth + bpp)] : 0;
        let val = pxData[pxPos + x] - paethPredictor(left, up, upleft);
        rawData[rawPos + x] = val;
      }
    }
    function filterSumPaeth(pxData, pxPos, byteWidth, bpp) {
      let sum = 0;
      for (let x = 0; x < byteWidth; x++) {
        let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
        let up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
        let upleft = pxPos > 0 && x >= bpp ? pxData[pxPos + x - (byteWidth + bpp)] : 0;
        let val = pxData[pxPos + x] - paethPredictor(left, up, upleft);
        sum += Math.abs(val);
      }
      return sum;
    }
    var filters = {
      0: filterNone,
      1: filterSub,
      2: filterUp,
      3: filterAvg,
      4: filterPaeth
    };
    var filterSums = {
      0: filterSumNone,
      1: filterSumSub,
      2: filterSumUp,
      3: filterSumAvg,
      4: filterSumPaeth
    };
    module.exports = function(pxData, width, height, options, bpp) {
      let filterTypes;
      if (!("filterType" in options) || options.filterType === -1) {
        filterTypes = [0, 1, 2, 3, 4];
      } else if (typeof options.filterType === "number") {
        filterTypes = [options.filterType];
      } else {
        throw new Error("unrecognised filter types");
      }
      if (options.bitDepth === 16) {
        bpp *= 2;
      }
      let byteWidth = width * bpp;
      let rawPos = 0;
      let pxPos = 0;
      let rawData = Buffer.alloc((byteWidth + 1) * height);
      let sel = filterTypes[0];
      for (let y = 0; y < height; y++) {
        if (filterTypes.length > 1) {
          let min = Infinity;
          for (let i = 0; i < filterTypes.length; i++) {
            let sum = filterSums[filterTypes[i]](pxData, pxPos, byteWidth, bpp);
            if (sum < min) {
              sel = filterTypes[i];
              min = sum;
            }
          }
        }
        rawData[rawPos] = sel;
        rawPos++;
        filters[sel](pxData, pxPos, byteWidth, rawData, rawPos, bpp);
        rawPos += byteWidth;
        pxPos += byteWidth;
      }
      return rawData;
    };
  }
});

// ../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/packer.js
var require_packer = __commonJS({
  "../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/packer.js"(exports, module) {
    "use strict";
    var constants = require_constants();
    var CrcStream = require_crc();
    var bitPacker = require_bitpacker();
    var filter = require_filter_pack();
    var zlib = __require("zlib");
    var Packer = module.exports = function(options) {
      this._options = options;
      options.deflateChunkSize = options.deflateChunkSize || 32 * 1024;
      options.deflateLevel = options.deflateLevel != null ? options.deflateLevel : 9;
      options.deflateStrategy = options.deflateStrategy != null ? options.deflateStrategy : 3;
      options.inputHasAlpha = options.inputHasAlpha != null ? options.inputHasAlpha : true;
      options.deflateFactory = options.deflateFactory || zlib.createDeflate;
      options.bitDepth = options.bitDepth || 8;
      options.colorType = typeof options.colorType === "number" ? options.colorType : constants.COLORTYPE_COLOR_ALPHA;
      options.inputColorType = typeof options.inputColorType === "number" ? options.inputColorType : constants.COLORTYPE_COLOR_ALPHA;
      if ([
        constants.COLORTYPE_GRAYSCALE,
        constants.COLORTYPE_COLOR,
        constants.COLORTYPE_COLOR_ALPHA,
        constants.COLORTYPE_ALPHA
      ].indexOf(options.colorType) === -1) {
        throw new Error(
          "option color type:" + options.colorType + " is not supported at present"
        );
      }
      if ([
        constants.COLORTYPE_GRAYSCALE,
        constants.COLORTYPE_COLOR,
        constants.COLORTYPE_COLOR_ALPHA,
        constants.COLORTYPE_ALPHA
      ].indexOf(options.inputColorType) === -1) {
        throw new Error(
          "option input color type:" + options.inputColorType + " is not supported at present"
        );
      }
      if (options.bitDepth !== 8 && options.bitDepth !== 16) {
        throw new Error(
          "option bit depth:" + options.bitDepth + " is not supported at present"
        );
      }
    };
    Packer.prototype.getDeflateOptions = function() {
      return {
        chunkSize: this._options.deflateChunkSize,
        level: this._options.deflateLevel,
        strategy: this._options.deflateStrategy
      };
    };
    Packer.prototype.createDeflate = function() {
      return this._options.deflateFactory(this.getDeflateOptions());
    };
    Packer.prototype.filterData = function(data, width, height) {
      let packedData = bitPacker(data, width, height, this._options);
      let bpp = constants.COLORTYPE_TO_BPP_MAP[this._options.colorType];
      let filteredData = filter(packedData, width, height, this._options, bpp);
      return filteredData;
    };
    Packer.prototype._packChunk = function(type, data) {
      let len = data ? data.length : 0;
      let buf = Buffer.alloc(len + 12);
      buf.writeUInt32BE(len, 0);
      buf.writeUInt32BE(type, 4);
      if (data) {
        data.copy(buf, 8);
      }
      buf.writeInt32BE(
        CrcStream.crc32(buf.slice(4, buf.length - 4)),
        buf.length - 4
      );
      return buf;
    };
    Packer.prototype.packGAMA = function(gamma) {
      let buf = Buffer.alloc(4);
      buf.writeUInt32BE(Math.floor(gamma * constants.GAMMA_DIVISION), 0);
      return this._packChunk(constants.TYPE_gAMA, buf);
    };
    Packer.prototype.packIHDR = function(width, height) {
      let buf = Buffer.alloc(13);
      buf.writeUInt32BE(width, 0);
      buf.writeUInt32BE(height, 4);
      buf[8] = this._options.bitDepth;
      buf[9] = this._options.colorType;
      buf[10] = 0;
      buf[11] = 0;
      buf[12] = 0;
      return this._packChunk(constants.TYPE_IHDR, buf);
    };
    Packer.prototype.packIDAT = function(data) {
      return this._packChunk(constants.TYPE_IDAT, data);
    };
    Packer.prototype.packIEND = function() {
      return this._packChunk(constants.TYPE_IEND, null);
    };
  }
});

// ../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/packer-async.js
var require_packer_async = __commonJS({
  "../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/packer-async.js"(exports, module) {
    "use strict";
    var util = __require("util");
    var Stream = __require("stream");
    var constants = require_constants();
    var Packer = require_packer();
    var PackerAsync = module.exports = function(opt) {
      Stream.call(this);
      let options = opt || {};
      this._packer = new Packer(options);
      this._deflate = this._packer.createDeflate();
      this.readable = true;
    };
    util.inherits(PackerAsync, Stream);
    PackerAsync.prototype.pack = function(data, width, height, gamma) {
      this.emit("data", Buffer.from(constants.PNG_SIGNATURE));
      this.emit("data", this._packer.packIHDR(width, height));
      if (gamma) {
        this.emit("data", this._packer.packGAMA(gamma));
      }
      let filteredData = this._packer.filterData(data, width, height);
      this._deflate.on("error", this.emit.bind(this, "error"));
      this._deflate.on(
        "data",
        function(compressedData) {
          this.emit("data", this._packer.packIDAT(compressedData));
        }.bind(this)
      );
      this._deflate.on(
        "end",
        function() {
          this.emit("data", this._packer.packIEND());
          this.emit("end");
        }.bind(this)
      );
      this._deflate.end(filteredData);
    };
  }
});

// ../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/sync-inflate.js
var require_sync_inflate = __commonJS({
  "../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/sync-inflate.js"(exports, module) {
    "use strict";
    var assert = __require("assert").ok;
    var zlib = __require("zlib");
    var util = __require("util");
    var kMaxLength = __require("buffer").kMaxLength;
    function Inflate(opts) {
      if (!(this instanceof Inflate)) {
        return new Inflate(opts);
      }
      if (opts && opts.chunkSize < zlib.Z_MIN_CHUNK) {
        opts.chunkSize = zlib.Z_MIN_CHUNK;
      }
      zlib.Inflate.call(this, opts);
      this._offset = this._offset === void 0 ? this._outOffset : this._offset;
      this._buffer = this._buffer || this._outBuffer;
      if (opts && opts.maxLength != null) {
        this._maxLength = opts.maxLength;
      }
    }
    function createInflate(opts) {
      return new Inflate(opts);
    }
    function _close(engine, callback) {
      if (callback) {
        process.nextTick(callback);
      }
      if (!engine._handle) {
        return;
      }
      engine._handle.close();
      engine._handle = null;
    }
    Inflate.prototype._processChunk = function(chunk, flushFlag, asyncCb) {
      if (typeof asyncCb === "function") {
        return zlib.Inflate._processChunk.call(this, chunk, flushFlag, asyncCb);
      }
      let self = this;
      let availInBefore = chunk && chunk.length;
      let availOutBefore = this._chunkSize - this._offset;
      let leftToInflate = this._maxLength;
      let inOff = 0;
      let buffers = [];
      let nread = 0;
      let error;
      this.on("error", function(err) {
        error = err;
      });
      function handleChunk(availInAfter, availOutAfter) {
        if (self._hadError) {
          return;
        }
        let have = availOutBefore - availOutAfter;
        assert(have >= 0, "have should not go down");
        if (have > 0) {
          let out = self._buffer.slice(self._offset, self._offset + have);
          self._offset += have;
          if (out.length > leftToInflate) {
            out = out.slice(0, leftToInflate);
          }
          buffers.push(out);
          nread += out.length;
          leftToInflate -= out.length;
          if (leftToInflate === 0) {
            return false;
          }
        }
        if (availOutAfter === 0 || self._offset >= self._chunkSize) {
          availOutBefore = self._chunkSize;
          self._offset = 0;
          self._buffer = Buffer.allocUnsafe(self._chunkSize);
        }
        if (availOutAfter === 0) {
          inOff += availInBefore - availInAfter;
          availInBefore = availInAfter;
          return true;
        }
        return false;
      }
      assert(this._handle, "zlib binding closed");
      let res;
      do {
        res = this._handle.writeSync(
          flushFlag,
          chunk,
          // in
          inOff,
          // in_off
          availInBefore,
          // in_len
          this._buffer,
          // out
          this._offset,
          //out_off
          availOutBefore
        );
        res = res || this._writeState;
      } while (!this._hadError && handleChunk(res[0], res[1]));
      if (this._hadError) {
        throw error;
      }
      if (nread >= kMaxLength) {
        _close(this);
        throw new RangeError(
          "Cannot create final Buffer. It would be larger than 0x" + kMaxLength.toString(16) + " bytes"
        );
      }
      let buf = Buffer.concat(buffers, nread);
      _close(this);
      return buf;
    };
    util.inherits(Inflate, zlib.Inflate);
    function zlibBufferSync(engine, buffer) {
      if (typeof buffer === "string") {
        buffer = Buffer.from(buffer);
      }
      if (!(buffer instanceof Buffer)) {
        throw new TypeError("Not a string or buffer");
      }
      let flushFlag = engine._finishFlushFlag;
      if (flushFlag == null) {
        flushFlag = zlib.Z_FINISH;
      }
      return engine._processChunk(buffer, flushFlag);
    }
    function inflateSync(buffer, opts) {
      return zlibBufferSync(new Inflate(opts), buffer);
    }
    module.exports = exports = inflateSync;
    exports.Inflate = Inflate;
    exports.createInflate = createInflate;
    exports.inflateSync = inflateSync;
  }
});

// ../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/sync-reader.js
var require_sync_reader = __commonJS({
  "../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/sync-reader.js"(exports, module) {
    "use strict";
    var SyncReader = module.exports = function(buffer) {
      this._buffer = buffer;
      this._reads = [];
    };
    SyncReader.prototype.read = function(length, callback) {
      this._reads.push({
        length: Math.abs(length),
        // if length < 0 then at most this length
        allowLess: length < 0,
        func: callback
      });
    };
    SyncReader.prototype.process = function() {
      while (this._reads.length > 0 && this._buffer.length) {
        let read = this._reads[0];
        if (this._buffer.length && (this._buffer.length >= read.length || read.allowLess)) {
          this._reads.shift();
          let buf = this._buffer;
          this._buffer = buf.slice(read.length);
          read.func.call(this, buf.slice(0, read.length));
        } else {
          break;
        }
      }
      if (this._reads.length > 0) {
        return new Error("There are some read requests waitng on finished stream");
      }
      if (this._buffer.length > 0) {
        return new Error("unrecognised content at end of stream");
      }
    };
  }
});

// ../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/filter-parse-sync.js
var require_filter_parse_sync = __commonJS({
  "../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/filter-parse-sync.js"(exports) {
    "use strict";
    var SyncReader = require_sync_reader();
    var Filter = require_filter_parse();
    exports.process = function(inBuffer, bitmapInfo) {
      let outBuffers = [];
      let reader = new SyncReader(inBuffer);
      let filter = new Filter(bitmapInfo, {
        read: reader.read.bind(reader),
        write: function(bufferPart) {
          outBuffers.push(bufferPart);
        },
        complete: function() {
        }
      });
      filter.start();
      reader.process();
      return Buffer.concat(outBuffers);
    };
  }
});

// ../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/parser-sync.js
var require_parser_sync = __commonJS({
  "../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/parser-sync.js"(exports, module) {
    "use strict";
    var hasSyncZlib = true;
    var zlib = __require("zlib");
    var inflateSync = require_sync_inflate();
    if (!zlib.deflateSync) {
      hasSyncZlib = false;
    }
    var SyncReader = require_sync_reader();
    var FilterSync = require_filter_parse_sync();
    var Parser = require_parser();
    var bitmapper = require_bitmapper();
    var formatNormaliser = require_format_normaliser();
    module.exports = function(buffer, options) {
      if (!hasSyncZlib) {
        throw new Error(
          "To use the sync capability of this library in old node versions, please pin pngjs to v2.3.0"
        );
      }
      let err;
      function handleError(_err_) {
        err = _err_;
      }
      let metaData;
      function handleMetaData(_metaData_) {
        metaData = _metaData_;
      }
      function handleTransColor(transColor) {
        metaData.transColor = transColor;
      }
      function handlePalette(palette) {
        metaData.palette = palette;
      }
      function handleSimpleTransparency() {
        metaData.alpha = true;
      }
      let gamma;
      function handleGamma(_gamma_) {
        gamma = _gamma_;
      }
      let inflateDataList = [];
      function handleInflateData(inflatedData2) {
        inflateDataList.push(inflatedData2);
      }
      let reader = new SyncReader(buffer);
      let parser = new Parser(options, {
        read: reader.read.bind(reader),
        error: handleError,
        metadata: handleMetaData,
        gamma: handleGamma,
        palette: handlePalette,
        transColor: handleTransColor,
        inflateData: handleInflateData,
        simpleTransparency: handleSimpleTransparency
      });
      parser.start();
      reader.process();
      if (err) {
        throw err;
      }
      let inflateData = Buffer.concat(inflateDataList);
      inflateDataList.length = 0;
      let inflatedData;
      if (metaData.interlace) {
        inflatedData = zlib.inflateSync(inflateData);
      } else {
        let rowSize = (metaData.width * metaData.bpp * metaData.depth + 7 >> 3) + 1;
        let imageSize = rowSize * metaData.height;
        inflatedData = inflateSync(inflateData, {
          chunkSize: imageSize,
          maxLength: imageSize
        });
      }
      inflateData = null;
      if (!inflatedData || !inflatedData.length) {
        throw new Error("bad png - invalid inflate data response");
      }
      let unfilteredData = FilterSync.process(inflatedData, metaData);
      inflateData = null;
      let bitmapData = bitmapper.dataToBitMap(unfilteredData, metaData);
      unfilteredData = null;
      let normalisedBitmapData = formatNormaliser(bitmapData, metaData);
      metaData.data = normalisedBitmapData;
      metaData.gamma = gamma || 0;
      return metaData;
    };
  }
});

// ../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/packer-sync.js
var require_packer_sync = __commonJS({
  "../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/packer-sync.js"(exports, module) {
    "use strict";
    var hasSyncZlib = true;
    var zlib = __require("zlib");
    if (!zlib.deflateSync) {
      hasSyncZlib = false;
    }
    var constants = require_constants();
    var Packer = require_packer();
    module.exports = function(metaData, opt) {
      if (!hasSyncZlib) {
        throw new Error(
          "To use the sync capability of this library in old node versions, please pin pngjs to v2.3.0"
        );
      }
      let options = opt || {};
      let packer = new Packer(options);
      let chunks = [];
      chunks.push(Buffer.from(constants.PNG_SIGNATURE));
      chunks.push(packer.packIHDR(metaData.width, metaData.height));
      if (metaData.gamma) {
        chunks.push(packer.packGAMA(metaData.gamma));
      }
      let filteredData = packer.filterData(
        metaData.data,
        metaData.width,
        metaData.height
      );
      let compressedData = zlib.deflateSync(
        filteredData,
        packer.getDeflateOptions()
      );
      filteredData = null;
      if (!compressedData || !compressedData.length) {
        throw new Error("bad png - invalid compressed data response");
      }
      chunks.push(packer.packIDAT(compressedData));
      chunks.push(packer.packIEND());
      return Buffer.concat(chunks);
    };
  }
});

// ../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/png-sync.js
var require_png_sync = __commonJS({
  "../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/png-sync.js"(exports) {
    "use strict";
    var parse6 = require_parser_sync();
    var pack = require_packer_sync();
    exports.read = function(buffer, options) {
      return parse6(buffer, options || {});
    };
    exports.write = function(png, options) {
      return pack(png, options);
    };
  }
});

// ../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/png.js
var require_png = __commonJS({
  "../../node_modules/.pnpm/pngjs@5.0.0/node_modules/pngjs/lib/png.js"(exports) {
    "use strict";
    var util = __require("util");
    var Stream = __require("stream");
    var Parser = require_parser_async();
    var Packer = require_packer_async();
    var PNGSync = require_png_sync();
    var PNG = exports.PNG = function(options) {
      Stream.call(this);
      options = options || {};
      this.width = options.width | 0;
      this.height = options.height | 0;
      this.data = this.width > 0 && this.height > 0 ? Buffer.alloc(4 * this.width * this.height) : null;
      if (options.fill && this.data) {
        this.data.fill(0);
      }
      this.gamma = 0;
      this.readable = this.writable = true;
      this._parser = new Parser(options);
      this._parser.on("error", this.emit.bind(this, "error"));
      this._parser.on("close", this._handleClose.bind(this));
      this._parser.on("metadata", this._metadata.bind(this));
      this._parser.on("gamma", this._gamma.bind(this));
      this._parser.on(
        "parsed",
        function(data) {
          this.data = data;
          this.emit("parsed", data);
        }.bind(this)
      );
      this._packer = new Packer(options);
      this._packer.on("data", this.emit.bind(this, "data"));
      this._packer.on("end", this.emit.bind(this, "end"));
      this._parser.on("close", this._handleClose.bind(this));
      this._packer.on("error", this.emit.bind(this, "error"));
    };
    util.inherits(PNG, Stream);
    PNG.sync = PNGSync;
    PNG.prototype.pack = function() {
      if (!this.data || !this.data.length) {
        this.emit("error", "No data provided");
        return this;
      }
      process.nextTick(
        function() {
          this._packer.pack(this.data, this.width, this.height, this.gamma);
        }.bind(this)
      );
      return this;
    };
    PNG.prototype.parse = function(data, callback) {
      if (callback) {
        let onParsed, onError;
        onParsed = function(parsedData) {
          this.removeListener("error", onError);
          this.data = parsedData;
          callback(null, this);
        }.bind(this);
        onError = function(err) {
          this.removeListener("parsed", onParsed);
          callback(err, null);
        }.bind(this);
        this.once("parsed", onParsed);
        this.once("error", onError);
      }
      this.end(data);
      return this;
    };
    PNG.prototype.write = function(data) {
      this._parser.write(data);
      return true;
    };
    PNG.prototype.end = function(data) {
      this._parser.end(data);
    };
    PNG.prototype._metadata = function(metadata) {
      this.width = metadata.width;
      this.height = metadata.height;
      this.emit("metadata", metadata);
    };
    PNG.prototype._gamma = function(gamma) {
      this.gamma = gamma;
    };
    PNG.prototype._handleClose = function() {
      if (!this._parser.writable && !this._packer.readable) {
        this.emit("close");
      }
    };
    PNG.bitblt = function(src, dst, srcX, srcY, width, height, deltaX, deltaY) {
      srcX |= 0;
      srcY |= 0;
      width |= 0;
      height |= 0;
      deltaX |= 0;
      deltaY |= 0;
      if (srcX > src.width || srcY > src.height || srcX + width > src.width || srcY + height > src.height) {
        throw new Error("bitblt reading outside image");
      }
      if (deltaX > dst.width || deltaY > dst.height || deltaX + width > dst.width || deltaY + height > dst.height) {
        throw new Error("bitblt writing outside image");
      }
      for (let y = 0; y < height; y++) {
        src.data.copy(
          dst.data,
          (deltaY + y) * dst.width + deltaX << 2,
          (srcY + y) * src.width + srcX << 2,
          (srcY + y) * src.width + srcX + width << 2
        );
      }
    };
    PNG.prototype.bitblt = function(dst, srcX, srcY, width, height, deltaX, deltaY) {
      PNG.bitblt(this, dst, srcX, srcY, width, height, deltaX, deltaY);
      return this;
    };
    PNG.adjustGamma = function(src) {
      if (src.gamma) {
        for (let y = 0; y < src.height; y++) {
          for (let x = 0; x < src.width; x++) {
            let idx = src.width * y + x << 2;
            for (let i = 0; i < 3; i++) {
              let sample = src.data[idx + i] / 255;
              sample = Math.pow(sample, 1 / 2.2 / src.gamma);
              src.data[idx + i] = Math.round(sample * 255);
            }
          }
        }
        src.gamma = 0;
      }
    };
    PNG.prototype.adjustGamma = function() {
      PNG.adjustGamma(this);
    };
  }
});

// ../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/renderer/utils.js
var require_utils2 = __commonJS({
  "../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/renderer/utils.js"(exports) {
    function hex2rgba(hex) {
      if (typeof hex === "number") {
        hex = hex.toString();
      }
      if (typeof hex !== "string") {
        throw new Error("Color should be defined as hex string");
      }
      let hexCode = hex.slice().replace("#", "").split("");
      if (hexCode.length < 3 || hexCode.length === 5 || hexCode.length > 8) {
        throw new Error("Invalid hex color: " + hex);
      }
      if (hexCode.length === 3 || hexCode.length === 4) {
        hexCode = Array.prototype.concat.apply([], hexCode.map(function(c) {
          return [c, c];
        }));
      }
      if (hexCode.length === 6) hexCode.push("F", "F");
      const hexValue = parseInt(hexCode.join(""), 16);
      return {
        r: hexValue >> 24 & 255,
        g: hexValue >> 16 & 255,
        b: hexValue >> 8 & 255,
        a: hexValue & 255,
        hex: "#" + hexCode.slice(0, 6).join("")
      };
    }
    exports.getOptions = function getOptions(options) {
      if (!options) options = {};
      if (!options.color) options.color = {};
      const margin = typeof options.margin === "undefined" || options.margin === null || options.margin < 0 ? 4 : options.margin;
      const width = options.width && options.width >= 21 ? options.width : void 0;
      const scale = options.scale || 4;
      return {
        width,
        scale: width ? 4 : scale,
        margin,
        color: {
          dark: hex2rgba(options.color.dark || "#000000ff"),
          light: hex2rgba(options.color.light || "#ffffffff")
        },
        type: options.type,
        rendererOpts: options.rendererOpts || {}
      };
    };
    exports.getScale = function getScale(qrSize, opts) {
      return opts.width && opts.width >= qrSize + opts.margin * 2 ? opts.width / (qrSize + opts.margin * 2) : opts.scale;
    };
    exports.getImageWidth = function getImageWidth(qrSize, opts) {
      const scale = exports.getScale(qrSize, opts);
      return Math.floor((qrSize + opts.margin * 2) * scale);
    };
    exports.qrToImageData = function qrToImageData(imgData, qr, opts) {
      const size = qr.modules.size;
      const data = qr.modules.data;
      const scale = exports.getScale(size, opts);
      const symbolSize = Math.floor((size + opts.margin * 2) * scale);
      const scaledMargin = opts.margin * scale;
      const palette = [opts.color.light, opts.color.dark];
      for (let i = 0; i < symbolSize; i++) {
        for (let j = 0; j < symbolSize; j++) {
          let posDst = (i * symbolSize + j) * 4;
          let pxColor = opts.color.light;
          if (i >= scaledMargin && j >= scaledMargin && i < symbolSize - scaledMargin && j < symbolSize - scaledMargin) {
            const iSrc = Math.floor((i - scaledMargin) / scale);
            const jSrc = Math.floor((j - scaledMargin) / scale);
            pxColor = palette[data[iSrc * size + jSrc] ? 1 : 0];
          }
          imgData[posDst++] = pxColor.r;
          imgData[posDst++] = pxColor.g;
          imgData[posDst++] = pxColor.b;
          imgData[posDst] = pxColor.a;
        }
      }
    };
  }
});

// ../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/renderer/png.js
var require_png2 = __commonJS({
  "../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/renderer/png.js"(exports) {
    var fs = __require("fs");
    var PNG = require_png().PNG;
    var Utils = require_utils2();
    exports.render = function render(qrData, options) {
      const opts = Utils.getOptions(options);
      const pngOpts = opts.rendererOpts;
      const size = Utils.getImageWidth(qrData.modules.size, opts);
      pngOpts.width = size;
      pngOpts.height = size;
      const pngImage = new PNG(pngOpts);
      Utils.qrToImageData(pngImage.data, qrData, opts);
      return pngImage;
    };
    exports.renderToDataURL = function renderToDataURL(qrData, options, cb) {
      if (typeof cb === "undefined") {
        cb = options;
        options = void 0;
      }
      exports.renderToBuffer(qrData, options, function(err, output) {
        if (err) cb(err);
        let url = "data:image/png;base64,";
        url += output.toString("base64");
        cb(null, url);
      });
    };
    exports.renderToBuffer = function renderToBuffer(qrData, options, cb) {
      if (typeof cb === "undefined") {
        cb = options;
        options = void 0;
      }
      const png = exports.render(qrData, options);
      const buffer = [];
      png.on("error", cb);
      png.on("data", function(data) {
        buffer.push(data);
      });
      png.on("end", function() {
        cb(null, Buffer.concat(buffer));
      });
      png.pack();
    };
    exports.renderToFile = function renderToFile(path, qrData, options, cb) {
      if (typeof cb === "undefined") {
        cb = options;
        options = void 0;
      }
      let called = false;
      const done = (...args) => {
        if (called) return;
        called = true;
        cb.apply(null, args);
      };
      const stream = fs.createWriteStream(path);
      stream.on("error", done);
      stream.on("close", done);
      exports.renderToFileStream(stream, qrData, options);
    };
    exports.renderToFileStream = function renderToFileStream(stream, qrData, options) {
      const png = exports.render(qrData, options);
      png.pack().pipe(stream);
    };
  }
});

// ../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/renderer/utf8.js
var require_utf8 = __commonJS({
  "../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/renderer/utf8.js"(exports) {
    var Utils = require_utils2();
    var BLOCK_CHAR = {
      WW: " ",
      WB: "\u2584",
      BB: "\u2588",
      BW: "\u2580"
    };
    var INVERTED_BLOCK_CHAR = {
      BB: " ",
      BW: "\u2584",
      WW: "\u2588",
      WB: "\u2580"
    };
    function getBlockChar(top, bottom, blocks) {
      if (top && bottom) return blocks.BB;
      if (top && !bottom) return blocks.BW;
      if (!top && bottom) return blocks.WB;
      return blocks.WW;
    }
    exports.render = function(qrData, options, cb) {
      const opts = Utils.getOptions(options);
      let blocks = BLOCK_CHAR;
      if (opts.color.dark.hex === "#ffffff" || opts.color.light.hex === "#000000") {
        blocks = INVERTED_BLOCK_CHAR;
      }
      const size = qrData.modules.size;
      const data = qrData.modules.data;
      let output = "";
      let hMargin = Array(size + opts.margin * 2 + 1).join(blocks.WW);
      hMargin = Array(opts.margin / 2 + 1).join(hMargin + "\n");
      const vMargin = Array(opts.margin + 1).join(blocks.WW);
      output += hMargin;
      for (let i = 0; i < size; i += 2) {
        output += vMargin;
        for (let j = 0; j < size; j++) {
          const topModule = data[i * size + j];
          const bottomModule = data[(i + 1) * size + j];
          output += getBlockChar(topModule, bottomModule, blocks);
        }
        output += vMargin + "\n";
      }
      output += hMargin.slice(0, -1);
      if (typeof cb === "function") {
        cb(null, output);
      }
      return output;
    };
    exports.renderToFile = function renderToFile(path, qrData, options, cb) {
      if (typeof cb === "undefined") {
        cb = options;
        options = void 0;
      }
      const fs = __require("fs");
      const utf8 = exports.render(qrData, options);
      fs.writeFile(path, utf8, cb);
    };
  }
});

// ../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/renderer/terminal/terminal.js
var require_terminal = __commonJS({
  "../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/renderer/terminal/terminal.js"(exports) {
    exports.render = function(qrData, options, cb) {
      const size = qrData.modules.size;
      const data = qrData.modules.data;
      const black = "\x1B[40m  \x1B[0m";
      const white = "\x1B[47m  \x1B[0m";
      let output = "";
      const hMargin = Array(size + 3).join(white);
      const vMargin = Array(2).join(white);
      output += hMargin + "\n";
      for (let i = 0; i < size; ++i) {
        output += white;
        for (let j = 0; j < size; j++) {
          output += data[i * size + j] ? black : white;
        }
        output += vMargin + "\n";
      }
      output += hMargin + "\n";
      if (typeof cb === "function") {
        cb(null, output);
      }
      return output;
    };
  }
});

// ../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/renderer/terminal/terminal-small.js
var require_terminal_small = __commonJS({
  "../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/renderer/terminal/terminal-small.js"(exports) {
    var backgroundWhite = "\x1B[47m";
    var backgroundBlack = "\x1B[40m";
    var foregroundWhite = "\x1B[37m";
    var foregroundBlack = "\x1B[30m";
    var reset = "\x1B[0m";
    var lineSetupNormal = backgroundWhite + foregroundBlack;
    var lineSetupInverse = backgroundBlack + foregroundWhite;
    var createPalette = function(lineSetup, foregroundWhite2, foregroundBlack2) {
      return {
        // 1 ... white, 2 ... black, 0 ... transparent (default)
        "00": reset + " " + lineSetup,
        "01": reset + foregroundWhite2 + "\u2584" + lineSetup,
        "02": reset + foregroundBlack2 + "\u2584" + lineSetup,
        10: reset + foregroundWhite2 + "\u2580" + lineSetup,
        11: " ",
        12: "\u2584",
        20: reset + foregroundBlack2 + "\u2580" + lineSetup,
        21: "\u2580",
        22: "\u2588"
      };
    };
    var mkCodePixel = function(modules, size, x, y) {
      const sizePlus = size + 1;
      if (x >= sizePlus || y >= sizePlus || y < -1 || x < -1) return "0";
      if (x >= size || y >= size || y < 0 || x < 0) return "1";
      const idx = y * size + x;
      return modules[idx] ? "2" : "1";
    };
    var mkCode = function(modules, size, x, y) {
      return mkCodePixel(modules, size, x, y) + mkCodePixel(modules, size, x, y + 1);
    };
    exports.render = function(qrData, options, cb) {
      const size = qrData.modules.size;
      const data = qrData.modules.data;
      const inverse = !!(options && options.inverse);
      const lineSetup = options && options.inverse ? lineSetupInverse : lineSetupNormal;
      const white = inverse ? foregroundBlack : foregroundWhite;
      const black = inverse ? foregroundWhite : foregroundBlack;
      const palette = createPalette(lineSetup, white, black);
      const newLine = reset + "\n" + lineSetup;
      let output = lineSetup;
      for (let y = -1; y < size + 1; y += 2) {
        for (let x = -1; x < size; x++) {
          output += palette[mkCode(data, size, x, y)];
        }
        output += palette[mkCode(data, size, size, y)] + newLine;
      }
      output += reset;
      if (typeof cb === "function") {
        cb(null, output);
      }
      return output;
    };
  }
});

// ../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/renderer/terminal.js
var require_terminal2 = __commonJS({
  "../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/renderer/terminal.js"(exports) {
    var big = require_terminal();
    var small = require_terminal_small();
    exports.render = function(qrData, options, cb) {
      if (options && options.small) {
        return small.render(qrData, options, cb);
      }
      return big.render(qrData, options, cb);
    };
  }
});

// ../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/renderer/svg-tag.js
var require_svg_tag = __commonJS({
  "../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/renderer/svg-tag.js"(exports) {
    var Utils = require_utils2();
    function getColorAttrib(color, attrib) {
      const alpha = color.a / 255;
      const str = attrib + '="' + color.hex + '"';
      return alpha < 1 ? str + " " + attrib + '-opacity="' + alpha.toFixed(2).slice(1) + '"' : str;
    }
    function svgCmd(cmd, x, y) {
      let str = cmd + x;
      if (typeof y !== "undefined") str += " " + y;
      return str;
    }
    function qrToPath(data, size, margin) {
      let path = "";
      let moveBy = 0;
      let newRow = false;
      let lineLength = 0;
      for (let i = 0; i < data.length; i++) {
        const col = Math.floor(i % size);
        const row = Math.floor(i / size);
        if (!col && !newRow) newRow = true;
        if (data[i]) {
          lineLength++;
          if (!(i > 0 && col > 0 && data[i - 1])) {
            path += newRow ? svgCmd("M", col + margin, 0.5 + row + margin) : svgCmd("m", moveBy, 0);
            moveBy = 0;
            newRow = false;
          }
          if (!(col + 1 < size && data[i + 1])) {
            path += svgCmd("h", lineLength);
            lineLength = 0;
          }
        } else {
          moveBy++;
        }
      }
      return path;
    }
    exports.render = function render(qrData, options, cb) {
      const opts = Utils.getOptions(options);
      const size = qrData.modules.size;
      const data = qrData.modules.data;
      const qrcodesize = size + opts.margin * 2;
      const bg = !opts.color.light.a ? "" : "<path " + getColorAttrib(opts.color.light, "fill") + ' d="M0 0h' + qrcodesize + "v" + qrcodesize + 'H0z"/>';
      const path = "<path " + getColorAttrib(opts.color.dark, "stroke") + ' d="' + qrToPath(data, size, opts.margin) + '"/>';
      const viewBox = 'viewBox="0 0 ' + qrcodesize + " " + qrcodesize + '"';
      const width = !opts.width ? "" : 'width="' + opts.width + '" height="' + opts.width + '" ';
      const svgTag = '<svg xmlns="http://www.w3.org/2000/svg" ' + width + viewBox + ' shape-rendering="crispEdges">' + bg + path + "</svg>\n";
      if (typeof cb === "function") {
        cb(null, svgTag);
      }
      return svgTag;
    };
  }
});

// ../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/renderer/svg.js
var require_svg = __commonJS({
  "../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/renderer/svg.js"(exports) {
    var svgTagRenderer = require_svg_tag();
    exports.render = svgTagRenderer.render;
    exports.renderToFile = function renderToFile(path, qrData, options, cb) {
      if (typeof cb === "undefined") {
        cb = options;
        options = void 0;
      }
      const fs = __require("fs");
      const svgTag = exports.render(qrData, options);
      const xmlStr = '<?xml version="1.0" encoding="utf-8"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">' + svgTag;
      fs.writeFile(path, xmlStr, cb);
    };
  }
});

// ../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/renderer/canvas.js
var require_canvas = __commonJS({
  "../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/renderer/canvas.js"(exports) {
    var Utils = require_utils2();
    function clearCanvas(ctx, canvas, size) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!canvas.style) canvas.style = {};
      canvas.height = size;
      canvas.width = size;
      canvas.style.height = size + "px";
      canvas.style.width = size + "px";
    }
    function getCanvasElement() {
      try {
        return document.createElement("canvas");
      } catch (e) {
        throw new Error("You need to specify a canvas element");
      }
    }
    exports.render = function render(qrData, canvas, options) {
      let opts = options;
      let canvasEl = canvas;
      if (typeof opts === "undefined" && (!canvas || !canvas.getContext)) {
        opts = canvas;
        canvas = void 0;
      }
      if (!canvas) {
        canvasEl = getCanvasElement();
      }
      opts = Utils.getOptions(opts);
      const size = Utils.getImageWidth(qrData.modules.size, opts);
      const ctx = canvasEl.getContext("2d");
      const image = ctx.createImageData(size, size);
      Utils.qrToImageData(image.data, qrData, opts);
      clearCanvas(ctx, canvasEl, size);
      ctx.putImageData(image, 0, 0);
      return canvasEl;
    };
    exports.renderToDataURL = function renderToDataURL(qrData, canvas, options) {
      let opts = options;
      if (typeof opts === "undefined" && (!canvas || !canvas.getContext)) {
        opts = canvas;
        canvas = void 0;
      }
      if (!opts) opts = {};
      const canvasEl = exports.render(qrData, canvas, opts);
      const type = opts.type || "image/png";
      const rendererOpts = opts.rendererOpts || {};
      return canvasEl.toDataURL(type, rendererOpts.quality);
    };
  }
});

// ../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/browser.js
var require_browser = __commonJS({
  "../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/browser.js"(exports) {
    var canPromise = require_can_promise();
    var QRCode3 = require_qrcode();
    var CanvasRenderer = require_canvas();
    var SvgRenderer = require_svg_tag();
    function renderCanvas(renderFunc, canvas, text, opts, cb) {
      const args = [].slice.call(arguments, 1);
      const argsNum = args.length;
      const isLastArgCb = typeof args[argsNum - 1] === "function";
      if (!isLastArgCb && !canPromise()) {
        throw new Error("Callback required as last argument");
      }
      if (isLastArgCb) {
        if (argsNum < 2) {
          throw new Error("Too few arguments provided");
        }
        if (argsNum === 2) {
          cb = text;
          text = canvas;
          canvas = opts = void 0;
        } else if (argsNum === 3) {
          if (canvas.getContext && typeof cb === "undefined") {
            cb = opts;
            opts = void 0;
          } else {
            cb = opts;
            opts = text;
            text = canvas;
            canvas = void 0;
          }
        }
      } else {
        if (argsNum < 1) {
          throw new Error("Too few arguments provided");
        }
        if (argsNum === 1) {
          text = canvas;
          canvas = opts = void 0;
        } else if (argsNum === 2 && !canvas.getContext) {
          opts = text;
          text = canvas;
          canvas = void 0;
        }
        return new Promise(function(resolve2, reject) {
          try {
            const data = QRCode3.create(text, opts);
            resolve2(renderFunc(data, canvas, opts));
          } catch (e) {
            reject(e);
          }
        });
      }
      try {
        const data = QRCode3.create(text, opts);
        cb(null, renderFunc(data, canvas, opts));
      } catch (e) {
        cb(e);
      }
    }
    exports.create = QRCode3.create;
    exports.toCanvas = renderCanvas.bind(null, CanvasRenderer.render);
    exports.toDataURL = renderCanvas.bind(null, CanvasRenderer.renderToDataURL);
    exports.toString = renderCanvas.bind(null, function(data, _, opts) {
      return SvgRenderer.render(data, opts);
    });
  }
});

// ../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/server.js
var require_server = __commonJS({
  "../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/server.js"(exports) {
    var canPromise = require_can_promise();
    var QRCode3 = require_qrcode();
    var PngRenderer = require_png2();
    var Utf8Renderer = require_utf8();
    var TerminalRenderer = require_terminal2();
    var SvgRenderer = require_svg();
    function checkParams(text, opts, cb) {
      if (typeof text === "undefined") {
        throw new Error("String required as first argument");
      }
      if (typeof cb === "undefined") {
        cb = opts;
        opts = {};
      }
      if (typeof cb !== "function") {
        if (!canPromise()) {
          throw new Error("Callback required as last argument");
        } else {
          opts = cb || {};
          cb = null;
        }
      }
      return {
        opts,
        cb
      };
    }
    function getTypeFromFilename(path) {
      return path.slice((path.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase();
    }
    function getRendererFromType(type) {
      switch (type) {
        case "svg":
          return SvgRenderer;
        case "txt":
        case "utf8":
          return Utf8Renderer;
        case "png":
        case "image/png":
        default:
          return PngRenderer;
      }
    }
    function getStringRendererFromType(type) {
      switch (type) {
        case "svg":
          return SvgRenderer;
        case "terminal":
          return TerminalRenderer;
        case "utf8":
        default:
          return Utf8Renderer;
      }
    }
    function render(renderFunc, text, params) {
      if (!params.cb) {
        return new Promise(function(resolve2, reject) {
          try {
            const data = QRCode3.create(text, params.opts);
            return renderFunc(data, params.opts, function(err, data2) {
              return err ? reject(err) : resolve2(data2);
            });
          } catch (e) {
            reject(e);
          }
        });
      }
      try {
        const data = QRCode3.create(text, params.opts);
        return renderFunc(data, params.opts, params.cb);
      } catch (e) {
        params.cb(e);
      }
    }
    exports.create = QRCode3.create;
    exports.toCanvas = require_browser().toCanvas;
    exports.toString = function toString(text, opts, cb) {
      const params = checkParams(text, opts, cb);
      const type = params.opts ? params.opts.type : void 0;
      const renderer = getStringRendererFromType(type);
      return render(renderer.render, text, params);
    };
    exports.toDataURL = function toDataURL(text, opts, cb) {
      const params = checkParams(text, opts, cb);
      const renderer = getRendererFromType(params.opts.type);
      return render(renderer.renderToDataURL, text, params);
    };
    exports.toBuffer = function toBuffer(text, opts, cb) {
      const params = checkParams(text, opts, cb);
      const renderer = getRendererFromType(params.opts.type);
      return render(renderer.renderToBuffer, text, params);
    };
    exports.toFile = function toFile(path, text, opts, cb) {
      if (typeof path !== "string" || !(typeof text === "string" || typeof text === "object")) {
        throw new Error("Invalid argument");
      }
      if (arguments.length < 3 && !canPromise()) {
        throw new Error("Too few arguments provided");
      }
      const params = checkParams(text, opts, cb);
      const type = params.opts.type || getTypeFromFilename(path);
      const renderer = getRendererFromType(type);
      const renderToFile = renderer.renderToFile.bind(null, path);
      return render(renderToFile, text, params);
    };
    exports.toFileStream = function toFileStream(stream, text, opts) {
      if (arguments.length < 2) {
        throw new Error("Too few arguments provided");
      }
      const params = checkParams(text, opts, stream.emit.bind(stream, "error"));
      const renderer = getRendererFromType("png");
      const renderToFileStream = renderer.renderToFileStream.bind(null, stream);
      render(renderToFileStream, text, params);
    };
  }
});

// ../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/index.js
var require_lib = __commonJS({
  "../../node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/index.js"(exports, module) {
    module.exports = require_server();
  }
});

// ../../node_modules/.pnpm/ws@8.22.0/node_modules/ws/lib/constants.js
var require_constants2 = __commonJS({
  "../../node_modules/.pnpm/ws@8.22.0/node_modules/ws/lib/constants.js"(exports, module) {
    "use strict";
    var BINARY_TYPES = ["nodebuffer", "arraybuffer", "fragments"];
    var hasBlob = typeof Blob !== "undefined";
    if (hasBlob) BINARY_TYPES.push("blob");
    module.exports = {
      BINARY_TYPES,
      CLOSE_TIMEOUT: 3e4,
      EMPTY_BUFFER: Buffer.alloc(0),
      GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
      hasBlob,
      kForOnEventAttribute: /* @__PURE__ */ Symbol("kIsForOnEventAttribute"),
      kListener: /* @__PURE__ */ Symbol("kListener"),
      kStatusCode: /* @__PURE__ */ Symbol("status-code"),
      kWebSocket: /* @__PURE__ */ Symbol("websocket"),
      NOOP: () => {
      }
    };
  }
});

// ../../node_modules/.pnpm/ws@8.22.0/node_modules/ws/lib/buffer-util.js
var require_buffer_util = __commonJS({
  "../../node_modules/.pnpm/ws@8.22.0/node_modules/ws/lib/buffer-util.js"(exports, module) {
    "use strict";
    var { EMPTY_BUFFER: EMPTY_BUFFER2 } = require_constants2();
    var FastBuffer = Buffer[Symbol.species];
    function concat2(list, totalLength) {
      if (list.length === 0) return EMPTY_BUFFER2;
      if (list.length === 1) return list[0];
      const target = Buffer.allocUnsafe(totalLength);
      let offset = 0;
      for (let i = 0; i < list.length; i++) {
        const buf = list[i];
        target.set(buf, offset);
        offset += buf.length;
      }
      if (offset < totalLength) {
        return new FastBuffer(target.buffer, target.byteOffset, offset);
      }
      return target;
    }
    function _mask(source, mask, output, offset, length) {
      for (let i = 0; i < length; i++) {
        output[offset + i] = source[i] ^ mask[i & 3];
      }
    }
    function _unmask(buffer, mask) {
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] ^= mask[i & 3];
      }
    }
    function toArrayBuffer(buf) {
      if (buf.length === buf.buffer.byteLength) {
        return buf.buffer;
      }
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
    }
    function toBuffer(data) {
      toBuffer.readOnly = true;
      if (Buffer.isBuffer(data)) return data;
      let buf;
      if (data instanceof ArrayBuffer) {
        buf = new FastBuffer(data);
      } else if (ArrayBuffer.isView(data)) {
        buf = new FastBuffer(data.buffer, data.byteOffset, data.byteLength);
      } else {
        buf = Buffer.from(data);
        toBuffer.readOnly = false;
      }
      return buf;
    }
    module.exports = {
      concat: concat2,
      mask: _mask,
      toArrayBuffer,
      toBuffer,
      unmask: _unmask
    };
    if (!process.env.WS_NO_BUFFER_UTIL) {
      try {
        const bufferUtil = __require("bufferutil");
        module.exports.mask = function(source, mask, output, offset, length) {
          if (length < 48) _mask(source, mask, output, offset, length);
          else bufferUtil.mask(source, mask, output, offset, length);
        };
        module.exports.unmask = function(buffer, mask) {
          if (buffer.length < 32) _unmask(buffer, mask);
          else bufferUtil.unmask(buffer, mask);
        };
      } catch (e) {
      }
    }
  }
});

// ../../node_modules/.pnpm/ws@8.22.0/node_modules/ws/lib/limiter.js
var require_limiter = __commonJS({
  "../../node_modules/.pnpm/ws@8.22.0/node_modules/ws/lib/limiter.js"(exports, module) {
    "use strict";
    var kDone = /* @__PURE__ */ Symbol("kDone");
    var kRun = /* @__PURE__ */ Symbol("kRun");
    var Limiter = class {
      /**
       * Creates a new `Limiter`.
       *
       * @param {Number} [concurrency=Infinity] The maximum number of jobs allowed
       *     to run concurrently
       */
      constructor(concurrency) {
        this[kDone] = () => {
          this.pending--;
          this[kRun]();
        };
        this.concurrency = concurrency || Infinity;
        this.jobs = [];
        this.pending = 0;
      }
      /**
       * Adds a job to the queue.
       *
       * @param {Function} job The job to run
       * @public
       */
      add(job) {
        this.jobs.push(job);
        this[kRun]();
      }
      /**
       * Removes a job from the queue and runs it if possible.
       *
       * @private
       */
      [kRun]() {
        if (this.pending === this.concurrency) return;
        if (this.jobs.length) {
          const job = this.jobs.shift();
          this.pending++;
          job(this[kDone]);
        }
      }
    };
    module.exports = Limiter;
  }
});

// ../../node_modules/.pnpm/ws@8.22.0/node_modules/ws/lib/permessage-deflate.js
var require_permessage_deflate = __commonJS({
  "../../node_modules/.pnpm/ws@8.22.0/node_modules/ws/lib/permessage-deflate.js"(exports, module) {
    "use strict";
    var zlib = __require("zlib");
    var bufferUtil = require_buffer_util();
    var Limiter = require_limiter();
    var { kStatusCode } = require_constants2();
    var FastBuffer = Buffer[Symbol.species];
    var TRAILER = Buffer.from([0, 0, 255, 255]);
    var kPerMessageDeflate = /* @__PURE__ */ Symbol("permessage-deflate");
    var kTotalLength = /* @__PURE__ */ Symbol("total-length");
    var kCallback = /* @__PURE__ */ Symbol("callback");
    var kBuffers = /* @__PURE__ */ Symbol("buffers");
    var kError = /* @__PURE__ */ Symbol("error");
    var zlibLimiter;
    var PerMessageDeflate2 = class {
      /**
       * Creates a PerMessageDeflate instance.
       *
       * @param {Object} [options] Configuration options
       * @param {(Boolean|Number)} [options.clientMaxWindowBits] Advertise support
       *     for, or request, a custom client window size
       * @param {Boolean} [options.clientNoContextTakeover=false] Advertise/
       *     acknowledge disabling of client context takeover
       * @param {Number} [options.concurrencyLimit=10] The number of concurrent
       *     calls to zlib
       * @param {Boolean} [options.isServer=false] Create the instance in either
       *     server or client mode
       * @param {Number} [options.maxPayload=0] The maximum allowed message length
       * @param {(Boolean|Number)} [options.serverMaxWindowBits] Request/confirm the
       *     use of a custom server window size
       * @param {Boolean} [options.serverNoContextTakeover=false] Request/accept
       *     disabling of server context takeover
       * @param {Number} [options.threshold=1024] Size (in bytes) below which
       *     messages should not be compressed if context takeover is disabled
       * @param {Object} [options.zlibDeflateOptions] Options to pass to zlib on
       *     deflate
       * @param {Object} [options.zlibInflateOptions] Options to pass to zlib on
       *     inflate
       */
      constructor(options) {
        this._options = options || {};
        this._threshold = this._options.threshold !== void 0 ? this._options.threshold : 1024;
        this._maxPayload = this._options.maxPayload | 0;
        this._isServer = !!this._options.isServer;
        this._deflate = null;
        this._inflate = null;
        this.params = null;
        if (!zlibLimiter) {
          const concurrency = this._options.concurrencyLimit !== void 0 ? this._options.concurrencyLimit : 10;
          zlibLimiter = new Limiter(concurrency);
        }
      }
      /**
       * @type {String}
       */
      static get extensionName() {
        return "permessage-deflate";
      }
      /**
       * Create an extension negotiation offer.
       *
       * @return {Object} Extension parameters
       * @public
       */
      offer() {
        const params = {};
        if (this._options.serverNoContextTakeover) {
          params.server_no_context_takeover = true;
        }
        if (this._options.clientNoContextTakeover) {
          params.client_no_context_takeover = true;
        }
        if (this._options.serverMaxWindowBits) {
          params.server_max_window_bits = this._options.serverMaxWindowBits;
        }
        if (this._options.clientMaxWindowBits) {
          params.client_max_window_bits = this._options.clientMaxWindowBits;
        } else if (this._options.clientMaxWindowBits == null) {
          params.client_max_window_bits = true;
        }
        return params;
      }
      /**
       * Accept an extension negotiation offer/response.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Object} Accepted configuration
       * @public
       */
      accept(configurations) {
        configurations = this.normalizeParams(configurations);
        this.params = this._isServer ? this.acceptAsServer(configurations) : this.acceptAsClient(configurations);
        return this.params;
      }
      /**
       * Releases all resources used by the extension.
       *
       * @public
       */
      cleanup() {
        if (this._inflate) {
          this._inflate.close();
          this._inflate = null;
        }
        if (this._deflate) {
          const callback = this._deflate[kCallback];
          this._deflate.close();
          this._deflate = null;
          if (callback) {
            callback(
              new Error(
                "The deflate stream was closed while data was being processed"
              )
            );
          }
        }
      }
      /**
       *  Accept an extension negotiation offer.
       *
       * @param {Array} offers The extension negotiation offers
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsServer(offers) {
        const opts = this._options;
        const accepted = offers.find((params) => {
          if (opts.serverNoContextTakeover === false && params.server_no_context_takeover || params.server_max_window_bits && (opts.serverMaxWindowBits === false || typeof opts.serverMaxWindowBits === "number" && opts.serverMaxWindowBits > params.server_max_window_bits) || typeof opts.clientMaxWindowBits === "number" && (typeof params.client_max_window_bits === "number" ? opts.clientMaxWindowBits > params.client_max_window_bits : !params.client_max_window_bits)) {
            return false;
          }
          return true;
        });
        if (!accepted) {
          throw new Error("None of the extension offers can be accepted");
        }
        if (opts.serverNoContextTakeover) {
          accepted.server_no_context_takeover = true;
        }
        if (opts.clientNoContextTakeover) {
          accepted.client_no_context_takeover = true;
        }
        if (typeof opts.serverMaxWindowBits === "number") {
          accepted.server_max_window_bits = opts.serverMaxWindowBits;
        }
        if (typeof opts.clientMaxWindowBits === "number") {
          accepted.client_max_window_bits = opts.clientMaxWindowBits;
        } else if (accepted.client_max_window_bits === true || opts.clientMaxWindowBits === false) {
          delete accepted.client_max_window_bits;
        }
        return accepted;
      }
      /**
       * Accept the extension negotiation response.
       *
       * @param {Array} response The extension negotiation response
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsClient(response) {
        const params = response[0];
        if (this._options.clientNoContextTakeover === false && params.client_no_context_takeover) {
          throw new Error('Unexpected parameter "client_no_context_takeover"');
        }
        if (!params.client_max_window_bits) {
          if (typeof this._options.clientMaxWindowBits === "number") {
            params.client_max_window_bits = this._options.clientMaxWindowBits;
          }
        } else if (this._options.clientMaxWindowBits === false || typeof this._options.clientMaxWindowBits === "number" && params.client_max_window_bits > this._options.clientMaxWindowBits) {
          throw new Error(
            'Unexpected or invalid parameter "client_max_window_bits"'
          );
        }
        return params;
      }
      /**
       * Normalize parameters.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Array} The offers/response with normalized parameters
       * @private
       */
      normalizeParams(configurations) {
        configurations.forEach((params) => {
          Object.keys(params).forEach((key2) => {
            let value = params[key2];
            if (value.length > 1) {
              throw new Error(`Parameter "${key2}" must have only a single value`);
            }
            value = value[0];
            if (key2 === "client_max_window_bits") {
              if (value !== true) {
                const num = +value;
                if (!Number.isInteger(num) || num < 8 || num > 15) {
                  throw new TypeError(
                    `Invalid value for parameter "${key2}": ${value}`
                  );
                }
                value = num;
              } else if (!this._isServer) {
                throw new TypeError(
                  `Invalid value for parameter "${key2}": ${value}`
                );
              }
            } else if (key2 === "server_max_window_bits") {
              const num = +value;
              if (!Number.isInteger(num) || num < 8 || num > 15) {
                throw new TypeError(
                  `Invalid value for parameter "${key2}": ${value}`
                );
              }
              value = num;
            } else if (key2 === "client_no_context_takeover" || key2 === "server_no_context_takeover") {
              if (value !== true) {
                throw new TypeError(
                  `Invalid value for parameter "${key2}": ${value}`
                );
              }
            } else {
              throw new Error(`Unknown parameter "${key2}"`);
            }
            params[key2] = value;
          });
        });
        return configurations;
      }
      /**
       * Decompress data. Concurrency limited.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      decompress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._decompress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Compress data. Concurrency limited.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      compress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._compress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Decompress data.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _decompress(data, fin, callback) {
        const endpoint = this._isServer ? "client" : "server";
        if (!this._inflate) {
          const key2 = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key2] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key2];
          this._inflate = zlib.createInflateRaw({
            ...this._options.zlibInflateOptions,
            windowBits
          });
          this._inflate[kPerMessageDeflate] = this;
          this._inflate[kTotalLength] = 0;
          this._inflate[kBuffers] = [];
          this._inflate.on("error", inflateOnError);
          this._inflate.on("data", inflateOnData);
        }
        this._inflate[kCallback] = callback;
        this._inflate.write(data);
        if (fin) this._inflate.write(TRAILER);
        this._inflate.flush(() => {
          const err = this._inflate[kError];
          if (err) {
            this._inflate.close();
            this._inflate = null;
            callback(err);
            return;
          }
          const data2 = bufferUtil.concat(
            this._inflate[kBuffers],
            this._inflate[kTotalLength]
          );
          if (this._inflate._readableState.endEmitted) {
            this._inflate.close();
            this._inflate = null;
          } else {
            this._inflate[kTotalLength] = 0;
            this._inflate[kBuffers] = [];
            if (fin && this.params[`${endpoint}_no_context_takeover`]) {
              this._inflate.reset();
            }
          }
          callback(null, data2);
        });
      }
      /**
       * Compress data.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _compress(data, fin, callback) {
        const endpoint = this._isServer ? "server" : "client";
        if (!this._deflate) {
          const key2 = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key2] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key2];
          this._deflate = zlib.createDeflateRaw({
            ...this._options.zlibDeflateOptions,
            windowBits
          });
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          this._deflate.on("data", deflateOnData);
        }
        this._deflate[kCallback] = callback;
        this._deflate.write(data);
        this._deflate.flush(zlib.Z_SYNC_FLUSH, () => {
          if (!this._deflate) {
            return;
          }
          let data2 = bufferUtil.concat(
            this._deflate[kBuffers],
            this._deflate[kTotalLength]
          );
          if (fin) {
            data2 = new FastBuffer(data2.buffer, data2.byteOffset, data2.length - 4);
          }
          this._deflate[kCallback] = null;
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          if (fin && this.params[`${endpoint}_no_context_takeover`]) {
            this._deflate.reset();
          }
          callback(null, data2);
        });
      }
    };
    module.exports = PerMessageDeflate2;
    function deflateOnData(chunk) {
      this[kBuffers].push(chunk);
      this[kTotalLength] += chunk.length;
    }
    function inflateOnData(chunk) {
      this[kTotalLength] += chunk.length;
      if (this[kPerMessageDeflate]._maxPayload < 1 || this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload) {
        this[kBuffers].push(chunk);
        return;
      }
      this[kError] = new RangeError("Max payload size exceeded");
      this[kError].code = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH";
      this[kError][kStatusCode] = 1009;
      this.removeListener("data", inflateOnData);
      this.reset();
    }
    function inflateOnError(err) {
      this[kPerMessageDeflate]._inflate = null;
      if (this[kError]) {
        this[kCallback](this[kError]);
        return;
      }
      err[kStatusCode] = 1007;
      this[kCallback](err);
    }
  }
});

// ../../node_modules/.pnpm/ws@8.22.0/node_modules/ws/lib/validation.js
var require_validation = __commonJS({
  "../../node_modules/.pnpm/ws@8.22.0/node_modules/ws/lib/validation.js"(exports, module) {
    "use strict";
    var { isUtf8 } = __require("buffer");
    var { hasBlob } = require_constants2();
    var tokenChars = [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 0 - 15
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 16 - 31
      0,
      1,
      0,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      1,
      1,
      0,
      1,
      1,
      0,
      // 32 - 47
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      // 48 - 63
      0,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 64 - 79
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      1,
      1,
      // 80 - 95
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 96 - 111
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      1,
      0,
      1,
      0
      // 112 - 127
    ];
    function isValidStatusCode(code) {
      return code >= 1e3 && code <= 1014 && code !== 1004 && code !== 1005 && code !== 1006 || code >= 3e3 && code <= 4999;
    }
    function _isValidUTF8(buf) {
      const len = buf.length;
      let i = 0;
      while (i < len) {
        if ((buf[i] & 128) === 0) {
          i++;
        } else if ((buf[i] & 224) === 192) {
          if (i + 1 === len || (buf[i + 1] & 192) !== 128 || (buf[i] & 254) === 192) {
            return false;
          }
          i += 2;
        } else if ((buf[i] & 240) === 224) {
          if (i + 2 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || buf[i] === 224 && (buf[i + 1] & 224) === 128 || // Overlong
          buf[i] === 237 && (buf[i + 1] & 224) === 160) {
            return false;
          }
          i += 3;
        } else if ((buf[i] & 248) === 240) {
          if (i + 3 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || (buf[i + 3] & 192) !== 128 || buf[i] === 240 && (buf[i + 1] & 240) === 128 || // Overlong
          buf[i] === 244 && buf[i + 1] > 143 || buf[i] > 244) {
            return false;
          }
          i += 4;
        } else {
          return false;
        }
      }
      return true;
    }
    function isBlob(value) {
      return hasBlob && typeof value === "object" && typeof value.arrayBuffer === "function" && typeof value.type === "string" && typeof value.stream === "function" && (value[Symbol.toStringTag] === "Blob" || value[Symbol.toStringTag] === "File");
    }
    module.exports = {
      isBlob,
      isValidStatusCode,
      isValidUTF8: _isValidUTF8,
      tokenChars
    };
    if (isUtf8) {
      module.exports.isValidUTF8 = function(buf) {
        return buf.length < 24 ? _isValidUTF8(buf) : isUtf8(buf);
      };
    } else if (!process.env.WS_NO_UTF_8_VALIDATE) {
      try {
        const isValidUTF8 = __require("utf-8-validate");
        module.exports.isValidUTF8 = function(buf) {
          return buf.length < 32 ? _isValidUTF8(buf) : isValidUTF8(buf);
        };
      } catch (e) {
      }
    }
  }
});

// ../../node_modules/.pnpm/ws@8.22.0/node_modules/ws/lib/receiver.js
var require_receiver = __commonJS({
  "../../node_modules/.pnpm/ws@8.22.0/node_modules/ws/lib/receiver.js"(exports, module) {
    "use strict";
    var { Writable } = __require("stream");
    var PerMessageDeflate2 = require_permessage_deflate();
    var {
      BINARY_TYPES,
      EMPTY_BUFFER: EMPTY_BUFFER2,
      kStatusCode,
      kWebSocket
    } = require_constants2();
    var { concat: concat2, toArrayBuffer, unmask } = require_buffer_util();
    var { isValidStatusCode, isValidUTF8 } = require_validation();
    var FastBuffer = Buffer[Symbol.species];
    var GET_INFO = 0;
    var GET_PAYLOAD_LENGTH_16 = 1;
    var GET_PAYLOAD_LENGTH_64 = 2;
    var GET_MASK = 3;
    var GET_DATA = 4;
    var INFLATING = 5;
    var DEFER_EVENT = 6;
    var Receiver2 = class extends Writable {
      /**
       * Creates a Receiver instance.
       *
       * @param {Object} [options] Options object
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {String} [options.binaryType=nodebuffer] The type for binary data
       * @param {Object} [options.extensions] An object containing the negotiated
       *     extensions
       * @param {Boolean} [options.isServer=false] Specifies whether to operate in
       *     client or server mode
       * @param {Number} [options.maxBufferedChunks=0] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=0] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=0] The maximum allowed message length
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       */
      constructor(options = {}) {
        super();
        this._allowSynchronousEvents = options.allowSynchronousEvents !== void 0 ? options.allowSynchronousEvents : true;
        this._binaryType = options.binaryType || BINARY_TYPES[0];
        this._extensions = options.extensions || {};
        this._isServer = !!options.isServer;
        this._maxBufferedChunks = options.maxBufferedChunks | 0;
        this._maxFragments = options.maxFragments | 0;
        this._maxPayload = options.maxPayload | 0;
        this._skipUTF8Validation = !!options.skipUTF8Validation;
        this[kWebSocket] = void 0;
        this._bufferedBytes = 0;
        this._buffers = [];
        this._compressed = false;
        this._payloadLength = 0;
        this._mask = void 0;
        this._fragmented = 0;
        this._masked = false;
        this._fin = false;
        this._opcode = 0;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._numFragments = 0;
        this._fragments = [];
        this._errored = false;
        this._loop = false;
        this._state = GET_INFO;
      }
      /**
       * Implements `Writable.prototype._write()`.
       *
       * @param {Buffer} chunk The chunk of data to write
       * @param {String} encoding The character encoding of `chunk`
       * @param {Function} cb Callback
       * @private
       */
      _write(chunk, encoding, cb) {
        if (this._opcode === 8 && this._state == GET_INFO) return cb();
        if (this._maxBufferedChunks > 0 && this._buffers.length >= this._maxBufferedChunks) {
          cb(
            this.createError(
              RangeError,
              "Too many buffered chunks",
              false,
              1008,
              "WS_ERR_TOO_MANY_BUFFERED_PARTS"
            )
          );
          return;
        }
        this._bufferedBytes += chunk.length;
        this._buffers.push(chunk);
        this.startLoop(cb);
      }
      /**
       * Consumes `n` bytes from the buffered data.
       *
       * @param {Number} n The number of bytes to consume
       * @return {Buffer} The consumed bytes
       * @private
       */
      consume(n) {
        this._bufferedBytes -= n;
        if (n === this._buffers[0].length) return this._buffers.shift();
        if (n < this._buffers[0].length) {
          const buf = this._buffers[0];
          this._buffers[0] = new FastBuffer(
            buf.buffer,
            buf.byteOffset + n,
            buf.length - n
          );
          return new FastBuffer(buf.buffer, buf.byteOffset, n);
        }
        const dst = Buffer.allocUnsafe(n);
        do {
          const buf = this._buffers[0];
          const offset = dst.length - n;
          if (n >= buf.length) {
            dst.set(this._buffers.shift(), offset);
          } else {
            dst.set(new Uint8Array(buf.buffer, buf.byteOffset, n), offset);
            this._buffers[0] = new FastBuffer(
              buf.buffer,
              buf.byteOffset + n,
              buf.length - n
            );
          }
          n -= buf.length;
        } while (n > 0);
        return dst;
      }
      /**
       * Starts the parsing loop.
       *
       * @param {Function} cb Callback
       * @private
       */
      startLoop(cb) {
        this._loop = true;
        do {
          switch (this._state) {
            case GET_INFO:
              this.getInfo(cb);
              break;
            case GET_PAYLOAD_LENGTH_16:
              this.getPayloadLength16(cb);
              break;
            case GET_PAYLOAD_LENGTH_64:
              this.getPayloadLength64(cb);
              break;
            case GET_MASK:
              this.getMask();
              break;
            case GET_DATA:
              this.getData(cb);
              break;
            case INFLATING:
            case DEFER_EVENT:
              this._loop = false;
              return;
          }
        } while (this._loop);
        if (!this._errored) cb();
      }
      /**
       * Reads the first two bytes of a frame.
       *
       * @param {Function} cb Callback
       * @private
       */
      getInfo(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        const buf = this.consume(2);
        if ((buf[0] & 48) !== 0) {
          const error = this.createError(
            RangeError,
            "RSV2 and RSV3 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_2_3"
          );
          cb(error);
          return;
        }
        const compressed = (buf[0] & 64) === 64;
        if (compressed && !this._extensions[PerMessageDeflate2.extensionName]) {
          const error = this.createError(
            RangeError,
            "RSV1 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_1"
          );
          cb(error);
          return;
        }
        this._fin = (buf[0] & 128) === 128;
        this._opcode = buf[0] & 15;
        this._payloadLength = buf[1] & 127;
        if (this._opcode === 0) {
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (!this._fragmented) {
            const error = this.createError(
              RangeError,
              "invalid opcode 0",
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._opcode = this._fragmented;
        } else if (this._opcode === 1 || this._opcode === 2) {
          if (this._fragmented) {
            const error = this.createError(
              RangeError,
              `invalid opcode ${this._opcode}`,
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._compressed = compressed;
        } else if (this._opcode > 7 && this._opcode < 11) {
          if (!this._fin) {
            const error = this.createError(
              RangeError,
              "FIN must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_FIN"
            );
            cb(error);
            return;
          }
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (this._payloadLength > 125 || this._opcode === 8 && this._payloadLength === 1) {
            const error = this.createError(
              RangeError,
              `invalid payload length ${this._payloadLength}`,
              true,
              1002,
              "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH"
            );
            cb(error);
            return;
          }
        } else {
          const error = this.createError(
            RangeError,
            `invalid opcode ${this._opcode}`,
            true,
            1002,
            "WS_ERR_INVALID_OPCODE"
          );
          cb(error);
          return;
        }
        if (!this._fin && !this._fragmented) this._fragmented = this._opcode;
        this._masked = (buf[1] & 128) === 128;
        if (this._isServer) {
          if (!this._masked) {
            const error = this.createError(
              RangeError,
              "MASK must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_MASK"
            );
            cb(error);
            return;
          }
        } else if (this._masked) {
          const error = this.createError(
            RangeError,
            "MASK must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_MASK"
          );
          cb(error);
          return;
        }
        if (this._payloadLength === 126) this._state = GET_PAYLOAD_LENGTH_16;
        else if (this._payloadLength === 127) this._state = GET_PAYLOAD_LENGTH_64;
        else this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+16).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength16(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        this._payloadLength = this.consume(2).readUInt16BE(0);
        this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+64).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength64(cb) {
        if (this._bufferedBytes < 8) {
          this._loop = false;
          return;
        }
        const buf = this.consume(8);
        const num = buf.readUInt32BE(0);
        if (num > Math.pow(2, 53 - 32) - 1) {
          const error = this.createError(
            RangeError,
            "Unsupported WebSocket frame: payload length > 2^53 - 1",
            false,
            1009,
            "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH"
          );
          cb(error);
          return;
        }
        this._payloadLength = num * Math.pow(2, 32) + buf.readUInt32BE(4);
        this.haveLength(cb);
      }
      /**
       * Payload length has been read.
       *
       * @param {Function} cb Callback
       * @private
       */
      haveLength(cb) {
        if (this._payloadLength && this._opcode < 8) {
          this._totalPayloadLength += this._payloadLength;
          if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
            const error = this.createError(
              RangeError,
              "Max payload size exceeded",
              false,
              1009,
              "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
            );
            cb(error);
            return;
          }
        }
        if (this._masked) this._state = GET_MASK;
        else this._state = GET_DATA;
      }
      /**
       * Reads mask bytes.
       *
       * @private
       */
      getMask() {
        if (this._bufferedBytes < 4) {
          this._loop = false;
          return;
        }
        this._mask = this.consume(4);
        this._state = GET_DATA;
      }
      /**
       * Reads data bytes.
       *
       * @param {Function} cb Callback
       * @private
       */
      getData(cb) {
        let data = EMPTY_BUFFER2;
        if (this._payloadLength) {
          if (this._bufferedBytes < this._payloadLength) {
            this._loop = false;
            return;
          }
          data = this.consume(this._payloadLength);
          if (this._masked && (this._mask[0] | this._mask[1] | this._mask[2] | this._mask[3]) !== 0) {
            unmask(data, this._mask);
          }
        }
        if (this._opcode > 7) {
          this.controlMessage(data, cb);
          return;
        }
        if (this._maxFragments > 0 && ++this._numFragments > this._maxFragments) {
          const error = this.createError(
            RangeError,
            "Too many message fragments",
            false,
            1008,
            "WS_ERR_TOO_MANY_BUFFERED_PARTS"
          );
          cb(error);
          return;
        }
        if (this._compressed) {
          this._state = INFLATING;
          this.decompress(data, cb);
          return;
        }
        if (data.length) {
          this._messageLength = this._totalPayloadLength;
          this._fragments.push(data);
        }
        this.dataMessage(cb);
      }
      /**
       * Decompresses data.
       *
       * @param {Buffer} data Compressed data
       * @param {Function} cb Callback
       * @private
       */
      decompress(data, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate2.extensionName];
        perMessageDeflate.decompress(data, this._fin, (err, buf) => {
          if (err) return cb(err);
          if (buf.length) {
            this._messageLength += buf.length;
            if (this._messageLength > this._maxPayload && this._maxPayload > 0) {
              const error = this.createError(
                RangeError,
                "Max payload size exceeded",
                false,
                1009,
                "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
              );
              cb(error);
              return;
            }
            this._fragments.push(buf);
          }
          this.dataMessage(cb);
          if (this._state === GET_INFO) this.startLoop(cb);
        });
      }
      /**
       * Handles a data message.
       *
       * @param {Function} cb Callback
       * @private
       */
      dataMessage(cb) {
        if (!this._fin) {
          this._state = GET_INFO;
          return;
        }
        const messageLength = this._messageLength;
        const fragments = this._fragments;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._fragmented = 0;
        this._numFragments = 0;
        this._fragments = [];
        if (this._opcode === 2) {
          let data;
          if (this._binaryType === "nodebuffer") {
            data = concat2(fragments, messageLength);
          } else if (this._binaryType === "arraybuffer") {
            data = toArrayBuffer(concat2(fragments, messageLength));
          } else if (this._binaryType === "blob") {
            data = new Blob(fragments);
          } else {
            data = fragments;
          }
          if (this._allowSynchronousEvents) {
            this.emit("message", data, true);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", data, true);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        } else {
          const buf = concat2(fragments, messageLength);
          if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
            const error = this.createError(
              Error,
              "invalid UTF-8 sequence",
              true,
              1007,
              "WS_ERR_INVALID_UTF8"
            );
            cb(error);
            return;
          }
          if (this._state === INFLATING || this._allowSynchronousEvents) {
            this.emit("message", buf, false);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", buf, false);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        }
      }
      /**
       * Handles a control message.
       *
       * @param {Buffer} data Data to handle
       * @return {(Error|RangeError|undefined)} A possible error
       * @private
       */
      controlMessage(data, cb) {
        if (this._opcode === 8) {
          if (data.length === 0) {
            this._loop = false;
            this.emit("conclude", 1005, EMPTY_BUFFER2);
            this.end();
          } else {
            const code = data.readUInt16BE(0);
            if (!isValidStatusCode(code)) {
              const error = this.createError(
                RangeError,
                `invalid status code ${code}`,
                true,
                1002,
                "WS_ERR_INVALID_CLOSE_CODE"
              );
              cb(error);
              return;
            }
            const buf = new FastBuffer(
              data.buffer,
              data.byteOffset + 2,
              data.length - 2
            );
            if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
              const error = this.createError(
                Error,
                "invalid UTF-8 sequence",
                true,
                1007,
                "WS_ERR_INVALID_UTF8"
              );
              cb(error);
              return;
            }
            this._loop = false;
            this.emit("conclude", code, buf);
            this.end();
          }
          this._state = GET_INFO;
          return;
        }
        if (this._allowSynchronousEvents) {
          this.emit(this._opcode === 9 ? "ping" : "pong", data);
          this._state = GET_INFO;
        } else {
          this._state = DEFER_EVENT;
          setImmediate(() => {
            this.emit(this._opcode === 9 ? "ping" : "pong", data);
            this._state = GET_INFO;
            this.startLoop(cb);
          });
        }
      }
      /**
       * Builds an error object.
       *
       * @param {function(new:Error|RangeError)} ErrorCtor The error constructor
       * @param {String} message The error message
       * @param {Boolean} prefix Specifies whether or not to add a default prefix to
       *     `message`
       * @param {Number} statusCode The status code
       * @param {String} errorCode The exposed error code
       * @return {(Error|RangeError)} The error
       * @private
       */
      createError(ErrorCtor, message2, prefix, statusCode, errorCode2) {
        this._loop = false;
        this._errored = true;
        const err = new ErrorCtor(
          prefix ? `Invalid WebSocket frame: ${message2}` : message2
        );
        Error.captureStackTrace(err, this.createError);
        err.code = errorCode2;
        err[kStatusCode] = statusCode;
        return err;
      }
    };
    module.exports = Receiver2;
  }
});

// ../../node_modules/.pnpm/ws@8.22.0/node_modules/ws/lib/sender.js
var require_sender = __commonJS({
  "../../node_modules/.pnpm/ws@8.22.0/node_modules/ws/lib/sender.js"(exports, module) {
    "use strict";
    var { Duplex } = __require("stream");
    var { randomFillSync } = __require("crypto");
    var {
      types: { isUint8Array }
    } = __require("util");
    var PerMessageDeflate2 = require_permessage_deflate();
    var { EMPTY_BUFFER: EMPTY_BUFFER2, kWebSocket, NOOP } = require_constants2();
    var { isBlob, isValidStatusCode } = require_validation();
    var { mask: applyMask, toBuffer } = require_buffer_util();
    var kByteLength = /* @__PURE__ */ Symbol("kByteLength");
    var maskBuffer = Buffer.alloc(4);
    var RANDOM_POOL_SIZE = 8 * 1024;
    var randomPool;
    var randomPoolPointer = RANDOM_POOL_SIZE;
    var DEFAULT = 0;
    var DEFLATING = 1;
    var GET_BLOB_DATA = 2;
    var Sender2 = class _Sender {
      /**
       * Creates a Sender instance.
       *
       * @param {Duplex} socket The connection socket
       * @param {Object} [extensions] An object containing the negotiated extensions
       * @param {Function} [generateMask] The function used to generate the masking
       *     key
       */
      constructor(socket, extensions, generateMask) {
        this._extensions = extensions || {};
        if (generateMask) {
          this._generateMask = generateMask;
          this._maskBuffer = Buffer.alloc(4);
        }
        this._socket = socket;
        this._firstFragment = true;
        this._compress = false;
        this._bufferedBytes = 0;
        this._queue = [];
        this._state = DEFAULT;
        this.onerror = NOOP;
        this[kWebSocket] = void 0;
      }
      /**
       * Frames a piece of data according to the HyBi WebSocket protocol.
       *
       * @param {(Buffer|String)} data The data to frame
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @return {(Buffer|String)[]} The framed data
       * @public
       */
      static frame(data, options) {
        let mask;
        let merge = false;
        let offset = 2;
        let skipMasking = false;
        if (options.mask) {
          mask = options.maskBuffer || maskBuffer;
          if (options.generateMask) {
            options.generateMask(mask);
          } else {
            if (randomPoolPointer === RANDOM_POOL_SIZE) {
              if (randomPool === void 0) {
                randomPool = Buffer.alloc(RANDOM_POOL_SIZE);
              }
              randomFillSync(randomPool, 0, RANDOM_POOL_SIZE);
              randomPoolPointer = 0;
            }
            mask[0] = randomPool[randomPoolPointer++];
            mask[1] = randomPool[randomPoolPointer++];
            mask[2] = randomPool[randomPoolPointer++];
            mask[3] = randomPool[randomPoolPointer++];
          }
          skipMasking = (mask[0] | mask[1] | mask[2] | mask[3]) === 0;
          offset = 6;
        }
        let dataLength;
        if (typeof data === "string") {
          if ((!options.mask || skipMasking) && options[kByteLength] !== void 0) {
            dataLength = options[kByteLength];
          } else {
            data = Buffer.from(data);
            dataLength = data.length;
          }
        } else {
          dataLength = data.length;
          merge = options.mask && options.readOnly && !skipMasking;
        }
        let payloadLength = dataLength;
        if (dataLength >= 65536) {
          offset += 8;
          payloadLength = 127;
        } else if (dataLength > 125) {
          offset += 2;
          payloadLength = 126;
        }
        const target = Buffer.allocUnsafe(merge ? dataLength + offset : offset);
        target[0] = options.fin ? options.opcode | 128 : options.opcode;
        if (options.rsv1) target[0] |= 64;
        target[1] = payloadLength;
        if (payloadLength === 126) {
          target.writeUInt16BE(dataLength, 2);
        } else if (payloadLength === 127) {
          target[2] = target[3] = 0;
          target.writeUIntBE(dataLength, 4, 6);
        }
        if (!options.mask) return [target, data];
        target[1] |= 128;
        target[offset - 4] = mask[0];
        target[offset - 3] = mask[1];
        target[offset - 2] = mask[2];
        target[offset - 1] = mask[3];
        if (skipMasking) return [target, data];
        if (merge) {
          applyMask(data, mask, target, offset, dataLength);
          return [target];
        }
        applyMask(data, mask, data, 0, dataLength);
        return [target, data];
      }
      /**
       * Sends a close message to the other peer.
       *
       * @param {Number} [code] The status code component of the body
       * @param {(String|Buffer)} [data] The message component of the body
       * @param {Boolean} [mask=false] Specifies whether or not to mask the message
       * @param {Function} [cb] Callback
       * @public
       */
      close(code, data, mask, cb) {
        let buf;
        if (code === void 0) {
          buf = EMPTY_BUFFER2;
        } else if (typeof code !== "number" || !isValidStatusCode(code)) {
          throw new TypeError("First argument must be a valid error code number");
        } else if (data === void 0 || !data.length) {
          buf = Buffer.allocUnsafe(2);
          buf.writeUInt16BE(code, 0);
        } else {
          const length = Buffer.byteLength(data);
          if (length > 123) {
            throw new RangeError("The message must not be greater than 123 bytes");
          }
          buf = Buffer.allocUnsafe(2 + length);
          buf.writeUInt16BE(code, 0);
          if (typeof data === "string") {
            buf.write(data, 2);
          } else if (isUint8Array(data)) {
            buf.set(data, 2);
          } else {
            throw new TypeError("Second argument must be a string or a Uint8Array");
          }
        }
        const options = {
          [kByteLength]: buf.length,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 8,
          readOnly: false,
          rsv1: false
        };
        if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, buf, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(buf, options), cb);
        }
      }
      /**
       * Sends a ping message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      ping(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 9,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a pong message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      pong(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 10,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a data message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Object} options Options object
       * @param {Boolean} [options.binary=false] Specifies whether `data` is binary
       *     or text
       * @param {Boolean} [options.compress=false] Specifies whether or not to
       *     compress `data`
       * @param {Boolean} [options.fin=false] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Function} [cb] Callback
       * @public
       */
      send(data, options, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate2.extensionName];
        let opcode = options.binary ? 2 : 1;
        let rsv1 = options.compress;
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (this._firstFragment) {
          this._firstFragment = false;
          if (rsv1 && perMessageDeflate && perMessageDeflate.params[perMessageDeflate._isServer ? "server_no_context_takeover" : "client_no_context_takeover"]) {
            rsv1 = byteLength >= perMessageDeflate._threshold;
          }
          this._compress = rsv1;
        } else {
          rsv1 = false;
          opcode = 0;
        }
        if (options.fin) this._firstFragment = true;
        const opts = {
          [kByteLength]: byteLength,
          fin: options.fin,
          generateMask: this._generateMask,
          mask: options.mask,
          maskBuffer: this._maskBuffer,
          opcode,
          readOnly,
          rsv1
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, this._compress, opts, cb]);
          } else {
            this.getBlobData(data, this._compress, opts, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, this._compress, opts, cb]);
        } else {
          this.dispatch(data, this._compress, opts, cb);
        }
      }
      /**
       * Gets the contents of a blob as binary data.
       *
       * @param {Blob} blob The blob
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     the data
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      getBlobData(blob, compress, options, cb) {
        this._bufferedBytes += options[kByteLength];
        this._state = GET_BLOB_DATA;
        blob.arrayBuffer().then((arrayBuffer) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while the blob was being read"
            );
            process.nextTick(callCallbacks, this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          const data = toBuffer(arrayBuffer);
          if (!compress) {
            this._state = DEFAULT;
            this.sendFrame(_Sender.frame(data, options), cb);
            this.dequeue();
          } else {
            this.dispatch(data, compress, options, cb);
          }
        }).catch((err) => {
          process.nextTick(onError, this, err, cb);
        });
      }
      /**
       * Dispatches a message.
       *
       * @param {(Buffer|String)} data The message to send
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     `data`
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      dispatch(data, compress, options, cb) {
        if (!compress) {
          this.sendFrame(_Sender.frame(data, options), cb);
          return;
        }
        const perMessageDeflate = this._extensions[PerMessageDeflate2.extensionName];
        this._bufferedBytes += options[kByteLength];
        this._state = DEFLATING;
        perMessageDeflate.compress(data, options.fin, (_, buf) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while data was being compressed"
            );
            callCallbacks(this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          this._state = DEFAULT;
          options.readOnly = false;
          this.sendFrame(_Sender.frame(buf, options), cb);
          this.dequeue();
        });
      }
      /**
       * Executes queued send operations.
       *
       * @private
       */
      dequeue() {
        while (this._state === DEFAULT && this._queue.length) {
          const params = this._queue.shift();
          this._bufferedBytes -= params[3][kByteLength];
          Reflect.apply(params[0], this, params.slice(1));
        }
      }
      /**
       * Enqueues a send operation.
       *
       * @param {Array} params Send operation parameters.
       * @private
       */
      enqueue(params) {
        this._bufferedBytes += params[3][kByteLength];
        this._queue.push(params);
      }
      /**
       * Sends a frame.
       *
       * @param {(Buffer | String)[]} list The frame to send
       * @param {Function} [cb] Callback
       * @private
       */
      sendFrame(list, cb) {
        if (list.length === 2) {
          this._socket.cork();
          this._socket.write(list[0]);
          this._socket.write(list[1], cb);
          this._socket.uncork();
        } else {
          this._socket.write(list[0], cb);
        }
      }
    };
    module.exports = Sender2;
    function callCallbacks(sender, err, cb) {
      if (typeof cb === "function") cb(err);
      for (let i = 0; i < sender._queue.length; i++) {
        const params = sender._queue[i];
        const callback = params[params.length - 1];
        if (typeof callback === "function") callback(err);
      }
    }
    function onError(sender, err, cb) {
      callCallbacks(sender, err, cb);
      sender.onerror(err);
    }
  }
});

// ../../node_modules/.pnpm/ws@8.22.0/node_modules/ws/lib/event-target.js
var require_event_target = __commonJS({
  "../../node_modules/.pnpm/ws@8.22.0/node_modules/ws/lib/event-target.js"(exports, module) {
    "use strict";
    var { kForOnEventAttribute, kListener } = require_constants2();
    var kCode = /* @__PURE__ */ Symbol("kCode");
    var kData = /* @__PURE__ */ Symbol("kData");
    var kError = /* @__PURE__ */ Symbol("kError");
    var kMessage = /* @__PURE__ */ Symbol("kMessage");
    var kReason = /* @__PURE__ */ Symbol("kReason");
    var kTarget = /* @__PURE__ */ Symbol("kTarget");
    var kType = /* @__PURE__ */ Symbol("kType");
    var kWasClean = /* @__PURE__ */ Symbol("kWasClean");
    var Event = class {
      /**
       * Create a new `Event`.
       *
       * @param {String} type The name of the event
       * @throws {TypeError} If the `type` argument is not specified
       */
      constructor(type) {
        this[kTarget] = null;
        this[kType] = type;
      }
      /**
       * @type {*}
       */
      get target() {
        return this[kTarget];
      }
      /**
       * @type {String}
       */
      get type() {
        return this[kType];
      }
    };
    Object.defineProperty(Event.prototype, "target", { enumerable: true });
    Object.defineProperty(Event.prototype, "type", { enumerable: true });
    var CloseEvent = class extends Event {
      /**
       * Create a new `CloseEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {Number} [options.code=0] The status code explaining why the
       *     connection was closed
       * @param {String} [options.reason=''] A human-readable string explaining why
       *     the connection was closed
       * @param {Boolean} [options.wasClean=false] Indicates whether or not the
       *     connection was cleanly closed
       */
      constructor(type, options = {}) {
        super(type);
        this[kCode] = options.code === void 0 ? 0 : options.code;
        this[kReason] = options.reason === void 0 ? "" : options.reason;
        this[kWasClean] = options.wasClean === void 0 ? false : options.wasClean;
      }
      /**
       * @type {Number}
       */
      get code() {
        return this[kCode];
      }
      /**
       * @type {String}
       */
      get reason() {
        return this[kReason];
      }
      /**
       * @type {Boolean}
       */
      get wasClean() {
        return this[kWasClean];
      }
    };
    Object.defineProperty(CloseEvent.prototype, "code", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "reason", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "wasClean", { enumerable: true });
    var ErrorEvent = class extends Event {
      /**
       * Create a new `ErrorEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.error=null] The error that generated this event
       * @param {String} [options.message=''] The error message
       */
      constructor(type, options = {}) {
        super(type);
        this[kError] = options.error === void 0 ? null : options.error;
        this[kMessage] = options.message === void 0 ? "" : options.message;
      }
      /**
       * @type {*}
       */
      get error() {
        return this[kError];
      }
      /**
       * @type {String}
       */
      get message() {
        return this[kMessage];
      }
    };
    Object.defineProperty(ErrorEvent.prototype, "error", { enumerable: true });
    Object.defineProperty(ErrorEvent.prototype, "message", { enumerable: true });
    var MessageEvent = class extends Event {
      /**
       * Create a new `MessageEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.data=null] The message content
       */
      constructor(type, options = {}) {
        super(type);
        this[kData] = options.data === void 0 ? null : options.data;
      }
      /**
       * @type {*}
       */
      get data() {
        return this[kData];
      }
    };
    Object.defineProperty(MessageEvent.prototype, "data", { enumerable: true });
    var EventTarget = {
      /**
       * Register an event listener.
       *
       * @param {String} type A string representing the event type to listen for
       * @param {(Function|Object)} handler The listener to add
       * @param {Object} [options] An options object specifies characteristics about
       *     the event listener
       * @param {Boolean} [options.once=false] A `Boolean` indicating that the
       *     listener should be invoked at most once after being added. If `true`,
       *     the listener would be automatically removed when invoked.
       * @public
       */
      addEventListener(type, handler, options = {}) {
        for (const listener of this.listeners(type)) {
          if (!options[kForOnEventAttribute] && listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            return;
          }
        }
        let wrapper;
        if (type === "message") {
          wrapper = function onMessage(data, isBinary) {
            const event = new MessageEvent("message", {
              data: isBinary ? data : data.toString()
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "close") {
          wrapper = function onClose(code, message2) {
            const event = new CloseEvent("close", {
              code,
              reason: message2.toString(),
              wasClean: this._closeFrameReceived && this._closeFrameSent
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "error") {
          wrapper = function onError(error) {
            const event = new ErrorEvent("error", {
              error,
              message: error.message
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "open") {
          wrapper = function onOpen() {
            const event = new Event("open");
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else {
          return;
        }
        wrapper[kForOnEventAttribute] = !!options[kForOnEventAttribute];
        wrapper[kListener] = handler;
        if (options.once) {
          this.once(type, wrapper);
        } else {
          this.on(type, wrapper);
        }
      },
      /**
       * Remove an event listener.
       *
       * @param {String} type A string representing the event type to remove
       * @param {(Function|Object)} handler The listener to remove
       * @public
       */
      removeEventListener(type, handler) {
        for (const listener of this.listeners(type)) {
          if (listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            this.removeListener(type, listener);
            break;
          }
        }
      }
    };
    module.exports = {
      CloseEvent,
      ErrorEvent,
      Event,
      EventTarget,
      MessageEvent
    };
    function callListener(listener, thisArg, event) {
      if (typeof listener === "object" && listener.handleEvent) {
        listener.handleEvent.call(listener, event);
      } else {
        listener.call(thisArg, event);
      }
    }
  }
});

// ../../node_modules/.pnpm/ws@8.22.0/node_modules/ws/lib/extension.js
var require_extension = __commonJS({
  "../../node_modules/.pnpm/ws@8.22.0/node_modules/ws/lib/extension.js"(exports, module) {
    "use strict";
    var { tokenChars } = require_validation();
    function push(dest, name, elem) {
      if (dest[name] === void 0) dest[name] = [elem];
      else dest[name].push(elem);
    }
    function parse6(header) {
      const offers = /* @__PURE__ */ Object.create(null);
      let params = /* @__PURE__ */ Object.create(null);
      let mustUnescape = false;
      let isEscaping = false;
      let inQuotes = false;
      let extensionName;
      let paramName;
      let start = -1;
      let code = -1;
      let end = -1;
      let i = 0;
      for (; i < header.length; i++) {
        code = header.charCodeAt(i);
        if (extensionName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (i !== 0 && (code === 32 || code === 9)) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            const name = header.slice(start, end);
            if (code === 44) {
              push(offers, name, params);
              params = /* @__PURE__ */ Object.create(null);
            } else {
              extensionName = name;
            }
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else if (paramName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (code === 32 || code === 9) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            push(params, header.slice(start, end), true);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            start = end = -1;
          } else if (code === 61 && start !== -1 && end === -1) {
            paramName = header.slice(start, i);
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else {
          if (isEscaping) {
            if (tokenChars[code] !== 1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (start === -1) start = i;
            else if (!mustUnescape) mustUnescape = true;
            isEscaping = false;
          } else if (inQuotes) {
            if (tokenChars[code] === 1) {
              if (start === -1) start = i;
            } else if (code === 34 && start !== -1) {
              inQuotes = false;
              end = i;
            } else if (code === 92) {
              isEscaping = true;
            } else {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
          } else if (code === 34 && header.charCodeAt(i - 1) === 61) {
            inQuotes = true;
          } else if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (start !== -1 && (code === 32 || code === 9)) {
            if (end === -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            let value = header.slice(start, end);
            if (mustUnescape) {
              value = value.replace(/\\/g, "");
              mustUnescape = false;
            }
            push(params, paramName, value);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            paramName = void 0;
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        }
      }
      if (start === -1 || inQuotes || code === 32 || code === 9) {
        throw new SyntaxError("Unexpected end of input");
      }
      if (end === -1) end = i;
      const token = header.slice(start, end);
      if (extensionName === void 0) {
        push(offers, token, params);
      } else {
        if (paramName === void 0) {
          push(params, token, true);
        } else if (mustUnescape) {
          push(params, paramName, token.replace(/\\/g, ""));
        } else {
          push(params, paramName, token);
        }
        push(offers, extensionName, params);
      }
      return offers;
    }
    function format(extensions) {
      return Object.keys(extensions).map((extension2) => {
        let configurations = extensions[extension2];
        if (!Array.isArray(configurations)) configurations = [configurations];
        return configurations.map((params) => {
          return [extension2].concat(
            Object.keys(params).map((k) => {
              let values = params[k];
              if (!Array.isArray(values)) values = [values];
              return values.map((v) => v === true ? k : `${k}=${v}`).join("; ");
            })
          ).join("; ");
        }).join(", ");
      }).join(", ");
    }
    module.exports = { format, parse: parse6 };
  }
});

// ../../node_modules/.pnpm/ws@8.22.0/node_modules/ws/lib/websocket.js
var require_websocket = __commonJS({
  "../../node_modules/.pnpm/ws@8.22.0/node_modules/ws/lib/websocket.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events");
    var https = __require("https");
    var http = __require("http");
    var net = __require("net");
    var tls = __require("tls");
    var { randomBytes: randomBytes10, createHash: createHash2 } = __require("crypto");
    var { Duplex, Readable } = __require("stream");
    var { URL: URL2 } = __require("url");
    var PerMessageDeflate2 = require_permessage_deflate();
    var Receiver2 = require_receiver();
    var Sender2 = require_sender();
    var { isBlob } = require_validation();
    var {
      BINARY_TYPES,
      CLOSE_TIMEOUT,
      EMPTY_BUFFER: EMPTY_BUFFER2,
      GUID,
      kForOnEventAttribute,
      kListener,
      kStatusCode,
      kWebSocket,
      NOOP
    } = require_constants2();
    var {
      EventTarget: { addEventListener, removeEventListener }
    } = require_event_target();
    var { format, parse: parse6 } = require_extension();
    var { toBuffer } = require_buffer_util();
    var kAborted = /* @__PURE__ */ Symbol("kAborted");
    var protocolVersions = [8, 13];
    var readyStates = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];
    var subprotocolRegex = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/;
    var WebSocket2 = class _WebSocket extends EventEmitter {
      /**
       * Create a new `WebSocket`.
       *
       * @param {(String|URL)} address The URL to which to connect
       * @param {(String|String[])} [protocols] The subprotocols
       * @param {Object} [options] Connection options
       */
      constructor(address, protocols, options) {
        super();
        this._binaryType = BINARY_TYPES[0];
        this._closeCode = 1006;
        this._closeFrameReceived = false;
        this._closeFrameSent = false;
        this._closeMessage = EMPTY_BUFFER2;
        this._closeTimer = null;
        this._errorEmitted = false;
        this._extensions = {};
        this._paused = false;
        this._protocol = "";
        this._readyState = _WebSocket.CONNECTING;
        this._receiver = null;
        this._sender = null;
        this._socket = null;
        if (address !== null) {
          this._bufferedAmount = 0;
          this._isServer = false;
          this._redirects = 0;
          if (protocols === void 0) {
            if (!options || options.protocols === void 0) {
              protocols = [];
            } else if (Array.isArray(options.protocols)) {
              protocols = options.protocols;
            } else {
              protocols = [options.protocols];
            }
          } else if (!Array.isArray(protocols)) {
            if (typeof protocols === "object" && protocols !== null) {
              options = protocols;
              if (options.protocols === void 0) {
                protocols = [];
              } else if (Array.isArray(options.protocols)) {
                protocols = options.protocols;
              } else {
                protocols = [options.protocols];
              }
            } else {
              protocols = [protocols];
            }
          }
          initAsClient(this, address, protocols, options);
        } else {
          this._autoPong = options.autoPong;
          this._closeTimeout = options.closeTimeout;
          this._isServer = true;
        }
      }
      /**
       * For historical reasons, the custom "nodebuffer" type is used by the default
       * instead of "blob".
       *
       * @type {String}
       */
      get binaryType() {
        return this._binaryType;
      }
      set binaryType(type) {
        if (!BINARY_TYPES.includes(type)) return;
        this._binaryType = type;
        if (this._receiver) this._receiver._binaryType = type;
      }
      /**
       * @type {Number}
       */
      get bufferedAmount() {
        if (!this._socket) return this._bufferedAmount;
        return this._socket._writableState.length + this._sender._bufferedBytes;
      }
      /**
       * @type {String}
       */
      get extensions() {
        return Object.keys(this._extensions).join();
      }
      /**
       * @type {Boolean}
       */
      get isPaused() {
        return this._paused;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onclose() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onerror() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onopen() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onmessage() {
        return null;
      }
      /**
       * @type {String}
       */
      get protocol() {
        return this._protocol;
      }
      /**
       * @type {Number}
       */
      get readyState() {
        return this._readyState;
      }
      /**
       * @type {String}
       */
      get url() {
        return this._url;
      }
      /**
       * Set up the socket and the internal resources.
       *
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Object} options Options object
       * @param {Boolean} [options.allowSynchronousEvents=false] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Number} [options.maxBufferedChunks=0] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=0] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=0] The maximum allowed message size
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @private
       */
      setSocket(socket, head, options) {
        const receiver = new Receiver2({
          allowSynchronousEvents: options.allowSynchronousEvents,
          binaryType: this.binaryType,
          extensions: this._extensions,
          isServer: this._isServer,
          maxBufferedChunks: options.maxBufferedChunks,
          maxFragments: options.maxFragments,
          maxPayload: options.maxPayload,
          skipUTF8Validation: options.skipUTF8Validation
        });
        const sender = new Sender2(socket, this._extensions, options.generateMask);
        this._receiver = receiver;
        this._sender = sender;
        this._socket = socket;
        receiver[kWebSocket] = this;
        sender[kWebSocket] = this;
        socket[kWebSocket] = this;
        receiver.on("conclude", receiverOnConclude);
        receiver.on("drain", receiverOnDrain);
        receiver.on("error", receiverOnError);
        receiver.on("message", receiverOnMessage);
        receiver.on("ping", receiverOnPing);
        receiver.on("pong", receiverOnPong);
        sender.onerror = senderOnError;
        if (socket.setTimeout) socket.setTimeout(0);
        if (socket.setNoDelay) socket.setNoDelay();
        if (head.length > 0) socket.unshift(head);
        socket.on("close", socketOnClose);
        socket.on("data", socketOnData);
        socket.on("end", socketOnEnd);
        socket.on("error", socketOnError);
        this._readyState = _WebSocket.OPEN;
        this.emit("open");
      }
      /**
       * Emit the `'close'` event.
       *
       * @private
       */
      emitClose() {
        if (!this._socket) {
          this._readyState = _WebSocket.CLOSED;
          this.emit("close", this._closeCode, this._closeMessage);
          return;
        }
        if (this._extensions[PerMessageDeflate2.extensionName]) {
          this._extensions[PerMessageDeflate2.extensionName].cleanup();
        }
        this._receiver.removeAllListeners();
        this._readyState = _WebSocket.CLOSED;
        this.emit("close", this._closeCode, this._closeMessage);
      }
      /**
       * Start a closing handshake.
       *
       *          +----------+   +-----------+   +----------+
       *     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
       *    |     +----------+   +-----------+   +----------+     |
       *          +----------+   +-----------+         |
       * CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
       *          +----------+   +-----------+   |
       *    |           |                        |   +---+        |
       *                +------------------------+-->|fin| - - - -
       *    |         +---+                      |   +---+
       *     - - - - -|fin|<---------------------+
       *              +---+
       *
       * @param {Number} [code] Status code explaining why the connection is closing
       * @param {(String|Buffer)} [data] The reason why the connection is
       *     closing
       * @public
       */
      close(code, data) {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this.readyState === _WebSocket.CLOSING) {
          if (this._closeFrameSent && (this._closeFrameReceived || this._receiver._writableState.errorEmitted)) {
            this._socket.end();
          }
          return;
        }
        this._sender.close(code, data, !this._isServer, (err) => {
          if (err) return;
          this._closeFrameSent = true;
          if (this._closeFrameReceived || this._receiver._writableState.errorEmitted) {
            this._socket.end();
          }
        });
        this._readyState = _WebSocket.CLOSING;
        setCloseTimer(this);
      }
      /**
       * Pause the socket.
       *
       * @public
       */
      pause() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = true;
        this._socket.pause();
      }
      /**
       * Send a ping.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the ping is sent
       * @public
       */
      ping(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.ping(data || EMPTY_BUFFER2, mask, cb);
      }
      /**
       * Send a pong.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the pong is sent
       * @public
       */
      pong(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.pong(data || EMPTY_BUFFER2, mask, cb);
      }
      /**
       * Resume the socket.
       *
       * @public
       */
      resume() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = false;
        if (!this._receiver._writableState.needDrain) this._socket.resume();
      }
      /**
       * Send a data message.
       *
       * @param {*} data The message to send
       * @param {Object} [options] Options object
       * @param {Boolean} [options.binary] Specifies whether `data` is binary or
       *     text
       * @param {Boolean} [options.compress] Specifies whether or not to compress
       *     `data`
       * @param {Boolean} [options.fin=true] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when data is written out
       * @public
       */
      send(data, options, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof options === "function") {
          cb = options;
          options = {};
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        const opts = {
          binary: typeof data !== "string",
          mask: !this._isServer,
          compress: true,
          fin: true,
          ...options
        };
        if (!this._extensions[PerMessageDeflate2.extensionName]) {
          opts.compress = false;
        }
        this._sender.send(data || EMPTY_BUFFER2, opts, cb);
      }
      /**
       * Forcibly close the connection.
       *
       * @public
       */
      terminate() {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this._socket) {
          this._readyState = _WebSocket.CLOSING;
          this._socket.destroy();
        }
      }
    };
    Object.defineProperty(WebSocket2, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2.prototype, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2.prototype, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    [
      "binaryType",
      "bufferedAmount",
      "extensions",
      "isPaused",
      "protocol",
      "readyState",
      "url"
    ].forEach((property) => {
      Object.defineProperty(WebSocket2.prototype, property, { enumerable: true });
    });
    ["open", "error", "close", "message"].forEach((method) => {
      Object.defineProperty(WebSocket2.prototype, `on${method}`, {
        enumerable: true,
        get() {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) return listener[kListener];
          }
          return null;
        },
        set(handler) {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) {
              this.removeListener(method, listener);
              break;
            }
          }
          if (typeof handler !== "function") return;
          this.addEventListener(method, handler, {
            [kForOnEventAttribute]: true
          });
        }
      });
    });
    WebSocket2.prototype.addEventListener = addEventListener;
    WebSocket2.prototype.removeEventListener = removeEventListener;
    module.exports = WebSocket2;
    function initAsClient(websocket, address, protocols, options) {
      const opts = {
        allowSynchronousEvents: true,
        autoPong: true,
        closeTimeout: CLOSE_TIMEOUT,
        protocolVersion: protocolVersions[1],
        maxBufferedChunks: 256 * 1024,
        maxFragments: 16 * 1024,
        maxPayload: 100 * 1024 * 1024,
        skipUTF8Validation: false,
        perMessageDeflate: true,
        followRedirects: false,
        maxRedirects: 10,
        ...options,
        socketPath: void 0,
        hostname: void 0,
        protocol: void 0,
        protocols: void 0,
        timeout: void 0,
        method: "GET",
        host: void 0,
        path: void 0,
        port: void 0
      };
      websocket._autoPong = opts.autoPong;
      websocket._closeTimeout = opts.closeTimeout;
      if (!protocolVersions.includes(opts.protocolVersion)) {
        throw new RangeError(
          `Unsupported protocol version: ${opts.protocolVersion} (supported versions: ${protocolVersions.join(", ")})`
        );
      }
      let parsedUrl;
      if (address instanceof URL2) {
        parsedUrl = address;
      } else {
        try {
          parsedUrl = new URL2(address);
        } catch {
          throw new SyntaxError(`Invalid URL: ${address}`);
        }
      }
      if (parsedUrl.protocol === "http:") {
        parsedUrl.protocol = "ws:";
      } else if (parsedUrl.protocol === "https:") {
        parsedUrl.protocol = "wss:";
      }
      websocket._url = parsedUrl.href;
      const isSecure = parsedUrl.protocol === "wss:";
      const isIpcUrl = parsedUrl.protocol === "ws+unix:";
      let invalidUrlMessage;
      if (parsedUrl.protocol !== "ws:" && !isSecure && !isIpcUrl) {
        invalidUrlMessage = `The URL's protocol must be one of "ws:", "wss:", "http:", "https:", or "ws+unix:"`;
      } else if (isIpcUrl && !parsedUrl.pathname) {
        invalidUrlMessage = "The URL's pathname is empty";
      } else if (parsedUrl.hash) {
        invalidUrlMessage = "The URL contains a fragment identifier";
      }
      if (invalidUrlMessage) {
        const err = new SyntaxError(invalidUrlMessage);
        if (websocket._redirects === 0) {
          throw err;
        } else {
          emitErrorAndClose(websocket, err);
          return;
        }
      }
      const defaultPort = isSecure ? 443 : 80;
      const key2 = randomBytes10(16).toString("base64");
      const request2 = isSecure ? https.request : http.request;
      const protocolSet = /* @__PURE__ */ new Set();
      let perMessageDeflate;
      opts.createConnection = opts.createConnection || (isSecure ? tlsConnect : netConnect);
      opts.defaultPort = opts.defaultPort || defaultPort;
      opts.port = parsedUrl.port || defaultPort;
      opts.host = parsedUrl.hostname.startsWith("[") ? parsedUrl.hostname.slice(1, -1) : parsedUrl.hostname;
      opts.headers = {
        ...opts.headers,
        "Sec-WebSocket-Version": opts.protocolVersion,
        "Sec-WebSocket-Key": key2,
        Connection: "Upgrade",
        Upgrade: "websocket"
      };
      opts.path = parsedUrl.pathname + parsedUrl.search;
      opts.timeout = opts.handshakeTimeout;
      if (opts.perMessageDeflate) {
        perMessageDeflate = new PerMessageDeflate2({
          ...opts.perMessageDeflate,
          isServer: false,
          maxPayload: opts.maxPayload
        });
        opts.headers["Sec-WebSocket-Extensions"] = format({
          [PerMessageDeflate2.extensionName]: perMessageDeflate.offer()
        });
      }
      if (protocols.length) {
        for (const protocol of protocols) {
          if (typeof protocol !== "string" || !subprotocolRegex.test(protocol) || protocolSet.has(protocol)) {
            throw new SyntaxError(
              "An invalid or duplicated subprotocol was specified"
            );
          }
          protocolSet.add(protocol);
        }
        opts.headers["Sec-WebSocket-Protocol"] = protocols.join(",");
      }
      if (opts.origin) {
        if (opts.protocolVersion < 13) {
          opts.headers["Sec-WebSocket-Origin"] = opts.origin;
        } else {
          opts.headers.Origin = opts.origin;
        }
      }
      if (parsedUrl.username || parsedUrl.password) {
        opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
      }
      if (isIpcUrl) {
        const parts = opts.path.split(":");
        opts.socketPath = parts[0];
        opts.path = parts[1];
      }
      let req;
      if (opts.followRedirects) {
        if (websocket._redirects === 0) {
          websocket._originalIpc = isIpcUrl;
          websocket._originalSecure = isSecure;
          websocket._originalHostOrSocketPath = isIpcUrl ? opts.socketPath : parsedUrl.host;
          const headers = options && options.headers;
          options = { ...options, headers: {} };
          if (headers) {
            for (const [key3, value] of Object.entries(headers)) {
              options.headers[key3.toLowerCase()] = value;
            }
          }
        } else if (websocket.listenerCount("redirect") === 0) {
          const isSameHost = isIpcUrl ? websocket._originalIpc ? opts.socketPath === websocket._originalHostOrSocketPath : false : websocket._originalIpc ? false : parsedUrl.host === websocket._originalHostOrSocketPath;
          if (!isSameHost || websocket._originalSecure && !isSecure) {
            delete opts.headers.authorization;
            delete opts.headers.cookie;
            if (!isSameHost) delete opts.headers.host;
            opts.auth = void 0;
          }
        }
        if (opts.auth && !options.headers.authorization) {
          options.headers.authorization = "Basic " + Buffer.from(opts.auth).toString("base64");
        }
        req = websocket._req = request2(opts);
        if (websocket._redirects) {
          websocket.emit("redirect", websocket.url, req);
        }
      } else {
        req = websocket._req = request2(opts);
      }
      if (opts.timeout) {
        req.on("timeout", () => {
          abortHandshake(websocket, req, "Opening handshake has timed out");
        });
      }
      req.on("error", (err) => {
        if (req === null || req[kAborted]) return;
        req = websocket._req = null;
        emitErrorAndClose(websocket, err);
      });
      req.on("response", (res) => {
        const location = res.headers.location;
        const statusCode = res.statusCode;
        if (location && opts.followRedirects && statusCode >= 300 && statusCode < 400) {
          if (++websocket._redirects > opts.maxRedirects) {
            abortHandshake(websocket, req, "Maximum redirects exceeded");
            return;
          }
          req.abort();
          let addr;
          try {
            addr = new URL2(location, address);
          } catch (e) {
            const err = new SyntaxError(`Invalid URL: ${location}`);
            emitErrorAndClose(websocket, err);
            return;
          }
          initAsClient(websocket, addr, protocols, options);
        } else if (!websocket.emit("unexpected-response", req, res)) {
          abortHandshake(
            websocket,
            req,
            `Unexpected server response: ${res.statusCode}`
          );
        }
      });
      req.on("upgrade", (res, socket, head) => {
        websocket.emit("upgrade", res);
        if (websocket.readyState !== WebSocket2.CONNECTING) return;
        req = websocket._req = null;
        const upgrade = res.headers.upgrade;
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          abortHandshake(websocket, socket, "Invalid Upgrade header");
          return;
        }
        const digest2 = createHash2("sha1").update(key2 + GUID).digest("base64");
        if (res.headers["sec-websocket-accept"] !== digest2) {
          abortHandshake(websocket, socket, "Invalid Sec-WebSocket-Accept header");
          return;
        }
        const serverProt = res.headers["sec-websocket-protocol"];
        let protError;
        if (serverProt !== void 0) {
          if (!protocolSet.size) {
            protError = "Server sent a subprotocol but none was requested";
          } else if (!protocolSet.has(serverProt)) {
            protError = "Server sent an invalid subprotocol";
          }
        } else if (protocolSet.size) {
          protError = "Server sent no subprotocol";
        }
        if (protError) {
          abortHandshake(websocket, socket, protError);
          return;
        }
        if (serverProt) websocket._protocol = serverProt;
        const secWebSocketExtensions = res.headers["sec-websocket-extensions"];
        if (secWebSocketExtensions !== void 0) {
          if (!perMessageDeflate) {
            const message2 = "Server sent a Sec-WebSocket-Extensions header but no extension was requested";
            abortHandshake(websocket, socket, message2);
            return;
          }
          let extensions;
          try {
            extensions = parse6(secWebSocketExtensions);
          } catch (err) {
            const message2 = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message2);
            return;
          }
          const extensionNames = Object.keys(extensions);
          if (extensionNames.length !== 1 || extensionNames[0] !== PerMessageDeflate2.extensionName) {
            const message2 = "Server indicated an extension that was not requested";
            abortHandshake(websocket, socket, message2);
            return;
          }
          try {
            perMessageDeflate.accept(extensions[PerMessageDeflate2.extensionName]);
          } catch (err) {
            const message2 = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message2);
            return;
          }
          websocket._extensions[PerMessageDeflate2.extensionName] = perMessageDeflate;
        }
        websocket.setSocket(socket, head, {
          allowSynchronousEvents: opts.allowSynchronousEvents,
          generateMask: opts.generateMask,
          maxBufferedChunks: opts.maxBufferedChunks,
          maxFragments: opts.maxFragments,
          maxPayload: opts.maxPayload,
          skipUTF8Validation: opts.skipUTF8Validation
        });
      });
      if (opts.finishRequest) {
        opts.finishRequest(req, websocket);
      } else {
        req.end();
      }
    }
    function emitErrorAndClose(websocket, err) {
      websocket._readyState = WebSocket2.CLOSING;
      websocket._errorEmitted = true;
      websocket.emit("error", err);
      websocket.emitClose();
    }
    function netConnect(options) {
      options.path = options.socketPath;
      return net.connect(options);
    }
    function tlsConnect(options) {
      options.path = void 0;
      if (!options.servername && options.servername !== "") {
        options.servername = net.isIP(options.host) ? "" : options.host;
      }
      return tls.connect(options);
    }
    function abortHandshake(websocket, stream, message2) {
      websocket._readyState = WebSocket2.CLOSING;
      const err = new Error(message2);
      Error.captureStackTrace(err, abortHandshake);
      if (stream.setHeader) {
        stream[kAborted] = true;
        stream.abort();
        if (stream.socket && !stream.socket.destroyed) {
          stream.socket.destroy();
        }
        process.nextTick(emitErrorAndClose, websocket, err);
      } else {
        stream.destroy(err);
        stream.once("error", websocket.emit.bind(websocket, "error"));
        stream.once("close", websocket.emitClose.bind(websocket));
      }
    }
    function sendAfterClose(websocket, data, cb) {
      if (data) {
        const length = isBlob(data) ? data.size : toBuffer(data).length;
        if (websocket._socket) websocket._sender._bufferedBytes += length;
        else websocket._bufferedAmount += length;
      }
      if (cb) {
        const err = new Error(
          `WebSocket is not open: readyState ${websocket.readyState} (${readyStates[websocket.readyState]})`
        );
        process.nextTick(cb, err);
      }
    }
    function receiverOnConclude(code, reason) {
      const websocket = this[kWebSocket];
      websocket._closeFrameReceived = true;
      websocket._closeMessage = reason;
      websocket._closeCode = code;
      if (websocket._socket[kWebSocket] === void 0) return;
      websocket._socket.removeListener("data", socketOnData);
      process.nextTick(resume, websocket._socket);
      if (code === 1005) websocket.close();
      else websocket.close(code, reason);
    }
    function receiverOnDrain() {
      const websocket = this[kWebSocket];
      if (!websocket.isPaused) websocket._socket.resume();
    }
    function receiverOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket._socket[kWebSocket] !== void 0) {
        websocket._socket.removeListener("data", socketOnData);
        process.nextTick(resume, websocket._socket);
        websocket.close(err[kStatusCode]);
      }
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function receiverOnFinish() {
      this[kWebSocket].emitClose();
    }
    function receiverOnMessage(data, isBinary) {
      this[kWebSocket].emit("message", data, isBinary);
    }
    function receiverOnPing(data) {
      const websocket = this[kWebSocket];
      if (websocket._autoPong) websocket.pong(data, !this._isServer, NOOP);
      websocket.emit("ping", data);
    }
    function receiverOnPong(data) {
      this[kWebSocket].emit("pong", data);
    }
    function resume(stream) {
      stream.resume();
    }
    function senderOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket.readyState === WebSocket2.CLOSED) return;
      if (websocket.readyState === WebSocket2.OPEN) {
        websocket._readyState = WebSocket2.CLOSING;
        setCloseTimer(websocket);
      }
      this._socket.end();
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function setCloseTimer(websocket) {
      websocket._closeTimer = setTimeout(
        websocket._socket.destroy.bind(websocket._socket),
        websocket._closeTimeout
      );
    }
    function socketOnClose() {
      const websocket = this[kWebSocket];
      this.removeListener("close", socketOnClose);
      this.removeListener("data", socketOnData);
      this.removeListener("end", socketOnEnd);
      websocket._readyState = WebSocket2.CLOSING;
      if (!this._readableState.endEmitted && !websocket._closeFrameReceived && !websocket._receiver._writableState.errorEmitted && this._readableState.length !== 0) {
        const chunk = this.read(this._readableState.length);
        websocket._receiver.write(chunk);
      }
      websocket._receiver.end();
      this[kWebSocket] = void 0;
      clearTimeout(websocket._closeTimer);
      if (websocket._receiver._writableState.finished || websocket._receiver._writableState.errorEmitted) {
        websocket.emitClose();
      } else {
        websocket._receiver.on("error", receiverOnFinish);
        websocket._receiver.on("finish", receiverOnFinish);
      }
    }
    function socketOnData(chunk) {
      if (!this[kWebSocket]._receiver.write(chunk)) {
        this.pause();
      }
    }
    function socketOnEnd() {
      const websocket = this[kWebSocket];
      websocket._readyState = WebSocket2.CLOSING;
      websocket._receiver.end();
      this.end();
    }
    function socketOnError() {
      const websocket = this[kWebSocket];
      this.removeListener("error", socketOnError);
      this.on("error", NOOP);
      if (websocket) {
        websocket._readyState = WebSocket2.CLOSING;
        this.destroy();
      }
    }
  }
});

// ../../node_modules/.pnpm/ws@8.22.0/node_modules/ws/lib/stream.js
var require_stream = __commonJS({
  "../../node_modules/.pnpm/ws@8.22.0/node_modules/ws/lib/stream.js"(exports, module) {
    "use strict";
    var WebSocket2 = require_websocket();
    var { Duplex } = __require("stream");
    function emitClose(stream) {
      stream.emit("close");
    }
    function duplexOnEnd() {
      if (!this.destroyed && this._writableState.finished) {
        this.destroy();
      }
    }
    function duplexOnError(err) {
      this.removeListener("error", duplexOnError);
      this.destroy();
      if (this.listenerCount("error") === 0) {
        this.emit("error", err);
      }
    }
    function createWebSocketStream2(ws, options) {
      let terminateOnDestroy = true;
      const duplex = new Duplex({
        ...options,
        autoDestroy: false,
        emitClose: false,
        objectMode: false,
        writableObjectMode: false
      });
      ws.on("message", function message2(msg, isBinary) {
        const data = !isBinary && duplex._readableState.objectMode ? msg.toString() : msg;
        if (!duplex.push(data)) ws.pause();
      });
      ws.once("error", function error(err) {
        if (duplex.destroyed) return;
        terminateOnDestroy = false;
        duplex.destroy(err);
      });
      ws.once("close", function close() {
        if (duplex.destroyed) return;
        duplex.push(null);
      });
      duplex._destroy = function(err, callback) {
        if (ws.readyState === ws.CLOSED) {
          callback(err);
          process.nextTick(emitClose, duplex);
          return;
        }
        let called = false;
        ws.once("error", function error(err2) {
          called = true;
          callback(err2);
        });
        ws.once("close", function close() {
          if (!called) callback(err);
          process.nextTick(emitClose, duplex);
        });
        if (terminateOnDestroy) ws.terminate();
      };
      duplex._final = function(callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open2() {
            duplex._final(callback);
          });
          return;
        }
        if (ws._socket === null) return;
        if (ws._socket._writableState.finished) {
          callback();
          if (duplex._readableState.endEmitted) duplex.destroy();
        } else {
          ws._socket.once("finish", function finish() {
            callback();
          });
          ws.close();
        }
      };
      duplex._read = function() {
        if (ws.isPaused) ws.resume();
      };
      duplex._write = function(chunk, encoding, callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open2() {
            duplex._write(chunk, encoding, callback);
          });
          return;
        }
        ws.send(chunk, callback);
      };
      duplex.on("end", duplexOnEnd);
      duplex.on("error", duplexOnError);
      return duplex;
    }
    module.exports = createWebSocketStream2;
  }
});

// ../../node_modules/.pnpm/ws@8.22.0/node_modules/ws/lib/subprotocol.js
var require_subprotocol = __commonJS({
  "../../node_modules/.pnpm/ws@8.22.0/node_modules/ws/lib/subprotocol.js"(exports, module) {
    "use strict";
    var { tokenChars } = require_validation();
    function parse6(header) {
      const protocols = /* @__PURE__ */ new Set();
      let start = -1;
      let end = -1;
      let i = 0;
      for (i; i < header.length; i++) {
        const code = header.charCodeAt(i);
        if (end === -1 && tokenChars[code] === 1) {
          if (start === -1) start = i;
        } else if (i !== 0 && (code === 32 || code === 9)) {
          if (end === -1 && start !== -1) end = i;
        } else if (code === 44) {
          if (start === -1) {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
          if (end === -1) end = i;
          const protocol2 = header.slice(start, end);
          if (protocols.has(protocol2)) {
            throw new SyntaxError(`The "${protocol2}" subprotocol is duplicated`);
          }
          protocols.add(protocol2);
          start = end = -1;
        } else {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
      }
      if (start === -1 || end !== -1) {
        throw new SyntaxError("Unexpected end of input");
      }
      const protocol = header.slice(start, i);
      if (protocols.has(protocol)) {
        throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
      }
      protocols.add(protocol);
      return protocols;
    }
    module.exports = { parse: parse6 };
  }
});

// ../../node_modules/.pnpm/ws@8.22.0/node_modules/ws/lib/websocket-server.js
var require_websocket_server = __commonJS({
  "../../node_modules/.pnpm/ws@8.22.0/node_modules/ws/lib/websocket-server.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events");
    var http = __require("http");
    var { Duplex } = __require("stream");
    var { createHash: createHash2 } = __require("crypto");
    var extension2 = require_extension();
    var PerMessageDeflate2 = require_permessage_deflate();
    var subprotocol2 = require_subprotocol();
    var WebSocket2 = require_websocket();
    var { CLOSE_TIMEOUT, GUID, kWebSocket } = require_constants2();
    var keyRegex = /^[+/0-9A-Za-z]{22}==$/;
    var RUNNING = 0;
    var CLOSING = 1;
    var CLOSED = 2;
    var WebSocketServer2 = class extends EventEmitter {
      /**
       * Create a `WebSocketServer` instance.
       *
       * @param {Object} options Configuration options
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Boolean} [options.autoPong=true] Specifies whether or not to
       *     automatically send a pong in response to a ping
       * @param {Number} [options.backlog=511] The maximum length of the queue of
       *     pending connections
       * @param {Boolean} [options.clientTracking=true] Specifies whether or not to
       *     track clients
       * @param {Number} [options.closeTimeout=30000] Duration in milliseconds to
       *     wait for the closing handshake to finish after `websocket.close()` is
       *     called
       * @param {Function} [options.handleProtocols] A hook to handle protocols
       * @param {String} [options.host] The hostname where to bind the server
       * @param {Number} [options.maxBufferedChunks=262144] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=16384] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=104857600] The maximum allowed message
       *     size
       * @param {Boolean} [options.noServer=false] Enable no server mode
       * @param {String} [options.path] Accept only connections matching this path
       * @param {(Boolean|Object)} [options.perMessageDeflate=false] Enable/disable
       *     permessage-deflate
       * @param {Number} [options.port] The port where to bind the server
       * @param {(http.Server|https.Server)} [options.server] A pre-created HTTP/S
       *     server to use
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @param {Function} [options.verifyClient] A hook to reject connections
       * @param {Function} [options.WebSocket=WebSocket] Specifies the `WebSocket`
       *     class to use. It must be the `WebSocket` class or class that extends it
       * @param {Function} [callback] A listener for the `listening` event
       */
      constructor(options, callback) {
        super();
        options = {
          allowSynchronousEvents: true,
          autoPong: true,
          maxBufferedChunks: 256 * 1024,
          maxFragments: 16 * 1024,
          maxPayload: 100 * 1024 * 1024,
          skipUTF8Validation: false,
          perMessageDeflate: false,
          handleProtocols: null,
          clientTracking: true,
          closeTimeout: CLOSE_TIMEOUT,
          verifyClient: null,
          noServer: false,
          backlog: null,
          // use default (511 as implemented in net.js)
          server: null,
          host: null,
          path: null,
          port: null,
          WebSocket: WebSocket2,
          ...options
        };
        if (options.port == null && !options.server && !options.noServer || options.port != null && (options.server || options.noServer) || options.server && options.noServer) {
          throw new TypeError(
            'One and only one of the "port", "server", or "noServer" options must be specified'
          );
        }
        if (options.port != null) {
          this._server = http.createServer((req, res) => {
            const body = http.STATUS_CODES[426];
            res.writeHead(426, {
              "Content-Length": body.length,
              "Content-Type": "text/plain"
            });
            res.end(body);
          });
          this._server.listen(
            options.port,
            options.host,
            options.backlog,
            callback
          );
        } else if (options.server) {
          this._server = options.server;
        }
        if (this._server) {
          const emitConnection = this.emit.bind(this, "connection");
          this._removeListeners = addListeners(this._server, {
            listening: this.emit.bind(this, "listening"),
            error: this.emit.bind(this, "error"),
            upgrade: (req, socket, head) => {
              this.handleUpgrade(req, socket, head, emitConnection);
            }
          });
        }
        if (options.perMessageDeflate === true) options.perMessageDeflate = {};
        if (options.clientTracking) {
          this.clients = /* @__PURE__ */ new Set();
          this._shouldEmitClose = false;
        }
        this.options = options;
        this._state = RUNNING;
      }
      /**
       * Returns the bound address, the address family name, and port of the server
       * as reported by the operating system if listening on an IP socket.
       * If the server is listening on a pipe or UNIX domain socket, the name is
       * returned as a string.
       *
       * @return {(Object|String|null)} The address of the server
       * @public
       */
      address() {
        if (this.options.noServer) {
          throw new Error('The server is operating in "noServer" mode');
        }
        if (!this._server) return null;
        return this._server.address();
      }
      /**
       * Stop the server from accepting new connections and emit the `'close'` event
       * when all existing connections are closed.
       *
       * @param {Function} [cb] A one-time listener for the `'close'` event
       * @public
       */
      close(cb) {
        if (this._state === CLOSED) {
          if (cb) {
            this.once("close", () => {
              cb(new Error("The server is not running"));
            });
          }
          process.nextTick(emitClose, this);
          return;
        }
        if (cb) this.once("close", cb);
        if (this._state === CLOSING) return;
        this._state = CLOSING;
        if (this.options.noServer || this.options.server) {
          if (this._server) {
            this._removeListeners();
            this._removeListeners = this._server = null;
          }
          if (this.clients) {
            if (!this.clients.size) {
              process.nextTick(emitClose, this);
            } else {
              this._shouldEmitClose = true;
            }
          } else {
            process.nextTick(emitClose, this);
          }
        } else {
          const server = this._server;
          this._removeListeners();
          this._removeListeners = this._server = null;
          server.close(() => {
            emitClose(this);
          });
        }
      }
      /**
       * See if a given request should be handled by this server instance.
       *
       * @param {http.IncomingMessage} req Request object to inspect
       * @return {Boolean} `true` if the request is valid, else `false`
       * @public
       */
      shouldHandle(req) {
        if (this.options.path) {
          const index = req.url.indexOf("?");
          const pathname = index !== -1 ? req.url.slice(0, index) : req.url;
          if (pathname !== this.options.path) return false;
        }
        return true;
      }
      /**
       * Handle a HTTP Upgrade request.
       *
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @public
       */
      handleUpgrade(req, socket, head, cb) {
        socket.on("error", socketOnError);
        const key2 = req.headers["sec-websocket-key"];
        const upgrade = req.headers.upgrade;
        const version = +req.headers["sec-websocket-version"];
        if (req.method !== "GET") {
          const message2 = "Invalid HTTP method";
          abortHandshakeOrEmitwsClientError(this, req, socket, 405, message2);
          return;
        }
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          const message2 = "Invalid Upgrade header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message2);
          return;
        }
        if (key2 === void 0 || !keyRegex.test(key2)) {
          const message2 = "Missing or invalid Sec-WebSocket-Key header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message2);
          return;
        }
        if (version !== 13 && version !== 8) {
          const message2 = "Missing or invalid Sec-WebSocket-Version header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message2, {
            "Sec-WebSocket-Version": "13, 8"
          });
          return;
        }
        if (!this.shouldHandle(req)) {
          abortHandshake(socket, 400);
          return;
        }
        const secWebSocketProtocol = req.headers["sec-websocket-protocol"];
        let protocols = /* @__PURE__ */ new Set();
        if (secWebSocketProtocol !== void 0) {
          try {
            protocols = subprotocol2.parse(secWebSocketProtocol);
          } catch (err) {
            const message2 = "Invalid Sec-WebSocket-Protocol header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message2);
            return;
          }
        }
        const secWebSocketExtensions = req.headers["sec-websocket-extensions"];
        const extensions = {};
        if (this.options.perMessageDeflate && secWebSocketExtensions !== void 0) {
          const perMessageDeflate = new PerMessageDeflate2({
            ...this.options.perMessageDeflate,
            isServer: true,
            maxPayload: this.options.maxPayload
          });
          try {
            const offers = extension2.parse(secWebSocketExtensions);
            if (offers[PerMessageDeflate2.extensionName]) {
              perMessageDeflate.accept(offers[PerMessageDeflate2.extensionName]);
              extensions[PerMessageDeflate2.extensionName] = perMessageDeflate;
            }
          } catch (err) {
            const message2 = "Invalid or unacceptable Sec-WebSocket-Extensions header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message2);
            return;
          }
        }
        if (this.options.verifyClient) {
          const info = {
            origin: req.headers[`${version === 8 ? "sec-websocket-origin" : "origin"}`],
            secure: !!(req.socket.authorized || req.socket.encrypted),
            req
          };
          if (this.options.verifyClient.length === 2) {
            this.options.verifyClient(info, (verified, code, message2, headers) => {
              if (!verified) {
                return abortHandshake(socket, code || 401, message2, headers);
              }
              this.completeUpgrade(
                extensions,
                key2,
                protocols,
                req,
                socket,
                head,
                cb
              );
            });
            return;
          }
          if (!this.options.verifyClient(info)) return abortHandshake(socket, 401);
        }
        this.completeUpgrade(extensions, key2, protocols, req, socket, head, cb);
      }
      /**
       * Upgrade the connection to WebSocket.
       *
       * @param {Object} extensions The accepted extensions
       * @param {String} key The value of the `Sec-WebSocket-Key` header
       * @param {Set} protocols The subprotocols
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @throws {Error} If called more than once with the same socket
       * @private
       */
      completeUpgrade(extensions, key2, protocols, req, socket, head, cb) {
        if (!socket.readable || !socket.writable) return socket.destroy();
        if (socket[kWebSocket]) {
          throw new Error(
            "server.handleUpgrade() was called more than once with the same socket, possibly due to a misconfiguration"
          );
        }
        if (this._state > RUNNING) return abortHandshake(socket, 503);
        const digest2 = createHash2("sha1").update(key2 + GUID).digest("base64");
        const headers = [
          "HTTP/1.1 101 Switching Protocols",
          "Upgrade: websocket",
          "Connection: Upgrade",
          `Sec-WebSocket-Accept: ${digest2}`
        ];
        const ws = new this.options.WebSocket(null, void 0, this.options);
        if (protocols.size) {
          const protocol = this.options.handleProtocols ? this.options.handleProtocols(protocols, req) : protocols.values().next().value;
          if (protocol) {
            headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
            ws._protocol = protocol;
          }
        }
        if (extensions[PerMessageDeflate2.extensionName]) {
          const params = extensions[PerMessageDeflate2.extensionName].params;
          const value = extension2.format({
            [PerMessageDeflate2.extensionName]: [params]
          });
          headers.push(`Sec-WebSocket-Extensions: ${value}`);
          ws._extensions = extensions;
        }
        this.emit("headers", headers, req);
        socket.write(headers.concat("\r\n").join("\r\n"));
        socket.removeListener("error", socketOnError);
        ws.setSocket(socket, head, {
          allowSynchronousEvents: this.options.allowSynchronousEvents,
          maxBufferedChunks: this.options.maxBufferedChunks,
          maxFragments: this.options.maxFragments,
          maxPayload: this.options.maxPayload,
          skipUTF8Validation: this.options.skipUTF8Validation
        });
        if (this.clients) {
          this.clients.add(ws);
          ws.on("close", () => {
            this.clients.delete(ws);
            if (this._shouldEmitClose && !this.clients.size) {
              process.nextTick(emitClose, this);
            }
          });
        }
        cb(ws, req);
      }
    };
    module.exports = WebSocketServer2;
    function addListeners(server, map) {
      for (const event of Object.keys(map)) server.on(event, map[event]);
      return function removeListeners() {
        for (const event of Object.keys(map)) {
          server.removeListener(event, map[event]);
        }
      };
    }
    function emitClose(server) {
      server._state = CLOSED;
      server.emit("close");
    }
    function socketOnError() {
      this.destroy();
    }
    function abortHandshake(socket, code, message2, headers) {
      message2 = message2 || http.STATUS_CODES[code];
      headers = {
        Connection: "close",
        "Content-Type": "text/html",
        "Content-Length": Buffer.byteLength(message2),
        ...headers
      };
      socket.once("finish", socket.destroy);
      socket.end(
        `HTTP/1.1 ${code} ${http.STATUS_CODES[code]}\r
` + Object.keys(headers).map((h) => `${h}: ${headers[h]}`).join("\r\n") + "\r\n\r\n" + message2
      );
    }
    function abortHandshakeOrEmitwsClientError(server, req, socket, code, message2, headers) {
      if (server.listenerCount("wsClientError")) {
        const err = new Error(message2);
        Error.captureStackTrace(err, abortHandshakeOrEmitwsClientError);
        server.emit("wsClientError", err, socket, req);
      } else {
        abortHandshake(socket, code, message2, headers);
      }
    }
  }
});

// src/main.ts
import { randomBytes as randomBytes9 } from "node:crypto";
import { existsSync as existsSync4, readFileSync as readFileSync6 } from "node:fs";
import { networkInterfaces } from "node:os";
import { dirname as dirname8, join as join6 } from "node:path";
import { fileURLToPath } from "node:url";

// ../protocol/src/frame.ts
var HEADER_LENGTH_BYTES = 4;
var encoder = new TextEncoder();
var decoder = new TextDecoder("utf-8", { fatal: true });
function encodeFrame(header, bytes) {
  const json2 = encoder.encode(JSON.stringify(header));
  const frame = new Uint8Array(HEADER_LENGTH_BYTES + json2.length + (bytes?.length ?? 0));
  new DataView(frame.buffer).setUint32(0, json2.length);
  frame.set(json2, HEADER_LENGTH_BYTES);
  if (bytes) frame.set(bytes, HEADER_LENGTH_BYTES + json2.length);
  return frame;
}
function decodeFrame(data) {
  if (data.length < HEADER_LENGTH_BYTES) return null;
  const length = new DataView(data.buffer, data.byteOffset, data.byteLength).getUint32(0);
  const end = HEADER_LENGTH_BYTES + length;
  if (end > data.length) return null;
  let header;
  try {
    header = JSON.parse(decoder.decode(data.subarray(HEADER_LENGTH_BYTES, end)));
  } catch {
    return null;
  }
  return { header, bytes: end < data.length ? data.slice(end) : null };
}

// ../protocol/src/secure/base64url.ts
var ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
var VALUES = new Map(Array.from({ length: 64 }, (_, index) => [ALPHABET.charAt(index), index]));
function encodeBase64Url(data) {
  let text = "";
  for (let i = 0; i < data.length; i += 3) {
    const a = data[i] ?? 0;
    const b = data[i + 1] ?? 0;
    const c = data[i + 2] ?? 0;
    const chunk = a << 16 | b << 8 | c;
    const chars = Math.min(4, Math.ceil((data.length - i) * 4 / 3));
    for (let j = 0; j < chars; j++) text += ALPHABET[chunk >> 18 - 6 * j & 63];
  }
  return text;
}
function decodeBase64Url(text) {
  if (text.length % 4 === 1) return null;
  const data = new Uint8Array(Math.floor(text.length * 3 / 4));
  let buffer = 0;
  let bits = 0;
  let index = 0;
  for (const char of text) {
    const value = VALUES.get(char);
    if (value === void 0) return null;
    buffer = (buffer << 6 | value) & 16777215;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      data[index++] = buffer >> bits & 255;
    }
  }
  if ((buffer & (1 << bits) - 1) !== 0) return null;
  return data;
}

// ../protocol/src/version.ts
var PROTOCOL = 2;

// ../protocol/src/image-media.ts
var DISPLAYABLE_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp"
];
function isDisplayableImage(media) {
  return DISPLAYABLE_IMAGE_TYPES.includes(media);
}

// ../protocol/src/security-headers.ts
var CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  // Angular and the app set style attributes and a <style> element, so inline styles stay.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  // The relay is another origin chosen at runtime, so any WebSocket target is allowed; fetch stays same-origin.
  "connect-src 'self' ws: wss:",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'"
].join("; ");
var SECURITY_HEADERS = {
  "content-security-policy": CONTENT_SECURITY_POLICY,
  // Older browsers ignore frame-ancestors but honour this one.
  "x-frame-options": "DENY",
  // Dictation needs the microphone and the QR scanner the camera; nothing else is used.
  "permissions-policy": "microphone=(self), camera=(self), geolocation=(), payment=(), usb=(), bluetooth=(), serial=(), hid=()",
  // Nothing cross-origin is embedded (the relay is only a WebSocket), so the strict value is safe.
  "cross-origin-embedder-policy": "require-corp",
  "cross-origin-opener-policy": "same-origin",
  // The app is only ever loaded by its own pages, never embedded by another origin.
  "cross-origin-resource-policy": "same-origin"
};

// ../protocol/src/relay-envelope.ts
var KIND_BYTES = { open: 1, data: 2, close: 3 };
var PREFIX_BYTES = 5;
var CODE_BYTES = 2;
var MAX_REASON_BYTES = 123;
var MAX_STREAM = 4294967295;
var encoder2 = new TextEncoder();
var decoder2 = new TextDecoder("utf-8", { fatal: true });
var isSendableCloseCode = (code) => Number.isInteger(code) && (code === 1e3 || code >= 3e3 && code <= 4999);
function encodeRelayEnvelope(envelope) {
  const { stream } = envelope;
  if (!Number.isInteger(stream) || stream < 0 || stream > MAX_STREAM) {
    throw new Error("relay stream out of range: " + String(stream));
  }
  let payload;
  if (envelope.kind === "open") {
    payload = new Uint8Array(0);
  } else if (envelope.kind === "data") {
    payload = envelope.data;
  } else {
    if (!isSendableCloseCode(envelope.code)) {
      throw new Error("cannot send close code " + String(envelope.code));
    }
    const reason = encoder2.encode(envelope.reason);
    if (reason.length > MAX_REASON_BYTES) throw new Error("close reason too long");
    payload = new Uint8Array(CODE_BYTES + reason.length);
    new DataView(payload.buffer).setUint16(0, envelope.code);
    payload.set(reason, CODE_BYTES);
  }
  const out = new Uint8Array(PREFIX_BYTES + payload.length);
  const view = new DataView(out.buffer);
  view.setUint8(0, KIND_BYTES[envelope.kind]);
  view.setUint32(1, stream);
  out.set(payload, PREFIX_BYTES);
  return out;
}
function decodeRelayEnvelope(data) {
  if (data.length < PREFIX_BYTES) return null;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const stream = view.getUint32(1);
  const payload = data.subarray(PREFIX_BYTES);
  switch (view.getUint8(0)) {
    case KIND_BYTES.open:
      return payload.length === 0 ? { kind: "open", stream } : null;
    case KIND_BYTES.data:
      return { kind: "data", stream, data: payload.slice() };
    case KIND_BYTES.close: {
      if (payload.length < CODE_BYTES || payload.length > CODE_BYTES + MAX_REASON_BYTES) {
        return null;
      }
      const code = view.getUint16(PREFIX_BYTES);
      if (!isSendableCloseCode(code)) return null;
      try {
        return {
          kind: "close",
          stream,
          code,
          reason: decoder2.decode(payload.subarray(CODE_BYTES))
        };
      } catch {
        return null;
      }
    }
    default:
      return null;
  }
}

// ../protocol/src/relay-setting.ts
function relayIsOn(info) {
  return info.on && info.url !== null;
}
var MAX_RELAY_CODE_LENGTH = 256;
var RELAY_URL_PROBLEM = "The relay URL must start with https:// (for example https://my-relay.workers.dev).";
var RELAY_CODE_PROBLEM = "The access code must be 1 to " + String(MAX_RELAY_CODE_LENGTH) + " characters, with no spaces.";
var LOCAL_HOSTS = /* @__PURE__ */ new Set(["127.0.0.1", "localhost", "[::1]"]);
var CODE = /^[\x21-\x7e]+$/;
function checkRelaySetting(url, code) {
  const origin = relayOrigin(url.trim());
  if (!origin) return { ok: false, error: RELAY_URL_PROBLEM };
  const trimmed = code.trim();
  if (trimmed.length > MAX_RELAY_CODE_LENGTH || !CODE.test(trimmed)) {
    return { ok: false, error: RELAY_CODE_PROBLEM };
  }
  return { ok: true, setting: { url: origin, code: trimmed } };
}
function relayOrigin(text) {
  let parsed;
  try {
    parsed = new URL(text);
  } catch {
    return null;
  }
  if (parsed.username || parsed.password) return null;
  if (parsed.protocol === "https:") return parsed.origin;
  if (parsed.protocol === "http:" && LOCAL_HOSTS.has(parsed.hostname)) return parsed.origin;
  return null;
}

// ../../node_modules/.pnpm/@noble+hashes@2.4.0/node_modules/@noble/hashes/_u64.js
var fromNumH = (n) => n / 2 ** 32 | 0;
var fromNumL = (n) => n >>> 0;
function setU64FromNum(view, byteOffset, n, isLE2) {
  const h = fromNumH(n);
  const l = fromNumL(n);
  view.setUint32(byteOffset, isLE2 ? l : h, isLE2);
  view.setUint32(byteOffset + 4, isLE2 ? h : l, isLE2);
}

// ../../node_modules/.pnpm/@noble+hashes@2.4.0/node_modules/@noble/hashes/utils.js
function isBytes(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array" && "BYTES_PER_ELEMENT" in a && a.BYTES_PER_ELEMENT === 1;
}
var atitle = (title) => title ? `"${title}" ` : "";
function anumber(n, title = "") {
  if (typeof n !== "number")
    throw new TypeError(atitle(title) + "expected number, got " + typeof n);
  if (!Number.isSafeInteger(n) || n < 0)
    throw new RangeError(atitle(title) + "expected integer >= 0, got " + n);
  return n;
}
function abytes(value, length, title = "") {
  if (isBytes(value) && (length === void 0 || value.length === length))
    return value;
  if (length !== void 0)
    anumber(length, "length");
  const bytes = isBytes(value);
  const ofLen = length !== void 0 ? ` of length ${length}` : "";
  const got = bytes ? `length=${value.length}` : `type=${typeof value}`;
  const message2 = atitle(title) + "expected Uint8Array" + ofLen + ", got " + got;
  if (!bytes)
    throw new TypeError(message2);
  throw new RangeError(message2);
}
function ahash(h) {
  if (typeof h !== "function" || typeof h.create !== "function")
    throw new TypeError("expected hash wrapped by utils.createHasher");
  anumber(h.outputLen);
  anumber(h.blockLen);
  if (h.outputLen < 1 || h.blockLen < 1)
    throw new Error("hash blockLen / outputLen must be >= 1");
}
var aobject = (value, label) => {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    throw new TypeError((label === "object" ? "" : `"${label}" `) + "expected object, got type=" + typeof value);
};
var aopts = (value, label) => {
  aobject(value, label);
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null)
    throw new TypeError(`"${label}" expected plain object`);
  if (Object.hasOwn(value, "__proto__"))
    throw new TypeError(`"${label}.__proto__" is not allowed`);
};
function aexists(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("hash was destroyed");
  if (checkFinished && instance.finished)
    throw new Error("digest() was already called");
}
function aoutput(out, instance) {
  abytes(out, void 0, "output");
  const min = instance.outputLen;
  if (!(out.length >= min)) {
    throw new RangeError('"output" expected length >= ' + min);
  }
}
function clean(...arrays) {
  for (let i = 0; i < arrays.length; i++) {
    arrays[i].fill(0);
  }
}
function createView(arr) {
  return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
function rotr(word, shift) {
  return word << 32 - shift | word >>> shift;
}
var hasHexBuiltin = /* @__PURE__ */ (() => (
  // @ts-ignore
  typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function"
))();
var hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
function bytesToHex(bytes) {
  abytes(bytes);
  if (hasHexBuiltin)
    return bytes.toHex();
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += hexes[bytes[i]];
  }
  return hex;
}
function asciiToBase16(ch) {
  return ch >= 48 && ch <= 57 ? ch - 48 : ch >= 65 && ch <= 70 ? ch - (65 - 10) : ch >= 97 && ch <= 102 ? ch - (97 - 10) : void 0;
}
function hexToBytes(hex) {
  if (typeof hex !== "string")
    throw new TypeError("hex string expected, got " + typeof hex);
  if (hasHexBuiltin) {
    try {
      return Uint8Array.fromHex(hex);
    } catch (error) {
      if (error instanceof SyntaxError)
        throw new RangeError(error.message);
      throw error;
    }
  }
  const hl = hex.length;
  const al = hl / 2;
  if (hl % 2)
    throw new RangeError("hex string expected, got unpadded hex of length " + hl);
  const array = new Uint8Array(al);
  for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
    const n1 = asciiToBase16(hex.charCodeAt(hi));
    const n2 = asciiToBase16(hex.charCodeAt(hi + 1));
    if (n1 === void 0 || n2 === void 0) {
      const char = hex[hi] + hex[hi + 1];
      throw new RangeError('hex string expected, got non-hex character "' + char + '" at index ' + hi);
    }
    array[ai] = n1 * 16 + n2;
  }
  return array;
}
function concatBytes(...arrays) {
  let sum = 0;
  for (let i = 0; i < arrays.length; i++) {
    const a = arrays[i];
    abytes(a);
    sum += a.length;
  }
  const res = new Uint8Array(sum);
  for (let i = 0, pad2 = 0; i < arrays.length; i++) {
    const a = arrays[i];
    res.set(a, pad2);
    pad2 += a.length;
  }
  return res;
}
function checkOpts(defaults, opts, title = "opts") {
  aopts(defaults, "defaults");
  if (opts !== void 0)
    aopts(opts, title);
  const merged = Object.assign(/* @__PURE__ */ Object.create(null), defaults, opts);
  return merged;
}
function createHasher(hashCons, info = {}) {
  if (typeof hashCons !== "function")
    throw new TypeError('"hashCons" expected function, got type=' + typeof hashCons);
  info = checkOpts({}, info, "info");
  const hashC = (msg, opts) => hashCons(opts).update(msg).digest();
  const tmp = hashCons(void 0);
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.canXOF = tmp.canXOF;
  hashC.create = (opts) => hashCons(opts);
  Object.assign(hashC, info);
  return Object.freeze(hashC);
}
function randomBytes(bytesLength = 32) {
  anumber(bytesLength, "bytesLength");
  const cr = typeof globalThis === "object" ? globalThis.crypto : null;
  if (typeof cr?.getRandomValues !== "function")
    throw new Error("crypto.getRandomValues must be defined");
  if (bytesLength > 65536)
    throw new RangeError(`"bytesLength" expected <= 65536, got ${bytesLength}`);
  return cr.getRandomValues(new Uint8Array(bytesLength));
}
var oidNist = (suffix) => ({
  // Current NIST hashAlgs suffixes used here fit in one DER subidentifier octet.
  // Larger suffix values would need base-128 OID encoding and a different length byte.
  oid: Uint8Array.from([6, 9, 96, 134, 72, 1, 101, 3, 4, 2, suffix])
});

// ../../node_modules/.pnpm/@noble+hashes@2.4.0/node_modules/@noble/hashes/_md.js
function Chi(a, b, c) {
  return a & b ^ ~a & c;
}
function Maj(a, b, c) {
  return a & b ^ a & c ^ b & c;
}
var HashMD = class {
  blockLen;
  outputLen;
  canXOF = false;
  padOffset;
  isLE;
  // For partial updates less than block size
  buffer;
  view;
  finished = false;
  length = 0;
  pos = 0;
  destroyed = false;
  constructor(blockLen, outputLen, padOffset, isLE2) {
    this.blockLen = blockLen;
    this.outputLen = outputLen;
    this.padOffset = padOffset;
    this.isLE = isLE2;
    this.buffer = new Uint8Array(blockLen);
    this.view = createView(this.buffer);
  }
  update(data) {
    aexists(this);
    abytes(data);
    const { view, buffer, blockLen } = this;
    const len = data.length;
    let processed = false;
    for (let pos = 0; pos < len; ) {
      const take = Math.min(blockLen - this.pos, len - pos);
      if (take === blockLen) {
        const dataView = createView(data);
        for (; blockLen <= len - pos; pos += blockLen)
          this.process(dataView, pos);
        processed = true;
        continue;
      }
      buffer.set(pos === 0 && take === len ? data : data.subarray(pos, pos + take), this.pos);
      this.pos += take;
      pos += take;
      if (this.pos === blockLen) {
        this.process(view, 0);
        this.pos = 0;
        processed = true;
      }
    }
    this.length += data.length;
    if (processed)
      this.roundClean();
    return this;
  }
  digestInto(out) {
    aexists(this);
    aoutput(out, this);
    this.finished = true;
    const { buffer, view, blockLen, isLE: isLE2 } = this;
    let { pos } = this;
    buffer[pos++] = 128;
    buffer.fill(0, pos);
    if (this.padOffset > blockLen - pos) {
      this.process(view, 0);
      buffer.fill(0);
    }
    setU64FromNum(view, blockLen - 8, this.length * 8, isLE2);
    this.process(view, 0);
    this.roundClean();
    const oview = out === buffer ? view : createView(out);
    const len = this.outputLen;
    const outLen = len / 4;
    const state = this.get();
    if (len % 4 || outLen > state.length)
      throw new Error("invalid outputLen");
    for (let i = 0; i < outLen; i++)
      oview.setUint32(4 * i, state[i], isLE2);
  }
  digest() {
    const { buffer, outputLen } = this;
    this.digestInto(buffer);
    const res = buffer.slice(0, outputLen);
    this.destroy();
    return res;
  }
  _cloneIntoMeta(to) {
    const { buffer, length, finished, destroyed, pos } = this;
    to.destroyed = destroyed;
    to.finished = finished;
    to.length = length;
    to.pos = pos;
    if (pos)
      to.buffer.set(buffer);
    return to;
  }
  clone() {
    return this._cloneInto();
  }
};
var SHA256_IV = /* @__PURE__ */ Uint32Array.from([
  1779033703,
  3144134277,
  1013904242,
  2773480762,
  1359893119,
  2600822924,
  528734635,
  1541459225
]);

// ../../node_modules/.pnpm/@noble+hashes@2.4.0/node_modules/@noble/hashes/sha2.js
var SHA256_K = /* @__PURE__ */ Uint32Array.from([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);
var SHA256_W = /* @__PURE__ */ new Uint32Array(64);
var SHA2_32B = class extends HashMD {
  // We cannot use array here since array allows indexing by variable
  // which means optimizer/compiler cannot use registers.
  // Numeric initializers matter: starting the fields as `undefined` changes
  // V8's field representation and makes sha256 3x slower (measured).
  A = 0;
  B = 0;
  C = 0;
  D = 0;
  E = 0;
  F = 0;
  G = 0;
  H = 0;
  constructor(outputLen, IV) {
    super(64, outputLen, 8, false);
    this.A = IV[0] | 0;
    this.B = IV[1] | 0;
    this.C = IV[2] | 0;
    this.D = IV[3] | 0;
    this.E = IV[4] | 0;
    this.F = IV[5] | 0;
    this.G = IV[6] | 0;
    this.H = IV[7] | 0;
  }
  get() {
    const { A, B, C, D, E, F, G, H } = this;
    return [A, B, C, D, E, F, G, H];
  }
  // prettier-ignore
  set(A, B, C, D, E, F, G, H) {
    this.A = A | 0;
    this.B = B | 0;
    this.C = C | 0;
    this.D = D | 0;
    this.E = E | 0;
    this.F = F | 0;
    this.G = G | 0;
    this.H = H | 0;
  }
  _cloneInto(to) {
    (to ||= new this.constructor()).set(...this.get());
    return this._cloneIntoMeta(to);
  }
  process(view, offset) {
    for (let i = 0; i < 16; i++, offset += 4)
      SHA256_W[i] = view.getUint32(offset, false);
    for (let i = 16; i < 64; i++) {
      const W15 = SHA256_W[i - 15];
      const W2 = SHA256_W[i - 2];
      const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ W15 >>> 3;
      const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ W2 >>> 10;
      SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
    }
    let { A, B, C, D, E, F, G, H } = this;
    for (let i = 0; i < 64; i++) {
      const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
      const T1 = H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i] | 0;
      const sigma0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
      const T2 = sigma0 + Maj(A, B, C) | 0;
      H = G;
      G = F;
      F = E;
      E = D + T1 | 0;
      D = C;
      C = B;
      B = A;
      A = T1 + T2 | 0;
    }
    A = A + this.A | 0;
    B = B + this.B | 0;
    C = C + this.C | 0;
    D = D + this.D | 0;
    E = E + this.E | 0;
    F = F + this.F | 0;
    G = G + this.G | 0;
    H = H + this.H | 0;
    this.set(A, B, C, D, E, F, G, H);
  }
  roundClean() {
    clean(SHA256_W);
  }
  destroy() {
    this.destroyed = true;
    this.set(0, 0, 0, 0, 0, 0, 0, 0);
    clean(this.buffer);
  }
};
var _SHA256 = class extends SHA2_32B {
  constructor() {
    super(32, SHA256_IV);
  }
};
var sha256 = /* @__PURE__ */ createHasher(
  () => new _SHA256(),
  /* @__PURE__ */ oidNist(1)
);

// ../../node_modules/.pnpm/@noble+curves@2.4.0/node_modules/@noble/curves/utils.js
function aarray(item, title, inner = () => {
}) {
  if (!Array.isArray(item))
    throw new TypeError(`"${title}" expected array, got type=${typeof item}`);
  for (let i = 0; i < item.length; i++)
    inner(item[i], `${title}[${i}]`);
  return item;
}
var abytes2 = (value, length, title) => abytes(value, length, title);
var anumber2 = anumber;
function aobject2(value, title = "object") {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    throw new TypeError(title === "object" ? "expected valid options object" : `"${title}" expected object, got type=${typeof value}`);
  return value;
}
function afunction(value, title) {
  if (typeof value !== "function")
    throw new TypeError(`"${title}" is invalid: expected function, got ${typeof value}`);
  return value;
}
var bytesToHex2 = bytesToHex;
var hexToBytes2 = (hex) => hexToBytes(hex);
var isBytes2 = isBytes;
var randomBytes2 = (bytesLength) => randomBytes(bytesLength);
var _0n = /* @__PURE__ */ BigInt(0);
var _1n = /* @__PURE__ */ BigInt(1);
var atitle2 = (title) => title ? `"${title}" ` : "";
function abool(value, title = "") {
  if (typeof value !== "boolean")
    throw new TypeError(atitle2(title) + "expected boolean, got type=" + typeof value);
  return value;
}
function abignumber(n) {
  if (typeof n === "bigint") {
    if (!isPosBig(n))
      throw new RangeError("positive bigint expected, got " + n);
  } else
    anumber2(n);
  return n;
}
function asafenumber(value, title = "") {
  if (typeof value !== "number") {
    const prefix = title && `"${title}" `;
    throw new TypeError(prefix + "expected number, got type=" + typeof value);
  }
  if (!Number.isSafeInteger(value)) {
    const prefix = title && `"${title}" `;
    throw new RangeError(prefix + "expected safe integer, got " + value);
  }
}
function hexToNumber(hex) {
  if (typeof hex !== "string")
    throw new TypeError("hex string expected, got " + typeof hex);
  return hex === "" ? _0n : BigInt("0x" + hex);
}
function bytesToNumberBE(bytes) {
  return hexToNumber(bytesToHex(bytes));
}
function bytesToNumberLE(bytes) {
  return hexToNumber(bytesToHex(copyBytes(abytes(bytes)).reverse()));
}
function numberToBytesBE(n, len) {
  anumber(len);
  if (len === 0)
    throw new Error("zero output length is invalid");
  n = abignumber(n);
  const expectedLen = len * 2;
  const hex = n.toString(16);
  if (hex.length > expectedLen)
    throw new RangeError("number is too large");
  return hexToBytes(hex.padStart(expectedLen, "0"));
}
function numberToBytesLE(n, len) {
  return numberToBytesBE(n, len).reverse();
}
function copyBytes(bytes) {
  return Uint8Array.from(abytes2(bytes));
}
function isPosBig(n) {
  return typeof n === "bigint" && _0n <= n;
}
function inRange(n, min, max) {
  return isPosBig(n) && isPosBig(min) && isPosBig(max) && min <= n && n < max;
}
function aInRange(title, n, min, max) {
  if (!inRange(n, min, max))
    throw new RangeError("expected valid " + title + ": " + min + " <= n < " + max + ", got " + n);
}
function bitLen(n) {
  if (n < _0n)
    throw new Error("expected non-negative bigint, got " + n);
  return n === _0n ? 0 : n.toString(2).length;
}
var bitMask = (n) => {
  asafenumber(n, "n");
  return (_1n << BigInt(n)) - _1n;
};
function validateObject(object, fields = {}, optFields = {}, title = "object") {
  aobject2(object, title);
  aobject2(fields, "fields");
  aobject2(optFields, "optFields");
  function checkField(fieldName, expectedType, isOpt) {
    const label = title === "object" ? `param "${String(fieldName)}"` : `"${title}.${String(fieldName)}"`;
    const val = object[fieldName];
    if (!Object.hasOwn(object, fieldName) && (isOpt ? val !== void 0 : expectedType !== "function")) {
      throw new TypeError(`${label} is invalid: expected own property`);
    }
    if (isOpt && val === void 0)
      return;
    const current = typeof val;
    if (current !== expectedType || val === null)
      throw new TypeError(`${label} is invalid: expected ${expectedType}, got ${current}`);
  }
  const iter = (f, isOpt) => Object.entries(f).forEach(([k, v]) => checkField(k, v, isOpt));
  iter(fields, false);
  iter(optFields, true);
}

// ../../node_modules/.pnpm/@noble+curves@2.4.0/node_modules/@noble/curves/abstract/modular.js
var _0n2 = /* @__PURE__ */ BigInt(0);
var _1n2 = /* @__PURE__ */ BigInt(1);
var _2n = /* @__PURE__ */ BigInt(2);
var _3n = /* @__PURE__ */ BigInt(3);
var _4n = /* @__PURE__ */ BigInt(4);
var _5n = /* @__PURE__ */ BigInt(5);
var _7n = /* @__PURE__ */ BigInt(7);
var _8n = /* @__PURE__ */ BigInt(8);
var _9n = /* @__PURE__ */ BigInt(9);
var _15n = /* @__PURE__ */ BigInt(15);
var _16n = /* @__PURE__ */ BigInt(16);
var POW_WINDOWED_MIN = /* @__PURE__ */ BigInt("0x10000000000000000");
function mod(a, b) {
  if (b <= _0n2)
    throw new Error("mod: expected positive modulus, got " + b);
  const result = a % b;
  return result >= _0n2 ? result : b + result;
}
function pow(num, power, modulo) {
  if (modulo <= _1n2)
    throw new Error("pow: expected modulus > 1, got " + modulo);
  if (typeof power !== "bigint")
    throw new TypeError("invalid exponent: expected bigint, got " + typeof power);
  if (power < _0n2)
    throw new Error("invalid exponent, negatives unsupported");
  if (power === _0n2)
    return _1n2;
  if (power === _1n2)
    return num;
  let d = num % modulo;
  if (d < _0n2)
    d += modulo;
  if (power < POW_WINDOWED_MIN) {
    let p2 = _1n2;
    while (power > _0n2) {
      if (power & _1n2)
        p2 = p2 * d % modulo;
      d = d * d % modulo;
      power >>= _1n2;
    }
    return p2;
  }
  const digits = [];
  while (power > _0n2) {
    digits.push(Number(power & _15n));
    power >>= _4n;
  }
  const table = new Array(16);
  table[0] = _1n2;
  table[1] = d;
  for (let i = 2; i < 16; i++)
    table[i] = table[i - 1] * d % modulo;
  let p = table[digits[digits.length - 1]];
  for (let w = digits.length - 2; w >= 0; w--) {
    p = p * p % modulo;
    p = p * p % modulo;
    p = p * p % modulo;
    p = p * p % modulo;
    const digit = digits[w];
    if (digit !== 0)
      p = p * table[digit] % modulo;
  }
  return p;
}
function pow2(x, power, modulo) {
  if (modulo <= _1n2)
    throw new Error("pow2: expected modulus > 1, got " + modulo);
  if (power < _0n2)
    throw new Error("pow2: expected non-negative exponent, got " + power);
  let res = x;
  while (power-- > _0n2) {
    res *= res;
    res %= modulo;
  }
  return res;
}
function invert(number, modulo) {
  if (number === _0n2)
    throw new Error("invert: expected non-zero number");
  if (modulo <= _1n2)
    throw new Error("invert: expected modulus > 1, got " + modulo);
  let a = mod(number, modulo);
  let b = modulo;
  let x = _0n2, u = _1n2;
  while (a !== _0n2) {
    const q = b / a;
    const r = b - a * q;
    const m = x - u * q;
    b = a, a = r, x = u, u = m;
  }
  const gcd = b;
  if (gcd !== _1n2)
    throw new Error("invert: does not exist");
  return mod(x, modulo);
}
function assertIsSquare(Fp, root, n) {
  const F = Fp;
  if (!F.eql(F.sqr(root), n))
    throw new Error("Cannot find square root");
}
function aoddModulus(order, fnName) {
  if ((order & _1n2) === _0n2)
    throw new Error(fnName + ": expected odd modulus, got " + order);
}
function sqrt3mod4(Fp, n) {
  const F = Fp;
  const p1div4 = (F.ORDER + _1n2) / _4n;
  const root = F.pow(n, p1div4);
  assertIsSquare(F, root, n);
  return root;
}
function sqrt5mod8(Fp, n) {
  const F = Fp;
  const p5div8 = (F.ORDER - _5n) / _8n;
  const n2 = F.mul(n, _2n);
  const v = F.pow(n2, p5div8);
  const nv = F.mul(n, v);
  const i = F.mul(F.mul(nv, _2n), v);
  const root = F.mul(nv, F.sub(i, F.ONE));
  assertIsSquare(F, root, n);
  return root;
}
function sqrt9mod16(P) {
  const Fp_ = Field(P);
  const tn = tonelliShanks(P);
  const c1 = tn(Fp_, Fp_.neg(Fp_.ONE));
  const c2 = tn(Fp_, c1);
  const c3 = tn(Fp_, Fp_.neg(c1));
  const c4 = (P + _7n) / _16n;
  return ((Fp, n) => {
    const F = Fp;
    let tv1 = F.pow(n, c4);
    let tv2 = F.mul(tv1, c1);
    const tv3 = F.mul(tv1, c2);
    const tv4 = F.mul(tv1, c3);
    const e1 = F.eql(F.sqr(tv2), n);
    const e2 = F.eql(F.sqr(tv3), n);
    tv1 = F.cmov(tv1, tv2, e1);
    tv2 = F.cmov(tv4, tv3, e2);
    const e3 = F.eql(F.sqr(tv2), n);
    const root = F.cmov(tv1, tv2, e3);
    assertIsSquare(F, root, n);
    return root;
  });
}
function tonelliShanks(P) {
  if (P < _3n)
    throw new Error("sqrt is not defined for small field");
  aoddModulus(P, "tonelliShanks");
  let Q = P - _1n2;
  let S = 0;
  while (Q % _2n === _0n2) {
    Q /= _2n;
    S++;
  }
  let Z = _2n;
  const _Fp = Field(P);
  while (FpLegendre(_Fp, Z) === 1) {
    if (Z++ > 1e3)
      throw new Error("Cannot find square root: probably non-prime P");
  }
  if (S === 1)
    return sqrt3mod4;
  let cc = _Fp.pow(Z, Q);
  const Q1div2 = (Q + _1n2) / _2n;
  return function tonelliSlow(Fp, n) {
    const F = Fp;
    if (F.is0(n))
      return n;
    if (FpLegendre(F, n) !== 1)
      throw new Error("Cannot find square root");
    let M = S;
    let c = F.mul(F.ONE, cc);
    let t = F.pow(n, Q);
    let R = F.pow(n, Q1div2);
    while (!F.eql(t, F.ONE)) {
      if (F.is0(t))
        throw new Error("Cannot find square root: probably non-prime P");
      let i = 1;
      let t_tmp = F.sqr(t);
      while (!F.eql(t_tmp, F.ONE)) {
        i++;
        t_tmp = F.sqr(t_tmp);
        if (i === M)
          throw new Error("Cannot find square root");
      }
      const exponent = _1n2 << BigInt(M - i - 1);
      const b = F.pow(c, exponent);
      M = i;
      c = F.sqr(b);
      t = F.mul(t, c);
      R = F.mul(R, b);
    }
    return R;
  };
}
function FpSqrt(P) {
  aoddModulus(P, "Fp.sqrt");
  if (P % _4n === _3n)
    return sqrt3mod4;
  if (P % _8n === _5n)
    return sqrt5mod8;
  if (P % _16n === _9n)
    return sqrt9mod16(P);
  return tonelliShanks(P);
}
var isNegativeLE = (num, modulo) => (mod(num, modulo) & _1n2) === _1n2;
var FIELD_FIELDS = [
  "create",
  "isValid",
  "is0",
  "neg",
  "inv",
  "sqrt",
  "sqr",
  "eql",
  "add",
  "sub",
  "mul",
  "pow",
  "div",
  "addN",
  "subN",
  "mulN",
  "sqrN"
];
function validateField(field) {
  aobject2(field, "field");
  if (typeof field.ORDER !== "bigint")
    throw new TypeError('param "ORDER" is invalid: expected bigint, got ' + typeof field.ORDER);
  asafenumber(field.BYTES, "BYTES");
  asafenumber(field.BITS, "BITS");
  for (const name of FIELD_FIELDS)
    afunction(field[name], "field." + name);
  if (field.BYTES < 1 || field.BITS < 1)
    throw new Error("invalid field: expected BYTES/BITS > 0");
  if (field.ORDER <= _1n2)
    throw new Error("invalid field: expected ORDER > 1, got " + field.ORDER);
  return field;
}
function FpInvertBatch(Fp, nums, passZero = false) {
  validateField(Fp);
  aarray(nums, "nums");
  abool(passZero, "passZero");
  const F = Fp;
  const inverted = new Array(nums.length).fill(passZero ? F.ZERO : void 0);
  const multipliedAcc = nums.reduce((acc, num, i) => {
    if (F.is0(num))
      return acc;
    inverted[i] = acc;
    return F.mul(acc, num);
  }, F.ONE);
  const invertedAcc = F.inv(multipliedAcc);
  nums.reduceRight((acc, num, i) => {
    if (F.is0(num))
      return acc;
    inverted[i] = F.mul(acc, inverted[i]);
    return F.mul(acc, num);
  }, invertedAcc);
  return inverted;
}
function FpLegendre(Fp, n) {
  validateField(Fp);
  const F = Fp;
  aoddModulus(F.ORDER, "FpLegendre");
  const p1mod2 = (F.ORDER - _1n2) / _2n;
  const powered = F.pow(n, p1mod2);
  const yes = F.eql(powered, F.ONE);
  const zero = F.eql(powered, F.ZERO);
  const no = F.eql(powered, F.neg(F.ONE));
  if (!yes && !zero && !no)
    throw new Error("invalid Legendre symbol result");
  return yes ? 1 : zero ? 0 : -1;
}
function nLength(n, nBitLength) {
  if (nBitLength !== void 0)
    anumber2(nBitLength);
  if (n <= _0n2)
    throw new Error("invalid n length: expected positive n, got " + n);
  if (nBitLength !== void 0 && nBitLength < 1)
    throw new Error("invalid n length: expected positive bit length, got " + nBitLength);
  const bits = bitLen(n);
  if (nBitLength !== void 0 && nBitLength < bits)
    throw new Error(`invalid n length: expected nBitLength (${nBitLength}) >= bitLen(n) (${bits})`);
  const _nBitLength = nBitLength !== void 0 ? nBitLength : bits;
  const nByteLength = Math.ceil(_nBitLength / 8);
  return { nBitLength: _nBitLength, nByteLength };
}
var FIELD_SQRT = /* @__PURE__ */ new WeakMap();
var _Field = class {
  ORDER;
  BITS;
  BYTES;
  isLE;
  ZERO = _0n2;
  ONE = _1n2;
  _lengths;
  _mod;
  constructor(ORDER, opts = {}) {
    if (ORDER <= _1n2)
      throw new Error("invalid field: expected ORDER > 1, got " + ORDER);
    let _nbitLength = void 0;
    this.isLE = false;
    if (opts != null && typeof opts === "object") {
      if (typeof opts.BITS === "number")
        _nbitLength = opts.BITS;
      if (typeof opts.sqrt === "function")
        Object.defineProperty(this, "sqrt", { value: opts.sqrt, enumerable: true });
      if (typeof opts.isLE === "boolean")
        this.isLE = opts.isLE;
      if (opts.allowedLengths)
        this._lengths = Object.freeze(opts.allowedLengths.slice());
      if (typeof opts.modFromBytes === "boolean")
        this._mod = opts.modFromBytes;
    }
    const { nBitLength, nByteLength } = nLength(ORDER, _nbitLength);
    if (nByteLength > 2048)
      throw new Error("invalid field: expected ORDER of <= 2048 bytes");
    this.ORDER = ORDER;
    this.BITS = nBitLength;
    this.BYTES = nByteLength;
    Object.freeze(this);
  }
  create(num) {
    return mod(num, this.ORDER);
  }
  isValid(num) {
    if (typeof num !== "bigint")
      throw new TypeError("invalid field element: expected bigint, got " + typeof num);
    return _0n2 <= num && num < this.ORDER;
  }
  is0(num) {
    return num === _0n2;
  }
  // is valid and invertible
  isValidNot0(num) {
    return !this.is0(num) && this.isValid(num);
  }
  isOdd(num) {
    return (num & _1n2) === _1n2;
  }
  neg(num) {
    return mod(-num, this.ORDER);
  }
  eql(lhs, rhs) {
    return lhs === rhs;
  }
  sqr(num) {
    return mod(num * num, this.ORDER);
  }
  add(lhs, rhs) {
    return mod(lhs + rhs, this.ORDER);
  }
  sub(lhs, rhs) {
    return mod(lhs - rhs, this.ORDER);
  }
  mul(lhs, rhs) {
    return mod(lhs * rhs, this.ORDER);
  }
  pow(num, power) {
    return pow(num, power, this.ORDER);
  }
  div(lhs, rhs) {
    return mod(lhs * invert(rhs, this.ORDER), this.ORDER);
  }
  // Same as above, but doesn't normalize
  sqrN(num) {
    return num * num;
  }
  addN(lhs, rhs) {
    return lhs + rhs;
  }
  subN(lhs, rhs) {
    return lhs - rhs;
  }
  mulN(lhs, rhs) {
    return lhs * rhs;
  }
  inv(num) {
    return invert(num, this.ORDER);
  }
  sqrt(num) {
    let sqrt = FIELD_SQRT.get(this);
    if (!sqrt)
      FIELD_SQRT.set(this, sqrt = FpSqrt(this.ORDER));
    return sqrt(this, num);
  }
  toBytes(num) {
    return this.isLE ? numberToBytesLE(num, this.BYTES) : numberToBytesBE(num, this.BYTES);
  }
  fromBytes(bytes, skipValidation = false) {
    abytes2(bytes);
    const { _lengths: allowedLengths, BYTES, isLE: isLE2, ORDER, _mod: modFromBytes } = this;
    if (allowedLengths) {
      if (bytes.length < 1 || !allowedLengths.includes(bytes.length) || bytes.length > BYTES) {
        throw new Error("Field.fromBytes: expected " + allowedLengths + " bytes, got " + bytes.length);
      }
      const padded = new Uint8Array(BYTES);
      padded.set(bytes, isLE2 ? 0 : padded.length - bytes.length);
      bytes = padded;
    }
    if (bytes.length !== BYTES)
      throw new Error("Field.fromBytes: expected " + BYTES + " bytes, got " + bytes.length);
    let scalar = isLE2 ? bytesToNumberLE(bytes) : bytesToNumberBE(bytes);
    if (modFromBytes)
      scalar = mod(scalar, ORDER);
    if (!skipValidation) {
      if (!this.isValid(scalar))
        throw new Error("invalid field element: outside of range 0..ORDER");
    }
    return scalar;
  }
  // TODO: we don't need it here, move out to separate fn
  invertBatch(lst) {
    return FpInvertBatch(this, lst, true);
  }
  // We can't move this out because Fp6, Fp12 implement it
  // and it's unclear what to return in there.
  cmov(a, b, condition) {
    abool(condition, "condition");
    return condition ? b : a;
  }
};
function Field(ORDER, opts = {}) {
  Object.freeze(_Field.prototype);
  return new _Field(ORDER, opts);
}

// ../../node_modules/.pnpm/@noble+curves@2.4.0/node_modules/@noble/curves/abstract/curve.js
var _0n3 = /* @__PURE__ */ BigInt(0);
var _1n3 = /* @__PURE__ */ BigInt(1);
var _4n2 = /* @__PURE__ */ BigInt(4);
var BLIND_BYTES = 16;
var BLIND_BITS = 128;
var FW_WINDOW = 5;
var TABLE_BYTES_MAX = /* @__PURE__ */ (() => 2 ** 31)();
function validatePointCons(Point) {
  const pc = Point;
  if (typeof pc !== "function")
    throw new TypeError('"Point" expected constructor, got type=' + typeof Point);
  afunction(pc.fromAffine, "Point.fromAffine");
  afunction(pc.fromBytes, "Point.fromBytes");
  afunction(pc.fromHex, "Point.fromHex");
  aobject2(pc.BASE, "Point.BASE");
  aobject2(pc.ZERO, "Point.ZERO");
  validateField(pc.Fp);
  validateField(pc.Fn);
}
function normalizeZ(c, points) {
  validatePointCons(c);
  validateMSMPoints(points, c);
  const invertedZs = FpInvertBatch(c.Fp, points.map((p) => p.Z));
  return points.map((p, i) => c.fromAffine(p.toAffine(invertedZs[i])));
}
function validateW(W, bits, min = 1) {
  if (!Number.isSafeInteger(W) || W < min || W > bits)
    throw new Error("invalid window size, expected [" + min + ".." + bits + "], got W=" + W);
}
function validateTableBytes(numPoints, fpBytes) {
  const bytes = numPoints * (4 * fpBytes + 128);
  if (bytes > TABLE_BYTES_MAX)
    throw new Error("invalid window size: table would need ~" + Math.ceil(bytes / 2 ** 20) + " MiB, max " + TABLE_BYTES_MAX / 2 ** 20 + " MiB");
}
function probeRandomBytes(randomBytes10, length) {
  if (randomBytes10 === void 0)
    return void 0;
  afunction(randomBytes10, "randomBytes");
  try {
    const probe = randomBytes10(length);
    if (!isBytes2(probe) || probe.length !== length)
      return void 0;
  } catch {
    return void 0;
  }
  return randomBytes10;
}
function validateMSMPoints(points, c) {
  aarray(points, "points");
  points.forEach((p, i) => {
    if (!(p instanceof c))
      throw new Error("invalid point at index " + i);
  });
}
function validateMSMScalars(scalars, field, maxScalar) {
  if (!Array.isArray(scalars))
    throw new Error("array of scalars expected");
  scalars.forEach((s, i) => {
    const ok = maxScalar === void 0 ? field.isValid(s) : isPosBig(s) && s < maxScalar;
    if (!ok)
      throw new Error("invalid scalar at index " + i);
  });
}
var pointWindowSizes = /* @__PURE__ */ new WeakMap();
function getWindowSize(P) {
  return pointWindowSizes.get(P) || 1;
}
function oddMultiples(p, size) {
  const dbl = p.double();
  const t = [p];
  for (let j = 1; j < size; j++)
    t.push(t[j - 1].add(dbl));
  return t;
}
function wnafDigits(n, W) {
  const size = 2 ** W;
  const half = size / 2;
  const mask = BigInt(size - 1);
  const d = [];
  while (n > _0n3) {
    let w = 0;
    if (n & _1n3) {
      w = Number(n & mask);
      if (w >= half)
        w -= size;
      n -= BigInt(w);
    }
    d.push(w);
    n >>= _1n3;
  }
  return d;
}
function signedWindowDigits(n, W, windows) {
  const size = 2 ** W;
  const half = size / 2;
  const mask = BigInt(size - 1);
  const shiftBy = BigInt(W);
  const d = [];
  for (let w = 0; w < windows; w++) {
    let v = Number(n & mask);
    n >>= shiftBy;
    if (v > half) {
      v -= size;
      n += _1n3;
    }
    d.push(v);
  }
  if (n !== _0n3)
    throw new Error("invalid wnaf");
  return d;
}
function wnafWalk(zero, tables, digits) {
  let max = 0;
  for (const d of digits)
    max = Math.max(max, d.length);
  let acc = zero;
  for (let bit = max - 1; bit >= 0; bit--) {
    if (bit !== max - 1)
      acc = acc.double();
    for (let i = 0; i < digits.length; i++) {
      const w = digits[i][bit];
      if (w) {
        const item = tables[i][Math.abs(w) - 1 >> 1];
        acc = acc.add(w < 0 ? item.negate() : item);
      }
    }
  }
  return acc;
}
var ScalarMultiplier = class {
  Point;
  BASE;
  ZERO;
  randomBytes;
  wnafPrecomputes = /* @__PURE__ */ new WeakMap();
  baseCanBeBlinded;
  bits;
  // Parametrized with a given Point class (not individual point)
  constructor(Point, randomBytes10) {
    validatePointCons(Point);
    this.randomBytes = probeRandomBytes(randomBytes10, BLIND_BYTES);
    this.Point = Point;
    this.BASE = Point.BASE;
    this.ZERO = Point.ZERO;
    this.bits = Point.Fn.BITS;
  }
  /**
   * Creates a signed fixed-window wNAF precomputation table: for every window w, the
   * multiples `[1..2^(W−1)]⋅2^(w⋅W)⋅P`, flattened. All doublings are baked into the table,
   * so cached multiplication is additions-only. `windows = ceil(bits/W) + 1`: the extra
   * window absorbs the final carry of signed-digit recoding.
   * For a 256-bit curve and W=6, the table is 44⋅32 = 1408 points.
   * @param point - Point instance
   * @param W - window size
   * @param bits - scalar bitlength the table must cover
   */
  buildWnafTable(point, W, bits) {
    const windows = Math.ceil(bits / W) + 1;
    const half = 2 ** (W - 1);
    const comp = [];
    let base = point;
    for (let w = 0; w < windows; w++) {
      let acc = base;
      for (let i = 0; i < half; i++) {
        comp.push(acc);
        acc = acc.add(base);
      }
      base = comp[comp.length - 1].double();
    }
    return { W, bits, windows, comp };
  }
  /**
   * Implements ec multiplication using precomputed signed fixed-window wNAF tables.
   * Constant-time: fixed window count with one table addition per window — zero digits feed
   * the fake accumulator — and no doublings; the lookup scans the whole window slice.
   * Scalar bounds are validated by the public entry points ({@link ScalarMultiplier.mulCT},
   * {@link ScalarMultiplier.mulCTBlinded}, {@link ScalarMultiplier.mulUnsafe});
   * signedWindowDigits throws if `n` exceeds the table.
   * @returns real and fake (for const-time) points
   */
  wnafCachedCT(precomputes, n) {
    const { W, windows, comp } = precomputes;
    const half = 2 ** (W - 1);
    const digits = signedWindowDigits(n, W, windows);
    let p = this.ZERO;
    let f = this.BASE;
    for (let w = 0; w < windows; w++) {
      const digit = digits[w];
      const start = w * half;
      const idx = Math.abs(digit) - 1;
      let sel = comp[start];
      for (let i = 1; i < half; i++)
        sel = i === idx ? comp[start + i] : sel;
      const neg = sel.negate();
      if (digit === 0)
        f = f.add(comp[start]);
      else
        p = p.add(digit < 0 ? neg : sel);
    }
    return { p, f };
  }
  // Cache key is point identity plus (W, bits); at most two entries exist per point (public-width
  // `Fn.BITS` and blinded `Fn.BITS + BLIND_BITS`). Callers must not reuse the same point with
  // incompatible `transform(...)` layouts and expect a separate cache entry.
  getWnafPrecomputes(W, point, bits, transform) {
    let entries = this.wnafPrecomputes.get(point);
    let comp = entries?.find((entry) => entry.W === W && entry.bits === bits);
    if (!comp) {
      comp = this.buildWnafTable(point, W, bits);
      if (typeof transform === "function")
        comp = { ...comp, comp: transform(comp.comp) };
      if (!entries) {
        entries = [];
        this.wnafPrecomputes.set(point, entries);
      }
      entries.push(comp);
    }
    return comp;
  }
  assertPoint(point) {
    if (!(point instanceof this.Point))
      throw new TypeError('"point" expected Point instance, got type=' + typeof point);
  }
  // Shared prologue of the constant-time entry points. Rejects scalar 0: in key/signature-style
  // callers a zero scalar means broken upstream plumbing, and concrete Points already reject it.
  // Uses inRange instead of Fn.isValidNot0: validateField() only certifies the arithmetic subset.
  validateMulInput(point, scalar) {
    this.assertPoint(point);
    if (!inRange(scalar, _1n3, this.Point.Fn.ORDER))
      throw new Error("invalid scalar");
  }
  // Constant-time dispatch shared by mulCT / mulCTBlinded. Un-precomputed points (W===1, e.g.
  // ECDH peer keys) skip building a throwaway cached table in favor of a small fixed-window
  // multiply. `n` must be < 2^bits.
  runCT(point, n, bits, transform) {
    const W = getWindowSize(point);
    if (W === 1)
      return this.fixedWindowCT(point, n, bits);
    return this.wnafCachedCT(this.getWnafPrecomputes(W, point, bits, transform), n);
  }
  mulCT(point, scalar, transform) {
    this.validateMulInput(point, scalar);
    return this.runCT(point, scalar, this.bits, transform);
  }
  mulCTBlinded(point, scalar, transform) {
    this.validateMulInput(point, scalar);
    if (this.randomBytes === void 0)
      throw new Error("randomBytes is required for scalar blinding");
    const bits = this.Point.Fn.BITS + BLIND_BITS;
    const blind = this.randomBytes(BLIND_BYTES);
    if (!isBytes2(blind) || blind.length !== BLIND_BYTES)
      throw new Error("randomBytes returned invalid byte array");
    blind[0] = blind[0] & 63 | 128;
    const n = scalar + bytesToNumberBE(blind) * this.Point.Fn.ORDER;
    return this.runCT(point, n, bits, transform);
  }
  /**
   * Constant-time multiplication `n*point` for an un-precomputed point, via a small fixed window.
   * A cached wNAF table only pays off when reused; a flat 2^FW_WINDOW table (`size-1` adds) is
   * far cheaper to build for a single use. The point-operation sequence is independent of `n`:
   * build the table, then per window exactly FW_WINDOW doublings, a data-oblivious scan over
   * every table entry, and one addition (adds the identity when the window digit is 0 — never
   * skipped).
   *
   * `n` must be `< 2^bits`. Assumes complete addition (adding the identity costs the same as any
   * add), which holds for the Weierstrass/Edwards point types used here. The table is left in
   * projective form (no normalizeZ): normalizing this small a table costs more than the
   * mixed-add savings it would buy for a single multiply.
   * @returns real point `p`; `f` duplicates it only to match {@link wnafCachedCT}'s return shape
   * (this path needs no fake accumulator — its op-count is already scalar-independent).
   */
  fixedWindowCT(point, n, bits) {
    const W = FW_WINDOW;
    const size = 1 << W;
    const mask = bitMask(W);
    const table = new Array(size);
    table[0] = this.ZERO;
    for (let i = 1; i < size; i++)
      table[i] = table[i - 1].add(point);
    const windows = Math.ceil(bits / W);
    let acc = this.ZERO;
    for (let window = windows - 1; window >= 0; window--) {
      if (window !== windows - 1)
        for (let d = 0; d < W; d++)
          acc = acc.double();
      const digit = Number(n >> BigInt(window * W) & mask);
      let sel = table[0];
      for (let i = 1; i < size; i++)
        sel = i === digit ? table[i] : sel;
      acc = acc.add(sel);
    }
    return { p: acc, f: acc };
  }
  shouldBlind(point, cofactor) {
    if (this.randomBytes === void 0)
      return false;
    if (cofactor === _1n3)
      return true;
    if (point !== this.BASE)
      return false;
    if (this.baseCanBeBlinded === void 0)
      this.baseCanBeBlinded = this.mulUnsafe(this.BASE, this.Point.Fn.ORDER).is0();
    return this.baseCanBeBlinded;
  }
  mulSecret(point, scalar, cofactor, transform) {
    return this.shouldBlind(point, cofactor) ? this.mulCTBlinded(point, scalar, transform) : this.mulCT(point, scalar, transform);
  }
  mulUnsafe(point, scalar, transform) {
    this.assertPoint(point);
    if (!isPosBig(scalar))
      throw new Error("invalid scalar");
    const W = getWindowSize(point);
    if (W === 1 || scalar >= this.Point.Fn.ORDER)
      return mulAddUnsafe(this.Point, [point], [scalar], true);
    const precomputes = this.getWnafPrecomputes(W, point, this.bits, transform);
    return this.wnafCachedCT(precomputes, scalar).p;
  }
  // Remembers the window size used for precomputed wNAF multiplication of the given point
  // and drops any previously built tables. Usually only the base point is precomputed.
  // W=1 resets the point to the un-precomputed (table-less) paths.
  // W is additionally capped so tables stay under ~2 GiB ({@link TABLE_BYTES_MAX}).
  setWindowSize(point, W) {
    this.assertPoint(point);
    validateW(W, this.bits);
    const windows = Math.ceil((this.bits + BLIND_BITS) / W) + 1;
    validateTableBytes(windows * 2 ** (W - 1), this.Point.Fp.BYTES);
    pointWindowSizes.set(point, W);
    this.wnafPrecomputes.delete(point);
  }
  // True when a window size is set: tables themselves are built lazily on first multiply.
  hasWindowSize(point) {
    return getWindowSize(point) !== 1;
  }
};
function mulAddUnsafe(c, points, scalars, allowOversized = false) {
  validatePointCons(c);
  validateMSMPoints(points, c);
  abool(allowOversized, "allowOversized");
  validateMSMScalars(scalars, c.Fn, allowOversized ? c.Fn.ORDER ** _4n2 : void 0);
  if (points.length !== scalars.length)
    throw new Error("arrays of points and scalars must have equal length");
  const tables = points.map((p) => oddMultiples(p, 4));
  const digits = scalars.map((n) => wnafDigits(n, 4));
  return wnafWalk(c.ZERO, tables, digits);
}
function createField(order, field, isLE2) {
  if (field) {
    if (field.ORDER !== order)
      throw new Error("Field.ORDER must match order: Fp == p, Fn == n");
    validateField(field);
    return field;
  } else {
    return Field(order, { isLE: isLE2 });
  }
}
function createCurveFields(type, CURVE, curveOpts = {}, FpFnLE) {
  if (type !== "weierstrass" && type !== "edwards")
    throw new Error('expected curve type "weierstrass" or "edwards"');
  if (FpFnLE === void 0)
    FpFnLE = type === "edwards";
  if (!CURVE || typeof CURVE !== "object")
    throw new Error(`expected valid ${type} CURVE object`);
  validateObject(curveOpts);
  for (const p of ["p", "n", "h"]) {
    const val = CURVE[p];
    if (!(isPosBig(val) && val !== _0n3))
      throw new Error(`CURVE.${p} must be positive bigint`);
  }
  const Fp = createField(CURVE.p, curveOpts.Fp, FpFnLE);
  const Fn = createField(CURVE.n, curveOpts.Fn, FpFnLE);
  const _b = type === "weierstrass" ? "b" : "d";
  const params = ["Gx", "Gy", "a", _b];
  for (const p of params) {
    if (!Fp.isValid(CURVE[p]))
      throw new Error(`CURVE.${p} must be valid field element of CURVE.Fp`);
  }
  CURVE = Object.freeze(Object.assign({}, CURVE));
  return { CURVE, Fp, Fn };
}
function createKeygen(randomSecretKey, getPublicKey) {
  return function keygen(seed) {
    const secretKey = randomSecretKey(seed);
    return { secretKey, publicKey: getPublicKey(secretKey) };
  };
}

// ../../node_modules/.pnpm/@noble+curves@2.4.0/node_modules/@noble/curves/abstract/edwards.js
var _0n4 = /* @__PURE__ */ BigInt(0);
var _1n4 = /* @__PURE__ */ BigInt(1);
var _2n2 = /* @__PURE__ */ BigInt(2);
var _4n3 = /* @__PURE__ */ BigInt(4);
var _8n2 = /* @__PURE__ */ BigInt(8);
function isEdValidXY(Fp, CURVE, x, y) {
  const x2 = Fp.sqr(x);
  const y2 = Fp.sqr(y);
  const left = Fp.add(Fp.mul(CURVE.a, x2), y2);
  const right = Fp.add(Fp.ONE, Fp.mul(CURVE.d, Fp.mul(x2, y2)));
  return Fp.eql(left, right);
}
function edwards(params, extraOpts = {}) {
  validateObject(extraOpts, {}, {}, "extraOpts");
  const opts = extraOpts;
  const validated = createCurveFields("edwards", params, opts, opts.FpFnLE);
  const { Fp, Fn } = validated;
  let CURVE = validated.CURVE;
  const { h: cofactor } = CURVE;
  if (FpLegendre(Fp, CURVE.a) !== 1)
    throw new Error("edwards: CURVE.a must be a square in Fp for complete addition formulas");
  if (FpLegendre(Fp, CURVE.d) !== -1)
    throw new Error("edwards: CURVE.d must be a non-square in Fp for complete addition formulas");
  validateObject(opts, {}, { uvRatio: "function", randomBytes: "function" });
  const randomBytes10 = opts.randomBytes === void 0 ? randomBytes2 : opts.randomBytes;
  const MASK = _2n2 << BigInt(Fp.BYTES * 8) - _1n4;
  function isOdd(n) {
    if (!Fp.isOdd)
      throw new Error("Field does not have .isOdd()");
    return Fp.isOdd(n);
  }
  const uvRatio2 = opts.uvRatio === void 0 ? (u, v) => {
    try {
      return { isValid: true, value: Fp.sqrt(Fp.div(u, v)) };
    } catch (e) {
      return { isValid: false, value: _0n4 };
    }
  } : opts.uvRatio;
  if (!isEdValidXY(Fp, CURVE, CURVE.Gx, CURVE.Gy))
    throw new Error("bad curve params: generator point");
  const mulA = Fp.eql(CURVE.a, Fp.neg(Fp.ONE)) ? (x) => Fp.neg(x) : Fp.eql(CURVE.a, Fp.ONE) ? (x) => x : (x) => Fp.mul(CURVE.a, x);
  function acoord(title, n, banZero = false) {
    const min = banZero ? _1n4 : _0n4;
    aInRange("coordinate " + title, n, min, MASK);
    return n;
  }
  function aedpoint(other) {
    if (!(other instanceof Point))
      throw new Error("EdwardsPoint expected");
  }
  class Point {
    static BASE = new Point(CURVE.Gx, CURVE.Gy, Fp.ONE, Fp.mul(CURVE.Gx, CURVE.Gy));
    static ZERO = new Point(Fp.ZERO, Fp.ONE, Fp.ONE, Fp.ZERO);
    static Fp = Fp;
    static Fn = Fn;
    X;
    Y;
    Z;
    T;
    constructor(X, Y, Z, T) {
      this.X = acoord("x", X);
      this.Y = acoord("y", Y);
      this.Z = acoord("z", Z, true);
      this.T = acoord("t", T);
      Object.freeze(this);
    }
    static CURVE() {
      return CURVE;
    }
    /**
     * Create one extended Edwards point from affine coordinates.
     * Does NOT validate that the point is on-curve or torsion-free.
     * Use `.assertValidity()` on adversarial inputs.
     */
    static fromAffine(p) {
      if (p instanceof Point)
        throw new Error("extended point not allowed");
      const { x, y } = p || {};
      acoord("x", x);
      acoord("y", y);
      return new Point(x, y, Fp.ONE, Fp.mul(x, y));
    }
    // Uses algo from RFC8032 5.1.3.
    static fromBytes(bytes, zip215 = false) {
      const len = Fp.BYTES;
      const { a, d } = CURVE;
      bytes = copyBytes(abytes2(bytes, len, "point"));
      abool(zip215, "zip215");
      const normed = copyBytes(bytes);
      const lastByte = bytes[len - 1];
      normed[len - 1] = lastByte & ~128;
      const y = bytesToNumberLE(normed);
      const max = zip215 ? MASK : Fp.ORDER;
      aInRange("point.y", y, _0n4, max);
      const y2 = Fp.sqr(y);
      const u = Fp.sub(y2, Fp.ONE);
      const v = Fp.sub(Fp.mulN(d, y2), a);
      let { isValid, value: x } = uvRatio2(u, v);
      if (!isValid)
        throw new Error("bad point: invalid y coordinate");
      const isXOdd = isOdd(x);
      const isLastByteOdd = (lastByte & 128) !== 0;
      if (!zip215 && Fp.is0(x) && isLastByteOdd)
        throw new Error("bad point: x=0 and x_0=1");
      if (isLastByteOdd !== isXOdd)
        x = Fp.neg(x);
      return Point.fromAffine({ x, y });
    }
    static fromHex(hex, zip215 = false) {
      return Point.fromBytes(hexToBytes2(hex), zip215);
    }
    get x() {
      return this.toAffine().x;
    }
    get y() {
      return this.toAffine().y;
    }
    precompute(windowSize = 6, isLazy = true) {
      wnaf.setWindowSize(this, windowSize);
      if (!isLazy)
        this.multiply(_2n2);
      return this;
    }
    // Useful in fromAffine() - not for fromBytes(), which always created valid points.
    assertValidity() {
      const p = this;
      const { a, d } = CURVE;
      if (p.is0())
        throw new Error("bad point: ZERO");
      const { X, Y, Z, T } = p;
      const X2 = Fp.sqr(X);
      const Y2 = Fp.sqr(Y);
      const Z2 = Fp.sqr(Z);
      const Z4 = Fp.sqr(Z2);
      const aX2 = Fp.mul(X2, a);
      const left = Fp.mul(Fp.add(aX2, Y2), Z2);
      const right = Fp.add(Z4, Fp.mul(d, Fp.mul(X2, Y2)));
      if (!Fp.eql(left, right))
        throw new Error("bad point: equation left != right (1)");
      const XY = Fp.mul(X, Y);
      const ZT = Fp.mul(Z, T);
      if (!Fp.eql(XY, ZT))
        throw new Error("bad point: equation left != right (2)");
    }
    // Compare one point to another.
    equals(other) {
      aedpoint(other);
      const { X: X1, Y: Y1, Z: Z1 } = this;
      const { X: X2, Y: Y2, Z: Z2 } = other;
      const X1Z2 = Fp.mul(X1, Z2);
      const X2Z1 = Fp.mul(X2, Z1);
      const Y1Z2 = Fp.mul(Y1, Z2);
      const Y2Z1 = Fp.mul(Y2, Z1);
      return Fp.eql(X1Z2, X2Z1) && Fp.eql(Y1Z2, Y2Z1);
    }
    is0() {
      return this.equals(Point.ZERO);
    }
    negate() {
      return new Point(Fp.neg(this.X), this.Y, this.Z, Fp.neg(this.T));
    }
    // Fast algo for doubling Extended Point.
    // https://hyperelliptic.org/EFD/g1p/auto-twisted-extended.html#doubling-dbl-2008-hwcd
    // Cost: 4M + 4S + 1*a + 6add + 1*2.
    double() {
      const { X: X1, Y: Y1, Z: Z1 } = this;
      const A = Fp.sqr(X1);
      const B = Fp.sqr(Y1);
      const C = Fp.mul(Fp.sqr(Z1), _2n2);
      const D = mulA(A);
      const x1y1 = Fp.addN(X1, Y1);
      const E = Fp.sub(Fp.subN(Fp.sqr(x1y1), A), B);
      const G = Fp.addN(D, B);
      const F = Fp.subN(G, C);
      const H = Fp.subN(D, B);
      const X3 = Fp.mul(E, F);
      const Y3 = Fp.mul(G, H);
      const T3 = Fp.mul(E, H);
      const Z3 = Fp.mul(F, G);
      return new Point(X3, Y3, Z3, T3);
    }
    // Fast algo for adding 2 Extended Points.
    // https://hyperelliptic.org/EFD/g1p/auto-twisted-extended.html#addition-add-2008-hwcd
    // Cost: 9M + 1*a + 1*d + 7add.
    add(other) {
      aedpoint(other);
      const { d } = CURVE;
      const { X: X1, Y: Y1, Z: Z1, T: T1 } = this;
      const { X: X2, Y: Y2, Z: Z2, T: T2 } = other;
      const A = Fp.mul(X1, X2);
      const B = Fp.mul(Y1, Y2);
      const C = Fp.mul(Fp.mulN(T1, d), T2);
      const D = Fp.mul(Z1, Z2);
      const E = Fp.sub(Fp.subN(Fp.mulN(Fp.addN(X1, Y1), Fp.addN(X2, Y2)), A), B);
      const F = Fp.subN(D, C);
      const G = Fp.addN(D, C);
      const H = Fp.sub(B, mulA(A));
      const X3 = Fp.mul(E, F);
      const Y3 = Fp.mul(G, H);
      const T3 = Fp.mul(E, H);
      const Z3 = Fp.mul(F, G);
      return new Point(X3, Y3, Z3, T3);
    }
    subtract(other) {
      aedpoint(other);
      return this.add(other.negate());
    }
    // Constant-time multiplication.
    multiply(scalar) {
      if (!Fn.isValidNot0(scalar))
        throw new RangeError("invalid scalar: expected 1 <= sc < curve.n");
      const { p, f } = wnaf.mulSecret(this, scalar, cofactor, normalize);
      return normalize([p, f])[0];
    }
    // Non-constant-time multiplication. Uses double-and-add algorithm.
    // It's faster, but should only be used when you don't care about
    // an exposed private key e.g. sig verification.
    // Keeps the same subgroup-scalar contract: 0 is allowed for public-scalar callers, but
    // n and larger values are rejected instead of being reduced mod n to the identity point.
    multiplyUnsafe(scalar) {
      if (!Fn.isValid(scalar))
        throw new RangeError("invalid scalar: expected 0 <= sc < curve.n");
      if (scalar === _0n4)
        return Point.ZERO;
      if (this.is0() || scalar === _1n4)
        return this;
      return wnaf.mulUnsafe(this, scalar, normalize);
    }
    // Checks if point is of small order.
    // If you add something to small order point, you will have "dirty"
    // point with torsion component.
    // Clears cofactor and checks if the result is 0.
    isSmallOrder() {
      return this.clearCofactor().is0();
    }
    // Multiplies point by curve order and checks if the result is 0.
    // Returns `false` is the point is dirty.
    isTorsionFree() {
      return wnaf.mulUnsafe(this, CURVE.n).is0();
    }
    // Converts Extended point to default (x, y) coordinates.
    // Can accept precomputed Z^-1 - for example, from invertBatch.
    toAffine(invertedZ) {
      const p = this;
      let iz = invertedZ;
      if (iz != null && typeof iz !== "bigint")
        throw new TypeError('"invertedZ" expected bigint, got type=' + typeof iz);
      const { X, Y, Z } = p;
      const is0 = p.is0();
      if (iz == null)
        iz = is0 ? Fp.create(_8n2) : Fp.inv(Z);
      const x = Fp.mul(X, iz);
      const y = Fp.mul(Y, iz);
      const zz = Fp.mul(Z, iz);
      if (is0)
        return { x: Fp.ZERO, y: Fp.ONE };
      if (!Fp.eql(zz, Fp.ONE))
        throw new Error("invZ was invalid");
      return { x, y };
    }
    clearCofactor() {
      if (cofactor === _1n4)
        return this;
      if (cofactor === _2n2)
        return this.double();
      if (cofactor === _4n3)
        return this.double().double();
      if (cofactor === _8n2)
        return this.double().double().double();
      return this.multiplyUnsafe(cofactor);
    }
    toBytes() {
      const { x, y } = this.toAffine();
      const bytes = Fp.toBytes(y);
      bytes[bytes.length - 1] |= isOdd(x) ? 128 : 0;
      return bytes;
    }
    toHex() {
      return bytesToHex2(this.toBytes());
    }
    toString() {
      return `<Point ${this.is0() ? "ZERO" : this.toHex()}>`;
    }
  }
  const normalize = (points) => normalizeZ(Point, points);
  const wnaf = new ScalarMultiplier(Point, randomBytes10);
  if (wnaf.bits >= 6)
    Point.BASE.precompute(6);
  Object.freeze(Point.prototype);
  Object.freeze(Point);
  return Point;
}

// ../../node_modules/.pnpm/@noble+curves@2.4.0/node_modules/@noble/curves/abstract/montgomery.js
var _0n5 = /* @__PURE__ */ BigInt(0);
var _1n5 = /* @__PURE__ */ BigInt(1);
var _2n3 = /* @__PURE__ */ BigInt(2);
function cmask(P, swap) {
  return P + swap - (swap >> _1n5 << _1n5);
}
function cswap(P) {
  const offset = BigInt(6) * P;
  return (mask, x_2, x_3) => {
    const sum = x_2 + x_3;
    const d = offset + x_3 - x_2;
    const a = (d * mask + x_2) % P;
    return { x_2: a, x_3: sum - a };
  };
}
function validateOpts(curve) {
  validateObject(curve, {
    P: "bigint",
    type: "string",
    adjustScalarBytes: "function",
    powPminus2: "function"
  }, {
    randomBytes: "function",
    scalarMultBase: "function"
  });
  return Object.freeze({ ...curve });
}
function montgomery(curveDef) {
  const CURVE = validateOpts(curveDef);
  const { P, type, adjustScalarBytes: adjustScalarBytes2, powPminus2, randomBytes: rand } = CURVE;
  const mulBaseHook = CURVE.scalarMultBase;
  const is25519 = type === "x25519";
  if (!is25519 && type !== "x448")
    throw new Error("invalid type");
  const randomBytes_ = rand === void 0 ? randomBytes2 : rand;
  const montgomeryBits = is25519 ? 255 : 448;
  const swap = cswap(P);
  const fieldLen = is25519 ? 32 : 56;
  const Gu = is25519 ? BigInt(9) : BigInt(5);
  const a24 = is25519 ? BigInt(121665) : BigInt(39081);
  const minScalar = is25519 ? _2n3 ** BigInt(254) : _2n3 ** BigInt(447);
  const maxAdded = is25519 ? BigInt(8) * (_2n3 ** BigInt(251) - _1n5) : BigInt(4) * (_2n3 ** BigInt(445) - _1n5);
  const maxScalar = minScalar + maxAdded + _1n5;
  const modP = (n) => mod(n, P);
  const GuBytes = encodeU(Gu);
  function encodeU(u) {
    return numberToBytesLE(modP(u), fieldLen);
  }
  function decodeU(u) {
    const _u = copyBytes(abytes2(u, fieldLen, "uCoordinate"));
    if (is25519)
      _u[31] &= 127;
    return modP(bytesToNumberLE(_u));
  }
  function decodeScalar(scalar) {
    return bytesToNumberLE(adjustScalarBytes2(copyBytes(abytes2(scalar, fieldLen, "scalar"))));
  }
  const lowOrderU = new Set(is25519 ? [
    _0n5,
    _1n5,
    P - _1n5,
    BigInt("325606250916557431795983626356110631294008115727848805560023387167927233504"),
    BigInt("39382357235489614581723060781553021112529911719440698176882885853963445705823")
  ] : [_0n5, _1n5, P - _1n5]);
  function scalarMult(scalar, u) {
    const pointU = decodeU(u);
    if (lowOrderU.has(pointU))
      throw new Error("invalid private or public key received");
    const pu = montgomeryLadder(pointU, decodeScalar(scalar));
    if (pu === _0n5)
      throw new Error("invalid private or public key received");
    return encodeU(pu);
  }
  function scalarMultBase(scalar) {
    if (mulBaseHook === void 0)
      return scalarMult(scalar, GuBytes);
    const k = decodeScalar(scalar);
    aInRange("scalar", k, minScalar, maxScalar);
    const pu = modP(mulBaseHook(k));
    if (pu === _0n5)
      throw new Error("invalid private or public key received");
    return encodeU(pu);
  }
  const getPublicKey = scalarMultBase;
  const getSharedSecret = scalarMult;
  function montgomeryLadder(u, scalar) {
    aInRange("u", u, _0n5, P);
    aInRange("scalar", scalar, minScalar, maxScalar);
    const k = scalar;
    const x_1 = u;
    let x_2 = _1n5;
    let z_2 = _0n5;
    let x_3 = u;
    let z_3 = _1n5;
    const kx = k ^ k >> _1n5;
    for (let t = BigInt(montgomeryBits - 1); t >= _0n5; t--) {
      const mask2 = cmask(P, kx >> t);
      ({ x_2, x_3 } = swap(mask2, x_2, x_3));
      ({ x_2: z_2, x_3: z_3 } = swap(mask2, z_2, z_3));
      const A = x_2 + z_2;
      const AA = modP(A * A);
      const B = x_2 - z_2;
      const BB = modP(B * B);
      const E = AA - BB;
      const C = x_3 + z_3;
      const D = x_3 - z_3;
      const DA = modP(D * A);
      const CB = modP(C * B);
      const dacb = DA + CB;
      const da_cb = DA - CB;
      x_3 = modP(dacb * dacb);
      z_3 = modP(x_1 * modP(da_cb * da_cb));
      x_2 = modP(AA * BB);
      z_2 = modP(E * (AA + modP(a24 * E)));
    }
    const mask = cmask(P, k);
    ({ x_2, x_3 } = swap(mask, x_2, x_3));
    ({ x_2: z_2, x_3: z_3 } = swap(mask, z_2, z_3));
    const z2 = powPminus2(z_2);
    return modP(x_2 * z2);
  }
  const lengths = {
    secretKey: fieldLen,
    publicKey: fieldLen,
    seed: fieldLen
  };
  const randomSecretKey = (seed) => {
    seed = seed === void 0 ? randomBytes_(fieldLen) : seed;
    abytes2(seed, lengths.seed, "seed");
    return seed;
  };
  const utils = { randomSecretKey };
  Object.freeze(lengths);
  Object.freeze(utils);
  return Object.freeze({
    keygen: createKeygen(randomSecretKey, getPublicKey),
    getSharedSecret,
    getPublicKey,
    scalarMult,
    scalarMultBase,
    utils,
    GuBytes: GuBytes.slice(),
    lengths
  });
}

// ../../node_modules/.pnpm/@noble+curves@2.4.0/node_modules/@noble/curves/ed25519.js
var _0n6 = /* @__PURE__ */ BigInt(0);
var _1n6 = /* @__PURE__ */ BigInt(1);
var _2n4 = /* @__PURE__ */ BigInt(2);
var _3n2 = /* @__PURE__ */ BigInt(3);
var _5n2 = /* @__PURE__ */ BigInt(5);
var _8n3 = /* @__PURE__ */ BigInt(8);
var ed25519_CURVE_p = /* @__PURE__ */ BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffed");
var ed25519_CURVE = /* @__PURE__ */ (() => ({
  p: ed25519_CURVE_p,
  n: BigInt("0x1000000000000000000000000000000014def9dea2f79cd65812631a5cf5d3ed"),
  h: _8n3,
  a: BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffec"),
  d: BigInt("0x52036cee2b6ffe738cc740797779e89800700a4d4141d8ab75eb4dca135978a3"),
  Gx: BigInt("0x216936d3cd6e53fec0a4e231fdd6dc5c692cc7609525a7b2c9562d608f25d51a"),
  Gy: BigInt("0x6666666666666666666666666666666666666666666666666666666666666658")
}))();
function ed25519_pow_2_252_3(x) {
  const _10n = BigInt(10), _20n = BigInt(20), _40n = BigInt(40), _80n = BigInt(80);
  const P = ed25519_CURVE_p;
  const x2 = x * x % P;
  const b2 = x2 * x % P;
  const b4 = pow2(b2, _2n4, P) * b2 % P;
  const b5 = pow2(b4, _1n6, P) * x % P;
  const b10 = pow2(b5, _5n2, P) * b5 % P;
  const b20 = pow2(b10, _10n, P) * b10 % P;
  const b40 = pow2(b20, _20n, P) * b20 % P;
  const b80 = pow2(b40, _40n, P) * b40 % P;
  const b160 = pow2(b80, _80n, P) * b80 % P;
  const b240 = pow2(b160, _80n, P) * b80 % P;
  const b250 = pow2(b240, _10n, P) * b10 % P;
  const pow_p_5_8 = pow2(b250, _2n4, P) * x % P;
  return { pow_p_5_8, b2 };
}
function adjustScalarBytes(bytes) {
  bytes[0] &= 248;
  bytes[31] &= 127;
  bytes[31] |= 64;
  return bytes;
}
var ED25519_SQRT_M1 = /* @__PURE__ */ BigInt("19681161376707505956807079304988542015446066515923890162744021073123829784752");
function uvRatio(u, v) {
  const P = ed25519_CURVE_p;
  const v3 = mod(v * v * v, P);
  const v7 = mod(v3 * v3 * v, P);
  const pow3 = ed25519_pow_2_252_3(u * v7).pow_p_5_8;
  let x = mod(u * v3 * pow3, P);
  const vx2 = mod(v * x * x, P);
  const root1 = x;
  const root2 = mod(x * ED25519_SQRT_M1, P);
  const useRoot1 = vx2 === u;
  const useRoot2 = vx2 === mod(-u, P);
  const noRoot = vx2 === mod(-u * ED25519_SQRT_M1, P);
  if (useRoot1)
    x = root1;
  if (useRoot2 || noRoot)
    x = root2;
  if (isNegativeLE(x, P))
    x = mod(-x, P);
  return { isValid: useRoot1 || useRoot2, value: x };
}
var ed25519_Point = /* @__PURE__ */ edwards(ed25519_CURVE, { uvRatio });
var x25519 = /* @__PURE__ */ (() => {
  const P = ed25519_CURVE_p;
  const powPminus2 = (x) => {
    const { pow_p_5_8, b2 } = ed25519_pow_2_252_3(x);
    return mod(pow2(pow_p_5_8, _3n2, P) * b2, P);
  };
  return montgomery({
    P,
    type: "x25519",
    powPminus2,
    adjustScalarBytes,
    // ~3x faster fixed-base: [k]B on the birationally-equivalent Edwards curve using cached
    // base tables, mapped back via u = (1+y)/(1-y) = (Z+Y)/(Z-Y) with one Fermat inversion.
    // Same construction as libsodium's crypto_scalarmult_curve25519_base.
    scalarMultBase: (k) => {
      const kn = mod(k, ed25519_Point.Fn.ORDER);
      if (kn === _0n6)
        return _0n6;
      const p = ed25519_Point.BASE.multiply(kn);
      return mod((p.Z + p.Y) * powPminus2(mod(p.Z - p.Y, P)), P);
    }
  });
})();

// ../protocol/src/secure/keys.ts
var KEY_BYTES = 32;
function generateKeyPair(seed) {
  if (seed && seed.length !== KEY_BYTES) throw new Error(`seed must be ${String(KEY_BYTES)} bytes`);
  const { secretKey, publicKey } = x25519.keygen(seed?.slice());
  return { secretKey, publicKey };
}
function publicKeyId(publicKey) {
  return bytesToHex(sha256(publicKey)).slice(0, 16);
}
function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return difference === 0;
}

// ../../node_modules/.pnpm/@noble+hashes@2.4.0/node_modules/@noble/hashes/hmac.js
var _HMAC = class {
  oHash;
  iHash;
  blockLen;
  outputLen;
  canXOF = false;
  finished = false;
  destroyed = false;
  constructor(hash, key2) {
    ahash(hash);
    abytes(key2, void 0, "key");
    this.iHash = hash.create();
    if (typeof this.iHash.update !== "function")
      throw new Error("expected Hash instance");
    this.blockLen = this.iHash.blockLen;
    this.outputLen = this.iHash.outputLen;
    const blockLen = this.blockLen;
    const pad2 = new Uint8Array(blockLen);
    pad2.set(key2.length > blockLen ? hash.create().update(key2).digest() : key2);
    for (let i = 0; i < pad2.length; i++)
      pad2[i] ^= 54;
    this.iHash.update(pad2);
    this.oHash = hash.create();
    for (let i = 0; i < pad2.length; i++)
      pad2[i] ^= 54 ^ 92;
    this.oHash.update(pad2);
    clean(pad2);
  }
  update(buf) {
    aexists(this);
    this.iHash.update(buf);
    return this;
  }
  digestInto(out) {
    aexists(this);
    aoutput(out, this);
    this.finished = true;
    const buf = out.subarray(0, this.outputLen);
    this.iHash.digestInto(buf);
    this.oHash.update(buf);
    this.oHash.digestInto(buf);
    this.destroy();
  }
  digest() {
    const out = new Uint8Array(this.oHash.outputLen);
    this.digestInto(out);
    return out;
  }
  _cloneInto(to) {
    to ||= Object.create(Object.getPrototypeOf(this), {});
    const { oHash, iHash, finished, destroyed, blockLen, outputLen, canXOF } = this;
    to = to;
    to.finished = finished;
    to.destroyed = destroyed;
    to.blockLen = blockLen;
    to.outputLen = outputLen;
    to.canXOF = canXOF;
    to.oHash = oHash._cloneInto(to.oHash);
    to.iHash = iHash._cloneInto(to.iHash);
    return to;
  }
  clone() {
    return this._cloneInto();
  }
  destroy() {
    this.destroyed = true;
    this.oHash.destroy();
    this.iHash.destroy();
  }
};
var hmac = /* @__PURE__ */ (() => {
  const hmac_ = ((hash, key2, message2) => new _HMAC(hash, key2).update(message2).digest());
  hmac_.create = (hash, key2) => new _HMAC(hash, key2);
  return hmac_;
})();

// ../protocol/src/secure/invite.ts
var INVITE_SECRET_BYTES = 32;
function encodeInvite(invite) {
  if (invite.agentKey.length !== KEY_BYTES) {
    throw new Error(`agent key must be ${String(KEY_BYTES)} bytes`);
  }
  if (invite.secret.length !== INVITE_SECRET_BYTES) {
    throw new Error(`invite secret must be ${String(INVITE_SECRET_BYTES)} bytes`);
  }
  if (!Number.isSafeInteger(invite.expiresAt) || invite.expiresAt < 0) {
    throw new Error("invite expiry must be a non-negative integer");
  }
  return `${encodeBase64Url(invite.agentKey)}.${encodeBase64Url(invite.secret)}.${String(invite.expiresAt)}`;
}
function decodeInvite(text) {
  const parts = text.split(".");
  if (parts.length !== 3) return null;
  const [key2, secretText, expiry] = parts;
  const agentKey = decodeBase64Url(key2);
  const secret = decodeBase64Url(secretText);
  if (agentKey?.length !== KEY_BYTES || secret?.length !== INVITE_SECRET_BYTES) return null;
  if (!/^\d{1,16}$/.test(expiry)) return null;
  const expiresAt = Number(expiry);
  if (!Number.isSafeInteger(expiresAt)) return null;
  return { agentKey, secret, expiresAt };
}
function verifyPairingProof(secret, transcript, proof) {
  const received = decodeBase64Url(proof);
  if (!received) return false;
  return constantTimeEqual(hmac(sha256, secret, transcript), received);
}

// ../../node_modules/.pnpm/@noble+hashes@2.4.0/node_modules/@noble/hashes/hkdf.js
var HKDF_COUNTER = /* @__PURE__ */ Uint8Array.of(0);
var EMPTY_BUFFER = /* @__PURE__ */ Uint8Array.of();
function expand(hash, prk, info, length = 32, _recycled) {
  ahash(hash);
  anumber(length, "length");
  abytes(prk, void 0, "prk");
  const olen = hash.outputLen;
  if (prk.length < olen)
    throw new Error('"prk" must be at least HashLen octets');
  if (length > 255 * olen)
    throw new Error("Length must be <= 255*HashLen");
  const blocks = Math.ceil(length / olen);
  if (info === void 0)
    info = EMPTY_BUFFER;
  else
    abytes(info, void 0, "info");
  if (!blocks) {
    if (_recycled)
      clean(prk);
    return new Uint8Array();
  }
  const okm = _recycled && blocks === 1 ? prk : new Uint8Array(blocks * olen);
  const { iHash, oHash } = hmac.create(hash, prk);
  const T = _recycled ? prk : new Uint8Array(olen);
  const worker = blocks > 1 ? _recycled?.iHash || hash.create() : void 0;
  for (let counter = 0; counter < blocks - 1; counter++) {
    HKDF_COUNTER[0] = counter + 1;
    const iWork = iHash._cloneInto(worker);
    if (counter)
      iWork.update(T);
    iWork.update(info).update(HKDF_COUNTER).digestInto(T);
    oHash._cloneInto(worker).update(T).digestInto(T);
    okm.set(T, olen * counter);
  }
  HKDF_COUNTER[0] = blocks;
  if (blocks > 1)
    iHash.update(T);
  iHash.update(info).update(HKDF_COUNTER).digestInto(T);
  oHash.update(T).digestInto(T);
  okm.set(T, olen * (blocks - 1));
  iHash.destroy();
  oHash.destroy();
  worker?.destroy();
  if (T !== okm)
    clean(T);
  clean(HKDF_COUNTER);
  if (length === okm.length)
    return okm;
  const res = okm.slice(0, length);
  clean(okm);
  return res;
}
var hkdf = (hash, ikm, salt, info, length) => {
  ahash(hash);
  if (salt === void 0)
    salt = new Uint8Array(hash.outputLen);
  const HMAC = hmac.create(hash, salt).update(ikm);
  return expand(hash, HMAC.digest(), info, length, HMAC);
};

// ../../node_modules/.pnpm/@noble+ciphers@2.4.0/node_modules/@noble/ciphers/utils.js
function isBytes3(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array" && "BYTES_PER_ELEMENT" in a && a.BYTES_PER_ELEMENT === 1;
}
var atitle3 = (title) => title ? `"${title}" ` : "";
function abool2(value, title = "") {
  if (typeof value !== "boolean")
    throw new TypeError(atitle3(title) + "expected boolean, got type=" + typeof value);
  return value;
}
function anumber3(n, title = "") {
  if (typeof n !== "number")
    throw new TypeError(atitle3(title) + "expected number, got " + typeof n);
  if (!Number.isSafeInteger(n) || n < 0)
    throw new RangeError(atitle3(title) + "expected integer >= 0, got " + n);
  return n;
}
function abytes3(value, length, title = "") {
  if (isBytes3(value) && (length === void 0 || value.length === length))
    return value;
  if (length !== void 0)
    anumber3(length, "length");
  const bytes = isBytes3(value);
  const ofLen = length !== void 0 ? ` of length ${length}` : "";
  const got = bytes ? `length=${value.length}` : `type=${typeof value}`;
  const message2 = atitle3(title) + "expected Uint8Array" + ofLen + ", got " + got;
  if (!bytes)
    throw new TypeError(message2);
  throw new RangeError(message2);
}
var aobject3 = (value, label) => {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    throw new TypeError(label === "object" ? "expected valid options object" : `"${label}" expected object, got type=${typeof value}`);
};
function aexists2(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("hash was destroyed");
  if (checkFinished && instance.finished)
    throw new Error("digest() was already called");
}
function aoutput2(out, instance) {
  abytes3(out, void 0, "output");
  const min = instance.outputLen;
  if (!(out.length >= min)) {
    throw new RangeError('"output" expected length >= ' + min);
  }
}
function u32(arr) {
  return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
}
function clean2(...arrays) {
  for (let i = 0; i < arrays.length; i++) {
    arrays[i].fill(0);
  }
}
function createView2(arr) {
  return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
var isLE = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
function byteSwap(word) {
  return word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
}
function byteSwap32(arr) {
  for (let i = 0; i < arr.length; i++) {
    arr[i] = byteSwap(arr[i]);
  }
  return arr;
}
var swap32IfBE = isLE ? (u) => u : byteSwap32;
function overlapBytes(a, b) {
  if (!a.byteLength || !b.byteLength)
    return false;
  return a.buffer === b.buffer && // best we can do, may fail with an obscure Proxy
  a.byteOffset < b.byteOffset + b.byteLength && // a starts before b end
  b.byteOffset < a.byteOffset + a.byteLength;
}
function complexOverlapBytes(input, output) {
  if (overlapBytes(input, output) && input.byteOffset < output.byteOffset)
    throw new Error("complex overlap of input and output is not supported");
}
function checkOpts2(defaults, opts) {
  aobject3(defaults, "defaults");
  aobject3(opts, "opts");
  const merged = Object.assign(defaults, opts);
  return merged;
}
function equalBytes(a, b) {
  a = abytes3(a);
  b = abytes3(b);
  if (a.length !== b.length)
    return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++)
    diff |= a[i] ^ b[i];
  return diff === 0;
}
function wrapMacConstructor(keyLen, macCons, fromMsg) {
  const mac = macCons;
  const getArgs = fromMsg || (() => []);
  const macC = (msg, key2) => mac(key2, ...getArgs(msg)).update(msg).digest();
  const tmp = mac(new Uint8Array(keyLen), ...getArgs(new Uint8Array(0)));
  macC.outputLen = tmp.outputLen;
  macC.blockLen = tmp.blockLen;
  macC.create = (key2, ...args) => mac(key2, ...args);
  return macC;
}
var wrapCipher = /* @__NO_SIDE_EFFECTS__ */ (params, constructor) => {
  function wrappedCipher(key2, ...args) {
    abytes3(key2, void 0, "key");
    if (params.nonceLength !== void 0) {
      const nonce2 = args[0];
      abytes3(nonce2, params.varSizeNonce ? void 0 : params.nonceLength, "nonce");
    }
    const tagl = params.tagLength;
    const aadStart = params.nonceLength !== void 0 ? 1 : 0;
    if (!params.withAAD) {
      for (let i = aadStart; i < args.length; i++)
        if (isBytes3(args[i]))
          throw new Error("AAD not supported");
    }
    if (params.withAAD && args[aadStart] !== void 0)
      abytes3(args[aadStart], void 0, "AAD");
    const cipher = constructor(key2, ...args);
    const checkOutput = (fnLength, output) => {
      if (output !== void 0) {
        if (fnLength !== 2)
          throw new Error("cipher output not supported");
        abytes3(output, void 0, "output");
      }
    };
    let called = false;
    const wrCipher = {
      encrypt(data, output) {
        if (called)
          throw new Error("cannot encrypt() twice with same key + nonce");
        called = true;
        abytes3(data, void 0, "data");
        checkOutput(cipher.encrypt.length, output);
        return cipher.encrypt(data, output);
      },
      decrypt(data, output) {
        abytes3(data, void 0, "data");
        if (tagl && data.length < tagl)
          throw new Error('"ciphertext" expected length >= tagLength=' + tagl);
        checkOutput(cipher.decrypt.length, output);
        return cipher.decrypt(data, output);
      }
    };
    return wrCipher;
  }
  Object.assign(wrappedCipher, params);
  return wrappedCipher;
};
function getOutput(expectedLength, out, onlyAligned = true) {
  if (out === void 0)
    return new Uint8Array(expectedLength);
  abytes3(out, expectedLength, "output");
  if (onlyAligned && !isAligned32(out))
    throw new Error("invalid output, must be aligned");
  return out;
}
function u64Lengths(dataLength, aadLength, isLE2) {
  anumber3(dataLength);
  anumber3(aadLength);
  abool2(isLE2);
  const num = new Uint8Array(16);
  const view = createView2(num);
  view.setBigUint64(0, BigInt(aadLength), isLE2);
  view.setBigUint64(8, BigInt(dataLength), isLE2);
  return num;
}
function isAligned32(bytes) {
  return bytes.byteOffset % 4 === 0;
}
function copyBytes2(bytes) {
  return Uint8Array.from(abytes3(bytes));
}

// ../../node_modules/.pnpm/@noble+ciphers@2.4.0/node_modules/@noble/ciphers/_arx.js
var encodeStr = (str) => Uint8Array.from(str.split(""), (c) => c.charCodeAt(0));
var sigma16_32 = /* @__PURE__ */ (() => swap32IfBE(u32(encodeStr("expand 16-byte k"))))();
var sigma32_32 = /* @__PURE__ */ (() => swap32IfBE(u32(encodeStr("expand 32-byte k"))))();
function rotl(a, b) {
  return a << b | a >>> 32 - b;
}
var BLOCK_LEN = 64;
var BLOCK_LEN32 = 16;
var MAX_COUNTER = /* @__PURE__ */ (() => 2 ** 32 - 1)();
var U32_EMPTY = /* @__PURE__ */ Uint32Array.of();
function runCipher(core, sigma, key2, nonce2, data, output, counter, rounds) {
  const len = data.length;
  const block = new Uint8Array(BLOCK_LEN);
  const b32 = u32(block);
  const isAligned = isLE && isAligned32(data) && isAligned32(output);
  const d32 = isAligned ? u32(data) : U32_EMPTY;
  const o32 = isAligned ? u32(output) : U32_EMPTY;
  if (!isLE) {
    for (let pos = 0; pos < len; counter++) {
      core(sigma, key2, nonce2, b32, counter, rounds);
      swap32IfBE(b32);
      if (counter >= MAX_COUNTER)
        throw new Error("arx: counter overflow");
      const take = Math.min(BLOCK_LEN, len - pos);
      for (let j = 0, posj; j < take; j++) {
        posj = pos + j;
        output[posj] = data[posj] ^ block[j];
      }
      pos += take;
    }
    return;
  }
  for (let pos = 0; pos < len; counter++) {
    core(sigma, key2, nonce2, b32, counter, rounds);
    if (counter >= MAX_COUNTER)
      throw new Error("arx: counter overflow");
    const take = Math.min(BLOCK_LEN, len - pos);
    if (isAligned && take === BLOCK_LEN) {
      const pos32 = pos / 4;
      if (pos % 4 !== 0)
        throw new Error("arx: invalid block position");
      for (let j = 0, posj; j < BLOCK_LEN32; j++) {
        posj = pos32 + j;
        o32[posj] = d32[posj] ^ b32[j];
      }
      pos += BLOCK_LEN;
      continue;
    }
    for (let j = 0, posj; j < take; j++) {
      posj = pos + j;
      output[posj] = data[posj] ^ block[j];
    }
    pos += take;
  }
}
function createCipher(core, opts) {
  const { allowShortKeys, extendNonceFn, counterLength, counterRight, rounds } = checkOpts2({ allowShortKeys: false, counterLength: 8, counterRight: false, rounds: 20 }, opts);
  if (typeof core !== "function")
    throw new Error("core must be a function");
  anumber3(counterLength);
  anumber3(rounds);
  abool2(counterRight);
  abool2(allowShortKeys);
  return (key2, nonce2, data, output, counter = 0) => {
    abytes3(key2, void 0, "key");
    abytes3(nonce2, void 0, "nonce");
    abytes3(data, void 0, "data");
    const len = data.length;
    const hasOutput = output !== void 0;
    output = getOutput(len, output, false);
    if (hasOutput)
      complexOverlapBytes(data, output);
    anumber3(counter);
    if (counter < 0 || counter >= MAX_COUNTER)
      throw new Error("arx: counter overflow");
    const toClean = [];
    let l = key2.length;
    let k;
    let sigma;
    if (l === 32) {
      toClean.push(k = copyBytes2(key2));
      sigma = sigma32_32;
    } else if (l === 16 && allowShortKeys) {
      k = new Uint8Array(32);
      k.set(key2);
      k.set(key2, 16);
      sigma = sigma16_32;
      toClean.push(k);
    } else {
      abytes3(key2, 32, "arx key");
      throw new Error("invalid key size");
    }
    if (!isLE || !isAligned32(nonce2))
      toClean.push(nonce2 = copyBytes2(nonce2));
    let k32 = u32(k);
    if (extendNonceFn) {
      if (nonce2.length !== 24)
        throw new Error("arx: extended nonce must be 24 bytes");
      const n16 = nonce2.subarray(0, 16);
      if (isLE)
        extendNonceFn(sigma, k32, u32(n16), k32);
      else {
        const sigmaRaw = swap32IfBE(Uint32Array.from(sigma));
        extendNonceFn(sigmaRaw, k32, u32(n16), k32);
        clean2(sigmaRaw);
        swap32IfBE(k32);
      }
      nonce2 = nonce2.subarray(16);
    } else if (!isLE)
      swap32IfBE(k32);
    const nonceNcLen = 16 - counterLength;
    if (nonceNcLen !== nonce2.length)
      throw new Error(`arx: nonce must be ${nonceNcLen} or 16 bytes`);
    if (nonceNcLen !== 12) {
      const nc = new Uint8Array(12);
      nc.set(nonce2, counterRight ? 0 : 12 - nonce2.length);
      nonce2 = nc;
      toClean.push(nonce2);
    }
    const n32 = swap32IfBE(u32(nonce2));
    try {
      runCipher(core, sigma, k32, n32, data, output, counter, rounds);
      return output;
    } finally {
      clean2(...toClean);
    }
  };
}

// ../../node_modules/.pnpm/@noble+ciphers@2.4.0/node_modules/@noble/ciphers/_poly1305.js
function u8to16(a, i) {
  return a[i++] & 255 | (a[i++] & 255) << 8;
}
var Poly1305 = class {
  blockLen = 16;
  outputLen = 16;
  buffer = new Uint8Array(16);
  r = new Uint16Array(10);
  // Allocating 1 array with .subarray() here is slower than 3
  h = new Uint16Array(10);
  pad = new Uint16Array(8);
  pos = 0;
  finished = false;
  destroyed = false;
  // Can be speed-up using BigUint64Array, at the cost of complexity
  constructor(key2) {
    key2 = copyBytes2(abytes3(key2, 32, "key"));
    const t0 = u8to16(key2, 0);
    const t1 = u8to16(key2, 2);
    const t2 = u8to16(key2, 4);
    const t3 = u8to16(key2, 6);
    const t4 = u8to16(key2, 8);
    const t5 = u8to16(key2, 10);
    const t6 = u8to16(key2, 12);
    const t7 = u8to16(key2, 14);
    this.r[0] = t0 & 8191;
    this.r[1] = (t0 >>> 13 | t1 << 3) & 8191;
    this.r[2] = (t1 >>> 10 | t2 << 6) & 7939;
    this.r[3] = (t2 >>> 7 | t3 << 9) & 8191;
    this.r[4] = (t3 >>> 4 | t4 << 12) & 255;
    this.r[5] = t4 >>> 1 & 8190;
    this.r[6] = (t4 >>> 14 | t5 << 2) & 8191;
    this.r[7] = (t5 >>> 11 | t6 << 5) & 8065;
    this.r[8] = (t6 >>> 8 | t7 << 8) & 8191;
    this.r[9] = t7 >>> 5 & 127;
    for (let i = 0; i < 8; i++)
      this.pad[i] = u8to16(key2, 16 + 2 * i);
  }
  process(data, offset, isLast = false) {
    const hibit = isLast ? 0 : 1 << 11;
    const { h, r } = this;
    const r0 = r[0];
    const r1 = r[1];
    const r2 = r[2];
    const r3 = r[3];
    const r4 = r[4];
    const r5 = r[5];
    const r6 = r[6];
    const r7 = r[7];
    const r8 = r[8];
    const r9 = r[9];
    const t0 = u8to16(data, offset + 0);
    const t1 = u8to16(data, offset + 2);
    const t2 = u8to16(data, offset + 4);
    const t3 = u8to16(data, offset + 6);
    const t4 = u8to16(data, offset + 8);
    const t5 = u8to16(data, offset + 10);
    const t6 = u8to16(data, offset + 12);
    const t7 = u8to16(data, offset + 14);
    let h0 = h[0] + (t0 & 8191);
    let h1 = h[1] + ((t0 >>> 13 | t1 << 3) & 8191);
    let h2 = h[2] + ((t1 >>> 10 | t2 << 6) & 8191);
    let h3 = h[3] + ((t2 >>> 7 | t3 << 9) & 8191);
    let h4 = h[4] + ((t3 >>> 4 | t4 << 12) & 8191);
    let h5 = h[5] + (t4 >>> 1 & 8191);
    let h6 = h[6] + ((t4 >>> 14 | t5 << 2) & 8191);
    let h7 = h[7] + ((t5 >>> 11 | t6 << 5) & 8191);
    let h8 = h[8] + ((t6 >>> 8 | t7 << 8) & 8191);
    let h9 = h[9] + (t7 >>> 5 | hibit);
    let c = 0;
    let d0 = c + h0 * r0 + h1 * (5 * r9) + h2 * (5 * r8) + h3 * (5 * r7) + h4 * (5 * r6);
    c = d0 >>> 13;
    d0 &= 8191;
    d0 += h5 * (5 * r5) + h6 * (5 * r4) + h7 * (5 * r3) + h8 * (5 * r2) + h9 * (5 * r1);
    c += d0 >>> 13;
    d0 &= 8191;
    let d1 = c + h0 * r1 + h1 * r0 + h2 * (5 * r9) + h3 * (5 * r8) + h4 * (5 * r7);
    c = d1 >>> 13;
    d1 &= 8191;
    d1 += h5 * (5 * r6) + h6 * (5 * r5) + h7 * (5 * r4) + h8 * (5 * r3) + h9 * (5 * r2);
    c += d1 >>> 13;
    d1 &= 8191;
    let d2 = c + h0 * r2 + h1 * r1 + h2 * r0 + h3 * (5 * r9) + h4 * (5 * r8);
    c = d2 >>> 13;
    d2 &= 8191;
    d2 += h5 * (5 * r7) + h6 * (5 * r6) + h7 * (5 * r5) + h8 * (5 * r4) + h9 * (5 * r3);
    c += d2 >>> 13;
    d2 &= 8191;
    let d3 = c + h0 * r3 + h1 * r2 + h2 * r1 + h3 * r0 + h4 * (5 * r9);
    c = d3 >>> 13;
    d3 &= 8191;
    d3 += h5 * (5 * r8) + h6 * (5 * r7) + h7 * (5 * r6) + h8 * (5 * r5) + h9 * (5 * r4);
    c += d3 >>> 13;
    d3 &= 8191;
    let d4 = c + h0 * r4 + h1 * r3 + h2 * r2 + h3 * r1 + h4 * r0;
    c = d4 >>> 13;
    d4 &= 8191;
    d4 += h5 * (5 * r9) + h6 * (5 * r8) + h7 * (5 * r7) + h8 * (5 * r6) + h9 * (5 * r5);
    c += d4 >>> 13;
    d4 &= 8191;
    let d5 = c + h0 * r5 + h1 * r4 + h2 * r3 + h3 * r2 + h4 * r1;
    c = d5 >>> 13;
    d5 &= 8191;
    d5 += h5 * r0 + h6 * (5 * r9) + h7 * (5 * r8) + h8 * (5 * r7) + h9 * (5 * r6);
    c += d5 >>> 13;
    d5 &= 8191;
    let d6 = c + h0 * r6 + h1 * r5 + h2 * r4 + h3 * r3 + h4 * r2;
    c = d6 >>> 13;
    d6 &= 8191;
    d6 += h5 * r1 + h6 * r0 + h7 * (5 * r9) + h8 * (5 * r8) + h9 * (5 * r7);
    c += d6 >>> 13;
    d6 &= 8191;
    let d7 = c + h0 * r7 + h1 * r6 + h2 * r5 + h3 * r4 + h4 * r3;
    c = d7 >>> 13;
    d7 &= 8191;
    d7 += h5 * r2 + h6 * r1 + h7 * r0 + h8 * (5 * r9) + h9 * (5 * r8);
    c += d7 >>> 13;
    d7 &= 8191;
    let d8 = c + h0 * r8 + h1 * r7 + h2 * r6 + h3 * r5 + h4 * r4;
    c = d8 >>> 13;
    d8 &= 8191;
    d8 += h5 * r3 + h6 * r2 + h7 * r1 + h8 * r0 + h9 * (5 * r9);
    c += d8 >>> 13;
    d8 &= 8191;
    let d9 = c + h0 * r9 + h1 * r8 + h2 * r7 + h3 * r6 + h4 * r5;
    c = d9 >>> 13;
    d9 &= 8191;
    d9 += h5 * r4 + h6 * r3 + h7 * r2 + h8 * r1 + h9 * r0;
    c += d9 >>> 13;
    d9 &= 8191;
    c = (c << 2) + c | 0;
    c = c + d0 | 0;
    d0 = c & 8191;
    c = c >>> 13;
    d1 += c;
    h[0] = d0;
    h[1] = d1;
    h[2] = d2;
    h[3] = d3;
    h[4] = d4;
    h[5] = d5;
    h[6] = d6;
    h[7] = d7;
    h[8] = d8;
    h[9] = d9;
  }
  finalize() {
    const { h, pad: pad2 } = this;
    const g = new Uint16Array(10);
    let c = h[1] >>> 13;
    h[1] &= 8191;
    for (let i = 2; i < 10; i++) {
      h[i] += c;
      c = h[i] >>> 13;
      h[i] &= 8191;
    }
    h[0] += c * 5;
    c = h[0] >>> 13;
    h[0] &= 8191;
    h[1] += c;
    c = h[1] >>> 13;
    h[1] &= 8191;
    h[2] += c;
    g[0] = h[0] + 5;
    c = g[0] >>> 13;
    g[0] &= 8191;
    for (let i = 1; i < 10; i++) {
      g[i] = h[i] + c;
      c = g[i] >>> 13;
      g[i] &= 8191;
    }
    g[9] -= 1 << 13;
    let mask = (c ^ 1) - 1;
    for (let i = 0; i < 10; i++)
      g[i] &= mask;
    mask = ~mask;
    for (let i = 0; i < 10; i++)
      h[i] = h[i] & mask | g[i];
    h[0] = (h[0] | h[1] << 13) & 65535;
    h[1] = (h[1] >>> 3 | h[2] << 10) & 65535;
    h[2] = (h[2] >>> 6 | h[3] << 7) & 65535;
    h[3] = (h[3] >>> 9 | h[4] << 4) & 65535;
    h[4] = (h[4] >>> 12 | h[5] << 1 | h[6] << 14) & 65535;
    h[5] = (h[6] >>> 2 | h[7] << 11) & 65535;
    h[6] = (h[7] >>> 5 | h[8] << 8) & 65535;
    h[7] = (h[8] >>> 8 | h[9] << 5) & 65535;
    let f = h[0] + pad2[0];
    h[0] = f & 65535;
    for (let i = 1; i < 8; i++) {
      f = (h[i] + pad2[i] | 0) + (f >>> 16) | 0;
      h[i] = f & 65535;
    }
    clean2(g);
  }
  update(data) {
    aexists2(this);
    abytes3(data);
    data = copyBytes2(data);
    const { buffer, blockLen } = this;
    const len = data.length;
    for (let pos = 0; pos < len; ) {
      const take = Math.min(blockLen - this.pos, len - pos);
      if (take === blockLen) {
        for (; blockLen <= len - pos; pos += blockLen)
          this.process(data, pos);
        continue;
      }
      buffer.set(data.subarray(pos, pos + take), this.pos);
      this.pos += take;
      pos += take;
      if (this.pos === blockLen) {
        this.process(buffer, 0, false);
        this.pos = 0;
      }
    }
    return this;
  }
  destroy() {
    this.destroyed = true;
    clean2(this.h, this.r, this.buffer, this.pad);
  }
  digestInto(out) {
    aexists2(this);
    aoutput2(out, this);
    this.finished = true;
    const { buffer, h } = this;
    let { pos } = this;
    if (pos) {
      buffer[pos++] = 1;
      for (; pos < 16; pos++)
        buffer[pos] = 0;
      this.process(buffer, 0, true);
    }
    this.finalize();
    let opos = 0;
    for (let i = 0; i < 8; i++) {
      out[opos++] = h[i] >>> 0;
      out[opos++] = h[i] >>> 8;
    }
  }
  digest() {
    const { buffer, outputLen } = this;
    this.digestInto(buffer);
    const res = buffer.slice(0, outputLen);
    this.destroy();
    return res;
  }
};
var poly1305 = /* @__PURE__ */ wrapMacConstructor(32, (key2) => new Poly1305(key2));

// ../../node_modules/.pnpm/@noble+ciphers@2.4.0/node_modules/@noble/ciphers/chacha.js
function chachaCore(s, k, n, out, cnt, rounds = 20) {
  let y00 = s[0], y01 = s[1], y02 = s[2], y03 = s[3], y04 = k[0], y05 = k[1], y06 = k[2], y07 = k[3], y08 = k[4], y09 = k[5], y10 = k[6], y11 = k[7], y12 = cnt, y13 = n[0], y14 = n[1], y15 = n[2];
  let x00 = y00, x01 = y01, x02 = y02, x03 = y03, x04 = y04, x05 = y05, x06 = y06, x07 = y07, x08 = y08, x09 = y09, x10 = y10, x11 = y11, x12 = y12, x13 = y13, x14 = y14, x15 = y15;
  for (let r = 0; r < rounds; r += 2) {
    x00 = x00 + x04 | 0;
    x12 = rotl(x12 ^ x00, 16);
    x08 = x08 + x12 | 0;
    x04 = rotl(x04 ^ x08, 12);
    x00 = x00 + x04 | 0;
    x12 = rotl(x12 ^ x00, 8);
    x08 = x08 + x12 | 0;
    x04 = rotl(x04 ^ x08, 7);
    x01 = x01 + x05 | 0;
    x13 = rotl(x13 ^ x01, 16);
    x09 = x09 + x13 | 0;
    x05 = rotl(x05 ^ x09, 12);
    x01 = x01 + x05 | 0;
    x13 = rotl(x13 ^ x01, 8);
    x09 = x09 + x13 | 0;
    x05 = rotl(x05 ^ x09, 7);
    x02 = x02 + x06 | 0;
    x14 = rotl(x14 ^ x02, 16);
    x10 = x10 + x14 | 0;
    x06 = rotl(x06 ^ x10, 12);
    x02 = x02 + x06 | 0;
    x14 = rotl(x14 ^ x02, 8);
    x10 = x10 + x14 | 0;
    x06 = rotl(x06 ^ x10, 7);
    x03 = x03 + x07 | 0;
    x15 = rotl(x15 ^ x03, 16);
    x11 = x11 + x15 | 0;
    x07 = rotl(x07 ^ x11, 12);
    x03 = x03 + x07 | 0;
    x15 = rotl(x15 ^ x03, 8);
    x11 = x11 + x15 | 0;
    x07 = rotl(x07 ^ x11, 7);
    x00 = x00 + x05 | 0;
    x15 = rotl(x15 ^ x00, 16);
    x10 = x10 + x15 | 0;
    x05 = rotl(x05 ^ x10, 12);
    x00 = x00 + x05 | 0;
    x15 = rotl(x15 ^ x00, 8);
    x10 = x10 + x15 | 0;
    x05 = rotl(x05 ^ x10, 7);
    x01 = x01 + x06 | 0;
    x12 = rotl(x12 ^ x01, 16);
    x11 = x11 + x12 | 0;
    x06 = rotl(x06 ^ x11, 12);
    x01 = x01 + x06 | 0;
    x12 = rotl(x12 ^ x01, 8);
    x11 = x11 + x12 | 0;
    x06 = rotl(x06 ^ x11, 7);
    x02 = x02 + x07 | 0;
    x13 = rotl(x13 ^ x02, 16);
    x08 = x08 + x13 | 0;
    x07 = rotl(x07 ^ x08, 12);
    x02 = x02 + x07 | 0;
    x13 = rotl(x13 ^ x02, 8);
    x08 = x08 + x13 | 0;
    x07 = rotl(x07 ^ x08, 7);
    x03 = x03 + x04 | 0;
    x14 = rotl(x14 ^ x03, 16);
    x09 = x09 + x14 | 0;
    x04 = rotl(x04 ^ x09, 12);
    x03 = x03 + x04 | 0;
    x14 = rotl(x14 ^ x03, 8);
    x09 = x09 + x14 | 0;
    x04 = rotl(x04 ^ x09, 7);
  }
  let oi = 0;
  out[oi++] = y00 + x00 | 0;
  out[oi++] = y01 + x01 | 0;
  out[oi++] = y02 + x02 | 0;
  out[oi++] = y03 + x03 | 0;
  out[oi++] = y04 + x04 | 0;
  out[oi++] = y05 + x05 | 0;
  out[oi++] = y06 + x06 | 0;
  out[oi++] = y07 + x07 | 0;
  out[oi++] = y08 + x08 | 0;
  out[oi++] = y09 + x09 | 0;
  out[oi++] = y10 + x10 | 0;
  out[oi++] = y11 + x11 | 0;
  out[oi++] = y12 + x12 | 0;
  out[oi++] = y13 + x13 | 0;
  out[oi++] = y14 + x14 | 0;
  out[oi++] = y15 + x15 | 0;
}
var chacha20 = /* @__PURE__ */ createCipher(chachaCore, {
  counterRight: false,
  counterLength: 4,
  allowShortKeys: false
});
var ZEROS16 = /* @__PURE__ */ new Uint8Array(16);
var updatePadded = (h, msg) => {
  h.update(msg);
  const leftover = msg.length % 16;
  if (leftover)
    h.update(ZEROS16.subarray(leftover));
};
var ZEROS32 = /* @__PURE__ */ new Uint8Array(32);
function computeTag(fn, key2, nonce2, ciphertext, AAD) {
  if (AAD !== void 0)
    abytes3(AAD, void 0, "AAD");
  const authKey = fn(key2, nonce2, ZEROS32);
  const lengths = u64Lengths(ciphertext.length, AAD ? AAD.length : 0, true);
  const h = poly1305.create(authKey);
  if (AAD)
    updatePadded(h, AAD);
  updatePadded(h, ciphertext);
  h.update(lengths);
  const res = h.digest();
  clean2(authKey, lengths);
  return res;
}
var _poly1305_aead = (xorStream) => (key2, nonce2, AAD) => {
  const tagLength = 16;
  return {
    encrypt(plaintext, output) {
      const plength = plaintext.length;
      output = getOutput(plength + tagLength, output, false);
      output.set(plaintext);
      const oPlain = output.subarray(0, -tagLength);
      xorStream(key2, nonce2, oPlain, oPlain, 1);
      const tag = computeTag(xorStream, key2, nonce2, oPlain, AAD);
      output.set(tag, plength);
      clean2(tag);
      return output;
    },
    decrypt(ciphertext, output) {
      output = getOutput(ciphertext.length - tagLength, output, false);
      const data = ciphertext.subarray(0, -tagLength);
      const passedTag = ciphertext.subarray(-tagLength);
      const tag = computeTag(xorStream, key2, nonce2, data, AAD);
      if (!equalBytes(passedTag, tag)) {
        clean2(tag);
        throw new Error("invalid tag");
      }
      output.set(ciphertext.subarray(0, -tagLength));
      xorStream(key2, nonce2, output, output, 1);
      clean2(tag);
      return output;
    }
  };
};
var chacha20poly1305 = /* @__PURE__ */ wrapCipher(
  { blockSize: 64, nonceLength: 12, tagLength: 16, withAAD: true },
  /* @__PURE__ */ _poly1305_aead(chacha20)
);

// ../protocol/src/secure/secure-session.ts
var encoder3 = new TextEncoder();
var PHONE_TO_AGENT = encoder3.encode("p2a");
var AGENT_TO_PHONE = encoder3.encode("a2p");
var MAX_COUNTER2 = Number.MAX_SAFE_INTEGER;
function nonce(counter) {
  const bytes = new Uint8Array(12);
  const view = new DataView(bytes.buffer);
  view.setUint32(4, Math.floor(counter / 2 ** 32));
  view.setUint32(8, counter >>> 0);
  return bytes;
}
var Direction = class {
  constructor(key2, aad) {
    this.key = key2;
    this.aad = aad;
  }
  key;
  aad;
  counter = 0;
  next() {
    if (this.counter >= MAX_COUNTER2) throw new Error("secure session exhausted its nonces");
    return chacha20poly1305(this.key, nonce(this.counter++), this.aad);
  }
};
var CipherSession = class {
  constructor(transcript, outgoing, incoming) {
    this.transcript = transcript;
    this.outgoing = outgoing;
    this.incoming = incoming;
  }
  transcript;
  outgoing;
  incoming;
  failed = false;
  seal(plain) {
    return this.outgoing.next().encrypt(plain);
  }
  open(sealed) {
    if (this.failed) throw new Error("secure session closed after a bad frame");
    try {
      return this.incoming.next().decrypt(sealed);
    } catch (error) {
      this.failed = true;
      throw new Error("bad frame: replayed, reordered, truncated or altered", { cause: error });
    }
  }
};
function createSecureSession(side, transcript, keys) {
  const phoneToAgent = new Direction(keys.slice(0, 32), PHONE_TO_AGENT);
  const agentToPhone = new Direction(keys.slice(32, 64), AGENT_TO_PHONE);
  return side === "phone" ? new CipherSession(transcript, phoneToAgent, agentToPhone) : new CipherSession(transcript, agentToPhone, phoneToAgent);
}

// ../protocol/src/secure/handshake.ts
var encoder4 = new TextEncoder();
var TRANSCRIPT_LABEL = encoder4.encode("remote-sheep/2");
var KEYS_INFO = encoder4.encode("remote-sheep/2 keys");
function dh(secretKey, publicKey) {
  if (publicKey.length !== KEY_BYTES) throw new Error("handshake failed: bad key length");
  let shared;
  try {
    shared = x25519.getSharedSecret(secretKey, publicKey);
  } catch (error) {
    throw new Error("handshake failed: low-order key", { cause: error });
  }
  if (shared.every((byte) => byte === 0)) throw new Error("handshake failed: low-order key");
  return shared;
}
function derive(side, parties, shared) {
  const transcript = sha256(
    concatBytes(
      TRANSCRIPT_LABEL,
      Uint8Array.of(PROTOCOL),
      parties.phoneEphemeral,
      parties.phoneStatic,
      parties.agentEphemeral,
      parties.agentStatic
    )
  );
  const okm = hkdf(sha256, concatBytes(...shared), transcript, KEYS_INFO, 64);
  return createSecureSession(side, transcript, okm);
}
function acceptHandshake(agent, hello, ephemeral) {
  if (hello.protocol !== PROTOCOL) throw new Error("handshake failed: protocol mismatch");
  const own = ephemeral ?? generateKeyPair();
  const parties = {
    phoneEphemeral: hello.ephemeral,
    phoneStatic: hello.identity,
    agentEphemeral: own.publicKey,
    agentStatic: agent.publicKey
  };
  const session = derive("agent", parties, [
    dh(own.secretKey, hello.ephemeral),
    dh(agent.secretKey, hello.ephemeral),
    dh(own.secretKey, hello.identity)
  ]);
  return { welcome: { ephemeral: own.publicKey }, session };
}

// ../protocol/src/secure/handshake-frames.ts
function headerOf(data, type) {
  const frame = decodeFrame(data);
  if (!frame || frame.bytes) return null;
  const header = frame.header;
  if (typeof header !== "object" || header === null || Array.isArray(header)) return null;
  return header["type"] === type ? header : null;
}
function key(value) {
  if (typeof value !== "string") return null;
  const bytes = decodeBase64Url(value);
  return bytes?.length === KEY_BYTES ? bytes : null;
}
function decodeHello(data) {
  const header = headerOf(data, "hello");
  if (!header) return null;
  const protocol = header["protocol"];
  if (typeof protocol !== "number" || !Number.isInteger(protocol)) return null;
  if (protocol < 0 || protocol > 255) return null;
  const ephemeral = key(header["ephemeral"]);
  const identity = key(header["identity"]);
  const pair = header["pair"];
  if (!ephemeral || !identity || typeof pair !== "boolean") return null;
  return { protocol, ephemeral, identity, pair };
}
function encodeWelcome(welcome) {
  return encodeFrame({ type: "welcome", ephemeral: encodeBase64Url(welcome.ephemeral) });
}

// ../protocol/src/index.ts
var AGENT_KINDS = ["claude", "codex"];
var AUTH_TIMEOUT_MS = 5e3;
var CLOSE_UNAUTHORIZED = 4001;
var CLOSE_PROTOCOL = 4002;
var CLOSE_PAIRING_EXPIRED = 4003;
var RELAY_PING = "ping";
var RELAY_PONG = "pong";
var isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
var isText = (value) => typeof value === "string" && value.length > 0;
var isProof = (value) => typeof value === "string" && decodeBase64Url(value)?.length === 32;
var isKeyOf = (value, length) => typeof value === "string" && decodeBase64Url(value)?.length === length;
function isHttpsUrl(value) {
  if (!isText(value)) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
function parseRequest(value, bytes) {
  if (!isObject(value)) return null;
  if (value["kind"] === "upload") {
    if (!isText(value["media"]) || !bytes) return null;
    return { kind: "upload", media: value["media"], data: bytes };
  }
  if (bytes) return null;
  switch (value["kind"]) {
    case "watch":
      if (value["target"] !== null && !isText(value["target"])) return null;
      if (typeof value["terminal"] !== "boolean") return null;
      if (value["chat"] !== void 0 && typeof value["chat"] !== "boolean") return null;
      return {
        kind: "watch",
        target: value["target"],
        terminal: value["terminal"],
        ...value["chat"] === void 0 ? {} : { chat: value["chat"] }
      };
    case "prompt":
      if (!isText(value["target"]) || !isText(value["text"])) return null;
      return { kind: "prompt", target: value["target"], text: value["text"] };
    case "keys":
      if (!isText(value["target"]) || !Array.isArray(value["keys"]) || value["keys"].length === 0) {
        return null;
      }
      if (!value["keys"].every(isText)) return null;
      return { kind: "keys", target: value["target"], keys: value["keys"] };
    case "image":
      if (!isText(value["target"]) || !isText(value["id"])) return null;
      return { kind: "image", target: value["target"], id: value["id"] };
    case "devices":
      return { kind: "devices" };
    case "unlink":
      if (!isText(value["id"])) return null;
      return { kind: "unlink", id: value["id"] };
    case "push-key":
      return { kind: "push-key" };
    case "push-subscribe": {
      const { endpoint, p256dh, auth } = value;
      if (!isHttpsUrl(endpoint) || !isKeyOf(p256dh, 65) || !isKeyOf(auth, 16)) return null;
      return { kind: "push-subscribe", endpoint, p256dh, auth };
    }
    case "push-unsubscribe":
      return { kind: "push-unsubscribe" };
    case "spaces":
      return { kind: "spaces" };
    case "shells":
      if (value["on"] !== void 0 && typeof value["on"] !== "boolean") return null;
      return { kind: "shells", ...value["on"] === void 0 ? {} : { on: value["on"] } };
    case "relay": {
      if (value["set"] === void 0) return { kind: "relay" };
      const set = decodeRelayChange(value["set"]);
      return set ? { kind: "relay", set } : null;
    }
    case "update":
      if (value["run"] !== void 0 && typeof value["run"] !== "boolean") return null;
      return { kind: "update", ...value["run"] === void 0 ? {} : { run: value["run"] } };
    case "pairing":
      return { kind: "pairing" };
    case "port": {
      const set = value["set"];
      if (set === void 0) return { kind: "port" };
      return set === "auto" || Number.isSafeInteger(set) ? { kind: "port", set } : null;
    }
    case "new-session": {
      if (!isText(value["space"])) return null;
      if (value["shell"] !== void 0 && typeof value["shell"] !== "boolean") return null;
      const agent = value["agent"];
      if (agent !== void 0 && !AGENT_KINDS.some((known) => known === agent)) return null;
      return {
        kind: "new-session",
        space: value["space"],
        shell: value["shell"] === true,
        ...agent === void 0 ? {} : { agent }
      };
    }
    default:
      return null;
  }
}
var MAX_RELAY_URL_TEXT = 2048;
var MAX_RELAY_CODE_TEXT = 1024;
function decodeRelayChange(value) {
  if (!isObject(value)) return null;
  const keys = Object.keys(value);
  if (value["off"] === true) return keys.length === 1 ? { off: true } : null;
  const { url, code } = value;
  if (keys.length !== 2 || typeof url !== "string" || typeof code !== "string") return null;
  if (url.length > MAX_RELAY_URL_TEXT || code.length > MAX_RELAY_CODE_TEXT) return null;
  return { url, code };
}
function splitBytes(value) {
  if (!isObject(value) || !(value["data"] instanceof Uint8Array)) return [value, null];
  const { data, ...rest } = value;
  return [rest, data];
}
function decodeClientMessage(data) {
  const frame = decodeFrame(data);
  if (!frame || !isObject(frame.header)) return null;
  const value = frame.header;
  if (value["type"] === "confirm") {
    if (frame.bytes) return null;
    if (!("proof" in value)) return { type: "confirm" };
    return isProof(value["proof"]) ? { type: "confirm", proof: value["proof"] } : null;
  }
  if (value["type"] === "request") {
    if (!Number.isSafeInteger(value["id"])) return null;
    const request2 = parseRequest(value["request"], frame.bytes);
    return request2 ? { type: "request", id: value["id"], request: request2 } : null;
  }
  return null;
}
var REQUEST_KINDS = /* @__PURE__ */ new Set([
  "watch",
  "prompt",
  "keys",
  "image",
  "upload",
  "devices",
  "unlink",
  "push-key",
  "push-subscribe",
  "push-unsubscribe"
]);
function readUnknownRequest(data) {
  const frame = decodeFrame(data);
  if (!frame || !isObject(frame.header)) return null;
  const { type, id, request: request2 } = frame.header;
  if (type !== "request" || !Number.isSafeInteger(id) || !isObject(request2)) return null;
  const kind = request2["kind"];
  if (!isText(kind) || REQUEST_KINDS.has(kind)) return null;
  return { id, kind };
}
function encodeServerMessage(message2) {
  if (message2.type !== "reply" || !message2.ok) return encodeFrame(message2);
  const [result, bytes] = splitBytes(message2.result);
  return encodeFrame({ ...message2, result }, bytes);
}

// package.json
var package_default = {
  name: "remote-sheep",
  version: "0.11.0",
  license: "SEE LICENSE IN LICENSE",
  private: true,
  description: "Drive the coding agents running in Herdr from your phone, by chat and voice",
  type: "module",
  bin: {
    "remote-sheep": "dist/remote-sheep.js"
  },
  files: [
    "dist"
  ],
  engines: {
    node: ">=22"
  },
  scripts: {
    build: "node build.mjs",
    typecheck: "tsc -p ."
  },
  devDependencies: {
    "@remote-sheep/protocol": "workspace:*",
    "@types/qrcode": "^1.5.6",
    "@types/ws": "^8.5.0",
    esbuild: "^0.28.0",
    qrcode: "^1.5.4",
    ws: "^8.18.0"
  }
};

// src/L1_domain/pairing-links.ts
function pairingUrl(origin, invite) {
  return origin + "/#pair=" + encodeInvite(invite);
}
var PairingLinks = class {
  constructor(origins, invites) {
    this.origins = origins;
    this.invites = invites;
  }
  origins;
  invites;
  /** Makes a new invite (voiding the previous one) and lays it out at every origin. */
  newPairing() {
    const invite = this.invites.createInvite();
    const link = (where, origin) => ({
      where,
      url: pairingUrl(origin, invite)
    });
    const relay2 = this.origins.relay();
    return {
      links: [
        ...relay2 ? [link("relay", relay2)] : [],
        ...this.origins.network.map((origin) => link("network", origin)),
        link("this-pc", this.origins.local)
      ],
      expiresAt: invite.expiresAt
    };
  }
};

// src/L2_application/agent-updater.ts
var NOT_A_PLUGIN = "This agent does not run as the Herdr plugin, so it cannot update itself. On the computer, run `herdr plugin update sheepvibecoder.remote-sheep`, or `git pull` in a copy of the code (it holds the built agent; run `pnpm build` only if you changed the code), then restart the agent.";
var ALREADY_UPDATING = "an update is already running on this computer";
var RESTART_FAILED = "the update is installed but the agent could not restart into it: ";
var AgentUpdater = class {
  constructor(options) {
    this.options = options;
  }
  options;
  updating = false;
  ended = {};
  updateState() {
    return {
      version: this.options.version,
      plugin: this.options.plugin !== null,
      updating: this.updating,
      ...this.ended
    };
  }
  runUpdate() {
    const plugin = this.options.plugin;
    if (!plugin) return Promise.reject(new Error(NOT_A_PLUGIN));
    if (this.updating) return Promise.reject(new Error(ALREADY_UPDATING));
    this.updating = true;
    this.ended = {};
    void this.update(plugin);
    return Promise.resolve(this.updateState());
  }
  async update(plugin) {
    try {
      const outcome = await plugin.update();
      this.ended = { outcome };
    } catch (err) {
      this.fail(message(err));
      return;
    }
    if (this.ended.outcome === "current") {
      this.updating = false;
      return;
    }
    setTimeout(() => {
      plugin.restart().catch((err) => {
        this.fail(RESTART_FAILED + message(err));
        this.options.log?.(RESTART_FAILED + message(err));
      });
    }, this.options.restartDelayMs);
  }
  fail(error) {
    this.updating = false;
    this.ended = { outcome: "failed", error };
  }
};
function message(err) {
  return err instanceof Error ? err.message : String(err);
}

// src/L1_domain/pairing-expiry.ts
var PAIRING_IDLE_MS = 24 * 60 * 60 * 1e3;
var PAIRING_MAX_AGE_MS = 7 * PAIRING_IDLE_MS;
function pairingExpiresAt(device) {
  return Math.min(device.lastSeen + PAIRING_IDLE_MS, device.pairedAt + PAIRING_MAX_AGE_MS);
}
function isPairingExpired(device, now) {
  return now >= pairingExpiresAt(device);
}

// src/L2_application/pairing-service.ts
var INVITE_SECRET_BYTES2 = 32;
var INVITE_TTL_MS = 5 * 60 * 1e3;
var TOUCH_INTERVAL_MS = 60 * 1e3;
var PairingService = class {
  constructor(options) {
    this.options = options;
  }
  options;
  // One live invite at a time: printing a new QR voids the previous one, so
  // at most one secret can be guessed at or replayed at any moment.
  invite = null;
  touched = /* @__PURE__ */ new Map();
  listeners = /* @__PURE__ */ new Set();
  createInvite() {
    const secret = this.options.random.bytes(INVITE_SECRET_BYTES2);
    if (secret.length !== INVITE_SECRET_BYTES2) throw new Error("random source returned short");
    this.invite = {
      agentKey: this.options.agentKey,
      secret,
      expiresAt: this.options.clock.now() + INVITE_TTL_MS
    };
    return this.invite;
  }
  async admit(identity, pair) {
    if (pair) {
      const invite = this.liveInvite();
      return invite ? { kind: "pair", invite } : { kind: "no-invite" };
    }
    const id = publicKeyId(identity);
    const found = await this.options.registry.find(id);
    const device = found && constantTimeEqual(found.publicKey, identity) ? found : null;
    if (!device) {
      return await this.options.registry.isRevoked(id) ? { kind: "revoked" } : { kind: "unknown" };
    }
    if (isPairingExpired(device, this.options.clock.now())) return { kind: "expired" };
    return { kind: "paired", device };
  }
  /**
   * Consumes `invite` whatever the outcome, so a wrong guess burns the QR
   * instead of leaving it open to the next one. Returns the stored device, or
   * null when the invite was already used, replaced, expired or the proof is
   * missing or wrong.
   */
  async completePairing(invite, identity, transcript, proof) {
    if (this.invite !== invite) return null;
    this.invite = null;
    const now = this.options.clock.now();
    if (now >= invite.expiresAt) return null;
    if (proof === void 0 || !verifyPairingProof(invite.secret, transcript, proof)) return null;
    const device = {
      id: publicKeyId(identity),
      publicKey: identity,
      pairedAt: now,
      lastSeen: now
    };
    await this.options.registry.save(device);
    this.touched.set(device.id, now);
    this.devicesChanged();
    return device;
  }
  /** Records that the device was used now, at most once per `TOUCH_INTERVAL_MS`. */
  async touch(id) {
    const now = this.options.clock.now();
    const last = this.touched.get(id);
    if (last !== void 0 && now - last < TOUCH_INTERVAL_MS) return;
    this.touched.set(id, now);
    await this.options.registry.touch(id, now);
  }
  /** Whether an open connection's device may stay connected. A device that vanished counts as revoked. */
  async state(id) {
    const device = await this.options.registry.find(id);
    if (!device) return "revoked";
    return isPairingExpired(device, this.options.clock.now()) ? "expired" : "valid";
  }
  /** Every paired phone, oldest pairing first; `current` marks the device `asking`. */
  async linkedDevices(asking) {
    const devices = await this.options.registry.list();
    return devices.map((device) => ({
      id: device.id,
      pairedAt: device.pairedAt,
      lastSeen: device.lastSeen,
      expiresAt: pairingExpiresAt(device),
      current: device.id === asking
    })).sort((a, b) => a.pairedAt - b.pairedAt);
  }
  /**
   * The same removal as `remote-sheep revoke`: the channel's periodic re-check
   * closes the device if it is connected, and it gets 4003 if it comes back.
   */
  async unlink(id) {
    if (!await this.options.registry.remove(id)) {
      throw new Error("no paired device has the id " + id);
    }
    this.devicesChanged();
  }
  /**
   * Called after a phone pairs or is unlinked from a phone. A revoke from the
   * CLI runs in another process and is not announced.
   */
  onDevicesChanged(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  devicesChanged() {
    for (const listener of this.listeners) listener();
  }
  liveInvite() {
    if (this.invite && this.options.clock.now() >= this.invite.expiresAt) this.invite = null;
    return this.invite;
  }
};

// src/L1_domain/listen-port.ts
var FIRST_LISTEN_PORT = 3998;
var LAST_LISTEN_PORT = 4049;
var LOWEST_USER_PORT = 1024;
var HIGHEST_PORT = 65535;
function presetListenPort(variable, saved) {
  if (variable !== null) return { port: variable, source: "variable" };
  if (saved !== null) return { port: saved, source: "saved" };
  return null;
}
function portFromVariable(value) {
  if (!value) return null;
  const port = parseListenPort(value);
  if (port === null) {
    throw new Error('PORT must be a whole number from 1024 to 65535, not "' + value + '"');
  }
  return port;
}
function listenPortCandidates() {
  return Array.from(
    { length: LAST_LISTEN_PORT - FIRST_LISTEN_PORT + 1 },
    (_, index) => FIRST_LISTEN_PORT + index
  );
}
function parseListenPort(text) {
  const trimmed = text.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const port = Number(trimmed);
  return isListenPort(port) ? port : null;
}
function isListenPort(port) {
  return typeof port === "number" && Number.isInteger(port) && port >= LOWEST_USER_PORT && port <= HIGHEST_PORT;
}

// src/L2_application/port-changer.ts
var NOT_A_PLUGIN_PORT = "This agent does not run as the Herdr plugin, so it cannot restart itself. On the computer, run `remote-sheep port <n>` (or `remote-sheep port auto`), then restart the agent.";
var PORT_FROM_VARIABLE = "The PORT variable sets the port on the computer and wins over any saved one: change or unset it there, then restart the agent.";
var BAD_PORT = "a port is a whole number from 1024 to 65535";
var ALREADY_RESTARTING = "the agent is already restarting";
var PortChanger = class {
  constructor(options) {
    this.options = options;
  }
  options;
  restarting = false;
  async portState() {
    const { current, variable, restart } = this.options;
    const reason = variable !== null ? PORT_FROM_VARIABLE : restart === null ? NOT_A_PLUGIN_PORT : null;
    return {
      port: current.port,
      source: current.source,
      saved: await this.options.saved.load(),
      canChange: reason === null,
      reason,
      restarting: this.restarting
    };
  }
  async changePort(set) {
    const restart = this.options.restart;
    if (this.options.variable !== null) throw new Error(PORT_FROM_VARIABLE);
    if (!restart) throw new Error(NOT_A_PLUGIN_PORT);
    if (this.restarting) throw new Error(ALREADY_RESTARTING);
    if (set === "auto") {
      await this.options.saved.forget();
    } else {
      if (!isListenPort(set)) throw new Error(BAD_PORT);
      if (set === this.options.current.port) {
        if (await this.options.saved.load() !== set) await this.options.saved.save(set);
        return this.portState();
      }
      if (!await this.options.probe.isFree(set)) {
        throw new Error("port " + String(set) + " is in use on the computer; choose another");
      }
      await this.options.saved.save(set);
    }
    this.restarting = true;
    setTimeout(() => {
      restart().catch((err) => {
        this.restarting = false;
        this.options.log?.(
          "could not restart on the new port: " + (err instanceof Error ? err.message : String(err))
        );
      });
    }, this.options.restartDelayMs);
    return this.portState();
  }
};

// src/L2_application/push-notifier.ts
var titleOf = (change) => change.session.project + (change.to === "blocked" ? ": waiting for your answer" : ": finished");
var PushNotifier = class {
  constructor(options) {
    this.options = options;
  }
  options;
  listening() {
    return this.options.relay.origin() !== null;
  }
  get publicKey() {
    return this.options.publicKey;
  }
  async subscribe(device, push) {
    if (!await this.options.registry.setPush(device, push)) {
      throw new Error("no paired device has the id " + device);
    }
  }
  async unsubscribe(device) {
    await this.options.registry.setPush(device, null);
  }
  notify(change) {
    void this.deliver(change).catch(
      (err) => this.options.log?.("notifying failed: " + (err instanceof Error ? err.message : String(err)))
    );
  }
  async deliver(change) {
    const subject = this.options.relay.origin();
    if (subject === null) return;
    const now = this.options.clock.now();
    const payload = JSON.stringify({
      title: titleOf(change),
      target: change.session.target,
      agent: this.options.agentId
    });
    const devices = (await this.options.registry.list()).filter(
      (device) => device.push && !isPairingExpired(device, now)
    );
    await Promise.all(devices.map((device) => this.send(device, payload, subject)));
  }
  async send(device, payload, subject) {
    if (!device.push) return;
    try {
      if (await this.options.sender.send(device.push, payload, subject) === "gone") {
        await this.options.registry.setPush(device.id, null);
      }
    } catch (err) {
      this.options.log?.(
        "push to " + device.id + " failed: " + (err instanceof Error ? err.message : String(err))
      );
    }
  }
};

// src/L2_application/relay-switch.ts
var RELAY_DIAL_WAIT_MS = 5e3;
var RELAY_FIXED = "The relay is set by the REMOTE_SHEEP_RELAY variables on the computer; change it there.";
var RelaySwitch = class {
  constructor(options) {
    this.options = options;
    this.current = options.initial;
  }
  options;
  current;
  queue = Promise.resolve();
  listeners = [];
  async start() {
    if (this.current) await this.options.dialer.dial(this.current);
  }
  /** Called after every change that took effect, for whatever follows the relay (push). */
  onChange(listener) {
    this.listeners.push(listener);
  }
  /** The origin the QR code offers first; null while off. */
  origin() {
    return this.current?.url ?? null;
  }
  relay() {
    const problem = this.current ? this.options.dialer.problem() : null;
    return {
      on: this.current !== null,
      url: this.current?.url ?? null,
      connected: this.current !== null && this.options.dialer.connected(),
      fixed: this.options.fixed,
      ...problem === null ? {} : { problem }
    };
  }
  changeRelay(change) {
    const next = this.queue.then(() => this.apply(change));
    this.queue = next.catch(() => void 0);
    return next;
  }
  async apply(change) {
    const info = await this.applyOne(change);
    for (const listener of this.listeners) listener();
    return info;
  }
  async applyOne(change) {
    if (this.options.fixed) throw new Error(RELAY_FIXED);
    if ("off" in change) {
      await this.options.dialer.hangUp();
      this.current = null;
      await this.options.saved.forget();
      return this.relay();
    }
    const checked = checkRelaySetting(change.url, change.code);
    if (!checked.ok) throw new Error(checked.error);
    await this.options.saved.save(checked.setting);
    this.current = checked.setting;
    await this.options.dialer.dial(checked.setting);
    await this.options.dialer.settled(RELAY_DIAL_WAIT_MS);
    return this.relay();
  }
};

// src/L1_domain/session-status.ts
var SETTLED = /* @__PURE__ */ new Set(["done", "blocked"]);
function hasSettled(from, to) {
  return from === "working" && SETTLED.has(to);
}

// src/L2_application/session-monitor.ts
function summary(err) {
  const message2 = err instanceof Error ? err.message : String(err);
  return (message2.split("\n")[0] ?? "").trim().slice(0, 200) || "unknown error";
}
var SessionMonitor = class {
  constructor(options) {
    this.options = options;
  }
  options;
  sessions = [];
  json = "";
  herdrError = null;
  timer = null;
  /** A slow multiplexer must not pile up overlapping list calls. */
  refreshing = false;
  /** Idempotent; the first list is asked for at once. */
  start() {
    if (this.timer) return;
    this.timer = setInterval(() => void this.refresh(), this.options.intervalMs);
    void this.refresh();
  }
  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
  get running() {
    return this.timer !== null;
  }
  current() {
    return this.sessions;
  }
  /** False until the first list arrived. */
  known() {
    return this.json !== "";
  }
  error() {
    return this.herdrError;
  }
  async refresh() {
    if (this.refreshing) return;
    this.refreshing = true;
    try {
      await this.list();
    } catch (err) {
      this.options.log?.("refresh failed: " + err.message);
    } finally {
      this.refreshing = false;
    }
  }
  async list() {
    let next;
    try {
      next = await this.options.multiplexer.listSessions();
    } catch (err) {
      this.options.log?.("listing sessions failed: " + err.message);
      if (this.timer) this.setError(summary(err));
      return;
    }
    if (!this.timer) return;
    this.setError(null);
    const json2 = JSON.stringify(next);
    if (json2 !== this.json) {
      const before = new Map(this.sessions.map((s) => [s.target, s.status]));
      const first = this.json === "";
      this.sessions = next;
      this.json = json2;
      if (!first) this.announce(before, next);
      this.options.events.sessions(next);
    }
    this.options.events.refreshed();
  }
  announce(before, next) {
    const notifier = this.options.notifier;
    if (!notifier) return;
    for (const session of next) {
      const from = before.get(session.target);
      if (!from || !hasSettled(from, session.status)) continue;
      try {
        notifier.notify({ session, from, to: session.status });
      } catch (err) {
        this.options.log?.("notifying failed: " + err.message);
      }
    }
  }
  setError(herdrError) {
    if (herdrError === this.herdrError) return;
    this.herdrError = herdrError;
    this.options.events.status(herdrError);
  }
};

// src/L2_application/session-hub.ts
var SessionHub = class {
  constructor(options) {
    this.options = options;
    this.monitor = new SessionMonitor({
      multiplexer: { listSessions: () => this.listPanes() },
      intervalMs: options.listIntervalMs,
      notifier: options.notifier && {
        // A phone with the chat open shows the change itself; only the others are told.
        notify: (change) => {
          if (!this.isChatWatched(change.session.target)) options.notifier?.notify(change);
        }
      },
      log: options.log,
      events: {
        sessions: (sessions) => this.broadcast((c) => c.send({ type: "sessions", sessions })),
        status: (herdrError) => this.broadcast((c) => c.send({ type: "status", herdrError })),
        refreshed: () => this.followTranscripts()
      }
    });
    if (this.notifying()) this.monitor.start();
    options.devices.onDevicesChanged(() => void this.pushDevices());
  }
  options;
  viewers = /* @__PURE__ */ new Map();
  chats = /* @__PURE__ */ new Map();
  terminals = /* @__PURE__ */ new Map();
  monitor;
  terminalTimer = null;
  // ---- ConnectionEvents ----
  open(connection) {
    this.viewers.set(connection, { target: null, chat: false, terminal: false });
    if (this.monitor.known()) {
      connection.send({ type: "sessions", sessions: this.reachable() });
    }
    const herdrError = this.monitor.error();
    if (herdrError !== null) connection.send({ type: "status", herdrError });
    this.monitor.start();
  }
  close(connection) {
    this.viewers.delete(connection);
    this.reconcile();
    if (this.viewers.size === 0 && !this.notifying()) this.stop();
  }
  /** The notifier began or stopped listening (the relay was set or turned off). */
  notifierChanged() {
    if (this.notifying()) this.monitor.start();
    else if (this.viewers.size === 0) this.stop();
  }
  notifying() {
    return this.options.notifier?.listening() === true;
  }
  async request(connection, request2) {
    switch (request2.kind) {
      case "watch":
        return this.watch(
          connection,
          request2.target,
          request2.terminal,
          request2.chat ?? !request2.terminal
        );
      case "prompt":
        return this.options.multiplexer.sendPrompt(
          this.requireSession(request2.target),
          request2.text
        );
      case "keys":
        return this.options.multiplexer.sendKeys(this.requireSession(request2.target), request2.keys);
      case "image":
        return this.image(request2.target, request2.id);
      case "upload":
        return this.options.uploads.save(request2.media, request2.data);
      case "devices":
        return this.options.devices.linkedDevices(connection.device);
      case "unlink":
        return this.options.devices.unlink(request2.id);
      case "push-key":
        return { key: this.requirePush().publicKey };
      case "push-subscribe":
        return this.requirePush().subscribe(connection.device, {
          endpoint: request2.endpoint,
          p256dh: request2.p256dh,
          auth: request2.auth
        });
      case "push-unsubscribe":
        return this.requirePush().unsubscribe(connection.device);
      case "spaces":
        return this.options.multiplexer.listSpaces();
      case "shells":
        if (request2.on !== void 0) {
          await this.options.shells.set(request2.on);
          this.broadcast((c) => c.send({ type: "sessions", sessions: this.reachable() }));
        }
        return { on: this.options.shells.enabled() };
      case "relay": {
        const relay2 = this.options.relay;
        if (!relay2) throw new Error("this agent cannot change its relay");
        return request2.set ? relay2.changeRelay(request2.set) : relay2.relay();
      }
      case "update": {
        const updates = this.options.updates;
        if (!updates) throw new Error("this agent cannot update itself");
        return request2.run ? updates.runUpdate() : updates.updateState();
      }
      case "pairing": {
        const pairing = this.options.pairing;
        if (!pairing) throw new Error("this agent cannot pair another device from the app");
        return pairing.offerPairing();
      }
      case "port": {
        const port = this.options.port;
        if (!port) throw new Error("this agent cannot tell its port");
        return request2.set === void 0 ? port.portState() : port.changePort(request2.set);
      }
      case "new-session":
        return this.newSession(request2.space, request2.shell, request2.agent ?? "claude");
    }
  }
  /** Releases every timer and watcher. */
  stop() {
    this.monitor.stop();
    if (this.terminalTimer) clearInterval(this.terminalTimer);
    this.terminalTimer = null;
    for (const target of [...this.chats.keys()]) this.unwatchChat(target);
    this.terminals.clear();
  }
  // ---- requests ----
  async watch(connection, target, terminal, chat) {
    const viewer = this.viewers.get(connection);
    if (!viewer) return;
    viewer.target = target;
    viewer.chat = chat;
    viewer.terminal = terminal;
    this.reconcile();
    if (!target) return;
    if (terminal) {
      const output = await this.options.multiplexer.readTerminal(this.requireSession(target));
      this.terminals.set(target, output);
      connection.send({ type: "terminal", target, output });
    }
    if (!chat) return;
    const watch2 = this.chats.get(target);
    if (!watch2) return;
    if (watch2.attaching) return watch2.attaching;
    if (!watch2.file && !watch2.note) return this.attach(target, watch2);
    if (watch2.last) {
      connection.send(chatFrame(target, watch2.last.chat, null));
    } else if (watch2.note) {
      connection.send(
        chatFrame(target, { messages: [], model: null, usedTokens: null }, watch2.note)
      );
    }
  }
  async newSession(space, shell, agent) {
    if (shell && !this.options.shells.enabled()) {
      throw new Error("consoles are off on this computer: turn them on in the app, under Settings");
    }
    const spaces = await this.options.multiplexer.listSpaces();
    if (!spaces.some((known) => known.id === space)) throw new Error("unknown workspace: " + space);
    const multiplexer = this.options.multiplexer;
    return {
      target: await (shell ? multiplexer.startShell(space) : multiplexer.startSession(space, agent))
    };
  }
  /**
   * The sessions a phone may reach right now. The monitor's list is only as fresh as its last
   * poll, so shells are left out here the moment the owner turns consoles off, not a poll later.
   */
  reachable() {
    const shells = this.options.shells.enabled();
    return this.monitor.current().filter((session) => session.kind !== "shell" || shells);
  }
  /** The agents, then the shells when they are allowed: one list, so each target is known once. */
  async listPanes() {
    const agents = await this.options.multiplexer.listSessions();
    if (!this.options.shells.enabled()) return agents;
    return [...agents, ...await this.options.multiplexer.listShells()];
  }
  requirePush() {
    const push = this.options.push;
    if (!push?.listening()) {
      throw new Error("notifications need a relay: turn it on in Settings \u2192 Relay");
    }
    return push;
  }
  isChatWatched(target) {
    for (const viewer of this.viewers.values()) {
      if (viewer.target === target && viewer.chat) return true;
    }
    return false;
  }
  requireSession(target) {
    const found = this.reachable().find((s) => s.target === target);
    if (!found) throw new Error("unknown session: " + target);
    return found;
  }
  async image(target, id) {
    const located = await this.locate(this.requireSession(target));
    const found = located.file ? this.options.transcripts.image(located.file, id) : null;
    if (!found) throw new Error("image not found");
    return found;
  }
  // ---- sessions ----
  // A session restarted with /clear writes to a new transcript, and one that
  // was not written yet may exist now, so after every list each watched
  // session is looked up again and followed to whichever file it writes now.
  followTranscripts() {
    for (const [target, watch2] of [...this.chats]) {
      this.attach(target, watch2).catch(
        (err) => this.options.log?.("following transcript failed: " + err.message)
      );
    }
  }
  // ---- chats ----
  /** Watches exactly the transcripts and terminals somebody is looking at. */
  reconcile() {
    const chatTargets = /* @__PURE__ */ new Set();
    let terminalWanted = false;
    for (const viewer of this.viewers.values()) {
      if (!viewer.target) continue;
      if (viewer.terminal) terminalWanted = true;
      if (viewer.chat) chatTargets.add(viewer.target);
    }
    for (const target of [...this.chats.keys()]) {
      if (!chatTargets.has(target)) this.unwatchChat(target);
    }
    for (const target of chatTargets) {
      if (!this.chats.has(target)) {
        this.chats.set(target, {
          file: null,
          note: null,
          stop: null,
          timer: null,
          attaching: null,
          last: null
        });
      }
    }
    if (terminalWanted && !this.terminalTimer) {
      this.terminalTimer = setInterval(
        () => void this.refreshTerminals(),
        this.options.terminalIntervalMs
      );
    } else if (!terminalWanted && this.terminalTimer) {
      clearInterval(this.terminalTimer);
      this.terminalTimer = null;
      this.terminals.clear();
    }
  }
  async locate(session) {
    const pid = await this.options.multiplexer.processId(session.target);
    return this.options.transcripts.locate(pid, session.cwd);
  }
  attach(target, watch2) {
    watch2.attaching ??= this.find(target, watch2).finally(() => {
      watch2.attaching = null;
    });
    return watch2.attaching;
  }
  async find(target, watch2) {
    if (!this.monitor.known()) return;
    const session = this.reachable().find((s) => s.target === target);
    if (!session) {
      this.setNote(target, watch2, "session gone");
      return;
    }
    const located = await this.locate(session);
    if (this.chats.get(target) !== watch2) return;
    if (located.file !== null && located.file === watch2.file) return;
    this.detach(watch2);
    if (located.file === null) {
      this.setNote(target, watch2, located.note);
      return;
    }
    try {
      watch2.stop = this.options.transcripts.watch(located.file, () => this.schedule(target));
    } catch (err) {
      this.options.log?.("watching transcript failed: " + err.message);
      return;
    }
    watch2.file = located.file;
    watch2.note = null;
    this.pushChat(target);
  }
  /** Lets go of the current file, so the next one is pushed even if it reads the same. */
  detach(watch2) {
    watch2.stop?.();
    if (watch2.timer) clearTimeout(watch2.timer);
    watch2.stop = null;
    watch2.timer = null;
    watch2.file = null;
    watch2.last = null;
  }
  setNote(target, watch2, note) {
    if (watch2.note === note) return;
    watch2.note = note;
    this.sendChat(target, { messages: [], model: null, usedTokens: null }, note);
  }
  schedule(target) {
    const watch2 = this.chats.get(target);
    if (!watch2) return;
    if (watch2.timer) clearTimeout(watch2.timer);
    watch2.timer = setTimeout(() => {
      watch2.timer = null;
      this.pushChat(target);
    }, this.options.debounceMs);
  }
  pushChat(target) {
    const watch2 = this.chats.get(target);
    if (!watch2?.file) return;
    let chat;
    try {
      chat = this.options.transcripts.read(watch2.file);
    } catch (err) {
      this.options.log?.("reading transcript failed: " + err.message);
      return;
    }
    const json2 = JSON.stringify(chat);
    if (watch2.last?.json === json2) return;
    watch2.last = { chat, json: json2 };
    this.sendChat(target, chat, null);
  }
  sendChat(target, chat, note) {
    this.broadcast((c, viewer) => {
      if (viewer.target === target && viewer.chat) c.send(chatFrame(target, chat, note));
    });
  }
  unwatchChat(target) {
    const watch2 = this.chats.get(target);
    if (!watch2) return;
    this.detach(watch2);
    this.chats.delete(target);
  }
  // ---- raw terminal ----
  // A permission prompt is drawn by the CLI and never reaches the transcript,
  // so the terminal stays available. There is no file to watch, so it is the
  // one thing still read on a timer, and only while somebody has it open.
  async refreshTerminals() {
    const targets = /* @__PURE__ */ new Set();
    for (const viewer of this.viewers.values()) {
      if (viewer.target && viewer.terminal) targets.add(viewer.target);
    }
    for (const target of targets) {
      const session = this.reachable().find((s) => s.target === target);
      if (!session) continue;
      let output;
      try {
        output = await this.options.multiplexer.readTerminal(session);
      } catch (err) {
        this.options.log?.("reading terminal failed: " + err.message);
        continue;
      }
      if (this.terminals.get(target) === output) continue;
      this.terminals.set(target, output);
      this.broadcast((c, viewer) => {
        if (viewer.target === target && viewer.terminal)
          c.send({ type: "terminal", target, output });
      });
    }
  }
  // ---- linked devices ----
  /** Each phone gets its own copy, since `current` differs from one phone to the next. */
  async pushDevices() {
    for (const connection of [...this.viewers.keys()]) {
      try {
        const devices = await this.options.devices.linkedDevices(connection.device);
        if (this.viewers.has(connection)) connection.send({ type: "devices", devices });
      } catch (err) {
        this.options.log?.("pushing the device list failed: " + err.message);
        return;
      }
    }
  }
  broadcast(send) {
    for (const [connection, viewer] of this.viewers) send(connection, viewer);
  }
};
function chatFrame(target, chat, note) {
  return {
    type: "chat",
    target,
    messages: chat.messages,
    note,
    ...chat.model ? { model: chat.model } : {},
    ...chat.usedTokens === null ? {} : { usedTokens: chat.usedTokens }
  };
}

// src/L2_application/choose-listen-port.ts
async function chooseListenPort(options) {
  const preset = presetListenPort(options.variable, await options.saved.load());
  if (preset) return preset;
  const candidates = options.candidates ?? listenPortCandidates();
  for (const port of candidates) {
    if (await options.probe.isFree(port)) {
      await options.saved.save(port);
      return { port, source: "picked" };
    }
  }
  throw new Error(
    "no free port from " + String(candidates[0]) + " to " + String(candidates.at(-1)) + "; choose one with `remote-sheep port <n>`"
  );
}

// src/L3_periphery/background/background-agent.ts
import { execFile, spawn } from "node:child_process";
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { basename, join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
var LISTENING = " is listening on port ";
var LISTENING_PORT = / is listening on port (\d+)/;
var LOG_TAIL_LINES = 15;
var BackgroundAgent = class {
  constructor(options) {
    this.options = options;
    this.recordFile = join(options.dir, "agent-process.json");
    this.logFile = join(options.dir, "agent.log");
    this.readyTimeoutMs = options.readyTimeoutMs ?? 2e4;
    this.pollMs = options.pollMs ?? 250;
  }
  options;
  recordFile;
  logFile;
  readyTimeoutMs;
  pollMs;
  async start() {
    const result = await this.launch();
    await this.options.announce?.started(result);
    return result;
  }
  async stop() {
    const result = await this.halt();
    await this.options.announce?.stopped();
    return result;
  }
  /**
   * Stops the running agent, if any, and starts a new one: how an update reaches a new build.
   * Announced once, as the start it ends with.
   */
  async restart() {
    await this.halt();
    return this.start();
  }
  async launch() {
    const running = await this.running();
    if (running) {
      return {
        kind: "already-running",
        message: "remote-sheep already runs: " + this.describe(running),
        port: this.port()
      };
    }
    mkdirSync(this.options.dir, { recursive: true });
    rmSync(this.recordFile, { force: true });
    const pid = await this.options.processes.launch(this.logFile);
    const record = { pid, log: this.logFile };
    writeFileSync(this.recordFile, JSON.stringify(record));
    const deadline = Date.now() + this.readyTimeoutMs;
    for (; ; ) {
      if (this.log().includes(LISTENING)) {
        return {
          kind: "started",
          message: "remote-sheep started: " + this.describe(record),
          port: this.port()
        };
      }
      if (!await this.options.processes.isAgent(pid)) {
        rmSync(this.recordFile, { force: true });
        return {
          kind: "failed",
          message: "remote-sheep could not start. " + this.logFile + " ends with:\n" + this.tail(),
          port: null
        };
      }
      if (Date.now() >= deadline) {
        return {
          kind: "not-ready",
          message: "remote-sheep runs but does not listen yet: " + this.describe(record),
          port: null
        };
      }
      await sleep(this.pollMs);
    }
  }
  async halt() {
    const running = await this.running();
    rmSync(this.recordFile, { force: true });
    if (!running) return { kind: "not-running", message: "remote-sheep was not running." };
    await this.options.processes.stop(running.pid);
    return { kind: "stopped", message: "remote-sheep stopped (PID " + String(running.pid) + ")." };
  }
  async status() {
    const running = await this.running();
    return running ? {
      kind: "running",
      message: "remote-sheep is running: " + this.describe(running),
      port: this.port()
    } : { kind: "stopped", message: "remote-sheep is stopped. Log: " + this.logFile, port: null };
  }
  /** The recorded agent while it still runs; null when there is none or the file is stale. */
  async running() {
    const record = this.record();
    return record && await this.options.processes.isAgent(record.pid) ? record : null;
  }
  record() {
    if (!existsSync(this.recordFile)) return null;
    try {
      const value = JSON.parse(readFileSync(this.recordFile, "utf8"));
      if (typeof value !== "object" || value === null) return null;
      const { pid, log } = value;
      return Number.isInteger(pid) && typeof log === "string" ? { pid, log } : null;
    } catch {
      return null;
    }
  }
  port() {
    const port = LISTENING_PORT.exec(this.log())?.[1];
    return port === void 0 ? null : Number(port);
  }
  describe(record) {
    const port = this.port();
    return "PID " + String(record.pid) + ", " + (port === null ? "port not known yet" : "port " + String(port)) + ", log " + record.log + ".";
  }
  log() {
    return existsSync(this.logFile) ? readFileSync(this.logFile, "utf8") : "";
  }
  tail() {
    return this.log().trimEnd().split("\n").slice(-LOG_TAIL_LINES).join("\n") || "(empty log)";
  }
};
function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === "EPERM";
  }
}
function commandLine(pid) {
  const [file, args] = process.platform === "win32" ? [
    "powershell",
    [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      '(Get-CimInstance Win32_Process -Filter "ProcessId=' + String(pid) + '").CommandLine'
    ]
  ] : ["ps", ["-p", String(pid), "-o", "args="]];
  return new Promise((resolve2) => {
    execFile(file, args, { windowsHide: true, timeout: 1e4 }, (err, stdout) => {
      resolve2(err ? "" : stdout);
    });
  });
}
var STOP_WAITS = { termMs: 5e3, killMs: 2e3 };
var SYSTEM_SIGNALS = {
  alive,
  kill: (pid, signal) => process.kill(pid, signal)
};
async function waitUntilGone(signals, pid, ms) {
  const deadline = Date.now() + ms;
  while (signals.alive(pid)) {
    if (Date.now() >= deadline) return false;
    await sleep(100);
  }
  return true;
}
function nodeAgentProcesses(script, cwd, signals = SYSTEM_SIGNALS, waits = STOP_WAITS) {
  const name = basename(script);
  return {
    async isAgent(pid) {
      return signals.alive(pid) && (await commandLine(pid)).includes(name);
    },
    launch(logFile) {
      const out = openSync(logFile, "w");
      try {
        const child = spawn(process.execPath, [script, "serve", "--background"], {
          cwd,
          detached: true,
          windowsHide: true,
          stdio: ["ignore", out, out],
          env: process.env
        });
        child.unref();
        return new Promise((resolve2, reject) => {
          child.once("error", reject);
          child.once("spawn", () => {
            if (child.pid === void 0) reject(new Error("the agent started with no PID"));
            else resolve2(child.pid);
          });
        });
      } finally {
        closeSync(out);
      }
    },
    async stop(pid) {
      if (!signals.alive(pid)) return;
      signals.kill(pid, "SIGTERM");
      if (await waitUntilGone(signals, pid, waits.termMs)) return;
      signals.kill(pid, "SIGKILL");
      if (!await waitUntilGone(signals, pid, waits.killMs)) {
        throw new Error("remote-sheep (PID " + String(pid) + ") did not stop");
      }
    }
  };
}

// src/L3_periphery/channel/secure-channel.ts
var PAIRING_CHECK_INTERVAL_MS = 5e3;
var MAX_HANDSHAKE_BYTES = 4096;
var CLOSE_POLICY = 1008;
var SecureConnection = class {
  constructor(device, link, session) {
    this.device = device;
    this.link = link;
    this.session = session;
  }
  device;
  link;
  session;
  send(message2) {
    this.link.send(this.session.seal(encodeServerMessage(message2)));
  }
  close(code, reason) {
    this.link.close(code, reason);
  }
};
var PhoneLink = class {
  constructor(link, options) {
    this.link = link;
    this.options = options;
  }
  link;
  options;
  accepted = null;
  connection = null;
  closed = false;
  // Frames are handled strictly in order: the handshake awaits the registry,
  // and the session cipher expects frames in the order they were sent.
  queue = Promise.resolve();
  deadline = null;
  check = null;
  /** Starts the handshake deadline and listens to the link until it closes. */
  start() {
    this.deadline = setTimeout(
      () => this.refuse(CLOSE_UNAUTHORIZED, "unauthorized"),
      this.options.authTimeoutMs ?? AUTH_TIMEOUT_MS
    );
    this.link.onMessage((data) => {
      this.queue = this.queue.then(
        () => this.handle(data),
        () => void 0
      );
      void this.queue.catch((error) => {
        this.log("handshake failed: " + (error instanceof Error ? error.message : String(error)));
        this.refuse(CLOSE_UNAUTHORIZED, "unauthorized");
      });
    });
    this.link.onClose(() => this.ended());
  }
  async handle(data) {
    if (this.closed) return;
    if (this.connection && this.accepted) {
      this.receive(this.connection, this.accepted.session, data);
      return;
    }
    if (data.length > MAX_HANDSHAKE_BYTES) {
      this.refuse(CLOSE_UNAUTHORIZED, "unauthorized");
      return;
    }
    if (this.accepted) await this.confirm(this.accepted, data);
    else await this.hello(data);
  }
  async hello(data) {
    const hello = decodeHello(data);
    if (!hello) {
      this.refuse(CLOSE_UNAUTHORIZED, "unauthorized");
      return;
    }
    if (hello.protocol !== PROTOCOL) {
      this.refuse(CLOSE_PROTOCOL, "protocol " + PROTOCOL);
      return;
    }
    const admission = await this.options.pairing.admit(hello.identity, hello.pair);
    if (this.closed) return;
    switch (admission.kind) {
      case "unknown":
      case "no-invite":
        this.refuse(CLOSE_UNAUTHORIZED, "unauthorized");
        return;
      case "expired":
      case "revoked":
        this.refuse(CLOSE_PAIRING_EXPIRED, "pairing " + admission.kind);
        return;
      case "pair":
      case "paired": {
        const { welcome, session } = acceptHandshake(this.options.keys, hello);
        this.accepted = {
          hello,
          session,
          invite: admission.kind === "pair" ? admission.invite : null,
          device: admission.kind === "paired" ? admission.device : null
        };
        this.link.send(encodeWelcome(welcome));
        return;
      }
    }
  }
  async confirm(accepted, data) {
    const message2 = this.openFrame(accepted.session, data);
    const confirm = message2?.type === "confirm" ? message2 : null;
    const { pairing } = this.options;
    let device = accepted.device;
    if (accepted.invite) {
      device = await pairing.completePairing(
        accepted.invite,
        accepted.hello.identity,
        accepted.session.transcript,
        confirm?.proof
      );
    } else if (device && confirm) {
      await pairing.touch(device.id);
    }
    if (this.closed) return;
    if (!device || !confirm) {
      this.refuse(CLOSE_UNAUTHORIZED, "unauthorized");
      return;
    }
    if (this.deadline) clearTimeout(this.deadline);
    const connection = new SecureConnection(device.id, this.link, accepted.session);
    this.connection = connection;
    connection.send({
      type: "ready",
      protocol: PROTOCOL,
      version: this.options.version,
      device: device.id
    });
    this.options.events.open(connection);
    this.check = setInterval(
      () => void this.recheck(connection),
      this.options.checkIntervalMs ?? PAIRING_CHECK_INTERVAL_MS
    );
  }
  receive(connection, session, data) {
    let plain;
    try {
      plain = session.open(data);
    } catch {
      this.refuse(CLOSE_UNAUTHORIZED, "unauthorized");
      return;
    }
    const message2 = decodeClientMessage(plain);
    if (message2?.type !== "request") {
      const unknown = readUnknownRequest(plain);
      if (unknown) {
        connection.send({
          type: "reply",
          id: unknown.id,
          ok: false,
          error: 'your computer runs an older remote-sheep that does not know "' + unknown.kind + '"; restart it'
        });
        return;
      }
      this.refuse(CLOSE_POLICY, "malformed message");
      return;
    }
    this.options.pairing.touch(connection.device).catch((error) => {
      this.log("could not record device use: " + String(error));
    });
    this.options.events.request(connection, message2.request).then(
      (result) => connection.send({ type: "reply", id: message2.id, ok: true, result }),
      (err) => connection.send({
        type: "reply",
        id: message2.id,
        ok: false,
        error: err instanceof Error ? err.message : String(err)
      })
    );
  }
  async recheck(connection) {
    try {
      const state = await this.options.pairing.state(connection.device);
      if (state !== "valid") this.refuse(CLOSE_PAIRING_EXPIRED, "pairing " + state);
    } catch (error) {
      this.log("could not check device " + connection.device + ": " + String(error));
    }
  }
  openFrame(session, data) {
    try {
      return decodeClientMessage(session.open(data));
    } catch {
      return null;
    }
  }
  refuse(code, reason) {
    if (this.closed) return;
    this.closed = true;
    if (this.deadline) clearTimeout(this.deadline);
    this.link.close(code, reason);
  }
  ended() {
    this.closed = true;
    if (this.deadline) clearTimeout(this.deadline);
    if (this.check) clearInterval(this.check);
    if (this.connection) this.options.events.close(this.connection);
  }
  log(message2) {
    this.options.log?.(message2);
  }
};
var SecureChannel = class {
  constructor(options) {
    this.options = options;
  }
  options;
  accept(link) {
    new PhoneLink(link, this.options).start();
  }
};

// src/L3_periphery/cli/cli-arguments.ts
var USAGE = `Usage:
  remote-sheep               serve the phone app and print a QR code to pair a phone
                             (press Enter for a new QR code; each one pairs one phone
                             and expires after 5 minutes)
  remote-sheep qr            ask the running agent for a new QR code and pairing links,
                             including one for a browser on this PC (127.0.0.1); Enter
                             shows a new one, q or Esc closes it and the agent keeps running
  remote-sheep devices       list paired phones: id, paired, last used, expires
  remote-sheep revoke <id>   unpair a phone; a running agent disconnects it within 5 seconds
  remote-sheep --help        show this help

To keep the agent running with no window (the Herdr plugin does this for you):
  remote-sheep start         start it in the background; does nothing if it already runs;
                             open http://localhost:<port> in this PC's browser, which pairs
                             it at once, or pair a phone with remote-sheep qr
  remote-sheep stop          stop the agent started with remote-sheep start
  remote-sheep restart       stop it and start it again, with the same data, port and relay
  remote-sheep status        say whether it runs, with its PID, port and log file

The first start listens on port 3998, or the next free one up to 4049, and saves it so the
phone's address stays the same:
  remote-sheep port          show the port and where it comes from
  remote-sheep port <n>      save another port (1024-65535); restart the agent to use it:
                             remote-sheep stop, then remote-sheep start (or restart Herdr)
  remote-sheep port auto     forget the saved port; the next start picks a free one again
The environment variable PORT still overrides the saved port when set. In the app,
Settings \u2192 Port does the same for the Herdr plugin, which restarts on the new port.

To also serve phones outside this network, save your relay once:
  remote-sheep relay set <url> <code>   https URL of your relay and the access code its owner
                                        issued to this agent; every start then uses it
  remote-sheep relay                    show the saved relay (the code is masked)
  remote-sheep relay off                forget it; the agent serves the local network only
  remote-sheep relay change             ask for the URL and the access code (not shown as you
                                        type) and hand them to the running agent, which connects
                                        at once and keeps them; an empty URL turns it off
With a relay the agent can also notify phones when a session finishes (opt-in on the phone).
The environment variables REMOTE_SHEEP_RELAY and REMOTE_SHEEP_RELAY_CODE still work and
override the saved relay when set.

A pairing expires 24 hours after its last use or 7 days after it was made,
whichever comes first; the phone then asks for a new QR code.`;
function parseArguments(args) {
  const [command = "serve", ...rest] = args;
  switch (command) {
    case "serve":
      if (rest.length === 1 && rest[0] === "--background")
        return { kind: "serve", background: true };
      return rest.length ? { kind: "error", message: "serve takes no arguments" } : { kind: "serve", background: false };
    case "--help":
    case "-h":
    case "help":
      return { kind: "help" };
    case "qr":
    case "start":
    case "stop":
    case "restart":
    case "status":
    case "devices":
      return rest.length ? { kind: "error", message: command + " takes no arguments" } : { kind: command };
    case "revoke": {
      const [id, ...extra] = rest;
      if (id === void 0) {
        return { kind: "error", message: "revoke needs a device id (see `remote-sheep devices`)" };
      }
      if (extra.length) return { kind: "error", message: "revoke takes one device id" };
      return { kind: "revoke", id };
    }
    case "relay": {
      const [sub, ...args2] = rest;
      if (sub === void 0) return { kind: "relay-show" };
      if (sub === "off") {
        return args2.length ? { kind: "error", message: "relay off takes no arguments" } : { kind: "relay-off" };
      }
      if (sub === "change") {
        return args2.length ? {
          kind: "error",
          message: "relay change takes no arguments; it asks for the URL and the access code"
        } : { kind: "relay-change" };
      }
      if (sub === "set") {
        const [url, code] = args2;
        if (url === void 0 || code === void 0 || args2.length > 2) {
          return { kind: "error", message: "relay set needs a relay URL and an access code" };
        }
        return { kind: "relay-set", url, code };
      }
      return {
        kind: "error",
        message: "unknown relay command: " + sub + " (use `relay`, `relay set <url> <code>` or `relay off`)"
      };
    }
    case "port": {
      const [value, ...extra] = rest;
      if (value === void 0) return { kind: "port-show" };
      if (extra.length) {
        return { kind: "error", message: "port takes one value: a port number or `auto`" };
      }
      if (value === "auto") return { kind: "port-auto" };
      const port = parseListenPort(value);
      return port === null ? { kind: "error", message: "port needs a whole number from 1024 to 65535, or `auto`" } : { kind: "port-set", port };
    }
    default:
      return { kind: "error", message: "unknown command: " + command };
  }
}

// src/L3_periphery/cli/device-table.ts
var pad = (n) => String(n).padStart(2, "0");
function formatTime(ms) {
  const d = new Date(ms);
  return `${String(d.getFullYear())}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function formatDevices(devices, now) {
  if (!devices.length) {
    return "No paired phones. Run `remote-sheep` and scan its QR code to pair one.";
  }
  const header = ["ID", "PAIRED", "LAST USED", "EXPIRES"];
  const rows = [
    header,
    ...devices.map((device) => [
      device.id,
      formatTime(device.pairedAt),
      formatTime(device.lastSeen),
      isPairingExpired(device, now) ? "expired" : formatTime(pairingExpiresAt(device))
    ])
  ];
  const widths = header.map(
    (_, column) => Math.max(...rows.map((row) => (row[column] ?? "").length))
  );
  return rows.map(
    (row) => row.map((cell, column) => cell.padEnd(widths[column] ?? 0)).join("  ").trimEnd()
  ).join("\n");
}

// src/L3_periphery/terminal/pairing-qr.ts
var import_qrcode = __toESM(require_lib(), 1);
function renderQr(text) {
  return import_qrcode.default.toString(text, { type: "terminal", small: true });
}

// src/L3_periphery/cli/pairing-messages.ts
var LABELS = {
  relay: "Through your relay:",
  network: "On this network:",
  "this-pc": "On this PC's browser:"
};
async function describePairing(pairing) {
  const lines = [
    await renderQr(pairing.links[0]?.url ?? ""),
    "Scan this QR code with the phone, or open a link below in a browser, to pair it.",
    "It pairs one phone or browser and expires at " + formatTime(pairing.expiresAt) + "."
  ];
  for (const link of pairing.links) lines.push(LABELS[link.where], "  " + link.url);
  return lines.join("\n");
}
var BACKGROUND_PAIRING_HINT = 'To pair a phone or a browser, run the Herdr action "Show pairing QR" or `remote-sheep qr`.';
var QR_KEYS_HINT = "Enter: a new QR code (the previous one stops working). q or Esc: close.";
function qrKey(chunk) {
  if (chunk === "\r" || chunk === "\n" || chunk === "\r\n") return "again";
  if (chunk === "q" || chunk === "Q" || chunk === "\x1B" || chunk === "") return "close";
  return null;
}

// src/L3_periphery/cli/pairing-prompt.ts
async function showPairingPrompt(options) {
  const { request: request2, input, output } = options;
  const show = async () => {
    const pairing = await request2();
    output.clear();
    output.print(await describePairing(pairing));
  };
  await show();
  if (!input.isTTY) return;
  output.print(QR_KEYS_HINT);
  input.setRawMode(true);
  input.setEncoding("utf8");
  await new Promise((resolve2, reject) => {
    const restore = () => {
      input.off("data", onKey);
      input.setRawMode(false);
      input.pause();
    };
    const onKey = (chunk) => {
      const key2 = qrKey(chunk);
      if (key2 === "close") {
        restore();
        resolve2();
      } else if (key2 === "again") {
        show().then(
          () => {
            output.print(QR_KEYS_HINT);
          },
          (err) => {
            restore();
            reject(err instanceof Error ? err : new Error(String(err)));
          }
        );
      }
    };
    input.on("data", onKey);
  });
}

// src/L3_periphery/cli/relay-prompt.ts
var URL_QUESTION = "Relay URL (https://...), or leave it empty to turn the relay off: ";
var CODE_QUESTION = "Access code (not shown as you type): ";
var UNCHANGED = "Nothing changed.";
function describeRelay(info) {
  if (!relayIsOn(info)) {
    return "The relay is off: phones reach this computer on the local network only.";
  }
  const state = info.connected ? "connected" : info.problem ? "not connected: " + info.problem : "still connecting";
  return "Relay: " + info.url + " (" + state + ")";
}
function describeChange(info) {
  if (!relayIsOn(info)) {
    return "Relay turned off and forgotten. Phones reach this computer on the local network only.";
  }
  if (info.connected) {
    return "Relay set and connected: " + info.url + ". It is kept after a restart. Show the pairing QR again: the relay link comes first.";
  }
  if (info.problem) return "Relay saved: " + info.url + ", but not connected. " + info.problem;
  return "Relay saved: " + info.url + ". Still connecting; the agent keeps trying. Show the pairing QR again: the relay link comes first.";
}
async function showRelayPrompt(options) {
  const { request: request2, questions, print } = options;
  const current = await request2();
  print(describeRelay(current));
  if (current.fixed) {
    print("It is set by the REMOTE_SHEEP_RELAY variables on this computer; change it there.");
    await options.waitToClose();
    return;
  }
  const change = await askChange(questions, print);
  if (change === "unchanged") {
    print(UNCHANGED);
    return;
  }
  await apply(options, change);
  await options.waitToClose();
}
async function apply(options, change) {
  const { request: request2, print } = options;
  try {
    print(describeChange(await request2(change)));
  } catch (error) {
    print(error instanceof Error ? error.message : String(error));
  }
}
async function askChange(questions, print) {
  for (; ; ) {
    const url = await questions.ask(URL_QUESTION, false);
    if (url === null) return "unchanged";
    if (!url.trim()) return { off: true };
    const checked = checkRelaySetting(url, "x");
    if (!checked.ok) {
      print(RELAY_URL_PROBLEM);
      continue;
    }
    for (; ; ) {
      const code = await questions.ask(CODE_QUESTION, true);
      if (code === null) return "unchanged";
      const both = checkRelaySetting(url, code);
      if (both.ok) return { url: both.setting.url, code: both.setting.code };
      print(both.error);
    }
  }
}

// src/L3_periphery/cli/terminal-questions.ts
import { createInterface } from "node:readline";
var ENTER = /* @__PURE__ */ new Set(["\r", "\n"]);
var BACKSPACE = /* @__PURE__ */ new Set(["\x7F", "\b"]);
var CANCEL = /* @__PURE__ */ new Set(["\x1B", ""]);
var isRawKeys = (input) => input.isTTY === true;
var TerminalQuestions = class {
  constructor(input, write) {
    this.input = input;
    this.write = write;
  }
  input;
  write;
  lines = null;
  pending = [];
  ended = false;
  waiting = null;
  ask(question, hidden) {
    this.write(question);
    const input = this.input;
    if (isRawKeys(input)) return this.readKeys(input, hidden);
    return this.readLine().then((line) => {
      this.write("\n");
      return line;
    });
  }
  readKeys(keys, hidden) {
    keys.setRawMode(true);
    keys.setEncoding("utf8");
    keys.resume();
    return new Promise((resolve2) => {
      let typed = "";
      const finish = (answer2) => {
        keys.off("data", onKeys);
        keys.setRawMode(false);
        keys.pause();
        this.write("\n");
        resolve2(answer2);
      };
      const onKeys = (chunk) => {
        for (const key2 of chunk) {
          if (ENTER.has(key2)) {
            finish(typed);
            return;
          }
          if (CANCEL.has(key2)) {
            finish(null);
            return;
          }
          if (BACKSPACE.has(key2)) {
            if (typed && !hidden) this.write("\b \b");
            typed = typed.slice(0, -1);
          } else if (key2 >= " ") {
            typed += key2;
            if (!hidden) this.write(key2);
          }
        }
      };
      keys.on("data", onKeys);
    });
  }
  readLine() {
    if (!this.lines) {
      const lines = createInterface({ input: this.input, terminal: false });
      lines.on("line", (line) => {
        this.deliver(line);
      });
      lines.on("close", () => {
        this.ended = true;
        this.deliver(null);
      });
      this.lines = lines;
    }
    const next = this.pending.shift();
    if (next !== void 0) return Promise.resolve(next);
    if (this.ended) return Promise.resolve(null);
    return new Promise((resolve2) => {
      this.waiting = resolve2;
    });
  }
  deliver(line) {
    const waiting = this.waiting;
    this.waiting = null;
    if (waiting) waiting(line);
    else if (line !== null) this.pending.push(line);
  }
};

// src/L3_periphery/cli/port-messages.ts
function busyPortHint(source) {
  return source === "variable" ? "set PORT to another port, or unset it" : "choose another with `remote-sheep port <n>`, or `remote-sheep port auto` to pick a free one";
}
function describePort({ variable, saved, file }) {
  const preset = presetListenPort(variable, saved);
  if (preset?.source === "variable") {
    return "Port " + String(preset.port) + ", from the PORT variable" + (saved === null ? "." : " (it overrides the saved port " + String(saved) + ").");
  }
  if (preset) return "Port " + String(preset.port) + ", saved in " + file + ".";
  return "No port saved yet: the next start takes the first free port from " + String(FIRST_LISTEN_PORT) + " to " + String(LAST_LISTEN_PORT) + " and saves it.";
}
async function refusePortChoice(port, probe, runningPort) {
  if (port === runningPort || await probe.isFree(port)) return null;
  return "Port " + String(port) + " is in use on this computer; choose another, or `remote-sheep port auto`.";
}

// src/L3_periphery/control/control-client.ts
import { randomBytes as randomBytes5 } from "node:crypto";
import { request } from "node:http";

// src/L3_periphery/control/control-file.ts
import { readFileSync as readFileSync2 } from "node:fs";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
async function saveControlFile(file, address) {
  await mkdir(dirname(file), { recursive: true, mode: 448 });
  const temp = file + "." + String(process.pid) + ".tmp";
  try {
    await writeFile(temp, JSON.stringify(address) + "\n", { encoding: "utf8", mode: 384 });
    await rename(temp, file);
  } catch (error) {
    await rm(temp, { force: true });
    throw error;
  }
}
function loadControlFile(file) {
  try {
    return parseControlAddress(JSON.parse(readFileSync2(file, "utf8")));
  } catch {
    return null;
  }
}
async function removeControlFile(file, secret) {
  let text;
  try {
    text = await readFile(file, "utf8");
  } catch {
    return;
  }
  try {
    if (parseControlAddress(JSON.parse(text))?.secret !== secret) return;
  } catch {
    return;
  }
  await rm(file, { force: true });
}
function parseControlAddress(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const { port, secret } = value;
  if (typeof port !== "number" || !Number.isInteger(port) || port < 1 || port > 65535) return null;
  if (typeof secret !== "string" || !secret) return null;
  return { port, secret };
}

// src/L3_periphery/control/http-control-server.ts
import { createHash, createHmac, randomBytes as randomBytes4, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
function identityProof(secret, challenge) {
  return createHmac("sha256", secret).update("remote-sheep control identity\n" + challenge).digest("base64url");
}
var CHALLENGE = /^[\w-]{43}$/;
var MAX_BODY_BYTES = 8 * 1024;
var HOST = "127.0.0.1";
var SECRET_BYTES = 32;
var REQUEST_TIMEOUT_MS = 5e3;
var CHECK_INTERVAL_MS = 1e3;
function isLoopbackAddress(address) {
  return address === "127.0.0.1" || address === "::ffff:127.0.0.1" || address === "::1";
}
var digest = (text) => createHash("sha256").update(text, "utf8").digest();
var HttpControlServer = class {
  constructor(operations, options = {}) {
    this.operations = operations;
    this.options = options;
  }
  operations;
  options;
  /** What a caller must send as `Authorization: Bearer <secret>`; new for every agent. */
  secret = randomBytes4(SECRET_BYTES).toString("base64url");
  expected = digest("Bearer " + this.secret);
  server = null;
  port = 0;
  /** Listens on an ephemeral loopback port and resolves with it. */
  async start() {
    const timeout = this.options.timeoutMs ?? REQUEST_TIMEOUT_MS;
    const server = createServer(
      {
        requestTimeout: timeout,
        headersTimeout: timeout,
        connectionsCheckingInterval: Math.min(CHECK_INTERVAL_MS, timeout)
      },
      (req, res) => {
        this.handle(req, res);
      }
    );
    server.timeout = timeout;
    await new Promise((resolve2, reject) => {
      server.once("error", reject);
      server.listen(0, HOST, () => {
        server.off("error", reject);
        resolve2();
      });
    });
    this.server = server;
    this.port = server.address().port;
    return this.port;
  }
  address() {
    const info = this.server?.address();
    return info && typeof info === "object" ? { address: info.address, port: info.port } : null;
  }
  async stop() {
    const server = this.server;
    this.server = null;
    if (!server) return;
    server.closeAllConnections();
    await new Promise((resolve2) => server.close(() => resolve2()));
  }
  handle(req, res) {
    if (!this.fromThisPc(req)) {
      res.writeHead(403).end();
      return;
    }
    if (req.method === "POST" && req.url === "/identify") {
      const challenge = req.headers["x-challenge"];
      if (typeof challenge !== "string" || !CHALLENGE.test(challenge)) {
        res.writeHead(400).end();
        return;
      }
      answer(res, 200, { proof: identityProof(this.secret, challenge) });
      return;
    }
    if (!this.authorized(req)) {
      res.writeHead(403).end();
      return;
    }
    if (req.method === "POST" && req.url === "/pairing") {
      answer(res, 200, this.operations.newPairing());
      return;
    }
    const relay2 = this.options.relay;
    if (relay2 && req.method === "POST" && req.url === "/relay") {
      req.socket.setTimeout(RELAY_DIAL_WAIT_MS + (this.options.timeoutMs ?? REQUEST_TIMEOUT_MS));
      void this.changeRelay(relay2, req, res);
      return;
    }
    res.writeHead(404).end();
  }
  /** `{}` reads the relay; `{ "set": … }` changes it. Refusals carry the reason for the person. */
  async changeRelay(relay2, req, res) {
    const text = await readBody(req);
    if (text === null) {
      res.writeHead(413, { connection: "close" }).end();
      return;
    }
    let value;
    try {
      value = JSON.parse(text);
    } catch {
      value = null;
    }
    const fields = typeof value === "object" && value !== null ? value : null;
    const change = fields?.["set"] === void 0 ? void 0 : decodeRelayChange(fields["set"]);
    if (!fields || change === null) {
      answer(res, 400, { error: "malformed relay request" });
      return;
    }
    try {
      answer(res, 200, change ? await relay2.changeRelay(change) : relay2.relay());
    } catch (error) {
      answer(res, 400, { error: error instanceof Error ? error.message : String(error) });
    }
  }
  /** What a web page in a browser on this PC cannot pass: loopback, no Origin, our own Host. */
  fromThisPc(req) {
    if (!isLoopbackAddress(req.socket.remoteAddress)) return false;
    if (req.headers.origin !== void 0) return false;
    return req.headers.host === HOST + ":" + String(this.port);
  }
  authorized(req) {
    return timingSafeEqual(digest(req.headers.authorization ?? ""), this.expected);
  }
};
function answer(res, status, value) {
  res.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
  res.end(JSON.stringify(value));
}
function readBody(req) {
  return new Promise((resolve2) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        req.removeAllListeners("data");
        req.pause();
        resolve2(null);
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      resolve2(Buffer.concat(chunks).toString("utf8"));
    });
    req.on("error", () => {
      resolve2(null);
    });
  });
}

// src/L3_periphery/control/control-client.ts
var AGENT_NOT_RUNNING = 'remote-sheep is not running. Start it with `remote-sheep start` (or the Herdr action "Start remote-sheep"), then try again.';
var AGENT_REFUSED = "The running remote-sheep refused the request. Restart it: `remote-sheep stop`, then `remote-sheep start`.";
var AGENT_IMPOSTOR = "The program answering on remote-sheep's control port is not this remote-sheep, so nothing is shown. Restart remote-sheep: `remote-sheep stop`, then `remote-sheep start`.";
var MAX_ANSWER_BYTES = 64 * 1024;
var RELAY_ANSWER_TIMEOUT_MS = 1e4;
var PLACES = /* @__PURE__ */ new Set(["relay", "network", "this-pc"]);
async function requestPairing(options) {
  const address = loadControlFile(options.controlFile);
  if (!address || !options.agentKey) throw new Error(AGENT_NOT_RUNNING);
  const answer2 = await post(
    address.port,
    "/pairing",
    { authorization: "Bearer " + address.secret },
    options.timeoutMs ?? 3e3
  );
  if (answer2.status === 403) throw new Error(AGENT_REFUSED);
  const pairing = answer2.status === 200 ? parsePairing(answer2.body) : null;
  if (!pairing) throw new Error("remote-sheep gave an unexpected answer; restart it.");
  const agentKey = options.agentKey;
  if (!pairing.links.every((link) => namesAgent(link.url, agentKey))) {
    throw new Error(AGENT_IMPOSTOR);
  }
  return pairing;
}
async function requestRelay(options) {
  const address = loadControlFile(options.controlFile);
  if (!address) throw new Error(AGENT_NOT_RUNNING);
  const timeoutMs = options.timeoutMs ?? 3e3;
  const answerMs = options.timeoutMs ?? (options.change ? RELAY_ANSWER_TIMEOUT_MS : 3e3);
  const challenge = randomBytes5(32).toString("base64url");
  const identity = await post(address.port, "/identify", { "x-challenge": challenge }, timeoutMs);
  const proof = identity.status === 200 ? readField(identity.body, "proof") : null;
  const expected = identityProof(address.secret, challenge);
  const encoder5 = new TextEncoder();
  if (proof === null || !constantTimeEqual(encoder5.encode(proof), encoder5.encode(expected))) {
    throw new Error(AGENT_IMPOSTOR);
  }
  const body = JSON.stringify(options.change ? { set: options.change } : {});
  const answer2 = await post(
    address.port,
    "/relay",
    { authorization: "Bearer " + address.secret, "content-type": "application/json" },
    answerMs,
    body
  );
  if (answer2.status === 403) throw new Error(AGENT_REFUSED);
  if (answer2.status === 400) {
    throw new Error(readField(answer2.body, "error") ?? "remote-sheep refused the change.");
  }
  const info = answer2.status === 200 ? parseRelayInfo(answer2.body) : null;
  if (!info) throw new Error("remote-sheep gave an unexpected answer; restart it.");
  return info;
}
function namesAgent(url, agentKey) {
  const marker = url.indexOf("#pair=");
  const invite = marker < 0 ? null : decodeInvite(url.slice(marker + "#pair=".length));
  return invite !== null && constantTimeEqual(invite.agentKey, agentKey);
}
function post(port, path, headers, timeoutMs, body) {
  return new Promise((resolve2, reject) => {
    const notRunning = () => {
      reject(new Error(AGENT_NOT_RUNNING));
    };
    const req = request(
      {
        host: "127.0.0.1",
        port,
        method: "POST",
        path,
        headers,
        // No keep-alive pool: the command exits as soon as it has its answer.
        agent: false
      },
      (res) => {
        let text = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          text += chunk;
          if (text.length > MAX_ANSWER_BYTES) req.destroy();
        });
        res.on("end", () => {
          clearTimeout(timer);
          resolve2({ status: res.statusCode ?? 0, body: text });
        });
        res.on("error", notRunning);
      }
    );
    const timer = setTimeout(() => req.destroy(), timeoutMs);
    req.on("error", () => {
      clearTimeout(timer);
      notRunning();
    });
    req.on("close", () => {
      clearTimeout(timer);
    });
    req.end(body);
  });
}
function parsePairing(body) {
  let value;
  try {
    value = JSON.parse(body);
  } catch {
    return null;
  }
  if (typeof value !== "object" || value === null) return null;
  const { links, expiresAt } = value;
  if (typeof expiresAt !== "number" || !Array.isArray(links) || !links.length) return null;
  const parsed = [];
  for (const link of links) {
    if (typeof link !== "object" || link === null) return null;
    const { where, url } = link;
    if (typeof where !== "string" || !PLACES.has(where) || typeof url !== "string") return null;
    parsed.push({ where, url });
  }
  return { links: parsed, expiresAt };
}
function parseObject(body) {
  try {
    const value = JSON.parse(body);
    return typeof value === "object" && value !== null ? value : null;
  } catch {
    return null;
  }
}
function readField(body, name) {
  const value = parseObject(body)?.[name];
  return typeof value === "string" ? value : null;
}
function parseRelayInfo(body) {
  const value = parseObject(body);
  if (!value) return null;
  const { on, url, connected, fixed, problem } = value;
  if (typeof on !== "boolean" || typeof connected !== "boolean" || typeof fixed !== "boolean") {
    return null;
  }
  if (url !== null && typeof url !== "string") return null;
  if (problem !== void 0 && typeof problem !== "string") return null;
  return { on, url, connected, fixed, ...problem === void 0 ? {} : { problem } };
}

// src/L3_periphery/claude/claude-transcripts.ts
import {
  closeSync as closeSync2,
  existsSync as existsSync2,
  fstatSync,
  openSync as openSync2,
  readdirSync,
  readFileSync as readFileSync3,
  readSync,
  watch
} from "node:fs";
import { join as join2 } from "node:path";
var ENVELOPES = [
  /<system-reminder>[\s\S]*?<\/system-reminder>/g,
  /<local-command-[a-z-]+>[\s\S]*?<\/local-command-[a-z-]+>/g,
  /<command-[a-z-]+>[\s\S]*?<\/command-[a-z-]+>/g,
  /<user-prompt-submit-hook>[\s\S]*?<\/user-prompt-submit-hook>/g,
  /<pasted_content[\s\S]*?<\/pasted_content>/g
];
var HANDOFF = "This session is being continued from a previous conversation";
function stripEnvelopes(raw) {
  let text = raw;
  for (const pattern of ENVELOPES) text = text.replace(pattern, "");
  text = text.trim();
  if (text.startsWith(HANDOFF)) return "";
  return text.startsWith("<") ? "" : text;
}
function projectDirName(cwd) {
  return withoutTrailingSeparators(cwd).replace(/[^a-zA-Z0-9]/g, "-");
}
function withoutTrailingSeparators(path) {
  let end = path.length;
  while (end > 0 && (path[end - 1] === "/" || path[end - 1] === "\\")) end--;
  return path.slice(0, end);
}
function contextOf(usage) {
  const part = (n) => typeof n === "number" && Number.isFinite(n) ? n : 0;
  return part(usage.input_tokens) + part(usage.cache_read_input_tokens) + part(usage.cache_creation_input_tokens);
}
var SYNTHETIC = "<synthetic>";
function parse(line) {
  if (!line.trim()) return null;
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}
function blocksOf(entry) {
  const content = entry.message?.content;
  if (typeof content === "string") return [{ type: "text", text: content }];
  return Array.isArray(content) ? content : [];
}
var ClaudeTranscripts = class {
  constructor(options) {
    this.options = options;
  }
  options;
  // The port is async for adapters that need I/O; this one reads synchronously.
  locate(pid, cwd) {
    return Promise.resolve(this.locateNow(pid, cwd));
  }
  locateNow(pid, cwd) {
    if (!pid) return { file: null, note: "no agent process in this pane" };
    const session = this.sessionByPid(pid);
    if (!session?.sessionId) return { file: null, note: "no session index for pid " + pid };
    const file = this.transcriptFor(session.sessionId, session.cwd || cwd);
    if (!file) return { file: null, note: "transcript not written yet" };
    return { file };
  }
  read(file) {
    const messages = [];
    let model = null;
    let usedTokens = null;
    for (const line of this.tail(file)) {
      const entry = parse(line);
      if (!entry || entry.type !== "user" && entry.type !== "assistant") continue;
      if (entry.isSidechain || entry.isMeta || entry.toolUseResult || entry.isCompactSummary) {
        continue;
      }
      const role = entry.type;
      const named = entry.message?.model;
      if (role === "assistant" && named && named !== SYNTHETIC) model = named;
      const usage = entry.message?.usage;
      if (role === "assistant" && named !== SYNTHETIC && usage && typeof usage === "object") {
        usedTokens = contextOf(usage);
      }
      const time = entry.timestamp ? Date.parse(entry.timestamp) : Number.NaN;
      const at = Number.isFinite(time) ? { at: time } : {};
      const uuid = entry.uuid || entry.messageId || "";
      blocksOf(entry).forEach((block, i) => {
        const id = uuid + ":" + i;
        if (block?.type === "image" && block.source?.data) {
          const media = block.source.media_type || "image/png";
          if (!isDisplayableImage(media)) return;
          messages.push({ id, role, kind: "image", media, ...at });
          return;
        }
        if (block?.type !== "text" || typeof block.text !== "string") return;
        const text = stripEnvelopes(block.text);
        if (text) messages.push({ id, role, kind: "text", text, ...at });
      });
    }
    return { messages: messages.slice(-this.options.maxMessages), model, usedTokens };
  }
  image(file, id) {
    const cut = id.lastIndexOf(":");
    if (cut < 1) return null;
    const uuid = id.slice(0, cut);
    const index = Number(id.slice(cut + 1));
    if (!Number.isInteger(index)) return null;
    for (const line of this.tail(file)) {
      if (!line.includes(uuid)) continue;
      const entry = parse(line);
      if (!entry || (entry.uuid || entry.messageId) !== uuid) continue;
      const block = blocksOf(entry)[index];
      if (block?.type !== "image" || !block.source?.data) return null;
      const media = block.source.media_type || "image/png";
      if (!isDisplayableImage(media)) return null;
      return {
        media,
        data: Buffer.from(block.source.data, "base64")
      };
    }
    return null;
  }
  watch(file, onChange) {
    const watcher = watch(file, { persistent: false }, () => onChange());
    watcher.on("error", () => watcher.close());
    return () => watcher.close();
  }
  sessionByPid(pid) {
    try {
      return JSON.parse(readFileSync3(join2(this.options.sessionsDir, pid + ".json"), "utf8"));
    } catch {
      return null;
    }
  }
  transcriptFor(sessionId, cwd) {
    const direct = join2(this.options.projectsDir, projectDirName(cwd), sessionId + ".jsonl");
    if (existsSync2(direct)) return direct;
    try {
      for (const dir of readdirSync(this.options.projectsDir)) {
        const candidate = join2(this.options.projectsDir, dir, sessionId + ".jsonl");
        if (existsSync2(candidate)) return candidate;
      }
    } catch {
    }
    return null;
  }
  tail(file) {
    const fd = openSync2(file, "r");
    try {
      const size = fstatSync(fd).size;
      const start = Math.max(0, size - this.options.tailBytes);
      const buffer = Buffer.alloc(size - start);
      readSync(fd, buffer, 0, buffer.length, start);
      const lines = buffer.toString("utf8").split("\n");
      if (start > 0) lines.shift();
      return lines;
    } finally {
      closeSync2(fd);
    }
  }
};

// src/L3_periphery/files/file-agent-identity.ts
import { mkdir as mkdir2, readFile as readFile2, writeFile as writeFile2 } from "node:fs/promises";
import { dirname as dirname2 } from "node:path";
var FORMAT_VERSION = 1;
function parse2(file, text) {
  let json2 = null;
  try {
    json2 = JSON.parse(text);
  } catch {
  }
  const fields = typeof json2 === "object" && json2 !== null ? json2 : {};
  const secret = fields["version"] === FORMAT_VERSION && typeof fields["secretKey"] === "string" ? decodeBase64Url(fields["secretKey"]) : null;
  if (secret?.length !== 32) throw new Error("damaged agent key " + file);
  return generateKeyPair(secret);
}
var hasCode = (error, code) => error instanceof Error && "code" in error && error.code === code;
async function readAgentPublicKey(file) {
  try {
    return parse2(file, await readFile2(file, "utf8")).publicKey;
  } catch {
    return null;
  }
}
async function loadAgentKeyPair(file) {
  try {
    return parse2(file, await readFile2(file, "utf8"));
  } catch (error) {
    if (!hasCode(error, "ENOENT")) throw error;
  }
  const keys = generateKeyPair();
  await mkdir2(dirname2(file), { recursive: true, mode: 448 });
  const text = JSON.stringify({
    version: FORMAT_VERSION,
    secretKey: encodeBase64Url(keys.secretKey)
  });
  try {
    await writeFile2(file, text + "\n", { encoding: "utf8", mode: 384, flag: "wx" });
  } catch (error) {
    if (hasCode(error, "EEXIST")) {
      return parse2(file, await readFile2(file, "utf8"));
    }
    throw error;
  }
  return keys;
}

// src/L3_periphery/files/file-device-registry.ts
import { randomBytes as randomBytes6 } from "node:crypto";
import { mkdir as mkdir3, open, readFile as readFile3, rename as rename2, rm as rm2, stat, writeFile as writeFile3 } from "node:fs/promises";
import { dirname as dirname3 } from "node:path";
var FORMAT_VERSION2 = 1;
var LOCK_RETRY_MS = 20;
var LOCK_WAIT_MS = 5e3;
var STALE_LOCK_MS = 3e4;
var delay = (ms) => new Promise((resolve2) => {
  setTimeout(resolve2, ms);
});
var isObject2 = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
var isTime = (value) => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
function damaged(file, why) {
  return new Error("damaged device registry " + file + ": " + why);
}
function parsePush(value) {
  if (!isObject2(value)) return void 0;
  const { endpoint, p256dh, auth } = value;
  if (typeof endpoint !== "string" || typeof p256dh !== "string" || typeof auth !== "string") {
    return void 0;
  }
  return { endpoint, p256dh, auth };
}
function parseDevice(value) {
  if (!isObject2(value) || typeof value["id"] !== "string") return null;
  if (typeof value["publicKey"] !== "string") return null;
  const publicKey = decodeBase64Url(value["publicKey"]);
  if (publicKey?.length !== 32 || publicKeyId(publicKey) !== value["id"]) return null;
  if (!isTime(value["pairedAt"]) || !isTime(value["lastSeen"])) return null;
  const push = parsePush(value["push"]);
  return {
    id: value["id"],
    publicKey,
    pairedAt: value["pairedAt"],
    lastSeen: value["lastSeen"],
    ...push && { push }
  };
}
function parse3(file, text) {
  let json2;
  try {
    json2 = JSON.parse(text);
  } catch {
    throw damaged(file, "not JSON");
  }
  if (!isObject2(json2) || json2["version"] !== FORMAT_VERSION2) throw damaged(file, "unknown format");
  const { devices, revoked } = json2;
  if (!Array.isArray(devices) || !Array.isArray(revoked)) throw damaged(file, "unknown format");
  const parsed = devices.map(parseDevice).filter((device) => device !== null);
  if (parsed.length !== devices.length) throw damaged(file, "bad device entry");
  if (!revoked.every((id) => typeof id === "string")) throw damaged(file, "bad revoked entry");
  return { devices: parsed, revoked };
}
function serialize(contents) {
  const devices = contents.devices.map((device) => ({
    id: device.id,
    publicKey: encodeBase64Url(device.publicKey),
    pairedAt: device.pairedAt,
    lastSeen: device.lastSeen,
    ...device.push && { push: device.push }
  }));
  return JSON.stringify({ version: FORMAT_VERSION2, devices, revoked: contents.revoked }, null, 2);
}
function errorCode(error) {
  return isObject2(error) ? error["code"] : void 0;
}
async function replace(from, to) {
  for (let attempt = 1; ; attempt++) {
    try {
      await rename2(from, to);
      return;
    } catch (err) {
      const code = err.code;
      if (attempt >= 5 || code !== "EPERM" && code !== "EBUSY") throw err;
      await new Promise((resolve2) => setTimeout(resolve2, 20 * attempt));
    }
  }
}
var FileDeviceRegistry = class {
  constructor(file) {
    this.file = file;
  }
  file;
  // Changes from this process queue up here; the lock file orders them with other processes.
  writes = Promise.resolve();
  async list() {
    return (await this.read()).devices;
  }
  async find(id) {
    return (await this.read()).devices.find((device) => device.id === id) ?? null;
  }
  async isRevoked(id) {
    return (await this.read()).revoked.includes(id);
  }
  save(device) {
    return this.change((contents) => ({
      devices: [...contents.devices.filter((d) => d.id !== device.id), device],
      revoked: contents.revoked.filter((id) => id !== device.id)
    }));
  }
  touch(id, at) {
    return this.change((contents) => {
      const device = contents.devices.find((d) => d.id === id);
      if (!device || device.lastSeen >= at) return null;
      return {
        devices: contents.devices.map((d) => d.id === id ? { ...d, lastSeen: at } : d),
        revoked: contents.revoked
      };
    });
  }
  async setPush(id, push) {
    let found = false;
    await this.change((contents) => {
      found = contents.devices.some((d) => d.id === id);
      if (!found) return null;
      return {
        devices: contents.devices.map((d) => {
          if (d.id !== id) return d;
          const { push: _previous, ...rest } = d;
          return push ? { ...rest, push } : rest;
        }),
        revoked: contents.revoked
      };
    });
    return found;
  }
  async remove(id) {
    let found = false;
    await this.change((contents) => {
      found = contents.devices.some((d) => d.id === id);
      if (!found) return null;
      return {
        devices: contents.devices.filter((d) => d.id !== id),
        revoked: [...contents.revoked.filter((r) => r !== id), id]
      };
    });
    return found;
  }
  async read() {
    let text;
    try {
      text = await readFile3(this.file, "utf8");
    } catch (error) {
      if (errorCode(error) === "ENOENT") return { devices: [], revoked: [] };
      throw error;
    }
    return parse3(this.file, text);
  }
  /** Applies `update` to the current contents; a null result writes nothing. */
  change(update) {
    const run = this.writes.then(
      () => this.locked(update),
      () => this.locked(update)
    );
    this.writes = run.catch(() => void 0);
    return run;
  }
  async locked(update) {
    await mkdir3(dirname3(this.file), { recursive: true, mode: 448 });
    const lock = this.file + ".lock";
    await this.acquire(lock);
    try {
      const next = update(await this.read());
      if (!next) return;
      const temp = this.file + "." + randomBytes6(6).toString("hex") + ".tmp";
      try {
        await writeFile3(temp, serialize(next) + "\n", { encoding: "utf8", mode: 384 });
        await replace(temp, this.file);
      } finally {
        await rm2(temp, { force: true });
      }
    } finally {
      await rm2(lock, { force: true });
    }
  }
  async acquire(lock) {
    const deadline = Date.now() + LOCK_WAIT_MS;
    for (; ; ) {
      try {
        await (await open(lock, "wx", 384)).close();
        return;
      } catch (error) {
        if (errorCode(error) !== "EEXIST") throw error;
      }
      const age = await stat(lock).then(
        (info) => Date.now() - info.mtimeMs,
        () => 0
      );
      if (age > STALE_LOCK_MS) {
        await rm2(lock, { force: true });
        continue;
      }
      if (Date.now() > deadline) throw new Error("device registry is locked: " + lock);
      await delay(LOCK_RETRY_MS);
    }
  }
};

// src/L3_periphery/files/file-saved-port.ts
import { mkdir as mkdir4, readFile as readFile4, rename as rename3, rm as rm3, writeFile as writeFile4 } from "node:fs/promises";
import { dirname as dirname4 } from "node:path";
var hasCode2 = (error, code) => error instanceof Error && "code" in error && error.code === code;
var FileSavedPort = class {
  constructor(file) {
    this.file = file;
  }
  file;
  async load() {
    let text;
    try {
      text = await readFile4(this.file, "utf8");
    } catch (error) {
      if (hasCode2(error, "ENOENT")) return null;
      throw error;
    }
    try {
      const json2 = JSON.parse(text);
      if (typeof json2 !== "object" || json2 === null) return null;
      const { port } = json2;
      return isListenPort(port) ? port : null;
    } catch {
      return null;
    }
  }
  async save(port) {
    await mkdir4(dirname4(this.file), { recursive: true, mode: 448 });
    const temp = this.file + "." + String(process.pid) + ".tmp";
    try {
      await writeFile4(temp, JSON.stringify({ port }) + "\n", "utf8");
      await rename3(temp, this.file);
    } catch (error) {
      await rm3(temp, { force: true });
      throw error;
    }
  }
  /** True when a port was saved. */
  async forget() {
    try {
      await rm3(this.file);
      return true;
    } catch (error) {
      if (hasCode2(error, "ENOENT")) return false;
      throw error;
    }
  }
};

// src/L3_periphery/files/file-shell-setting.ts
import { mkdir as mkdir5, readFile as readFile5, writeFile as writeFile5 } from "node:fs/promises";
import { dirname as dirname5 } from "node:path";
var FORMAT_VERSION3 = 1;
var hasCode3 = (error, code) => error instanceof Error && "code" in error && error.code === code;
function parse4(text) {
  let json2;
  try {
    json2 = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof json2 !== "object" || json2 === null || Array.isArray(json2)) return null;
  const fields = json2;
  if (fields["version"] !== FORMAT_VERSION3) return null;
  if (fields["shells"] !== void 0 && typeof fields["shells"] !== "boolean") return null;
  return fields;
}
async function loadShellSetting(file) {
  let on = true;
  let fields = {};
  try {
    const stored = parse4(await readFile5(file, "utf8"));
    if (stored) {
      fields = stored;
      on = stored["shells"] !== false;
    } else {
      on = false;
    }
  } catch (error) {
    if (!hasCode3(error, "ENOENT")) throw error;
  }
  return {
    enabled: () => on,
    async set(next) {
      await mkdir5(dirname5(file), { recursive: true, mode: 448 });
      const text = JSON.stringify({ ...fields, version: FORMAT_VERSION3, shells: next });
      await writeFile5(file, text + "\n", { encoding: "utf8", mode: 384 });
      fields = { ...fields, version: FORMAT_VERSION3, shells: next };
      on = next;
    }
  };
}

// src/L3_periphery/files/file-vapid-keys.ts
import { mkdir as mkdir6, readFile as readFile6, writeFile as writeFile6 } from "node:fs/promises";
import { dirname as dirname6 } from "node:path";

// src/L3_periphery/push/web-push-vapid.ts
import { createPublicKey as createPublicKey2, sign } from "node:crypto";

// src/L3_periphery/push/web-push-encryption.ts
import {
  createCipheriv,
  createPrivateKey,
  createPublicKey,
  diffieHellman,
  generateKeyPairSync,
  hkdfSync,
  randomBytes as randomBytes7
} from "node:crypto";
var RECORD_SIZE = 4096;
var MAX_PLAINTEXT = RECORD_SIZE - 16 - 1;
var POINT_LENGTH = 65;
var TEXT = new TextEncoder();
var b64 = (bytes) => Buffer.from(bytes).toString("base64url");
function p256PublicKey(point) {
  if (point.length !== POINT_LENGTH || point[0] !== 4) throw new Error("not a P-256 point");
  return createPublicKey({
    key: { kty: "EC", crv: "P-256", x: b64(point.subarray(1, 33)), y: b64(point.subarray(33)) },
    format: "jwk"
  });
}
function p256PrivateKey(secret, point) {
  if (point.length !== POINT_LENGTH || point[0] !== 4) throw new Error("not a P-256 point");
  return createPrivateKey({
    key: {
      kty: "EC",
      crv: "P-256",
      x: b64(point.subarray(1, 33)),
      y: b64(point.subarray(33)),
      d: b64(secret)
    },
    format: "jwk"
  });
}
function generateP256() {
  const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const jwk = publicKey.export({ format: "jwk" });
  const x = Buffer.from(jwk.x ?? "", "base64url");
  const y = Buffer.from(jwk.y ?? "", "base64url");
  return { privateKey, publicKey: new Uint8Array(Buffer.concat([Buffer.from([4]), x, y])) };
}
var concat = (...parts) => Buffer.concat(parts);
var derive2 = (ikm, salt, info, length) => Buffer.from(hkdfSync("sha256", ikm, salt, info, length));
function encryptPayload(input) {
  if (input.plaintext.length > MAX_PLAINTEXT) throw new Error("push payload too long");
  const ephemeral = input.ephemeral ?? generateP256();
  const salt = input.salt ?? randomBytes7(16);
  const secret = diffieHellman({
    privateKey: ephemeral.privateKey,
    publicKey: p256PublicKey(input.p256dh)
  });
  const ikm = derive2(
    secret,
    input.auth,
    concat(TEXT.encode("WebPush: info\0"), input.p256dh, ephemeral.publicKey),
    32
  );
  const key2 = derive2(ikm, salt, TEXT.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce2 = derive2(ikm, salt, TEXT.encode("Content-Encoding: nonce\0"), 12);
  const cipher = createCipheriv("aes-128-gcm", key2, nonce2);
  const sealed = concat(
    cipher.update(concat(input.plaintext, Uint8Array.of(2))),
    cipher.final(),
    cipher.getAuthTag()
  );
  const header = Buffer.alloc(21);
  header.set(salt, 0);
  header.writeUInt32BE(RECORD_SIZE, 16);
  header.writeUInt8(ephemeral.publicKey.length, 20);
  return concat(header, ephemeral.publicKey, sealed);
}

// src/L3_periphery/push/web-push-vapid.ts
var VAPID_TOKEN_SECONDS = 12 * 60 * 60;
function newVapidKeys() {
  const { privateKey, publicKey } = generateP256();
  return { privateKey, publicKey };
}
function vapidSecret(keys) {
  return Buffer.from(keys.privateKey.export({ format: "jwk" }).d ?? "", "base64url");
}
function vapidKeysFrom(secret, point) {
  const privateKey = p256PrivateKey(secret, point);
  const derived = createPublicKey2(privateKey).export({ format: "jwk" });
  const expected = encodeBase64Url(point.subarray(1, 33)) + encodeBase64Url(point.subarray(33));
  if ((derived.x ?? "") + (derived.y ?? "") !== expected) throw new Error("key halves differ");
  return { publicKey: point, privateKey };
}
var json = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
function vapidAuthorization(keys, endpoint, subject, nowMs) {
  const unsigned = json({ typ: "JWT", alg: "ES256" }) + "." + json({
    aud: new URL(endpoint).origin,
    exp: Math.floor(nowMs / 1e3) + VAPID_TOKEN_SECONDS,
    sub: subject
  });
  const signature = sign("sha256", Buffer.from(unsigned), {
    key: keys.privateKey,
    dsaEncoding: "ieee-p1363"
  });
  return "vapid t=" + unsigned + "." + signature.toString("base64url") + ", k=" + encodeBase64Url(keys.publicKey);
}

// src/L3_periphery/files/file-vapid-keys.ts
var FORMAT_VERSION4 = 1;
function parse5(file, text) {
  let json2 = null;
  try {
    json2 = JSON.parse(text);
  } catch {
  }
  const fields = typeof json2 === "object" && json2 !== null ? json2 : {};
  const ok = fields["version"] === FORMAT_VERSION4;
  const secret = ok && typeof fields["privateKey"] === "string" ? decodeBase64Url(fields["privateKey"]) : null;
  const point = ok && typeof fields["publicKey"] === "string" ? decodeBase64Url(fields["publicKey"]) : null;
  if (secret?.length !== 32 || point?.length !== 65) throw new Error("damaged VAPID keys " + file);
  try {
    return vapidKeysFrom(secret, point);
  } catch {
    throw new Error("damaged VAPID keys " + file);
  }
}
var hasCode4 = (error, code) => error instanceof Error && "code" in error && error.code === code;
async function loadVapidKeys(file) {
  try {
    return parse5(file, await readFile6(file, "utf8"));
  } catch (error) {
    if (!hasCode4(error, "ENOENT")) throw error;
  }
  const keys = newVapidKeys();
  await mkdir6(dirname6(file), { recursive: true, mode: 448 });
  const text = JSON.stringify({
    version: FORMAT_VERSION4,
    publicKey: encodeBase64Url(keys.publicKey),
    privateKey: encodeBase64Url(vapidSecret(keys))
  });
  try {
    await writeFile6(file, text + "\n", { encoding: "utf8", mode: 384, flag: "wx" });
  } catch (error) {
    if (hasCode4(error, "EEXIST")) return parse5(file, await readFile6(file, "utf8"));
    throw error;
  }
  return keys;
}

// src/L3_periphery/files/file-upload-store.ts
import { randomBytes as randomBytes8 } from "node:crypto";
import { mkdir as mkdir7, writeFile as writeFile7 } from "node:fs/promises";
import { join as join3 } from "node:path";
var EXTENSIONS = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/heic": ".heic"
};
function stamp(now = /* @__PURE__ */ new Date()) {
  const pad2 = (n) => String(n).padStart(2, "0");
  return now.getFullYear() + pad2(now.getMonth() + 1) + pad2(now.getDate()) + "-" + pad2(now.getHours()) + pad2(now.getMinutes()) + pad2(now.getSeconds());
}
var FileUploadStore = class {
  constructor(dir, maxBytes) {
    this.dir = dir;
    this.maxBytes = maxBytes;
  }
  dir;
  maxBytes;
  async save(media, bytes) {
    const extension2 = EXTENSIONS[(media.split(";")[0] ?? "").trim().toLowerCase()];
    if (!extension2) throw new Error("unsupported image type: " + media);
    if (!bytes.length) throw new Error("empty image");
    if (bytes.length > this.maxBytes) {
      throw new Error("image larger than " + Math.round(this.maxBytes / 1024 / 1024) + " MB");
    }
    await mkdir7(this.dir, { recursive: true });
    const name = stamp() + "-" + randomBytes8(3).toString("hex") + extension2;
    const path = join3(this.dir, name);
    await writeFile7(path, bytes);
    return { path, name, bytes: bytes.length };
  }
};

// src/L3_periphery/herdr/herdr-multiplexer.ts
import { execFile as execFile2 } from "node:child_process";
import { basename as basename2 } from "node:path";
function herdrExecutable(env, platform) {
  return env["HERDR"] || env["HERDR_BIN_PATH"] || (platform === "win32" ? "herdr.exe" : "herdr");
}
function herdrRunner(executable) {
  return (args) => new Promise((resolve2, reject) => {
    execFile2(
      executable,
      args,
      { maxBuffer: 4 * 1024 * 1024, windowsHide: true },
      (err, stdout, stderr) => {
        if (err) {
          reject(new Error(stderr.trim() || err.message));
          return;
        }
        resolve2(stdout);
      }
    );
  });
}
var STATUSES = /* @__PURE__ */ new Set(["idle", "working", "blocked", "done", "unknown"]);
var ABSOLUTE_PATH = /^([a-zA-Z]:[\\/]|\/)/;
function withoutTrailingSeparators2(path) {
  let end = path.length;
  while (end > 0 && (path[end - 1] === "/" || path[end - 1] === "\\")) end--;
  return path.slice(0, end);
}
var lastSegment = (path) => basename2(withoutTrailingSeparators2(path).replace(/\\/g, "/"));
function toSession(pane, kind) {
  const target = pane.pane_id ?? "";
  const cwd = pane.cwd ?? "";
  const status = STATUSES.has(String(pane.agent_status)) ? pane.agent_status : "unknown";
  const raw = pane.terminal_title_stripped || "";
  const title = kind === "shell" && ABSOLUTE_PATH.test(raw) ? lastSegment(raw) : raw;
  return {
    target,
    kind,
    title: title || target,
    status,
    cwd,
    project: lastSegment(cwd),
    space: pane.workspace_id ?? "",
    ...pane.agent ? { agent: pane.agent } : {}
  };
}
function parseAgentList(raw) {
  const parsed = JSON.parse(raw);
  return (parsed.result?.agents ?? []).map((a) => toSession(a, "agent"));
}
function parseShellList(raw) {
  const parsed = JSON.parse(raw);
  return (parsed.result?.panes ?? []).flatMap(
    (p) => p.pane_id && !p.agent ? [toSession(p, "shell")] : []
  );
}
function parseWorkspaceList(raw) {
  const parsed = JSON.parse(raw);
  return (parsed.result?.workspaces ?? []).flatMap(
    (w) => w.workspace_id ? [{ id: w.workspace_id, label: w.label || w.workspace_id }] : []
  );
}
var RULER = /([─-╿=_-])\1{19,}/g;
function tidyTerminal(raw) {
  const text = raw.split("\n").map((line) => line.trimEnd().replace(RULER, (_run, char) => char.repeat(20))).join("\n");
  let end = text.length;
  while (end > 0 && text[end - 1] === "\n") end--;
  return text.slice(0, end);
}
var PID_TTL_MS = 15e3;
var START_TIMEOUT_MS = 2e4;
var TAIL_LINES = 80;
var HerdrMultiplexer = class {
  constructor(run) {
    this.run = run;
  }
  run;
  pids = /* @__PURE__ */ new Map();
  async listSessions() {
    return parseAgentList(await this.run(["agent", "list"]));
  }
  async listShells() {
    return parseShellList(await this.run(["pane", "list"]));
  }
  // The pid is how a pane is tied to the Claude session running inside it.
  async processId(target) {
    const cached = this.pids.get(target);
    if (cached && Date.now() - cached.at < PID_TTL_MS) return cached.pid;
    let pid;
    try {
      const parsed = JSON.parse(await this.run(["pane", "process-info", "--pane", target]));
      const running = parsed.result?.process_info?.foreground_processes ?? [];
      const claude = running.find((p) => /claude/i.test(p.name ?? "")) ?? running[0];
      pid = claude?.pid ?? null;
    } catch {
      pid = null;
    }
    this.pids.set(target, { at: Date.now(), pid });
    return pid;
  }
  // A shell is no Herdr agent, so the `agent` verbs refuse it; `pane` reaches any pane.
  async readTerminal(session) {
    const raw = await this.run([
      session.kind === "shell" ? "pane" : "agent",
      "read",
      session.target,
      "--source",
      "recent",
      "--lines",
      String(TAIL_LINES),
      "--format",
      "text"
    ]);
    return tidyTerminal(raw);
  }
  async sendPrompt(session, text) {
    if (session.kind === "shell") await this.run(["pane", "run", session.target, text]);
    else await this.run(["agent", "prompt", session.target, text]);
  }
  async sendKeys(session, keys) {
    await this.run([
      session.kind === "shell" ? "pane" : "agent",
      "send-keys",
      session.target,
      ...keys
    ]);
  }
  async listSpaces() {
    return parseWorkspaceList(await this.run(["workspace", "list"]));
  }
  // A new tab rather than a split: on a phone-sized view of the layout, a split
  // would shrink a pane someone is already working in.
  async startSession(space, agent) {
    const pane = await this.newTab(space);
    const name = "sheep-" + Date.now().toString(36);
    try {
      await this.run([
        "agent",
        "start",
        name,
        "--kind",
        agent,
        "--pane",
        pane,
        "--timeout",
        String(START_TIMEOUT_MS)
      ]);
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("agent_not_ready")) throw error;
    }
    return pane;
  }
  // A new tab already runs the user's shell, so it only has to be created.
  startShell(space) {
    return this.newTab(space);
  }
  async newTab(space) {
    const created = JSON.parse(
      await this.run(["tab", "create", "--workspace", space, "--no-focus"])
    );
    const pane = created.result?.root_pane?.pane_id;
    if (!pane) throw new Error("Herdr created no pane in " + space);
    return pane;
  }
};

// src/L3_periphery/herdr/herdr-notifications.ts
var NOTICE_TIMEOUT_MS = 2500;
var MAX_REASON = 120;
var STOP_NOTICE = {
  title: "remote-sheep stopped",
  body: "start it again from Herdr"
};
function startNotice(result) {
  if (result.port !== null && (result.kind === "started" || result.kind === "already-running")) {
    return { title: "remote-sheep \u2713", body: "open http://localhost:" + String(result.port) };
  }
  if (result.kind === "failed") {
    return { title: "remote-sheep could not start", body: shortReason(result.message) };
  }
  return {
    title: "remote-sheep could not start",
    body: "it runs but does not listen yet; see remote-sheep status"
  };
}
function herdrAnnouncer(run) {
  return {
    started: (result) => showNotice(run, startNotice(result)),
    stopped: () => showNotice(run, STOP_NOTICE)
  };
}
async function showNotice(run, notice) {
  try {
    await run(["notification", "show", notice.title, "--body", notice.body], NOTICE_TIMEOUT_MS);
  } catch {
  }
}
function shortReason(message2) {
  const last = message2.split("\n").map((line) => line.trim()).filter(Boolean).at(-1) ?? "no reason given";
  return last.length > MAX_REASON ? last.slice(0, MAX_REASON - 1) + "\u2026" : last;
}

// src/L3_periphery/herdr/herdr-plugin-updates.ts
import { execFile as execFile3 } from "node:child_process";
var PLUGIN_ID = "sheepvibecoder.remote-sheep";
var LINKED_PLUGIN = "This plugin is linked from a folder on the computer (herdr plugin link), which Herdr does not update: run `git pull` in that folder (it holds the built agent; run `pnpm build` only if you changed the code), then restart the agent.";
var TOO_OLD_HERDR = "This Herdr cannot update plugins yet: update Herdr on the computer, then try again.";
var UPDATE_TIMEOUT_MS = 15 * 6e4;
var RESTART_TIMEOUT_MS = 6e4;
function herdrCommand(executable, leading = []) {
  return (args, timeoutMs) => new Promise((resolve2) => {
    execFile3(
      executable,
      [...leading, ...args],
      { timeout: timeoutMs, windowsHide: true, maxBuffer: 16 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (!err) {
          resolve2({ code: 0, stdout, stderr, error: null });
          return;
        }
        const code = typeof err.code === "number" ? err.code : null;
        const error = err.killed ? "timed out" : code === null ? err.message : null;
        resolve2({ code, stdout, stderr, error });
      }
    );
  });
}
function runsAsPlugin(env) {
  return Boolean(env["HERDR_PLUGIN_ROOT"]);
}
var HerdrPluginUpdates = class {
  constructor(run) {
    this.run = run;
  }
  run;
  async update() {
    const outcome = await this.run(["plugin", "update", PLUGIN_ID, "--yes"], UPDATE_TIMEOUT_MS);
    if (outcome.error !== null) throw new Error("could not run Herdr: " + outcome.error);
    const said = outcome.stdout + "\n" + outcome.stderr;
    if (outcome.code === 0) return said.includes("is already up to date") ? "current" : "updated";
    if (said.includes("locally linked")) throw new Error(LINKED_PLUGIN);
    if (said.includes("herdr plugin commands:") && !said.includes("plugin update")) {
      throw new Error(TOO_OLD_HERDR);
    }
    throw new Error("Herdr could not update the plugin: " + lastLine(said));
  }
  async restart() {
    const outcome = await this.run(
      ["plugin", "action", "invoke", PLUGIN_ID + ".restart"],
      RESTART_TIMEOUT_MS
    );
    if (outcome.error !== null) throw new Error("could not run Herdr: " + outcome.error);
    if (outcome.code !== 0) {
      throw new Error("Herdr could not restart the agent: " + lastLine(outcome.stderr));
    }
  }
};
function lastLine(text) {
  return text.split("\n").map((line) => line.trim()).filter(Boolean).at(-1) ?? "no reason given";
}

// src/L3_periphery/lan/lan-transport.ts
import { readFileSync as readFileSync4 } from "node:fs";
import {
  createServer as createHttp
} from "node:http";
import { createServer as createHttps } from "node:https";
import { extname, resolve, sep } from "node:path";

// ../../node_modules/.pnpm/ws@8.22.0/node_modules/ws/wrapper.mjs
var import_stream = __toESM(require_stream(), 1);
var import_extension = __toESM(require_extension(), 1);
var import_permessage_deflate = __toESM(require_permessage_deflate(), 1);
var import_receiver = __toESM(require_receiver(), 1);
var import_sender = __toESM(require_sender(), 1);
var import_subprotocol = __toESM(require_subprotocol(), 1);
var import_websocket = __toESM(require_websocket(), 1);
var import_websocket_server = __toESM(require_websocket_server(), 1);

// src/L3_periphery/lan/lan-transport.ts
var LOCAL_PAIRING = "/local-pairing";
var LOOPBACK_NAMES = ["localhost", "127.0.0.1"];
var MAX_MESSAGE_BYTES = 16 * 1024 * 1024;
var MAX_PENDING_LINKS = 8;
var PENDING_GRACE_MS = 1e3;
var REQUEST_TIMEOUT_MS2 = 1e4;
var CHECK_INTERVAL_MS2 = 1e3;
var TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".woff2": "font/woff2"
};
function toBytes(data) {
  if (Array.isArray(data)) return Buffer.concat(data);
  return data instanceof ArrayBuffer ? new Uint8Array(data) : data;
}
var ignore = () => void 0;
var LanLink = class {
  constructor(socket) {
    this.socket = socket;
    socket.on("message", (data, isBinary) => {
      if (!isBinary) {
        if (new TextDecoder().decode(toBytes(data)) === RELAY_PING) {
          if (socket.readyState === import_websocket.default.OPEN) socket.send(RELAY_PONG);
          return;
        }
        this.close(CLOSE_PROTOCOL, "binary frames only");
        return;
      }
      this.message(toBytes(data));
    });
    socket.on("close", () => this.end());
    socket.on("error", () => socket.terminate());
  }
  socket;
  message = ignore;
  end = ignore;
  send(data) {
    if (this.socket.readyState === import_websocket.default.OPEN) this.socket.send(data);
  }
  close(code, reason) {
    this.socket.close(code, reason);
  }
  onMessage(handler) {
    this.message = handler;
  }
  onClose(handler) {
    this.end = handler;
  }
};
var LanTransport = class {
  constructor(options) {
    this.options = options;
    this.appDir = resolve(options.appDir);
  }
  options;
  server = null;
  sockets = null;
  appDir;
  // Links that may still be unauthenticated. The Link port does not say when the channel accepts
  // one, but the channel closes the others by its deadline, so a link still open after it is a
  // phone; one the channel is closing stays counted until the socket is really gone.
  pending = /* @__PURE__ */ new Set();
  async start(accept) {
    const serveFile = (req, res) => this.serve(req, res);
    const timeout = this.options.timeoutMs ?? REQUEST_TIMEOUT_MS2;
    const limits = {
      requestTimeout: timeout,
      headersTimeout: timeout,
      connectionsCheckingInterval: Math.min(CHECK_INTERVAL_MS2, timeout)
    };
    const server = this.options.tls ? createHttps(
      { ...limits, cert: this.options.tls.cert, key: this.options.tls.key },
      serveFile
    ) : createHttp(limits, serveFile);
    server.timeout = timeout;
    const sockets = new import_websocket_server.default({
      server,
      path: "/ws",
      maxPayload: MAX_MESSAGE_BYTES,
      verifyClient: (info, done) => {
        if (!this.sameOrigin(info.req)) done(false, 403, "forbidden");
        else if (this.pending.size >= (this.options.maxPending ?? MAX_PENDING_LINKS)) {
          done(false, 503, "busy");
        } else done(true);
      }
    });
    sockets.on("connection", (socket) => {
      this.track(socket);
      accept(new LanLink(socket));
    });
    sockets.on("error", ignore);
    this.server = server;
    this.sockets = sockets;
    await new Promise((done, fail) => {
      server.once("error", (err) => {
        fail(
          err.code === "EADDRINUSE" ? new Error(
            "port " + this.options.port + " is already in use; is remote-sheep already running?" + (this.options.busyHint ? " Or " + this.options.busyHint + "." : "")
          ) : err
        );
      });
      server.listen(this.options.port, "0.0.0.0", () => done());
    });
  }
  async stop() {
    this.pending.clear();
    for (const client of this.sockets?.clients ?? []) client.terminate();
    this.sockets?.close();
    await new Promise((done) => this.server ? this.server.close(() => done()) : done());
    this.server = null;
    this.sockets = null;
  }
  port() {
    return this.server?.address()?.port ?? 0;
  }
  track(socket) {
    this.pending.add(socket);
    const release = () => this.pending.delete(socket);
    socket.once("close", release);
    const timer = setTimeout(
      () => {
        if (socket.readyState === import_websocket.default.OPEN) release();
      },
      this.options.pendingMs ?? AUTH_TIMEOUT_MS + PENDING_GRACE_MS
    );
    socket.once("close", () => clearTimeout(timer));
  }
  /**
   * A browser always sends its page's Origin, and the phone dials the host that served it, so a
   * legitimate page has the Host it was served from (also behind the Angular dev proxy, which
   * keeps the Host). Native clients and the relay send no Origin and are let through.
   */
  sameOrigin(req) {
    const origin = req.headers.origin;
    if (origin === void 0) return true;
    try {
      const url = new URL(origin);
      return (url.protocol === "http:" || url.protocol === "https:") && url.host === req.headers.host;
    } catch {
      return false;
    }
  }
  serve(req, res) {
    const notFound = () => {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("not found");
    };
    if (this.options.localInvite && req.method === "POST" && req.url === LOCAL_PAIRING) {
      this.pairLocally(req, res, this.options.localInvite);
      return;
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      notFound();
      return;
    }
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
    } catch {
      notFound();
      return;
    }
    const wanted = pathname === "/" ? "/index.html" : pathname;
    const file = resolve(this.appDir, "." + wanted);
    if (!file.startsWith(this.appDir + sep)) {
      notFound();
      return;
    }
    let body;
    try {
      body = readFileSync4(file);
    } catch {
      notFound();
      return;
    }
    const hashed = /[.-][A-Za-z0-9_-]{8,}\.(js|css)$/.test(file);
    res.writeHead(200, {
      "content-type": TYPES[extname(file)] ?? "application/octet-stream",
      "cache-control": hashed ? "public, max-age=31536000, immutable" : "no-store",
      "x-content-type-options": "nosniff",
      ...SECURITY_HEADERS
    });
    res.end(req.method === "HEAD" ? void 0 : body);
  }
  /** Refusals say nothing about why and make no invite, so the live QR stays valid. */
  pairLocally(req, res, invite) {
    if (!this.fromThisPcPage(req)) {
      res.writeHead(403).end();
      return;
    }
    res.writeHead(200, {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff"
    });
    res.end(JSON.stringify({ invite: invite() }));
  }
  fromThisPcPage(req) {
    if (!isLoopbackAddress(req.socket.remoteAddress)) return false;
    const host = req.headers.host;
    const own = LOOPBACK_NAMES.map((name) => name + ":" + String(this.port()));
    if (host === void 0 || !own.includes(host)) return false;
    const scheme = this.options.tls ? "https://" : "http://";
    if (req.headers.origin !== scheme + host) return false;
    const site = req.headers["sec-fetch-site"];
    return site === void 0 || site === "same-origin";
  }
};

// src/L3_periphery/lan/tcp-port-probe.ts
import { connect, createServer as createServer2 } from "node:net";
var ADDRESSES = ["0.0.0.0", "127.0.0.1", "::1"];
var CONNECT_TIMEOUT_MS = 500;
function bind(port, host) {
  const server = createServer2();
  return new Promise((resolve2) => {
    server.once("error", (err) => {
      const absent = err.code === "EADDRNOTAVAIL" || err.code === "EAFNOSUPPORT";
      resolve2(absent ? "absent" : "busy");
    });
    server.listen({ port, host, exclusive: true }, () => server.close(() => resolve2("free")));
  });
}
function answers(port, host) {
  return new Promise((resolve2) => {
    const socket = connect({ port, host });
    const done = (listening) => {
      socket.destroy();
      resolve2(listening);
    };
    socket.setTimeout(CONNECT_TIMEOUT_MS, () => done(false));
    socket.once("connect", () => done(true));
    socket.once("error", () => done(false));
  });
}
var TcpPortProbe = class {
  async isFree(port) {
    for (const host of ADDRESSES) {
      if (await bind(port, host) === "busy") return false;
    }
    for (const host of ["127.0.0.1", "::1"]) {
      if (await answers(port, host)) return false;
    }
    return true;
  }
};

// src/L3_periphery/pairing/qr-pairing-offers.ts
var import_qrcode2 = __toESM(require_lib(), 1);
var QrPairingOffers = class {
  constructor(pairings) {
    this.pairings = pairings;
  }
  pairings;
  async offerPairing() {
    const pairing = this.pairings.newPairing();
    const first = pairing.links[0];
    if (!first) throw new Error("the agent has no address to pair from");
    return {
      links: [...pairing.links],
      expiresAt: pairing.expiresAt,
      qr: await import_qrcode2.default.toString(first.url, { type: "svg", margin: 2 })
    };
  }
};

// src/L3_periphery/push/web-push-sender.ts
var TTL_SECONDS = 86400;
var TIMEOUT_MS = 15e3;
var WebPushSender = class {
  constructor(options) {
    this.options = options;
  }
  options;
  /** subject: the `sub` claim, how the push service can reach whoever runs this agent. */
  async send(subscription, payload, subject) {
    const endpoint = new URL(subscription.endpoint);
    if (endpoint.protocol !== "https:" && !this.options.allowInsecure) {
      throw new Error("push endpoint must be https");
    }
    const p256dh = decodeBase64Url(subscription.p256dh);
    const auth = decodeBase64Url(subscription.auth);
    if (!p256dh || !auth) throw new Error("push subscription keys are not base64url");
    const body = encryptPayload({
      plaintext: new TextEncoder().encode(payload),
      p256dh,
      auth
    });
    const now = this.options.now ?? Date.now;
    const response = await (this.options.fetch ?? fetch)(endpoint, {
      method: "POST",
      headers: {
        Authorization: vapidAuthorization(
          this.options.vapid,
          subscription.endpoint,
          subject,
          now()
        ),
        TTL: String(TTL_SECONDS),
        "Content-Encoding": "aes128gcm",
        "Content-Type": "application/octet-stream",
        Urgency: "high"
      },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    await response.body?.cancel();
    if (response.status === 201 || response.status === 202) return "sent";
    if (response.status === 404 || response.status === 410) return "gone";
    throw new Error("push service answered " + String(response.status));
  }
};

// src/L3_periphery/relay/relay-settings.ts
function parseRelaySettings(url, code) {
  const rawUrl = url?.trim() ?? "";
  const rawCode = code?.trim() ?? "";
  if (!rawUrl && !rawCode) return null;
  if (!rawUrl) throw new Error("REMOTE_SHEEP_RELAY_CODE is set but REMOTE_SHEEP_RELAY is not");
  if (!rawCode) throw new Error("REMOTE_SHEEP_RELAY is set but REMOTE_SHEEP_RELAY_CODE is not");
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("REMOTE_SHEEP_RELAY must be an http(s) URL, got: " + rawUrl);
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("REMOTE_SHEEP_RELAY must be an http(s) URL, got: " + rawUrl);
  }
  return { url: parsed.origin, code: rawCode };
}
function relayPushWarning(settings) {
  if (!settings?.url.startsWith("http://")) return null;
  return "REMOTE_SHEEP_RELAY is http: notifications need an https relay, push services may refuse this one";
}

// src/L3_periphery/relay/relay-settings-file.ts
import { readFileSync as readFileSync5 } from "node:fs";
import { mkdir as mkdir8, rename as rename4, rm as rm4, writeFile as writeFile8 } from "node:fs/promises";
import { dirname as dirname7 } from "node:path";
var hasCode5 = (error, code) => error instanceof Error && "code" in error && error.code === code;
async function saveRelaySettingsFile(file, url, code) {
  const settings = parseRelaySettings(url, code);
  if (!settings) throw new Error("a relay URL and an access code are required");
  await mkdir8(dirname7(file), { recursive: true, mode: 448 });
  const temp = file + "." + String(process.pid) + ".tmp";
  try {
    await writeFile8(temp, JSON.stringify(settings) + "\n", { encoding: "utf8", mode: 384 });
    await rename4(temp, file);
  } catch (error) {
    await rm4(temp, { force: true });
    throw error;
  }
  return settings;
}
function loadRelaySettingsFile(file) {
  let text;
  try {
    text = readFileSync5(file, "utf8");
  } catch (error) {
    if (hasCode5(error, "ENOENT")) return null;
    throw error;
  }
  const damaged2 = () => {
    throw new Error("damaged relay settings " + file + " (fix it, or `remote-sheep relay off`)");
  };
  let json2;
  try {
    json2 = JSON.parse(text);
  } catch {
    return damaged2();
  }
  const fields = typeof json2 === "object" && json2 !== null ? json2 : {};
  const { url, code } = fields;
  if (typeof url !== "string" || typeof code !== "string") return damaged2();
  try {
    return parseRelaySettings(url, code) ?? damaged2();
  } catch {
    return damaged2();
  }
}
async function removeRelaySettingsFile(file) {
  try {
    await rm4(file);
    return true;
  } catch (error) {
    if (hasCode5(error, "ENOENT")) return false;
    throw error;
  }
}
function relayVariablesSet(env) {
  return Boolean(env["REMOTE_SHEEP_RELAY"]?.trim() || env["REMOTE_SHEEP_RELAY_CODE"]?.trim());
}
function resolveRelaySettings(file, env) {
  if (relayVariablesSet(env)) {
    return parseRelaySettings(env["REMOTE_SHEEP_RELAY"], env["REMOTE_SHEEP_RELAY_CODE"]);
  }
  return loadRelaySettingsFile(file);
}
function maskCode(code) {
  return code.slice(0, 2) + "\u2026";
}

// src/L3_periphery/relay/file-saved-relay.ts
var FileSavedRelay = class {
  constructor(file) {
    this.file = file;
  }
  file;
  async save(setting) {
    await saveRelaySettingsFile(this.file, setting.url, setting.code);
  }
  async forget() {
    await removeRelaySettingsFile(this.file);
  }
};

// src/L3_periphery/relay/relay-transport.ts
var MAX_MESSAGE_BYTES2 = 16 * 1024 * 1024;
var DEFAULT_PING_MS = 3e4;
var DEFAULT_BACKOFF_INITIAL_MS = 1e3;
var DEFAULT_BACKOFF_MAX_MS = 3e4;
var toBytes2 = (data) => Array.isArray(data) ? Buffer.concat(data) : data instanceof ArrayBuffer ? new Uint8Array(data) : data;
var ignore2 = () => void 0;
var RelayLink = class {
  constructor(sendEnvelope, stream, release) {
    this.sendEnvelope = sendEnvelope;
    this.stream = stream;
    this.release = release;
  }
  sendEnvelope;
  stream;
  release;
  message = ignore2;
  end = ignore2;
  ended = false;
  send(data) {
    if (this.ended) return;
    this.sendEnvelope(encodeRelayEnvelope({ kind: "data", stream: this.stream, data }));
  }
  close(code, reason) {
    if (this.ended) return;
    this.sendEnvelope(encodeRelayEnvelope({ kind: "close", stream: this.stream, code, reason }));
    this.finish();
  }
  onMessage(handler) {
    this.message = handler;
  }
  onClose(handler) {
    this.end = handler;
  }
  /** The relay delivered a sealed frame from the phone. */
  receive(data) {
    if (!this.ended) this.message(data);
  }
  /** The phone left, or the relay socket dropped. */
  finish() {
    if (this.ended) return;
    this.ended = true;
    this.release();
    this.end();
  }
};
var RelayTransport = class {
  constructor(options) {
    this.options = options;
    this.pingIntervalMs = options.pingIntervalMs ?? DEFAULT_PING_MS;
    this.backoffInitialMs = options.backoffInitialMs ?? DEFAULT_BACKOFF_INITIAL_MS;
    this.backoffMaxMs = options.backoffMaxMs ?? DEFAULT_BACKOFF_MAX_MS;
    this.delayMs = this.backoffInitialMs;
  }
  options;
  accept = ignore2;
  socket = null;
  links = /* @__PURE__ */ new Map();
  stopped = true;
  retryTimer = null;
  pingTimer = null;
  delayMs;
  warnedText = false;
  refused = false;
  pingIntervalMs;
  backoffInitialMs;
  backoffMaxMs;
  start(accept) {
    this.accept = accept;
    this.stopped = false;
    this.connect();
    return Promise.resolve();
  }
  stop() {
    this.stopped = true;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;
    this.stopPing();
    const socket = this.socket;
    this.socket = null;
    if (socket) {
      socket.removeAllListeners("close");
      socket.on("error", ignore2);
      socket.terminate();
    }
    this.endLinks();
    return Promise.resolve();
  }
  log(message2) {
    this.options.log?.(message2);
  }
  connect() {
    const url = this.options.url.replace(/^http/, "ws") + "/agent/" + this.options.room;
    const socket = new import_websocket.default(url, {
      headers: { authorization: "Bearer " + this.options.code },
      maxPayload: MAX_MESSAGE_BYTES2
    });
    this.socket = socket;
    socket.on("open", () => {
      this.delayMs = this.backoffInitialMs;
      this.warnedText = false;
      this.startPing(socket);
      this.options.onState?.("connected");
    });
    socket.on("message", (data, isBinary) => {
      if (isBinary) this.receive(toBytes2(data));
      else this.receiveText(new TextDecoder().decode(toBytes2(data)));
    });
    let answered = false;
    socket.on("unexpected-response", (_request, response) => {
      answered = true;
      response.resume();
      const status = response.statusCode ?? 0;
      if (status === 403) this.refused = true;
      else this.log("relay answered HTTP " + String(status));
      this.options.onProblem?.(status === 403 ? { kind: "refused" } : { kind: "status", status });
      socket.terminate();
    });
    socket.on("error", (err) => {
      this.log("relay connection error: " + err.message);
      if (!answered) this.options.onProblem?.({ kind: "unreachable", message: err.message });
    });
    socket.on("close", () => this.dropped(socket));
  }
  receive(bytes) {
    const envelope = decodeRelayEnvelope(bytes);
    if (!envelope) return;
    if (envelope.kind === "open") {
      if (this.links.has(envelope.stream)) return;
      const link = new RelayLink(
        (out) => this.sendBytes(out),
        envelope.stream,
        () => this.links.delete(envelope.stream)
      );
      this.links.set(envelope.stream, link);
      this.accept(link);
    } else if (envelope.kind === "data") {
      this.links.get(envelope.stream)?.receive(envelope.data);
    } else {
      this.links.get(envelope.stream)?.finish();
    }
  }
  receiveText(text) {
    if (text === RELAY_PONG || this.warnedText) return;
    this.warnedText = true;
    this.log("relay sent unexpected text and it was ignored: " + text.slice(0, 40));
  }
  sendBytes(bytes) {
    if (this.socket?.readyState === import_websocket.default.OPEN) this.socket.send(bytes);
  }
  startPing(socket) {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      if (socket.readyState === import_websocket.default.OPEN) socket.send(RELAY_PING);
    }, this.pingIntervalMs);
  }
  stopPing() {
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.pingTimer = null;
  }
  endLinks() {
    for (const link of [...this.links.values()]) link.finish();
    this.links.clear();
  }
  dropped(socket) {
    if (this.socket !== socket) return;
    this.socket = null;
    this.stopPing();
    this.endLinks();
    this.options.onState?.("disconnected");
    if (this.stopped) return;
    if (this.refused) {
      this.log("the relay refused this agent: check the access code");
      return;
    }
    const wait = this.delayMs;
    this.delayMs = Math.min(this.delayMs * 2, this.backoffMaxMs);
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      if (!this.stopped) this.connect();
    }, wait);
  }
};

// src/L3_periphery/relay/websocket-relay-dialer.ts
function describeRelayProblem(problem) {
  switch (problem.kind) {
    case "refused":
      return "The relay refused the access code: it is wrong, withdrawn, or this computer's room belongs to another code. Set the relay again with the right code.";
    case "status":
      return "The relay answered HTTP " + String(problem.status) + " instead of connecting. The agent keeps trying.";
    case "unreachable":
      return "Cannot reach the relay (" + problem.message + "). The agent keeps trying.";
  }
}
var WebSocketRelayDialer = class {
  constructor(options) {
    this.options = options;
  }
  options;
  transport = null;
  open = false;
  trouble = null;
  /** Whoever waits for the first outcome of the current dial. */
  waiters = [];
  async dial(setting) {
    await this.hangUp();
    const log = this.options.log;
    const transport = new RelayTransport({
      url: setting.url,
      code: setting.code,
      room: this.options.room,
      ...log ? { log } : {},
      onState: (state) => {
        if (this.transport !== transport) return;
        this.open = state === "connected";
        if (this.open) this.trouble = null;
        log?.("relay " + state + " (" + setting.url + ")");
        if (this.open) this.wake();
      },
      onProblem: (problem) => {
        if (this.transport !== transport) return;
        this.trouble = describeRelayProblem(problem);
        this.wake();
      }
    });
    this.transport = transport;
    await transport.start(this.options.accept);
  }
  settled(withinMs) {
    const outcome = () => ({ connected: this.open, problem: this.trouble });
    if (!this.transport || this.open || this.trouble !== null) return Promise.resolve(outcome());
    return new Promise((resolve2) => {
      const done = () => {
        clearTimeout(timer);
        this.waiters = this.waiters.filter((waiter) => waiter !== done);
        resolve2(outcome());
      };
      const timer = setTimeout(done, withinMs);
      this.waiters.push(done);
    });
  }
  async hangUp() {
    const transport = this.transport;
    this.transport = null;
    this.open = false;
    this.trouble = null;
    this.wake();
    await transport?.stop();
  }
  connected() {
    return this.open;
  }
  problem() {
    return this.trouble;
  }
  wake() {
    for (const waiter of [...this.waiters]) waiter();
  }
};

// src/config.ts
import { existsSync as existsSync3 } from "node:fs";
import { homedir } from "node:os";
import { join as join5 } from "node:path";

// src/L3_periphery/files/agent-home.ts
import { join as join4 } from "node:path";
function agentHome(env, userHome) {
  return env["REMOTE_SHEEP_HOME"] || env["HERDR_PLUGIN_STATE_DIR"] || join4(userHome, ".remote-sheep");
}

// src/config.ts
if (existsSync3(".env")) process.loadEnvFile(".env");
var home = agentHome(process.env, homedir());
var relayFile = join5(home, "relay.json");
var relay = resolveRelaySettings(relayFile, process.env);
var claudeHome = join5(homedir(), ".claude");
var config = {
  /** The PORT variable as typed, which overrides the saved port; checked by `portFromVariable`. */
  portVariable: process.env["PORT"],
  /** The port saved by the first start or `remote-sheep port <n>`. */
  portFile: join5(home, "port.json"),
  herdr: herdrExecutable(process.env, process.platform),
  /** Started by the Herdr plugin, so it can update itself from the app. */
  plugin: runsAsPlugin(process.env),
  /** null when no relay is configured. */
  relay,
  /** True when the variables set the relay: then only they change it, not the app or the pane. */
  relayFixed: relayVariablesSet(process.env),
  home,
  relayFile,
  settingsFile: join5(home, "settings.json"),
  /** The running agent's loopback control port and secret, for `remote-sheep qr`. */
  controlFile: join5(home, "control.json"),
  agentKeyFile: join5(home, "agent-key.json"),
  vapidFile: join5(home, "vapid.json"),
  devicesFile: join5(home, "devices.json"),
  certFile: join5(home, "cert.pem"),
  keyFile: join5(home, "key.pem"),
  uploadsDir: join5(home, "uploads"),
  maxUploadBytes: 12 * 1024 * 1024,
  claudeSessionsDir: join5(claudeHome, "sessions"),
  claudeProjectsDir: join5(claudeHome, "projects"),
  // A single turn can carry very large tool results, so a small window would
  // reach back only a message or two.
  tailBytes: 2 * 1024 * 1024,
  maxMessages: 40,
  listIntervalMs: 2e3,
  terminalIntervalMs: 1500,
  debounceMs: 150,
  // How often open phones are re-checked: under the 5 s promised for a revocation,
  // with room for reading the devices file.
  pairingCheckIntervalMs: 4e3
};

// src/main.ts
function lanAddresses() {
  return Object.values(networkInterfaces()).flat().flatMap((i) => i?.family === "IPv4" && !i.internal ? [i.address] : []);
}
var clock = { now: () => Date.now() };
var random = { bytes: (length) => new Uint8Array(randomBytes9(length)) };
async function createPushNotifier(registry, relay2, agentId, log) {
  const vapid = await loadVapidKeys(config.vapidFile);
  return new PushNotifier({
    registry,
    sender: new WebPushSender({ vapid }),
    relay: relay2,
    clock,
    publicKey: encodeBase64Url(vapid.publicKey),
    agentId,
    log
  });
}
async function serve(registry, background) {
  const keys = await loadAgentKeyPair(config.agentKeyFile);
  const shells = await loadShellSetting(config.settingsFile);
  const pairing = new PairingService({ registry, clock, random, agentKey: keys.publicKey });
  const tls = existsSync4(config.certFile) && existsSync4(config.keyFile) ? { cert: readFileSync6(config.certFile), key: readFileSync6(config.keyFile) } : void 0;
  const log = (message2) => console.error(message2);
  const dialer = new WebSocketRelayDialer({
    room: publicKeyId(keys.publicKey),
    accept: (link) => {
      channel.accept(link);
    },
    log
  });
  const relay2 = new RelaySwitch({
    saved: new FileSavedRelay(config.relayFile),
    dialer,
    initial: config.relay,
    fixed: config.relayFixed
  });
  const pushWarning = relayPushWarning(config.relay);
  if (pushWarning) log(pushWarning);
  const push = await createPushNotifier(registry, relay2, publicKeyId(keys.publicKey), log);
  const plugin = config.plugin ? new HerdrPluginUpdates(herdrCommand(config.herdr)) : null;
  const updates = new AgentUpdater({
    version: package_default.version,
    plugin,
    restartDelayMs: 3e3,
    log
  });
  const variable = portFromVariable(config.portVariable);
  const savedPort = new FileSavedPort(config.portFile);
  const probe = new TcpPortProbe();
  const chosen = await chooseListenPort({ variable, saved: savedPort, probe });
  const { port, source } = chosen;
  const portChanger = new PortChanger({
    current: chosen,
    variable,
    saved: savedPort,
    probe,
    restart: plugin && (() => plugin.restart()),
    restartDelayMs: 1e3,
    log
  });
  const scheme = tls ? "https" : "http";
  const links = new PairingLinks(
    {
      relay: () => relay2.origin(),
      network: lanAddresses().map((address) => scheme + "://" + address + ":" + String(port)),
      local: scheme + "://127.0.0.1:" + String(port)
    },
    pairing
  );
  const hub = new SessionHub({
    multiplexer: new HerdrMultiplexer(herdrRunner(config.herdr)),
    transcripts: new ClaudeTranscripts({
      sessionsDir: config.claudeSessionsDir,
      projectsDir: config.claudeProjectsDir,
      tailBytes: config.tailBytes,
      maxMessages: config.maxMessages
    }),
    uploads: new FileUploadStore(config.uploadsDir, config.maxUploadBytes),
    devices: pairing,
    listIntervalMs: config.listIntervalMs,
    terminalIntervalMs: config.terminalIntervalMs,
    debounceMs: config.debounceMs,
    shells,
    notifier: push,
    push,
    relay: relay2,
    updates,
    pairing: new QrPairingOffers(links),
    port: portChanger,
    log
  });
  relay2.onChange(() => {
    hub.notifierChanged();
  });
  const channel = new SecureChannel({
    keys,
    pairing,
    version: package_default.version,
    events: hub,
    checkIntervalMs: config.pairingCheckIntervalMs,
    log
  });
  const transport = new LanTransport({
    port,
    appDir: join6(dirname8(fileURLToPath(import.meta.url)), "app"),
    tls,
    busyHint: busyPortHint(source),
    // The app page opened in this PC's browser pairs it with no QR (loopback only).
    localInvite: () => encodeInvite(pairing.createInvite())
  });
  await transport.start((link) => channel.accept(link));
  await relay2.start();
  const interactive = !background && process.stdin.isTTY;
  const control = new HttpControlServer(links, { relay: relay2 });
  await saveControlFile(config.controlFile, {
    port: await control.start(),
    secret: control.secret
  });
  const printInvite = async () => {
    console.log("");
    console.log(await describePairing(links.newPairing()));
    if (interactive) console.log("Press Enter for a new QR code (the previous one stops working).");
  };
  console.log(
    "remote-sheep " + package_default.version + " is listening on port " + String(port) + " over " + scheme
  );
  console.log(
    "Open " + scheme + "://localhost:" + String(port) + " in a browser on this PC to use it there."
  );
  if (!tls) {
    console.log("Serving over plain http: frames are end-to-end encrypted, but someone on this");
    console.log("network could alter the page itself. Put cert.pem and key.pem in " + config.home);
    console.log("to serve over https.");
  }
  console.log(
    shells.enabled() ? "Consoles are on: paired phones can open a shell here and run any command. Turn them off in the app, under Settings." : "Consoles are off. Turn them on in the app, under Settings."
  );
  console.log("Paired phones: `remote-sheep devices`; unpair one: `remote-sheep revoke <id>`.");
  console.log(background ? "Stop with `remote-sheep stop`." : "Stop with Ctrl+C.");
  if (background) console.log(BACKGROUND_PAIRING_HINT);
  else await printInvite();
  if (interactive) {
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", () => {
      printInvite().catch((err) => {
        log("could not print a QR code: " + String(err));
      });
    });
  }
  const shutdown = async () => {
    hub.stop();
    await control.stop();
    await removeControlFile(config.controlFile, control.secret);
    await dialer.hangUp();
    await transport.stop();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
}
var RESTART = "Restart the agent to use it: `remote-sheep stop`, then `remote-sheep start` (or restart Herdr).";
function backgroundAgent() {
  return new BackgroundAgent({
    dir: config.home,
    // The built bundle starts itself again, from its data folder: a plugin's working folder
    // on Windows is a \\?\ path that Node cannot resolve modules from.
    processes: nodeAgentProcesses(fileURLToPath(import.meta.url), config.home),
    // Run as the plugin, the outcome shows in Herdr too: an action's output is easy to miss.
    ...config.plugin ? { announce: herdrAnnouncer(herdrCommand(config.herdr)) } : {}
  });
}
async function main() {
  const command = parseArguments(process.argv.slice(2));
  const registry = new FileDeviceRegistry(config.devicesFile);
  switch (command.kind) {
    case "help":
      console.log(USAGE);
      return;
    case "error":
      console.error("remote-sheep: " + command.message + "\n\n" + USAGE);
      process.exitCode = 2;
      return;
    case "devices":
      console.log(formatDevices(await registry.list(), clock.now()));
      return;
    case "revoke":
      if (await registry.remove(command.id)) {
        console.log("Revoked " + command.id + ". A running agent disconnects it within 5 seconds.");
      } else {
        console.error("No paired phone has the id " + command.id + "; see `remote-sheep devices`.");
        process.exitCode = 1;
      }
      return;
    case "relay-set": {
      const saved = await saveRelaySettingsFile(config.relayFile, command.url, command.code);
      console.log("Relay saved: " + saved.url + ". From now on the agent connects through it.");
      return;
    }
    case "relay-show": {
      const saved = loadRelaySettingsFile(config.relayFile);
      console.log(
        saved ? "Relay: " + saved.url + " (code " + maskCode(saved.code) + ")" : "No relay set; the agent serves the local network only."
      );
      return;
    }
    case "relay-off":
      console.log(
        await removeRelaySettingsFile(config.relayFile) ? "Relay forgotten. The agent serves the local network only." : "No relay was set."
      );
      return;
    case "port-show": {
      const saved = await new FileSavedPort(config.portFile).load();
      const variable = portFromVariable(config.portVariable);
      console.log(describePort({ variable, saved, file: config.portFile }));
      const status = await backgroundAgent().status();
      if (status.kind === "running") console.log(status.message);
      return;
    }
    case "port-set": {
      const refusal = await refusePortChoice(
        command.port,
        new TcpPortProbe(),
        (await backgroundAgent().status()).port
      );
      if (refusal) {
        console.error(refusal);
        process.exitCode = 1;
        return;
      }
      await new FileSavedPort(config.portFile).save(command.port);
      console.log("Port " + String(command.port) + " saved. " + RESTART);
      if (presetListenPort(portFromVariable(config.portVariable), command.port)?.source === "variable") {
        console.log("PORT is set, though, and overrides it while it stays set.");
      }
      return;
    }
    case "port-auto":
      console.log(
        await new FileSavedPort(config.portFile).forget() ? "Saved port forgotten: the next start picks a free one and saves it. " + RESTART : "No port was saved; the next start picks a free one and saves it."
      );
      return;
    case "serve":
      await serve(registry, command.background);
      return;
    case "qr":
      await showPairingPrompt({
        request: async () => requestPairing({
          controlFile: config.controlFile,
          agentKey: await readAgentPublicKey(config.agentKeyFile)
        }),
        input: process.stdin,
        output: {
          clear: () => {
            console.clear();
          },
          print: (text) => {
            console.log(text);
          }
        }
      });
      return;
    case "relay-change": {
      const write = (text) => process.stdout.write(text);
      const questions = new TerminalQuestions(process.stdin, write);
      await showRelayPrompt({
        request: (change) => requestRelay({ controlFile: config.controlFile, ...change ? { change } : {} }),
        questions,
        print: (text) => {
          console.log(text);
        },
        waitToClose: async () => {
          if (process.stdin.isTTY) await questions.ask("Press Enter to close.", true);
        }
      });
      return;
    }
    case "start":
    case "restart": {
      const agent = backgroundAgent();
      const result = command.kind === "start" ? await agent.start() : await agent.restart();
      (result.kind === "failed" ? console.error : console.log)(result.message);
      if (result.kind === "failed") process.exitCode = 1;
      return;
    }
    case "stop":
      console.log((await backgroundAgent().stop()).message);
      return;
    case "status":
      console.log((await backgroundAgent().status()).message);
      return;
  }
}
main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
/*! Bundled license information:

@noble/curves/utils.js:
@noble/curves/abstract/modular.js:
@noble/curves/abstract/curve.js:
@noble/curves/abstract/edwards.js:
@noble/curves/abstract/montgomery.js:
@noble/curves/ed25519.js:
  (*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@noble/ciphers/utils.js:
  (*! noble-ciphers - MIT License (c) 2023 Paul Miller (paulmillr.com) *)
*/
