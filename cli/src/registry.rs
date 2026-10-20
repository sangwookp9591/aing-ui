use anyhow::{Context, Result, bail, ensure};
use serde_json::{Value, json};
use std::{collections::BTreeSet, fs, path::Path, time::Duration};

pub const BUILTIN: &str = include_str!(concat!(env!("OUT_DIR"), "/registry.json"));
pub fn normalize(value: &str) -> String {
    value
        .chars()
        .filter(|c| !c.is_whitespace() && *c != '-' && *c != '_')
        .flat_map(char::to_lowercase)
        .collect()
}
pub fn strings(value: &Value) -> Vec<String> {
    value
        .as_array()
        .map(|a| {
            a.iter()
                .filter_map(Value::as_str)
                .map(str::to_owned)
                .collect()
        })
        .unwrap_or_default()
}
pub fn read_json(location: &str) -> Result<Value> {
    if location.starts_with("https://") || location.starts_with("http://") {
        let agent: ureq::Agent = ureq::Agent::config_builder()
            .timeout_global(Some(Duration::from_secs(30)))
            .build()
            .into();
        Ok(agent
            .get(location)
            .call()?
            .body_mut()
            .with_config()
            .limit(8 * 1024 * 1024)
            .read_json()?)
    } else {
        let path = location.strip_prefix("file://").unwrap_or(location);
        let text = fs::read_to_string(path).with_context(|| format!("read registry {location}"))?;
        ensure!(text.len() <= 8 * 1024 * 1024, "registry exceeds 8 MiB");
        Ok(serde_json::from_str(&text)?)
    }
}
#[derive(Clone)]
pub struct Registry {
    pub location: String,
    pub index: Value,
}
impl Registry {
    pub fn new(location: &str) -> Result<Self> {
        let location = if Path::new(location).is_dir() {
            format!("{}/registry.json", location.trim_end_matches('/'))
        } else {
            location.to_owned()
        };
        let index = if location == "embedded://aing" {
            serde_json::from_str(BUILTIN)?
        } else {
            read_json(&location)?
        };
        ensure!(
            index["items"].is_array()
                || index["components"].is_array()
                || index["files"].is_array(),
            "expected registry items, components, or a registry item"
        );
        Ok(Self { location, index })
    }
    pub fn for_project(root: &Path) -> Result<Self> {
        let config = root.join("aing.json");
        if config.exists() {
            let config: Value = serde_json::from_str(&fs::read_to_string(config)?)?;
            Self::new(config["registry"].as_str().context("missing registry")?)
        } else {
            Self::new("embedded://aing")
        }
    }
    pub fn items(&self) -> Vec<Value> {
        self.index["items"]
            .as_array()
            .or_else(|| self.index["components"].as_array())
            .cloned()
            .unwrap_or_else(|| vec![self.index.clone()])
    }
    pub fn get(&self, name: &str) -> Result<Value> {
        if name.starts_with("http://")
            || name.starts_with("https://")
            || name.starts_with("file://")
        {
            if self.location == "embedded://aing" && name.starts_with("http://localhost:3210/r/") {
                return self.get(
                    name.rsplit('/')
                        .next()
                        .unwrap_or(name)
                        .trim_end_matches(".json"),
                );
            }
            return read_json(name);
        }
        let key = normalize(name);
        let mut item = self
            .items()
            .into_iter()
            .find(|item| {
                normalize(item["name"].as_str().unwrap_or("")) == key
                    || aliases(item["name"].as_str().unwrap_or(""))
                        .iter()
                        .any(|s| normalize(s) == key)
                    || strings(&item["aliases"])
                        .iter()
                        .any(|s| normalize(s) == key)
            })
            .with_context(|| format!("unknown component: {name}"))?;
        if !item["files"].is_array()
            || item["files"]
                .as_array()
                .is_some_and(|fs| fs.iter().any(|f| !f["content"].is_string()))
        {
            let base = self
                .location
                .trim_end_matches("registry.json")
                .trim_end_matches('/');
            let url = item["url"].as_str().map(str::to_owned).unwrap_or_else(|| {
                format!("{base}/r/{}.json", item["name"].as_str().unwrap_or(name))
            });
            item = read_json(&url)?;
        }
        ensure!(
            item["name"].is_string() && item["files"].is_array(),
            "invalid registry component"
        );
        Ok(item)
    }
    pub fn resolve(&self, names: &[String], style: &str) -> Result<Vec<Value>> {
        fn visit(
            registry: &Registry,
            name: &str,
            visiting: &mut BTreeSet<String>,
            seen: &mut BTreeSet<String>,
            result: &mut Vec<Value>,
        ) -> Result<()> {
            ensure!(
                visiting.len() < 64,
                "registry dependency graph exceeds depth 64"
            );
            let item = registry.get(name)?;
            let key = item["name"].as_str().context("missing name")?.to_owned();
            if seen.contains(&key) {
                return Ok(());
            }
            ensure!(
                visiting.insert(key.clone()),
                "registry dependency cycle: {key}"
            );
            for dep in strings(&item["registryDependencies"]) {
                visit(registry, &dep, visiting, seen, result)?;
            }
            visiting.remove(&key);
            seen.insert(key);
            result.push(item);
            Ok(())
        }
        let mut result = Vec::new();
        let mut seen = BTreeSet::new();
        let mut visiting = BTreeSet::new();
        for name in names {
            let item = self.get(name)?;
            let component_name = item["name"].as_str().context("missing component name")?;
            let styled = format!("{component_name}-tailwind");
            let selected = if style == "tailwind"
                && !component_name.ends_with("-tailwind")
                && self.items().iter().any(|i| i["name"] == styled)
            {
                &styled
            } else {
                name
            };
            visit(self, selected, &mut visiting, &mut seen, &mut result)?;
        }
        Ok(result)
    }
    pub fn search(&self, query: &str) -> Result<Value> {
        let query = normalize(query);
        let mut rows = Vec::new();
        for item in self.items() {
            let name = item["name"]
                .as_str()
                .context("registry item missing name")?;
            let category = item["category"]
                .as_str()
                .or(item["metadata"]["category"].as_str())
                .unwrap_or_else(|| category(name));
            let aliases = aliases(name);
            let searchable = format!(
                "{name} {category} {} {} {} {} {} {}",
                item["title"],
                item["description"],
                item["tags"],
                item["aliases"],
                aliases.join(" "),
                json!({"tags":item["metadata"]["tags"],"aliases":item["metadata"]["aliases"],"ko":item["metadata"]["ko"]})
            );
            if query.is_empty() || normalize(&searchable).contains(&query) {
                rows.push(json!({"name":name,"title":item["title"],"description":item["description"],"category":category,"tags":item.get("tags").cloned().unwrap_or(json!([category])),"aliases":aliases}));
            }
        }
        Ok(json!(rows))
    }
}
pub fn category(name: &str) -> &'static str {
    match name.trim_end_matches("-tailwind") {
        "button" | "input" | "textarea" | "label" | "checkbox" | "radio-group" | "switch"
        | "select" | "slider" | "combobox" => "forms",
        "dialog" | "sheet" | "dropdown-menu" | "popover" | "tooltip" | "toast" | "hover-card" => {
            "overlays"
        }
        "ai-chat" | "reaction-bar" | "tool-call" | "progress-tracker" => "ai",
        _ => "display",
    }
}
pub fn aliases(name: &str) -> Vec<&'static str> {
    match name.trim_end_matches("-tailwind") {
        "button" => vec!["버튼"],
        "dialog" => vec!["대화상자", "모달"],
        "select" => vec!["선택", "셀렉트"],
        "radio-group" => vec!["라디오"],
        "input" => vec!["입력"],
        "checkbox" => vec!["체크박스"],
        "switch" => vec!["스위치"],
        "card" => vec!["카드"],
        "tabs" => vec!["탭"],
        "ai-chat" => vec!["채팅"],
        _ => vec![],
    }
}
pub fn valid_dependency(dep: &str) -> Result<()> {
    ensure!(
        !dep.is_empty()
            && !dep.starts_with('-')
            && dep
                .chars()
                .all(|c| c.is_ascii_alphanumeric() || "@/._-+^~:=*".contains(c)),
        "unsafe package dependency: {dep}"
    );
    if dep.contains(":") || dep.contains("..") {
        bail!("registry package references must be npm names with optional versions: {dep}");
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn names_ignore_case_spaces_hyphens_and_support_korean() {
        assert_eq!(normalize("Radio Group"), normalize("RADIO-GROUP"));
        let registry = Registry::new("embedded://aing").unwrap();
        assert_eq!(registry.get("BUTTON").unwrap()["name"], "button");
        assert!(
            registry
                .search("BUTTON")
                .unwrap()
                .as_array()
                .unwrap()
                .iter()
                .all(|i| i["name"].as_str().unwrap().starts_with("button"))
        );
        assert_eq!(registry.get("버튼").unwrap()["name"], "button");
        assert!(
            registry
                .search("버튼")
                .unwrap()
                .as_array()
                .unwrap()
                .iter()
                .any(|v| v["name"] == "button")
        );
    }
    #[test]
    fn dependency_cycles_fail_instead_of_looping() {
        let registry = Registry {
            location: "embedded://aing".into(),
            index: json!({"items":[{"name":"a","files":[],"registryDependencies":["b"]},{"name":"b","files":[],"registryDependencies":["a"]}]}),
        };
        assert!(
            registry
                .resolve(&["a".into()], "css")
                .unwrap_err()
                .to_string()
                .contains("cycle")
        );
    }
    #[test]
    fn dependencies_cannot_be_package_manager_options_or_urls() {
        for input in [
            "--ignore-scripts",
            "https://evil.invalid/pkg",
            "file:../pkg",
        ] {
            assert!(valid_dependency(input).is_err());
        }
        valid_dependency("@aing/core@0.1.0").unwrap();
    }
}
