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
    const site = new sst.aws.Nextjs("diaspora-wallet-frontend", {
      functionUrl: true,
      functionUrlAuthType: "NONE",
    });

    // Add full invoke permission
    site.serverFunction.addPermission(`${site.id}-AllowAllInvoke`, {
      principal: new iam.AnyPrincipal(),
      action: [
        "lambda:InvokeFunctionUrl",
        "lambda:InvokeFunction",
      ],
    });
  }
});
