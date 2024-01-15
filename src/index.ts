import {getEnv, getOctokit} from './util'
import { Engine } from './engine'

async function run (): Promise<void> {
  const engine = new Engine(await getEnv(), await getOctokit())
  await engine.run()
}

void run()
