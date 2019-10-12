const util = require("util");
const CollectionReferenceMock = require("./CollectionReferenceMock");
const DatabaseMock = require("./DatabaseMock");

/*
FirestoreMock class used for mocking the admin SDK FirestoreMock class. Can be stubbed in
the test by sinon or imported into a test file and used as a function param
 */

function FirestoreMock() {
  this._db = new DatabaseMock();
  this.app = "Mock app not supported";
}

FirestoreMock.prototype.firestore = function() {
  return this;
};

FirestoreMock.prototype.collection = function(name) {
  return new CollectionReferenceMock(name, this);
};

FirestoreMock.prototype._get = function(collection_id, id) {
  if (
    !this._db._collections[collection_id] ||
    !this._db._collections[collection_id][id]
  ) {
    return undefined;
  } else {
    return this._db._collections[collection_id][id];
  }
};

FirestoreMock.prototype._set = function(collection_id, id, data, options) {
  data = this._checkData(data, id);
  if (!this._db._collections[collection_id]) {
    this._db._collections[collection_id] = {};
  }
  if (
    options &&
    options["merge"] === "true" &&
    this._db._collections[collection_id][id]
  ) {
    this._update(collection_id, id, data);
    return;
  } else {
    this._db._collections[collection_id][id] = data;
    return;
  }
};

FirestoreMock.prototype._update = function(collection_id, id, data) {
  let serialized_data = this._checkData(data, id);
  if (
    !this._db._collections[collection_id] &&
    !this._db._collections[collection_id][id]
  ) {
    throw new Error("Document does not exist, failed to update");
  } else {
    let keys = Object.keys(serialized_data);
    let doc = this._db._collections[collection_id][id];
    for (let index in keys) {
      doc[keys[index]] = serialized_data[keys[index]];
    }
    return;
  }
};

FirestoreMock.prototype._delete = function(collection_id, id) {
  if (this._db._collections[collection_id][id]) {
    delete this._db._collections[collection_id][id];
  }
  return;
};

FirestoreMock.prototype._where = function(
  field,
  operator,
  value,
  docs,
  collection_id
) {
  let operators = {
    "==": function(field, value) {
      if (field && field.constructor.name === "TimestampMock") {
        try {
          return field.date.getTime() === value.getTime();
        } catch (err) {
          throw new Error(
            "A query was performed on a firebase Timestamp field without using a JavaScript Date object"
          );
        }
      }
      return field === value;
    },
    "array-contains": function(field, value) {
      return field.includes(value);
    }
  };

  if (!operators[operator]) {
    throw new Error(
      "Query.where() calls with this operator is not supported at this time"
    );
  }

  let data;
  if (docs && Object.keys(docs).length) {
    data = docs;
  } else if (collection_id) {
    data = this._db._collections[collection_id]
      ? this._db._collections[collection_id]
      : {};
  } else {
    data = this._db._collections;
  }

  let filtered_docs = {};
  let keys = Object.keys(data);
  if (!keys.length) {
    return data;
  }

  for (let index in keys) {
    let doc = data[keys[index]];
    // comparing the field of each doc to the given value via the operator
    if (operators[operator](doc[field], value)) {
      filtered_docs[keys[index]] = doc;
    }
  }
  return filtered_docs;
};

FirestoreMock.prototype._checkData = function(data, id) {
  let serialized_data = {};
  let keys = Object.keys(data);
  let undefined_keys = keys.map(key => {
    if (data[key] === undefined) {
      return key;
    }
  });

  undefined_keys = undefined_keys.filter(key => {
    return key !== undefined;
  });

  if (undefined_keys.length) {
    let names = undefined_keys.join(" ");
    throw new Error(
      `Document ${id} contains undefined key values: ${names}. This document cannot be saved to Firestore.`
    );
  }

  for (let index in keys) {
    if (data[keys[index]] === null) {
      serialized_data[keys[index]] = null;
    } else if (data[keys[index]].constructor === Date) {
      serialized_data[keys[index]] = new TimestampMock(data[keys[index]]);
    } else if (data[keys[index]].constructor === Array) {
      serialized_data[keys[index]] = [];
      data[keys[index]].forEach(i => {
        if (i.constructor === Date) {
          serialized_data[keys[index]].push(new TimestampMock(i));
        } else if (i.constructor === Array) {
          throw new Error(`Document ${id} contains nested arrays. This document cannot be saved to
        Firestore.`);
        } else if (i.constructor === Object) {
          let obj = {};
          Object.keys(i).forEach(key => {
            if (i[key].constructor === Date) {
              obj[key] = new TimestampMock(i[key]);
            } else {
              obj[key] = i[key];
            }
          });
          serialized_data[keys[index]].push(obj);
        } else {
          serialized_data[keys[index]].push(i);
        }
      });
    } else {
      serialized_data[keys[index]] = data[keys[index]];
    }
  }
  return serialized_data;
};

FirestoreMock.prototype.clearData = function() {
  delete this._db;
  this._db = new DatabaseMock();
};

FirestoreMock.prototype.batch = function() {
  return new WriteBatchMock(this);
};

FirestoreMock.prototype.runTransaction = async function(callback) {
  let transaction = new TransactionMock(this);
  await callback(transaction);
  transaction.commit();
  return;
};

function WriteBatchMock(firestore) {
  this.firestore = firestore;
  this._set = [];
  this._update = [];
  this._delete = [];
}

WriteBatchMock.prototype.set = function(ref, data, options) {
  this._set.push({ ref, data, options });
};
WriteBatchMock.prototype.update = function(ref, data) {
  this._update.push({ ref, data });
};
WriteBatchMock.prototype.delete = function(ref, data) {
  this._delete.push({ ref, data });
};
WriteBatchMock.prototype.commit = function() {
  for (let index in this._set) {
    let params = this._set[index];
    this.firestore._set(
      params.ref.parent.id,
      params.ref.id,
      params.data,
      params.options
    );
  }

  for (let index in this._update) {
    let params = this._update[index];
    this.firestore._update(params.ref.parent.id, params.ref.id, params.data);
  }

  for (let index in this._delete) {
    let params = this._delete[index];
    this.firestore._delete(params.ref.parent.id, params.ref.id);
  }
};

function TransactionMock(firestore) {
  this.firestore = firestore;
  this._set = [];
  this._update = [];
  this._delete = [];
}
util.inherits(TransactionMock, WriteBatchMock);
TransactionMock.prototype.get = function(ref) {
  return ref.get();
};

function TimestampMock(date) {
  this.date = date;
}
TimestampMock.prototype.toMillis = function() {
  return this.date.getTime();
};
TimestampMock.prototype.toDate = function() {
  return this.date;
};

module.exports = FirestoreMock;
