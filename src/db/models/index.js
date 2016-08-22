import mongoose from 'mongoose'

const componentSchema = mongoose.Schema({
  meta: String,
  version: String,
  component: mongoose.Schema.Types.Mixed
})
componentSchema.index({ meta: 1, version: 1 }, { unique: true })

export const Component = mongoose.model('Component', componentSchema)

const metaInfoSchema = mongoose.Schema({
  meta: String,
  version: String,
  key: String,
  value: mongoose.Schema.Types.Mixed
})
metaInfoSchema.index({ meta: 1, version: 1, key: 1 }, { unique: true })

export const MetaInfo = mongoose.model('MetaInfo', metaInfoSchema)

const configSchema = mongoose.Schema({
  key: String,
  value: mongoose.Schema.Types.Mixed
})
metaInfoSchema.index({ key: 1 }, { unique: true })

export const Config = mongoose.model('Config', configSchema)
