import { getEnv, Cache, S3Writer, LocalWriter, Writer, initializeEnv } from './util'
import { Engine } from './engine'
import { logger } from './util/logger'

async function run (): Promise<void> {
  await initializeEnv()
  const env = getEnv()
  let reportWriter: Writer = new S3Writer(env.bucketName)
  let cacheWriter: Writer = new S3Writer(env.bucketName)
  if (env.writeReportsLocally) {
    logger.warn('WRITE_REPORTS_LOCALLY set to true, writing reports locally')
    reportWriter = new LocalWriter()
  }
  if (env.writeCacheLocally) {
    logger.info('WRITE_CACHE_LOCALLY set to true, writing repo cache locally')
    cacheWriter = new LocalWriter()
  }

  const cache = new Cache(cacheWriter)
  await cache.setup()
  const engine = new Engine(cache, reportWriter)

  if (getEnv().useCache) {
    logger.warn('Running watchtower with cache only')
    await engine.runWithCacheOnly()
  } else {
    await engine.run()
  }
}

void run()
