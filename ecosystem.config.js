module.exports = {
  apps : [{
    name   : "api-server",
    script : "api-server.js",
    watch  : true, // Enable watch mode
    // Ignore generated files and directories that APIs modify at runtime
    ignore_watch : [
      "node_modules",
      "logs",
      "cache",
      "enctoken_backups",
      "*.bak",
      "backtest_results.json",
      "trading_state.json",
      ".env.enctoken",
      ".env.email",
      "*.log",
      "enctoken_backups/*"
    ], // Ignore these directories and files
    // Reduce restarts from rapid successive file writes
    watch_delay: 3000,
    watch_options: {
      // avoid following symlinks which can trigger restarts
      followSymlinks: false
    },
    env: {
      NODE_ENV: "development"
    },
    env_production : {
      NODE_ENV: "production"
    }
  }]
}