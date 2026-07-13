// A little stash of notes for whenever she's stressed. Signed personally so
// it feels like it's actually from you, not a generic quote generator.

export const MOTIVATIONAL_MESSAGES = [
  "Hey, breathe for a second. You don't have to have it all figured out today — just the next small step. I'm so proud of you.",
  "You've gotten through every hard day so far. That's a 100% success rate. You've got this one too.",
  "It's okay to rest. Resting isn't quitting — it's how you make it to the finish line at all.",
  "You are so much more than a grade or a result. I love you exactly as you are, no conditions attached.",
  "Remember: you're not behind. You're exactly where you need to be to become who you're becoming.",
  "Take a deep breath. In for 4, hold for 4, out for 4. You're safe, you're capable, and you're not alone in this.",
  "One page, one problem, one small step at a time. That's all today needs from you.",
  "I know it feels heavy right now, but this feeling isn't permanent — and neither is the stress. You'll look back proud.",
  "You don't need to be perfect to be worthy of rest, kindness, and love. Especially from yourself.",
  "Whatever the outcome, I already think you're incredible. That part never changes.",
  "Drink some water, stretch your shoulders, and give yourself permission to pause. The books will still be there in 10 minutes.",
  "You've worked so hard already. Let yourself acknowledge that, even if it doesn't feel like 'enough' right now.",
  "This is just one chapter, not the whole story. You have so much ahead of you.",
  "I believe in you more than you believe in yourself right now — and I'm not going anywhere.",
  "It's okay to cry, to feel overwhelmed, to not be okay for a bit. Feelings pass through, they don't stay forever.",
  "You are stronger than this stressful moment. Look how far you've already come.",
  "Close your eyes for 10 seconds. Just be here. Nothing else needs solving right this second.",
  "Whatever's weighing on you — you don't have to carry it alone. I'm always just a message away.",
  "Future you is going to look back at this moment and be so proud of how you kept going.",
  "You are doing better than you think you are. Truly.",
];

export function getRandomMessage(excludeIndex = -1) {
  if (MOTIVATIONAL_MESSAGES.length <= 1) return { text: MOTIVATIONAL_MESSAGES[0], index: 0 };
  let index = excludeIndex;
  while (index === excludeIndex) {
    index = Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length);
  }
  return { text: MOTIVATIONAL_MESSAGES[index], index };
}
