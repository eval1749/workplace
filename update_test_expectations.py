# Copyright (c) 2017 Project Vogue. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.


import os
import re
import sys


def is_comment(line):
    if len(line) == 0:
        return True
    if re.search('^\s*#', line):
        return True
    return len(line.split(' ', 2)) != 3


def make_updates(input_filename):
    update_dict = dict()
    with open(input_filename) as input_file:
        for line in input_file:
            fields = line.split(' ', 2)
            if len(fields) != 3:
                continue
            name = fields[1]
            update_dict[name] = line
    return update_dict


def main():
    if len(sys.argv) != 3:
        sys.stderr.write('Usage: %s test_expecations updates\n' % sys.argv[0])
        return 1

    inout_filename = sys.argv[1]
    update_filename = sys.argv[2]

    update_dict = make_updates(update_filename)

    outputs = []
    with open(inout_filename) as input_file:
        for line in input_file:
            outputs.append(line)
            if is_comment(line):
                continue
            name = (line.split(' ', 2))[1]
            if not(name in update_dict):
                continue
            outputs[-1] = update_dict[name]

    temp_filename = '/tmp/temp.txt'
    with open(temp_filename, 'wb') as output_file:
        output_file.write(''.join(outputs))

    os.remove(inout_filename)
    os.rename(temp_filename, inout_filename)

    return 0

if __name__ == '__main__':
    sys.exit(main())
