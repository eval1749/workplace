// *-*-Mode:C++; -*-
namespace Game {

using System;
using System.Collections.Generic;

class MasterMind {
  private const int kNumberOfPins = 4;
  private const int kNumberOfColors = 6;

  private class CodeMaker {
   private CodeWord answer_;

   public CodeMaker(CodeWord answer) { answer_ = answer; }

   public Response Ask(CodeWord guess) { return answer_.Test(guess); }
  }

  private class CodeWord {
   private static Dictionary<String, CodeWord> map =
        new Dictionary<String, CodeWord>();

   private static CodeWord[] vec;
   private static char[] usedv = new char[kNumberOfPins];

   private readonly String sval_;

    static CodeWord() {
      var n = Power(kNumberOfColors, kNumberOfPins);
      vec = new CodeWord[n];

      for (int i = 0; i < n; ++i) {
        var code_word = new CodeWord(i);
        vec[i] = code_word;
        map.Add(code_word.sval_, code_word);
      }
    }

   private CodeWord(int ival) { sval_ = ComputeStr(ival); }

   public CodeWord(String sval) { sval_ = sval; }

   private static String ComputeStr(int ival) {
      int x = ival;
      Char[] chv = new Char[kNumberOfPins];
      for (int i = 1; i <= kNumberOfPins; ++i) {
        chv[kNumberOfPins - i] = (Char)('a' + x % kNumberOfColors);
        x /= kNumberOfColors;
      }
      return new String(chv);
    }

   public static CodeWord Get(int i) { return vec[i]; }

   public static CodeWord Get(String s) { return map[s.ToLower()]; }

   public Response Test(CodeWord that) {
      int black = 0;
      int white = 0;

      for (int i = 0; i < sval_.Length; ++i) {
        if (sval_[i] == that.sval_[i]) {
          ++black;
          usedv[i] = 'B';
        } else {
          usedv[i] = '_';
        }
      }

      if (black == kNumberOfPins) {
        return new Response(black, 0);
      }

      for (int i = 0; i < sval_.Length; ++i) {
        if (usedv[i] == 'B')
          continue;

        for (int j = 0; j < that.sval_.Length; ++j) {
          if (usedv[j] != '_')
            continue;

          if (that.sval_[i] == sval_[j]) {
            if (i == j) {
              throw new Exception("BAD");
            }
            usedv[j] = 'W';
            ++white;
            break;
          }
        }
      }

      return new Response(black, white);
    }

   public override String ToString() { return sval_; }
  }

  private class KnuthCodeBreaker {
   private HashSet<CodeWord> possibleSet_ = new HashSet<CodeWord>();

   public KnuthCodeBreaker() {
      var n = Power(kNumberOfColors, kNumberOfPins);
      for (int i = 0; i < n; ++i)
        possibleSet_.Add(CodeWord.Get(i));
    }

   private int CountSameResponses(CodeWord guess, Response response) {
      var n = 0;
      foreach (var x in possibleSet_) {
        var response2 = x.Test(guess);
        if (response2.IsSame(response))
          ++n;
      }
      return n;
    }

    private int ComputeScore(CodeWord guess) {
      int max_sames = 0;
      foreach (var candidate in possibleSet_) {
        var response = candidate.Test(guess);
        var num_sames = CountSameResponses(guess, response);
        max_sames = Math.Max(max_sames, num_sames);
      }
      return possibleSet_.Count - max_sames;
    }

  public CodeWord Guess(bool verbose = false) {
      if (possibleSet_.Count <= 2) {
        foreach (var possible in possibleSet_) { return possible; }
        throw new Exception("Can't happen!");
      }

      var startAt = Environment.TickCount;

      CodeWord guess = null;
      var max_score = 0;
      var nth = 0;
      foreach (var candidate in possibleSet_) {
        ++nth;
        var score = ComputeScore(candidate);
        var endAt = Environment.TickCount;
        var elapsed = endAt - startAt;
        if (elapsed > 1000) {
          Console.WriteLine("Guess[{0}]: Time out {1}ms", nth, elapsed);
          break;
        }
        if (score <= max_score)
          continue;
        if (verbose) {
          Console.WriteLine("Guess[{0}]: found {1} removes {2} in {3}ms",
                            nth, candidate, score, endAt - startAt);
        }
        max_score = score;
        guess = candidate;
      }

      if (guess == null)
        throw new Exception("Can't happen!");

      if (verbose) {
        var endAt = Environment.TickCount;
        Console.WriteLine("Guess: {0} removes={1} in {2}ms",
                          guess, max_score, endAt - startAt);
      }

      return guess;
    }

   public void ListGuess() {
      var startAt = Environment.TickCount;
      foreach (var guess in possibleSet_) {
        var score = ComputeScore(guess);
        var endAt = Environment.TickCount;
        Console.WriteLine("{0} removes {1} in {2}ms",
                          guess, score, endAt - startAt);
      }
    }

    public void Play(CodeMaker codeMaker) {
      CodeWord guess = new CodeWord("abcd");
      var nth = 0;
      for (;;) {
        ++nth;
        var response = codeMaker.Ask(guess);

        Console.WriteLine();
        Console.WriteLine("Try[{0}] {1} B={2} W={3}", nth, guess,
                          response.Black, response.White);

        var result = Update(guess, response);
        if (result != Result.Continue) {
          Console.WriteLine(result);
          return;
        }

        guess = Guess(true);
      }
    }

    public Result Update(CodeWord guess, Response response) {
      if (response.Black == kNumberOfPins)
        return Result.Got;

      var newPossibleSet = new HashSet<CodeWord>();
      foreach (var x in possibleSet_) {
        var response2 = x.Test(guess);
        if (response2.IsSame(response))
          newPossibleSet.Add(x);
      }

      newPossibleSet.Remove(guess);

      Console.Write("Update: possibilities = {0} => {1} ",
                    possibleSet_.Count, newPossibleSet.Count);
      PrintSet(newPossibleSet);

      if (newPossibleSet.Count == 0)
        return Result.Fail;
      possibleSet_ = newPossibleSet;
      return Result.Continue;
    }
  }

  private static void PrintSet(HashSet<CodeWord> set) {
    var count = 0;
    var delimiter = '{';
    foreach (var x in set) {
      if (count > 20) {
        Console.Write(" ...");
        break;
      }
      ++count;
      Console.Write("{0}{1}", delimiter, x);
      delimiter = ' ';
    }
    Console.WriteLine("}");
  }

  private struct Response {
    private int black_;
    private int white_;

    public Response(int black, int white) {
      black_ = black;
      white_ = white;
    }

    public int Black { get { return black_; } }

    public bool IsSame(Response that) {
      return Black == that.Black && White == that.White;
    }

    public bool IsSmaller(Response that) {
     if (Black < that.White)
       return true;
     return White < that.White;
    }

    public int Sum() { return Black + White; }
    public int White { get { return white_; } }

    public override String ToString() {
      return String.Format("B={0} W={1}", Black, White);
    }
  }

  private enum Result {
    Continue,
    Fail,
    Got,
  }

  private static void Guess(String[] paramv) {
    var codeBreaker = new KnuthCodeBreaker();
    for (var i = 0; i < paramv.Length; i += 2) {
      var codeWord = CodeWord.Get(paramv[i]);
      var str = paramv[i + 1];
      var response = new Response(str[0] - '0', str[1] - '0');
      var result = codeBreaker.Update(codeWord, response);
      if (result != Result.Continue) {
        Console.WriteLine(result);
        return;
      }
    }
    Console.WriteLine(codeBreaker.Guess(true));
  }

  private static int Power(int n, int k) {
    var x = 1;
    for (int i = 0; i < k; ++i)
      x *= n;
    return x;
  }

  public static void Main(String[] paramv) {
    var codeBreaker = new KnuthCodeBreaker();

    switch (paramv.Length) {
      case 1:
        if (paramv[0] == "first") {
          codeBreaker.ListGuess();
        } else {
          var codeMaker = new CodeMaker(CodeWord.Get(paramv[0]));
          codeBreaker.Play(codeMaker);
        }
        break;

      default:
        if (paramv.Length == 0 || paramv.Length % 2 != 0) {
          Console.WriteLine("Usage: mastermind first");
          Console.WriteLine("Usage: mastermind abcd");
          Console.WriteLine("Usage: mastermind abcd HB abcd HB ...");
          break;
        }

        Guess(paramv);
      break;
    }
  }
}

}  // namespace Game
