import React, { useState, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import GameContext, { DefaultContext } from './GameContext'
import Board from './Board'
import { BASE_URI } from './config'
import './assets/css/App.css'

function Modal({ visible, setVisible, link }) {

	const [player1, setPlayer1] = useState('HUMAN')
	const [player2, setPlayer2] = useState('AI')
	const [shareGame, setShareGame] = useState(false)
	const history = useHistory()

	useEffect(() => {
		if (player1 == 'AI') setPlayer2('HUMAN')
		if (player2 == 'AI') setPlayer1('HUMAN')
		if (player1 == player2 && player1 == 'HUMAN')setPlayer2('HUMAN2')
		setShareGame(player2 == 'HUMAN2' ? true : false)
	}, [player1, player2])

  return (
		<div className='modal-overlay' style={{ display: visible ? 'block' : 'none'}}>
			<div className='modal-container'>
				<span className='f-left'>Player 1</span>
				<select className='f-right' onChange={({target : { value }}) => setPlayer1(value)} value={player1}>
					<option value='AI'>Computer</option>
					<option value='HUMAN'>You</option>
				</select><br/><br/>
				<span className='f-left'>Player 2</span>
				<select className='f-right' onChange={({target : { value }}) => setPlayer2(value)} value={player2}>
					<option value='AI'>Computer</option>
					<option value='HUMAN'>You</option>
					<option value='HUMAN2'>Human</option>
				</select><br/><br/>
				{
					shareGame && 	<><span className='f-left'>Share the link with your opponent</span><input className='f-right' readOnly value={`${BASE_URI}/${link}`}/><br/><br/></>
				}
				<span className='f-right'><button onClick={() => setVisible(false)}>Cancel</button>&nbsp;&nbsp;&nbsp;&nbsp;<button onClick={() => {
					setVisible(false)
					history.push(`/${link}`, {player1, player2})
				}}>Go</button></span><br/>
			</div>
		</div>
  )
}

function Landing() {

	const [modalVisible, setModalVisible] = useState(false)
	const [link, _] = useState(Math.floor(Math.random() * 900000) + 100000)

	return (
		<div style={{ textAlign: 'center' }}>
			<h2>Ultimate Tic Tac Toe</h2><br/>
			<GameContext.Provider value={DefaultContext}>
				<Board scaled />
			</GameContext.Provider>
			<div>A strategic board game for 2 players.<br/>Read the <a href='https://en.wikipedia.org/wiki/Ultimate_tic-tac-toe' target='_blank'>wikipedia page</a> for the rules.</div><br/>
			<a href='#' onClick={() => setModalVisible(true)}>Start Game</a><br/><br/>
			<Modal visible={modalVisible} setVisible={setModalVisible} link={link}/>
		</div>
  )
}

export default Landing