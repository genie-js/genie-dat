const { inflateRaw } = require("zlib");
const assign = require("simple-assign");
const structures = require("./struct");
const { DatFile } = structures;

const versions = ["aok", "aoc", "african-kingdoms", "aoe2de", "swgb"];

function check(opts) {
  if (opts.version && versions.indexOf(opts.version) === -1) {
    throw new Error(`genie-dat: invalid version: ${opts.version}`);
  }
}

function load(compressedBuffer, opts = {}, cb) {
  if (typeof opts === "function") {
    cb = opts;
    opts = {};
  }
  check(opts);
  inflateRaw(compressedBuffer, (err, uncompressedBuffer) => {
    if (err) return cb(err);
    try {
      DatFile.version = opts.version || "aoc";
      cb(null, DatFile(uncompressedBuffer));
    } catch (err) {
      cb(err);
    } finally {
      DatFile.version = "aoc";
    }
  });
}

function loadRaw(uncompressedBuffer, opts = {}, cb) {
  if (typeof opts === "function") {
    cb = opts;
    opts = {};
  }
  check(opts);
  process.nextTick(() => {
    try {
      DatFile.version = opts.version || "aoc";
      cb(null, DatFile(uncompressedBuffer));
    } catch (err) {
      cb(err);
    } finally {
      DatFile.version = "aoc";
    }
  });
}

module.exports = assign({ load, loadRaw }, structures);
