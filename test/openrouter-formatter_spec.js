const helper = require("node-red-node-test-helper");
const openrouterFormatterNode = require("../src/openrouter-formatter.js");

describe("openrouter-formatter Node", function () {
  afterEach(function () {
    helper.unload();
  });

  it("should be loaded", function (done) {
    const flow = [{ id: "n1", type: "openrouter-formatter", name: "test formatter" }];
    helper.load(openrouterFormatterNode, flow, function () {
      const n1 = helper.getNode("n1");
      n1.should.have.property("name", "test formatter");
      done();
    });
  });
});
