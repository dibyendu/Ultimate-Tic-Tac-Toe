import fs from 'fs'
import * as tf from '@tensorflow/tfjs-node'

import { Game } from './Game.mjs'
import { MCTS } from './MCTS.mjs'
import { Policy } from './Policy.mjs'


const CONTEXT = {
	score: null,  // null -> game on,  0 -> draw, +1/-1 -> winner
	current_player: 1,
	last_move: null,
	board: new Array(3).fill(0).map(() => new Array(3).fill(0).map(() => new Array(3).fill(0).map(() => new Array(3).fill(0)))),
	acquired: new Array(3).fill(0).map(() => new Array(3).fill(0))
}

const LearningRate = 0.001,
			WeightDecay = 1e-5

const N_GAMES = 400,
			SAVE_EVERY = 2,
			MODEL_DIRECTORY = 'trained_model',
			EXPLORATION_DEPTH = 100,
			TEMPERATURE = 0.1











// let game = new Game(CONTEXT)
// game.render()
// while (game.score == null) {
	

// 	let action = Math.round(Math.random() * 80)
// 	try {
// 		game.move(action)

// 		let R = parseInt(action / 27),
// 				C = parseInt((action  - R * 27) / 9),
// 				r = parseInt((action - R * 27 - C * 9) / 3),
// 				c = action - R * 27 - C * 9 - r * 3

// 		console.log(`Player ${{1: 'x', '-1': 'o'}[-1 * game.player]} makes move`, {R, C, r, c}, ` Score: ${game.score}`)

// 		game.render()
// 	} catch(e) {
// 		console.error(e)
// 	}
// }

// try {
// 	game.move(0)
// } catch(e) {
// 	console.error(e)
// }















async function train(policy, exploration_depth, temperature) {

	let game_tree = new MCTS(new Game(CONTEXT)),
			steps = 0,
			nn_inputs = [],
			true_probs = []

	while (game_tree.outcome == null) {

		[...Array(exploration_depth).keys()].forEach(() => game_tree.explore(policy))

		let [game_tree_next, {nn_input, true_prob}] = game_tree.next(temperature=temperature)

		nn_inputs.push(nn_input)
		true_probs.push(true_prob)

		game_tree_next.detachMother()
		game_tree = game_tree_next

		steps += 1
		


		// console.log(`Player ${{1: 'x', '-1': 'o'}[-1 * game_tree.game.player]} makes move`, game_tree.game.action, ` Score: ${game_tree.game.score}`)
		// game_tree.game.render()
		// console.log('----------------------')




	}




	// console.log(steps)
	// console.log(game_tree.outcome)






	let states = tf.stack(nn_inputs.map(input => input[0])),
			availabilities = tf.stack(nn_inputs.map(input => input[1])),
			current_players = tf.stack(nn_inputs.map(input => input[2])),
			probabilities = tf.stack(true_probs),
			outcomes = tf.fill([nn_inputs.length, 1], game_tree.outcome)


	// console.log(states.arraySync())
	// console.log(availabilities.arraySync())
	// console.log(current_players.arraySync())

	// let [p, v, v_cur] = policy.predict([states, availabilities, current_players])

	

	// console.log(p.arraySync())
	// console.log(probabilities.arraySync())

	// console.log(v.arraySync())
	// console.log(v_cur.arraySync())
	// console.log(outcomes.arraySync())
	


	let history = await policy.fit(
		[states, availabilities, current_players],
		[probabilities, outcomes, outcomes],
		{
			epochs: 1,
			batchSize: steps,
			verbose: 0
			// callbacks: {
			// 	onEpochEnd: (epoch, logs) => {
			// 		process.stdout.write(`\rEpoch ${epoch}:  Loss = ${logs.loss}`)
			// 	}
			// }
		}
	)

	return [history.history, steps, game_tree.outcome]
}



(async function() {

	const policy = new Policy(Game.n_states, Game.n_actions, LearningRate, WeightDecay)

	let last_game_idx = 0, logs = []

	if (fs.existsSync(`./${MODEL_DIRECTORY}/model.json`)) {
		let logs = JSON.parse(fs.readFileSync(`./${MODEL_DIRECTORY}/logs.json`))
		last_game_idx = logs.game
		logs = logs.logs
		await policy.load(`file://./${MODEL_DIRECTORY}/model.json`)
		logs.forEach(([history, steps, outcome], id) => {
			console.log(`Game #${(id+1).toString().padStart(5, '0')}:\t Winner: ${outcome == 1 ? 'x' : (outcome == -1 ? 'o' : '-')} (${steps.toString().padStart(3, '0')} steps)\t Loss: ${history.loss[0].toFixed(10)}\t Action Loss: ${history.ActionProbabilities_loss[0].toFixed(10)}\t Value Loss ${history.Value_loss[0].toFixed(10)}`)
		})
	}

	policy.summary()

	for (let game_idx = last_game_idx + 1; game_idx <= N_GAMES; game_idx++) {
		let [history, steps, outcome] = await train(policy, EXPLORATION_DEPTH, TEMPERATURE)
		logs.push([history, steps, outcome])
		console.log(`Game #${game_idx.toString().padStart(5, '0')}:\t Winner: ${outcome == 1 ? 'x' : (outcome == -1 ? 'o' : '-')} (${steps.toString().padStart(3, '0')} steps)\t Loss: ${history.loss[0].toFixed(10)}\t Action Loss: ${history.ActionProbabilities_loss[0].toFixed(10)}\t Value Loss ${history.Value_loss[0].toFixed(10)}`)

		if (game_idx % SAVE_EVERY == 0) {
			await policy.save(`file://./${MODEL_DIRECTORY}`)
			fs.writeFileSync(`./${MODEL_DIRECTORY}/logs.json`, JSON.stringify({game: game_idx, logs}))
		}

	}
})()