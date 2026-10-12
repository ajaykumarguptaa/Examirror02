module.exports = {
  apps: [
    {
      name: 'examirror-backend',
      cwd: './backend',
      script: 'dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      watch: false,
      max_memory_restart: '800M',
      exp_backoff_restart_delay: 100
    }
  ]
};
