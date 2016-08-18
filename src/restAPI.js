
import express from 'express'
import bodyParser from 'body-parser'
import * as DB from './mongoLibrary'
import debug from 'debug'
import {Component} from '@buggyorg/graphtools'
import _ from 'lodash'

var log = debug('library-mongo')
// var error = debug('library-fileserver:error')

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
      type: 'buggy-library-file-database'
    })
    res.end()
  })

  app.get('/export', (req, res) => {
    res.json(db)
    res.end()
  })

  app.get('/components', (req, res) => {
    res.json(DB.components(db).map((c) => Component.id(c)))
    res.end()
  })

  app.get('/components/count', (req, res) => {
    res.json(DB.components(db).length)
    res.end()
  })

  app.get('/components/get/:meta', (req, res) => {
    if (!DB.hasComponent(db, req.params.meta)) {
      return res.status(404).end()
    }
    res.json(DB.component(db, req.params.meta, null))
    res.end()
  })

  app.get('/components/get/:meta/version/:version', (req, res) => {
    if (!DB.hasComponent(db, req.params.meta, req.params.version)) {
      return res.status(404).end()
    }
    res.json(DB.component(db, req.params.meta, req.params.version))
    res.end()
  })

  app.post('/components', (req, res) => {
    if (!req.body) return res.sendStatus(400)
    if (!Component.isValid(req.body)) return res.sendStatus(400)
    if (DB.hasComponent(db, req.body.meta, req.body.version)) return res.sendStatus(400)
    DB.addComponent(db, req.body)
    res.status(204).end()
  })

  app.get('/meta/:component', (req, res) => {
    if (!DB.hasComponent(db, req.params.component)) {
      return res.sendStatus(400).end()
    }
    res.json(_.keys(DB.metaInfos(db, req.params.component, null)))
    res.end()
  })

  app.get('/meta/:component/:key', (req, res) => {
    if (!DB.hasComponent(db, req.params.component)) {
      return res.sendStatus(400).end()
    }
    const metaInfo = DB.metaInfo(db, req.params.component, null, req.params.key)
    if (metaInfo == null) {
      return res.sendStatus(404).end()
    }
    res.json(metaInfo)
    res.end()
  })

  app.post('/meta/:component/:key', (req, res) => {
    if (!req.body || !req.body.value) return res.sendStatus(400)
    if (!DB.hasComponent(db, req.params.component)) {
      return res.sendStatus(400).end()
    }
    DB.setMetaInfo(db, req.params.component, null, req.params.key, req.body.value)
    res.status(204).end()
  })

  app.get('/meta/:component/version/:version', (req, res) => {
    if (!DB.hasComponent(db, req.params.component)) {
      return res.sendStatus(400).end()
    }
    res.json(_.keys(DB.metaInfos(db, req.params.component, req.params.version)))
    res.end()
  })

  app.get('/meta/:component/version/:version/:key', (req, res) => {
    if (!DB.hasComponent(db, req.params.component)) {
      return res.sendStatus(400).end()
    }
    res.json(DB.metaInfo(db, req.params.component, req.params.version, req.params.key))
    res.end()
  })

  app.post('/meta/:component/version/:version/:key', (req, res) => {
    if (!req.body || !req.body.value) return res.sendStatus(400)
    if (!DB.hasComponent(db, req.params.component)) {
      return res.sendStatus(400).end()
    }
    DB.setMetaInfo(db, req.params.component, req.params.version, req.params.key, req.body.value)
    res.status(204).end()
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

  return app
}
