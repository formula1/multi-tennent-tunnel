

export type TypeUrlHost = {
  hostname: string,
  port: number
}

export type TypeSshLogin = (
  {
    username: string
    password?: string
    privateKey?: Buffer
  }
)
