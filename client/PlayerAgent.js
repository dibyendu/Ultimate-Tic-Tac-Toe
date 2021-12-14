import { Game } from '../AlphaZeroAgent/Game.mjs'
import { MCTS } from '../AlphaZeroAgent/MCTS.mjs'


function select_random_position(block) {
	let available_blocks = block.map((row, r) => row.map((col, c) => col == 0 ? [r, c] : null)).flat().filter(e => e)
	return available_blocks[Math.floor(Math.random() * available_blocks.length)]
}

export const action = (context, policy=null) => {

	if (policy) {
		let exploration_depth = 100,
				temperature = 0.1
		let game_tree = new MCTS(new Game(context))
		if (game_tree.outcome == null) {
			[...Array(exploration_depth).keys()].forEach(() => game_tree.explore(policy))
			let [game_tree_next, _] = game_tree.next(temperature=temperature)
			return game_tree_next.game.action
		}
	}

	let { current_player, board, acquired } = context
	let opponent = -1 * current_player
	if (context.last_move == null) {
		let [R, C] = select_random_position(acquired)
		let [r, c] = select_random_position(board[R][C])
		return {R, C, r, c}
	}
	let {r, c} = context.last_move
	if (acquired[r][c] == 0) {
		let [new_r, new_c] = select_random_position(board[r][c])
		return {R: r, C: c, r: new_r, c: new_c}
	} else {
		let [R, C] = select_random_position(acquired)
		let [r, c] = select_random_position(board[R][C])
		return {R, C, r, c}
	}
}