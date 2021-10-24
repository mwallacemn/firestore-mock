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
    assert.equal(ref2.path, "c1/d1");

    // test for nested collections
    var ref3 = firestore.collection("c1").doc("d1").collection("c2");
    assert.equal(ref3.path, "c1/d1/c2");

    var ref4 = firestore.collection("c1").doc("d1").collection("c3");
    assert.equal(ref4.path, "c1/d1/c3");

    var ref5 = firestore.collection("c1").doc("d1").collection("c2").doc("d2");
    assert.equal(ref5.path, "c1/d1/c2/d2");

    assert.equal(firestore.doc("c1").path, "c1");

    assert.equal(firestore.doc("c1/d1/c2/d2/c3").path, "c1/d1/c2/d2/c3");

    assert.equal(firestore.doc("c1/d1/c2/d2/c3/d3").get().exists, false);

  })
});
