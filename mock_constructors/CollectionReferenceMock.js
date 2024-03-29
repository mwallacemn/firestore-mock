const DocumentReferenceMock = require("./DocumentReferenceMock");
const QueryMock = require("./QueryMock");

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

Object.defineProperty(CollectionReferenceMock.prototype, "path", {
  get: function() {
    return this.firestore._getPath(this)
  }
});

module.exports = CollectionReferenceMock;
