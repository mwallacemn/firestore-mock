const util = require("util");
const CollectionReferenceMock = require("./CollectionReferenceMock");
const DatabaseMock = require("./DatabaseMock");
const TimestampMock = require("./TimestampMock");

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

FirestoreMock.prototype.doc = function(path) {
    var parts = path.split('/');

    var doc;

    for (var i = 0; i < parts.length; i++) {
        var name = parts[i];
        if (name.trim() === '') break;

        if (i == 0) {
            doc = this.collection(name);
        } else if (i % 2 == 0) {
            doc = doc.collection(name, this, doc);
        } else {
            doc = doc.doc(name);
        }
    }

    return doc;
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

  return serializeObject(data);
};

FirestoreMock.prototype._getPath = function(ref){
  var path_splits = ref.id.split("/");
  let path = path_splits[path_splits.length-1];

  let parent = ref.parent;
  while(parent != null || parent != undefined){
    let parent_ids = parent.id.split("/");
    let parentRealId = parent_ids[parent_ids.length-1];
    path = parentRealId + "/" + path;
    parent = parent.parent;
  }

  return path;
}

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

function serializeObject(obj) {
  let serialized_obj = {};
  let keys = Object.keys(obj);

  for (let index in keys) {
    let key = keys[index];
    let val = obj[key];
    if (
      val === null ||
      (val.constructor !== Date &&
        val.constructor !== Array &&
        val.constructor !== Object)
    ) {
      serialized_obj[key] = val;
    } else if (val.constructor === Date) {
      serialized_obj[key] = new TimestampMock(val);
    } else if (val.constructor === Array) {
      serialized_obj[key] = serializeArray(val);
    } else {
      serialized_obj[key] = serializeObject(val);
    }
  }
  return serialized_obj;
}

function serializeArray(array) {
  let serialized_array = [];
  for (let index in array) {
    let val = array[index];
    if (val === null) {
      serialized_array[index] = null;
    } else if (val.constructor === Array) {
      throw new Error(
        "Document contains nested arrays and cannot be saved to Firestore"
      );
    } else if (val.constructor === Date) {
      serialized_array[index] = new TimestampMock(val);
    } else if (val.constructor === Array) {
      serialized_array[index] = serializeArray(val);
    } else if (val.constructor === Object) {
      serialized_array[index] = serializeObject(val);
    } else {
      serialized_array[index] = val;
    }
  }
  return serialized_array;
}

const operators = {
  "==": function(field, value) {
    if (field && field.constructor.name === "TimestampMock") {
      try {
        return field.date.getTime() === value.getTime();
      } catch (err) {
        throw new Error(
          "A query was performed on a firebase Timestamp field without using a JavaScript Date object"
        );
      }
    } else if (typeof field !== typeof value) {
      return false;
    } else {
      return field === value;
    }
  },

  "<=": function(field, value) {
    if (field && field.constructor.name === "TimestampMock") {
      try {
        return field.date.getTime() <= value.getTime();
      } catch (err) {
        throw new Error(
          "A query was performed on a firebase Timestamp field without using a JavaScript Date object"
        );
      }
    } else if (typeof field !== typeof value) {
      return false;
    } else {
      return field <= value;
    }
  },

  ">=": function(field, value) {
    if (field && field.constructor.name === "TimestampMock") {
      try {
        return field.date.getTime() >= value.getTime();
      } catch (err) {
        throw new Error(
          "A query was performed on a firebase Timestamp field without using a JavaScript Date object"
        );
      }
    } else if (typeof field !== typeof value) {
      return false;
    } else {
      return field >= value;
    }
  },

  ">": function(field, value) {
    if (field && field.constructor.name === "TimestampMock") {
      try {
        return field.date.getTime() > value.getTime();
      } catch (err) {
        throw new Error(
          "A query was performed on a firebase Timestamp field without using a JavaScript Date object"
        );
      }
    } else if (typeof field !== typeof value) {
      return false;
    } else {
      return field > value;
    }
  },

  "<": function(field, value) {
    if (field && field.constructor.name === "TimestampMock") {
      try {
        return field.date.getTime() < value.getTime();
      } catch (err) {
        throw new Error(
          "A query was performed on a firebase Timestamp field without using a JavaScript Date object"
        );
      }
    } else if (typeof field !== typeof value) {
      return false;
    } else {
      return field < value;
    }
  },

  "array-contains": function(field, value) {
    if (!Array.isArray(field)) {
      return false;
    }
    return field.includes(value);
  },

  in: function(field, values) {
    if (!Array.isArray(values) || !values.length) {
      throw new Error("The 'in' filter operator requires an array of values");
    }

    if (values.length > 10) {
      throw new Error(
        "Firestore only allows up to 10 values to be filtered in an 'in' filter"
      );
    }

    if (field && field.constructor.name === "TimestampMock") {
      for (let index in values) {
        let val = values[index];
        if (val instanceof Date && val.getTime() === field.date.getTime()) {
          return true;
        }
      }
      return false;
    } else {
      return values.includes(field);
    }
  },

  "not-in": function(field, values) {
    if (!Array.isArray(values) || !values.length) {
      throw new Error("The 'not-in' filter operator requires an array of values");
    }

    if (values.length > 10) {
      throw new Error(
        "Firestore only allows up to 10 values to be filtered in a 'not-in' filter"
      );
    }

    if (field && field.constructor.name === "TimestampMock") {
      for (let index in values) {
        let val = values[index];
        if (val instanceof Date && val.getTime() === field.date.getTime()) {
          return false;
        }
      }
      return false;
    } else {
      return !values.includes(field);
    }
  },

  "array-contains-any": function(field, values) {
    if (!Array.isArray(values) || !values.length) {
      throw new Error(
        "The 'array-contains-any' filter operator requires an array of values"
      );
    }

    if (values.length > 10) {
      throw new Error(
        "Firestore only allows up to 10 values to be filtered in an 'array-contains-any' filter"
      );
    }

    if (!Array.isArray(field)) {
      return false;
    } else {
        var fieldHasVal = false;
      for (let index in values) {
        let val = values[index];
        if (val instanceof Date) {
          let time = val.getTime();
          for (let index in field) {
            if (
              field[index] instanceof TimestampMock &&
              field[index].date.getTime() === time
            ) {
              return true;
            }
          }
        } else {
            fieldHasVal |= field.includes(val);
        }
      }
        return fieldHasVal;
    }
  }
};

module.exports = FirestoreMock;
