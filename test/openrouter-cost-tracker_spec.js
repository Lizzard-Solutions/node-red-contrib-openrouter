const helper = require("node-red-node-test-helper");
const openrouterCostTrackerNode = require("../src/openrouter-cost-tracker.js");

describe("openrouter-cost-tracker Node", function () {
  afterEach(function () {
    helper.unload();
  });

  it("should be loaded", function (done) {
    const flow = [{ id: "n1", type: "openrouter-cost-tracker", name: "test cost-tracker" }];
    helper.load(openrouterCostTrackerNode, flow, function () {
      const n1 = helper.getNode("n1");
      n1.should.have.property("name", "test cost-tracker");
      done();
    });
  });
});
