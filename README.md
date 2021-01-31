# firestore-mock

A Firestore mock for node, intended to replace the node Firestore instance from the Firebase Admin SDK to allow for easy testing. Simply replace a Firestore instance with a FirestoreMock instance and run tests without having to set up the Firestore emulator. The FirestoreMock instance is lightweight and functions with async/await calls.

Install through npm: \
`npm install firestore-mock`

Import and instantiate the mock instance:

```
const FirestoreMock = require('firestore-mock')
const firestore = new FirestoreMock()
```

Get, set, update, and delete documents the same as a normal Firestore instance. All data is stored locally on the instance. All DocumentSnapshot methods are mocked:

```
firestore.collection('Users').doc('user1').set({name: 'Stan'})
let user = firestore.collection('Users').doc('user1).get()
console.log(user.exists)  //returns true
console.log(user.id)      //returns 'user1'
console.log(user.data())  //returns {name: 'Stan'}

firestore.collection('Users').doc('user1').update({name: 'Stan Stanson'}) //update method
firestore.collection('Users').doc('user1').set({'authentication': 'google'}, {merge: true}) //create or update method
firestore.collection('Users').doc('user1').delete() //deleted doc
```

Collection methods are are also available, as well as the following query filters: '<', '<=', '==', '>=', '>', 'array-contains', 'array-contains-any', and 'in':

```
 firestore.collection('Users').doc('user1').set({name: 'Stan'})
 let users = firestore.collection('Users').get();
 console.log(users.empty)  //returns false
 console.log(users.docs)  // returns array of DocumentSnapshotMocks

 //filter queries:
 users = firestore.collection('Users').where('name', '==', 'Stan Stanson').get()
```

Javascript Date objects on a saved document are converted into TimestampMocks with the toDate and toMillis methods:

```
firestore.collection('Users').doc('user2').set({name: 'Jan', date: new Date()})
let user = firestore.collection('Users').doc('user2').get()
console.log(user.data().date.toDate()) //returns Javascript Date object
console.log(user.data().date.toMillis()) //returns unix timestamp
```

Transactions and batch writes are also supported:

```
const user_ref = firestore.collection('Users').doc('user2')
const batch = firestore.batch()
batch.update(user_ref, {name: 'Jan Jandaughter'})
batch.commit()

firestore.runTransaction(transaction => {
  let user = transaction.get(user_ref)
  transaction.update(user_ref, {date: new Date()})
}
```

All data is saved locally on the \_db.\_collections property of the Firestore instance for easy debugging when writing tests:

```
firestore._db._collections //returns {Users: {user2: { name: 'Jan Jandaughter', ...} } }
```
