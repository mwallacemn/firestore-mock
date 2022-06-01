function QuerySnapshotMock(docs, query, changes) {
  this.docs = docs;
  this._changes = changes || [];
  this.query = query;
  this.size = docs.length;
  this.empty = !docs.length;
  this.parent = query;
}

QuerySnapshotMock.prototype.forEach = function(callback) {
  return this.docs.forEach(callback);
};

QuerySnapshotMock.prototype.docChanges = function() {
  return this._changes;
};

QuerySnapshotMock.prototype.isEqual = function() {
  return "This is not supported";
};

module.exports = QuerySnapshotMock;
