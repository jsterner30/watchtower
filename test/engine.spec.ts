// // TODO: CREATE WORKING TESTS (AVA and Node 20 don't play nice with typescript)
//
// import test from 'ava'
// import { Engine } from '../src/engine'
// import { Writer, Environment, Cache } from '../src/util'
// import { getMockOctokit } from './util'
// import { Octokit } from '@octokit/rest'
// import * as sinon from "sinon";
// import {mock, when, instance, reset, anything, anyString} from 'ts-mockito'
//
//
// let engine: Engine
// let moctokit: Octokit
// const mockCache: Cache = mock(Cache)
// const mockWriter: Writer = mock(Writer)
// // let getEnvStub = sinon.stub(util, 'getEnv')
//
// const defaultEnvironment: Environment = {
//   bucketName: 'fakeBucket',
//   environmentName: 'dev',
//   githubOrg: 'fake-org',
//   githubToken: 'fakeToken',
//   showProgress: false,
//   staleDaysThreshold: 30,
//   useCache: false,
//   writeFilesLocally: false
// }
//
// test.beforeEach(t => {
//   reset()
//   moctokit = getMockOctokit()
// })
//
// test.serial('should not attempt to access cache if USE_CACHE set to false', async t => {
//   when(mockWriter.readFile(anyString(), anyString(), anyString())).thenResolve("{}")
//   when(mockWriter.readAllFilesInDirectory(anyString(), anyString(), anyString())).thenResolve({fake: "repo"})
//
//
//   engine = new Engine(defaultEnvironment, moctokit, mockCache, mockWriter)
//
//   // await engine.run()
//
// })
