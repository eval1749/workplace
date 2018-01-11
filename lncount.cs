// @(#)$Id$

using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;

class CountLines {

struct Rule {
    public String pattern;
    public String replacement;

    public Rule(String pattern, String replacement) {
        this.pattern = pattern;
        this.replacement = replacement;
    } // Rule
} // Rule

static int fileCount;
static int totalLineCount;
static int verbose = 0;

static Regex reTargetFile = new Regex("[.](cpp|cs|h|inc|java|lisp|c|cc)$");

private static bool IsTargetFileName(String path) {
    return reTargetFile.IsMatch(path);
} // IsTargetFileName

private static void ProcessDirectory(String dirPath) {
    Verbose(3, "Process directory {0}", dirPath);
    foreach (var filePath in Directory.GetFiles(dirPath)) {
        if (IsTargetFileName(filePath)) {
            ProcessFile(filePath);
        } // if
    } // file

    foreach (var childPath in Directory.GetDirectories(dirPath)) {
        ProcessDirectory(childPath);
    } // for
} // ProcessDirectory

private static void ProcessFile(String filePath) {
    Verbose(3, "Process file {0}", filePath);

    var result = new StringBuilder();
    var lineCount = 0;
    using (var input = new StreamReader(filePath)) {
        for (;;) {
            var srcLine = input.ReadLine();
            if (null == srcLine) {
                break;
            } // if

            lineCount++;
        } // for
    } // input

    fileCount++;

    Verbose(0, "{0,6:D} {1}", lineCount, filePath);
    totalLineCount += lineCount;
} // ProcessFile

private static void Usage() {
    System.Console.WriteLine("Usage: lncount [-nv] dir...");
} // Usage

private static void Verbose(
    int level,
    String format,
    params Object[] paramv) {
    if (level <= verbose) {
        Console.WriteLine(format, paramv);
    } // if
} // Verbose

public static int Main(String[] argv) {
    var args = new Queue<String>(argv);

    while (args.Count > 0) {
        var arg = args.Peek();

        if (arg[0] != '-') {
            break;
        } // if

        args.Dequeue();

        switch (arg) {
        case "-v":
            verbose++;
            break;

        default:
            Usage();
            return 1;
        } // if
    } // while

    if (0 == args.Count) {
        ProcessDirectory(".");
    } else {
        foreach (var arg in args) {
            ProcessDirectory(arg);
        } // for arg
    } // if

    Verbose(0, "{0,6:D} {1} files", totalLineCount, fileCount);

    return 0;
} // Main

} // CountLines
