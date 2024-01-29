import { getEnv, getOctokit, Cache, S3Writer, LocalWriter, Writer } from './util'
import { Engine } from './engine'

async function run (): Promise<void> {
  const env = await getEnv()
  let writer: Writer = new S3Writer(env.bucketName)
  if (env.writeFilesLocally) {
    writer = new LocalWriter()
  }
  const octokit = await getOctokit()
  const cache = new Cache(writer, env.useCache)
  const engine = new Engine(env, octokit, cache, writer)
  await engine.run()
}

void run()
