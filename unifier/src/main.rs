#[macro_use]
extern crate log;

mod event;

use crate::event::EventData;
use event::Event;
use postgres::{Connection, TlsMode};
use uuid::Uuid;

fn dump_domain_events(domain: &str, namespace: &str) -> Result<Vec<Event>, String> {
    let conn = Connection::connect(
        format!(
            "postgresql://repositive:repositive@localhost:5432/{}",
            domain
        ),
        TlsMode::None,
    )
    .map_err(|e| e.to_string())?;

    // NOTE: This query reformats dates to be RFC3339 compatible
    conn.query(
        r#"select
            id,
            data,
            context || jsonb_build_object('time', to_timestamp(context->>'time', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')) as context
        from events where data->>'event_namespace' = $1 order by context->>'time' asc"#,
        &[&namespace],
    )
    .map_err(|e| e.to_string())
    .map(|result| {
        info!("Found {} events for namespace {} in domain {}", result.len(), namespace, domain);

        result.iter().map(|row| {
            let id: Uuid = row.get(0);
            let data: serde_json::Value = row.get(1);
            let context: serde_json::Value = row.get(2);

            Event {
                id,
                data: serde_json::from_value(data).expect(&format!("Failed to parse event data for event ID {}", id)),
                context: serde_json::from_value(context).expect(&format!("Failed to parse event context for event ID {}", id)),
            }
        }).collect()
    })
}

fn main() -> Result<(), String> {
    pretty_env_logger::init();

    let events = dump_domain_events("analysis", "analysis")?;
    println!("{:?}", events);

    Ok(())
}
