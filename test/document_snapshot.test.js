const assert = require("assert");
const DocumentSnapshotMock = require("../mock_constructors/DocumentSnapshotMock");
const FirestoreMock = require("../mock_constructors/FirestoreMock");

describe("Testing instantiation and methods", () => {
  it("Instantiates correctly based on reference object", () => {
    let ref = {
      id: 1,
      parent: { id: "collection" },
      firestore: {
        _get: function(coll_id, id) {
          return { coll_id, id };
        }
      }
    };
    let doc = new DocumentSnapshotMock(ref);

    assert.equal(doc.id, 1);
    assert.equal(doc.ref, ref);
    assert.equal(doc.exists, true);
    assert.equal(doc.metadata, "This is not supported");
    assert.deepEqual(doc.data(), { coll_id: "collection", id: 1 });
  });
  it("Updated the DocumentReferenceSnapshot when the DocumentReference indicates the document no longer exists", () => {
    let ref = {
      id: 1,
      parent: { id: "collection" },
      firestore: {
        _get: function(coll_id, id) {
          return { coll_id, id };
        }
      }
    };
    let doc = new DocumentSnapshotMock(ref);
    assert.equal(doc.exists, true);
    ref.firestore._get = () => {
      return undefined;
    };
    doc.get();
    assert.equal(doc.exists, false);
  });

  it("Makes sure the returned path is correct", ()=>{
    var firestore = new FirestoreMock();

    var ref1 = firestore.collection("c1");
    assert.equal(ref1.path, "c1");

    var ref2 = firestore.collection("c1").doc("d1");
    assert.equal(ref2.path, "c1/d1")

    // FIXME: Add test for nested collections

  })
});
