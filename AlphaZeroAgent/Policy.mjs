import * as tf from '@tensorflow/tfjs'


class ActionProbabilityLayer extends tf.layers.Layer {
  
	#outputShape

	constructor(config) {
    super(config)
		this.name = config.name
		this.#outputShape = config.targetShape
  }

	computeOutputShape(inputShape) {
		return [inputShape[0], this.#outputShape]
  }

  /*
   * call() contains the actual numerical computation of the layer.
   *
   * It is "tensor-in-tensor-out". I.e., it receives one or more
   * tensors as the input and should produce one or more tensors as
   * the return value.
   *
   * Be sure to use tidy() to avoid WebGL memory leak. 
   */
  call(inputs) {
    return tf.tidy(() => {
      let [input, available] = inputs[0].split([this.#outputShape, -1], 1)

			available = available.split([this.#outputShape, -1], 1)[0]
				
			let exp = available.mul(input.sub(input.max(1).reshape([-1, 1])).exp())

			let probability = exp.div(exp.sum(1).reshape([-1, 1]))

			// console.log('........>>>>>')
			// console.log(input.arraySync())
			// console.log(available.arraySync())
			// console.log(probability.arraySync())
			// console.log('........<<<<<')

			return probability
    })
  }

  /*
   * getConfig() generates the JSON object that is used
   * when saving and loading the custom layer object.
   */
  getConfig() {
		const config = super.getConfig()
    Object.assign(config, {targetShape: this.#outputShape})
    return config
  }
  
  /*
   * The static className getter is required by the 
   * registration step (see below).
   */
  static get className() {
    return 'ActionProbabilityLayer'
  }
}


/*
 * Regsiter the custom layer, so TensorFlow.js knows what class constructor
 * to call when deserializing an saved instance of the custom layer.
 */
tf.serialization.registerClass(ActionProbabilityLayer)


export class Policy {

	#model
	#weight_decay
	#learning_rate

	constructor(n_state, n_action, learning_rate=0, weight_decay=0) {
		this.#weight_decay = weight_decay
		this.#learning_rate = learning_rate
    
		const state = tf.input({ shape: [n_state], dtype: 'float32', name: 'State' }),
					available_action_mask = tf.input({ shape: [n_action], dtype: 'float32', name: 'AvailableActions' }),
					current_player = tf.input({ shape: [1], dtype: 'float32', name: 'CurrentPlayer' })

		const state_for_current_player = tf.layers.multiply().apply([
			state,
			tf.layers.reshape({ targetShape: [n_state] }).apply(
				tf.layers.repeatVector({n: n_state, inputShape: [1]}).apply(current_player)
			)
		])

		// const conv_layer = tf.layers.flatten().apply(
		// 	tf.layers.conv2d({ filters: 16, kernelSize: 3, strides: 1, useBias: false }).apply(
		// 		tf.layers.reshape({ targetShape: [9, 9, 1] }).apply(state_for_current_player)
		// 	)
		// )

		const conv_layer = tf.layers.dense({ units: 512, activation: 'relu' }).apply(
			tf.layers.flatten().apply(
				tf.layers.conv2d({ filters: 32, kernelSize: 3, strides: 1, useBias: false }).apply(
					tf.layers.conv2d({ filters: 16, kernelSize: 3, strides: 1, useBias: false }).apply(
						tf.layers.reshape({ targetShape: [9, 9, 1] }).apply(state_for_current_player)
					)
				)
			)
		)

		const dense1 = tf.layers.dense({ units: 128, activation: 'relu' }).apply(conv_layer),
					dense2 = tf.layers.dense({ units: 64, activation: 'relu' }).apply(dense1)

		const action1 = tf.layers.dense({ units: 16, activation: 'relu' }).apply(dense2),
					action2 = tf.layers.dense({ units: n_action }).apply(action1),
					action = new ActionProbabilityLayer({ name: 'ActionProbabilities', targetShape: n_action }).apply(
						tf.layers.concatenate().apply([action2, available_action_mask])
					)

		const value1 = tf.layers.dense({ units: 8, activation: 'relu' }).apply(dense1),
					value = tf.layers.dense({ units: 1, activation: 'tanh', name: 'NoLossValue' }).apply(value1),
					value_for_current_player = tf.layers.multiply({ name: 'Value' }).apply([value, current_player])

		this.#model = tf.model({
			inputs: [
				state,
				available_action_mask,
				current_player
			],
			outputs: [
				action,
				value,
				value_for_current_player
			]
		})

		this.compile()
  }

	compile() {
		this.#model.compile({
			loss: {
				ActionProbabilities: (truth, prediction) => {
					let constant = truth.add(Number.EPSILON).log().mul(truth)
					return prediction.add(Number.EPSILON).log().mul(truth).sub(constant).sum(1).neg().sum()

					// return prediction.add(Number.EPSILON).log().mul(truth).sum(1).neg().sum()
				},
				NoLossValue: (_, __) => tf.scalar(0),
				Value: (truth, prediction) => prediction.squaredDifference(truth).sum()
			},
			// lossWeights: {
			// 	ActionProbabilities: 0.5,
			// 	Value: 0.5
			// },
			optimizer: tf.train.adam(this.#learning_rate, this.#weight_decay),
			metrics: ['accuracy']
		})
	}

	set model(m) {
    this.#model = m
  }

	summary() {
		this.#model.summary()
	}

	predict(input) {
		return this.#model.predict(input)
	}

	evaluate(input, output) {
		return this.#model.evaluate(input, output)
	}

	async fit(input, output, options) {
		return await this.#model.fit(input, output, options)
	}

	async save(location) {
		await this.#model.save(location)
	}

	load(model) {
		this.model = model
		this.compile()
	}

}