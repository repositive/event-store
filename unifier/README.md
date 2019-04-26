# Unifier

This tool is to help unify multiple event store backing databases into a single table of all events for all domains.

## Getting started

* Get [rustup](https://rustup.rs)
* Create `connections.toml` in this folder
* Add a connection like
    ```toml
    [connections.local]
    source_db_uri = "postgres://repositive:repositive@localhost:5432"
    dest_db_uri = "postgres://repositive:repositive@localhost:5432/event-store"
    domains.organisations = "organisations"
    domains.mnemosyne = "metadata"
    ```

    where `domains` is like `domains.<domain name> = <domain namespace>`
* `RUST_LOG=unifier=info cargo run --release -- --connection local `
* Run with `--release` for speedier operation
* Run with `--help` to see options
