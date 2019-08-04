function DocumentSnapshotMock(ref) {
  this.id = ref.id;
  this.ref = ref;
  this._data = this._set_state();
  this.exists = this._data ? true : false;
  this.metadata = 'This is not supported';
}

DocumentSnapshotMock.prototype.data = function() {
  return this._data;
};

DocumentSnapshotMock.prototype._set_state = function() {
  return this.ref.firestore._get(this.ref.parent.id, this.id);
};

DocumentSnapshotMock.prototype.get = function() {
  let data = this.ref.firestore._get(this.ref.parent.id, this.id);
  this.exists = data ? true : false;
  return this;
};

module.exports = DocumentSnapshotMock;
