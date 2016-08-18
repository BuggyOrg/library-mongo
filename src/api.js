
import connectDatabase from './db'
import * as rest from './restAPI'

export function serve (port, mongoUrl) {
  return connectDatabase(mongoUrl).then((db) => rest.serve(db, port))
}
