const helper = require("node-red-node-test-helper");
const nock = require("nock");
const openrouterChatNode = require("../src/openrouter-chat.js");
const openrouterConfigNode = require("../src/openrouter-config.js");

describe("openrouter-chat Node", function () {
  afterEach(function () {
    helper.unload();
    nock.cleanAll();
  });

  it("should be loaded", function (done) {
    const flow = [{ id: "n1", type: "openrouter-chat", name: "test name" }];
    helper.load(openrouterChatNode, flow, function () {
      const n1 = helper.getNode("n1");
      n1.should.have.property("name", "test name");
      done();
    });
  });

  it("should send a request to the OpenRouter API and output the response", function (done) {
    const flow = [
      {
        id: "n1",
        type: "openrouter-chat",
        name: "test name",
        wires: [["n2"]],
        config: "configNode",
      },
      { id: "n2", type: "helper" },
      {
        id: "configNode",
        type: "openrouter-config",
        name: "test config",
        model: "test-model",
      },
    ];
    const credentials = {
      configNode: {
        apiKey: "test-api-key",
      },
    };

    const scope = nock("https://openrouter.ai")
      .post("/api/v1/chat/completions")
      .reply(200, {
        choices: [{ message: { content: "test response" } }],
      });

    helper.load(
      [openrouterChatNode, openrouterConfigNode],
      flow,
      credentials,
      function () {
        const n1 = helper.getNode("n1");
        const n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          try {
            msg.should.have.property("payload", "test response");
            scope.done();
            done();
          } catch (err) {
            done(err);
          }
        });
        n1.receive({ payload: "test prompt" });
      }
    );
  });
});
