// Define game constants for easier modification and readability
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

// Main canvas for rendering the game
const mainCanvas = document.createElement("canvas");
// Offscreen canvas (currently unused, but kept for potential future use)
const offscreenCanvas = document.createElement("canvas");

document.body.appendChild(mainCanvas);
//document.body.appendChild(offscreenCanvas); // Offscreen canvas is not appended to the DOM

// Scaling factor for canvas resolution to ensure crisp rendering on high-DPI screens
const canvasScaleFactor = 2;
mainCanvas.width = canvasScaleFactor * window.innerWidth;
mainCanvas.height = canvasScaleFactor * window.innerHeight;

offscreenCanvas.width = canvasScaleFactor * window.innerWidth;
offscreenCanvas.height = canvasScaleFactor * window.innerHeight;

// 2D rendering context for the main canvas
const mainCtx = mainCanvas.getContext("2d");

// Array to hold all active bird instances
let birds = [];
// Array to hold all active pipe instances
let pipes = [];

// Timer for controlling the generation of new pipes (milliseconds)
let pipeGenerationTimer = 1500;

// Reference to the pipe currently in front of the bird, used for AI prediction
let currentFrontPipe;

// Array to store birds that have died in the current generation
let deadBirds = [];

// Reference to the best performing bird from the previous generation
let bestBird;

// Current generation number for the evolutionary algorithm
let generationNumber = parseInt(localStorage.getItem("generationNumber")) || 1;

/**
 * Represents a bird in the Flappy Bird game.
 * Each bird has a neural network brain to decide when to flap.
 */
class Bird {
  constructor() {
    birds.push(this); // Add this bird to the global birds array
    this.score = 0; // Score for the current bird in the current generation
    this.color = "rgba(0, 0, 0, 0.2)"; // Color of the bird (transparent black)
    this.y = CONSTANTS.BIRD_INITIAL_Y; // Y-position of the bird (normalized, 0 to 1)
    this.x = CONSTANTS.BIRD_INITIAL_X; // X-position of the bird (normalized)
    this.yVelocity = CONSTANTS.BIRD_INITIAL_Y_VELOCITY; // Vertical velocity of the bird
    this.brain = new Network(); // Neural network for bird's AI decisions
    this.gravity = CONSTANTS.BIRD_GRAVITY; // Gravity applied to the bird
    this.dead = false; // Flag indicating if the bird is dead
  }

  /**
   * Updates the bird's state, including position, velocity, and collision detection.
   * @returns {boolean} True if the bird is alive, false otherwise.
   */
  update() {
    if (!this.dead) {
      this.score++; // Increment score if bird is alive
    }
    this.yVelocity += this.gravity; // Apply gravity
    this.y += this.yVelocity; // Update Y-position based on velocity

    // AI decision to flap based on current state and next pipe
    if (
      this.brain.predict([
        this.y,
        this.yVelocity,
        currentFrontPipe.height,
        currentFrontPipe.x,
      ])
    ) {
      this.yVelocity = CONSTANTS.BIRD_FLAP_VELOCITY; // Flap upwards
    }

    // Check for out-of-bounds collision (top or bottom of canvas)
    if (
      this.y > CONSTANTS.BIRD_MAX_Y_BOUNDARY ||
      this.y < CONSTANTS.BIRD_MIN_Y_BOUNDARY
    ) {
      if (!this.dead) {
        deadBirds.push(this); // Add to dead birds list if not already dead
      }
      this.dead = true;
      return false;
    }

    // Check for collision with pipes
    for (const p of pipes) {
      // Collision detection logic: checks if bird is within pipe's X-range and outside the gap
      if (
        this.x > p.x &&
        this.x < p.x + CONSTANTS.PIPE_WIDTH_FACTOR &&
        Math.abs(this.y - p.height) > CONSTANTS.PIPE_GAP_HEIGHT_FACTOR
      ) {
        if (!this.dead) {
          deadBirds.push(this); // Add to dead birds list if not already dead
        }
        this.dead = true;
        return false;
      }
    }
    return true; // Bird is still alive
  }

  /**
   * Draws the bird on the canvas.
   */
  draw() {
    if (!this.dead) {
      mainCtx.beginPath();
      mainCtx.fillStyle = this.color;
      // Draw bird as a circle
      mainCtx.arc(
        (mainCanvas.width - mainCanvas.height) / 2,
        this.y * mainCanvas.height,
        mainCanvas.height * CONSTANTS.BIRD_RADIUS_FACTOR,
        0,
        CONSTANTS.FULL_CIRCLE_RADIANS,
      );
      mainCtx.fill();
      mainCtx.closePath();
    }
  }
}

/**
 * Represents a pipe obstacle in the Flappy Bird game.
 */
class Pipe {
  constructor() {
    pipes.push(this); // Add this pipe to the global pipes array
    // Initial X-position of the pipe, just off the right edge of the visible game area
    this.x =
      (mainCanvas.width - mainCanvas.height) / 2 / mainCanvas.height +
      CONSTANTS.PIPE_INITIAL_X_OFFSET;
    this.color = "black"; // Color of the pipe
    // Random height for the pipe's gap, ensuring it's within a reasonable range
    this.height =
      Math.random() * CONSTANTS.PIPE_HEIGHT_RANDOM_FACTOR +
      CONSTANTS.PIPE_HEIGHT_MIN_FACTOR;
  }

  /**
   * Updates the pipe's state, moving it across the screen.
   * @returns {boolean} True if the pipe is still on screen, false if it should be removed.
   */
  update() {
    this.x -= CONSTANTS.PIPE_MOVEMENT_SPEED; // Move pipe to the left

    // If pipe moves off-screen to the left, remove it from the array
    if (
      this.x <
      -((mainCanvas.width - mainCanvas.height) / 2) / mainCanvas.height -
        CONSTANTS.PIPE_OFFSCREEN_THRESHOLD_X
    ) {
      pipes.shift(); // Remove the first (oldest) pipe
      return false; // Indicate that this pipe is no longer active
    }
    return true; // Pipe is still active
  }

  /**
   * Draws the pipe on the canvas.
   */
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

/**
 * Draws a visual representation of the neural network's brain.
 * This function visualizes the layers, neurons, and connections (weights) of the brain.
 * @param {object} brain - The neural network brain object to draw.
 */
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

/**
 * Main update loop for the game.
 * Handles game state updates, bird and pipe logic, and rendering.
 */
function update() {
  // Adjust canvas size to window dimensions with the scaling factor
  mainCanvas.width = canvasScaleFactor * window.innerWidth;
  mainCanvas.height = canvasScaleFactor * window.innerHeight;

  // Check if all birds in the current generation have died
  if (deadBirds.length === birds.length) {
    generationNumber++; // Increment generation count
    localStorage.setItem("generationNumber", generationNumber.toString()); // Save generation number
    // Sort birds by score to identify the best performers
    birds.sort((a, b) => {
      return b.score - a.score;
    });

    const parents = [];
    // Select the top 10 birds as parents for the next generation
    for (let i = 0; i < CONSTANTS.NUM_PARENTS_TO_SELECT; i++) {
      parents.push(birds[i]);
      // Reset parent birds for the new generation
      birds[i].dead = false;
      birds[i].y = CONSTANTS.BIRD_INITIAL_Y;
      birds[i].yVelocity = CONSTANTS.BIRD_INITIAL_Y_VELOCITY;
      birds[i].score = 0;
    }

    // Reset game state for the new generation
    birds = [];
    deadBirds = [];
    pipes = [];

    // Create new birds for the next generation, mutating brains from parents
    for (let i = 0; i < CONSTANTS.NUM_NEW_BIRDS; i++) {
      const newBird = new Bird();
      newBird.brain = mutate(parents[~~(Math.random() * parents.length)].brain);
    }
    birds.push(parents[0]); // Ensure the absolute best bird is carried over
    bestBird = parents[0]; // Set the best bird for visualization
    bestBird.brain.save(); // Save the best bird's brain to local storage
  }

  // Update pipe generation timer and create new pipes
  pipeGenerationTimer += CONSTANTS.MS_PER_SECOND / CONSTANTS.FPS; // Assuming 60 FPS
  if (pipeGenerationTimer > CONSTANTS.PIPE_GENERATION_INTERVAL) {
    // Generate a new pipe every 1500ms
    pipeGenerationTimer = 0;
    new Pipe();
  }

  // Determine the pipe currently in front of the bird for AI input
  for (let i = 0; i < pipes.length; i++) {
    if (pipes[i].x > CONSTANTS.PIPE_OFFSCREEN_THRESHOLD_X) {
      // If pipe is still visible on screen
      currentFrontPipe = pipes[i];
      break;
    }
  }

  // Clear the entire canvas for redrawing and set a white background
  mainCtx.fillStyle = "white";
  mainCtx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);

  // Update and draw all active birds
  for (const birdInstance of birds) {
    birdInstance.update();
    birdInstance.draw();
  }

  // Update and draw all active pipes
  for (let i = 0; i < pipes.length; i++) {
    if (!pipes[i].update()) {
      i--;
    } else {
      pipes[i].draw();
    }
  }

  // Draw the brain of the best bird or the first bird if no best is defined yet
  if (bestBird !== undefined) {
    drawBrain(bestBird.brain);
  } else {
    drawBrain(birds[0].brain);
  }

  // Display game information (Generation, Birds Alive)
  mainCtx.textAlign = "left";
  mainCtx.fillStyle = "black";
  mainCtx.strokeStyle = "white";
  mainCtx.font =
    "bold " +
    Math.floor(mainCanvas.height / CONSTANTS.FONT_SIZE_DIVISOR) +
    "px arial";
  mainCtx.fillText(
    "Generation: " + generationNumber,
    mainCanvas.width * CONSTANTS.TEXT_OFFSET_X_FACTOR,
    mainCanvas.height * CONSTANTS.TEXT_GENERATION_OFFSET_Y_FACTOR,
  );
  mainCtx.fillText(
    "Num alive: " + (birds.length - deadBirds.length),
    mainCanvas.width * CONSTANTS.TEXT_OFFSET_X_FACTOR,
    mainCanvas.height * CONSTANTS.TEXT_ALIVE_OFFSET_Y_FACTOR,
  );
}

// Initialize birds, attempting to load a saved brain if available
for (let i = 0; i < CONSTANTS.INITIAL_BIRDS_COUNT; i++) {
  const newBird = new Bird();
  newBird.brain.load();
  if (i > 0) {
    newBird.brain = mutate(newBird.brain);
  }
}

setInterval(update, CONSTANTS.GAME_LOOP_INTERVAL_MS);
