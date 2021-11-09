export const is_acquired = (block, player) => {
	
	const transpose = block => block[0].map((x, i) => block.map(x => x[i]))

	if (block.map(r => r.every(val => val == player)).some(val => val))
		return true
	else if (transpose(block).map(r => r.every(val => val == player)).some(val => val))
		return true
	else if (block.map((e, i) => e[i]).every(val => val == player))
		return true
	else if (block.map((e, i) => e[block.length - i - 1]).every(val => val == player))
		return true
	else
		return false
}



function select_random_position(block) {
	let available_blocks = block.map((row, r) => row.map((col, c) => col == -1 ? [r, c] : null)).flat().filter(e => e)
	return available_blocks[Math.floor(Math.random() * available_blocks.length)]
}

function select_greedy_position(block) {
	
}

export const action = (context) => {
	let { current_player, board, acquired } = context
	let opponent = 1 - current_player
	if (context.last_move == null) {
		let [R, C] = select_random_position(acquired)
		let [r, c] = select_random_position(board[R][C])
		return {R, C, r, c}
	}
	let {r, c} = context.last_move
	if (acquired[r][c] == -1) {
		let [new_r, new_c] = select_random_position(board[r][c])
		return {R: r, C: c, r: new_r, c: new_c}
	} else {
		let [R, C] = select_random_position(acquired)
		let [r, c] = select_random_position(board[R][C])
		return {R, C, r, c}
	}
}