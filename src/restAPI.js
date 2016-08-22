
import express from 'express'
import bodyParser from 'body-parser'
import * as DB from './mongoLibrary'
import debug from 'debug'
import {Component} from '@buggyorg/graphtools'
import _ from 'lodash'

var log = debug('library-mongo')
// var error = debug('library-fileserver:error')

function logAndError (res) {
  return (err) => {
    console.error(err)
    res.status(500).end();
  }
}

export function serve (db, port) {
  log('Serving library @' + port)

  var app = express()
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({extended: true}))
  app.use(bodyParser.text())
  app.use(bodyParser.json({type: 'application/json'}))

  app.get('/info', (req, res) => {
    res.json({
      version: require('../package.json').version,
      type: 'buggy-library-mongo-database'
    })
    res.end()
  })

  app.get('/export', (req, res) => {
    res.json(db)
    res.end()
  })

  app.get('/components', (req, res) => {
    DB.components(db)
      .then((components) => res.json(components.map((c) => c.meta)).end())
      .catch(logAndError(res))
  })

  app.get('/components/count', (req, res) => {
    DB.components(db)
      .then((components) => res.json(components.length).end())
      .catch(logAndError(res))
  })

  app.get('/components/get/:meta', (req, res) => {
    DB.component(db, req.params.meta)
      .then((component) => {
        if (component != null) {
          res.json(component).end()
        } else {
          res.status(404).end()
        }
      })
      .catch(logAndError(res))
  })

  app.get('/components/get/:meta/version/:version', (req, res) => {
    DB.component(db, req.params.meta, req.params.version)
      .then((component) => {
        if (component != null) {
          res.json(component).end()
        } else {
          res.status(404).end()
        }
      })
      .catch(logAndError(res))
  })

  app.post('/components', (req, res) => {
    if (!req.body) return res.sendStatus(400)
    if (!Component.isValid(req.body)) return res.sendStatus(400)
    DB.hasComponent(db, req.body.meta, req.body.version)
      .then((hasComponent) => {
        if (hasComponent) {
          res.status(400).end()
        } else {
          return DB.addComponent(db, req.body)
            .then(() => res.status(204).end())
        }
      })
      .catch(logAndError(res))
  })

  app.get('/meta/:component', (req, res) => {
    DB.metaInfos(db, req.params.component, null)
      .then((metaInfo) => {
        if (metaInfo != null) {
          res.json(_.keys(metaInfo)).end()
        } else {
          res.status(404).end()
        }
      })
      .catch(logAndError(res))
  })

  app.get('/meta/:component/:key', (req, res) => {
    DB.metaInfos(db, req.params.component, null, req.params.key)
      .then((metaInfo) => {
        if (metaInfo != null) {
          res.json(metaInfo[req.params.key]).end()
        } else {
          res.status(404).end()
        }
      })
      .catch(logAndError(res))
  })

  app.post('/meta/:component/:key', (req, res) => {
    if (!req.body || !req.body.value) return res.sendStatus(400)
    DB.hasComponent(db, req.params.component)
      .then((hasComponent) => {
        if (hasComponent) {
          return DB.setMetaInfo(db, req.params.component, null, req.params.key, req.body.value)
            .then(() => res.status(204).end())
        } else {
          res.status(400).end()
        }
      })
      .catch(logAndError(res))
  })

  app.get('/meta/:component/version/:version', (req, res) => {
    DB.hasComponent(db, req.params.component)
      .then((hasComponent) => {
        if (hasComponent) {
          DB.metaInfos(db, req.params.component, req.params.version)
            .then((meta) => {
              res.json(_.keys(meta)).end()
            })
        } else {
          res.status(400).end()
        }
      })
      .catch(logAndError(res))
  })

  app.get('/meta/:component/version/:version/:key', (req, res) => {
    DB.hasComponent(db, req.params.component)
      .then((hasComponent) => {
        if (hasComponent) {
          DB.metaInfo(db, req.params.component, req.params.version, req.params.key)
            .then((meta) => {
              res.json(meta).end()
            })
        } else {
          res.status(400).end()
        }
      })
      .catch(logAndError(res))
  })

  app.post('/meta/:component/version/:version/:key', (req, res) => {
    if (!req.body || !req.body.value) return res.sendStatus(400)
    DB.hasComponent(db, req.params.component)
      .then((hasComponent) => {
        if (hasComponent) {
          DB.setMetaInfo(db, req.params.component, req.params.version, req.params.key, req.body.value)
            .then((meta) => {
              res.status(204).end()
            })
        } else {
          res.status(400).end()
        }
      })
      .catch(logAndError(res))
  })

  app.get('/config/:key', (req, res) => {
    const conf = DB.config(db, req.params.key)
    if (conf == null) {
      return res.sendStatus(404).end()
    }
    res.json(conf)
    res.end()
  })

  app.post('/config/:key', (req, res) => {
    if (!req.body || !req.body.value) return res.sendStatus(400)
    DB.setConfig(db, req.params.key, req.body.value)
    res.status(204).end()
  })

  if (port) {
    app.listen(port)
  } else {
    log('No valid port specified. Running server without exposing it.')
  }

  return { app, db }
}
