import { getEnv, Cache, S3Writer, LocalWriter, Writer, initializeEnv } from './util'
import { Engine } from './engine'

async function run (): Promise<void> {
  await initializeEnv()
  const env = getEnv()
  let writer: Writer = new S3Writer(env.bucketName)
  if (env.writeFilesLocally) {
    writer = new LocalWriter()
  }
  const cache = new Cache(writer, env.useCache)
  const engine = new Engine(env, cache, writer)
  await engine.run()
}

void run()
