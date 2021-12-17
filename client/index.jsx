import React from 'react'
import ReactDOM from 'react-dom'
import Routes from './Route'

import Agent from './AgentWorker?worker'

import './assets/css/index.css'


const worker = new Agent()

ReactDOM.render(
  <React.StrictMode>
		<Routes worker={worker}/>
  </React.StrictMode>,
  document.getElementById('root')
)