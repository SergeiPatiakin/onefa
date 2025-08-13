// Code related to the main entry point
use std::error::Error;
use std::fmt::Debug;
use std::net::SocketAddr;

use http_body_util::Full;
use hyper::body::Bytes;
use hyper::server::conn::http1;
use hyper::service::service_fn;
use hyper::{Method, Response, StatusCode};
use hyper_util::rt::TokioIo;
use lazy_static::lazy_static;
use regex::Regex;
use serde::{Deserialize, Serialize};
use tokio::fs::File;
use tokio::io::AsyncReadExt;
use tokio::net::TcpListener;

use crate::api::{
    handle_create_totp_key, handle_delete_totp_key, handle_read_totp_keys, handle_update_totp_key,
};
use crate::config::{get_onefa_config, set_onefa_config};
use crate::db::ensure_database_migrated;
use crate::error::{OnefaError, to_generic_error};
use crate::hyper_utils::{HyperRequest, HyperResponse};

mod api;
mod auth;
mod config;
mod db;
mod error;
mod hyper_utils;

lazy_static! {
    static ref ASSET_REGEX: Regex =
        Regex::new(r"^/assets/([A-Za-z0-9\-_]+)\.([A-Za-z0-9\-_]+)$").unwrap();
}

async fn serve_onefa_request(request: HyperRequest) -> Result<HyperResponse, OnefaError> {
    let method = request.method();
    let method_str = method.to_string();
    let path = request.uri().path();
    let path_and_query = request
        .uri()
        .path_and_query()
        .map(|pq| pq.to_string())
        .ok_or("No path_and_query")
        .map_err(to_generic_error)?;

    let response = if method == Method::GET && path == "/assets/fe-env.js" {
        send_fe_env_script().await
    } else if method == Method::GET
        && let Some(asset_path) = ASSET_REGEX.captures(path)
    {
        send_static_file(
            &format!("assets/{}.{}", &asset_path[1], &asset_path[2]),
            match &asset_path[2] {
                "js" => Some("text/javascript"),
                "css" => Some("text/css"),
                "svg" => Some("image/svg+xml"),
                _ => None,
            },
        )
        .await
    } else if let Some(remainder) = path.strip_prefix("/api/") {
        if method == Method::POST && remainder == "read-totp-keys" {
            handle_read_totp_keys(request).await
        } else if method == Method::POST && remainder == "update-totp-key" {
            handle_update_totp_key(request).await
        } else if method == Method::POST && remainder == "create-totp-key" {
            handle_create_totp_key(request).await
        } else if method == Method::POST && remainder == "delete-totp-key" {
            handle_delete_totp_key(request).await
        } else {
            Err(OnefaError::NotFound)
        }
    } else if method == Method::GET {
        send_static_file("index.html", Some("text/html")).await
    } else {
        Err(OnefaError::NotFound)
    };
    match response {
        Ok(x) => {
            println!("{} {} {}", method_str, x.status().as_u16(), path_and_query);
            Ok(x)
        }
        Err(e @ OnefaError::Unauthorized) | Err(e @ OnefaError::NotFound) => {
            let x = e.to_response();
            println!("{} {} {}", method_str, x.status().as_u16(), path_and_query);
            Ok(x)
        }
        Err(e) => {
            let x = e.to_response();
            println!(
                "{} {} {}: {}",
                method_str,
                x.status().as_u16(),
                path_and_query,
                e
            );
            Ok(x)
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct TokenEndpointResponse {
    access_token: String,
    refresh_token: String,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    set_onefa_config();
    ensure_database_migrated().await?;
    let listener = TcpListener::bind(addr).await?;
    println!("Listening: {addr}");

    // Start a loop to continuously accept incoming connections
    loop {
        let (stream, _) = listener.accept().await?;
        let io = TokioIo::new(stream);
        tokio::task::spawn(async move {
            if let Err(err) = http1::Builder::new()
                .serve_connection(io, service_fn(serve_onefa_request))
                .await
            {
                let err_string = match err.source() {
                    Some(e) => format!("Connection service error: {e}"),
                    None => format!("Connection serving error: {err:?}"),
                };
                println!("{err_string}");
            }
        });
    }
}

async fn send_fe_env_script() -> Result<HyperResponse, OnefaError> {
    let config = get_onefa_config();
    let script = format!(
        "
        window.FE_ENV = {{
            AUTH_SERVER_URL: '{}',
            APP_URL: '{}',
        }};
    ",
        config.auth_server_url, config.app_url,
    );
    let response = Response::builder()
        .status(StatusCode::OK)
        .header("Content-Type", "text/javascript")
        .body(Full::new(Bytes::from(script)))
        .map_err(to_generic_error)?;
    Ok(response)
}

// Caller must verify that static_relative_path for path traversal attacks
async fn send_static_file(
    static_relative_path: &str,
    mime_type: Option<&str>,
) -> Result<HyperResponse, OnefaError> {
    // Open file for reading
    let file_path = format!(
        "{}/{static_relative_path}",
        get_onefa_config().static_file_root
    );
    let mut file = File::open(file_path)
        .await
        .map_err(|e| OnefaError::Generic(e.to_string()))?;
    let mut buf: Vec<u8> = vec![];
    file.read_to_end(&mut buf).await.map_err(to_generic_error)?;

    // Send response
    let response = Response::builder()
        .status(StatusCode::OK)
        .header(
            "Content-Type",
            mime_type.unwrap_or("application/octet-stream"),
        )
        .body(Full::new(Bytes::from(buf)))
        .map_err(to_generic_error)?;

    Ok(response)
}
