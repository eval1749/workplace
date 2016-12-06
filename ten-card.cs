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

    private class Immediate : Node {
        private int value;

        public Immediate(int value) {
            this.value = value;
        } // value

        public override void Unparse(
            StringBuilder buf,
            Operator outerOp) {
            buf.Append(this.Value.ToString());
        } // Unparse

        public override Ratio Value {
            get { return new Ratio(this.value); }
        } // Value

        public override String ToString() {
            return this.Value.ToString();
        } // ToString
    } // Immediate

    private class Operator : Node {
        private Precedence pred;
        private char op;

        protected Operator(Precedence pred, char op) {
            this.op = op;
            this.pred = pred;
        } // Operator

        public virtual Ratio Eval(Node a, Node b) {
            throw new Exception(String.Format("Missing {0}.Eval", this));
        } // Eval

        public Precedence Precedence {
            get { return this.pred; }
        } // Precedence

        public Char ToChar() {
            return this.op;
        } // ToChar

        public override void Unparse(
            StringBuilder buf,
            Operator outerOp) {
            throw new Exception("Not SUpported");
        } // Unparse

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

    private class Combi<T> : Perm<T> {

        public Combi(T[] alphabetv, int numElts)
            : base(alphabetv, numElts) {
            this.MoveNext();
        } // Combi

        private bool NoDuplicate() {
            var bv = new bool[base.numElts];

            for (int i = 0; i < base.numElts; i++) {
                int k = base.indexv[i];

                if (bv[k]) {
                    return false;
                } // if

                bv[k] = true;
            } // for i

            return true;
        } // NoDuplicate

        public override bool MoveNext() {
            for (;;) {
                if (!base.MoveNext()) {
                    return false;
                } // if

                if (this.NoDuplicate()) {
                    return true;
                } // if
            } // for
        } // MoveNext
    } // Combi

    private class Perm<T> : IEnumerator<T[]> {
        private T[] alphabetv;
        private T[] current;
        protected int numElts;
        protected int[] indexv;

        public Perm(T[] alphabetv, int numElts) {
            this.numElts = numElts;
            this.alphabetv = alphabetv;
            this.indexv = new int[numElts];
            this.current = this.compute();
        } // Perm

        private T[] compute() {
            var vv = new T[this.numElts];

            for (int i = 0; i < this.numElts; i++) {
                int k = this.indexv[i];
                vv[i] = this.alphabetv[k];
            } // for i

            return vv;
        } // compute

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

        public virtual bool MoveNext() {
            for (int i = 0; i < this.numElts; i++) {
                this.indexv[i]++;

                if (this.indexv[i] < this.alphabetv.Length) {
                    this.current = this.compute();
                    return true;
                } // if

                this.indexv[i] = 0;
            } // for
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
    }; // digitv

    private static Operator[] operatorv = new Operator[] {
        new OpAdd(),
        new OpMul(),
        new OpSub(),
        new OpDiv(),    // Try div last
    }; // Operator

    private static Node checkIt(Immediate[] dv) {
        var perm = new Perm<Operator>(operatorv, 3);

        foreach (var opv in perm) {
            var expr = new BinNode(
                opv[0],
                new BinNode(
                    opv[1],
                    dv[0],
                    new BinNode(opv[2], dv[1], dv[2])),
                dv[3]);

            if (expr.Value == 10) {
                return expr;
            } // if
        } // for opv

        return null;
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
        if (paramv.Length == 0) {
            int succeeded = 0;
            int total = 0;

            var perm = new Perm<Immediate>(digitv, 4);
            var resultMap = new Dictionary<String, List<Node>>();

            foreach (var dv in perm) {
                total++;
                var expr = checkIt(dv);
                var key = computeKey(dv);

                if (!resultMap.ContainsKey(key)) {
                    var exprs = new List<Node>();
                    resultMap.Add(key, exprs);
                } // if

                if (expr != null) {
                    resultMap[key].Add(expr);
                    succeeded++;
                } // if
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

                var combi = new Combi<Immediate>(samplev, 4);
                var seenSet = new HashSet<String>();

                foreach (var dv in combi) {
                    var key = String.Format("{0} {1} {2} {3}",
                        dv[0], dv[1], dv[2], dv[3]);

                    if (seenSet.Contains(key)) {
                        continue;
                    } // if

                    seenSet.Add(key);

                    var expr = checkIt(dv);

                    System.Console.WriteLine("{0}\t{1} {2} {3} {4}\t{5}",
                        expr == null ? "NOT" : "TEN",
                        dv[0], dv[1], dv[2], dv[3],
                        expr);
                } // for dv

            } else {
                System.Console.WriteLine("Not 4 digitv: {0}", param);
            } // if
        } // param
    } // Main
} // TenPuzzle
