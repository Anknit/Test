module.exports = {
  apps : [{
    name   : "api-server",
    script : "api-server.js",
    watch  : true, // Enable watch mode
    ignore_watch : ["node_modules", "logs", "cache"], // Ignore these directories
    env: {
      NODE_ENV: "development"
    },
    env_production : {
      NODE_ENV: "production"
    }
  }]
}