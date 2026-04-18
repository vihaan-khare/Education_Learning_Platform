/**
 * gestureModel.js
 * 
 * Logic for detecting simple gestures from MediaPipe hand landmarks.
 */

export const detectGesture = (multiHandLandmarks) => {
  if (!multiHandLandmarks || multiHandLandmarks.length === 0) return null;

  // Helper to get detailed finger states
  const getHandState = (hand) => {
    const isExtended = (tip, mid, mcp) => tip.y < mid.y && mid.y < mcp.y;
    const isCurled = (tip, mid, mcp) => tip.y > mcp.y;
    
    // Check for "Upness" (vertical)
    const indexUp = isExtended(hand[8], hand[7], hand[5]);
    const middleUp = isExtended(hand[12], hand[11], hand[9]);
    const ringUp = isExtended(hand[16], hand[15], hand[13]);
    const pinkyUp = isExtended(hand[20], hand[19], hand[17]);
    
    // Thumb is tricky
    const thumbUp = hand[4].y < hand[3].y && hand[3].y < hand[2].y;
    const thumbOut = Math.abs(hand[4].x - hand[2].x) > 0.06;
    
    const allUp = indexUp && middleUp && ringUp && pinkyUp;
    const isFist = !indexUp && !middleUp && !ringUp && !pinkyUp;

    return { indexUp, middleUp, ringUp, pinkyUp, thumbUp, thumbOut, allUp, isFist };
  };

  const handStates = multiHandLandmarks.map(getHandState);
  
  // 1. TWO-HAND GESTURES (Highest Priority)
  if (handStates.length >= 2) {
    const s1 = handStates[0];
    const s2 = handStates[1];
    
    // Help: One flat, one fist/thumb
    if ((s1.allUp && (s2.isFist || s2.thumbUp)) || (s2.allUp && (s1.isFist || s1.thumbUp))) return "Help";
    
    // Together: Two fists
    if ((s1.isFist || s1.thumbUp) && (s2.isFist || s2.thumbUp)) return "Together";

    // Book: Two flat hands
    if (s1.allUp && s2.allUp) return "Book";
  }

  // 2. ONE-HAND GESTURES
  const s = handStates[0];
  const hand = multiHandLandmarks[0];

  // Specific Letters (Priority over general words)
  if (s.indexUp && s.thumbOut && !s.middleUp && !s.ringUp && !s.pinkyUp) return "L";
  if (s.indexUp && s.middleUp && !s.ringUp && !s.pinkyUp) {
    const getDist = (p1, p2) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    const tipGap = getDist(hand[8], hand[12]);
    const knuckleGap = getDist(hand[5], hand[9]);
    
    // If the tips are roughly as close as the knuckles, it's U
    return tipGap < (knuckleGap * 1.8) ? "U" : "V"; 
  }
  if (s.indexUp && !s.middleUp && !s.ringUp && !s.pinkyUp && !s.thumbUp) return "D";
  if (s.thumbUp && s.pinkyUp && !s.indexUp && !s.middleUp && !s.ringUp) return "Y";
  if (!s.indexUp && s.middleUp && s.ringUp && s.pinkyUp) return "F";

  // General Words/State
  if (s.allUp) {
    return s.thumbOut ? "Hello" : "B"; // B has thumb tucked
  }
  
  if (s.isFist) {
    if (s.thumbUp) return "Thumbs Up";
    if (hand[4].y > hand[10].y) return "A"; // Thumb on side/down = A
    return "Yes";
  }

  if (s.indexUp && s.pinkyUp && s.thumbOut) return "I Love You";

  return null;
};
