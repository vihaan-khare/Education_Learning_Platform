# Training Guide: SignConnect Gesture Recognition

This guide explains how the interaction model works and how you can "train" or refine it to recognize more complex sign language gestures.

---

## 1. How Recognition Works
Currently, SignConnect uses a **Heuristic Model**. This means it looks at the 21 landmarks (points) on your hand provided by MediaPipe and follows specific rules we wrote.

### Hand Landmarks Reference
Every hand detection provides 21 points (0 to 20):
- **0**: Wrist
- **1-4**: Thumb
- **5-8**: Index Finger
- **9-12**: Middle Finger
- **13-16**: Ring Finger
- **17-20**: Pinky Finger

---

## 2. Process to "Train" a New Sign (Heuristic)

If you want to add a new sign, follow these steps:

### Step 1: Analyze the Gesture
Look at the sign you want to add.
*Example: Letter "V" (Peace sign)*
- Index finger is **Extended**.
- Middle finger is **Extended**.
- Ring and Pinky are **Curled**.
- Thumb is **Curled** or tucked.

### Step 2: Write the Rule
In `src/modules/signconnect/utils/gestureModel.js`, we use the `isExtended` helper.

```javascript
// Example: Rule for "V" sign
const indexExtended = isExtended(hand[8], hand[7], hand[5]);
const middleExtended = isExtended(hand[12], hand[11], hand[9]);
const ringExtended = !isExtended(hand[16], hand[15], hand[13]);
const pinkyExtended = !isExtended(hand[20], hand[19], hand[17]);

if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
  return "V";
}
```

### Step 3: Update the UI
Add the new word to `gestureMap.js` so it shows up in the "Learn" tab and the "Interact" tab knows what to do with it.

---

## 3. Advanced: Machine Learning Training (TensorFlow.js)

If the signs are too complex for rules (like moving signs), you can use a neural network.

### Phase 1: Data Collection
1. Create a script to capture the 21 (x, y, z) landmarks of your hand while performing a sign.
2. Save these to a CSV file (e.g., `hello_data.csv`).
3. Collect at least 100-200 samples per sign.

### Phase 2: Model Training
Use a simple Neural Network (MLP):
- **Input**: 63 values (21 landmarks * 3 coordinates).
- **Hidden Layers**: 2-3 layers of 32-64 neurons.
- **Output**: Softmax layer with the number of classes.

### Phase 3: Integration
1. Save the model as `model.json`.
2. Load it in the `GestureDetector` using `tf.loadLayersModel()`.
