import mongoose from 'mongoose'

const componentSchema = mongoose.Schema({
  componentId: String,
  version: String,
  component: mongoose.Schema.Types.Mixed
})
componentSchema.index({ componentId: 1, version: 1 }, { unique: true })

export const Component = mongoose.model('Component', componentSchema)

const metaInfoSchema = mongoose.Schema({
  componentId: String,
  version: String,
  key: String,
  value: mongoose.Schema.Types.Mixed
})
metaInfoSchema.index({ componentId: 1, version: 1, key: 1 }, { unique: true })

export const MetaInfo = mongoose.model('MetaInfo', metaInfoSchema)

const configSchema = mongoose.Schema({
  key: String,
  value: mongoose.Schema.Types.Mixed
})
configSchema.index({ key: 1 }, { unique: true })

export const Config = mongoose.model('Config', configSchema)
