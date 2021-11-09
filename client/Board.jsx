import React, { useState, useEffect, useContext } from 'react'
import GameContext from './GameContext'
import Box from './Box'
import { is_acquired, action } from './PlayerAgent'
import './assets/css/App.css'

function Board({ scaled, sendToServer }) {

	const context = useContext(GameContext)
	const [winner, setWinner] = useState(null)
	const [message, setMessage] = useState('')
	const [showMessage, setShowMessage] = useState(false)
	const [availableBoxes, setAvailableBoxes] = useState([])

	useEffect(() => {
		if (showMessage)
			setTimeout(() => setShowMessage(false), 2000)
	}, [showMessage])

	const playTurn = () => {
		let available = [...context.acquired.map((row, r) => row.map((col, c) => col == -1 ? [r, c] : null)).flat().filter(e => e)]
		if (context.last_move != null) {
			let {r, c} = context.last_move
			available = context.acquired[r][c] == -1 ? [[r, c]] : available
		}
		setAvailableBoxes(available)
		if (context.players[context.player] == 'AI') {
			if (context.current_player == context.player) {
				let move = action(context)
				return handleMove(move)
			}
		}
		if (context.players[1 - context.player] == 'AI') {
			if (context.current_player == 1 - context.player) {
				let move = action(context)
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
		context.acquired[R][C] = context.acquired[R][C] != -1 ? context.acquired[R][C] : (is_acquired(context.board[R][C], context.current_player) ? context.current_player : (context.board[R][C].flat().includes(-1) ? -1 : 2))
		if (is_acquired(context.acquired, context.current_player)) {
			setWinner(context.current_player)
			return
		} else if (!context.acquired.flat().some(e => e == -1)) {
			setWinner(-1)
			return
		}
		context.current_player = 1 - context.current_player
		
		if (sendToServer) sendToServer(context)

		setAvailableBoxes(context.acquired[r][c] == -1 ? [[r, c]] : [...context.acquired.map((row, r) => row.map((col, c) => col == -1 ? [r, c] : null)).flat().filter(e => e)])
		if (context.players.some(p => p == 'AI')) setTimeout(playTurn, context.turn_delay)
	}

	useEffect(playTurn, [context])

  return (
		<div className={scaled ? 'scale-board' : ''}>
			<div id='header'>{
				winner == null ? (
					<>
						<span className={`tic ${context.current_player == 0 ? 'current' : ''}`}>{context.names[0]}</span> vs <span className={`tac ${context.current_player == 1 ? 'current' : ''}`}>{context.names[1]}</span>
					</>
				) : (
					<span className={{0: 'tic winner', 1: 'tac winner', '-1': 'draw'}[winner]} dangerouslySetInnerHTML={{__html: winner == -1 ? 'Match Drawn' : `<b>${context.names[winner]}</b> is the winner`}}></span>
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
												className={{0: 'tic', 1: 'tac', '-1': (availableBoxes.find(el => el[0] == row && el[1] == column) ? (winner == null ? 'available' : '') : '')}[context.acquired[row][column]]}
											>
												<Box
													row={row}
													column={column}
													className={{0: 'tic', 1: 'tac', '-1': (availableBoxes.find(el => el[0] == row && el[1] == column) ? (winner == null ? 'available' : '') : '')}[context.acquired[row][column]]}
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