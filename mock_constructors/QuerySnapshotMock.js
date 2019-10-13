function QuerySnapshotMock(docs, query) {
  this.docs = docs;
  this.query = query;
  this.size = docs.length;
  this.empty = !docs.length;
  this.parent = query;
}

QuerySnapshotMock.prototype.forEach = function(callback) {
  return this.docs.forEach(callback);
};

QuerySnapshotMock.prototype.docChanges = function() {
  return "This is not supported";
};

QuerySnapshotMock.prototype.isEqual = function() {
  return "This is not supported";
};

module.exports = QuerySnapshotMock;
