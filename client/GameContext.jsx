import { createContext } from 'react'

const GameContext = createContext()

export const DefaultContext = {
	player: 0,
	current_player: 0,
	players: ['AI', 'AI'],
	names: ['Robot #1', 'Robot #2'],
	last_move: null,
	turn_delay: 2000, // in ms
	board: new Array(3).fill(-1).map(() => new Array(3).fill(-1).map(() => new Array(3).fill(-1).map(() => new Array(3).fill(-1)))),
	acquired: new Array(3).fill(-1).map(() => new Array(3).fill(-1))
}

export const InitialContext = {
	current_player: 0,
	last_move: null,
	turn_delay: 2000,
	board: new Array(3).fill(-1).map(() => new Array(3).fill(-1).map(() => new Array(3).fill(-1).map(() => new Array(3).fill(-1)))),
	acquired: new Array(3).fill(-1).map(() => new Array(3).fill(-1))
}

export default GameContext