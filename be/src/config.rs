// Code related to app configuration and environment variables
use std::sync::OnceLock;

static ONEFA_CONFIG: OnceLock<OnefaConfig> = OnceLock::new();

#[derive(Clone, Debug)]
pub struct OnefaConfig {
    pub database_url: String,
    pub auth_server_url: String,
    pub app_url: String, // public
    pub static_file_root: String,
}

pub fn set_onefa_config() {
    ONEFA_CONFIG.get_or_init(|| OnefaConfig {
        database_url: std::env::var("DATABASE_URL").unwrap(),
        auth_server_url: std::env::var("AUTH_SERVER_URL").unwrap(),
        app_url: std::env::var("APP_URL").unwrap(),
        static_file_root: std::env::var("STATIC_FILE_ROOT").unwrap(),
    });
}

pub fn get_onefa_config() -> &'static OnefaConfig {
    ONEFA_CONFIG.get().unwrap()
}
