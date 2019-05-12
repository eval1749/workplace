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

   private CodeWord(String sval) { sval_ = sval; }

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
   private HashSet<CodeWord> guessSet_ = new HashSet<CodeWord>();
   private HashSet<CodeWord> possibleSet_ = new HashSet<CodeWord>();

   public KnuthCodeBreaker() {
      var n = Power(kNumberOfColors, kNumberOfPins);
      for (int i = 0; i < n; ++i) {
        var codeWord = CodeWord.Get(i);
        guessSet_.Add(codeWord);
        possibleSet_.Add(codeWord);
      }
    }

   private int CountPossibles(CodeWord guess, Response response) {
      var n = 0;
      foreach (var x in possibleSet_) {
        var response2 = x.Test(guess);
        if (response2.IsSame(response)) {
          ++n;
        }
      }
      return n;
    }

   private int CountRemoves(CodeWord guess, int maxScore = 0) {
      int threshold = possibleSet_.Count - maxScore;
      int maxPossibles = 0;
      foreach (var candidate in possibleSet_) {
        var response = candidate.Test(guess);
        var n = CountPossibles(guess, response);
        if (n > threshold)
          return 0;
        maxPossibles = Math.Max(maxPossibles, n);
      }
      return possibleSet_.Count - maxPossibles;
    }

  public CodeWord Guess(bool verbose = false) {
      if (possibleSet_.Count <= 2) {
        foreach (var possible in possibleSet_) { return possible; }

        throw new Exception("Can't happen!");
      }

      var startAt = Environment.TickCount;

      CodeWord guess = null;
      var maxScore = 0;

      foreach (var candidate in guessSet_) {
        var score = CountRemoves(candidate, maxScore);
        var endAt = Environment.TickCount;

        if (maxScore == score) {
          if (possibleSet_.Contains(candidate)) {
            Console.WriteLine("Guess {1}: {0} in possibleSet", candidate,
                              endAt - startAt);
            guess = candidate;
          }

        } else if (maxScore < score) {
          if (verbose) {
            Console.WriteLine("Guess {2}: found {0} removes {1}", candidate,
                              score, endAt - startAt);
          }

          guess = candidate;
          maxScore = score;
        }
      }

      if (guess == null) {
        throw new Exception("Can't happen!");
      }

      if (verbose) {
        var endAt = Environment.TickCount;
        Console.WriteLine("Guess: {0} {1} in {2}ms", guess, maxScore,
                          endAt - startAt);
      }

      return guess;
    }

    // The first guesses are 90 patterns, aabbb, aacc, ..., ffdd, ffee.
    // Elapsed time for list all guesses is 280sec on E6600 2.4GHz with
    // optimized C#.
   public void ListGuess() {
      var maxScore = 0;
      var startAt = Environment.TickCount;
      foreach (var guess in guessSet_) {
        var score = CountRemoves(guess);
        var endAt = Environment.TickCount;
        maxScore = Math.Max(maxScore, score);
        Console.WriteLine("{0} {1} remove {2} in {3}ms",
                          maxScore == score ? "May" : "Not", guess, score,
                          endAt - startAt);
      }
    }

    public void Play(CodeMaker codeMaker) {
      // Guess: aabb 1040 in 10515ms
      CodeWord guess = null;

      foreach (var x in guessSet_) {
        if (x.ToString().Equals("aabb")) {
          guess = x;
          break;
        }
      }

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
      if (response.Black == kNumberOfPins) {
        return Result.Got;
      }

      guessSet_.Remove(guess);

      switch (response.Black + response.White) {
        case 0:
          UpdateGuess(guess, 0);
          break;

        case 4:
          UpdateGuess(guess, 4);
          break;
      }

      var set = new HashSet<CodeWord>();
      foreach (var x in possibleSet_) {
        var response2 = x.Test(guess);
        if (response2.IsSame(response)) {
          set.Add(x);
        }
      }

      Console.Write("Update: possibilities = {0} ", set.Count);
      {
        var count = 0;
        var del = '{';
        foreach (var x in set) {
          if (count > 20) {
            Console.Write(" ...");
            break;
          }
          ++count
          Console.Write("{0}{1}", del, x);
          del = ' ';
        }
        Console.WriteLine("}");
      }

      if (set.Count == 0)
        return Result.Fail;

      if (set.Count == possibleSet_.Count)
        return Result.Fail;

      possibleSet_ = set;
      possibleSet_.Remove(guess);

      return Result.Continue;
    }

    private void UpdateGuess(CodeWord guess, int n) {
      var newCodeSet = new HashSet<CodeWord>();
      foreach (var x in guessSet_) {
        if (guess.Test(x).Sum() == n)
          newCodeSet.Add(x);
      }
      guessSet_ = newCodeSet;
    }
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
