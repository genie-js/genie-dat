const { inflateRaw } = require('zlib')
const assign = require('simple-assign')
const structures = require('./struct')
const { DatFile } = structures

function load (compressedBuffer, cb) {
  inflateRaw(compressedBuffer, (err, uncompressedBuffer) => {
    if (err) return cb(err)
    try {
      cb(null, DatFile(uncompressedBuffer))
    } catch (err) {
      cb(err)
    }
  })
}

function loadRaw (uncompressedBuffer, cb) {
  process.nextTick(() => {
    try {
      cb(null, DatFile(uncompressedBuffer))
    } catch (err) {
      cb(err)
    }
  })
}

module.exports = assign({ load, loadRaw }, structures)
