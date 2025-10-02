const helper = require("node-red-node-test-helper");
const openrouterRankerNode = require("../src/openrouter-ranker.js");

describe("openrouter-ranker Node", function () {
  afterEach(function () {
    helper.unload();
  });

  it("should be loaded", function (done) {
    const flow = [{ id: "n1", type: "openrouter-ranker", name: "test ranker" }];
    helper.load(openrouterRankerNode, flow, function () {
      const n1 = helper.getNode("n1");
      n1.should.have.property("name", "test ranker");
      done();
    });
  });
});
