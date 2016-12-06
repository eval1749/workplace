/*
C(a) = a
C(ab) = a, b, ab : 3
C(abc) = a, b, c, ab, ac, bc, abc
C(abcd) = a, b, c, d, ab, ac, ad, bc, bd, cd, abc, abd, bcd, abcd

C(a) = { a }
C(ab) = { C(a), b, C(a)*b }
C(abc) = { C(ab), c, C(ab)*c }
C(abcd) = { C(abc), d, C(abc)*d }

C(a)*b = { ab }
C(ab)*c = { a, b, ab }*c = { ac, bc, abc }
*/

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void printAux(const char* const str, const char* const suffix) {
    int len = strlen(str);

    if (len == 1) {
        printf("%s%s\n", str, suffix);
        return;
    } // if

    char* head = new char[len];
    memcpy(head, str, len - 1);
    head[len - 1] = 0;

    printAux(head, suffix);

    printf("%c%s\n", str[len - 1], suffix);

    int slen = strlen(suffix);
    char* suffix2 = new char[slen + 2];
    memcpy(suffix2, suffix, slen);
    suffix2[slen] = str[len - 1];
    suffix2[slen + 1] = 0;

    printAux(head, suffix2);

    delete[] suffix2;
    delete[] head;
} // printAux

void printCombination(const char* const str) {
    printAux(str, "");
} // printCombination

int main(int argc, char** argv) {
    printCombination(argc >= 2 ? argv[1] : "abcd");
    return EXIT_SUCCESS;
} // main
