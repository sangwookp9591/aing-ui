use anyhow::{Result, ensure};
use oxc_allocator::Allocator;
use oxc_ast::ast::*;
use oxc_ast_visit::{Visit, walk};
use oxc_parser::Parser;
use oxc_span::{SourceType, Span};
use serde_json::{Value, json};

#[derive(Default)]
struct Imports {
    sources: Vec<(Span, String)>,
}
impl Imports {
    fn push(&mut self, s: &StringLiteral<'_>) {
        if let Some(value) = s.value.as_str() {
            self.sources.push((s.span, value.to_owned()));
        }
    }
}
impl<'a> Visit<'a> for Imports {
    fn visit_import_declaration(&mut self, it: &ImportDeclaration<'a>) {
        self.push(&it.source);
    }
    fn visit_export_from_declaration(&mut self, it: &ExportFromDeclaration<'a>) {
        self.push(&it.source);
    }
    fn visit_export_all_declaration(&mut self, it: &ExportAllDeclaration<'a>) {
        self.push(&it.source);
    }
    fn visit_import_expression(&mut self, it: &ImportExpression<'a>) {
        if let Expression::StringLiteral(s) = &it.source {
            self.push(s);
        }
        walk::walk_import_expression(self, it);
    }
    fn visit_ts_external_module_reference(&mut self, it: &TSExternalModuleReference<'a>) {
        self.push(&it.expression);
    }
    fn visit_ts_import_type(&mut self, it: &TSImportType<'a>) {
        self.push(&it.source);
        walk::walk_ts_import_type(self, it);
    }
}
pub fn imports(source: &str, filename: &str) -> Result<Vec<(Span, String)>> {
    let allocator = Allocator::default();
    let parsed = Parser::new(&allocator, source, SourceType::from_path(filename)?).parse();
    ensure!(
        parsed.diagnostics.is_empty(),
        "invalid TS/JS in {filename}: {:?}",
        parsed.diagnostics
    );
    let mut visitor = Imports::default();
    visitor.visit_program(&parsed.program);
    Ok(visitor.sources)
}
pub fn rewrite(
    source: &str,
    filename: &str,
    map: impl Fn(&str) -> Option<String>,
) -> Result<String> {
    let mut edits = imports(source, filename)?;
    edits.sort_by_key(|(span, _)| std::cmp::Reverse(span.start));
    edits.dedup_by_key(|(span, _)| span.start);
    let mut output = source.to_owned();
    for (span, path) in edits {
        if let Some(value) = map(&path) {
            output.replace_range(
                span.start as usize..span.end as usize,
                &serde_json::to_string(&value)?,
            );
        }
    }
    Ok(output)
}
pub fn merge_json(target: &mut Value, source: &Value) {
    if let (Some(target), Some(source)) = (target.as_object_mut(), source.as_object()) {
        for (key, value) in source {
            if value.is_object() {
                merge_json(target.entry(key).or_insert(json!({})), value);
            } else {
                target.insert(key.clone(), value.clone());
            }
        }
    }
}
pub fn render_css(value: &Value) -> Result<String> {
    fn render(value: &Value, output: &mut String) -> Result<()> {
        for (key, value) in value
            .as_object()
            .ok_or_else(|| anyhow::anyhow!("CSS must be an object"))?
        {
            ensure!(!key.contains(['{', '}', ';', '\n']), "invalid CSS key");
            if value.is_object() {
                output.push_str(&format!("{key} {{\n"));
                render(value, output)?;
                output.push_str("}\n");
            } else {
                let value = value
                    .as_str()
                    .ok_or_else(|| anyhow::anyhow!("CSS values must be strings"))?;
                ensure!(!value.contains(['{', '}']), "invalid CSS value");
                output.push_str(&format!("{key}: {value};\n"));
            }
        }
        Ok(())
    }
    let mut result = String::new();
    render(value, &mut result)?;
    Ok(result)
}
pub fn merge_managed_css(current: &str, rules: &Value) -> Result<String> {
    const START: &str = "/* aing:start */";
    const END: &str = "/* aing:end */";
    let block = format!("{START}\n{}{END}", render_css(rules)?);
    if let Some(start) = current.find(START) {
        let end = current[start..]
            .find(END)
            .ok_or_else(|| anyhow::anyhow!("incomplete aing CSS markers"))?
            + start
            + END.len();
        Ok(format!("{}{}{}", &current[..start], block, &current[end..]))
    } else {
        Ok(format!("{current}\n{block}\n"))
    }
}
pub fn merge3(base: &str, local: &str, latest: &str) -> (String, bool) {
    match diffy::merge(base, local, latest) {
        Ok(value) => (value, false),
        Err(value) => (value, true),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn rewrite_only_imports_including_types_and_dynamic() {
        let input = "// from '@/registry/aing/ui/button'\nimport {Button} from '@/registry/aing/ui/button'; export {Button as B} from '@/registry/aing/ui/button'; const text = '@/registry/aing/ui/button'; const load = import('@/registry/aing/ui/button'); type T = import('@/registry/aing/ui/button').Button;";
        let output = rewrite(input, "test.tsx", |s| {
            s.strip_prefix("@/registry/aing/ui/")
                .map(|s| format!("../ui/{s}"))
        })
        .unwrap();
        assert_eq!(output.matches("\"../ui/button\"").count(), 4);
        assert!(output.contains("const text = '@/registry"));
        assert!(output.starts_with("// from '@/registry"));
    }
    #[test]
    fn css_merges_without_duplicate_tokens_and_preserves_local_tail() {
        let mut css = json!({"@layer aing":{":root":{"--primary":"red"}}});
        merge_json(
            &mut css,
            &json!({"@layer aing":{":root":{"--primary":"blue","--radius":"4px"}}}),
        );
        let output = merge_managed_css("/* custom */", &css).unwrap();
        assert_eq!(merge_managed_css(&output, &css).unwrap(), output);
        assert_eq!(output.matches("--primary:").count(), 1);
        assert!(output.contains("/* custom */"));
    }
    #[test]
    fn merge_retains_both_sides_and_marks_conflict() {
        let base = "a\nb\nc\nd\ne\nf\ng\n";
        let (value, conflict) = merge3(
            base,
            "LOCAL\nb\nc\nd\ne\nf\ng\n",
            "a\nb\nc\nd\ne\nf\nREMOTE\n",
        );
        assert!(!conflict);
        assert!(value.contains("LOCAL") && value.contains("REMOTE"));
        let (value, conflict) = merge3("base\n", "local\n", "remote\n");
        assert!(conflict);
        assert!(value.contains("<<<<<<<"));
    }
}
