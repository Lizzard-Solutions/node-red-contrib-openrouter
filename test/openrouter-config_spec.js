const helper = require("node-red-node-test-helper");
const openrouterConfigNode = require("../src/openrouter-config.js");

describe("openrouter-config Node", function () {
  afterEach(function () {
    helper.unload();
  });

  it("should be loaded", function (done) {
    const flow = [
      {
        id: "n1",
        type: "openrouter-config",
        name: "test config",
        model: "test-model",
      },
    ];
    const credentials = {
      n1: {
        apiKey: "test-api-key",
      },
    };
    helper.load(openrouterConfigNode, flow, credentials, function () {
      const n1 = helper.getNode("n1");
      n1.should.have.property("name", "test config");
      done();
    });
  });
});
