# Copyright (c) 2017 Project Vogue. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.


import os
import re
import sys

counter = 0

IGNORES = frozenset([
    'HTMLCanvasElement.idl', # crbug.com/806163
    'HTMLIFrameElement.idl', # crbug.com/806163
    'HTMLInputElement.idl',  # crbug.com/806163
    'HTMLMediaElement.idl',  # abstract interface
    'HTMLVideoElement.idl',  # crbug.com/806163
])

def process_directory(dirpath):
    for name in os.listdir(dirpath):
        path = os.path.join(dirpath, name)
        if os.path.isdir(path):
            process_directory(path)
            continue
        if os.path.isfile(path):
            process_file(path)
            continue


def process_file(path):
    if not re.search('HTML.*Element\\.idl$', path):
        return
    name = os.path.basename(path)
    if name in IGNORES:
        sys.stderr.write('  IGNORE %s\n' % path)
        return
    global counter
    counter = counter + 1
    lines = open(path).readlines()
    text = ''.join(lines)
    if re.search('\\[HTMLConstructor]\ninterface HTML', text):
        sys.stderr.write('  SKIP SIMPLE %s\n' % path)
        return
    index = text.find('\n\ninterface HTML')
    if index >= 0:
        text = text[0:index+1] + '[HTMLConstructor]\n' + text[index + 2:]
        with open(path, 'wb') as output_file:
            output_file.write(text)
        return
    matches = re.search('\\[(.+?)\\][ \n]+i', text, re.DOTALL)
    if matches.group(0).find('HTMLConstructor') >= 0:
        sys.stderr.write('  SKIP COMPLEX %s\n' % path)
        return
    print 'COMPLEX %s' % path

def main():
    path = sys.argv[1]
    if os.path.isdir(path):
        process_directory(path)
        sys.stderr.write('Process %d HTML element IDL files' % counter)
        return 0
    process_file(path)
    return 0

if __name__ == '__main__':
    sys.exit(main())
