export const formatEval = (score: number, scoreType: 'cp' | 'mate') => {
  if (scoreType === 'cp') {
    return `${score / 100}`;
  }
  return `M${Math.abs(score)}`;
};
