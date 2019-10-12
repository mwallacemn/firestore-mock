const assert = require("assert");
const QueryMock = require("../mock_constructors/QueryMock");

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
});
