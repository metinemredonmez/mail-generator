  module.exports = {
    apps: [
      {
        name: 'mail-backend',
        cwd: './backend',
        script: 'dist/src/main.js',
        instances: 1,
        exec_mode: 'fork',
        autorestart: true,
        watch: false,
        max_memory_restart: '500M',
        env_production: {
          NODE_ENV: 'production',
          PORT: 4000
        }
      },
      {
        name: 'mail-frontend',
        cwd: './frontend',
        script: 'node_modules/next/dist/bin/next',
        args: 'start -p 3000',
        instances: 1,
        exec_mode: 'fork',
        autorestart: true,
        watch: false,
        max_memory_restart: '500M',
        env_production: {
          NODE_ENV: 'production',
          PORT: 3000
        }
      }
    ]
  };
