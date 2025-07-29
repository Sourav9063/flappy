# Flappy Bird AI with Neural Networks and Genetic Algorithms

This project implements a Flappy Bird game where the birds are controlled by neural networks trained using a genetic algorithm. The goal is to evolve birds that can navigate through pipes for as long as possible.

## Project Structure

- [`learning.js`](learning.js): Contains the core implementation of the neural network (Neuron, Layer, Network classes) and the genetic algorithm's mutation function.
- [`main.js`](main.js): Implements the game logic, rendering on the HTML canvas, bird and pipe mechanics, and orchestrates the neural network training through generations.

---

## 1. Neural Network (`learning.js`)

The `learning.js` file defines the fundamental building blocks of the neural network used by the birds, along with the mutation mechanism for the genetic algorithm.

### Machine Learning Concepts in this Project

This project leverages two core machine learning paradigms: **Neural Networks** for decision-making and **Genetic Algorithms** for training and optimization.

#### Neural Networks

A neural network is a computational model inspired by the biological neural networks that constitute animal brains. It's designed to recognize patterns and make decisions. In this project, each bird possesses a neural network as its "brain."

-   **Neurons**: The basic units of a neural network. Each neuron receives inputs, processes them, and produces an output.
    -   **Inputs**: Numerical values fed into a neuron. In the bird's brain, inputs include its `y` position, `yVelocity`, and the `x` position and `height` of the upcoming pipe.
    -   **Weights**: Numerical values associated with each input. They determine the strength or importance of each input. A higher weight means the corresponding input has a stronger influence on the neuron's output.
    -   **Bias**: An additional value added to the weighted sum of inputs. It allows the neuron to activate even if all inputs are zero, or conversely, to require a stronger input to activate. It acts as a threshold shifter.
    -   **Weighted Sum**: The sum of each input multiplied by its corresponding weight, plus the bias. This is the core calculation within a neuron.
    -   **Activation Function**: A non-linear function applied to the weighted sum. It introduces non-linearity into the network, allowing it to learn complex patterns. In this project, a simple **step function** is used: if the weighted sum exceeds a certain `ACTIVATION_THRESHOLD`, the neuron "fires" (outputs `1`); otherwise, it outputs `0`. This mimics a binary decision (e.g., "flap" or "don't flap").
    -   **Output**: The result produced by the neuron after applying the activation function.

-   **Layers**: Neurons are organized into layers.
    -   **Input Layer**: Receives the initial data (bird's state, pipe's state).
    -   **Hidden Layers**: Intermediate layers that process the inputs from the previous layer and pass them to the next. The "learning" or pattern recognition happens primarily in these layers.
    -   **Output Layer**: Produces the final decision or prediction. In this game, it's a single neuron deciding whether the bird should flap.

#### Genetic Algorithms

Genetic algorithms are a class of optimization algorithms inspired by the process of natural selection. They are particularly well-suited for problems where the search space is large and complex, and where traditional optimization methods might struggle. Here, they are used to "train" the neural networks without explicit backpropagation.

-   **Population**: A group of individuals (in this case, birds, each with a unique neural network brain).
-   **Fitness Function**: A measure of how well an individual performs. For the birds, fitness is directly related to how long they survive and how many pipes they pass (their `score`).
-   **Selection**: The process of choosing individuals from the current generation to become "parents" for the next generation. Birds with higher scores (better fitness) are more likely to be selected.
-   **Crossover (Implicit)**: While not explicitly implemented as a "crossover" function in the traditional sense, the selection of multiple parents and subsequent mutation of their traits to create new birds serves a similar purpose of combining successful attributes.
-   **Mutation**: Random alterations introduced into the "genetic material" (weights) of the offspring. This ensures genetic diversity and allows the algorithm to explore new solutions and prevent premature convergence to suboptimal solutions. The `MUTATION_RATE` controls how frequently these random changes occur.
-   **Generations**: The iterative process where a population evolves over time. In each generation, birds are evaluated, selected, and new offspring are created, gradually improving the overall fitness of the population.

This project combines these concepts: neural networks enable each bird to make decisions, and the genetic algorithm acts as the training mechanism, evolving the network weights over many generations to find optimal strategies for playing the game.

### `NN_CONSTANTS`

This object defines various constants used throughout the neural network implementation, making it easier to adjust parameters like weight ranges, activation thresholds, and network structure.

```javascript
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
```

-   `RANDOM_WEIGHT_MIN`/`MAX`: Define the range for initial random weights.
-   `ACTIVATION_THRESHOLD`: The threshold value for a neuron to "fire" (produce a `1` output).
-   `ACTIVATION_OUTPUT_HIGH`/`LOW`: The output values for an activated/deactivated neuron.
-   `HIDDEN_LAYER_NEURONS`: Number of neurons in each hidden layer.
-   `OUTPUT_LAYER_NEURONS`: Number of neurons in the output layer (1 for the flap decision).
-   `MUTATION_RATE`: The probability of a neuron's weight being randomly changed during mutation.

### `Neuron` Class

A `Neuron` is the basic processing unit of the neural network. It takes inputs, applies weights, sums them up, adds a bias, and then passes the result through an activation function to produce an output.

```javascript
class Neuron {
    constructor() {
        this.weights = []; // Stores weights for each input and a bias weight at the end
    }

    predict(input) {
        // Initialize weights if not already done. The last weight is the bias.
        while (this.weights.length <= input.length) {
            this.weights.push(Math.random() * (NN_CONSTANTS.RANDOM_WEIGHT_MAX - NN_CONSTANTS.RANDOM_WEIGHT_MIN) + NN_CONSTANTS.RANDOM_WEIGHT_MIN);
        }

        // Calculate the weighted sum of inputs
        let sum = 0;
        for (let i = 0; i < input.length; i++) {
            sum += this.weights[i] * input[i];
        }
        // Add the bias
        sum += this.weights[this.weights.length - 1];

        // Activation function (simple step function)
        if (sum > NN_CONSTANTS.ACTIVATION_THRESHOLD) {
            return NN_CONSTANTS.ACTIVATION_OUTPUT_HIGH;
        } else {
            return NN_CONSTANTS.ACTIVATION_OUTPUT_LOW;
        }
    }
}
```

-   **`constructor()`**: Initializes an empty `weights` array.
-   **`predict(input)`**:
    *   **Weight Initialization**: If `weights` are not yet initialized (e.g., for a new neuron), it generates random weights for each input plus one for the bias.
    *   **Weighted Sum**: It calculates the sum of `(weight * input)` for all inputs.
    *   **Bias Addition**: The last weight in the `weights` array is treated as the bias and is added to the sum.
    *   **Activation Function**: A simple step function is used. If the `sum` is greater than `NN_CONSTANTS.ACTIVATION_THRESHOLD` (0 in this case), the neuron "fires" and returns `NN_CONSTANTS.ACTIVATION_OUTPUT_HIGH` (1); otherwise, it returns `NN_CONSTANTS.ACTIVATION_OUTPUT_LOW` (0).

### `Layer` Class

A `Layer` is a collection of `Neuron` objects. All neurons in a layer receive the same input from the previous layer and produce their respective outputs, which then serve as inputs for the next layer.

```javascript
class Layer {
    constructor(numNeurons) {
        this.neurons = [];
        for (let i = 0; i < numNeurons; i++) {
            this.neurons.push(new Neuron());
        }
    }

    predict(input) {
        const output = [];
        for (const neuron of this.neurons) {
            output.push(neuron.predict(input)); // Each neuron in the layer predicts based on the same input
        }
        return output; // Array of outputs from all neurons in this layer
    }
}
```

-   **`constructor(numNeurons)`**: Creates `numNeurons` instances of the `Neuron` class and stores them in the `neurons` array.
-   **`predict(input)`**: Iterates through each neuron in the layer, calls its `predict` method with the given `input`, and collects all individual neuron outputs into an array, which is then returned.

### `Network` Class

The `Network` class represents the entire neural network, composed of multiple `Layer` objects. It handles the overall feed-forward process and includes methods for saving and loading its weights.

```javascript
class Network {
    constructor() {
        this.layers = [];
        this.init(); // Initialize the network structure
    }

    init() {
        // Defines the structure: 2 hidden layers, 1 output layer
        this.layers.push(new Layer(NN_CONSTANTS.HIDDEN_LAYER_NEURONS)); // First hidden layer
        this.layers.push(new Layer(NN_CONSTANTS.HIDDEN_LAYER_NEURONS)); // Second hidden layer
        this.layers.push(new Layer(NN_CONSTANTS.OUTPUT_LAYER_NEURONS)); // Output layer
    }

    predict(input) {
        for (const layer of this.layers) {
            input = layer.predict(input); // Output of one layer becomes input for the next
        }
        return input[0] > 0; // The output neuron's activation determines the flap decision
    }

    save() {
        // Stores all neuron weights in localStorage
        const networkData = [];
        for (const layer of this.layers) {
            const layerData = [];
            for (const neuron of layer.neurons) {
                layerData.push(neuron.weights);
            }
            networkData.push(layerData);
        }
        localStorage.setItem('neuralNetworkWeights', JSON.stringify(networkData));
        console.log('Neural network weights saved to local storage.');
    }

    load() {
        // Loads neuron weights from localStorage
        const savedWeights = localStorage.getItem('neuralNetworkWeights');
        if (savedWeights) {
            const networkData = JSON.parse(savedWeights);
            for (let i = 0; i < networkData.length; i++) {
                for (let j = 0; j < networkData[i].length; j++) {
                    if (this.layers[i] && this.layers[i].neurons[j]) {
                        this.layers[i].neurons[j].weights = networkData[i][j];
                    }
                }
            }
            console.log('Neural network weights loaded from local storage.');
        } else {
            console.log('No saved neural network weights found in local storage.');
        }
    }
}
```

-   **`constructor()`**: Initializes the `layers` array and calls `init()` to set up the network structure.
-   **`init()`**: Defines the network architecture. In this case, it creates two hidden layers with `NN_CONSTANTS.HIDDEN_LAYER_NEURONS` (3) each, and an output layer with `NN_CONSTANTS.OUTPUT_LAYER_NEURONS` (1).
-   **`predict(input)`**: This is the feed-forward pass. It takes an initial `input` array, feeds it through the first layer, then takes that layer's output as input for the next, and so on, until it reaches the final output layer. The output of the single neuron in the output layer (`input[0]`) is checked; if it's greater than 0, the bird "flaps" (returns `true`).
-   **`save()`**: Serializes the `weights` of all neurons across all layers into a JSON string and stores it in `localStorage` under the key `'neuralNetworkWeights'`. This allows the best-performing network from one session to be loaded in a future session.
-   **`load()`**: Retrieves the saved weights from `localStorage`, parses them, and applies them to the current network's neurons. This method ensures that the loaded weights match the network's existing structure.

### `mutate` Function

The `mutate` function is a crucial part of the genetic algorithm. It takes a `parentNet` (a well-performing neural network) and creates a new `Network` instance, introducing small random changes (mutations) to its weights. This process introduces genetic diversity, allowing the algorithm to explore new solutions.

```javascript
function mutate(parentNet){
    const mutation = new Network(); // Create a new network for the mutated child

    for(let i = 0; i < parentNet.layers.length; i++){
        for(let j = 0; j < parentNet.layers[i].neurons.length; j++){
            for(let k = 0; k < parentNet.layers[i].neurons[j].weights.length; k++){
                const mutationRate = NN_CONSTANTS.MUTATION_RATE;
                if(Math.random() <= mutationRate){
                    // Mutate: assign a new random weight
                    mutation.layers[i].neurons[j].weights[k] = Math.random() * (NN_CONSTANTS.RANDOM_WEIGHT_MAX - NN_CONSTANTS.RANDOM_WEIGHT_MIN) + NN_CONSTANTS.RANDOM_WEIGHT_MIN;
                } else {
                    // Don't mutate: inherit weight from parent
                    mutation.layers[i].neurons[j].weights[k] = parentNet.layers[i].neurons[j].weights[k];
                }
            }
        }
    }
    return mutation;
}
```

-   A new `Network` instance (`mutation`) is created.
-   It iterates through all layers, neurons, and weights of the `parentNet`.
-   For each weight, it generates a random number. If this number is less than or equal to `NN_CONSTANTS.MUTATION_RATE` (0.05), the weight is replaced with a new random value within the defined range (`RANDOM_WEIGHT_MIN` to `RANDOM_WEIGHT_MAX`). Otherwise, the weight is copied directly from the `parentNet`.
-   This ensures that most weights are inherited, but a small percentage are randomly altered, promoting exploration in the evolutionary process.

---

## 2. Canvas and Game Logic (`main.js`)

The `main.js` file orchestrates the game, rendering the visual elements on an HTML canvas, managing game state, and implementing the genetic algorithm that drives the bird's AI.

### `CONSTANTS`

Similar to `NN_CONSTANTS`, this object centralizes all numerical literals related to the game's canvas, bird properties, pipe properties, brain visualization, and game timing.

```javascript
const CONSTANTS = {
  // Canvas and rendering
  CANVAS_SCALE_FACTOR: 2,
  INITIAL_CANVAS_OFFSET_X: 0,
  TEXT_OFFSET_X_FACTOR: 1 / 50,
  TEXT_GENERATION_OFFSET_Y_FACTOR: 1 / 10,
  TEXT_ALIVE_OFFSET_Y_FACTOR: 1 / 5,
  FONT_SIZE_DIVISOR: 25,

  // Bird properties
  BIRD_INITIAL_Y: 0.5,
  BIRD_INITIAL_X: 0,
  BIRD_INITIAL_Y_VELOCITY: 0,
  BIRD_GRAVITY: 0.0003,
  BIRD_FLAP_VELOCITY: -0.008,
  BIRD_MAX_Y_BOUNDARY: 1,
  BIRD_MIN_Y_BOUNDARY: 0,
  BIRD_RADIUS_FACTOR: 0.025,
  NUM_PARENTS_TO_SELECT: 10,
  NUM_NEW_BIRDS: 999,
  INITIAL_BIRDS_COUNT: 1000,

  // Pipe properties
  PIPE_INITIAL_X_OFFSET: 1,
  PIPE_HEIGHT_RANDOM_FACTOR: 0.75,
  PIPE_HEIGHT_MIN_FACTOR: 0.125,
  PIPE_MOVEMENT_SPEED: 0.01,
  PIPE_WIDTH_FACTOR: 0.1,
  PIPE_GAP_HEIGHT_FACTOR: 0.1,
  PIPE_OFFSCREEN_THRESHOLD_X: 0.1,
  PIPE_GENERATION_INTERVAL: 1500,

  // Brain visualization properties
  BRAIN_Y_STEP_NUMERATOR: 1,
  BRAIN_LINE_WIDTH_FACTOR: 0.005,
  BRAIN_X_POS_DIVISOR: 4,
  BRAIN_Y_POS_DIVISOR: 3,
  BRAIN_X_POS_OFFSET_FACTOR: 3 / 4,
  BRAIN_NEURON_RADIUS_FACTOR: 0.01,
  BRAIN_INNER_NEURON_RADIUS_FACTOR: 0.5,

  // Game loop timing
  MS_PER_SECOND: 1000,
  FPS: 60,
  GAME_LOOP_INTERVAL_MS: 1000 / 60,

  // Math
  FULL_CIRCLE_RADIANS: Math.PI * 2,
};
```

This object contains values for:
-   **Canvas and Rendering**: Scaling factor, text positioning, font size.
-   **Bird Properties**: Initial position, velocity, gravity, flap strength, boundaries, and parameters for the genetic algorithm (number of parents, new birds, initial population).
-   **Pipe Properties**: Initial position, height, movement speed, width, gap size, and generation interval.
-   **Brain Visualization**: Parameters for drawing the neural network on the canvas, including line widths, positions, and neuron sizes.
-   **Game Loop Timing**: Milliseconds per second, frames per second, and the interval for the game loop.
-   **Math**: Common mathematical constants like `Math.PI * 2` for a full circle.

### Canvas Setup

The game uses an HTML `canvas` element for rendering. The canvas is dynamically created and appended to the document body. A `canvasScaleFactor` is applied to ensure crisp rendering on high-DPI displays.

```javascript
const mainCanvas = document.createElement("canvas");
document.body.appendChild(mainCanvas);

const canvasScaleFactor = 2;
mainCanvas.width = canvasScaleFactor * window.innerWidth;
mainCanvas.height = canvasScaleFactor * window.innerHeight;

const mainCtx = mainCanvas.getContext("2d");
```

-   `mainCanvas`: The primary canvas element.
-   `canvasScaleFactor`: Multiplies the `innerWidth` and `innerHeight` to create a canvas with a higher resolution, then scales it down using CSS (implicitly by the browser) to fit the window, resulting in sharper visuals.
-   `mainCtx`: The 2D rendering context used for all drawing operations on `mainCanvas`.

### Global Game State Variables

Several global variables manage the game's state, including lists of active birds and pipes, game timers, and genetic algorithm related data.

```javascript
let birds = []; // Array to hold all active bird instances
let pipes = []; // Array to hold all active pipe instances
let pipeGenerationTimer = 1500; // Timer for controlling new pipe generation
let currentFrontPipe; // Reference to the pipe currently in front of the bird
let deadBirds = []; // Array to store birds that have died in the current generation
let bestBird; // Reference to the best performing bird from the previous generation
let generationNumber = parseInt(localStorage.getItem("generationNumber")) || 1; // Current generation number, loaded from local storage
```

-   `generationNumber`: Persisted using `localStorage` to keep track of the evolutionary progress across sessions.

### `Bird` Class

The `Bird` class represents a single bird in the game. Each bird has a position, velocity, score, and, most importantly, a `brain` (a `Network` instance from `learning.js`) that dictates its flapping behavior.

```javascript
class Bird {
  constructor() {
    birds.push(this); // Add to global birds array
    this.score = 0;
    this.color = "rgba(0, 0, 0, 0.2)";
    this.y = CONSTANTS.BIRD_INITIAL_Y; // Normalized Y-position (0 to 1)
    this.x = CONSTANTS.BIRD_INITIAL_X; // Normalized X-position
    this.yVelocity = CONSTANTS.BIRD_INITIAL_Y_VELOCITY;
    this.brain = new Network(); // Each bird gets its own neural network
    this.gravity = CONSTANTS.BIRD_GRAVITY;
    this.dead = false;
  }

  update() {
    if (!this.dead) {
      this.score++;
    }
    this.yVelocity += this.gravity;
    this.y += this.yVelocity;

    // AI decision: predict whether to flap based on current state and next pipe
    if (
      this.brain.predict([
        this.y, // Bird's current Y-position
        this.yVelocity, // Bird's current Y-velocity
        currentFrontPipe.height, // Height of the gap in the current front pipe
        currentFrontPipe.x, // X-position of the current front pipe
      ])
    ) {
      this.yVelocity = CONSTANTS.BIRD_FLAP_VELOCITY; // Flap upwards
    }

    // Collision detection: boundaries and pipes
    if (
      this.y > CONSTANTS.BIRD_MAX_Y_BOUNDARY ||
      this.y < CONSTANTS.BIRD_MIN_Y_BOUNDARY
    ) {
      this.dead = true;
      deadBirds.push(this);
      return false;
    }

    for (const p of pipes) {
      if (
        this.x > p.x &&
        this.x < p.x + CONSTANTS.PIPE_WIDTH_FACTOR &&
        Math.abs(this.y - p.height) > CONSTANTS.PIPE_GAP_HEIGHT_FACTOR
      ) {
        this.dead = true;
        deadBirds.push(this);
        return false;
      }
    }
    return true; // Bird is still alive
  }

  draw() {
    if (!this.dead) {
      mainCtx.beginPath();
      mainCtx.fillStyle = this.color;
      mainCtx.arc(
        (mainCanvas.width - mainCanvas.height) / 2, // X-position adjusted for game area
        this.y * mainCanvas.height, // Y-position scaled to canvas height
        mainCanvas.height * CONSTANTS.BIRD_RADIUS_FACTOR, // Radius scaled to canvas height
        0,
        CONSTANTS.FULL_CIRCLE_RADIANS,
      );
      mainCtx.fill();
      mainCtx.closePath();
    }
  }
}
```

-   **`constructor()`**: Initializes the bird's properties (score, color, position, velocity) and creates a new `Network` instance for its `brain`.
-   **`update()`**:
    *   Increments the bird's `score` if it's alive.
    *   Applies `gravity` to `yVelocity` and updates `y` position.
    *   **AI Decision**: The bird's `brain.predict()` method is called with a set of inputs: its current `y` position, `yVelocity`, the `height` of the current front pipe's gap, and the `x` position of the current front pipe. If the brain predicts a "flap" (returns `true`), the `yVelocity` is set to `CONSTANTS.BIRD_FLAP_VELOCITY` (a negative value to move upwards).
    *   **Collision Detection**: Checks for collisions with the top/bottom boundaries of the canvas and with pipes. If a collision occurs, the `dead` flag is set to `true`, and the bird is added to the `deadBirds` array.
-   **`draw()`**: Renders the bird as a circle on the `mainCanvas` if it's not dead. The bird's normalized `y` position is scaled to the actual canvas height for drawing.

### `Pipe` Class

The `Pipe` class manages the obstacles that the birds must navigate through.

```javascript
class Pipe {
  constructor() {
    pipes.push(this); // Add to global pipes array
    this.x =
      (mainCanvas.width - mainCanvas.height) / 2 / mainCanvas.height +
      CONSTANTS.PIPE_INITIAL_X_OFFSET; // Initial X-position (off-screen right)
    this.color = "black";
    this.height =
      Math.random() * CONSTANTS.PIPE_HEIGHT_RANDOM_FACTOR +
      CONSTANTS.PIPE_HEIGHT_MIN_FACTOR; // Random gap height
  }

  update() {
    this.x -= CONSTANTS.PIPE_MOVEMENT_SPEED; // Move pipe to the left

    // Remove pipe if it moves off-screen to the left
    if (
      this.x <
      -((mainCanvas.width - mainCanvas.height) / 2) / mainCanvas.height -
        CONSTANTS.PIPE_OFFSCREEN_THRESHOLD_X
    ) {
      pipes.shift(); // Remove the oldest pipe
      return false;
    }
    return true;
  }

  draw() {
    mainCtx.fillStyle = this.color;
    // Draw top part of the pipe
    mainCtx.fillRect(
      this.x * mainCanvas.height + (mainCanvas.width - mainCanvas.height) / 2,
      0,
      mainCanvas.height * CONSTANTS.PIPE_WIDTH_FACTOR,
      mainCanvas.height * (this.height - CONSTANTS.PIPE_GAP_HEIGHT_FACTOR),
    );
    // Draw bottom part of the pipe
    mainCtx.fillRect(
      this.x * mainCanvas.height + (mainCanvas.width - mainCanvas.height) / 2,
      (this.height + CONSTANTS.PIPE_GAP_HEIGHT_FACTOR) * mainCanvas.height,
      mainCanvas.height * CONSTANTS.PIPE_WIDTH_FACTOR,
      mainCanvas.height,
    );
  }
}
```

-   **`constructor()`**: Initializes the pipe's `x` position (initially off-screen to the right), color, and a random `height` for its gap.
-   **`update()`**: Moves the pipe to the left by `CONSTANTS.PIPE_MOVEMENT_SPEED`. If the pipe moves completely off-screen, it's removed from the `pipes` array.
-   **`draw()`**: Renders the pipe on the canvas using two `fillRect` calls for the top and bottom sections, leaving a gap in between.

### `drawBrain` Function

This function visualizes the neural network of the best bird on the canvas, showing neurons as circles and connections (weights) as lines. This provides a real-time view of how the AI is structured and what its current state looks like.

```javascript
function drawBrain(brain) {
  // Iterate through the layers of the brain from output to input
  for (let i = brain.layers.length - 1; i >= 0; i--) {
    // Calculate vertical step for neurons in the current layer
    const yStep =
      CONSTANTS.BRAIN_Y_STEP_NUMERATOR / (1 + brain.layers[i].neurons.length);
    let lineStep;
    // Calculate vertical step for connections (lines) from the previous layer
    if (i !== 0) {
      lineStep =
        CONSTANTS.BRAIN_Y_STEP_NUMERATOR /
        (1 + brain.layers[i - 1].neurons.length);
    } else {
      lineStep = CONSTANTS.BRAIN_Y_STEP_NUMERATOR / 5; // Special case for the input layer
    }

    // Draw connections (lines) between neurons of adjacent layers
    for (let j = 1; j * yStep < 1; j++) {
      for (let k = 1; k * lineStep < 1; k++) {
        mainCtx.beginPath();
        // Line width represents the absolute weight of the connection
        mainCtx.lineWidth =
          Math.abs(brain.layers[i].neurons[j - 1].weights[k - 1]) *
          mainCanvas.height *
          CONSTANTS.BRAIN_LINE_WIDTH_FACTOR;
        // Color connections based on weight sign (red for positive, blue for negative)
        if (brain.layers[i].neurons[j - 1].weights[k - 1] > 0) {
          mainCtx.strokeStyle = "red";
        } else {
          mainCtx.strokeStyle = "blue";
        }
        // Define start and end points of the connection line
        mainCtx.moveTo(
          (mainCanvas.width / CONSTANTS.BRAIN_X_POS_DIVISOR) *
            (i / brain.layers.length) +
            mainCanvas.width * CONSTANTS.BRAIN_X_POS_OFFSET_FACTOR,
          (mainCanvas.height / CONSTANTS.BRAIN_Y_POS_DIVISOR) * j * yStep,
        );
        mainCtx.lineTo(
          (mainCanvas.width / CONSTANTS.BRAIN_X_POS_DIVISOR) *
            ((i - 1) / brain.layers.length) +
            mainCanvas.width * CONSTANTS.BRAIN_X_POS_OFFSET_FACTOR,
          (mainCanvas.height / CONSTANTS.BRAIN_Y_POS_DIVISOR) * k * lineStep,
        );
        mainCtx.stroke();
        mainCtx.closePath();
      }
    }

    // Draw neurons (circles) in the current layer
    for (let j = 1; j * yStep < 1; j++) {
      mainCtx.beginPath();
      mainCtx.arc(
        (mainCanvas.width / CONSTANTS.BRAIN_X_POS_DIVISOR) *
          (i / brain.layers.length) +
          mainCanvas.width * CONSTANTS.BRAIN_X_POS_OFFSET_FACTOR,
        (mainCanvas.height / CONSTANTS.BRAIN_Y_POS_DIVISOR) * j * yStep,
        mainCanvas.height * CONSTANTS.BRAIN_NEURON_RADIUS_FACTOR,
        0,
        CONSTANTS.FULL_CIRCLE_RADIANS,
      );
      mainCtx.fillStyle = "black";
      mainCtx.fill();
      mainCtx.closePath();

      mainCtx.beginPath();
      mainCtx.arc(
        (mainCanvas.width / CONSTANTS.BRAIN_X_POS_DIVISOR) *
          (i / brain.layers.length) +
          mainCanvas.width * CONSTANTS.BRAIN_X_POS_OFFSET_FACTOR,
        (mainCanvas.height / CONSTANTS.BRAIN_Y_POS_DIVISOR) * j * yStep,
        mainCanvas.height *
          CONSTANTS.BRAIN_NEURON_RADIUS_FACTOR *
          CONSTANTS.BRAIN_INNER_NEURON_RADIUS_FACTOR,
        0,
        CONSTANTS.FULL_CIRCLE_RADIANS,
      );
      mainCtx.fillStyle = "rgba(255, 255, 255, 0.2)";
      mainCtx.fill();
      mainCtx.closePath();

      // Radius of inner circle represents the absolute bias of the neuron
      const biasRadius =
        Math.abs(
          brain.layers[i].neurons[j - 1].weights[
            brain.layers[i].neurons[j - 1].weights.length - 1
          ],
        ) / 2;
      // Color inner circle based on bias sign
      if (
        brain.layers[i].neurons[j - 1].weights[
          brain.layers[i].neurons[j - 1].weights.length - 1
        ] > 0
      ) {
        mainCtx.fillStyle = "red";
      } else {
        mainCtx.fillStyle = "blue";
      }

      mainCtx.beginPath();
      mainCtx.arc(
        (mainCanvas.width / CONSTANTS.BRAIN_X_POS_DIVISOR) *
          (i / brain.layers.length) +
          mainCanvas.width * CONSTANTS.BRAIN_X_POS_OFFSET_FACTOR,
        (mainCanvas.height / CONSTANTS.BRAIN_Y_POS_DIVISOR) * j * yStep,
        mainCanvas.height * CONSTANTS.BRAIN_NEURON_RADIUS_FACTOR * biasRadius,
        0,
        CONSTANTS.FULL_CIRCLE_RADIANS,
      );
      mainCtx.fill();
      mainCtx.closePath();
    }

    // Draw neurons in the previous layer (for input connections)
    for (let k = 1; k * lineStep < 1; k++) {
      mainCtx.beginPath();
      mainCtx.arc(
        (mainCanvas.width / CONSTANTS.BRAIN_X_POS_DIVISOR) *
          ((i - 1) / brain.layers.length) +
          mainCanvas.width * CONSTANTS.BRAIN_X_POS_OFFSET_FACTOR,
        (mainCanvas.height / CONSTANTS.BRAIN_Y_POS_DIVISOR) * k * lineStep,
        mainCanvas.height * CONSTANTS.BRAIN_NEURON_RADIUS_FACTOR,
        0,
        CONSTANTS.FULL_CIRCLE_RADIANS,
      );
      mainCtx.fillStyle = "black";
      mainCtx.fill();
      mainCtx.closePath();
    }
  }
}
```

-   **Connections (Lines)**: Lines are drawn between neurons of adjacent layers. Their `lineWidth` is proportional to the absolute value of the weight they represent. `strokeStyle` is "red" for positive weights and "blue" for negative weights.
-   **Neurons (Circles)**: Neurons are drawn as black circles. An inner circle represents the neuron's bias. Its radius is proportional to the absolute bias value, and its `fillStyle` is "red" for positive bias and "blue" for negative bias.

### `update` Game Loop Function

The `update` function is the heart of the game, executed repeatedly by `setInterval`. It manages the game's progression, the genetic algorithm, and all rendering.

```javascript
function update() {
  // Adjust canvas size
  mainCanvas.width = canvasScaleFactor * window.innerWidth;
  mainCanvas.height = canvasScaleFactor * window.innerHeight;

  // Genetic Algorithm: New Generation Logic
  if (deadBirds.length === birds.length) { // All birds have died
    generationNumber++;
    localStorage.setItem("generationNumber", generationNumber.toString()); // Save generation number
    birds.sort((a, b) => b.score - a.score); // Sort by score to find best performers

    const parents = [];
    for (let i = 0; i < CONSTANTS.NUM_PARENTS_TO_SELECT; i++) {
      parents.push(birds[i]); // Select top performers as parents
      // Reset parent birds for next generation
      birds[i].dead = false;
      birds[i].y = CONSTANTS.BIRD_INITIAL_Y;
      birds[i].yVelocity = CONSTANTS.BIRD_INITIAL_Y_VELOCITY;
      birds[i].score = 0;
    }

    // Reset game state
    birds = [];
    deadBirds = [];
    pipes = [];

    // Create new birds, mutating brains from selected parents
    for (let i = 0; i < CONSTANTS.NUM_NEW_BIRDS; i++) {
      const newBird = new Bird();
      newBird.brain = mutate(parents[~~(Math.random() * parents.length)].brain);
    }
    birds.push(parents[0]); // Ensure the absolute best bird (unmutated) is carried over
    bestBird = parents[0];
    bestBird.brain.save(); // Save the best bird's brain to local storage
  }

  // Pipe Generation
  pipeGenerationTimer += CONSTANTS.MS_PER_SECOND / CONSTANTS.FPS;
  if (pipeGenerationTimer > CONSTANTS.PIPE_GENERATION_INTERVAL) {
    pipeGenerationTimer = 0;
    new Pipe();
  }

  // Identify the current front pipe for AI input
  for (let i = 0; i < pipes.length; i++) {
    if (pipes[i].x > CONSTANTS.PIPE_OFFSCREEN_THRESHOLD_X) {
      currentFrontPipe = pipes[i];
      break;
    }
  }

  // Rendering: Clear canvas and draw elements
  mainCtx.fillStyle = "white";
  mainCtx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);

  for (const birdInstance of birds) {
    birdInstance.update();
    birdInstance.draw();
  }

  for (let i = 0; i < pipes.length; i++) {
    if (!pipes[i].update()) {
      i--; // Decrement index if a pipe was removed
    } else {
      pipes[i].draw();
    }
  }

  // Draw the brain of the best bird
  if (bestBird !== undefined) {
    drawBrain(bestBird.brain);
  } else {
    drawBrain(birds[0].brain);
  }

  // Display game information (Generation, Birds Alive)
  mainCtx.textAlign = "left";
  mainCtx.fillStyle = "black";
  mainCtx.strokeStyle = "white";
  mainCtx.font = "bold " + Math.floor(mainCanvas.height / CONSTANTS.FONT_SIZE_DIVISOR) + "px arial";
  mainCtx.fillText("Generation: " + generationNumber, mainCanvas.width * CONSTANTS.TEXT_OFFSET_X_FACTOR, mainCanvas.height * CONSTANTS.TEXT_GENERATION_OFFSET_Y_FACTOR);
  mainCtx.fillText("Num alive: " + (birds.length - deadBirds.length), mainCanvas.width * CONSTANTS.TEXT_OFFSET_X_FACTOR, mainCanvas.height * CONSTANTS.TEXT_ALIVE_OFFSET_Y_FACTOR);
}

// Initial bird creation and game start
for (let i = 0; i < CONSTANTS.INITIAL_BIRDS_COUNT; i++) {
  const newBird = new Bird();
  newBird.brain.load(); // Attempt to load saved brain for the first birds
  if (i > 0) {
    newBird.brain = mutate(newBird.brain); // Mutate subsequent birds
  }
}

setInterval(update, CONSTANTS.GAME_LOOP_INTERVAL_MS);
```

-   **Canvas Resizing**: The canvas dimensions are adjusted to match the window size on each frame, ensuring responsiveness.
-   **Genetic Algorithm (New Generation)**:
    *   When all birds in the current `birds` array have died (`deadBirds.length === birds.length`), a new generation begins.
    *   The `generationNumber` is incremented and saved to `localStorage`.
    *   Birds are sorted by `score` in descending order.
    *   The top `CONSTANTS.NUM_PARENTS_TO_SELECT` (10) birds are selected as `parents`. Their properties are reset for the new generation.
    *   The `birds`, `deadBirds`, and `pipes` arrays are cleared.
    *   `CONSTANTS.NUM_NEW_BIRDS` (999) new birds are created. Each new bird's `brain` is generated by `mutate()`ing a randomly selected parent's brain.
    *   The absolute best bird from the previous generation (`parents[0]`) is added back to the `birds` array (unmutated) to ensure the best traits are carried over directly. Its brain is also `save()`d to `localStorage`.
-   **Pipe Generation**: A new `Pipe` is created at regular intervals determined by `CONSTANTS.PIPE_GENERATION_INTERVAL`.
-   **`currentFrontPipe`**: The function iterates through active pipes to identify the one closest to the bird but still ahead of it, providing crucial input for the AI.
-   **Rendering**:
    *   The `mainCanvas` is cleared and filled with a white background.
    *   All active birds and pipes are updated (`update()`) and then drawn (`draw()`).
    *   The `drawBrain()` function visualizes the neural network of the `bestBird` (or the first bird if `bestBird` is not yet defined).
    *   Game information (current generation and number of alive birds) is displayed on the canvas.
-   **Initialization**: At the start, `CONSTANTS.INITIAL_BIRDS_COUNT` (1000) birds are created. Each bird's brain attempts to `load()` saved weights. For all but the first bird, their brains are `mutate()`d from themselves (effectively randomizing if no saved brain exists).
-   **Game Loop**: The `setInterval(update, CONSTANTS.GAME_LOOP_INTERVAL_MS)` call continuously runs the `update` function at a fixed frame rate (60 FPS).