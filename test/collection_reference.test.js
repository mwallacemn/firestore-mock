const assert = require("assert");
const CollectionReferenceMock = require("../mock_constructors/CollectionReferenceMock");
const QueryMock = require("../mock_constructors/QueryMock");
const FirestoreMock = require("../mock_constructors/FirestoreMock");
const DocumentSnapshotMock = require("../mock_constructors/DocumentSnapshotMock");

describe("Testing DocumentReferenceMock properties and methods", () => {
  it("Instantiates given an id and firestore ref", () => {
    let col = new CollectionReferenceMock("1", { firestore: true });
    assert.equal(col.id, "1");
    assert.deepEqual(col.firestore, { firestore: true });
    assert.equal(col.path, "This is not supported");
    assert.equal(col.parent, null);
    assert(col instanceof QueryMock);
  });

  it("Throws error when instantiated without an id", () => {
    function error() {
      return new CollectionReferenceMock(undefined, { firestore: true });
    }
    assert.throws(
      error,
      Error,
      "Collection ref instantiated without a collection id"
    );
  });

  it("Throws error when instantiated without a firestore reference", () => {
    function error() {
      return new CollectionReferenceMock("1", undefined);
    }
    assert.throws(
      error,
      Error,
      "Collection ref instantiated without firestore reference. Was this collection ref created through a Firestore instance?"
    );
  });

  it("Returns a DocumentReferenceMock when doc method is called", () => {
    let col = new CollectionReferenceMock("1", { firestore: true });
    let doc_ref = col.doc("2");
    assert.equal(doc_ref.constructor.name, "DocumentReferenceMock");
  });

  it("Adds a new document with a generated id through the add method", () => {
    let data = { a: "1" };
    let firestore = new FirestoreMock();
    let col = new CollectionReferenceMock("Test", firestore);
    let documentSnapshot = col.add(data);
    assert(documentSnapshot instanceof DocumentSnapshotMock);
    assert.deepEqual(documentSnapshot.data(), data);
    assert.equal(Object.keys(firestore._db._collections["Test"]).length, 1);
    assert.deepEqual(
      Object.values(firestore._db._collections["Test"])[0],
      data
    );
  });

  it("Returns no docs when provided with non-existent collection", () => {
    let firestore = new FirestoreMock();
    var no_docs = firestore.collection('unknown-collection').get();
    assert.equal(no_docs.docs.length, 0);
  });

  it("Returns no docs when provided with non-existent document id", () => {
    let firestore = new FirestoreMock();
    var no_docs = firestore.collection('unknown-collection').doc('non-existent').get();
    assert.equal(no_docs.exists, false);
    assert.deepEqual(no_docs.data(), {});
  });
});
