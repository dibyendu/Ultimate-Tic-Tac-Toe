import React, { useEffect } from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import Landing from './Landing'
import Game from './Game'

function Routes() {
	
	useEffect(() => {
		if (!localStorage.getItem('userid'))
			localStorage.setItem('userid', Math.floor(Math.random() * 900000) + 100000)
	}, [])

  return (
		<Router>
			<Switch>
				<Route exact path='/' component={Landing} />
				<Route path='/:gameid' component={Game} />
			</Switch>
		</Router>
  )
}

export default Routes