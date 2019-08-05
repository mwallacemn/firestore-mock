const DocumentSnapshotMock = require('./DocumentSnapshotMock');

function QueryDocumentSnapshotMock(id, ref, data) {
  this.id = id;
  this.ref = ref;
  this.exists = true;
  this.metadata = 'This is not supported';
  this._data = data;
}

QueryDocumentSnapshotMock.prototype.get = DocumentSnapshotMock.prototype.get;
QueryDocumentSnapshotMock.prototype.data = DocumentSnapshotMock.prototype.data;

module.exports = QueryDocumentSnapshotMock;
