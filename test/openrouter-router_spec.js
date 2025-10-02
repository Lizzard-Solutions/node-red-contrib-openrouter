const helper = require("node-red-node-test-helper");
const openrouterRouterNode = require("../src/openrouter-router.js");

describe("openrouter-router Node", function () {
  afterEach(function () {
    helper.unload();
  });

  it("should be loaded", function (done) {
    const flow = [{ id: "n1", type: "openrouter-router", name: "test router" }];
    helper.load(openrouterRouterNode, flow, function () {
      const n1 = helper.getNode("n1");
      n1.should.have.property("name", "test router");
      done();
    });
  });
});
