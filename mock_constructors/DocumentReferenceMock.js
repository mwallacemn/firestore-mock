const createId = require("./IdMock");
const DocumentSnapshotMock = require("./DocumentSnapshotMock");
/*
Firestore doc class used for mocking the admin SDK firestore class. This constructor is
called within the Collections constructor on create, update or deletion of docs, and is made
up of an id and an object of the doc's data.
 */

function DocumentReferenceMock(id, firestore, col_ref) {
  this.id = id ? id : createId();
  this.parent = col_ref;
  this.firestore = firestore;
  if (!this.parent) {
    throw new Error(
      "Doc ref instantiated without corresponding collection reference"
    );
  }
  if (typeof this.id !== "string") {
    throw new Error(
      "Firestore wants its document ids to be strings, please give them what they want"
    );
  }
}

DocumentReferenceMock.prototype.set = function(data, options) {
  if (typeof data !== "object") {
    throw new Error("Doc must be created from an object");
  } else if (!Object.keys(data).length) {
    throw new Error("Cannot save an empty object in Firestore");
  }
  // creating a clone so the original object is not altered
  let data_clone = { ...data };

  this.firestore._set(this.parent.id, this.id, data_clone, options);
  return new DocumentSnapshotMock(this);
};

DocumentReferenceMock.prototype.get = function() {
  return new DocumentSnapshotMock(this);
};

DocumentReferenceMock.prototype.update = function(data) {
  if (typeof data !== "object") {
    throw new Error("Doc must be updated using an object");
  } else if (!Object.keys(data).length) {
    throw new Error("Cannot update using an empty object");
  }

  this.firestore._update(this.parent.id, this.id, data);

  return new DocumentSnapshotMock(this);
};

//delete
DocumentReferenceMock.prototype.delete = function() {
  this.firestore._delete(this.parent.id, this.id);
};

DocumentReferenceMock.prototype.collection = function() {
  return this.parent;
};

DocumentReferenceMock.prototype.isEqual = function() {
  console.log("This is not supported");
  return;
};

Object.defineProperty(DocumentReferenceMock.prototype, "path", {
  get: function() {
    return this.firestore._getPath(this);
  }
});

module.exports = DocumentReferenceMock;
