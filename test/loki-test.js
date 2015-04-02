var lokidb = require("../");
var crud   = require("crudlet");
var expect = require("expect.js");
var _      = require("highland");
var loki   = require("lokijs");

describe(__filename + "#", function() {

  it("can be created", function() {
    lokidb();
  });

  it("can pass in a loki instance", function() {
    var target = new loki();
    var db = lokidb(target);
    expect(db.target).to.be(target);
  });

  it("emits an error if collection is missing", function(next) {
    var db = lokidb();
    db("insert", { data: { name: "abba" }}).on("error", function() {
      next();
    });
  });

  it("can insert an item", function(next) {
    var db = crud.child(lokidb(), { collection: "people" });
    db("insert", { data: { name: "abba" }}).on("data", function(item) {
      expect(item.meta).not.to.be(void 0);
      next();
    });
  });

  it("can insert an item with a loki id", function(next) {
    var db = crud.child(lokidb(), { collection: "people" });
    db("insert", { data: { name: "abba", $loki: 1 }}).on("data", function(item) {
      expect(item.meta).not.to.be(void 0);
      next();
    });
  });

  it("can insert multiple items", function(next) {
    var db = crud.child(lokidb(), { collection: "people" });
    db("insert", { data: [{ name: "abba" }, { name: "baab"}]}).pipe(_.pipeline(_.collect)).on("data", function(items) {
      expect(items[0].name).to.be("abba");
      expect(items[1].name).to.be("baab");
      next();
    });
  });

  it("can update an item", function(next) {
    var db = crud.child(lokidb(), { collection: "people" });

    db("insert", {
      data: { name: "abba" }
    }).on("data", function(item) {

      db("update", {
        query: { name: "abba" },
        data: { age: 17 }
      }).on("data", function(item) {

        expect(item.name).to.be("abba");
        expect(item.age).to.be(17);
        next();
      });
    });
  });

  it("can update multiple items", function(next) {
    var db = crud.child(lokidb(), { collection: "people" });
    db("insert", {
      data: [
        { name: "abba" },
        { name: "abba" }
      ]
    }).pipe(_.pipeline(_.collect)).on("data", function(items) {

      expect(items.length).to.be(2);

      db("update", {
        multi: true,
        query: { name: "abba" },
        data: { age: 17 }
      }).pipe(_.pipeline(_.collect)).on("data", function(items) {

        expect(items.length).to.be(2);
        expect(items[0].name).to.be("abba");
        expect(items[0].age).to.be(17);
        expect(items[1].name).to.be("abba");
        expect(items[1].age).to.be(17);
        next();
      });
    });
  });

  it("can load one item", function(next) {
    var db = crud.child(lokidb(), { collection: "people" });
    db("insert", {
      data: [
        { name: "abba" },
        { name: "abba" }
      ]
    }).pipe(_.pipeline(_.collect)).on("data", function() {
      db("load", {
        query: { name: "abba" }
      }).on("data", function(person) {
        expect(person.name).to.be("abba");
        next();
      });
    });
  });

  it("can load multiple items", function(next) {
    var db = crud.child(lokidb(), { collection: "people" });
    db("insert", {
      data: [
        { name: "abba" },
        { name: "abba" }
      ]
    }).pipe(_.pipeline(_.collect)).on("data", function() {
      db("load", {
        multi: true,
        query: { name: "abba" }
      }).pipe(_.pipeline(_.collect)).on("data", function(items) {
        expect(items.length).to.be(2);
        next();
      });
    });
  });

  it("can remove one item", function(next) {
    var db = crud.child(lokidb(), { collection: "people" });

    db("insert", {
      data: [
        { name: "abba" },
        { name: "abba" }
      ]
    }).pipe(_.pipeline(_.collect)).on("data", function() {
      db("remove", {
        query: { name: "abba" }
      }).on("end", function() {

        db("load", {
          query: { name: "abba" }
        }).pipe(_.pipeline(_.collect)).on("data", function(items) {
          expect(items.length).to.be(1);
          next();
        });
      });
    });
  });

  it("can remove multiple items", function(next) {
    var db = crud.child(lokidb(), { collection: "people" });

    db("insert", {
      data: [
        { name: "abba" },
        { name: "abba" }
      ]
    }).pipe(_.pipeline(_.collect)).on("data", function() {
      db("remove", {
        multi: true,
        query: { name: "abba" }
      }).on("end", function() {

        db("load", {
          query: { name: "abba" }
        }).pipe(_.pipeline(_.collect)).on("data", function(items) {
          expect(items.length).to.be(0);
          next();
        });
      });
    });
  });

  it("can upsert and insert an item", function(next) {
    var db = crud.child(lokidb(), { collection: "people" });
    db("upsert", {
      query: { name: "abba" },
      data: { name: "abba" }
    }).on("data", function(item) {
      expect(item.meta).not.to.be(void 0);
      next();
    });
  });

  it("can upsert and update an item", function(next) {
    var db = crud.child(lokidb(), { collection: "people" });
    db("upsert", {
      query: { name: "abba" },
      data: { name: "abba" }
    }).on("data", function(insertedItem) {
      db("upsert", {
        query: { name: "abba" },
        data: { name: "abba" }
      }).on("data", function(updatedItem) {
        expect(insertedItem.$loki).to.be(updatedItem.$loki);
        next();
      });
    });
  });
});
