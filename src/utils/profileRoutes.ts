/**
 * profileRoutes.ts
 * 
 * FLOW: This utility maps the disability profile string stored in Firestore
 * to the correct frontend route. Used by both Login.tsx (after sign-in)
 * and Onboarding.tsx (after detection completes).
 * 
 * The AI detection in Onboarding.tsx produces one of these profiles:
 *   - 'visual'   -> Visual Impairment
 *   - 'autism'    -> ADHD/Autism section
 *   - 'adhd'      -> ADHD/Autism section
 *   - 'learning'  -> Dyslexia section
 *   - 'physical'  -> Physical Disability section (manual selection only)
 *   - 'none'/null -> Fallback to onboarding
 * 
 * The user never sees which internal page they are on — they are
 * automatically routed based on their stored profile.
 */

/**
 * Given a disability profile string from Firestore, returns
 * the route the user should be redirected to.
 */
export function getRouteForProfile(profile: string | null | undefined): string {
  switch (profile) {
    case 'learning':
      return '/dyslexia';
    case 'physical':
      return '/physical-disability';
    case 'visual':
      return '/visual-impairment';
    case 'adhd':
      return '/adhd';
    case 'autism':
      return '/autism';
    default:
      // If no profile has been set yet, send them to onboarding/detection
      return '/onboarding';
  }
}
