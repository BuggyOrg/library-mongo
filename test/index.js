import {runSpecTests} from '@buggyorg/library-specification'
import mongoose from 'mongoose'
import {serve} from '../src/api'
import {importJSON} from '../src/mongoLibrary'

const dbUrl = process.env.MONGO_URL || 'mongodb://localhost'

runSpecTests((dbContent) => {
  return serve(null, dbUrl)
    .then(({ app, db }) => {
      return importJSON(db, dbContent)
        .then(() => app)
    })
})
