import { LostFoundItem } from '../models/LostFoundItem.js';

// Common stop words to exclude in keyword tokenization
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it', 'its',
  'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will', 'with', 'my', 'item', 'lost', 'found', 'please',
]);

const tokenize = (text = '') => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
};

export const findPotentialMatches = async (targetItem, limit = 5) => {
  const oppositeType = targetItem.type === 'lost' ? 'found' : 'lost';

  // Find candidate items
  const candidates = await LostFoundItem.find({
    _id: { $ne: targetItem._id },
    type: oppositeType,
    status: { $in: ['Open', 'Potential Match'] },
  }).populate('reporter', 'fullName email department avatar');

  const targetTokens = new Set([...tokenize(targetItem.title), ...tokenize(targetItem.description)]);
  const targetLocationTokens = new Set(tokenize(targetItem.location));
  const targetDate = new Date(targetItem.dateOccurred).getTime();

  const scoredMatches = candidates.map((cand) => {
    let score = 0;
    const explanations = [];

    // 1. Category Match (Max 35 pts)
    if (cand.category === targetItem.category) {
      score += 35;
      explanations.push(`Exact category match: "${cand.category}"`);
    }

    // 2. Color Match (Max 15 pts)
    if (cand.color && targetItem.color) {
      const candColor = cand.color.toLowerCase().trim();
      const targetColor = targetItem.color.toLowerCase().trim();
      if (candColor === targetColor || candColor.includes(targetColor) || targetColor.includes(candColor)) {
        score += 15;
        explanations.push(`Matching color: "${cand.color}"`);
      }
    }

    // 3. Date Proximity (Max 20 pts)
    const candDate = new Date(cand.dateOccurred).getTime();
    const diffDays = Math.abs(candDate - targetDate) / (1000 * 60 * 60 * 24);
    if (diffDays <= 1) {
      score += 20;
      explanations.push('Occurred within 24 hours of each other');
    } else if (diffDays <= 3) {
      score += 15;
      explanations.push('Occurred within 3 days');
    } else if (diffDays <= 7) {
      score += 10;
      explanations.push('Occurred within 1 week');
    } else if (diffDays <= 14) {
      score += 5;
      explanations.push('Occurred within 2 weeks');
    }

    // 4. Location Similarity (Max 15 pts)
    const candLocationTokens = tokenize(cand.location);
    const commonLocationWords = candLocationTokens.filter((token) => targetLocationTokens.has(token));
    if (commonLocationWords.length > 0) {
      score += 15;
      explanations.push(`Common location keywords: ${commonLocationWords.join(', ')}`);
    }

    // 5. Keyword & Description Similarity (Max 15 pts)
    const candTokens = [...tokenize(cand.title), ...tokenize(cand.description)];
    const commonTokens = candTokens.filter((t) => targetTokens.has(t));
    if (commonTokens.length > 0) {
      const kwScore = Math.min(15, commonTokens.length * 5);
      score += kwScore;
      explanations.push(`Keyword overlap: ${[...new Set(commonTokens)].slice(0, 4).join(', ')}`);
    }

    return {
      item: cand,
      matchPercentage: Math.min(100, Math.round(score)),
      explanation: explanations.length > 0 ? explanations.join('. ') : 'General similarity based on open campus items.',
    };
  });

  // Filter out low scores and sort descending
  return scoredMatches
    .filter((m) => m.matchPercentage >= 25)
    .sort((a, b) => b.matchPercentage - a.matchPercentage)
    .slice(0, limit);
};
