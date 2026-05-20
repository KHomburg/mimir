mod commands;

use serde::Serialize;
use std::{thread, time::Duration};
use tauri::{Emitter, Manager};
use tauri_plugin_sql::{Migration, MigrationKind};

fn message_migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "create_messages_table",
            sql: r#"
              CREATE TABLE IF NOT EXISTS messages (
                id           TEXT    PRIMARY KEY,
                provider_id  TEXT    NOT NULL,
                platform     TEXT    NOT NULL,
                title        TEXT    NOT NULL,
                body         TEXT    NOT NULL,
                preview      TEXT,
                timestamp    TEXT    NOT NULL,
                thread_id    TEXT    NOT NULL,
                person_id    TEXT,
                person_label TEXT    NOT NULL,
                read         INTEGER NOT NULL DEFAULT 0
              );
            "#,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "add_direction_column",
            sql: r#"
              ALTER TABLE messages
              ADD COLUMN direction TEXT NOT NULL DEFAULT 'incoming';
            "#,
            kind: MigrationKind::Up,
        },
    ]
}

#[derive(Clone, Serialize)]
struct PollTickPayload {
    source: &'static str,
}

fn spawn_background_poller(app_handle: tauri::AppHandle) {
    thread::spawn(move || loop {
        thread::sleep(Duration::from_secs(10));
        let _ = app_handle.emit(
            "mimir://poll-tick",
            PollTickPayload {
                source: "rust-background-poller",
            },
        );
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_deep_link::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:mimir.db", message_migrations())
                .build(),
        )
        .setup(|app| {
            let salt_path = app
                .path()
                .app_local_data_dir()
                .expect("failed to resolve app local data directory")
                .join("stronghold-salt.txt");

            app.handle()
                .plugin(tauri_plugin_stronghold::Builder::with_argon2(&salt_path).build())?;

            spawn_background_poller(app.handle().clone());

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::health_check,
            commands::store_oauth_callback
        ])
        .run(tauri::generate_context!())
        .expect("error while running mimir")
}

fn main() {
    run()
}
