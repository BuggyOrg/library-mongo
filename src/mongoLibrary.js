import {Component} from '@buggyorg/graphtools'
import _ from 'lodash'
import semver from 'semver'
import mongoose from 'mongoose'

export function importJSON (db, json) {
  return new Promise((resolve, reject) => {
    mongoose.connection.db.dropDatabase((err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
  .then(() => Promise.all((json.Components || []).map((c) => addComponent(db, c))))
  .then(() => Promise.all(_.map(json.meta || {}, (meta, component) => {
    return Promise.all(_.map(meta, (values, key) => {
      return Promise.all(values.map(({ value, version }) => setMetaInfo(db, component, version, key, value)))
    }))
  })))
  .then(() => Promise.all(_.map(json.config || {}, (value, key) => setConfig(db, key, value))))
}

export function components (db) {
  return db.models.Component.find().exec()
}

const compQuery = (db, meta, version) => {
  if (!version) {
    return db.models.Component.find({ meta }).exec()
  } else {
    return db.models.Component.find({ meta, version: semver.clean(version) }).exec()
  }
}

export function hasComponent (db, meta, version) {
  return compQuery(db, meta, version).then((comp) => comp.length > 0)
}

export function component (db, meta, version) {
  if (version) {
    return compQuery(db, meta, version).then((components) => {
      return components.length > 0 ? components[0].component : null
    })
  } else {
    return latestVersion(db, meta).then((version) => {
      return version ? component(db, meta, version) : null
    })
  }
}

export function componentVersions (db, meta) {
  return compQuery(db, meta).then((components) => components.map((cmp) => cmp.version))
}

export function latestVersion (db, meta) {
  return componentVersions(db, meta).then((versions) => versions.sort(semver.rcompare)[0])
}

export function addComponent (db, component) {
  return hasComponent(db, Component.id(component), component.version).then((exists) => {
    const comp = new db.models.Component({
      meta: Component.id(component),
      version: component.version,
      component: component
    })
    return comp.save()
  })
}

function versionOrLatest (db, meta, version) {
  return version ? Promise.resolve(version) : latestVersion(db, meta)
}

export function setMetaInfo (db, meta, version, key, value) {
  return versionOrLatest(db, meta, version).then((version) =>
    db.models.MetaInfo.findOneAndUpdate({ meta, version, key }, { meta, version, key, value }, { upsert: true }).exec()
  )
}

export function metaInfos (db, meta, version) {
  return versionOrLatest(db, meta, version).then((version) =>
    db.models.MetaInfo.find({ meta }).exec().then((meta) =>
      _.chain(meta)
        .groupBy('key')
        .toPairs()
        .map(([key, list]) => {
          return [key, _.filter(list, (l) => semver.gte(version, l.version)).sort((a, b) => semver.rcompare(a.version, b.version))[0]]
        })
        .reject(([key, list]) => list === undefined)
        .map(([key, elem]) => [key, elem.value])
        .fromPairs()
        .value()
    )
  )
}

export function metaInfo (db, meta, version, key) {
  return versionOrLatest(db, meta, version).then((version) =>
    db.models.MetaInfo.find({ meta, key }).exec().then((meta) =>
      _.chain(meta)
        .groupBy('key')
        .toPairs()
        .map(([key, list]) => {
          return [key, _.filter(list, (l) => semver.gte(version, l.version)).sort((a, b) => semver.rcompare(a.version, b.version))[0]]
        })
        .reject(([key, list]) => list === undefined)
        .map(([key, elem]) => [key, elem.value])
        .fromPairs()
        .value()[key]
    )
  )
}

export function config (db, key) {
  return db.models.Config.findOne({ key }).exec().then((x) => x ? x.value : null)
}

export function setConfig (db, key, value) {
  return db.models.Config.findOneAndUpdate({ key }, { key, value }, { upsert: true }).exec()
}
