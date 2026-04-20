module.exports = {
  apps: [
    {
      name: "server",
      script: "dist/index.js",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
