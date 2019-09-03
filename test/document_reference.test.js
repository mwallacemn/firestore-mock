const assert = require("assert");
const DocumentReferenceMock = require("../mock_constructors/DocumentReferenceMock");

describe("Testing DocumentReferenceMock properties and methods", () => {
  it("Properly instantiates given an id, firestore instance and collection ref", () => {
    let doc_ref = new DocumentReferenceMock(
      "1",
      { firestore: 1 },
      "collection"
    );
    assert.equal(doc_ref.id, "1");
    assert.deepEqual(doc_ref.firestore, { firestore: 1 });
    assert.equal(doc_ref.parent, "collection");
    assert.equal(doc_ref.path, "This is not supported");
    assert.equal(doc_ref.collection(), "collection");
    assert.equal(doc_ref.isEqual(), "This is not supported");
  });

  it("Throws error when non-string id is given", () => {
    function error() {
      return new DocumentReferenceMock(1, { firestore: 1 }, "collection");
    }
    let err = new Error(
      "Firestore wants its document ids to be strings, please give them what they want"
    );

    assert.throws(error, err);
  });

  it("Throws error when a collection reference is not passed", () => {
    function error() {
      return new DocumentReferenceMock("1", { firestore: 1 });
    }
    let err = new Error(
      "Doc ref instantiated without corresponding collection reference"
    );
    assert.throws(error, err);
  });

  it("Creates a random uuid when and id is not provided", () => {
    let doc_ref = new DocumentReferenceMock(
      undefined,
      { firestore: 1 },
      "collection"
    );
    assert.notEqual(doc_ref.id, undefined);
  });

  it("Calls the firestore instance _delete method when its delete method is called", () => {
    let doc_ref = new DocumentReferenceMock(
      "1",
      {
        _delete: () => {
          throw new Error("_delete was called");
        }
      },
      "collection"
    );

    assert.throws(doc_ref.delete, Error, "_delete was called");
  });

  it("Returns a new DocumentSnapshotMock when get method is called", () => {
    let doc_ref = new DocumentReferenceMock(
      "1",
      {
        _get: () => {
          return "called";
        }
      },
      "collection"
    );

    let doc = doc_ref.get();
    assert.equal(doc.constructor.name, "DocumentSnapshotMock");
  });

  it("Throws an error when set method is called without an object param", () => {
    let doc_ref = new DocumentReferenceMock(
      "1",
      { firestore: 1 },
      "collection"
    );
    function error() {
      doc_ref.set("a");
    }
    let err = new Error("Doc must be created from an object");
    assert.throws(error, err);
  });

  it("Throws an error when set method is called with an empty object", () => {
    let doc_ref = new DocumentReferenceMock(
      "1",
      { firestore: 1 },
      "collection"
    );
    function error() {
      doc_ref.set({});
    }
    let err = new Error("Cannot save an empty object in Firestore");

    assert.throws(error, err);
  });

  it("Returns a DocumentSnapshotMock object when calling set", () => {
    let doc_ref = new DocumentReferenceMock(
      "1",
      {
        _set: (collection_id, id, data) => {
          return { collection_id, id, data };
        },
        _get: () => {
          return "called";
        }
      },
      { id: "collection" }
    );
    let doc = doc_ref.set({ a: 1 });
    assert.equal(doc.constructor.name, "DocumentSnapshotMock");
  });

  it("Throws an error when update method is called without an object param", () => {
    let doc_ref = new DocumentReferenceMock(
      "1",
      { firestore: 1 },
      "collection"
    );
    function error() {
      doc_ref.update("a");
    }
    let err = new Error("Doc must be updated using an object");
    assert.throws(error, err);
  });

  it("Throws an error when update method is called with an empty object", () => {
    let doc_ref = new DocumentReferenceMock(
      "1",
      { firestore: 1 },
      "collection"
    );
    function error() {
      doc_ref.update({});
    }
    let err = new Error("Cannot update using an empty object");

    assert.throws(error, err);
  });

  it("Returns a DocumentSnapshotMock object when calling update", () => {
    let doc_ref = new DocumentReferenceMock(
      "1",
      {
        _update: (collection_id, id, data) => {
          return { collection_id, id, data };
        },
        _get: () => {
          return "called";
        }
      },
      { id: "collection" }
    );
    let doc = doc_ref.update({ a: 1 });
    assert.equal(doc.constructor.name, "DocumentSnapshotMock");
  });
});
