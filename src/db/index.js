import mongoose from 'mongoose'
import * as models from './models'

mongoose.Promise = Promise // use native Promise

export default function (url) {
  return new Promise((resolve, reject) => {
    mongoose.connect(url)
    const db = mongoose.connection
    db.on('error', (err) => reject(err))
    db.once('open', () => resolve({ models }))
  })
}
