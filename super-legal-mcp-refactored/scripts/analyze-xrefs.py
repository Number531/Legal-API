#!/usr/bin/env python3
"""
Cross-Reference Matrix Analysis Script

Purpose: Build bidirectional cross-reference graph from document structure.
Identifies orphaned HIGH findings that lack connections to other sections.
Computes transitive closure to detect missing multi-hop dependencies.

Part of hybrid workflow: Script builds graph, agent handles semantic insertion.

Usage:
    python3 scripts/analyze-xrefs.py <memorandum_path> [output_path]

    If output_path is omitted, writes to xref-matrix.json in same directory

Token Impact: $0.00 (deterministic script, no LLM calls)
Speed: ~1 second for 1MB file

Output:
    xref-matrix.json containing:
    - graph: section -> forward_refs, back_refs, topic_connections
    - transitive_closure: section -> all reachable sections (direct + transitive)
    - orphaned_findings: HIGH severity findings with no cross-refs
    - missing_transitive: sections with 3+ implications missing explicit transitive refs
    - connection_suggestions: recommended cross-references to add

Enhancement (2026-01-25): Added transitive closure analysis to address QA finding
"multi-implication tracing: 1/2 points". Now detects when A→B and B→C exist
but A→C is missing for HIGH severity findings with 3+ total implications.
"""

import re
import sys
import json
from pathlib import Path
from typing import Dict, List, Set, Optional, Tuple
from dataclasses import dataclass, asdict
from collections import defaultdict


@dataclass
class Finding:
    """Represents a legal finding in the memorandum."""
    section_id: str  # e.g., "IV.A", "IV.B.1"
    title: str
    severity: str  # HIGH, MEDIUM, LOW
    start_line: int
    topic_keywords: List[str]
    entities: List[str]  # Company names, statutes, etc.
    existing_refs: List[str]  # Sections already referenced


@dataclass
class CrossRefSuggestion:
    """Suggested cross-reference to add."""
    source_section: str
    target_section: str
    reason: str
    confidence: float


# ============================================
# PATTERN DEFINITIONS
# ============================================

# Section header patterns
SECTION_HEADER_PATTERN = re.compile(
    r'^#{2,4}\s+(?:Section\s+)?(IV\.)?([A-Z])(?:\.(\d+))?\.?\s*(.*)$',
    re.IGNORECASE
)

# Existing cross-reference patterns
EXISTING_XREF_PATTERN = re.compile(
    r'[Ss]ee\s+[Ss]ection\s+(IV\.)?([A-Z](?:\.\d+)?)',
    re.IGNORECASE
)

# Severity markers
SEVERITY_PATTERNS = {
    'HIGH': [
        re.compile(r'\*\*(?:HIGH|CRITICAL)\*\*', re.IGNORECASE),
        re.compile(r'(?:deal[- ]blocking|material\s+risk)', re.IGNORECASE),
        re.compile(r'severity[:\s]+(?:HIGH|CRITICAL)', re.IGNORECASE),
    ],
    'MEDIUM': [
        re.compile(r'\*\*MEDIUM\*\*', re.IGNORECASE),
        re.compile(r'severity[:\s]+MEDIUM', re.IGNORECASE),
    ],
    'LOW': [
        re.compile(r'\*\*LOW\*\*', re.IGNORECASE),
        re.compile(r'severity[:\s]+LOW', re.IGNORECASE),
    ]
}

# Entity extraction patterns
ENTITY_PATTERNS = {
    'company': re.compile(r'\b(?:Liberty\s+Life|Target|Company|Acquirer)\b', re.IGNORECASE),
    'statute': re.compile(r'\b(?:\d+\s+U\.S\.C\.?\s*§?\s*\d+|Section\s+\d+(?:\([a-z]\))?)\b'),
    'regulation': re.compile(r'\b(?:Rule\s+\d+[a-z]?-\d+|Regulation\s+[A-Z])\b'),
    'agency': re.compile(r'\b(?:SEC|EPA|FTC|DOJ|CFIUS|FDA|FERC|OSHA)\b'),
}

# Topic keyword patterns (for detecting related sections)
TOPIC_KEYWORDS = {
    'environmental': ['environmental', 'EPA', 'contamination', 'pollution', 'CERCLA', 'hazardous'],
    'securities': ['securities', 'SEC', 'disclosure', '10-K', 'proxy', 'insider'],
    'antitrust': ['antitrust', 'merger', 'HSR', 'competition', 'market share', 'FTC', 'DOJ'],
    'tax': ['tax', 'IRS', 'deferred', 'liability', 'NOL', 'transfer pricing'],
    'labor': ['labor', 'employment', 'ERISA', 'pension', 'benefits', 'union', 'WARN'],
    'ip': ['patent', 'trademark', 'copyright', 'intellectual property', 'trade secret'],
    'regulatory': ['regulatory', 'compliance', 'license', 'permit', 'approval'],
    'cfius': ['CFIUS', 'national security', 'foreign investment', 'FIRRMA'],
    'insurance': ['insurance', 'coverage', 'policy', 'premium', 'actuarial'],
    'contract': ['contract', 'agreement', 'covenant', 'representation', 'warranty'],
    'litigation': ['litigation', 'lawsuit', 'claim', 'dispute', 'settlement'],
}


def extract_severity(content: str) -> str:
    """Extract severity level from section content."""
    for severity, patterns in SEVERITY_PATTERNS.items():
        for pattern in patterns:
            if pattern.search(content):
                return severity
    return 'MEDIUM'  # Default if not explicitly marked


def extract_entities(content: str) -> List[str]:
    """Extract named entities from section content."""
    entities = []
    for entity_type, pattern in ENTITY_PATTERNS.items():
        matches = pattern.findall(content)
        entities.extend(matches)
    return list(set(entities))


def extract_topic_keywords(content: str) -> List[str]:
    """Identify topic keywords in section content."""
    content_lower = content.lower()
    topics = []
    for topic, keywords in TOPIC_KEYWORDS.items():
        if any(kw.lower() in content_lower for kw in keywords):
            topics.append(topic)
    return topics


def extract_existing_refs(content: str) -> List[str]:
    """Find existing cross-references in content."""
    refs = []
    for match in EXISTING_XREF_PATTERN.finditer(content):
        section_letter = match.group(2)
        if match.group(1):  # Has "IV." prefix
            refs.append(f"IV.{section_letter}")
        else:
            refs.append(f"IV.{section_letter}")
    return list(set(refs))


def parse_memorandum(content: str) -> Tuple[List[Finding], Dict]:
    """
    Parse memorandum to extract all findings and their metadata.

    Returns:
        findings: List of Finding objects
        section_content: Dict mapping section_id to content text
    """
    lines = content.split('\n')
    findings = []
    section_content = {}

    current_finding = None
    current_lines = []

    for i, line in enumerate(lines):
        match = SECTION_HEADER_PATTERN.match(line.strip())
        if match:
            # Save previous finding
            if current_finding and current_lines:
                content_text = '\n'.join(current_lines)
                current_finding.severity = extract_severity(content_text)
                current_finding.topic_keywords = extract_topic_keywords(content_text)
                current_finding.entities = extract_entities(content_text)
                current_finding.existing_refs = extract_existing_refs(content_text)
                section_content[current_finding.section_id] = content_text
                findings.append(current_finding)
                current_lines = []

            # Start new finding
            section_letter = match.group(2).upper()
            subsection = match.group(3) or ""
            title = match.group(4).strip()
            section_id = f"IV.{section_letter}"
            if subsection:
                section_id += f".{subsection}"

            current_finding = Finding(
                section_id=section_id,
                title=title,
                severity='MEDIUM',
                start_line=i,
                topic_keywords=[],
                entities=[],
                existing_refs=[]
            )
        elif current_finding:
            current_lines.append(line)

    # Don't forget the last finding
    if current_finding and current_lines:
        content_text = '\n'.join(current_lines)
        current_finding.severity = extract_severity(content_text)
        current_finding.topic_keywords = extract_topic_keywords(content_text)
        current_finding.entities = extract_entities(content_text)
        current_finding.existing_refs = extract_existing_refs(content_text)
        section_content[current_finding.section_id] = content_text
        findings.append(current_finding)

    return findings, section_content


def build_dependency_graph(findings: List[Finding]) -> Dict:
    """
    Build bidirectional cross-reference graph based on:
    - Shared entity references (company names, statutes)
    - Topic/keyword overlaps (regulatory domain)
    - Severity escalation chains
    """
    graph = defaultdict(lambda: {'forward_refs': [], 'back_refs': [], 'topic_connections': []})

    # Add existing explicit cross-references
    for finding in findings:
        for ref in finding.existing_refs:
            if ref != finding.section_id:
                graph[finding.section_id]['forward_refs'].append(ref)
                graph[ref]['back_refs'].append(finding.section_id)

    # Find implicit connections via shared entities
    for i, f1 in enumerate(findings):
        for f2 in findings[i+1:]:
            # Shared entities
            shared_entities = set(f1.entities) & set(f2.entities)
            if shared_entities:
                connection = {
                    'section': f2.section_id,
                    'reason': f'Shared entities: {", ".join(shared_entities)}',
                    'type': 'entity'
                }
                if connection not in graph[f1.section_id]['topic_connections']:
                    graph[f1.section_id]['topic_connections'].append(connection)

            # Shared topics
            shared_topics = set(f1.topic_keywords) & set(f2.topic_keywords)
            if shared_topics:
                connection = {
                    'section': f2.section_id,
                    'reason': f'Related topics: {", ".join(shared_topics)}',
                    'type': 'topic'
                }
                if connection not in graph[f1.section_id]['topic_connections']:
                    graph[f1.section_id]['topic_connections'].append(connection)

    return dict(graph)


def compute_transitive_closure(graph: Dict) -> Dict[str, Set[str]]:
    """
    Compute transitive closure of cross-reference graph.

    If A→B and B→C, then A can transitively reach C.
    Used to detect missing multi-hop dependencies.

    Returns:
        Dict mapping section_id to set of all reachable sections (direct + transitive)
    """
    # Initialize with direct forward references
    closure = {}
    for section, data in graph.items():
        closure[section] = set(data.get('forward_refs', []))

    # Floyd-Warshall style iteration until no changes
    changed = True
    iterations = 0
    max_iterations = 20  # Prevent infinite loops on malformed graphs

    while changed and iterations < max_iterations:
        changed = False
        iterations += 1

        for section in closure:
            current_reachable = closure[section].copy()
            for target in current_reachable:
                if target in closure:
                    # Add targets that are reachable from our direct targets
                    new_reachable = closure[target] - closure[section] - {section}
                    if new_reachable:
                        closure[section].update(new_reachable)
                        changed = True

    return closure


def identify_missing_transitive(
    graph: Dict,
    closure: Dict[str, Set[str]],
    findings: List[Finding]
) -> List[Dict]:
    """
    Find sections where transitive dependencies exist but aren't explicitly referenced.

    Focus on HIGH severity findings with 3+ total implications where some
    implications are only reachable transitively (not directly referenced).

    This addresses the QA finding: "multi-implication tracing: 1/2 points"

    Args:
        graph: Direct dependency graph from build_dependency_graph()
        closure: Transitive closure from compute_transitive_closure()
        findings: List of Finding objects for severity lookup

    Returns:
        List of sections with missing transitive references
    """
    # Build severity lookup
    severity_map = {f.section_id: f.severity for f in findings}

    missing = []

    for section, all_reachable in closure.items():
        direct_refs = set(graph.get(section, {}).get('forward_refs', []))
        transitive_only = all_reachable - direct_refs

        # Only flag if:
        # 1. Section has 3+ total implications (direct + transitive)
        # 2. Some implications are transitive-only (not explicitly referenced)
        # 3. Section is HIGH severity (prioritize important findings)
        section_severity = severity_map.get(section, 'MEDIUM')

        if len(all_reachable) >= 3 and transitive_only and section_severity == 'HIGH':
            # Sort transitive refs by their severity (HIGH first)
            sorted_transitive = sorted(
                transitive_only,
                key=lambda s: 0 if severity_map.get(s) == 'HIGH' else 1
            )

            missing.append({
                'section': section,
                'severity': section_severity,
                'direct_refs': list(direct_refs),
                'direct_count': len(direct_refs),
                'transitive_refs': sorted_transitive,
                'transitive_count': len(transitive_only),
                'total_implications': len(all_reachable),
                'recommendation': f'Consider adding explicit cross-reference to {", ".join(sorted_transitive[:3])} for complete dependency tracing'
            })

    # Sort by total implications (highest first)
    missing.sort(key=lambda x: x['total_implications'], reverse=True)

    return missing


def identify_orphaned_findings(findings: List[Finding], graph: Dict) -> List[Dict]:
    """
    Identify HIGH severity findings that have no cross-references.

    Orphaned = no forward_refs AND no back_refs AND severity HIGH
    These are the findings that most need cross-reference insertion.
    """
    orphaned = []

    for finding in findings:
        section_id = finding.section_id
        refs = graph.get(section_id, {'forward_refs': [], 'back_refs': []})

        # Check if truly orphaned
        has_forward = len(refs['forward_refs']) > 0
        has_back = len(refs['back_refs']) > 0
        has_topic_connections = len(refs.get('topic_connections', [])) > 0

        if not has_forward and not has_back and finding.severity == 'HIGH':
            orphan_entry = {
                'section_id': section_id,
                'title': finding.title,
                'severity': finding.severity,
                'topic_keywords': finding.topic_keywords,
                'entities': finding.entities,
                'potential_connections': refs.get('topic_connections', [])
            }
            orphaned.append(orphan_entry)

    return orphaned


def generate_connection_suggestions(findings: List[Finding], orphaned: List[Dict]) -> List[Dict]:
    """
    Generate specific cross-reference suggestions for orphaned findings.

    Strategy:
    1. Look at topic_connections in graph
    2. Match orphaned findings to sections with similar topics/entities
    3. Prioritize HIGH->HIGH connections
    """
    suggestions = []

    # Build lookup maps
    section_by_id = {f.section_id: f for f in findings}
    sections_by_topic = defaultdict(list)
    for finding in findings:
        for topic in finding.topic_keywords:
            sections_by_topic[topic].append(finding.section_id)

    for orphan in orphaned:
        section_id = orphan['section_id']

        # Find related sections via topics
        for topic in orphan['topic_keywords']:
            related_sections = sections_by_topic.get(topic, [])
            for related_id in related_sections:
                if related_id != section_id:
                    related_finding = section_by_id.get(related_id)
                    if related_finding:
                        # Higher confidence for HIGH-HIGH connections
                        confidence = 0.8 if related_finding.severity == 'HIGH' else 0.6

                        suggestion = {
                            'source_section': section_id,
                            'target_section': related_id,
                            'reason': f'Shared topic: {topic}',
                            'confidence': confidence,
                            'source_title': orphan['title'],
                            'target_title': related_finding.title
                        }

                        # Avoid duplicates
                        if suggestion not in suggestions:
                            suggestions.append(suggestion)

        # Also suggest based on potential_connections from graph
        for conn in orphan.get('potential_connections', []):
            target_id = conn['section']
            if target_id != section_id:
                target_finding = section_by_id.get(target_id)
                suggestion = {
                    'source_section': section_id,
                    'target_section': target_id,
                    'reason': conn['reason'],
                    'confidence': 0.7,
                    'source_title': orphan['title'],
                    'target_title': target_finding.title if target_finding else 'Unknown'
                }
                if suggestion not in suggestions:
                    suggestions.append(suggestion)

    # Sort by confidence (highest first)
    suggestions.sort(key=lambda x: x['confidence'], reverse=True)

    return suggestions


def analyze_xrefs(input_path: str, output_path: Optional[str] = None) -> Dict:
    """
    Main function: Analyze cross-reference structure of a legal memorandum.

    Args:
        input_path: Path to input markdown file
        output_path: Path to output JSON file (optional)

    Returns:
        Dict containing graph, orphaned_findings, and suggestions
    """
    input_file = Path(input_path)
    if not input_file.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    if output_path is None:
        output_path = str(input_file.parent / "xref-matrix.json")

    # Read input file
    with open(input_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Parse memorandum
    findings, section_content = parse_memorandum(content)

    # Build dependency graph
    graph = build_dependency_graph(findings)

    # Compute transitive closure for multi-hop dependency analysis
    closure = compute_transitive_closure(graph)

    # Identify orphaned findings (no direct cross-refs)
    orphaned = identify_orphaned_findings(findings, graph)

    # Identify missing transitive references (has direct refs but missing multi-hop)
    missing_transitive = identify_missing_transitive(graph, closure, findings)

    # Generate suggestions for orphaned findings
    suggestions = generate_connection_suggestions(findings, orphaned)

    # Build result
    result = {
        'metadata': {
            'input_file': str(input_path),
            'output_file': output_path,
            'total_findings': len(findings),
            'orphaned_count': len(orphaned),
            'missing_transitive_count': len(missing_transitive),
            'suggestion_count': len(suggestions)
        },
        'graph': graph,
        'transitive_closure': {k: list(v) for k, v in closure.items()},
        'orphaned_findings': orphaned,
        'missing_transitive': missing_transitive,
        'connection_suggestions': suggestions,
        'findings_summary': [
            {
                'section_id': f.section_id,
                'title': f.title,
                'severity': f.severity,
                'topics': f.topic_keywords,
                'existing_refs': f.existing_refs,
                'ref_count': len(f.existing_refs)
            }
            for f in findings
        ]
    }

    # Write output
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2)

    return result


def main():
    """CLI entry point."""
    if len(sys.argv) < 2:
        print("Usage: python3 analyze-xrefs.py <memorandum_path> [output_path]")
        print("\nBuilds cross-reference dependency graph from legal memorandum.")
        print("\nExample:")
        print("  python3 analyze-xrefs.py final-memorandum.md")
        print("  python3 analyze-xrefs.py final-memorandum.md xref-matrix.json")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None

    try:
        result = analyze_xrefs(input_path, output_path)

        print(f"\n✅ Cross-reference analysis complete")
        print(f"\nInput:  {result['metadata']['input_file']}")
        print(f"Output: {result['metadata']['output_file']}")
        print(f"\nFindings analyzed: {result['metadata']['total_findings']}")
        print(f"Orphaned HIGH findings: {result['metadata']['orphaned_count']}")
        print(f"Missing transitive refs: {result['metadata']['missing_transitive_count']}")
        print(f"Connection suggestions: {result['metadata']['suggestion_count']}")

        if result['orphaned_findings']:
            print(f"\nOrphaned findings requiring cross-references:")
            for orphan in result['orphaned_findings']:
                print(f"  - {orphan['section_id']}: {orphan['title']}")
                print(f"    Topics: {', '.join(orphan['topic_keywords']) or 'none detected'}")

        if result.get('missing_transitive'):
            print(f"\nMissing transitive dependencies (multi-implication tracing):")
            for mt in result['missing_transitive'][:5]:
                print(f"  - {mt['section']} ({mt['severity']})")
                print(f"    Direct: {mt['direct_count']} refs → Transitive: {mt['transitive_count']} additional")
                print(f"    Missing: {', '.join(mt['transitive_refs'][:3])}")

        if result['connection_suggestions'][:5]:
            print(f"\nTop 5 suggested cross-references:")
            for sugg in result['connection_suggestions'][:5]:
                print(f"  {sugg['source_section']} -> {sugg['target_section']}")
                print(f"    Reason: {sugg['reason']} (confidence: {sugg['confidence']:.0%})")

        print(f"\nVerification:")
        print(f"  jq '.orphaned_findings | length' {result['metadata']['output_file']}")
        print(f"  jq '.missing_transitive | length' {result['metadata']['output_file']}")
        print(f"  jq '.connection_suggestions[:5]' {result['metadata']['output_file']}")

    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
