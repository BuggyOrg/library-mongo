
import {serve} from './api'

const port = process.env.BUGGY_LIBRARY_PORT || 8818
const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost'
serve(port, mongoUrl)
