// @(#)$Id$

// csc.exe rz.cs /debug /r:System.IO.Compression.FileSystem.dll
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.IO.Compression;
using System.Text.RegularExpressions;

class Renames {

private static Regex RE_VOL = new Regex("\u7B2C(\\d+)\u5DFB");

private static bool ShouldRemove(FileInfo file) {
  switch (file.Extension) {
    case ".jpg":
      return file.Name == "excnn.com.jpg";
    case ".bmp":
    case ".JPG":
    case ".jpeg":
    case ".png":
      return false;
    default:
      return true;
  }
}

private enum State {
    Digit,
    NotDigit,
    Start,
}

private static List<Int32> Normalize(String name) {
  var state = State.NotDigit;
  var accmulator = 0;
  var results = new List<Int32>();
  const int NUMBER = 0x10000;
  foreach (var ch in name) {
    switch (state) {
      case State.Digit:
        if (ch >= '0' && ch <= '9') {
          accmulator *= 10;
          accmulator += ch - '0';
          break;
        }
        results.Add(accmulator + NUMBER);
        results.Add(ch);
        state = State.NotDigit;
        break;

      case State.NotDigit:
        if (ch >= '0' && ch <= '9') {
          accmulator = ch - '0';
          state = State.Digit;
          break;
        }
        results.Add(ch);
        break;
    }
  }

  if (state == State.Digit)
    results.Add(accmulator + NUMBER);
  return results;
}

private static int CompareFileNames(FileInfo file1, FileInfo file2) {
  var name1 = Normalize(file1.Name);
  var name2 = Normalize(file2.Name);
  for (var i = 0; i < name1.Count; ++i) {
    if (i == name2.Count)
      return 1;
    var diff = name1[i] - name2[i];
    if (diff != 0)
      return diff;
  }
  return 0;
}

private static void DoRename(String prefix, String dirPath) {
  var files = new List<FileInfo>();
  foreach (var filePath in Directory.GetFiles(dirPath))
    files.Add(new FileInfo(filePath));
  files.Sort(CompareFileNames);

  int counter = 0;
  foreach (var fileInfo in files) {
    var oldFile = fileInfo;
    if (ShouldRemove(oldFile)) {
      oldFile.Delete();
      Console.WriteLine("Delete {0}", oldFile.Name);
      continue;
    }

    if (oldFile.Extension == ".bmp") {
      var bmp = Image.FromFile(oldFile.FullName);
      var tempFile = new FileInfo(
          String.Format("{0}\\{1}.jpg",
            oldFile.DirectoryName,
            oldFile.Name.Substring(0, oldFile.Name.Length - 4)));
      bmp.Save(tempFile.FullName, ImageFormat.Jpeg);
      bmp.Dispose();
      Console.WriteLine("Convert to JPEG: {0}", oldFile.Name);
      oldFile.Delete();
      oldFile = tempFile;
    }

    var newFile = new FileInfo(
        String.Format("{0}\\{1}{2:D3}{3}", 
            oldFile.DirectoryName,
            prefix,
            ++counter,
            oldFile.Extension));
    if (oldFile != newFile)
      oldFile.MoveTo(newFile.FullName);
  }

  Console.WriteLine("{0} files", counter);
}

private static void Usage() {
  Console.WriteLine("Usage: renames prefix dir");
}

public static int Main(String[] argv) {
  if (argv.Length == 0) {
    Usage();
    return 1;
  }

  foreach (var arg in argv) {
    var match = RE_VOL.Match(arg);
    var volume = match.Success ? match.Groups[1].Value : "00";
    DoRename(String.Format("{0}_", volume, arg), arg);
    Console.WriteLine("Zip... {0} {1}", volume, arg);
    ZipFile.CreateFromDirectory(arg, arg + ".zip");
  }

  return 0;
}

}
