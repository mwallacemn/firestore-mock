function TimestampMock(date) {
  this.date = date;
}
TimestampMock.prototype.toMillis = function() {
  return this.date.getTime();
};
TimestampMock.prototype.toDate = function() {
  return this.date;
};

module.exports = TimestampMock;
