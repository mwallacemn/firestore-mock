const QuerySnapshotMock = require("./QuerySnapshotMock");
const QueryDocumentSnapshotMock = require("./QueryDocumentSnapshotMock");
const DocumentReferenceMock = require("./DocumentReferenceMock");

/*
Firestore Query class used in mocking the admin SDK firestore class. This constructor
is called through the .where method on CollectionReferenceMock instances and is used
to mock db queries. QueryMock is the prototype parent to CollectionReferenceMock.
*/

function QueryMock(firestore) {
  this.firestore = firestore;
  this._docs;
  this._col_ref;
}

QueryMock.prototype.where = function(field, operator, value) {
  if (typeof field !== "string" || typeof operator !== "string") {
    throw new Error("Field and operator parameters must be strings");
  }

  if (!this.id) {
    throw new Error(
      "Collection reference not assigned - was this method called on a collection?"
    );
  }
  // if a .where() has not been called on this query, or a .where was already called and
  // returned results, then additional filtering can occur
  if (!this._docs || Object.keys(this._docs).length) {
    this._docs = this.firestore._where(
      field,
      operator,
      value,
      this._docs,
      this.id
    );
  }

  return this;
};

QueryMock.prototype.limit = function(limit) {
  if (typeof limit !== "number") {
    throw new Error("limit and operator parameter must be number");
  }

  if (!this.id) {
    throw new Error(
      "Collection reference not assigned - was this method called on a collection?"
    );
  }

  if (!this._docs) {
    this._docs = this.firestore._db._collections[this.id];
    if (!this._docs) this._docs = {};
  }
  
  // Ensure greater than 0
  var end_limit = Math.max(0, limit); 
  
  var all_keys = Object.keys(this._docs).splice(0, end_limit);
  var all_vals = Object.values(this._docs).splice(0, end_limit);

  var new_docs = {};

  for(var i=0; i<all_keys.length; i++){
    new_docs[all_keys[i]] = all_vals[i];
  }
  
  this._docs = new_docs;

  return this;
};

QueryMock.prototype.get = function() {
  if (!this.id) {
    throw new Error(
      "Collection reference not assigned - was this method called on a collection?"
    );
  }
  if (!this._docs) {
    this._docs = this.firestore._db._collections[this.id];
    if (!this._docs) this._docs = {};
  }
  let keys = Object.keys(this._docs);
  let docs = keys.map(key => {
    let doc_ref = new DocumentReferenceMock(key, this.firestore, this);
    return new QueryDocumentSnapshotMock(key, doc_ref, this._docs[key]);
  });

  return new QuerySnapshotMock(docs, this);
};

module.exports = QueryMock;
