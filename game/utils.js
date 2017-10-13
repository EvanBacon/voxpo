import React from 'react';
const lfsr = (() => {
  var max = Math.pow(2, 16),
    period = 0,
    seed, out;
  return {
    setSeed: function (val) {
      out = seed = val || Math.round(Math.random() * max);
    },
    rand: function () {
      var bit;
      bit = ((out >> 0) ^ (out >> 2) ^ (out >> 3) ^ (out >> 5)) & 1;
      out = (out >> 1) | (bit << 15);
      period++;
      return out / max;
    }
  };
})();
// Set seed
lfsr.setSeed();

export default lfsr;
