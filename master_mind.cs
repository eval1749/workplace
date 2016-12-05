// *-*-Mode:C++; -*-
// May 22, 2011
namespace Game {

using System;
using System.Collections.Generic;

class MasterMind {
    private const int NumberOfPins = 4;
    private const int NumberOfColors = 6;

    private class CodeMaker {
        private CodeWord answer;

        public CodeMaker(CodeWord answer) {
            this.answer = answer;
        } // CodeMaker

        public Response Ask(CodeWord guess) {
            return this.answer.Test(guess);
        } // Ask
    } // CodeMaker

    private class CodeWord {
        private static Dictionary<String, CodeWord>
            map = new Dictionary<String, CodeWord>();

        private static CodeWord[] vec;

        static char[] usedv = new char[NumberOfPins];

        private readonly String sval;

        static CodeWord() {
            var n = Power(NumberOfColors, NumberOfPins);
            vec = new CodeWord[n];

            for (int i = 0; i < n; i++) {
                var codeword = new CodeWord(i);
                vec[i] = codeword;
                map.Add(codeword.sval, codeword);
            } // for i
        } // CodeWord

        private CodeWord(int ival) {
            this.sval = ComputeStr(ival);
        } // CodeWord

        private CodeWord(String sval) {
            this.sval = sval;
        } // CodeWord

        private static String ComputeStr(int ival) {
            int x = ival;
            Char[] chv = new Char[NumberOfPins];
            for (int i = 1; i <= NumberOfPins; i++) {
                chv[NumberOfPins - i] = (Char) ('a' + x % NumberOfColors);
                x /= NumberOfColors;
            } // for
            return new String(chv);
        } // ComputeStr

        public static CodeWord Get(int i) {
            return vec[i];
        } // if

        public static CodeWord Get(String s) {
            return map[s.ToLower()];
        } // if

        public Response Test(CodeWord that) {

            int black = 0;
            int white = 0;

            for (int i = 0; i < this.sval.Length; i++) {
                if (this.sval[i] == that.sval[i]) {
                    black++;
                    usedv[i] = 'B';
                } else {
                    usedv[i] = '_';
                } // if
            } // for

            if (black == NumberOfPins) {
                return new Response(black, 0);
            } // if

            for (int i = 0; i < this.sval.Length; i++) {
                if (usedv[i] == 'B') {
                    continue;
                } // if

                for (int j = 0; j < that.sval.Length; j++) {
                    if (usedv[j] != '_') {
                        continue;
                    } // if

                    if (that.sval[i] == this.sval[j]) {
                        if (i == j) { throw new Exception("BAD"); }
                        usedv[j] = 'W';
                        white++;
                        break;
                    } // if
                } // for j
            } // for i

            return new Response(black, white);
        } // Test

        public override String ToString() {
            return this.sval;
        } // ToString
    } // CodeWord

    private class KnuthCodeBreaker {
        private HashSet<CodeWord> guessSet = new HashSet<CodeWord>();
        private HashSet<CodeWord> possibleSet = new HashSet<CodeWord>();

        public KnuthCodeBreaker() {
            var n = Power(NumberOfColors, NumberOfPins);
            for (int i = 0; i < n; i++) {
                var codeWord = CodeWord.Get(i);
                this.guessSet.Add(codeWord);
                this.possibleSet.Add(codeWord);
            } // for
        } // KnuthCodeBreaker

        private int CountPossibles(CodeWord guess, Response response) {
            var n = 0;
            foreach (var x in this.possibleSet) {
                var response2 = x.Test(guess);
                if (response2.IsSame(response)) {
                    n++;
                } // if
            } // for x
            return n;
        } // CountPossibles

        private int CountRemoves(CodeWord guess, int maxScore = 0) {
            int threshold = this.possibleSet.Count - maxScore;
            int max = 0;
            foreach (var candiate in this.possibleSet) {
                var response = candiate.Test(guess);
                var n = this.CountPossibles(guess, response);

                if (n > threshold) {
                    return 0;
                }

                max = Math.Max(max, n);
            } // for candidate
            return this.possibleSet.Count - max;
        } // Computeresponse

        public CodeWord Guess(bool verbose = false) {
            if (this.possibleSet.Count <= 2) {
                foreach (var possible in this.possibleSet) {
                    return possible;
                } // if

                throw new Exception("Can't happen!");
            } // if

            var startAt = Environment.TickCount;

            CodeWord guess = null;
            var maxScore = 0;

            foreach (var candidate in this.guessSet) {
                var score = this.CountRemoves(candidate, maxScore);
                var endAt = Environment.TickCount;

                if (maxScore == score) {
                    if (this.possibleSet.Contains(candidate)) {
                        Console.WriteLine("Guess {1}: {0} in possibleSet",
                            candidate,
                            endAt - startAt);
                        guess = candidate;
                    } // if

                } else if (maxScore < score) {
                    if (verbose) {
                        Console.WriteLine("Guess {2}: found {0} removes {1}",
                            candidate,
                            score,
                            endAt - startAt);
                    } // if

                    guess = candidate;
                    maxScore = score;
                } // if
            } // for x

            if (guess == null) {
                throw new Exception("Can't happen!");
            } // if

            if (verbose) {
                var endAt = Environment.TickCount;

                Console.WriteLine("Guess: {0} {1} in {2}ms",
                    guess,
                    maxScore,
                    endAt - startAt);
            }

            return guess;
        } // Guess

        // The first guesses are 90 patterns, aabbb, aacc, ..., ffdd, ffee.
        // Elapsed time for list all guesses is 280sec on E6600 2.4GHz with
        // optimized C#.
        public void ListGuess() {
            var maxScore = 0;
            var startAt = Environment.TickCount;
            foreach (var guess in this.guessSet) {
                var score = this.CountRemoves(guess);
                var endAt = Environment.TickCount;
                maxScore = Math.Max(maxScore, score);
                Console.WriteLine("{0} {1} remove {2} in {3}ms",
                    maxScore == score ? "May" : "Not",
                    guess,
                    score,
                    endAt - startAt);
            } // foreach
        } // ListGuess

        public void Play(CodeMaker codeMaker) {
            // Guess: aabb 1040 in 10515ms
            CodeWord guess = null;

            foreach (var x in this.guessSet) {
                if (x.ToString().Equals("aabb")) {
                    guess = x;
                    break;
                } // if
            } // for x

            var nth = 0;

            for (;;) {
                nth++;
                var response  = codeMaker.Ask(guess);

                Console.WriteLine();
                Console.WriteLine("Try[{0}] {1} B={2} W={3}",
                    nth,
                    guess,
                    response.Black,
                    response.White);

                var result = this.Update(guess, response);
                if (result != Result.Continue) {
                    Console.WriteLine(result);
                    return;
                } // if

                guess = this.Guess(true);
            } // for
        } // Play

        public Result Update(CodeWord guess, Response response) {
            if (response.Black == NumberOfPins) {
                return Result.Got;
            } // if

            this.guessSet.Remove(guess);

            switch (response.Black + response.White) {
            case 0:
                this.UpdateGuess(guess, 0);
                break;

            case 4:
                this.UpdateGuess(guess, 4);
                break;
            } // switch

            var set = new HashSet<CodeWord>();
            foreach (var x in this.possibleSet) {
                var response2 = x.Test(guess);
                if (response2.IsSame(response)) {
                    set.Add(x);
                } // if
            } // for x

            Console.Write("Update: possibilities = {0} ", set.Count);
            {
                var count = 0;
                var del = '{';
                foreach (var x in set) {
                    if (count > 20) {
                        Console.Write(" ...");
                        break;
                    } // if
                    count++;
                    Console.Write("{0}{1}", del, x);
                    del = ' ';
                } // for x
                Console.WriteLine("}");
            }

            if (set.Count == 0) {
                return Result.Fail;
            } // if

            if (set.Count == this.possibleSet.Count) {
                return Result.Fail;
            } // if

            this.possibleSet = set;
            this.possibleSet.Remove(guess);

            return Result.Continue;
        } // Update

        private void UpdateGuess(CodeWord guess, int n) {
            var newCodeSet = new HashSet<CodeWord>();
            foreach (var x in this.guessSet) {
                if (guess.Test(x).Sum() == n) {
                    newCodeSet.Add(x);
                } // if
            } // for
            this.guessSet = newCodeSet;
        } // UpdateGuess
    } // KnuthCodeBreaker

    private struct Response {
        private int black;
        private int white;

        public Response(int black, int white) {
            this.black = black;
            this.white = white;
        } // Response

        public int Black {
            get { return this.black; }
            set { this.black = value; }
        } // Balck

        public bool IsSame(Response that) {
            return this.Black == that.Black && this.White == that.White;
        } // IsSame

        public bool IsSmaller(Response that) {
            if (this.Black < that.White) {
                return true;
            } // if

            return this.White < that.White;
        } // IsSmaller

        public int Sum() {
            return this.Black + this.White;
        } // Sum

        public int White {
            get { return this.white; }
            set { this.white = value; }
        } // Balck

        public override String ToString() {
            return String.Format("B={0} W={1}", this.Black, this.White);
        } // ToString
    } // Response

    private enum Result {
        Continue,
        Fail,
        Got,
    } // Result

    private static void Guess(String[] paramv) {
        var codeBreaker = new KnuthCodeBreaker();
        for (var i = 0; i < paramv.Length; i += 2) {
            var codeWord = CodeWord.Get(paramv[i]);

            var str = paramv[i + 1];

            var response = new Response(
                str[0] - '0',
                str[1] - '0');

            var result = codeBreaker.Update(codeWord, response);
            if (result != Result.Continue) {
                Console.WriteLine(result);
                return;
            } // if
        } // for i

        Console.WriteLine(codeBreaker.Guess(true));
    } // Guess

    private static int Power(int n, int k) {
        var x = 1;
        for (int i = 0; i < k; i++) {
            x *= n;
        } // for
        return x;
    } // Power

    public static void Main(String[] paramv) {
        var codeBreaker = new KnuthCodeBreaker();

        switch (paramv.Length) {
        case 1:
            if (paramv[0] == "first") {
                codeBreaker.ListGuess();

            } else {
                var codeMaker = new CodeMaker(
                    CodeWord.Get(paramv[0]));

                codeBreaker.Play(codeMaker);
            }
            break;

        default:
            if (paramv.Length == 0 || paramv.Length % 2 != 0) {
                Console.WriteLine("Usage: mastermind first");
                Console.WriteLine("Usage: mastermind abcd");
                Console.WriteLine("Usage: mastermind abcd HB abcd HB ...");
                break;
            } // if

            Guess(paramv);
            break;
        } // switch paramv.Length
    } // Main
} // MasterMind

} // Game
