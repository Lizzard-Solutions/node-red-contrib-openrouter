const helper = require("node-red-node-test-helper");
const openrouterVectorStoreNode = require("../src/openrouter-vector-store.js");
const openrouterConfigNode = require("../src/openrouter-config.js");

describe("openrouter-vector-store Node", function () {
  afterEach(function () {
    helper.unload();
  });

  it("should be loaded", function (done) {
    const flow = [
      {
        id: "n1",
        type: "openrouter-vector-store",
        name: "test vector-store",
        config: "n2",
      },
      {
        id: "n2",
        type: "openrouter-config",
        name: "test config",
        model: "test-model",
      },
    ];
    const credentials = {
      n2: {
        apiKey: "test-api-key",
      },
    };
    helper.load(
      [openrouterVectorStoreNode, openrouterConfigNode],
      flow,
      credentials,
      function () {
        const n1 = helper.getNode("n1");
        n1.should.have.property("name", "test vector-store");
        done();
      }
    );
  });
});
