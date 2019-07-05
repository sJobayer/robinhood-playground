const avgArray = arr => {
  const sum = arr.reduce((acc, val) => acc + val, 0);
  return sum / arr.length;
};

const percUp = arr => {
  console.log({ arr })
  return arr.filter(v => v > 0).length / arr.length * 100;
}

const hundredResult = arr =>
  arr.reduce((acc, perc) => acc * (perc / 100 + 1), 100);


module.exports = {
  avgArray,
  percUp,
  hundredResult
};
