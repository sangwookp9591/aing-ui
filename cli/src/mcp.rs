use crate::{
    project,
    registry::{Registry, category},
};
use anyhow::Result;
use rmcp::{
    ServiceExt,
    handler::server::wrapper::Parameters,
    model::{CallToolResult, ContentBlock},
    schemars, tool, tool_router,
    transport::stdio,
};
use serde::Deserialize;
use serde_json::{Value, json};
use std::path::PathBuf;

#[derive(Clone)]
pub struct Aing {
    root: PathBuf,
}
#[derive(Deserialize, schemars::JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct Search {
    #[schemars(
        description = "Name, category, tag or Korean alias; case, spaces and hyphens are ignored"
    )]
    query: String,
}
#[derive(Deserialize, schemars::JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct Component {
    #[schemars(description = "Registry component name, e.g. button, dialog, select")]
    name: String,
}
#[derive(Deserialize, schemars::JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct Add {
    #[schemars(
        description = "One or more component names to install into this server's working directory"
    )]
    names: Vec<String>,
    #[serde(default)]
    #[schemars(
        description = "Preview files and npm dependencies without writing files or running package managers"
    )]
    dry_run: bool,
    #[schemars(
        description = "Optional styling; css or tailwind (Tailwind must already be installed)"
    )]
    style: Option<String>,
}
fn result(value: Result<Value>) -> CallToolResult {
    match value {
        Ok(value) => CallToolResult::success(vec![ContentBlock::text(value.to_string())]),
        Err(error) => CallToolResult::error(vec![ContentBlock::text(format!("{error:#}"))]),
    }
}
#[tool_router(server_handler)]
impl Aing {
    #[tool(
        description = "List available aing component categories and component counts. Read-only.",
        annotations(read_only_hint = true)
    )]
    fn list_categories(&self) -> CallToolResult {
        result((|| {
            let registry = Registry::for_project(&self.root)?;
            let mut groups = std::collections::BTreeMap::<String, usize>::new();
            for item in registry.items() {
                *groups
                    .entry(category(item["name"].as_str().unwrap_or("")).into())
                    .or_default() += 1;
            }
            Ok(json!(groups))
        })())
    }
    #[tool(
        description = "Find React components by name, tag, category or Korean alias. Read-only; search before installing.",
        annotations(read_only_hint = true)
    )]
    fn search_components(&self, Parameters(args): Parameters<Search>) -> CallToolResult {
        result(Registry::for_project(&self.root).and_then(|r| r.search(&args.query)))
    }
    #[tool(
        description = "Read component source code, props, variants, WebMCP tools, dependencies and measured gzip size when available. Does not install.",
        annotations(read_only_hint = true)
    )]
    fn get_component(&self, Parameters(args): Parameters<Component>) -> CallToolResult {
        result((|| {
            let registry = Registry::for_project(&self.root)?;
            let mut item = registry.get(&args.name)?;
            let name = item["name"].as_str().unwrap_or("").to_owned();
            let size: Value = serde_json::from_str(include_str!("../m1-size.json"))?;
            item["size"] = json!({"source":"M1 bundled esbuild 0.28.2 snapshot; run aing size for current measurement","rows":size.as_array().unwrap().iter().filter(|r|r["name"].as_str().is_some_and(|n|n.starts_with(&format!("{name} ")))).collect::<Vec<_>>()});
            item["props"] = item["metadata"]["props"].clone();
            item["webmcp_tools"] = item["metadata"]["tools"].clone();
            item["variants"] = variants(&registry, &name);
            Ok(item)
        })())
    }
    #[tool(
        description = "Read published styling variants and prop variant definitions for a component. Read-only.",
        annotations(read_only_hint = true)
    )]
    fn get_variants(&self, Parameters(args): Parameters<Component>) -> CallToolResult {
        result((|| {
            let r = Registry::for_project(&self.root)?;
            let item = r.get(&args.name)?;
            Ok(variants(&r, item["name"].as_str().unwrap_or("")))
        })())
    }
    #[tool(
        description = "Get a component's React usage example and import names before adding it to an application. Read-only.",
        annotations(read_only_hint = true)
    )]
    fn get_usage(&self, Parameters(args): Parameters<Component>) -> CallToolResult {
        result((|| {
            let r = Registry::for_project(&self.root)?;
            let item = r.get(&args.name)?;
            Ok(
                json!({"name":item["name"],"imports":item["metadata"]["imports"],"example":item["metadata"]["code"],"docs":item["docs"]}),
            )
        })())
    }
    #[tool(
        description = "WRITE: Install components into the server's current working directory and run its package manager to install dependencies. Requires aing init first. Existing modified files are protected. Use dry_run=true to preview without any writes or package installation.",
        annotations(
            read_only_hint = false,
            destructive_hint = false,
            idempotent_hint = true,
            open_world_hint = true
        )
    )]
    fn add_component(&self, Parameters(args): Parameters<Add>) -> CallToolResult {
        result((|| {
            anyhow::ensure!(!args.names.is_empty(), "names must not be empty");
            anyhow::ensure!(
                args.style
                    .as_deref()
                    .is_none_or(|s| ["css", "tailwind"].contains(&s)),
                "style must be css or tailwind"
            );
            project::add(
                &self.root,
                &args.names,
                args.style.as_deref(),
                args.dry_run,
                false,
            )
        })())
    }
}
fn variants(registry: &Registry, name: &str) -> Value {
    let base = name.trim_end_matches("-tailwind");
    json!({"styles":registry.items().iter().filter(|i|i["name"].as_str().is_some_and(|n|n.trim_end_matches("-tailwind")==base)).map(|i|i["name"].clone()).collect::<Vec<_>>(),"props":registry.get(name).ok().and_then(|i|i["metadata"]["props"].as_array().cloned()).unwrap_or_default()})
}
pub async fn serve(root: PathBuf) -> Result<()> {
    let server = Aing { root }.serve(stdio()).await?;
    server.waiting().await?;
    Ok(())
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn six_tools_have_schemas_and_explicit_write_hint() {
        let router = Aing::tool_router();
        let tools = router.list_all();
        assert_eq!(tools.len(), 6);
        for tool in tools {
            assert_eq!(tool.input_schema.get("type"), Some(&json!("object")));
            assert!(!tool.description.as_ref().unwrap().is_empty());
            if tool.name == "add_component" {
                assert_eq!(tool.annotations.unwrap().read_only_hint, Some(false));
                assert!(tool.input_schema["properties"].get("dry_run").is_some());
            }
        }
    }
}
