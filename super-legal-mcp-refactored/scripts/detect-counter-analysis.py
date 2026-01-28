#!/usr/bin/env python3
"""
Counter-Analysis Detection Script

Purpose: Find scattered counter-analysis content throughout legal memorandum.
Identifies content that should be consolidated into dedicated Counter-Analysis subsections.

Part of hybrid workflow: Script detects locations, agent handles semantic consolidation.

Usage:
    python3 scripts/detect-counter-analysis.py <memorandum_path> [output_dir]

    If output_dir is omitted, writes to counter-analysis-locations.json in same directory

Token Impact: $0.00 (deterministic script, no LLM calls)
Speed: ~1 second for 1MB file

Output:
    counter-analysis-locations.json (or per-section files) containing:
    - Section location of counter-analysis content
    - Matched pattern type
    - Context excerpt for agent review
"""

import re
import sys
import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from collections import defaultdict


@dataclass
class CounterAnalysisLocation:
    """Represents a detected counter-analysis paragraph location."""
    section_id: str
    paragraph_index: int
    line_number: int
    pattern_matched: str
    pattern_type: str  # 'adversarial', 'bluebook_signal', 'rebuttal', 'defense'
    content_excerpt: str  # First 200 chars
    full_paragraph: str
    confidence: float  # 0.0 - 1.0
    should_move: bool  # Whether this should be moved to dedicated subsection


# ============================================
# COUNTER-ANALYSIS DETECTION PATTERNS
# ============================================

COUNTER_PATTERNS = {
    'adversarial': [
        # Direct adversarial signals
        (r'However,\s+(?:it\s+)?(?:is\s+)?worth\s+noting', 0.8),
        (r'However,\s+(?:defendants?|opposing)', 0.9),
        (r'Alternatively,', 0.7),
        (r'On\s+the\s+other\s+hand,?', 0.7),
        (r'Conversely,', 0.7),
        (r'(?:Defendants?|Opposing\s+(?:counsel|party|side))\s+(?:may|might|could|will\s+likely)\s+argue', 0.95),
        (r'(?:A|The)\s+(?:contrary|opposing|alternative)\s+(?:argument|position|view)', 0.85),
        (r'(?:One|A)\s+(?:potential|possible)\s+counter[-\s]?argument', 0.9),
    ],
    'bluebook_signal': [
        # Bluebook adverse citation signals (But see, Contra, Compare)
        (r'But\s+see\s+[A-Z]', 0.95),  # But see [Case]
        (r'Contra\s+[A-Z]', 0.95),
        (r'Compare\s+[A-Z].+\s+with\s+[A-Z]', 0.9),
        (r'See\s+also\s+[A-Z].+\s*\(noting\s+(?:contrary|alternative|opposing)', 0.85),
        (r'Cf\.\s+[A-Z]', 0.7),  # Cf. (compare) can indicate counterpoint
    ],
    'rebuttal': [
        # Rebuttal/acknowledgment signals
        (r'(?:Notwithstanding|Despite)\s+(?:this|these|the\s+foregoing)', 0.75),
        (r'While\s+(?:it\s+is\s+true|some\s+courts|there\s+(?:are|is)|the)', 0.7),
        (r'Although\s+(?:some|certain|the)\s+(?:courts?|authorities?)', 0.75),
        (r'(?:Admittedly|Granted|Concededly),?', 0.8),
        (r'(?:It\s+is|One\s+might)\s+(?:true|argue)\s+that', 0.75),
    ],
    'defense': [
        # Defense/mitigation signals
        (r'(?:A|One)\s+(?:potential|possible)\s+(?:defense|argument|counter)', 0.85),
        (r'(?:The|A)\s+(?:strongest|primary|main)\s+defense', 0.9),
        (r'(?:To\s+)?(?:rebut|counter|address)\s+(?:this|these)\s+(?:argument|claim|concern)', 0.85),
        (r'(?:In\s+)?(?:defense|response|rebuttal)', 0.8),
        (r'(?:The|A)\s+(?:company|target|acquirer)\s+(?:could|might|may)\s+argue', 0.85),
    ],
    'uncertainty': [
        # Uncertainty/hedging that may belong in counter-analysis
        (r'(?:There\s+is|Remains?)\s+(?:some|considerable)?\s*uncertainty', 0.6),
        (r'(?:The|This)\s+(?:outcome|result)\s+(?:is|remains)\s+uncertain', 0.6),
        (r'(?:Courts?\s+have\s+)?(?:split|divided|disagreed)\s+on', 0.75),
        (r'(?:The\s+)?(?:law|standard|test)\s+(?:is|remains)\s+unsettled', 0.7),
    ]
}

# Compile patterns
COMPILED_PATTERNS = {
    pattern_type: [(re.compile(pattern, re.IGNORECASE), confidence)
                   for pattern, confidence in patterns]
    for pattern_type, patterns in COUNTER_PATTERNS.items()
}

# Section header pattern
SECTION_HEADER_PATTERN = re.compile(
    r'^#{2,4}\s+(?:Section\s+)?(IV\.)?([A-Z])(?:\.(\d+))?\.?\s*(.*)$',
    re.IGNORECASE
)

# Existing counter-analysis header pattern
EXISTING_CA_HEADER = re.compile(
    r'^#{2,4}\s*(?:Counter[-\s]?Analysis|Adverse\s+Arguments?|Opposing\s+(?:Position|Arguments?))',
    re.IGNORECASE
)


def detect_counter_analysis_in_paragraph(paragraph: str, line_number: int) -> List[Tuple[str, str, float]]:
    """
    Check if a paragraph contains counter-analysis content.

    Returns: List of (pattern_type, matched_pattern, confidence) tuples
    """
    matches = []
    paragraph_stripped = paragraph.strip()

    for pattern_type, patterns in COMPILED_PATTERNS.items():
        for pattern, confidence in patterns:
            match = pattern.search(paragraph_stripped)
            if match:
                # Adjust confidence based on position (higher if at start of paragraph)
                pos_factor = 1.0 if match.start() < 50 else 0.9
                adjusted_confidence = confidence * pos_factor
                matches.append((pattern_type, pattern.pattern, adjusted_confidence))

    return matches


def should_move_to_subsection(location: CounterAnalysisLocation, has_ca_section: bool) -> bool:
    """
    Determine if counter-analysis content should be moved to a dedicated subsection.

    Criteria:
    - High confidence detection (>0.75)
    - Not already in a Counter-Analysis section
    - Pattern type is adversarial, bluebook_signal, or defense (not just uncertainty)
    """
    if has_ca_section:
        # If CA section exists, less confident about moving
        return location.confidence > 0.85 and location.pattern_type in ['adversarial', 'defense']

    # If no CA section, more aggressive about consolidation
    return (
        location.confidence > 0.7 and
        location.pattern_type in ['adversarial', 'bluebook_signal', 'defense', 'rebuttal']
    )


def parse_memorandum_sections(content: str) -> Dict[str, Dict]:
    """
    Parse memorandum into sections with their paragraphs.

    Returns:
        Dict mapping section_id to:
        - title: str
        - start_line: int
        - paragraphs: List[Dict] with line_number, content
        - has_counter_analysis_header: bool
    """
    lines = content.split('\n')
    sections = {}

    current_section = None
    current_paragraphs = []
    current_paragraph_lines = []
    para_start_line = 0
    has_ca_header = False

    for i, line in enumerate(lines):
        # Check for section header
        header_match = SECTION_HEADER_PATTERN.match(line.strip())
        ca_header_match = EXISTING_CA_HEADER.match(line.strip())

        if ca_header_match and current_section:
            has_ca_header = True

        if header_match:
            # Save previous paragraph if exists
            if current_paragraph_lines and current_section:
                current_paragraphs.append({
                    'line_number': para_start_line,
                    'content': '\n'.join(current_paragraph_lines)
                })

            # Save previous section
            if current_section:
                sections[current_section['id']] = {
                    'title': current_section['title'],
                    'start_line': current_section['start_line'],
                    'paragraphs': current_paragraphs,
                    'has_counter_analysis_header': has_ca_header
                }

            # Start new section
            section_letter = header_match.group(2).upper()
            subsection = header_match.group(3) or ""
            title = header_match.group(4).strip()
            section_id = f"IV.{section_letter}"
            if subsection:
                section_id += f".{subsection}"

            current_section = {
                'id': section_id,
                'title': title,
                'start_line': i
            }
            current_paragraphs = []
            current_paragraph_lines = []
            para_start_line = i + 1
            has_ca_header = False

        elif current_section:
            # Blank line = paragraph boundary
            if not line.strip():
                if current_paragraph_lines:
                    current_paragraphs.append({
                        'line_number': para_start_line,
                        'content': '\n'.join(current_paragraph_lines)
                    })
                    current_paragraph_lines = []
                    para_start_line = i + 1
            else:
                if not current_paragraph_lines:
                    para_start_line = i
                current_paragraph_lines.append(line)

    # Don't forget the last section and paragraph
    if current_paragraph_lines and current_section:
        current_paragraphs.append({
            'line_number': para_start_line,
            'content': '\n'.join(current_paragraph_lines)
        })

    if current_section:
        sections[current_section['id']] = {
            'title': current_section['title'],
            'start_line': current_section['start_line'],
            'paragraphs': current_paragraphs,
            'has_counter_analysis_header': has_ca_header
        }

    return sections


def detect_counter_analysis(input_path: str, output_path: Optional[str] = None) -> Dict:
    """
    Main function: Detect counter-analysis content throughout memorandum.

    Args:
        input_path: Path to input markdown file
        output_path: Path to output JSON file (optional)

    Returns:
        Dict containing detected locations organized by section
    """
    input_file = Path(input_path)
    if not input_file.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    if output_path is None:
        output_path = str(input_file.parent / "counter-analysis-locations.json")

    # Read input file
    with open(input_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Parse into sections
    sections = parse_memorandum_sections(content)

    # Detect counter-analysis in each section
    all_locations = []
    locations_by_section = defaultdict(list)

    for section_id, section_data in sections.items():
        has_ca_header = section_data['has_counter_analysis_header']

        for para_idx, para in enumerate(section_data['paragraphs']):
            matches = detect_counter_analysis_in_paragraph(para['content'], para['line_number'])

            if matches:
                # Take the highest confidence match
                best_match = max(matches, key=lambda x: x[2])
                pattern_type, pattern, confidence = best_match

                location = CounterAnalysisLocation(
                    section_id=section_id,
                    paragraph_index=para_idx,
                    line_number=para['line_number'],
                    pattern_matched=pattern,
                    pattern_type=pattern_type,
                    content_excerpt=para['content'][:200] + ('...' if len(para['content']) > 200 else ''),
                    full_paragraph=para['content'],
                    confidence=confidence,
                    should_move=False  # Will be set below
                )

                # Determine if should move
                location.should_move = should_move_to_subsection(location, has_ca_header)

                all_locations.append(asdict(location))
                locations_by_section[section_id].append(asdict(location))

    # Build result
    result = {
        'metadata': {
            'input_file': str(input_path),
            'output_file': output_path,
            'total_sections': len(sections),
            'total_detections': len(all_locations),
            'sections_with_ca_headers': sum(1 for s in sections.values() if s['has_counter_analysis_header']),
            'locations_to_move': sum(1 for loc in all_locations if loc['should_move'])
        },
        'sections_summary': {
            section_id: {
                'title': section_data['title'],
                'has_counter_analysis_header': section_data['has_counter_analysis_header'],
                'detections': len(locations_by_section.get(section_id, [])),
                'to_move': sum(1 for loc in locations_by_section.get(section_id, []) if loc['should_move'])
            }
            for section_id, section_data in sections.items()
        },
        'locations_by_section': dict(locations_by_section),
        'all_locations': all_locations,
        'high_confidence_locations': [loc for loc in all_locations if loc['confidence'] >= 0.8],
        'patterns_detected': {
            pattern_type: sum(1 for loc in all_locations if loc['pattern_type'] == pattern_type)
            for pattern_type in COUNTER_PATTERNS.keys()
        }
    }

    # Write output
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2)

    # Also write per-section files for agent convenience
    output_dir = Path(output_path).parent
    for section_id, locations in locations_by_section.items():
        if locations:
            section_file = output_dir / f"counter-analysis-locations-{section_id.replace('.', '-')}.json"
            with open(section_file, 'w', encoding='utf-8') as f:
                json.dump({
                    'section_id': section_id,
                    'section_info': result['sections_summary'][section_id],
                    'locations': locations
                }, f, indent=2)

    return result


def main():
    """CLI entry point."""
    if len(sys.argv) < 2:
        print("Usage: python3 detect-counter-analysis.py <memorandum_path> [output_path]")
        print("\nDetects scattered counter-analysis content for consolidation.")
        print("\nExample:")
        print("  python3 detect-counter-analysis.py final-memorandum.md")
        print("  python3 detect-counter-analysis.py final-memorandum.md counter-analysis-locations.json")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None

    try:
        result = detect_counter_analysis(input_path, output_path)

        print(f"\n✅ Counter-analysis detection complete")
        print(f"\nInput:  {result['metadata']['input_file']}")
        print(f"Output: {result['metadata']['output_file']}")
        print(f"\nSections analyzed: {result['metadata']['total_sections']}")
        print(f"Counter-analysis detected: {result['metadata']['total_detections']}")
        print(f"Existing CA headers: {result['metadata']['sections_with_ca_headers']}")
        print(f"Locations to consolidate: {result['metadata']['locations_to_move']}")

        print(f"\nPattern breakdown:")
        for pattern_type, count in result['patterns_detected'].items():
            if count > 0:
                print(f"  - {pattern_type}: {count}")

        if result['high_confidence_locations']:
            print(f"\nHigh-confidence detections ({len(result['high_confidence_locations'])}):")
            for loc in result['high_confidence_locations'][:5]:
                print(f"  {loc['section_id']} (line {loc['line_number']})")
                print(f"    Type: {loc['pattern_type']} | Confidence: {loc['confidence']:.0%}")
                print(f"    Move to CA section: {'YES' if loc['should_move'] else 'NO'}")
                print(f"    Excerpt: {loc['content_excerpt'][:80]}...")

        print(f"\nVerification:")
        print(f"  jq '.metadata' {result['metadata']['output_file']}")
        print(f"  jq '.high_confidence_locations | length' {result['metadata']['output_file']}")
        print(f"  ls counter-analysis-locations-IV-*.json 2>/dev/null | wc -l")

    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
