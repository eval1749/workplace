#!/usr/bin/env python

import csv
import sys

# Take colors from:
# https://www.google.com/design/spec/style/color.html#color-color-palette

# 0 Level,
# 1 Function Name,
# 2 Inclusive Samples,
# 3 Exclusive Samples,
# 4 Inclusive Samples %,
# 5 Exclusive Samples %,
# 6 Module Name,

IGNORES = frozenset([
  '_RTC_CheckEsp',
  'Node::getFlag',
  'Node::hasRareData',
  'Node::treeScope',
  'TreeScope::document',
  'WTF::RefPtr<Node>::RefPtr<Node>',
])
MODULES = frozenset(['blink_platform.dll', 'webcore_shared.dll'])

last_entry = {
  "id": 0,
  "level": -1,
  "name": "root",
  "inclusive": 1,
  "exclusive": 1,
  "inclusivePercent": 100,
  "exclusivePercent": 100,
  "module": "root"
}

next_entry_id = 1
entries = {-1: last_entry}
emitted_edges = set()
emitted_entries = set([0])

def decodeFunctionName(name):
  name = name.replace(' >', '>')
  name = name.replace('blink::', '')
  name = name.replace('EditingAlgorithm<NodeTraversal>', 'EditingStrategy')
  name = name.replace('EditingAlgorithm<ComposedTreeTraversal>', 'EditingInComposedTreeStrategy')
  name = name.replace('Algorithm<EditingStrategy>', '')
  name = name.replace('Algorithm<EditingInComposedTreeStrategy>', 'InComposedTree')
  name = name.replace('Template<EditingStrategy>', '')
  name = name.replace('Template<EditingInComposedTreeStrategy>', 'InComposedTree')
  if len(name) > 100:
    name = name[0:39] + '...' + name[len(name) - 20:]
  return name

def encodeLabel(text):
  return text.replace('<', '&lt;').replace('>', '&gt;')

def labelOfEntry(entry):
  format = '\\n'.join([
    'level %(level)d',
    '',
    '%(name)s',
    '',
    'inclusive count: %(count)s %(countPercent)s%%',
    'exclusive count: %(count2)s %(countPercent2)s%%',
  ])
  return format % {
    'count': entry['inclusive'],
    'countPercent': entry['inclusivePercent'],
    'count2': entry['exclusive'],
    'countPercent2': entry['exclusivePercent'],
    'id': entry['id'],
    'level': entry['level'],
    'module': entry['module'],
    'name': encodeLabel(decodeFunctionName(entry['name'])),
  }

def emitEntry(output, entry):
  if entry['id'] in emitted_entries:
    return
  emitted_entries.add(entry['id'])
  output.write("entry%(id)d [label=\"%(label)s\"" % {
    'id': entry['id'],
    'label': labelOfEntry(entry),
  })
  if not isInterestedModule(entry):
    output.write(' fillcolor=white')
  elif entry['inclusivePercent'] > 5:
    output.write(' fontcolor=white fillcolor="#FF1744"')
  elif entry['inclusivePercent'] > 4:
    output.write(' fillcolor="#FFEB3B"')
  elif entry['inclusivePercent'] > 1:
    output.write(' fillcolor="#42A5F5"')
  if entry['inclusive'] > 1:
    output.write(' color="#00E676" penwidth=2')
  output.write("]\n")

def emitFooter(output):
  output.write("}\n")

def emitHeader(output):
  output.write("""digraph callTree {
  concentrate=false
  node [fontname=Tahoma fontsize=8 style=filled fillcolor=white]
  overlap=flase
  rankdir="TB"
  splines=true

""")
  emitEntry(output, last_entry)

def isInterestedModule(entry):
  return entry['module'] in MODULES

def makeEntry(row):
  global next_entry_id
  id = next_entry_id
  next_entry_id = next_entry_id + 1
  entry = {
    "id": id,
    "level": int(row['Level']),
    "name": row['Function Name'],
    "inclusive": int(row['Inclusive Samples'].replace(',', '')),
    "exclusive": int(row['Exclusive Samples'].replace(',', '')),
    "inclusivePercent": float(row['Inclusive Samples %'].replace('%', '')),
    "exclusivePercent": float(row['Exclusive Samples %'].replace('%', '')),
    "module": row['Module Name'],
  }
  return entry

def processChain(output, fromLevel, toLevel, threshold):
  output.write("// new trace %d, %d\n" % (fromLevel, toLevel))
  while toLevel > fromLevel:
    entry = entries[toLevel]
    if entry['inclusive'] > threshold and isInterestedModule(entry):
      break
    toLevel = toLevel - 1
  if fromLevel == toLevel:
    return
  fromEntry = entries[fromLevel - 1]
  emitEntry(output, fromEntry)
  for index in range(fromLevel, toLevel + 1):
    toEntry = entries[index]
    if shouldIgnore(toEntry):
        return
    if fromEntry['module'] == toEntry['module'] and not isInterestedModule(toEntry):
        continue
    emitEntry(output, toEntry)
    edge = str(fromEntry['id']) + ',' + str(toEntry['id'])
    if not edge in emitted_edges:
      output.write("entry%(from)d -> entry%(to)d\n" % {"from": fromEntry['id'], "to": toEntry['id']})
      emitted_edges.add(edge)
    fromEntry = toEntry

def processInput(output, reader):
  global last_entry
  for row in reader:
    entry = makeEntry(row)
    level = entry['level']
    if level < last_entry['level']:
      processChain(output, 1, last_entry['level'], 1)
    entries[level] = entry
    last_entry = entry
  processChain(output, 1, last_entry['level'], 0)

def shouldIgnore(entry):
  name = entry['name']
  if name.find('~') >= 0:
    return True
  if name.startswith('DataRef<'):
    return True
  if name.startswith('WTF::PassRefPtr<'):
    return True
  if name.startswith('WTF::RawPtr<'):
    return True
  if name.startswith('WTF::RefPtr<'):
    return True
  return decodeFunctionName(name) in IGNORES

def main():
  input_file = sys.argv[1]
  output_file = input_file + ".dot"

  with open(input_file, "rt") as input:
    reader = csv.DictReader(input)
    with open(output_file, "wt") as output:
      emitHeader(output)
      processInput(output, reader)
      emitFooter(output)

if __name__ == "__main__":
  main()
