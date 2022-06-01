const DocumentReferenceMock = require("./DocumentReferenceMock");
const QueryDocumentSnapshotMock = require( "./QueryDocumentSnapshotMock" );
const QueryMock = require("./QueryMock");
const QuerySnapshotMock = require( "./QuerySnapshotMock" );

/*
Firestore collection class used for mocking the admin SDK firestore class. This constructor
is called on instantiation of the Firestore mock class and is used to mock db queries. It is
made up of an object collections, each with an object of docs. The latter is made up of
id - Doc obj pairs
*/

function CollectionReferenceMock(id, firestore) {
  this.id = id;
  this.firestore = firestore;
  this.parent = null;
  this.path = "This is not supported";
  this._listeners = [];
  this._queue = [];
  this._flushTimeout = null;
  if (typeof firestore._attach === "function") {
    firestore._attach(this);
  }
  if (!this.id) {
    throw new Error("Collection ref instantiated without a collection id");
  } else if (!this.firestore) {
    throw new Error(
      "Collection ref instantiated without firestore reference. Was this collection ref created through a Firestore instance?"
    );
  }
}

CollectionReferenceMock.prototype = Object.create(QueryMock.prototype);
CollectionReferenceMock.prototype.constructor = CollectionReferenceMock;
CollectionReferenceMock.prototype.doc = function(id) {
  return new DocumentReferenceMock(id, this.firestore, this);
};
CollectionReferenceMock.prototype.add = function(data) {
  // creating a clone so the original object is not altered
  let DocumentReference = new DocumentReferenceMock(
    undefined,
    this.firestore,
    this
  );
  return DocumentReference.set(data);
};
CollectionReferenceMock.prototype._flush = function() {
  let item;
  while (item = this._queue.shift()) {
    item();
  }
};
CollectionReferenceMock.prototype._change = function(change_id, change_type) {
  for (let listener of this._listeners) {
    let coll = this.firestore._db._collections[this.id] || {};
    let changes = [];
    let docs = [];
    for (let doc_id of Object.keys(coll)) {
      let doc_data = this.firestore._checkData(coll[doc_id], doc_id);
      let doc_snapshot = new QueryDocumentSnapshotMock(doc_id, this.doc(doc_id), doc_data);
      if (doc_id === change_id) {
        changes.push({type: change_type, doc: doc_snapshot});
      }
      docs.push(doc_snapshot);
    }
    clearTimeout(this._flushTimeout);
    this._queue.push(() => listener(new QuerySnapshotMock(docs, this, changes)));
    this._flushTimeout = setTimeout(() => this._flush(), 0);
  }
};
CollectionReferenceMock.prototype.onSnapshot = function(listener) {
  let coll = this.firestore._db._collections[this.id] || {};
  let changes = [];
  let docs = [];
  for (let doc_id of Object.keys(coll)) {
    let doc_data = this.firestore._checkData(coll[doc_id], doc_id);
    let doc_snapshot = new QueryDocumentSnapshotMock(doc_id, this.doc(doc_id), doc_data);
    changes.push({type: "added", doc: doc_snapshot});
    docs.push(doc_snapshot);
  }
  if (docs.length) {
    clearTimeout(this._flushTimeout);
    this._queue.push(() => listener(new QuerySnapshotMock(docs, this, changes)));
    this._flushTimeout = setTimeout(() => this._flush(), 0);
  }
  this._listeners.push(listener);
  return () => {
    let index = this._listeners.indexOf(listener);
    if (index >= 0) {
      this._listeners.splice(index, 1);
    }
  };
};

module.exports = CollectionReferenceMock;
