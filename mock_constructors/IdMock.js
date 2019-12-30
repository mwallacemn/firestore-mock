const possibilities = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split(
  ""
);

module.exports = function createId() {
  i = 0;
  id = "";
  while (i < 20) {
    id = id + possibilities[Math.floor(Math.random() * possibilities.length)];
    i++;
  }
  return id;
};
