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

  it("Calls onSnapshot listener with all existing docs initially", (done) => {
    let firestore = new FirestoreMock();
    let col = new CollectionReferenceMock("Test", firestore);
    col.add({doc: 1});
    col.add({doc: 2});
    col.add({doc: 3});
    col.onSnapshot((snapshot) => {
      let changes = snapshot.docChanges();
      assert.equal(changes.length, 3);
      assert.equal(changes[0].type, "added");
      assert.deepEqual(changes[0].doc.data(), {doc: 1});
      assert.equal(changes[1].type, "added");
      assert.deepEqual(changes[1].doc.data(), {doc: 2});
      assert.equal(changes[2].type, "added");
      assert.deepEqual(changes[2].doc.data(), {doc: 3});
      done();
    });
  });

  it("Calls onSnapshot listener when documents are added", (done) => {
    let firestore = new FirestoreMock();
    let col = new CollectionReferenceMock("Test", firestore);
    col.onSnapshot((snapshot) => {
      let changes = snapshot.docChanges();
      assert.equal(changes.length, 1);
      assert.equal(changes[0].type, "added");
      assert.deepEqual(changes[0].doc.data(), {doc: 1});
      done();
    });
    col.add({doc: 1});
  });

  it("Calls onSnapshot listener when documents are modified", (done) => {
    let firestore = new FirestoreMock();
    let col = new CollectionReferenceMock("Test", firestore);
    let doc1 = col.add({doc: 1});
    let call = 0;
    col.onSnapshot((snapshot) => {
      let changes = snapshot.docChanges();
      if (call === 0) {
        assert.equal(changes.length, 1);
        assert.equal(changes[0].type, "added");
        assert.deepEqual(changes[0].doc.data(), {doc: 1});
        call++;
      } else if (call === 1) {
        assert.equal(changes.length, 1);
        assert.equal(changes[0].type, "modified");
        assert.deepEqual(changes[0].doc.data(), {doc: 2});
        done();
      }
    });
    doc1.ref.update({doc: 2});
  });

  it("Calls onSnapshot listener when documents are removed", (done) => {
    let firestore = new FirestoreMock();
    let col = new CollectionReferenceMock("Test", firestore);
    let doc1 = col.add({doc: 1});
    let call = 0;
    col.onSnapshot((snapshot) => {
      let changes = snapshot.docChanges();
      if (call === 0) {
        assert.equal(changes.length, 1);
        assert.equal(changes[0].type, "added");
        assert.deepEqual(changes[0].doc.data(), {doc: 1});
        call++;
      } else if (call === 1) {
        assert.equal(changes.length, 1);
        assert.equal(changes[0].type, "removed");
        assert.deepEqual(changes[0].doc.data(), {doc: 1});
        done();
      }
    });
    doc1.ref.delete();
  });

  it("Returns unsubscribe function that stop listening from the onSnapshot method", (done) => {
    let firestore = new FirestoreMock();
    let col = new CollectionReferenceMock("Test", firestore);
    let doc1 = col.add({doc: 1});
    let call = 0;
    let unsubscribe = col.onSnapshot((snapshot) => {
      let changes = snapshot.docChanges();
      if (call === 0) {
        assert.equal(changes.length, 1);
        assert.equal(changes[0].type, "added");
        assert.deepEqual(changes[0].doc.data(), {doc: 1});
        call++;
      } else if (call === 1) {
        throw new Error('Called twice');
      }
    });
    unsubscribe();
    doc1.ref.delete();
    setTimeout(done,10);
  });
});
