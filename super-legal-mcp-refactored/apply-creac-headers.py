#!/usr/bin/env python3
"""
apply-creac-headers.py - Insert CREAC structural headers into legal memorandum

Inserts CREAC (Conclusion, Rule, Explanation, Application, Counter-Analysis)
structural headers into sections IV.A through IV.L of final-memorandum.md.

Usage:
    python3 apply-creac-headers.py <input_file> <output_file> [--min-headers N]

Exit Codes:
    0 - Success (≥50 headers inserted)
    1 - Failure (insufficient headers inserted or error)
"""

import re
import sys
import argparse
from typing import List, Tuple, Dict

class CREACHeaderInserter:
    """Inserts CREAC structural headers into legal memorandum sections."""

    def __init__(self, min_total_headers: int = 50):
        self.min_total_headers = min_total_headers
        self.headers_inserted = {}

        # Section patterns to identify IV.A through IV.L boundaries
        self.section_pattern = re.compile(
            r'^#+\s+IV\.[A-L]\.?\s+[^\n]+',
            re.MULTILINE
        )

        # Content cues for CREAC component identification
        self.cue_patterns = {
            'Conclusion': [
                re.compile(r'^\*\*(?:Key )?(?:Finding|Conclusion|Recommendation)s?\*\*:', re.MULTILINE | re.IGNORECASE),
                re.compile(r'^(?:In sum|In summary|Overall|Ultimately),', re.MULTILINE | re.IGNORECASE),
                re.compile(r'^ComfortCare (?:should|must|faces|has)', re.MULTILINE),
                re.compile(r'^The (?:primary|key|principal) (?:risk|concern|issue)', re.MULTILINE),
            ],
            'Rule': [
                re.compile(r'\b(?:42 U\.S\.C\.|42 C\.F\.R\.|29 U\.S\.C\.|15 U\.S\.C\.)', re.MULTILINE),
                re.compile(r'\b(?:Section|§)\s*\d+', re.MULTILINE),
                re.compile(r'^(?:Under|Pursuant to|According to)\s+(?:the\s+)?(?:statute|regulation|law)', re.MULTILINE | re.IGNORECASE),
                re.compile(r'^The\s+(?:statute|regulation|rule|law)\s+(?:requires|provides|states)', re.MULTILINE | re.IGNORECASE),
                re.compile(r'\b(?:CERCLA|RCRA|Clean Water Act|Sherman Act|HSR Act|WARN Act)\b'),
            ],
            'Explanation': [
                re.compile(r'^In\s+\*[^\*]+\*,?\s+(?:the\s+)?(?:court|Court)', re.MULTILINE),
                re.compile(r'^The\s+(?:Supreme )?[Cc]ourt\s+(?:in|held|found|ruled)', re.MULTILINE),
                re.compile(r'(?:See|See e\.g\.|See also)\s+\*[^\*]+\*', re.MULTILINE),
                re.compile(r'^(?:Courts have|The courts|Federal courts)', re.MULTILINE | re.IGNORECASE),
                re.compile(r'\*[^\*]+\*\s+establishes?\s+that', re.MULTILINE),
            ],
            'Application': [
                re.compile(r'^(?:Here|In this case|In the present case),', re.MULTILINE | re.IGNORECASE),
                re.compile(r'\b(?:ComfortCare|Gentle Transitions|Target)\b.*\b(?:faces|has|operates|maintains)', re.MULTILINE),
                re.compile(r'^Applying\s+(?:this|these|the)', re.MULTILINE | re.IGNORECASE),
                re.compile(r'^(?:Based on|Given|Considering)\s+(?:the|these)', re.MULTILINE | re.IGNORECASE),
                re.compile(r'^The\s+(?:Target\s+)?(?:facilities|operations|transaction)', re.MULTILINE),
            ],
            'Counter-Analysis': [
                re.compile(r'^(?:However|Nevertheless|Conversely|Alternatively),', re.MULTILINE | re.IGNORECASE),
                re.compile(r'^(?:The\s+)?(?:primary|key|principal|significant)\s+risk', re.MULTILINE | re.IGNORECASE),
                re.compile(r'^(?:Buyer|ComfortCare)\s+(?:might|could|may)\s+argue', re.MULTILINE | re.IGNORECASE),
                re.compile(r'^(?:A\s+)?(?:contrary|opposing|alternative)\s+(?:view|argument|position)', re.MULTILINE | re.IGNORECASE),
                re.compile(r'\b(?:risk|risks|exposure|liability)\b.*\b(?:remains|exists|arises)', re.MULTILINE | re.IGNORECASE),
            ],
        }

    def find_section_boundaries(self, content: str) -> List[Tuple[str, int, int]]:
        """
        Find boundaries of sections IV.A through IV.L.

        Returns:
            List of tuples (section_name, start_pos, end_pos)
        """
        matches = list(self.section_pattern.finditer(content))
        boundaries = []

        for i, match in enumerate(matches):
            section_header = match.group(0)
            # Extract section identifier (e.g., "IV.A")
            section_id_match = re.search(r'IV\.[A-L]', section_header)
            if not section_id_match:
                continue

            section_id = section_id_match.group(0)
            start_pos = match.start()

            # End position is start of next section or end of document
            if i + 1 < len(matches):
                end_pos = matches[i + 1].start()
            else:
                end_pos = len(content)

            boundaries.append((section_id, start_pos, end_pos))

        return boundaries

    def split_into_paragraphs(self, text: str) -> List[str]:
        """
        Split section text into paragraphs while preserving structure.

        Returns:
            List of paragraph strings (includes headers, tables, etc.)
        """
        # Split on double newlines, but preserve them
        paragraphs = re.split(r'\n\n+', text)
        return [p for p in paragraphs if p.strip()]

    def identify_creac_component(self, paragraph: str) -> str:
        """
        Identify which CREAC component a paragraph represents.

        Returns:
            CREAC component name or empty string if no match
        """
        # Skip if paragraph already has a CREAC header
        if re.match(r'^###\s+(?:Conclusion|Rule|Explanation|Application|Counter-Analysis)', paragraph):
            return ''

        # Skip if paragraph is a subsection header (e.g., "#### A. Subsection")
        if re.match(r'^#+\s+[A-Z0-9]\.', paragraph):
            return ''

        # Skip if paragraph is a table
        if '|' in paragraph and paragraph.count('|') > 3:
            return ''

        # Check each CREAC component's patterns
        for component, patterns in self.cue_patterns.items():
            for pattern in patterns:
                if pattern.search(paragraph):
                    return component

        return ''

    def insert_headers_in_section(self, section_text: str, section_id: str) -> str:
        """
        Insert CREAC headers into a single section.

        Returns:
            Modified section text with CREAC headers inserted
        """
        # Split section into header and body
        lines = section_text.split('\n', 1)
        if len(lines) < 2:
            return section_text

        section_header = lines[0]
        section_body = lines[1]

        # Split body into paragraphs
        paragraphs = self.split_into_paragraphs(section_body)

        modified_paragraphs = []
        headers_in_section = {
            'Conclusion': 0,
            'Rule': 0,
            'Explanation': 0,
            'Application': 0,
            'Counter-Analysis': 0,
        }

        for paragraph in paragraphs:
            component = self.identify_creac_component(paragraph)

            if component:
                # Insert header before paragraph
                modified_paragraphs.append(f"### {component}\n\n{paragraph}")
                headers_in_section[component] += 1
            else:
                modified_paragraphs.append(paragraph)

        # Reassemble section
        modified_body = '\n\n'.join(modified_paragraphs)
        modified_section = f"{section_header}\n{modified_body}"

        # Record statistics
        total_headers = sum(headers_in_section.values())
        self.headers_inserted[section_id] = {
            'total': total_headers,
            'breakdown': headers_in_section
        }

        return modified_section

    def process_document(self, content: str) -> str:
        """
        Process entire document, inserting CREAC headers in sections IV.A-IV.L.

        Returns:
            Modified document content
        """
        # Find section boundaries
        boundaries = self.find_section_boundaries(content)

        if not boundaries:
            print("ERROR: No sections IV.A-IV.L found in document", file=sys.stderr)
            return content

        print(f"Found {len(boundaries)} sections to process")

        # Process sections in reverse order to preserve positions
        modified_content = content
        offset = 0

        for section_id, start_pos, end_pos in boundaries:
            # Extract section text
            section_text = content[start_pos:end_pos]

            # Insert headers
            modified_section = self.insert_headers_in_section(section_text, section_id)

            # Calculate new positions with offset
            adjusted_start = start_pos + offset
            adjusted_end = end_pos + offset

            # Replace in content
            modified_content = (
                modified_content[:adjusted_start] +
                modified_section +
                modified_content[adjusted_end:]
            )

            # Update offset
            offset += len(modified_section) - len(section_text)

        return modified_content

    def print_statistics(self):
        """Print statistics about headers inserted."""
        print("\n" + "=" * 60)
        print("CREAC HEADER INSERTION STATISTICS")
        print("=" * 60)

        total_headers = 0

        for section_id in sorted(self.headers_inserted.keys()):
            stats = self.headers_inserted[section_id]
            section_total = stats['total']
            total_headers += section_total

            print(f"\n{section_id}: {section_total} headers")
            for component, count in sorted(stats['breakdown'].items()):
                if count > 0:
                    print(f"  - {component}: {count}")

        print("\n" + "-" * 60)
        print(f"TOTAL HEADERS INSERTED: {total_headers}")
        print(f"MINIMUM REQUIRED: {self.min_total_headers}")

        if total_headers >= self.min_total_headers:
            print(f"✓ SUCCESS: Target achieved ({total_headers} ≥ {self.min_total_headers})")
        else:
            print(f"✗ FAILURE: Insufficient headers ({total_headers} < {self.min_total_headers})")

        print("=" * 60 + "\n")

        return total_headers >= self.min_total_headers


def main():
    parser = argparse.ArgumentParser(
        description='Insert CREAC structural headers into legal memorandum'
    )
    parser.add_argument('input_file', help='Input memorandum file (final-memorandum.md)')
    parser.add_argument('output_file', help='Output file with CREAC headers (final-memorandum-v2.md)')
    parser.add_argument(
        '--min-headers',
        type=int,
        default=50,
        help='Minimum total headers required for success (default: 50)'
    )

    args = parser.parse_args()

    # Read input file
    print(f"Reading input file: {args.input_file}")
    try:
        with open(args.input_file, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"ERROR: Input file not found: {args.input_file}", file=sys.stderr)
        return 1
    except Exception as e:
        print(f"ERROR reading input file: {e}", file=sys.stderr)
        return 1

    original_word_count = len(content.split())
    print(f"Original document: {original_word_count:,} words")

    # Process document
    print(f"\nProcessing document (minimum {args.min_headers} headers required)...")
    inserter = CREACHeaderInserter(min_total_headers=args.min_headers)
    modified_content = inserter.process_document(content)

    # Verify word count preservation
    modified_word_count = len(modified_content.split())
    words_added = modified_word_count - original_word_count
    print(f"Modified document: {modified_word_count:,} words (+{words_added} from headers)")

    # Write output file
    print(f"\nWriting output file: {args.output_file}")
    try:
        with open(args.output_file, 'w', encoding='utf-8') as f:
            f.write(modified_content)
    except Exception as e:
        print(f"ERROR writing output file: {e}", file=sys.stderr)
        return 1

    # Print statistics and determine success
    success = inserter.print_statistics()

    return 0 if success else 1


if __name__ == '__main__':
    sys.exit(main())
