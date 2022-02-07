// Meant to target 1.6.0

declare module "ssh2" {
  import EventEmitter from "events"
  import { Server, Socket as NetServer } from "net";
  import { KeyObject } from "crypto"
  import { CryptoKey } from "webcrypto"
  import { Duplex, Readable } from "stream";

  type TYPE_UNKNOWN_VALUE = any;
  type TYPE_UNKNOWN_FN = (...args: any[])=>any

  export const AgentProtocol: TYPE_UNKNOWN_VALUE
  export const BaseAgent: TYPE_UNKNOWN_VALUE
  export const createAgent: TYPE_UNKNOWN_VALUE
  export const CygwinAgent: TYPE_UNKNOWN_VALUE
  export const HTTPAgent: TYPE_UNKNOWN_VALUE
  export const HTTPSAgent: TYPE_UNKNOWN_VALUE
  export const OpenSSHAgent: TYPE_UNKNOWN_VALUE
  export const PageantAgent: TYPE_UNKNOWN_VALUE
  export const utils = {
    parseKey: TYPE_UNKNOWN_VALUE,
    sftp: {
      flagsToString: TYPE_UNKNOWN_VALUE,
      OPEN_MODE: TYPE_UNKNOWN_VALUE,
      STATUS_CODE: TYPE_UNKNOWN_VALUE,
      stringToFlags: TYPE_UNKNOWN_VALUE
    }
  }

  type EnvAndX11 = {
    env: TYPE_UNKNOWN_VALUE,
    pty: true | TYPE_UNKNOWN_VALUE,
    x11: true | Partial<{
      cookie: string | Buffer
      protocol: string,
      screen: number,
      single: boolean
    }>
  }


  export class Client<C = {}>
    extends EventEmitter
  {
    on: (
      <T extends keyof C>(
        event: T, listener: C[T]
      )=>this
    ) & (
      <T extends keyof ClientListeners>(
        event: T, listener: ClientListeners[T]
      )=>this
    )
    addListener: (
      <T extends keyof C>(
        event: T, listener: C[T]
      )=>this
    ) & (
      <T extends keyof ClientListeners>(
        event: T, listener: ClientListeners[T]
      )=>this
    )
    emit: (
      <T extends keyof C>(
        event: T, ...args: Parameters<typeof C[T]>
      )=>this
    ) & (
      <T extends keyof ClientListeners>(
        event: T, ...args: Parameters<typeof ClientListeners[T]>
      )=>boolean
    )
    readonly config: ClientConnectConfig
    connect(connectConfig: ClientConnectConfig): this
    end(): void
    exec(
      command: string,
      callback: (err: void | any, channel: ClientChannel)=>any
    ): this
    exec(
      command: string,
      options: (
        Partial<EnvAndX11 & {
          pty: true | TYPE_UNKNOWN_VALUE,
        }>
      ),
      callback: (err: void | any, channel: ClientChannel)=>any
    ): this
    forwardIn(
      bindAddr: string,
      bindPort: number,
      cb: (err: Error | TYPE_UNKNOWN_VALUE, realPort: number)=>any
    ): this
    unforwardIn(
      bindAddr: number,
      bindPort: boolean,
      cb: (err: Error | TYPE_UNKNOWN_VALUE)=>any
    ): this
    forwardOut(
      srcIp: string, srcPort: number,
      destIp: string, destPort: number,
      callback: (err: any, channel: ClientChannel)=>any
    ): this
    openssh_forwardInStreamLocal(
      socketPath: string, callback: (e?: Error)=>any
    ): this
    openssh_forwardOutStreamLocal(
      socketPath: string, callback: (e?: Error, channel: ClientChannel)=>any
    ): this
    openssh_noMoreSessions(
      callback: (e?: Error)=>any
    ): this
    openssh_unforwardInStreamLocal(
      callback: (e?: Error)=>any
    ): this
    rekey(
      callback?: ()=>any
    ): this
    sftp(
      callback: (e?: Error, sftp: SFTP)=>any
    ): this
    shell(
      callback: (e?: Error, channel: ClientChannel)=>any
    ): this
    shell(
      options: Partial<EnvAndX11>,
      callback: (e?: Error, channel: ClientChannel)=>any
    ): this
    shell(
      window: false | Window ,
      options: Partial<EnvAndX11>,
      callback: (e?: Error, channel: ClientChannel)=>any
    ): this
    subsys(
      subsystem: string,
      callback: (e?: Error, channel: ClientChannel)=>any
    ): this
    unforwardIn(
      remoteAddress: string, remotePort: number, callback: (e?: Error)=>any
    ): this
  }

  interface ServerListeners {
    "connection": (client: Connection, info: {
      family: string,
      header: {
        identRaw: string,
        versions: {
          protocol: string,
          software: string
        },
        comments: string
      }
    })=>any
  }

  export class Server extends NetServer {
    constructor(config: {
      hostKeys: Array<(
        string | Buffer | {
          key: string|Buffer,
          passphrase: string
        }
      )>
    } & Partial<{
      algorithms: AlgorithmsConfig,
      banner: string,
      debug: (str: string)=>any,
      greeting: string,
      highWaterMark: number,
      ident: string
    }>, connectionListener?: ServerListeners.connection )
    on: NetServer.prototype.on & (
      <T extends keyof ClientListeners>(
        event: T, listener: ClientListeners[T]
      )=>Client
    );
    addListener: NetServer.prototype.on & (
      <T extends keyof ClientListeners>(
        event: T, listener: ClientListeners[T]
      )=>Client
    );
    injectSocket(socket: Duplex): Server
  }

  class Connection {

  }


  type KeyboardInteractiveListener = (
    name: string,
    instructions: string,
    instructionsLang: string,
    prompts: Array<{ prompt: string, echo: boolean }>,
    finish: (responses: Array<string>)=>any
  )=>any

  interface ClientListeners {
    'banner': (message: string, language: string)=>any
    'change password': (prompt: string, language: string)=>any
    'close': ()=>any
    'end': ()=>any
    'error': (e: Error)=>any
    'handshake': (negotiated: TypeEventResultHandshake)=>any
    'hostkeys': (keys: Array<ParsedKey>)=>any
    'keyboard-interactive': KeyboardInteractiveListener
    'ready': ()=>any
    'rekey': ()=>any
    'tcp connection': (
      details: {
        destIp: string,
        destPort: number,
        srcIp: string,
        srcPort: number
      },
      accept: ()=>Channel,
      reject: ()=>any
    )=>any
    'unix connection': (
      details: {
        sockPath: string
      },
      accept: ()=>Channel,
      reject: ()=>any
    )=>any
    'x11': (
      details: {
        srcIp: string,
        srcPort: number
      },
      accept: ()=>Channel,
      reject: ()=>any
    )=>any
  }

  type EventResultHandshake = {
    kex: string,
    srvHostKey: string,
    cs: {
      cipher: string,
      mac: string,
      compress: string,
      lang: string
    },
    sc: {
      cipher: string,
      mac: string,
      compress: string,
      lang: string
    }
  };

  type ConsumableByBuffer = string | ArrayBuffer | Buffer | TypedArray | DataView

  type ParsedKey = {
    comment: string,
    equals(otherKey: string | Buffer): boolean,
    getPrivatePEM(): string,
    getPublicPEM(): string,
    getPublicSSH(): string,
    isPrivateKey(): boolean,
    sign(data: string | Buffer | TypedArray | DataView): Buffer
    type: string
    verify(
      data: ConsumableByBuffer & KeyObject & CryptoKey & {
        dsaEncoding: string
        padding: number
        saltLength: number
      },
      signiture: ConsumableByBuffer
    ): boolean | Error
  }


  class ClientChannel
    extends Channel
    implements ExtendableListener<ClientChanneListeners>
  {
  }

  interface ClientChanneListeners {
    'exit': ()=>any
    'stderr': (
      stderr: Readable & {
        setWindow(
          rows: number, cols: number,
          height: number,width: number
        ): void,
        signal(
          signalName: (
              'ABRT' | 'ALRM' | 'FPE' | 'HUP'
            | 'ILL' | 'INT' | 'KILL' | 'PIPE'
            | 'QUIT' | 'SEGV' | 'TERM' | 'USR1' | 'USR2'
          )
        ): void
      }
    )=>any
  }

  class ServerChannel
    extends Channel
    implements ExtendableListener<ServerChannelListeners>
  {
  }

  interface ServerChannelListeners {
    'exit': (
      (
        (exitCode: number)=>any
      ) | (
        (
          signalName: string,
          coreDumpedOrErrorMsg?: string | boolean,
          errorMsg?: string
        )=>any
      )
    )
  }

  interface ChannelListeners {
    'close': ()=>any
  }

  class Channel extends Duplex {
    on: Duplex.prototype.on | (
      <T extends keyof ChannelListeners>(
        event: T, listener: ChannelListeners[T]
      )=>this
    );
    addListener: Duplex.prototype.on | (
      <T extends keyof ChannelListeners>(
        event: T, listener: ChannelListeners[T]
      )=>this
    );
  }

  type ClientConnectConfig = NeedUserConfig & AgentConfig & Partial<{
    host: string
    hostname: string
    hostHash: TYPE_UNKNOWN_VALUE
    hostVerifier: (hashkey: string, cb: (ret: boolean)=>any)=>void | boolean,
    port: number
    localAddress: string
    localPort: string
    localHostname: string
    localUsername: string
    forceIPv4: boolean
    forceIPv6: boolean
    keepaliveCountMax: number
    keepaliveInterval: number
    readyTimeout: number
    ident: string | Buffer
    algorithms: Partial<AlgorithmsConfig>
    password: string
    privateKey: string | Buffer
    passphrase: JSON_UNKNOWN
    tryKeyboard: boolean
    authHandler: AuthHandlerConfig,
    strictVendor: boolean
    debug: TYPE_UNKNOWN_FN
    sock: Duplex // Maybe a duplex is good enough
    timeout: number
  }>

  type NeedUserConfig = { username: string } | { user: string }
  type AgentConfig = (
    {} | {
      agent: string,
      agentForward?: boolean
    } | {
      agent: string | TYPE_UNKNOWN_VALUE,
      agentForward: true
      allowAgentFwd: true
    }
  )

  type AlgorithmsConfig = {
    cipher: (
      // Default list
        "chacha20-poly1305@openssh.com"
      | "aes128-gcm"
      | "aes128-gcm@openssh.com"
      | "aes256-gcm"
      | "aes256-gcm@openssh.com"
      | "aes128-ctr"
      | "aes192-ctr"
      | "aes256-ctr"
      // Other supported
      | "3des-cbc"
      | "aes256-cbc"
      | "aes192-cbc"
      | "aes128-cbc"
      | "arcfour256"
      | "arcfour128"
      | "arcfour"
      | "blowfish-cbc"
      | "cast128-cbc"
    ),
    compress: (
      "none"
      | "zlib@openssh.com"
      | "zlib"
    ),
    hmac: (
      // Default list
        "hmac-sha2-256-etm@openssh.com"
      | "hmac-sha2-512-etm@openssh.com"
      | "hmac-sha1-etm@openssh.com"
      | "hmac-sha2-256"
      | "hmac-sha2-512"
      | "hmac-sha1"
      // Other supported
      | "hmac-md5"
      | "hmac-sha2-256-96"
      | "hmac-sha2-512-96"
      | "hmac-ripemd160"
      | "hmac-sha1-96"
      | "hmac-md5-96"
    ),
    kex: (
      // (node v14.0.0+)
        "curve25519-sha256"
      | "curve25519-sha256@libssh.org"
      // Default list
      | "ecdh-sha2-nistp256"
      | "ecdh-sha2-nistp384"
      | "ecdh-sha2-nistp521"
      | "diffie-hellman-group-exchange-sha256"
      | "diffie-hellman-group14-sha256"
      | "diffie-hellman-group15-sha512"
      | "diffie-hellman-group16-sha512"
      | "diffie-hellman-group17-sha512"
      | "diffie-hellman-group18-sha512"
      // Other Supported
      | "diffie-hellman-group-exchange-sha1"
      | "diffie-hellman-group14-sha1"
      | "diffie-hellman-group1-sha1"
    )
    serverHostKey: (
      //  (node v12.0.0+)
        "ssh-ed25519"
      // Default list
      | "ecdsa-sha2-nistp256"
      | "ecdsa-sha2-nistp384"
      | "ecdsa-sha2-nistp521"
      | "rsa-sha2-512"
      | "rsa-sha2-256"
      | "ssh-rsa"
      // Other Supported
      | "ssh-dss"
    ),
  }

  type AuthHandlerConfig = (
    (
      (
        methodsLeft: null | Array<AuthHandlerMethod>,
        partialSuccess: null | boolean,
        callback: (method: string | AuthHandlerMethod)=>any
      )=>(void | string | AuthHandlerMethod)
    ) | Array<TYPE_UNKNOWN_VALUE>
  )

  type AuthHandlerMethod = (
    {
      type: 'none',
      username: string
    } | {
      type: 'password',
      username: string,
      password: string
    } | {
      type: 'publickey'
      username: string,
      // Note, passphrase is only needed when key is encrypted
      // Not sure how to add that to the type
      key: string | Buffer | ParsedKey,
      passphrase?: string,
    } | {
      type: 'hostbased'
      username: string,
      localHostname: string,
      localUsername: string,
      // Note, passphrase is only needed when key is encrypted
      // Not sure how to add that to the type
      key: string | Buffer | ParsedKey,
      passphrase?: string,
    } | {
      type: 'agent'
      username: string,
      // Can be a string that is interpreted exactly like the `agent`
      // connection config option or can be a custom agent
      // object/instance that extends and implements `BaseAgent`
      agent: string | AgentConfig,
    } | {
      type: 'keyboard-interactive'
      username: string,
      prompt: KeyboardInteractiveListener
    }
  )

  class TypedEmitter<C> extends EventEmitter {
    on: (
      <T extends keyof C>(
        event: T, listener: C[T]
      )=>this
    )
    addListener: (
      <T extends keyof C>(
        event: T, listener: C[T]
      )=>this

    )
    emit: (
      <T extends keyof C>(
        event: T, ...args: Parameters<typeof C[T]>
      )=>this
    )
  }

}
