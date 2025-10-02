const helper = require("node-red-node-test-helper");
const openrouterOrchestratorNode = require("../src/openrouter-orchestrator.js");

describe("openrouter-orchestrator Node", function () {
  afterEach(function () {
    helper.unload();
  });

  it("should be loaded", function (done) {
    const flow = [{ id: "n1", type: "openrouter-orchestrator", name: "test orchestrator" }];
    helper.load(openrouterOrchestratorNode, flow, function () {
      const n1 = helper.getNode("n1");
      n1.should.have.property("name", "test orchestrator");
      done();
    });
  });
});
