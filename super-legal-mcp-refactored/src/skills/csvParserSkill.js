export const csvParserSkill = {
  name: 'parse_csv',
  description: 'Parse CSV data into structured JSON',
  type: 'code_execution',
  language: 'python',
  code: `
import csv
import json
from io import StringIO

def parse_csv(csv_text):
    reader = csv.DictReader(StringIO(csv_text))
    return [row for row in reader]

result = parse_csv(input_data)
print(json.dumps(result))
`,
  sandbox: {
    cpu_limit: '1000ms',
    memory_limit: '128MB',
    network: False,
    filesystem: False
  }
};

