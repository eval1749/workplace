# Copyright (C) 2013 by Project Vogue.
# Written by Yoshifumi "VOGUE" INOUE. (yosi@msn.com)

import argparse
import os
import re
import sys

# ${evita_src}/tools/closure_compiler.py
#script_dir = os.path.dirname(os.path.realpath(__file__))

JAVA_OPTIONS = ['-client', '-Xms1G', '-XX:+TieredCompilation'];
CLOSURE_DIR = 'd:/src/w/crbk/src/third_party/closure_compiler/compiler';
CLOSURE_JAR = os.path.join(CLOSURE_DIR, 'compiler.jar')

# See below folow list of warnings:
# https://code.google.com/p/closure-compiler/wiki/Warnings
CLOSURE_ERRORS = [
    'accessControls',
    'ambiguousFunctionDecl',
    'checkDebuggerStatement',
    'checkRegExp',
    'checkStructDictInheritance',
    'checkTypes',
    'checkVars',
    'const',
    'constantProperty',
    'deprecated',
    'externsValidation',
    'globalThis',
    'invalidCasts',
    'misplacedTypeAnnotation',
    'missingProperties',
    'missingReturn',
    'nonStandardJsDocs',
    'strictModuleDepCheck',
    'suspiciousCode',
    'undefinedNames',
    'undefinedVars',
    'unknownDefines',
    'uselessCode',
    'visibility',
];

CLOSURE_WARNINGS = [
];

CLOSURE_OPTIONS = [
    '--compilation_level=SIMPLE',
    '--formatting=PRETTY_PRINT',
    '--language_in=ECMASCRIPT5_STRICT',
    '--summary_detail_level=3',
    '--warning_level=VERBOSE',
];

def makeOptions(name, values):
    if not len(values):
      return ''
    return name + ' ' + (' ' + name + ' ').join(values)

def check(js_output_file, js_files, js_externs, closure_options):
    params = {
        'java_options': ' '.join(JAVA_OPTIONS),
        'closure_errors': makeOptions('--jscomp_error', CLOSURE_ERRORS),
        'closure_warnings': makeOptions('--jscomp_warning', CLOSURE_WARNINGS),
        'closure_jar': CLOSURE_JAR,
        'closure_options': ' '.join(CLOSURE_OPTIONS + closure_options),
        'js_files': makeOptions('--js', js_files),
        'js_externs': makeOptions('--externs', js_externs),
    }
    command_line = ('java %(java_options)s -jar %(closure_jar)s' + \
                    ' --js_output_file=' + js_output_file + \
                    ' %(closure_options)s' + \
                    ' %(closure_errors)s' + \
                    ' %(closure_warnings)s' + \
                    ' %(js_files)s' + \
                    ' %(js_externs)s') % params;
    exit_code = os.system(command_line)
    if exit_code != 0:
        try:
            if os.path.isfile(js_output_file):
                os.remove(js_output_file)
        except OSError as detail:
            print detail
    return exit_code == 0

def main():
    parser = argparse.ArgumentParser(
        description="Typecheck JavaScript using Closure compiler")
    parser.add_argument("sources", nargs=argparse.ONE_OR_MORE,
        help="Path to a source file to typecheck")
    parser.add_argument("-e", "--externs", nargs=argparse.ZERO_OR_MORE)
    parser.add_argument("-o", "--out_dir",
        help="A place to output results", default='.')

    options = parser.parse_args()

    closure_options = []
    succeeded = True
    for js_source in options.sources:
        js_basename = os.path.basename(js_source)
        js_externs = [
            file_name for file_name in options.externs
                if os.path.basename(file_name).replace('_externs', '') != \
                   js_source
        ]
        js_output_file = os.path.join( \
            options.out_dir, os.path.splitext(js_basename)[0] + '_min.js')
        succeeded = succeeded and check(js_output_file, [js_source], js_externs, closure_options)
    return 0 if succeeded else 1

if __name__ == '__main__':
    sys.exit(main())
