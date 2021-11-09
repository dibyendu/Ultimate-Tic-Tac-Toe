import React, { useState, useContext } from 'react'
import GameContext from './GameContext'
import './assets/css/App.css'

function Box({ row, column, className, handleMove, winner }) {

	const context = useContext(GameContext)

  return (
		<table className='box'>
			<tbody>
				{
					[...Array(3).keys()].map((r, index) => (
						<tr key={index}>
							{
								[...Array(3).keys()].map((c, index) => (
									<td
										key={index}
										className={className}
										onClick={() => {
											if (context.players.every(p => p == 'AI') || winner != null) return
											if (className != 'available' || context.board[row][column][r][c] != -1)
												return handleMove({error: 'Invalid Move'})
											else if (context.player != context.current_player)
												return handleMove({error: "Opponent's Turn"})
											handleMove({R: row, C: column, r, c})
										}}>
										<div className={{0: 'tic', 1: 'tac', '-1': ''}[context.board[row][column][r][c]]}/>
									</td>
								))
							}
						</tr>
					))
				}
			</tbody>
		</table>
  )
}

export default Box