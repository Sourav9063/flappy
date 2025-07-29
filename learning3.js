// Define constants for the neural network
const NN_CONSTANTS = {
    // Neuron constants
    RANDOM_WEIGHT_MIN: -1,
    RANDOM_WEIGHT_MAX: 1,
    ACTIVATION_THRESHOLD: 0,
    ACTIVATION_OUTPUT_HIGH: 1,
    ACTIVATION_OUTPUT_LOW: 0,

    // Network layer structure
    HIDDEN_LAYER_NEURONS: 3,
    OUTPUT_LAYER_NEURONS: 1,

    // Mutation constants
    MUTATION_RATE: 0.05,
};

/**
 * Represents a single neuron in a neural network.
 * It calculates an output based on inputs and its weights.
 */
class Neuron {
    constructor() {
        // Weights are the variables in the linear equation the neuron uses to activate.
        // The last weight in the array is typically the bias.
        this.weights = [];
    }

    /**
     * Determines whether or not the neuron will fire based on the input.
     * @param {number[]} input - An array of numerical inputs to the neuron.
     * @returns {number} 1 if the neuron fires (sum > 0), 0 otherwise.
     */
    predict(input) {
        // Create weights if they do not yet exist, including a bias weight.
        // The number of weights should be input.length + 1 (for bias).
        while (this.weights.length <= input.length) {
            this.weights.push(Math.random() * (NN_CONSTANTS.RANDOM_WEIGHT_MAX - NN_CONSTANTS.RANDOM_WEIGHT_MIN) + NN_CONSTANTS.RANDOM_WEIGHT_MIN); // Random number between -1 and 1
        }

        // The linear equation (sum of (weight * input) + bias)
        let sum = 0;
        for (let i = 0; i < input.length; i++) {
            sum += this.weights[i] * input[i];
        }

        // Add the bias factor (the last weight)
        sum += this.weights[this.weights.length - 1];

        // Activation function: simple step function (did the synapse fire?)
        if (sum > NN_CONSTANTS.ACTIVATION_THRESHOLD) {
            return NN_CONSTANTS.ACTIVATION_OUTPUT_HIGH;
        } else {
            return NN_CONSTANTS.ACTIVATION_OUTPUT_LOW;
        }
    }
}


/**
 * Represents a layer of neurons in a neural network.
 */
class Layer {
    /**
     * @param {number} numNeurons - The number of neurons in this layer.
     */
    constructor(numNeurons) {
        // All the neurons that reside within this layer
        this.neurons = [];

        // Actually create the neurons in the layer
        for (let i = 0; i < numNeurons; i++) {
            this.neurons.push(new Neuron()); // Assuming Neuron class is defined
        }
    }

    /**
     * Performs prediction for all neurons in the layer.
     * @param {number[]} input - The input array from the previous layer or initial input.
     * @returns {number[]} An array of outputs from each neuron in this layer.
     */
    predict(input) {
        const output = [];

        for (const neuron of this.neurons) {
            output.push(neuron.predict(input));
        }

        return output;
    }
}



/**
 * Represents the entire neural network.
 * Handles the creation of layers and the feed-forward prediction process.
 */
class Network {
    constructor() {
        // The layers within the network
        this.layers = [];
        this.init(); // Initialize the network upon creation
    }

    /**
     * Initializes the network by creating its layers with a predefined structure.
     */
    init() {
        this.layers.push(new Layer(NN_CONSTANTS.HIDDEN_LAYER_NEURONS)); // First hidden layer with 3 neurons
        this.layers.push(new Layer(NN_CONSTANTS.HIDDEN_LAYER_NEURONS)); // Second hidden layer with 3 neurons
        this.layers.push(new Layer(NN_CONSTANTS.OUTPUT_LAYER_NEURONS)); // Output layer with 1 neuron to decide flapping
    }

    /**
     * Performs the prediction (feed-forward) through the network.
     * @param {number[]} input - The initial input to the network.
     * @returns {boolean} True if the output neuron fires (decision to flap), false otherwise.
     */
    predict(input) {
        for (const layer of this.layers) {
            input = layer.predict(input); // Each layer's output becomes the input for the next layer
        }
        return input[0] > 0; // Return the boolean result of the output layer's prediction
    }
}

/*–
this is not a constructor, just a function which
creates a mutated copy of another neural net (ideally a parent)
(⚡️⚡️⚡️⚡️)
*/
function mutate(parentNet){
    let mutation = new Network();

    for(let i = 0; i < parentNet.layers.length; i++){
        for(let j = 0; j < parentNet.layers[i].neurons.length; j++){
            for(let k = 0; k < parentNet.layers[i].neurons[j].weights.length; k++){
                const mutationRate = NN_CONSTANTS.MUTATION_RATE;
                if(Math.random() <= mutationRate){
                    mutation.layers[i].neurons[j].weights[k] = Math.random() * (NN_CONSTANTS.RANDOM_WEIGHT_MAX - NN_CONSTANTS.RANDOM_WEIGHT_MIN) + NN_CONSTANTS.RANDOM_WEIGHT_MIN;
                } else {
                    mutation.layers[i].neurons[j].weights[k] = parentNet.layers[i].neurons[j].weights[k];
                }

            }
        }
    }

    return mutation;
}   