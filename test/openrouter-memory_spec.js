const helper = require("node-red-node-test-helper");
const openrouterMemoryNode = require("../src/openrouter-memory.js");

describe("openrouter-memory Node", function () {
  afterEach(function () {
    helper.unload();
  });

  it("should be loaded", function (done) {
    const flow = [{ id: "n1", type: "openrouter-memory", name: "test memory" }];
    helper.load(openrouterMemoryNode, flow, function () {
      const n1 = helper.getNode("n1");
      n1.should.have.property("name", "test memory");
      done();
    });
  });
});
