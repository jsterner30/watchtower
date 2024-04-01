import { getEnv, Cache, S3Writer, LocalWriter, Writer, initializeEnv } from './util'
import { Engine } from './engine'

async function run (): Promise<void> {
  await initializeEnv()
  const env = getEnv()
  let reportWriter: Writer = new S3Writer(env.bucketName)
  let cacheWriter: Writer = new S3Writer(env.bucketName)
  if (env.writeReportsLocally) {
    reportWriter = new LocalWriter()
  }
  if (env.writeCacheLocally) {
    cacheWriter = new LocalWriter()
  }

  const cache = new Cache(cacheWriter)
  await cache.setup()
  const engine = new Engine(cache, reportWriter)

  if (getEnv().useCache) {
    await engine.runWithCacheOnly()
  } else {
    await engine.run()
  }
}

void run()
