const fs = require('fs')
const path = require('path')
const glob = require('glob').sync
const test = require('tape')
const { load } = require('../src')

const files = glob(path.join(__dirname, './fixtures/**/*.dat'))

const special = [
  [/\/hd_empires2_x2_p1\.dat$/, {
    version: 'african-kingdoms'
  }]
]

files.forEach((file) => {
  test(path.relative(__dirname, file), {
    // AoK does not yet work
    skip: /\/empires2\.dat$/.test(file)
  }, (t) => {
    t.plan(3)
    fs.readFile(file, (err, buf) => {
      t.ifError(err)
      const opts = special.reduce((acc, [name, opts]) => {
        if (acc) return acc
        if (name.test(file)) return opts
        return undefined
      }, undefined)

      load(buf, opts, (err, dat) => {
        t.ifError(err)
        t.ok(dat)
      })
    })
  })
})
