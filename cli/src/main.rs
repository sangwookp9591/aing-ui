mod mcp;
mod project;
mod registry;
mod transform;
use anyhow::{Result, bail};
use clap::{Parser, Subcommand};
use std::path::PathBuf;

#[derive(Parser)]
#[command(
    version,
    about = "Install React components you own; connect agents with aing mcp"
)]
struct Cli {
    #[arg(long, global = true, default_value = ".")]
    cwd: PathBuf,
    #[command(subcommand)]
    command: Command,
}
#[derive(Subcommand)]
enum Command {
    Init {
        #[arg(long)]
        registry: Option<String>,
        #[arg(long, value_parser=["css", "tailwind"])]
        style: Option<String>,
    },
    Add {
        #[arg(required = true)]
        names: Vec<String>,
        #[arg(long,value_parser=["css", "tailwind"])]
        style: Option<String>,
        #[arg(long)]
        dry_run: bool,
        #[arg(long)]
        overwrite: bool,
    },
    List,
    Search {
        query: String,
    },
    Diff {
        name: String,
    },
    Sync,
    Size {
        #[arg(long)]
        budget: bool,
    },
    Check,
    Mcp,
}
#[tokio::main]
async fn main() {
    if let Err(error) = run().await {
        eprintln!("aing: {error:#}");
        std::process::exit(1);
    }
}
async fn run() -> Result<()> {
    let cli = Cli::parse();
    let root = cli.cwd.canonicalize()?;
    if matches!(cli.command, Command::Mcp) {
        return mcp::serve(root).await;
    }
    let value = match cli.command {
        Command::Init { registry, style } => project::init(&root, registry, style)?,
        Command::Add {
            names,
            style,
            dry_run,
            overwrite,
        } => project::add(&root, &names, style.as_deref(), dry_run, overwrite)?,
        Command::List => registry::Registry::for_project(&root)?.search("")?,
        Command::Search { query } => registry::Registry::for_project(&root)?.search(&query)?,
        Command::Diff { name } => project::diff(&root, &name)?,
        Command::Sync => project::sync(&root)?,
        Command::Check => project::check(&root)?,
        Command::Size { budget } => {
            let status = std::process::Command::new("node")
                .args(["-e", include_str!("../size.cjs")])
                .env("AING_SIZE_BUDGET", if budget { "1" } else { "0" })
                .current_dir(root)
                .status()?;
            if !status.success() {
                bail!("size measurement failed ({status})");
            }
            return Ok(());
        }
        Command::Mcp => unreachable!(),
    };
    println!("{}", serde_json::to_string_pretty(&value)?);
    if value
        .get("conflicts")
        .and_then(|v| v.as_array())
        .is_some_and(|v| !v.is_empty())
    {
        bail!("merge conflicts require resolution");
    }
    Ok(())
}
