# genie-dat

[![Greenkeeper badge](https://badges.greenkeeper.io/genie-js/genie-dat.svg)](https://greenkeeper.io/)

read and write age of empires .dat files

[Install](#install) - [Usage](#usage) - [Supported Formats](#supported-formats) -
[Limitations](#limitations) - [API](#api) - [License: LGPL-3](#license)

[![npm][npm-image]][npm-url]
[![travis][travis-image]][travis-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/genie-dat.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/genie-dat
[travis-image]: https://img.shields.io/travis/com/goto-bus-stop/genie-dat.svg?style=flat-square
[travis-url]: https://travis-ci.com/goto-bus-stop/genie-dat
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard

## Install

```
npm install genie-dat
```

## Usage

```js
var genieDat = require('genie-dat')
var buffer = require('fs').readFileSync('/path/to/empires2_x1_p1.dat')
genieDat.load(buffer, (err, dat) => {
  console.log(dat.civilizations.map(civ => civ.name))
})
```

## Supported Formats

The data file format differs slightly between game versions. Versions supported by this library are:

 - `aoc` - All AoC-style formats, such as `empires2_x1.dat` of AoC 1.0 and `empires2_x1_p1.dat` of AoC 1.0c (the most common version). UserPatch and UserPatch based mods like WololoKingdoms and Portuguese Civ Mod also use this format. HD Edition versions before 5.0 also use this format.
 - `african-kingdoms` - The release of African Kingdoms changed the file format slightly; HD Edition versions 5.0 and up use this format. Note that this is used regardless of whether the African Kingdoms DLC is actually installed.

## Limitations

Currently this library does not yet read the tech tree data.

Age of Kings, SWGB, and the AoE1 and AoE:DE files are not yet supported. The goal is to expand support for these formats in the future.

Parsing a large binary file like this is quite slow, it takes about 6 seconds on my machine. This is probably not inherent and just has to do with the way this library is implemented on top of [awestruct](https://github.com/goto-bus-stop/awestruct). Hopefully awestruct's performance can be improved in the future. You should cache the result if you need it often.

## API

### `genieDat.load(buffer, opts={}, cb)`

Decompress and load `buffer`, eg. a raw .dat file.

`opts` can be an object with properties:

 - `version` - A version string listed under [Supported Formats](#supported-formats). Defaults to `aoc`.

`cb` is a Node-style callback receiving `(err, dat)`.
`dat` is a plain object representing the dat file contents. `console.log()` it to find out what's in it. There is a lot of junk, some of the more useful properties are:

 - `playerColors` - Player colours, mostly offsets into the main [palette](https://github.com/goto-bus-stop/jascpal) file
 - `techs` - Technology effects
 - `terrains` - Lists terrains
 - `civilizations` - Lists available civilizations
   - `civilizations[i].objects` - Lists unit statistics for each civ
 - `researches` - Lists available researches—this refers to the technology effects a lot

### `genieDat.loadRaw(buffer, opts={}, cb)`

Load an already decompressed `buffer`. Use this if you manually did `zlib.inflateRaw` or got an uncompressed buffer through some other means. Otherwise it is identical to `genieDat.load`.

## License

This project is based heavily on [genieutils](https://github.com/Tapsa/genieutils) by apreiml and Tapsa, and on the [openage](https://github.com/sfttech/openage) [conversion script](https://github.com/sfttech/openage/tree/master/openage/convert/gamedata).

[LGPL-3](LICENSE)
