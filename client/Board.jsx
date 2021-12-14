import React, { useState, useEffect, useContext } from 'react'
import GameContext from './GameContext'
import { BASE_URI } from './config'
import Box from './Box'
import { action } from './PlayerAgent'
import { Policy } from '../AlphaZeroAgent/Policy.mjs'
import { Game } from '../AlphaZeroAgent/Game.mjs'
import './assets/css/App.css'



function Board({ scaled, sendToServer }) {

	const context = useContext(GameContext)
	const [winner, setWinner] = useState(null)
	const [policy, setPolicy] = useState(null)
	const [message, setMessage] = useState('')
	const [showMessage, setShowMessage] = useState(false)
	const [availableBoxes, setAvailableBoxes] = useState([])

	useEffect(() => {
		if (showMessage)
			setTimeout(() => setShowMessage(false), 2000)
	}, [showMessage])

	useEffect(() => {
		(async () => {
			let policy = new Policy(Game.n_states, Game.n_actions)
			await policy.load(`https://${BASE_URI}/model/model.json`)
			policy.summary()
			setPolicy(policy)
		})()
	}, [])

	const playTurn = () => {
		let available = [...context.acquired.map((row, r) => row.map((col, c) => col == 0 ? [r, c] : null)).flat().filter(e => e)]
		if (context.last_move != null) {
			let {r, c} = context.last_move
			available = context.acquired[r][c] == 0 ? [[r, c]] : available
		}
		setWinner(context.score)
		setAvailableBoxes(available)
		if (context.players[`${context.player}`] == 'AI') {
			if (context.current_player == context.player) {
				let move = action(context, policy)
				return handleMove(move)
			}
		}
		if (context.players[`${-1 * context.player}`] == 'AI') {
			if (context.current_player == -1 * context.player) {
				let move = action(context, policy)
				return handleMove(move)
			}
		}
	}

	const handleMove = move => {
		let {error, R, C, r, c} = move
		if (error) {
			setMessage(error)
			setShowMessage(true)
			return
		}
		context.board[R][C][r][c] = context.current_player
		context.last_move = {R, C, r, c}
		context.acquired[R][C] = context.acquired[R][C] != 0 ? context.acquired[R][C] : (Game.isAcquired(context.board[R][C], context.current_player) ? context.current_player : (context.board[R][C].flat().includes(0) ? 0 : 2))
		context.score = Game.isAcquired(context.acquired, context.current_player) ? context.current_player : (!context.acquired.flat().some(e => e == 0) ? 0 : null)
		setWinner(context.score)
		if (context.score == null) context.current_player = -1 * context.current_player
		if (sendToServer) sendToServer(context)
		if (context.score != null) return
		setAvailableBoxes(context.acquired[r][c] == 0 ? [[r, c]] : [...context.acquired.map((row, r) => row.map((col, c) => col == 0 ? [r, c] : null)).flat().filter(e => e)])
		if (Object.values(context.players).some(p => p == 'AI')) setTimeout(playTurn, context.turn_delay)
	}

	useEffect(() => {
		if (policy) playTurn()
	}, [policy, context])

  return (
		<div className={scaled ? 'scale-board' : ''}>
			<div id='header'>{
				winner == null ? (
					<>
						<span className={`tic ${context.current_player == 1 ? 'current' : ''}`}>{context.names[1]}</span> vs <span className={`tac ${context.current_player == -1 ? 'current' : ''}`}>{context.names['-1']}</span>
					</>
				) : (
					<span className={{1: 'tic winner', '-1': 'tac winner', 0: 'draw'}[winner]} dangerouslySetInnerHTML={{__html: winner == 0 ? 'Match Drawn' : `<b>${context.names[`${winner}`]}</b> is the winner`}}></span>
				)
			}</div>
			<table className='main-board'>
				<tbody>
					{
						[...Array(3).keys()].map((row, index) => (
							<tr key={index}>
								{
									[...Array(3).keys()].map((column, index) => (
											<td
												key={index}
												className={{1: 'tic', '-1': 'tac', 0: (availableBoxes.find(el => el[0] == row && el[1] == column) ? (winner == null ? 'available' : '') : '')}[context.acquired[row][column]]}
											>
												<Box
													row={row}
													column={column}
													className={{1: 'tic', '-1': 'tac', 0: (availableBoxes.find(el => el[0] == row && el[1] == column) ? (winner == null ? 'available' : '') : '')}[context.acquired[row][column]]}
													winner={winner}
													handleMove={handleMove}/>
											</td>
									))
								}
							</tr>
						))
					}
				</tbody>
			</table>
			<div className={`message ${showMessage ? 'show' : ''}`}>{message}</div>
		</div>
  )
}

export default Board