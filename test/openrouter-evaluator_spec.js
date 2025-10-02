const helper = require("node-red-node-test-helper");
const openrouterEvaluatorNode = require("../src/openrouter-evaluator.js");

describe("openrouter-evaluator Node", function () {
  afterEach(function () {
    helper.unload();
  });

  it("should be loaded", function (done) {
    const flow = [{ id: "n1", type: "openrouter-evaluator", name: "test evaluator" }];
    helper.load(openrouterEvaluatorNode, flow, function () {
      const n1 = helper.getNode("n1");
      n1.should.have.property("name", "test evaluator");
      done();
    });
  });
});
