import * as tf from '@tensorflow/tfjs'


export class MCTS {

	static C = 1.0

  constructor(game, mother=null) {
    this.game = game
		this.children = {}
		this.U = 0
		this.N = 0
		this.V = 0
		this.P = null
		this.nn_input = null
    this.outcome = this.game.score
		this.mother = mother
		if (this.game.score != null) {
			this.V = this.game.score * this.game.player
			this.U = this.game.score == 0 ? 0 : this.V * Infinity
		}
  }

	createChild(available_actions, probs) {
		let actions = available_actions.map((action, index) => action ? index : null).filter(e => e != null)
		let games = actions.map(_ => this.game.clone())
		actions.forEach((action, index) => games[index].move(action))
		this.P = probs
    this.children = Object.assign(...actions.map((action, index) => ({[action]: new MCTS(games[index], this)})))
	}

	explore(policy) {
		if (this.game.score != null)
			throw `The game has ended with score: {this.game.score}`
		let current = this
		while (Object.keys(current.children).length && current.outcome == null) {
			let children = current.children
			
			let max_U = Math.max(...Object.values(children).map(node => node.U))
			
			// console.log(`current max_U = ${max_U}`)

			let actions = Object.entries(children).filter(([_, node]) => node.U == max_U).map(([action, _]) => action)
			
			if (actions.length == 0)
				throw `No action to explore`
			
			let action = actions[Math.floor(Math.random() * actions.length)]
			
			if (max_U == -Infinity) {
				current.U = Infinity
				current.V = 1.0
				break
			} else if (max_U == Infinity) {
				current.U = -Infinity
				current.V = -1.0
				break
			}
			
			current = children[action]
		}
		
		// if node hasn't been expanded
		if (Object.keys(current.children).length == 0  && current.outcome == null) {
			// policy outputs results from the perspective of the next player, thus extra - sign is needed

			let [p, v, _] = policy.predict([
				tf.tensor1d(current.game.state, 'float32').expandDims(),
				tf.tensor1d(current.game.available, 'float32').expandDims(),
				tf.tensor1d([current.game.player], 'float32').expandDims(),
			])

			current.nn_input = [
				current.game.state,
				current.game.available.map(e => e ? 1.0 : 0.0),
				[current.game.player]
			]

			current.createChild(current.game.available, p.squeeze().arraySync())
			current.V = v.squeeze().neg().arraySync()
		}

		current.N += 1

		// now update U and back-prop
		while (current.mother) {
			let mother = current.mother
			mother.N += 1
			// beteen mother and child, the player is switched, extra - sign
			mother.V += (-current.V - mother.V) / mother.N

			let probs = mother.P

			// update U for all sibling nodes
			for (let [action, sibling] of Object.entries(mother.children))
				if (sibling.U !=  Infinity && sibling.U != -Infinity)
					sibling.U = sibling.V + MCTS.C * probs[action] * Math.sqrt(mother.N) / (1 + sibling.N)
			current = current.mother
		}
	}

	next(temperature=1.0) {
		if (this.game.score != null)
			throw `The Game has ended with score ${this.game.score}`
		if (Object.keys(this.children).length == 0)
			throw 'No children found and game has not ended'

		let children = this.children
		// if there are winning moves, just output those
		let max_U = Math.max(...Object.values(children).map(node => node.U))

		let prob
		if (max_U == Infinity)
			prob = Array(this.game.constructor.n_actions).fill(null).map((_, action) => action in children ? (children[action].U == Infinity ? 1.0 : 0.0) : 0.0)
		else {
			// divide things by maxN for numerical stability
			let maxN = Math.max(...Object.values(children).map(node => node.N)) + 1
			prob = Array(this.game.constructor.n_actions).fill(null).map((_, action) => action in children ? (children[action].N / maxN) ** (1.0 / temperature) : 0.0)
		}
		prob = tf.tensor1d(prob, 'float32')

		if (prob.sum().arraySync() > 0) // normalize the probability
			prob = prob.div(prob.sum())
		else {                         // if sum is zero, just make things random
			let n_child = Object.keys(children).length
			prob = tf.tensor1d(Array(this.game.constructor.n_actions).fill(null).map((_, action) => action in children ? (1.0 / n_child) : 0.0), 'float32')
		}

		let weights = prob.arraySync(),
				weighted = [].concat(...weights.map((prob, action) => Array(Math.ceil(prob * 100)).fill(action))),
				next_action = weighted[Math.floor(Math.random() * weighted.length)],
				next_state = children[next_action]

		// V was for the previous player making a move to convert to the current player we add - sign
		return [next_state, {nn_input: this.nn_input, true_prob: prob}]
	}

	detachMother() {
		delete this.mother
		this.mother = null
	}
}

// exports.MCTS = MCTS