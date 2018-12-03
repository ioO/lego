#! /usr/bin/env node

const fs = require('fs')
const { walkDir } = require('../lib/utils.js')
const { transpile } = require('../lib/transpile.js')
const config = require('../config.js')


const args = process.argv
const watchIndex = args.indexOf('-w')
const watch = watchIndex >= 0 && args.splice(watchIndex, 1)
const [source, target] = args.slice(2)

if(!source) throw new Error("first argument 'source' is required.")
if(!target) target = './components.js'

async function compile(source, target) {
  const filenames = await walkDir(source, ['html'])
  const components = filenames.map(f => transpile(f))
  const output = `
    import lego from '${config.libPath}'
    ${components.map(c => c.content).join('\n')}
    `.replace(/[ ]{2,}/g, ' ')
  fs.writeFileSync(target, output, 'utf8')
  return components.map(c => c.name)
}

async function build() {
  const names = await compile(source, target)
  return console.info(`${names.length} components were compiled into "${target}": ${names.join(', ')}.`)
}

build()

if (watch) {
  console.log(`Watching for changes in ${source}`)
  fs.watch(source, async (event, filename) => {
    await compile(source, target)
    console.info(`${filename} was recompiled!`)
  })
}

module.exports = { compile, build }