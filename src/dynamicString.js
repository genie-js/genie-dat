const struct = require('awestruct')
const t = struct.types

module.exports = (sizeType) =>
  struct([
    ['size', sizeType],
    ['characters', t.char('size')]
  ]).map(
    // When reading, return the string only.
    r => r.characters,
    // When writing, turn a string into a size and characters field.
    string => ({
      size: string.length,
      characters: string
    })
  )
