// @(#)$Id$

using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;

class FixThem {
  struct Rule {
   public
    String pattern;
   public
    String replacement;

   public
    Rule(String pattern, String replacement) {
      this.pattern = pattern;
      this.replacement = replacement;
    }  // Rule
  }    // Rule

  static int fileCount;
  static bool noExec = false;
  static LinkedList<Rule> rules = new LinkedList<Rule>();
  static int updateCount;
  static int verbose = 0;

  static Regex reTargetFile = new Regex("[.](cpp|cs|h|inc|java|lisp)$");

 private
  static bool IsTargetFileName(String path) {
    return reTargetFile.IsMatch(path);
  }  // IsTargetFileName

 private
  static void ProcessDirectory(String dirPath) {
    Verbose(3, "Process directory {0}", dirPath);
    foreach (var filePath in Directory.GetFiles(dirPath)) {
      if (IsTargetFileName(filePath)) {
        ProcessFile(filePath);
      }  // if
    }    // file

    foreach (var childPath in Directory.GetDirectories(dirPath)) {
      ProcessDirectory(childPath);
    }  // for
  }    // ProcessDirectory

 private
  static void ProcessFile(String filePath) {
    Verbose(3, "Process file {0}", filePath);

    var result = new StringBuilder();
    var replaced = false;

    using(var input = new StreamReader(filePath)) {
      for (;;) {
        var srcLine = input.ReadLine();
        if (null == srcLine) {
          break;
        }  // if

        var sink = new StringBuilder(srcLine);

        foreach (var rule in rules) {
          sink.Replace(rule.pattern, rule.replacement);
        }  // for rule

        var dstLine = sink.ToString();

        if (srcLine != dstLine) {
          replaced = true;
        }

        result.Append(dstLine);
        result.Append("\n");
      }  // for
    }    // input

    fileCount++;

    if (!replaced) {
      return;
    }  // if

    Verbose(0, "Update {0}", filePath);
    updateCount++;

    if (noExec) {
      return;
    }

    var newPath = filePath + "#";

    using(var output = new StreamWriter(newPath)) {
      output.Write(result.ToString());
    }  // output

    var bacupkPath = filePath + "~";
    File.Delete(bacupkPath);
    File.Move(filePath, bacupkPath);
    File.Move(newPath, filePath);
  }  // ProcessFile

 private
  static void ReadRule(String path) {
    int lineNum = 0;

    using(var input = new StreamReader(path)) {
      for (;;) {
        var line = input.ReadLine();
        if (null == line) {
          break;
        }  // if

        lineNum++;

        int iTabPos = line.IndexOf("\t");
        if (iTabPos < 0) {
          Console.Error.WriteLine("{0}({1}): Missing TAB: |{2}|", path, lineNum,
                                  line);
          continue;
        }  // if

        rules.AddLast(
            new Rule(line.Substring(0, iTabPos), line.Substring(iTabPos + 1)));
      }  // for
    }    // using
  }      // ReadRule

 private
  static void Usage() {
    System.Console.WriteLine("Usage: fixthem [-nv] rule.txt dir...");
  }  // Usage

 private
  static void Verbose(int level, String format, params Object[] paramv) {
    if (level <= verbose) {
      Console.WriteLine(format, paramv);
    }  // if
  }    // Verbose

 public
  static int Main(String[] argv) {
    var args = new Queue<String>(argv);
    if (0 == args.Count) {
      Usage();
      return 1;
    }  // if

    while (args.Count > 0) {
      var arg = args.Peek();

      if (arg[0] != '-') {
        break;
      }  // if

      args.Dequeue();

      switch (arg) {
        case "-n":
          noExec = true;
          break;

        case "-v":
          verbose++;
          break;

        default:
          Usage();
          return 1;
      }  // if
    }    // while

    ReadRule(args.Dequeue());

    if (0 == rules.Count) {
      System.Console.Error.WriteLine("No rules");
      return 1;
    }  // if

    if (0 == args.Count) {
      ProcessDirectory(".");
    } else {
      foreach (var arg in args) { ProcessDirectory(arg); }  // for arg
    }                                                       // if

    System.Console.Error.WriteLine("Update {0}/{1} files", updateCount,
                                   fileCount);

    return 0;
  }  // Main

}  // FixThem
