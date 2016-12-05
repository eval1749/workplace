@if "%_echo%"=="" echo off
setlocal

set TMP=d:\tmp
set TEMP=d:\tmp

python checker.py --out_dir %TMP% ^ --externs ^
    externs/editing_context_externs.js ^
    externs/editing_externs.js ^
    externs/editor_externs.js ^
    externs/es6_externs.js ^
    externs/html5_externs.js ^
    externs/operations_externs.js ^
    externs/read_only_selection_externs.js ^
    -- %*

endlocal
