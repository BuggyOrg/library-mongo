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
  .then(() => Promise.all((json.components || []).map((c) => addComponent(db, c))))
  .then(() => Promise.all(_.map(json.meta || {}, (meta, componentId) => {
    return Promise.all(_.map(meta, (values, key) => {
      return Promise.all(values.map(({ value, version }) => setMetaInfo(db, componentId, version, key, value)))
    }))
  })))
  .then(() => Promise.all(_.map(json.config || {}, (value, key) => setConfig(db, key, value))))
}

export function exportJSON (db) {
  return Promise.all([
    components(db),
    db.models.MetaInfo.find().exec(),
    db.models.Config.find().exec()
  ])
  .then(([components, meta, config]) => {
    return {
      components: components.map((c) => c.component),
      meta: _.chain(meta)
             .groupBy('meta')
             .mapValues((arr) => _.chain(arr)
               .groupBy('key')
               .mapValues((v) => v.map((w) => _.pick(w, ['value', 'version'])))
               .value()
             )
             .value(),
      config: _.fromPairs(config.map(({ key, value }) => [ key, value ]))
    }
  })
}

export function components (db) {
  return db.models.Component.find().exec()
}

const compQuery = (db, componentId, version) => {
  if (!version) {
    return db.models.Component.find({ componentId }).exec()
  } else {
    return db.models.Component.find({ componentId, version: semver.clean(version) }).exec()
  }
}

export function hasComponent (db, componentId, version) {
  return compQuery(db, componentId, version).then((comp) => comp.length > 0)
}

export function component (db, componentId, version) {
  if (version) {
    return compQuery(db, componentId, version).then((components) => {
      return components.length > 0 ? components[0].component : null
    })
  } else {
    return latestVersion(db, componentId).then((version) => {
      return version ? component(db, componentId, version) : null
    })
  }
}

export function componentVersions (db, componentId) {
  return compQuery(db, componentId).then((components) => components.map((cmp) => cmp.version))
}

export function latestVersion (db, componentId) {
  return componentVersions(db, componentId).then((versions) => versions.sort(semver.rcompare)[0])
}

export function addComponent (db, component) {
  return hasComponent(db, component.componentId, component.version).then((exists) => {
    const comp = new db.models.Component({
      componentId: component.componentId,
      version: component.version,
      component: component
    })
    return comp.save()
  })
}

function versionOrLatest (db, componentId, version) {
  return version ? Promise.resolve(version) : latestVersion(db, componentId)
}

export function setMetaInfo (db, componentId, version, key, value) {
  return versionOrLatest(db, componentId, version).then((version) =>
    db.models.MetaInfo.findOneAndUpdate({ componentId, version, key }, { componentId, version, key, value }, { upsert: true }).exec()
  )
}

export function metaInfos (db, componentId, version) {
  return versionOrLatest(db, componentId, version).then((version) =>
    db.models.MetaInfo.find({ componentId }).exec().then((meta) =>
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

export function metaInfo (db, componentId, version, key) {
  return versionOrLatest(db, componentId, version).then((version) =>
    db.models.MetaInfo.find({ componentId, key }).exec().then((meta) =>
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
