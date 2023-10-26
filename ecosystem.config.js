// File cấu hình cho PM2 truyền NODE_ENV khi chay code với PM2
// eslint-disable-next-line no-undef
module.exports = {
  apps: [
    {
      name: 'twitter', // Tên app trên TM2
      script: 'dist/index.js', // lệnh chạy kèm đường dẫn file build
      env: {
        NODE_ENV: 'development', // Riêng NODE_ENV thì có thể dùng process.env.NODE_ENV hoặc process.NODE_ENV, còn lại thì chỉ được dùng process.env.TEN_BIEN
        TEN_BIEN: 'Gia tri'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
}

// Khi chạy code với PM2 sử dụng lệnh sau: "pm2 start ecosystem.config.js"
// Muốn chạy env production: "pm2 start ecosystem.config.js --env production"
