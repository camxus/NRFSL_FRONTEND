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
      environment: {
        NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL!,
      },
      // Make the Lambda Function URL public
      functionUrl: true,
      functionUrlAuthType: "NONE",
    });
  },
});
