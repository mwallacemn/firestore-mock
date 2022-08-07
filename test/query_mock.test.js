const assert = require("assert");
const QueryMock = require("../mock_constructors/QueryMock");
const FirestoreMock = require("../mock_constructors/FirestoreMock");

describe("Testing QueryMock parameters and methods", () => {
  it("Instantiates QueryMock with firestore ref", () => {
    let query = new QueryMock({ firestore: true });
    assert.deepEqual(query.firestore, { firestore: true });
    assert.equal(query._docs, undefined);
    assert.equal(query._col_ref, undefined);
  });

  it("Throws an error when where method called without string parameters", () => {
    let query = new QueryMock({ firestore: true });
    let err = new Error("Field and operator parameters must be strings");
    function error1() {
      query.where(1, "==", 1);
    }
    assert.throws(error1, err);

    function error2() {
      query.where("a", 3, "1");
    }

    assert.throws(error2, err);
  });

  it("Throws and error if the where method is not called when inherited on collection", () => {
    let query = new QueryMock({ firestore: true });
    function error() {
      query.where("a", "==", 1);
    }

    let err = new Error(
      "Collection reference not assigned - was this method called on a collection?"
    );

    assert.throws(error, err);
  });

  it("Can orderby a number field", ()=>{
    let firestore = new FirestoreMock();
    let cRef = firestore.collection('c1');
    cRef.add({'a':2});
    cRef.add({'a':3});
    cRef.add({'a':5});
    cRef.add({'a':6});
    cRef.add({'a':4});
    cRef.add({'a':1});

    let snapshot = firestore.collection('c1').orderBy('a', 'asc').get();
    for(var i=1; i<snapshot.docs.length; i++){
      var thisData = snapshot.docs[i].data()['a'];
      var prevData = snapshot.docs[i-1].data()['a'];
      assert.equal(thisData >= prevData, true);
    }

    snapshot = firestore.collection('c1').orderBy('a', 'desc').get();
    for(var i=1; i<snapshot.docs.length; i++){
      var thisData = snapshot.docs[i].data()['a'];
      var prevData = snapshot.docs[i-1].data()['a'];
      assert.equal(thisData <= prevData, true);
    }
  });

  it("Can orderby a string field", ()=>{
    let firestore = new FirestoreMock();
    let cRef = firestore.collection('c1');
    cRef.add({'a':'C'});
    cRef.add({'a':'E'});
    cRef.add({'a':'X'});
    cRef.add({'a':'M'});
    cRef.add({'a':'Q'});
    cRef.add({'a':'R'});

    let snapshot = firestore.collection('c1').orderBy('a', 'asc').get();
    for(var i=1; i<snapshot.docs.length; i++){
      var thisData = snapshot.docs[i].data()['a'];
      var prevData = snapshot.docs[i-1].data()['a'];
      assert.equal(thisData.charCodeAt(0) >= prevData.charCodeAt(0), true);
    }

    snapshot = firestore.collection('c1').orderBy('a', 'desc').get();
    for(var i=1; i<snapshot.docs.length; i++){
      var thisData = snapshot.docs[i].data()['a'];
      var prevData = snapshot.docs[i-1].data()['a'];
      assert.equal(thisData.charCodeAt(0) <= prevData.charCodeAt(0), true);
    }
  });
});
