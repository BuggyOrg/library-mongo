import {runSpecTests} from '@buggyorg/library-specification'
import {serve} from '../src/restAPI'

const dbUrl = process.env.MONGO_URL || 'mongodb://localhost'

runSpecTests((dbContent) => {
  // TODO import dbContent and then return a promise
  return serve(dbUrl)
})
