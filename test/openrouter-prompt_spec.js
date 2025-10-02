const helper = require("node-red-node-test-helper");
const openrouterPromptNode = require("../src/openrouter-prompt.js");

describe("openrouter-prompt Node", function () {
  afterEach(function () {
    helper.unload();
  });

  it("should be loaded", function (done) {
    const flow = [{ id: "n1", type: "openrouter-prompt", name: "test prompt" }];
    helper.load(openrouterPromptNode, flow, function () {
      const n1 = helper.getNode("n1");
      n1.should.have.property("name", "test prompt");
      done();
    });
  });
});
