
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
  "You don't owe anyone a version of yourself that isn't tired sometimes. Tired is allowed.",
  "Some days are just about showing up, not showing off. Today, showing up is more than enough.",
  "I know this feels like the whole world right now, but I promise you — there's so much good waiting on the other side of it.",
  "You're allowed to go slow. Slow progress is still progress, and I'm cheering for every bit of it.",
  "If no one's told you today: you are so capable, and so loved, exactly as you are right now.",
  "Put the book down for five minutes. Look out a window. Come back when you're ready — it'll wait.",
  "You've handled 100% of your worst days. Whatever today is throwing at you, you already have what it takes.",
  "It's okay if today wasn't your most productive day. Tomorrow gets a fresh start, and so do you.",
  "You don't have to earn rest by finishing everything first. Rest whenever you need it — no conditions.",
  "I'm not just proud of your results, I'm proud of how hard you try even when it's tough. That's the real thing.",
  "Whatever grade, whatever outcome — it doesn't change how much I love you or how far you've already come.",
  "Sometimes the bravest thing you can do is just take a break without guilt. Go ahead, you've earned it.",
  "You are not your to-do list. You are so much bigger and more wonderful than that.",
  "Breathe in something calming, breathe out the pressure. You're doing okay, even when it doesn't feel like it.",
  "I know stress can make everything feel urgent and huge — but you are safe, and this moment will pass.",
];

export function getRandomMessage(excludeIndex = -1) {
  if (MOTIVATIONAL_MESSAGES.length <= 1) return { text: MOTIVATIONAL_MESSAGES[0], index: 0 };
  let index = excludeIndex;
  while (index === excludeIndex) {
    index = Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length);
  }
  return { text: MOTIVATIONAL_MESSAGES[index], index };
}
