const assert = require("assert");
const FirestoreMock = require("../mock_constructors/FirestoreMock.js");
const DatabaseMock = require("../mock_constructors/DatabaseMock");
const CollectionReferenceMock = require("../mock_constructors/CollectionReferenceMock");
const TimestampMock = require("../mock_constructors/TimestampMock");

describe("Testing the Firestore instance", () => {
  it("Instantiates a database instance on creation", () => {
    let firestore = new FirestoreMock();
    assert(firestore._db instanceof DatabaseMock);
    assert(firestore.app, "Mock app is not supported");
    assert(firestore.collection("a") instanceof CollectionReferenceMock);
    assert(firestore.firestore() instanceof FirestoreMock);
  });
});

describe("Testing the _set method", () => {
  let firestore = new FirestoreMock();
  let data = { a: "1", b: "2" };
  it("Successfully adds a document using _set method", () => {
    firestore._set("Coll1", "Doc1", data);
    assert.deepEqual(firestore._db._collections["Coll1"]["Doc1"], data);

    firestore._set("Coll1", "Doc1", { a: "2" }, { merge: "true" });
    assert.deepEqual(firestore._db._collections["Coll1"]["Doc1"], {
      a: "2",
      b: "2"
    });

    firestore._set("Coll1", "Doc1", { c: "3" });
    assert.deepEqual(firestore._db._collections["Coll1"]["Doc1"], { c: "3" });
  });

  it("Converts a javascript date into a TimestampMock through the _set method", () => {
    let date = new Date();
    firestore._set("Coll1", "Doc1", { date: date });
    assert.equal(
      firestore._db._collections["Coll1"]["Doc1"]["date"].toMillis(),
      date.getTime()
    );
  });

  it("Throws an error if any keys are assigned to undefined values", () => {
    function error() {
      return firestore._set("Coll1", "Doc1", { date: undefined });
    }
    assert.throws(
      error,
      Error,
      "Document Doc1 contains undefined key values: date. This document cannot be saved to Firestore."
    );
  });

  it("Allows nested objects to be saved", () => {
    let data = { a: { b: ["1"] } };
    firestore._set("Coll1", "Doc1", data);
    assert.deepEqual(firestore._db._collections["Coll1"]["Doc1"], data);
  });

  it("Allows null values to be saved", () => {
    let data = { a: null };
    firestore._set("Coll1", "Doc1", data);
    assert.deepEqual(firestore._db._collections["Coll1"]["Doc1"], data);
  });

  it("Allows many complex nested objects to be saved", () => {
    let data = {
      a: {
        c: [
          { d: new TimestampMock(new Date()) },
          "1",
          2,
          null,
          { e: null, f: { g: "WOWZA" } }
        ]
      },
      b: new TimestampMock(new Date()),
      g: null
    };
    firestore._set("Coll1", "Doc1", data);
    assert.deepEqual(firestore._db._collections["Coll1"]["Doc1"], data);
  });

  it("Errors when nested arrays are saved", () => {
    let data = { a: { b: [["1"]] } };
    function error() {
      return firestore._set("Coll1", "Doc1", data);
    }

    assert.throws(
      error,
      Error,
      "Document Doc1 contains nested arrays. This document cannot be saved to Firestore"
    );
  });
});

describe("Testing the _update method", () => {
  it("Updates a document using the _update method", () => {
    let firestore = new FirestoreMock();
    let data = { a: "1", b: "2" };
    firestore._set("Coll1", "Doc1", data);
    assert.deepEqual(firestore._db._collections["Coll1"]["Doc1"], data);

    firestore._update("Coll1", "Doc1", { b: 1, c: 3 });
    assert.deepEqual(firestore._db._collections["Coll1"]["Doc1"], {
      a: "1",
      b: "1",
      c: "3"
    });
  });

  it("Updates a function with a complex nested fields", () => {
    let firestore = new FirestoreMock();
    let data = { a: "1", b: "2" };
    firestore._set("Coll1", "Doc1", data);
    assert.deepEqual(firestore._db._collections["Coll1"]["Doc1"], data);

    let data2 = {
      ...data,
      c: ["a", 1, null, new TimestampMock(new Date())],
      d: null,
      e: new TimestampMock(new Date()),
      f: { g: null, h: new TimestampMock(new Date()), i: [] }
    };

    firestore._update("Coll1", "Doc1", data2);
    assert.deepEqual(firestore._db._collections["Coll1"]["Doc1"], data2);
  });

  it("Errors on update if a doc does not exist", () => {
    let firestore = new FirestoreMock();
    function error() {
      return firestore._update("Coll1", "Doc1", { b: 1, c: 3 });
    }

    assert.throws(error, Error, "Document does not exist, failed to update");
  });
});

describe("Testing the _delete method", () => {
  it("Deletes a document using the _delete method", () => {
    let firestore = new FirestoreMock();
    let data = { a: "1", b: "2" };
    firestore._set("Coll1", "Doc1", data);
    assert.deepEqual(firestore._db._collections["Coll1"]["Doc1"], data);

    firestore._delete("Coll1", "Doc1");
    assert.equal(firestore._db._collections["Coll1"]["Doc1"], undefined);
  });
});

describe("Testing the _get method", () => {
  let firestore = new FirestoreMock();
  let data = { a: "1", b: "2" };
  it("Returns a document using the _get method", () => {
    firestore._set("Coll1", "Doc1", data);

    let doc = firestore._get("Coll1", "Doc1");
    assert.deepEqual(doc, data);
  });

  it("Returns undefined if the document does not exist or the collection does not exist", () => {
    assert.equal(firestore._get("Coll1", "Doc2"), undefined);
    assert.equal(firestore._get("Coll2", "Doc2"), undefined);
  });
});

describe("Testing the firestore _where method with == filter", () => {
  let firestore;
  beforeEach(() => {
    firestore = new FirestoreMock();
    firestore._set("Coll1", "Doc1", { a: "1", b: ["a", "b", "c"] });
    firestore._set("Coll1", "Doc2", { a: "2", b: ["b", "c"] });
    firestore._set("Coll1", "Doc3", { a: 1, b: ["a", "b", "c", "d"] });
    firestore._set("Coll2", "Doc1", { a: 1, b: ["a", "b", "c", "d"] });
  });

  it("Filters expectedly", () => {
    let query = firestore._where("a", "==", "1", undefined, "Coll1");
    assert.equal(Object.keys(query).length, 1);
    assert.deepEqual(query["Doc1"], { a: "1", b: ["a", "b", "c"] });
  });

  it("Returns multiple docs", () => {
    firestore._set("Coll1", "Doc3", { a: "1", b: ["a", "b", "c", "d"] });
    let query = firestore._where("a", "==", "1", undefined, "Coll1");

    assert.equal(Object.keys(query).length, 2);
    assert.deepEqual(query["Doc1"], { a: "1", b: ["a", "b", "c"] });
    assert.deepEqual(query["Doc3"], { a: 1, b: ["a", "b", "c", "d"] });
  });

  it("Filters based on javascript dates", () => {
    let date = new Date();
    firestore._update("Coll1", "Doc3", { date });
    let query = firestore._where("date", "==", date, undefined, "Coll1");

    assert.equal(Object.keys(query).length, 1);
    assert.deepEqual(query["Doc3"], {
      a: 1,
      b: ["a", "b", "c", "d"],
      date: new TimestampMock(date)
    });
  });

  it("Errors when filtering on a date field without using js date", () => {
    let date = new Date();
    firestore._update("Coll1", "Doc3", { date });
    function error() {
      firestore._where("date", "==", "1", undefined, "Coll1");
    }
    assert.throws(
      error,
      Error,
      "A query was performed on a firebase Timestamp field without using a JavaScript Date object"
    );
  });
});

describe("Testing the firestore _where method with <= filter", () => {
  let firestore;
  let date = new Date();
  beforeEach(() => {
    firestore = new FirestoreMock();
    firestore._set("Coll1", "Doc1", { a: "1", b: ["a", "b", "c"] });
    firestore._set("Coll1", "Doc2", { a: "2", b: ["b", "c"] });
    firestore._set("Coll1", "Doc3", { a: 1, b: ["a", "b", "c", "d"] });
    firestore._set("Coll2", "Doc1", { a: 1, b: ["a", "b", "c", "d"] });
  });

  it("Filters expectedly on strings", () => {
    let query = firestore._where("a", "<=", "1", undefined, "Coll1");
    assert.equal(Object.keys(query).length, 1);
    assert.deepEqual(query["Doc1"], { a: "1", b: ["a", "b", "c"] });
  });

  it("Filters expectedly on numbers", () => {
    let query = firestore._where("a", "<=", 1, undefined, "Coll1");
    assert.equal(Object.keys(query).length, 1);
    assert.deepEqual(query["Doc3"], { a: 1, b: ["a", "b", "c", "d"] });
  });

  it("Filters expectedly on dates", () => {
    firestore._update("Coll1", "Doc1", { date });

    let query = firestore._where("date", "<=", new Date(), undefined, "Coll1");
    assert.equal(Object.keys(query).length, 1);
    assert.deepEqual(query["Doc1"], {
      a: "1",
      b: ["a", "b", "c"],
      date: new TimestampMock(date)
    });
  });

  it("Errors when filtering on a date field without using a JS Date object", () => {
    firestore._update("Coll1", "Doc1", { date });

    function error() {
      return firestore._where("date", "<=", "1", undefined, "Coll1");
    }
    assert.throws(
      error,
      Error,
      "A query was performed on a firebase Timestamp field without using a JavaScript Date object"
    );
  });
});

describe("Testing the firestore _where method with >= filter", () => {
  let firestore;
  let date = new Date();
  beforeEach(() => {
    firestore = new FirestoreMock();
    firestore._set("Coll1", "Doc1", { a: "1", b: ["a", "b", "c"] });
    firestore._set("Coll1", "Doc2", { a: "2", b: ["b", "c"] });
    firestore._set("Coll1", "Doc3", { a: 1, b: ["a", "b", "c", "d"] });
    firestore._set("Coll2", "Doc1", { a: 1, b: ["a", "b", "c", "d"] });
  });

  it("Filters expectedly on strings", () => {
    let query = firestore._where("a", ">=", "1", undefined, "Coll1");
    assert.equal(Object.keys(query).length, 2);
    assert.deepEqual(query["Doc1"], { a: "1", b: ["a", "b", "c"] });
    assert.deepEqual(query["Doc2"], { a: "2", b: ["b", "c"] });
  });

  it("Filters expectedly on numbers", () => {
    let query = firestore._where("a", ">=", 1, undefined, "Coll1");
    assert.equal(Object.keys(query).length, 1);
    assert.deepEqual(query["Doc3"], { a: 1, b: ["a", "b", "c", "d"] });
  });

  it("Filters expectedly on dates", () => {
    let new_date = new Date();
    firestore._update("Coll1", "Doc1", { date: new_date });

    let query = firestore._where("date", ">=", date, undefined, "Coll1");
    assert.equal(Object.keys(query).length, 1);
    assert.deepEqual(query["Doc1"], {
      a: "1",
      b: ["a", "b", "c"],
      date: new TimestampMock(new_date)
    });
  });

  it("Errors when filtering on a date field without using a JS Date object", () => {
    firestore._update("Coll1", "Doc1", { date });

    function error() {
      return firestore._where("date", ">=", "1", undefined, "Coll1");
    }
    assert.throws(
      error,
      Error,
      "A query was performed on a firebase Timestamp field without using a JavaScript Date object"
    );
  });
});

describe("Testing the firestore _where method with > filter", () => {
  let firestore;
  let date = new Date();
  beforeEach(() => {
    firestore = new FirestoreMock();
    firestore._set("Coll1", "Doc1", { a: "1", b: ["a", "b", "c"] });
    firestore._set("Coll1", "Doc2", { a: "2", b: ["b", "c"] });
    firestore._set("Coll1", "Doc3", { a: 1, b: ["a", "b", "c", "d"] });
    firestore._set("Coll2", "Doc1", { a: 1, b: ["a", "b", "c", "d"] });
  });

  it("Filters expectedly on strings", () => {
    let query = firestore._where("a", ">", "1", undefined, "Coll1");
    assert.equal(Object.keys(query).length, 1);
    assert.deepEqual(query["Doc2"], { a: "2", b: ["b", "c"] });
  });

  it("Filters expectedly on numbers", () => {
    let query = firestore._where("a", ">", 1, undefined, "Coll1");
    assert.equal(Object.keys(query).length, 0);
  });

  it("Filters expectedly on dates", () => {
    let new_date = new Date();
    firestore._update("Coll1", "Doc1", { date: new_date });

    let query = firestore._where("date", ">", date, undefined, "Coll1");
    assert.equal(Object.keys(query).length, 1);
    assert.deepEqual(query["Doc1"], {
      a: "1",
      b: ["a", "b", "c"],
      date: new TimestampMock(new_date)
    });
  });

  it("Errors when filtering on a date field without using a JS Date object", () => {
    firestore._update("Coll1", "Doc1", { date });

    function error() {
      return firestore._where("date", ">", "1", undefined, "Coll1");
    }
    assert.throws(
      error,
      Error,
      "A query was performed on a firebase Timestamp field without using a JavaScript Date object"
    );
  });
});

describe("Testing the firestore _where method with < filter", () => {
  let firestore;
  let date = new Date();
  beforeEach(() => {
    firestore = new FirestoreMock();
    firestore._set("Coll1", "Doc1", { a: "1", b: ["a", "b", "c"] });
    firestore._set("Coll1", "Doc2", { a: "2", b: ["b", "c"] });
    firestore._set("Coll1", "Doc3", { a: 1, b: ["a", "b", "c", "d"] });
    firestore._set("Coll2", "Doc1", { a: 1, b: ["a", "b", "c", "d"] });
  });

  it("Filters expectedly on strings", () => {
    let query = firestore._where("a", "<", "1", undefined, "Coll1");
    assert.equal(Object.keys(query).length, 0);
  });

  it("Filters expectedly on numbers", () => {
    let query = firestore._where("a", "<", 1, undefined, "Coll1");
    assert.equal(Object.keys(query).length, 0);
  });

  it("Filters expectedly on dates", () => {
    firestore._update("Coll1", "Doc1", { date });

    let query = firestore._where("date", "<", new Date(), undefined, "Coll1");
    assert.equal(Object.keys(query).length, 1);
    assert.deepEqual(query["Doc1"], {
      a: "1",
      b: ["a", "b", "c"],
      date: new TimestampMock(date)
    });
  });

  it("Errors when filtering on a date field without using a JS Date object", () => {
    firestore._update("Coll1", "Doc1", { date });

    function error() {
      return firestore._where("date", "<", "1", undefined, "Coll1");
    }
    assert.throws(
      error,
      Error,
      "A query was performed on a firebase Timestamp field without using a JavaScript Date object"
    );
  });
});

describe("Testing the firestore _where method with array-contains filter", () => {
  let firestore;
  beforeEach(() => {
    firestore = new FirestoreMock();
    firestore._set("Coll1", "Doc1", { a: "1", b: ["a", "b", "c"] });
    firestore._set("Coll1", "Doc2", { a: "2", b: ["b", "c"] });
    firestore._set("Coll1", "Doc3", { a: 1, b: ["a", "b", "c", "d"] });
    firestore._set("Coll2", "Doc1", { a: 1, b: ["a", "b", "c", "d"] });
  });

  it("Filters expectedly", () => {
    let query = firestore._where(
      "b",
      "array-contains",
      "a",
      undefined,
      "Coll1"
    );
    assert.equal(Object.keys(query).length, 2);
    assert.deepEqual(query["Doc1"], { a: "1", b: ["a", "b", "c"] });
    assert.deepEqual(query["Doc3"], { a: 1, b: ["a", "b", "c", "d"] });
  });

  it("Does not error if the field provided is not an Array", () => {
    let query = firestore._where(
      "a",
      "array-contains",
      "a",
      undefined,
      "Coll1"
    );

    assert.equal(Object.keys(query).length, 0);
  });

  it("Does not error if the field provided does not exist", () => {
    let query = firestore._where(
      "1",
      "array-contains",
      "a",
      undefined,
      "Coll1"
    );

    assert.equal(Object.keys(query).length, 0);
  });
});

describe("Testing the firestore _where method with the in filter", () => {
  let firestore;
  beforeEach(() => {
    firestore = new FirestoreMock();
    firestore._set("Coll1", "Doc1", { a: "1", b: ["a", "b", "c"] });
    firestore._set("Coll1", "Doc2", { a: "2", b: ["b", "c"] });
    firestore._set("Coll1", "Doc3", { a: 3, b: ["a", "b", "c", "d"] });
    firestore._set("Coll2", "Doc1", { a: 1, b: ["a", "b", "c", "d"] });
  });

  it("Functions as intended", () => {
    let query = firestore._where("a", "in", ["1", 3], undefined, "Coll1");

    assert.equal(Object.keys(query).length, 2);
    assert.deepEqual(query["Doc1"], { a: "1", b: ["a", "b", "c"] });
    assert.deepEqual(query["Doc3"], { a: 3, b: ["a", "b", "c", "d"] });
  });

  it("Functions when filtering on a date", () => {
    let date = new Date();
    firestore._update("Coll1", "Doc1", { date });

    let query = firestore._where("date", "in", [date], undefined, "Coll1");
    assert.deepEqual(query["Doc1"], {
      a: "1",
      b: ["a", "b", "c"],
      date: new TimestampMock(date)
    });
  });

  it("Errors when more than 10 queries are provided", () => {
    function error() {
      return firestore._where(
        "date",
        "in",
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        undefined,
        "Coll1"
      );
    }

    assert.throws(
      error,
      Error,
      "The 'in' filter operator requires an array of values"
    );
  });

  it("Throws when an array of values is not provided", () => {
    function error() {
      return firestore._where("date", "in", 0, undefined, "Coll1");
    }
    assert.throws(
      error,
      Error,
      "The 'in' filter operator requires an array of values"
    );
  });
});

describe("Testing the 'array-contains-any' filter", () => {
  let firestore;
  beforeEach(() => {
    firestore = new FirestoreMock();
    firestore._set("Coll1", "Doc1", { a: "1", b: ["a"] });
    firestore._set("Coll1", "Doc2", { a: "2", b: ["b", "c"] });
    firestore._set("Coll1", "Doc3", { a: 1, b: ["a", "b", "c", "d"] });
    firestore._set("Coll2", "Doc1", { a: 1, b: ["a", "b", "c", "d"] });
  });

  it("Functions as intended", () => {
    let query = firestore._where(
      "b",
      "array-contains-any",
      ["b", "c"],
      undefined,
      "Coll1"
    );

    assert.equal(Object.keys(query).length, 2);
    assert.deepEqual(query["Doc2"], { a: "2", b: ["b", "c"] });
    assert.deepEqual(query["Doc3"], { a: 1, b: ["a", "b", "c", "d"] });
  });

  it("Functions when filtering on a date", () => {
    let date = new Date();
    firestore._update("Coll1", "Doc1", { b: ["a", "b", date] });

    let query = firestore._where(
      "b",
      "array-contains-any",
      [date, new Date()],
      undefined,
      "Coll1"
    );
    assert.equal(Object.keys(query).length, 1);
    assert.deepEqual(query["Doc1"], {
      a: "1",
      b: ["a", "b", new TimestampMock(date)]
    });
  });

  it("Errors when more than 10 queries are provided", () => {
    function error() {
      return firestore._where(
        "date",
        "array-contains-any",
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        undefined,
        "Coll1"
      );
    }

    assert.throws(
      error,
      Error,
      "The 'in' filter operator requires an array of values"
    );
  });

  it("Throws when an array of values is not provided", () => {
    function error() {
      return firestore._where(
        "date",
        "array-contains-any",
        0,
        undefined,
        "Coll1"
      );
    }
    assert.throws(
      error,
      Error,
      "The 'in' filter operator requires an array of values"
    );
  });
});
