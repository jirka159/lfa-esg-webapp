module.exports = {
  apps: [
    {
      name: 'lfa-esg-webapp',
      cwd: '/var/www/lfa-esg-webapp',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        APP_URL: 'https://lfa.jirkovo.app'
      }
    }
  ]
};
