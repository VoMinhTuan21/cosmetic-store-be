export function shuffle<T>(array: T[]) {
  let currentIndex: number = array.length;
  let randomIndex: number;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

export function compareBrandCount(brandA: IBrandCount, brandB: IBrandCount) {
  if (brandA.count > brandB.count) {
    return -1;
  }
  if (brandA.count < brandB.count) {
    return 1;
  }
  return 0;
}
