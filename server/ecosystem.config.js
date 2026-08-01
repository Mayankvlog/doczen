module.exports = {
  apps: [
    {
      name: 'doczen-server',
      script: 'server.js',
      cwd: __dirname,
      exec_mode: 'cluster',
      instances: 'max',
      max_memory_restart: '1G',
      kill_timeout: 10000,
      listen_timeout: 15000,
      autorestart: true,
      merge_logs: true,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
