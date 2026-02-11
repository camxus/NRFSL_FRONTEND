/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "DiasporaWallet",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    new sst.aws.Nextjs("diaspora-wallet-frontend", {
      functionUrl: true,
      functionUrlAuthType: "NONE",
    });
  }
});
