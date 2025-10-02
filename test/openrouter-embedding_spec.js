const helper = require("node-red-node-test-helper");
const openrouterEmbeddingNode = require("../src/openrouter-embedding.js");

describe("openrouter-embedding Node", function () {
  afterEach(function () {
    helper.unload();
  });

  it("should be loaded", function (done) {
    const flow = [{ id: "n1", type: "openrouter-embedding", name: "test embedding" }];
    helper.load(openrouterEmbeddingNode, flow, function () {
      const n1 = helper.getNode("n1");
      n1.should.have.property("name", "test embedding");
      done();
    });
  });
});
