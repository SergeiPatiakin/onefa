// Code related to the database
use tokio_postgres::{Client, NoTls};

use crate::{config::get_onefa_config, error::OnefaError};

pub async fn ensure_database_migrated() -> Result<(), OnefaError> {
    let mut client = prepare_postgres_client().await?;
    let tx = client.transaction().await?;
    match tx
        .query(
            "select 1 from information_schema.tables where table_schema='public' and table_name='migrations'",
            &[],
        )
        .await {
            Err(e) => Err(OnefaError::Postgres(e)),
            Ok(info_schema_rows) => {
                if info_schema_rows.is_empty() {
                    println!("Migrations table does not exist. Executing migration 1");
                    tx.batch_execute(include_str!("migrations/001.sql")).await?;
                    tx.batch_execute("insert into migrations(id, name) values (1, 'init')").await?;
                }

                let migration_ids: Vec<i64> = tx.query(
                    "select id from migrations order by id for update",
                    &[],
                ).await?.into_iter().map(|row| row.get::<usize, i64>(0)).collect();

                match migration_ids.last() {
                    None => {
                        return Err(OnefaError::Generic("Migration table exists but is empty. Cannot recover".into()));
                    }
                    Some(last_migration_id) => {
                        if *last_migration_id == 1 {
                            // Up to date, nothing to do
                        } else if *last_migration_id > 1 {
                            return Err(OnefaError::Generic(format!("DB contains unknown migration {last_migration_id}. Perhaps the DB is from a newer version of the app?")));
                        }
                    }
                }
                tx.commit().await?;
                Ok(())
            },
        }
}

pub async fn prepare_postgres_client() -> Result<Client, OnefaError> {
    // Connect to the database.
    let (client, connection) =
        tokio_postgres::connect(&get_onefa_config().database_url, NoTls).await?;

    // The connection object performs the actual communication with the database,
    // so spawn it off to run on its own.
    tokio::spawn(async move {
        if let Err(e) = connection.await {
            println!("Postgres connection error: {e}");
        }
    });

    Ok(client)
}
