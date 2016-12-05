// @(#)$Id: ten.cs$
//
// Solve Ten Puzzle
// yosi@msn.com
//
// April 1, 2010
//

using System;
using System.Collections;
using System.Collections.Generic;
using System.Text;
using System.Text.RegularExpressions;

class TenPuzzle {
    private enum Precedence {
        Low,
        Middle,
        High,
    } // Precedence

    private abstract class Node {
        public override String ToString() {
            return this.Unparse();
        } // ToString

        public abstract void Unparse(StringBuilder buf, Operator op);

        public String Unparse() {
            var buf = new StringBuilder();
            this.Unparse(buf, null);
            return buf.ToString();
        } // Unparse

        public abstract Ratio Value { get; }
    } // Node

    private class BinNode : Node {
        private Node left;
        private Operator op;
        private Node right;

        public BinNode(
            Operator op,
            Node left,
            Node right) {
            this.left = left;
            this.op = op;
            this.right = right;
        } // BinNode

        private bool IsNeedParen(Operator outerOp) {
            if (outerOp == null) {
                return false;
            } // if

            if (outerOp.Precedence == this.op.Precedence) {
                return this.op.ToChar() == '/';
            } // if

            return outerOp.Precedence > this.op.Precedence;
        } // IsNeedParen

        public String ToPrefix() {
            return String.Format("({0} {1} {2})",
                this.op.ToChar(),
                this.left,
                this.right);
        } // ToPrefix

        public override void Unparse(
            StringBuilder buf,
            Operator outerOp) {

            if (this.IsNeedParen(outerOp)) {
                buf.Append('(');
            } // if

            this.left.Unparse(buf, this.op);

            buf.Append(this.op.ToChar());

            if (this.op.ToChar() == '/') {
                if (this.right is BinNode) {
                    buf.Append('(');
                    this.right.Unparse(buf, null);
                    buf.Append(')');

                } else {
                    this.right.Unparse(buf, null);
                } // if

            } else {
                this.right.Unparse(buf, this.op);
            } // if

            if (this.IsNeedParen(outerOp)) {
                buf.Append(')');
            } // if
        } // Unparse

        public override Ratio Value {
            get {
                return this.op.Eval(this.left, this.right);
            } // get
        } // Value
    } // BinNode

    private class Immediate : Node, IComparable {
        private int value;

        // ctor
        public Immediate(int value) {
            this.value = value;
        } // value

        // [C]
        public int CompareTo(Object obj) {
            var that = obj as Immediate;
            if (that == null) {
                throw new ArgumentException("obj isn't Immediate");
            } // if
            return this.value - that.value;
        } // CompareTo

        // [T]
        public override String ToString() {
            return this.Value.ToString();
        } // ToString

        // [U]
        public override void Unparse(
            StringBuilder buf,
            Operator outerOp) {
            buf.Append(this.Value.ToString());
        } // Unparse

        // [V]
        public override Ratio Value {
            get { return new Ratio(this.value); }
        } // Value
    } // Immediate

    private class Operator : Node, IComparable {
        private Precedence pred;
        private char op;

        protected Operator(Precedence pred, char op) {
            this.op = op;
            this.pred = pred;
        } // Operator

        // [C]
        public int CompareTo(Object obj) {
            var that = obj as Operator;
            if (that == null) {
                throw new ArgumentException("obj isn't Immediate");
            } // if
            return this.op - that.op;
        } // CompareTo

        public virtual Ratio Eval(Node a, Node b) {
            throw new Exception(String.Format("Missing {0}.Eval", this));
        } // Eval

        public Precedence Precedence {
            get { return this.pred; }
        } // Precedence

        // [T]
        public Char ToChar() {
            return this.op;
        } // ToChar

        public override String ToString() {
            return this.op.ToString();
        } // ToString

        // [U]
        public override void Unparse(
            StringBuilder buf,
            Operator outerOp) {
            throw new Exception("Not SUpported");
        } // Unparse

        // [V]
        public override Ratio Value {
            get { throw new Exception("Not Supported"); }
        } // Value
    } // Operator

    private class OpAdd : Operator {
        public OpAdd() : base(Precedence.Low, '+') {}

        public override Ratio Eval(Node a, Node b) {
            Ratio c =  a.Value + b.Value;
            #if DEBUG
                System.Console.WriteLine("{0} + {1} => {2}", a, b, c);
            #endif
            return c;
        } // Eval
    } // OpAdd

    private class OpDiv : Operator {
        public OpDiv() : base(Precedence.Middle, '/') {}

        public override Ratio Eval(Node a, Node b) {
            Ratio c = a.Value / b.Value;
            #if DEBUG
                System.Console.WriteLine("{0} / {1} => {2}", a, b, c);
            #endif
            return c;
        } // Eval
    } // OpDiv

    private class OpMul : Operator {
        public OpMul() : base(Precedence.Middle, '*') {}

        public override Ratio Eval(Node a, Node b) {
            Ratio c =  a.Value * b.Value;
            #if DEBUG
                System.Console.WriteLine("{0} * {1} => {2}", a, b, c);
            #endif
            return c;
        } // Eval
    } // OpMul

    private class OpSub : Operator {
        public OpSub() : base(Precedence.Low, '-') {}

        public override Ratio Eval(Node a, Node b) {
            Ratio c =  a.Value - b.Value;
            #if DEBUG
                System.Console.WriteLine("{0} - {1} => {2}", a, b, c);
            #endif
            return c;
        } // Eval
    } // OpSub

    // Generate permutation of tuple size N from set S.
    private class PermutationSet<T> : IEnumerator<T[]> {
        private int current;
        private int max;
        private T[] tuple;
        private T[] setv;

        public PermutationSet(T[] setv, int length) {
            this.current = -1;
            this.tuple = new T[length];
            this.setv = setv;

            this.max = 1;
            for (int i = 0; i < this.tuple.Length; i++) {
                this.max *= this.setv.Length;
            } // for i
            this.max--;

        } // PermutationSet

        Object IEnumerator.Current {
            get { return this.tuple; }
        } // Current

        public T[] Current {
            get { return this.tuple; }
        } // Current

        void IDisposable.Dispose() {
            // nothing to do
        } // Dispose

        public IEnumerator<T[]> GetEnumerator() {
            return this;
        } // GetEnumerator

        public bool MoveNext() {
            if (this.current >= this.max) {
                return false;
            } // if

            current++;

            int x = current;
            for (int i = 0; i < this.tuple.Length; i++) {
                this.tuple[i] = this.setv[x % this.setv.Length];
                x /= this.setv.Length;
            } // for i

            return true;
        } // MoveNext

        // [R]
        public void Reset() {
            this.current = -1;
        } // Reset
    }; // PermutationSet

    private class Perm<T> : IEnumerator<T[]> where T : IComparable {
        private bool isFirst;
        private T[] current;

        public Perm(T[] init) {
            this.current = new T[init.Length];
            init.CopyTo(this.current, 0);
            this.isFirst = true;
        } // Perm

        Object IEnumerator.Current {
            get { return this.current; }
        } // Current

        public T[] Current {
            get { return this.current; }
        } // Current

        void IDisposable.Dispose() {
            // nothing to do
        } // Dispose

        public IEnumerator<T[]> GetEnumerator() {
            return this;
        } // GetEnumerator

        public bool MoveNext() {
            if (this.isFirst) {
                this.isFirst = false;
                return true;
            } // if

            int last = this.current.Length;
            int next = last;

            if (next == 0) {
                return false;
            } // if

            if (next == 1) {
                return false;
            } // if

            // find rightmost element smaller than successor
            next--;

            do {
                int next1 = next;
                next--;

                if (this.current[next].CompareTo(this.current[next1]) < 0) {
                    // Swap with rightmost element that's smaller,
                    int mid = last;
                    do {
                        mid--;
                    } while (
                        this.current[next].CompareTo(this.current[mid]) >= 0);

                    {
                        T temp = this.current[next];
                        this.current[next] = this.current[mid];
                        this.current[mid] = temp;
                    }

                    // flip suffix.
                    Array.Reverse(this.current, next1, last - next1);
                    return true;
                } // if
            } while (next > 0);

            // Pure descending, flip all
            Array.Reverse(this.current);
            return false;
        } // MoveNext

        public void Reset() {
            throw new Exception("Not implemented");
        } // Reset
    } // Perm

    private struct Ratio {
        private int den;
        private int num;

        public static Ratio NaN = new Ratio(0, 0);

        public Ratio(int num) {
            this.den = 1;
            this.num = num;
        } // Ratio

        public Ratio(int num, int den) {
            int k = den == 0 ? 1 : Gcd(num, den);
            this.den = den / k;
            this.num = num / k;
        } // Ratio

        public static Ratio operator +(Ratio a, Ratio b) {
            if (a.IsNaN()) {
                return Ratio.NaN;
            } // if

            if (b.IsNaN()) {
                return Ratio.NaN;
            } // if

            return new Ratio(
                a.Num * b.Den + b.Num * a.Den,
                a.Den * b.Den);
        } // +

        public static Ratio operator -(Ratio a, Ratio b) {
            if (a.IsNaN()) {
                return Ratio.NaN;
            } // if

            if (b.IsNaN()) {
                return Ratio.NaN;
            } // if

            return new Ratio(
                a.Num * b.Den - b.Num * a.Den,
                a.Den * b.Den);
        } // -

        public static Ratio operator *(Ratio a, int b) {
            return new Ratio(a.Num * b, a.Den);
        } // *

        public static Ratio operator *(Ratio a, Ratio b) {
            if (a.IsNaN()) {
                return Ratio.NaN;
            } // if

            if (b.IsNaN()) {
                return Ratio.NaN;
            } // if

            return new Ratio(a.Num * b.Num, a.Den * b.Den);
        } // *

        public static Ratio operator /(Ratio a, Ratio b) {
            if (a.IsNaN()) {
                return Ratio.NaN;
            } // if

            if (b.IsNaN()) {
                return Ratio.NaN;
            } // if

            return new Ratio(a.Num * b.Den, b.Num * a.Den);
        } // /

        public static bool operator !=(Ratio a, Ratio b) {
            if (a.IsNaN()) {
                return false;
            } // if

            if (b.IsNaN()) {
                return false;
            } // if

            return a.Num != b.Num || a.Den != b.Den;
        } // ==

        public static bool operator ==(Ratio a, Ratio b) {
            if (a.IsNaN()) {
                return false;
            } // if

            if (b.IsNaN()) {
                return false;
            } // if

            return a.Num == b.Num && a.Den == b.Den;
        } // ==

        public static bool operator !=(Ratio a, int b) {
            if (a.IsNaN()) {
                return false;
            } // if

            return a.Num != b || a.Den != 1;
        } // !=

        public static bool operator ==(Ratio a, int b) {
            if (a.IsNaN()) {
                return false;
            } // if

            return a.Num == b && a.Den == 1;
        } // ==

        public static implicit operator int(Ratio a) {
            return a.Den == 0 ? 0 : a.Num / a.Den;
        } // int

        public int Den { get { return this.den; } }

        public override bool Equals(Object o) {
            if (!(o is Ratio)) return false;
            Ratio that = (Ratio) o;
            return this == that;
        } // Equals

        public static int Gcd(int m, int n) {
            while (n != 0) {
                int temp = m;
                m = n;
                n = temp % n;
            } // whiel
            return m;
        } // Gcd

        public override int GetHashCode() {
            return this.Num.GetHashCode() ^ this.Den.GetHashCode();
        } // GetHashCode

        public bool IsNaN() {
            return this.den == 0;
        } // IsNan

        public int Num { get { return this.num; } }

        public override String ToString() {
            switch (this.Den) {
            case 0:
                return "NaN";

            case 1:
                return this.Num.ToString();

            default:
                return String.Format("{0}/{1}", this.Num, this.Den);
            } // swtich
        } // ToString
    } // Ratio

    private static Immediate[] digitv = new Immediate[] {
        new Immediate(1),
        new Immediate(2),
        new Immediate(3),
        new Immediate(4),
        new Immediate(5),
        new Immediate(6),
        new Immediate(7),
        new Immediate(8),
        new Immediate(9),
    }; // setv

    private static Operator[] operatorv = new Operator[] {
        new OpAdd(),
        new OpMul(),
        new OpSub(),
        new OpDiv(),    // Try div last
    }; // Operator

    private static IList<Node> checkIt(Immediate[] dv) {
        IList<Node> results = new List<Node>();

        foreach (var opv in new PermutationSet<Operator>(operatorv, 3)) {
            var expr = new BinNode(
                opv[0],
                new BinNode(
                    opv[1],
                    dv[0],
                    new BinNode(opv[2], dv[1], dv[2])),
                dv[3]);

            if (expr.Value == 10) {
                results.Add(expr);
            } // if
        } // for opv

        return results;
    } // checkIt

    private static String computeKey(Immediate[] dv) {
        String[] sv = new String[] {
            dv[0].ToString(),
            dv[1].ToString(),
            dv[2].ToString(),
            dv[3].ToString()
        }; // sv

        Array.Sort(sv);

        return String.Format("{0} {1} {2} {3}",
            sv[0],
            sv[1],
            sv[2],
            sv[3]);
    } // computeKey

    public static void Main(String[] paramv) {
        Array.Sort(operatorv);

        if (paramv.Length == 0) {
            int succeeded = 0;
            int total = 0;

            var resultMap = new Dictionary<String, HashSet<Node>>();

            foreach (var dv in new PermutationSet<Immediate>(digitv, 4)) {
                total++;
                var key = computeKey(dv);

                if (!resultMap.ContainsKey(key)) {
                    var exprs = new HashSet<Node>();
                    resultMap.Add(key, exprs);
                } // if

                var results = checkIt(dv);

                foreach (var result in results) {
                    resultMap[key].Add(result);
                } // for

                succeeded += results.Count;
            } // for digits

            System.Console.WriteLine("Nth\tDigits\tExprs");

            var nth = 0;
            foreach (var entry in resultMap) {
                nth++;
                System.Console.Write("{0}\t{1}\t{2}",
                    nth,
                    entry.Key,
                    entry.Value.Count);

                foreach (var expr in entry.Value) {
                    System.Console.Write("\t{0}", expr);
                } // for expr

                System.Console.WriteLine();
            } // for

            System.Console.WriteLine("{0}/{1}", succeeded, total);
            return;
        } // if

        foreach (var param in paramv) {
            if (Regex.IsMatch(param, @"^[1-9]{4}$")) {
                Immediate[] samplev = new Immediate[] {
                    digitv[param[0] - '1'],
                    digitv[param[1] - '1'],
                    digitv[param[2] - '1'],
                    digitv[param[3] - '1'],
                }; // samplev

                Array.Sort(samplev);

                foreach (var dv in new Perm<Immediate>(samplev)) {
                    var key = String.Format("{0} {1} {2} {3}",
                        dv[0], dv[1], dv[2], dv[3]);

                    var exprs = checkIt(dv);

                    System.Console.WriteLine("{0}\t{1} {2} {3} {4}\t{5}",
                        exprs.Count == 0 ? "NOT" : "TEN",
                        dv[0], dv[1], dv[2], dv[3],
                        exprs.Count == 0 ? "" : exprs[0].ToString());
                } // for dv

            } else {
                System.Console.WriteLine("Not 4 digits: {0}", param);
            } // if
        } // param
    } // Main
} // TenPuzzle
