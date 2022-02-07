interface AKeyListener {
  [key: string]: Array<1|2>
}

const sym = Symbol("secret");
interface HelloWorldListeners extends AKeyListener {
  "hello": [1,2],
  "world": [1,2,2,2,1],
  [sym]: [3,4]
  1: [1,2]
}
