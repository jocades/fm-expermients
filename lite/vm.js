import vm from 'node:vm'

// evaluate a piece of js and retrieve the 'global' variables of that scope

const code = `
  const a = 1
  const b = 2
  const c = 3
`

const sandbox = {
  // a: 10,
  // b: 20,
  // c: 30,
}

const script = new vm.Script(code)
const context = vm.createContext({ ...sandbox })
await script.runInContext(context, { displayErrors: true })

console.log(context.a) // 10
console.log(context.b) // 20

console.log(context)
