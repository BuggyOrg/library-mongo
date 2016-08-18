import { Schema, Model } from 'mongoose'

const componentSchema = Schema({
  meta: String,
  version: String,
  component: Schema.Types.Mixed
})
componentSchema.index({ meta: 1, version: 1 }, { unique: true })

export const Component = Model('Component', componentSchema)

const metaInfoSchema = Schema({
  meta: String,
  version: String,
  key: String,
  value: Schema.Types.Mixed
})
metaInfoSchema.index({ meta: 1, version: 1, key: 1 }, { unique: true })

export const MetaInfo = Model('MetaInfo', metaInfoSchema)

const configSchema = Schema({
  key: String,
  value: Schema.Types.Mixed
})
metaInfoSchema.index({ key: 1 }, { unique: true })

export const Config = Model('Config', configSchema)
