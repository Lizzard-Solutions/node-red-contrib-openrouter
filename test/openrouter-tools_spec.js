const helper = require("node-red-node-test-helper");
const openrouterToolsNode = require("../src/openrouter-tools.js");

describe("openrouter-tools Node", function () {
  afterEach(function () {
    helper.unload();
  });

  it("should be loaded", function (done) {
    const flow = [{ id: "n1", type: "openrouter-tools", name: "test tools" }];
    helper.load(openrouterToolsNode, flow, function () {
      const n1 = helper.getNode("n1");
      n1.should.have.property("name", "test tools");
      done();
    });
  });
});
