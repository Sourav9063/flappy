// //this is a constructor i promise i know it doesn't look like it
// function neuron(){
//     //weights are the variables in the linear equation the neuron uses to activate
//     this.weights = [];

//     //determines whether or not the neuron will fire
//     this.predict = (input) => {
//         //create weights if they do not yet exist, including bias weight
//         while(this.weights.length <= input.length){
//             this.weights.push(Math.random() * 2 - 1); //random number between -1 and 1
//         }

//         //the equation from the paper
//         let sum = 0;
//         for(let i = 0; i < input.length; i++){
//             sum += this.weights[i] * input[i];
//         }

//         //add bias factor
//         sum += this.weights[this.weights.length - 1];

//         //did the synapse fire? if so, return 1
//         if(sum > 0){
//             return 1;
//         } else {
//             return 0;
//         }
//     }
// }


// //yet another confusing constructor (🔥🔥🔥🔥)
// function layer(numNeurons){
//     //all the neurons that reside within the layer
//     this.neurons = [];

//     //actually create the neurons in the layer
//     for(let i = 0; i < numNeurons; i++){
//         this.neurons.push(new neuron());
//     }

//     //do prediction for the layer
//     this.predict = (input) => {
//         let output = [];

//         for(let neuron of this.neurons){
//             output.push(neuron.predict(input));
//         }

//         return output;
//     }
// }



// //the whole network! (⚡️⚡️⚡️ constructor)(using ⚡️ instead of 🔥 to save the environment)
// function net(){
//     //the layers within the network
//     this.layers = [];

//     //initializes the network
//     this.init = () => {
//         this.layers.push(new layer(3)); //first hidden layer, 3 neurons
//         this.layers.push(new layer(3)); //second hidden layer, 3 neurons
//         this.layers.push(new layer(1)); //output layer, 1 neuron who decides to flap
//     }

//     //do the prediction! this is called "feed-forward"
//     this.predict = (input) => {
//         for(let layer of this.layers){
//             input = layer.predict(input); //each layer creates the input for the next layer
//         }


//         return input[0] > 0; //return result of output layer!
//     }

//     this.init();
// }

// /*–
// this is not a constructor, just a function which
// creates a mutated copy of another neural net (ideally a parent)
// (⚡️⚡️⚡️⚡️)
// */
// function mutate(parentNet){
//     let mutation = new net();

//     for(let i = 0; i < parentNet.layers.length; i++){
//         for(let j = 0; j < parentNet.layers[i].neurons.length; j++){
//             for(let k = 0; k < parentNet.layers[i].neurons[j].weights.length; k++){
//                 let mutationRate = 0.05;
//                 if(Math.random() <= mutationRate){
//                     mutation.layers[i].neurons[j].weights[k] = Math.random() * 2 - 1;
//                 } else {
//                     mutation.layers[i].neurons[j].weights[k] = parentNet.layers[i].neurons[j].weights[k];
//                 }

//             }
//         }
//     }

//     return mutation;
// }   