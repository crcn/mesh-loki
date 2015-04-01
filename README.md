

[![Build Status](https://travis-ci.org/mojo-js/crudlet-loki.svg)](https://travis-ci.org/mojo-js/crudlet-loki) [![Coverage Status](https://coveralls.io/repos/mojo-js/crudlet-loki/badge.svg?branch=master)](https://coveralls.io/r/mojo-js/crudlet-loki?branch=master) [![Dependency Status](https://david-dm.org/mojo-js/crudlet-loki.svg)](https://david-dm.org/mojo-js/crudlet-loki)

Streamable database adapter for [LokiJS](http://lokijs.org/#/), an in-memory JavaScript database. This library also pairs nicely with [crudlet](https://github.com/mojo-js/crudlet.js), along with all the other crudlet plugins such as [crudlet-pubnub](https://github.com/mojo-js/crudlet-pubnub), and [crudlet-http](https://github.com/mojo-js/crudlet-http).

```javascript
var crud   = require("crudlet");
var lokidb = require("crudlet-loki");
var loki   = require("loki");
var _      = require("highland");

// setup the DB
var db = lokidb(new loki(__dirname + "/db.json"));
// db = lokidb(__dirname + "/db.json"); // also works

// setup the child collection
var peopleDb = crud.child(db, { collection: "people" });

// insert one, or many items
peopleDb("insert", {
  data: [
    { name: "Sleipnir"    , legs: 8 },
    { name: "Jormungandr" , legs: 0 },
    { name: "Hel"         , legs: 2 }
  ]
).

// collect all the inserted items & put them in an array using HighlandJS
// this is similar to something like cursor.toArray() in mongodb
pipe(_().collect()).

// wait for the data to be emitted
on("data", function(people) {

  // load all people who have more than 0 legs
  peopleDb("load", {
    multi: true,
    query: {
      legs: { $gt: 0 }
    }
  }).
  pipe(_().collect()).
  on("data", function(people) {
      // do stuff with loaded people
  });

});
```

#### db lokidb(targetOrOptions)

Creates a new crudlet-based db

- `targetOrOptions` - the target loki DB or the options for a new loki db

```javascript
var db = lokidb(__dirname + "/db.json");
var db = lokidb(new loki(__dirname + "/db.json"));
```

#### db(operationName, options)

Runs a new operation on the loki DB.

> Note that `options.collection` *must* be present when performing operations. The easiest & probably best way to do this is to create a `child` crudlet db.

```javascript
// remove all people where ages are greater than zero
db("remove", {
  collection: "people",
  query: {
    age: { $gt: 0 }
  }
}).on("data", function() {

});
```

#### insert

Insert operation.

```javascript
var peopleDb = crud.child(db, { collection: "people" });

// insert multiple
peopleDb("insert", { data: [{ name: "john"}, { name: "matt" }]}).on("data", function() {
  // this is called twice.
});
```

#### update

Update operation

```javascript
peopleDb("update", {
  query: { /* mongodb query here */ },
  data: { /* data to update*/ },
  multi: true // TRUE if you want to update multiple items
}).on("data", function() {
  // emits updated documents
});
```

#### upsert

Updates a document if it's found, or inserts one.

```javascript
peopleDb("upsert", {
  query: { /* mongodb query here */ },
  data: { /* data to update or insert here */ }
}).on("data", function() {
  // emits updated documents
});
```

#### remove

Removes a document

```javascript
peopleDb("upsert", {
  query: { /* mongodb query here */ },
  data: { /* data to update*/ },
  multi: true, // TRUE if you want to remove multiple items
}).on("end", function() {

});
```

#### load

Removes a document

```javascript
peopleDb("upsert", {
  query: { /* mongodb query here */ },
  multi: true, // TRUE if you want to load multiple items
}).on("data", function() {

});
```

## Interoperability with other database

`crudlet-loki` works well with other [crudlet adapters](https://github.com/mojo-js/crudlet.js#adapters). Below are a some examples of
what you can do.

### Realtime data

Use whatever realtime adapter you want - [pubnub](https://github.com/mojo-js/crudlet-pubnub), webrtc, socket.io. Here's an example with [pubnub](https://github.com/mojo-js/crudlet-pubnub):

```javascript
var pubnub = require("crudlet-pubnub");
var loki   = require("crudlet-loki");
var crud   = require("crudlet");

var remotedb = pubnub(ops);

// tailable makes "tail" an option for databases that don't support it (such as lokidb).
// "tail" gets emmited whenever there's an operation executed against the database
var memdb    = crud.tailable(loki());

// tail all remote operations to the memory database
remotedb("tail").pipe(crud.open(memdb));

// tail operations on the in-memory database & pass them back to pubnub
// NOTE that operations coming from pubnub won't get re-published.
memdb("tail").pipe(crud.open(remotedb));

// insert data to the local database - this will also get sent to pubnub
memdb("insert", {
  collection: "people"
  data: {
    name: "Will Ferrell"
  }
});
```

<!--
#### RESTful interface

```javascript

var localStorage = require("crudlet-local-storage");
var loki         = require("crudlet-loki");
var crud         = require("crudlet");

var storedb  = crud.tailable(localStorage());
var memdb    = crud.tailable(loki());

storedb("load").pipe(crud.open(memdb));
remotedb("tail").pipe(crud.open(memdb));

// tail operations on the in-memory database & pass them back to pubnub
// NOTE that operations coming from pubnub won't get re-published.
memdb("tail").pipe(crud.open(remotedb));

// insert data to the local database - this will also get sent to pubnub
memdb("insert", {
  collection: "people"
  data: {
    name: "Will Ferrell"
  }
});
```
-->
