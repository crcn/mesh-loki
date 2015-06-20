var lokidb = require("../");
var mesh   = require("mesh");
var expect = require("expect.js");
var _      = require("highland");
var loki   = require("lokijs");
var createTestCases      = require("mesh/test-cases/database");

describe(__filename + "#", function() {

  var cases = createTestCases(function() {
    return lokidb();
  });

  for (var name in cases) {
    it(name, cases[name]);
  }

  it("can pass in a loki instance", function() {
    var target = new loki();
    var db = lokidb(target);
    expect(db.target).to.be(target);
  });

  it("can insert an item with a loki id", function(next) {

    var db = lokidb();

    db({ name: "insert", collection: "people", data: { name: "abba", $loki: 1 }}).on("data", function(item) {
      expect(item.meta).not.to.be(void 0);
      next();
    });
  });
});
